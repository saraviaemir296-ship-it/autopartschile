import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Seg, Shot} from './Shot';
import {E, INTER, K, cl} from './look';

/**
 * Persona real del equipo (retrato recortado) sobre la grúa real desenfocada.
 * Paralaje 2.5D: el fondo se desplaza y crece más lento que la persona,
 * así la foto fija gana profundidad sin deformar a nadie.
 */
export const PersonShot: React.FC<{
  person: string;
  dur: number;
  bgSrc: string;
  bgSegs: Seg[];
  /** ancho del retrato en px y posición vertical de su base */
  width?: number;
  bottom?: number;
  x?: number;
  label?: string;
}> = ({person, dur, bgSrc, bgSegs, width = 1180, bottom = -40, x = 0, label}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, dur], [0, 1], {...cl, easing: E.inOut});
  const enter = interpolate(f, [0, 10], [0, 1], {...cl, easing: E.out});
  const lab = interpolate(f, [8, 22, dur - 8, dur], [0, 1, 1, 0], {...cl, easing: E.out});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translateX(${-20 * k}px)`}}>
        <Shot src={bgSrc} segs={bgSegs} zoom={[1.18, 1.24]} blur={16} darken={0.5} />
      </AbsoluteFill>
      {/* luz de borde roja muy sutil detrás de la persona */}
      <AbsoluteFill style={{background: 'radial-gradient(45% 30% at 50% 45%, rgba(209,11,12,0.22), rgba(0,0,0,0) 70%)'}} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - width) / 2 + x + 26 * k,
          bottom,
          width,
          transformOrigin: '50% 30%',
          transform: `scale(${1.0 + 0.08 * k}) translateY(${(1 - enter) * 14}px)`,
          filter: 'contrast(1.06) saturate(0.9) brightness(0.96) drop-shadow(0 30px 60px rgba(0,0,0,0.55))',
        }}
      >
        <Img src={staticFile(person)} style={{width: '100%', display: 'block'}} />
      </div>
      {/* integra la base del retrato con el plano */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,8,8,0) 58%, rgba(8,8,8,0.85) 92%)'}} />
      {label && (
        <div style={{position: 'absolute', top: 300, left: 72, fontFamily: INTER, opacity: lab}}>
          <div style={{width: 48, height: 2, background: K.red, marginBottom: 16}} />
          <div style={{fontSize: 24, fontWeight: 600, letterSpacing: '0.26em', color: K.white}}>{label}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
