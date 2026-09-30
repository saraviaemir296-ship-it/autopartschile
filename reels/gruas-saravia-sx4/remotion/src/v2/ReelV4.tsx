import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {Grain, PhotoShot, Shot} from './Shot';
import {PersonShot} from './PersonShot';
import {SoftwareShot} from './SoftwareShot';
import {AnimatedMap} from './MapOverlay';
import {StatusCard} from './ServiceStatus';
import {LogoReveal} from './LogoReveal';
import {Caption4, Headline4, W} from './Type4';
import {cl} from './look';
import {Pricing, SocialsBig} from './Pricing';
import {TruckWipe} from './TruckAccel';
import {WebDemo} from './WebDemo';

/**
 * REEL V4 · 28,5 s, cuadrado a la voz en off. Orden: persona → software de IA → operador en tiempo real →
 * el servicio real (llegada, rescate, plano automotriz, detalles) → consejo → CTA.
 * Cada plano dura lo justo: nada sobre 3 s sin un cambio de imagen o de texto.
 */
export const V4 = {
  hook: [0, 155],
  software: [155, 265],
  geo: [265, 385],
  pricing: [385, 520],
  socials: [520, 694],
  close: [694, 814],
  cta: [814, 904],
} as const;
export const V4_TOTAL = 904;

export type V4Props = {
  /** Voz en off: un archivo por línea (o null). Tu voz real siempre tiene prioridad. */
  vo: {hook: string | null; software: string | null; geo: string | null; close: string | null};
  music: string;
  place: string;
};
export const v4Defaults: V4Props = {
  vo: {hook: 'audio/vo/vo_hook.wav', software: 'audio/vo/vo_software.wav', geo: 'audio/vo/vo_geo.wav', close: 'audio/vo/vo_close.wav'},
  music: 'audio/music_v4.wav',
  place: 'SANTIAGO, CHILE',
};

const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const S = (f: string) => staticFile(f);

/**
 * Palabras sincronizadas con la voz: reparte el tramo hablado [t0, t1] (segundos
 * dentro del archivo de voz, medidos por pausas) según las sílabas de cada palabra.
 * Devuelve tiempos en frames relativos a `seqStart` (frames desde el inicio del audio).
 */
const sync = (text: string, syl: number[], t0: number, t1: number, seqStart: number, hi: number[] = []): W[] => {
  const words = text.split(' ');
  const total = syl.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((tw, i) => {
    const at = Math.round((t0 + (acc / total) * (t1 - t0)) * 30) - seqStart;
    acc += syl[i];
    return {t: tw, at: Math.max(0, at - 2), hi: hi.includes(i)};
  });
};
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] =>
  s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));


export const ReelV4: React.FC<V4Props> = ({vo, music, place}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–5,2 s · PERSONA → el auto botado. Corte en la pausa de la voz, impacto en "esperar". */}
      <Sequence {...at(V4.hook)}>
        <Sequence durationInFrames={58}>
          <PersonShot person="equipo/operador-1.png" dur={58} bgSrc="footage/IMG_3240.mp4" bgSegs={[{from: 2.0, take: 2.0, rate: 1}]} width={1400} bottom={10} />
          <Caption4 dur={58} y={1080} words={sync('Cuando quedas botado,', [2, 2, 3], 0.08, 1.47, -3, [2])} />
        </Sequence>
        <Sequence from={58}>
          <Shot src="footage/IMG_3232.mp4" segs={[{from: 1.0, take: 3.23, rate: 1}]} zoom={[1.14, 1.0]} origin="42% 58%" shake={5} />
          <Sequence from={2} durationInFrames={95}><Caption4 dur={95} y={1180} words={sync('no tienes tiempo para esperar.', [1, 2, 2, 2, 3], 2.04, 4.85, 58 - 3 + 2, [3, 4])} /></Sequence>
        </Sequence>
      </Sequence>

      {/* 5,2–8,8 s · SOFTWARE DE IA propio */}
      <Sequence {...at(V4.software)}>
        <SoftwareShot dur={110} label={false} />
        <Sequence durationInFrames={50}><Caption4 dur={50} y={1520} size={52} words={sync('Por eso creamos nuestro propio', [1, 3, 3, 2, 2], 0.02, 1.56, -3)} /></Sequence>
        <Sequence from={50} durationInFrames={60}><Caption4 dur={60} y={1520} size={52} words={sync('software con inteligencia artificial.', [2, 1, 5, 5], 1.56, 3.4, 50 - 3, [2, 3])} /></Sequence>
      </Sequence>

      {/* 8,8–12,8 s · OPERADOR EN TIEMPO REAL, sobre video real */}
      <Sequence {...at(V4.geo)}>
        <Shot src="footage/IMG_3240.mp4" segs={[{from: 8.2, take: 2.4, rate: 0.6}]} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={120} dimAt={70} />
        <Headline4 text={''} kicker="GEOLOCALIZACIÓN EN TIEMPO REAL" dur={120} y={290} size={10} />
        <Sequence durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={sync('Pides tu grúa desde el celular,', [2, 1, 2, 2, 1, 3], 0.08, 1.54, -3, [2])} /></Sequence>
        <Sequence from={55} durationInFrames={65}><Caption4 dur={65} y={960} size={54} words={sync('y ves al operador en tiempo real.', [1, 1, 1, 4, 1, 2, 1], 1.87, 3.66, 55 - 3, [5, 6])} /></Sequence>
        <Sequence from={68} durationInFrames={52}><StatusCard dur={52} /></Sequence>
      </Sequence>

      {/* 12,8–17,3 s · TARIFA REAL sobre la grúa real con el SX4 cargado */}
      <Sequence from={V4.pricing[0] - 22} durationInFrames={V4.pricing[1] - V4.pricing[0] + 22}>
        <TruckWipe dur={22}>
          <Shot src="footage/IMG_3244.mp4" segs={[{from: 0.05, take: 2.6, rate: 0.5}]} look="warm" zoom={[1.08, 1.16]} origin="50% 45%" darken={0.55} blur={3} audio={0.3} />
          <Sequence from={22}><Pricing dur={135} /></Sequence>
        </TruckWipe>
      </Sequence>

      {/* 17,3–23,1 s · REDES SOCIALES → toque en el sitio web → demo de cotización */}
      <Sequence {...at(V4.socials)}>
        <AbsoluteFill style={{filter: 'blur(6px) brightness(0.5)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={174} zoom={[1.1, 1.2]} origin="45% 55%" />
        </AbsoluteFill>
        <Sequence durationInFrames={58}><SocialsBig dur={58} tapAt={42} /></Sequence>
        <Sequence from={54}><WebDemo dur={120} /></Sequence>
      </Sequence>

      {/* 23,1–27,1 s · EL CONSEJO: el equipo */}
      <Sequence {...at(V4.close)}>
        <Sequence durationInFrames={50}>
          <PersonShot person="equipo/operador-2.png" dur={50} bgSrc="footage/IMG_3239.mp4" bgSegs={[{from: 4.9, take: 0.9, rate: 0.5}]} width={1400} bottom={100} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        <Sequence from={50}>
          <PersonShot person="equipo/operador-1.png" dur={70} bgSrc="footage/IMG_3244.mp4" bgSegs={[{from: 1.0, take: 2.4, rate: 1}]} width={1400} bottom={10} label="ASISTENCIA 24/7" />
        </Sequence>
        <Sequence from={6} durationInFrames={44}><Caption4 dur={44} y={1040} words={sync('Guarda nuestro número', [2, 2, 3], 0.08, 0.99, 0, [2])} /></Sequence>
        <Sequence from={50} durationInFrames={68}><Caption4 dur={68} y={1080} words={sync('antes de necesitarlo.', [2, 1, 5], 1.54, 2.72, 50 - 6, [0, 1, 2])} /></Sequence>
      </Sequence>

      {/* 27,1–30,1 s · CTA con redes */}
      <Sequence {...at(V4.cta)}>
        <AbsoluteFill style={{filter: 'blur(12px)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.14]} origin="40% 55%" />
        </AbsoluteFill>
        <LogoReveal dur={90} />
      </Sequence>

      <Grain opacity={0.07} />

      {/* AUDIO: música con ducking bajo la voz + voz + SFX */}
      <Audio
        src={S(music)}
        volume={(f) =>
          interpolate(f, [0, 150, 156, 380, 390, 689, 699, 809, 817, 894, 904], [0.16, 0.2, 0.34, 0.34, 0.8, 0.8, 0.26, 0.26, 0.9, 0.6, 0], cl)
        }
      />
      {vo.hook && <Sequence from={3}><Audio src={S(vo.hook)} /></Sequence>}
      {vo.software && <Sequence from={V4.software[0] + 3}><Audio src={S(vo.software)} /></Sequence>}
      {vo.geo && <Sequence from={V4.geo[0] + 3}><Audio src={S(vo.geo)} /></Sequence>}
      {vo.close && <Sequence from={V4.close[0] + 6}><Audio src={S(vo.close)} /></Sequence>}
      <Sequence from={57}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.25} /></Sequence>
      <Sequence from={152}><Audio src={S('audio/sfx_impact.wav')} volume={0.85} /></Sequence>
      <Sequence from={160}><Audio src={S('audio/sfx_tick.wav')} volume={0.3} /></Sequence>
      <Sequence from={263}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={268}><Audio src={S('audio/sfx_map.wav')} volume={0.3} /></Sequence>
      {[345, 352, 359].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.24} /></Sequence>
      ))}
      <Sequence from={360}><Audio src={S('audio/sfx_rev.wav')} volume={0.7} /></Sequence>
      <Sequence from={370}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      {[403, 413, 425].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.26} /></Sequence>
      ))}
      <Sequence from={440}><Audio src={S('audio/sfx_map.wav')} volume={0.25} /></Sequence>
      <Sequence from={469}><Audio src={S("audio/sfx_impact.wav")} volume={0.55} /></Sequence>
      <Sequence from={518}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {[534, 543, 552].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_tick.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={810}><Audio src={S('audio/sfx_rev.wav')} volume={0.55} /></Sequence>
      {[562, 574 + 14, 574 + 32, 574 + 52, 574 + 66].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_tick.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={650}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={828}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
