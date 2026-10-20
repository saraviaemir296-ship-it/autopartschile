/* "Hacer una oferta" + "Precio socio" en cada repuesto.
 * Se activa en cualquier elemento [data-apc-oferta] con data-sku, data-name y data-price.
 * Reglas (las valida también la base de datos): oferta >= 70% y < precio publicado.
 * Requiere la migración supabase/migrations/20261020_fidelizacion_ofertas.sql. */
(function () {
  "use strict";
  if (window.__apcOferta) return;
  window.__apcOferta = true;

  var URL_ = "https://zlyforhywunqhitrdreo.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw";
  var WA = "56953817335";
  var MIN = 0.7;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clp(n) { return "$" + Math.round(Number(n)).toLocaleString("es-CL"); }
  function session() {
    try {
      var s = JSON.parse(localStorage.getItem("sb-zlyforhywunqhitrdreo-auth-token") || "null");
      if (s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now() + 30000)) return s;
    } catch (e) {}
    return null;
  }
  function headers(tok) {
    return { apikey: KEY, Authorization: "Bearer " + (tok || KEY), "Content-Type": "application/json" };
  }
  function errMsg(t) {
    var m = /"message"\s*:\s*"([^"]+)"/.exec(t || "");
    var s = m ? m[1] : "";
    if (/mínima|menor al precio|no está disponible|no tiene precio|Demasiadas/.test(s)) return s + ".";
    return "No pudimos enviar tu oferta. Inténtalo de nuevo o escríbenos por WhatsApp.";
  }

  var css =
    ".apo{margin-top:.7rem;display:flex;flex-direction:column;gap:.55rem}" +
    ".apo-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;border:1.5px solid #111;background:#fff;color:#111;border-radius:10px;padding:.7rem 1rem;font-weight:800;font-size:.95rem;cursor:pointer;transition:background .2s,color .2s}" +
    ".apo-btn:hover{background:#111;color:#fff}" +
    ".apo-socio{border:1.5px dashed #D10B0C;border-radius:10px;padding:.65rem .85rem;font-size:.9rem;background:#fff7f7}" +
    ".apo-socio b{color:#D10B0C}.apo-socio a{color:#111;font-weight:800}" +
    ".apo-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem}" +
    ".apo-m{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:1.4rem;position:relative;max-height:92vh;overflow:auto}" +
    ".apo-m h3{margin:0 0 .2rem;font-size:1.15rem}.apo-m p.s{margin:0 0 .9rem;color:#666;font-size:.86rem}" +
    ".apo-x{position:absolute;top:.6rem;right:.8rem;border:0;background:none;font-size:1.5rem;cursor:pointer;color:#888}" +
    ".apo-m label{display:block;font-size:.8rem;font-weight:700;margin:.55rem 0 .2rem;color:#333}" +
    ".apo-m input,.apo-m textarea{width:100%;box-sizing:border-box;padding:.65rem .7rem;border:1.5px solid #ddd;border-radius:8px;font:inherit}" +
    ".apo-m input:focus,.apo-m textarea:focus{outline:2px solid #D10B0C;border-color:#D10B0C}" +
    ".apo-q{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.45rem}" +
    ".apo-q button{border:1.5px solid #ddd;background:#fafafa;border-radius:20px;padding:.35rem .7rem;font-weight:700;font-size:.82rem;cursor:pointer}" +
    ".apo-q button.on{border-color:#D10B0C;color:#D10B0C;background:#fff}" +
    ".apo-hint{font-size:.78rem;color:#777;margin-top:.3rem}" +
    ".apo-send{width:100%;margin-top:1rem;border:0;border-radius:10px;padding:.85rem;background:#D10B0C;color:#fff;font-weight:800;font-size:1rem;cursor:pointer}" +
    ".apo-send:disabled{opacity:.6;cursor:wait}" +
    ".apo-msg{margin:.7rem 0 0;font-size:.88rem;font-weight:700}.apo-msg.err{color:#b91c1c}.apo-msg.ok{color:#15803d}";

  function injectCss() {
    if (document.getElementById("apo-css")) return;
    var s = document.createElement("style"); s.id = "apo-css"; s.textContent = css; document.head.appendChild(s);
  }

  var sociosSkus = null;
  function loadSociosSkus() {
    if (sociosSkus) return sociosSkus;
    sociosSkus = fetch(URL_ + "/rest/v1/rpc/ofertas_socios_skus", { method: "POST", headers: headers(), body: "{}" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { var m = {}; (rows || []).forEach(function (x) { m[x.sku] = x.nivel; }); return m; })
      .catch(function () { return {}; });
    return sociosSkus;
  }

  function openModal(d) {
    var price = Number(d.price), min = Math.ceil(price * MIN), s = session();
    var prof = {};
    try { prof = JSON.parse(localStorage.getItem("apc_checkout_customer") || "{}"); } catch (e) {}
    var u = s && s.user ? s.user : null, md = (u && u.user_metadata) || {};
    var nombre = md.nombre || [prof.first_name, prof.last_name].filter(Boolean).join(" ");
    var tel = md.telefono || prof.phone || "";
    var mail = (u && u.email) || prof.email || "";
    var picks = [0.95, 0.9, 0.85].map(function (f) { return Math.round(price * f / 100) * 100; }).filter(function (v) { return v >= min && v < price; });

    var ov = document.createElement("div");
    ov.className = "apo-ov";
    ov.innerHTML =
      '<div class="apo-m" role="dialog" aria-modal="true" aria-labelledby="apo-t">' +
      '<button class="apo-x" type="button" aria-label="Cerrar">&times;</button>' +
      '<h3 id="apo-t">Haz tu oferta</h3><p class="s">' + esc(d.name) + "<br>Precio publicado: <b>" + clp(price) + "</b></p>" +
      '<form novalidate><label for="apo-monto">Tu oferta (CLP)</label>' +
      '<input id="apo-monto" name="monto" inputmode="numeric" autocomplete="off" required placeholder="' + clp(Math.round(price * 0.9 / 100) * 100) + '">' +
      (picks.length ? '<div class="apo-q">' + picks.map(function (v) { return '<button type="button" data-v="' + v + '">' + clp(v) + "</button>"; }).join("") + "</div>" : "") +
      '<p class="apo-hint">Ofertas razonables: desde ' + clp(min) + " (70% del precio). Te respondemos por WhatsApp.</p>" +
      '<label for="apo-nombre">Nombre</label><input id="apo-nombre" name="nombre" autocomplete="name" required maxlength="100" value="' + esc(nombre) + '">' +
      '<label for="apo-tel">WhatsApp</label><input id="apo-tel" name="tel" type="tel" autocomplete="tel" required maxlength="30" placeholder="+56 9 …" value="' + esc(tel) + '">' +
      '<label for="apo-mail">Correo (opcional)</label><input id="apo-mail" name="email" type="email" autocomplete="email" maxlength="120" value="' + esc(mail) + '">' +
      '<label for="apo-txt">Comentario (opcional)</label><textarea id="apo-txt" name="mensaje" rows="2" maxlength="500" placeholder="Ej: retiro hoy en el local"></textarea>' +
      '<button class="apo-send" type="submit">Enviar oferta</button><p class="apo-msg" role="status"></p></form></div>';
    document.body.appendChild(ov);
    var f = ov.querySelector("form"), m = ov.querySelector(".apo-msg"), inp = f.monto;
    function close() { ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".apo-x").onclick = close;
    ov.querySelectorAll(".apo-q button").forEach(function (b) {
      b.onclick = function () { m.textContent = ""; inp.value = clp(b.dataset.v); ov.querySelectorAll(".apo-q button").forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
    inp.addEventListener("input", function () {
      m.textContent = ""; var v = inp.value.replace(/\D/g, ""); inp.value = v ? clp(v) : "";
      ov.querySelectorAll(".apo-q button").forEach(function (x) { x.classList.toggle("on", x.dataset.v === v); });
    });
    setTimeout(function () { inp.focus(); }, 50);

    f.onsubmit = function (e) {
      e.preventDefault();
      var monto = parseInt(inp.value.replace(/\D/g, ""), 10) || 0;
      var telv = f.tel.value.trim(), nom = f.nombre.value.trim();
      m.className = "apo-msg err";
      if (!monto) { m.textContent = "Escribe cuánto ofreces."; return inp.focus(); }
      if (monto >= price) { m.textContent = "Tu oferta debe ser menor al precio publicado. Si quieres comprarlo a ese precio, usa Agregar al carrito."; return inp.focus(); }
      if (monto < min) { m.textContent = "La oferta mínima para este repuesto es " + clp(min) + "."; return inp.focus(); }
      if (nom.length < 2) { m.textContent = "Escribe tu nombre."; return f.nombre.focus(); }
      if (telv.replace(/\D/g, "").length < 8) { m.textContent = "Escribe un WhatsApp válido para responderte."; return f.tel.focus(); }
      var btn = f.querySelector(".apo-send"); btn.disabled = true; m.className = "apo-msg ok"; m.textContent = "Enviando…";
      var cur = session();
      var row = { sku: d.sku, monto: monto, nombre: nom, telefono: telv, email: f.email.value.trim() || null, mensaje: f.mensaje.value.trim() || null, user_id: cur && cur.user ? cur.user.id : null };
      fetch(URL_ + "/rest/v1/ofertas_clientes", { method: "POST", headers: Object.assign(headers(cur && cur.access_token), { Prefer: "return=minimal" }), body: JSON.stringify(row) })
        .then(function (r) {
          if (r.ok) {
            if (window.gtag) try { gtag("event", "generate_lead", { method: "oferta", value: monto, currency: "CLP", item_id: d.sku }); } catch (x) {}
            f.innerHTML = '<p class="apo-msg ok" style="font-size:1rem">✓ ¡Oferta enviada por ' + clp(monto) + "!</p>" +
              '<p class="s" style="margin-top:.5rem">La revisamos y te respondemos por WhatsApp al ' + esc(telv) + ". Mientras tanto el repuesto sigue a la venta: si otro cliente lo compra antes, te avisamos." +
              (cur ? ' Puedes ver el estado en <a href="/cuenta">Mi cuenta</a>.' : "") + "</p>" +
              '<a class="apo-send" style="display:block;text-align:center;text-decoration:none;background:#25D366" target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" +
              encodeURIComponent("Hola, acabo de ofertar " + clp(monto) + " por " + d.name + " (" + d.sku + ") en la web.") + '">💬 Avisar por WhatsApp</a>';
            return;
          }
          return r.text().then(function (t) { btn.disabled = false; m.className = "apo-msg err"; m.textContent = errMsg(t); });
        })
        .catch(function () { btn.disabled = false; m.className = "apo-msg err"; m.textContent = "Sin conexión. Inténtalo de nuevo."; });
    };
  }

  function socioBox(el, d, nivel) {
    var box = document.createElement("div");
    box.className = "apo-socio";
    var s = session();
    if (!s) {
      box.innerHTML = "🔒 <b>Precio socio disponible</b> para este repuesto. " +
        (nivel === "tarjeta" ? 'Exclusivo con <a href="/tarjeta-saravia">Tarjeta Saravia</a>.' : '<a href="/cuenta">Crea tu cuenta gratis o ingresa</a> para verlo.');
      el.appendChild(box);
      return;
    }
    fetch(URL_ + "/rest/v1/ofertas_socios?select=precio_socio,nota,hasta&sku=eq." + encodeURIComponent(d.sku) + "&order=precio_socio.asc&limit=1", { headers: headers(s.access_token) })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var o = rows && rows[0];
        if (!o) {
          box.innerHTML = "🔒 <b>Precio socio</b> exclusivo con <a href=\"/tarjeta-saravia\">Tarjeta Saravia</a>.";
        } else {
          box.innerHTML = "⭐ <b>Tu precio socio: " + clp(o.precio_socio) + "</b> <s style=\"color:#888\">" + clp(d.price) + "</s>" +
            (o.nota ? "<br><small>" + esc(o.nota) + "</small>" : "") + (o.hasta ? "<br><small>Válido hasta " + esc(o.hasta.split("-").reverse().join("-")) + "</small>" : "") +
            '<br><a target="_blank" rel="noopener" href="https://wa.me/' + WA + "?text=" + encodeURIComponent("Hola, soy socio (" + (s.user && s.user.email) + ") y quiero comprar " + d.name + " (" + d.sku + ") a precio socio " + clp(o.precio_socio) + ".") + '">💬 Comprar a precio socio por WhatsApp</a>';
        }
        el.appendChild(box);
      })
      .catch(function () {});
  }

  function mount(root) {
    (root || document).querySelectorAll("[data-apc-oferta]:not([data-apo])").forEach(function (el) {
      var d = { sku: el.dataset.sku, name: el.dataset.name || "Repuesto", price: Number(el.dataset.price) };
      if (!d.sku || !(d.price > 0) || /^(TBK|QA)-/i.test(d.sku)) return;
      el.setAttribute("data-apo", "1");
      el.classList.add("apo");
      var b = document.createElement("button");
      b.type = "button"; b.className = "apo-btn"; b.innerHTML = "💸 Hacer una oferta";
      b.onclick = function () { openModal(d); };
      el.appendChild(b);
      loadSociosSkus().then(function (map) { if (map[d.sku]) socioBox(el, d, map[d.sku]); });
    });
  }

  function init() {
    injectCss();
    mount();
    if ("MutationObserver" in window) new MutationObserver(function () { mount(); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.apcOferta = { mount: mount };
})();
