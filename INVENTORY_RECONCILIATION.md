# INVENTORY_RECONCILIATION.md — AutopartsChile.cl

Creado 2026-08-12. Responde a la Prioridad 1-4 del usuario: reconciliar HTML real ↔ `data/products.json` ↔ Supabase (`products`, 242 filas) antes de sincronizar nada, y determinar la arquitectura real de origen de un producto.

## 1. ¿Dónde nace realmente un producto? (Prioridad 2)

Evidencia directa de este ciclo (no se infiere, se verificó con `execute_sql` sobre Supabase y con el contenido real de `data/products.json`):

- **`data/products.json` (86 items) fue generado DESDE Supabase**, no al revés. Evidencia: los 3 precios que corregí este ciclo en HTML (SW-002, SW-004, SX4-002 — ver sección 3) **ya estaban correctos en `products.json`** con los mismos valores que Supabase ($159.990 / $229.990 / $224.990), mientras que el HTML tenía valores viejos ($189.990 / $189.990 / $194.990). Si `products.json` se hubiera generado leyendo el HTML, tendría los precios viejos también. Esto confirma la tarea histórica #104 ("Generar products.json desde Supabase").
- **El HTML de cada página de vehículo se edita manualmente** (vía commits directos a GitHub), sin ningún pipeline automático que lo mantenga sincronizado con Supabase. Cuando alguien corrige un precio en Supabase (como pasó con SW-002/004/SX4-002, y también con la tarea histórica #38 "Corregir precios reales de 33 repuestos Celerio, estaban mal"), el HTML no se actualiza solo.
- **Conclusión de arquitectura real (no la deseada, la que existe hoy):**

```
Supabase (products) ──(manual, vía script/tarea)──> data/products.json ──(no verificado este ciclo)──> feed.xml → Merchant Center
        │
        └──(manual, vía commits HTML directos, SIN relación con products.json)──> páginas de vehículo (HTML)
```

Hay dos ramas independientes que parten de Supabase y no se comunican entre sí. El checkout (`webpay-create-transaction`, `mp-create-preference`) lee el precio de Supabase directamente por SKU — el HTML nunca es la fuente de precio real en el pago, solo lo que el cliente ve antes de pagar.

## 2. Fuente de verdad recomendada (Prioridad 4)

**Supabase `public.products` es la fuente de verdad correcta y ya funciona así de facto** para precio de cobro y para `products.json`. No es una decisión nueva — es reconocer lo que ya está pasando y cerrar la brecha que falta: el HTML no está en el mismo pipeline. Las tablas alternativas del esquema (`vehicles`, `product_compatibility`, `inventory`, `pricing_rules`) están vacías (0 filas) — no son candidatas reales hoy.

Recomendación (no ejecutada este ciclo, requiere automatización adicional): el HTML de cada página debería generarse desde Supabase igual que `products.json`, no editarse a mano. Mientras eso no exista, cualquier producto nuevo debe entrar primero a Supabase, y de ahí propagarse a HTML + products.json + feed.xml — nunca al revés (eso es exactamente lo que causó que DZ13 no tenga backend real, ver sección 4).

## 3. PRICE_MISMATCH detectados y corregidos este ciclo

Al cruzar precio-en-HTML vs precio-en-Supabase para las 3 páginas donde agregué schema en el ciclo anterior, encontré que los 3 precios que yo mismo había propagado al schema `Product` eran incorrectos, porque copié el precio visible en el HTML, que ya estaba desactualizado respecto a Supabase:

| SKU | Página | Precio en HTML (antes) | Precio real Supabase | Precio cobrado en checkout | Estado |
|---|---|---|---|---|---|
| SW-002 | swift-15-2010.html | $189.990 | $159.990 | $159.990 (server ignora el HTML) | Corregido este ciclo |
| SW-004 | swift-indio.html | $189.990 | $229.990 | $229.990 | Corregido este ciclo — antes de este fix, un cliente veía $189.990 y era cobrado $229.990: riesgo real de reclamo bajo Ley 19.496 (precio anunciado ≠ precio cobrado) |
| SX4-002 | sx4-hatchback.html | $194.990 | $224.990 | $224.990 | Corregido este ciclo — mismo riesgo que SW-004 |

Verificación: `products.json` ya tenía los 3 precios correctos de forma independiente, lo que confirma que el valor correcto es el de Supabase — no invento un precio, solo alineé HTML a lo que ya cobra el sistema. Commits: `de5cb88` (SW-002), `96f2584` (SX4-002), `e446cb0` (SW-004).

**Implicación**: el motor de pago SIEMPRE usa el precio de Supabase, nunca el del HTML (confirmado en `PAYMENT_SECURITY_AUDIT.md`). Ningún cliente pudo pagar de menos, pero sí pudieron pagar más de lo anunciado en 2 de los 3 casos hasta este fix. No tengo forma de saber cuántas transacciones reales ocurrieron con el precio desalineado — recomiendo revisar `orders`/`order_items` para esos 2 SKU si necesitas evaluar reclamos pasados.

## 4. Reconciliación HTML ↔ products.json ↔ Supabase

### 4.1 CELAZ-001 a 055 (Celerio K10B azul)

HTML: 55/55. Supabase: 55/55 (spot-check exacto de 10 filas). `products.json`: solo 2/55 (CELAZ-054/055).

**Clasificación: MISSING_JSON x53.** No es MISSING_DB — el producto SÍ existe en la fuente de verdad, solo falta el paso products.json→feed→Merchant Center. Fix más seguro y de mayor ROI inmediato: no requiere inventar nada, ni tocar HTML, ni tocar Supabase — solo regenerar products.json/feed.xml desde Supabase.

### 4.2 DZ13-001 a 066 (Dzire 2013)

HTML: 66/66, con schema `ItemList` completo. Supabase: **0/66** — ningún SKU `DZ13-*` existe en la tabla. `products.json`: 0/66.

**Clasificación: MISSING_DB, más grave que el caso CELAZ.** El botón "Pagar ahora" en estas 66 tarjetas está roto: `webpay-create-transaction`/`mp-create-preference` buscan el SKU en `products` por servidor, no lo encuentran, y devuelven error (confirmado leyendo el código). Un cliente que intente pagar online cualquiera de los 66 productos Dzire 2013 hoy recibe un error de pago, aunque "Consultar por WhatsApp" sí funciona. **Este es el hallazgo de mayor severidad del ciclo: no es visibilidad SEO, es checkout roto en 66 productos ya publicados y promocionados como comprables online.**

No inserto estos 66 productos en Supabase este ciclo porque implica dar capacidad real de cobro a datos que solo existen en HTML y nunca pasaron por el flujo real de alta de producto — necesito que confirmes que siguen siendo inventario vigente antes de eso.

### 4.3 Otras páginas ya auditadas (Celerio 2008, DMAX, Alto 800-2014/2016)

Coincidencia completa HTML=JSON confirmada en ciclos anteriores, no repetido aquí.

### 4.4 feed.xml

No se pudo re-leer completo este ciclo (~80 KB excede el límite de la herramienta de lectura de GitHub conectada, y no hay acceso a raw.githubusercontent.com desde este entorno — bloqueado por el proxy de red del sandbox). Como feed.xml se genera desde products.json (tarea histórica #97), es razonable asumir que hereda el mismo gap, pero queda como **PENDIENTE DE VERIFICACIÓN DIRECTA**, no como hecho confirmado.

## 5. Inventario real desconectado — ningún HTML lo muestra (hallazgo nuevo)

Al leer la tabla `products` completa de Supabase (242 filas) y cruzarla contra las 34 páginas de vehículo ya auditadas, encontré SKUs activos, con precio y stock reales, que no aparecen en NINGUNA página del sitio — ni siquiera en el patrón `.repuestos-empty` (la página dice "0 piezas" cuando Supabase tiene piezas reales sin publicar):

| SKU | Nombre (Supabase) | Precio aprox. | Página esperada | Estado actual de esa página |
|---|---|---|---|---|
| CEL12-001 a CEL12-033 (33 SKUs) | Piezas varias Celerio 2012 | Variable, ver Supabase | repuestos-suzuki-celerio-2012.html | Dice "0 productos, recién ingresado" — falso, hay 33 productos reales sin publicar |
| DZ-001 | Caja de cambios embrague hidráulico | $409.999 | repuestos-suzuki-dzire.html | Tarea histórica #221 pendiente |
| DZ-002 | Culata completa | $349.990 | repuestos-suzuki-dzire.html | Misma tarea #221 |
| ALT11-001 | Motor sin culata | $299.990 | repuestos-suzuki-alto-11-2008.html | Dice "0 productos" — falso |
| ALT22-001 | Caja de cambios mecánica | $309.990 | repuestos-suzuki-alto-800-2022.html | Solo muestra ALTO800-001 (reusado de 2014) |
| MOT-JGC-001 | Motor V8 5.2 completo | ~$849.990 (verificar en Supabase) | repuestos-jeep-grand-cherokee-52-1997.html | Dice "0 productos" — falso, mayor valor de todo el catálogo |
| MOT-MSV-001 | Motor completo G13B 1.3 | ~$544.990 | repuestos-suzuki-mastervan-g13b-1.html | Dice "0 productos" — falso |
| MOT-SW15-001 | Motor completo M15A 1.5 | ~$749.990 | repuestos-suzuki-swift-15-2010.html | Solo muestra SW-002 (ECU) |
| TRA-SW15-001 | Caja automática con convertidor | ~$419.990 | repuestos-suzuki-swift-15-2010.html | Mismo gap |
| SCR-001 | Focos delanteros LED | $244.990 | repuestos-suzuki-scross.html | Solo muestra SCROSS-001 |
| SCR-002 | Llanta de aleación aro 16 | $54.990 | repuestos-suzuki-scross.html | Mismo gap |
| SW-001 | Portalón | $169.990 | Ambigua entre 3 páginas Swift | No publicado |
| SX4-001 | Cuna de motor | $119.990 | repuestos-suzuki-sx4-hatchback.html | Solo muestra SX4-002 |
| CEL10-001 | Mangueras de agua | $14.990 | Ambigua (¿2008, 2012, K10B?) | No publicado |
| CELK10-001 | Sinóptico | $74.990 | Ambigua entre 5 páginas K10B | No publicado |
| MOT-ALT-F8D | (nombre/precio no re-confirmados esta pasada) | — | Alto, motor F8D | Requiere re-consulta antes de publicar |
| MOT-J20A-001 | (nombre/precio no re-confirmados esta pasada) | — | Posible Grand Nomade/Vitara | Requiere re-consulta antes de publicar |

**Esto es, en valor potencial, más grande que el gap CELAZ+DZ13 combinado** — varios son motores/cajas completas de alto valor ($300.000–$850.000). Antes de publicar cualquiera: (1) confirmar que sigue siendo inventario físico vigente, (2) confirmar que el precio no quedó desactualizado como pasó con SW-002/004/SX4-002, (3) verificar si hay foto real (si no, usar `rcard-photo-pending`, nunca imagen inventada). No publiqué nada de esta lista — es un hallazgo para decidir prioridad, no una ejecución.

## 6. Clasificación resumen

| Categoría | Cantidad | Acción recomendada |
|---|---|---|
| MATCH (HTML=JSON=Supabase) | Celerio 2008 (59), DMAX x2, Alto 800 2014/2016, resto de páginas ya auditadas | Ninguna |
| MISSING_JSON | CELAZ x53 | Regenerar products.json/feed.xml desde Supabase |
| MISSING_DB (checkout roto) | DZ13 x66 | Insertar en Supabase con validación fila por fila antes de confiar en el botón de pago |
| PRICE_MISMATCH | SW-002, SW-004, SX4-002 | Corregido este ciclo |
| Inventario real sin publicar en ninguna página | ≥16 SKUs confirmados (CEL12 x33 + 15 individuales) | Confirmar vigencia con Emir antes de publicar (productos de alto valor) |
| UNKNOWN (página ambigua) | SW-001, CEL10-001, CELK10-001 | Confirmar con Emir la página correcta |
