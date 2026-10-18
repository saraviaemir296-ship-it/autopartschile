import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';

/* Short lifestyle sin sonido ni texto. Cada toma entra como una Live Photo de iPhone:
   un pequeño "pop" (zoom 1.07→1 con desenfoque que se limpia) y luego movimiento.
   Las fotos no traen video, así que llevan un empuje lento con pulso de cámara en mano. */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
type Item = {src: string; dur: number; video?: boolean; origin?: string; from?: number; rate?: number; pan?: [number, number]};
/* primero el negocio (web de la desarmaduría, compra y software de grúas), después el lifestyle */
const H = (from: number, dur: number, pan: [number, number], rate = 1): Item => ({src: 'personal/web_desarme.mp4', dur, video: true, from, rate, pan});
const ITEMS: Item[] = [
  {src: 'personal/collage.jpg', dur: 48, origin: '50% 45%'},
  H(0.1, 46, [560, 700]),
  H(2.6, 52, [560, 1100]),
  H(5.5, 52, [960, 900], 1.15),
  H(10.1, 66, [780, 960], 1.25),
  {src: 'personal/gruas_v3.mp4', dur: 50, video: true, from: 3.4},
  {src: 'personal/gruas_v3.mp4', dur: 80, video: true, from: 7.1, rate: 1.35},
  {src: 'personal/life_laptop.jpg', dur: 70, origin: '62% 58%'},
  {src: 'personal/life_bmw.mp4', dur: 100, video: true},
  {src: 'personal/life_sushi.jpg', dur: 70, origin: '55% 62%'},
  {src: 'personal/life_pulsera.mp4', dur: 100, video: true},
];
export const LIFESTYLE_TOTAL = ITEMS.reduce((a, i) => a + i.dur, 0);

/* grabación horizontal de la pantalla: al alto de 1440 px con fondo desenfocado y paneo */
const Wide: React.FC<{it: Item}> = ({it}) => {
  const f = useCurrentFrame();
  const k = 1440 / 1080;
  const cx = interpolate(f, [0, it.dur], it.pan!, {...cl, easing: Easing.inOut(Easing.quad)});
  const v = (style: React.CSSProperties) => <OffthreadVideo src={staticFile(it.src)} startFrom={Math.round((it.from ?? 0) * 30)} playbackRate={it.rate ?? 1} muted style={style} />;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(40px) brightness(0.5)', transform: 'scale(1.3)'}}>{v({width: '100%', height: '100%', objectFit: 'cover'})}</AbsoluteFill>
      <div style={{position: 'absolute', top: 240, left: 540 - cx * k, width: 1920 * k, height: 1440}}>{v({width: '100%', height: '100%'})}</div>
    </AbsoluteFill>
  );
};

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
        {it.pan ? <Wide it={it} /> : it.video ? <OffthreadVideo src={staticFile(it.src)} startFrom={Math.round((it.from ?? 0) * 30)} playbackRate={it.rate ?? 1} muted style={st} /> : <Img src={staticFile(it.src)} style={st} />}
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
