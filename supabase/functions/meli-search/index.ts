// Búsqueda de mercado (solo lectura) en Mercado Libre Chile para comparar competencia. Solo admin.
// Nota: Mercado Libre responde 403 a /sites/MLC/search para apps sin permiso de búsqueda.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "https://autopartschile.cl", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const uc = createClient(SB_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false } });
  const { data: u } = await uc.auth.getUser();
  if (!u?.user) return json({ error: "no autenticado" }, 401);
  const { data: isAdm } = await uc.rpc("is_admin");
  if (!isAdm) return json({ error: "no autorizado" }, 403);
  const { data: a } = await admin.from("meli_account").select("access_token").eq("id", 1).maybeSingle();
  const body = await req.json().catch(() => ({}));
  const qs: string[] = (Array.isArray(body.q) ? body.q : []).slice(0, 10);
  const out: unknown[] = [];
  for (const q of qs) {
    const r = await fetch(`https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(q)}&limit=50`, { headers: { Authorization: `Bearer ${a?.access_token}` } });
    const d = await r.json().catch(() => ({}));
    const res = (d.results ?? []) as any[];
    const used = res.filter((x) => x.condition === "used");
    const prices = used.map((x) => x.price).sort((x: number, y: number) => x - y);
    out.push({ q, status: r.status, total: d.paging?.total ?? null, used_in_page: used.length,
      price_min: prices[0] ?? null, price_median: prices.length ? prices[Math.floor(prices.length / 2)] : null, price_max: prices.at(-1) ?? null,
      free_shipping_pct: res.length ? Math.round(100 * res.filter((x) => x.shipping?.free_shipping).length / res.length) : null,
      top: res.slice(0, 5).map((x) => ({ title: x.title, price: x.price, cond: x.condition, free_ship: x.shipping?.free_shipping, listing: x.listing_type_id, seller: x.seller?.nickname, official: !!x.official_store_id })) });
  }
  return json({ results: out });
});
