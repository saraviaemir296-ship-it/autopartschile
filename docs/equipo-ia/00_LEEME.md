# Equipo IA · Desarmaduría Saravia

Documentación de trabajo del "equipo de empleados IA" sobre la base única (Supabase `autopartschile-ai`).

| Archivo | Qué es |
|---|---|
| `fase1_estado_actual.md` | Levantamiento de lo que ya existe en la base (tablas, crons, agentes, datos) y hallazgos |
| `fase1_plan.md` | Plan de la fase 1, decisiones de diseño explicadas y preguntas para Emir |
| `fase1_diagrama.md` | Diagrama de relaciones (mermaid) del modelo resultante y catálogo de vistas |
| `operacion_whatsapp.md` | Auditoría total de WhatsApp Business: cómo se ejecuta en el PC y cómo queda registrada chat por chat en la base (categorías, archivado, oportunidades, informe de 10 puntos) |
| `rendimiento_web_y_marketing.md` | Rendimiento real del sitio (Netlify + base), anuncios Meta, Mercado Libre, redes y SEO/GEO, con lo que falta conectar |
| `../../supabase/migrations/20261126_fase2_todas_las_areas.sql` | Todos los ámbitos en una oficina (APLICADA 26-nov): FK agente→agentes, escritorios Recuperador de pagos, Finanzas, Ads, Grupos FB, Dropi, Precio de mercado, Estratega; tabla `ads_metricas`; dashboard con caja real y anuncios |
| `fase2_plan.md` | Plan de la fase 2: arquitectura común, ficha de cada agente (disparador, entradas, salidas, aprobación), orden de construcción y decisiones pendientes |
| `../../supabase/migrations/20261126_fase1_base_central.sql` | Migración de la fase 1 (APLICADA 26-nov-2026) |
| `../../supabase/migrations/20261126_fase1b_correcciones.sql` | Correcciones post-verificación (PENDIENTE: requiere confirmación en Supabase) |

Estos documentos no se publican en el sitio (bloqueados en `netlify.toml`).

## Fase 2 · estado real (26-nov-2026)

| Archivo | Qué es |
|---|---|
| `../../supabase/functions/_shared/agente.ts` | Librería común: registro en `agente_tareas`, propuestas con aprobación, llamada a Claude con JSON validado, horario, garantía por tipo de pieza, enlace `wa.me` |
| `../../supabase/functions/seguimiento-leads/index.ts` | Agente Seguimiento (fase 2.1): diagnostica leads vencidos y propone un mensaje o un cierre por lead |
| `../../supabase/migrations/20261127_fase2_0_cola_aprobacion.sql` | Aprobar una tarea encola su ejecución en `crm_outbox`; cada propuesta avisa por Telegram |

**Agentes encadenados en SQL (26-nov, corren hoy sin IA):** Recepcionista (empareja lead con stock), Cotizador (cotización + mensaje), Publicador (textos por canal), Ingreso de vehículo (propone despiece), Despacho (ficha Starken/DHL, retiro, aviso de seguimiento), Radar→compra→vehículo, Diseñador y Catalogador como tareas humanas, Importaciones OEM (ETA y recepción) y demanda sin stock. Detalle en `supabase/migrations/20261126_fase2_agentes_encadenados.sql`.

**Desplegado y programado (corre solo):**
- `seguimiento-leads` (edge function, v2) · pg_cron `seguimiento-leads-1h`: cada hora de 9:00 a 20:00 Chile, L–S (pedido de Emir 26-nov; idempotente, no duplica propuestas). Primera corrida: leyó los 5 leads vencidos y falló en la llamada a Claude por falta de `ANTHROPIC_API_KEY` (los 5 errores quedaron registrados en `agente_tareas`, como debe ser).
- `cierre_del_dia()` (SQL) · pg_cron L–V 18:15 y Sáb 15:45 Chile. Primera corrida real OK; el aviso quedó encolado en `crm_outbox` y no salió por falta de `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
- Cola de aprobación conectada: cada propuesta avisa por Telegram; aprobar un cierre lo aplica en el CRM.

- `auditor_semanal()` (SQL, ventana móvil de 7 días) · pg_cron `auditor-diario`: todos los días 8:00 Chile, L–S (pedido de Emir 26-nov). Primera corrida real OK (ver agente_tareas).
- **Pestaña Oficina del Centro de Mando**: la "oficina virtual": un escritorio por agente (14, catálogo en tabla `agentes`) con estado real y un feed en vivo (Realtime) de cada acción registrada en `agente_tareas`. Los agentes no construidos se ven en gris punteado; no se simula actividad.
- **Pestaña WhatsApp del Centro de Mando**: abrir/cerrar auditoría, importar chats revisados (JSON por línea), oportunidades comerciales, dudosos, últimos registrados. El agente Seguimiento toma los leads calientes/pendientes importados en su próxima corrida horaria.
- **Centro de Mando (fase 4)**: `admin/equipo-ia.html`, oscuro, rojo/blanco, para celular. Lee `dashboard_equipo_ia()` (solo datos reales) y permite: fijar precios pendientes, aprobar/editar/rechazar propuestas de agentes, enviar por WhatsApp con un toque (`wa.me`) y marcar enviado, aprobar publicaciones, decidir oportunidades del radar y cargar costo de compra por vehículo. Enlazado desde el admin. **Se publica cuando esta rama llegue a la rama principal del sitio (Netlify).**

**Canal de avisos (26-nov, Emir descartó Telegram):** notificaciones web push al celular desde el propio Centro de Mando. Cola `avisos` → edge function `avisos-worker` (cada 2 min) → navegador del celular (service worker `admin/sw.js`, manifest PWA). Llaves VAPID generadas por el proyecto: pública en `crm_settings`, privada en Vault. Botón "Activar avisos" / "Probar aviso" en el panel. En iPhone requiere "Agregar a pantalla de inicio". Los avisos Telegram pendientes quedaron descartados; las alertas internas del CRM (`crm_generate_alerts`) siguen apuntando a Telegram y se migran en la siguiente tanda.

**Bloqueado por un secreto que solo Emir puede cargar** (Supabase → Edge Functions → Secrets): `ANTHROPIC_API_KEY`. Sin ella los agentes que redactan (Seguimiento, y luego Cotizador y Recepcionista) fallan y lo registran. Hallazgo: ninguno de los agentes IA de este proyecto (`meta-agent`, `radar-oportunidades`) ha tenido jamás esa llave; nunca han razonado nada.

## Todos los ámbitos del negocio (26-nov, tarde)

Pedido de Emir: "que haya para todos los ámbitos de mi empresa, todos mezclados entre sí" y "soluciona eso" (las fugas de plata).

**Construidos y corriendo solos:**
- **Recuperador de pagos** (`recuperador_pagos_revisar()`, cada hora 9:30–20:30 Chile L–S): pedidos web que llegaron al pago y no se completaron en los últimos 14 días → propone el WhatsApp (requiere OK). Excluye pruebas, correos de admins, WooCommerce y clientes que después sí compraron. Al aprobar deja huella en el pedido; el envío lo haces tú desde el enlace. Primera corrida: 1 propuesta real (pedido #57, $90.000).
- **Finanzas** (`finanzas_resumen()` + `finanzas_revisar()`, diario 8:20): lee el esquema `finance` de finance-bot. Ventas, gastos, autos comprados, disponible por cuenta, por cobrar, obligaciones. Avisa al celular si hay 2+ días sin registrar, obligación a 7 días o gastos > ventas. Verificado contra los asientos (partida doble cuadra).
- **Ads (Meta)**: lectura real de la API hecha en esta sesión guardada en `ads_metricas` (11 campañas, 90 días). Dos propuestas en la cola: pausar 3 campañas activas sin gasto, y mover el destino de los anuncios a WhatsApp. La conexión automática sigue pendiente de la cuenta de anuncios.
- Centro de Mando: pestaña Resumen con "Caja real" y "Anuncios Meta"; la oficina pixel crece con la cantidad de escritorios (antes se rompía pasando de 16).

**Vacantes con el motivo exacto (se ven en gris en la oficina):** Estratega (clave Anthropic), Precio de mercado (sin fuente de precios), Dropi (API key), Grupos de Facebook (Meta no da API para grupos; se opera desde el celular con los textos del Publicador), Redes sociales y SEO/GEO (tokens Meta / Search Console).

**En la cola de aprobación para Emir:** 1 recuperación de pago, 2 propuestas de Ads, 1 tarea de sistema con los 4 secretos que faltan.

**Cómo ver el panel:** sigue sin estar en producción. Netlify solo publica la rama principal y no hay despliegues por rama; la red de esta sesión no alcanza autopartschile.cl ni netlify.app para verificar. Opciones: Emir responde "integra" (se fusiona a la rama principal) o activa "Branch deploys: all" en Netlify → Site configuration → Build & deploy, y la rama queda en `claude-autopartschile-ai-team-64yelo--stupendous-custard-ca782a.netlify.app`.

## 26-nov (noche) · publicado en el sitio, caja conectada, GEO, Diseñador, Precio de mercado

Pedido de Emir: "aumenta el GEO a más no poder", "editor de fotos con N° OEM, compatibilidad y foto del vehículo", "investigar precio de mercado", "hasta el bot de finanzas conectado para que sepa qué se vendió y se marque vendido en el sitio", y "coloquemos esa wea funcionando" (tras pedir 3 veces ver la oficina → se fusionó la rama a la principal; Netlify la publicó).

| Pieza | Dónde | Estado |
|---|---|---|
| Centro de Mando en producción | `autopartschile.cl/admin/equipo-ia.html` | publicado (deploy Netlify listo) |
| Caja → inventario | `supabase/migrations/20261126_fase2_caja_inventario.sql` | aplicado. Cada venta anotada en finance-bot propone marcar la pieza vendida en la web (46 propuestas de noviembre en cola); pedido web pagado sin anotar → propone registrarlo en caja con asiento igual al del bot; lote de auto comprado → propone cargar costo de compra (7 propuestas) |
| GEO | `robots.txt`, `netlify/functions/llms-full.js` (`/llms-full.txt`), `llms.txt`, `netlify/functions/repuesto.js` | publicado. Bots de IA explícitos; catálogo completo legible en vivo; Product con Vehicle/motor/años, política de devolución, despacho, validez de precio, redes; resumen en lenguaje claro en cada ficha |
| Diseñador (editor de imagen promocional) | `admin/disenador.html` | publicado. Plantilla 1080×1350: foto completa sin recortar, nombre, N° OEM, compatibilidad, auto de origen abajo (PNG del auto si se sube; si no, su foto), precio y garantía. Lote automático para todas las piezas listas. Corrección: 64 piezas ya tenían imagen promocional (generadas entre el 14 y el 25-nov con la herramienta anterior); las otras ~1.000 no, y eso es lo que bloquea la regla 1 en casi todo el catálogo |
| Precio de mercado | edge function `precio-mercado` + cron `precio-mercado-semanal` (lunes 8:40) | desplegado y **bloqueado por Mercado Libre**: la API responde `403 forbidden` a `/sites/MLC/search` con el token de la cuenta (las demás funciones ML sí andan: es permiso de la app). Cuando ML habilite la búsqueda, el agente guarda la mediana en `metadata.precio_mercado`, sugiere precio a las pendientes y propone bajar las que están 30 % sobre el mercado (regla 2: tú fijas). Tarea `sistema · mercadolibre_busqueda_bloqueada` en la cola con los pasos |

Correcciones honestas del informe: de los 7 pedidos web "pagados", 2 son pruebas internas ($1.000 y $50) y 4 son el mismo producto "Bobinas de encendido" de septiembre; la única venta web real reciente ($60.000, 18-nov) sí estaba anotada en caja. La homocinética del pedido #57 (Mercado Pago pendiente) la pagó el cliente por transferencia el mismo día (caja #202): la propuesta del Recuperador se expiró y la función ahora revisa la caja antes de proponer.

**26-nov, mediodía.** Aprobaciones en lote en el Centro de Mando (tareas repetidas del mismo agente y publicaciones por canal), con confirmación: sigue siendo el sí de Emir, en un toque. Captura real del panel renderizada con los datos de la base (Playwright + stub de supabase-js): 25 escritorios, caja real, 11 campañas, 4 lotes; sin errores de consola. WhatsApp Business: no hay nada que revisar desde el sistema (0 chats importados, 0 conversaciones de WhatsApp en el CRM, `wa_conversation_summary` solo tiene pruebas de junio); el camino sigue siendo la operación en el PC descrita en `operacion_whatsapp.md` o conectar la Cloud API.

## 26-nov, tarde · "aprueba todo por tu cuenta", Dropi fuera, Estratega (mente maestra)

Emir delegó las aprobaciones ("aprueba todo por tu cuenta si eres full inteligente"). Se revisaron una por una, no a ciegas; cada decisión quedó marcada en `agente_tareas.salida.decidido_por = ia_delegada_por_emir`:
- Ventas de caja → vendidas en la web: 16 aprobadas (4 con el SKU corregido a mano), 21 rechazadas con motivo (pieza equivocada, auto distinto —el Swift "gris oscuro de 750.000" no está en el sistema—, duplicados, una venta anulada). 22 piezas quedaron vendidas y pausadas en ML. 8 quedaron pendientes para Emir porque hay dos candidatos plausibles.
- 7 lotes de autos vinculados: `vehiculos.costo_compra` cargado en 7 autos ($4.400.000).
- 183 publicaciones aprobadas (61 piezas × 3 canales); 3 piezas se rechazaron solas porque ya no tenían stock. Aprobar no publica: Mercado Libre se publica desde el admin de ML y Marketplace/grupos desde la plantilla.
- Meta Ads: las 3 campañas activas sin gasto (Kia Optima, Alto 800, Chevrolet Lumina) se pausaron de verdad por la API (26-nov).
- Quedaron para Emir: 4 "sin stock" del Recepcionista (necesitan saber si la pieza está en el patio), 1 elegir repuesto, los 2 secretos, el permiso de búsqueda de ML.
- Dropi: escritorio eliminado. No se pudo verificar el catálogo de Dropi desde esta sesión (sin red): si Dropi tiene autopartes para dropshipping, se vuelve a crear.

**Estratega (mente maestra)**: `estratega_dossier()` + edge function `estratega` + cron lunes 7:30 + prompt en `docs/equipo-ia/mente_maestra_prompt.md` (10 lentes: Hormozi, Goldratt, Ohno, Bezos, Munger/Buffett, Drucker, Kennedy/Halbert, Walton, Grove, Naval). Sin clave de Anthropic deja el dossier listo para pegar (tarea #204, botón "copiar" en el Resumen del panel). El primer informe lo redactó esta sesión sobre ese dossier y quedó como `informe_semanal` con 3 acciones en la cola (aprobar = comprometerse). Bloque "Mente maestra" en la pestaña Resumen.

## 26-nov, tarde 2 · recepción unificada (Messenger, Instagram, WhatsApp) y agentes puestos a trabajar

- `supabase/functions/_shared/recepcion.ts`: motor común de recepción. Registra cada mensaje en `crm_conversations`/`crm_messages`, recoge marca, modelo, año, VIN o patente, foto y pieza (`crm_conversations.datos_recepcion`), responde solo lo informativo y el stock con precio fijado (regla 3), detecta intención de compra ("la quiero", "cómo pago") → etapa `intencion_compra` + tarea para Emir, deja `next_action_at` para que el Seguimiento retome a las 24 h.
- `meta-agent` v12 (Messenger + Instagram) y `whatsapp-webhook` v2 usan ese motor. El meta-agent anterior (Claude + Telegram, sin secretos desde julio) quedó reemplazado. Ambos fallan cerrado sin `*_APP_SECRET`.
- "Pon a todos los agentes a trabajar" (26-nov 12:30 UTC): auditor diario, Mercado Libre (1 tarea: 23 pausadas con stock), Importaciones (0), Recuperador (0), Ingreso de vehículo en los 21 autos en desarme (Kia Optima: despiece de 156 piezas propuesto; 9 autos con datos técnicos faltantes), Estratega (dossier), Finanzas (resumen). Seguimiento y Precio de mercado siguen bloqueados (clave Anthropic / permiso ML).

## 26-nov, tarde 3 · rol empleado

Emir: "hago todo esto hoy mismo". Para que sus empleados partan hoy: tabla `empleados` + `is_staff()`, políticas y candados (no tocan precios ni borran; publicaciones solo aprobada→publicada), RPC para dar/quitar acceso desde la propia pantalla Hoy (bloque solo para el admin), ubicación física editable en línea en las tarjetas de Hoy. `requireStaff()` en Hoy, Diseñador y ficha de producto; `requireAdmin()` redirige a los empleados a Hoy. Flujo: invitar al empleado en Supabase → Authentication → Invite user; cuando tenga clave, "Dar acceso" en Hoy.

## 26-nov, noche · "Sigue construyendo": cierre con caja, precio por antigüedad, Redes, Catalogador con visión
- **Cierre del día** ahora abre con la caja real del finance-bot (ventas, gastos, movimientos) y una línea de **conciliación**: ventas web sin anotar en caja y ventas de caja sin marcar en inventario. Agrega el tiempo promedio de primera respuesta de los chats del día. Probado en seco el 26-nov: 1 pedido pagado sin N° de seguimiento (#56), 1 descuadre (piola SX4 vendida con stock), 9 ventas de caja esperando que Emir diga qué pieza fueron.
- **Precio por antigüedad** (martes 8:50): piezas con precio fijado y más de 60 días paradas → una propuesta por auto con -10 % (60-89 días) o -20 % (90+). Emir aprueba el lote, edita "SKU=precio" por línea, o rechaza. Primera ronda: 8 autos propuestos. No toca piezas con precio pendiente ni vendidas.
- **Redes sociales**: cada auto que entra a desarme genera el texto del post (piezas destacadas, garantía, WhatsApp, hashtags). Aprobar = lo publicas desde el celular con un reel o 3 fotos. Primera corrida: 10 autos de las últimas 2 semanas. Cuando existan tokens de Meta, se publica solo.
- **Catalogador con visión** (`catalogador-vision`, 10:10 L-S): lee el N° de parte en las fotos de hasta 15 piezas al día y lo propone; al aprobar queda en la ficha y la pieza puede publicarse. Hay 123 piezas con foto y sin N° de parte en la cola. Necesita `ANTHROPIC_API_KEY` (tarea "configurar" pendiente para Emir con los 3 pasos).
- Archivo: `supabase/migrations/20261126_fase4_cierre_antiguedad_redes_vision.sql` (notas; las funciones viven en la BD).

## 26-nov, noche 2 · Responder a clientes con botones
- En **Hoy** y en el **Centro de Mando** cada cliente que espera respuesta aparece como una tarjeta con lo que pidió, el auto, los datos que ya mandó (año, patente, VIN, foto) y su último mensaje. Abajo cuatro botones: **Tenemos**, **No tenemos**, **Faltan datos**, **Otro**.
- **Tenemos** muestra las piezas candidatas en stock con precio y ubicación (o un buscador por nombre/SKU/N° de parte), el precio al cliente (un empleado solo puede usar precios ya fijados; Emir puede cambiarlo y queda fijado) y arma el mensaje con garantía según el tipo de pieza, retiro y envío.
- **No tenemos** y **Faltan datos** arman el mensaje solos. **Otro** deja escribir libre. El texto siempre se puede editar antes de enviar.
- **Enviar por WhatsApp** registra el mensaje en el CRM (etapa, precio cotizado, pieza, siguiente acción en 24 h para el Seguimiento), cierra la tarea y abre WhatsApp con el texto escrito. Messenger/Instagram quedan en cola: se envían solos cuando estén los tokens de Meta; mientras, "Copiar" y pegar en el inbox.
- Probado en seco con las conversaciones reales pendientes (Patricia, foco SX4 a $79.990; yobany, soporte de selectora sin stock). Archivo: `supabase/migrations/20261126_fase4_responder_interactivo.sql`.
- Botón **Va en conjunto** (26-nov, 11:00): para piezas que no se venden sueltas (el soporte de selectora del Swift va en la caja). Eliges el conjunto que la incluye y el mensaje sale: "no se vende suelta, viene integrada en <conjunto>, y esa sí la tenemos completa a $X".

## 26-nov, mediodía · revisión de errores reales y hallazgos
- **Seguimiento sin clave de Anthropic**: antes fallaba 15 veces al día ("ANTHROPIC_API_KEY no configurada"). Ahora, sin clave, usa plantillas por etapa (cotización enviada → "¿pudiste verla?"; intención de compra → datos de pago; calificación → pide año/patente; 3 seguimientos sin respuesta → propone cerrar). Con la clave vuelve a redactar con IA. No inventa precio: solo usa el precio fijado del repuesto asociado.
- **Hallazgo que no se arregla con código**: el formulario de cotización web generó 5 solicitudes en 2 meses (28-sep a 9-nov). La cañería al CRM funciona (trigger `crm_quote_requests_after`); el problema es tráfico. Eso lo tiene que mirar el Estratega y Ads, no la recepción.
- **62 piezas listas para publicar** (foto, N° de parte, precio fijado) solo esperan la imagen promocional: en `/admin/disenador.html` el botón "⚡ Generar todas las listas" las hace en lote. Y hay 183 publicaciones aprobadas esperando que alguien las pegue en Marketplace/grupos desde Hoy.

## 26-nov, tarde · Cerrador de ventas y revisión de WhatsApp
- **Cerrador de ventas** (nuevo agente 🤝, 10:40 L-S): toma lo que ya está cotizado o con intención de compra y propone el mensaje de cierre según la etapa: recapitula valor y garantía, escasez real (pieza única), responde objeciones de precio / compatibilidad / calidad, pide el pago o la reserva. Un mensaje, una pregunta. Tras 3 toques sin respuesta propone cerrar como perdido. Nunca inventa precio ni descuento. Las propuestas llegan a Aprobaciones con el botón de WhatsApp. Detalle: `supabase/migrations/20261126_fase4_cerrador.sql`.
- Para que el mensaje de pago lleve los datos bancarios, hay que cargar `crm_settings.datos_transferencia` (hoy vacío).
- **Revisión de WhatsApp Business**: no se puede hacer desde la nube. No hay ninguna auditoría registrada en la base (0 chats revisados). Se hace en el PC de Emir con WhatsApp Desktop siguiendo `docs/equipo-ia/operacion_whatsapp.md` (el prompt para pegar está al final de ese documento). Los chats importados caen en el CRM y de ahí los toman Responder, Seguimiento y el Cerrador.
- **Recortador PNG** (nuevo agente ✂️, `/admin/recortador.html`, enlazado desde Hoy y el Admin): quita el fondo de la foto en el navegador (modelo @imgly/background-removal, sin costo por imagen) y guarda PNG transparente. Dos colas: autos sin PNG (alimenta la imagen promocional del Diseñador) y piezas sin foto limpia (Mercado Libre modera las fotos con sellos; el archivo lleva "foto" en el nombre, que es lo que usa meli-publish). Botón "Recortar todas" y registro en `agente_tareas` (recortador / recortar_png) vía RPC `recortador_guardar`. Cola: RPC `recortador_cola`.

## 26-nov, tarde 2 · regla de Emir: nunca mostrar un chat ya respondido
- Las 5 solicitudes de la web ya estaban respondidas por WhatsApp (fuera del sistema); se limpiaron. Tarjetas "Responder" pendientes: 0.
- Por qué pasó: el sistema no ve lo que se responde desde el teléfono mientras WhatsApp no esté conectado por API. Arreglos:
  - Botón **✓ Ya le respondí** por tarjeta y **✓ Ya respondí a todos** arriba de la lista (RPC `responder_marcar_respondido`); dejan la conversación como respondida en el CRM (ya no cuenta en "sin respuesta" del cierre del día).
  - Trigger `trg_msg_saliente_cierra_tarjeta`: cualquier mensaje saliente de una persona cierra la tarjeta sola.
  - `whatsapp-webhook` v3 + `wa_eco_registrar`: cuando WhatsApp esté conectado en coexistencia (webhook `smb_message_echoes`), lo que se responda desde el teléfono cierra la tarjeta automáticamente. Sin probar con tráfico real hasta que estén los secretos.
  - Regla agregada a la auditoría de WhatsApp: "esperando respuesta" es solo cuando el último mensaje es del cliente.

## 26-nov, tarde 3 · WhatsApp por API: corrección importante
- **Coexistencia** (seguir usando la app WhatsApp Business en el teléfono y además la API, con el mismo número) solo se obtiene a través de un proveedor oficial de Meta (Solution Partner / Tech Provider) con Embedded Signup. No se puede activar desde la app propia de Meta: el paso que decía eso en la tarea `activar_bot_whatsapp` estaba mal y se corrigió.
- Sin coexistencia las alternativas son peores: número nuevo (los clientes siguen escribiendo al antiguo) o migrar el número completo a la API (se pierde la app del teléfono).
- Lo que depende de Emir: crear la cuenta en el proveedor, escanear el QR desde la app del teléfono y generar la API key. Lo que hace Claude después: adaptar `whatsapp-webhook` al proveedor (envío y autenticación), pedir la key por el formulario de Supabase y registrar el webhook. El manejo de ecos (`smb_message_echoes`) ya está desplegado.
- Fuentes: documentación de Meta "Onboard WhatsApp Business app users" y documentación de coexistencia de 360dialog.
- **whatsapp-webhook v4** (26-nov): modo 360dialog (coexistencia). Basta el secreto `WHATSAPP_TOKEN` (API key del proveedor). Claude registra el webhook con `select agente_lanzar('sistema','whatsapp-webhook','{"accion":"registrar_webhook"}')` (genera un secreto en `private_config`, tabla solo para service role, y lo exige en el header `x-webhook-secret`) y consulta el estado con `{"accion":"estado"}` (responde qué secretos existen, nunca sus valores). Probado: la consulta de estado responde 200; hoy no hay ningún secreto de WhatsApp cargado. El envío y el registro contra 360dialog están sin probar hasta tener la cuenta.
- Zapier tiene una app "WhatsApp Business" (quedó habilitada, sin cuenta conectada), pero exige un número ya registrado en la API y no entrega coexistencia: no acorta el camino.

## 26-nov, tarde 4 · Hoy arreglado, grupos de Facebook y conocimiento de las skills en los bots
- **Hoy en el celular**: la tarjeta de "Publicar" ya no se aplasta (foto y texto arriba, botones abajo a todo el ancho).
- **📣 Publicar en grupos** (Hoy → tarjeta de cada pieza): elige hasta 6 grupos compatibles por modelo y motor (63 grupos de Chile del mapa de la skill), texto con la primera línea distinta en cada grupo, link con UTM, tope 15 al día y sin repetir el mismo grupo en 7 días. Botones: copiar y abrir grupo, Publicado, Pendiente del admin, Saltar, y guardar el link real del grupo. Facebook no permite publicar en grupos por API: el último clic lo da una persona. Detalle: `supabase/migrations/20261126_fase4_grupos_facebook.sql`.
- **Conocimiento de las skills en los bots**: tabla `conocimiento_agentes` con 13 bloques de reglas. Seguimiento, Estratega y Catalogador las leen antes de cada respuesta con IA; Cerrador y Seguimiento quedaron en máximo 2 seguimientos; la búsqueda del botón "Tenemos" entiende sinónimos chilenos. Visible en Centro de Mando → Equipo → "Lo que saben los agentes". Detalle: `supabase/migrations/20261126_fase4_conocimiento_agentes.sql`.
- **WhatsApp propio y gratis** (26-nov, Emir descartó pagar proveedor): `/admin/whatsapp.html` + `whatsapp-conectar` + `whatsapp-webhook` v5. Con la app propia de Meta y el registro integrado en modo coexistencia, el número sigue en el teléfono y el sistema recibe mensajes, ecos (lo que se responde desde el teléfono) e historial. El historial se importa sin crear tarjetas y solo genera "Responder" donde el cliente escribió último. Falta lo que solo Emir puede hacer en Meta: crear la app, cargar `META_APP_SECRET`, y pasar verificación del negocio y revisión como Proveedor de tecnología. Endpoints de coexistencia sin probar hasta entonces. Detalle: `supabase/migrations/20261126_fase4_whatsapp_propio.sql`.

## 26-nov, noche · aprobar y que el agente publique en TODOS los grupos; bot financiero corregido
- **Grupos**: botón "✅ Aprobar: el agente publica en todos los grupos" en Hoy → cola (`grupos_cola`) con todos los grupos del modelo → el agente (Claude en el Chrome de Emir) la publica uno por uno desde `/admin/grupos-cola.html` con ritmo humano, tope diario y pausa automática si Facebook avisa. Probado con el ECU del Alto 800: 8 grupos en cola, el segundo espera 63 s. Detalle: `docs/equipo-ia/publicar_cola_grupos.md`.
- **Bot financiero (ventas de hoy)**: registró las 2 ventas (eje trasero Swift $300.000 y corte Swift plata 1.4 $150.000). Dos fallas corregidas: el aviso mostraba $0 porque se armaba antes de guardar los montos (ahora el disparador corre al confirmar la transacción) y el emparejador proponía la **puerta trasera** del Swift por el **eje trasero** (ignoraba palabras de 3 letras y contaba el código de motor como pieza). Ahora la pieza principal es obligatoria, los códigos K12B/1.2 no cuentan como pieza y la cilindrada debe coincidir. "Corte" no se adivina (hay varios tipos): Emir aclaró que fue el pilar delantero izquierdo; ninguna de las dos piezas estaba publicada en la web.
