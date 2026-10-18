/* Comprobante de pago Webpay en las páginas de resultado.
 * Solo actúa si la URL trae ?order=<id>&k=<clave>. Sin clave (p. ej. retorno de Mercado Pago)
 * la página queda como estaba. Todo el texto se inserta con textContent (sin HTML de datos). */
(function () {
  var params = new URLSearchParams(window.location.search);
  var order = params.get("order");
  var key = params.get("k");
  var box = document.getElementById("voucher");
  if (!order || !key || !box) return;

  var ENDPOINT = "https://zlyforhywunqhitrdreo.supabase.co/functions/v1/webpay-receipt";
  var page = document.body.getAttribute("data-result"); // ok | fail | pending

  function clp(n) {
    return "$" + Math.round(Number(n) || 0).toLocaleString("es-CL") + " CLP";
  }
  function fecha(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" });
  }
  function row(tbody, label, value) {
    if (value === null || value === undefined || value === "") return;
    var tr = document.createElement("tr");
    var th = document.createElement("th");
    var td = document.createElement("td");
    th.textContent = label;
    td.textContent = value;
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  function setText(sel, text) {
    var el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  var url = ENDPOINT + "?order=" + encodeURIComponent(order) + "&k=" + encodeURIComponent(key);
  var qs = "?order=" + encodeURIComponent(order) + "&k=" + encodeURIComponent(key);

  // En la página de pendiente, seguir consultando hasta que el pago se resuelva (máx. ~3 min).
  function poll(attempt) {
    if (attempt > 36) return;
    setTimeout(function () {
      fetch(url, { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.status === "completed") window.location.replace("/pago-exitoso.html" + qs);
          else if (d && (d.status === "cancelled" || d.status === "refunded")) window.location.replace("/pago-fallido.html" + qs);
          else poll(attempt + 1);
        })
        .catch(function () { poll(attempt + 1); });
    }, 5000);
  }

  fetch(url, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      if (page === "pending") {
        if (d.status === "completed") { window.location.replace("/pago-exitoso.html" + qs); return; }
        if (d.status === "cancelled" || d.status === "refunded") { window.location.replace("/pago-fallido.html" + qs); return; }
        if (d.status === "pending") poll(0);
      }

      if (page === "pending") {
        setText(".resultado-box h1", "Estamos confirmando tu pago");
        setText(".resultado-box p", "El banco aún no nos confirma el resultado. No vuelvas a pagar: revisaremos tu pedido y te contactaremos por WhatsApp a la brevedad.");
      }

      var table = document.createElement("table");
      table.className = "voucher-table";
      var tbody = document.createElement("tbody");
      table.appendChild(tbody);

      row(tbody, "Comercio", d.merchant);
      row(tbody, "Orden de compra", d.buy_order);
      row(tbody, "Monto", clp(d.amount));

      if (page === "ok" && d.status === "completed") {
        row(tbody, "Código de autorización", d.authorization_code);
        row(tbody, "Fecha", fecha(d.transaction_date));
        row(tbody, "Tipo de pago", d.payment_type);
        row(tbody, "Tipo de cuotas", d.installments_type);
        if (d.installments_number && d.installments_number > 0) {
          row(tbody, "Cantidad de cuotas", String(d.installments_number));
          if (d.installments_amount) row(tbody, "Monto de cada cuota", clp(d.installments_amount));
        }
        row(tbody, "Tarjeta terminada en", d.card_last4 ? "**** " + d.card_last4 : "");
      } else if (d.transaction_date) {
        row(tbody, "Fecha", fecha(d.transaction_date));
      }

      var desc = (d.items || []).map(function (i) { return i.quantity + " × " + i.name; }).join("; ");
      row(tbody, "Detalle de la compra", desc);

      var title = document.createElement("h2");
      title.className = "voucher-title";
      title.textContent = page === "ok" ? "Comprobante de pago" : "Detalle del intento de pago";
      box.appendChild(title);
      box.appendChild(table);

      if (page === "fail") {
        var p = document.createElement("p");
        p.className = "voucher-note";
        p.textContent = "Posibles causas: datos de la tarjeta incorrectos, saldo o cupo insuficiente, tarjeta bloqueada o no habilitada para compras por internet, autenticación del banco no completada, o el pago fue anulado o expiró. No se realizó ningún cargo; puedes intentar con otra tarjeta.";
        box.appendChild(p);
      }
      if (page === "ok" && d.in_review) {
        var n = document.createElement("p");
        n.className = "voucher-note";
        n.textContent = "Tu pago quedó registrado. Vamos a revisar la disponibilidad del repuesto y te contactaremos por WhatsApp.";
        box.appendChild(n);
      }
      box.hidden = false;
    })
    .catch(function () { /* la página ya muestra el mensaje general */ });
})();
