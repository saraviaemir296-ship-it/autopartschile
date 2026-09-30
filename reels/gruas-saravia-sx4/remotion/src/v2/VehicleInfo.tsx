import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT as INTER} from './Type4';

/** Ficha editorial de automóvil: filete fino + 3 líneas. Arriba a la izquierda. */
export const VehicleInfo: React.FC<{dur: number; model?: string; service?: string; place?: string}> = ({
  dur,
  model = 'SUZUKI SX4',
  service = 'ASISTENCIA VEHICULAR',
  place = 'SANTIAGO, CHILE',
}) => {
  const f = useCurrentFrame();
  const line = interpolate(f, [0, 18], [0, 1], {...cl, easing: E.out});
  const a = (d: number) => interpolate(f, [d, d + 14], [0, 1], {...cl, easing: E.out});
  const o = interpolate(f, [dur - 10, dur], [1, 0], cl);
  return (
    <div style={{position: 'absolute', left: 72, top: 1190, opacity: o, fontFamily: INTER, color: K.white}}>
      <div style={{width: 64, height: 2, background: K.red, transformOrigin: 'left', transform: `scaleX(${line})`}} />
      <div style={{marginTop: 22, fontSize: 46, fontWeight: 700, letterSpacing: '0.02em', opacity: a(4), transform: `translateY(${(1 - a(4)) * 10}px)`}}>{model}</div>
      <div style={{marginTop: 8, fontSize: 24, fontWeight: 500, letterSpacing: '0.22em', color: K.dim, opacity: a(10)}}>{service}</div>
      <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 500, letterSpacing: '0.2em', color: K.dim, opacity: a(16)}}>
        <svg width="16" height="20" viewBox="0 0 16 20"><path d="M8 0C3.6 0 0 3.4 0 7.7 0 13.4 8 20 8 20s8-6.6 8-12.3C16 3.4 12.4 0 8 0zm0 10.5A2.8 2.8 0 1 1 8 4.9a2.8 2.8 0 0 1 0 5.6z" fill={K.red} /></svg>
        {place}
      </div>
    </div>
  );
};
