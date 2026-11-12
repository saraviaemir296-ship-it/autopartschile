select 'restos_selftest' chk, (select count(*) from crm_conversations)::text || ' convs / ' || (select count(*) from auth.users) || ' users' val
union all
select 'webpay_crea_cliente_tel_repetido', (with x as (select set_config('request.jwt.claims','{"role":"service_role"}',true)) select 'ok' from x);
set role service_role;
insert into public.customers (email, first_name, phone) values ('nuevo-correo@gmail.com','Emir','+56 9 5381 7335');
update public.orders set status='completed', total=total where id=1;
reset role;
select email, phone_e164, is_test from customers order by id;
select 'dup_view' chk, count(*) from crm_v_possible_duplicates;
set role anon;
select 'anon_ve_customers' chk, count(*) from customers;
select 'anon_ve_tasks' chk, count(*) from crm_follow_up_tasks;
reset role;
