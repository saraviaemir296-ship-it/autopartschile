import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, F, SAFE, ease} from '../theme';
import {clamp} from '../anim';
import {LogoAnimation} from './LogoAnimation';

/**
 * Pantalla final. Jerarquía: logo → "Asistencia vehicular 24/7" → número
 * (lo más legible de la pantalla) → CTA "Guárdalo ahora." con subrayado rojo.
 * Tip: sugiere guardarlo como "Grúa": cuando alguien queda botado busca
 * "grúa" en sus contactos, no "Saravia".
 */
export const CTAFinal: React.FC<{phone?: string; saveAs?: string}> = ({
  phone = '+56 9 5381 7335',
  saveAs = 'Grúa Saravia',
}) => {
  const f = useCurrentFrame();
  const a = (d: number, len = 14) => interpolate(f, [d, d + len], [0, 1], {...clamp, easing: ease.out});
  const line = interpolate(f, [44, 60], [0, 1], {...clamp, easing: ease.out});
  return (
    <AbsoluteFill style={{backgroundColor: '#000', alignItems: 'center'}}>
      <AbsoluteFill style={{background: 'radial-gradient(70% 40% at 50% 42%, rgba(209,11,12,0.10), rgba(0,0,0,0) 70%)'}} />
      <div style={{position: 'absolute', top: SAFE.top + 170}}>
        <LogoAnimation width={900} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1010,
          left: SAFE.side,
          right: SAFE.side,
          textAlign: 'center',
        }}
      >
        <div style={{opacity: a(14), transform: `translateY(${(1 - a(14)) * 14}px)`, fontFamily: F.body, fontWeight: 500, fontSize: 40, color: C.mute, letterSpacing: '0.02em'}}>
          Asistencia vehicular 24/7
        </div>
        <div
          style={{
            opacity: a(22),
            transform: `translateY(${(1 - a(22)) * 16}px)`,
            marginTop: 26,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 84,
            color: C.white,
            letterSpacing: '0.01em',
          }}
        >
          {phone}
        </div>
        <div style={{marginTop: 54, display: 'inline-block', position: 'relative', opacity: a(36)}}>
          <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.white}}>Guárdalo ahora.</div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: -10, height: 6, background: C.red, transformOrigin: 'left', transform: `scaleX(${line})`, borderRadius: 3}} />
        </div>
        <div style={{marginTop: 34, opacity: a(56), fontFamily: F.body, fontSize: 30, color: C.mute}}>
          Guárdalo como <span style={{color: C.white, fontWeight: 600}}>“{saveAs}”</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
