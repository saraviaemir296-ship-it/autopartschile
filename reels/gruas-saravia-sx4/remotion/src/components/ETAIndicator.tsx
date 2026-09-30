import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F, ease} from '../theme';
import {clamp} from '../anim';

/**
 * Indicador de ETA. Por defecto muestra "ETA CALCULADA" (conceptual):
 * no tenemos la ETA real de este servicio y no hay que inventarla.
 * Si algún día grabas un servicio con ETA real de SALVI, pasa `minutes`.
 */
export const ETAIndicator: React.FC<{minutes?: number; delay?: number}> = ({minutes, delay = 0}) => {
  const frame = useCurrentFrame() - delay;
  const i = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease.out});
  const bar = interpolate(frame, [8, 60], [0, 1], {...clamp, easing: ease.inOut});
  return (
    <div
      style={{
        width: 330,
        padding: '22px 26px',
        borderRadius: 22,
        background: C.glass,
        border: `1px solid ${C.line}`,
        backdropFilter: 'blur(14px)',
        opacity: i,
        transform: `translateY(${(1 - i) * 16}px)`,
      }}
    >
      <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.16em', color: C.mute}}>ETA</div>
      <div style={{fontFamily: F.display, fontWeight: 800, fontSize: minutes ? 64 : 42, color: C.white, marginTop: 6, lineHeight: 1}}>
        {minutes ? `${minutes} min` : 'CALCULADA'}
      </div>
      <div style={{height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', marginTop: 18, overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${bar * 100}%`, background: C.red, borderRadius: 3}} />
      </div>
    </div>
  );
};
