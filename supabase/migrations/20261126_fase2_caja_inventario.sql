-- Fase 2 · Conectar la caja (finance-bot) con el inventario web (26-nov-2026)
-- Pedido de Emir: "hasta el bot de finanzas quiero todo conectado para que sepa que se vendió y se marque como vendido en el sitio web".
--
-- 1. Venta anotada en finance-bot → el Finanzas busca la pieza en el inventario web y propone marcarla vendida (tu OK, un toque).
--    Al aprobar: part_status='vendida', stock=0 → los triggers existentes despublican y pausan en Mercado Libre.
-- 2. Pedido web pagado → si no está en la caja, propone registrarlo (tu OK). Al aprobar: asiento de partida doble
--    (DES-BANCO o DES-CAJA contra DES-I-VENTAS), igual a como lo anota finance-bot.
-- 3. Lote de compra de auto en finance-bot → propone vincularlo al vehículo del sitio y cargar costo_compra / fecha_compra.
-- 4. Recuperador de pagos: ya no propone recuperar un pago que la caja muestra pagado por otro medio.

-- ---------- utilidades ----------
create or replace function public.stem_es(w text) returns text language sql immutable as $$
  select case when length(w) > 4 then regexp_replace(w, '(os|as|es|o|a|e)$', '') else w end;
$$;

-- Candidatos del inventario para una descripción libre de venta ("Tapabarro derecho Suzuki SX4 negro, foco izquierdo ...")
create or replace function public.caja_venta_candidatos(p_desc text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  d text := public.txt_norm(coalesce(p_desc,''));
  seg text; segs text[]; out jsonb := '[]'::jsonb; cand jsonb; n int; v_marca text; v_modelo text; v_color text;
  stop text[] := array['para','auto','autos','repuesto','repuestos','venta','sitio','web','lote','cliente','completo','completa','original','usado','usada','parte','total','efectivo','transferencia','monto','estimado','dentro','comprado','antes','sistema','mecanico','mecanica','automatico','automatica','japones','indio','bencinera','diesel','puertas','sedan','hatchback','version','anula','corrige','pendiente','pendientes','pago','viajes','viaje','comision','tercero','envio','internacional','bolivia','descuento','lista','vendido','vendida','entrega'];
  marcas text[] := array['suzuki','chevrolet','kia','hyundai','peugeot','audi','jeep','nissan','toyota','ford','mazda','honda','renault','citroen','fiat','volkswagen','mitsubishi','subaru','bmw','mercedes','ssangyong','chery','jac','changan','geely','haval','dodge','isuzu','opel','seat','skoda','volvo'];
  modelos text[] := array['baleno','alto','celerio','swift','dzire','sx4','s-cross','scross','vitara','nomade','ciaz','ignis','spresso','s-presso','ertiga','jimny','apv','aerio','mastervan','morning','rio','cerato','sportage','optima','picanto','accent','elantra','tucson','santa fe','i10','i20','spark','sail','aveo','cruze','tracker','dmax','d-max','captiva','orlando','corsa','sonic','onix','208','308','partner','a4','a3','cherokee','versa','march','tiida','qashqai','yaris','corolla','hilux','rav4','fiesta','focus','ranger','ecosport','civic','fit','cr-v','kwid','duster','logan','sandero','lumina'];
  colores text[] := array['rojo','roja','azul','gris','negro','negra','blanco','blanca','plata','plateado','plateada','verde','amarillo','amarilla','cafe','dorado','rosado','rosada','burdeo','celeste','naranjo','naranja','beige'];
begin
  if d = '' or d ~ '^anula' then return out; end if;
  select m into v_marca from unnest(marcas) m where d ~ ('\m' || m || '\M') order by position(m in d) limit 1;
  select m into v_modelo from unnest(modelos) m where d ~ ('\m' || replace(m, '-', '[- ]?') || '\M') order by length(m) desc limit 1;
  select m into v_color from unnest(colores) m where d ~ ('\m' || m || '\M') limit 1;
  -- segmentos: coma, punto y coma, dos puntos, paréntesis, guion largo, " y "
  segs := regexp_split_to_array(regexp_replace(d, '\s+y\s+', ',', 'g'), '\s*[,;:()—]\s*|\s+-\s+');
  foreach seg in array segs loop
    with pw as (
      select distinct public.stem_es(w) w from regexp_split_to_table(regexp_replace(seg, '[^[:alnum:] ]', ' ', 'g'), '\s+') w
       where length(w) >= 4 and w !~ '^\d+$' and w <> all(stop) and w <> all(marcas) and w <> all(colores)
         and replace(w,'-','') <> all(array(select replace(x,'-','') from unnest(modelos) x))
    ),
    cands as (
      select p.id, p.sku, p.name, p.price_sale, v.color vcolor,
             (select count(*) from pw where public.txt_norm(p.name) like '%' || w || '%') pz,
             (select count(*) from pw) pz_total,
             (v_modelo is null or public.txt_norm(p.name || ' ' || coalesce(p.vehicle_compatibility::text,'') || ' ' || coalesce(v.modelo,'')) like '%' || replace(v_modelo,'-','') || '%'
                             or public.txt_norm(replace(p.name,'-','')) like '%' || replace(v_modelo,'-','') || '%') modelo_ok,
             (v_color is not null and v.color is not null and public.txt_norm(v.color) like left(v_color, 4) || '%') color_ok
        from products p left join vehiculos v on v.id = p.vehiculo_id
       where p.deleted_at is null and p.is_active and coalesce(p.stock,0) > 0 and p.part_status not in ('vendida','no_disponible')
    )
    select jsonb_agg(jsonb_build_object('id', id, 'sku', sku, 'nombre', name, 'precio', price_sale, 'pieza', pz, 'de', pz_total, 'color_ok', color_ok) order by pz desc, color_ok desc, price_sale desc), count(*)
      into cand, n
      from (select * from cands where pz_total > 0 and pz >= greatest(1, ceil(pz_total * 0.6)) and modelo_ok order by pz desc, color_ok desc, price_sale desc limit 3) x;
    if n > 0 then
      out := out || jsonb_build_object('segmento', btrim(seg), 'candidatos', cand,
               'unico', (n = 1 or ((cand->0->>'pieza')::int = (cand->0->>'de')::int and ((cand->1->>'pieza')::int < (cand->0->>'pieza')::int or ((cand->0->>'color_ok')::boolean and not (cand->1->>'color_ok')::boolean)))));
    end if;
  end loop;
  return out;
end $$;

-- ---------- 1. Venta en caja → marcar vendida ----------
create or replace function public.caja_venta_proponer(p_tx bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t finance.transactions; c jsonb; ids jsonb; txt text; monto numeric; tid bigint;
begin
  select * into t from finance.transactions where id = p_tx;
  if t.id is null or t.op_type not in ('venta','venta_credito') or t.description ~* '^anula' then return '{"omitido":true}'::jsonb; end if;
  if exists (select 1 from agente_tareas where agente = 'finanzas' and accion in ('marcar_vendida','venta_sin_match') and entidad_tipo = 'finance_tx' and entidad_id = p_tx::text) then return '{"omitido":"ya revisada"}'::jsonb; end if;
  select coalesce(-sum(p.amount),0) into monto from finance.postings p join finance.accounts a on a.id = p.account_id where p.transaction_id = p_tx and a.type = 'income';
  c := public.caja_venta_candidatos(t.description);
  if jsonb_array_length(c) = 0 then
    insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, entrada, propuesta)
    values ('finanzas', 'venta_sin_match', 'finance_tx', p_tx::text, 'omitida', jsonb_build_object('descripcion', t.description, 'monto', monto, 'fecha', t.occurred_on),
            'Venta en caja ' || fmt_clp(monto) || ' "' || left(t.description, 90) || '": no encontré una pieza publicada que coincida; no se toca el inventario.');
    return jsonb_build_object('candidatos', 0);
  end if;
  select jsonb_agg((e->'candidatos'->0->>'id')::bigint) into ids from jsonb_array_elements(c) e where (e->>'unico')::boolean;
  select string_agg('• "' || (e->>'segmento') || '" → ' || (select string_agg((k->>'sku') || ' ' || left(k->>'nombre', 50) || ' (' || fmt_clp((k->>'precio')::numeric) || ')', ' | ') from jsonb_array_elements(e->'candidatos') k) || case when (e->>'unico')::boolean then '' else '  ← varias opciones, deja solo el SKU correcto' end, E'\n')
    into txt from jsonb_array_elements(c) e;
  insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, entrada, salida, propuesta)
  values ('finanzas', 'marcar_vendida', 'finance_tx', p_tx::text, true, 'pendiente',
          jsonb_build_object('descripcion', t.description, 'monto', monto, 'fecha', t.occurred_on, 'metodo', t.payment_method),
          jsonb_build_object('product_ids', coalesce(ids, '[]'::jsonb), 'candidatos', c),
          'Anotaste en caja: "' || t.description || '" (' || fmt_clp(monto) || ', ' || to_char(t.occurred_on, 'DD-MM') || '). En el sitio coincide con:' || E'\n' || txt || E'\n' ||
          'Al aprobar, las piezas marcadas como únicas quedan VENDIDAS en la web y se pausan en Mercado Libre. Si hay varias opciones, edita y escribe solo los SKU correctos.')
  returning id into tid;
  perform notificar('💰 Venta en caja → inventario', left(t.description, 70) || ' · ' || fmt_clp(monto) || '. ¿Marcar vendida en la web?', '/admin/equipo-ia.html#aprobaciones', 'caja_venta:' || p_tx);
  return jsonb_build_object('tarea', tid, 'candidatos', jsonb_array_length(c));
end $$;

create or replace function finance.trg_venta_a_inventario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.op_type in ('venta','venta_credito') then
    begin
      perform public.caja_venta_proponer(new.id);
    exception when others then
      insert into public.agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, error) values ('finanzas', 'marcar_vendida', 'finance_tx', new.id::text, 'error', left(sqlerrm, 300));
    end;
  end if;
  return new;
end $$;
create or replace trigger trg_venta_a_inventario after insert on finance.transactions for each row execute function finance.trg_venta_a_inventario();

-- ---------- 2. Pedido web pagado → registrar en caja ----------
create or replace function public.caja_pedido_web_proponer(p_order bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o orders; items text; cuenta text; tid bigint; ya boolean;
begin
  select * into o from orders where id = p_order;
  if o.id is null or o.status <> 'completed' then return '{"omitido":true}'::jsonb; end if;
  if exists (select 1 from agente_tareas where agente = 'finanzas' and accion = 'registrar_venta_caja' and entidad_tipo = 'order' and entidad_id = p_order::text) then return '{"omitido":"ya propuesto"}'::jsonb; end if;
  select exists (select 1 from finance.transactions t join finance.postings p on p.transaction_id = t.id join finance.accounts a on a.id = p.account_id
                  where a.type = 'income' and t.op_type in ('venta','venta_credito') and -p.amount between o.total * 0.8 and o.total * 1.1
                    and t.occurred_on between o.created_at::date - 1 and o.created_at::date + 10) into ya;
  if ya then
    insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, propuesta) values ('finanzas', 'pedido_web_ya_en_caja', 'order', p_order::text, 'omitida', 'Pedido web #' || p_order || ' (' || fmt_clp(o.total) || ') ya figura anotado en la caja.');
    return '{"ya_en_caja":true}'::jsonb;
  end if;
  select string_agg(coalesce(oi.name, oi.sku), ', ') into items from order_items oi where oi.order_id = p_order;
  cuenta := case when o.payment_method = 'efectivo' then 'DES-CAJA' else 'DES-BANCO' end;
  insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, salida, propuesta)
  values ('finanzas', 'registrar_venta_caja', 'order', p_order::text, true, 'pendiente',
          jsonb_build_object('order_id', p_order, 'total', o.total, 'metodo', coalesce(o.payment_method, 'webpay'), 'cuenta', cuenta, 'items', items, 'fecha', o.created_at::date,
                             'descripcion', left(coalesce(items, 'Pedido web') || ' — venta sitio web #' || p_order, 180)),
          'Pedido web #' || p_order || ' pagado por ' || coalesce(o.payment_method, 'webpay') || ': ' || fmt_clp(o.total) || ' (' || coalesce(items, 'sin detalle') || '). No está en la caja. Al aprobar se anota como venta en ' || cuenta || ' contra Ventas de repuestos, igual que en finance-bot.')
  returning id into tid;
  perform notificar('💰 Venta web sin anotar en caja', 'Pedido #' || p_order || ' · ' || fmt_clp(o.total) || '. ¿La anoto en la caja?', '/admin/equipo-ia.html#aprobaciones', 'caja_pedido:' || p_order);
  return jsonb_build_object('tarea', tid);
end $$;

create or replace function public.trg_caja_pedido_web() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    begin perform public.caja_pedido_web_proponer(new.id);
    exception when others then insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, error) values ('finanzas', 'registrar_venta_caja', 'order', new.id::text, 'error', left(sqlerrm, 300)); end;
  end if;
  return new;
end $$;
create or replace trigger trg_caja_pedido_web after update of status on public.orders for each row execute function public.trg_caja_pedido_web();

-- ---------- 3. Lote (auto comprado) → vehículo del sitio ----------
create or replace function public.caja_lote_proponer(p_lote int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l finance.lots; d text; cand jsonb; n int; tid bigint;
  colores text[] := array['rojo','azul','gris','negro','blanco','plata','plateado','verde','amarillo','cafe','dorado','rosado','burdeo','celeste','naranjo','beige'];
  v_color text;
begin
  select * into l from finance.lots where id = p_lote;
  if l.id is null or l.kind <> 'vehiculo' or l.vehiculo_id is not null then return '{"omitido":true}'::jsonb; end if;
  if exists (select 1 from agente_tareas where agente = 'finanzas' and accion = 'vincular_lote_vehiculo' and entidad_tipo = 'finance_lot' and entidad_id = p_lote::text and estado_aprobacion in ('pendiente','aprobada','editada','ejecutada')) then return '{"omitido":"ya propuesto"}'::jsonb; end if;
  d := public.txt_norm(l.name);
  select m into v_color from unnest(colores) m where d ~ ('\m' || m) limit 1;
  select jsonb_agg(jsonb_build_object('id', id, 'codigo', codigo, 'nombre', nombre, 'color', vcolor, 'ingreso', fecha_ingreso, 'color_ok', color_ok, 'dias', dias) order by color_ok desc, dias asc), count(*)
    into cand, n
    from (select v.id, v.codigo, concat_ws(' ', v.marca, v.modelo, v.motor, v.anio_desde) nombre, v.color vcolor, v.fecha_ingreso,
                 (v_color is not null and v.color is not null and public.txt_norm(v.color) like left(v_color,4) || '%') color_ok,
                 abs(coalesce(v.fecha_ingreso, v.created_at::date) - l.purchased_on) dias
            from vehiculos v
           where v.costo_compra is null and v.en_desarme
             and d like '%' || public.txt_norm(v.marca) || '%'
             and (d like '%' || public.txt_norm(replace(v.modelo,'-','')) || '%' or replace(d,' ','') like '%' || replace(public.txt_norm(v.modelo),' ','') || '%')
             and (v_color is null or v.color is null or public.txt_norm(v.color) like left(v_color,4) || '%')
             and not exists (select 1 from finance.lots l2 where l2.vehiculo_id = v.id)
           order by color_ok desc, dias asc limit 3) x;
  if n = 0 then
    insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, propuesta) values ('finanzas', 'lote_sin_vehiculo', 'finance_lot', p_lote::text, 'omitida', 'Lote "' || l.name || '" (' || fmt_clp(l.purchase_cost) || ') no coincide con ningún auto en desarme sin costo de compra.');
    return '{"candidatos":0}'::jsonb;
  end if;
  insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, salida, propuesta)
  values ('finanzas', 'vincular_lote_vehiculo', 'finance_lot', p_lote::text, true, 'pendiente',
          jsonb_build_object('lote', l.name, 'costo', l.purchase_cost, 'fecha', l.purchased_on, 'vehiculo_id', (cand->0->>'id')::bigint, 'candidatos', cand),
          'Compraste "' || l.name || '" por ' || fmt_clp(l.purchase_cost) || ' el ' || to_char(l.purchased_on, 'DD-MM') || '. En el sitio parece ser ' || (cand->0->>'codigo') || ' (' || (cand->0->>'nombre') || coalesce(', ' || (cand->0->>'color'), '') || ')' ||
          case when n > 1 then '. Otras opciones: ' || (select string_agg((k->>'codigo'), ', ') from jsonb_array_elements(cand) k offset 1) || '. Si no es el primero, edita y escribe el código.' else '.' end ||
          ' Al aprobar queda cargado el costo de compra del auto y el lote vinculado (sirve para saber cuánto deja cada desarme).')
  returning id into tid;
  return jsonb_build_object('tarea', tid, 'candidatos', n);
end $$;

create or replace function finance.trg_lote_a_vehiculo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'vehiculo' then
    begin perform public.caja_lote_proponer(new.id);
    exception when others then insert into public.agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, error) values ('finanzas', 'vincular_lote_vehiculo', 'finance_lot', new.id::text, 'error', left(sqlerrm, 300)); end;
  end if;
  return new;
end $$;
create or replace trigger trg_lote_a_vehiculo after insert on finance.lots for each row execute function finance.trg_lote_a_vehiculo();

-- ---------- 4. Ejecución al aprobar (ramas nuevas en agente_tareas_ejecutar) ----------
-- marcar_vendida: piezas → vendida/stock 0 (los triggers existentes despublican y pausan ML)
-- registrar_venta_caja: asiento en finance (DES-BANCO o DES-CAJA contra DES-I-VENTAS), created_by = usuario autorizado del bot
-- vincular_lote_vehiculo: costo_compra/fecha_compra en vehiculos + lots.vehiculo_id
create or replace function public.agente_tareas_ejecutar() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; q uuid; pid bigint; vid bigint; ids bigint[]; tok text; txid bigint; acct_money int; acct_inc int; cb bigint; tot numeric; n int := 0;
begin
  if new.estado_aprobacion in ('aprobada','editada') and old.estado_aprobacion is distinct from new.estado_aprobacion then
    if new.accion = 'proponer_cierre' and new.entidad_tipo = 'crm_conversation' then
      update crm_conversations set sales_stage = 'venta_perdida', loss_reason = coalesce(new.salida->>'motivo_perdida', 'cliente_dejo_de_responder'),
             loss_notes = left(coalesce(new.propuesta_editada, new.propuesta), 300), closed_at = now() where id = new.entidad_id::uuid and closed_at is null;
      new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();
    elsif new.accion = 'proponer_mensaje' and new.entidad_tipo = 'crm_conversation' and new.salida ? 'proximo_contacto_sugerido' then
      update crm_conversations set next_action_at = (new.salida->>'proximo_contacto_sugerido')::timestamptz, next_action = 'Seguimiento aprobado #' || new.id where id = new.entidad_id::uuid;
    elsif new.accion = 'proponer_cotizacion' then
      q := (new.salida->>'quotation_id')::uuid;
      update crm_quotations set status = 'enviada', sent_at = now() where id = q and status = 'pendiente_aprobacion';
      update crm_conversations set sales_stage = 'cotizacion_enviada', next_action = 'Seguimiento de cotización', next_action_at = now() + interval '24 hours' where id = new.entidad_id::uuid;
      if new.propuesta_editada is not null then new.salida := new.salida || jsonb_build_object('mensaje', new.propuesta_editada, 'wa_link', public.wa_link(new.salida->>'telefono', new.propuesta_editada)); end if;
    elsif new.accion = 'generar_despiece' and new.entidad_tipo = 'vehiculo' then
      select * into r from aplicar_despiece(new.entidad_id::bigint);
      new.salida := coalesce(new.salida, '{}') || jsonb_build_object('creadas', r.creadas, 'vinculadas', r.vinculadas);
      new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();
    elsif new.accion = 'proponer_publicacion' then
      for pid in select (e)::bigint from jsonb_array_elements_text(coalesce(new.salida->'publicacion_ids', '[]')) e loop
        update publicaciones set estado = 'aprobada' where id = pid and estado = 'pendiente_aprobacion';
      end loop;
    elsif new.accion = 'elegir_repuesto' and new.entidad_tipo = 'crm_conversation' and new.propuesta_editada is not null then
      select id into pid from products where deleted_at is null and new.propuesta_editada ilike '%' || sku || '%' order by length(sku) desc limit 1;
      if pid is not null then update crm_conversations set product_id = pid where id = new.entidad_id::uuid; new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now(); end if;
    elsif new.accion = 'recuperar_pago' and new.entidad_tipo = 'order' then
      if new.propuesta_editada is not null then new.salida := new.salida || jsonb_build_object('mensaje', new.propuesta_editada, 'wa_link', public.wa_link(new.salida->>'telefono', new.propuesta_editada)); end if;
      update orders set notes = concat_ws(' | ', notes, 'Recuperación por WhatsApp aprobada (tarea #' || new.id || ', ' || to_char(now() at time zone 'America/Santiago', 'DD-MM-YYYY') || ')') where id = new.entidad_id::bigint;

    elsif new.accion = 'marcar_vendida' and new.entidad_tipo = 'finance_tx' then
      if new.propuesta_editada is not null then
        -- Emir dejó los SKU correctos en el texto: se toman solo esos (coincidencia exacta de SKU, sin importar mayúsculas)
        select array_agg(p.id) into ids from products p where p.deleted_at is null
          and exists (select 1 from regexp_split_to_table(new.propuesta_editada, '[\s,;|]+') tok where upper(tok) = upper(p.sku));
      else
        select array_agg((e)::bigint) into ids from jsonb_array_elements_text(coalesce(new.salida->'product_ids', '[]')) e;
      end if;
      foreach pid in array coalesce(ids, '{}') loop
        update products set part_status = 'vendida', stock = 0,
               metadata = coalesce(metadata, '{}') || jsonb_build_object('vendida_caja_tx', new.entidad_id::bigint, 'vendida_at', now(), 'vendida_tarea', new.id)
         where id = pid and part_status <> 'vendida';
        if found then n := n + 1; end if;
      end loop;
      new.salida := new.salida || jsonb_build_object('marcadas', n, 'ids_ejecutados', to_jsonb(coalesce(ids, '{}')));
      new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();

    elsif new.accion = 'registrar_venta_caja' and new.entidad_tipo = 'order' then
      tot := (new.salida->>'total')::numeric;
      select id into acct_money from finance.accounts where code = new.salida->>'cuenta' and active;
      select id into acct_inc from finance.accounts where code = 'DES-I-VENTAS' and active;
      select telegram_user_id into cb from finance.authorized_users order by created_at limit 1;
      if acct_money is null or acct_inc is null or cb is null then raise exception 'cuentas o usuario de finance no encontrados'; end if;
      insert into finance.transactions (occurred_on, op_type, description, payment_method, created_by)
      values ((new.salida->>'fecha')::date, 'venta', coalesce(new.propuesta_editada, new.salida->>'descripcion'), new.salida->>'metodo', cb) returning id into txid;
      insert into finance.postings (transaction_id, account_id, amount) values (txid, acct_money, round(tot)::bigint), (txid, acct_inc, -round(tot)::bigint);
      new.salida := new.salida || jsonb_build_object('finance_tx', txid);
      new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();

    elsif new.accion = 'vincular_lote_vehiculo' and new.entidad_tipo = 'finance_lot' then
      vid := null;
      if new.propuesta_editada is not null then
        select v.id into vid from vehiculos v where exists (select 1 from regexp_split_to_table(new.propuesta_editada, '[\s,;|]+') tok where upper(tok) = upper(v.codigo)) limit 1;
      end if;
      vid := coalesce(vid, (new.salida->>'vehiculo_id')::bigint);
      if vid is not null then
        update vehiculos set costo_compra = (new.salida->>'costo')::numeric, fecha_compra = (new.salida->>'fecha')::date where id = vid;
        update finance.lots set vehiculo_id = vid where id = new.entidad_id::int;
        new.salida := new.salida || jsonb_build_object('vehiculo_vinculado', vid);
        new.estado_aprobacion := 'ejecutada'; new.ejecutado_at := now();
      end if;
    end if;
  end if;
  return new;
end $$;

-- ---------- 5. Recuperador: no insistir si la caja ya muestra el pago por otro medio ----------
-- (misma función que en 20261126_fase2_todas_las_areas.sql + la condición de finance)
