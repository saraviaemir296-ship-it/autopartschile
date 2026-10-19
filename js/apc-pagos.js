/* Franja "Medios de pago" + "Envíos a todo Chile".
 * Solo muestra medios que funcionan hoy en el checkout (ver img/pagos/FUENTES.md).
 * Footer: se inserta antes de .footer-bottom en todas las páginas.
 * Compacta: cualquier elemento [data-apc-pagos="compact"] (checkout y modal de pago). */
(function () {
  "use strict";
  if (window.__apcPagos) return;
  window.__apcPagos = true;

  var V = "?v=20261019p";
  var PAGOS = [
    { img: "/img/pagos/webpay-plus-fondo-claro.png" + V, alt: "Webpay Plus de Transbank", w: 134, h: 34 },
    { img: "/img/pagos/mercado-pago-horizontal.svg" + V, alt: "Mercado Pago", w: 123, h: 50 },
    { img: "/img/pagos/mastercard-symbol.svg" + V, alt: "Mastercard", w: 62, h: 44 }
  ];
  var EXTRA = ["Transferencia bancaria", "Efectivo en local"];
  var ENVIOS = ["Starken", "Chilexpress", "Blue Express", "Pullman Cargo", "Retiro en local"];

  var css =
    ".apc-pg{background:#0f0f10;border-top:1px solid #1f1f22;border-bottom:1px solid #1f1f22;padding:2.25rem 0}" +
    ".apc-pg-wrap{display:grid;grid-template-columns:1.4fr 1fr;gap:2.5rem;align-items:start}" +
    ".apc-pg h4{color:#fff;font-size:.8rem;letter-spacing:.14em;font-weight:800;margin:0 0 .3rem;text-transform:uppercase}" +
    ".apc-pg p.apc-pg-sub{color:#9a9aa0;font-size:.82rem;margin:0 0 1rem}" +
    ".apc-pg-row{display:flex;flex-wrap:wrap;gap:.7rem;align-items:center}" +
    ".apc-pg-tile{background:#fff;border-radius:10px;height:62px;padding:0 1.1rem;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 1px 0 rgba(255,255,255,.04),0 6px 16px rgba(0,0,0,.35);transition:transform .25s ease,box-shadow .25s ease}" +
    ".apc-pg-tile img{display:block;width:auto}" +
    ".apc-pg-tile:hover{transform:translateY(-2px) perspective(600px) rotateX(3deg);box-shadow:0 10px 24px rgba(0,0,0,.45)}" +
    ".apc-pg-txt{color:#ddd;font-size:.82rem;font-weight:600;border:1px solid #2c2c30;border-radius:10px;height:62px;padding:0 1rem;display:flex;align-items:center}" +
    ".apc-pg-chip{color:#eee;font-size:.85rem;font-weight:700;border:1px solid #2c2c30;border-radius:999px;padding:.5rem .95rem;background:#151517;transition:border-color .2s}" +
    ".apc-pg-chip:hover{border-color:#D10B0C}" +
    ".apc-pg a.apc-pg-link{display:inline-block;margin-top:.9rem;color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;border-bottom:1px solid #D10B0C}" +
    ".apc-pg-in{opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease}" +
    ".apc-pg-in.is-on{opacity:1;transform:none}" +
    ".apc-pgc{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;justify-content:center;margin:.8rem 0 0}" +
    ".apc-pgc span.l{width:100%;text-align:center;font-size:.72rem;color:#888;letter-spacing:.08em;text-transform:uppercase}" +
    ".apc-pgc .t{background:#fff;border:1px solid #e6e6e6;border-radius:8px;height:36px;padding:0 .6rem;display:flex;align-items:center}" +
    ".apc-pgc .t img{width:auto;display:block}" +
    "@media (max-width:820px){.apc-pg-wrap{grid-template-columns:1fr;gap:1.8rem}.apc-pg-tile,.apc-pg-txt{height:54px}}" +
    "@media (prefers-reduced-motion:reduce){.apc-pg-in{opacity:1;transform:none;transition:none}.apc-pg-tile,.apc-pg-tile:hover{transition:none;transform:none}}";

  function tile(p) {
    return '<div class="apc-pg-tile"><img src="' + p.img + '" alt="' + p.alt + '" width="' + p.w + '" height="' + p.h + '" style="height:' + p.h + 'px;width:' + p.w + 'px" loading="lazy" decoding="async"></div>';
  }

  function footerStrip() {
    var bottom = document.querySelector(".footer .footer-bottom");
    if (!bottom || document.querySelector(".apc-pg")) return;
    var s = document.createElement("section");
    s.className = "apc-pg";
    s.setAttribute("aria-label", "Medios de pago y envíos");
    s.innerHTML =
      '<div class="container apc-pg-wrap">' +
      '<div class="apc-pg-in"><h4>Medios de pago</h4><p class="apc-pg-sub">Compra de forma segura con los medios disponibles en nuestra tienda</p>' +
      '<div class="apc-pg-row">' + PAGOS.map(tile).join("") +
      EXTRA.map(function (t) { return '<div class="apc-pg-txt">' + t + "</div>"; }).join("") +
      '</div><a class="apc-pg-link" href="/metodos-de-pago">Ver métodos de pago</a></div>' +
      '<div class="apc-pg-in"><h4>Envíos a todo Chile</h4><p class="apc-pg-sub">Despachamos con el transportista que prefieras</p>' +
      '<div class="apc-pg-row">' + ENVIOS.map(function (t) { return '<span class="apc-pg-chip">' + t + "</span>"; }).join("") +
      '</div><a class="apc-pg-link" href="/envios">Ver condiciones de despacho</a></div>' +
      "</div>";
    bottom.parentNode.insertBefore(s, bottom);
    var items = s.querySelectorAll(".apc-pg-in");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-on"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-on"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (i, n) { i.style.transitionDelay = n * 120 + "ms"; io.observe(i); });
  }

  function compact(root) {
    (root || document).querySelectorAll('[data-apc-pagos="compact"]:not([data-done])').forEach(function (el) {
      el.setAttribute("data-done", "1");
      el.className = (el.className + " apc-pgc").trim();
      el.innerHTML = '<span class="l">Pago seguro con</span>' + PAGOS.map(function (p) {
        return '<span class="t"><img src="' + p.img + '" alt="' + p.alt + '" style="height:' + Math.round(p.h * 0.55) + 'px;width:' + Math.round(p.w * 0.55) + 'px" loading="lazy" decoding="async"></span>';
      }).join("");
    });
  }

  function init() {
    var st = document.createElement("style");
    st.id = "apc-pagos-css";
    st.textContent = css;
    document.head.appendChild(st);
    footerStrip();
    compact();
    if ("MutationObserver" in window) {
      new MutationObserver(function () { compact(); }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
