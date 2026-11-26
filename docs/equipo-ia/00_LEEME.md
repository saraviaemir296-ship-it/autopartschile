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
| Diseñador (editor de imagen promocional) | `admin/disenador.html` | publicado. Plantilla 1080×1350: foto completa sin recortar, nombre, N° OEM, compatibilidad, auto de origen abajo (PNG del auto si se sube; si no, su foto), precio y garantía. Lote automático para todas las piezas listas. Hoy 0 piezas tenían imagen promocional: era lo que bloqueaba la regla 1 en todo el catálogo |
| Precio de mercado | edge function `precio-mercado` + cron `precio-mercado-semanal` (lunes 8:40) | desplegado y **bloqueado por Mercado Libre**: la API responde `403 forbidden` a `/sites/MLC/search` con el token de la cuenta (las demás funciones ML sí andan: es permiso de la app). Cuando ML habilite la búsqueda, el agente guarda la mediana en `metadata.precio_mercado`, sugiere precio a las pendientes y propone bajar las que están 30 % sobre el mercado (regla 2: tú fijas). Tarea `sistema · mercadolibre_busqueda_bloqueada` en la cola con los pasos |

Correcciones honestas del informe: de los 7 pedidos web "pagados", 2 son pruebas internas ($1.000 y $50) y 4 son el mismo producto "Bobinas de encendido" de septiembre; la única venta web real reciente ($60.000, 18-nov) sí estaba anotada en caja. La homocinética del pedido #57 (Mercado Pago pendiente) la pagó el cliente por transferencia el mismo día (caja #202): la propuesta del Recuperador se expiró y la función ahora revisa la caja antes de proponer.
