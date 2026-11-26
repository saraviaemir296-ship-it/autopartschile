-- =====================================================================
-- FASE 1 — BASE CENTRAL DEL EQUIPO IA (Desarmaduría Saravia / AutopartsChile)
-- Proyecto Supabase: zlyforhywunqhitrdreo (autopartschile-ai)
--
-- ESTADO: APLICADA el 26-nov-2026 como 20261126021054_fase1_base_central_equipo_ia.
-- Correcciones posteriores en 20261126_fase1b_correcciones.sql (aplicar después).
--
-- PRINCIPIO: no se crea una base paralela. Se EXTIENDE lo que ya existe
-- (products, vehiculos, customers, crm_*, orders, oportunidades) y solo se
-- crean tablas nuevas donde hoy no hay nada: publicaciones, red_solicitudes,
-- agente_tareas. Todo es aditivo e idempotente: columnas nuevas nullables o
-- con default, ningún DROP de tabla, ningún cambio de tipo. El sitio web y el
-- admin actual siguen funcionando sin tocar una línea.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Catálogos: canales que faltaban
-- ---------------------------------------------------------------------
insert into public.crm_channels (code, label, is_integrated, sort_order, active) values
  ('red_desarmadurias', 'Red Desarmadurías Chile', false, 55, true),
  ('marketplace',       'Facebook Marketplace',    false, 56, true),
  ('grupo_facebook',    'Grupos de Facebook',      false, 57, true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 1. VEHICULOS (ya existe, 34 filas). Faltaban: patente/VIN, ubicación,
--    estado del ciclo de vida y costo de compra.
-- ---------------------------------------------------------------------
alter table public.vehiculos
  add column if not exists patente      text,
  add column if not exists vin          text,
  add column if not exists ubicacion    text,
  add column if not exists estado       text,
  add column if not exists costo_compra numeric,
  add column if not exists fecha_compra date;

alter table public.vehiculos drop constraint if exists vehiculos_ubicacion_check;
alter table public.vehiculos add constraint vehiculos_ubicacion_check
  check (ubicacion is null or ubicacion in ('matriz','patio'));

alter table public.vehiculos drop constraint if exists vehiculos_estado_check;
alter table public.vehiculos add constraint vehiculos_estado_check
  check (estado is null or estado in ('ingresado','en_desarme','desarmado','vendido_entero'));

alter table public.vehiculos drop constraint if exists vehiculos_costo_compra_check;
alter table public.vehiculos add constraint vehiculos_costo_compra_check
  check (costo_compra is null or costo_compra >= 0);

-- Estado inicial derivado del booleano que ya usa el sitio (en_desarme).
-- Los 13 vehículos con en_desarme=false quedan como 'desarmado' (aún tienen
-- piezas disponibles asociadas); Emir corrige los que correspondan.
update public.vehiculos
   set estado = case when en_desarme then 'en_desarme' else 'desarmado' end
 where estado is null;

-- en_desarme lo sigue leyendo el sitio público: se mantiene sincronizado
-- automáticamente desde el nuevo campo estado.
create or replace function public.vehiculos_sync_en_desarme() returns trigger
language plpgsql as $$
begin
  if new.estado is not null then
    new.en_desarme := (new.estado = 'en_desarme');
  end if;
  return new;
end $$;
drop trigger if exists trg_vehiculos_sync_en_desarme on public.vehiculos;
create trigger trg_vehiculos_sync_en_desarme
  before insert or update of estado on public.vehiculos
  for each row execute function public.vehiculos_sync_en_desarme();

create unique index if not exists vehiculos_patente_uidx
  on public.vehiculos (upper(replace(patente,'-','')))
  where patente is not null;
create index if not exists vehiculos_estado_idx on public.vehiculos (estado);

comment on column public.vehiculos.estado is 'ingresado (recién comprado, sin despiece) → en_desarme → desarmado (sin piezas grandes) | vendido_entero. Sincroniza en_desarme.';
comment on column public.vehiculos.ubicacion is 'matriz = Av. Lo Blanco 1072 | patio = Guacolda 2050';

-- ---------------------------------------------------------------------
-- 2. PRODUCTS = repuestos (ya existe, 1.254 filas vivas).
--    Faltaban: precio sugerido como columna real (hoy vive en metadata),
--    estado del precio (regla 2), ubicación física, condición, imagen
--    promocional (regla 1) y reserva.
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists precio_sugerido        numeric,
  add column if not exists precio_estado          text not null default 'fijado',
  add column if not exists precio_fijado_at       timestamptz,
  add column if not exists precio_fijado_por      uuid references auth.users(id) on delete set null,
  add column if not exists ubicacion_fisica       text,
  add column if not exists condicion              text,
  add column if not exists imagen_promocional_url text,
  add column if not exists reservado_para         uuid references public.crm_conversations(id) on delete set null,
  add column if not exists reservado_hasta        timestamptz;

alter table public.products drop constraint if exists products_precio_estado_check;
alter table public.products add constraint products_precio_estado_check
  check (precio_estado in ('pendiente','fijado'));

alter table public.products drop constraint if exists products_precio_sugerido_check;
alter table public.products add constraint products_precio_sugerido_check
  check (precio_sugerido is null or precio_sugerido >= 0);

alter table public.products drop constraint if exists products_condicion_check;
alter table public.products add constraint products_condicion_check
  check (condicion is null or condicion in ('excelente','bueno','regular','para_reparar'));

-- part_status: se agrega 'reservada' (hoy: en_vehiculo, desmontada, vendida, no_disponible)
alter table public.products drop constraint if exists products_part_status_check;
alter table public.products add constraint products_part_status_check
  check (part_status is null or part_status in ('en_vehiculo','desmontada','reservada','vendida','no_disponible'));

-- Migración de lo que hoy está en metadata (sin borrar metadata):
--  * metadata.precio_sugerido (406 filas, número)  -> precio_sugerido
--  * metadata.pendiente_aprobacion_emir = true (185)-> precio_estado = 'pendiente'
update public.products
   set precio_sugerido = coalesce(precio_sugerido, nullif(metadata->>'precio_sugerido','')::numeric)
 where metadata ? 'precio_sugerido'
   and (metadata->>'precio_sugerido') ~ '^[0-9]+(\.[0-9]+)?$';

update public.products
   set precio_estado = 'pendiente'
 where (metadata->>'pendiente_aprobacion_emir') in ('true','1');

-- Precio: un repuesto sin price_sale > 0 nunca puede estar 'fijado'.
create or replace function public.products_precio_guard() returns trigger
language plpgsql as $$
begin
  if new.price_sale is null or new.price_sale <= 0 then
    new.precio_estado := 'pendiente';
  end if;
  if new.precio_estado = 'fijado' and (old is null or old.precio_estado is distinct from 'fijado' or old.price_sale is distinct from new.price_sale) then
    new.precio_fijado_at  := coalesce(new.precio_fijado_at, now());
    new.precio_fijado_por := coalesce(new.precio_fijado_por, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists trg_products_precio_guard on public.products;
create trigger trg_products_precio_guard
  before insert or update of price_sale, precio_estado on public.products
  for each row execute function public.products_precio_guard();

create index if not exists products_oem_number_idx on public.products (upper(oem_number)) where oem_number is not null;
create index if not exists products_precio_pendiente_idx on public.products (id) where precio_estado = 'pendiente' and deleted_at is null;
create index if not exists products_disponibles_idx on public.products (vehiculo_id, category) where is_active and stock > 0 and deleted_at is null;
create index if not exists products_reservado_idx on public.products (reservado_para) where reservado_para is not null;

comment on column public.products.precio_estado is 'Regla 2: pendiente = la IA sugirió o no hay precio; fijado = Emir lo aprobó. Solo lo fijado se publica.';
comment on column public.products.imagen_promocional_url is 'Regla 1: foto del repuesto grande y completo + autos compatibles abajo + logo. Obligatoria para publicar.';

-- ---------------------------------------------------------------------
-- 3. CUSTOMERS = clientes (ya existe). Faltaba país (clientes extranjeros).
-- ---------------------------------------------------------------------
alter table public.customers add column if not exists pais text not null default 'Chile';

-- ---------------------------------------------------------------------
-- 4. CRM_CONVERSATIONS = leads (ya existe, 21 etapas, motivo de pérdida,
--    próxima acción). Faltaba la pieza buscada estructurada y el vínculo
--    con el repuesto ofrecido / la solicitud de la Red.
-- ---------------------------------------------------------------------
alter table public.crm_conversations
  add column if not exists pieza_buscada    text,
  add column if not exists vehiculo_buscado text,
  add column if not exists product_id       bigint references public.products(id) on delete set null,
  add column if not exists red_solicitud_id bigint;

create index if not exists crm_conversations_next_action_idx
  on public.crm_conversations (next_action_at) where closed_at is null and deleted_at is null;
create index if not exists crm_conversations_product_idx on public.crm_conversations (product_id) where product_id is not null;

-- ---------------------------------------------------------------------
-- 5. ORDERS = ventas (ya existe, 46 filas). Faltaba transportista y
--    número de seguimiento.
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists carrier         text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url    text,
  add column if not exists shipped_at      timestamptz;

alter table public.orders drop constraint if exists orders_carrier_check;
alter table public.orders add constraint orders_carrier_check
  check (carrier is null or carrier in ('starken','dhl','chilexpress','bluexpress','otro'));

-- ---------------------------------------------------------------------
-- 6. OPORTUNIDADES = radar (ya existe, 62 filas). Faltaba la decisión
--    de Emir y el vínculo al vehículo si se compra.
-- ---------------------------------------------------------------------
alter table public.oportunidades
  add column if not exists decision     text not null default 'pendiente',
  add column if not exists decidida_at  timestamptz,
  add column if not exists notas        text,
  add column if not exists vehiculo_id  bigint references public.vehiculos(id) on delete set null,
  add column if not exists updated_at   timestamptz not null default now();

alter table public.oportunidades drop constraint if exists oportunidades_decision_check;
alter table public.oportunidades add constraint oportunidades_decision_check
  check (decision in ('pendiente','contactar','en_negociacion','comprada','descartada'));

create index if not exists oportunidades_decision_idx on public.oportunidades (decision, score_ia desc) where decision in ('pendiente','contactar','en_negociacion');

-- Emir (admin) puede leer y decidir; hoy solo service_role podía.
drop policy if exists admin_all_oportunidades on public.oportunidades;
create policy admin_all_oportunidades on public.oportunidades
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. PUBLICACIONES (NUEVA). social_posts existía pero vacía, en inglés y
--    sin los canales reales; se reemplaza por esta.
-- ---------------------------------------------------------------------
create table if not exists public.publicaciones (
  id               bigint generated always as identity primary key,
  product_id       bigint not null references public.products(id) on delete cascade,
  canal            text not null check (canal in ('web','marketplace','grupo_facebook','muro_facebook','instagram','mercadolibre','tiktok','otro')),
  grupo_nombre     text,                 -- para grupo_facebook: qué grupo
  titulo           text,
  texto            text,
  imagen_url       text,
  url              text,
  external_id      text,                 -- p.ej. item_id de Mercado Libre
  estado           text not null default 'borrador'
                   check (estado in ('borrador','pendiente_aprobacion','aprobada','publicada','despublicar','despublicada','error')),
  creada_por       text not null default 'humano',   -- 'humano' o nombre del agente
  aprobada_por     uuid references auth.users(id) on delete set null,
  aprobada_at      timestamptz,
  publicada_at     timestamptz,
  despublicada_at  timestamptz,
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists publicaciones_product_idx on public.publicaciones (product_id);
create index if not exists publicaciones_estado_idx  on public.publicaciones (estado, canal);
-- Una sola publicación viva por repuesto y canal (grupos: una por grupo).
create unique index if not exists publicaciones_viva_uidx
  on public.publicaciones (product_id, canal, coalesce(grupo_nombre,''))
  where estado in ('pendiente_aprobacion','aprobada','publicada','despublicar');

drop trigger if exists trg_publicaciones_touch on public.publicaciones;
create trigger trg_publicaciones_touch before update on public.publicaciones
  for each row execute function public.crm_touch_updated_at();

-- REGLA 1 + REGLA 2, aplicadas en la base (no dependen de que el agente se acuerde):
-- nada pasa a 'aprobada' o 'publicada' sin número de parte, foto, imagen
-- promocional con autos compatibles y precio fijado por Emir.
create or replace function public.publicaciones_validar() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; faltan text[] := '{}';
begin
  if new.estado in ('aprobada','publicada') and (old is null or old.estado is distinct from new.estado) then
    select oem_number, images, imagen_promocional_url, precio_estado, price_sale, stock, is_active, part_status, deleted_at
      into p from products where id = new.product_id;
    if p.deleted_at is not null then faltan := array_append(faltan, 'repuesto eliminado'); end if;
    if nullif(btrim(p.oem_number),'') is null then faltan := array_append(faltan, 'número de parte'); end if;
    if p.images is null or jsonb_typeof(p.images) <> 'array' or jsonb_array_length(p.images) = 0 then faltan := array_append(faltan, 'foto del repuesto'); end if;
    if nullif(btrim(p.imagen_promocional_url),'') is null then faltan := array_append(faltan, 'imagen con autos compatibles'); end if;
    if p.precio_estado <> 'fijado' or p.price_sale is null or p.price_sale <= 0 then faltan := array_append(faltan, 'precio fijado por Emir'); end if;
    if coalesce(p.stock,0) <= 0 or p.part_status in ('vendida','no_disponible') then faltan := array_append(faltan, 'stock'); end if;
    if array_length(faltan,1) > 0 then
      raise exception 'No se puede publicar: falta %', array_to_string(faltan, ', ');
    end if;
    if new.estado = 'aprobada' then
      new.aprobada_at := coalesce(new.aprobada_at, now());
      new.aprobada_por := coalesce(new.aprobada_por, auth.uid());
    end if;
    if new.estado = 'publicada' then new.publicada_at := coalesce(new.publicada_at, now()); end if;
  end if;
  if new.estado = 'despublicada' then new.despublicada_at := coalesce(new.despublicada_at, now()); end if;
  return new;
end $$;
drop trigger if exists trg_publicaciones_validar on public.publicaciones;
create trigger trg_publicaciones_validar before insert or update on public.publicaciones
  for each row execute function public.publicaciones_validar();

-- Al venderse (o quedar sin stock) un repuesto, sus publicaciones vivas
-- pasan a 'despublicar': la cola para que el Publicador las baje de cada canal.
create or replace function public.products_marcar_despublicar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.part_status in ('vendida','no_disponible') and old.part_status is distinct from new.part_status)
     or (coalesce(new.stock,0) <= 0 and coalesce(old.stock,0) > 0)
     or (new.deleted_at is not null and old.deleted_at is null) then
    update publicaciones set estado = 'despublicar'
     where product_id = new.id and estado in ('aprobada','publicada');
  end if;
  return new;
end $$;
drop trigger if exists trg_products_marcar_despublicar on public.products;
create trigger trg_products_marcar_despublicar
  after update of part_status, stock, deleted_at on public.products
  for each row execute function public.products_marcar_despublicar();

alter table public.publicaciones enable row level security;
drop policy if exists publicaciones_admin on public.publicaciones;
create policy publicaciones_admin on public.publicaciones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists publicaciones_service on public.publicaciones;
create policy publicaciones_service on public.publicaciones
  for all to public using ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- 8. RED_SOLICITUDES (NUEVA): solicitudes #ID de "Red Desarmadurías Chile".
-- ---------------------------------------------------------------------
create table if not exists public.red_solicitudes (
  id                 bigint generated always as identity primary key,
  id_red             text not null unique,          -- el #ID tal como viene
  fecha_publicacion  timestamptz,
  texto_original     text not null,
  comuna             text,
  marca              text,
  modelo             text,
  anio               integer,
  pieza              text,
  contacto           text,
  estado             text not null default 'nueva'
                     check (estado in ('nueva','con_stock','sin_stock','respuesta_propuesta','respondida','descartada')),
  products_match     bigint[] not null default '{}',   -- repuestos candidatos en stock
  respuesta_propuesta text,
  conversation_id    uuid references public.crm_conversations(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists red_solicitudes_estado_idx on public.red_solicitudes (estado, created_at desc);
drop trigger if exists trg_red_solicitudes_touch on public.red_solicitudes;
create trigger trg_red_solicitudes_touch before update on public.red_solicitudes
  for each row execute function public.crm_touch_updated_at();

alter table public.crm_conversations drop constraint if exists crm_conversations_red_solicitud_fk;
alter table public.crm_conversations add constraint crm_conversations_red_solicitud_fk
  foreign key (red_solicitud_id) references public.red_solicitudes(id) on delete set null;

alter table public.red_solicitudes enable row level security;
drop policy if exists red_solicitudes_admin on public.red_solicitudes;
create policy red_solicitudes_admin on public.red_solicitudes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists red_solicitudes_service on public.red_solicitudes;
create policy red_solicitudes_service on public.red_solicitudes
  for all to public using ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- 9. AGENTE_TAREAS (NUEVA): bitácora de TODO lo que hace cada agente y, a
--    la vez, la COLA DE APROBACIÓN (regla 3). crm_automation_logs sigue
--    para los workflows internos del CRM; crm_ai_suggestions queda para
--    sugerencias por conversación. Esta es la vista única del "equipo IA".
-- ---------------------------------------------------------------------
create table if not exists public.agente_tareas (
  id                  bigint generated always as identity primary key,
  agente              text not null check (agente in (
                        'recepcionista','cotizador','seguimiento','red_desarmadurias',
                        'catalogador','disenador','publicador','ingreso_vehiculo',
                        'radar','despacho','cierre_dia','auditor','cotizador_grua','sistema')),
  accion              text not null,                     -- p.ej. 'crear_lead', 'proponer_precio'
  entidad_tipo        text,                              -- 'product','crm_conversation','order','vehiculo','oportunidad','publicacion','red_solicitud'
  entidad_id          text,
  entrada             jsonb not null default '{}',
  salida              jsonb not null default '{}',
  resultado           text not null default 'ok' check (resultado in ('ok','error','omitida')),
  error               text,
  requiere_aprobacion boolean not null default false,
  estado_aprobacion   text check (estado_aprobacion in ('pendiente','aprobada','editada','rechazada','ejecutada','expirada')),
  propuesta           text,                              -- lo que se enviaría/publicaría, legible para aprobar desde el celular
  propuesta_editada   text,
  aprobado_por        uuid references auth.users(id) on delete set null,
  decidido_at         timestamptz,
  ejecutado_at        timestamptz,
  duracion_ms         integer,
  modelo              text,
  tokens              integer,
  created_at          timestamptz not null default now(),
  constraint agente_tareas_aprobacion_coherente check (
    (requiere_aprobacion = false and estado_aprobacion is null)
    or (requiere_aprobacion = true and estado_aprobacion is not null)),
  constraint agente_tareas_decision_humana check (
    estado_aprobacion is null or estado_aprobacion in ('pendiente','expirada')
    or (aprobado_por is not null and decidido_at is not null))
);
create index if not exists agente_tareas_agente_idx    on public.agente_tareas (agente, created_at desc);
create index if not exists agente_tareas_pendientes_idx on public.agente_tareas (created_at) where estado_aprobacion = 'pendiente';
create index if not exists agente_tareas_entidad_idx   on public.agente_tareas (entidad_tipo, entidad_id);
create index if not exists agente_tareas_errores_idx   on public.agente_tareas (created_at desc) where resultado = 'error';

create or replace function public.agente_tareas_decidir() returns trigger
language plpgsql as $$
begin
  if new.requiere_aprobacion and new.estado_aprobacion is null then new.estado_aprobacion := 'pendiente'; end if;
  if new.estado_aprobacion in ('aprobada','editada','rechazada') and old.estado_aprobacion is distinct from new.estado_aprobacion then
    new.decidido_at  := coalesce(new.decidido_at, now());
    new.aprobado_por := coalesce(new.aprobado_por, auth.uid());
  end if;
  if new.estado_aprobacion = 'ejecutada' then new.ejecutado_at := coalesce(new.ejecutado_at, now()); end if;
  return new;
end $$;
drop trigger if exists trg_agente_tareas_decidir on public.agente_tareas;
create trigger trg_agente_tareas_decidir before insert or update on public.agente_tareas
  for each row execute function public.agente_tareas_decidir();

alter table public.agente_tareas enable row level security;
drop policy if exists agente_tareas_admin on public.agente_tareas;
create policy agente_tareas_admin on public.agente_tareas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists agente_tareas_service on public.agente_tareas;
create policy agente_tareas_service on public.agente_tareas
  for all to public using ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- 10. VISTAS EN ESPAÑOL (solo lectura, solo datos reales). Son lo que
--     leerán los agentes y el centro de mando. No duplican datos.
-- ---------------------------------------------------------------------

-- 10.1 Repuestos: estado comercial unificado + por qué NO es publicable.
create or replace view public.v_repuestos
with (security_invoker = true) as
select
  p.id, p.sku, p.name as nombre, p.oem_number as numero_parte, p.category as categoria,
  p.brand as marca, p.vehiculo_id, v.codigo as vehiculo_codigo,
  p.vehicle_compatibility as compatibilidades, p.lado, p.condicion,
  p.price_cost as costo, p.precio_sugerido, p.price_sale as precio_final, p.precio_estado,
  p.stock, p.part_status, p.is_active as activo, p.ubicacion_fisica, p.images as fotos,
  p.imagen_promocional_url, p.meli_item_id, p.meli_status, p.created_at, p.updated_at,
  case
    when p.deleted_at is not null then 'eliminado'
    when p.part_status = 'vendida' then 'vendido'
    when p.part_status = 'reservada' or p.reservado_para is not null then 'reservado'
    when p.precio_estado = 'pendiente' then 'precio_pendiente'
    when coalesce(p.stock,0) > 0 and p.is_active then 'disponible'
    when coalesce(p.stock,0) > 0 then 'disponible_sin_publicar'
    else 'no_disponible'
  end as estado,
  array_remove(array[
    case when nullif(btrim(p.oem_number),'') is null then 'sin_numero_parte' end,
    case when p.images is null or jsonb_typeof(p.images) <> 'array' or jsonb_array_length(p.images) = 0 then 'sin_foto' end,
    case when nullif(btrim(p.imagen_promocional_url),'') is null then 'sin_imagen_promocional' end,
    case when p.precio_estado <> 'fijado' or coalesce(p.price_sale,0) <= 0 then 'precio_pendiente' end,
    case when coalesce(p.stock,0) <= 0 then 'sin_stock' end
  ], null) as bloqueos_publicacion,
  (select count(*) from publicaciones pb where pb.product_id = p.id and pb.estado = 'publicada') as canales_publicados,
  (now()::date - p.created_at::date) as dias_en_stock
from products p
left join vehiculos v on v.id = p.vehiculo_id
where p.deleted_at is null;

-- 10.2 Leads: las 21 etapas del CRM colapsadas a las 5 columnas del kanban de Emir.
create or replace view public.v_leads
with (security_invoker = true) as
select
  c.id, c.customer_id, c.contact_name as cliente, c.contact_phone as telefono, c.channel_code as canal,
  c.sales_stage as etapa_detalle, s.pipeline_column as columna_crm,
  case
    when s.is_lost then 'cerrado_perdido'
    when s.is_won  then 'cerrado_ganado'
    when c.closed_at is null and c.next_action_at < now() then 'seguimiento'
    when s.pipeline_column in ('cotizacion_enviada','negociacion','esperando_pago') then 'cotizado'
    else 'nuevo'
  end as etapa,
  c.pieza_buscada, c.vehiculo_buscado, c.product_id, c.red_solicitud_id,
  c.priority as prioridad, c.potential_value as valor_potencial,
  c.next_action as proxima_accion, c.next_action_type as proxima_accion_tipo, c.next_action_at as proximo_contacto,
  (c.closed_at is null and c.next_action_at < now()) as seguimiento_vencido,
  c.loss_reason as motivo_perdida, c.loss_notes as motivo_perdida_notas,
  c.last_message_preview as ultimo_mensaje, c.last_message_at, c.started_at as creado_at, c.closed_at as cerrado_at
from crm_conversations c
join crm_sales_stages s on s.code = c.sales_stage
where c.deleted_at is null;

-- 10.3 Ventas: pedidos pagados (web/Webpay/MP) + ventas manuales registradas.
create or replace view public.v_ventas
with (security_invoker = true) as
select o.id::text as venta_id, 'orders' as origen_tabla, o.created_at as fecha, o.total, o.source as canal,
       o.payment_method as medio_pago,
       case when o.delivery_method = 'home_delivery' then coalesce(o.carrier,'envio') else 'retiro' end as tipo_entrega,
       o.tracking_number as n_seguimiento, o.customer_id, o.crm_conversation_id as lead_id,
       (select string_agg(oi.name, ' | ') from order_items oi where oi.order_id = o.id) as repuestos
from orders o
where o.status = 'completed'
union all
select 'manual-' || m.id, 'manual_sales', (m.sale_date::timestamptz), m.amount, coalesce(m.channel,'no especificado'),
       null, null, null, null, null, m.product_description
from manual_sales m;

-- 10.4 Inventario por vehículo: cuánto se ha recuperado vs. costo de compra.
--     'recuperado' solo cuenta ventas con repuesto identificado (order_items).
create or replace view public.v_inventario_vehiculo
with (security_invoker = true) as
select v.id, v.codigo, v.marca, v.modelo, v.motor, v.anio_desde, v.anio_hasta, v.estado, v.ubicacion,
       v.fecha_ingreso, v.costo_compra,
       count(p.id) filter (where p.deleted_at is null)                                              as piezas_total,
       count(p.id) filter (where p.deleted_at is null and p.part_status not in ('vendida','no_disponible') and coalesce(p.stock,0) > 0) as piezas_disponibles,
       count(p.id) filter (where p.deleted_at is null and p.part_status = 'vendida')                as piezas_vendidas,
       count(p.id) filter (where p.deleted_at is null and p.precio_estado = 'pendiente')            as piezas_precio_pendiente,
       coalesce(sum(p.price_sale) filter (where p.deleted_at is null and p.part_status not in ('vendida','no_disponible') and coalesce(p.stock,0) > 0), 0) as valor_stock_disponible,
       coalesce((select sum(oi.total_price) from order_items oi join orders o on o.id = oi.order_id join products px on px.id = oi.product_id
                 where px.vehiculo_id = v.id and o.status = 'completed'), 0)                        as recuperado,
       case when v.costo_compra > 0 then round(100.0 * coalesce((select sum(oi.total_price) from order_items oi join orders o on o.id = oi.order_id join products px on px.id = oi.product_id
                 where px.vehiculo_id = v.id and o.status = 'completed'), 0) / v.costo_compra, 1) end as pct_recuperado
from vehiculos v
left join products p on p.vehiculo_id = v.id
group by v.id;

-- 10.5 Cola de aprobaciones: TODO lo que espera un sí/no de Emir, en un solo lugar.
create or replace view public.v_aprobaciones_pendientes
with (security_invoker = true) as
select 'precio' as tipo, p.id::text as entidad_id, 'product' as entidad_tipo,
       p.name || ' — sugerido $' || coalesce(to_char(p.precio_sugerido,'FM999G999G999'),'?') as resumen,
       p.updated_at as desde, null::text as agente
from products p where p.precio_estado = 'pendiente' and p.deleted_at is null and coalesce(p.stock,0) > 0
union all
select 'publicacion', pb.id::text, 'publicacion', pb.canal || ': ' || coalesce(pb.titulo, p.name), pb.created_at, pb.creada_por
from publicaciones pb join products p on p.id = pb.product_id where pb.estado = 'pendiente_aprobacion'
union all
select 'tarea', t.id::text, coalesce(t.entidad_tipo,'-'), t.agente || ' · ' || t.accion || coalesce(': ' || left(t.propuesta, 120), ''), t.created_at, t.agente
from agente_tareas t where t.estado_aprobacion = 'pendiente'
union all
select 'sugerencia_crm', s.id::text, 'crm_conversation', s.suggestion_type || ': ' || left(s.content, 120), s.created_at, 'crm'
from crm_ai_suggestions s where s.status = 'propuesta';

-- 10.6 Equipo IA: actividad por agente (para el centro de mando).
create or replace view public.v_equipo_ia
with (security_invoker = true) as
select agente,
       max(created_at) as ultima_accion_at,
       (array_agg(accion order by created_at desc))[1] as ultima_accion,
       count(*) filter (where created_at >= date_trunc('day', now() at time zone 'America/Santiago') at time zone 'America/Santiago') as tareas_hoy,
       count(*) filter (where resultado = 'error' and created_at >= now() - interval '7 days') as errores_7d,
       count(*) filter (where estado_aprobacion = 'pendiente') as esperando_aprobacion
from agente_tareas group by agente;

comment on view public.v_aprobaciones_pendientes is 'Fuente única de la cola de aprobación (fase 3/4).';
