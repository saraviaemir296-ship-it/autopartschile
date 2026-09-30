import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ease} from '../theme';
import {clamp} from '../anim';

/**
 * Entrada elegante del logo real (sin redibujarlo): revelado por máscara de
 * izquierda a derecha + escala 1.04→1 + un barrido de luz muy tenue.
 * El PNG tiene fondo negro: `mix-blend-mode: screen` lo vuelve transparente
 * sobre fondos oscuros, sin recortar el logo.
 */
export const LogoAnimation: React.FC<{width?: number; delay?: number}> = ({width = 900, delay = 0}) => {
  const f = useCurrentFrame() - delay;
  const reveal = interpolate(f, [0, 20], [0, 100], {...clamp, easing: ease.out});
  const scale = interpolate(f, [0, 40], [1.04, 1], {...clamp, easing: ease.out});
  const sweep = interpolate(f, [16, 40], [-30, 130], {...clamp, easing: ease.inOut});
  const drift = interpolate(f, [0, 90], [0, -6], clamp); // "pequeño movimiento"
  return (
    <div
      style={{
        position: 'relative',
        width,
        aspectRatio: '1774 / 887',
        transform: `translateY(${drift}px) scale(${scale})`,
        clipPath: `inset(0 ${100 - reveal}% 0 0)`,
        mixBlendMode: 'screen',
      }}
    >
      <Img src={staticFile('logo-gruas-saravia.png')} style={{width: '100%', height: '100%'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(100deg, transparent ${sweep - 12}%, rgba(255,255,255,0.22) ${sweep}%, transparent ${sweep + 12}%)`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
};
