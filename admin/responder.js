// Responder a clientes con botones (Tenemos / No tenemos / Faltan datos / Otro). Lo usan Hoy y el Centro de Mando.
// Reglas: nada sale sin que una persona toque "Enviar"; el precio solo lo fija o cambia Emir (el servidor lo exige).
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
const waLink = (tel, texto) => { let d = String(tel || '').replace(/\D/g, ''); if (!d) return null; if (!d.startsWith('56')) d = d.length === 9 ? '56' + d : d.length === 8 ? '569' + d : d; return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`; };
const CSS = `.card.rc,.rc{display:block;background:#fff !important;color:#111 !important;border:1px solid #e3e3e6;border-radius:14px;padding:.9rem 1rem;margin-bottom:.6rem;box-shadow:0 1px 4px rgba(0,0,0,.08)}.rc *{color:inherit}.rc a{color:#0b5bd3}.rc .hd{display:flex;gap:.5rem;align-items:baseline;flex-wrap:wrap}.rc .hd .t{font-weight:800;font-size:1.05rem;color:#111}.rc .tag{font-size:.75rem;background:#eee;color:#333 !important;border-radius:999px;padding:.1rem .5rem}
.rc .pide{margin:.3rem 0;font-size:.95rem;color:#444}.rc .pide b{color:#111;font-weight:800}.rc .ult{white-space:pre-wrap;font:inherit;font-size:.88rem;background:#fafafa;border-radius:10px;padding:.5rem .6rem;margin:.3rem 0;max-height:120px;overflow:auto;color:#333}
.rc .dec{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.4rem;margin:.5rem 0}.rc .dec button{border:2px solid #ddd;background:#fff;border-radius:12px;padding:.7rem .4rem;font-weight:800;font-size:.95rem;cursor:pointer;color:#111}
.rc .dec button.on{border-color:#d80002;background:#fff3f3}.rc .dec button.ok.on{border-color:#1f8f45;background:#eefbf2}
.rc .cand{display:flex;gap:.6rem;align-items:center;border:2px solid #e3e3e6;border-radius:12px;padding:.5rem .6rem;margin:.35rem 0;cursor:pointer;background:#fff}.rc .cand.on{border-color:#1f8f45;background:#eefbf2}
.rc .cand img{width:48px;height:48px;object-fit:cover;border-radius:8px;background:#eee;flex:none}.rc .cand .n{font-weight:700;font-size:.92rem;line-height:1.2}.rc .cand .s{color:#666;font-size:.8rem}.rc .cand .p{margin-left:auto;font-weight:800;white-space:nowrap}
.rc input[type=text],.rc input[type=number],.rc textarea{background:#fff;color:#111;width:100%;padding:.6rem .7rem;border:1px solid #ccc;border-radius:10px;font:inherit;font-size:.95rem;box-sizing:border-box}.rc textarea{min-height:150px;margin-top:.4rem}
.rc .row{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem}.rc .row .b{border:none;border-radius:10px;padding:.7rem .9rem;font-weight:800;font-size:.95rem;cursor:pointer;background:#eee;color:#111;text-decoration:none;text-align:center}
.rc .b.wa{background:#25D366;color:#fff}.rc .b.red{background:#d80002;color:#fff}.rc .b.ok{background:#1f8f45;color:#fff}.rc .b.gh{background:transparent;color:#666;text-decoration:underline}
.rc .warn{background:#fff6e5;border:1px solid #ffd28a;color:#7a4a00 !important;border-radius:10px;padding:.5rem .7rem;font-size:.88rem;margin-top:.4rem}.rc .precio{display:flex;gap:.5rem;align-items:center;margin-top:.5rem;font-size:.9rem}.rc .precio input{width:140px}
.rc .done{background:#eefbf2;color:#14532d !important;border-radius:10px;padding:.6rem .8rem;font-weight:700}.rc .b.wa,.rc .b.red,.rc .b.ok{color:#fff !important}.rc .dec button.ok.on{color:#14532d !important}`;

export async function montarResponder(cont, supabase, { toast = () => {}, onDone = () => {} } = {}) {
  if (!document.getElementById('rc-css')) { const s = document.createElement('style'); s.id = 'rc-css'; s.textContent = CSS; document.head.appendChild(s); }
  const { data, error } = await supabase.rpc('responder_pendientes');
  if (error) { cont.innerHTML = `<div class="empty">No pude cargar las respuestas: ${esc(error.message)}</div>`; return 0; }
  const L = data || [];
  cont.innerHTML = L.length ? L.map(card).join('') : '<div class="empty">Nadie espera respuesta ahora.</div>';
  const st = {}; // estado por tarea
  cont.onclick = async (e) => {
    const b = e.target.closest('[data-rc]'); if (!b) return;
    const el = b.closest('.rc'); const id = Number(el.dataset.t); const ctx = L.find((x) => x.tarea === id); const s = (st[id] = st[id] || { dec: null, pid: null, precio: null, cands: ctx.candidatos });
    const panel = el.querySelector('.panel'); const act = b.dataset.rc;
    try {
      if (act === 'dec') {
        s.dec = b.dataset.v; el.querySelectorAll('.dec button').forEach((x) => x.classList.toggle('on', x === b));
        if (s.dec === 'tenemos' || s.dec === 'en_conjunto') { panel.innerHTML = tenemos(ctx, s); return; }
        const { data: txt, error: e2 } = await supabase.rpc('responder_redactar', { p_tarea: id, p_decision: s.dec }); if (e2) throw e2;
        panel.innerHTML = redaccion(ctx, txt, s); return;
      }
      if (act === 'cand') { s.pid = Number(b.dataset.id); const c = s.cands.find((x) => x.id === s.pid); s.precio = c?.precio_estado === 'fijado' ? c.precio : null; panel.innerHTML = tenemos(ctx, s); return; }
      if (act === 'buscar') { const q = el.querySelector('input[data-q]').value.trim(); if (q.length < 3) { toast('Escribe al menos 3 letras'); return; } const { data: r, error: e3 } = await supabase.rpc('responder_buscar_stock', { p_q: q }); if (e3) throw e3; s.cands = [...(r || []), ...ctx.candidatos.filter((c) => !(r || []).some((x) => x.id === c.id))]; if (!(r || []).length) toast('Nada en stock con ese texto'); panel.innerHTML = tenemos(ctx, s); el.querySelector('input[data-q]').value = q; return; }
      if (act === 'armar') {
        if (!s.pid) { toast('Elige la pieza'); return; }
        const inp = el.querySelector('input[data-precio]'); const pr = inp && inp.value ? Number(inp.value) : null; const c = s.cands.find((x) => x.id === s.pid);
        if (!pr && c?.precio_estado !== 'fijado') { toast(ctx.es_admin ? 'Escribe el precio' : 'Esta pieza no tiene precio fijado: pídele a Emir que lo fije'); return; }
        s.precio = pr;
        const { data: txt, error: e4 } = await supabase.rpc('responder_redactar', { p_tarea: id, p_decision: s.dec, p_product_id: s.pid, p_precio: pr }); if (e4) throw e4;
        panel.innerHTML = redaccion(ctx, txt, s); return;
      }
      if (act === 'enviar' || act === 'copiar') {
        const texto = el.querySelector('textarea').value.trim(); if (texto.length < 5) { toast('El mensaje está vacío'); return; }
        if (act === 'copiar') { try { await navigator.clipboard.writeText(texto); toast('Mensaje copiado'); } catch { toast('No se pudo copiar'); } }
        b.disabled = true;
        const { data: r, error: e5 } = await supabase.rpc('responder_enviar', { p_tarea: id, p_decision: s.dec, p_texto: texto, p_product_id: (s.dec === 'tenemos' || s.dec === 'en_conjunto') ? s.pid : null, p_precio: (s.dec === 'tenemos' || s.dec === 'en_conjunto') ? s.precio : null });
        if (e5) { b.disabled = false; throw e5; }
        panel.innerHTML = listo(ctx, r); el.querySelector('.dec').remove(); toast(r.modo === 'whatsapp' ? 'Registrado. Abre WhatsApp y envíalo.' : r.modo === 'cola_meta' ? 'En cola: se envía solo cuando estén los tokens de Meta. Mientras, cópialo y pégalo en el inbox.' : 'Registrado. Copia el texto y envíalo.');
        onDone(id); return;
      }
      if (act === 'listo') { b.disabled = true; const { error: e6 } = await supabase.rpc('empleado_tarea_lista', { p_id: id }); if (e6) { b.disabled = false; throw e6; } el.remove(); toast('Listo'); onDone(id); return; }
    } catch (err) { toast('Error: ' + (err.message || err)); }
  };
  return L.length;
}

function datos(ctx) { const d = ctx.datos || {}; const p = []; if (d.anio) p.push('año ' + esc(d.anio)); if (d.patente) p.push('patente ' + esc(d.patente)); if (d.vin) p.push('VIN ' + esc(d.vin)); if (d.foto_url) p.push(`<a href="${esc(d.foto_url)}" target="_blank" rel="noopener">foto 📷</a>`); return p.join(' · '); }
function card(ctx) {
  const canal = { web: 'web', whatsapp: 'WhatsApp', messenger: 'Messenger', instagram: 'Instagram' }[ctx.canal] || ctx.canal;
  return `<div class="card rc" data-t="${ctx.tarea}"><div class="hd"><span class="t">${esc(ctx.cliente)}</span><span class="tag">${esc(canal)}</span>${ctx.telefono ? `<span class="tag">${esc(ctx.telefono)}</span>` : ''}</div>
  <div class="pide">Pide: <b>${esc(ctx.pieza || '(no dijo la pieza)')}</b>${ctx.vehiculo ? ` · para <b>${esc(ctx.vehiculo)}</b>` : ''}${datos(ctx) ? ' · ' + datos(ctx) : ''}</div>
  ${ctx.ultimo_mensaje ? `<div class="ult">${esc(ctx.ultimo_mensaje)}</div>` : ''}
  <div class="dec"><button class="ok" data-rc="dec" data-v="tenemos">✅ Tenemos</button><button data-rc="dec" data-v="no_tenemos">❌ No tenemos</button><button data-rc="dec" data-v="en_conjunto">🔩 Va en conjunto</button><button data-rc="dec" data-v="faltan_datos">❓ Faltan datos</button><button data-rc="dec" data-v="otro">✍️ Otro</button></div>
  <div class="panel"></div>
  <div class="row"><button class="b gh" data-rc="listo">Ya respondí por otro lado</button></div></div>`;
}
function tenemos(ctx, s) {
  const lista = s.cands.length ? s.cands.map((c) => `<div class="cand ${s.pid === c.id ? 'on' : ''}" data-rc="cand" data-id="${c.id}">${c.foto ? `<img src="${esc(abs(c.foto))}" alt="">` : '<img alt="">'}<div><div class="n">${esc(c.nombre)}</div><div class="s">${esc(c.sku)}${c.ubicacion ? ' · 📍 ' + esc(c.ubicacion) : ''}${c.electrica ? ' · eléctrica (sin garantía)' : ''}</div></div><div class="p">${c.precio_estado === 'fijado' ? clp(c.precio) : '<span style="color:#b45309">sin precio</span>'}</div></div>`).join('') : `<div class="warn">${s.dec === 'en_conjunto' ? 'Busca el conjunto que la incluye (ej. caja de cambios, culata, portamasa):' : 'La recepción no encontró esta pieza en el sistema. Búscala por nombre, SKU o N° de parte:'}</div>`;
  const c = s.cands.find((x) => x.id === s.pid);
  const precio = c ? `<div class="precio">Precio al cliente: <input type="number" data-precio min="1000" step="1000" value="${c.precio_estado === 'fijado' ? c.precio : ''}" ${ctx.es_admin ? '' : (c.precio_estado === 'fijado' ? 'readonly' : 'disabled')}>${!ctx.es_admin && c.precio_estado !== 'fijado' ? '<span style="color:#b45309">Emir debe fijarlo</span>' : ctx.es_admin ? '<span style="color:#666">puedes cambiarlo; queda fijado</span>' : ''}</div>` : '';
  return `${lista}<div class="row"><input type="text" data-q placeholder="Buscar otra pieza (nombre, SKU o N° de parte)" style="flex:1;min-width:200px"><button class="b" data-rc="buscar">Buscar</button></div>${precio}<div class="row"><button class="b red" data-rc="armar">Armar mensaje →</button></div>`;
}
function redaccion(ctx, txt, s) {
  const meta = ctx.canal === 'messenger' || ctx.canal === 'instagram';
  return `<textarea>${esc(txt)}</textarea><div class="row">${meta ? `<button class="b ok" data-rc="enviar">Dejar listo para enviar</button><button class="b" data-rc="copiar">Copiar y marcar enviado</button>` : ctx.telefono ? `<button class="b wa" data-rc="enviar">Enviar por WhatsApp ↗</button>` : `<button class="b ok" data-rc="copiar">Copiar y marcar enviado</button>`}</div>${meta ? '<div class="warn">Messenger/Instagram: hasta que estén los tokens de Meta, pega el texto en el inbox de la página. Cuando estén, se envía solo.</div>' : ''}`;
}
function listo(ctx, r) {
  return `<div class="done">Registrado ✓ ${r.modo === 'whatsapp' ? `<a class="b wa" style="display:inline-block;margin-left:.5rem" href="${esc(r.wa_link)}" target="_blank" rel="noopener">Abrir WhatsApp y enviar ↗</a>` : r.modo === 'cola_meta' ? `<a class="b" style="display:inline-block;margin-left:.5rem" href="${esc(r.enlace_externo)}" target="_blank" rel="noopener">Abrir inbox de Meta ↗</a>` : ''}</div><textarea readonly>${esc(r.texto)}</textarea>`;
}
const abs = (u) => (!u ? '' : /^https?:/.test(u) ? u : location.origin + (u.startsWith('/') ? '' : '/') + u);
