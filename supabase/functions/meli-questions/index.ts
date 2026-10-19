// Preguntas de Mercado Libre.
// POST {action:"sync"}                      -> trae preguntas recientes a la tabla meli_questions (lo llama el cron cada 5 min).
// POST {action:"answer", id, text}  (admin) -> responde la pregunta en Mercado Libre.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
const API = "https://api.mercadolibre.com";
const CORS = { "Access-Control-Allow-Origin": "https://autopartschile.cl", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function token(): Promise<{ tk: string; uid: number } | null> {
  const { data: a } = await admin.from("meli_account").select("*").eq("id", 1).maybeSingle();
  if (!a?.refresh_token) return null;
  if (a.access_token && new Date(a.expires_at).getTime() - Date.now() > 5 * 60_000) return { tk: a.access_token, uid: a.user_id };
  const r = await fetch(`${API}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: a.refresh_token }) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) return null;
  await admin.from("meli_account").update({ access_token: t.access_token, refresh_token: t.refresh_token ?? a.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("id", 1);
  return { tk: t.access_token, uid: a.user_id };
}

async function notify(text: string) {
  if (!TG_TOKEN || !TG_CHAT) { console.log("Telegram no configurado:", text); return; }
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text }) }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  const body = await req.json().catch(() => ({}));
  const auth = await token();
  if (!auth) return json({ error: "Mercado Libre no está conectado" }, 400);

  if (body.action === "answer") {
    const uc = createClient(SB_URL, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false } });
    const { data: u } = await uc.auth.getUser();
    const { data: isAdm } = u?.user ? await uc.rpc("is_admin") : { data: false };
    if (!isAdm) return json({ error: "no autorizado" }, 403);
    const id = Number(body.id), text = String(body.text ?? "").trim();
    if (!id || text.length < 2 || text.length > 2000) return json({ error: "Respuesta inválida" }, 400);
    const r = await fetch(`${API}/answers`, { method: "POST", headers: { Authorization: `Bearer ${auth.tk}`, "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: id, text }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: d.message || ("Error " + r.status) }, 400);
    await admin.from("meli_questions").update({ status: "ANSWERED", answer: text, answered_at: new Date().toISOString() }).eq("id", id);
    return json({ ok: true });
  }

  // sync
  const r = await fetch(`${API}/questions/search?seller_id=${auth.uid}&api_version=4&limit=50&sort_fields=date_created&sort_types=DESC`,
    { headers: { Authorization: `Bearer ${auth.tk}` } });
  const d = await r.json().catch(() => ({}));
  const qs: any[] = d.questions ?? [];
  if (!qs.length) return json({ ok: true, synced: 0 });
  const { data: existing } = await admin.from("meli_questions").select("id").in("id", qs.map((q) => q.id));
  const known = new Set((existing ?? []).map((x: any) => x.id));
  const itemIds = [...new Set(qs.map((q) => q.item_id))];
  const { data: prods } = await admin.from("products").select("id, name, meli_item_id").in("meli_item_id", itemIds);
  const byItem = new Map((prods ?? []).map((p: any) => [p.meli_item_id, p]));
  const rows = qs.map((q) => ({
    id: q.id, item_id: q.item_id, product_id: byItem.get(q.item_id)?.id ?? null, text: q.text, status: q.status, from_id: q.from?.id ?? null,
    answer: q.answer?.text ?? null, answered_at: q.answer?.date_created ?? null, date_created: q.date_created, synced_at: new Date().toISOString(),
  }));
  await admin.from("meli_questions").upsert(rows);
  for (const q of qs.filter((q) => !known.has(q.id) && q.status === "UNANSWERED")) {
    const p = byItem.get(q.item_id);
    await notify(`❓ Pregunta nueva en Mercado Libre${p ? " — " + p.name : ""}:\n"${q.text}"\nResponde en autopartschile.cl/admin/mercadolibre.html`);
  }
  return json({ ok: true, synced: rows.length });
});
