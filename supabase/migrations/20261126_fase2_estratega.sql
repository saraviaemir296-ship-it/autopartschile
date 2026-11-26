-- Fase 2 · Estratega "mente maestra" (26-nov-2026). Aplicado vía MCP; este archivo es el respaldo.
-- Pedido de Emir: "haz un Alex Hormozi igual que ayude con la empresa, una mente maestra que analice y me ayude a
-- mejorar todo, cuellos de botella, con los más grandes empresarios". Prompt: docs/equipo-ia/mente_maestra_prompt.md.
--
-- estratega_dossier(): texto con TODOS los números reales (caja, inventario, autos, leads, canales, equipo, oferta).
-- Edge function `estratega` (supabase/functions/estratega): dossier → Claude (mente maestra, 10 lentes) → informe
-- en agente_tareas (informe_semanal) + cada acción como tarea con aprobación. Sin ANTHROPIC_API_KEY deja el dossier
-- listo para pegar a mano (dossier_semanal). Cron `estratega-semanal`: lunes 10:30 UTC = 7:30 Chile.
-- Además: caja_venta_proponer() ya no propone ventas anuladas (reverses_id), y el escritorio Dropi se eliminó
-- (pedido de Emir; Dropi no se pudo verificar desde esta sesión).

-- (definición exacta de estratega_dossier() tal como quedó aplicada)
-- ver pg_get_functiondef('public.estratega_dossier()') en la base; copia literal:
select cron.schedule('estratega-semanal', '30 10 * * 1', $$select public.agente_lanzar('estratega','estratega')$$);
update public.agentes set construido = true, programacion = 'lunes 7:30 · con ANTHROPIC_API_KEY analiza; sin clave deja el dossier listo para pegar' where codigo = 'estratega';
delete from public.agentes where codigo = 'dropi' and not exists (select 1 from public.agente_tareas where agente = 'dropi');
