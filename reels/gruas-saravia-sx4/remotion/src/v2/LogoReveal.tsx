import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT as INTER} from './Type4';

/**
 * Cierre de 2 s sobre la grúa desenfocada (no pantalla negra):
 * logo real con revelado por máscara + escala mínima, claim, número y CTA.
 */
export const LogoReveal: React.FC<{dur: number; phone?: string}> = ({dur, phone = '+56 9 5381 7335'}) => {
  const f = useCurrentFrame();
  const dim = interpolate(f, [0, 10], [0, 0.72], {...cl, easing: E.out});
  const rv = interpolate(f, [2, 18], [0, 100], {...cl, easing: E.out});
  const sc = interpolate(f, [0, dur], [1.03, 1], {...cl, easing: E.out});
  const a = (d: number) => interpolate(f, [d, d + 10], [0, 1], {...cl, easing: E.out});
  const line = interpolate(f, [26, 40], [0, 1], {...cl, easing: E.out});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(8,8,8,${dim})`}} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 470, width: 860, aspectRatio: '1774 / 887', clipPath: `inset(0 ${100 - rv}% 0 0)`, transform: `scale(${sc})`, mixBlendMode: 'screen'}}>
          <Img src={staticFile('logo-gruas-saravia.png')} style={{width: '100%', height: '100%'}} />
        </div>
        <div style={{position: 'absolute', top: 1000, left: 0, right: 0, textAlign: 'center', fontFamily: INTER, color: K.white}}>
          <div style={{fontSize: 30, fontWeight: 500, letterSpacing: '0.24em', color: K.dim, opacity: a(8)}}>ASISTENCIA VEHICULAR 24/7</div>
          <div style={{marginTop: 26, fontSize: 80, fontWeight: 600, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', opacity: a(12), transform: `translateY(${(1 - a(12)) * 12}px)`}}>{phone}</div>
          <div style={{marginTop: 14, fontSize: 30, fontWeight: 500, letterSpacing: '0.04em', color: K.dim, opacity: a(16)}}>gruasaravia.cl</div>
          <div style={{marginTop: 40, display: 'inline-block', position: 'relative', opacity: a(20)}}>
            <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '0.26em'}}>GUÁRDALO AHORA.</div>
            <div style={{position: 'absolute', left: 0, right: '0.26em', bottom: -14, height: 3, background: K.red, transformOrigin: 'left', transform: `scaleX(${line})`}} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
