// BOT DE WHATSAPP (Cloud API de Meta) · usa la RECEPCIÓN común (_shared/recepcion.ts): registra en el CRM, pide
// marca/modelo/año/VIN o patente/foto/pieza, confirma stock solo con precio fijado (regla 3) y deriva el resto a Emir.
// Secretos: WHATSAPP_VERIFY_TOKEN, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { db } from "./agente.ts";
import { recibir, registrarSalida, registrarTarea } from "./recepcion.ts";

const VERIFY = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
const GRAPH = "https://graph.facebook.com/v21.0";

async function firmaValida(req: Request, raw: string): Promise<boolean> {
  if (!APP_SECRET) return false;
  const sig = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, ""); if (!sig) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false; let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ sig.charCodeAt(i); return d === 0;
}
async function enviar(to: string, body: string): Promise<string | null> {
  const r = await fetch(`${GRAPH}/${PHONE_ID}/messages`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp envío HTTP ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j?.messages?.[0]?.id ?? null;
}
async function urlMedia(id: string): Promise<string | null> {
  try { const r = await fetch(`${GRAPH}/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } }); const j = await r.json(); return j?.url ?? null; } catch { return null; }
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
  if (!(await firmaValida(req, raw))) { await registrarTarea("whatsapp", null, {}, APP_SECRET ? "firma inválida" : "WHATSAPP_APP_SECRET no configurado: evento rechazado (falla cerrado)"); return new Response("Forbidden", { status: 403 }); }
  let body: any; try { body = JSON.parse(raw); } catch { return new Response("Bad Request", { status: 400 }); }
  for (const entry of body.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value ?? {};
    for (const st of v.statuses ?? []) { const map: Record<string, string> = { sent: "enviado", delivered: "entregado", read: "leido", failed: "fallido" }; if (map[st.status]) await db.from("crm_messages").update({ status: map[st.status] }).eq("external_message_id", st.id); }
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
