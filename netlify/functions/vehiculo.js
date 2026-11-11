/**
 * Ficha de vehículo en desarme con contenido renderizado en el servidor: /vehiculo?slug=<slug>
 * Netlify redirect: /vehiculo -> /.netlify/functions/vehiculo
 *
 * Antes la página llegaba vacía ("Cargando vehículo...") y se armaba en el navegador:
 * Google la ve después, pero los rastreadores de IA (GPTBot, ClaudeBot, PerplexityBot) no ejecutan
 * JavaScript y veían una página sin contenido. Ahora se sirve vehiculo.html con título, descripción,
 * datos estructurados y la lista de repuestos ya escritos. El JavaScript de la página sigue
 * funcionando igual y reemplaza ese bloque por la versión interactiva.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
const abs = (u) => (/^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u);
const realImgs = (a) => (Array.isArray(a) ? a : []).filter((u) => typeof u === 'string' && u && !/favicon|placeholder|logo/i.test(u)).map(abs);

let TEMPLATE = null;
function template() {
  if (TEMPLATE) return TEMPLATE;
  const candidates = [path.join(__dirname, 'vehiculo.html'), path.join(process.cwd(), 'vehiculo.html'), path.join(__dirname, '..', '..', 'vehiculo.html')];
  for (const c of candidates) {
    try { TEMPLATE = fs.readFileSync(c, 'utf8'); return TEMPLATE; } catch (e) { /* siguiente */ }
  }
  return null;
}

async function api(p) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + p, { headers: H });
    return r.ok ? r.json() : [];
  } catch (e) {
    console.error('vehiculo api', e);
    return [];
  }
}

exports.handler = async (event) => {
  const tpl = template();
  const html = { 'Content-Type': 'text/html; charset=utf-8' };
  if (!tpl) return { statusCode: 302, headers: { Location: '/vehiculos-en-desarme' }, body: '' };
  const slug = (event.queryStringParameters && event.queryStringParameters.slug) || '';
  if (!slug || !/^[a-z0-9-]{3,200}$/.test(slug)) return { statusCode: 200, headers: html, body: tpl };

  const rows = await api('vehiculos?select=id,slug,marca,modelo,motor,anio_desde,anio_hasta,color,transmision,images,descripcion,seo_title,meta_description&slug=eq.' + encodeURIComponent(slug) + '&is_active=eq.true&limit=1');
  const v = rows[0];
  if (!v) return { statusCode: 404, headers: html, body: tpl.replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,follow">') };

  // Mismo criterio que la página: piezas de este auto o de otro igual (misma marca/modelo y años que se cruzan).
  const vs = await api('vehiculos?select=id,anio_desde,anio_hasta&marca=ilike.' + encodeURIComponent(v.marca) + '&modelo=ilike.' + encodeURIComponent(v.modelo));
  const ids = vs.filter((x) => {
    if (x.id === v.id) return true;
    if (!v.anio_desde || !x.anio_desde) return false;
    return v.anio_desde <= (x.anio_hasta || 2100) && x.anio_desde <= (v.anio_hasta || 2100);
  }).map((x) => x.id);
  if (!ids.includes(v.id)) ids.push(v.id);
  const ps = (await api('products?select=sku,name,slug,price_sale,images,part_status,stock&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&vehiculo_id=in.(' + ids.join(',') + ')&order=name.asc'))
    .filter((p) => p.part_status !== 'vendida' && p.part_status !== 'no_disponible' && !/^QA-/i.test(p.sku));

  // Si el modelo ya trae el motor ("Swift 1.2 K12M"), no repetirlo.
  const motorCod = String(v.motor || '').split(/\s+/)[0];
  const nombre = [v.marca, v.modelo, motorCod && String(v.modelo || '').toUpperCase().includes(motorCod.toUpperCase()) ? '' : v.motor].filter(Boolean).join(' ');
  const anios = v.anio_desde ? v.anio_desde + (v.anio_hasta && v.anio_hasta !== v.anio_desde ? '-' + v.anio_hasta : '') : '';
  const url = SITE + '/vehiculo?slug=' + encodeURIComponent(v.slug);
  const title = v.seo_title || ('Repuestos ' + nombre + (anios ? ' ' + anios : '') + ' en desarme, con precio | Desarmaduría Saravia');
  const desc = v.meta_description || ('Repuestos usados originales de ' + nombre + (anios ? ' ' + anios : '') + ': ' + ps.length + ' piezas con precio. Compra con Webpay, envío a todo Chile o retiro en La Pintana.');
  const imgs = realImgs(v.images);
  const precios = ps.map((p) => Number(p.price_sale)).filter((n) => n > 0).sort((a, b) => a - b);
  const conLink = ps.filter((p) => p.slug);
  const marcaSlug = String(v.marca || '').toLowerCase() === 'suzuki';

  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Repuestos ' + nombre + (anios ? ' ' + anios : ''), url, description: desc,
      ...(imgs.length ? { image: imgs.slice(0, 5) } : {}),
      about: { '@type': 'Car', name: nombre, brand: { '@type': 'Brand', name: v.marca }, model: v.modelo, ...(anios ? { vehicleModelDate: String(v.anio_desde) } : {}), ...(v.motor ? { vehicleEngine: { '@type': 'EngineSpecification', name: v.motor } } : {}), ...(v.transmision ? { vehicleTransmission: v.transmision } : {}) },
      isPartOf: { '@id': SITE + '/#store' },
      mainEntity: { '@type': 'ItemList', numberOfItems: ps.length, itemListElement: conLink.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/repuesto/' + p.slug, name: p.name })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Vehículos en desarme', item: SITE + '/vehiculos-en-desarme' },
      { '@type': 'ListItem', position: 3, name: nombre, item: url } ] },
  ];

  const ssr = `<div id="ssr-veh">
<div class="breadcrumb"><a href="/">Inicio</a> › <a href="/vehiculos-en-desarme">Vehículos en Desarme</a>${marcaSlug ? ' › <a href="/suzuki">Repuestos Suzuki</a>' : ''} › ${esc(nombre)}</div>
<h1>Repuestos ${esc(nombre)}${anios ? ' ' + esc(anios) : ''} en desarme</h1>
${imgs[0] ? `<p><img src="${esc(imgs[0])}" alt="${esc(nombre)} en desarme" style="max-width:100%;border-radius:14px" width="900" height="600"></p>` : ''}
<p>${esc(nombre)}${anios ? ' (' + esc(anios) + ')' : ''}${v.transmision ? ', transmisión ' + esc(v.transmision) : ''}, en desarme en Desarmaduría Saravia, Av. Lo Blanco 1072, La Pintana, Santiago. ${ps.length} repuestos usados originales con precio${precios.length ? ', desde ' + clp(precios[0]) : ''}. Envío a todo Chile o retiro en el local. Cotiza por WhatsApp al +56 9 5381 7335.</p>
${v.descripcion ? `<p>${esc(v.descripcion)}</p>` : ''}
<h2>Repuestos disponibles</h2>
<ul>${ps.slice(0, 200).map((p) => `<li>${p.slug ? `<a href="/repuesto/${esc(p.slug)}">${esc(p.name)}</a>` : esc(p.name)} — ${clp(p.price_sale)}</li>`).join('')}</ul>
</div>`;

  let out = tpl
    .replace(/<title id="pageTitle">[\s\S]*?<\/title>/, `<title id="pageTitle">${esc(title)}</title>`)
    .replace(/<meta id="metaDesc" name="description" content="[^"]*">/, `<meta id="metaDesc" name="description" content="${esc(desc)}">\n<link rel="canonical" href="${esc(url)}">\n<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">${imgs[0] ? `<meta property="og:image" content="${esc(imgs[0])}">` : ''}\n<script type="application/ld+json" id="ssr-ld">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)
    .replace('<p style="text-align:center;padding:3rem 0;color:#888;">Cargando vehículo...</p>', ssr);

  return { statusCode: 200, headers: { ...html, 'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600' }, body: out };
};
