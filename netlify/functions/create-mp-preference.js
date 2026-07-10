/**
 * AutopartsChile — Pagar ahora con Mercado Pago
 * Netlify Function: /.netlify/functions/create-mp-preference?sku=XXX
 *   → busca el precio real del repuesto en Supabase y redirige al Checkout Pro de Mercado Pago.
 *
 * Env var requerida en Netlify dashboard > Site configuration > Environment variables:
 *   MP_ACCESS_TOKEN   — Access Token de PRODUCCIÓN de tu cuenta de Mercado Pago
 *                        (panel de Mercado Pago > Tu negocio > Configuración > Credenciales > Credenciales de producción)
 *
 * SEGURIDAD:
 *   - El monto a cobrar SIEMPRE se busca en Supabase usando el SKU. Nunca se confía en un precio
 *     enviado desde el navegador, para que nadie pueda manipular el monto antes de pagar.
 *   - SUPABASE_URL y SUPABASE_ANON_KEY están fijos abajo porque son la clave "publishable" del
 *     proyecto (diseñada para ser pública) y la tabla products solo permite lectura (SELECT) a
 *     esa clave — no permite escribir ni borrar. El Access Token de Mercado Pago SÍ es secreto y
 *     por eso vive únicamente en variables de entorno de Netlify.
 */

const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE_URL = 'https://autopartschile.cl';

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sku = (event.queryStringParameters || {}).sku;
  const fallback =
    'https://wa.me/56953817335?text=' +
    encodeURIComponent(
      'Hola, quería pagar un repuesto pero tuve un problema con el link de pago. SKU: ' + (sku || 'desconocido')
    );

  if (!sku) {
    return redirect(fallback);
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!MP_ACCESS_TOKEN) {
    console.error('create-mp-preference: falta la variable de entorno MP_ACCESS_TOKEN en Netlify');
    return redirect(fallback);
  }

  try {
    // 1. Buscar el producto real en Supabase — el precio de verdad, no el del navegador
    const productUrl =
      SUPABASE_URL +
      '/rest/v1/products' +
      '?sku=eq.' + encodeURIComponent(sku) +
      '&is_active=eq.true' +
      '&select=sku,name,price_sale,images' +
      '&limit=1';

    const productRes = await fetch(productUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      },
    });

    if (!productRes.ok) {
      console.error('Supabase error:', productRes.status, await productRes.text());
      return redirect(fallback);
    }

    const products = await productRes.json();
    const product = products[0];

    if (!product || !product.price_sale) {
      console.error('create-mp-preference: producto no encontrado o sin precio para SKU', sku);
      return redirect(fallback);
    }

    // 2. Crear la preferencia de pago en Mercado Pago con el precio real de Supabase
    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: product.name + ' — Desarmaduría Saravia',
            picture_url: (product.images && product.images[0]) || undefined,
            quantity: 1,
            currency_id: 'CLP',
            unit_price: Number(product.price_sale),
          },
        ],
        external_reference: product.sku,
        back_urls: {
          success: SITE_URL + '/pago-confirmado.html?sku=' + encodeURIComponent(product.sku),
          failure: SITE_URL + '/metodos-de-pago.html?pago=error',
          pending: SITE_URL + '/pago-confirmado.html?sku=' + encodeURIComponent(product.sku) + '&pendiente=1',
        },
        auto_return: 'approved',
        statement_descriptor: 'AUTOPARTSCHILE',
      }),
    });

    if (!prefRes.ok) {
      console.error('Mercado Pago error:', prefRes.status, await prefRes.text());
      return redirect(fallback);
    }

    const pref = await prefRes.json();
    const checkoutUrl = pref.init_point || pref.sandbox_init_point;

    if (!checkoutUrl) {
      console.error('Mercado Pago: respuesta sin init_point', JSON.stringify(pref));
      return redirect(fallback);
    }

    return redirect(checkoutUrl);
  } catch (err) {
    console.error('create-mp-preference error:', err);
    return redirect(fallback);
  }
};

function redirect(url) {
  return {
    statusCode: 302,
    headers: { Location: url },
    body: '',
  };
}
