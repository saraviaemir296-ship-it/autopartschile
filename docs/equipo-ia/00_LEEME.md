# Equipo IA · Desarmaduría Saravia

Documentación de trabajo del "equipo de empleados IA" sobre la base única (Supabase `autopartschile-ai`).

| Archivo | Qué es |
|---|---|
| `fase1_estado_actual.md` | Levantamiento de lo que ya existe en la base (tablas, crons, agentes, datos) y hallazgos |
| `fase1_plan.md` | Plan de la fase 1, decisiones de diseño explicadas y preguntas para Emir |
| `fase1_diagrama.md` | Diagrama de relaciones (mermaid) del modelo resultante y catálogo de vistas |
| `operacion_whatsapp.md` | Auditoría total de WhatsApp Business: cómo se ejecuta en el PC y cómo queda registrada chat por chat en la base (categorías, archivado, oportunidades, informe de 10 puntos) |
| `rendimiento_web_y_marketing.md` | Rendimiento real del sitio (Netlify + base), anuncios Meta, Mercado Libre, redes y SEO/GEO, con lo que falta conectar |
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
