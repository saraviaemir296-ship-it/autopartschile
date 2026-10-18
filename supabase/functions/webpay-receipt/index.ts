import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * AutopartsChile — comprobante de pago para la página de resultado.
 * GET ?order=<id>&k=<receipt_key>. Sin la clave correcta responde 404 (no revela si el pedido existe).
 * Devuelve solo lo que Transbank recomienda mostrar al tarjetahabiente; nunca datos del cliente.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const MERCHANT_NAME = "Desarmaduría Saravia (AutopartsChile)";

const CORS = {
  "Access-Control-Allow-Origin": "https://autopartschile.cl",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
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

const PAYMENT_TYPE: Record<string, { tipo: string; cuotas: string }> = {
  VD: { tipo: "Débito", cuotas: "Venta débito (sin cuotas)" },
  VP: { tipo: "Prepago", cuotas: "Venta prepago (sin cuotas)" },
  VN: { tipo: "Crédito", cuotas: "Sin cuotas" },
  VC: { tipo: "Crédito", cuotas: "Cuotas normales" },
  SI: { tipo: "Crédito", cuotas: "3 cuotas sin interés" },
  S2: { tipo: "Crédito", cuotas: "2 cuotas sin interés" },
  NC: { tipo: "Crédito", cuotas: "N cuotas sin interés" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return json({ error: "method" }, 405);

  const url = new URL(req.url);
  const orderId = Number(url.searchParams.get("order"));
  const key = url.searchParams.get("k") ?? "";
  if (!Number.isInteger(orderId) || orderId <= 0 || !UUID_RE.test(key)) return json({ error: "not_found" }, 404);

  const supabase = createClient(SUPABASE_URL, getServiceRoleKey(), { auth: { persistSession: false } });
  const { data: o } = await supabase
    .from("orders")
    .select("id, status, total, currency, payment_method, webpay_buy_order, webpay_status, webpay_detail, review_reason, created_at")
    .eq("id", orderId)
    .eq("receipt_key", key)
    .maybeSingle();
  if (!o) return json({ error: "not_found" }, 404);

  const { data: items } = await supabase.from("order_items").select("name, quantity, unit_price, total_price").eq("order_id", o.id);
  const tx = (o.webpay_detail ?? {}) as Record<string, any>;
  const pt = PAYMENT_TYPE[tx.payment_type_code] ?? null;

  return json({
    order_id: o.id,
    status: o.status,
    in_review: !!o.review_reason || o.webpay_status === "NEEDS_STATUS_CHECK",
    merchant: MERCHANT_NAME,
    buy_order: o.webpay_buy_order,
    amount: tx.amount ?? Number(o.total),
    currency: o.currency || "CLP",
    authorization_code: tx.authorization_code ?? null,
    transaction_date: tx.transaction_date ?? null,
    payment_type: pt?.tipo ?? null,
    installments_type: pt?.cuotas ?? null,
    installments_number: tx.installments_number ?? 0,
    installments_amount: tx.installments_amount ?? null,
    card_last4: tx.card_detail?.card_number ?? null,
    response_code: tx.response_code ?? null,
    items: (items ?? []).map((i: any) => ({ name: i.name, quantity: i.quantity, unit_price: Number(i.unit_price), total_price: Number(i.total_price) })),
  });
});
