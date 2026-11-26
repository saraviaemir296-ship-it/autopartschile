/**
 * /llms-full.txt — catálogo completo legible para asistentes de IA (GEO).
 * Una línea por repuesto disponible: nombre, precio, N° de parte OEM, compatibilidad, vehículo de origen, URL.
 * Se genera en vivo desde Supabase (solo piezas activas, con stock y precio), igual que el sitemap.
 * Redirect en netlify.toml: /llms-full.txt -> /.netlify/functions/llms-full
 */
const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');

function compat(p, v) {
  const c = p.vehicle_compatibility;
  const out = [];
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    const main = [c.make, c.model, c.engine, c.transmission, c.years || c.year].filter(Boolean).join(' ');
    if (main) out.push(main);
    if (Array.isArray(c.also)) out.push(...c.also.filter((x) => typeof x === 'string').slice(0, 6));
  } else if (Array.isArray(c)) out.push(...c.filter((x) => typeof x === 'string').slice(0, 6));
  else if (typeof c === 'string' && c) out.push(c);
  if (!out.length && v) out.push([v.marca, v.modelo, v.motor, v.anio_desde ? v.anio_desde + (v.anio_hasta && v.anio_hasta !== v.anio_desde ? '-' + v.anio_hasta : '') : ''].filter(Boolean).join(' '));
  return out.join('; ');
}
function garantia(p) {
  const t = (p.name + ' ' + (p.category || '')).toLowerCase();
  const el = /el[eé]ctric|electr[oó]nic|computador|\becu\b|sensor|m[oó]dulo|bobina|alternador|motor de partida|radio|pantalla|tablero|switch|rel[eé]|airbag|\bbcm\b|\babs\b/.test(t);
  return el ? 'pieza eléctrica: se prueba con video antes de entregar, sin garantía posventa' : 'garantía de funcionamiento 7 días';
}

exports.handler = async () => {
  try {
    const [ps, vs] = await Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/products?select=sku,name,slug,price_sale,oem_number,vehicle_compatibility,vehiculo_id,category,lado,part_status,stock,updated_at&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&slug=not.is.null&stock=gt.0&order=vehiculo_id.asc,name.asc&limit=5000', { headers: H }).then((r) => (r.ok ? r.json() : [])),
      fetch(SUPABASE_URL + '/rest/v1/vehiculos?select=id,slug,marca,modelo,motor,anio_desde,anio_hasta,color,is_active&order=marca.asc,modelo.asc', { headers: H }).then((r) => (r.ok ? r.json() : [])),
    ]);
    const byV = new Map(vs.map((v) => [v.id, v]));
    const avail = ps.filter((p) => p.part_status !== 'vendida' && p.part_status !== 'no_disponible');
    const hoy = new Date().toISOString().slice(0, 10);
    const L = [];
    L.push('# AutopartsChile · Desarmaduría Saravia — catálogo completo de repuestos (actualizado ' + hoy + ')');
    L.push('');
    L.push('> Repuestos originales usados retirados de vehículos en desarme en La Pintana, Santiago de Chile, más repuestos nuevos importados. Especialidad Suzuki (Swift, Celerio, Alto, SX4, Dzire, S-Cross, Ciaz, Vitara, Baleno), también Chevrolet, Kia, Hyundai, Peugeot, Audi y Jeep. Despacho a todo Chile (Starken, Chilexpress, Blue Express) o retiro en Av. Lo Blanco 1072, La Pintana. WhatsApp +56 9 5381 7335. Pago: Webpay, Mercado Pago, transferencia, efectivo.');
    L.push('> Cómo leer cada línea: nombre de la pieza · precio en pesos chilenos · número de parte OEM (si está) · compatibilidad · vehículo de origen · garantía · enlace. Los precios y el stock se actualizan en vivo; si una pieza no aparece aquí, no está disponible.');
    L.push('> Para confirmar compatibilidad, el cliente puede enviar la patente o el número de parte por WhatsApp antes de comprar.');
    L.push('');
    L.push('Total de repuestos disponibles ahora: ' + avail.length + '.');
    L.push('');
    const groups = new Map();
    for (const p of avail) {
      const v = byV.get(p.vehiculo_id);
      const key = v ? [v.marca, v.modelo, v.motor, v.anio_desde ? v.anio_desde + (v.anio_hasta && v.anio_hasta !== v.anio_desde ? '-' + v.anio_hasta : '') : '', v.color].filter(Boolean).join(' ') : 'Otros repuestos (sin vehículo de origen registrado)';
      if (!groups.has(key)) groups.set(key, { v, items: [] });
      groups.get(key).items.push(p);
    }
    for (const [key, g] of groups) {
      L.push('## ' + key + (g.v && g.v.slug && g.v.is_active ? ' — ' + SITE + '/vehiculo.html?slug=' + encodeURIComponent(g.v.slug) : ''));
      for (const p of g.items) {
        const parts = [p.name, clp(p.price_sale)];
        if (p.oem_number) parts.push('OEM ' + String(p.oem_number).replace(/\s+/g, ' ').trim());
        const c = compat(p, g.v); if (c) parts.push('compatible con ' + c);
        if (p.lado) parts.push('lado ' + p.lado);
        parts.push(p.part_status === 'en_vehiculo' ? 'aún montada en el vehículo (se desmonta al confirmar)' : 'desmontada, lista para despacho');
        parts.push(garantia(p));
        parts.push(SITE + '/repuesto/' + p.slug);
        L.push('- ' + parts.join(' · '));
      }
      L.push('');
    }
    L.push('## Páginas útiles');
    L.push('- Resumen del negocio y modelos: ' + SITE + '/llms.txt');
    L.push('- Catálogo navegable: ' + SITE + '/catalogo.html');
    L.push('- Vehículos en desarme: ' + SITE + '/vehiculos-en-desarme.html');
    L.push('- Repuestos Suzuki por modelo y por tipo de pieza: ' + SITE + '/suzuki');
    L.push('- Garantías y devoluciones: ' + SITE + '/garantias');
    L.push('- Envíos: ' + SITE + '/envios');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400', 'X-Robots-Tag': 'all' },
      body: L.join('\n'),
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Error generando el catálogo: ' + (e && e.message) };
  }
};
