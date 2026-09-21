/**
 * AutopartsChile — Google Shopping feed, generado en vivo desde Supabase.
 *
 * Antes feed.xml era un archivo estático de 114 items mantenidos a mano,
 * desconectado del catálogo real (270+ productos en Supabase). Esta función
 * reemplaza ese archivo: cualquier producto publicado (is_active=true) desde
 * /admin/ aparece aquí automáticamente, sin rebuild ni edición manual.
 *
 * Redirect en netlify.toml: /feed.xml -> /.netlify/functions/feed
 */

const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE_URL = 'https://autopartschile.cl';

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const res = await fetch(
      SUPABASE_URL +
        '/rest/v1/products?select=sku,name,description,brand,category,vehicle_compatibility,price_sale,stock,images,oem_number&is_active=eq.true&order=sku.asc',
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY } },
    );

    if (!res.ok) {
      console.error('feed.js: Supabase error', res.status, await res.text());
      return { statusCode: 502, body: 'Upstream error' };
    }

    const products = await res.json();
    const items = products.map(toRssItem).join('\n');

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
      '<channel>\n' +
      '<title>AutopartsChile - Desarmaduría Saravia</title>\n' +
      '<link>' + SITE_URL + '</link>\n' +
      '<description>Repuestos usados de desarme, revisados y con garantía de funcionamiento.</description>\n' +
      items + '\n' +
      '</channel>\n' +
      '</rss>\n';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
      body: xml,
    };
  } catch (err) {
    console.error('feed.js: fatal error', err);
    return { statusCode: 500, body: 'Internal error' };
  }
};

function xmlEscape(s) {
  return String(s == null ? '' : s).replace(/[<>&'"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c];
  });
}

function formatCompat(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    return [v.make, v.model, v.years || v.year, v.engine].filter(Boolean).join(' ');
  }
  return String(v);
}

function toRssItem(p) {
  const compat = formatCompat(p.vehicle_compatibility);
  const title = compat ? p.name + ' - ' + compat + ' (usado)' : p.name + ' (usado)';
  const description = p.description || (p.name + (compat ? ' para ' + compat : '') + '. Repuesto usado con garantía de funcionamiento.');
  const link = SITE_URL + '/producto?sku=' + encodeURIComponent(p.sku);
  const image = Array.isArray(p.images) && p.images.length ? p.images[0] : SITE_URL + '/img/favicon.png';
  const price = Math.round(Number(p.price_sale) || 0);
  const availability = p.stock > 0 ? 'in stock' : 'out of stock';
  const productType = 'Repuestos de desarme' + (p.brand ? ' > ' + p.brand : '') + (p.category ? ' > ' + p.category : '');

  return (
    '<item>\n' +
    '<g:id>' + xmlEscape(p.sku) + '</g:id>\n' +
    '<title>' + xmlEscape(title) + '</title>\n' +
    '<description>' + xmlEscape(description) + '</description>\n' +
    '<link>' + xmlEscape(link) + '</link>\n' +
    '<g:image_link>' + xmlEscape(image) + '</g:image_link>\n' +
    '<g:availability>' + availability + '</g:availability>\n' +
    '<g:price>' + price + ' CLP</g:price>\n' +
    '<g:condition>used</g:condition>\n' +
    (p.brand ? '<g:brand>' + xmlEscape(p.brand) + '</g:brand>\n' : '') +
    '<g:identifier_exists>no</g:identifier_exists>\n' +
    '<g:product_type>' + xmlEscape(productType) + '</g:product_type>\n' +
    '<g:excluded_destination>free_local_listings</g:excluded_destination>\n' +
    '<g:excluded_destination>local_inventory_ads</g:excluded_destination>\n' +
    '</item>'
  );
}
