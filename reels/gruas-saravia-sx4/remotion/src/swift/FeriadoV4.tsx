import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain, PhotoShot, Shot} from '../v2/Shot';
import {AnimatedMap} from '../v2/MapOverlay';
import {LogoReveal} from '../v2/LogoReveal';
import {Caption4, Headline4, MONT, W} from '../v2/Type4';
import {TruckWipe} from '../v2/TruckAccel';
import {WebDemo} from '../v2/WebDemo';
import {E, K, cl} from '../v2/look';

/* Grúas Saravia — feriado 12 de octubre, mismo lenguaje visual que el
   Reel V4 (software, mapa, tarifa base + km, cierre con logo y WhatsApp).
   Video real de la grúa en la autopista con la patente del auto pixelada. */

const SRC = 'swift/feriado_anon.mp4';
const T = {hook: [0, 90], geo: [90, 200], web: [200, 330], tarifa: [330, 470], rescue: [470, 530], cta: [530, 620]} as const;
export const FERIADO_V4_TOTAL = 620;
const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] => s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));
const pop = (f: number, d: number) => spring({frame: f - d, fps: 30, config: {damping: 16, stiffness: 200, mass: 0.6}});
const fade = (f: number, d: number, len = 12) => interpolate(f, [d, d + len], [0, 1], {...cl, easing: E.out});

const Chip: React.FC<{label: string; sub: string; p: number; accent?: boolean}> = ({label, sub, p, accent}) => (
  <div style={{padding: '20px 24px', borderRadius: 18, background: accent ? K.red : 'rgba(8,8,8,0.72)', border: accent ? 'none' : '1.5px solid rgba(255,255,255,0.22)', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 26}px) scale(${0.92 + 0.08 * p})`, textAlign: 'center', minWidth: 210}}>
    <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 34, color: K.white, textTransform: 'uppercase', lineHeight: 1.05}}>{label}</div>
    <div style={{marginTop: 6, fontFamily: MONT, fontWeight: 600, fontSize: 20, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)'}}>{sub}</div>
  </div>
);
const Op: React.FC<{c: string; o: number}> = ({c, o}) => <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 56, color: K.red, opacity: o, margin: '0 6px'}}>{c}</div>;

/* TARIFA FERIADO: base + km + 20% */
const TarifaFeriado: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const n = Math.round(interpolate(f, [52, 74], [0, 20], cl));
  const hit = spring({frame: f - 74, fps: 30, config: {damping: 8, stiffness: 260, mass: 0.5}});
  const stamp = spring({frame: f - 84, fps: 30, config: {damping: 11, stiffness: 180, mass: 0.7}});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <div style={{position: 'absolute', top: 290, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: fade(f, 2)}}>
          <span style={{width: 44 * fade(f, 2), height: 4, background: K.red, display: 'inline-block'}} />
          TARIFA EN FERIADOS
        </div>
        <div style={{marginTop: 16, fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 92, lineHeight: 0.98, letterSpacing: '-0.02em', textTransform: 'uppercase', color: K.white, clipPath: `inset(0 ${(1 - fade(f, 4, 14)) * 100}% 0 0)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)'}}>
          Base <span style={{color: K.red}}>+</span> km <span style={{color: K.red}}>+</span> 20%
        </div>
      </div>
      <div style={{position: 'absolute', top: 620, left: 30, right: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Chip label="Base" sub="TARIFA FIJA" p={pop(f, 18)} />
        <Op c="+" o={fade(f, 24, 8)} />
        <Chip label="Km" sub="RECORRIDOS" p={pop(f, 28)} />
        <Op c="+" o={fade(f, 36, 8)} />
        <Chip label="20%" sub="FERIADO" p={pop(f, 40)} accent />
      </div>
      {/* contador grande */}
      <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', opacity: fade(f, 50, 6)}}>
        <div style={{fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 250, lineHeight: 1, color: K.white, transform: `scale(${f >= 74 ? interpolate(hit, [0, 1], [1.3, 1]) : 1})`, textShadow: `0 0 ${f >= 74 ? 50 : 0}px rgba(209,11,12,0.8), 8px 8px 0 ${K.red}`}}>+{n}%</div>
        <div style={{marginTop: 6, fontFamily: MONT, fontWeight: 700, fontSize: 34, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)'}}>DÍAS FERIADOS</div>
      </div>
      <div style={{position: 'absolute', top: 1200, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '18px 30px', background: K.red, transform: `scale(${0.6 + 0.4 * stamp}) rotate(${(1 - stamp) * -6}deg) skewX(-8deg)`, opacity: Math.min(1, stamp * 2), boxShadow: '0 14px 40px rgba(209,11,12,0.4)'}}>
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={K.white} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 50, color: K.white, textTransform: 'uppercase'}}>Trabajamos en feriados</div>
        </div>
      </div>
    </div>
  );
};

export const FeriadoV4: React.FC = () => {
  const S = (f: string) => staticFile(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–3 s · gancho: la grúa en ruta en pleno feriado */}
      <Sequence {...at(T.hook)}>
        <Shot src={SRC} segs={[{from: 0.3, take: 2.7, rate: 0.9}]} zoom={[1.14, 1.0]} origin="40% 45%" shake={4} audio={0.3} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0) 45%)'}} />
        <Headline4 text={'Feriado'} kicker="LUNES 12 DE OCTUBRE" dur={90} y={290} size={130} />
        <Sequence from={8}><Caption4 dur={82} y={1180} words={w('Y la grúa sigue en ruta.', 0, 5, [4, 5])} /></Sequence>
      </Sequence>

      {/* 3–6,7 s · geolocalización */}
      <Sequence {...at(T.geo)}>
        <Shot src={SRC} segs={[{from: 3.0, take: 2.2, rate: 0.6}]} zoom={[1.1, 1.16]} origin="50% 45%" darken={0.45} blur={1.5} />
        <AnimatedMap dur={110} dimAt={60} />
        <Headline4 text={''} kicker="GEOLOCALIZACIÓN EN TIEMPO REAL" dur={110} y={290} size={10} />
        <Sequence durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={w('Pides tu grúa desde el celular,', 0, 5, [2])} /></Sequence>
        <Sequence from={55} durationInFrames={55}><Caption4 dur={55} y={960} size={54} words={w('también en días feriados.', 0, 5, [2, 3])} /></Sequence>
      </Sequence>

      {/* 6,7–11 s · sitio web: cotiza y programa tu viaje */}
      <Sequence {...at(T.web)}>
        <AbsoluteFill style={{filter: 'blur(8px) brightness(0.45)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={130} zoom={[1.15, 1.22]} origin="45% 55%" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: 'translateY(-10px) scale(0.84)', transformOrigin: '50% 0%'}}>
          <WebDemo dur={130} label={false} />
        </AbsoluteFill>
        <Headline4 text={''} kicker="COTIZA Y PROGRAMA EN LA WEB" dur={130} y={200} size={10} />
        <Sequence durationInFrames={62}><Caption4 dur={62} y={1330} size={52} words={w('Cotiza en gruasaravia.cl', 0, 6, [2])} /></Sequence>
        <Sequence from={62} durationInFrames={68}><Caption4 dur={68} y={1330} size={52} words={w('y programa tu viaje.', 0, 6, [1, 2, 3])} /></Sequence>
      </Sequence>

      {/* 11–15,7 s · tarifa en feriados (entra con el camión acelerando) */}
      <Sequence from={T.tarifa[0] - 22} durationInFrames={T.tarifa[1] - T.tarifa[0] + 22}>
        <TruckWipe dur={22}>
          <Shot src={SRC} segs={[{from: 5.6, take: 2.7, rate: 0.5}]} look="warm" zoom={[1.08, 1.16]} origin="50% 45%" darken={0.55} blur={3} />
          <Sequence from={22}><TarifaFeriado dur={140} /></Sequence>
        </TruckWipe>
      </Sequence>

      {/* 11,3–13,3 s · rescate + traslado */}
      <Sequence {...at(T.rescue)}>
        <Shot src={SRC} segs={[{from: 8.4, take: 1.8, rate: 0.9}]} zoom={[1.06, 1.16]} origin="38% 55%" shake={3} />
        <Headline4 text={'Rescate +\ntraslado'} kicker="TODOS LOS DÍAS" dur={60} y={1150} size={96} />
      </Sequence>

      {/* 13,3–16,3 s · cierre con logo, WhatsApp y redes */}
      <Sequence {...at(T.cta)}>
        <AbsoluteFill style={{filter: 'blur(12px)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.14]} origin="40% 55%" />
        </AbsoluteFill>
        <LogoReveal dur={90} />
      </Sequence>

      <Grain opacity={0.07} />

      {/* SFX */}
      <Sequence from={0}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={4}><Audio src={S('audio/sfx_impact.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.geo[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.geo[0] + 3}><Audio src={S('audio/sfx_map.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.tarifa[0] - 22}><Audio src={S('audio/sfx_rev.wav')} volume={0.6} /></Sequence>
      <Sequence from={T.tarifa[0] - 8}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      {[18, 28, 40].map((d) => <Sequence key={d} from={T.tarifa[0] + d}><Audio src={S('audio/sfx_blip.wav')} volume={0.26} /></Sequence>)}
      {[54, 58, 62, 66, 70].map((d) => <Sequence key={d} from={T.tarifa[0] + d}><Audio src={S('audio/sfx_tick.wav')} volume={0.35} /></Sequence>)}
      <Sequence from={T.tarifa[0] + 74}><Audio src={S('audio/sfx_impact.wav')} volume={0.75} /></Sequence>
      <Sequence from={T.tarifa[0] + 84}><Audio src={S('audio/sfx_pop.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.web[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      {[14, 32, 52, 66].map((d) => <Sequence key={d} from={T.web[0] + d}><Audio src={S('audio/sfx_tick.wav')} volume={0.4} /></Sequence>)}
      <Sequence from={T.web[0] + 76}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.rescue[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.rescue[0] + 2}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.cta[0] + 4}><Audio src={S('audio/sfx_rev.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
