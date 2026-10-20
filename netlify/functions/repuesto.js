/**
 * Página de repuesto renderizada en el servidor (SEO y buscadores con IA): /repuesto/<slug>
 * Netlify redirect: /repuesto/* -> /.netlify/functions/repuesto
 * Solo lee columnas públicas (anon). Sin foto real no se inventa imagen.
 */
const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const WA = '56953817335';
const HEADER = "<header class=\"header\"><div class=\"container header-inner\"><div class=\"header-brands\"><a href=\"/vehiculos-en-desarme.html\" class=\"brand-link brand-saravia\" aria-label=\"Desarmaduría Saravia — Venta de repuestos multimarca\"><span class=\"brand-saravia-plate\"><img src=\"/img/logo/desarmaduria-saravia.svg\" alt=\"Desarmaduría Saravia — Venta de repuestos multimarca\" width=\"52\" height=\"34\"></span><span class=\"brand-indicator\" aria-hidden=\"true\"></span></a><span class=\"brand-divider\" aria-hidden=\"true\"></span><a href=\"/catalogo.html\" class=\"brand-link brand-autopartschile\" aria-label=\"Autopartschile — Importación y repuestos\"><img src=\"/img/logo/autopartschile.svg\" alt=\"Autopartschile — Importación y repuestos\" width=\"60\" height=\"42\" loading=\"eager\"><span class=\"brand-indicator\" aria-hidden=\"true\"></span></a></div><div class=\"header-actions\"><a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"btn-wa-header\" target=\"_blank\" rel=\"noopener\"><span class=\"wa-full\">&#128172; Cotizar por WhatsApp</span><span class=\"wa-short\">&#128172; WhatsApp</span></a></div></div></header>\n<nav class=\"nav\"><div class=\"container\"><button class=\"nav-toggle\" onclick=\"document.getElementById('nl').classList.toggle('open')\" aria-label=\"Menú\">&#9776; Menú</button><ul class=\"nav-list\" id=\"nl\"><li><a href=\"/catalogo.html\">Catálogo</a></li><li><a href=\"/vehiculos-en-desarme.html\" class=\"active\">Vehículos en Desarme</a></li><li><a href=\"/como-comprar.html\">Cómo Comprar</a></li><li><a href=\"/garantias.html\">Garantías</a></li><li><a href=\"/envios.html\">Envíos</a></li><li><a href=\"/metodos-de-pago.html\">Métodos de Pago</a></li><li><a href=\"/sucursales.html\">Sucursales</a></li><li><a href=\"/faq.html\">FAQ</a></li><li><a href=\"/opiniones.html\">Opiniones</a></li><li><a href=\"/por-que-elegirnos.html\">¿Por qué Elegirnos?</a></li></ul></div></nav>";
const FOOTER = "<section class=\"cta-final\"><div class=\"container\"><h2>¿Tienes el modelo, el año y la pieza?</h2><p>Escríbenos por WhatsApp. Respondemos en menos de 5 minutos en horario de atención.</p><a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"btn-primary btn-lg\" target=\"_blank\" rel=\"noopener\">&#128172; Cotizar mi repuesto por WhatsApp</a></div></section>\n<footer class=\"footer\"><div class=\"container footer-grid\"><div class=\"footer-col\"><h4>Desarmaduría Saravia</h4><p>Especialistas en repuestos Suzuki. También Kia, Hyundai y Chevrolet.</p><div class=\"footer-social\"><a href=\"https://instagram.com/desarmaduriasaravia\" target=\"_blank\" rel=\"noopener\">Instagram</a><a href=\"https://facebook.com/desarmaduria.multimarcas.cyc\" target=\"_blank\" rel=\"noopener\">Facebook</a></div></div><div class=\"footer-col\"><h4>Catálogo</h4><ul><li><a href=\"/catalogo.html\">Repuestos Suzuki</a></li><li><a href=\"/vehiculos-en-desarme.html\">Vehículos en Desarme</a></li><li><a href=\"/catalogo.html#kia\">Repuestos Kia</a></li><li><a href=\"/catalogo.html#hyundai\">Repuestos Hyundai</a></li><li><a href=\"/catalogo.html#chevrolet\">Repuestos Chevrolet</a></li></ul></div><div class=\"footer-col\"><h4>Información</h4><ul><li><a href=\"/garantias.html\">Garantías y Devoluciones</a></li><li><a href=\"/envios.html\">Envíos a Todo Chile</a></li><li><a href=\"/metodos-de-pago.html\">Métodos de Pago</a></li><li><a href=\"/como-comprar.html\">Cómo Comprar</a></li><li><a href=\"/por-que-elegirnos.html\">¿Por qué Elegirnos?</a></li><li><a href=\"/faq.html\">Preguntas Frecuentes</a></li></ul></div><div class=\"footer-col\"><h4>Contacto</h4><p>&#128205; Av. Lo Blanco 1072, La Pintana</p><p>&#128205; Guacolda 2050, La Pintana</p><p>&#128172; <a href=\"https://wa.me/56953817335\">+56 9 5381 7335</a></p><p>&#128336; Lun–Vie 10:00–18:00 · Sáb 10:00–15:30</p></div></div><div class=\"footer-bottom\"><div class=\"container\"><p>&#169; 2026 Desarmaduría Saravia – AutopartsChile. Todos los derechos reservados.</p></div></div></footer>";
const WAFLOAT = "<a href=\"https://wa.me/56953817335?text=Hola%2C%20necesito%20cotizar%20un%20repuesto\" class=\"wa-float\" target=\"_blank\" rel=\"noopener\" aria-label=\"WhatsApp\">&#128172;</a>";

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
const abs = (u) => (/^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u);
const realImgs = (a) => (Array.isArray(a) ? a : []).filter((u) => typeof u === 'string' && u && !/favicon|placeholder|logo/i.test(u)).map(abs);
const jsStr = (s) => JSON.stringify(String(s)).replace(/</g, '\\u003c');

async function api(path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H });
  return r.ok ? r.json() : [];
}

function vehText(p, v) {
  if (v) return [v.marca, v.modelo, v.motor, v.anio_desde ? (v.anio_desde + (v.anio_hasta && v.anio_hasta !== v.anio_desde ? '-' + v.anio_hasta : '')) : ''].filter(Boolean).join(' ');
  const c = p.vehicle_compatibility;
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter((x) => typeof x === 'string').join(', ');
  return [c.make, c.model, c.engine, c.years || c.year].filter(Boolean).join(' ');
}

exports.handler = async (event) => {
  const slug = decodeURIComponent((event.path || '').replace(/^.*\/repuesto\//, '').replace(/\/$/, ''));
  if (!slug || !/^[a-z0-9-]{3,200}$/.test(slug)) return notFound();
  const rows = await api('products?select=id,sku,name,slug,description,brand,category,vehicle_compatibility,price_sale,stock,images,oem_number,warranty,part_status,vehiculo_id,seo_title,meta_description&is_active=eq.true&deleted_at=is.null&slug=eq.' + encodeURIComponent(slug) + '&limit=1');
  const p = rows[0];
  if (!p) return notFound();
  let v = null;
  let related = [];
  if (p.vehiculo_id) {
    const vs = await api('vehiculos?select=id,slug,marca,modelo,motor,anio_desde,anio_hasta,is_active&id=eq.' + p.vehiculo_id);
    v = vs[0] || null;
    related = await api('products?select=name,slug,price_sale&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&slug=not.is.null&vehiculo_id=eq.' + p.vehiculo_id + '&id=neq.' + p.id + '&order=name.asc&limit=12');
  }
  const veh = vehText(p, v);
  const nameHasVeh = v && p.name.toLowerCase().includes(String(v.modelo).toLowerCase());
  const h1 = nameHasVeh || !veh ? p.name : p.name + ' ' + veh;
  const imgs = realImgs(p.images);
  const price = Math.round(Number(p.price_sale) || 0);
  const sold = p.part_status === 'vendida' || p.part_status === 'no_disponible' || !(p.stock > 0) || !(price > 0);
  const enVeh = p.part_status === 'en_vehiculo';
  const url = SITE + '/repuesto/' + p.slug;
  const title = (p.seo_title && p.seo_title.length > 20 ? p.seo_title : h1 + ' usado original') + ' | Desarmaduría Saravia';
  const desc = p.meta_description || ('Compra ' + h1 + ' original usado a ' + clp(price) + '. Repuesto revisado con garantía, pago con Webpay y despacho a todo Chile o retiro en La Pintana.');
  const vehUrl = v && v.is_active && v.slug ? SITE + '/vehiculo.html?slug=' + encodeURIComponent(v.slug) : null;
  const brandName = (v && v.marca) || p.brand || '';

  const ld = [{
    '@context': 'https://schema.org', '@type': 'Product', name: h1, sku: p.sku, url,
    description: p.description || desc, category: p.category || 'Repuestos de autos',
    ...(imgs.length ? { image: imgs.slice(0, 5) } : {}),
    ...(p.oem_number ? { mpn: p.oem_number } : {}),
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    offers: {
      '@type': 'Offer', url, price, priceCurrency: 'CLP', itemCondition: 'https://schema.org/UsedCondition',
      availability: sold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoPartsStore', name: 'Desarmaduría Saravia', url: SITE, telephone: '+56953817335',
        address: { '@type': 'PostalAddress', streetAddress: 'Av. Lo Blanco 1072', addressLocality: 'La Pintana', addressRegion: 'Región Metropolitana', addressCountry: 'CL' },
      },
    },
  }, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Vehículos en desarme', item: SITE + '/vehiculos-en-desarme.html' },
      ...(vehUrl ? [{ '@type': 'ListItem', position: 3, name: veh, item: vehUrl }] : []),
      { '@type': 'ListItem', position: vehUrl ? 4 : 3, name: p.name, item: url },
    ],
  }];

  const waText = encodeURIComponent('Hola, me interesa: ' + h1 + ' (' + p.sku + ') a ' + clp(price) + '. ¿Está disponible?');
  const facts = [
    ['Precio', clp(price)],
    ['Estado', sold ? 'Vendido / no disponible' : enVeh ? 'En el vehículo (se desmonta al confirmar tu compra)' : 'Desmontado y listo para despacho'],
    ['Condición', 'Original usado, revisado'],
    veh ? ['Vehículo de origen', veh] : null,
    p.oem_number ? ['Número OEM', p.oem_number] : null,
    ['Código interno', p.sku],
    ['Garantía', p.warranty || 'Garantía de funcionamiento'],
    ['Entrega', 'Despacho a todo Chile o retiro en Av. Lo Blanco 1072, La Pintana'],
    ['Pago', 'Webpay (débito y crédito) o transferencia'],
  ].filter(Boolean);

  const body = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta name="robots" content="${sold ? 'noindex,follow' : 'index,follow'}">
<meta property="og:type" content="product"><meta property="og:title" content="${esc(h1)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">${imgs[0] ? `<meta property="og:image" content="${esc(imgs[0])}">` : ''}
<meta property="product:price:amount" content="${price}"><meta property="product:price:currency" content="CLP">
<link rel="icon" type="image/png" href="/img/favicon.png"><link rel="stylesheet" href="/styles.css?v=20261019acc">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TXKXWQCTZ1"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TXKXWQCTZ1');gtag('event','view_item',{currency:'CLP',value:${price},items:[{item_id:${jsStr(p.sku)},item_name:${jsStr(p.name)},price:${price}}]});</script>
<style>
.rp{display:grid;grid-template-columns:1.05fr 1fr;gap:2rem;margin-top:1.2rem;align-items:start}@media(max-width:800px){.rp{grid-template-columns:1fr;gap:1.2rem}}
.rp-main{border-radius:14px;overflow:hidden;background:#f1f1f1;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:#999;font-weight:700}
.rp-main img{width:100%;height:100%;object-fit:cover}
.rp-th{display:flex;gap:.5rem;margin-top:.6rem;flex-wrap:wrap}.rp-th img{width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:pointer}
.rp h1{font-size:1.5rem;line-height:1.2;margin:.4rem 0 .6rem}.rp-price{font-size:2rem;font-weight:800;color:var(--red);margin:.4rem 0}
.rp-st{display:inline-block;font-size:.8rem;font-weight:700;padding:.25rem .6rem;border-radius:6px}.rp-st.ok{background:#e8f9ee;color:#15803d}.rp-st.veh{background:#fff4d6;color:#8a5a00}.rp-st.no{background:#eee;color:#666}
.rp-cta{display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0}.rp-cta a,.rp-cta button{flex:1;min-width:170px;text-align:center;border:none;border-radius:10px;padding:.9rem 1rem;font-weight:800;font-size:.95rem;cursor:pointer;text-decoration:none}
.rp-add{background:var(--red);color:#fff}.rp-wa{background:#25D366;color:#fff}
.rp-facts{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.9rem}.rp-facts th{text-align:left;color:#666;font-weight:600;padding:.45rem .4rem;width:38%;border-bottom:1px solid #eee}.rp-facts td{padding:.45rem .4rem;border-bottom:1px solid #eee}
.rp-rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.7rem;margin-top:.8rem}.rp-rel a{background:#fff;border-radius:12px;padding:.6rem;text-decoration:none;color:#111;box-shadow:0 1px 6px rgba(0,0,0,.06);font-size:.85rem;font-weight:700}.rp-rel b{display:block;color:var(--red);margin-top:.3rem}
.rp-faq details{background:#fff;border-radius:10px;padding:.8rem 1rem;margin-bottom:.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05)}.rp-faq summary{font-weight:700;cursor:pointer}
.rp-fav{position:static;width:auto;height:auto;border-radius:8px;padding:.55rem .9rem;gap:.4rem;font-size:.9rem;font-weight:700;color:#555;box-shadow:none;border:1.5px solid #ddd;background:#fff}.rp-fav.on{color:var(--red);border-color:var(--red)}
.rp-trust{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:1rem 0}.rp-trust div{background:#f7f7f7;border-radius:10px;padding:.65rem .75rem;display:flex;flex-direction:column;gap:.15rem}.rp-trust b{font-size:.85rem}.rp-trust span{font-size:.78rem;color:#555;line-height:1.35}.rp-trust a{color:var(--red);font-weight:700}
.rp-google{display:inline-block;font-weight:700;font-size:.88rem;color:#111;text-decoration:underline;margin-bottom:.4rem}
</style></head><body>
${HEADER}
<section class="page-content"><div class="container">
<div class="breadcrumb"><a href="/">Inicio</a> › <a href="/vehiculos-en-desarme.html">Vehículos en Desarme</a>${vehUrl ? ` › <a href="${esc(vehUrl)}">${esc(veh)}</a>` : ''} › ${esc(p.name)}</div>
<div class="rp">
<div><div class="rp-main">${imgs[0] ? `<img id="rpImg" src="${esc(imgs[0])}" alt="${esc(h1)}">` : 'Foto disponible por WhatsApp'}</div>
${imgs.length > 1 ? `<div class="rp-th">${imgs.map((u) => `<img src="${esc(u)}" alt="${esc(h1)}" loading="lazy" data-full="${esc(u)}">`).join('')}</div>` : ''}</div>
<div>
<span class="rp-st ${sold ? 'no' : enVeh ? 'veh' : 'ok'}">${sold ? 'No disponible' : enVeh ? 'En el vehículo · se desmonta al confirmar' : '✓ Desmontado · listo para despacho'}</span>
<h1>${esc(h1)}</h1>
<div class="rp-price">${clp(price)}</div>
<p style="color:#555;margin:0">Repuesto original usado, retirado de un vehículo en desarme y revisado.${veh ? ' Proviene de un ' + esc(veh) + '.' : ''}</p>
<div class="rp-cta">${sold ? '' : '<button class="rp-add" type="button" id="rpAdd">🛒 Agregar al carrito</button>'}
<a class="rp-wa" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${waText}">💬 Consultar por WhatsApp</a></div>
<button type="button" class="apc-fav rp-fav" data-sku="${esc(p.sku)}" aria-pressed="false" aria-label="Guardar en favoritos">❤ <span>Guardar en favoritos</span></button>
<div class="rp-trust">
<div><b>🛡️ Compra protegida</b><span>Pago con Webpay en la web o en el local. Confirmamos stock y compatibilidad antes de despachar.</span></div>
<div><b>🔁 Garantía</b><span>Garantía de funcionamiento según nuestras <a href="/garantias">condiciones</a>.</span></div>
<div><b>🚚 Despacho o retiro</b><span>A todo Chile con el transportista que prefieras, o retiro en La Pintana.</span></div>
<div><b>💳 Medios de pago</b><span>Webpay (débito y crédito) · Transferencia · Mercado Pago</span></div>
</div>
<a class="rp-google" href="https://www.google.com/maps?cid=17947887919721508836" target="_blank" rel="noopener">⭐ Ver opiniones de clientes en Google</a>
<table class="rp-facts">${facts.map(([k, x]) => `<tr><th>${esc(k)}</th><td>${esc(x)}</td></tr>`).join('')}</table>
</div></div>
${p.description ? `<h2 style="margin-top:2rem">Descripción</h2><p style="white-space:pre-line;line-height:1.6;color:#333">${esc(p.description)}</p>` : ''}
<div class="rp-faq" style="margin-top:2rem"><h2>Preguntas frecuentes</h2>
<details><summary>¿Este repuesto sirve para mi auto?</summary><p>Proviene de un ${esc(veh || 'vehículo del mismo modelo')}. Para confirmar compatibilidad envíanos tu patente o el número de pieza por WhatsApp antes de comprar.</p></details>
<details><summary>¿Tiene garantía?</summary><p>Sí, garantía de funcionamiento según nuestras <a href="/garantias.html">condiciones de garantía</a>.</p></details>
<details><summary>¿Hacen envíos?</summary><p>Despachamos a todo Chile. También puedes retirar en Av. Lo Blanco 1072, La Pintana, Santiago.</p></details>
<details><summary>¿Cómo pago?</summary><p>Con Webpay (tarjeta de débito o crédito) directamente en la web, o por transferencia.</p></details>
</div>
${related.length ? `<h2 style="margin-top:2rem">Más repuestos de ${esc(veh)}</h2><div class="rp-rel">${related.map((r) => `<a href="/repuesto/${esc(r.slug)}">${esc(r.name)}<b>${clp(r.price_sale)}</b></a>`).join('')}</div>${vehUrl ? `<p style="margin-top:1rem"><a href="${esc(vehUrl)}" class="btn-primary">Ver todos los repuestos de este auto →</a></p>` : ''}` : ''}
</div></section>
${FOOTER}
${WAFLOAT}
<script src="/js/apc-store.js?v=20261019b" defer></script>
<script src="/cart.js" defer></script>
<script>
(function(){
var th=document.querySelector('.rp-th');if(th)th.addEventListener('click',function(e){var i=e.target.closest('img');if(i)document.getElementById('rpImg').src=i.getAttribute('data-full');});
var b=document.getElementById('rpAdd');if(b)b.addEventListener('click',function(){if(!window.apcCart)return;window.apcCart.add(${jsStr(p.sku)},${jsStr(p.name)},${price},1);try{gtag('event','add_to_cart',{currency:'CLP',value:${price},items:[{item_id:${jsStr(p.sku)},price:${price},quantity:1}]})}catch(e){}b.textContent='✓ Agregado';setTimeout(function(){b.textContent='🛒 Agregar al carrito'},1400);});
document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){a.addEventListener('click',function(){try{gtag('event','generate_lead',{method:'whatsapp',lead_source:'repuesto'})}catch(e){}})});
})();
</script>
</body></html>`;

  return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600' }, body };
};

function notFound() {
  return {
    statusCode: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Repuesto no encontrado</title><meta http-equiv="refresh" content="0;url=/catalogo.html"></head><body><a href="/catalogo.html">Ver catálogo</a></body></html>',
  };
}
