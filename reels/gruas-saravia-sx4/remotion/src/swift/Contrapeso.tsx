import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Grain, PhotoShot, Shot} from '../v2/Shot';
import {AnimatedMap} from '../v2/MapOverlay';
import {LogoReveal} from '../v2/LogoReveal';
import {WebDemo} from '../v2/WebDemo';
import {Caption4, Headline4, MONT, W} from '../v2/Type4';
import {K, cl} from '../v2/look';

/* "El auto con contrapeso": historia de humor contada en primera persona
   (estilo orgánico, texto tipo TikTok) que termina en la parte seria:
   el software con IA de Grúas Saravia (cotizar, mapa en tiempo real, WhatsApp).
   Patentes pixeladas en todos los clips; el maletero es un clip hecho con IA. */

const HF = 'swift/hf_anon.mp4';
const COSO = 'swift/coso_anon.mp4';
const MANEJO = 'swift/manejo.mp4';
const T = {
  hook: [0, 75], rew: [75, 95], manejo: [95, 233], subida: [233, 340], carga: [340, 390],
  maletero: [390, 505], serio: [505, 565], web: [565, 695], mapa: [695, 805], cta: [805, 895],
} as const;
export const CONTRAPESO_TOTAL = 895;
const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] => s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));

/* texto estilo TikTok (cajita blanca o roja) */
const TT: React.FC<{f: number; a: number; b: number; top: number; red?: boolean; size?: number; children: React.ReactNode}> = ({f, a, b, top, red, size = 56, children}) => {
  if (f < a || f >= b) return null;
  const k = interpolate(f, [a, a + 4], [0.9, 1], cl);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', transform: `scale(${k})`}}>
      <span style={{background: red ? K.red : '#fff', color: red ? '#fff' : '#000', fontFamily: MONT, fontWeight: 700, fontSize: size, lineHeight: 1.45, padding: '6px 18px', borderRadius: 12, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>
    </div>
  );
};

/* la historia (todo en una línea de tiempo para controlar textos y efectos) */
const Historia: React.FC = () => {
  const f = useCurrentFrame();
  const S = (x: string) => staticFile(x);
  // gancho: golpe de zoom al aparecer los ladrillos
  const punchHook = f >= 17 && f < 40 ? interpolate(f, [17, 22], [1.25, 1.1], cl) : 1;
  const flash = (x: number) => (f >= x ? interpolate(f, [x, x + 4], [0.6, 0], cl) : 0);
  // la grúa "se menea pa' abajo" cuando sube el auto
  const s0 = T.subida[0] + 18;
  const dip = f >= s0 && f < s0 + 30 ? Math.sin((f - s0) * 0.45) * 46 * Math.exp(-(f - s0) / 9) : 0;
  const shake = f >= s0 && f < s0 + 14 ? Math.sin(f * 11) * (s0 + 14 - f) * 1.6 : 0;
  const m0 = T.maletero[0] + 36; // revelación del maletero
  const punchMal = f >= m0 && f < m0 + 18 ? interpolate(f, [m0, m0 + 5], [1.25, 1.1], cl) : 1;
  const fzShake = f >= m0 + 18 && f < m0 + 26 ? Math.sin(f * 9) * (m0 + 26 - f) * 3 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* 0–2,5 s · GANCHO: el maletero */}
      <Sequence durationInFrames={60}>
        <AbsoluteFill style={{transform: `scale(${punchHook})`}}><Shot src={HF} segs={[{from: 2.35, take: 1.2, rate: 0.6}]} audio={0.3} /></AbsoluteFill>
      </Sequence>
      <Sequence from={60} durationInFrames={35}>
        <AbsoluteFill style={{transform: `scale(${interpolate(f, [60, 95], [1.12, 1.2], cl)})`, filter: f >= 75 ? `blur(${interpolate(f, [75, 90], [0, 14], cl)}px) brightness(${interpolate(f, [75, 90], [1, 0.45], cl)})` : undefined}}>
          <Img src={S('swift/hf_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      </Sequence>

      {/* 3,2–7,8 s · manejando */}
      <Sequence {...at(T.manejo)}><Shot src={MANEJO} segs={[{from: 0.1, take: 4.6, rate: 1}]} audio={0.35} /></Sequence>

      {/* 7,8–11,3 s · la subida: la grúa se menea pa' abajo */}
      <Sequence {...at(T.subida)}>
        <AbsoluteFill style={{transform: `translate(${shake}px, ${dip}px)`}}><Shot src={COSO} segs={[{from: 0.1, take: 3.55, rate: 1}]} zoom={[1.08, 1.12]} audio={0.4} /></AbsoluteFill>
      </Sequence>

      {/* 11,3–13 s · la carga sospechosa */}
      <Sequence {...at(T.carga)}><Shot src={COSO} segs={[{from: 0.25, take: 0.9, rate: 0.54}]} zoom={[1.05, 1.45]} origin="18% 60%" darken={0.1} /></Sequence>

      {/* 13–16 s · abro el maletero (clip de IA) */}
      <Sequence from={T.maletero[0]} durationInFrames={m0 + 18 - T.maletero[0]}>
        <AbsoluteFill style={{transform: `scale(${punchMal})`}}><Shot src={HF} segs={[{from: 1.8, take: 1.4, rate: 0.75}]} audio={0.3} /></AbsoluteFill>
      </Sequence>
      {f >= m0 + 18 && f < T.maletero[1] && (
        <AbsoluteFill style={{transform: `translate(${fzShake}px,${fzShake * 0.4}px) scale(${interpolate(f, [m0 + 18, T.maletero[1]], [1.15, 1.22], cl)})`, transformOrigin: '50% 72%'}}>
          <Img src={S('swift/hf_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      )}

      {/* 16–18 s · "ahora en serio" sobre la grúa con el auto ya cargado */}
      <Sequence {...at(T.serio)}><Shot src={COSO} segs={[{from: 6.0, take: 1.9, rate: 0.95}]} darken={0.35} audio={0.3} /></Sequence>

      <AbsoluteFill style={{background: '#fff', opacity: Math.max(flash(17), flash(m0))}} />

      {/* textos */}
      <TT f={f} a={0} b={75} top={300}>vine a buscar un auto con mi grúa y encontré esto</TT>
      <TT f={f} a={75} b={95} top={820} size={64}>les cuento desde el principio</TT>
      <TT f={f} a={T.manejo[0] + 3} b={150} top={300}>me salió un viaje normal</TT>
      <TT f={f} a={150} b={T.manejo[1]} top={300}>un auto en pana, nada raro</TT>
      <TT f={f} a={T.subida[0] + 3} b={285} top={300}>lo subí a la grúa y la grúa se meneó entera pa' abajo</TT>
      <TT f={f} a={285} b={T.subida[1]} top={300}>como si el auto trajera contrapeso</TT>
      <TT f={f} a={T.carga[0] + 3} b={T.carga[1]} top={300}>y atrás venía cargado hasta el techo…</TT>
      <TT f={f} a={T.maletero[0] + 3} b={m0 + 18} top={300}>así que abrí el maletero y…</TT>
      <TT f={f} a={m0 + 18} b={T.maletero[1]} top={300}>kilos de…</TT>
      <TT f={f} a={m0 + 26} b={T.maletero[1]} top={410} red size={72}>HARINA</TT>
      <TT f={f} a={m0 + 18} b={T.maletero[1]} top={1700} size={30}>*el maletero es un clip hecho con IA</TT>
      <TT f={f} a={T.serio[0] + 3} b={T.serio[1]} top={760} size={64}>ya, ahora en serio:</TT>

      {/* sonidos */}
      <Sequence from={0}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={17}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.8} /></Sequence>
      <Sequence from={60}><Audio src={S('audio/sfx_scratch.wav')} volume={0.6} /></Sequence>
      <Sequence from={75}><Audio src={S('audio/sfx_riser.wav')} volume={0.3} /></Sequence>
      <Sequence from={s0}><Audio src={S('audio/sfx_metal.wav')} volume={0.55} /></Sequence>
      <Sequence from={s0}><Audio src={S('audio/sfx_impact.wav')} volume={0.6} /></Sequence>
      <Sequence from={T.subida[0] + 60}><Audio src={S('audio/sfx_trombon.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.carga[0]} durationInFrames={50}><Audio src={S('audio/sfx_heartbeat.wav')} volume={0.8} /></Sequence>
      <Sequence from={T.maletero[0]} durationInFrames={m0 - T.maletero[0]}><Audio src={S('audio/sfx_heartbeat.wav')} volume={0.9} /></Sequence>
      <Sequence from={m0}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.85} /></Sequence>
      <Sequence from={m0 + 18}><Audio src={S('audio/sfx_scratch.wav')} volume={0.6} /></Sequence>
      <Sequence from={m0 + 26}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.serio[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};

/* la parte seria: software con IA de Grúas Saravia (mismo lenguaje del reel del software) */
export const Contrapeso: React.FC = () => {
  const S = (x: string) => staticFile(x);
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      <Sequence durationInFrames={T.web[0]}><Historia /></Sequence>

      {/* 18–22,3 s · cotiza en la web */}
      <Sequence {...at(T.web)}>
        <AbsoluteFill style={{filter: 'blur(8px) brightness(0.45)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={130} zoom={[1.15, 1.22]} origin="45% 55%" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: 'translateY(-10px) scale(0.84)', transformOrigin: '50% 0%'}}>
          <WebDemo dur={130} label={false} />
        </AbsoluteFill>
        <Headline4 text={''} kicker="SOFTWARE PROPIO CON IA" dur={130} y={200} size={10} />
        <Sequence durationInFrames={62}><Caption4 dur={62} y={1690} size={52} words={w('Cotiza tu grúa en gruasaravia.cl', 0, 6, [4])} /></Sequence>
        <Sequence from={62} durationInFrames={68}><Caption4 dur={68} y={1690} size={52} words={w('y programa tu viaje.', 0, 6, [1, 2, 3])} /></Sequence>
      </Sequence>

      {/* 22,3–26 s · mapa en tiempo real */}
      <Sequence {...at(T.mapa)}>
        <Shot src={MANEJO} segs={[{from: 1.0, take: 2.2, rate: 0.6}]} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={110} dimAt={60} />
        <Headline4 text={''} kicker="GEOLOCALIZACIÓN EN TIEMPO REAL" dur={110} y={290} size={10} />
        <Sequence durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={w('Pide la grúa directo desde tu celular,', 0, 5, [2, 3])} /></Sequence>
        <Sequence from={55} durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={w('y ves al operador en tiempo real.', 0, 5, [5, 6])} /></Sequence>
      </Sequence>

      {/* 26–29 s · cierre con logo, WhatsApp y redes */}
      <Sequence {...at(T.cta)}>
        <AbsoluteFill style={{filter: 'blur(12px)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.14]} origin="40% 55%" />
        </AbsoluteFill>
        <LogoReveal dur={90} />
      </Sequence>

      <Grain opacity={0.05} />

      <Sequence from={T.web[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      {[14, 32, 52, 66].map((d) => <Sequence key={d} from={T.web[0] + d}><Audio src={S('audio/sfx_tick.wav')} volume={0.4} /></Sequence>)}
      <Sequence from={T.web[0] + 76}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.mapa[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.mapa[0] + 3}><Audio src={S('audio/sfx_map.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.cta[0] + 4}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
