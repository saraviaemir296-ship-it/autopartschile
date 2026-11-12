# CRM Desarmaduría Saravia — Base de datos (Fase 2)

Vive en el mismo proyecto Supabase `autopartschile-ai` (zlyforhywunqhitrdreo).
Esta carpeta no se publica en el sitio (netlify.toml redirige `/supabase/*` a 404).

## Migraciones (aplicar en orden)

| Archivo | Qué hace |
|---|---|
| `migrations/20261112120000_crm_01_core.sql` | Catálogos, roles, equipo, conversaciones, mensajes, seguimientos, cotizaciones, pagos, postventa, IA, alertas, auditoría. Agrega columnas a `customers` y `orders`. |
| `migrations/20261112120100_crm_02_seed_rules.sql` | Datos de catálogo y todas las reglas de negocio (triggers y funciones). |
| `migrations/20261112120200_crm_03_rls.sql` | Row Level Security por rol y permisos de ejecución. |
| `migrations/20261112120300_crm_04_selftest.sql` | `crm_selftest()`: 23 pruebas que se deshacen solas (no dejan datos). |

## Qué se reutiliza (no se duplicó)

`customers` (clientes), `orders` + `order_items` (pedidos), `products` (inventario real), `vehiculos`,
`shipping_tracking` (despachos), `returns` (devoluciones), `admins` (los admins actuales son admin del CRM).

## Cambios a tablas existentes (todos no destructivos)

- `customers.email` deja de ser obligatorio (clientes de WhatsApp sin correo). Sigue siendo único.
- `customers`: nuevas columnas `phone_e164`, `region`, `comuna`, `source_channel`, `classification`, `contact_preferences`, `is_test`, `merged_into_id`, `deleted_at`. Los clientes de prueba existentes quedan con `is_test = true` (no se borran).
- `orders`: nuevas columnas `crm_conversation_id`, `crm_quotation_id`, `fulfillment_status`. `source` acepta además instagram, messenger, web, mercadolibre, presencial, tiktok, otro.
- `orders`: trigger `crm_orders_guard` — un usuario del equipo solo puede cambiar `fulfillment_status`, `notes`, `delivery_method`, `shipping_status`. Montos y datos de Webpay/MP siguen siendo solo del servidor (service_role no se ve afectado).
- `shipping_tracking.order_id` y `returns.order_id` apuntaban a `orders_full` (vacía, sin uso); ahora apuntan a `orders`. Ambas tablas estaban vacías.
- Duplicados por teléfono: **se detectan** (`crm_v_possible_duplicates`) y se fusionan (`crm_merge_customers`), pero **no se bloquean** al insertar, porque `webpay-create-transaction` crea clientes por email y un índice único por teléfono haría fallar pagos reales.

## Estados (cada categoría en su propia columna y catálogo)

| Columna en `crm_conversations` | Catálogo |
|---|---|
| `chat_status` | `crm_chat_statuses` (13) |
| `sales_stage` | `crm_sales_stages` (21, con columna de Kanban) |
| `order_status` | `crm_order_statuses` (19) |
| `postsale_status` | `crm_postsale_statuses` (18) |
| `loss_reason` | `crm_loss_reasons` (11) |

Cada cambio queda en `crm_status_history` (quién, rol, cuándo, motivo vía `set_config('crm.reason', ...)`).

## Reglas de negocio implementadas en la base

1. Chat nuevo → tarea "Primera respuesta" con vencimiento según SLA de la prioridad (5/10/15/60 min, configurable en `crm_priorities`).
2. Conversación comercial activa **nunca** queda sin próxima acción: completar el último seguimiento sin definir el siguiente falla. Usar `crm_complete_task(task, resultado, siguiente_tipo, ...)` o justificar `next_action_exception`.
3. Responder (mensaje saliente) completa "primera respuesta" y deja "Definir próxima acción".
4. Estados de atención (`en_atencion`, `en_espera_*`) exigen responsable. Un vendedor puede tomar chats sin dueño; reasignar exige supervisor.
5. Cliente escribe en chat cerrado → `reabierto`. Cerrar el chat no toca la etapa comercial.
6. Venta perdida exige motivo (y nota si es "error comercial" u "otro").
7. `pago_confirmado` exige un pago confirmado; `venta_concretada` exige un pedido. Venta concretada **no** marca entregado.
8. Pagos: el equipo los registra siempre "en revisión". Solo supervisor/admin (o Webpay/MP desde el servidor) confirma.
9. Cotizaciones: disponibilidad sale del inventario real (`products`), nunca escrita a mano. No se envía con repuestos sin stock. Descuento requiere permiso `quotations.approve_discount`.
10. Cotización aceptada → `crm_convert_quotation_to_order()` crea el pedido e ítems sin reingresar datos (idempotente).
11. Sugerencias de IA (`crm_ai_suggestions`): solo el servicio las crea; aprobar/rechazar/enviar es siempre de una persona.
12. Mensajes del canal con el mismo id externo no se guardan dos veces (idempotencia del webhook).
13. Auditoría (`crm_audit_logs`) en conversaciones, cotizaciones, pagos, garantías, reclamos, equipo, permisos, seguimientos, clientes y reglas de prioridad.

## Roles

admin · supervisor · vendedor · bodega · postventa · auditor — matriz en `crm_role_permissions`.
Alta de un usuario del equipo: crear el usuario en Supabase Auth y luego
`insert into crm_staff (user_id, full_name, role_code) values (...)`.

## Funciones para el backend (solo service_role)

- `crm_resolve_customer(canal, id_externo, telefono, nombre)` → id de cliente sin duplicar.
- `crm_pick_assignee(sucursal)` → vendedor con menos chats abiertos.

## Probar sin tocar producción

```bash
sudo bash supabase/tests/crm/run_local.sh
```
Levanta una réplica mínima de Supabase en Postgres local, aplica las 4 migraciones, corre `crm_selftest()`
y una regresión del checkout (Webpay sigue creando clientes y actualizando pedidos).

En producción, después de aplicar: `select * from public.crm_selftest();` (como servicio).
