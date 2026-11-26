-- FASE 1b — correcciones tras verificar la fase 1 con datos reales y los advisors de Supabase.
-- APLICADA PARCIALMENTE 26-nov-2026 (fase1b_correcciones_sin_drops): puntos 1, 2, 5, 6 y 7.
-- PENDIENTE (requiere confirmación de Emir en Supabase): puntos 3 (revoke) y 4 (drop policy *_service).
--
-- 1. publicaciones_validar: `text[] || 'texto'` se interpretaba como literal de arreglo
--    (el bloqueo funcionaba, pero el mensaje de error era "malformed array literal").
--    Ahora usa array_append y el error dice exactamente qué falta.
-- 2. search_path fijo en las 3 funciones de trigger sin SECURITY DEFINER.
-- 3. revoke execute a anon/authenticated en las 5 funciones de trigger (no son API).
-- 4. Se quitan las políticas *_service de las 3 tablas nuevas: service_role salta RLS
--    en Supabase, eran redundantes y duplicaban políticas permisivas.
-- 5. Índices parciales para las FK nuevas.
-- 6. 46 repuestos vivos sin precio quedaron 'fijado' por el default de la columna: pasan
--    a 'pendiente' (el trigger solo actúa en cambios).
-- 7. v_inventario_vehiculo gana `piezas_activas_web` (con stock Y publicadas), distinto
--    de `piezas_disponibles` (con stock, publicadas o no).

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
    if new.estado = 'aprobada' then new.aprobada_at := coalesce(new.aprobada_at, now()); new.aprobada_por := coalesce(new.aprobada_por, auth.uid()); end if;
    if new.estado = 'publicada' then new.publicada_at := coalesce(new.publicada_at, now()); end if;
  end if;
  if new.estado = 'despublicada' then new.despublicada_at := coalesce(new.despublicada_at, now()); end if;
  return new;
end $$;

alter function public.vehiculos_sync_en_desarme() set search_path = public;
alter function public.products_precio_guard() set search_path = public;
alter function public.agente_tareas_decidir() set search_path = public;

revoke execute on function public.publicaciones_validar() from public, anon, authenticated;
revoke execute on function public.products_marcar_despublicar() from public, anon, authenticated;
revoke execute on function public.vehiculos_sync_en_desarme() from public, anon, authenticated;
revoke execute on function public.products_precio_guard() from public, anon, authenticated;
revoke execute on function public.agente_tareas_decidir() from public, anon, authenticated;

drop policy if exists publicaciones_service   on public.publicaciones;
drop policy if exists red_solicitudes_service on public.red_solicitudes;
drop policy if exists agente_tareas_service   on public.agente_tareas;

create index if not exists agente_tareas_aprobado_por_idx      on public.agente_tareas (aprobado_por) where aprobado_por is not null;
create index if not exists publicaciones_aprobada_por_idx      on public.publicaciones (aprobada_por) where aprobada_por is not null;
create index if not exists red_solicitudes_conversation_idx    on public.red_solicitudes (conversation_id) where conversation_id is not null;
create index if not exists crm_conversations_red_solicitud_idx on public.crm_conversations (red_solicitud_id) where red_solicitud_id is not null;
create index if not exists oportunidades_vehiculo_idx          on public.oportunidades (vehiculo_id) where vehiculo_id is not null;
create index if not exists products_precio_fijado_por_idx      on public.products (precio_fijado_por) where precio_fijado_por is not null;

update public.products set precio_estado = 'pendiente'
 where deleted_at is null and (price_sale is null or price_sale <= 0) and precio_estado = 'fijado';

create or replace view public.v_inventario_vehiculo with (security_invoker = true) as
select v.id, v.codigo, v.marca, v.modelo, v.motor, v.anio_desde, v.anio_hasta, v.estado, v.ubicacion, v.fecha_ingreso, v.costo_compra,
       count(p.id) filter (where p.deleted_at is null) as piezas_total,
       count(p.id) filter (where p.deleted_at is null and p.part_status not in ('vendida','no_disponible') and coalesce(p.stock,0) > 0) as piezas_disponibles,
       count(p.id) filter (where p.deleted_at is null and p.is_active and coalesce(p.stock,0) > 0) as piezas_activas_web,
       count(p.id) filter (where p.deleted_at is null and p.part_status = 'vendida') as piezas_vendidas,
       count(p.id) filter (where p.deleted_at is null and p.precio_estado = 'pendiente') as piezas_precio_pendiente,
       coalesce(sum(p.price_sale) filter (where p.deleted_at is null and p.part_status not in ('vendida','no_disponible') and coalesce(p.stock,0) > 0), 0) as valor_stock_disponible,
       coalesce((select sum(oi.total_price) from order_items oi join orders o on o.id = oi.order_id join products px on px.id = oi.product_id where px.vehiculo_id = v.id and o.status = 'completed'), 0) as recuperado,
       case when v.costo_compra > 0 then round(100.0 * coalesce((select sum(oi.total_price) from order_items oi join orders o on o.id = oi.order_id join products px on px.id = oi.product_id where px.vehiculo_id = v.id and o.status = 'completed'), 0) / v.costo_compra, 1) end as pct_recuperado
from vehiculos v left join products p on p.vehiculo_id = v.id group by v.id;
