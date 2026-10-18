import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * AutopartsChile — Webpay Plus (Transbank) — retorno y confirmación (commit).
 *
 * v7 (2026-10-18) — revisión de pagos antes del paso a producción:
 *  1. Concurrencia: la orden se "reclama" con un UPDATE condicional antes del commit,
 *     así dos retornos simultáneos nunca hacen doble commit ni sobrescriben un pago
 *     aprobado con "cancelado". Todos los cambios de estado son condicionales.
 *  2. Commit con timeout o error: se consulta el estado real en Transbank
 *     (GET /transactions/{token}) antes de decidir. Si sigue sin saberse, la orden
 *     queda pendiente de revisión y se avisa por Telegram; nunca se marca fallida a ciegas.
 *  3. Se valida que monto y orden de compra que responde Transbank coincidan con la orden.
 *  4. Stock: descuento atómico solo si alcanza. Si una pieza ya no tiene stock
 *     (otra persona la pagó antes), la orden queda en revisión para devolución y se avisa.
 *  5. Aviso por Telegram de cada venta pagada.
 *  6. Flujos de retorno según la documentación de Transbank:
 *     - token_ws                         → flujo normal (commit)
 *     - TBK_TOKEN sin token_ws           → el cliente anuló el pago
 *     - TBK_ORDEN_COMPRA sin tokens      → timeout en el formulario
 *     - token_ws + TBK_TOKEN             → error en el formulario de pago (no se hace commit)
 *  7. Redirige con ?order=&k=<receipt_key> para que la página de resultado muestre el
 *     comprobante sin exponer pedidos ajenos (el id solo es adivinable, la clave no).
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SITE_URL = "https://autopartschile.cl";

const WEBPAY_ENV = Deno.env.get("WEBPAY_ENV") || "integration";
const IS_PROD = WEBPAY_ENV === "production";
const WEBPAY_BASE = IS_PROD ? "https://webpay3g.transbank.cl" : "https://webpay3gint.transbank.cl";

const INTEGRATION_COMMERCE_CODE = "597055555532";
const INTEGRATION_API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";
const WEBPAY_COMMERCE_CODE = Deno.env.get("WEBPAY_COMMERCE_CODE") || INTEGRATION_COMMERCE_CODE;
const WEBPAY_API_KEY = Deno.env.get("WEBPAY_API_KEY") || INTEGRATION_API_KEY;

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

const TBK_TIMEOUT_MS = 15000;
const TX_PATH = "/rswebpaytransaction/api/webpay/v1.3/transactions";

type Order = {
  id: number;
  status: string;
  total: number | string;
  webpay_buy_order: string | null;
  webpay_status: string | null;
  receipt_key: string;
};

function getServiceRoleKey(): string {
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

function redirect(url: string) {
  return new Response(null, { status: 303, headers: { Location: url } });
}

function resultUrl(page: "pago-exitoso" | "pago-fallido" | "pago-pendiente", order?: Order | null) {
  if (!order) return `${SITE_URL}/${page}.html`;
  return `${SITE_URL}/${page}.html?order=${order.id}&k=${order.receipt_key}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function tbkHeaders() {
  return {
    "Tbk-Api-Key-Id": WEBPAY_COMMERCE_CODE,
    "Tbk-Api-Key-Secret": WEBPAY_API_KEY,
    "Content-Type": "application/json",
  };
}

// Devuelve el JSON de la transacción, o null si no se pudo obtener.
async function tbkCall(method: "PUT" | "GET", token: string): Promise<{ ok: boolean; data: any } | null> {
  try {
    const res = await fetchWithTimeout(`${WEBPAY_BASE}${TX_PATH}/${encodeURIComponent(token)}`, { method, headers: tbkHeaders() }, TBK_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (e) {
    console.error(`webpay-confirm: ${method} a Transbank falló`, e instanceof Error ? e.name + ": " + e.message : String(e));
    return null;
  }
}

async function notify(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("webpay-confirm: Telegram no configurado, aviso no enviado");
    return;
  }
  try {
    await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    }, 8000);
  } catch (e) {
    console.error("webpay-confirm: fallo aviso Telegram", String(e));
  }
}

const ORDER_COLS = "id, status, total, webpay_buy_order, webpay_status, receipt_key";

// Descuenta stock de forma atómica. Devuelve los SKU que no tenían stock suficiente.
async function decrementStock(supabase: SupabaseClient, orderId: number): Promise<{ missing: string[]; items: any[] }> {
  const { data: items, error } = await supabase.from("order_items").select("product_id, sku, name, quantity, total_price").eq("order_id", orderId);
  if (error) {
    console.error("decrementStock: no se pudo leer order_items", JSON.stringify({ orderId, error }));
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

function clp(n: number) {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

Deno.serve(async (req: Request) => {
  let tokenWs: string | null = null;
  let tbkToken: string | null = null;
  let tbkOrdenCompra: string | null = null;

  try {
    let params: URLSearchParams;
    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await req.json();
        params = new URLSearchParams();
        for (const k of ["token_ws", "TBK_TOKEN", "TBK_ORDEN_COMPRA", "TBK_ID_SESION"]) if (j[k]) params.set(k, String(j[k]));
      } else {
        params = new URLSearchParams(await req.text());
      }
    } else {
      params = new URL(req.url).searchParams;
    }
    tokenWs = params.get("token_ws");
    tbkToken = params.get("TBK_TOKEN");
    tbkOrdenCompra = params.get("TBK_ORDEN_COMPRA");
  } catch (e) {
    console.error("webpay-confirm: error leyendo parámetros", String(e));
  }

  const supabase = createClient(SUPABASE_URL, getServiceRoleKey(), { auth: { persistSession: false } });

  // --- Anulación, timeout o error de formulario: no hay commit. ---
  if (!tokenWs || tbkToken) {
    const reason = tokenWs && tbkToken ? "FORM_ERROR" : tbkToken ? "ABORTED_BY_USER" : tbkOrdenCompra ? "TIMEOUT_FORM" : "NO_PARAMS";
    let order: Order | null = null;
    const q = supabase.from("orders").update({ status: "cancelled", webpay_status: reason }).eq("status", "pending");
    const { data } = tokenWs
      ? await q.eq("webpay_token", tokenWs).select(ORDER_COLS)
      : tbkOrdenCompra
        ? await q.eq("webpay_buy_order", tbkOrdenCompra).select(ORDER_COLS)
        : { data: null };
    order = (data && data[0]) || null;
    console.log("webpay-confirm: sin commit", JSON.stringify({ reason, buy_order: tbkOrdenCompra, order_id: order?.id ?? null }));
    return redirect(resultUrl("pago-fallido", order));
  }

  // --- Flujo normal ---
  const { data: found, error: findErr } = await supabase.from("orders").select(ORDER_COLS).eq("webpay_token", tokenWs).maybeSingle();
  if (findErr || !found) {
    console.error("webpay-confirm: token sin orden", JSON.stringify({ findErr }));
    return redirect(resultUrl("pago-fallido"));
  }
  let order = found as Order;

  if (order.status === "completed") return redirect(resultUrl("pago-exitoso", order));
  if (order.status === "cancelled" || order.status === "refunded") return redirect(resultUrl("pago-fallido", order));

  // Reclamar la orden: solo una ejecución puede hacer el commit.
  const { data: claimed } = await supabase
    .from("orders")
    .update({ webpay_status: "COMMITTING" })
    .eq("id", order.id)
    .eq("status", "pending")
    .in("webpay_status", ["created", "NEEDS_STATUS_CHECK"])
    .select(ORDER_COLS);

  if (!claimed || claimed.length === 0) {
    // Otra ejecución está confirmando. Esperamos su resultado unos segundos.
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { data: again } = await supabase.from("orders").select(ORDER_COLS).eq("id", order.id).single();
      if (again?.status === "completed") return redirect(resultUrl("pago-exitoso", again as Order));
      if (again?.status === "cancelled") return redirect(resultUrl("pago-fallido", again as Order));
      if (again?.status === "processing") return redirect(resultUrl("pago-pendiente", again as Order));
    }
    return redirect(resultUrl("pago-pendiente", order));
  }
  order = claimed[0] as Order;

  // Commit; si falla o no responde, consultar estado.
  let tx: any = null;
  const commit = await tbkCall("PUT", tokenWs);
  if (commit && commit.ok) {
    tx = commit.data;
  } else {
    if (commit) console.error("webpay-confirm: commit no OK", JSON.stringify(commit.data));
    const status = await tbkCall("GET", tokenWs);
    if (status && status.ok) tx = status.data;
  }

  if (!tx || !tx.status) {
    // No sabemos si se cobró. No marcar como fallido.
    await supabase.from("orders").update({ webpay_status: "NEEDS_STATUS_CHECK", review_reason: "Transbank no respondió al confirmar. Revisar estado en el portal." }).eq("id", order.id).eq("status", "pending");
    await notify(`⚠️ Webpay: no se pudo confirmar el pedido #${order.id} (${order.webpay_buy_order}). Puede estar cobrado. Revisar en el portal de Transbank.`);
    return redirect(resultUrl("pago-pendiente", order));
  }

  const expectedAmount = Math.round(Number(order.total));
  const authorized = tx.status === "AUTHORIZED" && tx.response_code === 0;
  const matches = Number(tx.amount) === expectedAmount && tx.buy_order === order.webpay_buy_order;

  if (authorized && !matches) {
    await supabase.from("orders").update({ status: "processing", webpay_status: "AUTHORIZED_MISMATCH", webpay_detail: tx, review_reason: `Monto u orden no coinciden: Transbank ${tx.amount}/${tx.buy_order}, orden ${expectedAmount}/${order.webpay_buy_order}` }).eq("id", order.id).eq("status", "pending");
    await notify(`🚨 Webpay: pedido #${order.id} AUTORIZADO pero monto/orden no coinciden (${tx.amount} vs ${expectedAmount}). Revisar antes de despachar.`);
    return redirect(resultUrl("pago-pendiente", order));
  }

  if (!authorized) {
    const { data: upd } = await supabase.from("orders").update({ status: "cancelled", webpay_status: tx.status || "REJECTED", webpay_detail: tx }).eq("id", order.id).eq("status", "pending").select(ORDER_COLS);
    console.log("webpay-confirm: rechazado", JSON.stringify({ order_id: order.id, status: tx.status, response_code: tx.response_code }));
    return redirect(resultUrl("pago-fallido", (upd && upd[0]) || order));
  }

  // Aprobado y consistente.
  const { data: done } = await supabase.from("orders").update({ status: "completed", webpay_status: "AUTHORIZED", webpay_detail: tx }).eq("id", order.id).eq("status", "pending").select(ORDER_COLS);
  if (!done || done.length === 0) {
    // Ya lo resolvió otra ejecución; mostrar estado actual.
    const { data: cur } = await supabase.from("orders").select(ORDER_COLS).eq("id", order.id).single();
    return redirect(resultUrl(cur?.status === "completed" ? "pago-exitoso" : "pago-pendiente", (cur as Order) ?? order));
  }
  order = done[0] as Order;

  const { missing, items } = await decrementStock(supabase, order.id);
  const lines = items.map((i) => `• ${i.quantity}× ${i.name} (${i.sku})`).join("\n");
  if (missing.length > 0) {
    await supabase.from("orders").update({ review_reason: `Pagado pero sin stock: ${missing.join(", ")}. Contactar al cliente y devolver si no hay pieza.` }).eq("id", order.id);
    await notify(`🚨 Venta web PAGADA #${order.id} por ${clp(tx.amount)} pero SIN STOCK de: ${missing.join(", ")}.\nContactar al cliente; si no hay pieza, devolver en el portal de Transbank.\n${lines}`);
  } else {
    await notify(`✅ Venta web pagada (Webpay${IS_PROD ? "" : " PRUEBA"}) #${order.id} por ${clp(tx.amount)}\n${lines}\nAutorización ${tx.authorization_code} · tarjeta ****${tx.card_detail?.card_number ?? "?"}`);
  }

  console.log("webpay-confirm: aprobado", JSON.stringify({ order_id: order.id, amount: tx.amount, missing }));
  return redirect(resultUrl("pago-exitoso", order));
});
