import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {C, F, FPS, ease} from '../theme';
import {clamp} from '../anim';

const STEPS = ['Vehículo localizado', 'Grúa asignada', 'Traslado en curso'];

/**
 * Tarjeta discreta tipo "bottom sheet". Tres estados que se marcan en cascada
 * (cada 9 frames) y un pie "SEGUIMIENTO ACTIVO". Sin datos inventados
 * (sin nombres, patentes, precios ni horas).
 */
export const SALVIInterface: React.FC<{duration: number; width?: number}> = ({duration, width = 760}) => {
  const frame = useCurrentFrame();
  const p = spring({frame, fps: FPS, config: {damping: 200, stiffness: 130, mass: 0.9}});
  const out = interpolate(frame, [duration - 10, duration], [1, 0], {...clamp, easing: ease.in});
  return (
    <div
      style={{
        width,
        borderRadius: 32,
        background: 'rgba(12,12,12,0.86)',
        border: `1px solid ${C.line}`,
        backdropFilter: 'blur(18px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        padding: '34px 40px 30px',
        opacity: Math.min(p, out),
        transform: `translateY(${(1 - p) * 60}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', color: C.white}}>
          SALVI <span style={{color: C.red}}>•</span> SERVICIO ACTIVO
        </div>
        <div style={{width: 12, height: 12, borderRadius: 99, background: C.red, opacity: 0.5 + 0.5 * Math.sin(frame / 5)}} />
      </div>
      <div style={{height: 1, background: C.line, margin: '24px 0 20px'}} />
      {STEPS.map((label, i) => {
        const d = 10 + i * 9;
        const k = spring({frame: frame - d, fps: FPS, config: {damping: 16, stiffness: 200, mass: 0.6}});
        const on = frame >= d;
        return (
          <div key={label} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '12px 0', opacity: interpolate(frame, [d - 6, d], [0.25, 1], clamp)}}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 99,
                border: `2px solid ${on ? C.red : 'rgba(255,255,255,0.3)'}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div style={{width: 14, height: 14, borderRadius: 99, background: C.red, transform: `scale(${on ? k : 0})`}} />
            </div>
            <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 36, color: C.white}}>{label}</div>
          </div>
        );
      })}
      <div style={{height: 1, background: C.line, margin: '20px 0 18px'}} />
      <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 22, letterSpacing: '0.2em', color: C.mute, opacity: interpolate(frame, [38, 50], [0, 1], clamp)}}>
        SEGUIMIENTO ACTIVO
      </div>
    </div>
  );
};
