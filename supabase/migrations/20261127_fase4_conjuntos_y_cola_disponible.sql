-- PENDIENTE DE APLICAR (27-11-2026): Supabase pidió confirmación y nadie respondió.
-- 1) grupos_cola_siguiente: antes de entregar una publicación al agente de Chrome, salta las de piezas vendidas, sin stock o borradas
--    (hoy no lo revisa: una pieza vendida en caja se seguiría publicando en Facebook).
-- 2) Conjuntos: piezas que son la misma pieza física vendida de distintas formas (motor con/sin accesorios/block, ECU sola/kit,
--    llanta c/u / juego, cuna / tren delantero) o listadas dos veces. metadata.conjunto = clave común; al venderse una (o quedar sin
--    stock), las demás pasan a no_disponible (y el trigger de ML las pausa).
do $$ declare def text; ancla text := 'update grupos_cola set estado = ''pendiente'', tomado_at = null where estado = ''publicando'' and tomado_at < now() - interval ''20 minutes'';'; begin
  def := pg_get_functiondef('public.grupos_cola_siguiente()'::regprocedure);
  if position(ancla in def) = 0 then raise exception 'ancla no encontrada'; end if;
  def := replace(def, ancla, ancla || E'\n  -- 27-11: nunca entregar al agente una pieza vendida, sin stock o borrada\n  update grupos_cola gc set estado = ''salteado'', terminado_at = now(), detalle = ''Ya no está disponible (vendida o sin stock): no se publica'' from products pr where pr.id = gc.product_id and gc.estado = ''pendiente'' and (pr.deleted_at is not null or pr.part_status in (''vendida'',''no_disponible'') or coalesce(pr.stock, 0) <= 0);');
  execute def;
end $$;

create or replace function public.conjunto_no_disponible() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.metadata ? 'conjunto'
     and (new.part_status in ('vendida','no_disponible') or coalesce(new.stock, 0) <= 0)
     and not (old.part_status in ('vendida','no_disponible') or coalesce(old.stock, 0) <= 0) then
    update products set part_status = 'no_disponible', stock = 0,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('bloqueada_por_conjunto', new.sku, 'bloqueada_at', now())
     where metadata->>'conjunto' = new.metadata->>'conjunto' and id <> new.id and deleted_at is null
       and part_status not in ('vendida','no_disponible');
  end if;
  return null;
end $$;
drop trigger if exists trg_conjunto_no_disponible on public.products;
create trigger trg_conjunto_no_disponible after update of part_status, stock on public.products
for each row execute function public.conjunto_no_disponible();

-- Conjuntos detectados el 27-11 (mismo número de parte y mismo auto):
update products p set metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object('conjunto', x.c)
from (values ('SWK12M18-112','SWK12M18-motor-K12M'),('SWK12M18-100','SWK12M18-motor-K12M'),('SWK12M18-191','SWK12M18-motor-K12M'),
             ('CELK10-005','CEL1523-ecu-76M30'),('SUZ-CELERIO-K10B-ECU-BCM-76M30-76MN1','CEL1523-ecu-76M30'),
             ('SCR1721-058','SCR1721-llantas-aro16'),('SCR1721-059','SCR1721-llantas-aro16'),
             ('SWK12M18-003','SWK12M18-cuna-tren-del'),('SWK12M18-051','SWK12M18-cuna-tren-del'),
             ('SWGLX-002','SWI1723-ecu-chapa-83P20'),('KIT-ECU-CHAPA-SWIFT-K12M-83P20','SWI1723-ecu-chapa-83P20'),
             ('SWK12M18-070','SWK12M18-chapa-del-der'),('SWK12M18-075','SWK12M18-chapa-del-der')) x(sku, c)
where p.sku = x.sku and p.deleted_at is null;
