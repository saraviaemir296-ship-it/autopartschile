// Módulo compartido Webpay Plus (Transbank REST v1.3) para webpay-create-transaction,
// webpay-confirm y webpay-reconcile. Se despliega como ./webpay_lib.ts dentro de cada función
// (scripts/sync-webpay-lib.sh copia este archivo). Editar SOLO este original.

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SITE_URL = "https://autopartschile.cl";
const TX_PATH = "/rswebpaytransaction/api/webpay/v1.3/transactions";
const TBK_TIMEOUT_MS = 15000;
const STALE_CLAIM_MS = 2 * 60 * 1000;

const INTEGRATION = {
  name: "integration" as const,
  base: "https://webpay3gint.transbank.cl",
  code: "597055555532",
  key: "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C",
};

export type WebpayEnv = { name: "integration" | "production"; base: string; code: string; key: string };

// Falla cerrado: solo "production" o "integration" (o vacío = integration). Cualquier otro valor es error.
export function currentEnv(): { env?: WebpayEnv; error?: string } {
  const raw = (Deno.env.get("WEBPAY_ENV") ?? "").trim();
  if (raw === "" || raw === "integration") return { env: INTEGRATION };
  if (raw === "production") return envByName("production");
  return { error: `WEBPAY_ENV inválido: "${raw}" (usar "production" o "integration")` };
}

export function envByName(name: string | null | undefined): { env?: WebpayEnv; error?: string } {
  if (!name) return currentEnv();
  if (name === "integration") return { env: INTEGRATION };
  if (name === "production") {
    const code = Deno.env.get("WEBPAY_COMMERCE_CODE") ?? "";
    const key = Deno.env.get("WEBPAY_API_KEY") ?? "";
    if (!code || !key) return { error: "Producción sin WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY" };
    return { env: { name: "production", base: "https://webpay3g.transbank.cl", code, key } };
  }
  return { error: `Ambiente desconocido: ${name}` };
}

export function getServiceRoleKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].api_key ?? parsed[0].secret ?? String(parsed[0]);
      if (parsed && typeof parsed === "object") {
        const vals = Object.values(parsed);
        if (vals.length > 0) return String(vals[0]);
      }
    } catch (_e) { /* fall through */ }
  }
  throw new Error("No service role key available");
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, getServiceRoleKey(), { auth: { persistSession: false } });
}

export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export type TbkResult =
  | { kind: "ok"; data: any }
  | { kind: "client_error"; status: number; data: any } // 4xx: respuesta definitiva de Transbank
  | { kind: "unknown"; detail: string }; // timeout, red o 5xx: no sabemos qué pasó

export async function tbkRequest(env: WebpayEnv, method: "POST" | "PUT" | "GET", path: string, body?: unknown): Promise<TbkResult> {
  try {
    const res = await fetchWithTimeout(`${env.base}${TX_PATH}${path}`, {
      method,
      headers: { "Tbk-Api-Key-Id": env.code, "Tbk-Api-Key-Secret": env.key, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }, TBK_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { kind: "ok", data };
    if (res.status >= 400 && res.status < 500) return { kind: "client_error", status: res.status, data };
    return { kind: "unknown", detail: `HTTP ${res.status} ${JSON.stringify(data).slice(0, 300)}` };
  } catch (e) {
    return { kind: "unknown", detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export async function notify(text: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
  const chat = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
  if (!token || !chat) {
    console.error("notify: Telegram no configurado. Mensaje:", text);
    return false;
  }
  try {
    const r = await fetchWithTimeout(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    }, 8000);
    if (!r.ok) console.error("notify: Telegram respondió", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (e) {
    console.error("notify: fallo Telegram", String(e), "Mensaje:", text);
    return false;
  }
}

export const ORDER_COLS = "id, status, total, webpay_token, webpay_buy_order, webpay_session_id, webpay_status, webpay_env, receipt_key, review_reason";

export type Order = {
  id: number;
  status: string;
  total: number | string;
  webpay_token: string | null;
  webpay_buy_order: string | null;
  webpay_session_id: string | null;
  webpay_status: string | null;
  webpay_env: string | null;
  receipt_key: string;
  review_reason: string | null;
};

export function clp(n: number | string) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
}

// Reclama la orden para confirmar. Solo una ejecución a la vez; un reclamo de más de
// 2 minutos se considera abandonado (la función murió) y se puede volver a reclamar.
export async function claimOrder(supabase: SupabaseClient, orderId: number): Promise<{ order: Order | null; error: unknown }> {
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ webpay_status: "COMMITTING", commit_claimed_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending")
    .or(`webpay_status.in.(created,NEEDS_STATUS_CHECK),and(webpay_status.eq.COMMITTING,commit_claimed_at.lt.${staleBefore})`)
    .select(ORDER_COLS);
  return { order: data && data.length > 0 ? (data[0] as Order) : null, error };
}

async function updateWithRetry(supabase: SupabaseClient, orderId: number, patch: Record<string, unknown>, onlyIfPending: boolean) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let q = supabase.from("orders").update(patch).eq("id", orderId);
    if (onlyIfPending) q = q.eq("status", "pending");
    const { data, error } = await q.select(ORDER_COLS);
    if (!error) return { rows: (data ?? []) as Order[], error: null };
    console.error("updateWithRetry: error", JSON.stringify({ orderId, attempt, error }));
    await new Promise((r) => setTimeout(r, 700));
  }
  return { rows: [] as Order[], error: "update_failed" };
}

async function decrementStock(supabase: SupabaseClient, orderId: number): Promise<{ missing: string[]; items: any[] }> {
  const { data: items, error } = await supabase.from("order_items").select("product_id, sku, name, quantity").eq("order_id", orderId);
  if (error) {
    console.error("decrementStock: no se pudieron leer los ítems", JSON.stringify({ orderId, error }));
    return { missing: ["(no se pudieron leer los ítems)"], items: [] };
  }
  const missing: string[] = [];
  for (const it of items ?? []) {
    if (!it.product_id || !it.quantity) continue;
    const { data: ok, error: rpcErr } = await supabase.rpc("try_decrement_product_stock", { p_product_id: it.product_id, p_qty: it.quantity });
    if (rpcErr || ok !== true) {
      missing.push(it.sku);
      console.error("decrementStock: sin stock o error", JSON.stringify({ orderId, sku: it.sku, rpcErr }));
    }
  }
  return { missing, items: items ?? [] };
}

export type SettleResult = "completed" | "cancelled" | "pending" | "processing";

// Confirma (commit) una orden YA RECLAMADA y deja su estado final. Reglas:
//  - PUT 2xx → usar respuesta. PUT 4xx → GET; solo AUTHORIZED cuenta como pagado, otro estado = no pagado.
//  - PUT timeout/5xx → reintentar PUT una vez; si sigue sin saberse → GET; si GET no confirma un
//    pago → NEEDS_STATUS_CHECK (nunca cancelar sin una respuesta definitiva).
//  - Todos los cambios de estado son condicionales (status = pending) y se verifica el error.
export async function settleClaimedOrder(supabase: SupabaseClient, order: Order, prevWebpayStatus: string | null): Promise<SettleResult> {
  const token = order.webpay_token;
  const envRes = envByName(order.webpay_env);
  if (!token || !envRes.env) {
    await updateWithRetry(supabase, order.id, { webpay_status: "NEEDS_STATUS_CHECK", commit_claimed_at: null, review_reason: `No se puede confirmar: ${!token ? "orden sin token" : envRes.error}` }, true);
    await notify(`⚠️ Webpay: pedido #${order.id} no se puede confirmar (${!token ? "sin token" : envRes.error}). Revisar.`);
    return "pending";
  }
  const env = envRes.env;
  const tokPath = `/${encodeURIComponent(token)}`;

  let tx: any = null;
  let definitive = false; // true si Transbank dio una respuesta clara (pagado o no pagado)

  let put = await tbkRequest(env, "PUT", tokPath);
  if (put.kind === "unknown") {
    console.error("settle: PUT sin respuesta, reintento", put.detail);
    await new Promise((r) => setTimeout(r, 1000));
    put = await tbkRequest(env, "PUT", tokPath);
  }
  if (put.kind === "ok") {
    tx = put.data;
    definitive = true;
  } else {
    if (put.kind === "client_error") console.error("settle: PUT 4xx", put.status, JSON.stringify(put.data));
    const get = await tbkRequest(env, "GET", tokPath);
    if (get.kind === "ok") {
      tx = get.data;
      // Tras un 4xx, el GET es definitivo. Tras un timeout, solo es definitivo si muestra AUTHORIZED.
      definitive = put.kind === "client_error" || (get.data?.status === "AUTHORIZED" && get.data?.response_code === 0);
    }
  }

  if (!tx || !tx.status || !definitive) {
    await updateWithRetry(supabase, order.id, { webpay_status: "NEEDS_STATUS_CHECK", commit_claimed_at: null, review_reason: "Transbank no dio una respuesta clara al confirmar. Puede estar cobrado: revisar en el portal." }, true);
    if (prevWebpayStatus !== "NEEDS_STATUS_CHECK") {
      await notify(`⚠️ Webpay${env.name === "production" ? "" : " PRUEBA"}: no se pudo confirmar el pedido #${order.id} (${order.webpay_buy_order}). Puede estar cobrado. Se reintentará solo; si persiste, revisar en el portal de Transbank.`);
    }
    return "pending";
  }

  const expected = Math.round(Number(order.total));
  const authorized = tx.status === "AUTHORIZED" && tx.response_code === 0;
  const matches = Number(tx.amount) === expected && tx.buy_order === order.webpay_buy_order;
  const label = env.name === "production" ? "" : " PRUEBA";

  if (authorized && !matches) {
    const r = await updateWithRetry(supabase, order.id, { status: "processing", webpay_status: "AUTHORIZED_MISMATCH", webpay_detail: tx, commit_claimed_at: null, review_reason: `Monto u orden no coinciden: Transbank ${tx.amount}/${tx.buy_order}, orden ${expected}/${order.webpay_buy_order}` }, true);
    await notify(`🚨 Webpay${label}: pedido #${order.id} AUTORIZADO pero monto/orden no coinciden (${tx.amount} vs ${expected}). No despachar sin revisar.${r.error ? " (además falló el guardado en la base de datos)" : ""}`);
    return "processing";
  }

  if (!authorized) {
    const r = await updateWithRetry(supabase, order.id, { status: "cancelled", webpay_status: tx.status || "REJECTED", webpay_detail: tx, commit_claimed_at: null }, true);
    if (r.error) {
      await notify(`⚠️ Webpay${label}: pedido #${order.id} rechazado por Transbank pero no se pudo guardar en la base de datos.`);
      return "pending";
    }
    return "cancelled";
  }

  // Pagado y consistente.
  const done = await updateWithRetry(supabase, order.id, { status: "completed", webpay_status: "AUTHORIZED", webpay_detail: tx, commit_claimed_at: null, review_reason: null }, true);
  if (done.error) {
    // El cobro existe pero no quedó registrado. La orden sigue reclamada; el reconciliador la retomará.
    await notify(`🚨 Webpay${label}: pedido #${order.id} (${order.webpay_buy_order}) PAGADO ${clp(tx.amount)} (autorización ${tx.authorization_code}) pero no se pudo guardar en la base de datos. Se reintentará automáticamente; no reembolsar ni duplicar.`);
    return "pending";
  }
  if (done.rows.length === 0) {
    const { data: cur } = await supabase.from("orders").select("status").eq("id", order.id).single();
    return (cur?.status as SettleResult) ?? "pending";
  }

  const { missing, items } = await decrementStock(supabase, order.id);
  const lines = items.map((i) => `• ${i.quantity}× ${i.name} (${i.sku})`).join("\n");
  if (missing.length > 0) {
    await updateWithRetry(supabase, order.id, { review_reason: `Pagado pero sin stock: ${missing.join(", ")}. Contactar al cliente; si no hay pieza, devolver en el portal de Transbank.` }, false);
    await notify(`🚨 Venta web PAGADA${label} #${order.id} por ${clp(tx.amount)} pero SIN STOCK de: ${missing.join(", ")}.\nContactar al cliente; si no hay pieza, devolver en el portal de Transbank.\n${lines}`);
  } else {
    await notify(`✅ Venta web pagada (Webpay${label}) #${order.id} por ${clp(tx.amount)}\n${lines}\nAutorización ${tx.authorization_code} · tarjeta ****${tx.card_detail?.card_number ?? "?"}`);
  }
  return "completed";
}
