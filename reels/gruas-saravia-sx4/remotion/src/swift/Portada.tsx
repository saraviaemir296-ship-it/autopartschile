import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GRADE} from './Fx';

/* Portadas (1080×1920) para "2 autos en 2 horas". Fotogramas reales de los
   clips; el texto queda dentro de la zona 1080×1350 que muestra la grilla. */
const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const DISP = "'Anton', sans-serif";
const box = (bg: string, size: number): React.CSSProperties => ({display: 'inline-block', background: bg, padding: '6px 28px 14px', fontFamily: DISP, fontSize: size, lineHeight: 1, color: '#fff', whiteSpace: 'nowrap'});
const Logo = () => <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 300, top: 300, width: 480, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.9))'}} />;

export const Portada: React.FC<{v: 'A' | 'B'}> = ({v}) => {
  if (v === 'A') {
    return (
      <AbsoluteFill style={{background: '#0A0A0A'}}>
        <Img src={S('swift/cover_jeep.png')} style={{position: 'absolute', left: -180, top: 0, width: 1440, height: 960, objectFit: 'cover', filter: GRADE}} />
        <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden'}}>
          <Img src={S('swift/cover_arriba.png')} style={{position: 'absolute', left: -60, top: -660, width: 1200, filter: GRADE}} />
        </div>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 950, height: 20, background: RED, boxShadow: `0 0 30px ${RED}`}} />
        <Logo />
        <div style={{position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center'}}><span style={box('#0A0A0A', 150)}>2 AUTOS</span></div>
        <div style={{position: 'absolute', top: 1000, left: 0, right: 0, textAlign: 'center'}}><span style={box(RED, 150)}>EN 2 HORAS</span></div>
        <div style={{position: 'absolute', top: 1500, left: 0, right: 0, textAlign: 'center'}}><span style={box('#0A0A0A', 60)}>JEEP + SUZUKI SX4</span></div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <Img src={S('swift/cover_foco.png')} style={{position: 'absolute', width: 1080, height: 1920, objectFit: 'cover', filter: GRADE, transform: 'scale(1.15)', transformOrigin: '50% 40%'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
      <Logo />
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center'}}><span style={box('#0A0A0A', 76)}>COMPRÉ 2 AUTOS EN 2 HORAS…</span></div>
      <div style={{position: 'absolute', top: 1320, left: 0, right: 0, textAlign: 'center'}}><span style={box(RED, 130)}>…Y TERMINÉ ASÍ</span></div>
    </AbsoluteFill>
  );
};
