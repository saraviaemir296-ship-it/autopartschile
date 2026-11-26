// AGENTE PRECIO DE MERCADO. Busca cada pieza en Mercado Libre Chile (usados) y guarda la mediana real
// en products.metadata.precio_mercado. Regla 2: la IA SUGIERE (precio_sugerido), Emir fija el final.
//  - Pieza sin precio fijado (precio_estado = 'pendiente'): escribe precio_sugerido = mediana redondeada.
//  - Pieza con precio fijado muy sobre el mercado (> 30 % y 5+ avisos): propone ajustar (requiere OK).
// Nunca toca price_sale solo. Disparador: pg_cron diario (agente_lanzar con nonce) o POST de un admin.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { autorizar, cerrarTarea, clp, db, fallarTarea, hayPropuestaPendiente, iniciarTarea, json, proponer } from "./agente.ts";

const MAX_PIEZAS = 20;          // avisos de ML por corrida (límite de cuota)
const DIAS_VIGENCIA = 30;       // se vuelve a buscar cada 30 días
const SOBREPRECIO = 1.30;       // propone ajuste si price_sale > mediana * 1.30
const MIN_AVISOS = 5;

interface Prod { id: number; sku: string; name: string; price_sale: number | null; precio_estado: string; precio_sugerido: number | null; vehicle_compatibility: unknown; metadata: Record<string, unknown> | null; }

function consulta(p: Prod): string {
  // nombre sin N° OEM, sin colores ni palabras de relleno; máximo 8 palabras
  let s = p.name.toLowerCase()
    .replace(/\b[0-9a-z]{2,6}-?[0-9a-z]{3,}\b/g, (m) => (/\d/.test(m) && m.replace(/-/g, "").length >= 7 ? "" : m))
    .replace(/\b(original|usado|usada|seminuevo|seminueva|completo|completa|rojo|roja|azul|gris|negro|negra|blanco|blanca|plata|plateado|oem|n°|nro|de|del|la|el|con|para|y)\b/g, " ")
    .replace(/[^a-záéíóúñ0-9.\s]/g, " ").replace(/\s+/g, " ").trim();
  return s.split(" ").slice(0, 8).join(" ");
}
const redondear = (n: number) => Math.max(1000, Math.round(n / 1000) * 1000 - 10); // 34.990 estilo precio chileno

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await autorizar(req, "precio_mercado"))) return json({ error: "no autorizado" }, 401);
  const t = await iniciarTarea("precio_mercado", "revision_precios");
  try {
    const { data: acc } = await db.from("meli_account").select("access_token, expires_at").eq("id", 1).maybeSingle();
    if (!acc?.access_token) throw new Error("meli_account sin access_token: conecta Mercado Libre en /admin/mercadolibre.html");
    if (acc.expires_at && new Date(acc.expires_at).getTime() < Date.now()) throw new Error("token de Mercado Libre vencido (meli_account.expires_at); las funciones meli-* lo renuevan al correr");
    const corte = new Date(Date.now() - DIAS_VIGENCIA * 86400000).toISOString();
    const { data: prods, error } = await db.from("products")
      .select("id, sku, name, price_sale, precio_estado, precio_sugerido, vehicle_compatibility, metadata")
      .eq("is_active", true).is("deleted_at", null).gt("stock", 0).not("part_status", "in", '("vendida","no_disponible")')
      .or(`metadata->precio_mercado->>fecha.is.null,metadata->precio_mercado->>fecha.lt.${corte}`)
      .order("precio_estado", { ascending: false })   // 'pendiente' antes que 'fijado'
      .order("updated_at", { ascending: false }).limit(MAX_PIEZAS);
    if (error) throw error;
    let buscadas = 0, sugeridos = 0, propuestas = 0, sinDatos = 0;
    const detalle: unknown[] = [];
    for (const p of (prods ?? []) as Prod[]) {
      const q = consulta(p); if (q.length < 4) continue;
      const r = await fetch(`https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(q)}&condition=used&limit=50`, { headers: { Authorization: `Bearer ${acc.access_token}` } });
      buscadas++;
      if (r.status === 401 || r.status === 403) throw new Error(`Mercado Libre respondió ${r.status} al buscar "${q}": ${(await r.text()).slice(0, 300)}`);
      const d = r.ok ? await r.json() : { results: [] };
      let precios: number[] = ((d.results ?? []) as { price: number; condition: string }[]).filter((x) => x.condition === "used" && x.price > 0).map((x) => x.price).sort((a, b) => a - b);
      // saca extremos (avisos de piezas distintas o lotes)
      if (precios.length >= 6) { const med = precios[Math.floor(precios.length / 2)]; precios = precios.filter((x) => x >= med * 0.3 && x <= med * 3); }
      const n = precios.length;
      const mediana = n ? precios[Math.floor(n / 2)] : null;
      const pm = { fuente: "mercadolibre", consulta: q, n, mediana, min: n ? precios[0] : null, max: n ? precios[n - 1] : null, fecha: new Date().toISOString() };
      const upd: Record<string, unknown> = { metadata: { ...(p.metadata ?? {}), precio_mercado: pm } };
      if (!n || !mediana) { sinDatos++; await db.from("products").update(upd).eq("id", p.id); detalle.push({ sku: p.sku, q, n: 0 }); continue; }
      const sug = redondear(mediana);
      if (p.precio_estado !== "fijado" && (p.precio_sugerido == null || Number(p.precio_sugerido) <= 0)) { upd.precio_sugerido = sug; sugeridos++; }
      await db.from("products").update(upd).eq("id", p.id);
      const actual = Number(p.price_sale) || 0;
      if (p.precio_estado === "fijado" && actual > 0 && n >= MIN_AVISOS && actual > mediana * SOBREPRECIO && !(await hayPropuestaPendiente("precio_mercado", "ajustar_precio", "product", p.id))) {
        await proponer({
          agente: "precio_mercado", accion: "ajustar_precio", entidad: { tipo: "product", id: p.id },
          propuesta: `${p.sku} · ${p.name}: está a ${clp(actual)} y en Mercado Libre hay ${n} avisos usados con mediana ${clp(mediana)} (rango ${clp(pm.min!)}–${clp(pm.max!)}). Sugerencia para vender más rápido: ${clp(sug)}. Al aprobar queda ese precio; si quieres otro, edita y escribe solo el número.`,
          entrada: { consulta: q }, salida: { precio_actual: actual, precio_sugerido: sug, mercado: pm },
        });
        propuestas++;
      }
      detalle.push({ sku: p.sku, q, n, mediana, actual, sugerido: sug });
    }
    const resumen = `Precio de mercado: ${buscadas} piezas buscadas en ML · ${sugeridos} precios sugeridos (pendientes de tu OK) · ${propuestas} ajustes propuestos · ${sinDatos} sin avisos comparables`;
    await cerrarTarea(t, { resumen, buscadas, sugeridos, propuestas, sin_datos: sinDatos, detalle });
    return json({ ok: true, resumen });
  } catch (e) {
    await fallarTarea(t, e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
