// CONECTAR WHATSAPP BUSINESS CON LA APP PROPIA DE META (gratis, sin proveedor). Coexistencia: el número sigue en la app del teléfono.
// La llama /admin/whatsapp.html (solo admin) después del registro integrado (Embedded Signup, featureType whatsapp_business_app_onboarding).
// Pasos: 1) canjea el code por el token de negocio; 2) guarda token, WABA y phone_number_id en private_config (solo service role);
// 3) suscribe la app a la WABA; 4) configura el webhook de la app (callback + verify token propio); 5) pide la sincronización de
// contactos e historial (llega por el webhook "history" y se importa sin crear tarjetas). Cada paso deja su respuesta en agente_tareas.
// Requiere el secreto META_APP_SECRET (Supabase → Edge Functions → Secrets). App ID y Config ID se guardan desde la página.
// OJO: los endpoints 3-5 siguen la documentación de Meta de coexistencia; no se pudieron probar sin una app aprobada.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { autorizar, db, json } from "./agente.ts";

const GRAPH = "https://graph.facebook.com/v21.0";
const APP_SECRET = Deno.env.get("META_APP_SECRET") ?? Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
const SELF = `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/whatsapp-webhook`;
const CORS = { "Access-Control-Allow-Origin": "https://autopartschile.cl", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });

async function setting(k: string): Promise<string> {
  const { data } = await db.from("crm_settings").select("value").eq("key", k).maybeSingle();
  return (typeof data?.value === "string" ? data.value : data?.value != null ? String(data.value) : "").replace(/^"|"$/g, "");
}
async function guardar(k: string, v: string) { await db.from("private_config").upsert({ key: k, value: v, updated_at: new Date().toISOString() }); }
async function log(paso: string, http: number, resp: unknown, error?: string) {
  await db.from("agente_tareas").insert({ agente: "sistema", accion: "whatsapp_conectar", entidad_tipo: "paso", entidad_id: paso, salida: { http, respuesta: JSON.stringify(resp).slice(0, 600) }, resultado: error ? "error" : "ok", error: error ?? null });
}
async function graph(method: string, path: string, token: string, body?: unknown) {
  const r = await fetch(`${GRAPH}${path}`, { method, headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return out({ error: "POST" }, 405);
  if (!(await autorizar(req, "sistema"))) return out({ error: "Solo Emir (admin) puede conectar WhatsApp" }, 401);
  const b = await req.json().catch(() => ({}));
  const appId = await setting("meta_app_id");
  if (!appId) return out({ error: "Falta el App ID: guárdalo en la página primero" }, 400);
  if (!APP_SECRET) return out({ error: "Falta el secreto META_APP_SECRET en Supabase → Edge Functions → Secrets" }, 400);

  if (b.accion === "sincronizar") {
    const { data: t } = await db.from("private_config").select("value").eq("key", "wa_business_token").maybeSingle();
    const { data: p } = await db.from("private_config").select("value").eq("key", "wa_phone_number_id").maybeSingle();
    if (!t?.value || !p?.value) return out({ error: "Todavía no está conectado" }, 400);
    const res: Record<string, unknown> = {};
    for (const tipo of ["smb_app_state_sync", "history"]) {
      const r = await graph("POST", `/${p.value}/smb_app_data`, t.value, { messaging_product: "whatsapp", sync_type: tipo });
      await log("sync_" + tipo, r.status, r.j, r.ok ? undefined : JSON.stringify(r.j).slice(0, 300)); res[tipo] = r.ok ? "pedido" : r.j;
    }
    return out({ ok: true, ...res });
  }

  const code = String(b.code ?? ""), waba = String(b.waba_id ?? ""), phone = String(b.phone_number_id ?? "");
  if (!code || !/^\d+$/.test(waba) || !/^\d+$/.test(phone)) return out({ error: "Faltan datos del registro (code, waba_id, phone_number_id)" }, 400);

  // 1) code → token de negocio
  const tr = await fetch(`${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${APP_SECRET}&code=${encodeURIComponent(code)}`);
  const tj = await tr.json().catch(() => ({}));
  await log("canje_code", tr.status, { ok: !!tj.access_token, error: tj.error }, tj.access_token ? undefined : JSON.stringify(tj.error ?? tj).slice(0, 300));
  if (!tj.access_token) return out({ error: "Meta no entregó el token", detalle: tj.error ?? tj }, 502);
  const token: string = tj.access_token;

  // 2) guardar (nunca sale de la base; solo la lee el service role)
  await guardar("wa_business_token", token); await guardar("wa_waba_id", waba); await guardar("wa_phone_number_id", phone);

  // 3) suscribir la app a la WABA (para recibir mensajes, ecos e historial)
  const s = await graph("POST", `/${waba}/subscribed_apps`, token);
  await log("suscribir_waba", s.status, s.j, s.ok ? undefined : JSON.stringify(s.j).slice(0, 300));

  // 4) webhook de la app: callback a whatsapp-webhook con verify token propio
  let verify = (await db.from("private_config").select("value").eq("key", "wa_verify_token").maybeSingle()).data?.value as string | undefined;
  if (!verify) { verify = crypto.randomUUID().replace(/-/g, ""); await guardar("wa_verify_token", verify); }
  const w = await fetch(`${GRAPH}/${appId}/subscriptions`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ object: "whatsapp_business_account", callback_url: SELF, verify_token: verify, fields: "messages,smb_message_echoes,history,smb_app_state_sync,account_update", access_token: `${appId}|${APP_SECRET}` }) });
  const wj = await w.json().catch(() => ({}));
  await log("webhook_app", w.status, wj, w.ok ? undefined : JSON.stringify(wj).slice(0, 300));

  // 5) pedir contactos e historial (Meta lo envía por el webhook "history"; ventana limitada después del registro)
  const sync: Record<string, unknown> = {};
  for (const tipo of ["smb_app_state_sync", "history"]) {
    const r = await graph("POST", `/${phone}/smb_app_data`, token, { messaging_product: "whatsapp", sync_type: tipo });
    await log("sync_" + tipo, r.status, r.j, r.ok ? undefined : JSON.stringify(r.j).slice(0, 300)); sync[tipo] = r.ok ? "pedido" : r.j;
  }
  return out({ ok: true, waba_suscrita: s.ok, webhook: w.ok, sync });
});
