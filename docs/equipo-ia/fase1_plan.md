# Fase 1 · Plan y decisiones de diseño (para tu OK)

Lee primero `fase1_estado_actual.md`. Este documento dice qué propongo hacer, qué NO voy a hacer de lo que pediste y por qué, y qué necesito que decidas.

## 1. La corrección de rumbo más importante

Pediste "diseña y crea las tablas". **No hay que crear la base: hay que ordenar la que tienes.** Ya tienes un CRM mejor que el que describiste (21 etapas de venta, motivos de pérdida, SLA, cotizaciones con ítems, pagos, garantías, reclamos, cola de sugerencias de IA con aprobación humana). Lo que falta son ~25 columnas y 3 tablas.

Costo de ignorar esto: dos conjuntos de tablas para lo mismo (`leads` vs `crm_conversations`, `repuestos` vs `products`), agentes escribiendo en una y el sitio leyendo de la otra, y un dashboard que nunca cuadra con la web. Ya pasó una vez: hay 24 tablas vacías de una plantilla anterior.

## 2. Qué hace la migración (archivo `supabase/migrations/20261126_fase1_base_central.sql`, BORRADOR)

Todo aditivo: columnas nuevas, 3 tablas nuevas, 6 vistas, 5 triggers. Cero `drop table`, cero cambio de tipos. El sitio y el admin actual siguen igual.

| Bloque | Qué agrega | Decisión que encierra |
|---|---|---|
| `vehiculos` | patente, vin, ubicacion, **estado**, **costo_compra**, fecha_compra | `estado` reemplaza conceptualmente al booleano `en_desarme`, pero el booleano se mantiene y se sincroniza solo (el sitio lo lee). Sin `costo_compra` el KPI "recuperado vs costo" es imposible: hoy ningún vehículo lo tiene. |
| `products` | **precio_sugerido** (columna, antes en metadata), **precio_estado** pendiente/fijado, precio_fijado_at/por, ubicacion_fisica, condicion, **imagen_promocional_url**, reservado_para/hasta; `part_status` gana `reservada` | **Dos estados independientes, no uno.** Tú pediste un solo `estado` (disponible/reservado/vendido/precio_pendiente). Eso mezcla dos cosas distintas: dónde está la pieza físicamente (en el auto / desmontada / vendida) y si tiene precio aprobado. Una pieza puede estar en el auto Y con precio pendiente. Si fuera un solo campo, al aprobar el precio perderías la info de dónde está. La vista `v_repuestos` te muestra igual un `estado` único calculado, que es lo que verás en el dashboard. |
| regla 2 en la base | trigger: si `price_sale` es nulo o 0, `precio_estado` pasa solo a `pendiente`; al fijar, guarda quién y cuándo | La regla no depende de que el agente "se acuerde". |
| regla 1 en la base | trigger en `publicaciones`: nada pasa a `aprobada`/`publicada` sin número de parte, foto, imagen promocional, precio fijado y stock. El error dice exactamente qué falta. | Lo mismo: se cumple aunque el agente falle. |
| despublicar | trigger: al marcar `vendida`/sin stock, sus publicaciones vivas pasan a `despublicar` | Cola para que el Publicador baje cada canal (ML se puede automatizar; Marketplace/grupos quedan como "pendiente de bajar a mano", ver §4). |
| `customers` | pais | Clientes extranjeros (WU/DHL). |
| `crm_conversations` | pieza_buscada, vehiculo_buscado, product_id, red_solicitud_id | Hoy la pieza buscada vive en el texto del mensaje. El Recepcionista la estructura aquí. |
| `orders` | carrier, tracking_number, tracking_url, shipped_at | Para Despacho (fase 2). |
| `oportunidades` | **decision**, decidida_at, notas, vehiculo_id; política para que TÚ puedas leer/escribir (hoy solo service_role) | Cierra el ciclo radar → decisión → auto comprado → piezas. |
| `publicaciones` (nueva) | una fila por repuesto × canal (× grupo), con estado, url, quién la creó/aprobó | Reemplaza a `social_posts` (vacía, plantilla). |
| `red_solicitudes` (nueva) | #ID, texto original, comuna/marca/modelo/pieza extraídos, repuestos candidatos, respuesta propuesta, estado | Alimenta al agente Red Desarmadurías. |
| `agente_tareas` (nueva) | bitácora de cada acción de cada agente + **cola de aprobación** (requiere_aprobacion, estado_aprobacion, propuesta legible, aprobado_por) | Una sola tabla para "qué hizo el equipo" y "qué espera mi sí". Check en base: nada queda `aprobada` sin `aprobado_por` y fecha. `crm_ai_suggestions` se mantiene para sugerencias por chat; la vista `v_aprobaciones_pendientes` une todo. |
| vistas `v_*` | repuestos, leads, ventas, inventario por vehículo, aprobaciones, equipo IA | Son la "API" en español que leen agentes y dashboard. Si mañana cambias una tabla, cambias la vista y nada más se rompe. |
| RLS | tablas nuevas: solo `is_admin()` (tú) y `service_role` (agentes). Anónimo: nada. Vistas con `security_invoker` (respetan RLS de las tablas) | Mismo patrón que ya usa tu CRM. |

## 3. Lo que pediste y NO voy a hacer (y qué hago en su lugar)

**a) 10 filas de ejemplo por tabla en la base de producción. No.** Tu propia regla dice "nada de métricas inventadas". 10 ventas falsas en `orders` te inflan ventas del mes y tasa de cierre; 10 leads falsos aparecen en el kanban. Tendrías que acordarte de borrarlos y nunca estarías seguro de haberlo hecho.
En su lugar: (1) las tablas existentes ya tienen datos reales de sobra (1.038 repuestos, 34 autos, 5 leads vencidos, 62 oportunidades, 7 ventas); (2) para las 3 tablas nuevas, los primeros registros reales los generan los agentes en la fase 2 al correr sobre esos datos; (3) si quieres probar sin ensuciar, `customers.is_test` ya existe y las pruebas de fase 2 se hacen en una **rama de Supabase** (copia de la base que se destruye al terminar), no en producción.

**b) `servicios_grua` en esta base. No.** Grúas Saravia ya tiene su base con `services` (16 estados), `quotes` con tarifa por km + peajes + TAG, `pricing_config` versionado, revisión humana y auditoría. Duplicarla aquí es mantener dos. El "Cotizador de grúa" de la fase 2 ya existe ahí (`quotes.actor_type = 'AI'`, `requires_human_review`). El dashboard de la fase 4 lee las dos bases con dos conexiones. Si más adelante quieres una sola, se une con `postgres_fdw`; no ahora.

**c) `tareas_agentes` como simple log.** Lo convertí además en la cola de aprobación, porque si no, en la fase 3 habría que crear otra tabla `aprobaciones` que apunte al log. Una tabla, no dos.

**d) Nombres.** No renombro `products` → `repuestos` ni `customers` → `clientes`: hay 44 referencias en el sitio, 27 edge functions y 60 políticas RLS que las usan. Renombrar es riesgo puro sin beneficio. Los nombres en español los ves en las vistas `v_*`.

## 4. Advertencias que necesitas antes de la fase 2 (no son de tablas, pero bloquean)

1. **Regla 1 hoy excluye al 58 % de tu stock.** 597 repuestos activos sin número de parte y 778 sin foto. El Catalogador de la fase 2 no va a "arreglar" esto solo: necesita fotos nuevas tuyas. Decide si la regla 1 aplica a lo nuevo que entre o también a lo que ya está en la web (si es a todo, la web pierde la mayoría de sus fichas).
2. ~~185 repuestos del Audi A4 publicados con precio no aprobado~~ **Corregido al verificar con datos**: esos 185 están borrados (importación temporal del vehículo 39). No hay repuestos vivos en la web sin tu aprobación. Me equivoqué en el primer informe por no cruzar con `deleted_at`.
3. **El radar está roto.** Corre cada 3 h hace meses, siempre "OK", y nunca ha guardado una oportunidad de Mercado Libre: la API pública de búsqueda que usa ya no responde sin autenticación. Las 62 oportunidades existentes vienen de Facebook, de otro proceso que no está en este proyecto. Hay que rehacerlo en fase 2 (con la cuenta ML que ya tienes conectada en `meli_account`).
4. **Facebook Marketplace y grupos no tienen API para publicar.** Meta no lo permite para cuentas normales. El Publicador va a dejar el texto + imagen listos y un botón "copiar"; publicas tú con un toque. Mercado Libre sí se automatiza (ya tienes `meli-publish`). Instagram/Facebook muro: solo con página de empresa y permisos de Meta que hoy no están configurados (`meta-agent` registra que faltan los secretos).
5. **No encontré el agente de WhatsApp.** En Supabase solo está `meta-agent` (Instagram/Messenger) y nunca guardó una conversación. ¿Dónde vive el de WhatsApp (n8n, otro proveedor)? Sin eso, el Recepcionista de la fase 2 se diseña a ciegas.
6. **Red Desarmadurías: ¿cómo llegan las solicitudes #ID?** ¿Grupo de WhatsApp, Facebook, sitio web? Si es un grupo de WhatsApp, no hay API: alguien tiene que reenviar el texto al agente (o usar WhatsApp Business API con un número dedicado). Esto define el "disparador" de ese agente.
7. **Telegram tiene 6 avisos en error** en `crm_outbox`. Revisar el token antes de la fase 3 o las aprobaciones por celular no te van a llegar.

## 5. Lo que necesito de ti (responde con el número)

1. **OK para aplicar la migración** tal como está, o cambios. (Primero la pruebo en seco: Supabase me pidió tu confirmación para hacerlo y quedó esperando.)
2. **Tablas muertas** (24, lista en estado_actual): ¿las muevo a un esquema `legado`? Sí / No / después.
3. **Regla 1**: ¿aplica solo a publicaciones nuevas (recomendado) o también retroactiva a la web actual?
4. ~~Audi A4~~ Resuelto: eran filas borradas, no hay nada que decidir.
5. **Vehículos con `en_desarme = false`** (13): la migración los deja como `desarmado`. ¿Correcto o alguno es `vendido_entero`?
6. **Costo de compra de los 21 autos en desarme**: ¿me los das (aunque sea aproximados) para que "recuperado vs costo" tenga sentido desde el día uno?
7. **¿Dónde está el agente de WhatsApp** y cómo llegan las solicitudes de la Red? (§4.5 y §4.6)

Con el 1 aplico la migración en tu proyecto y te muestro las vistas con tus datos reales. Sin el 1 no toco la base.

## 6. Resultado de la aplicación (26-nov-2026)

Migración `fase1_base_central_equipo_ia` **aplicada** en producción. El sitio y el admin siguen funcionando (solo se agregaron columnas, tablas y vistas).

Verificación con tus datos reales, vía las vistas nuevas:

| Vista | Resultado real |
|---|---|
| `v_repuestos` por estado | disponible 1.030 · disponible_sin_publicar 215 · vendido 6 · no_disponible 3 |
| Bloqueos de publicación sobre los 1.245 con stock | sin_imagen_promocional 1.245 · sin_foto 984 · sin_numero_parte 668 · precio_pendiente 46 |
| **Publicables hoy según regla 1** | **0** (ninguno tiene imagen promocional con autos compatibles) |
| `v_leads` por etapa | seguimiento 5 (los 5 leads web, todos con próxima acción vencida) |
| `v_ventas` | 10 ventas, $551.010 total (7 web + 3 manuales) |
| `v_inventario_vehiculo` top valor de stock | SCR1721 $15,9 M (0 publicadas) · Audi A4 $15,9 M · Swift K12M $14,7 M · SX4 $10,9 M · CEL0814 $6,3 M. **`costo_compra` nulo en los 34** → `recuperado` es 0 y `pct_recuperado` no existe hasta que cargues costos. |
| `v_aprobaciones_pendientes` | vacía (correcto: ningún agente ha corrido) |
| `precio_sugerido` migrado desde metadata | 134 filas con número; 272 tenían `null` en metadata |

Pruebas de las reglas en la base (ejecutadas y revertidas):

| Prueba | Resultado |
|---|---|
| Regla 1: pasar a `aprobada` una publicación de un repuesto sin número de parte | **Bloqueado.** El mensaje de error salía mal formado por un bug de PL/pgSQL (`text[] || 'texto'`); corregido en 1b. |
| Regla 2: marcar `fijado` un repuesto sin `price_sale` | Queda `pendiente` automáticamente. |
| Cola: insertar tarea con `requiere_aprobacion` | Queda `pendiente` sola. |
| Aprobar una tarea sin usuario (sin `aprobado_por`) | **Bloqueado** por el check `agente_tareas_decision_humana`. |

Advisors de Supabase tras la migración: 2 avisos de seguridad y 7 de rendimiento atribuibles a la fase 1 (funciones de trigger ejecutables por la API, `search_path` sin fijar, FK sin índice, políticas redundantes). Todos corregidos en `20261126_fase1b_correcciones.sql`, **pendiente de aplicar** porque Supabase pide tu confirmación para `drop policy`/`revoke`.

Lo que ya existía y no toqué: 25 tablas con RLS sin políticas (esquema `finance` y `chat_history`, `agent_*`, `meli_*`), 12 funciones viejas sin `search_path`, `pg_net` en `public`, protección de contraseñas filtradas desactivada en Auth, 99 pares de políticas permisivas duplicadas (patrón `service_*` + `admin_*` en toda la base). No es urgente; va al Auditor.
