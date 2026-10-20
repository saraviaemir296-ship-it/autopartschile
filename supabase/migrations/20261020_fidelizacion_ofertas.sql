-- Fidelización: "Hacer una oferta" por repuesto + ofertas exclusivas para socios.
-- Aplicar en Supabase (proyecto zlyforhywunqhitrdreo) antes de publicar js/apc-oferta.js.

-- 1) Ofertas que hacen los clientes por un repuesto
create table if not exists public.ofertas_clientes (
  id bigint generated always as identity primary key,
  sku text not null,
  product_name text,
  precio_publicado integer,
  monto integer not null check (monto > 0),
  nombre text not null check (char_length(nombre) between 2 and 100),
  telefono text not null check (char_length(telefono) between 8 and 30),
  email text check (email is null or char_length(email) <= 120),
  mensaje text check (mensaje is null or char_length(mensaje) <= 500),
  user_id uuid references auth.users(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aceptada','rechazada','contraoferta')),
  contraoferta integer check (contraoferta is null or contraoferta > 0),
  respuesta text check (respuesta is null or char_length(respuesta) <= 300),
  created_at timestamptz not null default now(),
  revisado_at timestamptz
);
create index if not exists ofertas_clientes_estado_idx on public.ofertas_clientes (estado, created_at desc);
create index if not exists ofertas_clientes_user_idx on public.ofertas_clientes (user_id);
alter table public.ofertas_clientes enable row level security;

-- Valida contra el producto real (activo; oferta entre 70% y menos del precio) y fija nombre/precio desde la BD.
create or replace function public.ofertas_clientes_validar() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; recientes int;
begin
  if tg_op = 'INSERT' then
    select name, price_sale, is_active, deleted_at into p from products where sku = new.sku limit 1;
    if not found or not p.is_active or p.deleted_at is not null then
      raise exception 'Este repuesto no está disponible para ofertas';
    end if;
    if p.price_sale is null or p.price_sale <= 0 then
      raise exception 'Este repuesto no tiene precio publicado';
    end if;
    if new.monto >= p.price_sale then
      raise exception 'La oferta debe ser menor al precio publicado';
    end if;
    if new.monto < ceil(p.price_sale * 0.7) then
      raise exception 'La oferta mínima es el 70%% del precio publicado';
    end if;
    select count(*) into recientes from ofertas_clientes
      where telefono = new.telefono and created_at > now() - interval '1 hour';
    if recientes >= 5 then
      raise exception 'Demasiadas ofertas seguidas. Inténtalo más tarde';
    end if;
    new.product_name := p.name;
    new.precio_publicado := round(p.price_sale);
    new.estado := 'pendiente';
    new.contraoferta := null; new.respuesta := null; new.revisado_at := null;
    new.created_at := now();
  elsif tg_op = 'UPDATE' then
    if new.estado <> old.estado then new.revisado_at := now(); end if;
  end if;
  return new;
end $$;
revoke all on function public.ofertas_clientes_validar() from public;
drop trigger if exists trg_ofertas_clientes_validar on public.ofertas_clientes;
create trigger trg_ofertas_clientes_validar before insert or update on public.ofertas_clientes
  for each row execute function public.ofertas_clientes_validar();

create policy ofertas_insert on public.ofertas_clientes for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy ofertas_ver_propias on public.ofertas_clientes for select to authenticated
  using (user_id = (select auth.uid()));
create policy ofertas_admin on public.ofertas_clientes for all to authenticated
  using (is_admin()) with check (is_admin());

-- 2) Ofertas exclusivas para socios (cuenta o Tarjeta Saravia aprobada)
create table if not exists public.ofertas_socios (
  id bigint generated always as identity primary key,
  sku text not null,
  precio_socio integer not null check (precio_socio > 0),
  nivel text not null default 'cuenta' check (nivel in ('cuenta','tarjeta')),
  nota text check (nota is null or char_length(nota) <= 200),
  activa boolean not null default true,
  hasta date,
  created_at timestamptz not null default now()
);
create index if not exists ofertas_socios_sku_idx on public.ofertas_socios (sku) where activa;
alter table public.ofertas_socios enable row level security;

create or replace function public.es_socio_tarjeta() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tarjeta_solicitudes
    where user_id = (select auth.uid()) and estado = 'aprobada' and codigo is not null);
$$;
revoke all on function public.es_socio_tarjeta() from public;
grant execute on function public.es_socio_tarjeta() to authenticated;

create policy socios_ver on public.ofertas_socios for select to authenticated
  using (activa and (hasta is null or hasta >= current_date)
         and (nivel = 'cuenta' or public.es_socio_tarjeta()));
create policy socios_admin on public.ofertas_socios for all to authenticated
  using (is_admin()) with check (is_admin());

-- Público: QUÉ repuestos tienen oferta de socio (sin el precio), para el aviso "🔒 Precio socio".
create or replace function public.ofertas_socios_skus()
returns table (sku text, nivel text)
language sql stable security definer set search_path = public as $$
  select distinct o.sku, o.nivel from ofertas_socios o
  where o.activa and (o.hasta is null or o.hasta >= current_date);
$$;
revoke all on function public.ofertas_socios_skus() from public;
grant execute on function public.ofertas_socios_skus() to anon, authenticated;
