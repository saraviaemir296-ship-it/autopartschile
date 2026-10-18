import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';

/* Short lifestyle sin sonido ni texto. Cada toma entra como una Live Photo de iPhone:
   un pequeño "pop" (zoom 1.07→1 con desenfoque que se limpia) y luego movimiento.
   Las fotos no traen video, así que llevan un empuje lento con pulso de cámara en mano. */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
type Item = {src: string; dur: number; video?: boolean; origin?: string};
const ITEMS: Item[] = [
  {src: 'personal/life_laptop.jpg', dur: 70, origin: '62% 58%'},
  {src: 'personal/life_bmw.mp4', dur: 100, video: true},
  {src: 'personal/life_sushi.jpg', dur: 70, origin: '55% 62%'},
  {src: 'personal/life_pulsera.mp4', dur: 100, video: true},
];
export const LIFESTYLE_TOTAL = ITEMS.reduce((a, i) => a + i.dur, 0);

const Live: React.FC<{it: Item}> = ({it}) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 14], [1.07, 1], {...cl, easing: out});
  const blur = interpolate(f, [0, 8], [7, 0], cl);
  const bright = interpolate(f, [0, 8], [1.12, 1], cl);
  const push = it.video ? 1 : interpolate(f, [0, it.dur], [1, 1.07], cl);
  const hx = it.video ? 0 : Math.sin(f * 0.13) * 3 + Math.sin(f * 0.31) * 1.5;
  const hy = it.video ? 0 : Math.cos(f * 0.11) * 3;
  const st: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${hx}px,${hy}px) scale(${pop * push})`, transformOrigin: it.origin ?? '50% 50%', filter: `blur(${blur}px) brightness(${bright})`}}>
        {it.video ? <OffthreadVideo src={staticFile(it.src)} muted style={st} /> : <Img src={staticFile(it.src)} style={st} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Lifestyle: React.FC = () => {
  let t = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {ITEMS.map((it) => {
        const from = t;
        t += it.dur;
        return <Sequence key={it.src} from={from} durationInFrames={it.dur}><Live it={it} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
