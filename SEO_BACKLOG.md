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

## P2 — GAP DE ARQUITECTURA CONOCIDO

- **SW-003** (ECU Swift M13A código NF, $164.990) vive en `vehiculos-en-desarme.html` sin página de vehículo propia. Un solo producto no justifica página nueva. Sin cambios este ciclo.

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
