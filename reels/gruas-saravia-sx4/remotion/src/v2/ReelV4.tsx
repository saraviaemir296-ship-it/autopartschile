import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {Grain, PhotoShot, Seg, Shot, segFrames} from './Shot';
import {PersonShot} from './PersonShot';
import {SoftwareShot} from './SoftwareShot';
import {AnimatedMap} from './MapOverlay';
import {StatusCard} from './ServiceStatus';
import {LogoReveal} from './LogoReveal';
import {VehicleInfo} from './VehicleInfo';
import {Caption4, Headline4, W} from './Type4';
import {cl} from './look';

/**
 * REEL V4 · 22 s. Orden: persona → software de IA → operador en tiempo real →
 * el servicio real (llegada, rescate, plano automotriz, detalles) → consejo → CTA.
 * Cada plano dura lo justo: nada sobre 3 s sin un cambio de imagen o de texto.
 */
export const V4 = {
  hook: [0, 75],
  software: [75, 135],
  geo: [135, 225],
  arrival: [225, 285],
  rescue: [285, 350],
  cinematic: [350, 410],
  details: [410, 485],
  close: [485, 605],
  cta: [605, 695],
} as const;
export const V4_TOTAL = 695;

export type V4Props = {
  /** Voz en off: un archivo por línea (o null). Tu voz real siempre tiene prioridad. */
  vo: {hook: string | null; software: string | null; geo: string | null; close: string | null};
  music: string;
  place: string;
};
export const v4Defaults: V4Props = {
  vo: {hook: null, software: null, geo: null, close: null},
  music: 'audio/music_v4.wav',
  place: 'SANTIAGO, CHILE',
};

const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const S = (f: string) => staticFile(f);
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] =>
  s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));

const ARR_A: Seg[] = [{from: 7.2, take: 1.5, rate: 1}];
const ARR_B: Seg[] = [{from: 3.3, take: 0.5, rate: 1}];
// Subida del auto comprimida a ~1,9 s: rápido → más rápido → un respiro lento al final.
const RAMP: Seg[] = [
  {from: 4.6, take: 0.6, rate: 1.5},
  {from: 5.4, take: 1.2, rate: 1.8},
  {from: 6.8, take: 0.6, rate: 0.75},
];
const CABLE: Seg[] = [{from: 4.7, take: 0.3, rate: 1}];
const HERO: Seg[] = [{from: 0.8, take: 1.8, rate: 0.9}];
const GEO_BG: Seg[] = [{from: 8.6, take: 1.8, rate: 0.6}];
const DETAILS: {src: string; seg: Seg[]; zoom: [number, number]; origin: string; look?: 'warm'}[] = [
  {src: 'footage/IMG_3240.mp4', seg: [{from: 1.0, take: 0.5, rate: 1}], zoom: [1.42, 1.5], origin: '22% 66%'},
  {src: 'footage/IMG_3239.mp4', seg: [{from: 3.5, take: 0.5, rate: 1}], zoom: [1.38, 1.44], origin: '55% 44%', look: 'warm'},
  {src: 'footage/IMG_3240.mp4', seg: [{from: 9.6, take: 0.5, rate: 1}], zoom: [1.32, 1.4], origin: '28% 74%'},
  {src: 'footage/IMG_3244.mp4', seg: [{from: 2.0, take: 0.5, rate: 1}], zoom: [1.34, 1.4], origin: '80% 46%', look: 'warm'},
];

export const ReelV4: React.FC<V4Props> = ({vo, music, place}) => {
  const rampF = segFrames(RAMP);
  const arrA = segFrames(ARR_A);
  const d = 15;
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–2,5 s · PERSONA: el operador a cámara */}
      <Sequence {...at(V4.hook)}>
        <PersonShot person="equipo/operador-1.png" dur={75} bgSrc="footage/IMG_3240.mp4" bgSegs={[{from: 2.0, take: 2.5, rate: 1}]} width={1400} bottom={10} />
        <Sequence durationInFrames={36}><Caption4 dur={36} y={1080} words={w('Cuando quedas botado,', 2, 6, [2])} /></Sequence>
        <Sequence from={36} durationInFrames={39}><Caption4 dur={39} y={1080} words={w('no tienes tiempo para esperar.', 0, 5, [3, 4])} /></Sequence>
      </Sequence>

      {/* 2,5–4,5 s · SOFTWARE DE IA propio */}
      <Sequence {...at(V4.software)}>
        <SoftwareShot dur={60} label={false} />
        <Caption4 dur={60} y={1520} size={52} words={w('Nuestro propio software con IA', 4, 4, [2, 3, 4])} />
      </Sequence>

      {/* 4,5–7,5 s · OPERADOR CON GEOLOCALIZACIÓN EN TIEMPO REAL, sobre video real */}
      <Sequence {...at(V4.geo)}>
        <Shot src="footage/IMG_3240.mp4" segs={GEO_BG} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={90} dimAt={48} />
        <Headline4 text={'Operador\nen tiempo real'} kicker="GEOLOCALIZACIÓN" dur={90} y={290} size={78} />
        <Sequence from={44} durationInFrames={46}><StatusCard dur={46} /></Sequence>
      </Sequence>

      {/* 7,5–9,5 s · LLEGADA al SX4 */}
      <Sequence {...at(V4.arrival)}>
        <Sequence durationInFrames={arrA}>
          <Shot src="footage/IMG_3232.mp4" segs={ARR_A} zoom={[1.04, 1.1]} origin="65% 45%" shake={4} audio={0.45} />
        </Sequence>
        <Sequence from={arrA}>
          <Shot src="footage/IMG_3239.mp4" segs={ARR_B} look="warm" zoom={[1.2, 1.26]} origin="56% 42%" audio={0.5} />
        </Sequence>
        <Sequence from={4} durationInFrames={56}><VehicleInfo dur={56} place={place} /></Sequence>
      </Sequence>

      {/* 9,5–13,5 s · RESCATE: speed ramp + cable */}
      <Sequence {...at(V4.rescue)}>
        <Sequence durationInFrames={rampF}>
          <Shot src="footage/IMG_3240.mp4" segs={RAMP} zoom={[1.04, 1.15]} origin="38% 62%" shake={2} />
        </Sequence>
        <Sequence from={rampF}>
          <Shot src="footage/IMG_3239.mp4" segs={CABLE} look="warm" zoom={[1.36, 1.42]} origin="56% 46%" audio={0.5} />
        </Sequence>
        <Sequence from={3} durationInFrames={60}><Headline4 text={'Rescate +\ntraslado'} dur={60} y={1150} size={96} /></Sequence>
      </Sequence>

      {/* 13,5–16,5 s · PLANO AUTOMOTRIZ */}
      <Sequence {...at(V4.cinematic)}>
        <Shot src="footage/IMG_3244.mp4" segs={HERO} look="warm" zoom={[1.0, 1.14]} pan={[-30, 16]} origin="55% 42%" audio={0.35} />
      </Sequence>

      {/* 16,5–19 s · DETALLES a ritmo (0,5 s c/u) + grúa rotulada */}
      <Sequence {...at(V4.details)}>
        {DETAILS.map((c, i) => (
          <Sequence key={i} from={i * d} durationInFrames={d}>
            <Shot src={c.src} segs={c.seg} look={c.look ?? 'natural'} zoom={c.zoom} origin={c.origin} shake={2} audio={0.4} />
          </Sequence>
        ))}
        <Sequence from={4 * d}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={15} zoom={[1.06, 1.12]} origin="30% 55%" />
        </Sequence>
      </Sequence>

      {/* 19–23 s · EL CONSEJO: el equipo */}
      <Sequence {...at(V4.close)}>
        <Sequence durationInFrames={60}>
          <PersonShot person="equipo/operador-2.png" dur={60} bgSrc="footage/IMG_3239.mp4" bgSegs={[{from: 4.9, take: 1.0, rate: 0.5}]} width={1400} bottom={100} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        <Sequence from={60}>
          <PersonShot person="equipo/operador-1.png" dur={60} bgSrc="footage/IMG_3244.mp4" bgSegs={[{from: 1.0, take: 2.0, rate: 1}]} width={1400} bottom={10} label="ASISTENCIA 24/7" />
        </Sequence>
        <Sequence from={6} durationInFrames={54}><Caption4 dur={54} y={1040} words={w('Guarda nuestro número', 0, 6, [2])} /></Sequence>
        <Sequence from={60} durationInFrames={58}><Caption4 dur={58} y={1080} words={w('antes de necesitarlo.', 0, 6, [0, 1, 2])} /></Sequence>
      </Sequence>

      {/* 23–25 s · CTA */}
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
        volume={(f) => interpolate(f, [0, 72, 76, 475, 487, 601, 609, 685, 695], [0.2, 0.25, 0.75, 0.75, 0.35, 0.35, 0.9, 0.6, 0], cl)}
      />
      {vo.hook && <Sequence from={0}><Audio src={S(vo.hook)} /></Sequence>}
      {vo.software && <Sequence from={V4.software[0] + 2}><Audio src={S(vo.software)} /></Sequence>}
      {vo.geo && <Sequence from={V4.geo[0] + 2}><Audio src={S(vo.geo)} /></Sequence>}
      {vo.close && <Sequence from={V4.close[0] + 6}><Audio src={S(vo.close)} /></Sequence>}
      <Sequence from={73}><Audio src={S('audio/sfx_impact.wav')} volume={0.85} /></Sequence>
      <Sequence from={80}><Audio src={S('audio/sfx_tick.wav')} volume={0.35} /></Sequence>
      <Sequence from={133}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={138}><Audio src={S('audio/sfx_map.wav')} volume={0.35} /></Sequence>
      {[190, 197, 204].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.28} /></Sequence>
      ))}
      <Sequence from={224}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      <Sequence from={225 + arrA}><Audio src={S('audio/sfx_metal.wav')} volume={0.35} /></Sequence>
      <Sequence from={296}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={285 + rampF}><Audio src={S('audio/sfx_metal.wav')} volume={0.4} /></Sequence>
      <Sequence from={409}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.25} /></Sequence>
      {[425, 455].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_metal.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={605}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
