/* Solicitud de Tarjeta Saravia: guarda la solicitud (queda "pendiente") y la
   revisa el equipo en /admin/tarjetas.html. Nunca se autoaprueba. */
(function () {
  'use strict';
  var URL_ = 'https://zlyforhywunqhitrdreo.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';
  var f = document.getElementById('fTarjeta'); if (!f) return;
  var msg = f.querySelector('.acc-msg');
  function session() {
    try { var s = JSON.parse(localStorage.getItem('sb-zlyforhywunqhitrdreo-auth-token') || 'null'); return s && s.access_token && s.user ? s : null; } catch (e) { return null; }
  }
  var s = session();
  if (s) {
    var md = s.user.user_metadata || {};
    if (md.nombre && !f.nombre.value) f.nombre.value = md.nombre;
    if (md.telefono && !f.telefono.value) f.telefono.value = md.telefono;
    if (!f.email.value) f.email.value = s.user.email || '';
  }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.web.value) return; // anti-spam
    var tel = f.telefono.value.trim();
    if (f.nombre.value.trim().length < 2 || tel.replace(/\D/g, '').length < 8) { msg.textContent = 'Escribe tu nombre y un teléfono válido.'; msg.className = 'acc-msg err'; return; }
    var row = { nombre: f.nombre.value.trim(), telefono: tel, email: f.email.value.trim() || null, rut: f.rut.value.trim() || null, tipo: f.tipo.value, negocio: f.negocio.value.trim() || null, comuna: f.comuna.value.trim() || null, mensaje: f.mensaje.value.trim() || null };
    var ses = session();
    if (ses && ses.expires_at * 1000 > Date.now()) row.user_id = ses.user.id; else ses = null;
    var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    msg.textContent = 'Enviando…'; msg.className = 'acc-msg ok';
    fetch(URL_ + '/rest/v1/tarjeta_solicitudes', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + (ses ? ses.access_token : KEY), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (window.gtag) try { gtag('event', 'generate_lead', { method: 'tarjeta_saravia' }); } catch (x) {}
      f.innerHTML = '<div class="tj-ok"><h3>✅ Recibimos tu solicitud</h3><p>La revisamos y te contactamos por WhatsApp al ' + tel.replace(/[<>&]/g, '') + '. ' +
        (ses ? 'Cuando esté aprobada la verás en <a href="/cuenta">Mi cuenta</a>.' : 'Si <a href="/cuenta">creas tu cuenta</a> con el mismo correo, podrás ver tu tarjeta ahí.') + '</p>' +
        '<a class="apc-btn apc-btn-wa-full" target="_blank" rel="noopener" href="https://wa.me/56953817335?text=' + encodeURIComponent('Hola, acabo de solicitar la Tarjeta Saravia (' + row.tipo + ') a nombre de ' + row.nombre + '.') + '">💬 Avisar por WhatsApp para agilizar</a></div>';
    }).catch(function () {
      btn.disabled = false;
      msg.innerHTML = 'No se pudo enviar. <a target="_blank" rel="noopener" href="https://wa.me/56953817335?text=' + encodeURIComponent('Hola, quiero solicitar la Tarjeta Saravia. Soy ' + row.nombre + ', tel ' + tel) + '">Solicítala por WhatsApp</a>.';
      msg.className = 'acc-msg err';
    });
  });
})();
