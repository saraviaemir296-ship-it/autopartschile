# SEO_BACKLOG.md — AutopartsChile.cl

Nota de metodología: la demanda real (impresiones/clics/posición) está marcada `FALTA INFORMACIÓN` en todo este documento porque el acceso a GA4/Search Console está bloqueado (ver `SEO_AGENT_LOG.md`, Ciclo 1). La prioridad de abajo usa como proxy provisional la profundidad real de inventario cargado, NO demanda de búsqueda. Debe recalcularse en cuanto haya datos de GSC.

## P0 — CRÍTICO (inventario real alto, ya indexado, sin bloqueo de datos)

**Reclasificado en Ciclo 3** tras descubrir que `products.json` no reflejaba el inventario real de dos páginas (ver `SEO_AGENT_LOG.md` Ciclo 3, "HALLAZGO CRÍTICO").

| Página | Productos reales (HTML real) | En `products.json` | Acción |
|---|---|---|---|
| repuestos-suzuki-celerio-2008.html | 59 | 59 | Laboratorio SEO principal. Candidata a filtros por categoría, FAQ real, enlaces internos a variantes K10B. |
| repuestos-suzuki-dzire-2013.html | 66 (DZ13-001 a 066) | **0** | Ya tiene schema `ItemList` completo en el HTML. Sincronizar con `products.json`/`feed.xml`/Merchant Center — 66 productos invisibles para Shopping. |
| repuestos-suzuki-celerio-k10b-azul.html | 55 (CELAZ-001 a 055) | **2** (solo 054/055) | Sin schema `ItemList` (pendiente, tarea #293). Sincronizar 53 productos faltantes con `products.json`/`feed.xml`/Merchant Center. 53/55 sin foto real todavía (no inventar). |
| repuestos-chevrolet-dmax-25-2015-2020.html | 7 | 7 | Candidata a enriquecimiento si hay más piezas en WhatsApp. |

## P1 — ALTO (inventario real bajo pero páginas ya viven y funcionan)

| Página | Productos reales | Nota |
|---|---|---|
| repuestos-suzuki-alto-800-2014.html | 3 | A/C, Carrocería, Eléctrico |
| repuestos-suzuki-spresso.html | 2 | Motor, Transmisión |
| repuestos-suzuki-celerio-k10b-gris.html | 2 | Eléctrico x2 |
| repuestos-suzuki-alto-800-2016.html | 2 | Carrocería (ALTO800-001 reusado de la página 2014 + ALTO800-004) |

Acción: enriquecer con piezas reales antes de tocar cualquier otra cosa.

## P2 — MEDIO (1 producto real, página viva, sin evidencia de demanda todavía)

repuestos-suzuki-celerio-k10b-amarillo.html, repuestos-suzuki-ciaz.html, repuestos-suzuki-dzire.html, repuestos-suzuki-grand-nomade-20.html, repuestos-suzuki-scross.html, repuestos-suzuki-swift-15-2010.html (schema agregado Ciclo 3), repuestos-suzuki-swift-glx-12-2012-2017.html, repuestos-suzuki-swift-indio.html (schema agregado Ciclo 3), repuestos-suzuki-sx4-hatchback.html (schema agregado Ciclo 3), repuestos-suzuki-alto-800-2022.html

Acción: no tocar contenido hasta tener datos de GSC o más inventario real.

## P2 — GAP DE ARQUITECTURA CONOCIDO (task #196 — investigación cerrada, decisión pendiente de Emir)

- **SW-003** (Computador de motor ECU M13A código NF, Suzuki Swift 1.3 2005-2011, $164.990, foto real ya subida en `img/repuestos/ecu-swift-13-m13a-nf-2005-2011.jpg`) vive en `vehiculos-en-desarme.html` (link genérico), que NO tiene ninguna tarjeta de vehículo para "Suzuki Swift 1.3 M13A 2005-2011" — no está enlazado a la página equivocada, simplemente no existe página ni tarjeta de vehículo para ese auto.
- Se descarta la razón usada en Ciclos 1-3 ("un solo producto no justifica página nueva"): el sitio ya tiene ≥10 páginas de vehículo con un solo producto real (ver sección P2 arriba: Ciaz, S-Cross, Grand Nomade, Swift 1.5 2010, Swift Indio, etc.), así que el conteo de productos no es el criterio real usado en el sitio.
- El criterio real observado: cada página de vehículo existente corresponde a un auto físico que SÍ aparece como tarjeta en `vehiculos-en-desarme.html` (ej. "Suzuki Swift 1.5 Automático 2010" está listado ahí y tiene su página). SW-003 es la única pieza SW-* cuyo vehículo de origen NO aparece como tarjeta en `vehiculos-en-desarme.html`.
- **Dato que falta y que no está en el repo**: si este ECU salió de un Suzuki Swift 1.3 M13A 2005-2011 que sigue físicamente en el patio de desarme (en cuyo caso corresponde crear su tarjeta en `vehiculos-en-desarme.html` + página dedicada, igual que los demás autos), o si fue una pieza suelta que llegó/se compró individualmente sin el resto del vehículo (en cuyo caso crear una "página de vehículo" sería representar un auto que la empresa no tiene, y el link genérico actual es correcto).
- **No se ejecuta ningún cambio este ciclo** (ni página nueva ni edición de `url` en `products.json`/`feed.xml`) hasta que Emir confirme cuál de los dos escenarios es real. Pregunta exacta pendiente de responder: "¿El ECU SW-003 salió de un Swift 1.3 2005-2011 que todavía está en el patio, o fue una pieza suelta?"

## P3 — CERO PRODUCTOS, PERO ARQUITECTURA CORRECTA (no tocar)

Confirmado en Ciclo 3: 17 páginas de vehículo tienen 0 productos pero usan correctamente el patrón estándar del sitio (`.repuestos-empty` con mensaje honesto + CTA WhatsApp) para vehículos recién ingresados sin piezas catalogadas todavía. **No es un bug, no requiere `noindex`, no requiere fix**: repuestos-suzuki-celerio-k10b-rojo.html, repuestos-suzuki-celerio-k10b-beige.html, repuestos-chevrolet-dmax-25-cobriza.html, repuestos-suzuki-ignis-13-2005.html, repuestos-suzuki-celerio-2012.html, repuestos-kia-optima-hibrido.html, repuestos-jeep-grand-cherokee-52-1997.html, repuestos-suzuki-alto-11-2008.html, repuestos-suzuki-mastervan-g13b-1.html, repuestos-suzuki-mastervan-g13b-2.html, repuestos-chevrolet-spark-12-2017.html, repuestos-kia-morning-2016.html, repuestos-suzuki-aerio-16-blanco.html, repuestos-suzuki-aerio-16-2008.html, repuestos-suzuki-swift-14-japones-2015.html, repuestos-suzuki-alto-k10-2012.html, repuestos-suzuki-swift-dzire-2022.html.

Nota histórica: en Ciclo 2 se había recomendado `noindex` temporal para rojo/beige por lectura incompleta. **Esa recomendación se retira en Ciclo 3** tras leer el HTML completo — ver autocrítica en `SEO_AGENT_LOG.md`.

## P4 — NO TOCAR (falta información, no crear)

- **Grand Vitara**: confirmado que `repuestos-suzuki-grand-nomade-20.html` YA es la página comercial equivalente (title/H1/meta dicen explícitamente "(Grand Vitara)"). Búsqueda en repo de más inventario GRANOM/Grand Vitara en Ciclo 3: no se encontró nada adicional a GRANOM-001, ya publicado.
- **Baleno**: `FALTA INFORMACIÓN` — sin inventario detallado todavía.
- Todos los demás modelos sin evidencia de inventario (Vitara, Jimny, APV, Ertiga, Kizashi, Wagon R, Samurai): **no crear página** hasta que exista pieza física y real que vender.

## BLOQUEADOS

1. **GA4 / Search Console** — extensión de Chrome no responde (timeout, no es falta de login).
2. **Eliminar 4 archivos de prueba huérfanos** — herramienta de GitHub conectada no expone `delete_file`.
3. **Grand Vitara / Baleno** — falta detalle de inventario real, no se puede avanzar sin inventar.

## COMPLETADOS (Ciclo 1)

- Auditoría completa de repo, sitemap, robots.txt, estructura de archivos.
- Matriz de 86 productos reales por página y categoría (sin inventar).
- Auditoría de imágenes: 81/81 referenciadas existen físicamente — 0 rotas.

## COMPLETADOS (Ciclo 3)

- Auditoría HTML real de las 34 páginas de vehículo (no solo `products.json`).
- Descubierto y documentado el gap `products.json` vs HTML real (119 productos no sincronizados).
- Schema `Product`/`ItemList` agregado a 3 páginas que tenían producto real sin schema (swift-indio, swift-15-2010, sx4-hatchback).
- Retirada la recomendación incorrecta de `noindex` para Celerio K10B rojo/beige (Ciclo 2).
- Confirmado Grand Nomade = Grand Vitara comercialmente, sin más inventario oculto en el repo.
