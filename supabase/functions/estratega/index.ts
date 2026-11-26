// AGENTE ESTRATEGA · "mente maestra". Lunes 7:30 (y a pedido). Arma el dossier con TODOS los números reales
// (estratega_dossier()), se lo pasa a Claude con el prompt de la mente maestra (docs/equipo-ia/mente_maestra_prompt.md)
// y deja: 1) el informe en agente_tareas (informe_semanal) con aviso al celular, 2) cada acción de la semana como
// tarea que Emir aprueba (= se compromete) o rechaza. Sin ANTHROPIC_API_KEY deja el dossier listo para pegar a mano.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { ANTHROPIC_KEY, autorizar, cerrarTarea, claudeJSON, db, fallarTarea, hayPropuestaPendiente, iniciarTarea, json, MODELO_REDACTOR, proponer } from "./agente.ts";

const SISTEMA = `Eres la MENTE MAESTRA de Desarmaduría Saravia / AutopartsChile (La Pintana, Santiago de Chile): desarmaduría de autos, venta de repuestos originales usados y nuevos importados (especialidad Suzuki; también Chevrolet, Kia, Hyundai, Peugeot, Audi, Jeep), con grúa (Grúas Saravia) e importación OEM desde India. Dueño: Emir. Vende por WhatsApp, Marketplace y grupos de Facebook, Mercado Libre, el local y el sitio autopartschile.cl.
Hablas en español de Chile, directo, sin adornos. Tu trabajo no es animar: es encontrar dónde se pierde plata y tiempo, y decir qué hacer esta semana.
Razonas con diez lentes y las nombras cuando aplican:
1. Alex Hormozi: ecuación de valor (resultado soñado × probabilidad percibida ÷ tiempo de espera × esfuerzo), oferta irresistible (Grand Slam Offer: garantía, bonos, urgencia, nombre), los "core four" para conseguir clientes (contacto directo, contenido, anuncios pagados, referidos) y la regla "más, mejor, nuevo": primero hacer MÁS de lo que ya funciona antes de inventar algo nuevo. Siempre pregunta cuál es LA restricción única que frena el crecimiento ahora.
2. Eliyahu Goldratt (Teoría de restricciones): identifica el cuello de botella, explótalo, subordina todo lo demás, elévalo; cualquier mejora fuera del cuello es un espejismo.
3. Taiichi Ohno (Toyota): desperdicio (esperas, movimientos, inventario parado, retrabajo), flujo, ir a ver al terreno, cinco porqués.
4. Jeff Bezos: obsesión por el cliente, trabajar hacia atrás desde la experiencia del cliente, decisiones de puerta de dos vías (rápido) vs. de una vía (pensadas), el volante que se acelera solo.
5. Charlie Munger y Warren Buffett: invertir el problema, incentivos, margen de seguridad, círculo de competencia, evitar la estupidez antes que buscar la genialidad.
6. Peter Drucker: lo que no se mide no se gestiona; el propósito del negocio es crear un cliente; abandono planificado de lo que no rinde.
7. Dan Kennedy y Gary Halbert (respuesta directa): la oferta manda, seguimiento implacable, urgencia real, la lista de clientes es el activo.
8. Sam Walton: austeridad, copiar sin vergüenza lo que funciona a la competencia, estar en el piso.
9. Andy Grove: solo los paranoicos sobreviven; tu tiempo rinde donde tiene palanca.
10. Naval Ravikant: palanca (código, medios, capital, gente); conocimiento específico.
Reglas duras:
- Usa SOLO los números del dossier. Si falta un dato clave, dilo en "datos_que_faltan" y no lo rellenes.
- Prioriza. Un solo cuello de botella principal. Máximo tres acciones para esta semana, cada una con responsable, métrica y plazo.
- Nada de consejos genéricos. Cada acción debe poder empezarse mañana con lo que hay.
- Di también qué DEJAR de hacer. Sé incómodo cuando corresponda.
- Respeta las reglas del negocio: ningún repuesto se publica sin N° de parte, foto e imagen con autos compatibles; la IA sugiere precios y Emir fija; nada sale a un cliente sin su OK; garantía en todo menos piezas eléctricas.
Responde SOLO con JSON válido con esta forma:
{"diagnostico":"3 a 5 frases con números","cuello_de_botella":{"cual":"...","evidencia":"...","lente":"..."},"acciones_semana":[{"titulo":"...","que_hacer":"...","responsable":"...","metrica":"...","plazo":"...","lente":"..."}],"dejar_de_hacer":["..."],"oferta":{"hoy":"...","mejora":"..."},"numeros_a_vigilar":[{"nombre":"...","valor_hoy":"...","meta_30_dias":"..."}],"datos_que_faltan":["..."],"pregunta_incomoda":"..."}`;

interface Accion { titulo: string; que_hacer: string; responsable: string; metrica: string; plazo: string; lente?: string; }
interface Informe {
  diagnostico: string; cuello_de_botella: { cual: string; evidencia: string; lente?: string };
  acciones_semana: Accion[]; dejar_de_hacer: string[]; oferta: { hoy: string; mejora: string };
  numeros_a_vigilar: { nombre: string; valor_hoy: string; meta_30_dias: string }[]; datos_que_faltan: string[]; pregunta_incomoda: string;
}
function render(i: Informe, fecha: string): string {
  const L: string[] = [];
  L.push(`🧭 MENTE MAESTRA · semana del ${fecha}`, "", "DIAGNÓSTICO", i.diagnostico, "", `CUELLO DE BOTELLA (${i.cuello_de_botella.lente ?? ""})`, i.cuello_de_botella.cual, "Evidencia: " + i.cuello_de_botella.evidencia, "", "ACCIONES DE LA SEMANA");
  (i.acciones_semana ?? []).forEach((a, k) => L.push(`${k + 1}. ${a.titulo} [${a.lente ?? ""}]`, `   Qué hacer: ${a.que_hacer}`, `   Responsable: ${a.responsable} · Métrica: ${a.metrica} · Plazo: ${a.plazo}`));
  L.push("", "DEJAR DE HACER", ...(i.dejar_de_hacer ?? []).map((x) => "• " + x), "", "OFERTA", "Hoy: " + i.oferta?.hoy, "Mejora: " + i.oferta?.mejora, "", "NÚMEROS A VIGILAR");
  (i.numeros_a_vigilar ?? []).forEach((n) => L.push(`• ${n.nombre}: hoy ${n.valor_hoy} → meta 30 d ${n.meta_30_dias}`));
  if (i.datos_que_faltan?.length) L.push("", "DATOS QUE FALTAN", ...i.datos_que_faltan.map((x) => "• " + x));
  L.push("", "PREGUNTA INCÓMODA", i.pregunta_incomoda);
  return L.join("\n");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await autorizar(req, "estratega"))) return json({ error: "no autorizado" }, 401);
  const t = await iniciarTarea("estratega", "informe_semanal");
  const fecha = new Date().toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "2-digit", month: "2-digit", year: "numeric" });
  try {
    const { data: dossier, error } = await db.rpc("estratega_dossier");
    if (error || !dossier) throw new Error("estratega_dossier: " + (error?.message ?? "vacío"));
    if (!ANTHROPIC_KEY) {
      // Sin clave: deja el dossier listo para que Emir lo pegue con el prompt en ChatGPT/Claude.
      await db.from("agente_tareas").insert({ agente: "estratega", accion: "dossier_semanal", entidad_tipo: "semana", entidad_id: fecha, resultado: "omitida",
        propuesta: "Sin ANTHROPIC_API_KEY no puedo analizar. Copia este dossier y pégalo junto con el prompt de docs/equipo-ia/mente_maestra_prompt.md en ChatGPT o Claude.\n\n" + dossier, salida: { largo: String(dossier).length } });
      await cerrarTarea(t, { resumen: "dossier dejado, sin análisis (falta ANTHROPIC_API_KEY)" }, undefined, "omitida");
      return json({ ok: true, sin_clave: true });
    }
    const { data: inf, uso } = await claudeJSON<Informe>({ system: SISTEMA, user: "DOSSIER:\n\n" + dossier, modelo: MODELO_REDACTOR, maxTokens: 3000 });
    const texto = render(inf, fecha);
    const { data: row } = await db.from("agente_tareas").insert({ agente: "estratega", accion: "informe_semanal", entidad_tipo: "semana", entidad_id: fecha, propuesta: texto, salida: inf as unknown as Record<string, unknown>, modelo: uso.modelo, tokens: uso.tokens }).select("id").single();
    let n = 0;
    for (const a of inf.acciones_semana ?? []) {
      if (await hayPropuestaPendiente("estratega", "accion_semana", "accion", a.titulo.slice(0, 80))) continue;
      await proponer({ agente: "estratega", accion: "accion_semana", entidad: { tipo: "accion", id: a.titulo.slice(0, 80) },
        propuesta: `${a.titulo}\n${a.que_hacer}\nResponsable: ${a.responsable} · Métrica: ${a.metrica} · Plazo: ${a.plazo}\n(Aprobar = te comprometes esta semana; rechazar = no va.)`, salida: { ...a, informe_id: row?.id } });
      n++;
    }
    await db.rpc("notificar", { p_titulo: "🧭 Mente maestra: informe de la semana", p_texto: inf.cuello_de_botella?.cual?.slice(0, 120) ?? "informe listo", p_url: "/admin/equipo-ia.html#resumen", p_dedupe: "estratega:" + fecha });
    await cerrarTarea(t, { informe_id: row?.id, acciones: n, cuello: inf.cuello_de_botella?.cual }, uso);
    return json({ ok: true, informe_id: row?.id, acciones: n });
  } catch (e) {
    await fallarTarea(t, e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
