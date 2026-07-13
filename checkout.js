(function () {
  var ENDPOINT = "https://zlyforhywunqhitrdreo.supabase.co/functions/v1/mp-create-preference";
  var STORAGE_KEY = "apc_checkout_customer";

  function loadSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveCustomer(c) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("apc-checkout-styles")) return;
    var css =
      ".apc-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}" +
      ".apc-modal{background:#fff;border-radius:14px;max-width:400px;width:100%;padding:1.5rem;box-shadow:0 10px 40px rgba(0,0,0,.25);position:relative}" +
      ".apc-modal h3{font-size:1.1rem;font-weight:800;margin:0 0 .3rem;color:#111}" +
      ".apc-modal p.apc-sub{font-size:.85rem;color:#666;margin:0 0 1rem}" +
      ".apc-field{margin-bottom:.75rem}" +
      ".apc-field label{display:block;font-size:.78rem;font-weight:700;color:#333;margin-bottom:.25rem}" +
      ".apc-field input{width:100%;padding:.55rem .7rem;border:1.5px solid #ddd;border-radius:8px;font-size:.9rem;box-sizing:border-box}" +
      ".apc-field input:focus{outline:none;border-color:#009ee3}" +
      ".apc-modal-actions{display:flex;gap:.5rem;margin-top:1.1rem}" +
      ".apc-btn-pay{flex:1;background:#009ee3;color:#fff;border:none;border-radius:8px;padding:.7rem;font-size:.92rem;font-weight:800;cursor:pointer}" +
      ".apc-btn-pay:hover{background:#0088c7}" +
      ".apc-btn-pay:disabled{opacity:.6;cursor:default}" +
      ".apc-btn-cancel{background:transparent;border:none;color:#888;font-size:.85rem;cursor:pointer;padding:.7rem .5rem}" +
      ".apc-close{position:absolute;top:.6rem;right:.8rem;background:none;border:none;font-size:1.3rem;color:#999;cursor:pointer;line-height:1}" +
      ".apc-error{color:#c0392b;font-size:.82rem;margin-top:.6rem;display:none}" +
      ".apc-item-summary{background:#f4f6f8;border-radius:8px;padding:.65rem .8rem;margin-bottom:1rem;font-size:.85rem;color:#333}" +
      ".apc-item-summary strong{display:block;font-size:.92rem;color:#111;margin-bottom:.15rem}";
    var style = document.createElement("style");
    style.id = "apc-checkout-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function openModal(sku, productName, priceText) {
    injectStyles();
    var saved = loadSaved();

    var overlay = document.createElement("div");
    overlay.className = "apc-modal-overlay";
    overlay.innerHTML =
      '<div class="apc-modal">' +
      '<button type="button" class="apc-close" aria-label="Cerrar">&times;</button>' +
      "<h3>Pagar con Mercado Pago</h3>" +
      '<p class="apc-sub">Completa tus datos para generar el link de pago seguro.</p>' +
      '<div class="apc-item-summary"><strong>' + (productName || "Repuesto") + "</strong>" + (priceText || "") + "</div>" +
      '<form id="apc-form">' +
      '<div class="apc-field"><label>Nombre</label><input type="text" name="first_name" required value="' + (saved.first_name || "") + '"></div>' +
      '<div class="apc-field"><label>Apellido</label><input type="text" name="last_name" value="' + (saved.last_name || "") + '"></div>' +
      '<div class="apc-field"><label>Email</label><input type="email" name="email" required value="' + (saved.email || "") + '"></div>' +
      '<div class="apc-field"><label>Teléfono</label><input type="tel" name="phone" placeholder="+56 9 ..." value="' + (saved.phone || "") + '"></div>' +
      '<div class="apc-modal-actions">' +
      '<button type="button" class="apc-btn-cancel">Cancelar</button>' +
      '<button type="submit" class="apc-btn-pay">Ir a pagar &rarr;</button>' +
      "</div>" +
      '<p class="apc-error"></p>' +
      "</form>" +
      "</div>";
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
    }
    overlay.querySelector(".apc-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    var form = overlay.querySelector("#apc-form");
    var errorEl = overlay.querySelector(".apc-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var customer = {
        first_name: fd.get("first_name"),
        last_name: fd.get("last_name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
      };
      saveCustomer(customer);
      var btn = form.querySelector(".apc-btn-pay");
      btn.disabled = true;
      btn.textContent = "Generando link...";
      errorEl.style.display = "none";

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ sku: sku, quantity: 1 }], customer: customer }),
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.data.init_point) {
            throw new Error((res.data && res.data.error) || "No se pudo generar el pago");
          }
          window.location.href = res.data.init_point;
        })
        .catch(function (err) {
          errorEl.textContent =
            "No pudimos generar el link de pago (" + err.message + "). Puedes escribirnos por WhatsApp para coordinar el pago.";
          errorEl.style.display = "block";
          btn.disabled = false;
          btn.textContent = "Ir a pagar →";
        });
    });
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a.rcard-pay[data-sku]");
    if (!el) return;
    e.preventDefault();
    var card = el.closest(".repuesto-card");
    var name = card ? (card.querySelector("h3") || {}).textContent : "";
    var price = card ? (card.querySelector(".rcard-price") || {}).textContent : "";
    openModal(el.getAttribute("data-sku"), name, price);
  });
})();
