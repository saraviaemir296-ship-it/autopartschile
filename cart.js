(function () {
  "use strict";

  var CART_KEY = "apc_cart_v1";

  // ---------- estado del carrito (localStorage, compartido por todas las paginas) ----------

  function getCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
    updateBadge();
    renderPanelItems();
  }
  function cartCount(cart) {
    return (cart || getCart()).reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function cartSubtotal(cart) {
    return (cart || getCart()).reduce(function (n, it) { return n + it.price * it.qty; }, 0);
  }

  function addToCart(sku, name, price, qty) {
    qty = qty || 1;
    var cart = getCart();
    var existing = cart.find(function (it) { return it.sku === sku; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ sku: sku, name: name, price: price, qty: qty });
    }
    saveCart(cart);
    openPanel();
  }
  function removeFromCart(sku) {
    var cart = getCart().filter(function (it) { return it.sku !== sku; });
    saveCart(cart);
  }
  function setQty(sku, qty) {
    qty = Math.max(1, Math.floor(qty) || 1);
    var cart = getCart();
    var it = cart.find(function (x) { return x.sku === sku; });
    if (it) it.qty = qty;
    saveCart(cart);
  }

  // Expuesto globalmente: lo usa /checkout para leer y vaciar el carrito.
  window.apcCart = {
    get: getCart,
    save: saveCart,
    add: addToCart,
    remove: removeFromCart,
    setQty: setQty,
    count: cartCount,
    subtotal: cartSubtotal,
    clear: function () { saveCart([]); },
  };

  // ---------- utilidades de precio (formato chileno: "$1.078.990") ----------

  function parsePriceText(text) {
    if (!text) return 0;
    var digits = String(text).replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }
  function formatPrice(n) {
    n = Math.round(Number(n) || 0);
    return "$" + n.toLocaleString("es-CL");
  }
  window.apcFormatPrice = formatPrice;

  // ---------- estilos (negro / blanco / rojo, coherente con styles.css) ----------

  function injectStyles() {
    if (document.getElementById("apc-cart-styles")) return;
    var css =
      ".apc-cart-btn{position:relative;display:inline-flex;align-items:center;gap:.35rem;background:var(--black,#111);color:#fff;border:none;border-radius:var(--r,8px);padding:.55rem .85rem;font-size:.85rem;font-weight:700;cursor:pointer;text-decoration:none;margin-left:.5rem}" +
      ".apc-cart-btn:hover{background:var(--red,#E31E24)}" +
      ".apc-cart-badge{position:absolute;top:-7px;right:-7px;background:var(--red,#E31E24);color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1}" +
      ".apc-cart-badge.hidden{display:none}" +
      ".apc-panel-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;opacity:0;pointer-events:none;transition:opacity .2s}" +
      ".apc-panel-overlay.open{opacity:1;pointer-events:auto}" +
      ".apc-panel{position:fixed;top:0;right:0;bottom:0;width:100%;max-width:400px;background:#fff;z-index:9999;box-shadow:-4px 0 24px rgba(0,0,0,.2);transform:translateX(100%);transition:transform .25s ease;display:flex;flex-direction:column}" +
      ".apc-panel.open{transform:translateX(0)}" +
      ".apc-panel-head{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.1rem;border-bottom:1px solid var(--gray-border,#E0E0E0)}" +
      ".apc-panel-head h3{margin:0;font-size:1.05rem;font-weight:800;color:var(--black,#111)}" +
      ".apc-panel-close{background:none;border:none;font-size:1.4rem;color:#888;cursor:pointer;line-height:1}" +
      ".apc-panel-items{flex:1;overflow-y:auto;padding:.5rem 1.1rem}" +
      ".apc-panel-empty{color:#777;font-size:.9rem;padding:2rem 0;text-align:center}" +
      ".apc-item{display:flex;gap:.7rem;padding:.85rem 0;border-bottom:1px solid var(--gray-border,#E0E0E0)}" +
      ".apc-item-info{flex:1;min-width:0}" +
      ".apc-item-info h4{margin:0 0 .25rem;font-size:.88rem;font-weight:700;color:var(--black,#111);line-height:1.25}" +
      ".apc-item-price{font-size:.85rem;color:var(--red,#E31E24);font-weight:800;margin:0 0 .4rem}" +
      ".apc-item-qty{display:flex;align-items:center;gap:.4rem}" +
      ".apc-qty-btn{width:24px;height:24px;border:1px solid var(--gray-border,#E0E0E0);background:#fff;border-radius:6px;cursor:pointer;font-weight:800;color:var(--black,#111);line-height:1}" +
      ".apc-qty-val{min-width:20px;text-align:center;font-size:.85rem;font-weight:700}" +
      ".apc-item-remove{background:none;border:none;color:#999;font-size:.78rem;cursor:pointer;text-decoration:underline;margin-top:.4rem}" +
      ".apc-panel-foot{border-top:1px solid var(--gray-border,#E0E0E0);padding:1rem 1.1rem;background:var(--gray-light,#F5F5F5)}" +
      ".apc-subtotal-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem}" +
      ".apc-subtotal-row span:first-child{font-size:.85rem;color:#555;font-weight:600}" +
      ".apc-subtotal-row span:last-child{font-size:1.15rem;font-weight:800;color:var(--black,#111)}" +
      ".apc-checkout-btn{display:block;width:100%;text-align:center;background:var(--red,#E31E24);color:#fff;border:none;border-radius:var(--r,8px);padding:.8rem;font-size:.95rem;font-weight:800;cursor:pointer;text-decoration:none}" +
      ".apc-checkout-btn:hover{background:#C41A1F}" +
      ".apc-add-btn{flex:1;text-align:center;background:var(--black,#111);color:#fff;border-radius:6px;padding:.5rem .4rem;font-size:.76rem;font-weight:700;text-decoration:none;display:block;cursor:pointer;border:none}" +
      ".apc-add-btn:hover{background:var(--red,#E31E24)}" +
      ".apc-add-btn.added{background:var(--red,#E31E24)}";
    var style = document.createElement("style");
    style.id = "apc-cart-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ---------- icono en el header ----------

  var badgeEl = null;

  function updateBadge() {
    if (!badgeEl) return;
    var n = cartCount();
    badgeEl.textContent = String(n);
    badgeEl.classList.toggle("hidden", n === 0);
  }

  function injectCartIcon() {
    if (document.getElementById("apc-cart-icon")) return;
    var waBtn = document.querySelector(".btn-wa-header");
    var headerInner = document.querySelector(".header-inner");
    if (!headerInner) return;
    injectStyles();

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "apc-cart-icon";
    btn.className = "apc-cart-btn";
    btn.setAttribute("aria-label", "Ver carrito");
    btn.innerHTML = '🛒 Carrito<span class="apc-cart-badge hidden">0</span>';
    if (waBtn && waBtn.parentNode) {
      waBtn.parentNode.insertBefore(btn, waBtn.nextSibling);
    } else {
      headerInner.appendChild(btn);
    }
    badgeEl = btn.querySelector(".apc-cart-badge");
    btn.addEventListener("click", openPanel);
    updateBadge();
  }

  // ---------- panel lateral ----------

  var panelEl = null;
  var overlayEl = null;

  function buildPanel() {
    if (panelEl) return;
    injectStyles();
    overlayEl = document.createElement("div");
    overlayEl.className = "apc-panel-overlay";
    overlayEl.addEventListener("click", closePanel);

    panelEl = document.createElement("div");
    panelEl.className = "apc-panel";
    panelEl.innerHTML =
      '<div class="apc-panel-head"><h3>Tu carrito</h3><button type="button" class="apc-panel-close" aria-label="Cerrar">&times;</button></div>' +
      '<div class="apc-panel-items"></div>' +
      '<div class="apc-panel-foot">' +
      '<div class="apc-subtotal-row"><span>Subtotal</span><span class="apc-subtotal-val">$0</span></div>' +
      '<a href="/checkout" class="apc-checkout-btn">Ir a checkout &rarr;</a>' +
      "</div>";
    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);
    panelEl.querySelector(".apc-panel-close").addEventListener("click", closePanel);
    renderPanelItems();
  }

  function renderPanelItems() {
    if (!panelEl) return;
    var itemsEl = panelEl.querySelector(".apc-panel-items");
    var subtotalEl = panelEl.querySelector(".apc-subtotal-val");
    var cart = getCart();
    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="apc-panel-empty">Tu carrito está vacío.</p>';
    } else {
      itemsEl.innerHTML = "";
      cart.forEach(function (it) {
        var row = document.createElement("div");
        row.className = "apc-item";
        row.innerHTML =
          '<div class="apc-item-info">' +
          "<h4>" + escapeHtml(it.name) + "</h4>" +
          '<p class="apc-item-price">' + formatPrice(it.price) + "</p>" +
          '<div class="apc-item-qty">' +
          '<button type="button" class="apc-qty-btn apc-qty-minus">-</button>' +
          '<span class="apc-qty-val">' + it.qty + "</span>" +
          '<button type="button" class="apc-qty-btn apc-qty-plus">+</button>' +
          "</div>" +
          '<button type="button" class="apc-item-remove">Eliminar</button>' +
          "</div>";
        row.querySelector(".apc-qty-minus").addEventListener("click", function () {
          setQty(it.sku, it.qty - 1 <= 0 ? 1 : it.qty - 1);
          if (it.qty - 1 <= 0) removeFromCart(it.sku);
        });
        row.querySelector(".apc-qty-plus").addEventListener("click", function () {
          setQty(it.sku, it.qty + 1);
        });
        row.querySelector(".apc-item-remove").addEventListener("click", function () {
          removeFromCart(it.sku);
        });
        itemsEl.appendChild(row);
      });
    }
    subtotalEl.textContent = formatPrice(cartSubtotal(cart));
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function openPanel() {
    buildPanel();
    renderPanelItems();
    overlayEl.classList.add("open");
    panelEl.classList.add("open");
  }
  function closePanel() {
    if (!panelEl) return;
    overlayEl.classList.remove("open");
    panelEl.classList.remove("open");
  }
  window.apcOpenCart = openPanel;

  // ---------- botones "Agregar al carrito" en las tarjetas de producto ----------
  // Reutiliza el mismo patrón que checkout.js: lee data-sku / data-name / data-price
  // del boton "Pagar ahora" ya presente en .rcard-actions / .prod-actions, y agrega
  // al lado un boton nuevo que suma al carrito en vez de ir directo a pago.

  function priceFromCard(card) {
    var priceEl = card && card.querySelector(".rcard-price, .prod-price");
    return priceEl ? parsePriceText(priceEl.textContent) : 0;
  }
  function nameFromCard(card) {
    var h = card && card.querySelector("h3");
    return h ? h.textContent.trim() : "Repuesto";
  }

  function injectAddButtons() {
    var actionBlocks = document.querySelectorAll(".rcard-actions, .prod-actions");
    if (!actionBlocks.length) return;
    injectStyles();
    actionBlocks.forEach(function (actions) {
      if (actions.querySelector(".apc-add-btn")) return;
      var payBtn = actions.querySelector("[data-sku]");
      if (!payBtn) return;
      var card = actions.closest(".repuesto-card") || actions.closest(".prod-card");
      var sku = payBtn.getAttribute("data-sku");
      var name = payBtn.getAttribute("data-name") || nameFromCard(card);
      var price = payBtn.getAttribute("data-price");
      price = price ? parsePriceText(price) : priceFromCard(card);
      if (!sku || !price) return;

      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "apc-add-btn";
      addBtn.textContent = "🛒 Agregar";
      actions.insertBefore(addBtn, payBtn);

      addBtn.addEventListener("click", function (e) {
        e.preventDefault();
        addToCart(sku, name, price, 1);
        var original = addBtn.textContent;
        addBtn.textContent = "✓ Agregado";
        addBtn.classList.add("added");
        setTimeout(function () {
          addBtn.textContent = original;
          addBtn.classList.remove("added");
        }, 1200);
      });
    });
  }

  function init() {
    injectCartIcon();
    injectAddButtons();
    updateBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
