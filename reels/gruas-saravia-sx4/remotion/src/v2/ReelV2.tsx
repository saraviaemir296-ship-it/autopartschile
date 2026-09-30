import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {Grain, Letterbox, Seg, Shot, segFrames} from './Shot';
import {Sub, TextReveal} from './TextReveal';
import {VehicleInfo} from './VehicleInfo';
import {AnimatedMap} from './MapOverlay';
import {ServiceCard, StatusCard} from './ServiceStatus';
import {LogoReveal} from './LogoReveal';
import {cl} from './look';

/**
 * REEL V2 · "Cuando quedas botado" — 981 frames (32,7 s) a 30 fps.
 * Regla: más video real, menos gráfica. Cada texto tiene una sola función.
 */
export const V2 = {
  hook: [0, 90],
  arrival: [90, 210],
  rescue: [210, 390],
  cinematic: [390, 540],
  tech: [540, 675],
  details: [675, 780],
  close: [780, 921],
  cta: [921, 981],
} as const;
export const V2_TOTAL = 981;

export type V2Props = {
  /** Voz: tres archivos (o null). Tu voz real siempre tiene prioridad. */
  voHook: string | null;
  voMid: string | null;
  voClose: string | null;
  music: string;
  place: string;
};
export const v2Defaults: V2Props = {
  voHook: null,
  voMid: null,
  voClose: null,
  music: 'audio/music_fallback.wav',
  place: 'SANTIAGO, CHILE',
};

const at = (range: readonly [number, number]) => ({from: range[0], durationInFrames: range[1] - range[0]});
const S = (f: string) => staticFile(f);

// Tramos de material real (segundos del archivo original)
const HOOK: Seg[] = [{from: 1.0, take: 3.0, rate: 1}];
const ARR_A: Seg[] = [{from: 7.0, take: 2.0, rate: 1}];
const ARR_B: Seg[] = [{from: 3.1, take: 1.0, rate: 1}];
const ARR_C: Seg[] = [{from: 0.2, take: 1.0, rate: 1}];
const RAMP: Seg[] = [
  {from: 4.3, take: 1.0, rate: 1.0}, // 100 %
  {from: 5.3, take: 1.4, rate: 1.4}, // 140 %
  {from: 6.7, take: 1.2, rate: 0.6}, // 60 %
  {from: 7.9, take: 1.0, rate: 1.0}, // 100 %
];
const CABLE: Seg[] = [{from: 4.6, take: 1.0, rate: 1}];
const HERO: Seg[] = [{from: 0.3, take: 3.75, rate: 0.75}];
const TECH_BG: Seg[] = [{from: 8.1, take: 2.7, rate: 0.6}];
const DETAILS: {src: string; seg: Seg[]; zoom: [number, number]; origin: string; look?: 'warm'}[] = [
  {src: 'footage/IMG_3240.mp4', seg: [{from: 1.0, take: 0.7, rate: 1}], zoom: [1.42, 1.5], origin: '22% 66%'}, // neumático
  {src: 'footage/IMG_3239.mp4', seg: [{from: 3.5, take: 0.7, rate: 1}], zoom: [1.38, 1.44], origin: '55% 44%', look: 'warm'}, // winche
  {src: 'footage/IMG_3240.mp4', seg: [{from: 9.6, take: 0.7, rate: 1}], zoom: [1.32, 1.4], origin: '28% 74%'}, // plataforma
  {src: 'footage/IMG_3244.mp4', seg: [{from: 2.0, take: 0.7, rate: 1}], zoom: [1.34, 1.4], origin: '80% 46%', look: 'warm'}, // cabina + baliza
  {src: 'footage/IMG_3244.mp4', seg: [{from: 3.2, take: 0.7, rate: 1}], zoom: [1.02, 1.07], origin: '50% 50%', look: 'warm'}, // lista para salir
];
const CLOSE: Seg[] = [{from: 4.9, take: 2.35, rate: 0.5}];
const CTA_BG: Seg[] = [{from: 10.0, take: 0.95, rate: 0.5}];

export const ReelV2: React.FC<V2Props> = ({voHook, voMid, voClose, music, place}) => {
  const rampF = segFrames(RAMP);
  const arrA = segFrames(ARR_A);
  const arrB = segFrames(ARR_B);
  const d = 21;
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* ───── 0–3 s · HOOK: el SX4 solo en la vereda + voz. Corte duro en "esperar". */}
      <Sequence {...at(V2.hook)}>
        <Shot src="footage/IMG_3232.mp4" segs={HOOK} zoom={[1.0, 1.08]} origin="42% 58%" shake={5} />
        <Sequence from={3} durationInFrames={43}><Sub text="Cuando alguien queda botado," dur={43} /></Sequence>
        <Sequence from={46} durationInFrames={44}><Sub text="no tiene tiempo para esperar." dur={44} /></Sequence>
      </Sequence>

      {/* ───── 3–7 s · LLEGADA + ficha editorial */}
      <Sequence {...at(V2.arrival)}>
        <Sequence durationInFrames={arrA}>
          <Shot src="footage/IMG_3232.mp4" segs={ARR_A} zoom={[1.02, 1.08]} origin="65% 45%" shake={4} audio={0.45} />
        </Sequence>
        <Sequence from={arrA} durationInFrames={arrB}>
          <Shot src="footage/IMG_3239.mp4" segs={ARR_B} look="warm" zoom={[1.1, 1.16]} origin="56% 42%" shake={3} audio={0.5} />
        </Sequence>
        <Sequence from={arrA + arrB}>
          <Shot src="footage/IMG_3239.mp4" segs={ARR_C} look="warm" zoom={[1.06, 1.0]} origin="50% 50%" shake={3} audio={0.4} />
        </Sequence>
        <Sequence from={10} durationInFrames={108}><VehicleInfo dur={108} place={place} /></Sequence>
      </Sequence>

      {/* ───── 7–13 s · RESCATE: speed ramp 100→140→60→100 + cable */}
      <Sequence {...at(V2.rescue)}>
        <Sequence durationInFrames={rampF}>
          <Shot src="footage/IMG_3240.mp4" segs={RAMP} zoom={[1.04, 1.15]} origin="38% 62%" shake={2} />
        </Sequence>
        <Sequence from={rampF}>
          <Shot src="footage/IMG_3239.mp4" segs={CABLE} look="warm" zoom={[1.36, 1.42]} origin="56% 46%" audio={0.5} />
        </Sequence>
        <Sequence from={12} durationInFrames={80}><TextReveal text={'RESCATE + TRASLADO'} dur={80} y={1320} size={60} weight={700} upper tracking="0.06em" /></Sequence>
        <Sequence from={102} durationInFrames={76}><TextReveal text="Sin complicaciones." dur={76} y={1320} size={64} weight={500} /></Sequence>
      </Sequence>

      {/* ───── 13–18 s · PLANO AUTOMOTRIZ: push-in lento, crop cinematográfico, grano. Sin texto. */}
      <Sequence {...at(V2.cinematic)}>
        <Shot src="footage/IMG_3244.mp4" segs={HERO} look="warm" zoom={[1.0, 1.16]} pan={[-34, 18]} origin="55% 42%" audio={0.35} />
        <Letterbox size={170} dur={150} />
      </Sequence>

      {/* ───── 18–22,5 s · software Grúas Saravia sobre video real: mapa en perspectiva + estado + tarjeta */}
      <Sequence {...at(V2.tech)}>
        <Shot src="footage/IMG_3240.mp4" segs={TECH_BG} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.42} blur={1.5} />
        <AnimatedMap dur={135} dimAt={58} />
        <Sequence from={6} durationInFrames={126}><ServiceCard dur={126} /></Sequence>
        <Sequence from={60} durationInFrames={58}><StatusCard dur={58} /></Sequence>
      </Sequence>

      {/* ───── 22,5–26 s · DETALLES a ritmo + voz "Desde que nos contactas…" */}
      <Sequence {...at(V2.details)}>
        {DETAILS.map((c, i) => (
          <Sequence key={i} from={i * d} durationInFrames={d}>
            <Shot src={c.src} segs={c.seg} look={c.look ?? 'natural'} zoom={c.zoom} origin={c.origin} shake={2} audio={0.4} />
          </Sequence>
        ))}
        <Sequence from={3} durationInFrames={48}><Sub text="Desde que nos contactas," dur={48} /></Sequence>
        <Sequence from={51} durationInFrames={54}><Sub text="hasta que tu vehículo llega a destino." dur={54} /></Sequence>
      </Sequence>

      {/* ───── 26–30,7 s · CIERRE: el consejo */}
      <Sequence {...at(V2.close)}>
        <Shot src="footage/IMG_3239.mp4" segs={CLOSE} look="warm" zoom={[1.0, 1.07]} origin="50% 48%" shake={3} audio={0.3} />
        <Sequence from={4} durationInFrames={44}><Sub text="Si algún día necesitas una grúa," dur={44} /></Sequence>
        <Sequence from={48} durationInFrames={52}><Sub text="quiero que tengas un número guardado" dur={52} /></Sequence>
        <Sequence from={100} durationInFrames={41}><Sub text="antes de necesitarlo." dur={41} /></Sequence>
      </Sequence>

      {/* ───── 30,7–32,7 s · CTA sobre la grúa desenfocada (2 s) */}
      <Sequence {...at(V2.cta)}>
        <Shot src="footage/IMG_3240.mp4" segs={CTA_BG} zoom={[1.12, 1.16]} origin="50% 50%" blur={14} />
        <LogoReveal dur={60} />
      </Sequence>

      <Grain opacity={0.08} />

      {/* ───── AUDIO */}
      <Audio
        src={S(music)}
        volume={(f) =>
          interpolate(f, [0, 88, 92, 660, 675, 780, 790, 915, 925, 975, 981], [0.18, 0.22, 0.85, 0.85, 0.45, 0.5, 0.32, 0.32, 0.9, 0.7, 0], cl)
        }
      />
      {voHook && <Sequence from={0}><Audio src={S(voHook)} /></Sequence>}
      {voMid && <Sequence from={V2.details[0] + 2}><Audio src={S(voMid)} /></Sequence>}
      {voClose && <Sequence from={V2.close[0] + 3}><Audio src={S(voClose)} /></Sequence>}
      {/* SFX sincronizados */}
      <Sequence from={88}><Audio src={S('audio/sfx_impact.wav')} volume={0.9} /></Sequence>
      <Sequence from={90 + arrA}><Audio src={S('audio/sfx_metal.wav')} volume={0.35} /></Sequence>
      <Sequence from={209}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={236}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={210 + rampF}><Audio src={S('audio/sfx_metal.wav')} volume={0.4} /></Sequence>
      <Sequence from={538}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.25} /></Sequence>
      <Sequence from={546}><Audio src={S('audio/sfx_map.wav')} volume={0.35} /></Sequence>
      <Sequence from={576}><Audio src={S('audio/sfx_tick.wav')} volume={0.4} /></Sequence>
      {[606, 613, 620].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.28} /></Sequence>
      ))}
      <Sequence from={675}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={696}><Audio src={S('audio/sfx_metal.wav')} volume={0.3} /></Sequence>
      <Sequence from={921}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
