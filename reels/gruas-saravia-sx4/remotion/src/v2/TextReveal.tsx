import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {E, INTER, K, cl} from './look';

/**
 * Texto editorial: entra desde una máscara (sube 100 % dentro de su línea),
 * con leve desenfoque → nítido. Sale con fundido. Nada gira, nada rebota.
 */
export const TextReveal: React.FC<{
  text: string;
  dur: number;
  x?: number;
  y: number;
  size?: number;
  weight?: number;
  upper?: boolean;
  tracking?: string;
  align?: 'left' | 'center';
  color?: string;
}> = ({text, dur, x = 72, y, size = 54, weight = 600, upper = false, tracking = '-0.02em', align = 'left', color = K.white}) => {
  const f = useCurrentFrame();
  const i = interpolate(f, [0, 16], [0, 1], {...cl, easing: E.out});
  const o = interpolate(f, [dur - 9, dur], [1, 0], {...cl, easing: E.in});
  const words = text.split('+');
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: align === 'center' ? 72 : x,
        right: align === 'center' ? 72 : undefined,
        textAlign: align,
        overflow: 'hidden',
        paddingBottom: 8,
        opacity: o,
      }}
    >
      <div
        style={{
          fontFamily: INTER,
          fontWeight: weight,
          fontSize: size,
          letterSpacing: tracking,
          lineHeight: 1.05,
          textTransform: upper ? 'uppercase' : 'none',
          color,
          transform: `translateY(${(1 - i) * 105}%)`,
          filter: `blur(${(1 - i) * 5}px)`,
          textShadow: '0 2px 24px rgba(0,0,0,0.45)',
          whiteSpace: 'pre',
        }}
      >
        {words.map((w, k) => (
          <React.Fragment key={k}>
            {w}
            {k < words.length - 1 && <span style={{color: K.white, opacity: 0.55, fontWeight: 400}}>+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/** Subtítulo mínimo (para voz en off): una línea, Inter 500, sin cajas. */
export const Sub: React.FC<{text: string; dur: number; y?: number}> = ({text, dur, y = 1330}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], cl);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 90,
        right: 90,
        textAlign: 'center',
        fontFamily: INTER,
        fontWeight: 500,
        fontSize: 44,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        color: K.white,
        opacity: a,
        textShadow: '0 2px 18px rgba(0,0,0,0.7)',
      }}
    >
      {text}
    </div>
  );
};
