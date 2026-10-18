import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, claimOrder, notify, Order, ORDER_COLS, settleClaimedOrder, SITE_URL } from "./webpay_lib.ts";

/**
 * AutopartsChile — Webpay Plus: retorno desde Transbank (return_url).
 *
 * v8 (2026-10-18), tras revisión independiente:
 *  - Anulación / timeout / error de formulario solo cancelan si los datos que manda Transbank
 *    calzan con la orden (token, o orden de compra + id de sesión aleatorio) y si la orden sigue en
 *    "created". Nadie puede cancelar un pedido ajeno solo adivinando "APC<n>".
 *  - El commit y la decisión final viven en webpay_lib.settleClaimedOrder (compartido con el
 *    reconciliador): reintento ante timeout, GET de estado, nunca cancelar sin respuesta clara,
 *    errores de base de datos verificados y avisados.
 *  - Si otra ejecución está confirmando, se espera un poco y luego se envía a pago-pendiente,
 *    que consulta el comprobante hasta que el estado se resuelva.
 */

type Page = "pago-exitoso" | "pago-fallido" | "pago-pendiente";

function redirect(page: Page, order?: Pick<Order, "id" | "receipt_key"> | null) {
  const url = order ? `${SITE_URL}/${page}.html?order=${order.id}&k=${order.receipt_key}` : `${SITE_URL}/${page}.html`;
  return new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "no-store" } });
}

function pageFor(status: string): Page {
  if (status === "completed") return "pago-exitoso";
  if (status === "cancelled" || status === "refunded") return "pago-fallido";
  return "pago-pendiente";
}

async function readParams(req: Request): Promise<URLSearchParams> {
  if (req.method !== "POST") return new URL(req.url).searchParams;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    const p = new URLSearchParams();
    for (const k of ["token_ws", "TBK_TOKEN", "TBK_ORDEN_COMPRA", "TBK_ID_SESION"]) if (j && j[k]) p.set(k, String(j[k]));
    return p;
  }
  return new URLSearchParams(await req.text());
}

Deno.serve(async (req: Request) => {
  let params: URLSearchParams;
  try {
    params = await readParams(req);
  } catch (e) {
    console.error("webpay-confirm: no se pudieron leer los parámetros", String(e));
    return redirect("pago-fallido");
  }
  const tokenWs = params.get("token_ws");
  const tbkToken = params.get("TBK_TOKEN");
  const buyOrder = params.get("TBK_ORDEN_COMPRA");
  const sessionId = params.get("TBK_ID_SESION");

  const supabase = adminClient();

  // ---- Sin commit: anulación, timeout del formulario o error en el formulario ----
  if (!tokenWs || tbkToken) {
    let reason: string;
    let match: Record<string, string>;
    if (tokenWs && tbkToken) {
      reason = "FORM_ERROR";
      match = { webpay_token: tokenWs };
    } else if (tbkToken && buyOrder) {
      reason = "ABORTED_BY_USER";
      match = { webpay_token: tbkToken, webpay_buy_order: buyOrder };
    } else if (buyOrder && sessionId) {
      reason = "TIMEOUT_FORM";
      match = { webpay_buy_order: buyOrder, webpay_session_id: sessionId };
    } else {
      console.error("webpay-confirm: retorno sin datos reconocibles", JSON.stringify({ hasToken: !!tokenWs, hasTbk: !!tbkToken, buyOrder }));
      return redirect("pago-fallido");
    }
    // Solo se cancela si los datos calzan y la orden sigue en "created" (nunca una en confirmación).
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "cancelled", webpay_status: reason, commit_claimed_at: null })
      .match(match)
      .eq("status", "pending")
      .eq("webpay_status", "created")
      .select(ORDER_COLS);
    if (error) console.error("webpay-confirm: error al cancelar", JSON.stringify({ reason, error }));
    const row = data && data[0];
    console.log("webpay-confirm: sin commit", JSON.stringify({ reason, buyOrder, order_id: row?.id ?? null }));
    return redirect("pago-fallido", row ?? null);
  }

  // ---- Flujo normal: token_ws ----
  const { data: found, error: findErr } = await supabase.from("orders").select(ORDER_COLS).eq("webpay_token", tokenWs).maybeSingle();
  if (findErr || !found) {
    console.error("webpay-confirm: token sin orden", JSON.stringify({ findErr }));
    return redirect("pago-fallido");
  }
  const order = found as Order;
  if (order.status !== "pending") return redirect(pageFor(order.status), order);

  const prev = order.webpay_status;
  const { order: claimed, error: claimErr } = await claimOrder(supabase, order.id);
  if (claimErr) console.error("webpay-confirm: error al reclamar", JSON.stringify(claimErr));

  if (!claimed) {
    // Otra ejecución está confirmando: esperar un poco; la página de pendiente sigue consultando.
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { data: again } = await supabase.from("orders").select(ORDER_COLS).eq("id", order.id).single();
      if (again && again.status !== "pending") return redirect(pageFor(again.status), again as Order);
    }
    return redirect("pago-pendiente", order);
  }

  try {
    const result = await settleClaimedOrder(supabase, claimed, prev);
    console.log("webpay-confirm: resultado", JSON.stringify({ order_id: order.id, result }));
    return redirect(pageFor(result), order);
  } catch (e) {
    console.error("webpay-confirm: error inesperado", e instanceof Error ? e.stack : String(e));
    await notify(`⚠️ Webpay: error inesperado confirmando el pedido #${order.id}. El reconciliador lo reintentará en unos minutos.`);
    return redirect("pago-pendiente", order);
  }
});
