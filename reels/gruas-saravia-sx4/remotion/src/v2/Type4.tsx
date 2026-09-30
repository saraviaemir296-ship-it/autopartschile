import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';

export const MONT = "'Montserrat', sans-serif";

/**
 * Subtítulo V4: Montserrat ExtraBold en mayúsculas, palabra a palabra.
 * Las palabras clave van sobre un bloque rojo Saravia (se "pinta" de izquierda
 * a derecha). Una línea = una idea; máx. 5–6 palabras.
 */
export type W = {t: string; at: number; hi?: boolean};
/** Agrupa palabras resaltadas consecutivas en un solo bloque rojo. */
const groups = (words: W[]) => {
  const out: {hi: boolean; at: number; words: W[]}[] = [];
  for (const w of words) {
    const last = out[out.length - 1];
    if (last && !!w.hi === last.hi && w.hi) last.words.push(w);
    else out.push({hi: !!w.hi, at: w.at, words: [w]});
  }
  return out;
};
export const Caption4: React.FC<{words: W[]; dur: number; y?: number; size?: number}> = ({words, dur, y = 1180, size = 60}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 6, dur], [1, 0], cl);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 64,
        right: 64,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px 16px',
        fontFamily: MONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
        textTransform: 'uppercase',
        opacity: out,
      }}
    >
      {groups(words).map((g, gi) => {
        const paint = interpolate(f, [g.at, g.at + 8], [0, 1], {...cl, easing: E.out});
        return (
          <span
            key={gi}
            style={{
              position: 'relative',
              display: 'inline-flex',
              gap: '0 16px',
              isolation: 'isolate',
              padding: g.hi ? '2px 14px 4px' : 0,
            }}
          >
            {g.hi && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: K.red,
                  transformOrigin: 'left',
                  transform: `scaleX(${paint}) skewX(-8deg)`,
                  zIndex: -1,
                  boxShadow: '0 8px 24px rgba(209,11,12,0.35)',
                }}
              />
            )}
            {g.words.map((w, i) => {
              const p = spring({frame: f - w.at, fps: 30, config: {damping: 18, stiffness: 240, mass: 0.55}});
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    color: K.white,
                    opacity: f >= w.at ? Math.min(1, p * 1.6) : 0,
                    transform: `translateY(${(1 - p) * 22}px) scale(${0.94 + 0.06 * p})`,
                    textShadow: g.hi ? 'none' : '0 3px 0 rgba(0,0,0,0.35), 0 6px 24px rgba(0,0,0,0.65)',
                  }}
                >
                  {w.t}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

/** Titular V4: Montserrat Black itálica, con barrido de máscara (sensación de velocidad). */
export const Headline4: React.FC<{text: string; dur: number; y: number; size?: number; kicker?: string; align?: 'left' | 'center'}> = ({
  text,
  dur,
  y,
  size = 86,
  kicker,
  align = 'left',
}) => {
  const f = useCurrentFrame();
  const i = interpolate(f, [0, 14], [0, 1], {...cl, easing: E.out});
  const o = interpolate(f, [dur - 8, dur], [1, 0], {...cl, easing: E.in});
  const bar = interpolate(f, [4, 18], [0, 1], {...cl, easing: E.out});
  return (
    <div style={{position: 'absolute', top: y, left: 64, right: 64, textAlign: align, opacity: o}}>
      {kicker && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
            fontFamily: MONT,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '0.24em',
            color: K.white,
            opacity: bar,
          }}
        >
          <span style={{width: 40 * bar, height: 4, background: K.red, display: 'inline-block'}} />
          {kicker}
        </div>
      )}
      <div style={{overflow: 'hidden', paddingRight: 20}}>
        <div
          style={{
            fontFamily: MONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: size,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: K.white,
            whiteSpace: 'pre-line',
            transform: `translateX(${(1 - i) * -60}px)`,
            clipPath: `inset(0 ${(1 - i) * 100}% 0 0)`,
            textShadow: '0 6px 30px rgba(0,0,0,0.55)',
          }}
        >
          {text.split('+').map((part, k, arr) => (
            <React.Fragment key={k}>
              {part}
              {k < arr.length - 1 && <span style={{color: K.red}}>+</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
