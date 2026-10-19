/* AutopartsChile — tienda: buscador Año→Marca→Modelo, menú por pieza y
   carruseles por categoría. Todo sale de la base real (Supabase); no hay
   productos, precios ni fotos inventadas. */
(function () {
  'use strict';
  var URL_ = 'https://zlyforhywunqhitrdreo.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
  var WA = '56953817335';

  // Orden y nombre de las categorías que ve el cliente
  var CATS = [
    ['Motores y componentes', '⚙️'], ['Cajas de cambio y transmisión', '🔩'],
    ['Parachoques', '🚘'], ['Carrocería', '🚗'], ['Puertas y portalón', '🚪'],
    ['Ópticos y focos', '💡'], ['Espejos', '🪞'], ['Eléctrico y electrónica', '⚡'],
    ['Aire acondicionado y calefacción', '❄️'], ['Refrigeración', '💧'],
    ['Suspensión y ejes', '🛞'], ['Dirección', '🎯'], ['Frenos', '🛑'],
    ['Interior', '💺'], ['Airbags y seguridad', '🛡️'], ['Combustible', '⛽'],
    ['Vidrios y alzavidrios', '🪟'], ['Vehículo completo', '🚙'], ['Otros repuestos', '📦']
  ];
  var ICON = {}; CATS.forEach(function (c) { ICON[c[0]] = c[1]; });

  function plain(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function categoria(cat, name) {
    var n = plain(name), c = plain(cat);
    function t(re, s) { return re.test(s); }
    if (t(/airbag/, n) || t(/airbag|seguridad/, c)) return 'Airbags y seguridad';
    if (t(/parachoque/, n)) return 'Parachoques';
    if (t(/^(puerta|portalon)/, n) || t(/puerta/, c)) return 'Puertas y portalón';
    if (t(/^espejo/, n) || t(/espejo/, c)) return 'Espejos';
    if (t(/(^|\s)(foco|focos|optico|opticos|faro|neblinero)/, n) || t(/iluminacion/, c)) return 'Ópticos y focos';
    if (t(/^(caja de cambio|caja automatica|caja mecanica|caja de transmision)/, n) || t(/transmision|caja de cambio/, c)) return 'Cajas de cambio y transmisión';
    if (t(/aire acondicionado|compresor|calefaccion|blower|soplador|evaporador|condensador/, n) || t(/aire acondicionado|calefaccion|climatizacion|soplador/, c)) return 'Aire acondicionado y calefacción';
    if (t(/radiador|electroventilador|coolant|manguera|termostato|bomba de agua/, n) || t(/refrigeracion/, c)) return 'Refrigeración';
    if (t(/\becu\b|\bbcm\b|computador|radio|tablero (de )?instrumento|alternador|motor de partida|sensor|modulo|inmovilizador/, n) || t(/electric|electronic|ecu|tablero/, c)) return 'Eléctrico y electrónica';
    if (t(/bencina|combustible|estanque|inyector/, n) || t(/combustible/, c)) return 'Combustible';
    if (t(/freno|\babs\b|caliper|servo/, n) || t(/freno/, c)) return 'Frenos';
    if (t(/cremallera|direccion|\beps\b/, n) || t(/direccion/, c)) return 'Dirección';
    if (t(/amortiguador|espiral|bandeja|munon|masa|homocinetica|\beje\b|resorte/, n) || t(/suspension/, c)) return 'Suspensión y ejes';
    if (t(/parabrisas|vidrio|alzavidrio/, n) || t(/vidrio/, c)) return 'Vidrios y alzavidrios';
    if (t(/asiento|cinturon|torpedo|tapiz|consola/, n) || t(/interior/, c)) return 'Interior';
    if (t(/capot|capo\b|tapabarro|guardafango|refuerzo|chapa|bisagra|maleta/, n) || t(/carroceria/, c)) return 'Carrocería';
    if (t(/vehiculo completo/, c) || t(/completo$/, n) && t(/pick ?up/, n)) return 'Vehículo completo';
    if (t(/motor/, c) || t(/motor|culata|multiple|aceleracion|carter|ciguenal|polea|soporte/, n)) return 'Motores y componentes';
    return 'Otros repuestos';
  }

  var MAKES = ['Suzuki', 'Chevrolet', 'Kia', 'Hyundai', 'Jeep', 'Nissan', 'Toyota', 'Mitsubishi', 'Peugeot', 'Ford', 'Mazda'];
  var MODELS = ['Grand Cherokee', 'Grand Nomade', 'Alto 800', 'Alto K10', 'S-Presso', 'S-Cross', 'SX4 Crossover', 'Celerio', 'Alto', 'Swift Dzire', 'Dzire', 'Swift', 'SX4', 'Baleno', 'Vitara', 'Ciaz', 'Ignis', 'Mastervan', 'D-Max', 'Optima', 'Cerato', 'Morning', 'Spark', 'Santa Fe'];
  function cap(s) { s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }
  function normMake(m) { var p = plain(m); for (var i = 0; i < MAKES.length; i++) if (plain(MAKES[i]) === p) return MAKES[i]; return cap(m); }

  // Vehículo de cada pieza: primero la ficha del vehículo, si no, el texto de compatibilidad
  function vehiculo(p) {
    var v = p.vehiculos;
    if (v && v.marca) return { marca: normMake(v.marca), modelo: String(v.modelo || '').trim(), desde: +v.anio_desde || null, hasta: +v.anio_hasta || +v.anio_desde || null, motor: v.motor || '' };
    var vc = p.vehicle_compatibility, txt = '';
    if (vc && typeof vc === 'object' && !Array.isArray(vc)) {
      var yr = String(vc.years || vc.year || '').match(/(\d{4})\D+(\d{4})|(\d{4})/);
      return { marca: normMake(vc.make || ''), modelo: String(vc.model || '').trim(), desde: yr ? +(yr[1] || yr[3]) : null, hasta: yr ? +(yr[2] || yr[3]) : null, motor: vc.engine || '' };
    }
    if (Array.isArray(vc)) txt = vc.map(function (x) { return typeof x === 'string' ? x : [x.make, x.model, x.years].join(' '); }).join(' ');
    else txt = String(vc || '');
    var pt = plain(txt), mk = '', md = '';
    MAKES.forEach(function (m) { if (!mk && pt.indexOf(plain(m)) !== -1) mk = m; });
    MODELS.forEach(function (m) { if (!md && pt.indexOf(plain(m)) !== -1) md = m; });
    var y = txt.match(/((?:19|20)\d{2})\s*(?:-|–|a)\s*((?:19|20)\d{2})/) || txt.match(/\b((?:19|20)\d{2})\b/);
    return { marca: mk, modelo: md, desde: y ? +y[1] : null, hasta: y ? +(y[2] || y[1]) : null, motor: '' };
  }

  function realImg(p) {
    var imgs = Array.isArray(p.images) ? p.images : [];
    for (var i = 0; i < imgs.length; i++) {
      var u = typeof imgs[i] === 'string' ? imgs[i] : (imgs[i] && imgs[i].url);
      if (u && !/favicon|placeholder|logo/i.test(u)) return u;
    }
    return '';
  }

  function money(n) { return '$' + Math.round(Number(n)).toLocaleString('es-CL'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function href(p) { return p.slug ? '/repuesto/' + encodeURIComponent(p.slug) : '/producto?sku=' + encodeURIComponent(p.sku); }
  function vehTxt(v) {
    if (!v.marca && !v.modelo) return '';
    var y = v.desde ? (v.hasta && v.hasta !== v.desde ? v.desde + '–' + v.hasta : String(v.desde)) : '';
    return [v.marca, v.modelo, y].filter(Boolean).join(' ');
  }

  var cache = null;
  function load() {
    if (cache) return cache;
    var q = 'products?select=sku,name,slug,price_sale,images,category,part_status,stock,brand,vehicle_compatibility,created_at,vehiculos(marca,modelo,anio_desde,anio_hasta,motor)' +
      '&is_active=eq.true&deleted_at=is.null&price_sale=gt.0&sku=not.like.QA-*&order=created_at.desc&limit=2000';
    cache = fetch(URL_ + '/rest/v1/' + q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        return rows.filter(function (p) { return !/vendid|no_disponible/.test(p.part_status || ''); }).map(function (p) {
          var v = vehiculo(p);
          return {
            sku: p.sku, name: p.name, slug: p.slug, price: Number(p.price_sale), img: realImg(p),
            cat: categoria(p.category, p.name), v: v, veh: vehTxt(v), href: href(p),
            search: plain([p.sku, p.name, p.category, vehTxt(v), v.motor, p.brand].join(' '))
          };
        });
      });
    return cache;
  }

  // ---------- Favoritos (navegador + cuenta si hay sesión) ----------
  function favs() { try { return JSON.parse(localStorage.getItem('apcFav') || '[]'); } catch (e) { return []; } }
  function isFav(sku) { return favs().indexOf(sku) !== -1; }
  function sess() { try { var x = JSON.parse(localStorage.getItem('sb-zlyforhywunqhitrdreo-auth-token') || 'null'); return x && x.access_token && x.expires_at * 1000 > Date.now() ? x : null; } catch (e) { return null; } }
  function toggleFav(sku, btn) {
    var a = favs(), on = a.indexOf(sku) === -1;
    a = on ? a.concat([sku]) : a.filter(function (x) { return x !== sku; });
    try { localStorage.setItem('apcFav', JSON.stringify(a)); } catch (e) {}
    document.querySelectorAll('.apc-fav[data-sku="' + sku.replace(/"/g, '') + '"]').forEach(function (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    var x = sess();
    if (x) {
      var h = { apikey: KEY, Authorization: 'Bearer ' + x.access_token, 'Content-Type': 'application/json', Prefer: 'return=minimal,resolution=ignore-duplicates' };
      if (on) fetch(URL_ + '/rest/v1/clientes_favoritos', { method: 'POST', headers: h, body: JSON.stringify({ user_id: x.user.id, sku: sku }) });
      else fetch(URL_ + '/rest/v1/clientes_favoritos?user_id=eq.' + x.user.id + '&sku=eq.' + encodeURIComponent(sku), { method: 'DELETE', headers: h });
    } else if (on && !sessionStorage.getItem('apcFavTip')) {
      try { sessionStorage.setItem('apcFavTip', '1'); } catch (e) {}
      var t = document.createElement('div'); t.className = 'apc-toast'; t.innerHTML = '❤ Guardado en este navegador. <a href="/cuenta">Crea tu cuenta</a> para tenerlo en todos tus dispositivos.';
      document.body.appendChild(t); setTimeout(function () { t.remove(); }, 6000);
    }
    if (on && window.gtag) try { gtag('event', 'add_to_wishlist', { items: [{ item_id: sku }] }); } catch (e) {}
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.apc-fav'); if (b) { e.preventDefault(); toggleFav(b.dataset.sku, b); } });

  function waLink(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  function card(p) {
    var img = p.img
      ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="320" height="240">'
      : '<div class="apc-nophoto"><span>📷</span><small>Pide la foto real por WhatsApp</small></div>';
    return '<article class="apc-card">' +
      '<a class="apc-card-img" href="' + p.href + '">' + img + '</a>' +
      '<button type="button" class="apc-fav' + (isFav(p.sku) ? ' on' : '') + '" data-sku="' + esc(p.sku) + '" aria-pressed="' + isFav(p.sku) + '" aria-label="Guardar en favoritos">❤</button>' +
      '<div class="apc-card-body">' +
      '<h3 class="apc-card-name"><a href="' + p.href + '">' + esc(p.name) + '</a></h3>' +
      '<p class="apc-card-veh">' + (p.veh ? esc(p.veh) : 'Compatibilidad por confirmar') + '</p>' +
      '<p class="apc-card-price">' + money(p.price) + '</p>' +
      '<div class="apc-card-actions"><a class="apc-btn apc-btn-red" href="' + p.href + '">Ver repuesto</a>' +
      '<a class="apc-btn apc-btn-wa" target="_blank" rel="noopener" href="' + waLink('Hola, me interesa: ' + p.name + (p.veh ? ' (' + p.veh + ')' : '') + ' — ' + money(p.price) + ' [' + p.sku + ']. ¿Está disponible?') + '" aria-label="Consultar por WhatsApp">💬</a></div>' +
      '</div></article>';
  }

  // ---------- Buscador Año → Marca → Modelo ----------
  function fitsYear(p, y) { if (!y) return true; if (!p.v.desde) return false; return y >= p.v.desde && y <= (p.v.hasta || p.v.desde); }
  function finder(el, items, opts) {
    opts = opts || {};
    var pr = new URLSearchParams(location.search);
    el.innerHTML =
      '<form class="apc-finder" role="search" aria-label="Buscar repuesto por vehículo">' +
      '<label class="apc-f apc-f-q"><span>¿Qué repuesto buscas?</span><input name="q" type="search" placeholder="Ej: motor celerio, foco swift…" autocomplete="off"></label>' +
      '<label class="apc-f"><span>1. Año</span><select name="anio"><option value="">Año</option></select></label>' +
      '<label class="apc-f"><span>2. Marca</span><select name="marca"><option value="">Marca</option></select></label>' +
      '<label class="apc-f"><span>3. Modelo</span><select name="modelo"><option value="">Modelo</option></select></label>' +
      '<button class="apc-btn apc-btn-red apc-f-go" type="submit">Buscar repuesto</button></form>';
    var f = el.querySelector('form'), sY = f.anio, sM = f.marca, sMo = f.modelo, q = f.q;
    function fill(sel, vals, label, keep) {
      sel.innerHTML = '<option value="">' + label + '</option>' + vals.map(function (v) { return '<option' + (String(v) === String(keep) ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
    }
    function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
    var minY = 3000, maxY = 0;
    items.forEach(function (p) { if (p.v.desde) { minY = Math.min(minY, p.v.desde); maxY = Math.max(maxY, p.v.hasta || p.v.desde); } });
    var years = []; for (var y = maxY; y >= minY && y > 0; y--) years.push(y);
    function refresh(keepM, keepMo) {
      var y = +sY.value || 0;
      var byY = items.filter(function (p) { return fitsYear(p, y); });
      fill(sM, uniq(byY.map(function (p) { return p.v.marca; })).sort(), 'Marca', keepM);
      var byM = byY.filter(function (p) { return !sM.value || p.v.marca === sM.value; });
      fill(sMo, uniq(byM.map(function (p) { return p.v.modelo; })).sort(), sM.value ? 'Modelo' : 'Elige marca', keepMo);
      sMo.disabled = !sM.value;
    }
    fill(sY, years, 'Año', pr.get('anio'));
    q.value = pr.get('q') || '';
    refresh(pr.get('marca'), pr.get('modelo'));
    sY.addEventListener('change', function () { refresh(sM.value, sMo.value); });
    sM.addEventListener('change', function () { refresh(sM.value, ''); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = new URLSearchParams();
      ['q', 'anio', 'marca', 'modelo'].forEach(function (k) { if (f[k].value) s.set(k, f[k].value.trim()); });
      if (opts.onSearch) opts.onSearch(s); else location.href = '/catalogo?' + s.toString() + '#resultados';
    });
  }

  function catNav(el, items) {
    var n = {}; items.forEach(function (p) { n[p.cat] = (n[p.cat] || 0) + 1; });
    el.innerHTML = '<div class="apc-catnav-inner">' + CATS.filter(function (c) { return n[c[0]]; }).map(function (c) {
      return '<a class="apc-catlink" href="/catalogo?cat=' + encodeURIComponent(c[0]) + '#resultados"><span aria-hidden="true">' + c[1] + '</span>' + esc(c[0]) + ' <b>' + n[c[0]] + '</b></a>';
    }).join('') + '</div>';
  }

  // ---------- Carruseles por categoría (portada) ----------
  function rows(el, items) {
    var groups = {};
    items.forEach(function (p) { (groups[p.cat] = groups[p.cat] || []).push(p); });
    var order = CATS.map(function (c) { return c[0]; }).filter(function (c) { return groups[c] && groups[c].length >= 3 && c !== 'Otros repuestos'; });
    // primero las categorías con más fotos reales: son las que venden
    order.sort(function (a, b) {
      function ph(c) { return groups[c].filter(function (p) { return p.img; }).length; }
      return ph(b) - ph(a) || groups[b].length - groups[a].length;
    });
    el.innerHTML = order.slice(0, 8).map(function (c) {
      var list = groups[c].slice().sort(function (a, b) { return (b.img ? 1 : 0) - (a.img ? 1 : 0); }).slice(0, 12);
      var from = Math.min.apply(null, groups[c].map(function (p) { return p.price; }));
      return '<section class="apc-row" aria-label="' + esc(c) + '">' +
        '<div class="apc-row-head"><div><h2>' + ICON[c] + ' ' + esc(c) + '</h2><p>' + groups[c].length + ' repuestos · desde ' + money(from) + '</p></div>' +
        '<div class="apc-row-nav"><button type="button" class="apc-arrow" data-dir="-1" aria-label="Anteriores">‹</button><button type="button" class="apc-arrow" data-dir="1" aria-label="Siguientes">›</button>' +
        '<a class="apc-seeall" href="/catalogo?cat=' + encodeURIComponent(c) + '#resultados">Ver todo ›</a></div></div>' +
        '<div class="apc-track">' + list.map(card).join('') + '</div></section>';
    }).join('');
    el.querySelectorAll('.apc-row').forEach(function (row) {
      var tr = row.querySelector('.apc-track');
      row.querySelectorAll('.apc-arrow').forEach(function (b) {
        b.addEventListener('click', function () { tr.scrollBy({ left: +b.dataset.dir * tr.clientWidth * 0.85, behavior: 'smooth' }); });
      });
    });
  }

  // ---------- Banners de campaña (solo piezas reales con foto y precio vigente) ----------
  var PROMO_TXT = {
    'Motores y componentes': ['MOTORES', 'y componentes originales usados'],
    'Cajas de cambio y transmisión': ['CAJAS DE CAMBIO', 'mecánicas y automáticas'],
    'Ópticos y focos': ['ÓPTICOS Y FOCOS', 'delanteros y traseros originales'],
    'Eléctrico y electrónica': ['ELECTRÓNICA', 'computadores, tableros y radios'],
    'Aire acondicionado y calefacción': ['AIRE ACONDICIONADO', 'compresores y componentes'],
    'Puertas y portalón': ['PUERTAS', 'completas y en buen estado'],
    'Carrocería': ['CARROCERÍA', 'capós, tapabarros y más'],
    'Parachoques': ['PARACHOQUES', 'delanteros y traseros'],
    'Espejos': ['ESPEJOS', 'retrovisores originales'],
    'Suspensión y ejes': ['SUSPENSIÓN', 'amortiguadores, muñones y ejes'],
    'Airbags y seguridad': ['AIRBAGS', 'originales de fábrica']
  };
  function promo(el, items) {
    var g = {};
    items.forEach(function (p) { if (p.img) (g[p.cat] = g[p.cat] || []).push(p); });
    var cats = Object.keys(g).filter(function (c) { return PROMO_TXT[c] && g[c].length >= 2; })
      .sort(function (a, b) { return g[b].length - g[a].length; }).slice(0, 6);
    var slides = cats.map(function (c) {
      var list = g[c].slice(0, 3), all = items.filter(function (p) { return p.cat === c; });
      var from = Math.min.apply(null, all.map(function (p) { return p.price; }));
      return '<div class="apc-slide" role="group" aria-roledescription="banner" aria-label="' + esc(c) + '">' +
        '<div class="apc-slide-copy"><span class="apc-slide-kicker">' + all.length + ' disponibles · desde ' + money(from) + '</span>' +
        '<h2>' + PROMO_TXT[c][0] + '</h2><p>' + PROMO_TXT[c][1] + '</p>' +
        '<a class="apc-btn apc-btn-red" href="/catalogo?cat=' + encodeURIComponent(c) + '#resultados">Ver todo ›</a></div>' +
        '<div class="apc-slide-items">' + list.map(function (p) {
          return '<a class="apc-slide-item" href="' + p.href + '"><span class="apc-slide-img"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy"></span>' +
            '<span class="apc-slide-name">' + esc(p.veh || p.name) + '</span><span class="apc-slide-price">' + money(p.price) + '</span></a>';
        }).join('') + '</div></div>';
    });
    slides.push('<div class="apc-slide apc-slide-card" role="group" aria-roledescription="banner" aria-label="Tarjeta Saravia"><div class="apc-slide-copy"><span class="apc-slide-kicker">Talleres, mecánicos y clientes frecuentes</span><h2>TARJETA SARAVIA</h2><p>Precio preferente acordado contigo, aviso de autos que entran a desarme y atención prioritaria.</p><a class="apc-btn apc-btn-red" href="/tarjeta-saravia">Solicítala gratis ›</a></div>' +
      '<div class="apc-slide-items apc-slide-cardwrap"><div class="sar-card"><div class="sar-card-top"><span class="sar-card-brand">SARAVIA</span><span class="sar-card-kind">TALLER</span></div><div class="sar-card-chip"></div><div class="sar-card-code">SAR-000000</div><div class="sar-card-bottom"><span>TU TALLER</span><span>Desarmaduría Saravia · AutopartsChile</span></div></div></div></div>');
    slides.push('<div class="apc-slide apc-slide-ship" role="group" aria-roledescription="banner" aria-label="Despacho"><div class="apc-slide-copy"><span class="apc-slide-kicker">Retiro en La Pintana o despacho</span><h2>DESPACHO A TODO CHILE</h2><p>Enviamos con el transportista que prefieras y también al extranjero por DHL. Embalamos cada pieza para que llegue bien.</p><a class="apc-btn apc-btn-red" href="/envios">Cómo enviamos ›</a></div>' +
      '<div class="apc-slide-items apc-ship-list"><span>Starken</span><span>Chilexpress</span><span>Blue Express</span><span>DHL (internacional)</span><span>Retiro en local</span></div></div>');
    el.innerHTML = '<div class="apc-promo" aria-roledescription="carrusel" aria-label="Destacados"><div class="apc-promo-track">' + slides.join('') + '</div>' +
      '<button class="apc-promo-arrow prev" aria-label="Anterior">‹</button><button class="apc-promo-arrow next" aria-label="Siguiente">›</button>' +
      '<div class="apc-promo-dots">' + slides.map(function (_, i) { return '<button aria-label="Banner ' + (i + 1) + '"></button>'; }).join('') + '</div></div>';
    var tr = el.querySelector('.apc-promo-track'), dots = el.querySelectorAll('.apc-promo-dots button'), n = slides.length, cur = 0, timer;
    function go(i) { cur = (i + n) % n; tr.scrollTo({ left: cur * tr.clientWidth, behavior: 'smooth' }); mark(); }
    function mark() { dots.forEach(function (d, j) { d.classList.toggle('on', j === cur); d.setAttribute('aria-current', j === cur); }); }
    tr.addEventListener('scroll', function () { var i = Math.round(tr.scrollLeft / tr.clientWidth); if (i !== cur) { cur = i; mark(); } }, { passive: true });
    el.querySelector('.prev').onclick = function () { go(cur - 1); restart(); };
    el.querySelector('.next').onclick = function () { go(cur + 1); restart(); };
    dots.forEach(function (d, j) { d.onclick = function () { go(j); restart(); }; });
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, paused = false;
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!paused && !document.hidden) go(cur + 1); }, 7000); }
    el.addEventListener('mouseenter', function () { paused = true; }); el.addEventListener('mouseleave', function () { paused = false; });
    el.addEventListener('focusin', function () { paused = true; }); el.addEventListener('focusout', function () { paused = false; });
    mark(); restart();
  }

  // ---------- Catálogo completo con filtros ----------
  function catalog(el, items) {
    var state = {};
    var pr = new URLSearchParams(location.search);
    ['q', 'anio', 'marca', 'modelo', 'cat'].forEach(function (k) { state[k] = pr.get(k) || ''; });
    var n = {}; items.forEach(function (p) { n[p.cat] = (n[p.cat] || 0) + 1; });
    el.innerHTML = '<div class="apc-chips" role="group" aria-label="Categorías"></div>' +
      '<div class="apc-results-head"><h2 id="apcTitle"></h2><span id="apcCount"></span></div>' +
      '<div class="apc-grid"></div>' +
      '<div class="apc-empty" hidden><p><b>No tenemos ese repuesto publicado todavía.</b> Muchas piezas están en bodega sin publicar: escríbenos y te respondemos con foto y precio.</p>' +
      '<a class="apc-btn apc-btn-wa-full" target="_blank" rel="noopener" href="#">💬 Preguntar por WhatsApp</a></div>';
    var chips = el.querySelector('.apc-chips'), grid = el.querySelector('.apc-grid');
    var empty = el.querySelector('.apc-empty');
    function drawChips() {
      chips.innerHTML = '<button type="button" data-cat="" class="apc-chip' + (state.cat ? '' : ' on') + '">Todos <b>' + items.length + '</b></button>' +
        CATS.filter(function (c) { return n[c[0]]; }).map(function (c) {
          return '<button type="button" data-cat="' + esc(c[0]) + '" class="apc-chip' + (state.cat === c[0] ? ' on' : '') + '">' + c[1] + ' ' + esc(c[0]) + ' <b>' + n[c[0]] + '</b></button>';
        }).join('');
    }
    function apply() {
      var qq = plain(state.q).split(/\s+/).filter(Boolean), y = +state.anio || 0;
      var res = items.filter(function (p) {
        if (state.cat && p.cat !== state.cat) return false;
        if (state.marca && p.v.marca !== state.marca) return false;
        if (state.modelo && p.v.modelo !== state.modelo) return false;
        if (y && !fitsYear(p, y)) return false;
        for (var i = 0; i < qq.length; i++) if (p.search.indexOf(qq[i]) === -1) return false;
        return true;
      }).sort(function (a, b) { return (b.img ? 1 : 0) - (a.img ? 1 : 0); });
      grid.innerHTML = res.map(card).join('');
      var veh = [state.marca, state.modelo, state.anio].filter(Boolean).join(' ');
      document.getElementById('apcTitle').textContent = (state.cat || (state.q ? 'Resultados para "' + state.q + '"' : 'Todos los repuestos')) + (veh ? ' · ' + veh : '');
      document.getElementById('apcCount').textContent = res.length + (res.length === 1 ? ' resultado' : ' resultados');
      empty.hidden = res.length > 0;
      empty.querySelector('a').href = waLink('Hola, busco ' + (state.q || state.cat || 'un repuesto') + (veh ? ' para ' + veh : '') + '. ¿Lo tienen?');
      var s = new URLSearchParams(); Object.keys(state).forEach(function (k) { if (state[k]) s.set(k, state[k]); });
      history.replaceState(null, '', location.pathname + (s.toString() ? '?' + s : '') + location.hash);
    }
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.apc-chip'); if (!b) return;
      state.cat = b.dataset.cat; drawChips(); apply();
    });
    drawChips(); apply();
    return { set: function (s) { ['q', 'anio', 'marca', 'modelo'].forEach(function (k) { state[k] = s.get(k) || ''; }); apply(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  }

  function askForm(el) {
    el.innerHTML = '<form class="apc-ask" novalidate><div class="apc-ask-head"><h2>¿No encuentras tu repuesto?</h2>' +
      '<p>Tenemos más piezas en bodega de las que están publicadas. Déjanos los datos y te respondemos por WhatsApp con foto y precio. No te confirmamos una pieza hasta revisar stock y compatibilidad.</p></div>' +
      '<div class="apc-ask-grid">' +
      '<label>Tu nombre<input name="nombre" autocomplete="given-name" required></label>' +
      '<label>Repuesto que buscas *<input name="pieza" required placeholder="Ej: foco delantero derecho"></label>' +
      '<label>Marca *<input name="marca" required placeholder="Suzuki"></label>' +
      '<label>Modelo *<input name="modelo" required placeholder="Celerio"></label>' +
      '<label>Año *<input name="anio" inputmode="numeric" required placeholder="2012"></label>' +
      '<label>Motor / versión<input name="motor" placeholder="1.0 mecánico"></label>' +
      '<label>Código OEM (si lo tienes)<input name="oem"></label>' +
      '<label class="apc-ask-wide">Comentario<textarea name="nota" rows="2" placeholder="Si tienes foto de la pieza o del padrón, la mandas en el chat"></textarea></label>' +
      '<input name="web" tabindex="-1" autocomplete="off" class="apc-hp" aria-hidden="true">' +
      '</div><p class="apc-ask-msg" role="status"></p><button class="apc-btn apc-btn-wa-full" type="submit">💬 Enviar consulta por WhatsApp</button></form>';
    var f = el.querySelector('form'), msg = el.querySelector('.apc-ask-msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.web.value) return; // anti-spam simple
      var miss = ['pieza', 'marca', 'modelo', 'anio'].filter(function (k) { return !f[k].value.trim(); });
      if (miss.length) { msg.textContent = 'Completa repuesto, marca, modelo y año para poder buscarlo.'; msg.className = 'apc-ask-msg err'; f[miss[0]].focus(); return; }
      var t = 'Hola' + (f.nombre.value ? ', soy ' + f.nombre.value.trim() : '') + '. Busco: ' + f.pieza.value.trim() +
        '\nVehículo: ' + [f.marca.value, f.modelo.value, f.anio.value, f.motor.value].map(function (x) { return x.trim(); }).filter(Boolean).join(' ') +
        (f.oem.value.trim() ? '\nOEM: ' + f.oem.value.trim() : '') + (f.nota.value.trim() ? '\n' + f.nota.value.trim() : '');
      msg.textContent = 'Abriendo WhatsApp con tu consulta…'; msg.className = 'apc-ask-msg ok';
      if (window.gtag) try { gtag('event', 'generate_lead', { method: 'form_no_encuentro' }); } catch (x) {}
      window.open(waLink(t), '_blank', 'noopener');
    });
  }

  function fail(el) {
    el.innerHTML = '<p class="apc-error">No pudimos cargar el catálogo en este momento. <a href="' + waLink('Hola, busco un repuesto') + '" target="_blank" rel="noopener">Escríbenos por WhatsApp</a> y te respondemos al tiro.</p>';
  }

  function init() {
    document.querySelectorAll('.apc-fav').forEach(function (b) { var on = isFav(b.dataset.sku); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    var fEls = document.querySelectorAll('[data-apc-finder]'), nEls = document.querySelectorAll('[data-apc-catnav]');
    var rEl = document.querySelector('[data-apc-rows]'), cEl = document.querySelector('[data-apc-catalog]'), pEl = document.querySelector('[data-apc-promo]');
    document.querySelectorAll('[data-apc-ask]').forEach(askForm);
    if (!fEls.length && !nEls.length && !rEl && !cEl && !pEl) return;
    load().then(function (items) {
      var cat = cEl ? catalog(cEl, items) : null;
      fEls.forEach(function (el) { finder(el, items, cat ? { onSearch: cat.set } : null); });
      nEls.forEach(function (el) { catNav(el, items); });
      if (rEl) rows(rEl, items);
      if (pEl) promo(pEl, items);
    }).catch(function () { if (cEl) fail(cEl); if (rEl) rEl.innerHTML = ''; if (pEl) pEl.innerHTML = ''; });
  }
  window.APCStore = { categoria: categoria, vehiculo: vehiculo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
