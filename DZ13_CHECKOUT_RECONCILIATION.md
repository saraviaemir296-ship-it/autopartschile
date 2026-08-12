# DZ13_CHECKOUT_RECONCILIATION.md

**Ciclo 5 — Los 66 productos de `repuestos-suzuki-dzire-2013.html`**

Fecha: 2026-08-12

## Regla aplicada

Por instrucción explícita: **no se insertó ninguno de estos 66 productos en Supabase en este ciclo.** Este documento es exclusivamente diagnóstico, para que la decisión de insertar (o no) cada producto la tome un humano con la información real del taller (¿la pieza sigue físicamente disponible?).

## Qué se verificó y qué se encontró

1. **Existencia en Supabase**: ninguno de los 66 SKU `DZ13-001`–`DZ13-066` existe en la tabla `public.products`. Resultado: el botón "Pagar ahora" de cada uno de estos 66 productos, si se presiona, fallará en el backend de Webpay/Mercado Pago (ambos buscan el precio por `sku` en Supabase; si no existe la fila, la transacción no puede crearse). **Checkout roto al 100% para este vehículo.**
2. **Imágenes**: la página `repuestos-suzuki-dzire-2013.html` tiene **una sola fotografía** en todo el documento — la foto general del vehículo completo (`suzuki-swift-dzire-2013-completo.jpg`). Ninguno de los 66 repuestos individuales tiene foto propia. No hay evidencia visual de que cada pieza enumerada haya sido efectivamente desmontada, inspeccionada o fotografiada.
3. **Texto de vigencia en la página**: el sitio declara "Motor K12M 1.2 · Compatible 2012-2017 · **Recién ingresado a desarme**". Es una afirmación real, visible en el sitio en producción — pero no tiene fecha asociada y no es verificable de forma independiente (no hay registro de cuándo se escribió ni de cuándo se completó el desarme del vehículo).
4. **Fuente de los 66 precios**: los precios visibles en HTML no tienen ningún respaldo en Supabase, products.json ni feed.xml — existen únicamente como texto estático en este archivo HTML. No hay una segunda fuente independiente con la que contrastarlos.
5. **Sin registro de stock**: no existe ninguna fila de inventario (Supabase ni ninguna otra) que confirme cantidad disponible de cada pieza. No se puede descartar que algunas ya se hayan vendido por WhatsApp/mesón y no se haya actualizado la página.

## Conclusión

**Los 66 productos quedan marcados `REQUIERE CONFIRMACIÓN HUMANA` sin excepción.** No existe evidencia suficiente para insertar ninguno de ellos en Supabase de forma automática: la única señal de vigencia es un texto sin fecha en la página, no hay fotos individuales, y no hay ningún registro de stock independiente del HTML mismo. Antes de habilitar el cobro real de cualquiera de estas 66 piezas, Emir debe confirmar físicamente cuáles siguen disponibles.

## Tabla completa — 66 productos

| SKU | Nombre | Precio visible (HTML) | Precio en otra fuente | Existe en Supabase | Imagen propia | Evidencia de vigencia | Estado |
|---|---|---|---|---|---|---|---|
| DZ13-001 | Capot | $117990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-002 | Parachoque delantero completo | $70000 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-003 | Parachoque trasero completo | $79990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-004 | Parrilla delantera | $28990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-005 | Guardabarros izquierdo | $22990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-006 | Guardabarros derecho | $22990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-007 | Tapabarros de lata | $54990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-008 | Puertas delanteras completas | $174990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-009 | Puertas traseras completas | $139990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-010 | Maletero | $139990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-011 | Espejos completos | $59990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-012 | Tapa combustible | $14990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-013 | Refuerzo parachoque delantero original | $74990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-014 | Frontal superior | $64990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-015 | Laterales frontal izquierdo y derecho | $32990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-016 | Focos delanteros | $68990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-017 | Focos traseros | $44990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-018 | Luneta trasera | $44990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-019 | Triangulos plasticos | $17990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-020 | Tablero (sin airbags) | $129990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-021 | Radio | $21990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-022 | Control calefaccion | $54990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-023 | Airbag volante | $124990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-024 | Airbag copiloto | $124990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-025 | Volante | $49990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-026 | Consola central | $23990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-027 | Palanca cambios completa | $34990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-028 | Freno de mano | $32990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-029 | Juego pedales | $74990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-030 | Cinturones delanteros ambos | $62990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-031 | Asientos delanteros ambos | $104990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-032 | Asiento trasero | $49990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-033 | Parasoles | $32990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-034 | Tapiz techo | $49990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-035 | Motor completo | $1079990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-036 | Multiple admision + cuerpo aceleracion | $124990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-037 | Alternador | $74990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-038 | Motor partida | $79990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-039 | Compresor A/C | $139990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-040 | Bomba direccion hidraulica | $119990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-041 | ECU + inmovilizador | $164990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-042 | Ramal motor | $134990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-043 | Catalizador original | $64990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-044 | Caja cambios | $594990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-045 | Homocineticas completas | $104990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-046 | Piolas selectoras | $74990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-047 | Soportes caja | $34990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-048 | Soporte motor | $34990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-049 | Amortiguadores delanteros ambos | $82990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-050 | Amortiguadores traseros ambos | $74990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-051 | Munones completos con masa | $76990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-052 | Bandejas suspension | $17990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-053 | Cremallera direccion | $119990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-054 | Barra estabilizadora | $29990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-055 | Eje trasero completo | $204990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-056 | Bomba freno | $47990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-057 | Servo freno | $44990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-058 | BCM | $119990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-059 | Fusilera exterior | $42990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-060 | Motor limpiaparabrisas delantero | $42990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-061 | Telecomando | $59990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-062 | Condensador | $79990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-063 | Evaporador | $67990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-064 | Electroventilador | $84990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-065 | Radiador calefaccion | $84990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |
| DZ13-066 | Resonador + silenciador completo | $49990 | Ninguna (no está en products.json/feed.xml/Supabase) | No | No (solo foto general del vehículo) | Texto sin fecha ("recién ingresado a desarme") | REQUIERE CONFIRMACIÓN HUMANA |

## Siguiente paso recomendado

Antes de insertar cualquiera de estos 66 SKU en Supabase: Emir confirma en persona/WhatsApp cuáles piezas siguen físicamente disponibles, toma al menos una foto real por pieza confirmada (no imagen genérica), y solo entonces se sincroniza esa pieza siguiendo el mismo proceso de las 8 condiciones aplicado a los CELAZ (real, en Supabase, precio válido, stock válido, SKU único, sin discrepancia, sin duplicado, publicado). No se debe insertar el lote completo de una sola vez sin esta verificación pieza por pieza, dado el vacío total de evidencia fotográfica y de stock independiente.
