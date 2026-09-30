import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {T} from '../timeline';
import {Clip, clipFrames} from '../components/Footage';
import {Caption, Headline, Kicker, Line} from '../components/Caption';
import {TalkingHead} from '../components/TalkingHead';
import {SceneCallout} from '../components/SceneCallout';
import {VehicleCard} from '../components/VehicleCard';
import {AnimatedMap} from '../components/AnimatedMap';
import {SALVIInterface} from '../components/SALVIInterface';
import {CTAFinal} from '../components/CTAFinal';

export type ReelProps = {
  /** 'talking-head/HOOK.mp4' cuando lo grabes; null = placeholder */
  hookSrc: string | null;
  closeSrc: string | null;
  /** Solo si es verdad. Si el SX4 no fue un llamado de cliente, cambia el texto. */
  callText: string;
  etaMinutes?: number;
  /**
   * Voz en off (p. ej. voz chilena generada): 'vo/HOOK.mp3' y 'vo/CIERRE.mp3'.
   * Si hay VO y no hay toma a cámara, el hook y el cierre se montan sobre
   * material real en vez del placeholder.
   */
  hookVo?: string | null;
  closeVo?: string | null;
  /** segundos a recortar al inicio de cada VO (silencio del TTS) */
  hookVoTrim?: number;
  closeVoTrim?: number;
};

export const reelDefaults: ReelProps = {
  hookSrc: null,
  closeSrc: null,
  callText: 'Nos llamaron por un Suzuki SX4.',
  hookVo: null,
  closeVo: null,
  hookVoTrim: 0,
  closeVoTrim: 0,
};

// Subtítulos: tiempos estimados a ritmo conversacional; ajústalos a tu toma real.
const HOOK_LINES: Line[] = [
  {start: 0, end: 34, words: [{t: 'Cuando', at: 0}, {t: 'alguien', at: 6}, {t: 'queda', at: 13, hi: true}, {t: 'botado,', at: 20, hi: true}]},
  {start: 34, end: 60, words: [{t: 'no', at: 34, hi: true}, {t: 'tiene', at: 39, hi: true}, {t: 'tiempo', at: 46, hi: true}]},
  {start: 60, end: 90, words: [{t: 'para', at: 60}, {t: 'esperar.', at: 66, hi: true}]},
];
const CLOSE_LINES: Line[] = [
  {start: 0, end: 40, words: [{t: 'Si', at: 0}, {t: 'algún', at: 5}, {t: 'día', at: 11}, {t: 'necesitas', at: 17}, {t: 'una', at: 28}, {t: 'grúa,', at: 32}]},
  {start: 40, end: 66, words: [{t: 'quiero', at: 42}, {t: 'que', at: 50}, {t: 'tengas', at: 55}]},
  {start: 66, end: 104, words: [{t: 'un', at: 66, hi: true}, {t: 'número', at: 71, hi: true}, {t: 'guardado', at: 82, hi: true}]},
  {start: 104, end: 150, words: [{t: 'antes', at: 106}, {t: 'de', at: 114}, {t: 'necesitarlo.', at: 119}]},
];

// Clips (segundos del archivo original). Ver docs/03-timeline.md para el porqué de cada elección.
const B1 = [{from: 7.0, take: 2.0, rate: 1}];
const B2 = [{from: 3.1, take: 1.2, rate: 1}];
const B3 = [{from: 0.2, take: 0.8, rate: 1}];
const C1 = [
  {from: 4.8, take: 1.0, rate: 1.0},
  {from: 5.8, take: 1.6, rate: 1.6},
  {from: 7.4, take: 1.4, rate: 0.7},
];
const C2 = [{from: 9.4, take: 1.4, rate: 0.7}];
const D1 = [{from: 0.3, take: 3.9, rate: 0.65}];
const E1 = [{from: 1.0, take: 1.3, rate: 1}];
const E2 = [{from: 3.3, take: 1.3, rate: 1}];
const E3 = [{from: 1.6, take: 1.3, rate: 1}];
// B-roll para la versión con voz en off: SX4 solo junto a la vereda ("botado")
// y plano abierto final junto a la grúa, en cámara lenta.
const HOOK_BROLL = [{from: 1.0, take: 3.0, rate: 1}];
const CLOSE_BROLL = [{from: 4.8, take: 2.5, rate: 0.5}];

export const ReelSX4: React.FC<ReelProps> = ({
  hookSrc,
  closeSrc,
  callText,
  etaMinutes,
  hookVo,
  closeVo,
  hookVoTrim = 0,
  closeVoTrim = 0,
}) => {
  const b1 = clipFrames(B1);
  const b2 = clipFrames(B2);
  const c1 = clipFrames(C1);
  const e = clipFrames(E1);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* 0–3 s · GANCHO — tú a cámara, sin intro */}
      <Sequence from={T.hook.start} durationInFrames={T.hook.dur}>
        {!hookSrc && hookVo ? (
          <Clip src="footage/IMG_3232.mp4" segments={HOOK_BROLL} zoom={[1.12, 1.0]} origin="40% 55%" />
        ) : (
          <TalkingHead src={hookSrc} label="HOOK · plano medio-corto a cámara: “Cuando alguien queda botado, no tiene tiempo para esperar.”" />
        )}
        {hookVo && <Audio src={staticFile(hookVo)} startFrom={Math.round(hookVoTrim * 30)} />}
        <Caption lines={HOOK_LINES} />
      </Sequence>

      {/* 3–7 s · LLEGADA / PRESENTACIÓN */}
      <Sequence from={T.arrival.start} durationInFrames={T.arrival.dur}>
        <Sequence durationInFrames={b1}>
          <Clip src="footage/IMG_3232.mp4" segments={B1} zoom={[1.0, 1.06]} origin="62% 45%" muted={false} volume={0.35} />
        </Sequence>
        <Sequence from={b1} durationInFrames={b2}>
          <Clip src="footage/IMG_3239.mp4" segments={B2} look="vivid" zoom={[1.08, 1.14]} origin="58% 42%" muted={false} volume={0.35} />
        </Sequence>
        <Sequence from={b1 + b2}>
          <Clip src="footage/IMG_3232.mp4" segments={B3} zoom={[1.1, 1.04]} origin="45% 60%" muted={false} volume={0.35} />
        </Sequence>
        <Sequence from={6} durationInFrames={T.arrival.dur - 10}>
          <Kicker text={callText} duration={T.arrival.dur - 10} y={1340} />
        </Sequence>
      </Sequence>

      {/* 7–13 s · RESCATE — speed ramp 100 → 160 → 70 % */}
      <Sequence from={T.rescue.start} durationInFrames={T.rescue.dur}>
        <Sequence durationInFrames={c1}>
          <Clip src="footage/IMG_3240.mp4" segments={C1} zoom={[1.05, 1.16]} origin="38% 62%" />
        </Sequence>
        <Sequence from={c1}>
          <Clip src="footage/IMG_3240.mp4" segments={C2} zoom={[1.02, 1.08]} origin="50% 55%" />
        </Sequence>
        <Sequence from={12} durationInFrames={96}>
          <Headline text={"RESCATE +\nTRASLADO SEGURO"} upper size={64} duration={96} y={1190} tracking="0.03em" />
        </Sequence>
        <Sequence from={c1 + 6} durationInFrames={T.rescue.dur - c1 - 6}>
          <Headline text="Sin complicaciones." weight={600} size={76} duration={T.rescue.dur - c1 - 6} y={1250} />
        </Sequence>
      </Sequence>

      {/* 13–19 s · PLANO CINEMATOGRÁFICO — push-in + paralaje lateral sutil */}
      <Sequence from={T.cinematic.start} durationInFrames={T.cinematic.dur}>
        <Clip src="footage/IMG_3244.mp4" segments={D1} look="vivid" zoom={[1.0, 1.14]} pan={[[0, 0], [-28, 18]]} origin="55% 40%" />
        <Sequence from={12} durationInFrames={78}>
          <Headline text="Desde el primer contacto" weight={600} size={62} duration={78} y={1260} />
        </Sequence>
        <Sequence from={96} durationInFrames={80}>
          <Headline text="hasta la entrega." weight={800} size={72} duration={80} y={1260} />
        </Sequence>
      </Sequence>

      {/* 19–23 s · TECNOLOGÍA — textos anclados a detalles reales */}
      <Sequence from={T.tech.start} durationInFrames={T.tech.dur}>
        <Sequence durationInFrames={e}>
          <Clip src="footage/IMG_3240.mp4" segments={E1} zoom={[1.4, 1.48]} origin="22% 64%" />
          <SceneCallout text="Cotización rápida." anchor={[300, 1180]} label={[400, 900]} duration={e} drift={[-10, 6]} />
        </Sequence>
        <Sequence from={e} durationInFrames={e}>
          <Clip src="footage/IMG_3239.mp4" segments={E2} look="vivid" zoom={[1.35, 1.42]} origin="55% 40%" />
          <SceneCallout text="Ubicación en tiempo real." anchor={[615, 960]} label={[72, 1160]} duration={e} drift={[4, -6]} />
        </Sequence>
        <Sequence from={e * 2} durationInFrames={e}>
          <Clip src="footage/IMG_3244.mp4" segments={E3} look="vivid" zoom={[1.3, 1.36]} origin="45% 38%" />
          <SceneCallout text="Seguimiento del servicio." anchor={[540, 760]} label={[72, 1060]} duration={e} drift={[-6, 4]} />
          <VehicleCard duration={e} x={72} y={300} />
        </Sequence>
      </Sequence>

      {/* 23–26 s · MAPA + INTERFAZ SALVI (conceptual) */}
      <Sequence from={T.map.start} durationInFrames={T.map.dur}>
        <AnimatedMap duration={T.map.dur} etaMinutes={etaMinutes} sheetAt={40} />
        <Sequence from={40}>
          <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 440}}>
            <SALVIInterface duration={T.map.dur - 40} width={900} />
          </AbsoluteFill>
        </Sequence>
      </Sequence>

      {/* 26–31 s · CIERRE HUMANO */}
      <Sequence from={T.close.start} durationInFrames={T.close.dur}>
        {!closeSrc && closeVo ? (
          <Clip src="footage/IMG_3239.mp4" segments={CLOSE_BROLL} look="vivid" zoom={[1.0, 1.08]} origin="50% 45%" />
        ) : (
          <TalkingHead src={closeSrc} label="CIERRE · a cámara, tranquilo: “Si algún día necesitas una grúa, quiero que tengas un número guardado antes de necesitarlo.”" />
        )}
        {closeVo && <Audio src={staticFile(closeVo)} startFrom={Math.round(closeVoTrim * 30)} />}
        <Caption lines={CLOSE_LINES} />
      </Sequence>

      {/* 31–33.5 s · CTA */}
      <Sequence from={T.cta.start} durationInFrames={T.cta.dur}>
        <CTAFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
