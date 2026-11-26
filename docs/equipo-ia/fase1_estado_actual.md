# Fase 1 · Qué existe hoy en tu Supabase (levantamiento, 25-nov-2026)

Proyecto principal: `autopartschile-ai` (zlyforhywunqhitrdreo, sa-east-1, Postgres 17).
Proyecto aparte: `gruas-saravia` (mgkfsodgdldotjiybate), con su propia base.

## Resumen en una línea

**La "base central" ya existe en un 80 %.** Hay 90 tablas en `public`, 63 migraciones aplicadas, 10 trabajos programados (pg_cron) y 27 edge functions. Lo que pediste crear en la Fase 1 ya está, con otros nombres y en inglés/español mezclado. Crear las 9 tablas nuevas tal como las describiste habría producido una **tercera base paralela** (la primera es la de la tienda, la segunda el CRM), justo lo contrario de "una sola base".

## Mapa: lo que pediste → lo que ya hay

| Pediste | Ya existe | Filas | Qué le falta para lo que quieres |
|---|---|---|---|
| `vehiculos` | `vehiculos` | 34 (21 en desarme) | patente/VIN, ubicación (matriz/patio), estado del ciclo, **costo de compra** (sin esto no hay "recuperado vs costo") |
| `repuestos` | `products` | 1.254 vivas, 1.038 activas, 1.031 con stock | precio sugerido como columna (hoy está en `metadata`), estado del precio (regla 2), ubicación física, condición, imagen promocional (regla 1), estado "reservado" |
| compatibilidades | `products.vehicle_compatibility` (jsonb) + `part_catalog` (183 piezas estándar con reglas por tracción/caja/combustible) | 183 | nada estructural; está bien |
| `publicaciones` | `social_posts` (plantilla vieja, inglés, canales equivocados) | 0 | se reemplaza por `publicaciones` nueva |
| `clientes` | `customers` + `crm_customer_identities` (un cliente, varios canales) | 24 | país (para WU/DHL) |
| `leads` | `crm_conversations` con **21 etapas**, motivo de pérdida, próxima acción, prioridad, SLA | 5 (todas web, todas vencidas) | pieza buscada estructurada, repuesto ofrecido, #ID de la Red |
| `ventas` | `orders` + `order_items` (Webpay/Mercado Pago) + `manual_sales` | 46 pedidos (7 completados) + 3 manuales | transportista y n° de seguimiento |
| `oportunidades_compra` | `oportunidades` (el radar ya escribe aquí, no solo a Telegram) | 62 | tu decisión (contactar/descartar/comprada) y vínculo al vehículo |
| `servicios_grua` | proyecto `gruas-saravia`: `services`, `quotes`, `pricing_config`, peajes, TAG, choferes, grúas | 8 servicios, 8 cotizaciones | **nada**: ya tiene cotizador con tarifa por km, revisión humana y auditoría |
| `tareas_agentes` | `crm_automation_logs` (3.561, solo workflows CRM), `crm_ai_suggestions` (cola de sugerencias por chat), `crm_outbox` (cola de envío), `crm_audit_logs` | — | una bitácora **única por agente** con cola de aprobación: `agente_tareas` nueva |

## Lo que ya corre solo (pg_cron)

| Trabajo | Frecuencia | Estado |
|---|---|---|
| radar-oportunidades | cada 3 h | corre "OK" pero **0 oportunidades de Mercado Libre en toda su vida**; las 62 son `fuente=facebook` (otra fuente que esta función no genera). La API pública de búsqueda de ML que usa ya no responde sin token. El radar está roto en silencio. |
| webpay-reconcile | 5 min | ok |
| meli-questions | 5 min | ok |
| crm-alertas / crm-outbox-worker / crm-mantencion-diaria | 5 min / 5 min / diario | ok (crm_outbox: 6 telegram en error → revisar token) |
| ref-fotos-buscar | 30 min | ok (428 fotos de referencia) |
| finance (cierre mensual, recordatorios, resumen semanal) | — | esquema `finance` aparte, 18 tablas |

## Agentes que ya existen (edge functions)

- `meta-agent`: Instagram + Messenger con Claude, memoria en `chat_history` (0 filas: nunca ha guardado; `agent_errors` dice que faltaban secretos), transferencia a humano en `agent_handoffs`.
- `radar-oportunidades`, `crm-outbox-worker`, `meli-*` (publicar, repreciar, preguntas, auditoría), `webpay-*`, `mp-*`, `finance-bot`, `ref-fotos-buscar`, `dashboard-export`.
- No hay agente de WhatsApp en Supabase. El "agente de WhatsApp" que mencionas no aparece en este proyecto (¿está en n8n/otro servicio?). **Pregunta abierta.**

## Datos reales que condicionan todo lo demás

| Dato | Valor | Por qué importa |
|---|---|---|
| Repuestos activos sin número de parte | **597 de 1.038** | Regla 1 dice que no se publica sin número de parte → el 58 % de tu stock no es publicable hoy. El cuello de botella es catalogación, no tablas. |
| Repuestos activos sin foto | **778 de 1.038** | Ídem. |
| Repuestos marcados `pendiente_aprobacion_emir=true` en metadata | 185, todos del Audi A4 "AUA4T20" (vehículo 39) | **Corrección:** los 185 están borrados (soft delete, importación temporal). No hay repuestos vivos publicados sin tu aprobación. La migración igual los deja `precio_pendiente` por si se restauran. |
| Vehículo SCR1721 (S-Cross 2017-21) | 148 piezas creadas con precio, **0 publicadas** (todas inactivas), $15,9 M de stock | Despiece generado y nunca activado. Es el auto con más valor parado. |
| Repuestos vivos sin precio (`price_sale` nulo o 0) | 46, todos inactivos | Pasan a `precio_pendiente` en la 1b. |
| Leads web | 5, todos con próxima acción vencida desde el 13-nov | Son los primeros candidatos reales del agente Seguimiento. |
| Clientes con comuna | 0 de 24 | La "segmentación por comuna" del dashboard no tendrá datos hasta que el Recepcionista la capture. |
| Ventas | 7 pedidos web completados + 3 manuales "no especificado" | Con 10 ventas registradas, "tasa de cierre" y "días promedio para vender" van a ser números con 1 decimal de ruido. Mostrarlos igual, pero con el `n` al lado. |

## Tablas muertas (0 filas, de una plantilla anterior)

`documents, suppliers, dropshipping_quotes, price_history, whatsapp_conversations, vehicles (inglés), oem_references, product_compatibility, pricing_rules, orders_full, shipping_tracking, social_posts, part_synonyms, inventory, search_logs, competitor_prices, returns, invoices, vin_lookups, system_logs, customer_interactions, leads, tmp_meli_jobs, backup_precios_celerio_20261029`.

24 tablas que confunden a cualquier agente (un modelo que vea `leads` vacía y `crm_conversations` llena puede escribir en la equivocada). Propongo moverlas a un esquema `legado` (no borrarlas) en una migración separada, con tu OK.
