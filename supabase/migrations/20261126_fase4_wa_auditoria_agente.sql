-- CLASIFICAR WHATSAPP CON EL AGENTE DE CHROME (aplicado en producción el 26-11-2026 vía MCP)
-- wa_auditoria_revisados() → chats ya clasificados en la auditoría en curso (para que el agente no repita y pueda seguir otro día).
-- Front: admin/wa-auditoria.html (instrucciones autocontenidas, importar líneas JSON con wa_auditoria_registrar, cerrar con wa_auditoria_cerrar).
create or replace function public.wa_auditoria_revisados()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare a wa_auditorias;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  select * into a from wa_auditorias where estado = 'en_curso' order by id desc limit 1;
  if a.id is null then return jsonb_build_object('auditoria', null, 'chats', '[]'::jsonb); end if;
  return jsonb_build_object('auditoria', a.id, 'iniciada_at', a.iniciada_at,
    'chats', coalesce((select jsonb_agg(jsonb_build_object('telefono', telefono, 'nombre', nombre, 'categoria', categoria, 'dudoso', dudoso) order by revisado_at desc)
                       from wa_auditoria_chats where auditoria_id = a.id), '[]'::jsonb));
end $$;
revoke all on function public.wa_auditoria_revisados() from public, anon;
grant execute on function public.wa_auditoria_revisados() to authenticated;
