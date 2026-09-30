import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {Grain, PhotoShot, Shot} from './Shot';
import {PersonShot} from './PersonShot';
import {AnimatedMap} from './MapOverlay';
import {StatusCard} from './ServiceStatus';
import {LogoReveal} from './LogoReveal';
import {Caption4, Headline4, W} from './Type4';
import {cl} from './look';
import {Pricing, SocialsBig} from './Pricing';
import {TruckWipe} from './TruckAccel';
import {WebDemo} from './WebDemo';
import {Coverage} from './Coverage';

/**
 * REEL V4 · 28,1 s, cuadrado a la voz en off. Orden: persona → software de IA → operador en tiempo real →
 * el servicio real (llegada, rescate, plano automotriz, detalles) → consejo → CTA.
 * Cada plano dura lo justo: nada sobre 3 s sin un cambio de imagen o de texto.
 */
export const V4 = {
  hook: [0, 95],
  software: [95, 205],
  geo: [205, 325],
  rescue: [325, 370],
  pricing: [370, 475],
  coverage: [475, 550],
  socials: [550, 620],
  close: [620, 740],
  cta: [740, 830],
} as const;
export const V4_TOTAL = 830;

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
      {/* 0–3,2 s · PERSONA → el auto botado. Corte en la pausa de la voz, impacto en "esperar". */}
      <Sequence {...at(V4.hook)}>
        <Sequence durationInFrames={40}>
          <PersonShot person="equipo/operador-1.png" dur={40} bgSrc="footage/IMG_3240.mp4" bgSegs={[{from: 2.0, take: 1.4, rate: 1}]} width={1400} bottom={10} />
          <Caption4 dur={40} y={1080} words={sync('Cuando quedas botado,', [2, 2, 3], 0.08, 1.24, -3, [2])} />
        </Sequence>
        <Sequence from={40}>
          <Shot src="footage/IMG_3232.mp4" segs={[{from: 1.0, take: 1.85, rate: 1}]} zoom={[1.12, 1.0]} origin="42% 58%" shake={5} />
          <Caption4 dur={55} y={1180} words={sync('no tienes tiempo para esperar.', [1, 2, 2, 2, 3], 1.3, 2.89, 40 - 3, [3, 4])} />
        </Sequence>
      </Sequence>

      {/* 3,2–6,8 s · SOFTWARE DE IA propio */}
      <Sequence {...at(V4.software)}>
        <AbsoluteFill style={{filter: 'blur(8px) brightness(0.45)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={110} zoom={[1.15, 1.22]} origin="45% 55%" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: 'translateY(-40px) scale(0.84)', transformOrigin: '50% 0%'}}>
          <WebDemo dur={110} label={false} />
        </AbsoluteFill>
        <Sequence durationInFrames={50}><Caption4 dur={50} y={1330} size={50} words={sync('Por eso creamos nuestro propio', [1, 3, 3, 2, 2], 0.02, 1.56, -3)} /></Sequence>
        <Sequence from={50} durationInFrames={60}><Caption4 dur={60} y={1330} size={50} words={sync('software con inteligencia artificial.', [2, 1, 5, 5], 1.56, 3.4, 50 - 3, [2, 3])} /></Sequence>
      </Sequence>

      {/* 6,8–10,8 s · OPERADOR EN TIEMPO REAL, sobre video real */}
      <Sequence {...at(V4.geo)}>
        <Shot src="footage/IMG_3240.mp4" segs={[{from: 8.2, take: 2.4, rate: 0.6}]} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={120} dimAt={70} />
        <Headline4 text={''} kicker="GEOLOCALIZACIÓN EN TIEMPO REAL" dur={120} y={290} size={10} />
        <Sequence durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={sync('Pides tu grúa desde el celular,', [2, 1, 2, 2, 1, 3], 0.08, 1.54, -3, [2])} /></Sequence>
        <Sequence from={55} durationInFrames={65}><Caption4 dur={65} y={960} size={54} words={sync('y ves al operador en tiempo real.', [1, 1, 1, 4, 1, 2, 1], 1.87, 3.66, 55 - 3, [5, 6])} /></Sequence>
        <Sequence from={68} durationInFrames={52}><StatusCard dur={52} /></Sequence>
      </Sequence>

      {/* 10,8–12,3 s · SERVICIO REAL: golpe de la subida del SX4 */}
      <Sequence {...at(V4.rescue)}>
        <Shot src="footage/IMG_3240.mp4" segs={[{from: 4.6, take: 0.6, rate: 1.5}, {from: 5.4, take: 1.2, rate: 1.8}, {from: 6.8, take: 0.4, rate: 0.9}]} zoom={[1.06, 1.16]} origin="38% 62%" shake={3} />
        <Headline4 text={'Rescate +\ntraslado'} dur={45} y={1150} size={96} />
      </Sequence>

      {/* 12,3–15,8 s · TARIFA REAL (entra con el camión acelerando) */}
      <Sequence from={V4.pricing[0] - 22} durationInFrames={V4.pricing[1] - V4.pricing[0] + 22}>
        <TruckWipe dur={22}>
          <Shot src="footage/IMG_3244.mp4" segs={[{from: 0.05, take: 2.12, rate: 0.5}]} look="warm" zoom={[1.08, 1.16]} origin="50% 45%" darken={0.55} blur={3} audio={0.3} />
          <Sequence from={22}><Pricing dur={105} /></Sequence>
        </TruckWipe>
      </Sequence>

      {/* 15,8–18,3 s · COBERTURA: todo Santiago */}
      <Sequence {...at(V4.coverage)}>
        <Shot src="footage/IMG_3232.mp4" segs={[{from: 10.5, take: 1.25, rate: 0.5}]} zoom={[1.15, 1.2]} origin="50% 40%" darken={0.6} blur={4} />
        <Coverage dur={75} />
      </Sequence>

      {/* 18,3–20,7 s · REDES */}
      <Sequence {...at(V4.socials)}>
        <AbsoluteFill style={{filter: 'blur(6px) brightness(0.5)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={70} zoom={[1.1, 1.16]} origin="45% 55%" />
        </AbsoluteFill>
        <SocialsBig dur={70} />
      </Sequence>

      {/* 20,7–24,7 s · EL CONSEJO: el equipo */}
      <Sequence {...at(V4.close)}>
        {/* "Guarda nuestro número…" → el equipo, cortes rápidos */}
        <Sequence durationInFrames={25}>
          <PersonShot person="equipo/operador-2.png" dur={25} bgSrc="footage/IMG_3239.mp4" bgSegs={[{from: 4.9, take: 0.45, rate: 0.5}]} width={1400} bottom={100} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        <Sequence from={25} durationInFrames={25}>
          <PersonShot person="equipo/operador-1.png" dur={25} bgSrc="footage/IMG_3244.mp4" bgSegs={[{from: 1.0, take: 0.85, rate: 1}]} width={1400} bottom={10} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        {/* "…antes de necesitarlo." → cierra otro integrante del equipo */}
        <Sequence from={50}>
          <PersonShot person="equipo/dueno.png" dur={70} bgSrc="footage/IMG_3240.mp4" bgSegs={[{from: 9.4, take: 1.2, rate: 0.5}]} width={1150} bottom={-140} label="EQUIPO GRÚAS SARAVIA" />
        </Sequence>
        <Sequence from={6} durationInFrames={44}><Caption4 dur={44} y={1040} words={sync('Guarda nuestro número', [2, 2, 3], 0.08, 0.99, 0, [2])} /></Sequence>
        <Sequence from={50} durationInFrames={70}><Caption4 dur={70} y={960} words={sync('antes de necesitarlo.', [2, 1, 5], 1.54, 2.72, 50 - 6, [0, 1, 2])} /></Sequence>
      </Sequence>

      {/* 24,7–27,7 s · CTA con WhatsApp y redes */}
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
          interpolate(f, [0, 88, 94, 320, 330, 615, 625, 735, 743, 820, 830], [0.16, 0.2, 0.34, 0.34, 0.8, 0.8, 0.26, 0.26, 0.9, 0.6, 0], cl)
        }
      />
      {vo.hook && <Sequence from={3}><Audio src={S(vo.hook)} /></Sequence>}
      {vo.software && <Sequence from={V4.software[0] + 3}><Audio src={S(vo.software)} /></Sequence>}
      {vo.geo && <Sequence from={V4.geo[0] + 3}><Audio src={S(vo.geo)} /></Sequence>}
      {vo.close && <Sequence from={V4.close[0] + 6}><Audio src={S(vo.close)} /></Sequence>}
      <Sequence from={39}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.25} /></Sequence>
      <Sequence from={89}><Audio src={S('audio/sfx_impact.wav')} volume={0.85} /></Sequence>
      {/* toques en la demo de la web (x0,84 de escala, mismos tiempos) */}
      {[14, 32, 52, 66].map((f) => (
        <Sequence key={f} from={95 + f}><Audio src={S('audio/sfx_tick.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={95 + 76}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={203}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={208}><Audio src={S('audio/sfx_map.wav')} volume={0.3} /></Sequence>
      {[285, 292, 299].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.24} /></Sequence>
      ))}
      <Sequence from={324}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      <Sequence from={336}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={344}><Audio src={S('audio/sfx_rev.wav')} volume={0.7} /></Sequence>
      <Sequence from={354}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      {[388, 398, 410].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_blip.wav')} volume={0.26} /></Sequence>
      ))}
      <Sequence from={425}><Audio src={S('audio/sfx_map.wav')} volume={0.25} /></Sequence>
      <Sequence from={454}><Audio src={S('audio/sfx_impact.wav')} volume={0.55} /></Sequence>
      <Sequence from={478}><Audio src={S('audio/sfx_map.wav')} volume={0.35} /></Sequence>
      <Sequence from={548}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {[564, 573, 582].map((f) => (
        <Sequence key={f} from={f}><Audio src={S('audio/sfx_tick.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={736}><Audio src={S('audio/sfx_rev.wav')} volume={0.55} /></Sequence>
      <Sequence from={754}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
