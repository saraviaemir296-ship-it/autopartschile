import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';

/* Grúas Saravia — revelado cinematográfico del logo (8 s, 9:16).
   Todo usa el logo original recortado (sin redibujar letras):
   0–2 s  macro del ícono A-gancho extruido, rojo brillante, cámara deslizándose;
   2–4 s  fragmentos del logo en el espacio con estelas rojas;
   4–6 s  los fragmentos convergen en el logo completo + barrido de luz;
   6–8 s  plano final quieto y legible, push-in, rim light y reflejo. */

const S = (f: string) => staticFile(f);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const LOGOCINE_TOTAL = 240;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

/* capa con extrusión: copias oscuras hacia atrás en Z + cara frontal + brillo especular enmascarado */
const Extruded: React.FC<{src: string; w: number; h: number; depth?: number; step?: number; sweep?: number; tint?: string}> = ({src, w, h, depth = 14, step = 2.2, sweep = -1, tint}) => (
  <div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d'}}>
    {Array.from({length: depth}).map((_, i) => (
      <Img key={i} src={S(src)} style={{position: 'absolute', inset: 0, width: w, height: h, transform: `translateZ(${-(depth - i) * step}px)`, filter: `brightness(${0.12 + (i / depth) * 0.28}) ${tint ?? ''}`}} />
    ))}
    <Img src={S(src)} style={{position: 'absolute', inset: 0, width: w, height: h, filter: 'contrast(1.08) saturate(1.1)'}} />
    {/* barrido de luz recortado con la forma del logo */}
    {sweep > -0.5 && sweep < 1.5 && (
      <div style={{position: 'absolute', inset: 0, WebkitMaskImage: `url(${S(src)})`, maskImage: `url(${S(src)})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep * 100 - 14}%, rgba(255,255,255,0.85) ${sweep * 100}%, rgba(255,255,255,0) ${sweep * 100 + 14}%)`, mixBlendMode: 'screen'}} />
    )}
  </div>
);

/* partículas de polvo en el aire, iluminadas */
const Dust: React.FC<{f: number; o: number}> = ({f, o}) => (
  <AbsoluteFill style={{opacity: o}}>
    {Array.from({length: 60}).map((_, i) => {
      const r = (k: string) => random(`lc${k}${i}`);
      const x = r('x') * 1080 + Math.sin(f * 0.02 + r('p') * 6) * 40;
      const y = ((r('y') * 2100 - f * (0.4 + r('v') * 0.8)) % 2100 + 2100) % 2100 - 90;
      const s = 1.5 + r('s') * 3.5;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: r('c') > 0.7 ? '#ff5a5a' : '#fff', opacity: 0.15 + r('a') * 0.5, filter: r('b') > 0.5 ? 'blur(1.5px)' : undefined}} />;
    })}
  </AbsoluteFill>
);

/* rayos volumétricos desde arriba */
const Rays: React.FC<{o: number; f: number}> = ({o, f}) => (
  <AbsoluteFill style={{opacity: o, mixBlendMode: 'screen'}}>
    {[-18, -6, 5, 16].map((a, i) => (
      <div key={i} style={{position: 'absolute', left: 540 - 90, top: -200, width: 180, height: 1700, transformOrigin: '50% 0%', transform: `rotate(${a + Math.sin(f * 0.01 + i) * 2}deg)`, background: 'linear-gradient(180deg, rgba(255,60,60,0.22), rgba(255,40,40,0.05) 60%, rgba(0,0,0,0))', filter: 'blur(26px)'}} />
    ))}
  </AbsoluteFill>
);

/* piezas del logo original: [archivo, x, y, ancho, alto] en px del logo completo (1774×887) */
const PIECES: [string, number, number, number, number][] = [
  ['marca/gruas/lg_truck.png', 121, 73, 1497, 334],
  ['marca/gruas/lg_gruas.png', 178, 406, 1434, 72],
  ['marca/gruas/lg_saravia.png', 135, 504, 1519, 209],
  ['marca/gruas/lg_tag.png', 136, 733, 1502, 36],
];
const SC = 0.58;
const LX = (x: number) => 540 + (x - 887) * SC;
const LY = (y: number) => 900 + (y - 443) * SC;
/* de dónde viene cada fragmento (desordenado en 3D) */
const FROM = [
  {x: -380, y: -520, z: -900, rx: 35, ry: -60, rz: -12},
  {x: 420, y: -260, z: -1300, rx: -50, ry: 40, rz: 18},
  {x: -300, y: 380, z: -700, rx: 25, ry: 70, rz: 8},
  {x: 360, y: 620, z: -1100, rx: -30, ry: -45, rz: -20},
];

export const LogoCine: React.FC = () => {
  const f = useCurrentFrame();

  /* fase 1: macro del ícono */
  const macroO = interpolate(f, [0, 10, 58, 76], [0, 1, 1, 0], cl);
  const glide = interpolate(f, [0, 76], [0, 1], cl);

  /* fase 2–3: fragmentos → convergencia (spring por pieza) */
  const conv = (i: number) => spring({frame: f - (112 + i * 6), fps: 30, config: {damping: 16, stiffness: 60, mass: 1.1}});
  const appear = (i: number) => interpolate(f, [56 + i * 8, 78 + i * 8], [0, 1], cl);

  /* fase 4: plano final */
  const push = interpolate(f, [170, 240], [1, 1.06], {...cl, easing: (x) => x * (2 - x)});
  const sweep1 = interpolate(f, [150, 176], [-0.3, 1.3], cl);
  const sweep2 = interpolate(f, [200, 226], [-0.3, 1.3], cl);
  const flash = interpolate(f, [150, 154, 168], [0, 0.35, 0], cl);
  const rim = interpolate(f, [160, 190], [0, 1], cl);

  return (
    <AbsoluteFill style={{background: '#030303'}}>
      {/* estudio: piso brillante y luz roja de fondo */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 50% 52%, rgba(160,0,10,0.28) 0%, rgba(0,0,0,0) 70%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(40,4,6,0.55) 80%, rgba(0,0,0,0.9) 100%)'}} />
      <Rays o={interpolate(f, [40, 90, 200, 240], [0, 0.9, 0.7, 0.55], cl)} f={f} />

      {/* FASE 1 · macro: el ícono enorme, girado, desenfocado en los bordes */}
      {macroO > 0 && (
        <AbsoluteFill style={{perspective: 1100, opacity: macroO}}>
          <div style={{position: 'absolute', left: 540 - 1300, top: 960 - 1160, transformStyle: 'preserve-3d', transform: `translateX(${interpolate(glide, [0, 1], [380, -520])}px) translateY(${interpolate(glide, [0, 1], [-160, 220])}px) translateZ(${interpolate(glide, [0, 1], [220, -260])}px) rotateX(${interpolate(glide, [0, 1], [18, 4])}deg) rotateY(${interpolate(glide, [0, 1], [-48, -14])}deg) rotateZ(-8deg)`, filter: `blur(${interpolate(glide, [0, 0.5, 1], [3, 1, 2.5])}px)`}}>
            <Extruded src="marca/gruas/icon-a.png" w={2600} h={2318} depth={18} step={4} sweep={interpolate(f, [8, 64], [-0.2, 1.2], cl)} />
          </div>
          {/* sombra dramática: solo una franja angosta iluminada */}
          <AbsoluteFill style={{background: `linear-gradient(${120 + glide * 30}deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 42%, rgba(0,0,0,0.25) 52%, rgba(0,0,0,0.95) 78%)`}} />
        </AbsoluteFill>
      )}

      {/* estelas de luz roja */}
      {f >= 60 && f < 160 && Array.from({length: 9}).map((_, i) => {
        const r = (k: string) => random(`st${k}${i}`);
        const t = (f - 60 - r('d') * 50) / 22;
        if (t < 0 || t > 1) return null;
        const y = 300 + r('y') * 1300;
        return <div key={i} style={{position: 'absolute', top: y, left: interpolate(t, [0, 1], [-700, 1300]), width: 500 + r('w') * 400, height: 2 + r('h') * 3, borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,30,40,0), #ff2a35, #fff)', boxShadow: '0 0 16px 3px rgba(255,30,40,0.7)', transform: `rotate(${-8 + r('a') * 6}deg)`, opacity: Math.sin(t * Math.PI)}} />;
      })}

      {/* FASE 2–4 · fragmentos del logo real → logo completo */}
      <AbsoluteFill style={{perspective: 1400, transform: `scale(${push})`, transformOrigin: '50% 47%'}}>
        {PIECES.map(([src, x, y, w, h], i) => {
          const k = conv(i);
          const a = appear(i);
          if (a <= 0) return null;
          const fr = FROM[i];
          const drift = interpolate(f, [56, 140], [0, 1], cl);
          return (
            <div key={i} style={{position: 'absolute', left: LX(x), top: LY(y), transformStyle: 'preserve-3d', opacity: a, filter: `blur(${(1 - k) * 6}px)`,
              transform: `translate3d(${fr.x * (1 - k) - drift * 40 * (1 - k)}px, ${fr.y * (1 - k)}px, ${fr.z * (1 - k)}px) rotateX(${fr.rx * (1 - k)}deg) rotateY(${fr.ry * (1 - k)}deg) rotateZ(${fr.rz * (1 - k)}deg)`}}>
              <Extruded src={src} w={w * SC} h={h * SC} depth={10} step={1.6} sweep={f < 150 ? interpolate(f, [70 + i * 10, 110 + i * 10], [-0.2, 1.2], cl) : f < 190 ? sweep1 : sweep2} />
            </div>
          );
        })}
        {/* reflejo en el piso del logo completo */}
        {f >= 150 && (
          <Img src={S('marca/gruas/logo-full-alpha.png')} style={{position: 'absolute', left: LX(0), top: LY(887) + 6, width: 1774 * SC, transform: 'scaleY(-1)', opacity: 0.18 * rim, WebkitMaskImage: 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 45%)', maskImage: 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 45%)', filter: 'blur(2px)'}} />
        )}
      </AbsoluteFill>

      {/* rim light rojo detrás del logo terminado */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 48% 16% at 50% 47%, rgba(255,20,30,${0.22 * rim}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen'}} />
      <Dust f={f} o={interpolate(f, [20, 60], [0, 1], cl)} />
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      {/* viñeta y grano */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 47%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />

      {/* sonido */}
      <Sequence from={0} durationInFrames={70}><Audio src={S('audio/sfx_sub.wav')} volume={0.6} /></Sequence>
      <Sequence from={4} durationInFrames={60}><Audio src={S('audio/sfx_metal.wav')} volume={0.25} /></Sequence>
      <Sequence from={60} durationInFrames={40}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.55} /></Sequence>
      <Sequence from={95} durationInFrames={56}><Audio src={S('audio/sfx_riser.wav')} volume={0.45} /></Sequence>
      <Sequence from={150} durationInFrames={60}><Audio src={S('audio/sfx_impact.wav')} volume={0.9} /></Sequence>
      <Sequence from={150} durationInFrames={70}><Audio src={S('audio/sfx_sub.wav')} volume={0.7} /></Sequence>
      <Sequence from={156} durationInFrames={40}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.4} /></Sequence>
      <Sequence from={200} durationInFrames={40}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};
