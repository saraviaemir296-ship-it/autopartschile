import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {CuatroAutos, SFX, STAMPS, T} from './CuatroAutos';
import {STING_SFX} from './LogoSting';
import {CRIS_SEGS, CRIS_TOTAL, CRIS_VO} from './voCris';

/* "1 día" con la voz real de Cristian. El corte sigue a la voz: cada escena
   del timeline original se estira linealmente hasta durar lo que dura su
   frase (CRIS_SEGS), renderizando el video original con el tiempo re-mapeado
   (<Freeze> por frame). Los SFX se recalculan al nuevo tiempo y bajan cuando
   habla la voz. */

export const UNDIA_VOZ_TOTAL = CRIS_TOTAL;
const S = (f: string) => staticFile(f);

const toInner = (o: number) => {
  const seg = CRIS_SEGS.find(([, , A, L]) => o >= A && o < A + L) ?? CRIS_SEGS[CRIS_SEGS.length - 1];
  const [a, b, A, L] = seg;
  return Math.min(b - 0.001, a + ((o - A) / L) * (b - a));
};
const toOuter = (i: number) => {
  const seg = CRIS_SEGS.find(([a, b]) => i >= a && i < b) ?? CRIS_SEGS[CRIS_SEGS.length - 1];
  const [a, b, A, L] = seg;
  return Math.round(A + ((i - a) / (b - a)) * L);
};
const voOn = (fr: number) => CRIS_VO.some(([a, d]) => fr >= a && fr < a + d);

type Sfx = [number, string, number, number?];
const ALL_SFX: Sfx[] = [
  ...SFX,
  ...STAMPS.map(([at]) => [at, 'sfx_metal', 0.8, 20] as Sfx),
  ...STING_SFX.map(([at, n, v, d]) => [T.end + at, n, v, d] as Sfx),
];

export const UnDiaVoz: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Freeze frame={toInner(f)}>
        <CuatroAutos dia mute />
      </Freeze>
      {ALL_SFX.map(([at, n, v, d], i) => {
        const o = toOuter(at);
        return (
          <Sequence key={i} from={o} durationInFrames={d ?? 90}>
            <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(o + x) ? 0.4 : 1)} />
          </Sequence>
        );
      })}
      {CRIS_VO.map(([st, du, file]) => (
        <Sequence key={file} from={st} durationInFrames={du + 3}><Audio src={S(file)} volume={1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
