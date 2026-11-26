// CATALOGADOR CON VISIÓN. Lee el número de parte (OEM) en la foto de la pieza con Claude y lo PROPONE (regla 1: sin N° de
// parte no se publica; regla general: la IA propone, Emir aprueba). Diario, 15 piezas por corrida, las de más valor primero.
// Necesita ANTHROPIC_API_KEY. Al aprobar la tarea, el trigger agente_tareas_ejecutar_precio escribe products.oem_number.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { autorizar, cerrarTarea, claudeJSON, db, fallarTarea, hayPropuestaPendiente, iniciarTarea, json, MODELO_RAPIDO, proponer } from "./agente.ts";

const MAX = 15;
const SITE = "https://autopartschile.cl";
interface Lectura { numero_parte: string | null; confianza: "alta" | "media" | "baja"; donde: string; otros_numeros: string[]; marca_pieza: string | null; }

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await autorizar(req, "catalogador"))) return json({ error: "no autorizado" }, 401);
  const t = await iniciarTarea("catalogador", "leer_numeros_parte");
  try {
    const { data: prods, error } = await db.from("products").select("id, sku, name, images, metadata, vehiculo_id")
      .eq("is_active", true).is("deleted_at", null).gt("stock", 0).not("part_status", "in", '("vendida","no_disponible")')
      .or("oem_number.is.null,oem_number.eq.").not("images", "is", null).neq("images", "[]")
      .is("metadata->>vision_oem_at", null).order("price_sale", { ascending: false }).limit(MAX);
    if (error) throw error;
    let leidas = 0, propuestas = 0, sinNumero = 0, tokens = 0;
    for (const p of prods ?? []) {
      if (await hayPropuestaPendiente("catalogador", "sugerir_numero_parte", "product", p.id)) continue;
      const urls = (p.images as string[]).filter((u) => typeof u === "string" && u).slice(0, 3).map((u) => (/^https?:/.test(u) ? u : SITE + (u.startsWith("/") ? "" : "/") + u));
      if (!urls.length) continue;
      const { data: r, uso } = await claudeJSON<Lectura>({
        modelo: MODELO_RAPIDO, maxTokens: 400, imagenesUrl: urls,
        system: "Eres catalogador de una desarmaduría de autos en Chile. Miras fotos de UNA pieza usada y buscas el número de parte OEM grabado, estampado o en etiqueta (ej. 33910-71LA0, 48150M53M20, 0 261 S05 790). Responde JSON: {\"numero_parte\": string|null, \"confianza\": \"alta\"|\"media\"|\"baja\", \"donde\": \"dónde está escrito\", \"otros_numeros\": [], \"marca_pieza\": string|null}. Si no se lee con claridad, numero_parte = null. Nunca inventes.",
        user: `Pieza: ${p.name} (SKU ${p.sku}). ¿Qué número de parte se lee en las fotos?`,
      });
      leidas++; tokens += uso.tokens;
      await db.from("products").update({ metadata: { ...(p.metadata ?? {}), vision_oem_at: new Date().toISOString(), vision_oem: r } }).eq("id", p.id);
      if (r?.numero_parte && r.confianza !== "baja") {
        await proponer({ agente: "catalogador", accion: "sugerir_numero_parte", entidad: { tipo: "product", id: p.id }, modelo: uso.modelo, tokens: uso.tokens,
          propuesta: `${p.sku} · ${p.name}: en la foto se lee el N° de parte ${r.numero_parte} (${r.donde}; confianza ${r.confianza}${r.otros_numeros?.length ? "; otros: " + r.otros_numeros.join(", ") : ""}). Al aprobar queda cargado y la pieza pasa a publicable si tiene foto, imagen promocional y precio. Si está mal, edita y escribe el número correcto.`,
          salida: { oem: r.numero_parte, lectura: r, fotos: urls } });
        propuestas++;
      } else sinNumero++;
    }
    const resumen = `Catalogador: ${leidas} piezas leídas · ${propuestas} números propuestos (esperan tu OK) · ${sinNumero} sin número legible`;
    await cerrarTarea(t, { resumen, leidas, propuestas, sin_numero: sinNumero }, { modelo: MODELO_RAPIDO, tokens });
    return json({ ok: true, resumen });
  } catch (e) { await fallarTarea(t, e); return json({ error: e instanceof Error ? e.message : String(e) }, 500); }
});
