import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

/* Video personal: tarde en el cerro (3 clips + foto del kiwi).
   Estética orgánica: cortes con golpe de zoom, grano fino y textos chicos.
   El audio ambiente queda bajito para que encima vaya el sonido en tendencia. */

loadFont({family: 'Playfair', url: staticFile('fonts/PlayfairItalic.ttf'), weight: '400 900', style: 'italic', format: 'truetype'});

const S = (f: string) => staticFile(f);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Seg = {src: string; from: number; len: number; rate?: number; photo?: boolean};
const SEGS: Seg[] = [
  {src: 'personal/c3930.mp4', from: 24, len: 72},              // selfie caminando, atardecer
  {src: 'personal/c3918.mp4', from: 0, len: 120},             // sendero → vista de Santiago
  {src: 'personal/c3906.mp4', from: 30, len: 120, rate: 1.3}, // bajada entre árboles
  {src: 'personal/kiwi.jpg', from: 0, len: 54, photo: true},  // el kiwi
  {src: 'personal/c3930.mp4', from: 96, len: 114},            // vuelta al selfie
];
const STARTS = SEGS.reduce<number[]>((a, s, i) => [...a, a[i] + s.len], [0]);
export const CERRO_TOTAL = STARTS[SEGS.length];

const Txt: React.FC<{t: number; at: number; until: number; top: number; size?: number; children: React.ReactNode}> = ({t, at, until, top, size = 66, children}) => {
  if (t < at || t > until) return null;
  const o = interpolate(t, [at, at + 10, until - 8, until], [0, 1, 1, 0], cl);
  const b = interpolate(t, [at, at + 10], [10, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', opacity: o, filter: `blur(${b}px)`, transform: `translateY(${(1 - o) * 14}px)`, fontFamily: "'Playfair', serif", fontStyle: 'italic', fontSize: size, color: '#fff', textShadow: '0 2px 22px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.7)'}}>{children}</div>
  );
};

const Pin: React.FC<{t: number; at: number}> = ({t, at}) => {
  if (t < at) return null;
  const o = interpolate(t, [at, at + 8], [0, 1], cl);
  return (
    <div style={{position: 'absolute', top: 1560, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px', borderRadius: 40, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.35)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 36, color: '#fff'}}>
        <svg width="30" height="36" viewBox="0 0 24 30"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 30 12 30s12-9.5 12-18.3C24 5.2 18.6 0 12 0zm0 16a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6z" fill="#fff" /></svg>
        Cerro San Cristóbal, Santiago
      </div>
    </div>
  );
};

/* grano fino de película (cambia cada frame) */
const Grain: React.FC<{f: number}> = ({f}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 50} /></filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
);

export const Cerro: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, STARTS.findIndex((s, k) => f >= s && f < STARTS[k + 1]));
  const t = f - STARTS[i];
  const punch = i === 0 ? 1 : interpolate(t, [0, 7], [1.1, 1], cl);
  const flash = i === 0 ? 0 : interpolate(t, [0, 5], [0.35, 0], cl);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SEGS.map((s, k) => (
        <Sequence key={k} from={STARTS[k]} durationInFrames={s.len}>
          <AbsoluteFill style={{transform: `scale(${k === i ? punch : 1})`}}>
            {s.photo ? (
              <Img src={S(s.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(t, [0, s.len], [1.04, 1.14], cl)})`, transformOrigin: '50% 45%'}} />
            ) : (
              <OffthreadVideo src={S(s.src)} startFrom={s.from} playbackRate={s.rate ?? 1} volume={0.7} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            )}
          </AbsoluteFill>
        </Sequence>
      ))}
      {/* tono cálido de atardecer + viñeta suave */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,170,90,0.08) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'}} />
      <AbsoluteFill style={{background: '#fff8ec', opacity: flash}} />
      <Grain f={f} />
      <Txt t={f} at={8} until={STARTS[1] - 2} top={300}>domingo de cerro</Txt>
      {i === 1 && <Pin t={t} at={62} />}
      <Txt t={f} at={STARTS[3] + 4} until={STARTS[4] - 2} top={1150} size={64}><div style={{marginRight: 520}}>snack<br />oficial</div></Txt>
      <Txt t={f} at={STARTS[4] + 20} until={CERRO_TOTAL} top={300}>a veces hay que parar un rato</Txt>
      {STARTS.slice(1, SEGS.length).map((s, k) => (
        <Sequence key={k} from={s - 3} durationInFrames={20}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.22} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
