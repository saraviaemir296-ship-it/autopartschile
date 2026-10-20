/* Cuenta de cliente: ingreso/registro (Supabase Auth), datos, vehículos,
   favoritos y Tarjeta Saravia. Cada cliente solo ve sus propios datos (RLS). */
(function () {
  'use strict';
  var URL_ = 'https://zlyforhywunqhitrdreo.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
  var sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' } });
  window.apcSb = sb;
  var root = document.getElementById('cuenta');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + Math.round(Number(n)).toLocaleString('es-CL'); }
  function localFav() { try { return JSON.parse(localStorage.getItem('apcFav') || '[]'); } catch (e) { return []; } }
  function setLocalFav(a) { try { localStorage.setItem('apcFav', JSON.stringify(a)); } catch (e) {} }
  function errText(e) {
    var m = (e && e.message) || String(e);
    if (/Invalid login/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/Email not confirmed/i.test(m)) return 'Aún no confirmas tu correo. Revisa tu bandeja (y spam) y aprieta el enlace que te enviamos.';
    if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Ingresa o recupera tu contraseña.';
    if (/Password should be/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
    if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    return 'No se pudo completar: ' + m;
  }
  function say(el, t, ok) { el.textContent = t; el.className = 'acc-msg ' + (ok ? 'ok' : 'err'); }

  // ---------- Sin sesión ----------
  function renderAuth(mode) {
    mode = mode || 'login';
    root.innerHTML =
      '<div class="acc-auth"><div class="acc-tabs" role="tablist">' +
      '<button role="tab" data-m="login" class="' + (mode === 'login' ? 'on' : '') + '">Ingresar</button>' +
      '<button role="tab" data-m="signup" class="' + (mode === 'signup' ? 'on' : '') + '">Crear cuenta</button></div>' +
      (mode === 'login' ?
        '<form id="fLogin" class="acc-form"><label>Correo<input type="email" name="email" autocomplete="email" required></label>' +
        '<label>Contraseña<input type="password" name="pass" autocomplete="current-password" required minlength="8"></label>' +
        '<button class="apc-btn apc-btn-red" type="submit">Ingresar</button>' +
        '<button type="button" class="acc-link" id="forgot">¿Olvidaste tu contraseña?</button><p class="acc-msg" role="status"></p></form>'
        :
        '<form id="fSignup" class="acc-form"><label>Nombre<input name="nombre" autocomplete="name" required maxlength="100"></label>' +
        '<label>Correo<input type="email" name="email" autocomplete="email" required></label>' +
        '<label>Teléfono (WhatsApp)<input type="tel" name="tel" autocomplete="tel" placeholder="+56 9 …" maxlength="30"></label>' +
        '<label>Contraseña (mínimo 8)<input type="password" name="pass" autocomplete="new-password" required minlength="8"></label>' +
        '<label class="acc-check"><input type="checkbox" name="ofertas"> Quiero recibir avisos de ofertas y vehículos nuevos en desarme</label>' +
        '<button class="apc-btn apc-btn-red" type="submit">Crear mi cuenta</button><p class="acc-msg" role="status"></p></form>') +
      '<ul class="acc-perks"><li>⭐ Accede a ofertas exclusivas para socios</li><li>💸 Haz ofertas por repuestos y sigue su estado</li><li>❤️ Guarda tus repuestos favoritos</li><li>🚗 Registra tus vehículos y encuentra piezas más rápido</li><li>💳 Revisa tu Tarjeta Saravia</li></ul></div>';
    root.querySelectorAll('.acc-tabs button').forEach(function (b) { b.onclick = function () { renderAuth(b.dataset.m); }; });
    var fl = document.getElementById('fLogin'), fs = document.getElementById('fSignup');
    if (fl) {
      fl.onsubmit = function (e) {
        e.preventDefault(); var m = fl.querySelector('.acc-msg'); say(m, 'Ingresando…', true);
        sb.auth.signInWithPassword({ email: fl.email.value.trim(), password: fl.pass.value }).then(function (r) { if (r.error) say(m, errText(r.error)); });
      };
      document.getElementById('forgot').onclick = function () {
        var m = fl.querySelector('.acc-msg'), em = fl.email.value.trim();
        if (!em) { say(m, 'Escribe tu correo arriba y vuelve a apretar “¿Olvidaste tu contraseña?”.'); return; }
        sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/cuenta' }).then(function (r) {
          say(m, r.error ? errText(r.error) : 'Si el correo tiene cuenta, te llegará un enlace para crear una nueva contraseña.', !r.error);
        });
      };
    }
    if (fs) {
      fs.onsubmit = function (e) {
        e.preventDefault(); var m = fs.querySelector('.acc-msg'); say(m, 'Creando tu cuenta…', true);
        sb.auth.signUp({ email: fs.email.value.trim(), password: fs.pass.value, options: { emailRedirectTo: location.origin + '/cuenta', data: { nombre: fs.nombre.value.trim(), telefono: fs.tel.value.trim(), acepta_ofertas: fs.ofertas.checked } } })
          .then(function (r) {
            if (r.error) return say(m, errText(r.error));
            if (r.data.session) return; // confirmación desactivada: entra directo
            say(m, '¡Listo! Te enviamos un correo a ' + fs.email.value.trim() + '. Aprieta el enlace para activar tu cuenta (revisa spam).', true);
            if (window.gtag) try { gtag('event', 'sign_up', { method: 'email' }); } catch (x) {}
          });
      };
    }
  }

  function renderNewPassword() {
    root.innerHTML = '<form id="fNew" class="acc-form acc-auth"><h2>Crea tu nueva contraseña</h2><label>Nueva contraseña<input type="password" name="pass" minlength="8" required autocomplete="new-password"></label>' +
      '<button class="apc-btn apc-btn-red" type="submit">Guardar contraseña</button><p class="acc-msg" role="status"></p></form>';
    var f = document.getElementById('fNew');
    f.onsubmit = function (e) {
      e.preventDefault(); var m = f.querySelector('.acc-msg');
      sb.auth.updateUser({ password: f.pass.value }).then(function (r) { if (r.error) say(m, errText(r.error)); else { say(m, 'Contraseña actualizada ✓', true); setTimeout(load, 900); } });
    };
  }

  // ---------- Con sesión ----------
  var user = null, perfil = null, socios = [], misOfertas = [];
  function load() {
    sb.auth.getUser().then(function (r) {
      user = r.data && r.data.user;
      if (!user) return renderAuth();
      Promise.all([
        sb.from('clientes_perfil').select('*').eq('user_id', user.id).maybeSingle(),
        sb.from('tarjeta_solicitudes').select('id,estado,codigo,tipo,beneficio,nombre,created_at').order('created_at', { ascending: false }).limit(1),
        sb.from('clientes_favoritos').select('sku'),
        sb.from('ofertas_socios').select('sku,precio_socio,nivel,nota,hasta').order('created_at', { ascending: false }).limit(30),
        sb.from('ofertas_clientes').select('id,sku,product_name,precio_publicado,monto,estado,contraoferta,respuesta,created_at').order('created_at', { ascending: false }).limit(20)
      ]).then(function (res) {
        socios = (res[3] && !res[3].error && res[3].data) || [];
        misOfertas = (res[4] && !res[4].error && res[4].data) || [];
        perfil = res[0].data;
        if (!perfil) { // primer ingreso: crea el perfil con lo que dio al registrarse
          var md = user.user_metadata || {};
          perfil = { user_id: user.id, nombre: md.nombre || '', telefono: md.telefono || '', acepta_ofertas: !!md.acepta_ofertas, vehiculos: [] };
          sb.from('clientes_perfil').insert(perfil).then(function () {});
        }
        // favoritos: une los guardados en este navegador con los de la cuenta
        var dbFav = (res[2].data || []).map(function (x) { return x.sku; });
        var loc = localFav(), add = loc.filter(function (s) { return dbFav.indexOf(s) === -1; });
        if (add.length) sb.from('clientes_favoritos').insert(add.map(function (s) { return { user_id: user.id, sku: s }; })).then(function () {});
        var all = dbFav.concat(add); setLocalFav(all);
        renderDash((res[1].data || [])[0], all);
      });
    });
  }

  function cardHTML(t) {
    return '<div class="sar-card" aria-label="Tarjeta Saravia"><div class="sar-card-top"><span class="sar-card-brand">SARAVIA</span><span class="sar-card-kind">' + esc(t.tipo === 'taller' ? 'TALLER' : t.tipo === 'flota' ? 'FLOTA' : t.tipo === 'revendedor' ? 'REVENDEDOR' : 'CLIENTE FRECUENTE') + '</span></div>' +
      '<div class="sar-card-chip" aria-hidden="true"></div><div class="sar-card-code">' + esc(t.codigo) + '</div>' +
      '<div class="sar-card-bottom"><span>' + esc(t.nombre) + '</span><span>Desarmaduría Saravia · AutopartsChile</span></div></div>';
  }

  function renderDash(tarjeta, favs) {
    var nombre = (perfil && perfil.nombre) || (user.email || '').split('@')[0];
    var tHtml;
    if (tarjeta && tarjeta.estado === 'aprobada' && tarjeta.codigo) {
      tHtml = cardHTML(tarjeta) + '<p class="acc-note"><b>Tu beneficio:</b> ' + esc(tarjeta.beneficio || 'por confirmar') + '. Muestra el código en el local o dilo por WhatsApp al comprar.</p>';
    } else if (tarjeta && tarjeta.estado === 'pendiente') {
      tHtml = '<p class="acc-note">⏳ Tu solicitud está en revisión. Te avisamos por WhatsApp cuando la aprobemos.</p>';
    } else {
      tHtml = '<p class="acc-note">¿Tienes taller, flota o compras seguido? Solicita tu Tarjeta Saravia y accede a precio preferente.</p><a class="apc-btn apc-btn-red" href="/tarjeta-saravia">Solicitar Tarjeta Saravia</a>';
    }
    var veh = (perfil && perfil.vehiculos) || [];
    root.innerHTML =
      '<div class="acc-head"><h2>Hola, ' + esc(nombre) + ' 👋</h2><button class="acc-link" id="logout">Cerrar sesión</button></div>' +
      '<div class="acc-grid">' +
      '<section class="acc-box"><h3>💳 Tarjeta Saravia</h3>' + tHtml + '</section>' +
      '<section class="acc-box"><h3>🚗 Mis vehículos</h3><div id="vehList">' + (veh.length ? veh.map(function (v, i) {
        var q = new URLSearchParams({ marca: v.marca || '', modelo: v.modelo || '', anio: v.anio || '' });
        return '<div class="acc-veh"><a href="/catalogo?' + q + '#resultados">' + esc([v.marca, v.modelo, v.anio].join(' ')) + ' → ver repuestos</a><button data-i="' + i + '" class="acc-x" aria-label="Quitar">✕</button></div>';
      }).join('') : '<p class="acc-note">Agrega tu auto y te mostramos solo los repuestos que le sirven.</p>') + '</div>' +
      '<form id="fVeh" class="acc-inline"><input name="marca" placeholder="Marca" required maxlength="30"><input name="modelo" placeholder="Modelo" required maxlength="40"><input name="anio" placeholder="Año" inputmode="numeric" maxlength="4" required><button class="apc-btn apc-btn-red">Agregar</button></form></section>' +
      '<section class="acc-box acc-wide"><h3>⭐ Ofertas exclusivas para socios</h3><div id="sociosList" class="apc-grid"><p class="acc-note">' + (socios.length ? 'Cargando…' : 'Aún no hay ofertas exclusivas publicadas. Te avisaremos cuando salgan' + (perfil && perfil.acepta_ofertas ? '.' : ' si activas “Recibir avisos de ofertas” en Mis datos.')) + '</p></div></section>' +
      '<section class="acc-box acc-wide"><h3>💸 Mis ofertas</h3>' + (misOfertas.length ? '<div class="acc-ofs">' + misOfertas.map(function (o) {
        var st = { pendiente: '⏳ En revisión', aceptada: '✅ Aceptada', rechazada: '❌ No aceptada', contraoferta: '🔁 Te hicimos una contraoferta' }[o.estado] || o.estado;
        var wa = 'https://wa.me/56953817335?text=' + encodeURIComponent('Hola, sobre mi oferta #' + o.id + ' por ' + (o.product_name || o.sku) + (o.estado === 'contraoferta' && o.contraoferta ? ': acepto la contraoferta de ' + money(o.contraoferta) + '.' : o.estado === 'aceptada' ? ': quiero coordinar el pago.' : '.'));
        return '<div class="acc-of"><div><b>' + esc(o.product_name || o.sku) + '</b><br><small>Ofreciste ' + money(o.monto) + (o.precio_publicado ? ' · precio ' + money(o.precio_publicado) : '') + '</small>' +
          (o.contraoferta ? '<br><small>Contraoferta: <b>' + money(o.contraoferta) + '</b></small>' : '') + (o.respuesta ? '<br><small>' + esc(o.respuesta) + '</small>' : '') + '</div>' +
          '<div class="acc-of-st"><span>' + st + '</span>' + (o.estado === 'aceptada' || o.estado === 'contraoferta' ? '<a class="apc-btn apc-btn-red" target="_blank" rel="noopener" href="' + wa + '">' + (o.estado === 'aceptada' ? 'Coordinar pago' : 'Responder') + '</a>' : '') + '</div></div>';
      }).join('') + '</div>' : '<p class="acc-note">Aún no haces ofertas. En cada repuesto disponible aprieta “💸 Hacer una oferta”.</p>') + '</section>' +
      '<section class="acc-box acc-wide"><h3>❤️ Mis favoritos</h3><div id="favList" class="apc-grid"><p class="acc-note">' + (favs.length ? 'Cargando…' : 'Aún no guardas repuestos. Aprieta el ❤️ en cualquier repuesto del catálogo.') + '</p></div></section>' +
      '<section class="acc-box"><h3>👤 Mis datos</h3><form id="fPerfil" class="acc-form">' +
      '<label>Nombre<input name="nombre" maxlength="100" value="' + esc(perfil && perfil.nombre) + '"></label>' +
      '<label>Teléfono<input name="telefono" maxlength="30" value="' + esc(perfil && perfil.telefono) + '"></label>' +
      '<label>RUT (para factura)<input name="rut" maxlength="15" value="' + esc(perfil && perfil.rut) + '"></label>' +
      '<label>Comuna<input name="comuna" maxlength="60" value="' + esc(perfil && perfil.comuna) + '"></label>' +
      '<label class="acc-check"><input type="checkbox" name="ofertas"' + (perfil && perfil.acepta_ofertas ? ' checked' : '') + '> Recibir avisos de ofertas</label>' +
      '<p class="acc-note">Correo: ' + esc(user.email) + '</p><button class="apc-btn apc-btn-red">Guardar</button><p class="acc-msg" role="status"></p></form></section>' +
      '<section class="acc-box"><h3>📦 Mis compras</h3><p class="acc-note">Para revisar el estado de un pedido escríbenos con tu número de orden y te respondemos al tiro.</p><a class="apc-btn apc-btn-wa-full" target="_blank" rel="noopener" href="https://wa.me/56953817335?text=' + encodeURIComponent('Hola, quiero consultar el estado de mi pedido. Mi correo es ' + user.email) + '">💬 Consultar mi pedido</a></section>' +
      '</div>';
    document.getElementById('logout').onclick = function () { sb.auth.signOut().then(function () { renderAuth(); }); };
    document.getElementById('fPerfil').onsubmit = function (e) {
      e.preventDefault(); var f = e.target, m = f.querySelector('.acc-msg');
      var row = { user_id: user.id, nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), rut: f.rut.value.trim(), comuna: f.comuna.value.trim(), acepta_ofertas: f.ofertas.checked, vehiculos: veh, updated_at: new Date().toISOString() };
      sb.from('clientes_perfil').upsert(row).then(function (r) { if (r.error) say(m, errText(r.error)); else { perfil = row; say(m, 'Guardado ✓', true); } });
    };
    document.getElementById('fVeh').onsubmit = function (e) {
      e.preventDefault(); var f = e.target;
      var cap = function (s) { s = s.trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
      veh = veh.concat([{ marca: cap(f.marca.value), modelo: cap(f.modelo.value), anio: f.anio.value.replace(/\D/g, '').slice(0, 4) }]).slice(0, 10);
      saveVeh();
    };
    root.querySelectorAll('.acc-x').forEach(function (b) { b.onclick = function () { veh.splice(+b.dataset.i, 1); saveVeh(); }; });
    function saveVeh() {
      perfil = Object.assign({}, perfil, { user_id: user.id, vehiculos: veh, updated_at: new Date().toISOString() });
      sb.from('clientes_perfil').upsert(perfil).then(function () { load(); });
    }
    if (socios.length) {
      var sk = socios.map(function (o) { return o.sku; });
      fetch(URL_ + '/rest/v1/products?select=sku,name,slug,price_sale,images,is_active&is_active=eq.true&sku=in.(' + sk.map(function (s) { return '"' + s.replace(/"/g, '') + '"'; }).join(',') + ')', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
        .then(function (r) { return r.json(); }).then(function (rows) {
          var by = {}; (rows || []).forEach(function (p) { by[p.sku] = p; });
          var el = document.getElementById('sociosList');
          el.innerHTML = socios.filter(function (o) { return by[o.sku]; }).map(function (o) {
            var p = by[o.sku];
            var img = (p.images || []).map(function (u) { return typeof u === 'string' ? u : u && u.url; }).filter(function (u) { return u && !/favicon|placeholder|logo/i.test(u); })[0];
            var href = p.slug ? '/repuesto/' + encodeURIComponent(p.slug) : '/producto?sku=' + encodeURIComponent(p.sku);
            var wa = 'https://wa.me/56953817335?text=' + encodeURIComponent('Hola, soy socio (' + user.email + ') y quiero comprar ' + p.name + ' (' + p.sku + ') a precio socio ' + money(o.precio_socio) + '.');
            return '<article class="apc-card"><a class="apc-card-img" href="' + href + '">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<div class="apc-nophoto"><span>📷</span></div>') + '</a>' +
              '<div class="apc-card-body"><h3 class="apc-card-name"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
              '<p class="apc-card-price">' + money(o.precio_socio) + ' <s style="color:#999;font-size:.8em;font-weight:600">' + money(p.price_sale) + '</s></p>' +
              (o.nota ? '<p class="acc-note" style="margin:.2rem 0">' + esc(o.nota) + '</p>' : '') +
              '<div class="apc-card-actions"><a class="apc-btn apc-btn-red" target="_blank" rel="noopener" href="' + wa + '">Comprar a precio socio</a></div></div></article>';
          }).join('') || '<p class="acc-note">Las ofertas exclusivas de hoy ya se vendieron. Vuelve pronto.</p>';
        });
    }
    if (favs.length) {
      fetch(URL_ + '/rest/v1/products?select=sku,name,slug,price_sale,images,part_status,is_active&sku=in.(' + favs.map(function (s) { return '"' + s.replace(/"/g, '') + '"'; }).join(',') + ')', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
        .then(function (r) { return r.json(); }).then(function (rows) {
          var el = document.getElementById('favList');
          el.innerHTML = rows.map(function (p) {
            var img = (p.images || []).map(function (u) { return typeof u === 'string' ? u : u && u.url; }).filter(function (u) { return u && !/favicon|placeholder|logo/i.test(u); })[0];
            var sold = !p.is_active || /vendid|no_disponible/.test(p.part_status || '');
            var href = p.slug ? '/repuesto/' + encodeURIComponent(p.slug) : '/producto?sku=' + encodeURIComponent(p.sku);
            return '<article class="apc-card"><a class="apc-card-img" href="' + href + '">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<div class="apc-nophoto"><span>📷</span></div>') + '</a>' +
              '<div class="apc-card-body"><h3 class="apc-card-name"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
              '<p class="apc-card-price">' + (sold ? 'Vendido' : money(p.price_sale)) + '</p>' +
              '<div class="apc-card-actions"><a class="apc-btn apc-btn-red" href="' + href + '">Ver</a><button class="apc-btn acc-unfav" data-sku="' + esc(p.sku) + '" aria-label="Quitar de favoritos">✕</button></div></div></article>';
          }).join('') || '<p class="acc-note">Tus favoritos ya no están publicados.</p>';
          el.querySelectorAll('.acc-unfav').forEach(function (b) {
            b.onclick = function () {
              sb.from('clientes_favoritos').delete().eq('user_id', user.id).eq('sku', b.dataset.sku).then(function () {
                setLocalFav(localFav().filter(function (s) { return s !== b.dataset.sku; })); b.closest('.apc-card').remove();
              });
            };
          });
        });
    }
  }

  var recovering = /type=recovery/.test(location.hash);
  sb.auth.onAuthStateChange(function (ev) {
    if (ev === 'PASSWORD_RECOVERY') { recovering = true; renderNewPassword(); }
    else if (ev === 'SIGNED_IN' && !recovering) load();
  });
  if (/error_description=/.test(location.hash)) {
    var d = decodeURIComponent((location.hash.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' ');
    renderAuth(); var m = root.querySelector('.acc-msg'); if (m) say(m, /expired|invalid/i.test(d) ? 'El enlace venció o ya se usó. Ingresa o pide uno nuevo.' : d);
  } else if (recovering) renderNewPassword(); else load();
})();
