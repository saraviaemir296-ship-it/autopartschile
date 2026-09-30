import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {E, cl} from './look';

export type Seg = {from: number; take: number; rate: number};
export const segFrames = (segs: Seg[]) => segs.reduce((a, g) => a + Math.round((g.take / g.rate) * 30), 0);

/** Grading cinematográfico: negros profundos, contraste controlado, saturación moderada. */
const GRADE = {
  natural: 'contrast(1.14) saturate(0.9) brightness(0.95)',
  warm: 'contrast(1.1) saturate(0.78) brightness(0.93) hue-rotate(-4deg)',
};

/** Movimiento "handheld controlado": suma de senos lentos, amplitud en px. */
const handheld = (f: number, amp: number, seed: string) => {
  const p = random(seed) * 100;
  return {
    x: amp * (Math.sin((f + p) / 23) * 0.6 + Math.sin((f + p) / 9.7) * 0.25),
    y: amp * (Math.cos((f + p) / 29) * 0.6 + Math.sin((f + p) / 12.3) * 0.2),
    r: amp * 0.012 * Math.sin((f + p) / 31),
  };
};

export const Shot: React.FC<{
  src: string;
  segs: Seg[];
  look?: keyof typeof GRADE;
  zoom?: [number, number];
  pan?: [number, number];
  origin?: string;
  shake?: number;
  audio?: number;
  blur?: number;
  darken?: number;
}> = ({src, segs, look = 'natural', zoom = [1, 1], pan = [0, 0], origin = '50% 50%', shake = 0, audio = 0, blur = 0, darken = 0}) => {
  const f = useCurrentFrame();
  const total = segFrames(segs);
  const k = interpolate(f, [0, total], [0, 1], {...cl, easing: E.inOut});
  const z = zoom[0] + (zoom[1] - zoom[0]) * k;
  const h = handheld(f, shake, src + segs[0].from);
  let cursor = 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill
        style={{
          transformOrigin: origin,
          transform: `translate(${pan[0] * k + h.x}px, ${pan[1] * k + h.y}px) rotate(${h.r}deg) scale(${z})`,
          filter: `${GRADE[look]}${blur ? ` blur(${blur}px)` : ''}`,
        }}
      >
        {segs.map((g, i) => {
          const d = Math.round((g.take / g.rate) * 30);
          const s = cursor;
          cursor += d;
          return (
            <Sequence key={i} from={s} durationInFrames={d} layout="none">
              <OffthreadVideo
                src={staticFile(src)}
                startFrom={Math.round(g.from * 30)}
                playbackRate={g.rate}
                muted={audio === 0}
                volume={audio}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {/* viñeta + negros profundos */}
      <AbsoluteFill style={{background: 'radial-gradient(115% 80% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)'}} />
      {darken > 0 && <AbsoluteFill style={{background: `rgba(8,8,8,${darken})`}} />}
    </AbsoluteFill>
  );
};

/** Grano de película: ruido SVG con semilla por frame, muy sutil. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 24} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Barras de crop cinematográfico que entran/salen suavemente (px por lado). */
export const Letterbox: React.FC<{size: number; dur: number}> = ({size, dur}) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [0, 18, dur - 12, dur], [0, 1, 1, 0], {...cl, easing: E.inOut}) * size;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: v, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: v, background: '#000'}} />
    </AbsoluteFill>
  );
};
