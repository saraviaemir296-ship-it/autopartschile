// BOT DE WHATSAPP (Cloud API de Meta) · usa la RECEPCIÓN común (_shared/recepcion.ts): registra en el CRM, pide
// marca/modelo/año/VIN o patente/foto/pieza, confirma stock solo con precio fijado (regla 3) y deriva el resto a Emir.
// v4: dos modos. (a) Meta directo: WHATSAPP_VERIFY_TOKEN, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET.
// (b) 360dialog (coexistencia con la app del teléfono): basta WHATSAPP_TOKEN = API key de 360dialog (sin PHONE_NUMBER_ID). El webhook
// se registra solo con la acción interna "registrar_webhook" (pg: agente_lanzar('sistema','whatsapp-webhook','{"accion":"registrar_webhook"}')),
// que genera un secreto, lo guarda en private_config y lo exige en el header x-webhook-secret de cada evento.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { autorizar, db, json } from "./agente.ts";
import { recibir, registrarSalida, registrarTarea } from "./recepcion.ts";

const VERIFY = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
const GRAPH = "https://graph.facebook.com/v21.0";
const D360 = (Deno.env.get("WHATSAPP_PROVIDER") ?? "").toLowerCase() === "360dialog" || (!PHONE_ID && !!TOKEN);
const D360_BASE = "https://waba-v2.360dialog.io";
const SELF_URL = `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/whatsapp-webhook`;
let secretoCache: string | null = null;
async function secretoWebhook(): Promise<string | null> {
  if (secretoCache) return secretoCache;
  const { data } = await db.from("private_config").select("value").eq("key", "wa_webhook_secret").maybeSingle();
  secretoCache = data?.value ?? null; return secretoCache;
}
const igual = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

async function firmaValida(req: Request, raw: string): Promise<boolean> {
  if (!APP_SECRET) return false;
  const sig = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, ""); if (!sig) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false; let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ sig.charCodeAt(i); return d === 0;
}
/** Evento entrante válido: firma HMAC de Meta (modo directo) o secreto propio en el header (modo proveedor). Falla cerrado. */
async function entradaValida(req: Request, raw: string): Promise<boolean> {
  if (APP_SECRET && await firmaValida(req, raw)) return true;
  const h = req.headers.get("x-webhook-secret") ?? ""; if (!h) return false;
  const s = await secretoWebhook(); return !!s && igual(h, s);
}
async function enviar(to: string, body: string): Promise<string | null> {
  const url = D360 ? `${D360_BASE}/messages` : `${GRAPH}/${PHONE_ID}/messages`;
  const headers: Record<string, string> = D360 ? { "content-type": "application/json", "D360-API-KEY": TOKEN } : { "content-type": "application/json", Authorization: `Bearer ${TOKEN}` };
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp envío HTTP ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j?.messages?.[0]?.id ?? null;
}
async function urlMedia(id: string): Promise<string | null> {
  if (D360) return null; // con 360dialog la descarga de adjuntos va por otro host; el mensaje se registra igual, sin el archivo
  try { const r = await fetch(`${GRAPH}/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } }); const j = await r.json(); return j?.url ?? null; } catch { return null; }
}

async function registrarWebhook(): Promise<Response> {
  if (!D360) return json({ error: "Solo aplica a 360dialog. Con Meta directo el webhook se configura en la app de Meta." }, 400);
  if (!TOKEN) return json({ error: "Falta WHATSAPP_TOKEN (API key de 360dialog)" }, 400);
  const secreto = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { error } = await db.from("private_config").upsert({ key: "wa_webhook_secret", value: secreto });
  if (error) return json({ error: error.message }, 500);
  secretoCache = secreto;
  const r = await fetch(`${D360_BASE}/v1/configs/webhook`, { method: "POST", headers: { "content-type": "application/json", "D360-API-KEY": TOKEN }, body: JSON.stringify({ url: SELF_URL, headers: { "x-webhook-secret": secreto } }) });
  const t = await r.text();
  await registrarTarea("whatsapp", null, { accion: "registrar_webhook", http: r.status, respuesta: t.slice(0, 300) }, r.ok ? undefined : `360dialog HTTP ${r.status}: ${t.slice(0, 200)}`);
  return json({ ok: r.ok, http: r.status }, r.ok ? 200 : 502);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (!VERIFY) return new Response("Forbidden", { status: 403 });
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === VERIFY) return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Not found", { status: 404 });
  const raw = await req.text();
  // Acciones internas (pg_cron/pg con nonce de un solo uso): estado de la configuración y registro del webhook en el proveedor.
  if (req.headers.get("x-agente-nonce")) {
    if (!(await autorizar(req, "sistema"))) return json({ error: "no autorizado" }, 401);
    let b: any = {}; try { b = JSON.parse(raw || "{}"); } catch { /* cuerpo vacío */ }
    if (b.accion === "registrar_webhook") return await registrarWebhook();
    const estado = { proveedor: D360 ? "360dialog" : "meta", token: !!TOKEN, phone_id: !!PHONE_ID, app_secret: !!APP_SECRET, verify: !!VERIFY, secreto_webhook: !!(await secretoWebhook()) };
    await registrarTarea("whatsapp", null, { accion: "estado", ...estado });
    return json(estado);
  }
  if (!(await entradaValida(req, raw))) { await registrarTarea("whatsapp", null, {}, "evento rechazado: sin firma de Meta ni secreto de proveedor válido (falla cerrado)"); return new Response("Forbidden", { status: 403 }); }
  let body: any; try { body = JSON.parse(raw); } catch { return new Response("Bad Request", { status: 400 }); }
  for (const entry of body.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value ?? {};
    for (const st of v.statuses ?? []) { const map: Record<string, string> = { sent: "enviado", delivered: "entregado", read: "leido", failed: "fallido" }; if (map[st.status]) await db.from("crm_messages").update({ status: map[st.status] }).eq("external_message_id", st.id); }
    // Ecos (coexistencia): lo que Emir o un empleado responde desde el teléfono. Se registra como respuesta humana y cierra la tarjeta "Responder".
    for (const ec of v.message_echoes ?? []) {
      try { await db.rpc("wa_eco_registrar", { p_to: String(ec.to ?? ""), p_texto: ec.text?.body ?? ec.image?.caption ?? ec.video?.caption ?? `[${ec.type ?? "mensaje"}]`, p_msg_id: ec.id ?? null, p_ts: ec.timestamp ? new Date(Number(ec.timestamp) * 1000).toISOString() : new Date().toISOString() }); } catch (_) { /* no bloquea el webhook */ }
    }
    for (const m of v.messages ?? []) {
      const wa = String(m.from ?? ""); if (!wa) continue;
      const nombre = v.contacts?.find((c: any) => c.wa_id === wa)?.profile?.name ?? null;
      const tipo = m.type === "text" ? "texto" : m.type === "image" ? "imagen" : m.type === "audio" ? "audio" : m.type === "video" ? "video" : m.type === "document" ? "documento" : m.type === "location" ? "ubicacion" : m.type === "sticker" ? "sticker" : "otro";
      const texto: string = m.text?.body ?? m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? "";
      const mediaId = m.image?.id ?? m.video?.id ?? m.document?.id ?? m.audio?.id ?? null;
      try {
        const s = await recibir({ canal: "whatsapp", externalId: wa, telefono: "+" + wa, nombre, texto, tipo, mediaUrl: mediaId ? await urlMedia(mediaId) : null, msgId: m.id, raw: m, sentAt: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : undefined });
        if (s.duplicado) continue;
        let envioErr: string | undefined;
        if (s.respuesta && s.convId) { try { const id = await enviar(wa, s.respuesta); await registrarSalida(s.convId, "whatsapp", s.respuesta, id, s.motivo); } catch (e) { envioErr = e instanceof Error ? e.message : String(e); } }
        await registrarTarea("whatsapp", s.convId, { de: nombre ?? wa, texto: texto.slice(0, 200), tipo, motivo: s.motivo, respuesta_auto: s.respuesta, enviado: !envioErr }, envioErr, s.paraEmir, `https://wa.me/${wa}`);
      } catch (e) { await registrarTarea("whatsapp", null, { de: wa, texto: texto.slice(0, 200), tipo }, e instanceof Error ? e.message : String(e)); }
    }
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
});
