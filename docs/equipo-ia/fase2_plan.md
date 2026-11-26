# Fase 2 · Agentes conectados a la base (plan para tu OK)

Base: la fase 1 ya aplicada (`agente_tareas`, `publicaciones`, `red_solicitudes`, vistas `v_*`). Todo agente de esta fase:
1. Lee y escribe **solo** en las tablas/vistas de la fase 1 (nunca en las 24 tablas muertas).
2. Registra cada corrida en `agente_tareas` (entrada, salida, duración, modelo, error).
3. Si va a enviar, publicar o cobrar, **no lo hace**: deja una fila con `requiere_aprobacion = true` y `propuesta` legible. Tú apruebas (fase 3: notificación push al celular con acceso directo a la cola; mientras, desde la cola en el admin).
4. Habla español de Chile y usa tus procedimientos ya escritos (skills `cotizar-repuesto`, `seguimiento-leads-ventas`, `despacho-starken`, `publicar-repuestos-marketplace`, etc.). No invento reglas nuevas: las codifico.

## 0. Tres decisiones que cambian la arquitectura (responder antes de construir)

**A. Canal WhatsApp.** Hoy tu "agente de WhatsApp" es Claude con *computer use* sobre WhatsApp Desktop (skill `revisar-whatsapp-business`). Eso no sirve para un agente que corre solo cada hora: necesita que tu PC esté prendido, es lento y Meta puede bloquear el número si detecta automatización. Opciones:

| Opción | Qué implica | Costo/riesgo |
|---|---|---|
| **1. WhatsApp Business Cloud API (Meta) con tu número** | Migrar +56 9 5381 7335 a la API. Desde 2025 Meta permite "coexistencia" (seguir usando la app Business en el teléfono y recibir los mensajes también por API) en varios países; **hay que verificar que Chile esté habilitado**. Si no, el número deja de funcionar en la app y solo se atiende desde el CRM/dashboard. | Cobro por conversación iniciada por el negocio (las respuestas dentro de 24 h a un cliente son gratis hasta cierto volumen). Requiere Meta Business verificado. |
| 2. Proveedor (360dialog, Twilio) | Misma API de Meta, con panel y soporte. | Mensualidad extra. |
| 3. Librería no oficial (Baileys) | Automatiza la app. | **Riesgo real de baneo del número principal**. No lo recomiendo. |
| 4. Número nuevo solo para la API | Mantienes el actual como está; el agente atiende otro número. | Confunde a clientes; divide el historial. |

Recomendación: **opción 1**, verificando coexistencia. Mientras no esté, el Recepcionista parte por los canales que **ya** llegan a la base sin API: formulario web (`quote_requests` → CRM, ya funciona), Instagram y Messenger (`meta-agent`, solo hay que cargar los 4 secretos que faltan). WhatsApp se atiende con el flujo actual y el Seguimiento propone mensajes que tú envías con un toque (enlace `wa.me` con el texto ya escrito: no necesita API).

**B. Red Desarmadurías Chile.** No sé cómo llegan las solicitudes #ID (¿grupo de WhatsApp? ¿Facebook? ¿sitio?). Si es grupo de WhatsApp sin API, el disparador es "Emir reenvía el mensaje" a un número/endpoint del agente, o se lee desde la Cloud API si el grupo está en el número migrado. **Dime la fuente.**

**C. Garantía: tus documentos se contradicen.** El skill `atencion-a-clientes` dice "7 días SOLO motores, medio motor, cajas, cremalleras; nunca escribir garantía en otras piezas". El skill `publicar-repuestos-marketplace` (12-nov-2026) y tu encargo de hoy dicen "7 días en todo lo mecánico y carrocería; eléctricas sin garantía". Los agentes van a usar la versión del 12-nov (la más reciente). Si no es así, dímelo ahora; ya hay 1.030 fichas publicadas con el texto que quede.

## 1. Arquitectura común (se construye una vez)

- **Runtime:** Supabase Edge Functions (Deno) + API de Claude, el mismo patrón de `meta-agent` y `radar-oportunidades`. Modelo chico (Haiku) para clasificar/extraer, modelo grande (Sonnet) para redactar. Cada llamada registra `modelo` y `tokens` en `agente_tareas` para que el costo real se vea en el dashboard, no se estime.
- **Librería compartida** `supabase/functions/_shared/agente.ts`: `iniciarTarea()`, `proponer()` (crea la fila pendiente), `registrarError()`, `claude()` con salida JSON validada, `enHorario()` (Lun–Vie 10–18, Sáb 10–15:30, usa `crm_in_business_hours` que ya existe).
- **Ejecución al aprobar:** trigger en `agente_tareas` cuando pasa a `aprobada`/`editada` → `crm_enqueue()` en `crm_outbox` (cola que ya existe, con reintentos y backoff) → `crm-outbox-worker` ejecuta. Se agregan tipos a `crm_outbox.kind`: `whatsapp_enviar`, `meli_publicar`, `pdf_cotizacion`, `telegram_aprobacion`.
- **Pruebas sin ensuciar producción:** como ningún agente envía nada sin tu aprobación, se pueden correr sobre tus datos reales (los 5 leads vencidos, los 1.030 repuestos) y las propuestas se rechazan. No hace falta inventar datos. Lo que sí: `customers.is_test = true` para clientes de prueba, excluidos de las vistas.

## 2. Ficha por agente

Formato: **Disparador · Entradas · Salidas · Requiere tu aprobación · Estado hoy**.

### VENTAS (se construyen primero, en este orden)

**1. Recepcionista**
- Disparador: mensaje entrante (webhook Meta para IG/Messenger hoy; WhatsApp cuando esté la API; `quote_requests` del sitio ya entra solo).
- Entradas: texto/foto del cliente, historial de `crm_messages`, `v_repuestos` (búsqueda por modelo, año, número de parte, sinónimos de `part_catalog.como_busca`).
- Salidas: `customers` (vía `crm_resolve_customer`, ya existe), `crm_conversations` con `pieza_buscada`, `vehiculo_buscado`, `product_id` si hay match, etapa `consulta_disponibilidad` o `cotizacion_solicitada`; `crm_messages` con `sender_type='ia'`.
- Responde solo (regla 3): horario, dirección, cómo comprar/enviar, "sí, tenemos X" cuando `v_repuestos.estado='disponible'` y el match es inequívoco (número de parte o modelo+año+pieza únicos). **Nunca** da precio aunque esté en la ficha: lo propone al Cotizador. Si no hay stock: marca `sin_disponibilidad` como motivo tentativo, responde "le aviso apenas entre un X a desarme" y deja tarea `consultar_stock` para ti (puede estar en el patio sin catalogar).
- Aprobación: cualquier respuesta que no sea informativa.
- Hoy: `meta-agent` hace la mitad (sin búsqueda en inventario, sin CRM, sin secretos cargados). Se reescribe sobre la librería común.

**2. Cotizador**
- Disparador: conversación en `cotizacion_solicitada` con `product_id` resuelto, o tú desde el admin ("cotizar").
- Entradas: `crm_conversations`, `v_repuestos` (precio_final **solo si `precio_estado='fijado'`**), `customers`, tus datos de pago (van en `crm_settings`, hoy no están: **los necesito**).
- Salidas: `crm_quotations` + `crm_quotation_items` (ya existen, calculan IVA y total, estado `pendiente_aprobacion`), PDF en bucket `cotizaciones` (rojo/negro/blanco, logo `img/logo/autopartschile-saravia-completo.svg`, datos del local, garantía según categoría, validez 7 días), mensaje corto según tu plantilla de `cotizar-repuesto`. Conversación pasa a `cotizacion_en_preparacion` y, al aprobar, a `cotizacion_enviada`.
- Aprobación: siempre (precio y envío). Si el repuesto está `precio_pendiente`, primero te pide fijar precio (la cola muestra `precio_sugerido` y el rango de mercado).
- Hoy: la parte SQL existe (`crm_quotations`, `crm_quote_recalc`, `crm_convert_quotation_to_order`); falta el PDF y la redacción.

**3. Seguimiento**
- Disparador: diario 9:30 (fase 3) o manual.
- Entradas: `v_leads` con `seguimiento_vencido`, `crm_messages` de cada uno, `crm_follow_up_tasks`.
- Salidas: por lead, un diagnóstico (etapa real, por qué no cerró, según tu skill `seguimiento-leads-ventas`) y **un** mensaje propuesto; fila en `agente_tareas` con `propuesta` y enlace `wa.me/<tel>?text=<mensaje>`; actualiza `next_action_at`. Leads con 3 seguimientos sin respuesta → propone cerrar como `cliente_dejo_de_responder`.
- Aprobación: envío siempre. Fuera de horario deja todo listo para las 10:00.
- Hoy: nada automático; los 5 leads web llevan 13 días vencidos.

**4. Red Desarmadurías**
- Disparador: según decisión B.
- Entradas: texto de la solicitud #ID.
- Salidas: `red_solicitudes` (parsea #ID, comuna, modelo, pieza), cruce con `v_repuestos`, `respuesta_propuesta` con precio **solo si fijado**; si hay match crea lead (`crm_conversations.red_solicitud_id`).
- Aprobación: siempre.

### PUBLICACIÓN

**5. Catalogador**
- Disparador: subes fotos de una pieza (desde el admin) indicando el vehículo.
- Entradas: fotos, `vehiculos`, `part_catalog`, `products` del mismo vehículo (para no duplicar: el despiece ya creó la fila sin foto), referencia de mercado (`meli-search` ya existe; Ipar y Yapo según tu skill `precio-mercado-repuestos`, con fuentes y fecha).
- Salidas: lee el número de parte si es visible en la foto (visión; si no se ve, lo deja vacío y te lo dice, **no lo inventa**), propone nombre, categoría, compatibilidades, condición y `precio_sugerido` con el rango de mercado en `metadata.precio_mercado`. Deja el `product` en `precio_estado='pendiente'`.
- Aprobación: precio (regla 2). Valida regla 1 y reporta qué falta.

**6. Diseñador**
- Disparador: producto con foto y precio fijado.
- Entradas: foto de la pieza (sin recortar), portadas de los autos compatibles (`img/portadas/*`, ya hay 38), logo, textos de marca de tu skill `plantilla-fotos-desarme` (Oswald, rojo 216,0,2).
- Salidas: `imagen_promocional_url` (pieza grande arriba, autos compatibles abajo, logo, precio NO quemado para no desactualizarse) en bucket `product-images`. Sin IA generativa sobre la pieza.
- Aprobación: no (es una imagen que tú revisas antes de publicar). Técnica: composición con ImageScript en Deno; si no alcanza la calidad, función Netlify con `sharp`.

**7. Publicador**
- Disparador: tú marcas "publicar" o el Catalogador termina.
- Entradas: `v_repuestos` con `bloqueos_publicacion = '{}'`.
- Salidas: fila en `publicaciones` por canal con título/texto según tu ficha SEO/GEO (`publicar-repuestos-marketplace`). **Mercado Libre: automático** vía `meli-publish` (existe) al aprobar. **Marketplace, grupos y muro: Meta no da API** → quedan `aprobada` con texto+imagen listos y botón "copiar y abrir" (mejora de `marketplace-plantilla`, que ya existe); al marcarlas tú, pasan a `publicada` con la URL. Instagram/Facebook muro: automatizable con la página de empresa cuando carguemos los secretos de Meta.
- Despublicar: ya lo hace la base (trigger) → cola `despublicar`; ML se pausa solo (`meli_pausar` existe); el resto te lo lista para bajar a mano.
- Aprobación: siempre.

### DESARME E INVENTARIO

**8. Ingreso de vehículo**
- Disparador: registras un auto (admin `despiece.html`).
- Hoy **ya existe**: `generar_despiece`/`aplicar_despiece` crean las piezas estándar por tracción/caja/combustible desde `part_catalog`; con la fase 1 nacen `precio_pendiente` automáticamente. Falta: pedir patente/VIN, `costo_compra`, `ubicacion`, y registrar la corrida en `agente_tareas`. Trabajo chico.

### COMPRAS

**9. Radar**
- Hoy roto (0 resultados de ML en toda su vida). Se reescribe: búsqueda ML **autenticada** con tu `meli_account` (la pública ya no responde), marcas foco + año ≥ 2000, puntaje con Claude como ahora, escribe `oportunidades`, aviso al celular solo si `score ≥ 70`. Tú decides en `oportunidades.decision`; si compras, se crea el `vehiculo` enlazado. **Pregunta:** ¿de dónde salen las 62 oportunidades `fuente=facebook`? Ese proceso no está en Supabase.
- Aprobación: no envía nada a terceros.

### LOGÍSTICA

**10. Despacho**
- Disparador: `orders.status='completed'` con `delivery_method='home_delivery'`.
- Entradas: pedido, cliente, dirección. Starken y DHL **no tienen API abierta para cuentas pyme**: no crea la orden.
- Salidas: ficha lista para pegar en Starken/MyDHL (tu formato de `despacho-starken`), valida RUT y teléfono, pide por mensaje los datos que falten, y cuando tú ingresas el N° de seguimiento guarda `orders.tracking_number`/`carrier` y propone el aviso al cliente. Internacional: valida país, propone DHL y recuerda WU/Mercado Pago.
- Aprobación: mensajes al cliente.

### ADMINISTRACIÓN

**11. Cierre del día**
- Disparador: Lun–Vie 18:15, Sáb 15:45 (fase 3).
- Entradas: `v_ventas` (hoy), `v_leads` (nuevos hoy, sin respuesta, seguimientos de mañana), `crm_payments` pendientes, `orders` por despachar, `v_repuestos` (publicadas hoy, `precio_pendiente`), `v_equipo_ia`, descuadres (vendidas con stock en ML/web).
- Salidas: resumen al celular (push) con tus 7 secciones de `cierre-del-dia`; fila en `agente_tareas`. Cada número viene de una vista; si una sección no tiene datos dice "0" o "no medido", nunca inventa.
- Aprobación: no (es solo para ti).

**12. Auditor semanal**
- Disparador: lunes 8:00.
- Entradas: `v_leads` perdidos de la semana y motivos, `v_repuestos` con `dias_en_stock > 60` y sin venta, repuestos con `bloqueos_publicacion` hace > 7 días, `agente_tareas` con errores, inconsistencias (garantía, precios ML vs web).
- Salidas: informe con tu formato de `auditoria-mejora-continua`: veredicto en 3 líneas, 3 mejoras concretas con responsable y plazo. Aviso al celular + `agente_tareas`.
- Aprobación: no.

### GRÚAS

**13. Cotizador de grúa**
- **Ya existe** en el proyecto `gruas-saravia` (`quotes`, `pricing_config`, peajes, TAG, `requires_human_review`). No lo duplico. En fase 4 el dashboard lo lee con una segunda conexión. Si quieres que proponga precio con Claude además de la tarifa por km, es un ajuste ahí, no aquí.

## 3. Orden de construcción y qué te muestro en cada paso

| Paso | Qué | Prueba que te muestro |
|---|---|---|
| 2.0 | Librería común + trigger aprobación→`crm_outbox` + cargar secretos faltantes (Meta) | Una tarea de prueba aprobada por ti llega como notificación al celular |
| 2.1 | **Seguimiento** (es el de mayor impacto inmediato: 5 leads vencidos reales y cero dependencias externas) | Los 5 diagnósticos y mensajes propuestos, con enlace `wa.me` listo |
| 2.2 | **Cotizador** (PDF + mensaje) | Una cotización real en PDF para uno de esos leads, en estado `pendiente_aprobacion` |
| 2.3 | **Recepcionista** (IG/Messenger + web; WhatsApp cuando decidas A) | Conversación de prueba desde tu Instagram: lead creado, pieza buscada estructurada, respuesta informativa |
| 2.4 en adelante | Catalogador → Diseñador → Publicador → Radar → Despacho → Cierre → Auditor → Ingreso | Uno a la vez, cada uno con su corrida sobre datos reales |

Cambio respecto a tu orden: pediste Recepcionista primero. Lo pongo tercero porque depende de la decisión A (WhatsApp) y de secretos de Meta que hoy no están; Seguimiento y Cotizador se pueden terminar y probar esta misma semana sin esperar a nadie.

## 4. Lo que necesito de ti para empezar

1. OK a este plan (o cambios).
2. Decisión A (WhatsApp) y fuente de la Red (B). Confirmación de la política de garantía (C).
3. Datos de transferencia para las cotizaciones (banco, tipo de cuenta, N°, RUT, correo) → van a `crm_settings`, no al código.
4. Los secretos de Meta (`META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_VERIFY_TOKEN`). Se cargan como secretos de Supabase; yo no los veo en el chat.
5. Confirmar la migración 1b pendiente (Supabase te pide aprobar `drop policy`/`revoke`).
