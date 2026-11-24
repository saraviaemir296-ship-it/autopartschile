/* Imágenes de referencia por tipo de pieza (AutopartsChile).
 * Clasifica un repuesto por su nombre y entrega una ilustración genérica ROTULADA como referencia.
 * Nunca reemplaza la foto real ni va al feed de Google: solo se muestra en el sitio cuando falta foto
 * o junto a la foto real. Iconos: Material Design Icons (Apache-2.0) y Tabler Icons (MIT), ver /img/referencia/LICENCIAS.txt
 * Este archivo se usa en el navegador (window.APCRef) y en la función /repuesto (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.APCRef = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var TIPOS = {
    airbag: 'Airbag', cinturon: 'Cinturón de seguridad', turbo: 'Turbo e intercooler', embrague: 'Embrague', caja: 'Caja de cambios',
    interior: 'Interior', limpia: 'Limpiaparabrisas', carga: 'Alternador, partida y batería', clima: 'Aire acondicionado y calefacción',
    ventilador: 'Ventilador', modulo: 'Módulo electrónico', sensor: 'Sensor', llave: 'Chapa de contacto y llave', electrico: 'Componente eléctrico',
    espejo: 'Espejo', vidrio: 'Vidrio', foco: 'Foco y luces', chapa: 'Chapa y manilla', puerta: 'Puerta', asiento: 'Asiento',
    tablero: 'Tablero e instrumentos', direccion: 'Dirección', audio: 'Radio y audio', bocina: 'Bocina', suspension: 'Suspensión', freno: 'Frenos',
    rueda: 'Llantas y ruedas', transmision: 'Transmisión y ejes', radiador: 'Refrigeración', combustible: 'Sistema de combustible', escape: 'Escape',
    admision: 'Admisión de aire', aceite: 'Lubricación', bomba: 'Bomba', motor_int: 'Componente de motor', motor: 'Motor', carroceria: 'Carrocería', generico: 'Repuesto'
  };
  // El orden importa: gana la primera regla que calza.
  var REGLAS = [
    ['generico', /\bgata\b|herramienta|llave de rueda/],
    ['airbag', /airbag/], ['cinturon', /cinturon/],
    ['turbo', /\bturbo|intercooler|recirculacion/],
    ['embrague', /embrague|\bprensa\b|collarin|volante motor/],
    ['caja', /caja de cambio|caja automatica|caja mecanica|caja cvt|transmision automatica|convertidor de torque|palanca (de cambios|selectora)|selector de cambios|piolas? de cambio|mecatronic|\btcm\b/],
    ['interior', /tapiz|consola|guantera|alfombra|cielo|parasol|cenicero|encendedor|apoya|posavasos|zocalo|bandeja trasera|cubre maleta|cubre equipaje|piso de maleta|panel lateral|moldura de pilar|molduras de pilar|molduras de madera|manilla de techo/],
    ['electrico', /\bcomando\b/],
    ['audio', /parlante|\bradio\b|antena|amplificador/],
    ['limpia', /limpia|plumilla|lavaparabrisas/],
    ['carga', /alternador|motor de partida|motor de arranque|bateria/],
    ['clima', /aire acondicionado|climatiz|calefac|compresor|condensador|evaporador|\ba\/c\b/],
    ['ventilador', /ventilador|electroventilador/],
    ['modulo', /modulo|computador|\becu\b|\bbcm\b|\bpcm\b|unidad de control|inmovilizador|centralita/],
    ['sensor', /sensor|flujometro|\bmaf\b|\bmap\b|sonda|captador/],
    ['llave', /chapa de contacto|\bllave\b|telemando|control remoto/],
    ['electrico', /alzavidrio|comando|switch|boton|interruptor|perilla|ramal|arnes|cable|fusible|\brele|bobina|conector|bujia|cierre centralizado|actuador|resistencia|flasher|sirena|alarma|control de espejos/],
    ['espejo', /espejo|retrovisor/],
    ['vidrio', /vidrio|parabrisas|luneta|\baleta\b/],
    ['carroceria', /amortiguador(es)? de (portalon|capot|maleta)|bisel/],
    ['foco', /\bfoco|optico|farol|neblinero|\bluz\b|\bluces\b|\bstop\b|intermitente|ampolleta|xenon|balastro|baliza/],
    ['chapa', /\bchapa\b|manilla|cerradura|trinquete|bisagra|piola y manilla/],
    ['puerta', /puerta|portalon|tapa (de )?maleta|portamaleta/],
    ['asiento', /asiento|butaca/],
    ['tablero', /tablero|cuadro de instrumentos|velocimetro|instrumentos|\breloj\b|pizarra/],
    ['direccion', /direccion|cremallera|volante|manubrio|columna|terminal de|axial/],
    ['audio', /\bradio\b|parlante|antena|amplificador|subwoofer|tweeter/],
    ['bocina', /bocina/],
    ['suspension', /amortiguador|espiral|resorte|bandeja|\bbrazo|bieleta|barra estabilizadora|rotula|\bcuna\b|subchasis|puente|eje trasero|munon|suspension|\bbuje|tren delantero/],
    ['freno', /freno|caliper|\bdisco\b|tambor|pastilla|balata|\bservo\b/],
    ['rueda', /llanta|neumatico|rueda|tapa centro|tuerca/],
    ['transmision', /palier|semieje|homocinetica|cardan|diferencial|cruceta|transfer|punta de eje|\bmasas?\b|\bmaza\b|rodamiento/],
    ['radiador', /radiador|refrigerante|termostato|mangueras? de agua/],
    ['combustible', /bencina|combustible|inyector|\briel\b|canister|estanque|alta presion/],
    ['escape', /escape|catalitic|catalizador|silenciador|downpipe/],
    ['admision', /admision|filtro de aire|portafiltro|cuerpo de aceleracion|mariposa/],
    ['aceite', /aceite|carter|varilla/],
    ['bomba', /bomba/],
    ['motor_int', /culata|\bblock\b|ciguenal|levas|piston|biela|valvula|distribucion|cadena|polea|tensor|variador|balancin|empaquetadura|soporte de (motor|caja)/],
    ['motor', /\bmotor\b/],
    ['carroceria', /capot|tapabarro|parachoque|mascara|parrilla|frontal|\btecho\b|costado|guardafango|cubrepolvo|refuerzo|pisadera|rejilla|emblema|insignia|chasis|travesano|spoiler|barras de techo|pick ?up|moldura|cuarto de pollo|guardabarro|remolque/]
  ];
  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function tipo(nombre) {
    var n = norm(nombre);
    for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][1].test(n)) return REGLAS[i][0];
    return 'generico';
  }
  function info(p) {
    var nombre = typeof p === 'string' ? p : (p && p.name) || '';
    var k = tipo(nombre);
    return { tipo: k, etiqueta: TIPOS[k], src: '/img/referencia/' + k + '.png',
      alt: 'Imagen referencial de ' + TIPOS[k].toLowerCase() + ' (ilustración, no es la pieza real)' + (nombre ? ': ' + nombre : '') };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Miniatura para listados (se rotula con "REF")
  function thumb(p) {
    var r = info(p);
    return '<span class="apc-ref-th" title="Imagen referencial: ' + esc(r.etiqueta) + '. No es la pieza real."><img src="' + r.src + '" alt="' + esc(r.alt) + '" loading="lazy" width="120" height="120"><i>REF</i></span>';
  }
  var CSS = '.apc-ref-th{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:48px;background:linear-gradient(160deg,#f6f7f9,#e6e9ee);border-radius:inherit;overflow:hidden}' +
    '.apc-ref-th img{width:100%;height:100%;object-fit:contain!important;padding:8%;box-sizing:border-box}' +
    '.apc-ref-th i{position:absolute;left:4px;top:4px;font:700 9px/1 system-ui,sans-serif;letter-spacing:.5px;background:#111;color:#fff;padding:3px 4px;border-radius:3px;font-style:normal}';
  if (typeof document !== 'undefined' && !document.getElementById('apc-ref-css')) {
    var st = document.createElement('style'); st.id = 'apc-ref-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
  }
  return { TIPOS: TIPOS, tipo: tipo, info: info, thumb: thumb, CSS: CSS };
});
