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
  socials: [520, 610],
  close: [610, 730],
  cta: [730, 820],
} as const;
export const V4_TOTAL = 820;

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
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] =>
  s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));


export const ReelV4: React.FC<V4Props> = ({vo, music, place}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–5,2 s · PERSONA → el auto botado. Corte en la pausa de la voz, impacto en "esperar". */}
      <Sequence {...at(V4.hook)}>
        <Sequence durationInFrames={58}>
          <PersonShot person="equipo/operador-1.png" dur={58} bgSrc="footage/IMG_3240.mp4" bgSegs={[{from: 2.0, take: 2.0, rate: 1}]} width={1400} bottom={10} />
          <Caption4 dur={58} y={1080} words={w('Cuando quedas botado,', 4, 9, [2])} />
        </Sequence>
        <Sequence from={58}>
          <Shot src="footage/IMG_3232.mp4" segs={[{from: 1.0, take: 3.23, rate: 1}]} zoom={[1.14, 1.0]} origin="42% 58%" shake={5} />
          <Sequence from={4} durationInFrames={93}><Caption4 dur={93} y={1180} words={w('no tienes tiempo para esperar.', 0, 12, [3, 4])} /></Sequence>
        </Sequence>
      </Sequence>

      {/* 5,2–8,8 s · SOFTWARE DE IA propio */}
      <Sequence {...at(V4.software)}>
        <SoftwareShot dur={110} label={false} />
        <Sequence durationInFrames={48}><Caption4 dur={48} y={1520} size={52} words={w('Por eso creamos nuestro propio', 3, 7)} /></Sequence>
        <Sequence from={48} durationInFrames={62}><Caption4 dur={62} y={1520} size={52} words={w('software con inteligencia artificial.', 0, 8, [2, 3])} /></Sequence>
      </Sequence>

      {/* 8,8–12,8 s · OPERADOR EN TIEMPO REAL, sobre video real */}
      <Sequence {...at(V4.geo)}>
        <Shot src="footage/IMG_3240.mp4" segs={[{from: 8.2, take: 2.4, rate: 0.6}]} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={120} dimAt={70} />
        <Headline4 text={''} kicker="GEOLOCALIZACIÓN EN TIEMPO REAL" dur={120} y={290} size={10} />
        <Sequence durationInFrames={52}><Caption4 dur={52} y={960} size={54} words={w('Pides tu grúa desde el celular,', 3, 7, [2])} /></Sequence>
        <Sequence from={54} durationInFrames={66}><Caption4 dur={66} y={960} size={54} words={w('y ves al operador en tiempo real.', 0, 7, [5, 6])} /></Sequence>
        <Sequence from={68} durationInFrames={52}><StatusCard dur={52} /></Sequence>
      </Sequence>

      {/* 12,8–17,3 s · TARIFA REAL sobre la grúa real con el SX4 cargado */}
      <Sequence {...at(V4.pricing)}>
        <Shot src="footage/IMG_3244.mp4" segs={[{from: 0.4, take: 2.25, rate: 0.5}]} look="warm" zoom={[1.08, 1.16]} origin="50% 45%" darken={0.55} blur={3} audio={0.3} />
        <Pricing dur={135} />
      </Sequence>

      {/* 17,3–20,3 s · REDES SOCIALES sobre la grúa rotulada */}
      <Sequence {...at(V4.socials)}>
        <AbsoluteFill style={{filter: 'blur(6px) brightness(0.5)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.18]} origin="45% 55%" />
        </AbsoluteFill>
        <SocialsBig dur={90} />
      </Sequence>

      {/* 20,3–24,3 s · EL CONSEJO: el equipo */}
      <Sequence {...at(V4.close)}>
        <Sequence durationInFrames={50}>
          <PersonShot person="equipo/operador-2.png" dur={50} bgSrc="footage/IMG_3239.mp4" bgSegs={[{from: 4.9, take: 0.9, rate: 0.5}]} width={1400} bottom={100} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        <Sequence from={50}>
          <PersonShot person="equipo/operador-1.png" dur={70} bgSrc="footage/IMG_3244.mp4" bgSegs={[{from: 1.0, take: 2.4, rate: 1}]} width={1400} bottom={10} label="ASISTENCIA 24/7" />
        </Sequence>
        <Sequence from={7} durationInFrames={43}><Caption4 dur={43} y={1040} words={w('Guarda nuestro número', 0, 8, [2])} /></Sequence>
        <Sequence from={52} durationInFrames={66}><Caption4 dur={66} y={1080} words={w('antes de necesitarlo.', 0, 8, [0, 1, 2])} /></Sequence>
      </Sequence>

      {/* 24,3–27,3 s · CTA con redes */}
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
          interpolate(f, [0, 150, 156, 380, 390, 605, 615, 725, 733, 810, 820], [0.16, 0.2, 0.34, 0.34, 0.8, 0.8, 0.26, 0.26, 0.9, 0.6, 0], cl)
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
      <Sequence from={383}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      {[403, 413, 425].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.26} /></Sequence>
      ))}
      <Sequence from={440}><Audio src={S('audio/sfx_map.wav')} volume={0.25} /></Sequence>
      <Sequence from={469}><Audio src={S("audio/sfx_impact.wav")} volume={0.55} /></Sequence>
      <Sequence from={518}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {[534, 543, 552].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_tick.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={730}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
