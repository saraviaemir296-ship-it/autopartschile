-- =====================================================================
-- CRM — Migración 04: autoprueba de reglas de negocio, permisos y RLS.
-- Ejecuta todo dentro de una subtransacción que se deshace al final:
-- NO deja datos en la base. Solo la puede ejecutar el servicio.
--   select * from public.crm_selftest();
-- =====================================================================
create or replace function public.crm_selftest()
returns table (n int, prueba text, ok boolean, detalle text)
language plpgsql as $fn$
declare
  r_n int[] := '{}'; r_name text[] := '{}'; r_ok boolean[] := '{}'; r_det text[] := '{}';
  u_a uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
  u_sup uuid := gen_random_uuid(); u_bod uuid := gen_random_uuid();
  v_cust bigint; v_cust2 bigint; v_conv uuid; v_q uuid; v_order bigint; v_pay uuid; v_task uuid;
  v_prod bigint; v_cnt int; v_txt text; v_bool boolean; v_num numeric; i int := 0;

  procedure_dummy int;
begin
  begin
    -- ---------- Preparación ----------
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'crm-selftest-' || u || '@example.invalid', '{}', '{}', now(), now()
      from unnest(array[u_a, u_b, u_sup, u_bod]) u;
    insert into public.crm_staff (user_id, full_name, role_code) values
      (u_a, 'Vendedor A', 'vendedor'), (u_b, 'Vendedor B', 'vendedor'),
      (u_sup, 'Supervisor', 'supervisor'), (u_bod, 'Bodega', 'bodega');
    select id into v_prod from public.products
     where is_active and deleted_at is null and part_status = 'desmontada' and coalesce(stock,1) > 0 limit 1;

    -- 1. Deduplicación de clientes
    v_cust := public.crm_resolve_customer('whatsapp', '56911112222', '+56 9 1111 2222', 'Cliente Prueba');
    v_cust2 := public.crm_resolve_customer('instagram', 'psid-xyz', '911112222', 'cliente.ig');
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Mismo teléfono en 2 canales = 1 cliente'::text;
    r_ok := r_ok || (v_cust = v_cust2); r_det := r_det || format('%s / %s', v_cust, v_cust2);

    -- 2. Conversación nueva: próxima acción y tarea de primera respuesta automáticas
    insert into public.crm_conversations (customer_id, channel_code, external_thread_id, contact_phone)
    values (v_cust, 'whatsapp', '56911112222', '911112222') returning id into v_conv;
    select count(*) into v_cnt from public.crm_follow_up_tasks where conversation_id = v_conv and task_type = 'primera_respuesta' and status = 'pendiente';
    select next_action_type into v_txt from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Chat nuevo crea tarea "primera respuesta"'::text;
    r_ok := r_ok || (v_cnt = 1 and v_txt = 'primera_respuesta'); r_det := r_det || format('tareas=%s next=%s', v_cnt, v_txt);

    -- 3. Mensaje entrante idempotente
    insert into public.crm_messages (conversation_id, channel_code, external_message_id, direction, sender_type, body)
    values (v_conv, 'whatsapp', 'wamid.TEST1', 'entrante', 'cliente', 'Hola, busco foco trasero Aveo');
    begin
      insert into public.crm_messages (conversation_id, channel_code, external_message_id, direction, sender_type, body)
      values (v_conv, 'whatsapp', 'wamid.TEST1', 'entrante', 'cliente', 'duplicado');
    exception when unique_violation then null; end;
    select count(*) into v_cnt from public.crm_messages where conversation_id = v_conv;
    select unread_count into procedure_dummy from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Mensaje duplicado del webhook no se guarda 2 veces'::text;
    r_ok := r_ok || (v_cnt = 1 and procedure_dummy = 1); r_det := r_det || format('mensajes=%s no_leidos=%s', v_cnt, procedure_dummy);

    -- 4. RLS: vendedor A ve chats sin asignar; anon no ve nada
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into v_cnt from public.crm_conversations where id = v_conv;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Vendedor ve chat sin asignar'::text;
    r_ok := r_ok || (v_cnt = 1); r_det := r_det || format('visibles=%s', v_cnt);

    execute 'set local role anon';
    select count(*) into v_cnt from public.crm_conversations;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Anónimo (web pública) no ve conversaciones'::text;
    r_ok := r_ok || (v_cnt = 0); r_det := r_det || format('visibles=%s', v_cnt);

    -- 5. Vendedor A toma el chat
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.crm_conversations set assigned_to = u_a, chat_status = 'en_atencion' where id = v_conv;
    execute 'reset role';
    select assigned_to = u_a into v_bool from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Vendedor puede tomar un chat sin responsable'::text;
    r_ok := r_ok || coalesce(v_bool, false); r_det := r_det || ''::text;

    -- 6. Vendedor B ya no lo ve
    perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into v_cnt from public.crm_conversations where id = v_conv;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Otro vendedor no ve chat ajeno'::text;
    r_ok := r_ok || (v_cnt = 0); r_det := r_det || format('visibles=%s', v_cnt);

    -- 7. Vendedor A no puede reasignar a B
    v_bool := false;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.crm_conversations set assigned_to = u_b where id = v_conv;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Vendedor no puede reasignar (requiere supervisor)'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 8. Respuesta del vendedor: cierra "primera respuesta" y exige próxima acción
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.crm_messages (conversation_id, channel_code, direction, sender_type, staff_id, body)
    values (v_conv, 'whatsapp', 'saliente', 'vendedor', u_a, 'Hola, sí tenemos. Te envío foto.');
    execute 'reset role';
    select next_action_type, first_response_at is not null into v_txt, v_bool from public.crm_conversations where id = v_conv;
    select count(*) into v_cnt from public.crm_follow_up_tasks where conversation_id = v_conv and task_type = 'primera_respuesta' and status = 'completada';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Responder completa la tarea y deja "definir próxima acción"'::text;
    r_ok := r_ok || (v_cnt = 1 and v_txt = 'definir_proxima_accion' and v_bool); r_det := r_det || format('completadas=%s next=%s', v_cnt, v_txt);

    -- 9. No se puede cerrar el último seguimiento sin definir el siguiente
    select id into v_task from public.crm_follow_up_tasks where conversation_id = v_conv and status = 'pendiente' limit 1;
    v_bool := false; v_txt := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.crm_follow_up_tasks set status = 'completada', result = 'listo' where id = v_task;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Chat activo nunca queda sin próxima acción'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 10. Completar con siguiente paso
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    perform public.crm_complete_task(v_task, 'Cliente pide cotización', 'enviar_cotizacion', null, null, null);
    execute 'reset role';
    select next_action_type into v_txt from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Completar seguimiento con el siguiente paso'::text;
    r_ok := r_ok || (v_txt = 'enviar_cotizacion'); r_det := r_det || format('next=%s', v_txt);

    -- 11. Cotización: disponibilidad desde inventario real, totales, descuento requiere aprobación
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.crm_quotations (conversation_id) values (v_conv) returning id into v_q;
    insert into public.crm_quotation_items (quotation_id, product_id, description, condition, unit_price, quantity, availability)
    values (v_q, v_prod, 'Repuesto de prueba', 'usado_original', 10000, 2, 'por_confirmar');
    insert into public.crm_quotation_items (quotation_id, description, condition, unit_price, availability)
    values (v_q, 'Pieza sin inventario', 'usado_original', 5000, 'disponible');
    execute 'reset role';
    select total into v_num from public.crm_quotations where id = v_q;
    select string_agg(availability, ',' order by id) into v_txt from public.crm_quotation_items where quotation_id = v_q;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Cotización calcula total y disponibilidad sale del inventario'::text;
    r_ok := r_ok || (v_num = 25000 and v_txt = case when v_prod is null then 'por_confirmar,por_confirmar' else 'disponible,por_confirmar' end);
    r_det := r_det || format('total=%s disp=%s', v_num, v_txt);

    v_bool := false; v_txt := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.crm_quotations set discount_total = 2000 where id = v_q;
      update public.crm_quotations set status = 'enviada' where id = v_q;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Vendedor no envía descuento sin aprobación'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.crm_quotations set status = 'enviada' where id = v_q;
    update public.crm_quotations set status = 'aceptada' where id = v_q;
    v_order := public.crm_convert_quotation_to_order(v_q);
    execute 'reset role';
    select sales_stage || '/' || order_status || '/' || priority into v_txt from public.crm_conversations where id = v_conv;
    select count(*) into v_cnt from public.order_items where order_id = v_order;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Cotización aceptada → pedido sin reingresar datos'::text;
    r_ok := r_ok || (v_order is not null and v_cnt = 2 and v_txt = 'pago_pendiente/pendiente_de_pago/critica');
    r_det := r_det || format('pedido=%s items=%s estado=%s', v_order, v_cnt, v_txt);

    -- 12. Vendedor no puede alterar montos del pedido
    v_bool := false; v_txt := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.orders set total = 1 where id = v_order;
      get diagnostics v_cnt = row_count;
      if v_cnt = 0 then raise exception 'sin filas (RLS)'; end if;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Nadie del equipo modifica montos de un pedido'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 13. Pago reportado: vendedor registra, NO puede confirmar
    perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into public.crm_payments (order_id, conversation_id, amount, method, status, confirmed_source)
    values (v_order, v_conv, 25000, 'transferencia', 'confirmado', 'webpay') returning id into v_pay;
    execute 'reset role';
    select status into v_txt from public.crm_payments where id = v_pay;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Pago ingresado por vendedor queda "en revisión" aunque intente confirmarlo'::text;
    r_ok := r_ok || (v_txt = 'en_revision'); r_det := r_det || format('estado=%s', v_txt);

    v_bool := false; v_txt := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.crm_payments set status = 'confirmado' where id = v_pay;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Vendedor no puede confirmar pagos'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 14. Supervisor confirma
    perform set_config('request.jwt.claims', json_build_object('sub', u_sup, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.crm_payments set status = 'confirmado' where id = v_pay;
    execute 'reset role';
    select c.sales_stage || '/' || c.order_status || '/' || coalesce(o.fulfillment_status, '-') || '/' || c.next_action_type
      into v_txt from public.crm_conversations c join public.orders o on o.id = v_order where c.id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Supervisor confirma pago → pagado y "coordinar despacho"'::text;
    r_ok := r_ok || (v_txt = 'pago_confirmado/pagado/pagado/coordinar_despacho'); r_det := r_det || v_txt;

    -- 15. Bodega: puede mover el pedido, no puede editar datos comerciales
    perform set_config('request.jwt.claims', json_build_object('sub', u_bod, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    update public.orders set fulfillment_status = 'preparando' where id = v_order;
    execute 'reset role';
    select order_status into v_txt from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Bodega cambia estado del pedido y se refleja en el chat'::text;
    r_ok := r_ok || (v_txt = 'preparando'); r_det := r_det || format('order_status=%s', v_txt);

    v_bool := false; v_txt := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u_bod, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      update public.crm_conversations set contact_name = 'X' where id = v_conv;
      get diagnostics v_cnt = row_count;
      if v_cnt = 0 then raise exception 'sin filas (RLS)'; end if;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    execute 'reset role';
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Bodega no edita datos comerciales del chat'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 16. Venta perdida exige motivo
    v_bool := false; v_txt := null;
    begin
      update public.crm_conversations set sales_stage = 'venta_perdida' where id = v_conv;
    exception when others then v_bool := true; v_txt := sqlerrm; end;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Venta perdida exige motivo de pérdida'::text;
    r_ok := r_ok || v_bool; r_det := r_det || coalesce(v_txt, 'NO BLOQUEÓ');

    -- 17. Cerrar chat no cierra la oportunidad; cliente vuelve → reabierto
    update public.crm_conversations set chat_status = 'cerrado' where id = v_conv;
    insert into public.crm_messages (conversation_id, channel_code, external_message_id, direction, sender_type, body)
    values (v_conv, 'whatsapp', 'wamid.TEST2', 'entrante', 'cliente', '¿Cuándo despachan?');
    select chat_status || '/' || sales_stage || '/' || (closed_at is null)::text into v_txt from public.crm_conversations where id = v_conv;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Chat cerrado se reabre al escribir; la venta sigue intacta'::text;
    r_ok := r_ok || (v_txt = 'reabierto/pago_confirmado/true'); r_det := r_det || v_txt;

    -- 18. Historial y auditoría
    select count(*) into v_cnt from public.crm_status_history where conversation_id = v_conv;
    select count(*) into procedure_dummy from public.crm_audit_logs where table_name = 'crm_payments' and record_id = v_pay::text;
    i := i + 1; r_n := r_n || i; r_name := r_name || 'Cada cambio de estado deja historial y auditoría'::text;
    r_ok := r_ok || (v_cnt >= 8 and procedure_dummy >= 2); r_det := r_det || format('historial=%s auditoria_pago=%s', v_cnt, procedure_dummy);

    raise exception 'crm_selftest_rollback';
  exception when others then
    if sqlerrm <> 'crm_selftest_rollback' then
      i := i + 1; r_n := r_n || i; r_name := r_name || 'ERROR INESPERADO'::text; r_ok := r_ok || false;
      r_det := r_det || (sqlstate || ' ' || sqlerrm);
    end if;
  end;
  return query select * from unnest(r_n, r_name, r_ok, r_det);
end $fn$;

revoke execute on function public.crm_selftest() from public, anon, authenticated;
