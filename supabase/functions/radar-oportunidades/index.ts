import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MELI_CLIENT_ID = Deno.env.get("MELI_CLIENT_ID") ?? "";
const MELI_CLIENT_SECRET = Deno.env.get("MELI_CLIENT_SECRET") ?? "";
const API = "https://api.mercadolibre.com";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Compra para desarme: sin restricción de marca, deuda, papeles o siniestro no declarado.
// Año mínimo 2000. El score es puramente valor de desarme/repuestos vs. precio.
const UMBRAL_SCORE = 70;
const ANIO_MINIMO = 2000;
const MAX_ITEMS_NUEVOS_POR_CORRIDA = 60;

interface MLItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail: string;
  attributes?: { id: string; value_name: string | null }[];
  address?: { state_name?: string; city_name?: string };
  location?: { state?: { name?: string }; city?: { name?: string } };
}

// Mercado Libre ya no responde búsquedas anónimas: se usa el token de la cuenta conectada (meli_account).
let meliToken: string | null = null;
async function token(): Promise<string | null> {
  if (meliToken) return meliToken;
  const { data: a } = await supabase.from("meli_account").select("*").eq("id", 1).maybeSingle();
  if (!a?.refresh_token) return null;
  if (a.access_token && new Date(a.expires_at).getTime() - Date.now() > 5 * 60_000) return (meliToken = a.access_token);
  const r = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: MELI_CLIENT_ID, client_secret: MELI_CLIENT_SECRET, refresh_token: a.refresh_token }),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) { console.error("No se pudo renovar token ML", r.status, t?.message); return null; }
  await supabase.from("meli_account").update({
    access_token: t.access_token, refresh_token: t.refresh_token ?? a.refresh_token,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 21600) * 1000).toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return (meliToken = t.access_token);
}

const fallos: string[] = [];
async function fetchMercadoLibre(params: string): Promise<MLItem[]> {
  const url = `${API}/sites/MLC/search?category=MLC1744&${params}&limit=50`;
  const tk = await token();
  const res = await fetch(url, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} });
  if (!res.ok) {
    const msg = `ML ${res.status} (${params}): ${(await res.text()).slice(0, 120)}`;
    console.error(msg);
    fallos.push(msg);
    return [];
  }
  const data = await res.json();
  return data.results ?? [];
}

function getAttr(item: MLItem, id: string): string | null {
  return item.attributes?.find((a) => a.id === id)?.value_name ?? null;
}

function getAnio(item: MLItem): number | null {
  const raw = getAttr(item, "VEHICLE_YEAR");
  return raw ? Number(raw) : null;
}

function ciudad(item: MLItem) {
  return item.address?.city_name ?? item.location?.city?.name ?? "?";
}
function region(item: MLItem) {
  return item.address?.state_name ?? item.location?.state?.name ?? "?";
}

async function scoreWithClaude(item: MLItem): Promise<{ score: number; analisis: string }> {
  const marca = getAttr(item, "BRAND") ?? "desconocida";
  const modelo = getAttr(item, "MODEL") ?? "desconocido";
  const anio = getAttr(item, "VEHICLE_YEAR") ?? "desconocido";
  const km = getAttr(item, "KILOMETERS") ?? "desconocido";

  const prompt = `Eres un tasador experto para un comprador chileno que adquiere vehículos EXCLUSIVAMENTE para desarme y venta de repuestos (no para revender el auto andando).

Contexto clave: al comprador NO le importa deuda, falta de papeles, o siniestro no declarado — de hecho esas cosas suelen ser la razón del precio bajo y no deben penalizar el score. Su único criterio es: valor total de repuestos aprovechables vs. precio de compra.

Analiza esta publicación de MercadoLibre Chile:
Título: ${item.title}
Marca: ${marca} | Modelo: ${modelo} | Año: ${anio} | Km: ${km}
Precio: $${item.price} CLP
Ubicación: ${ciudad(item)}, ${region(item)}

Evalúa el score basándote en:
- Cuán barato está vs. lo que valdrían sus repuestos por separado en el mercado chileno (motor, caja, planchadería, eléctrico, etc.)
- Si la marca/modelo tiene demanda de repuestos conocida en Chile (Suzuki, Kia, Hyundai, Chevrolet tienen demanda muy probada; otras marcas evalúalas por volumen de parque circulante en Chile)
- NO bajes el score por deuda, falta de papeles o siniestro — eso es irrelevante para desarme.
- Sí menciona si el título sugiere "encargo por robo" o lenguaje que indique vehículo robado (categoría legal distinta, requiere que el comprador lo verifique él mismo antes de comprar).

Devuelve SOLO un JSON (sin markdown, sin texto adicional) con este formato exacto:
{"score": <número 0-100, potencial de rentabilidad para desarme>, "analisis": "<máximo 2 frases en español sobre valor de repuestos vs precio>"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Claude API error: ${res.status} ${await res.text()}`);
    return { score: 0, analisis: "Error al analizar" };
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return { score: Number(parsed.score) || 0, analisis: String(parsed.analisis || "") };
  } catch {
    console.error("No se pudo parsear respuesta de Claude:", text);
    return { score: 0, analisis: "Error al parsear análisis" };
  }
}

async function sendTelegram(item: MLItem, score: number, analisis: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  const marca = getAttr(item, "BRAND") ?? "";
  const modelo = getAttr(item, "MODEL") ?? "";
  const anio = getAttr(item, "VEHICLE_YEAR") ?? "";
  const precio = Number(item.price).toLocaleString("es-CL");

  const msg = `🚨 Oportunidad desarme - Score ${score}/100\n\n` +
    `${marca} ${modelo} ${anio}\n` +
    `💰 $${precio} CLP\n` +
    `📍 ${ciudad(item)}\n\n` +
    `${analisis}\n\n` +
    `🔗 ${item.permalink}`;

  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, disable_web_page_preview: false }),
  });
  return r.ok;
}

Deno.serve(async (_req: Request) => {
  const resumen = { procesados: 0, nuevos: 0, descartados_por_anio: 0, notificados: 0, errores: 0, telegram_configurado: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID), fallos_ml: [] as string[] };

  // Solo autos bajo $1.500.000 con daño: chocados, motor malo, para desarme, con detalles.
  const PRECIO = "price=*-1500000";
  const fetches = [
    `${PRECIO}&q=${encodeURIComponent("chocado")}`,
    `${PRECIO}&q=${encodeURIComponent("motor malo")}`,
    `${PRECIO}&q=${encodeURIComponent("para desarme")}`,
    `${PRECIO}&q=${encodeURIComponent("fundido")}`,
    `${PRECIO}&q=${encodeURIComponent("siniestrado")}`,
    `${PRECIO}&q=${encodeURIComponent("no arranca")}`,
    `${PRECIO}&q=${encodeURIComponent("con detalles")}`,
    `${PRECIO}&sort=price_asc`,
  ];

  let nuevosScoreados = 0;

  for (const params of fetches) {
    if (nuevosScoreados >= MAX_ITEMS_NUEVOS_POR_CORRIDA) break;
    const items = await fetchMercadoLibre(params);

    for (const item of items) {
      if (nuevosScoreados >= MAX_ITEMS_NUEVOS_POR_CORRIDA) break;
      resumen.procesados++;

      const anioItem = getAnio(item);
      if ((anioItem !== null && anioItem < ANIO_MINIMO) || Number(item.price) > 1_500_000) {
        resumen.descartados_por_anio++;
        continue;
      }

      const { data: existente } = await supabase
        .from("oportunidades")
        .select("id")
        .eq("fuente", "mercadolibre")
        .eq("fuente_id", item.id)
        .maybeSingle();

      if (existente) continue;
      resumen.nuevos++;
      nuevosScoreados++;

      try {
        const { score, analisis } = await scoreWithClaude(item);
        const notificar = score >= UMBRAL_SCORE;
        const enviado = notificar ? await sendTelegram(item, score, analisis) : false;

        const { error: insertError } = await supabase.from("oportunidades").insert({
          fuente: "mercadolibre",
          fuente_id: item.id,
          titulo: item.title,
          marca: getAttr(item, "BRAND"),
          modelo: getAttr(item, "MODEL"),
          anio: anioItem,
          precio_clp: item.price,
          url: item.permalink,
          ubicacion: `${ciudad(item)}, ${region(item)}`,
          imagen_url: item.thumbnail,
          score_ia: score,
          analisis_ia: analisis,
          estado: enviado ? "notificada" : "nueva",
          notificada_at: enviado ? new Date().toISOString() : null,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          resumen.errores++;
          continue;
        }
        if (enviado) resumen.notificados++;
      } catch (e) {
        console.error("Error procesando item:", item.id, e);
        resumen.errores++;
      }
    }
  }

  resumen.fallos_ml = fallos.slice(0, 3);
  return new Response(JSON.stringify(resumen), {
    headers: { "Content-Type": "application/json" },
  });
});
