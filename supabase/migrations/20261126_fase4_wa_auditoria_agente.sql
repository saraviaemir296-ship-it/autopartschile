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

-- 26-11 (2): TIEMPO REAL Y 2 MESES (aplicado vía MCP como migración wa_auditoria_tiempo_real)
-- wa_auditoria_chats + ultimo_mensaje_cliente, esperando. wa_auditoria_registrar guarda "ultimo_mensaje_cliente" y
--   "esperando_respuesta" (si no viene: true cuando categoria = lead_pendiente).
-- Trigger trg_wa_chat_a_responder (wa_chat_a_responder): chat esperando → mensaje entrante al CRM (sin avisos de webhook,
--   app.importando_historial) + tarjeta "Responder a clientes" en Hoy (agente recepcionista, accion responder_cliente,
--   origen auditoria_wa, candidatos de responder_buscar_stock). Una sola tarjeta por conversación.
--   Revisión posterior con esperando=false → la tarjeta se cierra sola (respondido desde el teléfono).
-- wa_auditoria_revisados() ahora devuelve ultima_revision y esperando (para el modo "cada hora" del agente).
-- Probado 26-11 en transacción revertida: 1 tarjeta, 5 candidatos, 1 mensaje, aparece en responder_pendientes, se cierra al re-revisar.
