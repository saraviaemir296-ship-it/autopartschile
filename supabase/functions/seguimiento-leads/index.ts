// AGENTE SEGUIMIENTO (fase 2.1). Revisa los leads con próxima acción vencida, diagnostica por qué
// no cerraron y deja UN mensaje propuesto por lead en agente_tareas (requiere_aprobacion).
// No envía nada. Emir aprueba desde la cola (fase 3: botón en Telegram) o abre el enlace wa.me.
//
// Disparador: pg_cron diario 9:30 (fase 3) o POST manual (admin). Idempotente: si ya hay una
// propuesta pendiente para la conversación, la salta.
// Reglas (skill seguimiento-leads-ventas): nunca inventar precio/stock/compatibilidad; precio solo
// el de v_repuestos con precio_estado='fijado'; garantía según política; tono chileno, corto;
// tras 3 seguimientos sin respuesta proponer cerrar como cliente_dejo_de_responder.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  autorizar, cerrarTarea, claudeJSON, clp, db, enHorario, fallarTarea, garantiaPara,
  hayPropuestaPendiente, iniciarTarea, json, MODELO_REDACTOR, NEGOCIO, proponer, waLink,
} from "../_shared/agente.ts";

const MAX_LEADS = 25;
const MAX_SEGUIMIENTOS = 3;

interface Lead {
  id: string; cliente: string | null; telefono: string | null; canal: string; etapa_detalle: string;
  etapa: string; pieza_buscada: string | null; vehiculo_buscado: string | null; product_id: number | null;
  proximo_contacto: string | null; ultimo_mensaje: string | null; last_message_at: string | null;
  creado_at: string; valor_potencial: number | null;
}
interface Diagnostico {
  etapa_real: string;               // nuevo | calificando | cotizado | negociando | intencion_compra | sin_respuesta
  por_que_no_cerro: string;         // 1 frase con evidencia del chat
  accion: "enviar_mensaje" | "cerrar_perdido" | "esperar";
  motivo_perdida?: string | null;   // código de crm_loss_reasons si accion = cerrar_perdido
  mensaje: string;                  // el mensaje propuesto (vacío si no se envía)
  siguiente_contacto_horas: number; // cuándo volver a revisar si no responde
}

const SYSTEM = `Eres el jefe comercial de ${NEGOCIO.nombre} (repuestos usados de desarme, La Pintana, Santiago).
Tu trabajo: leer la conversación con un cliente que quedó sin cerrar, decir en una frase POR QUÉ no cerró y proponer el siguiente mensaje de seguimiento, en español de Chile, cordial, corto (máx. 3 frases), con una pregunta de cierre.
REGLAS DURAS:
- Usa SOLO los datos que te paso. No inventes precio, stock, compatibilidad, plazos ni descuentos. Si no te paso precio, no lo menciones.
- Si te paso un repuesto con precio, puedes nombrarlo con su precio y su garantía tal como vienen.
- Nunca confirmes pagos ni prometas costo de envío.
- Si el cliente ya recibió ${MAX_SEGUIMIENTOS} o más seguimientos sin responder, recomienda cerrar como perdido (accion=cerrar_perdido, motivo_perdida=cliente_dejo_de_responder) y deja mensaje vacío.
- Si el cliente escribió último y nadie le respondió, la acción es enviar_mensaje respondiendo lo que preguntó, no "hacer seguimiento".
- Firma implícita: el mensaje lo envía Emir desde el WhatsApp del local; no firmes como IA.
Devuelve JSON: {"etapa_real":"...","por_que_no_cerro":"...","accion":"enviar_mensaje|cerrar_perdido|esperar","motivo_perdida":null,"mensaje":"...","siguiente_contacto_horas":24}`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await autorizar(req))) return json({ error: "no autorizado" }, 401);

  const corrida = await iniciarTarea("seguimiento", "revisar_vencidos", undefined, { max: MAX_LEADS });
  const resumen = { revisados: 0, propuestas: 0, cierres_propuestos: 0, saltados: 0, errores: 0, fuera_horario: !(await enHorario()) };
  let tokensTotal = 0;

  try {
    const { data: leads, error } = await db.from("v_leads").select("*")
      .eq("seguimiento_vencido", true).is("cerrado_at", null)
      .order("proximo_contacto", { ascending: true }).limit(MAX_LEADS);
    if (error) throw error;

    for (const lead of (leads ?? []) as Lead[]) {
      resumen.revisados++;
      try {
        if (await hayPropuestaPendiente("seguimiento", "proponer_mensaje", "crm_conversation", lead.id)
          || await hayPropuestaPendiente("seguimiento", "proponer_cierre", "crm_conversation", lead.id)) {
          resumen.saltados++; continue;
        }

        const [{ data: msgs }, { count: seguimientosPrevios }, repuesto] = await Promise.all([
          db.from("crm_messages").select("direction, sender_type, body, sent_at").eq("conversation_id", lead.id)
            .order("sent_at", { ascending: false }).limit(20),
          db.from("agente_tareas").select("id", { count: "exact", head: true })
            .eq("agente", "seguimiento").eq("entidad_tipo", "crm_conversation").eq("entidad_id", lead.id)
            .in("estado_aprobacion", ["aprobada", "editada", "ejecutada"]),
          lead.product_id
            ? db.from("v_repuestos").select("nombre, numero_parte, categoria, precio_final, precio_estado, estado, compatibilidades").eq("id", lead.product_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        const historial = (msgs ?? []).reverse().map((m) =>
          `[${m.sent_at?.slice(0, 16) ?? ""}] ${m.direction === "entrante" ? "CLIENTE" : m.sender_type === "ia" ? "IA" : "LOCAL"}: ${m.body ?? ""}`).join("\n");

        const r = repuesto?.data;
        const repuestoTxt = r
          ? `Repuesto en sistema: ${r.nombre}${r.numero_parte ? " (N° parte " + r.numero_parte + ")" : ""}. Estado: ${r.estado}. ` +
            (r.precio_estado === "fijado" && r.precio_final ? `Precio fijado por Emir: ${clp(r.precio_final)}. Garantía: ${garantiaPara(r.nombre, r.categoria)}.`
              : "Precio AÚN NO fijado por Emir: no des precio.")
          : "Sin repuesto asociado en sistema: no afirmes stock ni precio.";

        const user = `LEAD
Cliente: ${lead.cliente ?? "(sin nombre)"} · Canal: ${lead.canal} · Etapa CRM: ${lead.etapa_detalle}
Pieza buscada: ${lead.pieza_buscada ?? "(no estructurada)"} · Vehículo: ${lead.vehiculo_buscado ?? "(no estructurado)"}
Creado: ${lead.creado_at?.slice(0, 10)} · Último mensaje: ${lead.last_message_at?.slice(0, 16) ?? "?"} · Próxima acción vencida desde: ${lead.proximo_contacto?.slice(0, 16)}
Seguimientos ya aprobados y enviados antes: ${seguimientosPrevios ?? 0}
${repuestoTxt}
Datos del local: ${NEGOCIO.direccion}. Horario ${NEGOCIO.horario}. Envíos por Starken a todo Chile (costo por confirmar).

CONVERSACIÓN (más antigua arriba):
${historial || "(sin mensajes registrados; el lead viene de " + lead.canal + ": " + (lead.ultimo_mensaje ?? "") + ")"}`;

        const { data: d, uso } = await claudeJSON<Diagnostico>({ system: SYSTEM, user, modelo: MODELO_REDACTOR, maxTokens: 700 });
        tokensTotal += uso.tokens;

        const base = {
          agente: "seguimiento" as const, entidad: { tipo: "crm_conversation", id: lead.id },
          entrada: { lead_id: lead.id, cliente: lead.cliente, canal: lead.canal, etapa_crm: lead.etapa_detalle, seguimientos_previos: seguimientosPrevios ?? 0 },
          modelo: uso.modelo, tokens: uso.tokens,
        };

        if (d.accion === "cerrar_perdido" || (seguimientosPrevios ?? 0) >= MAX_SEGUIMIENTOS) {
          await proponer({
            ...base, accion: "proponer_cierre",
            propuesta: `Cerrar como PERDIDO (${d.motivo_perdida ?? "cliente_dejo_de_responder"}): ${lead.cliente ?? lead.telefono ?? lead.id.slice(0, 8)} · ${lead.pieza_buscada ?? lead.etapa_detalle}. Motivo: ${d.por_que_no_cerro}`,
            salida: { diagnostico: d, motivo_perdida: d.motivo_perdida ?? "cliente_dejo_de_responder" },
          });
          resumen.cierres_propuestos++;
        } else if (d.accion === "enviar_mensaje" && d.mensaje?.trim()) {
          const link = waLink(lead.telefono, d.mensaje);
          await proponer({
            ...base, accion: "proponer_mensaje",
            propuesta: `${lead.cliente ?? lead.telefono ?? "Cliente"} (${lead.canal}) · ${d.etapa_real} · ${d.por_que_no_cerro}\n\nMENSAJE:\n${d.mensaje}`,
            salida: { diagnostico: d, mensaje: d.mensaje, wa_link: link, canal: lead.canal, telefono: lead.telefono,
                      proximo_contacto_sugerido: new Date(Date.now() + (d.siguiente_contacto_horas || 24) * 3600e3).toISOString() },
          });
          resumen.propuestas++;
        } else {
          // "esperar": solo se deja constancia del diagnóstico, sin propuesta.
          const t = await iniciarTarea("seguimiento", "diagnostico", { tipo: "crm_conversation", id: lead.id }, base.entrada);
          await cerrarTarea(t, { diagnostico: d }, uso, "omitida");
        }
      } catch (e) {
        resumen.errores++;
        const t = await iniciarTarea("seguimiento", "error_lead", { tipo: "crm_conversation", id: lead.id });
        await fallarTarea(t, e);
      }
    }
    await cerrarTarea(corrida, resumen, { modelo: MODELO_REDACTOR, tokens: tokensTotal });
    return json(resumen);
  } catch (e) {
    await fallarTarea(corrida, e, resumen);
    return json({ error: e instanceof Error ? e.message : String(e), resumen }, 500);
  }
});
