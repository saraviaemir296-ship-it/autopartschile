-- =====================================================================
-- CRM — Migración 06: automatizaciones (Fase 3 / workflows 1, 3, 5, 7, 11, 12)
--  1. Bandeja de salida (outbox) idempotente para integraciones: Telegram, Mercado Libre.
--  2. Inventario consistente entre canales:
--     - Venta del CRM pagada → descuenta stock (misma función que usa Webpay).
--     - Pieza de vehículo en desarme con stock 0 → "vendida" (desaparece del sitio).
--     - Pieza vendida publicada en Mercado Libre → se encola su pausa.
--  3. Solicitudes de cotización del sitio web → conversación en el CRM.
--  4. Alertas automáticas (cada 5 min) con aviso por Telegram en horario de atención.
--  5. Mantención diaria: cotizaciones vencidas → seguimiento "recuperar cliente".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Outbox
-- ---------------------------------------------------------------------
create table if not exists public.crm_outbox (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('telegram','meli_pausar')),
  payload jsonb not null,
  status text not null default 'pendiente' check (status in ('pendiente','enviado','error','descartado')),
  attempts int not null default 0,
  run_after timestamptz not null default now(),
  dedupe_key text,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create unique index if not exists crm_outbox_dedupe_pending on public.crm_outbox (dedupe_key)
  where dedupe_key is not null and status = 'pendiente';
create index if not exists crm_outbox_due on public.crm_outbox (run_after) where status = 'pendiente';
alter table public.crm_outbox enable row level security;
drop policy if exists crm_read on public.crm_outbox;
create policy crm_read on public.crm_outbox for select to authenticated
  using (public.crm_current_role() in ('admin','supervisor'));

-- Horario de atención (America/Santiago): L-V 10:00-18:00, S 10:00-15:30.
create or replace function public.crm_in_business_hours(p_ts timestamptz default now()) returns boolean
language sql stable set search_path = public as $$
  select case extract(isodow from l)
           when 6 then l::time >= '10:00' and l::time < '15:30'
           when 7 then false
           else l::time >= '10:00' and l::time < '18:00' end
  from (select p_ts at time zone 'America/Santiago' as l) s
$$;

create or replace function public.crm_next_business_time(p_ts timestamptz default now()) returns timestamptz
language plpgsql stable set search_path = public as $$
declare d date := (p_ts at time zone 'America/Santiago')::date; i int;
begin
  if public.crm_in_business_hours(p_ts) then return p_ts; end if;
  for i in 0..7 loop
    if extract(isodow from d + i) <> 7 then
      if ((d + i) + time '10:00') at time zone 'America/Santiago' > p_ts then
        return ((d + i) + time '10:00') at time zone 'America/Santiago';
      end if;
    end if;
  end loop;
  return p_ts;
end $$;

create or replace function public.crm_enqueue(p_kind text, p_payload jsonb, p_dedupe text default null,
                                              p_respect_hours boolean default false) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  insert into public.crm_outbox (kind, payload, dedupe_key, run_after)
  values (p_kind, p_payload, p_dedupe, case when p_respect_hours then public.crm_next_business_time(now()) else now() end)
  on conflict (dedupe_key) where dedupe_key is not null and status = 'pendiente' do nothing
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 2. Inventario consistente
-- ---------------------------------------------------------------------
-- Pieza de un vehículo en desarme que llega a stock 0 = vendida.
create or replace function public.crm_products_mark_sold() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.vehiculo_id is not null and coalesce(new.stock, 1) <= 0 and coalesce(old.stock, 1) > 0
     and new.part_status in ('desmontada','en_vehiculo') then
    new.part_status := 'vendida';
  end if;
  return new;
end $$;
drop trigger if exists crm_products_mark_sold on public.products;
create trigger crm_products_mark_sold before update of stock on public.products
  for each row execute function public.crm_products_mark_sold();

-- Pieza vendida o sin stock que sigue publicada en Mercado Libre → pausar.
create or replace function public.crm_products_meli_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.meli_item_id is not null and coalesce(new.meli_status, 'active') = 'active'
     and (new.part_status in ('vendida','no_disponible') or coalesce(new.stock, 1) <= 0 or not new.is_active)
     and not (old.part_status in ('vendida','no_disponible') or coalesce(old.stock, 1) <= 0 or not old.is_active) then
    perform public.crm_enqueue('meli_pausar',
      jsonb_build_object('item_id', new.meli_item_id, 'product_id', new.id, 'sku', new.sku, 'motivo', new.part_status),
      'meli_pausar:' || new.meli_item_id);
  end if;
  return null;
end $$;
drop trigger if exists crm_products_meli_sync on public.products;
create trigger crm_products_meli_sync after update of stock, part_status, is_active on public.products
  for each row execute function public.crm_products_meli_sync();

-- Venta creada desde el CRM y pagada → descontar stock (una sola vez por pedido).
create or replace function public.crm_commit_order_stock(p_order_id bigint) returns int
language plpgsql security definer set search_path = public as $$
declare it record; v_ok boolean; v_missing text[] := '{}'; v_done int := 0; o record;
begin
  insert into public.crm_automation_logs (workflow, idempotency_key, status, payload)
  values ('descontar_stock_crm', p_order_id::text, 'ok', jsonb_build_object('order_id', p_order_id))
  on conflict (workflow, idempotency_key) where idempotency_key is not null and status in ('ok','omitido') do nothing;
  if not found then return 0; end if;   -- ya se descontó antes

  for it in select oi.product_id, oi.quantity, oi.name from public.order_items oi
             where oi.order_id = p_order_id and oi.product_id is not null loop
    v_ok := public.try_decrement_product_stock(it.product_id, it.quantity);
    if v_ok then v_done := v_done + 1; else v_missing := v_missing || it.name; end if;
  end loop;

  if array_length(v_missing, 1) > 0 then
    select id, crm_conversation_id, customer_id into o from public.orders where id = p_order_id;
    insert into public.crm_activities (conversation_id, customer_id, activity_type, summary, payload)
    values (o.crm_conversation_id, o.customer_id, 'stock_insuficiente',
            'Pedido #' || p_order_id || ' pagado pero sin stock: ' || array_to_string(v_missing, ', '),
            jsonb_build_object('order_id', p_order_id, 'faltantes', v_missing));
    perform public.crm_enqueue('telegram', jsonb_build_object('text',
      '⚠️ Pedido #' || p_order_id || ' PAGADO pero sin stock en sistema: ' || array_to_string(v_missing, ', ') ||
      '. Revisar antes de despachar.'), 'stock:' || p_order_id);
  end if;
  return v_done;
end $$;

create or replace function public.crm_orders_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Solo pedidos creados por el CRM: los de Webpay ya descuentan stock en webpay-confirm.
  if new.fulfillment_status = 'pagado' and old.fulfillment_status is distinct from 'pagado'
     and new.crm_quotation_id is not null then
    perform public.crm_commit_order_stock(new.id);
  end if;
  return null;
end $$;
drop trigger if exists crm_orders_paid on public.orders;
create trigger crm_orders_paid after update of fulfillment_status on public.orders
  for each row execute function public.crm_orders_paid();

-- ---------------------------------------------------------------------
-- 3. Cotizaciones del sitio web → CRM
-- ---------------------------------------------------------------------
create or replace function public.crm_ingest_quote_request(p_id bigint) returns uuid
language plpgsql security definer set search_path = public as $$
declare q record; v_cust bigint; v_conv uuid; v_thread text;
begin
  select * into q from public.quote_requests where id = p_id;
  if not found then return null; end if;
  v_thread := 'cotizacion-web-' || q.id;
  select id into v_conv from public.crm_conversations where channel_code = 'web' and external_thread_id = v_thread;
  if v_conv is not null then return v_conv; end if;     -- idempotente

  v_cust := public.crm_resolve_customer('web', null, q.phone, q.name);
  insert into public.crm_conversations (customer_id, channel_code, external_thread_id, contact_name, contact_phone, sales_stage)
  values (v_cust, 'web', v_thread, q.name, q.phone, 'cotizacion_solicitada')
  returning id into v_conv;
  insert into public.crm_messages (conversation_id, channel_code, external_message_id, direction, sender_type, body, sent_at, raw)
  values (v_conv, 'web', 'quote_request:' || q.id, 'entrante', 'cliente',
          'Solicitud de cotización desde autopartschile.cl' || E'\n' ||
          'Repuesto: ' || coalesce(q.part_needed, '-') || E'\n' ||
          'Vehículo: ' || coalesce(q.vehicle, '-') ||
          coalesce(E'\nComentario: ' || nullif(q.comment, ''), '') ||
          coalesce(E'\nPágina: ' || nullif(q.page_url, ''), ''),
          q.created_at, jsonb_build_object('contact_name', q.name, 'quote_request_id', q.id));
  return v_conv;
end $$;

create or replace function public.crm_quote_requests_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.crm_ingest_quote_request(new.id);
  perform public.crm_enqueue('telegram', jsonb_build_object('text',
    '🧾 Nueva cotización web: ' || coalesce(new.part_needed, '?') || ' — ' || coalesce(new.vehicle, '?') ||
    ' (' || coalesce(new.name, '') || ' ' || coalesce(new.phone, '') || ')'), 'quote_request:' || new.id, true);
  return null;
exception when others then
  -- Nunca romper el formulario público: se registra el error y sigue.
  insert into public.crm_automation_logs (workflow, idempotency_key, status, error, payload)
  values ('cotizacion_web', new.id::text, 'error', sqlerrm, to_jsonb(new));
  return null;
end $$;
drop trigger if exists crm_quote_requests_after on public.quote_requests;
create trigger crm_quote_requests_after after insert on public.quote_requests
  for each row execute function public.crm_quote_requests_after();

-- ---------------------------------------------------------------------
-- 4. Alertas automáticas
-- ---------------------------------------------------------------------
create or replace function public.crm_generate_alerts() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_new uuid[]; v_resolved int; v_count int; v_text text;
begin
  -- 4.1 Resolver alertas cuya causa ya desapareció
  with r as (
    update public.crm_alerts a set status = 'resuelta', resolved_at = now()
     where a.status <> 'resuelta' and (
       (a.alert_type in ('chat_sin_responder','cliente_esperando') and exists (select 1 from public.crm_conversations c
          join public.crm_chat_statuses cs on cs.code = c.chat_status
          where c.id = a.conversation_id and (cs.is_closed or c.last_outbound_at >= c.last_inbound_at)))
       or (a.alert_type = 'seguimiento_vencido' and not exists (select 1 from public.crm_follow_up_tasks t
          where t.id = a.task_id and t.status in ('pendiente','en_curso')))
       or (a.alert_type = 'pago_pendiente' and not exists (select 1 from public.crm_payments p
          where p.conversation_id = a.conversation_id and p.status = 'en_revision'))
       or (a.alert_type = 'cotizacion_sin_seguimiento' and not exists (select 1 from public.crm_quotations q
          where q.conversation_id = a.conversation_id and q.status in ('enviada','vista')))
       or (a.alert_type = 'cliente_no_responde' and exists (select 1 from public.crm_conversations c
          where c.id = a.conversation_id and c.last_inbound_at > a.created_at))
       or (a.alert_type = 'pedido_atrasado' and not exists (select 1 from public.orders o
          where o.id = a.order_id and o.fulfillment_status in ('pagado','preparando','preparado','despacho_pendiente')))
       or (a.alert_type = 'garantia_pendiente' and not exists (select 1 from public.crm_warranties w
          where w.conversation_id = a.conversation_id and w.status in ('solicitada','en_evaluacion'))))
    returning 1)
  select count(*) into v_resolved from r;

  -- 4.2 Crear alertas nuevas (una por episodio, sin duplicar)
  with candidates as (
    -- Chat esperando respuesta más allá del SLA de su prioridad (solo cuenta tiempo desde el último mensaje)
    select 'chat_sin_responder'::text t, c.id conv, null::uuid task, null::bigint ord, c.assigned_to who, c.priority sev,
           '⏱ ' || coalesce(c.contact_name, c.contact_phone, 'Cliente') || ' (' || c.channel_code || ') espera respuesta hace ' ||
           floor(extract(epoch from now() - c.last_inbound_at) / 60)::int || ' min: "' || left(coalesce(c.last_message_preview, ''), 80) || '"' msg,
           'chat:' || c.id || ':' || extract(epoch from c.last_inbound_at)::bigint dk
      from public.crm_conversations c
      join public.crm_chat_statuses cs on cs.code = c.chat_status
      join public.crm_priorities p on p.code = c.priority
     where c.deleted_at is null and not cs.is_closed and c.chat_status not in ('spam','duplicado')
       and c.last_inbound_at is not null and (c.last_outbound_at is null or c.last_inbound_at > c.last_outbound_at)
       and c.last_inbound_at < now() - make_interval(mins => p.sla_first_response_minutes)
    union all
    select 'seguimiento_vencido', t.conversation_id, t.id, null, t.assigned_to, t.priority,
           '📌 Seguimiento vencido: ' || t.title || coalesce(' — ' || c.contact_name, ''),
           'task:' || t.id
      from public.crm_follow_up_tasks t left join public.crm_conversations c on c.id = t.conversation_id
     where t.status in ('pendiente','en_curso') and t.due_at < now() and t.task_type <> 'primera_respuesta'
    union all
    select 'pago_pendiente', p.conversation_id, null, p.order_id, c.assigned_to, 'critica',
           '💰 Pago por confirmar: $' || to_char(p.amount, 'FM999G999G999') || ' (' || p.method || ')' || coalesce(' — ' || c.contact_name, ''),
           'pay:' || p.id
      from public.crm_payments p left join public.crm_conversations c on c.id = p.conversation_id
     where p.status = 'en_revision' and p.reported_at < now() - interval '30 minutes'
    union all
    select 'cotizacion_sin_seguimiento', q.conversation_id, null, null, coalesce(q.seller_id, c.assigned_to), 'alta',
           '🧾 ' || q.number || ' ($' || to_char(q.total, 'FM999G999G999') || ') enviada hace +24 h sin respuesta' || coalesce(' — ' || c.contact_name, ''),
           'quote:' || q.id
      from public.crm_quotations q join public.crm_conversations c on c.id = q.conversation_id
     where q.status in ('enviada','vista') and q.sent_at < now() - interval '24 hours'
       and (c.last_inbound_at is null or c.last_inbound_at < q.sent_at)
    union all
    select 'cliente_no_responde', c.id, null, null, c.assigned_to, 'media',
           '🔕 ' || coalesce(c.contact_name, c.contact_phone, 'Cliente') || ' no responde hace 48 h (etapa: ' || c.sales_stage || ')',
           'noresp:' || c.id || ':' || extract(epoch from c.last_outbound_at)::bigint
      from public.crm_conversations c join public.crm_sales_stages s on s.code = c.sales_stage
     where c.deleted_at is null and not s.is_won and not s.is_lost
       and c.sales_stage not in ('nuevo_prospecto')
       and c.last_outbound_at is not null and (c.last_inbound_at is null or c.last_outbound_at > c.last_inbound_at)
       and c.last_outbound_at < now() - interval '48 hours'
    union all
    select 'pedido_atrasado', o.crm_conversation_id, null, o.id, c.assigned_to, 'alta',
           '📦 Pedido #' || o.id || ' lleva +48 h en "' || o.fulfillment_status || '"',
           'order:' || o.id || ':' || o.fulfillment_status
      from public.orders o left join public.crm_conversations c on c.id = o.crm_conversation_id
     where o.fulfillment_status in ('pagado','preparando','preparado','despacho_pendiente')
       and o.updated_at < now() - interval '48 hours'
    union all
    select 'garantia_pendiente', w.conversation_id, null, w.order_id, c.assigned_to, 'critica',
           '🛠 Garantía sin resolver hace +48 h' || coalesce(' — ' || c.contact_name, ''),
           'warranty:' || w.id
      from public.crm_warranties w left join public.crm_conversations c on c.id = w.conversation_id
     where w.status in ('solicitada','en_evaluacion') and w.created_at < now() - interval '48 hours'
  ), ins as (
    insert into public.crm_alerts (alert_type, conversation_id, task_id, order_id, assigned_to, severity, message, dedupe_key)
    select t, conv, task, ord, who, sev, msg, dk from candidates
    on conflict (dedupe_key) where status <> 'resuelta' do nothing
    returning id
  )
  select array_agg(id) into v_new from ins;

  v_count := coalesce(array_length(v_new, 1), 0);
  if v_count > 0 then
    -- Hasta 5 avisos individuales; si son más, un resumen (para no saturar).
    if v_count <= 5 then
      perform public.crm_enqueue('telegram', jsonb_build_object('text', a.message), 'alert:' || a.id, true)
         from public.crm_alerts a where a.id = any(v_new);
    else
      select string_agg('• ' || a.message, E'\n' order by a.severity, a.created_at) into v_text
        from (select * from public.crm_alerts where id = any(v_new) order by created_at limit 12) a;
      perform public.crm_enqueue('telegram', jsonb_build_object('text',
        '🔔 ' || v_count || ' alertas nuevas en el CRM:' || E'\n' || v_text ||
        case when v_count > 12 then E'\n…y ' || (v_count - 12) || ' más.' else '' end),
        'alert-batch:' || to_char(now(), 'YYYYMMDDHH24MI'), true);
    end if;
    update public.crm_alerts set notified_at = now() where id = any(v_new);
  end if;

  insert into public.crm_automation_logs (workflow, status, payload)
  values ('alertas', 'ok', jsonb_build_object('nuevas', v_count, 'resueltas', v_resolved));
  return jsonb_build_object('nuevas', v_count, 'resueltas', v_resolved);
exception when others then
  insert into public.crm_automation_logs (workflow, status, error) values ('alertas', 'error', sqlerrm);
  return jsonb_build_object('error', sqlerrm);
end $$;

-- ---------------------------------------------------------------------
-- 5. Mantención diaria
-- ---------------------------------------------------------------------
create or replace function public.crm_daily_maintenance() returns jsonb
language plpgsql security definer set search_path = public as $$
declare q record; v_exp int := 0;
begin
  for q in select id, number, conversation_id from public.crm_quotations
            where status in ('enviada','vista') and valid_until < current_date and deleted_at is null loop
    update public.crm_quotations set status = 'vencida' where id = q.id;
    if q.conversation_id is not null then
      perform public.crm_advance_tasks(q.conversation_id, 'recuperar_cliente', 'Recuperar cliente (venció ' || q.number || ')',
        interval '2 hours', array['confirmar_cotizacion'], 'Cotización vencida');
    end if;
    v_exp := v_exp + 1;
  end loop;
  -- Limpieza: alertas resueltas y logs de más de 90 días
  delete from public.crm_alerts where status = 'resuelta' and resolved_at < now() - interval '90 days';
  delete from public.crm_automation_logs where created_at < now() - interval '90 days' and workflow in ('alertas');
  delete from public.crm_outbox where status in ('enviado','descartado') and processed_at < now() - interval '30 days';
  insert into public.crm_automation_logs (workflow, status, payload) values ('mantencion_diaria', 'ok', jsonb_build_object('vencidas', v_exp));
  return jsonb_build_object('cotizaciones_vencidas', v_exp);
end $$;

-- Permisos: nada de esto lo ejecuta anon ni el equipo directamente.
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('crm_in_business_hours','crm_next_business_time','crm_enqueue',
              'crm_products_mark_sold','crm_products_meli_sync','crm_commit_order_stock','crm_orders_paid',
              'crm_ingest_quote_request','crm_quote_requests_after','crm_generate_alerts','crm_daily_maintenance')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- La fecha de modificación del pedido se actualiza cuando cambia su estado de despacho (lo usa "pedido atrasado").
create or replace function public.crm_orders_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.fulfillment_status is distinct from old.fulfillment_status then new.updated_at := now(); end if;
  return new;
end $$;
drop trigger if exists crm_orders_touch on public.orders;
create trigger crm_orders_touch before update of fulfillment_status on public.orders
  for each row execute function public.crm_orders_touch();

-- ---------------------------------------------------------------------
-- Autoprueba de automatizaciones (se deshace sola)
-- ---------------------------------------------------------------------
create or replace function public.crm_selftest_automatizaciones()
returns table (n int, prueba text, ok boolean, detalle text) language plpgsql as $fn$
declare r text[] := '{}'; o boolean[] := '{}'; d text[] := '{}';
  v_qr bigint; v_conv uuid; v_txt text; v_cnt int; v_veh bigint; v_prod bigint; v_cust bigint; v_q uuid; v_order bigint; v_res jsonb;
begin
  begin
    -- 1. Cotización web → CRM
    insert into public.quote_requests (name, phone, vehicle, part_needed, comment)
    values ('Prueba Web', '+56 9 3333 4444', 'Suzuki Swift 2015', 'Foco trasero derecho', 'test') returning id into v_qr;
    select c.id, c.sales_stage || '/' || c.channel_code || '/' || c.priority into v_conv, v_txt
      from public.crm_conversations c where c.external_thread_id = 'cotizacion-web-' || v_qr;
    select count(*) into v_cnt from public.crm_outbox where dedupe_key = 'quote_request:' || v_qr;
    r := r || 'Cotización del sitio entra al CRM con prioridad y aviso'::text;
    o := o || (v_conv is not null and v_txt = 'cotizacion_solicitada/web/alta' and v_cnt = 1);
    d := d || format('%s outbox=%s', v_txt, v_cnt);

    -- 2. Venta del CRM pagada → stock, vendida y pausa en Mercado Libre
    select id into v_veh from public.vehiculos limit 1;
    if v_veh is null then insert into public.vehiculos (marca, modelo) values ('Test', 'Test') returning id into v_veh; end if;
    insert into public.products (sku, name, stock, part_status, vehiculo_id, meli_item_id, meli_status, is_active, price_sale)
    values ('CRM-SELFTEST-1', 'Pieza de prueba', 1, 'desmontada', v_veh, 'MLC-SELFTEST', 'active', true, 10000)
    returning id into v_prod;
    v_cust := public.crm_resolve_customer('whatsapp', '56933334445', '933334445', 'Comprador Test');
    insert into public.crm_quotations (customer_id) values (v_cust) returning id into v_q;
    insert into public.orders (customer_id, source, total, status, crm_quotation_id, fulfillment_status)
    values (v_cust, 'whatsapp', 10000, 'pending', v_q, 'pendiente_de_pago') returning id into v_order;
    insert into public.order_items (order_id, product_id, sku, name, quantity, unit_price, total_price)
    values (v_order, v_prod, 'CRM-SELFTEST-1', 'Pieza de prueba', 1, 10000, 10000);
    update public.orders set fulfillment_status = 'pagado' where id = v_order;
    update public.orders set fulfillment_status = 'pagado' where id = v_order;  -- repetido: no debe descontar 2 veces
    select stock || '/' || part_status into v_txt from public.products where id = v_prod;
    select count(*) into v_cnt from public.crm_outbox where kind = 'meli_pausar' and payload ->> 'item_id' = 'MLC-SELFTEST';
    r := r || 'Venta pagada descuenta stock 1 vez, marca vendida y pausa en ML'::text;
    o := o || (v_txt = '0/vendida' and v_cnt = 1); d := d || format('stock/estado=%s pausas_ml=%s', v_txt, v_cnt);

    -- 3. Alerta de chat sin responder, y se resuelve al responder
    insert into public.crm_conversations (customer_id, channel_code, external_thread_id) values (v_cust, 'whatsapp', '56933334445') returning id into v_conv;
    insert into public.crm_messages (conversation_id, channel_code, external_message_id, direction, sender_type, body, sent_at)
    values (v_conv, 'whatsapp', 'wamid.SELFTEST', 'entrante', 'cliente', '¿Tiene los datos de transferencia?', now() - interval '40 minutes');
    v_res := public.crm_generate_alerts();
    select count(*) into v_cnt from public.crm_alerts where conversation_id = v_conv and alert_type = 'chat_sin_responder' and status = 'abierta';
    r := r || 'Chat esperando más que el SLA genera alerta'::text;
    o := o || (v_cnt = 1); d := d || format('alertas=%s %s', v_cnt, v_res);

    insert into public.crm_messages (conversation_id, channel_code, direction, sender_type, body)
    values (v_conv, 'whatsapp', 'saliente', 'vendedor', 'Sí, le envío los datos.');
    perform public.crm_generate_alerts();
    select count(*) into v_cnt from public.crm_alerts where conversation_id = v_conv and alert_type = 'chat_sin_responder' and status = 'resuelta';
    r := r || 'Al responder, la alerta se resuelve sola'::text;
    o := o || (v_cnt = 1); d := d || format('resueltas=%s', v_cnt);

    -- 4. Horario: domingo no se notifica; el aviso queda para el lunes 10:00
    v_txt := to_char(public.crm_next_business_time(timestamptz '2026-11-15 15:00:00-03') at time zone 'America/Santiago', 'Dy HH24:MI');
    r := r || 'Avisos fuera de horario quedan para la apertura'::text;
    o := o || (v_txt = 'Mon 10:00'); d := d || v_txt;
    raise exception 'rollback_auto';
  exception when others then
    if sqlerrm <> 'rollback_auto' then r := r || 'ERROR INESPERADO'::text; o := o || false; d := d || (sqlstate || ' ' || sqlerrm); end if;
  end;
  return query select (row_number() over ())::int, * from unnest(r, o, d);
end $fn$;
revoke execute on function public.crm_selftest_automatizaciones() from public, anon, authenticated;
