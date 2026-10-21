/* Marca de agua "DESARMADURÍA SARAVIA" repetida en diagonal, leve transparente,
 * aplicada en el navegador antes de subir cualquier foto (repuestos y vehículos).
 * Uso: window.apcMarcaAgua(canvas)  → dibuja encima del canvas ya pintado.
 *      window.apcPrepararFoto(file, {max:1600, calidad:0.82}) → File JPG achicado + marca de agua. */
(function () {
  "use strict";
  var TEXTO = "DESARMADURÍA SARAVIA";

  function marcaAgua(c) {
    var ctx = c.getContext("2d"), w = c.width, h = c.height;
    var base = Math.max(w, h);
    var fs = Math.round(base * 0.034);            // tamaño de letra proporcional a la foto
    if (fs < 14) fs = 14;
    ctx.save();
    ctx.font = "700 " + fs + "px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 7);                      // ~26° en diagonal
    var tw = ctx.measureText(TEXTO).width;
    var stepX = tw + fs * 1.4, stepY = fs * 3.0;   // separación entre repeticiones
    var cols = Math.ceil(base * 1.6 / stepX), rows = Math.ceil(base * 1.6 / stepY);
    for (var r = -rows; r <= rows; r++) {
      var off = (r % 2) ? stepX / 2 : 0;           // filas alternadas, tipo tablero
      for (var i = -cols; i <= cols; i++) {
        var x = i * stepX + off, y = r * stepY;
        // Sombra oscura + texto claro: se lee sobre fondos claros y oscuros sin tapar la pieza.
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "#000";
        ctx.fillText(TEXTO, x + fs * 0.06, y + fs * 0.06);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#fff";
        ctx.fillText(TEXTO, x, y);
      }
    }
    ctx.restore();
    // Firma pequeña y nítida en la esquina inferior derecha.
    var fs2 = Math.round(base * 0.022); if (fs2 < 11) fs2 = 11;
    ctx.save();
    ctx.font = "700 " + fs2 + "px Arial, Helvetica, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.globalAlpha = 0.55; ctx.fillStyle = "#000";
    ctx.fillText("autopartschile.cl", w - fs2 * 0.8 + 1, h - fs2 * 0.6 + 1);
    ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff";
    ctx.fillText("autopartschile.cl", w - fs2 * 0.8, h - fs2 * 0.6);
    ctx.restore();
    return c;
  }

  // Achica (máx. `max` px), aplica la marca de agua y devuelve un File JPG. Si algo falla, devuelve el original.
  function prepararFoto(file, opt) {
    opt = opt || {};
    var max = opt.max || 1600, calidad = opt.calidad || 0.82;
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type) && !/\.heic$/i.test(file.name)) return resolve(file);
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
          var c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          marcaAgua(c);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) {
            if (!b) return resolve(file);
            resolve(new File([b], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
          }, "image/jpeg", calidad);
        } catch (e) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  window.apcMarcaAgua = marcaAgua;
  window.apcPrepararFoto = prepararFoto;
})();
