/**
 * Función programada (ver netlify.toml): avisa por IndexNow las URLs nuevas o actualizadas.
 * IndexNow lo usan Bing (motor de búsqueda de ChatGPT y Copilot), Yandex, Seznam y Naver.
 * Clave: archivo /0dd62e96d86b94b582a4a8060f278d9e.txt en la raíz del sitio.
 * Las funciones programadas de Netlify no se pueden llamar por URL en producción; para forzar un envío usar "Run now" en el panel de Netlify.
 */
const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
const SITE = 'https://autopartschile.cl';
const HOST = 'autopartschile.cl';
const INDEXNOW_KEY = '0dd62e96d86b94b582a4a8060f278d9e';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const { MODELOS } = require('./modelo');

async function api(path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H });
  return r.ok ? r.json() : [];
}

exports.handler = async () => {
  const desde = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
  const filtro = '&updated_at=gte.' + encodeURIComponent(desde);
  const [ps, vs] = await Promise.all([
    api('products?select=slug&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&slug=not.is.null' + filtro + '&limit=5000'),
    api('vehiculos?select=slug&is_active=eq.true&slug=not.is.null' + filtro),
  ]);
  const urls = [SITE + '/suzuki', ...MODELOS.map((m) => SITE + '/suzuki/' + m.slug)]
    .concat(ps.map((p) => SITE + '/repuesto/' + p.slug))
    .concat(vs.map((v) => SITE + '/vehiculo?slug=' + encodeURIComponent(v.slug)));
  // IndexNow acepta hasta 10.000 URLs por envío.
  const lote = [...new Set(urls)].slice(0, 10000);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: SITE + '/' + INDEXNOW_KEY + '.txt', urlList: lote }),
  });
  const msg = `IndexNow: ${lote.length} URLs enviadas, respuesta ${r.status}`;
  console.log(msg);
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: msg };
};
