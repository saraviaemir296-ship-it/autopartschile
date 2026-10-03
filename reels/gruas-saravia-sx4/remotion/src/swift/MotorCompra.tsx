import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Cap, Clip, Photo, Punch} from './MotorSwiftUGC';

/* Reel "así fue la compra": solo el motor Swift vendido ($1.078.990, dato
   del dueño) y el proceso real — cotizó en autopartschile.cl, vino a
   verlo, lo compró en el local y se lo despachamos a su automotora.
   Nombre, WhatsApp, cara, patentes y automotora del cliente van ocultos.
   Efectos de sonido propios (sintetizados, sin derechos de terceros): el
   audio en tendencia se agrega en la app al publicar. */

const S = (f: string) => staticFile(f);
const TXT = "'Montserrat', 'Inter', sans-serif";
const RED = '#D10B0C';
const GREEN = '#25D366';
const PRICE = 1078990;
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');

const ORDER = [
  ['hook', 66],
  ['web', 126],
  ['vano', 54],
  ['pago', 60],
  ['carga', 36],
  ['entrega', 45],
  ['fin', 90],
] as const;
type Key = (typeof ORDER)[number][0];
const T = (() => {
  const o = {} as Record<Key, [number, number]>;
  let x = 0;
  for (const [k, d] of ORDER) {
    o[k] = [x, x + d];
    x += d;
  }
  return o;
})();
export const COMPRA_TOTAL = T.fin[1];
const at = (r: [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const COUNT_END = 16;

/* ---------- piezas ---------- */
const STEPS = ['Cotizó', 'Lo vio', 'Pagó', 'Despacho'];
const Steps: React.FC<{n: number; t: number}> = ({n, t}) => (
  <div style={{position: 'absolute', top: 44, left: 40, right: 40, display: 'flex', gap: 10}}>
    {STEPS.map((s, i) => {
      const on = i < n;
      const now = i === n - 1;
      return (
        <div key={s} style={{flex: 1, textAlign: 'center', fontFamily: TXT, fontWeight: 900, fontSize: 30, color: on ? '#fff' : 'rgba(255,255,255,0.55)', background: on ? (now ? RED : 'rgba(209,11,12,0.55)') : 'rgba(0,0,0,0.55)', borderRadius: 14, padding: '10px 0', transform: `scale(${now ? interpolate(t, [0, 4, 8], [1.25, 0.95, 1], cl) : 1})`}}>
          {on && !now ? '✓ ' : `${i + 1}. `}{s}
        </div>
      );
    })}
  </div>
);

const Confetti: React.FC<{t: number; x: number; y: number; n?: number}> = ({t, x, y, n = 70}) => {
  if (t < 0 || t > 50) return null;
  const cols = [RED, '#fff', GREEN, '#FFD400', '#1E90FF'];
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 7) * 0.3;
        const v = 18 + ((i * 37) % 17);
        const px = x + Math.cos(a) * v * t * 0.9;
        const py = y + Math.sin(a) * v * t * 0.9 - 0 + 0.9 * t * t;
        return (
          <div key={i} style={{position: 'absolute', left: px, top: py, width: 16, height: 24, background: cols[i % cols.length], transform: `rotate(${t * (12 + (i % 9) * 6)}deg)`, opacity: interpolate(t, [30, 50], [1, 0], cl), borderRadius: 3}} />
        );
      })}
    </>
  );
};

const Hidden: React.FC<{w: number}> = ({w}) => (
  <span style={{display: 'inline-block', width: w, height: 34, verticalAlign: 'middle', borderRadius: 6, background: 'repeating-linear-gradient(90deg, #1b1b1b 0 10px, #333 10px 20px)'}} />
);

/* ---------- 1. gancho ---------- */
const Hook: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Punch t={t} drift={0.06}><Clip src="swift/entrega_anon.mp4" from={0.3} vol={0.3} /></Punch>
    <AbsoluteFill style={{background: '#fff', opacity: interpolate(t, [COUNT_END - 1, COUNT_END, COUNT_END + 6], [0, 0.8, 0], cl), pointerEvents: 'none'}} />
    <Cap t={t + 8} y={520} lines={['Este cliente pagó']} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 618, display: 'flex', justifyContent: 'center', transform: `translateX(${t >= COUNT_END && t < COUNT_END + 8 ? Math.sin(t * 2.6) * (COUNT_END + 8 - t) * 2.2 : 0}px)`}}>
      <div style={{background: '#fff', color: t >= COUNT_END ? RED : '#111', fontFamily: TXT, fontWeight: 900, fontSize: 132, lineHeight: 1.05, padding: '4px 30px 10px', borderRadius: 18, fontVariantNumeric: 'tabular-nums', transform: `scale(${interpolate(t, [COUNT_END, COUNT_END + 4, COUNT_END + 8], [1.25, 0.95, 1], cl)}) rotate(-2deg)`}}>
        {clp(interpolate(t, [0, COUNT_END], [0, PRICE], {...cl, easing: (x) => 1 - Math.pow(1 - x, 2)}))}
      </div>
    </div>
    {t >= COUNT_END + 2 && <Cap t={t - COUNT_END - 2} y={812} lines={['por este motor Suzuki Swift']} size={50} />}
    {t >= 34 && <Cap t={t - 34} y={940} lines={['así fue la compra 👇']} size={56} dark />}
    <Confetti t={t - COUNT_END} x={540} y={700} n={50} />
    <div style={{position: 'absolute', top: 40, left: 36, width: 300, borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.45)'}}>
      <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
    </div>
  </AbsoluteFill>
);

/* ---------- 2. cotización en la web (grabación de pantalla) ---------- */
const QUERY = 'Motor Suzuki Swift 1.2';
const TYPE_AT = 10;
const CPF = 0.7; // caracteres por cuadro
const TYPE_END = TYPE_AT + Math.ceil(QUERY.length / CPF);
const NAME_AT = TYPE_END + 4;
const WA_AT = NAME_AT + 6;
const TAP = WA_AT + 10;
const SENT = TAP + 4;
const NOTIF = SENT + 16;
const KEYS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];

const Web: React.FC<{t: number}> = ({t}) => {
  const typed = QUERY.slice(0, Math.max(0, Math.floor((t - TYPE_AT) * CPF)));
  const lastCh = typed.slice(-1).toLowerCase();
  const typing = t >= TYPE_AT && t < TYPE_END;
  const sent = t >= SENT;
  const press = t >= TAP && t < SENT;
  const kb = interpolate(t, [TYPE_AT - 6, TYPE_AT, TAP - 2, TAP + 4], [0, 1, 1, 0], cl);
  const notif = interpolate(t, [NOTIF, NOTIF + 6], [0, 1], cl);
  const Field: React.FC<{label: string; children: React.ReactNode; active?: boolean; show?: number}> = ({label, children, active, show = 0}) => (
    <div style={{marginBottom: 26, opacity: t >= show ? 1 : 0.35}}>
      <div style={{fontSize: 26, fontWeight: 700, color: '#666', marginBottom: 8}}>{label}</div>
      <div style={{border: `3px solid ${active ? RED : '#ddd'}`, borderRadius: 16, padding: '16px 20px', fontSize: 36, fontWeight: 700, color: '#111', minHeight: 78, display: 'flex', alignItems: 'center'}}>{children}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill><Img src={S('swift/motor-vano.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.35)', transform: 'scale(1.2)'}} /></AbsoluteFill>
      {/* celular (grabación de pantalla) */}
      <div style={{position: 'absolute', left: 80, top: 150, width: 920, height: 1680, borderRadius: 60, overflow: 'hidden', background: '#fff', border: '8px solid #111', boxShadow: '0 30px 90px rgba(0,0,0,0.7)', fontFamily: TXT, transform: `translateY(${interpolate(t, [0, 8], [300, 0], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)})}px)`}}>
        {/* barra de safari */}
        <div style={{height: 120, background: '#f2f2f2', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 18}}>
          <div style={{background: '#e3e3e3', borderRadius: 14, padding: '10px 30px', fontSize: 30, fontWeight: 600, color: '#222'}}>🔒 autopartschile.cl</div>
        </div>
        <div style={{background: '#0A0A0A', padding: '22px 34px', borderBottom: `6px solid ${RED}`, fontFamily: "'Anton', sans-serif", fontSize: 50, color: '#fff'}}>
          AUTOPARTS<span style={{color: RED}}>CHILE</span>
        </div>
        <div style={{padding: '34px 40px'}}>
          <div style={{fontFamily: "'Anton', sans-serif", fontSize: 64, color: '#111', textTransform: 'uppercase', marginBottom: 26}}>Cotiza tu repuesto</div>
          <Field label="¿Qué repuesto buscas?" active={typing}>
            {typed}
            {t < TAP && <span style={{display: 'inline-block', width: 3, height: 40, background: RED, marginLeft: 3, opacity: Math.floor(t / 8) % 2 ? 1 : 0}} />}
          </Field>
          <Field label="Nombre" show={NAME_AT}>{t >= NAME_AT && <Hidden w={320} />}</Field>
          <Field label="WhatsApp" show={WA_AT}>{t >= WA_AT && <>+56 9&nbsp;<Hidden w={260} /></>}</Field>
          <div style={{marginTop: 10, background: sent ? GREEN : RED, color: '#fff', borderRadius: 18, padding: '26px 0', textAlign: 'center', fontSize: 40, fontWeight: 900, transform: `scale(${press ? 0.93 : sent ? interpolate(t, [SENT, SENT + 4, SENT + 8], [1.08, 0.98, 1], cl) : 1})`}}>
            {sent ? '✓ ¡Cotización enviada!' : 'Enviar cotización'}
          </div>
        </div>
        {/* teclado */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, background: '#d1d4da', padding: '22px 10px', transform: `translateY(${(1 - kb) * 600}px)`}}>
          {KEYS.map((row, r) => (
            <div key={r} style={{display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16}}>
              {row.split('').map((k) => {
                const hit = typing && lastCh === k;
                return (
                  <div key={k} style={{width: 78, height: 104, borderRadius: 12, background: hit ? '#9aa0a8' : '#fff', boxShadow: '0 2px 0 #8d9096', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 500, color: '#111', transform: hit ? 'translateY(-14px) scale(1.25)' : 'none'}}>
                    {k}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{display: 'flex', justifyContent: 'center', marginTop: 4}}>
            <div style={{width: 520, height: 100, borderRadius: 12, background: typing && lastCh === ' ' ? '#9aa0a8' : '#fff', boxShadow: '0 2px 0 #8d9096', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#555'}}>espacio</div>
          </div>
        </div>
        {/* notificación */}
        <div style={{position: 'absolute', left: 24, right: 24, top: 20, transform: `translateY(${(1 - notif) * -260}px)`, background: 'rgba(245,245,245,0.97)', borderRadius: 30, padding: '22px 26px', display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.3)'}}>
          <div style={{width: 84, height: 84, borderRadius: 20, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46}}>💬</div>
          <div>
            <div style={{fontSize: 26, color: '#777', fontWeight: 700}}>Desarmaduría Saravia · ahora</div>
            <div style={{fontSize: 34, fontWeight: 800, color: '#111'}}>Cotización recibida: motor Swift ✅</div>
          </div>
        </div>
      </div>
      {/* dedo que aprieta enviar */}
      {t >= TAP - 8 && t < SENT + 8 && (
        <div style={{position: 'absolute', left: 500, top: interpolate(t, [TAP - 8, TAP], [1750, 1105], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)}), width: 96, height: 96, borderRadius: 99, background: 'rgba(255,255,255,0.7)', border: '5px solid #fff', transform: `scale(${press ? 0.8 : 1})`, opacity: interpolate(t, [SENT, SENT + 8], [1, 0], cl)}} />
      )}
      <Confetti t={t - SENT} x={540} y={1150} />
      <Steps n={1} t={t} />
    </AbsoluteFill>
  );
};

/* ---------- composición ---------- */
export const MotorCompra: React.FC = () => {
  const f = useCurrentFrame();
  const l = (k: Key) => f - T[k][0];
  const w0 = T.web[0];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...at(T.hook)}><Hook t={l('hook')} /></Sequence>
      <Sequence {...at(T.web)}><Web t={l('web')} /></Sequence>

      <Sequence {...at(T.vano)}>
        <Punch t={l('vano')}><Photo src="swift/motor-vano.jpg" top={480} /></Punch>
        <Cap t={l('vano')} y={1260} lines={['Vino a verlo en persona 👀', 'Swift 1.2 K12MN · tapa de aluminio']} size={44} />
        <Steps n={2} t={l('vano')} />
      </Sequence>

      <Sequence {...at(T.pago)}>
        <Punch t={l('pago')} drift={0.02}><Clip src="swift/mostrador_anon.mp4" from={0.6} vol={0.4} /></Punch>
        {l('pago') >= 10 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}>
            <div style={{background: GREEN, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 78, padding: '8px 36px', borderRadius: 18, transform: `scale(${interpolate(l('pago'), [10, 14, 18], [1.6, 0.93, 1], cl)}) rotate(-3deg)`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>
              PAGADO ✅
            </div>
          </div>
        )}
        {l('pago') >= 18 && <Cap t={l('pago') - 18} y={1300} lines={[clp(PRICE) + ' en el local']} size={50} />}
        <Confetti t={l('pago') - 10} x={540} y={1200} n={50} />
        <Steps n={3} t={l('pago')} />
      </Sequence>

      <Sequence {...at(T.carga)}>
        <Punch t={l('carga')}><Clip src="swift/entrega_anon.mp4" from={2.0} vol={0.4} /></Punch>
        <Cap t={l('carga')} y={1150} lines={['Despacho a su automotora 🚚']} size={52} />
        <Steps n={4} t={l('carga')} />
      </Sequence>
      <Sequence {...at(T.entrega)}>
        <Punch t={l('entrega')}><Clip src="swift/entrega_anon.mp4" from={5.5} vol={0.4} /></Punch>
        {l('entrega') >= 4 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', justifyContent: 'center'}}>
            <div style={{background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 84, padding: '8px 36px', borderRadius: 18, transform: `scale(${interpolate(l('entrega'), [4, 8, 12], [1.6, 0.93, 1], cl)})`}}>
              ENTREGADO ✅
            </div>
          </div>
        )}
        <Confetti t={l('entrega') - 4} x={540} y={1150} />
        <Steps n={5} t={l('entrega')} />
      </Sequence>

      <Sequence {...at(T.fin)}>
        <Punch t={l('fin')} drift={0.04}>
          <AbsoluteFill><Img src={S('swift/motor-vano.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.4)', transform: 'scale(1.2)'}} /></AbsoluteFill>
        </Punch>
        <div style={{position: 'absolute', top: 160, left: 70, right: 70, borderRadius: 26, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', transform: `scale(${interpolate(l('fin'), [0, 5, 10], [1.25, 0.97, 1], cl)})`}}>
          <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
        </div>
        <Cap t={l('fin')} y={640} lines={['¿Buscas motor o repuestos', 'para tu Suzuki?']} size={58} />
        {l('fin') >= 14 && <Cap t={l('fin') - 14} y={900} lines={['Cotiza en autopartschile.cl']} size={54} />}
        {l('fin') >= 26 && <Cap t={l('fin') - 26} y={1020} lines={['o escribe SWIFT al WhatsApp 👇']} size={50} />}
        {l('fin') >= 38 && <Cap t={l('fin') - 38} y={1160} lines={['+56 9 5381 7335']} size={58} dark />}
        {l('fin') >= 46 && <Cap t={l('fin') - 46} y={1280} lines={['Despacho a todo Chile 📦']} size={42} dark />}
      </Sequence>

      {/* ---- sonido ---- */}
      <Audio src={S('audio/sfx_billcount.wav')} volume={0.9} />
      <Sequence from={COUNT_END - 2}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.75} /></Sequence>
      <Sequence from={COUNT_END}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={COUNT_END + 1}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.35} /></Sequence>
      <Sequence from={34}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
      {/* web */}
      <Sequence from={w0 - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      {Array.from({length: QUERY.length}, (_, i) => (
        <Sequence key={'k' + i} from={w0 + TYPE_AT + Math.floor(i / CPF)}><Audio src={S('audio/sfx_key.wav')} volume={0.45} /></Sequence>
      ))}
      <Sequence from={w0 + NAME_AT}><Audio src={S('audio/sfx_pop.wav')} volume={0.35} /></Sequence>
      <Sequence from={w0 + WA_AT}><Audio src={S('audio/sfx_pop.wav')} volume={0.35} /></Sequence>
      <Sequence from={w0 + TAP - 26}><Audio src={S('audio/sfx_riser.wav')} volume={0.35} /></Sequence>
      <Sequence from={w0 + TAP}><Audio src={S('audio/sfx_pop.wav')} volume={0.7} /></Sequence>
      <Sequence from={w0 + SENT}><Audio src={S('audio/sfx_correct.wav')} volume={0.45} /></Sequence>
      <Sequence from={w0 + SENT}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.4} /></Sequence>
      <Sequence from={w0 + NOTIF}><Audio src={S('audio/sfx_ding.wav')} volume={0.6} /></Sequence>
      {/* pasos */}
      <Sequence from={T.vano[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.vano[0] + 2}><Audio src={S('audio/sfx_pop.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.pago[0] - 18}><Audio src={S('audio/sfx_riser.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.pago[0] + 10}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.pago[0] + 12}><Audio src={S('audio/sfx_coins.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.carga[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.carga[0] + 4}><Audio src={S('audio/sfx_rev.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.entrega[0] + 4}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.entrega[0] + 5}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.entrega[0] + 6}><Audio src={S('audio/sfx_correct.wav')} volume={0.4} /></Sequence>
      {/* cierre */}
      <Sequence from={T.fin[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      {[14, 26].map((x) => (
        <Sequence key={'f' + x} from={T.fin[0] + x}><Audio src={S('audio/sfx_pop.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={T.fin[0] + 38}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
