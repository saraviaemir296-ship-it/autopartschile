-- =====================================================================
-- CRM — Migración 02: catálogos iniciales y reglas de negocio
-- Convención de seguridad:
--   * Triggers de VALIDACIÓN = SECURITY INVOKER (ven el rol real del usuario).
--   * Funciones de SINCRONIZACIÓN/LOG = SECURITY DEFINER (escriben tablas
--     protegidas por RLS). Lo que ellas modifican pasa por los validadores
--     como "servicio" (current_user = postgres), por eso son confiables.
-- =====================================================================

create or replace function public.crm_is_service() returns boolean
language sql stable set search_path = public as $$
  select current_user in ('postgres', 'supabase_admin', 'service_role')
$$;

-- ---------------------------------------------------------------------
-- 1. Datos de catálogo
-- ---------------------------------------------------------------------
insert into public.crm_channels (code, label, sort_order) values
  ('whatsapp','WhatsApp',1), ('instagram','Instagram',2), ('messenger','Facebook Messenger',3),
  ('web','Sitio web',4), ('mercadolibre','Mercado Libre',5), ('tiktok','TikTok',6),
  ('telefono','Teléfono',7), ('presencial','Presencial',8), ('otro','Otro',9)
on conflict (code) do nothing;

insert into public.crm_branches (name, address) values
  ('Casa Matriz', 'Av. Lo Blanco 1072, La Pintana'),
  ('Patio de Vehículos', 'Guacolda 2050, La Pintana')
on conflict (name) do nothing;

insert into public.crm_chat_statuses (code, label, sort_order, is_closed, requires_owner) values
  ('nuevo','Nuevo',1,false,false), ('sin_leer','Sin leer',2,false,false),
  ('pendiente_primera_respuesta','Pendiente de primera respuesta',3,false,false),
  ('abierto','Abierto',4,false,false), ('en_atencion','En atención',5,false,true),
  ('en_espera_cliente','En espera del cliente',6,false,true), ('en_espera_interna','En espera interna',7,false,true),
  ('pausado','Pausado',8,false,false), ('reabierto','Reabierto',9,false,false),
  ('cerrado','Cerrado',10,true,false), ('archivado','Archivado',11,true,false),
  ('spam','Spam',12,true,false), ('duplicado','Duplicado',13,true,false)
on conflict (code) do nothing;

insert into public.crm_sales_stages (code, label, sort_order, pipeline_column, is_column_default, is_won, is_lost, needs_next_action) values
  ('nuevo_prospecto','Nuevo prospecto',1,'nuevo_prospecto',true,false,false,true),
  ('cliente_identificado','Cliente identificado',2,'nuevo_prospecto',false,false,false,true),
  ('calificacion','Calificación',3,'nuevo_prospecto',false,false,false,true),
  ('necesidad_identificada','Necesidad identificada',4,'en_atencion',false,false,false,true),
  ('consulta_disponibilidad','Consulta de disponibilidad',5,'en_atencion',true,false,false,true),
  ('cotizacion_solicitada','Cotización solicitada',6,'cotizacion_solicitada',true,false,false,true),
  ('cotizacion_en_preparacion','Cotización en preparación',7,'cotizacion_solicitada',false,false,false,true),
  ('cotizacion_enviada','Cotización enviada',8,'cotizacion_enviada',true,false,false,true),
  ('cotizacion_vista','Cotización vista',9,'cotizacion_enviada',false,false,false,true),
  ('negociacion','Negociación',10,'negociacion',true,false,false,true),
  ('objecion_precio','Objeción de precio',11,'negociacion',false,false,false,true),
  ('objecion_calidad','Objeción de calidad',12,'negociacion',false,false,false,true),
  ('objecion_compatibilidad','Objeción de compatibilidad',13,'negociacion',false,false,false,true),
  ('esperando_decision','Esperando decisión',14,'negociacion',false,false,false,true),
  ('intencion_compra','Intención de compra',15,'negociacion',false,false,false,true),
  ('pago_pendiente','Pago pendiente',16,'esperando_pago',true,false,false,true),
  ('pago_confirmado','Pago confirmado',17,'venta_concretada',false,true,false,true),
  ('venta_concretada','Venta concretada',18,'venta_concretada',true,true,false,true),
  ('venta_perdida','Venta perdida',19,'perdido',true,false,true,false),
  ('postventa','Postventa',20,'postventa',true,true,false,true),
  ('fidelizacion','Fidelización',21,'postventa',false,true,false,false)
on conflict (code) do nothing;

insert into public.crm_order_statuses (code, label, sort_order, is_terminal) values
  ('sin_pedido','Sin pedido',0,false), ('pedido_solicitado','Pedido solicitado',1,false),
  ('pedido_creado','Pedido creado',2,false), ('pendiente_de_pago','Pendiente de pago',3,false),
  ('pago_en_revision','Pago en revisión',4,false), ('pagado','Pagado',5,false),
  ('preparando','Preparando',6,false), ('preparado','Preparado',7,false),
  ('pendiente_de_retiro','Pendiente de retiro',8,false), ('retiro_coordinado','Retiro coordinado',9,false),
  ('despacho_pendiente','Despacho pendiente',10,false), ('enviado','Enviado',11,false),
  ('en_transito','En tránsito',12,false), ('entregado','Entregado',13,true),
  ('entrega_fallida','Entrega fallida',14,false), ('incidencia','Incidencia',15,false),
  ('cancelado','Cancelado',16,true), ('devuelto','Devuelto',17,true), ('reembolsado','Reembolsado',18,true)
on conflict (code) do nothing;

insert into public.crm_postsale_statuses (code, label, sort_order) values
  ('sin_postventa','Sin postventa',0), ('seguimiento_pendiente','Seguimiento pendiente',1),
  ('seguimiento_realizado','Seguimiento realizado',2), ('cliente_satisfecho','Cliente satisfecho',3),
  ('cliente_insatisfecho','Cliente insatisfecho',4), ('reclamo_recibido','Reclamo recibido',5),
  ('reclamo_en_revision','Reclamo en revisión',6), ('reclamo_resuelto','Reclamo resuelto',7),
  ('garantia_solicitada','Garantía solicitada',8), ('garantia_en_evaluacion','Garantía en evaluación',9),
  ('garantia_aprobada','Garantía aprobada',10), ('garantia_rechazada','Garantía rechazada',11),
  ('devolucion_solicitada','Devolución solicitada',12), ('cambio_solicitado','Cambio solicitado',13),
  ('reembolso_pendiente','Reembolso pendiente',14), ('reembolso_realizado','Reembolso realizado',15),
  ('resena_solicitada','Reseña solicitada',16), ('resena_recibida','Reseña recibida',17)
on conflict (code) do nothing;

insert into public.crm_loss_reasons (code, label, sort_order, requires_notes) values
  ('precio_elevado','Precio elevado',1,false), ('encontro_mas_barato','Encontró más barato',2,false),
  ('sin_disponibilidad','Sin disponibilidad',3,false), ('repuesto_incompatible','Repuesto incompatible',4,false),
  ('compro_en_otra_empresa','Compró en otra empresa',5,false), ('cliente_dejo_de_responder','Cliente dejó de responder',6,false),
  ('no_concreto_la_compra','No concretó la compra',7,false), ('problemas_de_pago','Problemas de pago',8,false),
  ('desistimiento','Desistimiento',9,false), ('error_comercial','Error comercial',10,true), ('otro','Otro',11,true)
on conflict (code) do nothing;

insert into public.crm_quotation_statuses (code, label, sort_order) values
  ('borrador','Borrador',1), ('en_preparacion','En preparación',2), ('pendiente_aprobacion','Pendiente de aprobación',3),
  ('enviada','Enviada',4), ('vista','Vista',5), ('aceptada','Aceptada',6), ('rechazada','Rechazada',7),
  ('modificada','Modificada',8), ('vencida','Vencida',9), ('convertida','Convertida en pedido',10)
on conflict (code) do nothing;

insert into public.crm_task_types (code, label, sort_order, default_due_minutes) values
  ('primera_respuesta','Primera respuesta',1,15), ('consultar_compatibilidad','Consultar compatibilidad',2,60),
  ('consultar_stock','Consultar stock',3,60), ('enviar_cotizacion','Enviar cotización',4,60),
  ('confirmar_cotizacion','Confirmar cotización',5,1440), ('recuperar_cliente','Recuperar cliente',6,1440),
  ('resolver_objecion','Resolver objeción',7,240), ('confirmar_pago','Confirmar pago',8,30),
  ('coordinar_despacho','Coordinar despacho',9,240), ('confirmar_entrega','Confirmar entrega',10,2880),
  ('solicitar_resena','Solicitar reseña',11,4320), ('seguimiento_postventa','Seguimiento postventa',12,4320),
  ('definir_proxima_accion','Definir próxima acción',13,120)
on conflict (code) do nothing;

-- SLA de primera respuesta en minutos (configurable).
insert into public.crm_priorities (code, label, sort_order, sla_first_response_minutes) values
  ('critica','Crítica',1,5), ('alta','Alta',2,10), ('media','Media',3,15), ('baja','Baja',4,60)
on conflict (code) do nothing;

insert into public.crm_priority_rules (priority_code, field, values, sort_order, description)
select * from (values
  ('critica','order_status', array['pago_en_revision','entrega_fallida','incidencia'], 1, 'Pago por resolver o problema de entrega'),
  ('critica','postsale_status', array['reclamo_recibido','reclamo_en_revision','garantia_solicitada','garantia_en_evaluacion'], 2, 'Reclamo o garantía abierta'),
  ('critica','sales_stage', array['pago_pendiente'], 3, 'Cliente esperando resolver un pago'),
  ('alta','sales_stage', array['intencion_compra','cotizacion_solicitada','cotizacion_en_preparacion','cotizacion_enviada','cotizacion_vista','negociacion','objecion_precio','objecion_calidad','objecion_compatibilidad','esperando_decision'], 4, 'Intención de compra o cotización en curso'),
  ('media','sales_stage', array['nuevo_prospecto','cliente_identificado','calificacion','necesidad_identificada','consulta_disponibilidad'], 5, 'Consulta comercial en proceso')
) v(p, f, vals, s, d)
where not exists (select 1 from public.crm_priority_rules);

insert into public.crm_roles (code, label, description) values
  ('admin','Administrador','Acceso total'),
  ('supervisor','Supervisor','Equipo, asignación, métricas, confirma pagos y descuentos'),
  ('vendedor','Vendedor','Conversaciones asignadas o sin asignar, clientes y cotizaciones'),
  ('bodega','Bodega','Pedidos, preparación, despacho y stock'),
  ('postventa','Postventa','Garantías, reclamos y devoluciones'),
  ('auditor','Auditor','Solo lectura e historial')
on conflict (code) do nothing;

insert into public.crm_permissions (code, description) values
  ('conversations.read_all','Ver todas las conversaciones'),
  ('conversations.read_own','Ver conversaciones asignadas o sin asignar'),
  ('conversations.write','Editar conversaciones'),
  ('conversations.assign','Asignar o reasignar conversaciones'),
  ('customers.read','Ver clientes'), ('customers.write','Editar clientes'),
  ('customers.merge','Fusionar clientes duplicados'),
  ('quotations.write','Crear y editar cotizaciones'),
  ('quotations.approve_discount','Autorizar descuentos'),
  ('orders.read','Ver pedidos'), ('orders.write','Crear pedidos y cambiar su estado'),
  ('payments.confirm','Confirmar pagos'),
  ('warranties.decide','Aprobar o rechazar garantías'),
  ('returns.decide','Aprobar o rechazar devoluciones'),
  ('reports.read','Ver reportes y dashboard'),
  ('audit.read','Ver auditoría'),
  ('settings.manage','Configurar catálogos, usuarios y automatizaciones')
on conflict (code) do nothing;

insert into public.crm_role_permissions (role_code, permission_code)
select 'admin', code from public.crm_permissions
union all select 'supervisor', unnest(array['conversations.read_all','conversations.write','conversations.assign',
  'customers.read','customers.write','customers.merge','quotations.write','quotations.approve_discount',
  'orders.read','orders.write','payments.confirm','warranties.decide','returns.decide','reports.read'])
union all select 'vendedor', unnest(array['conversations.read_own','conversations.write','customers.read',
  'customers.write','quotations.write','orders.read','orders.write'])
union all select 'bodega', unnest(array['orders.read','orders.write','customers.read'])
union all select 'postventa', unnest(array['orders.read','customers.read','warranties.decide','returns.decide','conversations.write'])
union all select 'auditor', unnest(array['conversations.read_all','customers.read','orders.read','reports.read','audit.read'])
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2. Prioridad por reglas
-- ---------------------------------------------------------------------
create or replace function public.crm_rule_priority(p_chat text, p_stage text, p_order text, p_post text)
returns text language sql stable set search_path = public as $$
  select coalesce((
    select r.priority_code from public.crm_priority_rules r
    where r.active and (
      (r.field = 'chat_status' and p_chat = any(r.values)) or
      (r.field = 'sales_stage' and p_stage = any(r.values)) or
      (r.field = 'order_status' and p_order = any(r.values)) or
      (r.field = 'postsale_status' and p_post = any(r.values)))
    order by r.sort_order limit 1), 'baja')
$$;

-- ---------------------------------------------------------------------
-- 3. Conversaciones: validación (INVOKER)
-- ---------------------------------------------------------------------
create or replace function public.crm_conversations_validate() returns trigger
language plpgsql set search_path = public as $$
declare
  v_role text := public.crm_current_role();
  v_service boolean := public.crm_is_service();
  v_closed boolean;
  v_needs_owner boolean;
  v_needs_next boolean;
begin
  if tg_op = 'UPDATE' and not v_service then
    -- Restricción de campos por rol
    if v_role = 'bodega' or v_role = 'postventa' then
      if (to_jsonb(new) - 'order_status' - 'postsale_status' - 'updated_at' - 'priority')
         is distinct from (to_jsonb(old) - 'order_status' - 'postsale_status' - 'updated_at' - 'priority') then
        raise exception 'El rol % solo puede cambiar el estado de pedido o de postventa', v_role using errcode = '42501';
      end if;
      if v_role = 'bodega' and new.postsale_status is distinct from old.postsale_status then
        raise exception 'Bodega no puede cambiar el estado de postventa' using errcode = '42501';
      end if;
      if v_role = 'postventa' and new.order_status is distinct from old.order_status then
        raise exception 'Postventa no puede cambiar el estado del pedido' using errcode = '42501';
      end if;
    end if;
    -- Asignación
    if new.assigned_to is distinct from old.assigned_to and not public.crm_has_perm('conversations.assign') then
      if not (old.assigned_to is null and new.assigned_to = auth.uid()) then
        raise exception 'Solo puedes tomar conversaciones sin responsable; reasignar requiere supervisor' using errcode = '42501';
      end if;
    end if;
    -- Prioridad manual: solo quien asigna (supervisor/admin)
    if new.priority is distinct from old.priority and new.priority_source = 'manual'
       and not public.crm_has_perm('conversations.assign') then
      raise exception 'Cambiar la prioridad manualmente requiere supervisor o administrador' using errcode = '42501';
    end if;
    -- Volver atrás desde una venta ganada
    if (select is_won from public.crm_sales_stages where code = old.sales_stage)
       and not (select is_won or is_lost from public.crm_sales_stages where code = new.sales_stage)
       and v_role not in ('admin','supervisor') then
      raise exception 'Solo supervisor o administrador puede retroceder una venta concretada' using errcode = '42501';
    end if;
  end if;

  -- Reglas de etapa
  if (tg_op = 'INSERT' or new.sales_stage is distinct from old.sales_stage) then
    if new.sales_stage = 'pago_confirmado' and not exists (
      select 1 from public.crm_payments p where p.conversation_id = new.id and p.status = 'confirmado') then
      raise exception 'Pago confirmado requiere un pago confirmado por una persona o por Webpay/Mercado Pago';
    end if;
    if new.sales_stage = 'venta_concretada' and not exists (
      select 1 from public.orders o where o.crm_conversation_id = new.id) then
      raise exception 'Venta concretada requiere un pedido asociado';
    end if;
  end if;
  if new.loss_reason is not null and (select requires_notes from public.crm_loss_reasons where code = new.loss_reason)
     and coalesce(btrim(new.loss_notes), '') = '' then
    raise exception 'El motivo de pérdida "%" requiere una nota', new.loss_reason;
  end if;
  if new.sales_stage <> 'venta_perdida' then new.loss_reason := null; new.loss_notes := null; end if;

  select is_closed, requires_owner into v_closed, v_needs_owner from public.crm_chat_statuses where code = new.chat_status;
  select needs_next_action into v_needs_next from public.crm_sales_stages where code = new.sales_stage;

  -- Responsable obligatorio en estados activos de atención
  if v_needs_owner and new.assigned_to is null then
    raise exception 'El estado "%" requiere un vendedor responsable', new.chat_status;
  end if;

  -- Cierre / reapertura
  if v_closed and (tg_op = 'INSERT' or old.closed_at is null) then new.closed_at := coalesce(new.closed_at, now()); end if;
  if not v_closed then new.closed_at := null; end if;

  -- Prioridad automática (respeta la manual)
  if new.priority_source = 'regla' then
    new.priority := public.crm_rule_priority(new.chat_status, new.sales_stage, new.order_status, new.postsale_status);
  end if;

  -- Próxima acción por defecto al crear
  if tg_op = 'INSERT' and not v_closed and v_needs_next
     and new.next_action_at is null and new.next_action_exception is null then
    new.next_action := 'Primera respuesta';
    new.next_action_type := 'primera_respuesta';
    new.next_action_at := now() + make_interval(mins => (select sla_first_response_minutes from public.crm_priorities where code = new.priority));
  end if;

  -- Regla: conversación comercial activa siempre con próxima acción (o excepción justificada)
  if not v_closed and v_needs_next and new.next_action_at is null and new.next_action_exception is null then
    raise exception 'Conversación activa sin próxima acción: crea un seguimiento o justifica la excepción';
  end if;

  new.contact_phone := coalesce(public.crm_normalize_phone(new.contact_phone), new.contact_phone);
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end $$;

drop trigger if exists crm_conversations_validate on public.crm_conversations;
create trigger crm_conversations_validate before insert or update on public.crm_conversations
  for each row execute function public.crm_conversations_validate();

-- ---------------------------------------------------------------------
-- 4. Conversaciones: historial, tarea inicial (DEFINER)
-- ---------------------------------------------------------------------
create or replace function public.crm_conversations_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_by uuid := auth.uid();
  v_role text := coalesce(public.crm_current_role(), 'servicio');
  v_reason text := nullif(current_setting('crm.reason', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.crm_status_history (conversation_id, field, old_value, new_value, changed_by, changed_by_role, reason)
    values (new.id,'chat_status',null,new.chat_status,v_by,v_role,'creación'),
           (new.id,'sales_stage',null,new.sales_stage,v_by,v_role,'creación');
    if new.next_action_type = 'primera_respuesta' and new.next_action_exception is null then
      insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system, created_by)
      values (new.id, new.customer_id, 'primera_respuesta', 'Primera respuesta', new.assigned_to, new.next_action_at, new.priority, true, v_by);
    end if;
    insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary)
    values (new.id, new.customer_id, v_by, 'conversacion_creada', 'Conversación creada por ' || new.channel_code);
    return new;
  end if;

  insert into public.crm_status_history (conversation_id, field, old_value, new_value, changed_by, changed_by_role, reason)
  select new.id, f, o, n, v_by, v_role, v_reason from (values
    ('chat_status', old.chat_status, new.chat_status),
    ('sales_stage', old.sales_stage, new.sales_stage),
    ('order_status', old.order_status, new.order_status),
    ('postsale_status', old.postsale_status, new.postsale_status),
    ('priority', old.priority, new.priority),
    ('assigned_to', old.assigned_to::text, new.assigned_to::text),
    ('loss_reason', old.loss_reason, new.loss_reason)
  ) v(f, o, n) where o is distinct from n;

  -- Al asignar, las tareas abiertas sin dueño pasan al nuevo responsable
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    update public.crm_follow_up_tasks set assigned_to = new.assigned_to
     where conversation_id = new.id and status in ('pendiente','en_curso') and assigned_to is null;
  end if;
  return new;
end $$;

drop trigger if exists crm_conversations_after on public.crm_conversations;
create trigger crm_conversations_after after insert or update on public.crm_conversations
  for each row execute function public.crm_conversations_after();

-- ---------------------------------------------------------------------
-- 5. Seguimientos: validación y sincronización de la próxima acción
-- ---------------------------------------------------------------------
create or replace function public.crm_tasks_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'completada' and (tg_op = 'INSERT' or old.status <> 'completada') then
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_by := coalesce(new.completed_by, auth.uid());
  end if;
  if new.status <> 'completada' then new.completed_at := null; end if;
  if tg_op = 'INSERT' then new.created_by := coalesce(new.created_by, auth.uid()); end if;
  if new.customer_id is null and new.conversation_id is not null then
    select customer_id into new.customer_id from public.crm_conversations where id = new.conversation_id;
  end if;
  return new;
end $$;
drop trigger if exists crm_tasks_validate on public.crm_follow_up_tasks;
create trigger crm_tasks_validate before insert or update on public.crm_follow_up_tasks
  for each row execute function public.crm_tasks_validate();

create or replace function public.crm_sync_next_action(p_conversation_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  if p_conversation_id is null then return; end if;
  select title, task_type, due_at into t from public.crm_follow_up_tasks
   where conversation_id = p_conversation_id and status in ('pendiente','en_curso')
   order by due_at asc limit 1;
  update public.crm_conversations c
     set next_action = t.title, next_action_type = t.task_type, next_action_at = t.due_at
   where c.id = p_conversation_id
     and (c.next_action is distinct from t.title or c.next_action_type is distinct from t.task_type
          or c.next_action_at is distinct from t.due_at);
end $$;

create or replace function public.crm_tasks_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.crm_sync_next_action(case when tg_op = 'DELETE' then old.conversation_id else new.conversation_id end);
  if tg_op = 'UPDATE' and new.status = 'completada' and old.status <> 'completada' then
    insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary, payload)
    values (new.conversation_id, new.customer_id, auth.uid(), 'tarea_completada', new.title || ': ' || coalesce(new.result, ''),
            jsonb_build_object('task_id', new.id, 'task_type', new.task_type));
  end if;
  return null;
end $$;
drop trigger if exists crm_tasks_after on public.crm_follow_up_tasks;
create trigger crm_tasks_after after insert or update or delete on public.crm_follow_up_tasks
  for each row execute function public.crm_tasks_after();

-- Completar un seguimiento y definir el siguiente en una sola operación.
create or replace function public.crm_complete_task(
  p_task_id uuid, p_result text,
  p_next_type text default null, p_next_title text default null, p_next_due timestamptz default null,
  p_exception text default null)
returns uuid language plpgsql set search_path = public as $$
declare v_task record; v_new uuid;
begin
  select * into v_task from public.crm_follow_up_tasks where id = p_task_id for update;
  if not found then raise exception 'Seguimiento no encontrado o sin acceso'; end if;
  if coalesce(btrim(p_result), '') = '' then raise exception 'Indica el resultado del seguimiento'; end if;
  if p_next_type is not null then
    insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority)
    values (v_task.conversation_id, v_task.customer_id, p_next_type,
            coalesce(p_next_title, (select label from public.crm_task_types where code = p_next_type)),
            v_task.assigned_to,
            coalesce(p_next_due, now() + make_interval(mins => (select default_due_minutes from public.crm_task_types where code = p_next_type))),
            v_task.priority)
    returning id into v_new;
  elsif p_exception is not null and v_task.conversation_id is not null then
    update public.crm_conversations set next_action_exception = p_exception where id = v_task.conversation_id;
  end if;
  update public.crm_follow_up_tasks set status = 'completada', result = p_result where id = p_task_id;
  return v_new;
end $$;

-- ---------------------------------------------------------------------
-- 6. Mensajes: actualizan la conversación (DEFINER)
-- ---------------------------------------------------------------------
create or replace function public.crm_messages_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_closed boolean;
  v_preview text := left(coalesce(nullif(btrim(new.body), ''), '[' || new.message_type || ']'), 140);
  v_new_status text;
  v_owner uuid;
begin
  select * into c from public.crm_conversations where id = new.conversation_id for update;
  select is_closed into v_closed from public.crm_chat_statuses where code = c.chat_status;

  if new.direction = 'entrante' then
    v_new_status := case
      when c.chat_status in ('spam','duplicado') then c.chat_status
      when v_closed or c.chat_status = 'pausado' then 'reabierto'
      when c.chat_status = 'en_espera_cliente' then 'en_atencion'
      when c.chat_status in ('abierto','en_atencion','en_espera_interna') then c.chat_status
      when c.chat_status = 'nuevo' then 'nuevo'
      else 'sin_leer' end;
    -- Cliente vuelve a escribir y no hay nada pendiente: primero crear "responder" (la próxima acción),
    -- luego actualizar la conversación (así nunca queda activa sin próxima acción).
    if v_new_status not in ('spam','duplicado') and not exists (
      select 1 from public.crm_follow_up_tasks where conversation_id = c.id and status in ('pendiente','en_curso')) then
      insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system)
      values (c.id, c.customer_id, 'primera_respuesta', 'Responder al cliente', c.assigned_to,
              now() + make_interval(mins => (select sla_first_response_minutes from public.crm_priorities where code = c.priority)),
              c.priority, true);
    end if;
    update public.crm_conversations set
      chat_status = v_new_status,
      first_inbound_at = coalesce(first_inbound_at, new.sent_at),
      last_inbound_at = greatest(coalesce(last_inbound_at, new.sent_at), new.sent_at),
      last_message_at = greatest(coalesce(last_message_at, new.sent_at), new.sent_at),
      last_message_preview = v_preview,
      unread_count = unread_count + 1,
      next_action_exception = case when next_action_at is not null then null else next_action_exception end,
      contact_name = coalesce(contact_name, (new.raw ->> 'contact_name'))
    where id = c.id;
  else
    v_owner := coalesce(c.assigned_to, new.staff_id);
    v_new_status := case
      when c.chat_status in ('nuevo','sin_leer','pendiente_primera_respuesta','reabierto','abierto')
        then case when v_owner is not null then 'en_atencion' else 'abierto' end
      else c.chat_status end;
    -- Primero se crea "definir próxima acción" si responder era lo único pendiente.
    if exists (select 1 from public.crm_follow_up_tasks where conversation_id = c.id
                 and status in ('pendiente','en_curso') and task_type = 'primera_respuesta')
       and not exists (select 1 from public.crm_follow_up_tasks where conversation_id = c.id
                 and status in ('pendiente','en_curso') and task_type <> 'primera_respuesta') then
      insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system)
      values (c.id, c.customer_id, 'definir_proxima_accion', 'Definir próxima acción', v_owner, now() + interval '2 hours', c.priority, true);
    end if;
    update public.crm_follow_up_tasks set status = 'completada',
           result = 'Respondido ' || to_char(new.sent_at at time zone 'America/Santiago', 'DD-MM HH24:MI'),
           completed_by = new.staff_id
     where conversation_id = c.id and status in ('pendiente','en_curso') and task_type = 'primera_respuesta';
    update public.crm_conversations set
      assigned_to = v_owner,
      chat_status = v_new_status,
      first_response_at = case when first_response_at is null and first_inbound_at is not null then new.sent_at else first_response_at end,
      last_outbound_at = greatest(coalesce(last_outbound_at, new.sent_at), new.sent_at),
      last_message_at = greatest(coalesce(last_message_at, new.sent_at), new.sent_at),
      last_message_preview = v_preview,
      unread_count = 0
    where id = c.id;
  end if;
  return null;
end $$;
drop trigger if exists crm_messages_after on public.crm_messages;
create trigger crm_messages_after after insert on public.crm_messages
  for each row execute function public.crm_messages_after();

-- ---------------------------------------------------------------------
-- 7. Cotizaciones
-- ---------------------------------------------------------------------
create or replace function public.crm_quote_items_validate() returns trigger
language plpgsql set search_path = public as $$
declare p record;
begin
  if (select status from public.crm_quotations where id = new.quotation_id) in ('enviada','vista','aceptada','convertida') then
    raise exception 'La cotización ya fue enviada: crea una versión modificada';
  end if;
  if new.product_id is not null then
    select name, oem_number, is_active, deleted_at, part_status, stock into p from public.products where id = new.product_id;
    if not found then raise exception 'Producto % no existe en inventario', new.product_id; end if;
    new.oem_code := coalesce(new.oem_code, p.oem_number);
    -- Disponibilidad SIEMPRE desde el inventario real, nunca escrita a mano.
    new.availability := case when p.is_active and p.deleted_at is null
                               and p.part_status in ('desmontada','en_vehiculo') and coalesce(p.stock, 1) > 0
                             then 'disponible' else 'sin_stock' end;
  elsif new.availability = 'disponible' then
    new.availability := 'por_confirmar';   -- sin producto de inventario no se puede afirmar stock
  end if;
  return new;
end $$;
drop trigger if exists crm_quote_items_validate on public.crm_quotation_items;
create trigger crm_quote_items_validate before insert or update on public.crm_quotation_items
  for each row execute function public.crm_quote_items_validate();

create or replace function public.crm_quote_recalc(p_quotation_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.crm_quotations q set
    items_discount = coalesce(s.disc, 0),
    subtotal = coalesce(s.sub, 0)
  from (select sum(discount) disc, sum(line_total) sub from public.crm_quotation_items where quotation_id = p_quotation_id) s
  where q.id = p_quotation_id;
end $$;

create or replace function public.crm_quote_items_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.crm_quote_recalc(case when tg_op = 'DELETE' then old.quotation_id else new.quotation_id end);
  return null;
end $$;
drop trigger if exists crm_quote_items_after on public.crm_quotation_items;
create trigger crm_quote_items_after after insert or update or delete on public.crm_quotation_items
  for each row execute function public.crm_quote_items_after();

create or replace function public.crm_quotations_validate() returns trigger
language plpgsql set search_path = public as $$
declare v_net numeric;
begin
  if tg_op = 'INSERT' then
    new.seller_id := coalesce(new.seller_id, (select user_id from public.crm_staff where user_id = auth.uid()));
    if new.customer_id is null and new.conversation_id is not null then
      select customer_id into new.customer_id from public.crm_conversations where id = new.conversation_id;
    end if;
  end if;
  v_net := greatest(new.subtotal - new.discount_total, 0);
  new.iva := case when new.apply_iva then round(v_net * 0.19) else 0 end;
  new.total := v_net + new.iva;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'enviada' then
      if not exists (select 1 from public.crm_quotation_items where quotation_id = new.id) then
        raise exception 'No se puede enviar una cotización sin repuestos';
      end if;
      if exists (select 1 from public.crm_quotation_items where quotation_id = new.id and availability = 'sin_stock') then
        raise exception 'La cotización incluye repuestos sin stock según inventario';
      end if;
      if (new.discount_total > 0 or new.items_discount > 0) and new.discount_approved_by is null then
        if public.crm_has_perm('quotations.approve_discount') then
          new.discount_approved_by := auth.uid(); new.discount_approved_at := now();
        else
          raise exception 'El descuento requiere aprobación: deja la cotización en "pendiente de aprobación"';
        end if;
      end if;
      new.sent_at := coalesce(new.sent_at, now());
    elsif new.status = 'aceptada' then
      new.accepted_at := coalesce(new.accepted_at, now());
    elsif new.status = 'convertida' and not public.crm_is_service() then
      raise exception 'Usa "Convertir en pedido" para convertir la cotización';
    end if;
  end if;
  if new.valid_until < current_date and new.status in ('enviada','vista') then new.status := 'vencida'; end if;
  return new;
end $$;
drop trigger if exists crm_quotations_validate on public.crm_quotations;
create trigger crm_quotations_validate before insert or update on public.crm_quotations
  for each row execute function public.crm_quotations_validate();

-- Crea el siguiente seguimiento (si no existe uno abierto de ese tipo) y luego cierra los anteriores.
create or replace function public.crm_advance_tasks(
  p_conversation_id uuid, p_next_type text, p_next_title text, p_next_due interval,
  p_close_types text[], p_result text)
returns void language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select id, customer_id, assigned_to, priority into c from public.crm_conversations where id = p_conversation_id;
  if not found then return; end if;
  if p_next_type is not null and not exists (select 1 from public.crm_follow_up_tasks
       where conversation_id = c.id and status in ('pendiente','en_curso') and task_type = p_next_type) then
    insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system)
    values (c.id, c.customer_id, p_next_type, p_next_title, c.assigned_to, now() + p_next_due, c.priority, true);
  end if;
  update public.crm_follow_up_tasks set status = 'completada', result = p_result
   where conversation_id = c.id and status in ('pendiente','en_curso') and task_type = any(p_close_types)
     and task_type is distinct from p_next_type;
end $$;

create or replace function public.crm_quotations_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_stage_order int; v_target text;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.conversation_id is not null then
    if new.status = 'enviada' then
      perform public.crm_advance_tasks(new.conversation_id, 'confirmar_cotizacion', 'Confirmar cotización ' || new.number,
        interval '1 day', array['enviar_cotizacion','definir_proxima_accion','primera_respuesta'], 'Enviada ' || new.number);
    elsif new.status = 'aceptada' then
      perform public.crm_advance_tasks(new.conversation_id, 'confirmar_pago', 'Gestionar pago de ' || new.number,
        interval '1 day', array['confirmar_cotizacion','enviar_cotizacion','resolver_objecion'], 'Aceptada ' || new.number);
    elsif new.status = 'rechazada' then
      perform public.crm_advance_tasks(new.conversation_id, 'recuperar_cliente', 'Recuperar cliente (rechazó ' || new.number || ')',
        interval '1 day', array['confirmar_cotizacion'], 'Rechazada ' || new.number);
    end if;
    v_target := case new.status when 'enviada' then 'cotizacion_enviada' when 'vista' then 'cotizacion_vista'
                                when 'aceptada' then 'intencion_compra' when 'en_preparacion' then 'cotizacion_en_preparacion' end;
    if v_target is not null then
      select s.sort_order into v_stage_order from public.crm_conversations c join public.crm_sales_stages s on s.code = c.sales_stage
       where c.id = new.conversation_id;
      if v_stage_order < (select sort_order from public.crm_sales_stages where code = v_target) then
        update public.crm_conversations set sales_stage = v_target,
               potential_value = greatest(coalesce(potential_value, 0), new.total)
         where id = new.conversation_id;
      end if;
    end if;
    insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary, payload)
    values (new.conversation_id, new.customer_id, auth.uid(), 'cotizacion_' || new.status,
            new.number || ' ' || new.status || ' — $' || to_char(new.total, 'FM999G999G999'),
            jsonb_build_object('quotation_id', new.id));
  end if;
  return null;
end $$;
drop trigger if exists crm_quotations_after on public.crm_quotations;
create trigger crm_quotations_after after update on public.crm_quotations
  for each row execute function public.crm_quotations_after();

-- Convierte una cotización aceptada en pedido sin reingresar datos.
create or replace function public.crm_convert_quotation_to_order(p_quotation_id uuid) returns bigint
language plpgsql security definer set search_path = public as $$
declare q record; v_channel text; v_order bigint;
begin
  if not (public.crm_has_perm('orders.write')) then
    raise exception 'No tienes permiso para crear pedidos' using errcode = '42501';
  end if;
  select * into q from public.crm_quotations where id = p_quotation_id and deleted_at is null for update;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if q.status <> 'aceptada' then raise exception 'Solo una cotización aceptada se convierte en pedido (estado actual: %)', q.status; end if;
  if q.converted_order_id is not null then return q.converted_order_id; end if;   -- idempotente
  select channel_code into v_channel from public.crm_conversations where id = q.conversation_id;

  insert into public.orders (customer_id, status, source, subtotal, discount, shipping, total, currency, notes,
                             payment_method, crm_conversation_id, crm_quotation_id, fulfillment_status)
  values (q.customer_id, 'pending',
          case v_channel when 'whatsapp' then 'whatsapp' when 'instagram' then 'instagram' when 'messenger' then 'messenger'
                         when 'web' then 'web' when 'mercadolibre' then 'mercadolibre' when 'presencial' then 'presencial'
                         when 'telefono' then 'phone' when 'tiktok' then 'tiktok' else 'otro' end,
          q.subtotal, q.discount_total, 0, q.total, 'CLP', 'Desde cotización ' || q.number,
          'por_definir', q.conversation_id, q.id, 'pendiente_de_pago')
  returning id into v_order;

  insert into public.order_items (order_id, product_id, sku, name, quantity, unit_price, total_price, metadata)
  select v_order, i.product_id, p.sku, i.description, i.quantity, i.unit_price, i.line_total,
         jsonb_build_object('condition', i.condition, 'oem', i.oem_code, 'quotation_item_id', i.id, 'warranty', i.warranty)
    from public.crm_quotation_items i left join public.products p on p.id = i.product_id
   where i.quotation_id = q.id;

  update public.crm_quotations set status = 'convertida', converted_order_id = v_order where id = q.id;
  if q.conversation_id is not null then
    update public.crm_conversations set order_status = 'pendiente_de_pago', sales_stage = 'pago_pendiente',
           potential_value = greatest(coalesce(potential_value, 0), q.total)
     where id = q.conversation_id;
  end if;
  insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary, payload)
  values (q.conversation_id, q.customer_id, auth.uid(), 'pedido_creado', 'Pedido #' || v_order || ' desde ' || q.number,
          jsonb_build_object('order_id', v_order, 'quotation_id', q.id));
  return v_order;
end $$;

-- ---------------------------------------------------------------------
-- 8. Pagos: solo una persona autorizada (o Webpay/MP) confirma
-- ---------------------------------------------------------------------
create or replace function public.crm_payments_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if not public.crm_is_service() then
    if tg_op = 'INSERT' then
      new.status := 'en_revision'; new.confirmed_by := null; new.confirmed_at := null; new.confirmed_source := null;
      new.created_by := auth.uid();
    elsif new.status is distinct from old.status then
      if new.status in ('confirmado','rechazado','reembolsado') and not public.crm_has_perm('payments.confirm') then
        raise exception 'Solo supervisor o administrador confirma o rechaza pagos' using errcode = '42501';
      end if;
      if new.status = 'confirmado' then
        new.confirmed_by := auth.uid(); new.confirmed_at := now(); new.confirmed_source := 'humano';
      end if;
    elsif (to_jsonb(new) - 'notes' - 'proof_url') is distinct from (to_jsonb(old) - 'notes' - 'proof_url')
          and old.status = 'confirmado' then
      raise exception 'Un pago confirmado no se puede editar';
    end if;
  end if;
  if new.customer_id is null and new.conversation_id is not null then
    select customer_id into new.customer_id from public.crm_conversations where id = new.conversation_id;
  end if;
  if new.conversation_id is null and new.order_id is not null then
    select crm_conversation_id into new.conversation_id from public.orders where id = new.order_id;
  end if;
  return new;
end $$;
drop trigger if exists crm_payments_validate on public.crm_payments;
create trigger crm_payments_validate before insert or update on public.crm_payments
  for each row execute function public.crm_payments_validate();

create or replace function public.crm_payments_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; v_paid numeric; v_total numeric;
begin
  select * into c from public.crm_conversations where id = new.conversation_id;
  if tg_op = 'INSERT' and new.status = 'en_revision' then
    if c.id is not null then
      update public.crm_conversations set order_status = 'pago_en_revision' where id = c.id
        and order_status in ('sin_pedido','pedido_solicitado','pedido_creado','pendiente_de_pago');
      -- Un solo seguimiento "confirmar pago": si ya existe, se adelanta y se vuelve crítico.
      update public.crm_follow_up_tasks set title = 'Confirmar pago de $' || to_char(new.amount, 'FM999G999G999'),
             due_at = least(due_at, now() + interval '30 minutes'), priority = 'critica'
       where conversation_id = c.id and task_type = 'confirmar_pago' and status in ('pendiente','en_curso');
      if not found then
        insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system)
        values (c.id, c.customer_id, 'confirmar_pago', 'Confirmar pago de $' || to_char(new.amount, 'FM999G999G999'),
                c.assigned_to, now() + interval '30 minutes', 'critica', true);
      end if;
    end if;
    insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary, payload)
    values (new.conversation_id, new.customer_id, auth.uid(), 'pago_reportado',
            'Pago reportado $' || to_char(new.amount, 'FM999G999G999') || ' (' || new.method || ')', jsonb_build_object('payment_id', new.id));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'confirmado' then
      if new.order_id is not null then
        select coalesce(sum(amount),0) into v_paid from public.crm_payments where order_id = new.order_id and status = 'confirmado';
        select total into v_total from public.orders where id = new.order_id;
        if v_paid >= coalesce(v_total, 0) then
          update public.orders set fulfillment_status = 'pagado' where id = new.order_id;
        end if;
      end if;
      if c.id is not null then
        -- Siguiente paso natural: coordinar retiro o despacho (antes de cerrar "confirmar pago").
        if not exists (select 1 from public.crm_follow_up_tasks where conversation_id = c.id
                         and status in ('pendiente','en_curso') and task_type = 'coordinar_despacho') then
          insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system)
          values (c.id, c.customer_id, 'coordinar_despacho', 'Coordinar retiro o despacho', c.assigned_to,
                  now() + interval '4 hours', 'alta', true);
        end if;
        update public.crm_follow_up_tasks set status = 'completada', result = 'Pago confirmado', completed_by = new.confirmed_by
         where conversation_id = c.id and task_type = 'confirmar_pago' and status in ('pendiente','en_curso');
        update public.crm_conversations set order_status = 'pagado',
               sales_stage = case when (select sort_order from public.crm_sales_stages where code = sales_stage)
                                       < (select sort_order from public.crm_sales_stages where code = 'pago_confirmado')
                                  then 'pago_confirmado' else sales_stage end
         where id = c.id;
      end if;
    end if;
    insert into public.crm_activities (conversation_id, customer_id, actor_id, activity_type, summary, payload)
    values (new.conversation_id, new.customer_id, auth.uid(), 'pago_' || new.status,
            'Pago $' || to_char(new.amount, 'FM999G999G999') || ' ' || new.status, jsonb_build_object('payment_id', new.id));
  end if;
  return null;
end $$;
drop trigger if exists crm_payments_after on public.crm_payments;
create trigger crm_payments_after after insert or update on public.crm_payments
  for each row execute function public.crm_payments_after();

-- ---------------------------------------------------------------------
-- 9. Pedidos existentes: el equipo solo cambia campos operativos
--    (los montos y datos de Webpay/MP siguen siendo exclusivos del servidor)
-- ---------------------------------------------------------------------
create or replace function public.crm_orders_guard() returns trigger
language plpgsql set search_path = public as $$
declare v_allowed text[] := array['fulfillment_status','notes','delivery_method','shipping_status','updated_at'];
begin
  if public.crm_is_service() then return new; end if;
  if not public.crm_has_perm('orders.write') then
    raise exception 'No tienes permiso para modificar pedidos' using errcode = '42501';
  end if;
  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'Solo se pueden cambiar estado de despacho, entrega y notas del pedido' using errcode = '42501';
  end if;
  if new.fulfillment_status = 'entregado' and old.fulfillment_status is distinct from 'entregado'
     and old.fulfillment_status not in ('enviado','en_transito','retiro_coordinado','pendiente_de_retiro','preparado') then
    raise exception 'Un pedido se marca entregado solo después de enviarlo o coordinar su retiro';
  end if;
  return new;
end $$;
drop trigger if exists crm_orders_guard on public.orders;
create trigger crm_orders_guard before update on public.orders
  for each row execute function public.crm_orders_guard();

create or replace function public.crm_orders_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.crm_conversation_id is not null and new.fulfillment_status is distinct from old.fulfillment_status
     and new.fulfillment_status is not null then
    update public.crm_conversations set order_status = new.fulfillment_status where id = new.crm_conversation_id;
  end if;
  return null;
end $$;
drop trigger if exists crm_orders_after on public.orders;
create trigger crm_orders_after after update of fulfillment_status on public.orders
  for each row execute function public.crm_orders_after();

-- ---------------------------------------------------------------------
-- 10. Postventa
-- ---------------------------------------------------------------------
create or replace function public.crm_warranties_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status in ('aprobada','rechazada') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if not public.crm_is_service() and not public.crm_has_perm('warranties.decide') then
      raise exception 'Aprobar o rechazar garantías requiere permiso de postventa' using errcode = '42501';
    end if;
    new.decided_by := coalesce(auth.uid(), new.decided_by); new.decided_at := now();
  end if;
  return new;
end $$;
drop trigger if exists crm_warranties_validate on public.crm_warranties;
create trigger crm_warranties_validate before insert or update on public.crm_warranties
  for each row execute function public.crm_warranties_validate();

create or replace function public.crm_complaints_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'resuelto' and (tg_op = 'INSERT' or old.status <> 'resuelto') then
    new.resolved_by := coalesce(auth.uid(), new.resolved_by); new.resolved_at := now();
  end if;
  return new;
end $$;
drop trigger if exists crm_complaints_validate on public.crm_complaints;
create trigger crm_complaints_validate before insert or update on public.crm_complaints
  for each row execute function public.crm_complaints_validate();

-- Sugerencias IA: decidir siempre es humano.
create or replace function public.crm_ai_suggestions_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and not public.crm_is_service() then
    new.decided_by := auth.uid(); new.decided_at := now();
  end if;
  if tg_op = 'INSERT' and not public.crm_is_service() then
    raise exception 'Solo el servicio de IA crea sugerencias';
  end if;
  return new;
end $$;
drop trigger if exists crm_ai_suggestions_validate on public.crm_ai_suggestions;
create trigger crm_ai_suggestions_validate before insert or update on public.crm_ai_suggestions
  for each row execute function public.crm_ai_suggestions_validate();

-- ---------------------------------------------------------------------
-- 11. Clientes: identificar / crear sin duplicar, y fusionar
-- ---------------------------------------------------------------------
create or replace function public.crm_resolve_customer(
  p_channel text, p_external_id text, p_phone text, p_name text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_phone text := public.crm_normalize_phone(p_phone); v_first text; v_last text;
begin
  if p_external_id is not null then
    select customer_id into v_id from public.crm_customer_identities where channel_code = p_channel and external_id = p_external_id;
  end if;
  if v_id is null and v_phone is not null then
    select id into v_id from public.customers
     where phone_e164 = v_phone and not is_test and deleted_at is null and merged_into_id is null
     order by id limit 1;
  end if;
  if v_id is null then
    v_first := nullif(split_part(btrim(coalesce(p_name, '')), ' ', 1), '');
    v_last := nullif(btrim(substr(btrim(coalesce(p_name, '')), length(coalesce(v_first, '')) + 1)), '');
    insert into public.customers (first_name, last_name, phone, source_channel, classification)
    values (v_first, v_last, coalesce(v_phone, p_phone), p_channel, 'nuevo')
    returning id into v_id;
  end if;
  if p_external_id is not null then
    insert into public.crm_customer_identities (customer_id, channel_code, external_id, display_name)
    values (v_id, p_channel, p_external_id, p_name)
    on conflict (channel_code, external_id) do nothing;
  end if;
  return v_id;
end $$;

create or replace function public.crm_merge_customers(p_keep bigint, p_duplicate bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.crm_is_service() and not public.crm_has_perm('customers.merge') then
    raise exception 'No tienes permiso para fusionar clientes' using errcode = '42501';
  end if;
  if p_keep = p_duplicate then raise exception 'No se puede fusionar un cliente consigo mismo'; end if;
  update public.crm_conversations set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_customer_identities set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_customer_vehicles set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_customer_notes set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_quotations set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_follow_up_tasks set customer_id = p_keep where customer_id = p_duplicate;
  update public.crm_payments set customer_id = p_keep where customer_id = p_duplicate;
  update public.orders set customer_id = p_keep where customer_id = p_duplicate;
  update public.customers set merged_into_id = p_keep, deleted_at = now() where id = p_duplicate;
  insert into public.crm_activities (customer_id, actor_id, activity_type, summary, payload)
  values (p_keep, auth.uid(), 'clientes_fusionados', 'Cliente #' || p_duplicate || ' fusionado en #' || p_keep,
          jsonb_build_object('duplicate', p_duplicate));
end $$;

-- Asignación automática: vendedor activo con menos conversaciones abiertas.
create or replace function public.crm_pick_assignee(p_branch bigint default null) returns uuid
language sql stable security definer set search_path = public as $$
  select s.user_id from public.crm_staff s
   where s.active and s.accepts_auto_assign and s.role_code = 'vendedor'
     and (p_branch is null or s.branch_id is null or s.branch_id = p_branch)
   order by (select count(*) from public.crm_conversations c
              join public.crm_chat_statuses cs on cs.code = c.chat_status
             where c.assigned_to = s.user_id and not cs.is_closed and c.deleted_at is null), random()
   limit 1
$$;

-- ---------------------------------------------------------------------
-- 12. Auditoría genérica
-- ---------------------------------------------------------------------
create or replace function public.crm_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
        v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
begin
  insert into public.crm_audit_logs (table_name, record_id, action, actor_id, actor_role, old_data, new_data)
  values (tg_table_name, coalesce(v_new, v_old) ->> coalesce(tg_argv[0], 'id'), tg_op, auth.uid(),
          coalesce(public.crm_current_role(), 'servicio'), v_old, v_new);
  return null;
end $$;

do $$ declare t text; k text; begin
  for t, k in select * from (values
    ('crm_conversations','id'),('crm_quotations','id'),('crm_payments','id'),('crm_warranties','id'),
    ('crm_complaints','id'),('crm_staff','user_id'),('crm_role_permissions','role_code'),
    ('crm_follow_up_tasks','id'),('customers','id'),('crm_priority_rules','id')) v(a,b)
  loop
    execute format('drop trigger if exists crm_audit on public.%I', t);
    execute format('create trigger crm_audit after insert or update or delete on public.%I for each row execute function public.crm_audit(%L)', t, k);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 13. Vistas (respetan RLS del usuario)
-- ---------------------------------------------------------------------
create or replace view public.crm_v_inbox with (security_invoker = true) as
select c.*,
       coalesce(nullif(btrim(concat_ws(' ', cu.first_name, cu.last_name)), ''), c.contact_name, c.contact_phone) as display_name,
       s.full_name as assigned_name,
       (c.last_inbound_at is not null and (c.last_outbound_at is null or c.last_inbound_at > c.last_outbound_at)) as waiting_reply,
       case when c.last_inbound_at is not null and (c.last_outbound_at is null or c.last_inbound_at > c.last_outbound_at)
            then floor(extract(epoch from now() - c.last_inbound_at) / 60)::int end as waiting_minutes,
       (c.next_action_at is not null and c.next_action_at < now()) as next_action_overdue,
       cs.is_closed, st.pipeline_column
  from public.crm_conversations c
  left join public.customers cu on cu.id = c.customer_id
  left join public.crm_staff s on s.user_id = c.assigned_to
  join public.crm_chat_statuses cs on cs.code = c.chat_status
  join public.crm_sales_stages st on st.code = c.sales_stage
 where c.deleted_at is null;

create or replace view public.crm_v_possible_duplicates with (security_invoker = true) as
select cu.phone_e164, count(*) as clientes, array_agg(cu.id order by cu.id) as ids,
       array_agg(coalesce(nullif(btrim(concat_ws(' ', cu.first_name, cu.last_name)), ''), cu.email, '#' || cu.id) order by cu.id) as nombres
  from public.customers cu
 where cu.phone_e164 is not null and not cu.is_test and cu.deleted_at is null and cu.merged_into_id is null
 group by cu.phone_e164 having count(*) > 1;

create or replace view public.crm_v_open_tasks with (security_invoker = true) as
select t.*, (t.due_at < now()) as overdue, c.contact_name, c.channel_code, s.full_name as assigned_name
  from public.crm_follow_up_tasks t
  left join public.crm_conversations c on c.id = t.conversation_id
  left join public.crm_staff s on s.user_id = t.assigned_to
 where t.status in ('pendiente','en_curso');
