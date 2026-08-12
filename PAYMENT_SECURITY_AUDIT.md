# PAYMENT_SECURITY_AUDIT.md — AutopartsChile.cl

Creado 2026-08-12. Auditoría directa del código fuente de las 4 Edge Functions de Supabase involucradas en pagos (`webpay-create-transaction`, `webpay-confirm`, `mp-create-preference`, `mp-webhook`), leído completo vía herramienta de Supabase conectada. No se muestran credenciales ni secretos reales en este documento.

## P0 — Webpay: estado producción vs. integración

**No puedo confirmar si Webpay está en producción o en integración — y tampoco puedo afirmar que sigue en integración.** Depende exclusivamente de la variable de entorno `WEBPAY_ENV` en Supabase, no legible desde ninguna herramienta conectada.

Verificado directamente en el código:

- Existe `WEBPAY_ENV` con valor por defecto `"integration"` si no está seteada.
- Guarda de seguridad real: si `WEBPAY_ENV` no es exactamente `"production"`, usa el commerce code y API key públicos de prueba de Transbank (valores que Transbank publica en su propia documentación para todos los desarrolladores, no son secretos de este negocio). Si sí es `"production"`, usa variables reales (no leí sus valores).
- Esto significa que no existe el riesgo de "creer que está en producción pero usa credenciales de test silenciosamente" — el switch es explícito. El riesgo real que queda es el opuesto: que `WEBPAY_ENV` nunca se haya seteado a `"production"`, mostrando el botón a clientes reales pero cobrando contra el ambiente de integración.
- La tarea histórica #210 ("Pasar Webpay Plus a producción, pendiente credenciales Transbank") sigue `pending`, y la #280 ("Pasar Webpay Plus a producción con credenciales reales") figura `in_progress` — señal de que este trabajo probablemente se inició recientemente, pero no prueba que se completó.

**Registro formal: P0 — ESTADO DE PRODUCCIÓN DE WEBPAY NO VERIFICABLE DESDE EL REPOSITORIO.** No afirmo que está en producción. No afirmo que sigue en test. Acción recomendada: revisar en el panel de Supabase (Edge Functions → Secrets) el valor real de `WEBPAY_ENV`.

## Webpay — resto de la auditoría de código

- **Creación**: `checkout.js` → POST a `webpay-create-transaction` con `{items:[{sku,quantity}], customer}` → la función busca cada SKU en Supabase `products`, calcula el monto total del lado del servidor (el body ni siquiera incluye un campo de precio), crea la orden en `orders`, llama a la API de Transbank, y devuelve la URL+token para el redirect.
- **Confirmación**: `webpay-confirm` recibe el retorno de Transbank, confirma el pago real, actualiza `orders.status`/`webpay_status`. Tiene protección de idempotencia: revisa el estado antes de re-confirmar.
- **Abandono**: fix histórico (#209) para el caso sin `TBK_TOKEN`, confirmado presente.
- **Timeout**: 15s con `AbortController` en llamadas a Transbank.
- **CORS**: no encontré la misma restricción explícita de origen que existe en `mp-create-preference`. Recomendación P2: alinear el candado `Access-Control-Allow-Origin: https://autopartschile.cl` (no explotable hoy porque el precio se recalcula server-side, pero reduce superficie de abuso).

## Mercado Pago — auditoría de código

- **Creación de preferencia**: mismo patrón — precio recalculado 100% server-side por SKU. **CORS ya restringido** a `https://autopartschile.cl`, con comentario propio en el código documentando que corrige una vulnerabilidad anterior de wildcard, ya resuelta.
- **Webhook**: verifica firma HMAC-SHA256 contra `MP_WEBHOOK_SECRET`. Hallazgo P2: si el secreto no está configurado, la verificación se salta ("fail open"). Impacto real bajo porque el webhook nunca confía en el cuerpo del mensaje — siempre vuelve a consultar el estado real a la API de Mercado Pago antes de actualizar la orden. Recomendado igual setear el secreto por defensa en profundidad.
- **Idempotencia**: tolera reprocesar el mismo `payment_id` sin duplicar efectos.

## Validación de precio server-side

**Confirmado: no existe riesgo de manipulación de precio desde el navegador.** En ninguna de las 4 funciones el precio depende de un valor enviado por el cliente — solo `sku` y `quantity`. El precio siempre se busca en `products.price_sale` del servidor. Pero esto también significa que si el precio en Supabase está desactualizado (como pasó con 3 SKUs este ciclo), el servidor cobra ese precio desactualizado con total confianza — la validación server-side protege contra manipulación maliciosa, no contra un dato maestro incorrecto (ver `INVENTORY_RECONCILIATION.md`).

## Otros hallazgos relacionados con backend/pagos

- **RLS deshabilitado en `public.oportunidades`** (nivel ERROR según advisors de Supabase). Actualmente 0 filas, riesgo bajo hoy, pero expuesto sin restricción a roles anon/authenticated si `radar-oportunidades` empieza a escribir datos reales. No apliqué la corrección — la herramienta indica explícitamente presentar este tipo de cambio al usuario, no auto-aplicarlo. SQL sugerido: `ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;` — pendiente de tu confirmación.
- **`pg_net` instalado en schema `public`** (WARN) — recomendación estándar moverlo a otro schema, no urgente.
- **Stock no se descuenta automáticamente al confirmar un pago** (hallazgo nuevo): ni `webpay-confirm` ni `mp-webhook` actualizan `products.stock` al confirmar. Como la mayoría de los productos tienen `stock: 1` (piezas únicas de desarme), dos clientes podrían pagar la misma pieza única antes de marcarla vendida manualmente. Clasificación P1 — riesgo operativo/de negocio, no de seguridad clásica. Recomendación: al confirmar pago, poner `is_active=false` o `stock=0` automáticamente, o alertar si el mismo SKU recibe dos pagos confirmados.

## Resumen de severidad

| Hallazgo | Severidad | Estado |
|---|---|---|
| Estado producción/integración Webpay no verificable desde repo | P0 | Requiere tu confirmación en Supabase |
| Precio nunca confiado desde el cliente (Webpay + MP) | — | Verificado seguro |
| Idempotencia en confirmación de pago | — | Verificado presente |
| CORS sin restringir en webpay-create-transaction | P2 | No explotable hoy, recomendado alinear con MP |
| MP_WEBHOOK_SECRET fail-open si no está seteado | P2 | Mitigado por re-verificación real contra API de MP |
| RLS deshabilitado en public.oportunidades | P1 (ERROR de Supabase) | Pendiente tu decisión — SQL de fix arriba, no aplicado |
| pg_net en schema public | P3 | No urgente |
| Stock no se descuenta al confirmar pago | P1 | Nuevo hallazgo, requiere decidir la lógica de negocio contigo antes de tocar código de pago en producción |
