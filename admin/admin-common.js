// Cliente Supabase compartido para /admin/. Usa la clave anon (pública por diseño);
// toda escritura real la autoriza Postgres via RLS + admins/is_admin(), nunca esta clave.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://zlyforhywunqhitrdreo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseWZvcmh5d3VucWhpdHJkcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDMyNzUsImV4cCI6MjA5NzM3OTI3NX0.jQs_DTUWevii5dxjFSHVcRGrtT0XnKfoLkkxB9BuJAw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redirige a /admin/login si no hay sesión o el usuario no está en la tabla admins.
// Devuelve la sesión si todo OK (para usarla en la página que llama a esto).
export async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = '/admin/login';
    return null;
  }
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (!adminRow) {
    await supabase.auth.signOut();
    location.href = '/admin/login?error=no_autorizado';
    return null;
  }
  return session;
}

export function money(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
}

export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
