import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../v2/Shot';
import {MONT} from '../v2/Type4';
import {E, K, cl} from '../v2/look';
import {Bg, CTA, Local} from '../walk/WalkV15';

/* Venta real: motor Suzuki Swift Dzire 2012–2017 1.2 K12MN (tapa de
   aluminio, mecánico) que salió del desarme y se fue en la camioneta del
   cliente. Caras, pantalla del notebook y patente van pixeladas en el
   material de public/swift (ver scratchpad anon.py). Sin precio: no está
   confirmado mostrarlo. */

const S = (f: string) => staticFile(f);
const DISP = "'Anton', 'Montserrat', sans-serif";
const sp = (f: number, d = 0, damping = 13, stiffness = 210) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const fade = (f: number, a: number, len = 8) => interpolate(f, [a, a + len], [0, 1], {...cl, easing: E.out});

const ORDER = [
  ['hook', 54],
  ['auto', 66],
  ['vano', 84],
  ['carga', 36],
  ['local1', 148],
  ['adios', 33],
  ['casa', 50],
  ['cta', 150],
] as const;
type Key = (typeof ORDER)[number][0];
const T = (() => {
  const o = {} as Record<Key, [number, number]>;
  let x = 0;
  for (const [k, d] of ORDER) {
    o[k] = [x, x + d];
    x += d;
  }
  return o;
})();
export const SWIFT_TOTAL = T.cta[1];
const at = (r: [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});

const Clip: React.FC<{src: string; from: number; vol?: number}> = ({src, from, vol = 0.25}) => (
  <OffthreadVideo src={S(src)} startFrom={Math.round(from * 30)} volume={vol} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
);

const Shade: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.15) 34%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'}} />
);

const Title: React.FC<{t: number; kicker: string; text: React.ReactNode; size?: number; top?: number}> = ({t, kicker, text, size = 112, top = 230}) => {
  const p = sp(t, 0, 13, 200);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 140, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px)`, textShadow: '0 4px 22px rgba(0,0,0,0.6)'}}>
      <div style={{fontFamily: MONT, fontSize: 36, fontWeight: 800, letterSpacing: '0.14em', color: '#E6EEF2'}}>{kicker}</div>
      <div style={{marginTop: 6, fontFamily: DISP, fontSize: size, textTransform: 'uppercase', lineHeight: 1.04}}>{text}</div>
    </div>
  );
};

const Red: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{display: 'inline-block', background: K.red, padding: '6px 14px 2px', lineHeight: 1, marginTop: 8}}>{children}</span>;

const Chip: React.FC<{t: number; a: number; children: React.ReactNode; y: number}> = ({t, a, children, y}) => {
  const p = sp(t, a, 12, 240);
  return (
    <div style={{position: 'absolute', left: 60, top: y, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,10,0.82)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: '14px 26px', fontFamily: MONT, fontSize: 44, fontWeight: 800, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -60}px)`}}>
      <span style={{width: 18, height: 18, borderRadius: 99, background: K.red, boxShadow: `0 0 18px ${K.red}`}} />
      {children}
    </div>
  );
};

/* foto real sobre fondo desenfocado de la misma foto, con zoom lento */
const Photo: React.FC<{src: string; t: number; len: number; top: number}> = ({src, t, len, top}) => {
  const z = interpolate(t, [0, len], [1.0, 1.08], cl);
  const p = sp(t, 0, 14, 180);
  return (
    <AbsoluteFill>
      <Img src={S(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.45)', transform: 'scale(1.2)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 80}px)`}}>
        <Img src={S(src)} style={{display: 'block', width: '100%', transform: `scale(${z})`}} />
      </div>
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{t: number}> = ({t}) => {
  if (t < 0) return null;
  const p = sp(t, 0, 9, 320);
  const s = interpolate(p, [0, 1], [2.4, 1]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `rotate(-8deg) scale(${s})`, opacity: Math.min(1, p * 3), border: `12px solid ${K.red}`, color: K.red, background: 'rgba(255,255,255,0.92)', borderRadius: 26, padding: '6px 44px 14px', fontFamily: DISP, fontSize: 170, lineHeight: 1, letterSpacing: '0.02em'}}>
        VENDIDO
      </div>
    </div>
  );
};

const Flash: React.FC<{t: number}> = ({t}) => <AbsoluteFill style={{background: '#fff', opacity: interpolate(t, [0, 6], [0.85, 0], cl), pointerEvents: 'none'}} />;

export const MotorSwift: React.FC = () => {
  const f = useCurrentFrame();
  const l = (k: Key) => f - T[k][0];
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* 1. gancho: el motor amarrado en la camioneta + VENDIDO */}
      <Sequence {...at(T.hook)}>
        <Clip src="swift/entrega.mp4" from={0.3} vol={0.2} />
        <Shade />
        <Title t={l('hook')} kicker="DESARMADURÍA SARAVIA" text={<>¿Buscas motor<br />de <Red>Suzuki Swift</Red>?</>} size={124} />
        <Stamp t={l('hook') - 26} />
        {l('hook') >= 26 && <Flash t={l('hook') - 26} />}
      </Sequence>

      {/* 2. de dónde salió */}
      <Sequence {...at(T.auto)}>
        <Photo src="swift/auto.jpg" t={l('auto')} len={66} top={720} />
        <Title t={l('auto')} kicker="SALIÓ DE ESTE AUTO EN DESARME" text={<>Swift Dzire<br /><Red>2012–2017</Red></>} />
      </Sequence>

      {/* 3. el motor */}
      <Sequence {...at(T.vano)}>
        <Photo src="swift/motor-vano.jpg" t={l('vano')} len={84} top={760} />
        <Title t={l('vano')} kicker="EL MOTOR" text={<>1.2 <Red>K12MN</Red></>} size={130} />
        <Chip t={l('vano')} a={12} y={500}>Tapa de aluminio</Chip>
        <Chip t={l('vano')} a={22} y={600}>Caja mecánica · GLX full AC</Chip>
      </Sequence>

      {/* 4. cargado */}
      <Sequence {...at(T.carga)}>
        <Clip src="swift/entrega.mp4" from={2.0} vol={0.2} />
        <Shade />
        <Flash t={l('carga')} />
        <Title t={l('carga')} kicker="LISTO Y AMARRADO" text={<>Directo a la<br /><Red>camioneta</Red> del cliente</>} size={104} />
      </Sequence>

      {/* 5. atención en el local + tarjeta NFC de reseñas */}
      <Sequence {...at(T.local1)}>
        <Clip src="swift/mostrador_anon.mp4" from={0} vol={0.3} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
        <div style={{position: 'absolute', left: 60, right: 140, top: 1330, color: '#fff'}}>
          <div style={{display: 'inline-block', background: K.red, fontFamily: DISP, fontSize: 84, padding: '0 22px 6px', borderRadius: 14, textTransform: 'uppercase', transform: `scale(${sp(l('local1'), 4)})`, transformOrigin: 'left'}}>Atendido en el local</div>
          <div style={{marginTop: 18, fontFamily: MONT, fontSize: 44, fontWeight: 800, opacity: fade(l('local1'), 104), transform: `translateY(${(1 - fade(l('local1'), 104)) * 20}px)`}}>
            Y tu reseña en Google, con un toque 📲
          </div>
        </div>
      </Sequence>

      {/* 6. despedida */}
      <Sequence {...at(T.adios)}>
        <Clip src="swift/entrega.mp4" from={5.5} vol={0.25} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%)'}} />
        <Title t={l('adios')} kicker="MOTOR ENTREGADO" text={<>¡Gracias por la <Red>confianza</Red>!</>} size={110} />
      </Sequence>

      {/* 7. local y cierre */}
      <Sequence {...at(T.casa)}><Local t={l('casa')} /></Sequence>
      <Sequence {...at(T.cta)}>
        <Bg />
        <CTA t={l('cta')} word="SWIFT" />
      </Sequence>
      <Grain opacity={0.05} />

      {/* sonido */}
      <Audio src={S('audio/sfx_impact.wav')} volume={0.45} />
      <Sequence from={26}><Audio src={S('audio/sfx_pa.wav')} volume={0.55} /></Sequence>
      {[T.auto[0], T.vano[0], T.carga[0], T.local1[0], T.adios[0]].map((x) => (
        <Sequence key={x} from={x - 4}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      ))}
      {[T.vano[0] + 12, T.vano[0] + 22].map((x) => (
        <Sequence key={'b' + x} from={x}><Audio src={S('audio/sfx_blip.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={T.local1[0] + 104}><Audio src={S('audio/sfx_correct.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.adios[0] + 2}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.casa[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.casa[0] + 6}><Audio src={S('audio/vo/v15_5.wav')} volume={1} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.cta[0] + 66}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
