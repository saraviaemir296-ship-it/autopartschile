import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain, PhotoShot, Shot} from '../v2/Shot';
import {LogoReveal} from '../v2/LogoReveal';
import {Caption4, Headline4, MONT, W} from '../v2/Type4';
import {K, cl} from '../v2/look';

/* Grúas Saravia — video de humor: "rescatamos al cosomóvil en panne por sobrepeso".
   Estilo de los reels de Grúas Saravia (titulares itálicos, subtítulos palabra a palabra,
   cierre con logo y WhatsApp). Patente del auto pixelada en todo el video.
   `literal`: true dice "cocaína"; por defecto usa el chiste chileno de la "harina"
   (mismo remate, menos riesgo de que las redes limiten el video por mencionar drogas). */

const SRC = 'swift/coso_anon.mp4';
const T = {hook: [0, 90], zoom: [90, 140], freeze: [140, 200], vuelta: [200, 275], remate: [275, 345], cta: [345, 435]} as const;
export const COSO_TOTAL = 435;
const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] => s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));

/* congelado "carga sospechosa": círculo rojo dibujado a mano + sello */
const Sospecha: React.FC<{literal: boolean}> = ({literal}) => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [4, 16], [0, 1], cl);
  const stamp = spring({frame: f - 14, fps: 30, config: {damping: 9, stiffness: 220, mass: 0.6}});
  const shake = f < 8 ? Math.sin(f * 9) * (8 - f) * 2.5 : 0;
  const len = 1500;
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
      <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, 60], [1.12, 1.2])})`, transformOrigin: '20% 60%'}}>
        <Img src={staticFile('swift/coso_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.9)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 21% 60%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.55) 70%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <ellipse cx={225} cy={1155} rx={240} ry={145} fill="none" stroke={K.red} strokeWidth={14} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} transform="rotate(-8 225 1155)" />
      </svg>
      <div style={{position: 'absolute', top: 1290, left: 330, transform: `scale(${0.4 + 0.6 * stamp}) rotate(-10deg)`, opacity: Math.min(1, stamp * 2)}}>
        <div style={{border: `8px solid ${K.red}`, padding: '10px 26px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 64, color: K.red, textTransform: 'uppercase', lineHeight: 1}}>
          Carga<br />sospechosa
        </div>
      </div>
      <Caption4 dur={60} y={420} size={62} words={w(literal ? 'Muchos kilos de… cocaína.' : 'Muchos kilos de… harina.', 18, 4, [3])} />
    </AbsoluteFill>
  );
};

/* remate: "cualquier auto, cualquier carga*" con la letra chica */
const Remate: React.FC = () => {
  const f = useCurrentFrame();
  const foot = interpolate(f, [34, 42], [0, 1], cl);
  return (
    <>
      <Headline4 text={'Cualquier auto.\nCualquier carga*'} kicker="GRÚAS SARAVIA" dur={70} y={300} size={74} />
      <div style={{position: 'absolute', top: 520, left: 72, fontFamily: MONT, fontWeight: 700, fontSize: 40, color: '#fff', opacity: foot, transform: `translateY(${(1 - foot) * 14}px)`, textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>
        *legal, obvio.
      </div>
    </>
  );
};

export const Cosomovil: React.FC<{literal?: boolean}> = ({literal = false}) => {
  const S = (f: string) => staticFile(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–3 s · gancho */}
      <Sequence {...at(T.hook)}>
        <Shot src={SRC} segs={[{from: 0.1, take: 2.7, rate: 0.9}]} zoom={[1.12, 1.02]} origin="45% 50%" shake={3} audio={0.3} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0) 45%)'}} />
        <Headline4 text={'Cosomóvil\nen panne'} kicker="RESCATE DEL DÍA" dur={90} y={260} size={120} />
        <Sequence from={44}><Caption4 dur={46} y={1180} words={w('¿La causa? Sobrepeso.', 0, 6, [2])} /></Sequence>
      </Sequence>

      {/* 3–4,7 s · zoom lento a los bultos negros */}
      <Sequence {...at(T.zoom)}>
        <Shot src={SRC} segs={[{from: 0.0, take: 0.6, rate: 0.36}]} zoom={[1.1, 1.6]} origin="18% 60%" darken={0.1} />
        <Caption4 dur={50} y={420} size={62} words={w('Venía cargado con…', 4, 6)} />
      </Sequence>

      {/* 4,7–6,7 s · congelado: carga sospechosa */}
      <Sequence {...at(T.freeze)}><Sospecha literal={literal} /></Sequence>

      {/* 6,7–9,2 s · "nosotros solo llevamos el auto" */}
      <Sequence {...at(T.vuelta)}>
        <Shot src={SRC} segs={[{from: 5.2, take: 1.4, rate: 0.56}]} zoom={[1.06, 1.1]} origin="50% 55%" audio={0.3} />
        <Sequence durationInFrames={40}><Caption4 dur={40} y={1180} words={w('Tranquilos: nosotros solo llevamos el auto.', 0, 4, [5, 6])} /></Sequence>
        <Sequence from={40} durationInFrames={35}><Caption4 dur={35} y={1180} words={w(literal ? 'Lo otro se lo dejamos a los pacos.' : 'La harina se la dejamos a los pacos.', 0, 3, [7])} /></Sequence>
      </Sequence>

      {/* 9,2–11,5 s · remate con el control de la grúa */}
      <Sequence {...at(T.remate)}>
        <Shot src={SRC} segs={[{from: 6.7, take: 1.4, rate: 0.6}]} zoom={[1.0, 1.06]} origin="70% 70%" darken={0.25} />
        <Remate />
      </Sequence>

      {/* 11,5–14,5 s · cierre de marca */}
      <Sequence {...at(T.cta)}>
        <AbsoluteFill style={{filter: 'blur(12px)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.14]} origin="40% 55%" />
        </AbsoluteFill>
        <LogoReveal dur={90} />
      </Sequence>

      <Grain opacity={0.06} />

      {/* SFX de humor */}
      <Sequence from={2}><Audio src={S('audio/sfx_impact.wav')} volume={0.6} /></Sequence>
      <Sequence from={56}><Audio src={S('audio/sfx_trombon.wav')} volume={0.55} /></Sequence>
      <Sequence from={T.zoom[0]} durationInFrames={50}><Audio src={S('audio/sfx_riser.wav')} volume={(x) => 0.35 * interpolate(x, [40, 50], [1, 0], cl)} /></Sequence>
      <Sequence from={T.freeze[0]}><Audio src={S('audio/sfx_scratch.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.freeze[0] + 14}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.freeze[0] + 30}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.75} /></Sequence>
      <Sequence from={T.vuelta[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.remate[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.remate[0] + 34}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.cta[0] + 4}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
