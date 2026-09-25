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

// ---------------------------------------------------------------------------
// Toast y modal de confirmación reutilizables para toda /admin/.
// El CSS se inyecta una sola vez (el primer archivo que importe este módulo lo crea).
// ---------------------------------------------------------------------------
function injectAdminUiStyles() {
  if (document.getElementById('admin-ui-shared-styles')) return;
  var css =
    '.admin-toast-wrap{position:fixed;bottom:1.25rem;right:1.25rem;z-index:10000;display:flex;flex-direction:column;gap:.6rem;max-width:calc(100vw - 2.5rem)}' +
    '.admin-toast{background:#111;color:#fff;padding:.7rem 1rem;border-radius:10px;font-size:.88rem;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:.5rem;opacity:0;transform:translateY(8px);transition:all .2s}' +
    '.admin-toast.show{opacity:1;transform:translateY(0)}' +
    '.admin-toast.ok{background:#16a34a}' +
    '.admin-toast.err{background:#c0392b}' +
    '.admin-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}' +
    '.admin-modal{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:1.6rem;box-shadow:0 10px 40px rgba(0,0,0,.25)}' +
    '.admin-modal h3{font-size:1.05rem;font-weight:800;margin:0 0 .6rem;color:#111}' +
    '.admin-modal p.admin-modal-prod{font-weight:700;color:#111;margin:.2rem 0}' +
    '.admin-modal p.admin-modal-warn{font-size:.88rem;color:#666;margin:.4rem 0 1.2rem}' +
    '.admin-modal-actions{display:flex;gap:.6rem;justify-content:flex-end}' +
    '.admin-modal-actions button{border:none;border-radius:8px;padding:.65rem 1.1rem;font-weight:800;font-size:.88rem;cursor:pointer}' +
    '.admin-modal-cancel{background:#eee;color:#333}' +
    '.admin-modal-danger{background:#c0392b;color:#fff}' +
    '.admin-modal-primary{background:var(--red,#e2004f);color:#fff}';
  var style = document.createElement('style');
  style.id = 'admin-ui-shared-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

// toast('Producto eliminado correctamente.', 'ok' | 'err')
export function toast(message, type) {
  injectAdminUiStyles();
  type = type === 'err' ? 'err' : 'ok';
  var wrap = document.querySelector('.admin-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'admin-toast-wrap';
    document.body.appendChild(wrap);
  }
  var el = document.createElement('div');
  el.className = 'admin-toast ' + type;
  el.textContent = (type === 'ok' ? '✓ ' : '⚠ ') + message;
  wrap.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function(){ el.remove(); }, 200);
  }, 3500);
}

// confirmModal({ title, productName, warning, confirmText, cancelText, danger }) -> Promise<boolean>
export function confirmModal(opts) {
  opts = opts || {};
  injectAdminUiStyles();
  return new Promise(function(resolve) {
    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML =
      '<div class="admin-modal">' +
      '<h3>' + (opts.title || '¿Confirmar?') + '</h3>' +
      (opts.productName ? '<p class="admin-modal-prod">' + opts.productName + '</p>' : '') +
      (opts.warning ? '<p class="admin-modal-warn">' + opts.warning + '</p>' : '') +
      '<div class="admin-modal-actions">' +
      '<button type="button" class="admin-modal-cancel">' + (opts.cancelText || 'Cancelar') + '</button>' +
      '<button type="button" class="' + (opts.danger ? 'admin-modal-danger' : 'admin-modal-primary') + '">' + (opts.confirmText || 'Confirmar') + '</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    function close(val) { overlay.remove(); resolve(val); }
    overlay.querySelector('.admin-modal-cancel').addEventListener('click', function(){ close(false); });
    overlay.querySelector('.admin-modal-danger, .admin-modal-primary').addEventListener('click', function(){ close(true); });
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(false); });
  });
}
