// Diagnóstico de solo lectura de la cuenta de Mercado Libre (no modifica nada). Solo admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const API = "https://api.mercadolibre.com";
const CORS = { "Access-Control-Allow-Origin": "https://autopartschile.cl", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function token(): Promise<{ tk: string; uid: number }> {
  const { data: a } = await admin.from("meli_account").select("*").eq("id", 1).maybeSingle();
  if (!a?.refresh_token) throw new Error("Mercado Libre no está conectado");
  if (a.access_token && new Date(a.expires_at).getTime() - Date.now() > 5 * 60_000) return { tk: a.access_token, uid: a.user_id };
  const r = await fetch(`${API}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: a.refresh_token }) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error("No se pudo renovar el acceso");
  await admin.from("meli_account").update({ access_token: t.access_token, refresh_token: t.refresh_token ?? a.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", 1);
  return { tk: t.access_token, uid: a.user_id };
}
async function get(tk: string, path: string) {
  const r = await fetch(API + path, { headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" } });
  return r.ok ? r.json() : { _error: r.status, ...(await r.json().catch(() => ({}))) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const uc = createClient(SB_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false } });
  const { data: u } = await uc.auth.getUser();
  if (!u?.user) return json({ error: "no autenticado" }, 401);
  const { data: isAdm } = await uc.rpc("is_admin");
  if (!isAdm) return json({ error: "no autorizado" }, 403);
  let tk: string, uid: number;
  try { ({ tk, uid } = await token()); } catch (e) { return json({ error: (e as Error).message }, 400); }

  const me = await get(tk, "/users/me");
  const user = {
    id: me.id, nickname: me.nickname, user_type: me.user_type, registration_date: me.registration_date, points: me.points,
    seller_reputation: me.seller_reputation, status: me.status, tags: me.tags, address: me.address ? { city: me.address.city, state: me.address.state } : null,
    company: me.company ? { brand_name: me.company.brand_name, corporate_name: !!me.company.corporate_name } : null,
    permalink: me.permalink, thumbnail: !!me.thumbnail?.picture_url, site_status: me.site_status,
  };
  const ids: string[] = [];
  for (const status of ["active", "paused", "closed", "under_review", "inactive"]) {
    const s = await get(tk, `/users/${uid}/items/search?status=${status}&limit=100`);
    if (Array.isArray(s.results)) ids.push(...s.results);
  }
  const items: any[] = [];
  for (let i = 0; i < ids.length && i < 200; i += 20) {
    const batch = await get(tk, `/items?ids=${ids.slice(i, i + 20).join(",")}&attributes=id,title,price,status,sub_status,listing_type_id,condition,category_id,sold_quantity,available_quantity,pictures,attributes,health,tags,shipping,date_created,permalink,catalog_listing,variations,warranty,video_id`);
    for (const b of Array.isArray(batch) ? batch : []) {
      const it = b.body ?? {};
      const filled = (it.attributes ?? []).filter((a: any) => a.value_name && a.value_id !== "-1").length;
      items.push({
        id: it.id, title: it.title, title_len: (it.title ?? "").length, price: it.price, status: it.status, sub_status: it.sub_status,
        listing_type: it.listing_type_id, condition: it.condition, category_id: it.category_id, sold: it.sold_quantity, stock: it.available_quantity,
        pictures: (it.pictures ?? []).length, attrs_filled: filled, attrs_total: (it.attributes ?? []).length, health: it.health,
        free_shipping: it.shipping?.free_shipping, shipping_mode: it.shipping?.mode, logistic: it.shipping?.logistic_type,
        warranty: it.warranty, video: !!it.video_id, created: it.date_created, tags: it.tags, permalink: it.permalink,
      });
    }
  }
  // Visitas últimos 30 días
  if (ids.length) {
    for (let i = 0; i < ids.length && i < 200; i += 50) {
      const v = await get(tk, `/visits/items?ids=${ids.slice(i, i + 50).join(",")}&date_from=${new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)}&date_to=${new Date().toISOString().slice(0, 10)}`);
      if (v && typeof v === "object") for (const it of items) if (v[it.id] != null) it.visits_30d = v[it.id];
    }
  }
  const q = await get(tk, `/questions/search?seller_id=${uid}&api_version=4&limit=50&sort_fields=date_created&sort_types=DESC`);
  const questions = { total: q.total ?? null, unanswered: (q.questions ?? []).filter((x: any) => x.status === "UNANSWERED").length,
    sample: (q.questions ?? []).slice(0, 10).map((x: any) => ({ status: x.status, text: x.text, answered: !!x.answer, item: x.item_id, date: x.date_created })) };
  const orders = await get(tk, `/orders/search?seller=${uid}&limit=1`);
  return json({ user, counts: { items: ids.length }, items, questions, orders_total: orders?.paging?.total ?? null });
});
