// Publica productos de autopartschile en Mercado Libre Chile (MLC).
// POST { product_ids: number[], listing_type_id: string, markup_pct?: number, cover_fee?: boolean, dry_run?: boolean }
// Solo admin. dry_run usa /items/validate (no publica nada).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const SITE = "https://autopartschile.cl";
const API = "https://api.mercadolibre.com";
const LISTING_TYPES = ["free", "gold_special", "gold_pro"];
const CORS = {
  "Access-Control-Allow-Origin": "https://autopartschile.cl",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function token(): Promise<string> {
  const { data: a } = await admin.from("meli_account").select("*").eq("id", 1).maybeSingle();
  if (!a?.refresh_token) throw new Error("Mercado Libre no está conectado");
  if (a.access_token && new Date(a.expires_at).getTime() - Date.now() > 5 * 60_000) return a.access_token;
  const r = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: a.refresh_token }),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error("No se pudo renovar el acceso a Mercado Libre: " + (t.message || r.status));
  await admin.from("meli_account").update({
    access_token: t.access_token, refresh_token: t.refresh_token ?? a.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return t.access_token;
}

async function ml(tk: string, method: string, path: string, body?: unknown) {
  const r = await fetch(API + path, {
    method, headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data: any = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

function realImages(arr: unknown): string[] {
  return (Array.isArray(arr) ? arr : [])
    .filter((u) => typeof u === "string" && u && !/favicon|placeholder|logo/i.test(u))
    .map((u: string) => (/^https?:\/\//.test(u) ? u : SITE + (u.startsWith("/") ? "" : "/") + u));
}

function compat(p: any) {
  // Fuente principal: la ficha del vehículo del despiece (datos ordenados). Respaldo: vehicle_compatibility del producto.
  const v = p._veh;
  if (v?.marca && v?.modelo) {
    const yrs = v.anio_desde ? (v.anio_hasta && v.anio_hasta !== v.anio_desde ? `${v.anio_desde}-${v.anio_hasta}` : String(v.anio_desde)) : "";
    return { make: v.marca, model: v.modelo, years: yrs, engine: v.motor || "" };
  }
  const vc = p.vehicle_compatibility && typeof p.vehicle_compatibility === "object" && !Array.isArray(p.vehicle_compatibility) ? p.vehicle_compatibility : {};
  return { make: vc.make || p.brand || "", model: vc.model || "", years: vc.years || "", engine: vc.engine || "" };
}

function title(p: any) {
  // Formato que mejor posiciona en autopartes: Pieza (+ lado) + Marca Modelo Motor Años (+ Original), máx. 60
  const c = compat(p);
  const eng = (String(c.engine).match(/\d\.\d/) || [""])[0];
  let piece = String(p.name);
  if (c.make) { const i = piece.toLowerCase().indexOf(c.make.toLowerCase()); if (i > 0) piece = piece.slice(0, i); }
  piece = piece.replace(/\s*\/\s*\S+/g, "").replace(/lado derecho/i, "Derecho").replace(/lado izquierdo/i, "Izquierdo").replace(/\([^)]*\)/g, "").replace(/[,;]/g, "").replace(/\s+/g, " ").trim();
  let suffix = [c.make, c.model, eng, c.years].filter(Boolean).join(" ");
  if (!c.model) suffix = "";
  if (suffix.length > 40) suffix = [c.make, c.model, c.years].filter(Boolean).join(" ");
  const budget = 60 - (suffix ? suffix.length + 1 : 0);
  if (piece.length > budget) piece = piece.slice(0, budget).replace(/\s+\S*$/, "");
  let t = (piece + " " + suffix).replace(/\s+/g, " ").trim();
  if (!/original/i.test(t) && t.length + 9 <= 60) t += " Original";
  return t;
}

async function attachVehicles(ps: any[]) {
  const ids = [...new Set(ps.map((p) => p.vehiculo_id).filter(Boolean))];
  if (!ids.length) return;
  const { data } = await admin.from("vehiculos").select("id, marca, modelo, motor, anio_desde, anio_hasta").in("id", ids);
  const byId = new Map((data ?? []).map((v: any) => [v.id, v]));
  for (const p of ps) if (p.vehiculo_id) p._veh = byId.get(p.vehiculo_id);
}

async function addCompat(tk: string, itemId: string | null, p: any) {
  const c = compat(p);
  if (!c.make || !c.model) return { ok: false, error: "sin marca/modelo" };
  const D = "MLC-CARS_AND_VANS_FOR_COMPATIBILITIES";
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const b = await ml(tk, "POST", `/catalog_domains/${D}/attributes/BRAND/top_values`, {});
  const brand = (Array.isArray(b.data) ? b.data : []).find((x: any) => norm(x.name) === norm(c.make));
  if (!brand) return { ok: false, error: "marca no encontrada en catálogo ML" };
  const m = await ml(tk, "POST", `/catalog_domains/${D}/attributes/CAR_AND_VAN_MODEL/top_values`, { known_attributes: [{ id: "BRAND", value_id: brand.id }] });
  const models = Array.isArray(m.data) ? m.data : [];
  const model = models.find((x: any) => norm(x.name) === norm(c.model)) || models.find((x: any) => norm(x.name).startsWith(norm(c.model)));
  if (!model) return { ok: false, error: "modelo no encontrado en catálogo ML" };
  const yrs = String(c.years).match(/\d{4}/g) || [];
  const from = Number(yrs[0]), to = Number(yrs[1] || yrs[0]);
  const years: number[] = [];
  if (from) for (let y = from; y <= to && years.length < 10; y++) years.push(y);
  const families = (years.length ? years : [0]).map((y) => ({
    domain_id: D, creation_source: "DEFAULT",
    attributes: [{ id: "BRAND", value_id: brand.id }, { id: "CAR_AND_VAN_MODEL", value_id: model.id }, ...(y ? [{ id: "YEAR", value_name: String(y) }] : [])],
  }));
  if (!itemId) {
    const cnt = await ml(tk, "POST", "/catalog_compatibilities/products_search/count_family_products", { domain_id: D, attributes: families[0].attributes });
    return { ok: true, check_only: true, brand: brand.name, model: model.name, years, vehicles_first_year: cnt.data };
  }
  const r = await ml(tk, "POST", `/items/${itemId}/compatibilities`, { products_families: families });
  return r.ok ? { ok: true, count: r.data?.created_compatibilities_count ?? null, model: model.name } : { ok: false, error: mlError(r.data) };
}

function description(p: any) {
  const c = compat(p);
  return [
    `${p.name}`,
    "",
    "Repuesto original usado, retirado de vehículo en desarme y revisado.",
    c.model ? `Vehículo de origen: ${[c.make, c.model, c.engine, c.years].filter(Boolean).join(" ")}.` : "",
    p.oem_number ? `Número OEM: ${p.oem_number}.` : "",
    "",
    "Antes de comprar, confirma la compatibilidad con tu patente o número de pieza por la sección de preguntas.",
    "Repuesto usado, se vende sin garantía. Despacho a todo Chile.",
  ].filter((x) => x !== null).join("\n").replace(/\n{3,}/g, "\n\n");
}

async function buildAttributes(tk: string, categoryId: string, p: any) {
  const c = compat(p);
  const r = await ml(tk, "GET", `/categories/${categoryId}/attributes`);
  const attrs: any[] = Array.isArray(r.data) ? r.data : [];
  const out: any[] = [];
  const known: Record<string, string | null> = {
    BRAND: c.make || null, MODEL: c.model || null, PART_NUMBER: p.oem_number || null,
    OEM: p.oem_number || null, ORIGINAL_OEM_NUMBER: p.oem_number || null, ITEM_CONDITION: null, SELLER_SKU: p.sku,
  };
  for (const a of attrs) {
    const required = a.tags?.required || a.tags?.catalog_required || a.tags?.conditional_required;
    const val = known[a.id];
    if (a.id === "ITEM_CONDITION") continue; // se informa con "condition"
    if (val) out.push({ id: a.id, value_name: String(val) });
    else if (required) out.push({ id: a.id, value_id: "-1", value_name: null }); // "No aplica"
  }
  if (!out.find((x) => x.id === "SELLER_SKU")) out.push({ id: "SELLER_SKU", value_name: p.sku });
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);

  const userClient = createClient(SB_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false } });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return json({ error: "no autenticado" }, 401);
  const { data: isAdm } = await userClient.rpc("is_admin");
  if (!isAdm) return json({ error: "no autorizado" }, 403);

  const body = await req.json().catch(() => ({}));
  const ids: number[] = (Array.isArray(body.product_ids) ? body.product_ids : []).map(Number).filter(Boolean).slice(0, 50);
  const listing = String(body.listing_type_id || "");
  const markup = Math.max(0, Math.min(100, Number(body.markup_pct) || 0));
  const dry = body.dry_run !== false;
  const cover = body.cover_fee === true;
  if (!ids.length) return json({ error: "Sin productos" }, 400);
  if (body.action === "compat") {
    let tk0: string;
    try { tk0 = await token(); } catch (e) { return json({ error: (e as Error).message }, 400); }
    const { data: ps } = await admin.from("products").select("id, sku, name, brand, vehicle_compatibility, meli_item_id, vehiculo_id").in("id", ids);
    await attachVehicles(ps ?? []);
    const out: any[] = [];
    for (const p of ps ?? []) out.push({ id: p.id, name: p.name, title: title(p), ...(p.meli_item_id ? await addCompat(tk0, p.meli_item_id, p) : await addCompat(tk0, null, p)) });
    return json({ results: out });
  }
  if (!LISTING_TYPES.includes(listing)) return json({ error: "Elige el tipo de publicación" }, 400);

  let tk: string;
  try { tk = await token(); } catch (e) { return json({ error: (e as Error).message }, 400); }

  const { data: prods, error } = await admin.from("products")
    .select("id, sku, name, description, brand, price_sale, stock, images, oem_number, vehicle_compatibility, is_active, part_status, meli_item_id, deleted_at, vehiculo_id")
    .in("id", ids);
  if (error) return json({ error: error.message }, 500);
  await attachVehicles(prods ?? []);

  const results: any[] = [];
  for (const p of prods ?? []) {
    const res: any = { id: p.id, sku: p.sku, name: p.name };
    try {
      if (p.deleted_at || !p.is_active) throw new Error("No está publicada en la web");
      if (p.meli_item_id) throw new Error("Ya está en Mercado Libre: " + p.meli_item_id);
      if (!(Number(p.price_sale) > 0)) throw new Error("Sin precio");
      if (p.part_status === "vendida" || p.part_status === "no_disponible") throw new Error("Marcada como " + p.part_status);
      const pics = realImages(p.images);
      if (!pics.length) throw new Error("Sin foto real (Mercado Libre la exige)");

      const t = title(p);
      const disc = await ml(tk, "GET", `/sites/MLC/domain_discovery/search?limit=1&q=${encodeURIComponent(t)}`);
      const cat = Array.isArray(disc.data) && disc.data[0];
      if (!cat?.category_id) throw new Error("Mercado Libre no sugirió categoría para este título");
      res.category = `${cat.category_id} · ${cat.category_name ?? ""}`;

      const web = Number(p.price_sale);
      let price = Math.round((web * (1 + markup / 100)) / 10) * 10;
      if (cover) {
        // Precio para que, después de la comisión real de Mercado Libre (según su propia tabla), te quede al menos el precio web.
        for (let i = 0; i < 3; i++) {
          const f = await fee(tk, price, cat.category_id, listing);
          if (!f) break;
          const target = Math.ceil((web + f.fixed) / (1 - f.pct / 100));
          price = Math.ceil((target + 10) / 1000) * 1000 - 10;
          const f2 = await fee(tk, price, cat.category_id, listing);
          if (!f2 || price - f2.amount >= web) break;
        }
      }
      const f = await fee(tk, price, cat.category_id, listing);
      if (f) { res.fee = f.amount; res.fee_pct = f.pct; res.net = price - f.amount; }
      const item = {
        title: t, family_name: t, category_id: cat.category_id, price, currency_id: "CLP",
        available_quantity: Math.max(1, Number(p.stock) || 1), buying_mode: "buy_it_now", condition: "used",
        listing_type_id: listing, pictures: pics.slice(0, 10).map((source) => ({ source })),
        attributes: await buildAttributes(tk, cat.category_id, p),
      };
      res.title = t; res.price = price;

      // Cuentas con "user products": Mercado Libre arma el título desde family_name y rechaza "title".
      const pre = await ml(tk, "POST", "/items/validate", item);
      if (!pre.ok && JSON.stringify(pre.data ?? "").includes("title")) delete (item as any).title;
      if (dry) {
        const v = await ml(tk, "POST", "/items/validate", item);
        if (!v.ok) throw new Error(mlError(v.data));
        res.ok = true; res.validated = true;
      } else {
        const c = await ml(tk, "POST", "/items", item);
        if (!c.ok) throw new Error(mlError(c.data));
        res.ok = true; res.meli_item_id = c.data.id; res.permalink = c.data.permalink;
        await ml(tk, "POST", `/items/${c.data.id}/description`, { plain_text: description(p) });
        res.compat = await addCompat(tk, c.data.id, p);
        await admin.from("products").update({ meli_item_id: c.data.id, meli_status: c.data.status, meli_synced_at: new Date().toISOString() }).eq("id", p.id);
      }
    } catch (e) { res.ok = false; res.error = (e as Error).message; }
    results.push(res);
  }
  return json({ dry_run: dry, results });
});

async function fee(tk: string, price: number, categoryId: string, listing: string) {
  const r = await ml(tk, "GET", `/sites/MLC/listing_prices?price=${price}&category_id=${categoryId}&listing_type_id=${listing}`);
  const x = Array.isArray(r.data) ? r.data[0] : r.data;
  if (!x || x.sale_fee_amount == null) return null;
  return { amount: Number(x.sale_fee_amount) || 0, pct: Number(x.sale_fee_details?.percentage_fee) || 0, fixed: Number(x.sale_fee_details?.fixed_fee) || 0 };
}

function mlError(d: any): string {
  if (!d) return "Error de Mercado Libre";
  const causes = Array.isArray(d.cause) ? d.cause.map((c: any) => c.message || c.code).filter(Boolean) : [];
  const msg = [d.message, ...causes].filter(Boolean).join(" · ");
  return (msg + " " + JSON.stringify(d.cause ?? d)).slice(0, 900);
}
