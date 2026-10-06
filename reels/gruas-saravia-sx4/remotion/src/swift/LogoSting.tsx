import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Cierre de marca animado (2 s). Piezas recortadas del logo oficial en alta
   (public/marca/anim, fondo blanco convertido a transparencia): cada parte
   entra por separado — franjas de esquina, AutopartsChile, DESARMADURÍA,
   SARAVIA, línea roja desde el centro, bajada, fila de marcas — y después
   WhatsApp + web. Se usa dentro de un <Sequence>: el frame es local. */

export const STING_LEN = 90;
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


const SOCIAL: ['tiktok' | 'instagram' | 'facebook', string][] = [
  ['tiktok', 'Desarmaduría Saravia'], ['instagram', '@desarmaduria.saravia'], ['facebook', 'Desarmaduría Saravia'],
];
const SocialIcon: React.FC<{kind: 'tiktok' | 'instagram' | 'facebook'}> = ({kind}) => {
  if (kind === 'facebook') {
    return <div style={{width: 56, height: 56, borderRadius: 28, background: '#1877F2', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 8px 18px rgba(0,0,0,0.25)'}}><span style={{fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 900, fontSize: 52, lineHeight: 0.92, color: '#fff', marginLeft: 6}}>f</span></div>;
  }
  if (kind === 'instagram') {
    return (
      <div style={{width: 56, height: 56, borderRadius: 16, background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(0,0,0,0.25)'}}>
        <div style={{width: 34, height: 34, borderRadius: 10, border: '4px solid #fff', boxSizing: 'border-box', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 13, height: 13, borderRadius: 7, border: '3px solid #fff', boxSizing: 'border-box'}} />
          <div style={{position: 'absolute', right: 2, top: 2, width: 4, height: 4, borderRadius: 3, background: '#fff'}} />
        </div>
      </div>
    );
  }
  return (
    <div style={{width: 56, height: 56, borderRadius: 16, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(0,0,0,0.25)'}}>
      <span style={{fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 900, fontSize: 38, color: '#fff', textShadow: '-2px -2px 0 #25F4EE, 3px 2px 0 #FE2C55'}}>♪</span>
    </div>
  );
};

export const LogoSting: React.FC<{mute?: boolean}> = ({mute}) => {
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
      <Img src={S('marca/anim/apc.png')} style={{position: 'absolute', left: 240, top: 100, width: 600, clipPath: `inset(0 ${(1 - apc) * 100}% 0 0)`, transform: `translateX(${(1 - apc) * -90}px)`}} />
      <div style={{position: 'absolute', left: 540 - 260 * div, top: 530, width: 520 * div, height: 4, background: '#0A0A0A'}} />
      {/* DESARMADURÍA: se cierra el tracking */}
      <Img src={S('marca/anim/desarm.png')} style={{position: 'absolute', left: 220, top: 585, width: 640, opacity: des, transform: `scaleX(${1.35 - 0.35 * des})`}} />
      {/* SARAVIA: sube desde una máscara con un pequeño golpe */}
      <div style={{position: 'absolute', left: 90, top: 675, width: 900, height: 190, overflow: 'hidden'}}>
        <Img src={S('marca/anim/saravia.png')} style={{width: 900, transform: `translateY(${(1 - sar) * 105}%) scale(${t >= 22 ? interpolate(t, [22, 25, 30], [1.06, 0.99, 1], cl) : 1})`}} />
      </div>
      {/* línea roja que se abre desde el centro */}
      <Img src={S('marca/anim/linea.png')} style={{position: 'absolute', left: 90, top: 880, width: 900, clipPath: `inset(0 ${(1 - lin) * 50}% 0 ${(1 - lin) * 50}%)`}} />
      <Img src={S('marca/anim/tagline.png')} style={{position: 'absolute', left: 120, top: 935, width: 840, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)`}} />
      <Img src={S('marca/anim/marcas.png')} style={{position: 'absolute', left: 160, top: 1045, width: 760, clipPath: `inset(0 ${(1 - mar) * 100}% 0 0)`}} />
      {/* barrido de luz sobre toda la marca */}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sw - 9}%, rgba(255,255,255,0.8) ${sw}%, transparent ${sw + 9}%)`}} />
      {/* redes sociales */}
      {t >= 44 && <div style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', fontFamily: "'Anton', sans-serif", fontSize: 40, color: '#0A0A0A', letterSpacing: 4, opacity: interpolate(t, [44, 48], [0, 1], cl)}}>SÍGUENOS</div>}
      <div style={{position: 'absolute', top: 1458, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
        {SOCIAL.map(([kind, handle], i) => t >= 47 + i * 4 && (
          <div key={kind} style={{width: 560, display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${interpolate(t - (47 + i * 4), [0, 6], [-120, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(t - (47 + i * 4), [0, 4], [0, 1], cl)}}>
            <SocialIcon kind={kind} />
            <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 36, color: '#0A0A0A'}}>{handle}</div>
          </div>
        ))}
      </div>
      {t >= 36 && <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 200, top: 1185, width: 680, transform: `scale(${pop(36)})`}} />}
      {t >= 40 && <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 160, top: 1290, width: 760, transform: `scale(${pop(40)})`}} />}
      {!mute && t >= 47 && (
        <>
          <Sequence from={47} durationInFrames={8}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
          <Sequence from={51} durationInFrames={8}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
          <Sequence from={55} durationInFrames={8}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
        </>
      )}
      {!mute && (
        <>
          <Sequence from={0} durationInFrames={25}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.6} /></Sequence>
          <Sequence from={14} durationInFrames={30}><Audio src={S('audio/sfx_impact_soft.wav')} volume={(x) => 0.5 * interpolate(x, [24, 30], [1, 0], cl)} /></Sequence>
          <Sequence from={27} durationInFrames={10}><Audio src={S('audio/sfx_click.wav')} volume={0.5} /></Sequence>
          <Sequence from={36} durationInFrames={20}><Audio src={S('audio/sfx_notif.wav')} volume={0.6} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};

/* marca de agua blanca discreta para escenas oscuras (presencia de marca) */
export const Bug: React.FC<{show: boolean}> = ({show}) =>
  !show ? null : <Img src={S('marca/anim/saravia.png')} style={{position: 'absolute', left: 60, top: 118, width: 200, filter: 'brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.6))', opacity: 0.85}} />;

// mismos SFX del cierre, para quien re-mapea el tiempo y monta el audio por fuera
export const STING_SFX: [number, string, number, number][] = [[0, 'sfx_whoosh', 0.6, 25], [14, 'sfx_impact_soft', 0.5, 30], [27, 'sfx_click', 0.5, 10], [36, 'sfx_notif', 0.6, 20]];
