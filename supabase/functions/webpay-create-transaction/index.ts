import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, currentEnv, SUPABASE_URL, tbkRequest } from "./webpay_lib.ts";

/**
 * AutopartsChile — Webpay Plus: crea la orden y la transacción en Transbank.
 * Devuelve { order_id, token, url }; el navegador hace POST a url con token_ws=token.
 *
 * Secrets: WEBPAY_ENV ("production" | "integration"; cualquier otro valor = error),
 * WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY (obligatorios en producción).
 *
 * v6 (2026-10-18), tras revisión independiente:
 *  - Ambiente "falla cerrado" y se guarda en la orden (la confirmación usa el mismo ambiente).
 *  - Orden de compra e id de sesión (aleatorio) se guardan ANTES de llamar a Transbank; el token
 *    se guarda con verificación de error (si falla, no se entrega el token al navegador).
 *  - Cantidades por producto se suman antes de validar stock (líneas repetidas).
 *  - Productos internos "QA-" no se pueden comprar en producción.
 *  - Un cliente existente no se sobrescribe; los datos de contacto del pedido van en notes.
 *  - shipping siempre 0: el despacho a domicilio se cotiza aparte (shipping_status 'pending_quote').
 */

const CORS = {
  "Access-Control-Allow-Origin": "https://autopartschile.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonRes(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function normalizeDelivery(delivery: any) {
  const method: "pickup" | "home_delivery" = delivery && delivery.method === "home_delivery" ? "home_delivery" : "pickup";
  if (method === "pickup") return { method, shipping_status: "none", shipping_address: {} as Record<string, unknown> };
  const s = (v: unknown, n: number) => (v == null || v === "" ? null : String(v).slice(0, n));
  return {
    method,
    shipping_status: "pending_quote",
    shipping_address: {
      region: s(delivery?.region, 80),
      comuna: s(delivery?.comuna, 80),
      direccion: s(delivery?.direccion, 200),
      numero: s(delivery?.numero, 20),
      depto: s(delivery?.depto, 40),
      referencia: s(delivery?.referencia, 200),
    } as Record<string, unknown>,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed" }, 405);

  const envRes = currentEnv();
  if (!envRes.env) {
    console.error("webpay-create-transaction: configuración inválida:", envRes.error);
    return jsonRes({ error: "Webpay no está disponible en este momento" }, 500);
  }
  const env = envRes.env;
  const isProd = env.name === "production";

  try {
    const body = await req.json();
    const rawItems: Array<{ sku: string; quantity?: number }> = Array.isArray(body.items) ? body.items : [];
    const customerInput = body.customer ?? {};
    const delivery = normalizeDelivery(body.delivery);

    if (rawItems.length === 0 || rawItems.length > 50) return jsonRes({ error: "items vacío o inválido" }, 400);
    const email = String(customerInput.email ?? "").trim();
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) return jsonRes({ error: "email requerido" }, 400);
    if (delivery.method === "home_delivery" && (!delivery.shipping_address.region || !delivery.shipping_address.comuna || !delivery.shipping_address.direccion)) {
      return jsonRes({ error: "Faltan datos de despacho (región/comuna/dirección)" }, 400);
    }

    // Sumar cantidades por SKU.
    const qtyBySku = new Map<string, number>();
    for (const it of rawItems) {
      const sku = String(it?.sku ?? "").trim();
      if (!sku) return jsonRes({ error: "item sin sku" }, 400);
      const q = Math.max(1, Math.floor(Number(it.quantity) || 1));
      qtyBySku.set(sku, (qtyBySku.get(sku) ?? 0) + q);
    }

    const supabase = adminClient();

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, sku, name, price_sale, stock, is_active")
      .in("sku", [...qtyBySku.keys()]);
    if (prodErr) throw prodErr;

    const bySku = new Map((products ?? []).map((p: any) => [p.sku, p]));
    const orderItems: Array<{ product_id: number; sku: string; name: string; quantity: number; unit_price: number; total_price: number }> = [];
    let subtotal = 0;
    for (const [sku, qty] of qtyBySku) {
      const p: any = bySku.get(sku);
      if (!p || p.is_active === false) return jsonRes({ error: `Producto no disponible: ${sku}` }, 400);
      if (isProd && sku.startsWith("QA-")) return jsonRes({ error: `Producto no disponible: ${sku}` }, 400);
      if (qty > 99) return jsonRes({ error: `Cantidad inválida: ${sku}` }, 400);
      if (typeof p.stock === "number" && p.stock < qty) return jsonRes({ error: `Sin stock suficiente: ${sku}` }, 400);
      const unit = Number(p.price_sale);
      if (!unit || unit <= 0) return jsonRes({ error: `Producto sin precio válido: ${sku}` }, 400);
      orderItems.push({ product_id: p.id, sku: p.sku, name: p.name, quantity: qty, unit_price: unit, total_price: unit * qty });
      subtotal += unit * qty;
    }

    // Cliente: reutilizar si existe (sin modificarlo); crear si es nuevo.
    let customerId: unknown = null;
    const { data: existing, error: findErr } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
    if (findErr) throw findErr;
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: created, error: insErr } = await supabase
        .from("customers")
        .insert({
          email,
          first_name: customerInput.first_name ? String(customerInput.first_name).slice(0, 100) : null,
          last_name: customerInput.last_name ? String(customerInput.last_name).slice(0, 100) : null,
          phone: customerInput.phone ? String(customerInput.phone).slice(0, 30) : null,
          rut: customerInput.rut ? String(customerInput.rut).slice(0, 15) : null,
          address: delivery.method === "home_delivery" ? delivery.shipping_address : undefined,
        })
        .select("id")
        .single();
      if (insErr) {
        const { data: again } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
        if (!again) throw insErr;
        customerId = again.id;
      } else {
        customerId = created.id;
      }
    }

    const contactNote = JSON.stringify({
      contacto_pedido: {
        nombre: [customerInput.first_name, customerInput.last_name].filter(Boolean).join(" ").slice(0, 200) || null,
        telefono: customerInput.phone ? String(customerInput.phone).slice(0, 30) : null,
        rut: customerInput.rut ? String(customerInput.rut).slice(0, 15) : null,
      },
    });

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        status: "pending",
        source: "direct",
        subtotal,
        shipping: 0,
        total: subtotal,
        currency: "CLP",
        payment_method: "webpay",
        webpay_env: env.name,
        delivery_method: delivery.method,
        shipping_status: delivery.shipping_status,
        shipping_address: delivery.shipping_address,
        notes: contactNote,
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (itemsErr) {
      await supabase.from("orders").update({ status: "cancelled", webpay_status: "CREATE_ITEMS_ERROR" }).eq("id", order.id);
      throw itemsErr;
    }

    const buyOrder = `APC${order.id}`.slice(0, 26);
    const sessionId = crypto.randomUUID().replace(/-/g, "");
    const amount = Math.round(subtotal);

    const { error: preErr } = await supabase.from("orders").update({ webpay_buy_order: buyOrder, webpay_session_id: sessionId, webpay_status: "creating" }).eq("id", order.id);
    if (preErr) {
      await supabase.from("orders").update({ status: "cancelled", webpay_status: "CREATE_DB_ERROR" }).eq("id", order.id);
      throw preErr;
    }

    console.log("webpay-create-transaction: creando", JSON.stringify({ order_id: order.id, buyOrder, amount, env: env.name }));
    const tbk = await tbkRequest(env, "POST", "", {
      buy_order: buyOrder,
      session_id: sessionId,
      amount,
      return_url: `${SUPABASE_URL}/functions/v1/webpay-confirm`,
    });

    if (tbk.kind !== "ok" || !tbk.data?.token || !tbk.data?.url) {
      const detail = tbk.kind === "ok" ? tbk.data : tbk.kind === "client_error" ? tbk.data : { error: tbk.detail };
      console.error("webpay-create-transaction: Transbank no creó la transacción", JSON.stringify(detail));
      await supabase.from("orders").update({ status: "cancelled", webpay_status: "CREATE_FAILED", webpay_detail: detail }).eq("id", order.id);
      return jsonRes({ error: "No se pudo iniciar el pago con Webpay. Intenta nuevamente." }, 502);
    }

    const { error: tokErr } = await supabase
      .from("orders")
      .update({ webpay_token: tbk.data.token, webpay_status: "created" })
      .eq("id", order.id);
    if (tokErr) {
      console.error("webpay-create-transaction: no se pudo guardar el token", JSON.stringify(tokErr));
      await supabase.from("orders").update({ status: "cancelled", webpay_status: "CREATE_DB_ERROR" }).eq("id", order.id);
      return jsonRes({ error: "No se pudo iniciar el pago. Intenta nuevamente." }, 500);
    }

    return jsonRes({ order_id: order.id, token: tbk.data.token, url: tbk.data.url }, 200);
  } catch (err) {
    console.error("webpay-create-transaction: error", err instanceof Error ? err.stack : JSON.stringify(err));
    return jsonRes({ error: "Error interno" }, 500);
  }
});
