-- FASE 2.0 — Al aprobar una tarea en agente_tareas se encola la ejecución en crm_outbox
-- (cola existente con reintentos). BORRADOR: se aplica con el OK de la fase 2.
--
-- Tipos nuevos de crm_outbox.kind:
--   whatsapp_enviar      -> cuando exista la Cloud API; mientras no, el worker marca la tarea
--                           'ejecutada' solo si Emir la envió por el enlace wa.me (desde el admin).
--   telegram_aprobacion  -> aviso a Emir con botones Aprobar / Editar / Rechazar (fase 3).
--   meli_publicar        -> publica en Mercado Libre vía meli-publish.
--   pdf_cotizacion       -> genera el PDF de una cotización aprobada.

alter table public.crm_outbox drop constraint if exists crm_outbox_kind_check;
alter table public.crm_outbox add constraint crm_outbox_kind_check
  check (kind in ('telegram','meli_pausar','whatsapp_enviar','telegram_aprobacion','meli_publicar','pdf_cotizacion'));

-- Cada propuesta nueva avisa a Emir (fase 3 pone los botones; hoy es texto).
create or replace function public.agente_tareas_notificar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.requiere_aprobacion and new.estado_aprobacion = 'pendiente' and (tg_op = 'INSERT' or old.estado_aprobacion is distinct from 'pendiente') then
    perform public.crm_enqueue('telegram_aprobacion',
      jsonb_build_object('tarea_id', new.id, 'agente', new.agente, 'accion', new.accion, 'propuesta', left(new.propuesta, 1500)),
      'aprobacion:' || new.id, false);
  end if;
  return new;
end $$;
drop trigger if exists trg_agente_tareas_notificar on public.agente_tareas;
create trigger trg_agente_tareas_notificar after insert or update of estado_aprobacion on public.agente_tareas
  for each row execute function public.agente_tareas_notificar();

-- Al aprobar/editar, se encola la ejecución según la acción.
create or replace function public.agente_tareas_ejecutar() returns trigger
language plpgsql security definer set search_path = public as $$
declare texto text; kind text;
begin
  if new.estado_aprobacion in ('aprobada','editada') and old.estado_aprobacion is distinct from new.estado_aprobacion then
    texto := coalesce(new.propuesta_editada, new.salida->>'mensaje');
    kind := case new.accion
      when 'proponer_mensaje' then 'whatsapp_enviar'
      when 'proponer_publicacion_meli' then 'meli_publicar'
      when 'proponer_cotizacion' then 'pdf_cotizacion'
      else null end;
    if kind is not null then
      perform public.crm_enqueue(kind,
        jsonb_build_object('tarea_id', new.id, 'entidad_tipo', new.entidad_tipo, 'entidad_id', new.entidad_id, 'texto', texto, 'salida', new.salida),
        'ejecutar:' || new.id, kind = 'whatsapp_enviar');   -- mensajes a clientes respetan horario
    end if;
    -- Cierre de lead aprobado: se aplica directo en el CRM (no sale nada al cliente).
    if new.accion = 'proponer_cierre' and new.entidad_tipo = 'crm_conversation' then
      update public.crm_conversations
         set sales_stage = 'venta_perdida',
             loss_reason = coalesce(new.salida->>'motivo_perdida', 'cliente_dejo_de_responder'),
             loss_notes = left(new.propuesta, 300), closed_at = now()
       where id = new.entidad_id::uuid and closed_at is null;
      new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_agente_tareas_ejecutar on public.agente_tareas;
create trigger trg_agente_tareas_ejecutar before update of estado_aprobacion on public.agente_tareas
  for each row execute function public.agente_tareas_ejecutar();

revoke execute on function public.agente_tareas_notificar() from public, anon, authenticated;
revoke execute on function public.agente_tareas_ejecutar() from public, anon, authenticated;
