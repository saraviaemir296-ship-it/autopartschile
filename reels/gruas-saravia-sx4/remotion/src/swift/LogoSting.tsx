import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Cierre de marca animado (2 s). Piezas recortadas del logo oficial en alta
   (public/marca/anim, fondo blanco convertido a transparencia): cada parte
   entra por separado — franjas de esquina, AutopartsChile, DESARMADURÍA,
   SARAVIA, línea roja desde el centro, bajada, fila de marcas — y después
   WhatsApp + web. Se usa dentro de un <Sequence>: el frame es local. */

export const STING_LEN = 60;
const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const p = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...cl, easing: OUT});

const Stripes: React.FC<{k: number}> = ({k}) => {
  const d = (1 - k) * 420;
  const band = (a: number, b: number) => `0,${a} ${a},0 ${b},0 0,${b}`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${-d} ${-d})`}>
        <polygon points={band(250, 330)} fill="#0A0A0A" />
        <polygon points={band(345, 390)} fill={RED} />
      </g>
      <g transform={`translate(${1080 + d} ${1920 + d}) rotate(180)`}>
        <polygon points={band(250, 330)} fill="#0A0A0A" />
        <polygon points={band(345, 390)} fill={RED} />
      </g>
    </svg>
  );
};

export const LogoSting: React.FC = () => {
  const t = useCurrentFrame();
  const apc = p(t, 2, 12);
  const div = p(t, 9, 17);
  const des = p(t, 12, 20);
  const sar = p(t, 14, 22);
  const lin = p(t, 20, 28);
  const tag = p(t, 24, 31);
  const mar = p(t, 27, 36);
  const sw = interpolate(t, [30, 46], [-30, 130], cl);
  const pop = (d: number) => spring({frame: t - d, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}});
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <Stripes k={p(t, 0, 9)} />
      {/* AutopartsChile: barrido de izquierda a derecha, como el trazo de la A */}
      <Img src={S('marca/anim/apc.png')} style={{position: 'absolute', left: 240, top: 230, width: 600, clipPath: `inset(0 ${(1 - apc) * 100}% 0 0)`, transform: `translateX(${(1 - apc) * -90}px)`}} />
      <div style={{position: 'absolute', left: 540 - 260 * div, top: 660, width: 520 * div, height: 4, background: '#0A0A0A'}} />
      {/* DESARMADURÍA: se cierra el tracking */}
      <Img src={S('marca/anim/desarm.png')} style={{position: 'absolute', left: 220, top: 715, width: 640, opacity: des, transform: `scaleX(${1.35 - 0.35 * des})`}} />
      {/* SARAVIA: sube desde una máscara con un pequeño golpe */}
      <div style={{position: 'absolute', left: 90, top: 805, width: 900, height: 190, overflow: 'hidden'}}>
        <Img src={S('marca/anim/saravia.png')} style={{width: 900, transform: `translateY(${(1 - sar) * 105}%) scale(${t >= 22 ? interpolate(t, [22, 25, 30], [1.06, 0.99, 1], cl) : 1})`}} />
      </div>
      {/* línea roja que se abre desde el centro */}
      <Img src={S('marca/anim/linea.png')} style={{position: 'absolute', left: 90, top: 1010, width: 900, clipPath: `inset(0 ${(1 - lin) * 50}% 0 ${(1 - lin) * 50}%)`}} />
      <Img src={S('marca/anim/tagline.png')} style={{position: 'absolute', left: 120, top: 1065, width: 840, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)`}} />
      <Img src={S('marca/anim/marcas.png')} style={{position: 'absolute', left: 160, top: 1175, width: 760, clipPath: `inset(0 ${(1 - mar) * 100}% 0 0)`}} />
      {/* barrido de luz sobre toda la marca */}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sw - 9}%, rgba(255,255,255,0.8) ${sw}%, transparent ${sw + 9}%)`}} />
      {t >= 36 && <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 180, top: 1350, width: 720, transform: `scale(${pop(36)})`}} />}
      {t >= 40 && <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 140, top: 1460, width: 800, transform: `scale(${pop(40)})`}} />}
      <Sequence from={0} durationInFrames={25}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={14} durationInFrames={30}><Audio src={S('audio/sfx_impact_soft.wav')} volume={(x) => 0.5 * interpolate(x, [24, 30], [1, 0], cl)} /></Sequence>
      <Sequence from={27} durationInFrames={10}><Audio src={S('audio/sfx_click.wav')} volume={0.5} /></Sequence>
      <Sequence from={36} durationInFrames={20}><Audio src={S('audio/sfx_notif.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};

/* marca de agua blanca discreta para escenas oscuras (presencia de marca) */
export const Bug: React.FC<{show: boolean}> = ({show}) =>
  !show ? null : <Img src={S('marca/anim/saravia.png')} style={{position: 'absolute', left: 60, top: 118, width: 200, filter: 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.6))', opacity: 0.85}} />;
