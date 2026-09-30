import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F, ease} from '../theme';
import {clamp} from '../anim';

/**
 * Texto "integrado en la escena": un punto anclado a un elemento real del
 * plano (rueda, winche, plataforma), una línea guía que se dibuja y la etiqueta.
 * `drift` mueve el ancla igual que el zoom/pan del clip para que parezca trackeado.
 */
export const SceneCallout: React.FC<{
  text: string;
  anchor: [number, number];
  label: [number, number];
  duration: number;
  drift?: [number, number];
}> = ({text, anchor, label, duration, drift = [0, 0]}) => {
  const frame = useCurrentFrame();
  const t = frame / duration;
  const ax = anchor[0] + drift[0] * t;
  const ay = anchor[1] + drift[1] * t;
  const lx = label[0] + drift[0] * t;
  const ly = label[1] + drift[1] * t;
  const dot = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: ease.out});
  const line = interpolate(frame, [4, 16], [0, 1], {...clamp, easing: ease.out});
  const tag = interpolate(frame, [12, 24], [0, 1], {...clamp, easing: ease.out});
  const out = interpolate(frame, [duration - 8, duration], [1, 0], clamp);
  const len = Math.hypot(lx - ax, ly - ay);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <circle cx={ax} cy={ay} r={26 * dot} fill="none" stroke={C.white} strokeOpacity={0.5} strokeWidth={2} />
        <circle cx={ax} cy={ay} r={9 * dot} fill={C.red} />
        <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={C.white} strokeOpacity={0.8} strokeWidth={2} strokeDasharray={len} strokeDashoffset={len * (1 - line)} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: lx,
          top: ly,
          transform: 'translate(0, -50%)',
          maxWidth: 1080 - 72 - lx,
          opacity: tag,
          padding: '14px 22px',
          borderRadius: 14,
          background: C.glass,
          border: `1px solid ${C.line}`,
          backdropFilter: 'blur(12px)',
          fontFamily: F.body,
          fontWeight: 600,
          fontSize: 38,
          color: C.white,
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
