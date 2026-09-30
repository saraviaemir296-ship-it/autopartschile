import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ease, s} from '../theme';
import {clamp} from '../anim';

export type Look = 'natural' | 'vivid';

/**
 * Grading por CSS: aproxima lo que harás en CapCut (contraste moderado,
 * negros profundos, saturación controlada). 'vivid' baja la saturación de
 * IMG_3239 / IMG_3244, que vienen con un look más cálido y saturado que
 * IMG_3232 / IMG_3240 — sin esto el montaje "salta" de color entre planos.
 */
const GRADE: Record<Look, string> = {
  natural: 'contrast(1.10) saturate(0.94) brightness(0.97)',
  vivid: 'contrast(1.06) saturate(0.80) brightness(0.95) hue-rotate(-4deg)',
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 85% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

type Segment = {
  /** segundo del archivo original donde empieza el tramo */
  from: number;
  /** segundos de material original que consume el tramo */
  take: number;
  /** velocidad: 1 = 100 %, 1.6 = 160 %, 0.7 = 70 % */
  rate: number;
};

export type ClipProps = {
  src: string;
  segments: Segment[];
  look?: Look;
  /** zoom digital al inicio y al final del clip (1 = 100 %) */
  zoom?: [number, number];
  /** desplazamiento en px (x, y) al inicio y al final: push-in / paralaje lateral */
  pan?: [[number, number], [number, number]];
  /** punto de anclaje del zoom en % */
  origin?: string;
  muted?: boolean;
  volume?: number;
};

/** Duración en frames que ocupará un clip en la línea de tiempo. */
export const clipFrames = (segments: Segment[]) =>
  segments.reduce((acc, g) => acc + s(g.take / g.rate), 0);

/**
 * Clip de material real con speed ramp por tramos + zoom/pan digital continuo.
 * El zoom se aplica al contenedor, así que no "salta" entre tramos de velocidad.
 */
export const Clip: React.FC<ClipProps> = ({
  src,
  segments,
  look = 'natural',
  zoom = [1, 1],
  pan = [
    [0, 0],
    [0, 0],
  ],
  origin = '50% 50%',
  muted = true,
  volume = 1,
}) => {
  const frame = useCurrentFrame();
  const total = clipFrames(segments);
  const t = interpolate(frame, [0, total], [0, 1], {...clamp, easing: ease.inOut});
  const z = zoom[0] + (zoom[1] - zoom[0]) * t;
  const x = pan[0][0] + (pan[1][0] - pan[0][0]) * t;
  const y = pan[0][1] + (pan[1][1] - pan[0][1]) * t;

  let cursor = 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill
        style={{transform: `translate(${x}px, ${y}px) scale(${z})`, transformOrigin: origin, filter: GRADE[look]}}
      >
        {segments.map((g, i) => {
          const dur = s(g.take / g.rate);
          const start = cursor;
          cursor += dur;
          return (
            <Sequence key={i} from={start} durationInFrames={dur} layout="none">
              <OffthreadVideo
                src={staticFile(src)}
                startFrom={s(g.from)}
                playbackRate={g.rate}
                muted={muted}
                volume={volume}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Vignette />
      {/* scrim inferior: da contraste a los textos sin oscurecer todo el plano */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.25) 88%, rgba(0,0,0,0) 100%)'}} />
    </AbsoluteFill>
  );
};
