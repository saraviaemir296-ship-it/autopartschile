-- MERCADO LIBRE: ESTADO REAL
-- 28-11: APLICADA la parte 1 (crm_products_meli_sync: pausa siempre al vender). PENDIENTE la parte 2 (tabla meli_sync_req,
-- meli_estado_disparar/procesar y los 2 cron): Supabase pide confirmación de Emir para ese bloque.
-- Hallazgo 26-11: 2 piezas VENDIDAS seguían ACTIVAS en ML (puerta del. izq. Swift SWK12M18-150, espejo SWK12M18-071); ya pausadas a mano.
-- Causa: crm_products_meli_sync solo encolaba la pausa si el registro decía meli_status='active', y el registro estaba desactualizado
-- (30 de 33 "pausadas" estaban activas en ML).
-- 1) Al venderse o quedar sin stock, se pausa en ML SIEMPRE.
create or replace function public.crm_products_meli_sync() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.meli_item_id is not null
     and (new.part_status in ('vendida','no_disponible') or coalesce(new.stock, 1) <= 0 or not new.is_active)
     and not (old.part_status in ('vendida','no_disponible') or coalesce(old.stock, 1) <= 0 or not old.is_active) then
    perform public.crm_enqueue('meli_pausar', jsonb_build_object('item_id', new.meli_item_id, 'product_id', new.id, 'sku', new.sku, 'motivo', new.part_status),
                               'meli_pausar:' || new.meli_item_id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  end if;
  return null;
end $$;

-- 2) Estado real de cada publicación en ML, cada 6 horas.
create table if not exists public.meli_sync_req (req_id bigint primary key, item_id text not null, created_at timestamptz not null default now());
alter table public.meli_sync_req enable row level security;

create or replace function public.meli_estado_disparar() returns int language plpgsql security definer set search_path to 'public' as $$
declare tok text; n int := 0; r record;
begin
  delete from meli_sync_req where created_at < now() - interval '1 day';
  select access_token into tok from meli_account where id = 1 and expires_at > now();
  if tok is null then return 0; end if;
  for r in select distinct meli_item_id from products where deleted_at is null and meli_item_id is not null loop
    insert into meli_sync_req (req_id, item_id)
    values (net.http_get('https://api.mercadolibre.com/items/' || r.meli_item_id || '?attributes=id,status,sub_status',
                         headers := jsonb_build_object('Authorization', 'Bearer ' || tok)), r.meli_item_id);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.meli_estado_procesar() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n_upd int := 0; n_pausa int := 0; r record;
begin
  for r in select q.req_id, q.item_id, x.content::jsonb->>'status' st, x.content::jsonb->'sub_status' sub
             from meli_sync_req q join net._http_response x on x.id = q.req_id
            where x.status_code = 200 loop
    update products set meli_status = r.st,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('meli_status_verificado', now(), 'meli_sub_status', r.sub)
     where meli_item_id = r.item_id and meli_status is distinct from r.st;
    if found then n_upd := n_upd + 1; end if;
    if r.st = 'active' and exists (select 1 from products p where p.meli_item_id = r.item_id and p.deleted_at is null
                                    and (p.part_status in ('vendida','no_disponible') or coalesce(p.stock, 0) <= 0 or not p.is_active)) then
      perform public.crm_enqueue('meli_pausar', jsonb_build_object('item_id', r.item_id, 'motivo', 'sync: activa en ML y no disponible aquí'),
                                 'meli_pausar:' || r.item_id || ':' || to_char(now(), 'YYYYMMDD'));
      n_pausa := n_pausa + 1;
    end if;
  end loop;
  delete from meli_sync_req q using net._http_response x where x.id = q.req_id;
  return jsonb_build_object('actualizadas', n_upd, 'a_pausar', n_pausa);
end $$;

revoke all on function public.meli_estado_disparar() from public, anon, authenticated;
revoke all on function public.meli_estado_procesar() from public, anon, authenticated;

select cron.schedule('meli-estado-disparar-6h', '13 */6 * * *', 'select public.meli_estado_disparar()');
select cron.schedule('meli-estado-procesar-6h', '18 */6 * * *', 'select public.meli_estado_procesar()');
