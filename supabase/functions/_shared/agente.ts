// Librería común del "equipo IA" (fase 2.0). La usan todas las edge functions de agentes.
// Reglas que impone por diseño:
//  - Cada corrida queda en agente_tareas (entrada, salida, modelo, tokens, duración, error).
//  - Nada que salga hacia un cliente/canal se ejecuta aquí: se registra como PROPUESTA
//    (requiere_aprobacion = true) y la ejecuta crm-outbox-worker solo cuando Emir aprueba.
//  - Español de Chile; nunca inventar precio, stock ni compatibilidad: eso lo valida el
//    llamador leyendo v_repuestos; la IA solo redacta sobre datos que se le pasan.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export type Agente =
  | "recepcionista" | "cotizador" | "seguimiento" | "red_desarmadurias"
  | "catalogador" | "disenador" | "publicador" | "ingreso_vehiculo"
  | "radar" | "despacho" | "cierre_dia" | "auditor" | "cotizador_grua" | "sistema";

export const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
export const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
export const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
export const MODELO_RAPIDO = Deno.env.get("MODELO_RAPIDO") ?? "claude-haiku-4-5-20251001";
export const MODELO_REDACTOR = Deno.env.get("MODELO_REDACTOR") ?? "claude-sonnet-4-6";

export const NEGOCIO = {
  nombre: "Desarmaduría Saravia / AutopartsChile",
  direccion: "Av. Lo Blanco 1072, La Pintana, Santiago",
  patio: "Guacolda 2050, La Pintana",
  whatsapp: "+56 9 5381 7335",
  whatsappLink: "https://wa.me/56953817335",
  web: "https://autopartschile.cl",
  horario: "Lun–Vie 10:00–18:00, Sáb 10:00–15:30",
  // Política vigente (publicar-repuestos-marketplace, 12-nov-2026). Si Emir la cambia, se cambia aquí.
  garantiaMecanica: "garantía de funcionamiento 7 días",
  garantiaElectrica: "sin garantía posventa (pieza eléctrica/electrónica); se prueba antes de la entrega con video",
};

export const db: SupabaseClient = createClient(SB_URL, SERVICE_KEY, { auth: { persistSession: false } });

export const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json; charset=utf-8" } });

/** Quién puede invocar un agente: service role, pg_cron con nonce de un solo uso (agente_lanzar) o Emir (admin). */
export async function autorizar(req: Request, agente: Agente): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const tk = auth.replace(/^Bearer\s+/i, "");
  if (!tk) return false;
  if (tk === SERVICE_KEY) return true;
  const nonce = req.headers.get("x-agente-nonce");
  if (nonce) {
    const { data, error } = await db.rpc("agente_nonce_consumir", { p_nonce: nonce, p_agente: agente });
    return !error && data === true;
  }
  const anon = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: `Bearer ${tk}` } }, auth: { persistSession: false },
  });
  const { data, error } = await anon.rpc("is_admin");
  return !error && data === true;
}

export function esElectrica(nombre: string, categoria?: string | null): boolean {
  const t = `${nombre} ${categoria ?? ""}`.toLowerCase();
  return /el[eé]ctric|electr[oó]nic|computador|ecu|sensor|m[oó]dulo|bobina|alternador|motor de partida|radio|pantalla|tablero|switch|rel[eé]|airbag|bcm|abs\b/.test(t);
}

export function garantiaPara(nombre: string, categoria?: string | null): string {
  return esElectrica(nombre, categoria) ? NEGOCIO.garantiaElectrica : NEGOCIO.garantiaMecanica;
}

export const clp = (n: number | string | null | undefined) =>
  n == null ? "" : "$" + Math.round(Number(n)).toLocaleString("es-CL");

/** Enlace para que Emir envíe el mensaje con un toque desde el celular (no requiere API de WhatsApp). */
export function waLink(telefono: string | null | undefined, texto: string): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  const num = digits.startsWith("56") ? digits : digits.length === 9 ? "56" + digits : digits.length === 8 ? "569" + digits : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

export async function enHorario(ts = new Date()): Promise<boolean> {
  const { data, error } = await db.rpc("crm_in_business_hours", { p_ts: ts.toISOString() });
  if (error) {
    // Respaldo local si la función no está disponible.
    const scl = new Date(ts.toLocaleString("en-US", { timeZone: "America/Santiago" }));
    const d = scl.getDay(), m = scl.getHours() * 60 + scl.getMinutes();
    if (d === 0) return false;
    if (d === 6) return m >= 600 && m <= 930;
    return m >= 600 && m <= 1080;
  }
  return data === true;
}

// ---------------------------------------------------------------- agente_tareas
export interface TareaCtx { id: number; agente: Agente; accion: string; t0: number; }

export async function iniciarTarea(agente: Agente, accion: string, entidad?: { tipo: string; id: string | number }, entrada: unknown = {}): Promise<TareaCtx> {
  const { data, error } = await db.from("agente_tareas").insert({
    agente, accion, entidad_tipo: entidad?.tipo ?? null, entidad_id: entidad ? String(entidad.id) : null,
    entrada, resultado: "ok",
  }).select("id").single();
  if (error) throw new Error("agente_tareas insert: " + error.message);
  return { id: data.id, agente, accion, t0: Date.now() };
}

export async function cerrarTarea(t: TareaCtx, salida: unknown, uso?: { modelo?: string; tokens?: number }, resultado: "ok" | "omitida" = "ok") {
  await db.from("agente_tareas").update({
    salida, resultado, duracion_ms: Date.now() - t.t0, modelo: uso?.modelo ?? null, tokens: uso?.tokens ?? null,
  }).eq("id", t.id);
}

export async function fallarTarea(t: TareaCtx, err: unknown, salida: unknown = {}) {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(`[${t.agente}/${t.accion}]`, msg);
  await db.from("agente_tareas").update({
    resultado: "error", error: msg.slice(0, 2000), salida, duracion_ms: Date.now() - t.t0,
  }).eq("id", t.id);
}

/** Deja una acción esperando el sí de Emir. `propuesta` es lo que él lee en el celular. */
export async function proponer(p: {
  agente: Agente; accion: string; entidad?: { tipo: string; id: string | number };
  propuesta: string; entrada?: unknown; salida?: unknown; modelo?: string; tokens?: number; duracion_ms?: number;
}): Promise<number> {
  const { data, error } = await db.from("agente_tareas").insert({
    agente: p.agente, accion: p.accion,
    entidad_tipo: p.entidad?.tipo ?? null, entidad_id: p.entidad ? String(p.entidad.id) : null,
    entrada: p.entrada ?? {}, salida: p.salida ?? {}, propuesta: p.propuesta,
    requiere_aprobacion: true, estado_aprobacion: "pendiente",
    modelo: p.modelo ?? null, tokens: p.tokens ?? null, duracion_ms: p.duracion_ms ?? null,
  }).select("id").single();
  if (error) throw new Error("proponer: " + error.message);
  return data.id;
}

/** ¿Ya hay una propuesta pendiente para esta entidad y acción? Evita duplicar en cada corrida. */
export async function hayPropuestaPendiente(agente: Agente, accion: string, entidadTipo: string, entidadId: string | number): Promise<boolean> {
  const { count } = await db.from("agente_tareas").select("id", { count: "exact", head: true })
    .eq("agente", agente).eq("accion", accion).eq("entidad_tipo", entidadTipo).eq("entidad_id", String(entidadId))
    .eq("estado_aprobacion", "pendiente");
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------- Claude
export interface ClaudeUso { modelo: string; tokens: number; }

/** Pide a Claude un JSON y lo valida. Lanza error si la API falla o la respuesta no es JSON. */
export async function claudeJSON<T>(opts: {
  system: string; user: string; modelo?: string; maxTokens?: number; imagenesUrl?: string[];
}): Promise<{ data: T; uso: ClaudeUso }> {
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY no configurada");
  const modelo = opts.modelo ?? MODELO_RAPIDO;
  const content: unknown[] = [];
  for (const url of opts.imagenesUrl ?? []) content.push({ type: "image", source: { type: "url", url } });
  content.push({ type: "text", text: opts.user });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: modelo, max_tokens: opts.maxTokens ?? 1200,
      system: opts.system + "\nResponde SOLO con un objeto JSON válido, sin markdown ni texto adicional.",
      messages: [{ role: "user", content }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const body = await r.json();
  const text: string = body?.content?.[0]?.text ?? "";
  const clean = text.replace(/```json|```/g, "").trim();
  let data: T;
  try { data = JSON.parse(clean) as T; } catch { throw new Error("Claude no devolvió JSON: " + clean.slice(0, 200)); }
  const tokens = (body?.usage?.input_tokens ?? 0) + (body?.usage?.output_tokens ?? 0);
  return { data, uso: { modelo, tokens } };
}
