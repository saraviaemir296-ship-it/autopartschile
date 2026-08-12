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
- **GA4/GSC**: segundo intento con ruta claramente distinta (navegar a google.com en vez de directo a Search Console) para aislar si el problema era específico de GSC o general de la extensión. **Falló igual (timeout).** Confirmado: es un problema general de conectividad de la extensión de Chrome, no de credenciales ni de la URL específica. Marcado `BLOQUEADO — GSC/GA4` definitivamente, sin más reintentos.
- **SW-003 / ECU / M13A / Swift**: investigado en `data/products.json`. Dato real encontrado: SKU `SW-003`, "Computador de motor (ECU) M13A - código NF", compatible con Suzuki Swift 1.3 M13A 2005-2011, precio real $164.990, foto real (`ecu-swift-13-m13a-nf-2005-2011.jpg`, ya verificada como no-rota en Ciclo 1), actualmente enlazado a `vehiculos-en-desarme.html`. No existe ninguna página dedicada a "Swift 1.3 M13A 2005-2011" en el sitemap.
- **Auditoría profunda de las 4 páginas Celerio K10B por color** (gris, rojo, beige, amarillo) — títulos, H1, meta description y grid de productos real, no solo conteo de `products.json`.

### Problema detectado (NUEVO, real)
- **`repuestos-suzuki-celerio-k10b-rojo.html`**: indexada en sitemap con prioridad 0.8, pero el grid de productos parecía completamente vacío (`<div class="repuestos-grid" id="repuestos-grid"></div>` sin ningún `repuesto-card`). Cero productos reales mostrados.
- **`repuestos-suzuki-celerio-k10b-beige.html`**: mismo caso — página indexada, sin ningún producto, solo mensaje "vehículo recién ingresado".

### Acción realizada
- Ninguna modificación de código este ciclo — el hallazgo requiere decisión del usuario antes de tocar las páginas.

### Próxima prioridad
Confirmar con el usuario si existen piezas reales de Celerio K10B rojo/beige pendientes de publicar. Si no, evaluar `noindex` temporal en esas 2 páginas hasta tener inventario real.

### Bloqueos
- GA4/GSC: confirmado bloqueo de extensión, no reintentar más sin cambio de entorno.
- Eliminar 4 archivos de prueba: sigue sin `delete_file`.
- Grand Vitara/Baleno: sigue `FALTA INFORMACIÓN`.

## Ciclo 3 — 2026-08-12

### Auditado
- **Las 34 páginas de vehículo, leyendo el HTML real de cada una** (no `products.json`), completando la auditoría iniciada en Ciclo 2. Checklist por página: producto/precio/imagen/CTA/SKU/schema/canonical/title/meta/H1/enlaces internos.
- Repo completo en busca de más inventario real de Grand Vitara/Grand Nomade (Prioridad 1 del usuario): no se encontraron SKUs adicionales fuera de GRANOM-001, ya publicado. La página `repuestos-suzuki-grand-nomade-20.html` ya usa explícitamente "(Grand Vitara)" en title/H1/meta — confirma que es la misma unidad comercial, no hace falta página nueva.
- `netlify.toml`: headers de seguridad (X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy, CSP activo sin Report-Only) — ya implementados y con nota de verificación previa sin violaciones de consola.
- `checkout.js`: confirma que Mercado Pago y Webpay Plus están ambos conectados a Supabase Edge Functions reales (`mp-create-preference`, `webpay-create-transaction`), no simulados.

### HALLAZGO CRÍTICO: `data/products.json` no es la fuente de verdad completa del inventario
Al leer el HTML real de cada página (no solo contar entradas de `products.json`), se descubrió que **dos páginas contienen decenas de productos reales con precio/SKU/CTA que nunca se cargaron a `products.json`**:

| Página | Productos reales en HTML | Productos en `products.json` | Gap |
|---|---|---|---|
| `repuestos-suzuki-celerio-k10b-azul.html` | 55 (CELAZ-001 a CELAZ-055) | 2 (solo CELAZ-054/055) | 53 productos invisibles para Merchant Center / feed.xml / cualquier proceso que lea `products.json` |
| `repuestos-suzuki-dzire-2013.html` | 66 (DZ13-001 a DZ13-066) | 0 | 66 productos invisibles |

Esto significa que el inventario real publicado en el sitio es de **~206 productos**, no 86. La matriz de prioridad P0-P4 armada en Ciclo 1 (basada en `products.json`) subestimó gravemente estas dos páginas — deben reclasificarse como P0 (mayor volumen del sitio junto a Celerio 2008).

Implicación operativa: `products.json`, `feed.xml` y Merchant Center probablemente no reflejan ~119 productos reales que sí están visibles y comprables en el sitio. Esto es una pérdida de visibilidad SEO/Shopping real, no solo un problema de documentación.

### Corrección de un hallazgo previo (autocrítica)
En Ciclo 2 registré `repuestos-suzuki-celerio-k10b-rojo.html` y `-beige.html` como posibles páginas "rotas" y sugerí `noindex` temporal. Con el HTML completo ya leído, **esa recomendación era incorrecta**: ambas páginas usan el mismo bloque `.repuestos-empty` (mensaje honesto + CTA WhatsApp) que ya es el patrón estándar y deliberado del sitio para vehículos recién ingresados sin piezas catalogadas todavía — el mismo patrón aparece en otras 13 páginas verificadas este ciclo (Ignis 2005, Celerio 2012, DMAX cobriza, Kia Optima, Jeep Grand Cherokee, Alto 11 2008, Mastervan x2, Spark, Kia Morning, Aerio x2, Swift 1.4 japonés, Alto K10 2012, Swift Dzire 2022). Causa raíz real: **(B) vehículo ingresado, piezas aún no catalogadas/fotografiadas** — no es un bug, no requiere `noindex`, no requiere fix de código. Se retira la recomendación de Ciclo 2.

### Cambios realizados (commits reales en GitHub)
1. `repuestos-suzuki-swift-indio.html` — agregado schema `Product`/`ItemList` faltante para SW-004 (dato 100% real ya visible en la página: nombre, precio $189.990, imagen, SKU).
2. `repuestos-suzuki-swift-15-2010.html` — mismo fix para SW-002 ($189.990).
3. `repuestos-suzuki-sx4-hatchback.html` — mismo fix para SX4-002 ($194.990).
   - Nota de incidente: en el primer intento sobre `swift-indio.html` un `create_or_update_file` se ejecutó con contenido placeholder por error de secuencia de herramientas, dejando la página en blanco por ~4 minutos hasta el commit de corrección inmediato. Verificado con decodificación completa del contenido final — la página quedó correcta. Se documenta por transparencia, no se oculta.

### Pendiente (no ejecutado este ciclo, con causa)
- Schema `Product`/`ItemList` para `repuestos-suzuki-celerio-k10b-azul.html` (55 productos): requiere generar el bloque para 55 ítems sin inventar fotos (53/55 no tienen foto real todavía, solo 2 sí) y reescribir un archivo de 54 KB — se difirió por tamaño/riesgo y porque el usuario reordenó prioridades hacia seguridad/pagos a mitad de ciclo.
- Sincronizar `products.json`/`feed.xml`/Merchant Center con los 119 productos reales no cargados (CELAZ-001/053 + DZ13-001/066) — acción de mayor ROI identificada este ciclo, pendiente de ejecución.

### Evidencia
- `repuestos-suzuki-celerio-k10b-azul.html`: sha `3eb354061894cc43198d1d5956fc28e7f3f5911b`, 55 `data-sku` confirmados por regex sobre el HTML real.
- `repuestos-suzuki-dzire-2013.html`: 66 `data-sku` confirmados (prefijo DZ13-001 a DZ13-066), ya trae su propio `ItemList` schema completo (no necesita fix de schema, solo sync con `products.json`).
- Las 34 páginas de vehículo del sitemap quedaron con auditoría HTML real completa (checklist producto/precio/imagen/CTA/SKU/schema/canonical/title/meta/H1).

### Próxima prioridad
Por instrucción explícita del usuario a mitad de este ciclo, la siguiente prioridad pasa a ser seguridad + pagos + arquitectura, dentro del nuevo alcance "AUTOPARTSCHILE — AUDITORÍA INTEGRAL 360°". Ver `MASTER_SITE_AUDIT.md` y `SITE_IMPROVEMENT_ROADMAP.md`. La sincronización de los 119 productos no cargados a `products.json`/`feed.xml` queda como la tarea SEO de mayor ROI para cuando se retome este hilo.

### Bloqueos (sin cambios)
- GA4/GSC: extensión de Chrome sin responder.
- Eliminar 4 archivos de prueba huérfanos: sin `delete_file` en la herramienta de GitHub conectada.
- Grand Vitara / Baleno: `FALTA INFORMACIÓN` — sin más inventario real encontrado en el repo este ciclo.
