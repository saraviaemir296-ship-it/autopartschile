import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, claimOrder, notify, Order, ORDER_COLS, settleClaimedOrder } from "./webpay_lib.ts";

/**
 * AutopartsChile — Webpay: reconciliador (pg_cron cada 5 minutos).
 *  1. Órdenes en NEEDS_STATUS_CHECK, o en COMMITTING hace más de 2 minutos (la función murió a
 *     mitad de la confirmación): se reclaman y se resuelven con la misma lógica que webpay-confirm.
 *     Ventana: 24 horas. Más antiguas quedan para revisión manual (se avisa una vez).
 *  2. Órdenes "created" de más de 30 minutos (el cliente nunca volvió de Transbank): se cancelan
 *     sin commit. Una autorización no confirmada no se cobra.
 * Es idempotente: ejecutarla dos veces seguidas no cambia nada.
 */

Deno.serve(async (_req: Request) => {
  const supabase = adminClient();
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const summary = { checked: 0, completed: 0, cancelled: 0, still_pending: 0, expired: 0, manual: 0 };

  // 1. Confirmaciones pendientes o interrumpidas (últimas 24 h).
  const { data: stuck, error } = await supabase
    .from("orders")
    .select(ORDER_COLS + ", created_at, commit_claimed_at")
    .eq("payment_method", "webpay")
    .eq("status", "pending")
    .gte("created_at", iso(24 * 3600 * 1000))
    .or(`webpay_status.eq.NEEDS_STATUS_CHECK,and(webpay_status.eq.COMMITTING,commit_claimed_at.lt.${iso(2 * 60 * 1000)})`)
    .limit(20);
  if (error) console.error("reconcile: error leyendo órdenes", JSON.stringify(error));

  for (const row of (stuck ?? []) as any[]) {
    summary.checked++;
    const prev = row.webpay_status;
    const { order } = await claimOrder(supabase, row.id);
    if (!order) continue; // otra ejecución la tomó
    try {
      const r = await settleClaimedOrder(supabase, order as Order, prev);
      if (r === "completed") summary.completed++;
      else if (r === "cancelled") summary.cancelled++;
      else summary.still_pending++;
    } catch (e) {
      console.error("reconcile: error", row.id, e instanceof Error ? e.stack : String(e));
      summary.still_pending++;
    }
  }

  // 1b. Más de 24 h sin resolver: avisar una sola vez para revisión manual.
  const { data: old } = await supabase
    .from("orders")
    .update({ webpay_status: "MANUAL_REVIEW", commit_claimed_at: null })
    .eq("payment_method", "webpay")
    .eq("status", "pending")
    .lt("created_at", iso(24 * 3600 * 1000))
    .in("webpay_status", ["NEEDS_STATUS_CHECK", "COMMITTING"])
    .select("id, webpay_buy_order");
  for (const o of old ?? []) {
    summary.manual++;
    await notify(`⚠️ Webpay: pedido #${o.id} (${o.webpay_buy_order}) lleva más de 24 h sin confirmarse. Revisar a mano en el portal de Transbank.`);
  }

  // 2. Nunca volvieron de Transbank: cancelar sin commit.
  const { data: expired } = await supabase
    .from("orders")
    .update({ status: "cancelled", webpay_status: "EXPIRED_NO_RETURN" })
    .eq("payment_method", "webpay")
    .eq("status", "pending")
    .in("webpay_status", ["created", "creating"])
    .lt("created_at", iso(30 * 60 * 1000))
    .select("id");
  summary.expired = expired?.length ?? 0;

  console.log("reconcile:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } });
});
