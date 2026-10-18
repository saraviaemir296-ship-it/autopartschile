import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * AutopartsChile — Webpay Plus (Transbank)
 * Crea una transacción y devuelve { token, url } para que el navegador haga
 * un POST (form submit) a Transbank con token_ws=token.
 *
 * Env vars (Supabase > Edge Functions > Secrets):
 *   WEBPAY_ENV            — "production" para el ambiente real; cualquier otro valor usa INTEGRACIÓN.
 *   WEBPAY_COMMERCE_CODE  — código de comercio (obligatorio en producción).
 *   WEBPAY_API_KEY        — Api Key Secret (obligatorio en producción).
 * Si WEBPAY_ENV=production y faltan las credenciales, responde 500 en vez de arriesgarse.
 *
 * v5 (2026-10-18): un cliente existente (mismo email) ya NO se sobrescribe con los datos
 * enviados por el navegador — esta función es pública y cualquiera podía cambiar el nombre
 * o teléfono de otro cliente solo sabiendo su correo. Ahora se reutiliza el registro tal cual
 * y solo se crea uno nuevo si el correo no existe.
 *
 * FIX (2026-09-01): carrito multi-item con datos de entrega. delivery.method: 'pickup' ($0)
 * o 'home_delivery' (costo se cotiza después; shipping siempre 0 y shipping_status
 * 'pending_quote').
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const WEBPAY_ENV = Deno.env.get("WEBPAY_ENV") || "integration";
const IS_PROD = WEBPAY_ENV === "production";
const WEBPAY_BASE = IS_PROD ? "https://webpay3g.transbank.cl" : "https://webpay3gint.transbank.cl";

const INTEGRATION_COMMERCE_CODE = "597055555532";
const INTEGRATION_API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";

const WEBPAY_COMMERCE_CODE = Deno.env.get("WEBPAY_COMMERCE_CODE") || INTEGRATION_COMMERCE_CODE;
const WEBPAY_API_KEY = Deno.env.get("WEBPAY_API_KEY") || INTEGRATION_API_KEY;

const TBK_TIMEOUT_MS = 15000;

function getServiceRoleKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].api_key ?? parsed[0].secret ?? String(parsed[0]);
      }
      if (parsed && typeof parsed === "object") {
        const vals = Object.values(parsed);
        if (vals.length > 0) return String(vals[0]);
      }
    } catch (_e) {
      // fall through
    }
  }
  throw new Error("No service role key available (checked SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SECRET_KEYS)");
}

function serializeErr(err: unknown) {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  try {
    return JSON.parse(JSON.stringify(err));
  } catch (_e) {
    return { raw: String(err) };
  }
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

const CORS = {
  "Access-Control-Allow-Origin": "https://autopartschile.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonRes(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function normalizeDelivery(delivery: any): {
  method: "pickup" | "home_delivery";
  shipping_status: "none" | "pending_quote";
  shipping_address: Record<string, unknown>;
} {
  const method = delivery && delivery.method === "home_delivery" ? "home_delivery" : "pickup";
  if (method === "pickup") {
    return { method, shipping_status: "none", shipping_address: {} };
  }
  return {
    method,
    shipping_status: "pending_quote",
    shipping_address: {
      region: delivery?.region ?? null,
      comuna: delivery?.comuna ?? null,
      direccion: delivery?.direccion ?? null,
      numero: delivery?.numero ?? null,
      depto: delivery?.depto ?? null,
      referencia: delivery?.referencia ?? null,
    },
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonRes({ error: "Method not allowed" }, 405);

  if (IS_PROD && (!Deno.env.get("WEBPAY_COMMERCE_CODE") || !Deno.env.get("WEBPAY_API_KEY"))) {
    console.error("webpay-create-transaction: WEBPAY_ENV=production pero faltan credenciales reales en Secrets");
    return jsonRes({ error: "Webpay no está configurado para producción" }, 500);
  }

  try {
    const body = await req.json();
    const items: Array<{ sku: string; quantity?: number }> = body.items ?? [];
    const customerInput = body.customer ?? {};
    const delivery = normalizeDelivery(body.delivery);

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return jsonRes({ error: "items vacío o inválido" }, 400);
    }
    const email = String(customerInput.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return jsonRes({ error: "email requerido" }, 400);
    }
    if (delivery.method === "home_delivery" && (!delivery.shipping_address.region || !delivery.shipping_address.comuna || !delivery.shipping_address.direccion)) {
      return jsonRes({ error: "Faltan datos de despacho (región/comuna/dirección)" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, getServiceRoleKey(), {
      auth: { persistSession: false },
    });

    const skus = items.map((i) => String(i.sku));
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, sku, name, price_sale, stock, is_active")
      .in("sku", skus);

    if (prodErr) {
      console.error("prodErr", JSON.stringify(prodErr));
      throw prodErr;
    }
    if (!products || products.length === 0) {
      return jsonRes({ error: "Productos no encontrados" }, 404);
    }

    const productBySku = new Map(products.map((p: any) => [p.sku, p]));
    const orderItems: Array<{
      product_id: number;
      sku: string;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }> = [];
    let subtotal = 0;

    for (const it of items) {
      const p: any = productBySku.get(String(it.sku));
      if (!p || p.is_active === false) {
        return jsonRes({ error: `Producto no disponible: ${it.sku}` }, 400);
      }
      const qty = Math.min(99, Math.max(1, Math.floor(Number(it.quantity) || 1)));
      if (typeof p.stock === "number" && p.stock < qty) {
        return jsonRes({ error: `Sin stock suficiente: ${it.sku}` }, 400);
      }
      const unitPrice = Number(p.price_sale);
      if (!unitPrice || unitPrice <= 0) {
        return jsonRes({ error: `Producto sin precio válido: ${it.sku}` }, 400);
      }
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      orderItems.push({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    // Cliente: reutilizar si existe (sin modificarlo); crear solo si es nuevo.
    let customerId: number | string | null = null;
    const { data: existing, error: findErr } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
    if (findErr) {
      console.error("custFindErr", JSON.stringify(findErr));
      throw findErr;
    }
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
        // Carrera: otro pedido creó el mismo email al mismo tiempo.
        const { data: again } = await supabase.from("customers").select("id").eq("email", email).maybeSingle();
        if (!again) {
          console.error("custInsErr", JSON.stringify(insErr));
          throw insErr;
        }
        customerId = again.id;
      } else {
        customerId = created.id;
      }
    }

    // Datos de contacto de ESTE pedido (para despacho), sin tocar el registro del cliente.
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
        delivery_method: delivery.method,
        shipping_status: delivery.shipping_status,
        shipping_address: delivery.shipping_address,
        notes: contactNote,
      })
      .select()
      .single();
    if (orderErr) {
      console.error("orderErr", JSON.stringify(orderErr));
      throw orderErr;
    }

    const itemsToInsert = orderItems.map((oi) => ({ ...oi, order_id: order.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsErr) {
      console.error("itemsErr", JSON.stringify(itemsErr));
      throw itemsErr;
    }

    const buyOrder = `APC${order.id}`.slice(0, 26);
    const sessionId = `sess-${order.id}-${Date.now()}`.slice(0, 61);
    const amount = Math.round(subtotal);

    console.log("webpay-create-transaction: creando transacción", JSON.stringify({ order_id: order.id, buyOrder, amount, env: WEBPAY_ENV }));

    let tbkRes: Response;
    try {
      tbkRes = await fetchWithTimeout(
        `${WEBPAY_BASE}/rswebpaytransaction/api/webpay/v1.3/transactions`,
        {
          method: "POST",
          headers: {
            "Tbk-Api-Key-Id": WEBPAY_COMMERCE_CODE,
            "Tbk-Api-Key-Secret": WEBPAY_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buy_order: buyOrder,
            session_id: sessionId,
            amount,
            return_url: `${SUPABASE_URL}/functions/v1/webpay-confirm`,
          }),
        },
        TBK_TIMEOUT_MS,
      );
    } catch (fetchErr) {
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      console.error("webpay-create-transaction: fetch a Transbank falló", isTimeout ? "TIMEOUT" : JSON.stringify(serializeErr(fetchErr)));
      await supabase
        .from("orders")
        .update({ status: "cancelled", webpay_status: isTimeout ? "CREATE_TIMEOUT" : "CREATE_FETCH_ERROR" })
        .eq("id", order.id);
      return jsonRes({ error: isTimeout ? "Transbank no respondió a tiempo, intenta nuevamente" : "Error de conexión con Transbank" }, 502);
    }

    const tbkData = await tbkRes.json().catch(() => ({}));

    if (!tbkRes.ok || !tbkData.token || !tbkData.url) {
      console.error("tbkErr", tbkRes.status, JSON.stringify(tbkData));
      await supabase
        .from("orders")
        .update({ status: "cancelled", webpay_status: "CREATE_REJECTED", webpay_detail: tbkData })
        .eq("id", order.id);
      return jsonRes({ error: "Error creando transacción Webpay" }, 502);
    }

    await supabase
      .from("orders")
      .update({ webpay_token: tbkData.token, webpay_buy_order: buyOrder, webpay_status: "created" })
      .eq("id", order.id);

    console.log("webpay-create-transaction: transacción creada OK", JSON.stringify({ order_id: order.id }));

    return jsonRes({ order_id: order.id, token: tbkData.token, url: tbkData.url }, 200);
  } catch (err) {
    console.error("fatal", JSON.stringify(serializeErr(err)));
    return jsonRes({ error: "Error interno" }, 500);
  }
});
