/**
 * Páginas por modelo Suzuki renderizadas en el servidor (GEO / buscadores con IA).
 *   /suzuki            -> índice de modelos
 *   /suzuki/<modelo>   -> repuestos, autos en desarme y preguntas frecuentes del modelo
 * Netlify redirect: /suzuki y /suzuki/* -> /.netlify/functions/modelo
 *
 * Todo sale de Supabase en cada visita (con caché de 10 min): no hay que regenerar nada
 * cuando entra un auto o se sube un repuesto. Solo se afirma lo que está en la base:
 * vehículos de origen, motores y años cargados. No se inventa compatibilidad.
 */
const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const WA = '56953817335';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// slug -> nombre visible y patrones (ilike) contra vehicle_compatibility->>model y vehiculos.modelo.
// El orden es el de prioridad del plan GEO (inventario + consultas por WhatsApp).
const MODELOS = [
  { slug: 'celerio', nombre: 'Celerio', pat: ['Celerio'] },
  { slug: 'sx4', nombre: 'SX4', pat: ['SX4'] },
  { slug: 'swift', nombre: 'Swift', pat: ['Swift'], excl: ['Dzire'] },
  { slug: 'alto-800', nombre: 'Alto 800', pat: ['Alto 800'] },
  { slug: 'alto-k10', nombre: 'Alto K10', pat: ['K10'] },
  { slug: 's-presso', nombre: 'S-Presso', pat: ['Presso'] },
  { slug: 'dzire', nombre: 'Dzire', pat: ['Dzire'] },
  { slug: 'baleno', nombre: 'Baleno', pat: ['Baleno'] },
  { slug: 's-cross', nombre: 'S-Cross', pat: ['S-Cross', 'SCross', 'S Cross'] },
  { slug: 'vitara', nombre: 'Vitara / Grand Vitara / Grand Nomade', pat: ['Vitara', 'Nomade'] },
  { slug: 'ignis', nombre: 'Ignis', pat: ['Ignis'] },
  { slug: 'ciaz', nombre: 'Ciaz', pat: ['Ciaz'] },
  { slug: 'aerio', nombre: 'Aerio / Liana', pat: ['Aerio', 'Liana'] },
  { slug: 'alto', nombre: 'Alto (1.0 y 1.1)', pat: ['Alto'], excl: ['800', 'K10'] },
  { slug: 'mastervan', nombre: 'Mastervan / APV', pat: ['Mastervan', 'APV'] },
];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
const abs = (u) => (/^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u);
const realImgs = (a) => (Array.isArray(a) ? a : []).filter((u) => typeof u === 'string' && u && !/favicon|placeholder|logo/i.test(u)).map(abs);
const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

async function api(path) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H });
    return r.ok ? r.json() : [];
  } catch (e) {
    console.error('modelo api', path, e);
    return [];
  }
}

const orIlike = (col, pats) => 'or=(' + pats.map((p) => col + '.ilike.*' + encodeURIComponent(p) + '*').join(',') + ')';
const excluded = (txt, excl) => (excl || []).some((e) => String(txt || '').toLowerCase().includes(e.toLowerCase()));

async function datosModelo(m) {
  const [prods, vehs] = await Promise.all([
    api('products?select=sku,name,slug,price_sale,images,oem_number,part_status,stock,vehiculo_id,vehicle_compatibility&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&slug=not.is.null&vehicle_compatibility->>make=ilike.suzuki&' + orIlike('vehicle_compatibility->>model', m.pat) + '&order=updated_at.desc&limit=1000'),
    api('vehiculos?select=id,slug,marca,modelo,motor,transmision,anio_desde,anio_hasta,color,images,en_desarme&is_active=eq.true&marca=ilike.suzuki&' + orIlike('modelo', m.pat) + '&order=created_at.desc'),
  ]);
  const ps = prods.filter((p) => !excluded(p.vehicle_compatibility && p.vehicle_compatibility.model, m.excl))
    .filter((p) => p.part_status !== 'vendida' && p.part_status !== 'no_disponible' && p.stock > 0);
  const vs = vehs.filter((v) => !excluded(v.modelo, m.excl));
  return { ps, vs };
}

const anios = (v) => (v.anio_desde ? v.anio_desde + (v.anio_hasta && v.anio_hasta !== v.anio_desde ? '-' + v.anio_hasta : '') : '');
const motorDe = (p) => (p.vehicle_compatibility && p.vehicle_compatibility.engine) || '';

function page({ title, desc, url, ld, body, robots }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta name="robots" content="${robots || 'index,follow'}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<link rel="icon" type="image/png" href="/img/favicon.png"><link rel="stylesheet" href="/styles.css?v=20261020of">
<script type="application/ld+json">${ldJson(ld)}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TXKXWQCTZ1"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TXKXWQCTZ1');</script>
<style>
.md-lead{font-size:1.05rem;line-height:1.6;color:#222;max-width:860px}
.md-stats{display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0}.md-stats div{background:#fff;border-radius:10px;padding:.6rem .9rem;box-shadow:0 1px 5px rgba(0,0,0,.06);font-size:.85rem}.md-stats b{display:block;font-size:1.15rem;color:var(--red)}
.md-tab{width:100%;border-collapse:collapse;margin:.8rem 0;font-size:.9rem;background:#fff}.md-tab th,.md-tab td{padding:.5rem .6rem;border-bottom:1px solid #eee;text-align:left}.md-tab th{background:#111;color:#fff;font-weight:700}
.md-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.8rem;margin-top:.8rem}
.md-card{background:#fff;border-radius:12px;overflow:hidden;text-decoration:none;color:#111;box-shadow:0 1px 6px rgba(0,0,0,.07);display:flex;flex-direction:column}
.md-card .ph{aspect-ratio:4/3;background:#f1f1f1;display:flex;align-items:center;justify-content:center;color:#999;font-size:.75rem;font-weight:700}.md-card .ph img{width:100%;height:100%;object-fit:cover}
.md-card .tx{padding:.55rem .65rem;font-size:.84rem;font-weight:700;line-height:1.25;flex:1}.md-card b{display:block;color:var(--red);margin-top:.35rem;font-size:.95rem}
.md-faq details{background:#fff;border-radius:10px;padding:.8rem 1rem;margin-bottom:.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05)}.md-faq summary{font-weight:700;cursor:pointer}
.md-models{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.8rem;margin-top:1rem}.md-models a{background:#fff;border-radius:12px;padding:1rem;text-decoration:none;color:#111;box-shadow:0 1px 6px rgba(0,0,0,.07);font-weight:800}.md-models span{display:block;font-weight:500;color:#555;font-size:.85rem;margin-top:.3rem}
.md-upd{color:#777;font-size:.8rem;margin-top:1.5rem}
</style></head><body>
${HEADER}
<section class="page-content"><div class="container">${body}</div></section>
${FOOTER}
${WAFLOAT}
<script>document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){a.addEventListener('click',function(){try{gtag('event','generate_lead',{method:'whatsapp',lead_source:'modelo'})}catch(e){}})});</script>
</body></html>`;
}

const STORE = {
  '@type': 'AutoPartsStore', '@id': SITE + '/#store', name: 'Desarmaduría Saravia', alternateName: 'AutopartsChile', url: SITE, telephone: '+56953817335',
  address: { '@type': 'PostalAddress', streetAddress: 'Av. Lo Blanco 1072', addressLocality: 'La Pintana', addressRegion: 'Región Metropolitana', addressCountry: 'CL' },
  areaServed: { '@type': 'Country', name: 'Chile' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '15:30' },
  ],
};

async function indice() {
  const datos = await Promise.all(MODELOS.map(async (m) => ({ m, d: await datosModelo(m) })));
  const items = datos.filter(({ d }) => d.ps.length || d.vs.length);
  const url = SITE + '/suzuki';
  const total = items.reduce((s, { d }) => s + d.ps.length, 0);
  const title = 'Repuestos Suzuki usados originales por modelo | Desarmaduría Saravia';
  const desc = `Repuestos Suzuki usados originales en Chile: ${items.map(({ m }) => m.nombre.split(' /')[0]).slice(0, 8).join(', ')} y más. ${total} piezas con precio. Retiro en La Pintana o envío a todo Chile.`;
  const ld = [
    { '@context': 'https://schema.org', ...STORE },
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Repuestos Suzuki por modelo', url, about: { '@type': 'Brand', name: 'Suzuki' }, isPartOf: { '@id': SITE + '/#store' },
      hasPart: items.map(({ m }) => ({ '@type': 'WebPage', name: 'Repuestos Suzuki ' + m.nombre, url: SITE + '/suzuki/' + m.slug })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Repuestos Suzuki', item: url } ] },
  ];
  const body = `<div class="breadcrumb"><a href="/">Inicio</a> › Repuestos Suzuki</div>
<h1>Repuestos Suzuki usados originales por modelo</h1>
<p class="md-lead">Desarmaduría Saravia (La Pintana, Santiago) vende repuestos <b>usados originales de Suzuki</b> retirados de vehículos en desarme. Hoy hay <b>${total} piezas Suzuki con precio</b> publicadas. Retiro en Av. Lo Blanco 1072, La Pintana, o envío a todo Chile por Starken, Chilexpress o Blue Express. Cotiza con tu patente por WhatsApp al <a href="https://wa.me/${WA}">+56 9 5381 7335</a>.</p>
<div class="md-models">${items.map(({ m, d }) => `<a href="/suzuki/${m.slug}">Suzuki ${esc(m.nombre)}<span>${d.ps.length} repuestos${d.vs.length ? ' · ' + d.vs.length + ' en desarme' : ''}</span></a>`).join('')}</div>
<p class="md-upd">Actualizado automáticamente desde nuestro inventario: ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}.</p>`;
  return page({ title, desc, url, ld, body });
}

async function modelo(m) {
  const { ps, vs } = await datosModelo(m);
  const url = SITE + '/suzuki/' + m.slug;
  if (!ps.length && !vs.length) {
    return page({ title: 'Repuestos Suzuki ' + m.nombre + ' | Desarmaduría Saravia', desc: 'Repuestos usados originales Suzuki ' + m.nombre + '. Consulta disponibilidad por WhatsApp.', url, ld: [{ '@context': 'https://schema.org', ...STORE }], robots: 'noindex,follow',
      body: `<h1>Repuestos Suzuki ${esc(m.nombre)}</h1><p class="md-lead">En este momento no tenemos repuestos publicados de este modelo. Escríbenos por WhatsApp al <a href="https://wa.me/${WA}">+56 9 5381 7335</a> con tu patente y te avisamos cuando ingrese uno a desarme.</p><p><a class="btn-primary" href="/suzuki">Ver todos los modelos Suzuki</a></p>` });
  }
  // Fotos primero: es lo que compra y lo que la IA puede mostrar.
  const conFoto = ps.filter((p) => realImgs(p.images).length);
  const sinFoto = ps.filter((p) => !realImgs(p.images).length);
  const lista = conFoto.concat(sinFoto);
  const precios = ps.map((p) => Number(p.price_sale)).filter((n) => n > 0).sort((a, b) => a - b);
  // Motores únicos: "K12M 1.2", "K12M" y "1.2" cuentan como uno (se queda el más completo).
  const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const motores = vs.map((v) => v.motor).concat(ps.map(motorDe)).filter(Boolean).map((s) => String(s).trim())
    .sort((a, b) => b.length - a.length)
    .reduce((acc, s) => (acc.some((x) => norm(s).includes(norm(x)) || norm(x).includes(norm(s))) ? acc : acc.concat(s)), [])
    .slice(0, 6);
  const oems = ps.filter((p) => p.oem_number && /^[0-9A-Za-z-]+$/.test(p.oem_number)).length;
  const nombreCorto = m.nombre.split(' /')[0];

  const title = `Repuestos Suzuki ${nombreCorto} usados originales${motores.length ? ' (' + motores.slice(0, 2).join(', ') + ')' : ''} | Desarmaduría Saravia`;
  const desc = `${ps.length} repuestos usados originales de Suzuki ${nombreCorto}${precios.length ? ' desde ' + clp(precios[0]) : ''}. ${vs.length ? vs.length + ' auto(s) en desarme. ' : ''}Retiro en La Pintana o envío a todo Chile. Cotiza por WhatsApp.`;

  const faq = [
    [`¿Dónde comprar repuestos usados de Suzuki ${nombreCorto} en Chile?`, `En Desarmaduría Saravia (Av. Lo Blanco 1072, La Pintana, Santiago) hay ${ps.length} repuestos usados originales de Suzuki ${nombreCorto} publicados con precio en autopartschile.cl/suzuki/${m.slug}. Se puede retirar en el local o pedir envío a todo Chile.`],
    [`¿Cuánto cuestan los repuestos de Suzuki ${nombreCorto}?`, precios.length ? `Los repuestos publicados de Suzuki ${nombreCorto} van desde ${clp(precios[0])} hasta ${clp(precios[precios.length - 1])}, según la pieza. Cada ficha muestra su precio en pesos chilenos.` : 'Cotiza por WhatsApp con tu patente y la pieza.'],
    [`¿Cómo sé si la pieza le sirve a mi Suzuki ${nombreCorto}?`, `Cada repuesto indica el vehículo del que se retiró${motores.length ? ' (motor ' + motores.join(', ') + ')' : ''}${oems ? ' y, cuando está verificado, el número de parte original (OEM)' : ''}. Antes de comprar envía tu patente o el número de pieza por WhatsApp al +56 9 5381 7335 y confirmamos la compatibilidad.`],
    ['¿Los repuestos tienen garantía?', 'Los motores completos, medio motor, cajas de cambio y cremalleras de dirección tienen garantía de funcionamiento de 7 días. Las demás piezas usadas se prueban antes de la entrega y te enviamos fotos o video antes de comprar.'],
    ['¿Hacen envíos a regiones?', 'Sí. Despachamos a todo Chile por Starken, Chilexpress o Blue Express. También se puede retirar en La Pintana de lunes a viernes de 10:00 a 18:00 y sábado de 10:00 a 15:30.'],
    ['¿Cómo pago?', 'Con Webpay (débito o crédito) en la web, Mercado Pago, transferencia o efectivo en el local.'],
  ];

  const ld = [
    { '@context': 'https://schema.org', ...STORE },
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Repuestos Suzuki ' + m.nombre, url, description: desc, isPartOf: { '@id': SITE + '/#store' },
      about: { '@type': 'Car', name: 'Suzuki ' + m.nombre, brand: { '@type': 'Brand', name: 'Suzuki' }, model: nombreCorto },
      mainEntity: { '@type': 'ItemList', numberOfItems: lista.length, itemListElement: lista.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/repuesto/' + p.slug, name: p.name })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Repuestos Suzuki', item: SITE + '/suzuki' },
      { '@type': 'ListItem', position: 3, name: 'Suzuki ' + m.nombre, item: url } ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];

  const tablaVeh = vs.length ? `<h2>Suzuki ${esc(nombreCorto)} en desarme ahora</h2>
<table class="md-tab"><tr><th>Vehículo</th><th>Motor</th><th>Años</th><th>Transmisión</th><th></th></tr>
${vs.map((v) => `<tr><td>${esc([v.marca, v.modelo, v.color].filter(Boolean).join(' '))}</td><td>${esc(v.motor || '—')}</td><td>${esc(anios(v) || '—')}</td><td>${esc(v.transmision || '—')}</td><td>${v.slug ? `<a href="/vehiculo?slug=${encodeURIComponent(v.slug)}">Ver piezas</a>` : ''}</td></tr>`).join('')}
</table><p style="font-size:.85rem;color:#555">Los años son los del vehículo de origen cargado en nuestro sistema. Para piezas que se cruzan entre modelos, confirma por WhatsApp con tu patente.</p>` : '';

  const card = (p) => {
    const img = realImgs(p.images)[0];
    return `<a class="md-card" href="/repuesto/${esc(p.slug)}"><div class="ph">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : 'Foto por WhatsApp'}</div><div class="tx">${esc(p.name)}<b>${clp(p.price_sale)}</b></div></a>`;
  };

  const body = `<div class="breadcrumb"><a href="/">Inicio</a> › <a href="/suzuki">Repuestos Suzuki</a> › Suzuki ${esc(m.nombre)}</div>
<h1>Repuestos Suzuki ${esc(m.nombre)} usados originales</h1>
<p class="md-lead">En <b>Desarmaduría Saravia</b> (La Pintana, Santiago) vendemos repuestos usados originales de <b>Suzuki ${esc(nombreCorto)}</b>${motores.length ? ', motor ' + esc(motores.join(', ')) : ''}, retirados de vehículos en desarme. Hay <b>${ps.length} piezas publicadas</b>${precios.length ? ' desde <b>' + clp(precios[0]) + '</b>' : ''}. Retiro en Av. Lo Blanco 1072 o envío a todo Chile. Cotiza con tu patente por WhatsApp al <a href="https://wa.me/${WA}?text=${encodeURIComponent('Hola, busco un repuesto de Suzuki ' + nombreCorto)}">+56 9 5381 7335</a>.</p>
<div class="md-stats"><div><b>${ps.length}</b>repuestos publicados</div><div><b>${conFoto.length}</b>con foto</div>${vs.length ? `<div><b>${vs.length}</b>en desarme</div>` : ''}${precios.length ? `<div><b>${clp(precios[0])}</b>desde</div>` : ''}</div>
${tablaVeh}
<h2>Repuestos Suzuki ${esc(nombreCorto)} disponibles</h2>
<div class="md-grid">${lista.slice(0, 120).map(card).join('')}</div>
${lista.length > 120 ? `<p style="margin-top:1rem">Mostrando 120 de ${lista.length}. <a href="/catalogo">Busca el resto en el catálogo</a> o pregúntanos por WhatsApp.</p>` : ''}
<div class="md-faq" style="margin-top:2rem"><h2>Preguntas frecuentes sobre repuestos Suzuki ${esc(nombreCorto)}</h2>
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
<p style="margin-top:1.5rem"><a class="btn-primary" href="/suzuki">Ver otros modelos Suzuki</a></p>
<p class="md-upd">Página actualizada automáticamente desde nuestro inventario: ${new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}.</p>`;
  return page({ title, desc, url, ld, body });
}

exports.handler = async (event) => {
  const slug = String(event.path || '').replace(/^.*\/suzuki\/?/, '').replace(/\/$/, '').toLowerCase();
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600' };
  try {
    if (!slug) return { statusCode: 200, headers, body: await indice() };
    const m = MODELOS.find((x) => x.slug === slug);
    if (!m) return { statusCode: 301, headers: { Location: '/suzuki' }, body: '' };
    return { statusCode: 200, headers, body: await modelo(m) };
  } catch (e) {
    console.error('modelo', slug, e);
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'error' };
  }
};

exports.MODELOS = MODELOS;

const HEADER = "<header class=\"header\"><div class=\"container header-inner\"><div class=\"header-brands\"><a href=\"/vehiculos-en-desarme\" class=\"brand-link brand-saravia\" aria-label=\"Desarmaduría Saravia — Venta de repuestos multimarca\"><span class=\"brand-saravia-plate\"><img src=\"/img/logo/desarmaduria-saravia.svg\" alt=\"Desarmaduría Saravia — Venta de repuestos multimarca\" width=\"52\" height=\"34\"></span><span class=\"brand-indicator\" aria-hidden=\"true\"></span></a><span class=\"brand-divider\" aria-hidden=\"true\"></span><a href=\"/catalogo\" class=\"brand-link brand-autopartschile\" aria-label=\"Autopartschile — Importación y repuestos\"><img src=\"/img/logo/autopartschile.svg\" alt=\"Autopartschile — Importación y repuestos\" width=\"60\" height=\"42\" loading=\"eager\"><span class=\"brand-indicator\" aria-hidden=\"true\"></span></a></div><div class=\"header-actions\"><a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"btn-wa-header\" target=\"_blank\" rel=\"noopener\"><span class=\"wa-full\">&#128172; Cotizar por WhatsApp</span><span class=\"wa-short\">&#128172; WhatsApp</span></a></div></div></header>\n<nav class=\"nav\"><div class=\"container\"><button class=\"nav-toggle\" onclick=\"document.getElementById('nl').classList.toggle('open')\" aria-label=\"Menú\">&#9776; Menú</button><ul class=\"nav-list\" id=\"nl\"><li><a href=\"/catalogo\">Catálogo</a></li><li><a href=\"/suzuki\" class=\"active\">Repuestos Suzuki</a></li><li><a href=\"/vehiculos-en-desarme\">Vehículos en Desarme</a></li><li><a href=\"/como-comprar\">Cómo Comprar</a></li><li><a href=\"/envios\">Envíos</a></li><li><a href=\"/metodos-de-pago\">Métodos de Pago</a></li><li><a href=\"/faq\">FAQ</a></li><li><a href=\"/opiniones\">Opiniones</a></li></ul></div></nav>";
const FOOTER = "<section class=\"cta-final\"><div class=\"container\"><h2>¿Tienes el modelo, el año y la pieza?</h2><p>Escríbenos por WhatsApp con tu patente y te cotizamos.</p><a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"btn-primary btn-lg\" target=\"_blank\" rel=\"noopener\">&#128172; Cotizar mi repuesto por WhatsApp</a></div></section>\n<footer class=\"footer\"><div class=\"container footer-grid\"><div class=\"footer-col\"><h4>Desarmaduría Saravia</h4><p>Especialistas en repuestos Suzuki. También Kia, Hyundai y Chevrolet.</p></div><div class=\"footer-col\"><h4>Catálogo</h4><ul><li><a href=\"/suzuki\">Repuestos Suzuki por modelo</a></li><li><a href=\"/catalogo\">Catálogo completo</a></li><li><a href=\"/vehiculos-en-desarme\">Vehículos en Desarme</a></li></ul></div><div class=\"footer-col\"><h4>Información</h4><ul><li><a href=\"/garantias\">Condiciones y Devoluciones</a></li><li><a href=\"/envios\">Envíos a Todo Chile</a></li><li><a href=\"/metodos-de-pago\">Métodos de Pago</a></li><li><a href=\"/faq\">Preguntas Frecuentes</a></li></ul></div><div class=\"footer-col\"><h4>Contacto</h4><p>&#128205; Av. Lo Blanco 1072, La Pintana</p><p>&#128172; <a href=\"https://wa.me/56953817335\">+56 9 5381 7335</a></p><p>&#128336; Lun–Vie 10:00–18:00 · Sáb 10:00–15:30</p></div></div><div class=\"footer-bottom\"><div class=\"container\"><p>&#169; 2026 Desarmaduría Saravia – AutopartsChile.</p></div></div></footer>";
const WAFLOAT = "<a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"wa-float\" target=\"_blank\" rel=\"noopener\" aria-label=\"WhatsApp\">&#128172;</a>";
