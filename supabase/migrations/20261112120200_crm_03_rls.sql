-- =====================================================================
-- CRM — Migración 03: Row Level Security y permisos por rol
-- service_role (edge functions / n8n) ignora RLS por diseño de Supabase.
-- La clave service_role NUNCA va en el frontend.
-- =====================================================================

create or replace function public.crm_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.crm_current_role() is not null
$$;

create or replace function public.crm_can_see_conversation(p_id uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_role text := public.crm_current_role(); c record;
begin
  if v_role is null or p_id is null then return false; end if;
  if v_role in ('admin','supervisor','auditor') then return true; end if;
  select assigned_to, order_status, postsale_status, sales_stage into c from public.crm_conversations where id = p_id;
  if not found then return false; end if;
  return case v_role
    when 'vendedor' then c.assigned_to = auth.uid() or c.assigned_to is null
    when 'bodega' then c.order_status <> 'sin_pedido'
    when 'postventa' then c.postsale_status <> 'sin_postventa' or c.sales_stage in ('venta_concretada','postventa','fidelizacion')
    else false end;
end $$;

create or replace function public.crm_can_see_customer(p_id bigint) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_role text := public.crm_current_role();
begin
  if v_role is null or p_id is null then return false; end if;
  if v_role in ('admin','supervisor','auditor','bodega','postventa') then return true; end if;
  if v_role = 'vendedor' then
    return not exists (select 1 from public.crm_conversations where customer_id = p_id)
        or exists (select 1 from public.crm_conversations where customer_id = p_id
                     and (assigned_to = auth.uid() or assigned_to is null));
  end if;
  return false;
end $$;

-- ---------------------------------------------------------------------
-- Habilitar RLS en todas las tablas nuevas
-- ---------------------------------------------------------------------
do $$ declare t text; begin
  for t in select unnest(array[
    'crm_channels','crm_branches','crm_chat_statuses','crm_sales_stages','crm_order_statuses','crm_postsale_statuses',
    'crm_loss_reasons','crm_quotation_statuses','crm_task_types','crm_priorities','crm_priority_rules','crm_roles',
    'crm_permissions','crm_role_permissions','crm_staff','crm_customer_identities','crm_customer_vehicles',
    'crm_customer_notes','crm_conversations','crm_messages','crm_status_history','crm_tags','crm_conversation_tags',
    'crm_follow_up_tasks','crm_activities','crm_quotations','crm_quotation_items','crm_payments','crm_warranties',
    'crm_complaints','crm_ai_analysis','crm_ai_suggestions','crm_alerts','crm_automation_logs','crm_audit_logs',
    'crm_notification_preferences'])
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Catálogos: lectura para el equipo, escritura solo con settings.manage
do $$ declare t text; begin
  for t in select unnest(array[
    'crm_channels','crm_branches','crm_chat_statuses','crm_sales_stages','crm_order_statuses','crm_postsale_statuses',
    'crm_loss_reasons','crm_quotation_statuses','crm_task_types','crm_priorities','crm_priority_rules','crm_roles',
    'crm_permissions','crm_role_permissions','crm_staff'])
  loop
    execute format('drop policy if exists crm_read on public.%I', t);
    execute format('create policy crm_read on public.%I for select to authenticated using (public.crm_is_staff())', t);
    execute format('drop policy if exists crm_manage on public.%I', t);
    execute format('create policy crm_manage on public.%I for all to authenticated using (public.crm_has_perm(''settings.manage'')) with check (public.crm_has_perm(''settings.manage''))', t);
  end loop;
end $$;

-- Etiquetas: el equipo (no auditor) puede crear
drop policy if exists crm_read on public.crm_tags;
create policy crm_read on public.crm_tags for select to authenticated using (public.crm_is_staff());
drop policy if exists crm_write on public.crm_tags;
create policy crm_write on public.crm_tags for insert to authenticated with check (public.crm_has_perm('conversations.write'));
drop policy if exists crm_manage on public.crm_tags;
create policy crm_manage on public.crm_tags for all to authenticated
  using (public.crm_has_perm('settings.manage')) with check (public.crm_has_perm('settings.manage'));

-- ---------------------------------------------------------------------
-- Clientes (tabla existente: se agregan políticas, se mantiene service_only)
-- ---------------------------------------------------------------------
drop policy if exists crm_customers_read on public.customers;
create policy crm_customers_read on public.customers for select to authenticated
  using (public.crm_can_see_customer(id));
drop policy if exists crm_customers_insert on public.customers;
create policy crm_customers_insert on public.customers for insert to authenticated
  with check (public.crm_has_perm('customers.write'));
drop policy if exists crm_customers_update on public.customers;
create policy crm_customers_update on public.customers for update to authenticated
  using (public.crm_has_perm('customers.write') and public.crm_can_see_customer(id))
  with check (public.crm_has_perm('customers.write'));

do $$ declare t text; begin
  for t in select unnest(array['crm_customer_identities','crm_customer_vehicles','crm_customer_notes']) loop
    execute format('drop policy if exists crm_read on public.%I', t);
    execute format('create policy crm_read on public.%I for select to authenticated using (public.crm_can_see_customer(customer_id))', t);
    execute format('drop policy if exists crm_insert on public.%I', t);
    execute format('create policy crm_insert on public.%I for insert to authenticated with check (public.crm_has_perm(''customers.write'') and public.crm_can_see_customer(customer_id))', t);
    execute format('drop policy if exists crm_update on public.%I', t);
    execute format('create policy crm_update on public.%I for update to authenticated using (public.crm_has_perm(''customers.write'') and public.crm_can_see_customer(customer_id))', t);
  end loop;
end $$;
drop policy if exists crm_insert on public.crm_customer_notes;
create policy crm_insert on public.crm_customer_notes for insert to authenticated
  with check (public.crm_is_staff() and public.crm_current_role() <> 'auditor'
              and author_id = auth.uid() and public.crm_can_see_customer(customer_id));

-- ---------------------------------------------------------------------
-- Conversaciones y mensajes
-- ---------------------------------------------------------------------
drop policy if exists crm_read on public.crm_conversations;
create policy crm_read on public.crm_conversations for select to authenticated
  using (public.crm_can_see_conversation(id));
drop policy if exists crm_insert on public.crm_conversations;
create policy crm_insert on public.crm_conversations for insert to authenticated
  with check (public.crm_has_perm('conversations.write')
              and (assigned_to is null or assigned_to = auth.uid() or public.crm_has_perm('conversations.assign')));
drop policy if exists crm_update on public.crm_conversations;
create policy crm_update on public.crm_conversations for update to authenticated
  using ((public.crm_has_perm('conversations.write') or public.crm_has_perm('orders.write'))
         and public.crm_can_see_conversation(id))
  with check (public.crm_has_perm('conversations.write') or public.crm_has_perm('orders.write'));

drop policy if exists crm_read on public.crm_messages;
create policy crm_read on public.crm_messages for select to authenticated
  using (public.crm_can_see_conversation(conversation_id));
drop policy if exists crm_insert on public.crm_messages;
create policy crm_insert on public.crm_messages for insert to authenticated
  with check (direction = 'saliente' and sender_type = 'vendedor' and staff_id = auth.uid()
              and public.crm_has_perm('conversations.write') and public.crm_can_see_conversation(conversation_id));

drop policy if exists crm_read on public.crm_status_history;
create policy crm_read on public.crm_status_history for select to authenticated
  using (public.crm_can_see_conversation(conversation_id));

drop policy if exists crm_read on public.crm_conversation_tags;
create policy crm_read on public.crm_conversation_tags for select to authenticated
  using (public.crm_can_see_conversation(conversation_id));
drop policy if exists crm_insert on public.crm_conversation_tags;
create policy crm_insert on public.crm_conversation_tags for insert to authenticated
  with check (public.crm_has_perm('conversations.write') and public.crm_can_see_conversation(conversation_id));
drop policy if exists crm_delete on public.crm_conversation_tags;
create policy crm_delete on public.crm_conversation_tags for delete to authenticated
  using (public.crm_has_perm('conversations.write') and public.crm_can_see_conversation(conversation_id));

-- ---------------------------------------------------------------------
-- Seguimientos y actividades
-- ---------------------------------------------------------------------
drop policy if exists crm_read on public.crm_follow_up_tasks;
create policy crm_read on public.crm_follow_up_tasks for select to authenticated
  using (assigned_to = auth.uid()
         or (conversation_id is not null and public.crm_can_see_conversation(conversation_id))
         or (conversation_id is null and public.crm_can_see_customer(customer_id)));
drop policy if exists crm_insert on public.crm_follow_up_tasks;
create policy crm_insert on public.crm_follow_up_tasks for insert to authenticated
  with check ((public.crm_has_perm('conversations.write') or public.crm_has_perm('orders.write'))
              and ((conversation_id is not null and public.crm_can_see_conversation(conversation_id))
                   or (conversation_id is null and public.crm_can_see_customer(customer_id))));
drop policy if exists crm_update on public.crm_follow_up_tasks;
create policy crm_update on public.crm_follow_up_tasks for update to authenticated
  using ((public.crm_has_perm('conversations.write') or public.crm_has_perm('orders.write'))
         and (assigned_to = auth.uid() or public.crm_can_see_conversation(conversation_id)
              or (conversation_id is null and public.crm_can_see_customer(customer_id))));

drop policy if exists crm_read on public.crm_activities;
create policy crm_read on public.crm_activities for select to authenticated
  using ((conversation_id is not null and public.crm_can_see_conversation(conversation_id))
         or (conversation_id is null and public.crm_can_see_customer(customer_id)));
drop policy if exists crm_insert on public.crm_activities;
create policy crm_insert on public.crm_activities for insert to authenticated
  with check (public.crm_is_staff() and public.crm_current_role() <> 'auditor' and actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------
drop policy if exists crm_read on public.crm_quotations;
create policy crm_read on public.crm_quotations for select to authenticated
  using (seller_id = auth.uid()
         or (conversation_id is not null and public.crm_can_see_conversation(conversation_id))
         or (conversation_id is null and public.crm_can_see_customer(customer_id)));
drop policy if exists crm_insert on public.crm_quotations;
create policy crm_insert on public.crm_quotations for insert to authenticated
  with check (public.crm_has_perm('quotations.write')
              and (conversation_id is null or public.crm_can_see_conversation(conversation_id)));
drop policy if exists crm_update on public.crm_quotations;
create policy crm_update on public.crm_quotations for update to authenticated
  using (public.crm_has_perm('quotations.write')
         and (seller_id = auth.uid() or public.crm_can_see_conversation(conversation_id)
              or (conversation_id is null and public.crm_can_see_customer(customer_id))));

drop policy if exists crm_read on public.crm_quotation_items;
create policy crm_read on public.crm_quotation_items for select to authenticated
  using (exists (select 1 from public.crm_quotations q where q.id = quotation_id));
drop policy if exists crm_write on public.crm_quotation_items;
create policy crm_write on public.crm_quotation_items for all to authenticated
  using (public.crm_has_perm('quotations.write') and exists (select 1 from public.crm_quotations q where q.id = quotation_id))
  with check (public.crm_has_perm('quotations.write') and exists (select 1 from public.crm_quotations q where q.id = quotation_id));

-- ---------------------------------------------------------------------
-- Pedidos (tablas existentes) y pagos
-- ---------------------------------------------------------------------
drop policy if exists crm_orders_read on public.orders;
create policy crm_orders_read on public.orders for select to authenticated
  using (public.crm_has_perm('orders.read')
         and (public.crm_current_role() in ('admin','supervisor','auditor','bodega','postventa')
              or (crm_conversation_id is not null and public.crm_can_see_conversation(crm_conversation_id))));
drop policy if exists crm_orders_update on public.orders;
create policy crm_orders_update on public.orders for update to authenticated
  using (public.crm_has_perm('orders.write')
         and (public.crm_current_role() in ('admin','supervisor','bodega')
              or (crm_conversation_id is not null and public.crm_can_see_conversation(crm_conversation_id))))
  with check (public.crm_has_perm('orders.write'));

drop policy if exists crm_order_items_read on public.order_items;
create policy crm_order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

drop policy if exists crm_shipping_read on public.shipping_tracking;
create policy crm_shipping_read on public.shipping_tracking for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
drop policy if exists crm_shipping_write on public.shipping_tracking;
create policy crm_shipping_write on public.shipping_tracking for all to authenticated
  using (public.crm_has_perm('orders.write') and exists (select 1 from public.orders o where o.id = order_id))
  with check (public.crm_has_perm('orders.write') and exists (select 1 from public.orders o where o.id = order_id));

drop policy if exists crm_returns_read on public.returns;
create policy crm_returns_read on public.returns for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor','auditor','postventa','bodega'));
drop policy if exists crm_returns_write on public.returns;
create policy crm_returns_write on public.returns for all to authenticated
  using (public.crm_has_perm('returns.decide')) with check (public.crm_has_perm('returns.decide'));

drop policy if exists crm_read on public.crm_payments;
create policy crm_read on public.crm_payments for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor','auditor','bodega')
         or (conversation_id is not null and public.crm_can_see_conversation(conversation_id)));
drop policy if exists crm_insert on public.crm_payments;
create policy crm_insert on public.crm_payments for insert to authenticated
  with check ((public.crm_has_perm('conversations.write') or public.crm_has_perm('orders.write'))
              and (conversation_id is null or public.crm_can_see_conversation(conversation_id)));
drop policy if exists crm_update on public.crm_payments;
create policy crm_update on public.crm_payments for update to authenticated
  using (public.crm_has_perm('payments.confirm') or (status = 'en_revision' and created_by = auth.uid()));

-- ---------------------------------------------------------------------
-- Postventa
-- ---------------------------------------------------------------------
drop policy if exists crm_read on public.crm_warranties;
create policy crm_read on public.crm_warranties for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor','auditor','postventa')
         or (conversation_id is not null and public.crm_can_see_conversation(conversation_id)));
drop policy if exists crm_insert on public.crm_warranties;
create policy crm_insert on public.crm_warranties for insert to authenticated
  with check (public.crm_has_perm('conversations.write'));
drop policy if exists crm_update on public.crm_warranties;
create policy crm_update on public.crm_warranties for update to authenticated
  using (public.crm_has_perm('warranties.decide'));

drop policy if exists crm_read on public.crm_complaints;
create policy crm_read on public.crm_complaints for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor','auditor','postventa')
         or (conversation_id is not null and public.crm_can_see_conversation(conversation_id)));
drop policy if exists crm_insert on public.crm_complaints;
create policy crm_insert on public.crm_complaints for insert to authenticated
  with check (public.crm_has_perm('conversations.write'));
drop policy if exists crm_update on public.crm_complaints;
create policy crm_update on public.crm_complaints for update to authenticated
  using (public.crm_current_role() in ('admin','supervisor','postventa'));

-- ---------------------------------------------------------------------
-- IA, alertas, logs, auditoría, preferencias
-- ---------------------------------------------------------------------
drop policy if exists crm_read on public.crm_ai_analysis;
create policy crm_read on public.crm_ai_analysis for select to authenticated
  using (public.crm_can_see_conversation(conversation_id));
drop policy if exists crm_read on public.crm_ai_suggestions;
create policy crm_read on public.crm_ai_suggestions for select to authenticated
  using (public.crm_can_see_conversation(conversation_id));
drop policy if exists crm_update on public.crm_ai_suggestions;
create policy crm_update on public.crm_ai_suggestions for update to authenticated
  using (public.crm_has_perm('conversations.write') and public.crm_can_see_conversation(conversation_id));

drop policy if exists crm_read on public.crm_alerts;
create policy crm_read on public.crm_alerts for select to authenticated
  using (assigned_to = auth.uid() or public.crm_current_role() in ('admin','supervisor','auditor')
         or (assigned_to is null and public.crm_has_perm('conversations.write')));
drop policy if exists crm_update on public.crm_alerts;
create policy crm_update on public.crm_alerts for update to authenticated
  using (assigned_to = auth.uid() or public.crm_has_perm('conversations.assign'));

drop policy if exists crm_read on public.crm_automation_logs;
create policy crm_read on public.crm_automation_logs for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor'));

drop policy if exists crm_read on public.crm_audit_logs;
create policy crm_read on public.crm_audit_logs for select to authenticated
  using (public.crm_has_perm('audit.read'));

drop policy if exists crm_own on public.crm_notification_preferences;
create policy crm_own on public.crm_notification_preferences for all to authenticated
  using (user_id = auth.uid() or public.crm_has_perm('settings.manage'))
  with check (user_id = auth.uid() or public.crm_has_perm('settings.manage'));

-- ---------------------------------------------------------------------
-- Funciones: nada del CRM es invocable por anon; las internas solo por servicio
-- ---------------------------------------------------------------------
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'crm\_%'
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

revoke execute on function public.crm_resolve_customer(text, text, text, text) from authenticated;
revoke execute on function public.crm_pick_assignee(bigint) from authenticated;
revoke execute on function public.crm_sync_next_action(uuid) from authenticated;
revoke execute on function public.crm_quote_recalc(uuid) from authenticated;
revoke execute on function public.crm_advance_tasks(uuid, text, text, interval, text[], text) from authenticated;

revoke all on public.crm_v_inbox, public.crm_v_open_tasks, public.crm_v_possible_duplicates from anon;
