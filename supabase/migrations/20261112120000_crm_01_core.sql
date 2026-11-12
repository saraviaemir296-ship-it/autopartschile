-- =====================================================================
-- CRM Desarmaduría Saravia — Fase 2 / Migración 01: esquema núcleo
-- Proyecto Supabase: autopartschile-ai (zlyforhywunqhitrdreo)
--
-- Principios:
--  * Reutiliza tablas existentes: customers, orders, order_items, products,
--    vehiculos, shipping_tracking, returns, admins. No se duplican.
--  * Tablas nuevas con prefijo crm_ y PK uuid (catálogos con PK text).
--  * Cada categoría de estado en su propia columna y su propio catálogo:
--    chat_status, sales_stage, order_status, postsale_status, loss_reason.
--  * Cambios a tablas existentes son aditivos o relajan restricciones;
--    no se borra ni se reescribe ningún dato existente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Utilidades
-- ---------------------------------------------------------------------
create or replace function public.crm_touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

-- Normaliza teléfonos chilenos a E.164 (+569XXXXXXXX). Devuelve null si no es usable.
create or replace function public.crm_normalize_phone(p text) returns text
language sql immutable set search_path = public as $$
  select case
    when d is null or d = '' or d ~ '^0+$' then null
    when length(d) = 9  and d like '9%'   then '+56' || d
    when length(d) = 8                    then '+569' || d
    when length(d) = 11 and d like '56%'  then '+' || d
    when length(d) between 8 and 15       then '+' || d
    else null end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') d) s
$$;

-- ---------------------------------------------------------------------
-- 1. Catálogos configurables (uno por categoría; no se mezclan)
-- ---------------------------------------------------------------------
create table if not exists public.crm_channels (
  code text primary key,
  label text not null,
  is_integrated boolean not null default false,  -- true solo cuando la integración real existe
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.crm_branches (
  id bigint generated always as identity primary key,
  name text not null unique,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_chat_statuses (
  code text primary key,
  label text not null,
  sort_order int not null default 0,
  is_closed boolean not null default false,
  requires_owner boolean not null default false,
  active boolean not null default true
);

create table if not exists public.crm_sales_stages (
  code text primary key,
  label text not null,
  sort_order int not null default 0,
  pipeline_column text not null,
  is_column_default boolean not null default false,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  needs_next_action boolean not null default true,
  active boolean not null default true
);

create table if not exists public.crm_order_statuses (
  code text primary key, label text not null, sort_order int not null default 0,
  is_terminal boolean not null default false, active boolean not null default true
);

create table if not exists public.crm_postsale_statuses (
  code text primary key, label text not null, sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.crm_loss_reasons (
  code text primary key, label text not null, sort_order int not null default 0,
  requires_notes boolean not null default false, active boolean not null default true
);

create table if not exists public.crm_quotation_statuses (
  code text primary key, label text not null, sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.crm_task_types (
  code text primary key, label text not null, sort_order int not null default 0,
  default_due_minutes int not null default 60, active boolean not null default true
);

create table if not exists public.crm_priorities (
  code text primary key, label text not null, sort_order int not null,
  sla_first_response_minutes int not null, active boolean not null default true
);

-- Reglas configurables de prioridad: la primera que calza (por sort_order) gana.
create table if not exists public.crm_priority_rules (
  id bigint generated always as identity primary key,
  priority_code text not null references public.crm_priorities(code),
  field text not null check (field in ('chat_status','sales_stage','order_status','postsale_status')),
  values text[] not null,
  sort_order int not null default 0,
  description text,
  active boolean not null default true
);

-- ---------------------------------------------------------------------
-- 2. Roles, permisos y equipo
-- ---------------------------------------------------------------------
create table if not exists public.crm_roles (
  code text primary key, label text not null, description text
);

create table if not exists public.crm_permissions (
  code text primary key, description text not null
);

create table if not exists public.crm_role_permissions (
  role_code text not null references public.crm_roles(code) on delete cascade,
  permission_code text not null references public.crm_permissions(code) on delete cascade,
  primary key (role_code, permission_code)
);

create table if not exists public.crm_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  role_code text not null references public.crm_roles(code),
  branch_id bigint references public.crm_branches(id),
  phone text,
  active boolean not null default true,
  accepts_auto_assign boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger crm_staff_touch before update on public.crm_staff
  for each row execute function public.crm_touch_updated_at();

-- Rol del usuario actual. Los admins existentes (tabla admins) son admin del CRM.
create or replace function public.crm_current_role() returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.admins a where a.user_id = auth.uid()) then 'admin'
    else (select s.role_code from public.crm_staff s where s.user_id = auth.uid() and s.active)
  end
$$;

create or replace function public.crm_has_perm(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crm_role_permissions rp
    where rp.role_code = public.crm_current_role() and rp.permission_code = p_code
  )
$$;

create or replace function public.crm_is_service() returns boolean
language sql stable set search_path = public as $$
  select coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin')
$$;

-- ---------------------------------------------------------------------
-- 3. Clientes (reutiliza public.customers)
-- ---------------------------------------------------------------------
alter table public.customers alter column email drop not null;
alter table public.customers
  add column if not exists phone_e164 text,
  add column if not exists region text,
  add column if not exists comuna text,
  add column if not exists source_channel text references public.crm_channels(code),
  add column if not exists classification text not null default 'potencial',
  add column if not exists contact_preferences jsonb not null default '{}'::jsonb,
  add column if not exists is_test boolean not null default false,
  add column if not exists merged_into_id bigint references public.customers(id),
  add column if not exists deleted_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customers_classification_check') then
    alter table public.customers add constraint customers_classification_check check (classification in
      ('nuevo','recurrente','frecuente','mayorista','potencial','inactivo','fidelizado'));
  end if;
end $$;

create or replace function public.crm_customers_normalize() returns trigger
language plpgsql set search_path = public as $$
begin
  new.phone_e164 := public.crm_normalize_phone(new.phone);
  if new.email is not null and btrim(new.email) = '' then new.email := null; end if;
  return new;
end $$;
drop trigger if exists crm_customers_normalize on public.customers;
create trigger crm_customers_normalize before insert or update of phone, email on public.customers
  for each row execute function public.crm_customers_normalize();

-- Rellenar teléfono normalizado y marcar clientes de prueba existentes (no se borra nada).
update public.customers set phone_e164 = public.crm_normalize_phone(phone);
update public.customers set is_test = true
 where email ilike '%@autopartschile.cl' or email ilike '%@e2e.cl'
    or phone_e164 in ('+56987654321', '+56900000000');

-- Detección de duplicados por teléfono. NO es índice único a propósito: el checkout de Webpay
-- (webpay-create-transaction) crea clientes por email; un índice único por teléfono haría fallar
-- el pago de un cliente que ya existe con otro correo. Los duplicados se detectan y se fusionan.
create index if not exists customers_phone_e164_idx on public.customers (phone_e164)
  where phone_e164 is not null and deleted_at is null and merged_into_id is null;

-- Identificadores por canal (PSID de Messenger/Instagram, wa_id, etc.)
create table if not exists public.crm_customer_identities (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  channel_code text not null references public.crm_channels(code),
  external_id text not null,
  display_name text,
  created_at timestamptz not null default now(),
  unique (channel_code, external_id)
);
create index if not exists crm_customer_identities_customer_idx on public.crm_customer_identities (customer_id);

create table if not exists public.crm_customer_vehicles (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  vehiculo_id bigint references public.vehiculos(id),
  make text, model text,
  year int check (year is null or year between 1950 and 2100),
  engine text,
  plate text check (plate is null or char_length(plate) <= 10),
  vin text check (vin is null or char_length(vin) <= 17),
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists crm_customer_vehicles_customer_idx on public.crm_customer_vehicles (customer_id);
create index if not exists crm_customer_vehicles_plate_idx on public.crm_customer_vehicles (upper(plate));

create table if not exists public.crm_customer_notes (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  conversation_id uuid,
  author_id uuid references auth.users(id),
  body text not null check (char_length(body) between 1 and 4000),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists crm_customer_notes_customer_idx on public.crm_customer_notes (customer_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. Conversaciones y mensajes
-- ---------------------------------------------------------------------
create table if not exists public.crm_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id bigint references public.customers(id),
  channel_code text not null references public.crm_channels(code),
  external_thread_id text,                         -- wa_id / PSID / id de hilo del canal
  contact_name text,
  contact_phone text,
  branch_id bigint references public.crm_branches(id),
  assigned_to uuid references public.crm_staff(user_id),
  chat_status text not null default 'nuevo' references public.crm_chat_statuses(code),
  sales_stage text not null default 'nuevo_prospecto' references public.crm_sales_stages(code),
  order_status text not null default 'sin_pedido' references public.crm_order_statuses(code),
  postsale_status text not null default 'sin_postventa' references public.crm_postsale_statuses(code),
  priority text not null default 'media' references public.crm_priorities(code),
  priority_source text not null default 'regla' check (priority_source in ('regla','ia','manual')),
  loss_reason text references public.crm_loss_reasons(code),
  loss_notes text,
  next_action text,
  next_action_type text references public.crm_task_types(code),
  next_action_at timestamptz,
  next_action_exception text check (next_action_exception is null or char_length(next_action_exception) >= 5),
  potential_value numeric(12,0) check (potential_value is null or potential_value >= 0),
  duplicate_of uuid references public.crm_conversations(id),
  started_at timestamptz not null default now(),
  first_inbound_at timestamptz,
  first_response_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count int not null default 0 check (unread_count >= 0),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint crm_conv_lost_needs_reason check (sales_stage <> 'venta_perdida' or loss_reason is not null),
  constraint crm_conv_duplicate_needs_ref check (chat_status <> 'duplicado' or duplicate_of is not null)
);
create unique index if not exists crm_conversations_thread_uniq
  on public.crm_conversations (channel_code, external_thread_id)
  where external_thread_id is not null and deleted_at is null;
create index if not exists crm_conversations_inbox_idx on public.crm_conversations (chat_status, last_message_at desc) where deleted_at is null;
create index if not exists crm_conversations_assigned_idx on public.crm_conversations (assigned_to, last_message_at desc) where deleted_at is null;
create index if not exists crm_conversations_customer_idx on public.crm_conversations (customer_id);
create index if not exists crm_conversations_next_action_idx on public.crm_conversations (next_action_at) where deleted_at is null;
create index if not exists crm_conversations_stage_idx on public.crm_conversations (sales_stage) where deleted_at is null;

alter table public.crm_customer_notes drop constraint if exists crm_customer_notes_conversation_fk;
alter table public.crm_customer_notes add constraint crm_customer_notes_conversation_fk
  foreign key (conversation_id) references public.crm_conversations(id);

create table if not exists public.crm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.crm_conversations(id),
  channel_code text not null references public.crm_channels(code),
  external_message_id text,
  direction text not null check (direction in ('entrante','saliente')),
  sender_type text not null check (sender_type in ('cliente','vendedor','ia','sistema')),
  staff_id uuid references public.crm_staff(user_id),
  message_type text not null default 'texto'
    check (message_type in ('texto','imagen','audio','video','documento','ubicacion','sticker','plantilla','reaccion','otro')),
  body text,
  media jsonb not null default '[]'::jsonb,
  status text not null default 'recibido' check (status in ('recibido','enviado','entregado','leido','fallido')),
  sent_at timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now(),
  constraint crm_msg_direction_sender check (
    (direction = 'entrante' and sender_type = 'cliente') or
    (direction = 'saliente' and sender_type in ('vendedor','ia','sistema')))
);
-- Idempotencia: un mismo mensaje del canal nunca se guarda dos veces.
create unique index if not exists crm_messages_external_uniq on public.crm_messages (channel_code, external_message_id)
  where external_message_id is not null;
create index if not exists crm_messages_conv_idx on public.crm_messages (conversation_id, sent_at);

create table if not exists public.crm_status_history (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.crm_conversations(id),
  field text not null check (field in ('chat_status','sales_stage','order_status','postsale_status','priority','assigned_to','loss_reason')),
  old_value text,
  new_value text,
  changed_by uuid,
  changed_by_role text,
  reason text,
  changed_at timestamptz not null default now()
);
create index if not exists crm_status_history_conv_idx on public.crm_status_history (conversation_id, changed_at);

create table if not exists public.crm_tags (
  id bigint generated always as identity primary key,
  name text not null unique check (char_length(name) between 1 and 40),
  color text not null default '#D10B0C',
  created_at timestamptz not null default now()
);

create table if not exists public.crm_conversation_tags (
  conversation_id uuid not null references public.crm_conversations(id) on delete cascade,
  tag_id bigint not null references public.crm_tags(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  primary key (conversation_id, tag_id)
);

-- ---------------------------------------------------------------------
-- 5. Seguimientos, actividades
-- ---------------------------------------------------------------------
create table if not exists public.crm_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.crm_conversations(id),
  customer_id bigint references public.customers(id),
  task_type text not null references public.crm_task_types(code),
  title text not null check (char_length(title) between 2 and 200),
  description text,
  assigned_to uuid references public.crm_staff(user_id),
  due_at timestamptz not null,
  priority text not null default 'media' references public.crm_priorities(code),
  status text not null default 'pendiente' check (status in ('pendiente','en_curso','completada','cancelada')),
  result text,
  completed_at timestamptz,
  completed_by uuid,
  created_by uuid,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_task_target check (conversation_id is not null or customer_id is not null),
  constraint crm_task_completed_needs_result check (status <> 'completada' or (result is not null and completed_at is not null))
);
create index if not exists crm_tasks_open_idx on public.crm_follow_up_tasks (due_at) where status in ('pendiente','en_curso');
create index if not exists crm_tasks_conv_idx on public.crm_follow_up_tasks (conversation_id, status);
create index if not exists crm_tasks_assigned_idx on public.crm_follow_up_tasks (assigned_to, status, due_at);
create trigger crm_tasks_touch before update on public.crm_follow_up_tasks
  for each row execute function public.crm_touch_updated_at();

create table if not exists public.crm_activities (
  id bigint generated always as identity primary key,
  conversation_id uuid references public.crm_conversations(id),
  customer_id bigint references public.customers(id),
  actor_id uuid,
  activity_type text not null check (char_length(activity_type) <= 60),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_activities_conv_idx on public.crm_activities (conversation_id, created_at desc);
create index if not exists crm_activities_customer_idx on public.crm_activities (customer_id, created_at desc);

-- ---------------------------------------------------------------------
-- 6. Cotizaciones
-- ---------------------------------------------------------------------
create sequence if not exists public.crm_quotation_seq;

create table if not exists public.crm_quotations (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('COT-' || lpad(nextval('public.crm_quotation_seq')::text, 6, '0')),
  customer_id bigint references public.customers(id),
  conversation_id uuid references public.crm_conversations(id),
  customer_vehicle_id bigint references public.crm_customer_vehicles(id),
  vehicle_desc text,
  seller_id uuid references public.crm_staff(user_id),
  status text not null default 'borrador' references public.crm_quotation_statuses(code),
  valid_until date not null default (current_date + 7),
  apply_iva boolean not null default false,          -- false: precios ya son finales (IVA incluido)
  discount_total numeric(12,0) not null default 0 check (discount_total >= 0),
  items_discount numeric(12,0) not null default 0,
  subtotal numeric(12,0) not null default 0,
  iva numeric(12,0) not null default 0,
  total numeric(12,0) not null default 0,
  discount_approved_by uuid,
  discount_approved_at timestamptz,
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  converted_order_id bigint references public.orders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint crm_quote_target check (customer_id is not null or conversation_id is not null),
  constraint crm_quote_discount_authorized check (
    status not in ('enviada','vista','aceptada','convertida')
    or (discount_total = 0 and items_discount = 0) or discount_approved_by is not null),
  constraint crm_quote_converted_has_order check (status <> 'convertida' or converted_order_id is not null)
);
create index if not exists crm_quotations_conv_idx on public.crm_quotations (conversation_id);
create index if not exists crm_quotations_status_idx on public.crm_quotations (status, created_at desc);
create trigger crm_quotations_touch before update on public.crm_quotations
  for each row execute function public.crm_touch_updated_at();

create table if not exists public.crm_quotation_items (
  id bigint generated always as identity primary key,
  quotation_id uuid not null references public.crm_quotations(id) on delete cascade,
  product_id bigint references public.products(id),
  description text not null check (char_length(description) between 2 and 300),
  oem_code text,
  condition text not null check (condition in ('usado_original','nuevo')),
  unit_price numeric(12,0) not null check (unit_price >= 0),
  quantity int not null default 1 check (quantity > 0),
  discount numeric(12,0) not null default 0 check (discount >= 0),
  availability text not null default 'por_confirmar' check (availability in ('disponible','sin_stock','por_confirmar')),
  warranty text,
  line_total numeric(12,0) generated always as (greatest(unit_price * quantity - discount, 0)) stored,
  created_at timestamptz not null default now()
);
create index if not exists crm_quotation_items_q_idx on public.crm_quotation_items (quotation_id);

-- ---------------------------------------------------------------------
-- 7. Pedidos (reutiliza public.orders) y pagos
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists crm_conversation_id uuid references public.crm_conversations(id),
  add column if not exists crm_quotation_id uuid references public.crm_quotations(id),
  add column if not exists fulfillment_status text references public.crm_order_statuses(code);

alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add constraint orders_source_check check (source = any (array[
  'woocommerce','direct','whatsapp','phone','instagram','messenger','web','mercadolibre','presencial','tiktok','otro']));
create index if not exists orders_crm_conversation_idx on public.orders (crm_conversation_id);

-- shipping_tracking y returns apuntaban a orders_full (vacía y sin uso). Ambas tablas están vacías.
alter table public.shipping_tracking drop constraint if exists shipping_tracking_order_id_fkey;
alter table public.shipping_tracking add constraint shipping_tracking_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete cascade;
alter table public.returns drop constraint if exists returns_order_id_fkey;
alter table public.returns add constraint returns_order_id_fkey
  foreign key (order_id) references public.orders(id);

create table if not exists public.crm_payments (
  id uuid primary key default gen_random_uuid(),
  order_id bigint references public.orders(id),
  conversation_id uuid references public.crm_conversations(id),
  customer_id bigint references public.customers(id),
  amount numeric(12,0) not null check (amount > 0),
  method text not null check (method in ('transferencia','webpay','mercadopago','efectivo','western_union','link_pago','otro')),
  status text not null default 'en_revision' check (status in ('en_revision','confirmado','rechazado','reembolsado')),
  proof_url text,
  reference text,
  reported_at timestamptz not null default now(),
  confirmed_by uuid,
  confirmed_at timestamptz,
  confirmed_source text check (confirmed_source in ('humano','webpay','mercadopago')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint crm_payment_target check (order_id is not null or conversation_id is not null),
  constraint crm_payment_confirmed_authorized check (
    status <> 'confirmado' or (confirmed_at is not null and (
      (confirmed_source = 'humano' and confirmed_by is not null) or confirmed_source in ('webpay','mercadopago'))))
);
create index if not exists crm_payments_order_idx on public.crm_payments (order_id);
create index if not exists crm_payments_conv_idx on public.crm_payments (conversation_id);
create index if not exists crm_payments_review_idx on public.crm_payments (status) where status = 'en_revision';

-- ---------------------------------------------------------------------
-- 8. Postventa: garantías y reclamos (devoluciones reutilizan public.returns)
-- ---------------------------------------------------------------------
create table if not exists public.crm_warranties (
  id uuid primary key default gen_random_uuid(),
  order_id bigint references public.orders(id),
  conversation_id uuid references public.crm_conversations(id),
  customer_id bigint references public.customers(id),
  product_id bigint references public.products(id),
  description text not null,
  status text not null default 'solicitada' check (status in ('solicitada','en_evaluacion','aprobada','rechazada')),
  decided_by uuid,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  constraint crm_warranty_decision check (status not in ('aprobada','rechazada') or (decided_by is not null and decided_at is not null))
);

create table if not exists public.crm_complaints (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.crm_conversations(id),
  customer_id bigint references public.customers(id),
  order_id bigint references public.orders(id),
  category text not null default 'otro' check (category in ('producto','despacho','atencion','pago','garantia','otro')),
  description text not null,
  status text not null default 'recibido' check (status in ('recibido','en_revision','resuelto')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint crm_complaint_resolution check (status <> 'resuelto' or (resolution is not null and resolved_by is not null))
);

-- ---------------------------------------------------------------------
-- 9. IA (solo sugiere; nunca actúa sola)
-- ---------------------------------------------------------------------
create table if not exists public.crm_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.crm_conversations(id),
  last_message_id uuid references public.crm_messages(id),
  model text,
  intent text,
  vehicle jsonb not null default '{}'::jsonb,        -- {marca, modelo, anio, motor, patente}
  part_requested text,
  oem_codes text[] not null default '{}',
  compatibility_pending boolean,
  price_asked boolean,
  objection text,
  interest_level text check (interest_level in ('bajo','medio','alto')),
  conversion_probability numeric(4,3) check (conversion_probability between 0 and 1),
  recommended_action text,
  recommended_priority text references public.crm_priorities(code),
  needs_human boolean not null default false,
  churn_risk boolean not null default false,
  summary text,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_ai_analysis_conv_idx on public.crm_ai_analysis (conversation_id, created_at desc);

create table if not exists public.crm_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.crm_conversations(id),
  analysis_id uuid references public.crm_ai_analysis(id),
  suggestion_type text not null check (suggestion_type in ('respuesta','prioridad','etapa','tarea','recuperacion')),
  content text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'propuesta' check (status in ('propuesta','aprobada','editada','rechazada','enviada')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint crm_ai_suggestion_human check (status = 'propuesta' or (decided_by is not null and decided_at is not null))
);
create index if not exists crm_ai_suggestions_open_idx on public.crm_ai_suggestions (conversation_id) where status = 'propuesta';

-- ---------------------------------------------------------------------
-- 10. Alertas, automatizaciones, auditoría, notificaciones
-- ---------------------------------------------------------------------
create table if not exists public.crm_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null check (alert_type in (
    'chat_sin_responder','cliente_esperando','cotizacion_sin_seguimiento','cliente_no_responde',
    'pago_pendiente','pedido_atrasado','garantia_pendiente','seguimiento_vencido')),
  conversation_id uuid references public.crm_conversations(id),
  task_id uuid references public.crm_follow_up_tasks(id),
  order_id bigint references public.orders(id),
  assigned_to uuid references public.crm_staff(user_id),
  severity text not null default 'media' references public.crm_priorities(code),
  message text not null,
  status text not null default 'abierta' check (status in ('abierta','vista','resuelta')),
  dedupe_key text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index if not exists crm_alerts_open_dedupe on public.crm_alerts (dedupe_key) where status <> 'resuelta';
create index if not exists crm_alerts_assigned_idx on public.crm_alerts (assigned_to, status);

create table if not exists public.crm_automation_logs (
  id bigint generated always as identity primary key,
  workflow text not null,
  idempotency_key text,
  status text not null check (status in ('ok','error','omitido','reintento')),
  attempt int not null default 1,
  payload jsonb,
  error text,
  created_at timestamptz not null default now()
);
create unique index if not exists crm_automation_logs_idem on public.crm_automation_logs (workflow, idempotency_key)
  where idempotency_key is not null and status in ('ok','omitido');
create index if not exists crm_automation_logs_recent on public.crm_automation_logs (created_at desc);

create table if not exists public.crm_audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  actor_role text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists crm_audit_logs_record_idx on public.crm_audit_logs (table_name, record_id, created_at desc);

create table if not exists public.crm_notification_preferences (
  user_id uuid primary key references public.crm_staff(user_id) on delete cascade,
  channels text[] not null default '{whatsapp}',
  events text[] not null default '{chat_sin_responder,pago_pendiente,seguimiento_vencido}',
  quiet_hours jsonb not null default '{"desde":"20:00","hasta":"09:00"}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
