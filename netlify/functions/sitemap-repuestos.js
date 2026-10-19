/**
 * Sitemap dinámico de repuestos (/repuesto/<slug>) y fichas de vehículos.
 * Redirect: /sitemap-repuestos.xml -> /.netlify/functions/sitemap-repuestos
 */
const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const x = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

exports.handler = async () => {
  try {
    const [ps, vs] = await Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/products?select=slug,updated_at,part_status,stock&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&slug=not.is.null&order=updated_at.desc', { headers: H }).then((r) => (r.ok ? r.json() : [])),
      fetch(SUPABASE_URL + '/rest/v1/vehiculos?select=slug,updated_at&is_active=eq.true&slug=not.is.null', { headers: H }).then((r) => (r.ok ? r.json() : [])),
    ]);
    const urls = [];
    for (const v of vs) urls.push(`<url><loc>${x(SITE + '/vehiculo.html?slug=' + encodeURIComponent(v.slug))}</loc>${v.updated_at ? `<lastmod>${v.updated_at.slice(0, 10)}</lastmod>` : ''}<changefreq>daily</changefreq><priority>0.8</priority></url>`);
    for (const p of ps) {
      if (p.part_status === 'vendida' || p.part_status === 'no_disponible' || !(p.stock > 0)) continue;
      urls.push(`<url><loc>${x(SITE + '/repuesto/' + p.slug)}</loc>${p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' },
      body: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n',
    };
  } catch (e) {
    console.error('sitemap-repuestos', e);
    return { statusCode: 500, body: 'error' };
  }
};
