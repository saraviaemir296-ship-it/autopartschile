// RECEPCIÓN común de clientes para WhatsApp, Messenger e Instagram. Determinista (sin IA obligatoria):
// registra cada mensaje en el CRM, recoge marca/modelo/año/VIN o patente/foto/pieza, confirma stock solo cuando
// la pieza está en la base con precio fijado (regla 3), y deriva a Emir todo lo demás como tarea. El Seguimiento
// (agente horario) toma la conversación después porque deja next_action_at.
import { clp, db, esElectrica, NEGOCIO } from "./agente.ts";

export type Canal = "whatsapp" | "messenger" | "instagram";
export interface Entrada { canal: Canal; externalId: string; telefono?: string | null; nombre?: string | null; texto: string; tipo: "texto" | "imagen" | "audio" | "video" | "documento" | "ubicacion" | "sticker" | "otro"; mediaUrl?: string | null; msgId?: string | null; raw?: unknown; sentAt?: string; }
export interface Salida { convId: string | null; respuesta: string | null; motivo: string; paraEmir: string | null; duplicado?: boolean; }

const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function informativa(t: string): { tema: string; texto: string } | null {
  const s = norm(t);
  if (/\b(horario|a que hora|abren|cierran|atienden|abierto|hoy atienden)\b/.test(s)) return { tema: "horario", texto: `Atendemos ${NEGOCIO.horario}. Estamos en ${NEGOCIO.direccion}.` };
  if (/\b(direccion|donde estan|donde quedan|ubicacion|como llego|comuna|sucursal)\b/.test(s)) return { tema: "direccion", texto: `Estamos en ${NEGOCIO.direccion}. Horario ${NEGOCIO.horario}. Si vienes a retirar, avísanos antes para tener la pieza lista.` };
  if (/\b(formas? de pago|transferencia|webpay|tarjeta|mercado ?pago|efectivo|cuotas|como pago)\b/.test(s) && !/\b(la quiero|reserv|lo compro)\b/.test(s)) return { tema: "pago", texto: "Puedes pagar por transferencia, Webpay (débito o crédito) en autopartschile.cl, Mercado Pago o en efectivo en el local. Te paso los datos apenas confirmemos la pieza." };
  if (/\b(envio|envian|despacho|despachan|starken|chilexpress|blue ?express|a regiones|regiones|mandan)\b/.test(s)) return { tema: "envio", texto: "Sí, despachamos a todo Chile por Starken, Chilexpress o Blue Express (el costo depende de la comuna y el tamaño de la pieza; te lo confirmamos antes de pagar). También puedes retirar en La Pintana." };
  if (/\b(garantia|garantias|devolucion|cambio si no sirve)\b/.test(s)) return { tema: "garantia", texto: "Todos nuestros repuestos van con garantía de funcionamiento de 7 días, salvo las piezas eléctricas o electrónicas, que se prueban con video antes de entregarlas. Si recibes algo distinto a lo publicado, se cambia o devuelve." };
  return null;
}
const esSaludo = (t: string) => /^\s*(hola|holaa+|buenas|buenos dias|buenas tardes|buenas noches|hey|ola|que tal|alo)\s*[!.?]*\s*$/.test(norm(t));
const quiereComprar = (t: string) => /\b(la quiero|lo quiero|los quiero|reserv[ae]|reservar|resérv|lo compro|la compro|me la llevo|me lo llevo|como pago|donde transfiero|dame los datos|datos de transferencia|datos para transferir|pasame los datos|te transfiero)\b/.test(norm(t));

function extraer(texto: string): { anio?: number; vin?: string; patente?: string } {
  const out: { anio?: number; vin?: string; patente?: string } = {};
  const t = texto.toUpperCase();
  const vin = t.match(/\b[A-HJ-NPR-Z0-9]{17}\b/); if (vin) out.vin = vin[0];
  const pat = t.replace(/[-\s]/g, " ").match(/\b([A-Z]{4}\s?\d{2}|[A-Z]{2}\s?\d{4})\b/); if (pat && !vin) out.patente = pat[1].replace(/\s/g, "");
  const an = texto.match(/\b(19[89]\d|20[0-2]\d)\b/); if (an) out.anio = Number(an[1]);
  return out;
}

export async function recibir(e: Entrada): Promise<Salida> {
  if (e.msgId) { const { data: dup } = await db.from("crm_messages").select("id").eq("channel_code", e.canal).eq("external_message_id", e.msgId).maybeSingle(); if (dup) return { convId: null, respuesta: null, motivo: "duplicado", paraEmir: null, duplicado: true }; }
  const { data: cid, error: e1 } = await db.rpc("crm_resolve_customer", { p_channel: e.canal, p_external_id: e.externalId, p_phone: e.telefono ?? null, p_name: e.nombre ?? null });
  if (e1) throw e1;
  let { data: conv } = await db.from("crm_conversations").select("id, pieza_buscada, vehiculo_buscado, product_id, datos_recepcion, sales_stage").eq("channel_code", e.canal).eq("external_thread_id", e.externalId).is("closed_at", null).is("deleted_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (!conv) {
    const { data: nc, error: e2 } = await db.from("crm_conversations").insert({ customer_id: cid, channel_code: e.canal, external_thread_id: e.externalId, contact_name: e.nombre ?? null, contact_phone: e.telefono ?? null, negocio: "desarmaduria" }).select("id, pieza_buscada, vehiculo_buscado, product_id, datos_recepcion, sales_stage").single();
    if (e2) throw e2; conv = nc;
  }
  const sentAt = e.sentAt ?? new Date().toISOString();
  const { error: e3 } = await db.from("crm_messages").insert({ conversation_id: conv.id, channel_code: e.canal, external_message_id: e.msgId ?? null, direction: "entrante", sender_type: "cliente", message_type: e.tipo, body: e.texto || null, media: e.mediaUrl ? [{ url: e.mediaUrl, tipo: e.tipo }] : null, status: "recibido", sent_at: sentAt, raw: { ...(e.raw as object ?? {}), contact_name: e.nombre ?? null } });
  if (e3) throw e3;

  const datos: Record<string, unknown> = { ...(conv.datos_recepcion ?? {}) };
  const ex = extraer(e.texto || ""); if (ex.anio) datos.anio = ex.anio; if (ex.vin) datos.vin = ex.vin; if (ex.patente) datos.patente = ex.patente;
  if (e.tipo === "imagen" && e.mediaUrl) datos.foto_url = e.mediaUrl;
  let respuesta: string | null = null; let motivo = ""; let paraEmir: string | null = null;

  const info = e.texto ? informativa(e.texto) : null;
  if (e.tipo !== "texto" && !e.texto) {
    const et = e.tipo === "imagen" ? "la foto" : e.tipo === "audio" ? "el audio" : e.tipo === "video" ? "el video" : "el archivo";
    if (e.tipo === "imagen") { respuesta = `Recibí ${et} de la pieza, gracias. ${faltantes(conv, datos).length ? "Para confirmarte dime " + pedir(faltantes(conv, datos)) + "." : "Una persona del equipo la revisa y te confirma por aquí."}`; motivo = "foto"; }
    else { respuesta = `Recibí ${et}. Por aquí me cuesta escucharlo; escríbeme qué pieza buscas y para qué auto (marca, modelo y año) y te confirmo.`; motivo = "adjunto"; }
    if (e.tipo !== "imagen" || !faltantes(conv, datos).length) paraEmir = `${e.nombre ?? e.externalId} mandó ${et} por ${e.canal}. Revísalo y responde.`;
  } else if (info) { respuesta = info.texto; motivo = "informativa:" + info.tema; }
  else if (quiereComprar(e.texto)) {
    respuesta = "Perfecto. Te la dejo reservada y en un momento te mando por aquí los datos para el pago y el retiro o envío.";
    motivo = "intencion_compra";
    await db.from("crm_conversations").update({ sales_stage: "intencion_compra", next_action: "Cerrar venta: mandar datos de pago", next_action_at: new Date().toISOString(), next_action_type: "mensaje" }).eq("id", conv.id);
    paraEmir = `🔥 ${e.nombre ?? e.externalId} quiere comprar${conv.pieza_buscada ? " " + conv.pieza_buscada : ""}${conv.vehiculo_buscado ? " para " + conv.vehiculo_buscado : ""} (${e.canal}). Mándale los datos de pago y confirma reserva.`;
  } else if (esSaludo(e.texto) && !conv.pieza_buscada) {
    respuesta = "¡Hola! Gracias por escribir a Desarmaduría Saravia. Para confirmarte si tenemos la pieza, cuéntame: qué repuesto buscas, marca, modelo y año del auto, y si puedes la patente o el VIN. Una foto de la pieza también ayuda.";
    motivo = "saludo";
  } else {
    const { data: r } = await db.rpc("lead_match_stock", { p_conv: conv.id });
    const { data: c2 } = await db.from("crm_conversations").select("pieza_buscada, vehiculo_buscado, product_id").eq("id", conv.id).single();
    if (c2) { conv.pieza_buscada = c2.pieza_buscada; conv.vehiculo_buscado = c2.vehiculo_buscado; conv.product_id = c2.product_id; }
    const top = r?.top; const n = Number(r?.candidatos ?? 0); const falt = faltantes(conv, datos);
    if (n === 1 && top && top.precio_estado === "fijado" && Number(top.precio) > 0) {
      const gar = esElectrica(String(top.nombre)) ? "Es pieza eléctrica: se prueba con video antes de entregarla." : "Va con garantía de funcionamiento de 7 días.";
      respuesta = `Sí, la tenemos: ${top.nombre} (código ${top.sku}) a ${clp(top.precio)}. ${gar} Retiro en La Pintana o envío a todo Chile.${falt.includes("patente o VIN") ? " Si me mandas la patente o el VIN confirmo la compatibilidad al 100 %." : ""} ¿Te la reservo?`;
      motivo = "stock_confirmado_precio_fijado";
    } else if (n === 1 && top) { respuesta = `Sí, tenemos ${top.nombre}. Te confirmo el precio por aquí en un momento.`; motivo = "stock_sin_precio_fijado"; }
    else if (n > 1) { respuesta = "Tenemos más de una pieza que podría ser; una persona del equipo te confirma por aquí cuál es y el precio." + (datos.foto_url ? "" : " Si puedes, mándame una foto de la pieza."); motivo = "varios_candidatos"; }
    else if (falt.length) { respuesta = "Para buscarla bien necesito " + pedir(falt) + "."; motivo = "faltan_datos:" + falt.join(","); }
    else { respuesta = "Por ahora no la veo en el sistema. Lo reviso en el patio y te confirmo por aquí."; motivo = "sin_stock"; paraEmir = `${e.nombre ?? e.externalId} pide "${conv.pieza_buscada ?? e.texto.slice(0, 80)}"${conv.vehiculo_buscado ? " para " + conv.vehiculo_buscado : ""} y no figura. ¿Está en el patio?`; }
    if (!datos.pidio_identificacion && (motivo.startsWith("stock") || motivo === "varios_candidatos")) datos.pidio_identificacion = true;
  }
  await db.from("crm_conversations").update({ datos_recepcion: datos }).eq("id", conv.id);
  // deja la conversación en manos del Seguimiento si nadie la toma
  await db.from("crm_conversations").update({ next_action: "Seguimiento de recepción", next_action_at: new Date(Date.now() + 24 * 3600e3).toISOString() }).eq("id", conv.id).is("next_action_at", null);
  return { convId: conv.id, respuesta, motivo, paraEmir };
}

function faltantes(conv: { pieza_buscada: string | null; vehiculo_buscado: string | null }, datos: Record<string, unknown>): string[] {
  const f: string[] = [];
  if (!conv.pieza_buscada) f.push("qué pieza buscas");
  if (!conv.vehiculo_buscado) f.push("marca y modelo del auto");
  if (!datos.anio && !/\b(19[89]\d|20[0-2]\d)\b/.test(conv.vehiculo_buscado ?? "")) f.push("el año");
  if (!datos.vin && !datos.patente && !datos.pidio_identificacion) f.push("patente o VIN");
  return f;
}
const pedir = (f: string[]) => f.length === 1 ? f[0] : f.slice(0, -1).join(", ") + " y " + f[f.length - 1];

export async function registrarSalida(convId: string, canal: Canal, texto: string, externalMsgId: string | null, motivo: string) {
  await db.from("crm_messages").insert({ conversation_id: convId, channel_code: canal, external_message_id: externalMsgId, direction: "saliente", sender_type: "ia", message_type: "texto", body: texto, status: "enviado", sent_at: new Date().toISOString(), raw: { motivo } });
}
export async function registrarTarea(canal: Canal, convId: string | null, salida: unknown, error?: string, paraEmir?: string | null, enlace?: string | null) {
  await db.from("agente_tareas").insert({ agente: "recepcionista", accion: "recepcion_" + canal, entidad_tipo: convId ? "crm_conversation" : canal, entidad_id: convId ?? null, salida, resultado: error ? "error" : "ok", error: error?.slice(0, 1000) ?? null });
  if (paraEmir && convId) {
    await db.from("agente_tareas").insert({ agente: "recepcionista", accion: "responder_cliente", entidad_tipo: "crm_conversation", entidad_id: convId, requiere_aprobacion: true, estado_aprobacion: "pendiente", propuesta: paraEmir + " (Marcar enviado cuando respondas.)", salida: { canal, wa_link: enlace ?? null } });
    await db.rpc("notificar", { p_titulo: "💬 " + canal + ": necesita tu respuesta", p_texto: paraEmir.slice(0, 140), p_url: "/admin/hoy.html", p_dedupe: "resp:" + convId + ":" + Date.now() });
  }
}
