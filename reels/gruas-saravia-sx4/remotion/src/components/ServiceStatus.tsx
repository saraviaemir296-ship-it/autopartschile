import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F, ease} from '../theme';
import {clamp} from '../anim';

/** Píldora "SERVICIO EN CURSO" con punto rojo que respira. */
export const ServiceStatus: React.FC<{label?: string; delay?: number}> = ({label = 'SERVICIO EN CURSO', delay = 0}) => {
  const frame = useCurrentFrame() - delay;
  const i = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: ease.out});
  const breathe = 0.55 + 0.45 * Math.sin(frame / 6);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 26px',
        borderRadius: 999,
        background: C.glass,
        border: `1px solid ${C.line}`,
        backdropFilter: 'blur(14px)',
        opacity: i,
        transform: `translateY(${(1 - i) * -16}px)`,
      }}
    >
      <div style={{width: 16, height: 16, borderRadius: 99, background: C.red, boxShadow: `0 0 ${14 * breathe}px ${C.red}`, opacity: 0.6 + 0.4 * breathe}} />
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: '0.14em', color: C.white}}>{label}</div>
    </div>
  );
};
