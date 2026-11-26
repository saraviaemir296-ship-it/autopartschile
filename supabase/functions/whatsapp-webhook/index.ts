// BOT DE WHATSAPP (Cloud API de Meta) · Recepcionista en el canal donde pasa el 90 % de la venta.
// Qué hace solo (regla 3: solo respuestas informativas): horario, dirección, formas de pago, envíos, garantía,
// y "¿tienen X para Y?" cuando la pieza está en la base con precio FIJADO por Emir (stock confirmado en la base).
// Todo lo demás (cotizar, negociar, fotos/audios, reclamos) queda registrado en el CRM y le llega a Emir como
// tarea; nada más sale sin su OK. Cada mensaje entra a crm_conversations / crm_messages como canal 'whatsapp'.
// Secretos (Supabase → Edge Functions → Secrets): WHATSAPP_VERIFY_TOKEN, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET.
// Webhook en Meta for Developers → tu app → WhatsApp → Configuración: URL .../functions/v1/whatsapp-webhook, campo "messages".
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { clp, db, esElectrica, NEGOCIO } from "./agente.ts";

const VERIFY = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
const GRAPH = "https://graph.facebook.com/v21.0";

async function log(accion: string, entidad: { tipo: string; id: string } | null, salida: unknown, error?: string, propuesta?: string, requiere = false) {
  await db.from("agente_tareas").insert({ agente: "recepcionista", accion, entidad_tipo: entidad?.tipo ?? null, entidad_id: entidad?.id ?? null, salida, resultado: error ? "error" : "ok", error: error?.slice(0, 1000) ?? null,
    propuesta: propuesta ?? null, requiere_aprobacion: requiere, estado_aprobacion: requiere ? "pendiente" : null });
}
async function firmaValida(req: Request, raw: string): Promise<boolean> {
  if (!APP_SECRET) return false; // falla cerrado, igual que meta-agent
  const sig = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, "");
  if (!sig) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const hex = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return false;
  let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return d === 0;
}
async function enviar(to: string, body: string): Promise<string | null> {
  const r = await fetch(`${GRAPH}/${PHONE_ID}/messages`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp envío HTTP ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j?.messages?.[0]?.id ?? null;
}
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Respuestas informativas (regla 3). Solo datos del negocio, nunca precio ni stock inventado.
function informativa(t: string): { tema: string; texto: string } | null {
  const s = norm(t);
  if (/\b(horario|a que hora|abren|cierran|atienden|abierto|hoy atienden)\b/.test(s)) return { tema: "horario", texto: `Atendemos ${NEGOCIO.horario}. Estamos en ${NEGOCIO.direccion}.` };
  if (/\b(direccion|donde estan|donde quedan|ubicacion|como llego|comuna|sucursal)\b/.test(s)) return { tema: "direccion", texto: `Estamos en ${NEGOCIO.direccion}. Horario ${NEGOCIO.horario}. Si vienes a retirar, avísanos antes para tener la pieza lista.` };
  if (/\b(formas? de pago|transferencia|webpay|tarjeta|mercado ?pago|efectivo|cuotas|como pago)\b/.test(s)) return { tema: "pago", texto: "Puedes pagar por transferencia, Webpay (débito o crédito) en autopartschile.cl, Mercado Pago o en efectivo en el local. Te paso los datos apenas confirmemos la pieza." };
  if (/\b(envio|envian|despacho|despachan|starken|chilexpress|blue ?express|a regiones|regiones|mandan)\b/.test(s)) return { tema: "envio", texto: "Sí, despachamos a todo Chile por Starken, Chilexpress o Blue Express (el costo depende de la comuna y el tamaño de la pieza; te lo confirmamos antes de pagar). También puedes retirar en La Pintana." };
  if (/\b(garantia|garantias|devolucion|cambio si no sirve)\b/.test(s)) return { tema: "garantia", texto: "Todos nuestros repuestos van con garantía de funcionamiento de 7 días, salvo las piezas eléctricas o electrónicas, que se prueban con video antes de entregarlas. Si recibes algo distinto a lo publicado, se cambia o devuelve." };
  if (/^\s*(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|ola)\s*[!.]*\s*$/.test(s)) return { tema: "saludo", texto: "¡Hola! Gracias por escribir a Desarmaduría Saravia. ¿Qué pieza buscas y para qué auto (marca, modelo y año)? Así te confirmo si la tenemos." };
  return null;
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
  if (!(await firmaValida(req, raw))) { await log("whatsapp_firma_invalida", null, {}, APP_SECRET ? "firma x-hub-signature-256 inválida" : "WHATSAPP_APP_SECRET no configurado: evento rechazado (falla cerrado)"); return new Response("Forbidden", { status: 403 }); }
  let body: any; try { body = JSON.parse(raw); } catch { return new Response("Bad Request", { status: 400 }); }

  for (const entry of body.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value ?? {};
    // estados de entrega de lo que enviamos
    for (const st of v.statuses ?? []) {
      const map: Record<string, string> = { sent: "enviado", delivered: "entregado", read: "leido", failed: "fallido" };
      if (map[st.status]) await db.from("crm_messages").update({ status: map[st.status] }).eq("external_message_id", st.id);
    }
    for (const m of v.messages ?? []) {
      const wa = String(m.from ?? ""); if (!wa) continue;
      const nombre = v.contacts?.find((c: any) => c.wa_id === wa)?.profile?.name ?? null;
      const tel = "+" + wa;
      const tipo = m.type === "text" ? "texto" : m.type === "image" ? "imagen" : m.type === "audio" ? "audio" : m.type === "video" ? "video" : m.type === "document" ? "documento" : m.type === "location" ? "ubicacion" : m.type === "sticker" ? "sticker" : "otro";
      const texto: string = m.text?.body ?? m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? "";
      try {
        // ya procesado (Meta reintenta)
        const { data: dup } = await db.from("crm_messages").select("id").eq("external_message_id", m.id).maybeSingle();
        if (dup) continue;
        const { data: cid, error: e1 } = await db.rpc("crm_resolve_customer", { p_channel: "whatsapp", p_external_id: wa, p_phone: tel, p_name: nombre });
        if (e1) throw e1;
        let { data: conv } = await db.from("crm_conversations").select("id, pieza_buscada, vehiculo_buscado, product_id").eq("channel_code", "whatsapp").eq("external_thread_id", wa).is("closed_at", null).is("deleted_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (!conv) {
          const { data: nc, error: e2 } = await db.from("crm_conversations").insert({ customer_id: cid, channel_code: "whatsapp", external_thread_id: wa, contact_name: nombre, contact_phone: tel, negocio: "desarmaduria" }).select("id, pieza_buscada, vehiculo_buscado, product_id").single();
          if (e2) throw e2; conv = nc;
        }
        const sentAt = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();
        const { error: e3 } = await db.from("crm_messages").insert({ conversation_id: conv.id, channel_code: "whatsapp", external_message_id: m.id, direction: "entrante", sender_type: "cliente", message_type: tipo, body: texto || null, status: "recibido", sent_at: sentAt, raw: { ...m, contact_name: nombre } });
        if (e3) throw e3;

        let respuesta: string | null = null; let motivo = ""; let paraEmir: string | null = null;
        if (tipo !== "texto" && !texto) {
          const et = tipo === "imagen" ? "tu foto" : tipo === "audio" ? "tu audio" : tipo === "video" ? "tu video" : "tu archivo";
          respuesta = `Recibí ${et}, gracias. Para confirmarte, dime marca, modelo y año del auto y qué pieza es; una persona del equipo la revisa y te responde por aquí.`;
          motivo = "adjunto"; paraEmir = `${nombre ?? tel} mandó ${et} por WhatsApp. Revísalo en el teléfono y responde.`;
        } else {
          const info = informativa(texto);
          if (info) { respuesta = info.texto; motivo = "informativa:" + info.tema; }
          else {
            const { data: r } = await db.rpc("lead_match_stock", { p_conv: conv.id });
            const top = r?.top; const n = Number(r?.candidatos ?? 0);
            if (n === 1 && top && top.precio_estado === "fijado" && Number(top.precio) > 0) {
              const gar = esElectrica(String(top.nombre)) ? "Es pieza eléctrica: se prueba con video antes de entregarla." : "Va con garantía de funcionamiento de 7 días.";
              respuesta = `Sí, la tenemos: ${top.nombre} (código ${top.sku}) a ${clp(top.precio)}. ${gar} Retiro en La Pintana o envío a todo Chile. ¿Te la reservo?`;
              motivo = "stock_confirmado_precio_fijado";
            } else if (n >= 1) { respuesta = "Recibido. Tenemos piezas que podrían ser la que buscas; una persona del equipo te confirma por aquí en un momento cuál es y el precio."; motivo = "stock_por_confirmar"; }
            else if (r?.omitido === "sin pieza") { respuesta = "Para ayudarte necesito la marca, el modelo y el año del auto, y qué pieza buscas."; motivo = "faltan_datos"; }
            else { respuesta = "Recibido. Lo reviso con el equipo y te respondo por aquí apenas lo tenga claro."; motivo = "derivado"; paraEmir = `${nombre ?? tel}: "${texto.slice(0, 160)}" — el sistema no encontró la pieza; responde tú.`; }
          }
        }
        let outId: string | null = null; let envioErr: string | undefined;
        if (respuesta) {
          try { outId = await enviar(wa, respuesta); } catch (e) { envioErr = e instanceof Error ? e.message : String(e); }
          if (!envioErr) await db.from("crm_messages").insert({ conversation_id: conv.id, channel_code: "whatsapp", external_message_id: outId, direction: "saliente", sender_type: "ia", message_type: "texto", body: respuesta, status: "enviado", sent_at: new Date().toISOString(), raw: { motivo } });
        }
        await log("whatsapp_entrante", { tipo: "crm_conversation", id: conv.id }, { de: nombre ?? tel, tipo, texto: texto.slice(0, 200), motivo, respuesta_auto: respuesta, enviado: !envioErr }, envioErr);
        if (paraEmir) {
          await log("whatsapp_responder", { tipo: "crm_conversation", id: conv.id }, { telefono: tel, wa_link: `https://wa.me/${wa}` }, undefined, paraEmir + " (Marcar enviado cuando respondas.)", true);
          await db.rpc("notificar", { p_titulo: "💬 WhatsApp: necesita tu respuesta", p_texto: paraEmir.slice(0, 140), p_url: "/admin/equipo-ia.html#aprobaciones", p_dedupe: "wa:" + conv.id + ":" + m.id });
        }
      } catch (e) {
        await log("whatsapp_entrante", { tipo: "whatsapp", id: wa }, { texto: texto.slice(0, 200), tipo }, e instanceof Error ? e.message : String(e));
      }
    }
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
});
