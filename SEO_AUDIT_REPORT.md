# AUDITORÍA SEO — AUTOPARTSCHILE.CL

**Fecha:** 12 de agosto de 2026
**Fuente de datos:** Google Search Console (propiedad `https://autopartschile.cl/`, sesión real del usuario vía Claude in Chrome, modo solo lectura), repositorio GitHub `saraviaemir296-ship-it/autopartschile` (rama `main`), sitio en producción (`autopartschile.cl`), `PRICE_STOCK_RECONCILIATION.md` y `DZ13_CHECKOUT_RECONCILIATION.md` (ya publicados).
**Regla aplicada:** cero datos inventados. Todo número de este informe proviene de una captura de pantalla de GSC, una respuesta cruda de la API de GitHub, o un fetch en vivo del sitio. Donde no hay dato, se declara explícitamente en vez de estimar.

---

## 0. Qué cubre este informe y qué no

El prompt maestro de 21 secciones pide una auditoría casi total (arquitectura, backlinks, competencia, entidades semánticas, contenido educativo, etc.). Con los datos realmente disponibles esta sesión, este informe cubre con evidencia sólida:

- Rendimiento completo de Search Console (consultas, páginas, países, dispositivos, indexación, sitemap, Core Web Vitals).
- Un hallazgo técnico crítico de canonicalización, verificado en el código fuente real (no inferido).
- Cruce demanda real (GSC) vs. inventario real (sitio en vivo) en las páginas de mayor tráfico.
- Priorización de oportunidades con la fórmula pedida.

**No cubre** (por falta de fuente confiable, no por omisión): backlinks externos (no hay herramienta de backlinks conectada — Search Console no reporta enlaces entrantes de terceros de forma completa), análisis de competencia (no autoricé scraping de sitios de terceros sin pedirlo), y una auditoría exhaustiva de datos estructurados página por página (ya se trabajó parcialmente en tareas #168/#169/#291 de ciclos anteriores; no se re-auditó cada una de las 46 páginas en esta pasada). Estas quedan como pendientes explícitos, no como "hallazgos sin datos".

---

## 1. Resumen ejecutivo

El sitio tiene **muy poco tráfico orgánico y muy poca antigüedad de datos real en GSC**: pese a pedir "12 meses", la propiedad solo tiene señal desde el **20/6/2026** (~7 semanas), con **138 clics y 2.910 impresiones totales, CTR 4,7%, posición media 7,3**. Esto no es un error de configuración — es simplemente el tamaño real del sitio hasta ahora.

El hallazgo más importante de esta auditoría no es de contenido ni de keywords: es un **conflicto de canonicalización que está bloqueando la indexación de al menos 13 de 51 páginas rastreadas (25%)**, confirmado en el código fuente real, no en teoría. Corregirlo es barato (cambio de metadato, sin tocar precios, checkout ni Supabase) y el impacto esperado es directo sobre visibilidad orgánica.

El segundo hallazgo es que **la demanda real ya está llegando a páginas sin inventario suficiente** (ej. KIA Optima Híbrido: 17 impresiones, 1 clic, cero productos publicados), mientras otras páginas con inventario real y con foto no están rankeando en primera página (ej. Alto 800 2014: 75 impresiones, 0 clics, posición 14,8, con 3 productos reales y foto).

Confirmo también, como excepciones de integridad heredadas del ciclo anterior, que **no se tocó** SCR-001/SCROSS-001 ni los 66 productos DZ13 — siguen exactamente como estaban.

---

## 2. Excepciones de integridad heredadas (no tocadas en este ciclo)

| Ítem | Estado | Motivo |
|---|---|---|
| SCR-001 vs SCROSS-001 | Sin resolver — REQUIERE CONFIRMACIÓN HUMANA | Nombres/precios distintos para el mismo vehículo (S-Cross); pendiente que Emir confirme si son la misma pieza o dos piezas distintas |
| 66 productos DZ13 (`repuestos-suzuki-dzire-2013.html`) | Sin resolver — REQUIERE CONFIRMACIÓN HUMANA (documentado en `DZ13_CHECKOUT_RECONCILIATION.md`) | Sin evidencia de vigencia independiente (stock, fotos individuales, fecha) |
| `products.json` (139 ítems) | Hash verificado intacto | No se modificó en este ciclo |

Estos tres puntos **no bloquearon** el resto de la auditoría, tal como se indicó.

---

## 3. Datos de Google Search Console

### 3.1 Totales del período disponible (20/6/2026 – 8/8/2026)

| Métrica | Valor |
|---|---|
| Clics totales | 138 |
| Impresiones totales | 2.910 |
| CTR medio | 4,7% |
| Posición media | 7,3 |

**Advertencia honesta:** el selector de fecha estaba en "12 meses" pero el gráfico y la tabla no se movieron de esa ventana de ~7 semanas por más atrás que se buscara. Esto significa que la propiedad de Search Console fue verificada/empezó a recibir datos recién a fines de junio de 2026 — no hay 12 meses de historia real que analizar. Cualquier cifra "anual" que se hubiera reportado habría sido inventada; por eso se reporta la ventana real.

### 3.2 Consultas principales (muestra representativa, ordenadas por impresiones)

Sin repetir cada fila capturada, los patrones relevantes:
- El volumen de búsqueda es bajo y muy long-tail (marca+modelo+repuesto), consistente con un negocio local de nicho.
- "repuestos kia optima" aparece con impresiones reales pero la página de destino no tiene productos (ver sección 5).
- "desarmaduria lo blanco chevrolet" — 74 impresiones, posición 1,9, **0 clics**. Esto es anómalo: la página rankea prácticamente primera pero nadie hace clic. Hipótesis con evidencia parcial: es una búsqueda de marca/dirección (alguien que ya sabe el nombre y busca la ubicación), no necesariamente una búsqueda de producto — el snippet quizás no confirma lo que el usuario esperaba ver (ej. no menciona "Chevrolet" en el título si la marca principal del negocio es Suzuki). Requiere revisión del title/meta-description de la página que está rankeando para esa consulta antes de tocar nada.

### 3.3 Páginas principales (top ~30 de 51, por impresiones)

| Página | Clics | Impr. | CTR | Pos. |
|---|---|---|---|---|
| Homepage (/) | 107 | 2.347 | 4,6% | 6,3 |
| /sucursales.html | 0 | 195 | 0% | 7,8 |
| /como-comprar.html | 0 | 113 | 0% | 7,6 |
| /vehiculos-en-desarme.html | 4 | 97 | 4,1% | 8,6 |
| /vehiculos-en-desarme (sin .html) | 1 | 89 | 1,1% | 7,9 |
| /repuestos-suzuki-celerio-2008.html | 11 | 76 | 14,5% | ~6,3 |
| /repuestos-suzuki-alto-800-2014.html | 0 | 75 | 0% | 14,8 |
| /opiniones.html | 4 | 51 | 7,8% | 8,4 |
| /sucursales (sin .html) | 0 | 51 | 0% | 8,9 |
| /faq (sin .html) | 0 | 45 | 0% | 7,2 |
| /repuestos-chevrolet-dmax-25-2015-2020.html | 1 | 22 | 4,5% | 10,6 |
| /repuestos-suzuki-swift-indio.html | 0 | 20 | 0% | 18,3 |
| /envios.html | 0 | 19 | 0% | 9,2 |
| /repuestos-kia-optima-hibrido.html | 1 | 17 | 5,9% | 10,5 |
| /como-comprar (sin .html) | 0 | 17 | 0% | 8,9 |
| /repuestos-suzuki-celerio-2008 (sin .html) | 0 | 17 | 0% | 14,5 |
| /repuestos-suzuki-alto-800-2014 (sin .html) | 0 | 17 | 0% | 23,9 |
| /repuestos-suzuki-dzire-2013.html | 0 | 14 | 0% | 6,6 |
| /catalogo.html | 0 | 13 | 0% | 26,5 |
| /faq.html | 1 | 12 | 8,3% | 7,0 |
| /repuestos-suzuki-scross.html | 1 | 12 | 8,3% | 8,4 |
| /metodos-de-pago (sin .html) | 0 | 11 | 0% | 6,5 |
| /metodos-de-pago.html | 2 | 10 | 20% | 3,8 |

**Patrón evidente sin necesidad de interpretación:** cada página real del sitio aparece **dos veces** en esta tabla — una vez con `.html` y otra sin — dividiendo impresiones, clics y señal de autoridad entre dos URLs distintas para el mismo contenido. Ejemplos confirmados: `vehiculos-en-desarme`, `sucursales`, `como-comprar`, `faq`, `metodos-de-pago`, `repuestos-suzuki-celerio-2008`, `repuestos-suzuki-alto-800-2014`. Esto se explica técnicamente en la sección 4.

### 3.4 Países

| País | Clics | Impr. | CTR | Pos. |
|---|---|---|---|---|
| Chile | 133 | 2.806 | 4,7% | 7,2 |
| Estados Unidos | 0 | 32 | 0% | 10,2 |
| Paraguay | 0 | 9 | 0% | 7,9 |
| Colombia | 0 | 8 | 0% | 6,4 |
| Perú | 1 | 7 | 14,3% | 2,6 |
| Brasil | 2 | 5 | 40% | 2,0 |
| Uruguay | 1 | 3 | 33,3% | 6,7 |
| Taiwán | 1 | 1 | 100% | 1,0 |

Sin sorpresas: 96,4% de las impresiones son de Chile, coherente con un negocio local de venta física + envíos nacionales. El tráfico internacional es ruido estadístico (menos de 60 impresiones en total), no una oportunidad real — no recomiendo ninguna acción de "SEO internacional".

### 3.5 Dispositivos

| Dispositivo | Clics | Impr. | CTR | Pos. |
|---|---|---|---|---|
| Móviles | 100 | 2.356 | 4,2% | 5,7 |
| Ordenador | 38 | 548 | 6,9% | 14,2 |

Dato accionable real: en escritorio el sitio rankea en promedio **posición 14,2** (página 2), mientras en móvil rankea posición 5,7. Puede deberse a que Google tiene más señales de uso móvil (el negocio es local/WhatsApp-first) o a que el rendimiento de carga en desktop es peor — no tengo datos de Core Web Vitals para confirmar la causa (ver 3.7).

### 3.6 Indexación de páginas

| Estado | Páginas |
|---|---|
| Indexadas | 45 |
| Sin indexar | 16 |

Desglose de las 16 no indexadas, por motivo:

| Motivo | Fuente | Páginas |
|---|---|---|
| Página alternativa con etiqueta canónica adecuada | Sitio web | **13** |
| Se ha bloqueado debido a que el acceso no está permitido (403) | Sitio web | 1 |
| Descubierta: actualmente sin indexar | Sistemas de Google | 1 |
| Rastreada: actualmente sin indexar | Sistemas de Google | 1 |

El 81% de las páginas no indexadas (13 de 16) caen en un solo motivo, y es el mismo patrón detectado en la tabla de rendimiento: URLs sin `.html` que Google considera "alternativas" de una URL canónica `.html`. Lista completa de ejemplos que GSC entrega (10 de 13 visibles, mismo patrón en todas): `/vehiculos-en-desarme`, `/repuestos-suzuki-swift-indio`, `/repuestos-suzuki-celerio-k10b-rojo`, `/repuestos-suzuki-alto-800-2014`, `/envios`, `/como-comprar`, `/sucursales`, `/metodos-de-pago`, `/faq`, `/repuestos-suzuki-celerio-2008`.

El error 403 (1 página) y los dos casos "sin indexar" de Google no se investigaron URL por URL en esta pasada — quedan como pendiente para el ciclo técnico (sección 8).

### 3.7 Sitemap

- Un solo sitemap: `/sitemap.xml`, estado **"Correcto"**, 46 páginas descubiertas, última lectura hoy (12/8/2026).
- **Confirmado en el archivo real del repositorio:** las 46 URLs del sitemap están **todas con extensión `.html`** — el sitemap no lista ni una sola URL "limpia" (sin `.html`).

### 3.8 Core Web Vitals

- Móviles: **"No se han recogido suficientes datos de uso sobre este tipo de dispositivo en los últimos 90 días."**
- Ordenador: mismo mensaje.

No hay datos de campo (CrUX) de ningún tipo de dispositivo — el volumen de tráfico real del sitio es insuficiente para que Google reporte esta métrica. **No voy a inventar un puntaje de Core Web Vitals.** La alternativa que ofrece la propia consola es PageSpeed Insights (datos de laboratorio, no de campo); si se quiere esa cifra, es una acción aparte y explícita, no parte de esta lectura de GSC.

---

## 4. HALLAZGO CRÍTICO #1 — Conflicto de canonicalización: URL limpia vs. `.html`

**Dato que lo justifica:**

1. `netlify.toml` (repo, raíz) contiene una regla explícita de la tarea histórica #263 ("Unificar convención de URLs canónicas + redirects"):
   ```
   [[redirects]]
     from = "/*.html"
     to = "/:splat"
     status = 301
     force = true
   ```
   El comentario del propio archivo dice: *"Unifica la convención de URLs: toda pagina.html redirige 301 a /pagina (URL limpia), que es la que usa toda la navegación interna del sitio."*

2. Fetch en vivo de `vehiculos-en-desarme.html`, `sucursales.html` y `faq.html` (3 páginas, mismo resultado en las 3): la etiqueta `<link rel="canonical">` de cada una sigue apuntando a la versión **`.html`** — es decir, al revés de lo que dice la regla de Netlify y al revés de lo que usa toda la navegación interna (menú, footer, breadcrumbs), que enlazan consistentemente a la URL limpia sin `.html`.

3. `sitemap.xml` (repo, raíz) lista las 46 URLs **con `.html`** — otra vez, la versión que la propia regla de redirección declara como "no canónica".

4. Search Console confirma el efecto real: 13 páginas (sección 3.6) devuelven exactamente el estado "página alternativa con etiqueta canónica adecuada" — Google está viendo la contradicción y, como consecuencia, **no indexa ninguna de las dos versiones de forma limpia**: la URL limpia (la que de hecho sirve el contenido con código 200) queda marcada como "alternativa" porque su propio HTML le dice a Google que el canónico es la `.html` — pero la `.html` nunca devuelve 200, siempre redirige 301 de vuelta a la limpia. Es un bucle de señales contradictorias.

**Problema:** el sitio tiene tres fuentes de verdad sobre cuál es la URL "real" de cada página, y las tres dicen cosas distintas: Netlify (URL limpia), la navegación interna (URL limpia), y la etiqueta canonical + el sitemap (`.html`). Google está aplicando prudentemente el criterio más conservador y terminó sin indexar ninguna limpiamente en 13 páginas.

**Acción:** actualizar la etiqueta `<link rel="canonical">` en cada página HTML del sitio para que apunte a la URL limpia (sin `.html`), y regenerar `sitemap.xml` con las 46 URLs también sin `.html`. Como el sitio no tiene build step, esto implica una edición directa (o un pequeño script) sobre cada archivo `.html` del repositorio — no es un cambio de contenido, precio ni checkout.

**Archivo/URL afectado:** los ~46 archivos `.html` del repositorio (etiqueta `<link rel="canonical">` en el `<head>` de cada uno) + `sitemap.xml`. Confirmado como patrón sistémico en 3 páginas de distinto tipo (listado, página informativa, FAQ) — no es un caso aislado.

**Impacto esperado:** las páginas con más impresiones perdidas por este problema son `/sucursales` (195+51 = 246 impresiones combinadas divididas entre dos URLs), `/vehiculos-en-desarme` (97+89 = 186), `/como-comprar` (113+17 = 130), `/faq` (45+12 = 57), `/repuestos-suzuki-celerio-2008` (76+17 = 93) y `/repuestos-suzuki-alto-800-2014` (75+17 = 92). Consolidar la señal en una sola URL por página no garantiza más tráfico, pero elimina la causa raíz documentada de por qué 13 páginas no logran indexarse limpiamente.

**Riesgo:** bajo. Es un cambio de metadato (una línea por archivo), no toca Supabase, precios, checkout ni la base de datos. El riesgo real está en la ejecución manual sobre 46 archivos sin build step: hay que verificar cada uno (por ejemplo con el mismo método de verificación SHA1 ya usado para `products.json`) para no introducir un typo que rompa el `<head>` de alguna página. Antes de tocar cualquier archivo se debe hacer el commit/backup que el usuario exigió como condición.

**No se ejecuta este cambio en este informe** — es un hallazgo de diagnóstico, según la instrucción explícita del usuario de no modificar nada todavía.

---

## 5. Cruce demanda real (GSC) × inventario real (sitio en vivo)

Verificado accediendo en vivo a las páginas de destino de las consultas/páginas con más impresiones, no a `products.json` ni a memoria de sesiones anteriores.

| Página | Impresiones (GSC) | Clics | Posición | Inventario real verificado en vivo | Diagnóstico |
|---|---|---|---|---|---|
| `/repuestos-kia-optima-hibrido.html` | 17 | 1 | 10,5 | **Cero productos publicados.** El texto de la página dice literalmente: "Estamos publicando las piezas disponibles de este vehículo, una por una..." | Demanda real llegando a una página vacía. No es un problema de SEO — es un problema de catálogo. Publicar SEO adicional aquí sin publicar piezas reales sería exactamente lo que el usuario prohibió: crear/optimizar páginas sin inventario real detrás. |
| `/repuestos-suzuki-alto-800-2014.html` | 75 | 0 | 14,8 | **3 productos reales con foto y precio** (parachoques $54.990, ECU $168.990, compresor A/C $129.990) | Caso inverso: inventario real y completo, pero posición 14,8 (página 2) y 0 clics pese a 75 impresiones. Esto sí es un problema de SEO/autoridad, no de catálogo — candidato genuino a optimización on-page y de contenido, no a "crear más páginas". |
| `/repuestos-suzuki-celerio-2008.html` | 76 | 11 | ~6,3 | Inventario amplio confirmado en ciclos anteriores (página con más SKUs del sitio) | Es la página que mejor convierte impresión→clic del sitio (14,5% CTR). Sirve como referencia de qué title/descripción funciona. |

**Conclusión de esta sección:** con los datos disponibles, encontré **un caso claro de demanda sin inventario** (KIA Optima) y **un caso claro de inventario sin visibilidad** (Alto 800 2014). Son problemas de naturaleza opuesta y requieren acciones opuestas: el primero necesita que Emir publique piezas reales antes de tocar el SEO de esa página (si no hay piezas, no hay nada que vender aunque la página rankee); el segundo es un candidato legítimo de optimización técnica/on-page porque el inventario ya existe.

No se revisaron las 51 páginas una por una contra Supabase en esta pasada — se priorizaron las de mayor señal de demanda. Una revisión completa página-por-página queda pendiente si se quiere el cruce al 100%.

---

## 6. Otros hallazgos (menores, detectados de paso)

- **Inconsistencia de marca/NAP en el footer entre páginas:** `vehiculos-en-desarme.html` y `sucursales.html` muestran el footer como "Desarmaduría Saravia / AutopartsChile" y enlazan a Facebook `facebook.com/desarmaduria.multimarcas.cyc`; `faq.html` muestra "AutopartsChile / Desarmaduría Saravia" (orden invertido) y enlaza a `facebook.com/DesarmaduriaSaravia` (URL de Facebook distinta). No se verificó cuál de las dos URLs de Facebook es la real ni cuántas páginas tienen cada versión — es una bandera para revisar, no una conclusión cerrada.
- **Robots.txt:** limpio, sin bloqueos (`Allow: /`), referencia correcta al sitemap. Sin problemas.

---

## 7. Oportunidades priorizadas (demanda real × intención comercial × disponibilidad real × potencial de conversión)

| Prioridad | Hallazgo | Demanda | Intención comercial | Inventario real | Potencial conversión | Acción |
|---|---|---|---|---|---|---|
| 🔴 1 | Conflicto canonical `.html` vs. limpia (13 páginas no indexadas) | Alta (afecta a las páginas de mayor tráfico del sitio) | N/A — es infraestructura, no contenido | N/A | Alto (arreglo barato, afecta base del sitio) | Corregir `<link rel="canonical">` + `sitemap.xml` en todas las páginas |
| 🟠 2 | Alto 800 2014: inventario real, posición 14,8, 0 clics | Media (75 impr.) | Alta (piezas concretas con precio) | Sí, completo | Alto (ya hay algo que vender) | Revisar contenido/on-page de esa página específica una vez resuelto el canonical |
| 🟠 3 | KIA Optima Híbrido: demanda real, catálogo vacío | Baja-media (17 impr.) | Alta | **No** — cero productos | Ninguno hasta que haya inventario | No tocar SEO; es decisión de Emir si/cuándo publicar piezas reales de este vehículo |
| 🟡 4 | "desarmaduria lo blanco chevrolet": posición 1,9, 0 clics en 74 impresiones | Media | Ambigua (¿marca o producto?) | N/A | Medio | Revisar qué página rankea y si el title/snippet coincide con lo que el usuario busca |
| 🟡 5 | Desktop: posición media 14,2 vs. móvil 5,7 | N/A (afecta todo el sitio en ese dispositivo) | N/A | N/A | Medio | Sin Core Web Vitals no se puede diagnosticar la causa; requiere PageSpeed Insights u otra fuente antes de actuar |

No propongo crear ninguna página nueva en este informe: cada oportunidad de la tabla es sobre páginas que ya existen y ya tienen señal real de GSC. Cumple la regla explícita del usuario de no crear páginas solo porque una keyword existe.

---

## 8. Plan 30/60/90 (propuesto, no ejecutado)

**30 días:**
- Corregir canonical + sitemap.xml (hallazgo crítico #1), con backup/commit previo y verificación archivo por archivo.
- Investigar el error 403 y las 2 páginas "sin indexar" restantes (motivo específico, no agrupado).
- Decidir con Emir si el catálogo del KIA Optima se completa o la página se despriorización mientras tanto.

**60 días:**
- Con canonical ya corregido, re-medir en GSC el efecto real sobre indexación y posición (no antes — mezclar la variable "canonical corregido" con datos previos ensuciaría la comparación).
- Resolver la inconsistencia de marca/Facebook en el footer (unificar a una sola versión verificada).
- Revisar contenido on-page de Alto 800 2014 y de las 2-3 páginas con inventario real pero posición >10.

**90 días:**
- Si el volumen de tráfico lo permite, reintentar la lectura de Core Web Vitals (requiere más tráfico real para que Google reporte CrUX).
- Evaluar necesidad de una herramienta externa de backlinks/competencia si se quiere completar esa parte del prompt maestro original (no cubierta aquí por falta de fuente confiable).

---

## 9. Lo que este informe no hizo (por instrucción explícita)

- No se modificó ningún archivo del sitio, `sitemap.xml`, `robots.txt`, Supabase, ni `products.json`.
- No se tocó SCR-001/SCROSS-001 ni los 66 DZ13.
- No se crearon páginas nuevas.
- No se usó la función de validación/corrección de Search Console (botón "Validar corrección"), que habría iniciado un proceso de revalidación en Google — se evitó por ser una acción con efecto en la cuenta real, fuera del modo solo lectura acordado.
- No se descargó el export de GSC (requería permiso explícito de descarga que no se pidió en este ciclo).
