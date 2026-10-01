import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {MONT} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {E, K, cl} from '../v2/look';

const sp = (f: number, d: number, damping = 14, stiffness = 210) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const fade = (f: number, d: number, len = 10) => interpolate(f, [d, d + len], [0, 1], {...cl, easing: E.out});
const INTERF = "'Inter', sans-serif";
const GREEN = '#22C55E';

const Check: React.FC<{s?: number; c?: string}> = ({s = 34, c = GREEN}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={c} /><path d="M6.8 12.6l3.4 3.4 7-7.2" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/** Dedo que toca: círculo + onda. */
const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  if (f < at - 8 || f > at + 18) return null;
  const ring = interpolate(f, [at, at + 16], [0, 1], cl);
  return (
    <div style={{position: 'absolute', left: x, top: y}}>
      <div style={{position: 'absolute', left: -36, top: -36, width: 72, height: 72, borderRadius: 99, background: 'rgba(255,255,255,0.6)', border: '3px solid #fff', opacity: f < at + 8 ? 1 : 1 - ring}} />
      <div style={{position: 'absolute', left: -36, top: -36, width: 72, height: 72, borderRadius: 99, border: `4px solid ${K.red}`, transform: `scale(${1 + ring * 1.8})`, opacity: f >= at ? 1 - ring : 0}} />
    </div>
  );
};

/* ============ YA DISPONIBLE + COTIZA (sobre la grabación del sitio) ============ */
export const AvailableLead: React.FC<{dur: number; tapAt?: number}> = ({dur, tapAt = 70}) => {
  const f = useCurrentFrame();
  const badge = sp(f, 4, 10, 230);
  const card = sp(f, 30, 16, 170);
  const pressed = f >= tapAt && f < tapAt + 6;
  const items = ['Repuestos originales con foto y precio', 'Con garantía', 'Despacho a todo Chile'];
  return (
    <AbsoluteFill>
      {/* insignia */}
      <div style={{position: 'absolute', top: 300, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', background: GREEN, color: '#fff', fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 66, padding: '14px 34px', borderRadius: 18, transform: `scale(${0.4 + 0.6 * badge}) rotate(-3deg)`, boxShadow: '0 16px 40px rgba(34,197,94,0.45)', display: 'flex', alignItems: 'center', gap: 16}}>
          <Check s={56} c="#15803D" /> YA DISPONIBLE
          {[[-28, -24], [520, -28], [-20, 74], [530, 70]].map(([x, y], i) => {
            const s = Math.max(0, Math.sin((f - i * 3) / 3)) * Math.min(1, f / 8);
            return <svg key={i} width="36" height="36" viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`}}><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="#FFD43B" /></svg>;
          })}
        </div>
      </div>
      {/* tarjeta de cotización */}
      <div style={{position: 'absolute', left: 50, right: 130, top: 1060, background: 'rgba(10,10,10,0.9)', borderRadius: 28, padding: '28px 30px', border: '1.5px solid rgba(255,255,255,0.15)', transform: `translateY(${(1 - card) * 300}px)`, opacity: Math.min(1, card * 2), boxShadow: '0 -10px 50px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 24, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)'}}>SUZUKI SX4 1.6 · 4X4 · AUTOMÁTICO</div>
        <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
          {items.map((it, i) => (
            <div key={it} style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 32, color: '#fff', opacity: fade(f, 38 + i * 6), transform: `translateX(${(1 - fade(f, 38 + i * 6)) * -30}px)`}}>
              <Check s={32} /> {it}
            </div>
          ))}
        </div>
        <div style={{marginTop: 22, height: 96, borderRadius: 20, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: MONT, fontWeight: 900, fontSize: 38, color: '#fff', transform: `scale(${pressed ? 0.95 : 1 + 0.03 * Math.sin(f / 4) * (f > 56 && f < tapAt ? 1 : 0)})`, boxShadow: '0 12px 30px rgba(37,211,102,0.4)', opacity: fade(f, 52)}}>
          <svg width="52" height="52" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 12.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.8 7.8 0 0 1-3.9-3.4c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5.1 5.1 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z" /></svg>
          Cotiza por WhatsApp
        </div>
      </div>
      <Tap x={470} y={1060 + 28 + 34 + 14 + 3 * 52 + 22 + 48} at={tapAt} />
      {/* mensaje que se envía tras el toque */}
      {f > tapAt + 6 && (
        <div style={{position: 'absolute', right: 140, top: 900, maxWidth: 640, background: '#005C4B', color: '#fff', fontFamily: INTERF, fontSize: 32, padding: '18px 22px', borderRadius: '22px 22px 6px 22px', transform: `scale(${sp(f, tapAt + 6, 13, 240)})`, transformOrigin: 'bottom right', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
          Hola, ¿tienen el radiador del SX4?
          <span style={{fontSize: 22, opacity: 0.7, marginLeft: 12}}>✓✓</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ============ COMPRA → PAGO → DESPACHO → CLIENTE FELIZ ============ */
const Phone: React.FC<{children: React.ReactNode; enter: number}> = ({children, enter}) => (
  <div style={{position: 'absolute', left: 190, top: 300, width: 620, height: 1180, borderRadius: 66, background: '#0E0E10', border: '10px solid #1C1C1F', overflow: 'hidden', boxShadow: '0 50px 110px rgba(0,0,0,0.6)', transform: `translateY(${(1 - enter) * 600}px)`}}>
    <div style={{height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 40px 0', fontFamily: INTERF, fontWeight: 600, fontSize: 22, color: '#fff'}}>
      <span>9:41</span><span style={{width: 140, height: 32, borderRadius: 20, background: '#000'}} /><span>● ●</span>
    </div>
    <div style={{margin: '6px 24px 0', height: 54, borderRadius: 14, background: '#2A2A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: INTERF, fontSize: 24, color: '#fff'}}>autopartschile.cl</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 140, bottom: 0, background: '#fff', borderRadius: '30px 30px 0 0', padding: '28px 28px'}}>{children}</div>
  </div>
);

/** Ilustración simple: cliente sonriendo con su caja. */
const HappyClient: React.FC<{p: number}> = ({p}) => (
  <svg width="300" height="300" viewBox="0 0 200 200" style={{transform: `scale(${p})`}}>
    <circle cx="100" cy="100" r="96" fill="#FEE2E2" />
    <rect x="52" y="122" width="96" height="78" rx="30" fill="#111" />
    <circle cx="100" cy="78" r="34" fill="#F2C5A0" />
    <path d="M66 70c2-26 66-30 68 0-8-10-20-14-34-14s-26 4-34 14z" fill="#1F1F1F" />
    <circle cx="88" cy="78" r="4" fill="#111" /><circle cx="112" cy="78" r="4" fill="#111" />
    <path d="M86 92c8 9 20 9 28 0" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="70" y="130" width="62" height="48" rx="6" fill="#C8955A" />
    <rect x="96" y="130" width="10" height="48" fill="#E6C08F" />
    <path d="M146 52l6-14M156 62l14-6M150 44l4 2" stroke={K.red} strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const OrderFlow: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const enter = sp(f, 0, 18, 150);
  const S1 = 0, PAY = 26, OK = 40, SHIP = 62, DONE = 96;
  const step = f < OK ? 0 : f < SHIP ? 1 : f < DONE ? 2 : 3;
  const shipT = interpolate(f, [SHIP + 4, DONE - 4], [0, 1], {...cl, easing: E.inOut});
  const labels = ['Pagas en línea', 'Pago aprobado', 'Te lo despachamos', '¡Repuesto recibido!'];
  return (
    <AbsoluteFill>
      {/* etiqueta del paso */}
      <div style={{position: 'absolute', top: 210, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
        <div key={step} style={{background: step === 3 ? GREEN : K.red, color: '#fff', fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 50, padding: '10px 28px', borderRadius: 14, transform: `scale(${sp(f, [S1, OK, SHIP, DONE][step], 11, 240)}) rotate(-2deg)`, textTransform: 'uppercase'}}>
          {step + 1}. {labels[step]}
        </div>
      </div>
      <Phone enter={enter}>
        {step === 0 && (
          <div style={{fontFamily: INTERF}}>
            <div style={{height: 330, borderRadius: 20, overflow: 'hidden', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="220" height="160" viewBox="0 0 220 160"><rect x="20" y="20" width="180" height="120" rx="10" fill="#cfd4da" /><g stroke="#9aa3ad" strokeWidth="5">{Array.from({length: 12}, (_, i) => <line key={i} x1={36 + i * 14} y1="30" x2={36 + i * 14} y2="130" />)}</g><rect x="0" y="60" width="26" height="22" rx="4" fill="#9aa3ad" /><rect x="194" y="60" width="26" height="22" rx="4" fill="#9aa3ad" /></svg>
            </div>
            <div style={{marginTop: 20, fontWeight: 800, fontSize: 34, color: '#111', lineHeight: 1.2}}>Radiador de calefacción Suzuki SX4 1.6 M16A</div>
            <div style={{marginTop: 10, fontWeight: 900, fontSize: 52, color: K.red}}>$94.990</div>
            <div style={{marginTop: 10, display: 'inline-block', background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: 22, padding: '6px 12px', borderRadius: 8}}>Disponible</div>
            <div style={{marginTop: 26, height: 88, borderRadius: 18, background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 32, transform: `scale(${f >= PAY && f < PAY + 5 ? 0.95 : 1})`}}>Pagar ahora</div>
            <div style={{marginTop: 14, height: 78, borderRadius: 18, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28}}>Consultar por WhatsApp</div>
          </div>
        )}
        {step === 1 && (
          <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: INTERF, gap: 18}}>
            <div style={{transform: `scale(${sp(f, OK, 9, 240)})`}}><Check s={200} /></div>
            <div style={{fontWeight: 900, fontSize: 48, color: '#111'}}>Pago aprobado</div>
            <div style={{fontWeight: 700, fontSize: 34, color: '#555'}}>$94.990 · Webpay</div>
          </div>
        )}
        {step === 2 && (
          <div style={{height: '100%', position: 'relative', fontFamily: INTERF}}>
            <div style={{fontWeight: 900, fontSize: 40, color: '#111'}}>Tu pedido va en camino</div>
            <svg width="540" height="700" viewBox="0 0 540 700" style={{position: 'absolute', left: 0, top: 80}}>
              <path d="M90 620 C 140 480, 420 520, 400 360 S 160 220, 300 90" fill="none" stroke="#e5e5e5" strokeWidth="16" strokeLinecap="round" />
              <path d="M90 620 C 140 480, 420 520, 400 360 S 160 220, 300 90" fill="none" stroke={K.red} strokeWidth="16" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 * (1 - shipT)} />
              <circle cx="90" cy="620" r="22" fill="#111" /><text x="122" y="630" fontSize="28" fontWeight="700" fill="#111">Desarmaduría Saravia</text>
              <circle cx="300" cy="90" r="22" fill={K.red} /><text x="200" y="50" fontSize="28" fontWeight="700" fill="#111">Tu casa</text>
            </svg>
            {(() => {
              // caja que viaja (aproximación por puntos de la curva)
              const pts = [[90, 620], [180, 520], [330, 470], [400, 360], [300, 250], [250, 160], [300, 90]];
              const k = shipT * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(k)); const r = k - i;
              const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r; const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r;
              return (
                <div style={{position: 'absolute', left: x - 42, top: 80 + y - 42, width: 84, height: 84, borderRadius: 20, background: '#C8955A', border: '4px solid #fff', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: 14, height: '100%', background: '#E6C08F'}} />
                </div>
              );
            })()}
          </div>
        )}
        {step === 3 && (
          <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: INTERF, gap: 18}}>
            <HappyClient p={sp(f, DONE, 11, 200)} />
            <div style={{fontWeight: 900, fontSize: 48, color: '#111', opacity: fade(f, DONE + 6)}}>¡Llegó mi repuesto!</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 30, color: '#15803D', opacity: fade(f, DONE + 12)}}><Check s={34} /> Entregado</div>
          </div>
        )}
      </Phone>
      <Tap x={500} y={300 + 140 + 28 + 330 + 20 + 84 + 62 + 40 + 26 + 44} at={PAY} />
    </AbsoluteFill>
  );
};

/* ============ CIERRE DESARMADURÍA ============ */
export const DesarmeCTA: React.FC<{dur: number; head?: number; items?: number[]; url?: number; phone?: number}> = ({dur, head = 12, items: itemAt = [26, 33, 40, 47, 54], url = 60, phone = 70}) => {
  const f = useCurrentFrame();
  const lp = sp(f, 0, 14, 160);
  const items = ['En cualquier estado', 'De cualquier marca', 'Pago al contado', 'Retiro con grúa propia', 'Aunque tenga deudas de TAG o multas'];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(8,8,8,0.78)'}} />
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: '#fff', borderRadius: 26, padding: '14px 30px', transform: `scale(${0.8 + 0.2 * lp})`, opacity: Math.min(1, lp * 2)}}>
          <Img src={staticFile('compra/logo-desarmaduria.svg')} style={{height: 190, display: 'block'}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 560, left: 64, right: 140, fontFamily: MONT, color: '#fff'}}>
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)', opacity: fade(f, 8)}}>¿TIENES UN AUTO PARA DESARME?</div>
        <div style={{marginTop: 8, fontSize: 82, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.98, clipPath: `inset(0 ${(1 - fade(f, head, 14)) * 100}% 0 0)`}}>
          Te lo <span style={{background: K.red, padding: '0 12px'}}>compramos</span>
        </div>
        <div style={{marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14}}>
          {items.map((it, i) => (
            <div key={it} style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 38, fontWeight: 800, opacity: fade(f, itemAt[i]), transform: `translateX(${(1 - fade(f, itemAt[i])) * -40}px)`}}>
              <Check s={42} /> {it}
            </div>
          ))}
        </div>
        <div style={{marginTop: 34, padding: '18px 22px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', opacity: fade(f, url), fontSize: 30, fontWeight: 700}}>
          Repuestos con despacho a todo Chile · <span style={{color: '#fff', fontWeight: 900}}>autopartschile.cl</span>
        </div>
        <div style={{marginTop: 28, display: 'flex', alignItems: 'center', gap: 18, fontSize: 66, fontWeight: 900, opacity: fade(f, phone), transform: `scale(${0.9 + 0.1 * fade(f, phone)})`, transformOrigin: 'left'}}>
          <Wa s={68} /> +56 9 5381 7335
        </div>
      </div>
    </AbsoluteFill>
  );
};
