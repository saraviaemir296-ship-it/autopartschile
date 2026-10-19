// Conexión OAuth con Mercado Libre (Chile).
// POST (con sesión de admin)  -> { url } para autorizar en Mercado Libre.
// GET  ?code=&state=          -> retorno de Mercado Libre: canjea el code y guarda los tokens.
// Secrets requeridos (Supabase > Edge Functions > Secrets): MELI_CLIENT_ID, MELI_CLIENT_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const REDIRECT = `${SB_URL}/functions/v1/meli-oauth`;
const ADMIN_PAGE = "https://autopartschile.cl/admin/mercadolibre.html";
const CORS = {
  "Access-Control-Allow-Origin": "https://autopartschile.cl",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const back = (q: string) => Response.redirect(`${ADMIN_PAGE}?${q}`, 302);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return req.method === "GET" ? back("error=faltan_credenciales") : json({ error: "Faltan MELI_CLIENT_ID / MELI_CLIENT_SECRET en Supabase Secrets" }, 500);
  }

  if (req.method === "POST") {
    // Solo administradores pueden iniciar la conexión.
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SB_URL, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "no autenticado" }, 401);
    const { data: isAdm } = await userClient.rpc("is_admin");
    if (!isAdm) return json({ error: "no autorizado" }, 403);
    const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    await admin.from("meli_oauth_state").delete().lt("created_at", new Date(Date.now() - 3600_000).toISOString());
    const { error } = await admin.from("meli_oauth_state").insert({ state, created_by: u.user.id });
    if (error) return json({ error: error.message }, 500);
    const url = `https://auth.mercadolibre.cl/authorization?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT)}&state=${state}`;
    return json({ url });
  }

  if (req.method === "GET") {
    const p = new URL(req.url).searchParams;
    const code = p.get("code"), state = p.get("state");
    if (p.get("error")) return back("error=" + encodeURIComponent(p.get("error")!));
    if (!code || !state) return back("error=respuesta_invalida");
    // El state es de un solo uso y vence en 15 minutos.
    const { data: st } = await admin.from("meli_oauth_state").delete().eq("state", state).select("created_at").maybeSingle();
    if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60_000) return back("error=state_invalido");

    const r = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "authorization_code", client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: REDIRECT }),
    });
    const t = await r.json().catch(() => ({}));
    if (!r.ok || !t.access_token) { console.error("meli token", r.status, t?.error, t?.message); return back("error=canje_fallido"); }

    let nickname: string | null = null;
    const me = await fetch("https://api.mercadolibre.com/users/me", { headers: { Authorization: `Bearer ${t.access_token}` } });
    if (me.ok) nickname = (await me.json()).nickname ?? null;

    const { error } = await admin.from("meli_account").upsert({
      id: 1, user_id: t.user_id, nickname, access_token: t.access_token, refresh_token: t.refresh_token,
      expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(),
      scope: t.scope ?? null, updated_at: new Date().toISOString(),
    });
    if (error) { console.error("meli save", error.message); return back("error=guardado"); }
    return back("ok=1");
  }
  return json({ error: "método no permitido" }, 405);
});
