import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {E, INTER, K, cl} from './look';

/** ServiceCard: estado del servicio arriba (píldora) + "RUTA CALCULADA". */
export const ServiceCard: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 14], [0, 1], {...cl, easing: E.out});
  const b = interpolate(f, [10, 24], [0, 1], {...cl, easing: E.out});
  const o = interpolate(f, [dur - 10, dur], [1, 0], cl);
  const breathe = 0.55 + 0.45 * Math.sin(f / 5);
  return (
    <div style={{position: 'absolute', top: 300, left: 72, opacity: o, fontFamily: INTER}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, opacity: a, transform: `translateY(${(1 - a) * -10}px)`}}>
        <div style={{width: 12, height: 12, borderRadius: 99, background: K.red, boxShadow: `0 0 ${16 * breathe}px ${K.red}`}} />
        <div style={{fontSize: 26, fontWeight: 600, letterSpacing: '0.22em', color: K.white}}>SERVICIO EN CURSO</div>
      </div>
      <div style={{marginTop: 14, fontSize: 22, fontWeight: 500, letterSpacing: '0.22em', color: K.dim, opacity: b}}>RUTA CALCULADA</div>
    </div>
  );
};

/** StatusCard: tarjeta compacta del software de Grúas Saravia, 1,5–2 s. Sin datos inventados. */
export const StatusCard: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 200, stiffness: 150, mass: 0.8}});
  const o = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const rows = ['Vehículo localizado', 'Grúa asignada', 'Seguimiento activo'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        bottom: 470,
        width: 600,
        padding: '26px 30px 22px',
        borderRadius: 24,
        background: 'rgba(8,8,8,0.72)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)',
        fontFamily: INTER,
        opacity: Math.min(p, o),
        transform: `translateY(${(1 - p) * 40}px) scale(${0.97 + p * 0.03})`,
        transformOrigin: 'bottom left',
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, whiteSpace: 'nowrap'}}>
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', color: K.white}}>GRÚAS SARAVIA</div>
        <div style={{fontSize: 20, fontWeight: 500, letterSpacing: '0.2em', color: K.red}}>ASISTENCIA ACTIVA</div>
      </div>
      <div style={{height: 1, background: 'rgba(255,255,255,0.12)', margin: '18px 0 10px'}} />
      {rows.map((r, i) => {
        const d = 6 + i * 7;
        const k = spring({frame: f - d, fps: 30, config: {damping: 18, stiffness: 220, mass: 0.5}});
        return (
          <div key={r} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', opacity: interpolate(f, [d - 4, d + 2], [0.2, 1], cl)}}>
            <svg width="26" height="26" viewBox="0 0 26 26">
              <circle cx="13" cy="13" r="12" fill="none" stroke={K.red} strokeWidth="2" />
              <path d="M7.5 13.5l3.6 3.6 7.4-7.6" fill="none" stroke={K.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" strokeDashoffset={20 * (1 - Math.min(1, Math.max(0, k)))} />
            </svg>
            <div style={{fontSize: 30, fontWeight: 500, color: K.white}}>{r}</div>
          </div>
        );
      })}
    </div>
  );
};
