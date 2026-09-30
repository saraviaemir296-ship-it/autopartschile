import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {E, INTER, K, cl} from './look';

/**
 * El software propio de Grúas Saravia: el teléfono con el flujo real
 * "Solicitar grúa → Calcular costo" (recorte de la imagen oficial), flotando
 * sobre su propio fondo desenfocado. Se excluyen a propósito el notebook y la
 * tarjeta de ejemplo ("8 min", conductor) para no presentar datos ficticios.
 * Fuente de 305×582 px: la escala se mantiene ≤ 1,75× para no pixelar.
 */
export const SoftwareShot: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, dur], [0, 1], {...cl, easing: E.inOut});
  const enter = interpolate(f, [0, 12], [0, 1], {...cl, easing: E.out});
  const lab = interpolate(f, [6, 20, dur - 8, dur], [0, 1, 1, 0], {...cl, easing: E.out});
  const phone = staticFile('equipo/software-telefono.jpg');
  const scene = staticFile('equipo/software-escena.jpg');
  const w = 305 * (1.62 + 0.13 * k);
  return (
    <AbsoluteFill style={{backgroundColor: K.black, opacity: enter}}>
      <AbsoluteFill style={{filter: 'blur(30px) brightness(0.32) saturate(0.8)', transform: `scale(${1.3 + 0.05 * k})`}}>
        <Img src={scene} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(40% 30% at 55% 55%, rgba(209,11,12,0.18), rgba(0,0,0,0) 70%)'}} />
      <div
        style={{
          position: 'absolute',
          left: 1080 / 2 - w / 2 + 40 - 20 * k,
          top: 1920 / 2 - (w * 582) / 305 / 2 + 110,
          width: w,
          transform: `translateY(${(1 - enter) * 30}px) rotate(${-1.2 + 1.2 * k}deg)`,
          filter: 'contrast(1.04) saturate(0.95)',
          WebkitMaskImage: 'radial-gradient(62% 58% at 50% 50%, #000 72%, transparent 100%)',
          maskImage: 'radial-gradient(62% 58% at 50% 50%, #000 72%, transparent 100%)',
        }}
      >
        <Img src={phone} style={{width: '100%', display: 'block'}} />
      </div>
      <div style={{position: 'absolute', top: 300, left: 72, fontFamily: INTER, opacity: lab, transform: `translateY(${(1 - lab) * 10}px)`}}>
        <div style={{width: 48, height: 2, background: K.red, marginBottom: 18}} />
        <div style={{fontSize: 48, fontWeight: 700, letterSpacing: '-0.01em', color: K.white}}>Software de IA</div>
        <div style={{marginTop: 8, fontSize: 24, fontWeight: 500, letterSpacing: '0.22em', color: K.dim}}>DESARROLLO PROPIO</div>
      </div>
    </AbsoluteFill>
  );
};
