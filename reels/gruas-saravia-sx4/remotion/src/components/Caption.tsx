import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {C, F, FPS, SAFE, ease} from '../theme';
import {clamp} from '../anim';

export type Word = {t: string; at: number; hi?: boolean};
export type Line = {words: Word[]; start: number; end: number};

/**
 * Subtítulo dinámico: máx. 4–6 palabras por línea, palabra a palabra.
 * Palabras "hi" en rojo de marca + peso 800; el resto blanco 600.
 * `at`, `start` y `end` están en frames relativos a la secuencia; ajústalos
 * a tu voz real (en Remotion Studio se ve el waveform del audio).
 */
export const Caption: React.FC<{lines: Line[]; y?: number; size?: number}> = ({
  lines,
  y = 1180,
  size = 64,
}) => {
  const frame = useCurrentFrame();
  const line = lines.find((l) => frame >= l.start && frame < l.end);
  if (!line) return null;
  const out = interpolate(frame, [line.end - 5, line.end], [1, 0], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: y,
          left: SAFE.side,
          right: SAFE.side,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 0.28em',
          fontFamily: F.display,
          fontSize: size,
          lineHeight: 1.08,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          opacity: out,
          textShadow: '0 2px 18px rgba(0,0,0,0.55)',
        }}
      >
        {line.words.map((w, i) => {
          const p = spring({frame: frame - w.at, fps: FPS, config: {damping: 20, stiffness: 220, mass: 0.6}});
          const shown = frame >= w.at;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: w.hi ? C.red : C.white,
                fontWeight: w.hi ? 800 : 600,
                opacity: shown ? interpolate(p, [0, 0.4], [0, 1], clamp) : 0,
                transform: `translateY(${(1 - p) * 18}px) scale(${w.hi ? 0.92 + p * 0.08 : 1})`,
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Texto pequeño de apoyo (lower-third), p. ej. "Nos llamaron por un Suzuki SX4." */
export const Kicker: React.FC<{text: string; duration: number; y?: number; accent?: boolean}> = ({
  text,
  duration,
  y = 1300,
  accent = true,
}) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: ease.out});
  const o = interpolate(frame, [duration - 10, duration], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        top: y,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity: Math.min(i, o),
        transform: `translateX(${(1 - i) * -24}px)`,
      }}
    >
      {accent && <div style={{width: 6, height: 44, background: C.red, borderRadius: 2, transform: `scaleY(${i})`}} />}
      <div
        style={{
          fontFamily: F.body,
          fontWeight: 600,
          fontSize: 42,
          color: C.white,
          letterSpacing: '-0.01em',
          textShadow: '0 2px 14px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Titular limpio centrado: "RESCATE + TRASLADO SEGURO", "Sin complicaciones.", etc. */
export const Headline: React.FC<{
  text: string;
  duration: number;
  y?: number;
  size?: number;
  upper?: boolean;
  weight?: number;
  tracking?: string;
}> = ({text, duration, y = 1240, size = 70, upper = false, weight = 800, tracking = '-0.015em'}) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease.out});
  const o = interpolate(frame, [duration - 10, duration], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: SAFE.side,
        right: SAFE.side,
        textAlign: 'center',
        fontFamily: F.display,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking,
        textTransform: upper ? 'uppercase' : 'none',
        color: C.white,
        opacity: Math.min(i, o),
        transform: `translateY(${(1 - i) * 22}px)`,
        filter: `blur(${(1 - i) * 6}px)`,
        textShadow: '0 2px 22px rgba(0,0,0,0.55)',
      }}
    >
      {text.split('\n').map((row, r) => (
        <div key={r}>
          {row.split('+').map((part, k, arr) => (
            <React.Fragment key={k}>
              {part}
              {k < arr.length - 1 && <span style={{color: C.white, opacity: 0.55, fontWeight: 600}}>+</span>}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};
