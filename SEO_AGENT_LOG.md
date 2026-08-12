# SEO_AGENT_LOG.md — AutopartsChile.cl

## Ciclo 1 — 2026-08-12

### Auditado
- Repositorio completo (GitHub `saraviaemir296-ship-it/autopartschile`, branch `main`): sitemap.xml (44 URLs), robots.txt, estructura de archivos raíz, `data/products.json` (86 productos), `data/vehiculos.json`.
- 34 páginas de vehículo confirmadas indexadas en sitemap.
- Cruce de imágenes: 81 imágenes únicas referenciadas en `products.json` vs 112 archivos físicos en `img/repuestos/`. **Resultado: 0 imágenes rotas.**

### Problema detectado
1. 4 archivos de prueba huérfanos en raíz del repo.
2. SW-003 (ECU Swift M13A) sin página propia.
3. 32/34 páginas de vehículo con 1-3 productos.
4. GA4/GSC bloqueado por extensión de Chrome sin responder.

### Bloqueos
- GA4/GSC, eliminar 4 archivos de prueba, Grand Vitara/Baleno (falta info).

---

## Ciclo 2 — 2026-08-12

### Auditado
- **GA4/GSC**: segundo intento, falló igual (timeout). Confirmado: problema general de conectividad de la extensión, no de credenciales. Marcado `BLOQUEADO` definitivamente.
- **SW-003 / ECU / M13A / Swift**: dato real encontrado en `products.json`, sin página dedicada.
- **Auditoría profunda de las 4 páginas Celerio K10B por color** (gris, rojo, beige, amarillo).

### Problema detectado (NUEVO, real)
- `repuestos-suzuki-celerio-k10b-rojo.html` y `-beige.html`: grid de productos parecía vacío.

### Próxima prioridad
Confirmar con el usuario si existen piezas reales pendientes de publicar.

### Bloqueos
- GA4/GSC, eliminar 4 archivos de prueba, Grand Vitara/Baleno.

## Ciclo 3 — 2026-08-12

### Auditado
- **Las 34 páginas de vehículo, leyendo el HTML real de cada una** (no `products.json`).
- Repo completo en busca de más inventario real de Grand Vitara/Grand Nomade: no se encontraron SKUs adicionales fuera de GRANOM-001.
- `netlify.toml` y `checkout.js` confirmados.

### HALLAZGO CRÍTICO: `data/products.json` no es la fuente de verdad completa del inventario
| Página | Productos reales en HTML | Productos en `products.json` | Gap |
|---|---|---|---|
| `repuestos-suzuki-celerio-k10b-azul.html` | 55 (CELAZ-001 a CELAZ-055) | 2 (solo CELAZ-054/055) | 53 productos invisibles |
| `repuestos-suzuki-dzire-2013.html` | 66 (DZ13-001 a DZ13-066) | 0 | 66 productos invisibles |

### Corrección de un hallazgo previo (autocrítica)
Se retira la recomendación de Ciclo 2 de `noindex` para rojo/beige — ambas páginas usan correctamente el patrón `.repuestos-empty`, no es un bug.

### Cambios realizados (commits reales en GitHub)
1-3. Schema `Product`/`ItemList` agregado a swift-indio (SW-004), swift-15-2010 (SW-002), sx4-hatchback (SX4-002), con nota de incidente de placeholder accidental (corregido en el momento, documentado por transparencia).

### Próxima prioridad
Seguridad + pagos + arquitectura (nuevo alcance del usuario). Ver Ciclo 4.

### Bloqueos (sin cambios)
- GA4/GSC, eliminar 4 archivos, Grand Vitara/Baleno.

## Ciclo 4 — 2026-08-12 (Auditoría directa de Supabase + corrección de precios)

### Auditado
- Tabla completa `public.products` de Supabase (242 filas) vía `execute_sql`, cruzada contra las 34 páginas de vehículo ya auditadas con HTML real.
- Precio real de Supabase vs. precio mostrado en HTML para los 3 SKU donde se agregó schema en Ciclo 3.

### HALLAZGO: los 3 schemas agregados en Ciclo 3 tenían precio incorrecto
El precio que se propagó al `Product` schema en Ciclo 3 se copió del HTML visible, que ya estaba desactualizado respecto a Supabase (la fuente real de cobro). `data/products.json` ya tenía el precio correcto de forma independiente, lo que confirma cuál era el valor real:

| SKU | Precio HTML (Ciclo 3) | Precio real Supabase | Estado |
|---|---|---|---|
| SW-002 | $189.990 | $159.990 | Corregido este ciclo |
| SW-004 | $189.990 | $229.990 | Corregido este ciclo — el cliente veía menos de lo que se le cobraba |
| SX4-002 | $194.990 | $224.990 | Corregido este ciclo — mismo caso |

### HALLAZGO: inventario real desconectado (ningún HTML lo muestra)
Al menos 16 SKU activos en Supabase con precio y stock reales no aparecen en ninguna página del sitio, incluyendo 33 piezas de Celerio 2012 (la página dice "0 productos" cuando en realidad hay 33) y varios motores/cajas de cambio completos de alto valor ($300.000-$850.000). Detalle completo en `INVENTORY_RECONCILIATION.md` sección 5 — no se publicó nada de esta lista, requiere confirmación de vigencia primero.

### HALLAZGO: DZ13 (66 productos Dzire 2013) no existen en Supabase
Más grave que un problema de sincronización de JSON: el botón "Pagar ahora" de estos 66 productos falla porque el SKU no existe en la base de datos que consulta el checkout. Detalle en `INVENTORY_RECONCILIATION.md` sección 4.2 y `PAYMENT_SECURITY_AUDIT.md`.

### Cambios realizados (commits reales en GitHub)
1. `repuestos-suzuki-swift-15-2010.html` — precio corregido a $159.990 (commit `de5cb88`).
2. `repuestos-suzuki-sx4-hatchback.html` — precio corregido a $224.990 (commit `96f2584`).
3. `repuestos-suzuki-swift-indio.html` — precio corregido a $229.990 (commit `e446cb0`).
4. Creado `INVENTORY_RECONCILIATION.md` y `PAYMENT_SECURITY_AUDIT.md`.
5. `MASTER_SITE_AUDIT.md` y `SITE_IMPROVEMENT_ROADMAP.md` actualizados con Ciclo 2 de hallazgos de Supabase.

### Pendiente (no ejecutado este ciclo, con causa)
- Sincronizar `products.json`/`feed.xml` con los 53 CELAZ faltantes (seguro, no requiere confirmación adicional).
- Confirmar con Emir vigencia del inventario desconectado antes de publicar (productos de alto valor, requiere decisión humana).
- Confirmar estado real de `WEBPAY_ENV` en el panel de Supabase (no legible por código).
- Decidir sobre RLS de `oportunidades` y sobre lógica de descuento de stock al confirmar pago.

### Bloqueos (sin cambios)
- GA4/GSC, eliminar 4 archivos de prueba, Grand Vitara/Baleno, lectura completa de `feed.xml` (tamaño de archivo + bloqueo de red a raw.githubusercontent.com desde el sandbox).
