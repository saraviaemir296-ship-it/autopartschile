-- Fase 2 · Todos los ámbitos del negocio en una sola oficina (26-nov-2026)
-- Aplicado por partes vía MCP (execute_sql). Este archivo es el respaldo fiel de lo aplicado.
--
-- Qué agrega:
--   1. agente_tareas.agente ya no es una lista fija: referencia a agentes.codigo (FK). Así cada
--      escritorio nuevo puede registrar tareas sin tocar la tabla.
--   2. Escritorios nuevos: Recuperador de pagos (construido), Finanzas (construido, lee finance-bot),
--      Ads Meta (lectura manual), Grupos de Facebook, Dropi, Precio de mercado, Estratega (vacantes con
--      el motivo exacto de por qué).
--   3. ads_metricas: números reales de Meta Ads capturados en esta sesión (API), para que el panel no
--      muestre nada inventado mientras la cuenta no esté conectada al proyecto.
--   4. recuperador_pagos_revisar(): pedidos web que llegaron al pago y no se completaron → propone el
--      WhatsApp (requiere tu OK). Excluye pruebas (is_test, correos de admins, WooCommerce de junio).
--   5. finanzas_revisar(): caja real del mes (ventas, gastos, compras de autos, disponible, obligaciones)
--      desde el esquema finance que alimenta finance-bot. Avisa si hay días sin registrar.
--   6. dashboard_equipo_ia(): agrega 'finanzas' y 'ads'.
--   7. Tareas en cola para Emir: pausar campañas sin gasto, destino WhatsApp en anuncios, secretos pendientes.

-- ---------- 1. FK en vez de check ----------
alter table public.agente_tareas drop constraint if exists agente_tareas_agente_check;
alter table public.agente_tareas add constraint agente_tareas_agente_fk
  foreign key (agente) references public.agentes(codigo);

-- ---------- 2. Escritorios ----------
insert into public.agentes (codigo, nombre, area, rol, emoji, construido, programacion, orden) values
('estratega', 'Estratega', 'Dirección',
 'Lee cada semana los números de todas las áreas (ventas, caja, leads, anuncios, ML, web) y propone dónde poner la plata y el tiempo (skill estrategia-hormozi-verdu). Pendiente: clave de Anthropic en Supabase (Edge Function Secrets).',
 '🧭', false, 'semanal (pendiente)', 5),
('precio_mercado', 'Precio de mercado', 'Ventas · Precios',
 'Compara el precio de cada pieza con Mercado Libre y competidores y sugiere precio; tú fijas el final (regla 2). Pendiente: competitor_prices está vacía y la búsqueda autenticada en ML está en reconstrucción.',
 '💹', false, 'pendiente de fuente de precios', 25),
('recuperador_pagos', 'Recuperador de pagos', 'Ventas web',
 'Detecta pedidos web que llegaron al pago y no se completaron (Mercado Pago pendiente, Webpay abandonado) en los últimos 14 días y propone el WhatsApp para recuperarlos. Excluye pruebas y tus propios pedidos.',
 '💳', true, 'cada hora 9:30–20:30, L–S', 35),
('dropi', 'Dropi', 'Logística · Dropshipping',
 'Sincroniza catálogo y pedidos con Dropi (skill conectar-dropi-web-propia). Pendiente: API key de Dropi en Supabase.',
 '🚚', false, 'pendiente de API', 105),
('finanzas', 'Finanzas', 'Administración · Finanzas',
 'Lee la caja real que registras en finance-bot: ventas y gastos del mes, compras de autos, dinero disponible, obligaciones por vencer y días sin registrar.',
 '💰', true, 'diario 8:20', 115),
('grupos_facebook', 'Grupos de Facebook', 'Marketing · Grupos',
 'Publica desarmes y responde pedidos en grupos de repuestos (skills publicar-en-grupos-facebook / responder-pedidos-grupos-facebook). Meta no da API para publicar en grupos: se opera desde el celular con los textos que prepara el Publicador.',
 '👥', false, 'manual (sin API de grupos)', 153)
on conflict (codigo) do update set nombre = excluded.nombre, area = excluded.area, rol = excluded.rol, emoji = excluded.emoji,
  construido = excluded.construido, programacion = excluded.programacion, orden = excluded.orden;

update public.agentes set construido = true,
  rol = 'Lee campañas de Facebook/Instagram, mide costo por conversación y propone qué impulsar y qué pausar. Hoy: lectura manual (API de Meta desde esta sesión, 26-nov). Pendiente: conectar la cuenta de anuncios al proyecto para que sea diaria.',
  programacion = 'lectura manual · conexión automática pendiente'
where codigo = 'marketing_ads';

-- ---------- 3. Métricas reales de anuncios ----------
create table if not exists public.ads_metricas (
  id bigserial primary key,
  fuente text not null default 'meta',
  cuenta text,
  campana_id text,
  campana text,
  estado text,
  periodo_desde date,
  periodo_hasta date,
  gasto numeric,
  alcance integer,
  clics integer,
  conversaciones integer,
  costo_por_conversacion numeric,
  capturado_at timestamptz not null default now(),
  origen text
);
comment on table public.ads_metricas is 'Números de campañas tal como los entrega la API de Meta. Nunca estimados.';
alter table public.ads_metricas enable row level security;
drop policy if exists ads_metricas_admin_lee on public.ads_metricas;
create policy ads_metricas_admin_lee on public.ads_metricas for select using (public.is_admin());

insert into public.ads_metricas (cuenta, campana_id, campana, estado, periodo_desde, periodo_hasta, gasto, alcance, clics, conversaciones, costo_por_conversacion, origen) values
('1116318899734886', '120253139256340584', 'Motor completo Suzuki Swift 1.2 K12B 2012-2017 (Marketplace, 12-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 13960, 12123, 603, 12, 1163, 'API Meta, sesión 26-nov'),
('1116318899734886', '120253117056550584', 'Desarme Hyundai Santa Fe GLX 2.4 (Marketplace, 11-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 5953, 6763, 264, 18, 331, 'API Meta, sesión 26-nov'),
('1116318899734886', '120253117007270584', 'Desarme Suzuki Swift 1.2 indio K12M 2011-2018 (Marketplace, 11-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 5954, 7877, 388, 34, 175, 'API Meta, sesión 26-nov'),
('1116318899734886', '120253116992330584', 'Desarme Suzuki SX4 1.6 M16A 2006-2015 (Marketplace, 11-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 5974, 8438, 193, 11, 543, 'API Meta, sesión 26-nov'),
('1116318899734886', '120253116978470584', 'Desarme Suzuki Celerio 1.0 K10B 2008-2014 (Marketplace, 11-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 2973, 3653, 111, 9, 330, 'API Meta, sesión 26-nov'),
('1116318899734886', '120253012678210584', 'Culata completa Suzuki SX4 / Liana / Aerio 1.6 M16A (Marketplace, 5-nov)', 'ACTIVE', '2026-08-28', '2026-11-26', 998, 2527, 102, 1, 998, 'API Meta, sesión 26-nov'),
('1116318899734886', '120249167957510584', '2013 Kia Optima (Marketplace, 15-jun)', 'ACTIVE', '2026-08-28', '2026-11-26', 0, null, null, null, null, 'API Meta, sesión 26-nov · activa sin gasto'),
('1116318899734886', '120246242218330584', 'DESARME SUZUKI ALTO 800 2014–2023 (publicación, 2-may)', 'ACTIVE', '2026-08-28', '2026-11-26', 0, null, null, null, null, 'API Meta, sesión 26-nov · activa sin gasto'),
('1116318899734886', '120243012614710584', '1998 Chevrolet Lumina (Marketplace, 6-mar)', 'ACTIVE', '2026-08-28', '2026-11-26', 0, null, null, null, null, 'API Meta, sesión 26-nov · activa sin gasto'),
('1116318899734886', '120251563705040584', 'Desarme Hyundai Santa Fe GLX 2.4 (Marketplace, 15-ago)', 'PAUSED', '2026-08-28', '2026-11-26', 0, null, null, null, null, 'API Meta, sesión 26-nov'),
('1116318899734886', '120249841204580584', 'Desarme Suzuki Celerio 1.0 2015-2019 (Marketplace, 24-jun)', 'PAUSED', '2026-08-28', '2026-11-26', 0, null, null, null, null, 'API Meta, sesión 26-nov');

-- ---------- 4. Recuperador de pagos ----------
create or replace function public.es_electrica(p_nombre text) returns boolean
language sql immutable as $$
  select lower(coalesce(p_nombre,'')) ~ '(el[eé]ctric|electr[oó]nic|computador|\mecu\M|sensor|m[oó]dulo|bobina|alternador|motor de partida|radio|pantalla|tablero|switch|rel[eé]|airbag|\mbcm\M|\mabs\M)';
$$;

create or replace function public.recuperador_pagos_revisar() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record; n int := 0; msg text; gar text; tel text; nombre text; disponibles int; tid bigint; metodo text;
begin
  for r in
    select o.id, o.total, o.created_at, o.payment_method, o.webpay_status, o.customer_id,
           c.first_name, coalesce(c.phone_e164, c.phone) as telefono,
           (select string_agg(coalesce(oi.name, oi.sku), ', ') from order_items oi where oi.order_id = o.id) as items,
           (select count(*) from order_items oi join products p on p.id = oi.product_id
             where oi.order_id = o.id and p.deleted_at is null and coalesce(p.stock,0) > 0 and p.part_status not in ('vendida','no_disponible')) as con_stock
      from orders o join customers c on c.id = o.customer_id
     where o.created_at between now() - interval '14 days' and now() - interval '2 hours'
       and ((o.status = 'pending' and o.payment_method = 'mercadopago' and o.mp_payment_status is null)
         or (o.status = 'cancelled' and o.payment_method = 'webpay' and o.webpay_status in ('EXPIRED_NO_RETURN','ABORTED_BY_USER','TIMEOUT_FORM','ABANDONED_NO_TOKEN')))
       and coalesce(c.is_test, false) = false and c.deleted_at is null
       and coalesce(c.phone_e164, c.phone) is not null
       and coalesce(c.email,'') not in (select u.email from auth.users u join admins a on a.user_id = u.id)
       and not exists (select 1 from orders o2 where o2.customer_id = o.customer_id and o2.status = 'completed' and o2.created_at > o.created_at)
       and not exists (select 1 from agente_tareas t where t.agente = 'recuperador_pagos' and t.entidad_tipo = 'order' and t.entidad_id = o.id::text)
     order by o.created_at
  loop
    if r.con_stock = 0 then
      insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, resultado, salida, propuesta)
      values ('recuperador_pagos', 'pago_abandonado_sin_stock', 'order', r.id::text, 'omitida',
              jsonb_build_object('items', r.items, 'monto', r.total), 'Pedido #' || r.id || ' abandonado, pero la pieza ya no está disponible: no se propone recuperación.');
      continue;
    end if;
    nombre := nullif(btrim(split_part(coalesce(r.first_name,''), ' ', 1)), '');
    nombre := case when nombre is null then '' else initcap(lower(nombre)) end;
    gar := case when es_electrica(r.items)
                then 'Al ser pieza eléctrica se prueba con video antes de entregarla (sin garantía posventa).'
                else 'Va con garantía de funcionamiento de 7 días.' end;
    metodo := case when r.payment_method = 'mercadopago' then 'Mercado Pago' else 'Webpay' end;
    msg := 'Hola' || case when nombre <> '' then ' ' || nombre else '' end || ', te saluda Desarmaduría Saravia 👋. '
        || 'Vimos que iniciaste la compra de ' || r.items || ' (' || fmt_clp(r.total) || ') en autopartschile.cl y el pago por ' || metodo || ' no alcanzó a completarse. '
        || '¿Te pasó algo con el link o prefieres pagar por transferencia? La pieza sigue disponible y si quieres te la reservo hoy. '
        || gar || ' Retiro en La Pintana o envío por Starken a todo Chile.';
    insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, propuesta, entrada, salida)
    values ('recuperador_pagos', 'recuperar_pago', 'order', r.id::text, true, 'pendiente', msg,
            jsonb_build_object('order_id', r.id, 'metodo', r.payment_method, 'webpay_status', r.webpay_status, 'creado', r.created_at),
            jsonb_build_object('mensaje', msg, 'telefono', r.telefono, 'wa_link', wa_link(r.telefono, msg), 'monto', r.total, 'items', r.items, 'electrica', es_electrica(r.items)))
    returning id into tid;
    n := n + 1;
  end loop;
  if n > 0 then
    perform notificar('💳 ' || n || ' pago(s) por recuperar', 'El Recuperador propuso ' || n || ' WhatsApp(s) a clientes que no terminaron de pagar. Revísalos en Aprobaciones.', '/admin/equipo-ia.html#aprobaciones', 'recuperador:' || (now() at time zone 'America/Santiago')::date);
  end if;
  return jsonb_build_object('propuestas', n);
end $$;

-- ---------- 5. Finanzas (lee el esquema finance que alimenta finance-bot) ----------
create or replace function public.finanzas_resumen(p_desde date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'America/Santiago')::date;
  m0 date := coalesce(p_desde, date_trunc('month', hoy)::date);
  r jsonb;
begin
  select jsonb_build_object(
    'desde', m0, 'hasta', hoy,
    'ventas_mes', (select coalesce(-sum(p.amount),0) from finance.postings p join finance.accounts a on a.id = p.account_id join finance.transactions t on t.id = p.transaction_id where a.type = 'income' and t.occurred_on >= m0),
    'ventas_n', (select count(*) from finance.transactions t where t.op_type in ('venta','venta_credito') and t.occurred_on >= m0 and t.reverses_id is null),
    'gastos_mes', (select coalesce(sum(p.amount),0) from finance.postings p join finance.accounts a on a.id = p.account_id join finance.transactions t on t.id = p.transaction_id where a.type = 'expense' and a.role <> 'cogs' and t.occurred_on >= m0),
    'gastos_n', (select count(*) from finance.transactions t where t.op_type = 'gasto' and t.occurred_on >= m0 and t.reverses_id is null),
    'compras_autos_mes', (select coalesce(sum(abs(p.amount)),0) from finance.postings p join finance.accounts a on a.id = p.account_id join finance.transactions t on t.id = p.transaction_id where t.op_type = 'compra_vehiculo' and a.is_money and t.occurred_on >= m0),
    'compras_autos_n', (select count(*) from finance.transactions t where t.op_type = 'compra_vehiculo' and t.occurred_on >= m0 and t.reverses_id is null),
    'disponible', (select coalesce(sum(p.amount),0) from finance.postings p join finance.accounts a on a.id = p.account_id where a.type = 'asset' and a.is_money),
    'disponible_detalle', (select coalesce(jsonb_object_agg(a.role, s), '{}') from (select a.role, sum(p.amount) s from finance.postings p join finance.accounts a on a.id = p.account_id where a.type = 'asset' and a.is_money group by a.role) a),
    'por_cobrar', (select coalesce(sum(p.amount),0) from finance.postings p join finance.accounts a on a.id = p.account_id where a.role = 'receivable'),
    'ultimo_registro', (select max(occurred_on) from finance.transactions),
    'dias_sin_registrar', hoy - (select max(occurred_on) from finance.transactions),
    'obligaciones', coalesce((select jsonb_agg(jsonb_build_object('nombre', name, 'vence', due_date, 'monto', coalesce(amount_declared, amount_estimated), 'estado', status) order by due_date)
                              from finance.obligations where status <> 'pagado' and due_date <= hoy + 30), '[]')
  ) into r;
  return r;
end $$;

create or replace function public.finanzas_revisar() returns jsonb
language plpgsql security definer set search_path = public as $$
declare f jsonb; txt text; tid bigint; hoy date := (now() at time zone 'America/Santiago')::date; o jsonb;
begin
  f := finanzas_resumen();
  txt := '💰 Caja ' || to_char(hoy, 'DD-MM') || ' · mes: ventas ' || fmt_clp((f->>'ventas_mes')::numeric) || ' (' || (f->>'ventas_n') || ')'
      || ' · gastos ' || fmt_clp((f->>'gastos_mes')::numeric) || ' (' || (f->>'gastos_n') || ')'
      || ' · autos comprados ' || fmt_clp((f->>'compras_autos_mes')::numeric) || ' (' || (f->>'compras_autos_n') || ')'
      || ' · disponible ' || fmt_clp((f->>'disponible')::numeric)
      || ' · por cobrar ' || fmt_clp((f->>'por_cobrar')::numeric)
      || ' · último registro ' || coalesce(f->>'ultimo_registro', 'nunca');
  insert into agente_tareas (agente, accion, entidad_tipo, entidad_id, salida, propuesta)
  values ('finanzas', 'resumen_diario', 'dia', hoy::text, f, txt) returning id into tid;
  if (f->>'dias_sin_registrar')::int >= 2 then
    perform notificar('💰 Caja sin registrar', 'Hace ' || (f->>'dias_sin_registrar') || ' días que no entra nada en finance-bot. Si hubo ventas o gastos, anótalos para que el cierre cuadre.', '/admin/equipo-ia.html', 'finanzas:sin_registro:' || hoy);
  end if;
  for o in select * from jsonb_array_elements(f->'obligaciones') loop
    if (o->>'vence')::date <= hoy + 7 then
      perform notificar('📅 Vence ' || (o->>'nombre'), 'Vence el ' || to_char((o->>'vence')::date, 'DD-MM') || coalesce(' · ' || fmt_clp((o->>'monto')::numeric), ''), '/admin/equipo-ia.html', 'finanzas:oblig:' || (o->>'nombre') || ':' || (o->>'vence'));
    end if;
  end loop;
  if extract(day from hoy) >= 7 and (f->>'gastos_mes')::numeric > (f->>'ventas_mes')::numeric then
    perform notificar('⚠️ Gastos sobre ventas', 'Este mes los gastos (' || fmt_clp((f->>'gastos_mes')::numeric) || ') superan las ventas (' || fmt_clp((f->>'ventas_mes')::numeric) || ').', '/admin/equipo-ia.html', 'finanzas:gastos>ventas:' || to_char(hoy, 'YYYY-MM'));
  end if;
  return jsonb_build_object('resumen', txt);
end $$;

-- ---------- 6. Ejecutar al aprobar: recuperar_pago ----------
-- (versión completa de agente_tareas_ejecutar con la rama nueva; el resto es idéntico a lo ya aplicado)
create or replace function public.agente_tareas_ejecutar() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; q uuid; pid bigint;
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
      -- El mensaje lo envías tú desde el enlace de WhatsApp; aquí solo queda la huella en el pedido.
      if new.propuesta_editada is not null then new.salida := new.salida || jsonb_build_object('mensaje', new.propuesta_editada, 'wa_link', public.wa_link(new.salida->>'telefono', new.propuesta_editada)); end if;
      update orders set notes = concat_ws(' | ', notes, 'Recuperación por WhatsApp aprobada (tarea #' || new.id || ', ' || to_char(now() at time zone 'America/Santiago', 'DD-MM-YYYY') || ')') where id = new.entidad_id::bigint;
    end if;
  end if;
  return new;
end $$;

-- ---------- 7. Programación ----------
select cron.schedule('recuperador-pagos-1h', '30 12-23 * * 1-6', $$select public.recuperador_pagos_revisar()$$);
select cron.schedule('finanzas-diario', '20 11 * * 1-6', $$select public.finanzas_revisar()$$);

-- ---------- 8. Tareas en cola (una sola vez, con dedupe) ----------
insert into public.agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, propuesta, salida)
select 'marketing_ads', 'ads_pausar_campanas_sin_gasto', 'meta_ads', 'cuenta', true, 'pendiente',
 '3 campañas siguen marcadas ACTIVAS sin gastar nada en 90 días: "2013 Kia Optima" (15-jun), "DESARME SUZUKI ALTO 800" (2-may) y "1998 Chevrolet Lumina" (6-mar). Pausarlas en Ads Manager deja la cuenta limpia y evita que se reactiven solas. No cambia el gasto actual. Al aprobar queda registrado; la pausa la haces en Ads Manager porque la cuenta todavía no está conectada al proyecto.',
 jsonb_build_object('campanas', jsonb_build_array('120249167957510584','120246242218330584','120243012614710584'), 'ejecucion', 'manual en Ads Manager')
where not exists (select 1 from agente_tareas where agente='marketing_ads' and accion='ads_pausar_campanas_sin_gasto');

insert into public.agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, propuesta, salida)
select 'marketing_ads', 'ads_destino_whatsapp', 'meta_ads', 'cuenta', true, 'pendiente',
 'En noviembre pagaste $35.812 por 85 conversaciones que llegan a Messenger/Marketplace y ninguna entra al CRM. Propuesta: que las próximas publicaciones impulsadas tengan destino WhatsApp (anuncio clic-a-WhatsApp al +56 9 5381 7335) para que cada conversación entre por el canal que sí atiendes y que el Recepcionista puede registrar. Prioriza anuncios de "desarme completo": cuestan $175–$543 por conversación contra $998–$1.163 las piezas sueltas (datos reales de la API, 90 días).',
 jsonb_build_object('gasto_nov', 35812, 'conversaciones_nov', 85, 'ejecucion', 'manual en Ads Manager')
where not exists (select 1 from agente_tareas where agente='marketing_ads' and accion='ads_destino_whatsapp');

insert into public.agente_tareas (agente, accion, entidad_tipo, entidad_id, requiere_aprobacion, estado_aprobacion, propuesta, salida)
select 'sistema', 'configurar_secretos_pendientes', 'supabase', 'edge_secrets', true, 'pendiente',
 'Faltan 4 secretos en Supabase → Edge Functions → Secrets para destrabar 4 escritorios: ANTHROPIC_API_KEY (Seguimiento con IA, Estratega, Catalogador con visión) y META_APP_SECRET + META_PAGE_ACCESS_TOKEN + META_VERIFY_TOKEN (Messenger/Instagram al CRM, Redes sociales, Ads diario). Se cargan solo desde el panel de Supabase, nunca por chat. Aprueba cuando estén cargados y los agentes empiezan a correr solos.',
 jsonb_build_object('secretos', jsonb_build_array('ANTHROPIC_API_KEY','META_APP_SECRET','META_PAGE_ACCESS_TOKEN','META_VERIFY_TOKEN'), 'ejecucion', 'manual en Supabase')
where not exists (select 1 from agente_tareas where agente='sistema' and accion='configurar_secretos_pendientes');
