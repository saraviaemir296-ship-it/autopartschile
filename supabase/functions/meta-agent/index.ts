// BOT DE MESSENGER E INSTAGRAM (v13, 26-nov-2026). v13: además procesa la cola crm_outbox kind=meta_reply (respuestas que
// Emir/empleados arman con botones en /admin/hoy.html) cuando lo invoca pg_cron con nonce (agente_lanzar) y body {"accion":"outbox"}.
// Si no hay META_PAGE_ACCESS_TOKEN la cola espera (no es error): el texto se copia a mano desde el inbox. Reemplaza al agente anterior (que dependía de Claude + Telegram y
// nunca tuvo secretos). Ahora usa la RECEPCIÓN común (_shared/recepcion.ts): registra cada mensaje en el CRM, pide
// marca/modelo/año/VIN o patente/foto/pieza, confirma stock solo con precio fijado, y deriva a Emir el resto como tarea.
// Secretos: META_VERIFY_TOKEN, META_PAGE_ACCESS_TOKEN, META_APP_SECRET. Webhook: .../functions/v1/meta-agent (messages).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { recibir, registrarSalida, registrarTarea, type Canal } from "./recepcion.ts";
import { autorizar, db, json } from "./agente.ts";

const VERIFY = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";

async function firmaValida(req: Request, raw: string): Promise<boolean> {
  if (!APP_SECRET) return false;
  const sig = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, ""); if (!sig) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false; let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ sig.charCodeAt(i); return d === 0;
}
async function enviar(psid: string, text: string): Promise<string | null> {
  if (!PAGE_TOKEN) throw new Error("META_PAGE_ACCESS_TOKEN no configurado");
  const r = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_TOKEN}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipient: { id: psid }, messaging_type: "RESPONSE", message: { text } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Meta send HTTP ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j?.message_id ?? null;
}

/** Cola de respuestas humanas para Messenger/Instagram (crm_outbox kind=meta_reply). Responde dentro de las 24 h del último mensaje del cliente. */
async function procesarOutbox(): Promise<Response> {
  if (!PAGE_TOKEN) return json({ ok: true, omitido: "META_PAGE_ACCESS_TOKEN no configurado; la cola espera" });
  const { data: rows, error } = await db.from("crm_outbox").select("id, payload, attempts").eq("kind", "meta_reply").eq("status", "pendiente").lte("run_after", new Date().toISOString()).order("id").limit(20);
  if (error) return json({ error: error.message }, 500);
  let enviados = 0, fallidos = 0;
  for (const r of rows ?? []) {
    const p = r.payload as { psid: string; texto: string; conversation_id: string; canal: Canal; tarea: number };
    try {
      const id = await enviar(p.psid, p.texto);
      await db.from("crm_outbox").update({ status: "enviado", processed_at: new Date().toISOString() }).eq("id", r.id);
      await db.from("crm_messages").update({ status: "entregado", external_message_id: id }).eq("conversation_id", p.conversation_id).eq("direction", "saliente").contains("raw", { tarea: p.tarea });
      enviados++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e); const n = (r.attempts ?? 0) + 1;
      await db.from("crm_outbox").update({ attempts: n, last_error: msg.slice(0, 500), status: n >= 5 ? "fallido" : "pendiente", run_after: new Date(Date.now() + 10 * 60_000).toISOString() }).eq("id", r.id);
      if (n >= 5) { await db.from("crm_messages").update({ status: "fallido" }).eq("conversation_id", p.conversation_id).eq("direction", "saliente").contains("raw", { tarea: p.tarea }); await db.rpc("notificar", { p_titulo: "⚠️ No pude enviar por " + p.canal, p_texto: msg.slice(0, 140) + " — mándalo a mano desde el inbox.", p_url: "/admin/hoy.html", p_dedupe: "meta_reply_fail:" + r.id }); }
      fallidos++;
    }
  }
  return json({ ok: true, enviados, fallidos });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (!VERIFY) return new Response("Forbidden", { status: 403 });
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === VERIFY) return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Not found", { status: 404 });
  // Cola de salida (cron con nonce o service role), separada del webhook de Meta que exige firma.
  if (req.headers.get("x-agente-nonce") || (req.headers.get("authorization") ?? "").includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "---")) {
    if (!(await autorizar(req, "recepcionista"))) return json({ error: "no autorizado" }, 401);
    return await procesarOutbox();
  }
  const raw = await req.text();
  if (!(await firmaValida(req, raw))) { await registrarTarea("messenger", null, {}, APP_SECRET ? "firma inválida" : "META_APP_SECRET no configurado: evento rechazado (falla cerrado)"); return new Response("Forbidden", { status: 403 }); }
  let body: any; try { body = JSON.parse(raw); } catch { return new Response("Bad Request", { status: 400 }); }
  const canal: Canal = body.object === "instagram" ? "instagram" : "messenger";
  for (const entry of body.entry ?? []) for (const ev of entry.messaging ?? entry.standby ?? []) {
    if (ev.message?.is_echo || ev.delivery || ev.read) continue;
    const psid = ev.sender?.id; if (!psid) continue;
    const texto: string = ev.message?.text ?? "";
    const att = (ev.message?.attachments ?? [])[0];
    const tipo = att ? (att.type === "image" ? "imagen" : att.type === "audio" ? "audio" : att.type === "video" ? "video" : att.type === "file" ? "documento" : "otro") : "texto";
    try {
      const s = await recibir({ canal, externalId: psid, nombre: null, texto, tipo, mediaUrl: att?.payload?.url ?? null, msgId: ev.message?.mid ?? null, raw: ev, sentAt: ev.timestamp ? new Date(ev.timestamp).toISOString() : undefined });
      if (s.duplicado) continue;
      let envioErr: string | undefined;
      if (s.respuesta && s.convId) { try { const id = await enviar(psid, s.respuesta); await registrarSalida(s.convId, canal, s.respuesta, id, s.motivo); } catch (e) { envioErr = e instanceof Error ? e.message : String(e); } }
      await registrarTarea(canal, s.convId, { de: psid, texto: texto.slice(0, 200), tipo, motivo: s.motivo, respuesta_auto: s.respuesta, enviado: !envioErr }, envioErr, s.paraEmir, "https://business.facebook.com/latest/inbox/all");
    } catch (e) { await registrarTarea(canal, null, { de: psid, texto: texto.slice(0, 200), tipo }, e instanceof Error ? e.message : String(e)); }
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
});
