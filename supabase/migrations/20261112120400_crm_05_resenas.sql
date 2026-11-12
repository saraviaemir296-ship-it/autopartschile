-- =====================================================================
-- CRM — Migración 05: solicitud de reseñas en Google (Workflow 10)
-- Política de Google: se pide reseña a TODO cliente que compró (no solo a
-- los satisfechos: eso es "review gating", prohibido), sin incentivos.
-- La IA solo deja el mensaje propuesto; una persona aprueba cada envío.
-- =====================================================================

create table if not exists public.crm_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
alter table public.crm_settings enable row level security;
drop policy if exists crm_read on public.crm_settings;
create policy crm_read on public.crm_settings for select to authenticated using (public.crm_is_staff());
drop policy if exists crm_manage on public.crm_settings;
create policy crm_manage on public.crm_settings for all to authenticated
  using (public.crm_has_perm('settings.manage')) with check (public.crm_has_perm('settings.manage'));

insert into public.crm_settings (key, value, description) values
  ('google_review_url', to_jsonb('https://search.google.com/local/writereview?placeid=ChIJe7_czJLZYpYRouV8w01uQ4Q'::text),
   'Link directo para dejar reseña (ficha Desarmaduría Saravia, Av. Lo Blanco 1072)'),
  ('review_delay_hours', to_jsonb(24), 'Horas después de la entrega/venta para pedir la reseña'),
  ('review_cooldown_days', to_jsonb(90), 'No volver a pedir reseña al mismo cliente antes de estos días'),
  ('review_message', to_jsonb('Hola{nombre}, gracias por comprar en Desarmaduría Saravia. ¿Nos ayudas con una reseña en Google? Toma un minuto y nos sirve mucho: {link}'::text),
   'Plantilla. {nombre} y {link} se reemplazan. Sin incentivos ni pedir que sea positiva (política de Google).')
on conflict (key) do nothing;

create or replace function public.crm_setting(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select value from public.crm_settings where key = p_key
$$;

create or replace function public.crm_review_message(p_conversation_id uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_name text;
begin
  select nullif(btrim(coalesce(cu.first_name, split_part(c.contact_name, ' ', 1), '')), '') into v_name
    from public.crm_conversations c left join public.customers cu on cu.id = c.customer_id
   where c.id = p_conversation_id;
  return replace(replace(public.crm_setting('review_message') #>> '{}',
                 '{nombre}', coalesce(' ' || v_name, '')),
                 '{link}', public.crm_setting('google_review_url') #>> '{}');
end $$;

-- Programa la solicitud: tarea + mensaje propuesto (para aprobar con un clic).
create or replace function public.crm_schedule_review(p_conversation_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c record; v_task uuid; v_cooldown int := (public.crm_setting('review_cooldown_days') #>> '{}')::int;
begin
  select * into c from public.crm_conversations where id = p_conversation_id;
  if not found then return null; end if;
  -- Un cliente no recibe dos solicitudes dentro del período de espera (por cliente, en cualquier canal).
  if exists (select 1 from public.crm_follow_up_tasks t
              where t.task_type = 'solicitar_resena' and t.status <> 'cancelada'
                and t.created_at > now() - make_interval(days => v_cooldown)
                and (t.conversation_id = c.id or (c.customer_id is not null and t.customer_id = c.customer_id))) then
    return null;
  end if;
  insert into public.crm_follow_up_tasks (conversation_id, customer_id, task_type, title, assigned_to, due_at, priority, is_system, description)
  values (c.id, c.customer_id, 'solicitar_resena', 'Pedir reseña en Google', c.assigned_to,
          now() + make_interval(hours => (public.crm_setting('review_delay_hours') #>> '{}')::int), 'baja', true,
          'Se pide a todo cliente que compró, sin incentivos y sin pedir que sea positiva.')
  returning id into v_task;
  insert into public.crm_ai_suggestions (conversation_id, suggestion_type, content, payload)
  values (c.id, 'respuesta', public.crm_review_message(c.id), jsonb_build_object('task_id', v_task, 'motivo', 'solicitar_resena'));
  return v_task;
end $$;

-- Disparadores: venta concretada (también presencial) o pedido entregado/retirado.
create or replace function public.crm_reviews_on_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.sales_stage = 'venta_concretada' and old.sales_stage is distinct from 'venta_concretada')
     or (new.order_status = 'entregado' and old.order_status is distinct from 'entregado') then
    perform public.crm_schedule_review(new.id);
  end if;
  return null;
end $$;
drop trigger if exists crm_reviews_on_conversation on public.crm_conversations;
create trigger crm_reviews_on_conversation after update of sales_stage, order_status on public.crm_conversations
  for each row execute function public.crm_reviews_on_conversation();

-- Al completar la tarea, el estado de postventa pasa a "reseña solicitada".
create or replace function public.crm_reviews_on_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.task_type = 'solicitar_resena' and new.status = 'completada' and old.status <> 'completada'
     and new.conversation_id is not null then
    update public.crm_conversations set postsale_status = 'resena_solicitada'
     where id = new.conversation_id and postsale_status in ('sin_postventa','seguimiento_pendiente','seguimiento_realizado','cliente_satisfecho');
  end if;
  return null;
end $$;
drop trigger if exists crm_reviews_on_task on public.crm_follow_up_tasks;
create trigger crm_reviews_on_task after update of status on public.crm_follow_up_tasks
  for each row execute function public.crm_reviews_on_task();

-- Clientes que ya compraron y nunca recibieron solicitud (para una campaña única, con aprobación).
create or replace view public.crm_v_review_backlog with (security_invoker = true) as
select cu.id as customer_id,
       coalesce(nullif(btrim(concat_ws(' ', cu.first_name, cu.last_name)), ''), cu.email) as cliente,
       cu.phone_e164, max(o.created_at) as ultima_compra, count(o.id) as pedidos
  from public.customers cu join public.orders o on o.customer_id = cu.id
 where not cu.is_test and cu.deleted_at is null and cu.merged_into_id is null
   and o.status in ('completed','processing')
   and not exists (select 1 from public.crm_follow_up_tasks t where t.customer_id = cu.id and t.task_type = 'solicitar_resena')
 group by cu.id;
revoke all on public.crm_v_review_backlog from anon;

do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('crm_setting','crm_review_message','crm_schedule_review',
                                                        'crm_reviews_on_conversation','crm_reviews_on_task')
  loop execute format('revoke execute on function %s from public, anon', f); end loop;
end $$;
grant execute on function public.crm_setting(text), public.crm_review_message(uuid) to authenticated, service_role;
grant execute on function public.crm_schedule_review(uuid) to service_role;

-- Autoprueba de reseñas (se deshace sola)
create or replace function public.crm_selftest_resenas()
returns table (n int, prueba text, ok boolean, detalle text) language plpgsql as $fn$
declare v_cust bigint; v_conv uuid; v_txt text; v_cnt int; v_cnt2 int; v_res text[] := '{}'; v_ok boolean[] := '{}'; v_det text[] := '{}';
begin
  begin
    v_cust := public.crm_resolve_customer('whatsapp', '56922223333', '922223333', 'Pedro Soto');
    insert into public.crm_conversations (customer_id, channel_code, external_thread_id) values (v_cust, 'whatsapp', '56922223333') returning id into v_conv;
    insert into public.orders (customer_id, source, total, crm_conversation_id, status) values (v_cust, 'whatsapp', 30000, v_conv, 'completed');
    update public.crm_conversations set sales_stage = 'venta_concretada' where id = v_conv;
    select count(*) into v_cnt from public.crm_follow_up_tasks where conversation_id = v_conv and task_type = 'solicitar_resena' and status = 'pendiente';
    select content into v_txt from public.crm_ai_suggestions where conversation_id = v_conv and status = 'propuesta' limit 1;
    v_res := v_res || 'Venta concretada programa pedido de reseña con link'::text;
    v_ok := v_ok || (v_cnt = 1 and v_txt like 'Hola Pedro,%' and v_txt like '%writereview?placeid=%');
    v_det := v_det || format('tareas=%s msg=%s', v_cnt, left(v_txt, 60));

    update public.crm_conversations set order_status = 'entregado' where id = v_conv;
    select count(*) into v_cnt2 from public.crm_follow_up_tasks where customer_id = v_cust and task_type = 'solicitar_resena';
    v_res := v_res || 'No se pide dos veces al mismo cliente'::text;
    v_ok := v_ok || (v_cnt2 = 1); v_det := v_det || format('solicitudes=%s', v_cnt2);

    update public.crm_follow_up_tasks set status = 'completada', result = 'Enviado'
     where conversation_id = v_conv and task_type = 'solicitar_resena';
    select postsale_status into v_txt from public.crm_conversations where id = v_conv;
    v_res := v_res || 'Completar tarea marca "reseña solicitada"'::text;
    v_ok := v_ok || (v_txt = 'resena_solicitada'); v_det := v_det || coalesce(v_txt, 'null');
    raise exception 'rollback_resenas';
  exception when others then
    if sqlerrm <> 'rollback_resenas' then
      v_res := v_res || 'ERROR INESPERADO'::text; v_ok := v_ok || false; v_det := v_det || (sqlstate || ' ' || sqlerrm);
    end if;
  end;
  return query select (row_number() over ())::int, * from unnest(v_res, v_ok, v_det);
end $fn$;
revoke execute on function public.crm_selftest_resenas() from public, anon, authenticated;
