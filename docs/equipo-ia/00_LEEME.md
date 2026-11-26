# Equipo IA · Desarmaduría Saravia

Documentación de trabajo del "equipo de empleados IA" sobre la base única (Supabase `autopartschile-ai`).

| Archivo | Qué es |
|---|---|
| `fase1_estado_actual.md` | Levantamiento de lo que ya existe en la base (tablas, crons, agentes, datos) y hallazgos |
| `fase1_plan.md` | Plan de la fase 1, decisiones de diseño explicadas y preguntas para Emir |
| `fase1_diagrama.md` | Diagrama de relaciones (mermaid) del modelo resultante y catálogo de vistas |
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

**Desplegado y programado (corre solo):**
- `seguimiento-leads` (edge function, v2) · pg_cron `seguimiento-leads-diario` 9:30 Chile L–S. Primera corrida: leyó los 5 leads vencidos y falló en la llamada a Claude por falta de `ANTHROPIC_API_KEY` (los 5 errores quedaron registrados en `agente_tareas`, como debe ser).
- `cierre_del_dia()` (SQL) · pg_cron L–V 18:15 y Sáb 15:45 Chile. Primera corrida real OK; el aviso quedó encolado en `crm_outbox` y no salió por falta de `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
- Cola de aprobación conectada: cada propuesta avisa por Telegram; aprobar un cierre lo aplica en el CRM.

- `auditor_semanal()` (SQL) · pg_cron lunes 8:00 Chile. Primera corrida real OK (ver agente_tareas).
- **Centro de Mando (fase 4)**: `admin/equipo-ia.html`, oscuro, rojo/blanco, para celular. Lee `dashboard_equipo_ia()` (solo datos reales) y permite: fijar precios pendientes, aprobar/editar/rechazar propuestas de agentes, enviar por WhatsApp con un toque (`wa.me`) y marcar enviado, aprobar publicaciones, decidir oportunidades del radar y cargar costo de compra por vehículo. Enlazado desde el admin. **Se publica cuando esta rama llegue a la rama principal del sitio (Netlify).**

**Bloqueado por secretos que solo Emir puede cargar** (Supabase → Edge Functions → Secrets): `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Hallazgo: ninguno de los agentes IA de este proyecto (`meta-agent`, `radar-oportunidades`) ha tenido jamás la llave de Anthropic; nunca han razonado nada.
