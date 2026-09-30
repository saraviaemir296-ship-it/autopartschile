import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT} from './Type4';

const pop = (f: number, d: number) => spring({frame: f - d, fps: 30, config: {damping: 16, stiffness: 200, mass: 0.6}});
const fade = (f: number, d: number, len = 12) => interpolate(f, [d, d + len], [0, 1], {...cl, easing: E.out});

/* ---------- íconos simples (propios, no de marcas) ---------- */
const Ico: React.FC<{d: string; s?: number}> = ({d, s = 40}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d={d} fill={K.white} /></svg>
);
const I = {
  shield: 'M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z',
  wrench: 'M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  gear: 'M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11a2 2 0 0 1 2 2v5h-2v1.5a1.5 1.5 0 0 1-3 0V18H8v1.5a1.5 1.5 0 0 1-3 0V18H3v-5a2 2 0 0 1 2-2zm2.2 0h9.6l-1-3H8.2z',
  moto: 'M5 18.5A3.5 3.5 0 1 1 5 11.5a3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm14 2a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 6h3l2.4 5.6-1.8.8L16.8 11H15l-3 4H8.9a3.5 3.5 0 0 0-1.4-2.4L10 9h3.3L12.5 8H10V6h4z',
  box: 'M21 7.5 12 3 3 7.5v9L12 21l9-4.5v-9zM12 5.2 17.6 8 12 10.8 6.4 8 12 5.2zM5 9.6l6 3v6.2l-6-3V9.6zm8 9.2v-6.2l6-3v6.2l-6 3z',
  fork: 'M3 3h2v11h4V7h6l3 7h1v5h-2.3a2.5 2.5 0 0 1-4.9 0H8.2a2.5 2.5 0 0 1-4.9 0H3V3zm8 6v5h5.4l-2.1-5H11zM21 3v9h-2V3h2z',
};

/* ---------- CONFIANZA: +60 clientes frecuentes + convenios ---------- */
export const Trust: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const n = Math.round(interpolate(f, [4, 30], [0, 60], {...cl, easing: E.out}));
  const chips: [string, string][] = [
    [I.shield, 'Aseguradoras'],
    [I.wrench, 'Talleres'],
    [I.gear, 'Desarmadurías'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <div style={{position: 'absolute', top: 300, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: fade(f, 0)}}>
          <span style={{width: 44 * fade(f, 0), height: 4, background: K.red, display: 'inline-block'}} />
          CONFÍAN EN NOSOTROS
        </div>
        <div style={{marginTop: 10, fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 230, lineHeight: 1, color: K.white, letterSpacing: '-0.03em', textShadow: '0 8px 40px rgba(0,0,0,0.5)'}}>
          +{n}
        </div>
        <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 46, lineHeight: 1.1, textTransform: 'uppercase', color: K.white, opacity: fade(f, 10)}}>
          clientes frecuentes <span style={{background: K.red, padding: '0 10px'}}>al mes</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1010, left: 72, right: 150}}>
        <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.75)', opacity: fade(f, 22)}}>CONVENIOS CON</div>
        <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
          {chips.map(([d, label], i) => {
            const p = pop(f, 26 + i * 6);
            return (
              <div key={label} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '18px 26px', borderRadius: 18, background: 'rgba(8,8,8,0.7)', border: '1.5px solid rgba(255,255,255,0.16)', borderLeft: `6px solid ${K.red}`, backdropFilter: 'blur(10px)', opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -50}px)`}}>
                <Ico d={d} s={42} />
                <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 42, color: K.white}}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------- QUÉ TRASLADAMOS (va dentro de Cobertura) ---------- */
export const VehicleTypes: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const items: [string, string][] = [
    [I.car, 'Livianos'],
    [I.moto, 'Motos'],
    [I.fork, 'Yales'],
    [I.box, 'Repuestos grandes'],
  ];
  return (
    <div style={{position: 'absolute', top: 1320, left: 60, right: 140, display: 'flex', flexWrap: 'wrap', gap: 12}}>
      {items.map(([d, label], i) => {
        const p = pop(f, at + i * 5);
        return (
          <div key={label} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 99, background: 'rgba(8,8,8,0.75)', border: '1.5px solid rgba(255,255,255,0.2)', opacity: Math.min(1, p * 1.5), transform: `scale(${0.85 + 0.15 * p})`}}>
            <Ico d={d} s={32} />
            <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 30, color: K.white}}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- MEDIOS DE PAGO (va dentro de Tarifa) ---------- */
export const Payments: React.FC<{at: number; top?: number}> = ({at, top = 1230}) => {
  const f = useCurrentFrame();
  const a = fade(f, at, 10);
  const b = fade(f, at + 5, 10);
  const txt = (s: string) => (
    <div style={{height: 58, padding: '0 22px', borderRadius: 12, background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 28, color: '#fff'}}>{s}</div>
  );
  return (
    <div style={{position: 'absolute', top, left: 60, right: 140}}>
      <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.85)', marginBottom: 14, opacity: a}}>PAGA COMO QUIERAS</div>
      <div style={{display: 'flex', gap: 14, alignItems: 'stretch', opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>
        {/* logos oficiales entregados por Grúas Saravia */}
        <div style={{background: '#fff', borderRadius: 16, padding: '8px 12px', display: 'flex', alignItems: 'center'}}>
          <Img src={staticFile('pagos/webpay-plus.png')} style={{width: 372, display: 'block'}} />
        </div>
        <div style={{background: '#fff', borderRadius: 16, padding: '0 26px', display: 'flex', alignItems: 'center'}}>
          <Img src={staticFile('pagos/klap.png')} style={{width: 190, display: 'block'}} />
        </div>
      </div>
      <div style={{marginTop: 12, display: 'flex', gap: 12, opacity: b, transform: `translateY(${(1 - b) * 12}px)`}}>
        {txt('Transferencia')}
        {txt('Efectivo')}
      </div>
    </div>
  );
};

/* ---------- SELLO 24/7 (cierre) ---------- */
export const Seal247: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f - at, fps: 30, config: {damping: 10, stiffness: 170, mass: 0.7}});
  const rot = (f - at) * 0.8;
  const R = 92;
  const text = ' ATENCIÓN 24 HORAS · 7 DÍAS ·';
  return (
    <div style={{position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, opacity: Math.min(1, p * 2), transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -30}deg)`}}>
      <svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
        <defs>
          <path id="sealpath" d={`M ${R} ${R} m -${R - 18} 0 a ${R - 18} ${R - 18} 0 1 1 ${2 * (R - 18)} 0 a ${R - 18} ${R - 18} 0 1 1 -${2 * (R - 18)} 0`} />
        </defs>
        <circle cx={R} cy={R} r={R - 2} fill={K.red} />
        <circle cx={R} cy={R} r={R - 34} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
        <g transform={`rotate(${rot} ${R} ${R})`}>
          <text fill="#fff" style={{fontFamily: MONT, fontWeight: 800, fontSize: 15, letterSpacing: '0.12em'}}>
            <textPath href="#sealpath">{text}</textPath>
          </text>
        </g>
        <text x={R} y={R + 14} textAnchor="middle" fill="#fff" style={{fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 44}}>24/7</text>
      </svg>
    </div>
  );
};
