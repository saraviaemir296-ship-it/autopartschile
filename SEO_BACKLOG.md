# SEO_BACKLOG.md — AutopartsChile.cl

Nota de metodología: la demanda real (impresiones/clics/posición) está marcada `FALTA INFORMACIÓN` en todo este documento porque el acceso a GA4/Search Console está bloqueado (ver `SEO_AGENT_LOG.md`, Ciclo 1). La prioridad de abajo usa como proxy provisional la profundidad real de inventario cargado (dato verificable en `data/products.json`), NO demanda de búsqueda. Debe recalcularse en cuanto haya datos de GSC.

## P0 — CRÍTICO (inventario real alto, ya indexado, sin bloqueo de datos)

| Página | Productos reales | Categorías | Demanda real | Acción |
|---|---|---|---|---|
| repuestos-suzuki-celerio-2008.html | 59 | Carrocería 14, Motor 10, Suspensión 7, Eléctrico 6, Frenos 4, Puertas 4, A/C 4, Dirección 3, Iluminación 3, Interior 2, Transmisión 2 | FALTA INFORMACIÓN | Laboratorio SEO principal (sección 10 del brief). Candidata a filtros por categoría, FAQ real, enlaces internos a variantes K10B. |
| repuestos-chevrolet-dmax-25-2015-2020.html | 7 | A/C, Carrocería, Iluminación, Refrigeración x2, Transmisión, Vehículo Completo | FALTA INFORMACIÓN | Segunda mayor masa crítica. Candidata a enriquecimiento si hay más piezas en WhatsApp. |

## P1 — ALTO (inventario real bajo pero páginas ya viven y funcionan)

| Página | Productos reales | Nota |
|---|---|---|
| repuestos-suzuki-alto-800-2014.html | 3 | A/C, Carrocería, Eléctrico |
| repuestos-suzuki-spresso.html | 2 | Motor, Transmisión |
| repuestos-suzuki-celerio-k10b-azul.html | 2 | Eléctrico x2 |
| repuestos-suzuki-celerio-k10b-gris.html | 2 | Eléctrico x2 |

Acción: enriquecer con piezas reales antes de tocar cualquier otra cosa — es el mayor ROI disponible sin datos de demanda, porque no requiere crear arquitectura nueva, solo cargar inventario ya fotografiado o pendiente de fotografiar.

## P2 — MEDIO (1 producto real, página viva, sin evidencia de demanda todavía)

repuestos-suzuki-alto-800-2016.html, repuestos-suzuki-celerio-k10b-amarillo.html, repuestos-suzuki-ciaz.html, repuestos-suzuki-dzire.html, repuestos-suzuki-grand-nomade-20.html, repuestos-suzuki-scross.html, repuestos-suzuki-swift-15-2010.html, repuestos-suzuki-swift-glx-12-2012-2017.html, repuestos-suzuki-swift-indio.html, repuestos-suzuki-sx4-hatchback.html

Acción: no tocar contenido hasta tener datos de GSC o más inventario real. No tienen suficiente masa para intervención de arquitectura todavía.

## P2 — GAP DE ARQUITECTURA CONOCIDO

- **SW-003** (ECU Swift M13A código NF, $164.990) vive en `vehiculos-en-desarme.html` sin página de vehículo propia. Decisión pendiente: ¿crear `repuestos-suzuki-swift-13-2005-2011.html` (si hay más piezas de ese vehículo) o dejarlo enlazado a la página general? Requiere que el usuario confirme si hay más inventario de ese Swift 1.3 2005-2011 específico.

## P3 — BAJO / SIN TOCAR

Ninguna página del sitio cae aquí todavía — no hay páginas sin ningún producto real (serían P4).

## P4 — NO TOCAR (falta información, no crear)

- **Grand Vitara**: `FALTA INFORMACIÓN` — usuario confirmó inventario parcial existente, pendiente detalle (pieza/año/precio/foto).
- **Baleno**: `FALTA INFORMACIÓN` — mismo caso.
- Todos los demás modelos listados en el brief original sin evidencia de inventario en 280+ tareas de este proyecto (Vitara, Jimny, APV, Ertiga, Kizashi, Wagon R, Samurai): **no crear página** hasta que exista pieza física y real que vender.

## BLOQUEADOS

1. **GA4 / Search Console** — extensión de Chrome no responde (timeout, no es falta de login). Reintentar próximo ciclo o pedir export manual al usuario.
2. **Eliminar 4 archivos de prueba huérfanos** (`_test_binary_encoding_check.bin`, `_test_encoding.bin`, `_test_encoding_check.txt`, `_test_tiny.jpg`) — herramienta de GitHub conectada no expone `delete_file`. Requiere acción humana o autorización de método alternativo.
3. **Grand Vitara / Baleno** — falta detalle de inventario real, no se puede avanzar sin inventar.

## COMPLETADOS (Ciclo 1)

- Auditoría completa de repo, sitemap, robots.txt, estructura de archivos.
- Matriz de 86 productos reales por página y categoría (sin inventar).
- Auditoría de imágenes: 81/81 referenciadas existen físicamente — 0 rotas.
- Clasificación provisional P0–P4 basada en inventario real (pendiente de recalcular con datos de demanda).
