/**
 * Páginas por tipo de pieza Suzuki: /suzuki/motores, /suzuki/bombas-de-bencina, /suzuki/puertas ...
 * y por pieza + modelo: /suzuki/motores/swift.
 * Las sirve netlify/functions/modelo.js (mismo redirect /suzuki/*). Este archivo solo define
 * los tipos y arma el HTML; los datos salen en vivo de la tabla products.
 *
 * Por qué: la gente busca "bomba de bencina suzuki", "motor suzuki swift", "puerta suzuki celerio".
 * Una página por tipo responde esa búsqueda exacta (Google, Bing/ChatGPT) y sirve de destino
 * para un grupo de anuncios propio.
 */

// rx: el nombre del producto (sin tildes, minúsculas) debe calzar. no: lo descarta.
// garantia: solo motores completos / medio motor, cajas de cambio y cremalleras de dirección.
const PIEZAS = [
  { slug: 'motores', uno: 'Motor', plural: 'Motores', rx: /^(motor|medio motor|block)\b/, no: /limpia|partida|arranque|ventilador|electro|alza|soporte|computador|calefac|espejo|aire|lavafar|sapito|wiper/, garantia: true,
    sin: ['motor completo', 'medio motor', 'motor de ensamble', 'block'] },
  { slug: 'cajas-de-cambio', fem: true, uno: 'Caja de cambios', plural: 'Cajas de cambio', rx: /caja (de )?cambio|caja mecanica|caja automatica|transmision/, no: /fusible|calefac|filtro|soporte|palanca|piola|selector/, garantia: true,
    sin: ['caja mecánica', 'caja automática', 'transmisión'] },
  { slug: 'bombas-de-bencina', fem: true, uno: 'Bomba de bencina', plural: 'Bombas de bencina', rx: /bomba (de )?(bencina|combustible|gasolina)/, no: /^$/,
    sin: ['bomba de combustible', 'bomba de gasolina', 'bomba de nafta'] },
  { slug: 'puertas', fem: true, uno: 'Puerta', plural: 'Puertas', rx: /^puerta\b/, no: /manilla|chapa|bisagra|tapiz|panel|vidrio|alza|espejo|goma|burlete|limitador|moldura|parlante/,
    sin: ['puerta delantera', 'puerta trasera', 'puerta piloto', 'puerta copiloto'] },
  { slug: 'focos', uno: 'Foco', plural: 'Focos y ópticos', rx: /\b(foco|optico|faro|farol|neblinero|stop)\b/, no: /ampolleta|soporte|switch|interruptor|tercer/,
    sin: ['óptico', 'farol', 'faro', 'neblinero', 'stop'] },
  { slug: 'parachoques', uno: 'Parachoque', plural: 'Parachoques', rx: /parachoque|paragolpe/, no: /soporte|refuerzo|moldura|rejilla/,
    sin: ['parachoque delantero', 'parachoque trasero', 'paragolpe'] },
  { slug: 'capot', uno: 'Capot', plural: 'Capot', rx: /\bcapot?\b|\bcapo\b/, no: /bisagra|piola|chapa|amortig|goma/, sin: ['capó', 'tapa de motor'] },
  { slug: 'espejos', uno: 'Espejo', plural: 'Espejos retrovisores', rx: /espejo/, no: /^$/, sin: ['retrovisor', 'espejo lateral'] },
  { slug: 'radiadores', uno: 'Radiador', plural: 'Radiadores', rx: /radiador/, no: /tapa|manguera|soporte|electro|ventilador/, sin: ['radiador de agua', 'radiador de calefacción'] },
  { slug: 'culatas', fem: true, uno: 'Culata', plural: 'Culatas', rx: /culata/, no: /empaquetadura|tapa de valvula|tapa valvula/, sin: ['culata completa', 'cabeza de motor'] },
  { slug: 'computadores', uno: 'Computador', plural: 'Computadores (ECU)', rx: /computador|\becu\b|\bbcm\b|modulo de control/, no: /^$/, sin: ['ECU', 'módulo de motor', 'centralita'] },
  { slug: 'alternadores', uno: 'Alternador', plural: 'Alternadores', rx: /alternador/, no: /correa|polea/, sin: ['generador'] },
  { slug: 'motores-de-partida', uno: 'Motor de partida', plural: 'Motores de partida', rx: /motor (de )?partida|motor de arranque|burro de arranque/, no: /^$/, sin: ['motor de arranque', 'burro de partida'] },
  { slug: 'compresores-aire-acondicionado', uno: 'Compresor de aire acondicionado', plural: 'Compresores de aire acondicionado', rx: /compresor/, no: /^$/, sin: ['compresor A/C', 'aire acondicionado'] },
  { slug: 'cremalleras', fem: true, uno: 'Cremallera de dirección', plural: 'Cremalleras de dirección', rx: /cremallera/, no: /terminal|axial|fuelle|puerta|vidrio/, garantia: true, sin: ['caja de dirección', 'dirección'] },
  { slug: 'amortiguadores', uno: 'Amortiguador', plural: 'Amortiguadores', rx: /amortiguador/, no: /capot|portalon|maleta|soporte/, sin: ['suspensión', 'amortiguador delantero', 'amortiguador trasero'] },
  { slug: 'airbags', uno: 'Airbag', plural: 'Airbags', rx: /airbag/, no: /sensor/, sin: ['bolsa de aire'] },
  { slug: 'tableros', uno: 'Tablero', plural: 'Tableros e instrumentos', rx: /tablero|velocimetro|cuadro de instrumento|panel de instrumento/, no: /tapiz/, sin: ['velocímetro', 'cuadro de instrumentos'] },
  { slug: 'portalones', uno: 'Portalón', plural: 'Portalones y tapas de maleta', rx: /portalon|tapa (de )?maleta/, no: /amortig|chapa|manilla|bisagra|goma/, sin: ['tapa de maleta', 'quinta puerta'] },
  { slug: 'tapabarros', uno: 'Tapabarro', plural: 'Tapabarros', rx: /tapabarro|guardafango/, no: /^$/, sin: ['guardafango'] },
  { slug: 'llantas', fem: true, uno: 'Llanta', plural: 'Llantas', rx: /llanta/, no: /^$/, sin: ['aro', 'llanta de aleación'] },
  { slug: 'cuerpos-de-aceleracion', uno: 'Cuerpo de aceleración', plural: 'Cuerpos de aceleración', rx: /cuerpo (de )?aceleracion|mariposa/, no: /^$/, sin: ['mariposa', 'throttle body'] },
  { slug: 'alzavidrios', uno: 'Alzavidrio', plural: 'Alzavidrios', rx: /alzavidrio|alza vidrio|elevavidrio/, no: /^$/, sin: ['elevavidrios', 'motor alzavidrio'] },
  { slug: 'asientos', uno: 'Asiento', plural: 'Asientos', rx: /\basiento|butaca/, no: /riel|palanca|cinturon/, sin: ['butaca', 'corrida de asientos'] },
  { slug: 'sensores', uno: 'Sensor', plural: 'Sensores', rx: /^sensor\b/, no: /^$/, sin: ['sensor de oxígeno', 'sensor MAP', 'sensor de cigüeñal', 'sensor ABS'] },
  { slug: 'chapas', uno: 'Chapa', plural: 'Chapas y cerraduras', fem: true, rx: /^chapa\b|cerradura|chapa de contacto/, no: /^$/, sin: ['cerradura', 'chapa de contacto', 'chapa de puerta'] },
  { slug: 'vidrios', uno: 'Vidrio', plural: 'Vidrios', rx: /^vidrio\b|parabrisas|luneta/, no: /limpia|motor|alza|deposito|brazo/, sin: ['parabrisas', 'luneta', 'vidrio de puerta'] },
  { slug: 'manillas', uno: 'Manilla', plural: 'Manillas', fem: true, rx: /manilla/, no: /^$/, sin: ['manilla exterior', 'manilla interior', 'tirador'] },
  { slug: 'homocineticas', uno: 'Homocinética', plural: 'Homocinéticas', fem: true, rx: /homocinetic|semieje|palier/, no: /fuelle|guardapolvo/, sin: ['semieje', 'palier', 'eje de tracción'] },
  { slug: 'frenos', uno: 'Freno', plural: 'Frenos', rx: /caliper|calipe|disco de freno|tambor|bomba de freno|servo ?freno|^servo\b/, no: /^$/, sin: ['caliper', 'disco de freno', 'servofreno', 'bomba de freno'] },
  { slug: 'frontales', uno: 'Frontal', plural: 'Frontales', rx: /^frontal\b|trompa/, no: /^$/, sin: ['trompa', 'frontal completo'] },
  { slug: 'electroventiladores', uno: 'Electroventilador', plural: 'Electroventiladores', rx: /electroventilador|electro ventilador|ventilador de radiador/, no: /^$/, sin: ['ventilador de radiador'] },
  { slug: 'cinturones', uno: 'Cinturón de seguridad', plural: 'Cinturones de seguridad', rx: /cinturon/, no: /^$/, sin: ['cinturón de seguridad'] },
  { slug: 'volantes', uno: 'Volante', plural: 'Volantes', rx: /^volante\b/, no: /volante (de )?motor|inercia/, sin: ['volante de dirección', 'volante con mandos'] },
];

const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esPieza = (t, p) => { const n = sinTildes(p.name); return t.rx.test(n) && !t.no.test(n); };

module.exports = { PIEZAS, sinTildes, esPieza };
