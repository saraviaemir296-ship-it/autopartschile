import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Seg, Shot, segFrames} from '../v2/Shot';
import {Caption4, MONT, W} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {E, K, cl} from '../v2/look';

/**
 * COMPRA DE UN SX4 · Desarmaduría Saravia · video orgánico (~29 s).
 * Historia real: llega por la web → WhatsApp → oferta → firma → grúa →
 * publicado en autopartschile.cl → pide tu repuesto.
 */
export const C = {
  talk: [0, 102],
  chat: [102, 246],
  drive: [246, 324],
  llegada: [324, 381],
  papeles: [381, 453],
  grua: [453, 543],
  ficha: [543, 663],
  busqueda: [663, 783],
  cta: [783, 873],
} as const;
export const C_TOTAL = 873;
const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const S = (f: string) => staticFile(f);

/** Palabras con tiempo real (segundos dentro de talk.mp4), relativas a `zero` (segundos). */
const words = (list: [string, number, boolean?][], zero: number): W[] =>
  list.map(([t, s, hi]) => ({t, at: Math.max(0, Math.round((s - zero) * 30) - 2), hi: !!hi}));

/** Etiqueta superior estilo nota (texto negro sobre blanco), con "pop". */
const Sticker: React.FC<{text: string; sub?: string; red?: boolean; y?: number}> = ({text, sub, red, y = 300}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 13, stiffness: 210, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: y, left: 60, right: 140, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10}}>
      <div
        style={{
          background: red ? K.red : '#fff',
          color: red ? '#fff' : '#111',
          fontFamily: MONT,
          fontWeight: 900,
          fontSize: 58,
          lineHeight: 1.05,
          textTransform: 'uppercase',
          padding: '14px 22px 16px',
          borderRadius: 14,
          boxShadow: '0 12px 34px rgba(0,0,0,0.35)',
          transform: `scale(${0.7 + 0.3 * p}) rotate(${(1 - p) * -4 - 1.2}deg)`,
          transformOrigin: 'left center',
          opacity: Math.min(1, p * 2),
        }}
      >
        {text}
      </div>
      {sub && (
        <div style={{background: '#111', color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 32, padding: '8px 16px', borderRadius: 10, opacity: interpolate(f, [6, 14], [0, 1], cl), transform: 'rotate(-1.2deg)'}}>
          {sub}
        </div>
      )}
    </div>
  );
};

/** Pantallazo real del WhatsApp con paneo y marcadores sobre los mensajes clave. */
const Chat: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const k = 1080 / 923;
  const ty = interpolate(f, [0, dur], [-330, -430], {...cl, easing: E.inOut});
  const zoom = interpolate(f, [0, dur], [1.0, 1.06], cl);
  // [x0, y0, x1, y1] en coordenadas del pantallazo + frame de aparición
  const marks: [number, number, number, number, number][] = [
    [36, 955, 694, 1100, 44],
    [36, 1252, 340, 1342, 70],
    [36, 1494, 448, 1590, 96],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0b0b', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '30% 70%'}}>
        <div style={{position: 'absolute', left: 0, top: ty, width: 1080}}>
          <Img src={S('compra/whatsapp-anon.png')} style={{width: 1080, display: 'block'}} />
          {marks.map(([x0, y0, x1, y1, a], i) => {
            const p = spring({frame: f - a, fps: 30, config: {damping: 14, stiffness: 220, mass: 0.6}});
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x0 * k - 8,
                  top: y0 * k - 8,
                  width: (x1 - x0) * k + 16,
                  height: (y1 - y0) * k + 16,
                  borderRadius: 34,
                  border: `6px solid ${K.red}`,
                  boxShadow: `0 0 0 4px rgba(209,11,12,0.25), 0 0 30px rgba(209,11,12,0.5)`,
                  opacity: f >= a ? Math.min(1, p * 2) : 0,
                  transform: `scale(${1.15 - 0.15 * p})`,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 26%)'}} />
    </AbsoluteFill>
  );
};

const Screen: React.FC<{src: string; segs: Seg[]}> = ({src, segs}) => {
  let c = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {segs.map((g, i) => {
        const d = Math.round((g.take / g.rate) * 30);
        const s = c;
        c += d;
        return (
          <Sequence key={i} from={s} durationInFrames={d}>
            <OffthreadVideo src={S(src)} startFrom={Math.round(g.from * 30)} playbackRate={g.rate} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%'}} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cierre: Desarmaduría Saravia · autopartschile.cl · WhatsApp. */
const CTA: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = (d: number) => interpolate(f, [d, d + 10], [0, 1], {...cl, easing: E.out});
  const lp = spring({frame: f, fps: 30, config: {damping: 14, stiffness: 160}});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(8,8,8,0.72)'}} />
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: '#fff', borderRadius: 28, padding: '18px 34px', transform: `scale(${0.8 + 0.2 * lp})`, opacity: Math.min(1, lp * 2)}}>
          <Img src={S('compra/logo-desarmaduria.svg')} style={{height: 250, display: 'block'}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 700, left: 72, right: 150, fontFamily: MONT, color: '#fff'}}>
        <div style={{opacity: a(8), transform: `translateY(${(1 - a(8)) * 12}px)`}}>
          <div style={{fontSize: 26, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)'}}>¿BUSCAS REPUESTOS DE SX4?</div>
          <div style={{marginTop: 8, fontSize: 64, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase'}}>autopartschile.cl</div>
        </div>
        <div style={{marginTop: 34, opacity: a(18), transform: `translateY(${(1 - a(18)) * 12}px)`}}>
          <div style={{fontSize: 26, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)'}}>¿TIENES UN AUTO PARA DESARME?</div>
          <div style={{marginTop: 8, fontSize: 56, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase'}}>
            <span style={{background: K.red, padding: '0 12px'}}>Te lo compramos</span>
          </div>
        </div>
        <div style={{marginTop: 44, display: 'flex', alignItems: 'center', gap: 18, fontSize: 64, fontWeight: 800, opacity: a(28), transform: `translateY(${(1 - a(28)) * 12}px)`}}>
          <Wa s={64} /> +56 9 5381 7335
        </div>
      </div>
    </AbsoluteFill>
  );
};

const GRUA_RAMP: Seg[] = [
  {from: 4.6, take: 0.6, rate: 1.5},
  {from: 5.4, take: 1.2, rate: 1.8},
];
const GRUA_HERO: Seg[] = [{from: 0.6, take: 1.75, rate: 0.9}];

export const CompraSX4: React.FC = () => {
  const f = useCurrentFrame();
  const rampF = segFrames(GRUA_RAMP);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* 1 · TÚ HABLANDO (voz real) */}
      <Sequence {...at(C.talk)}>
        <Shot src="compra/talk.mp4" segs={[{from: 2.05, take: 3.4, rate: 1}]} zoom={[1.0, 1.06]} origin="50% 35%" audio={1} />
        <Sticker text="Compramos un SX4 con la caja mala" sub="Desarmaduría Saravia" />
        <Caption4 dur={102} y={1220} size={52} words={words([['Ya', 2.1], ['nos', 2.2], ['encontramos', 2.6], ['en', 3.0], ['camino', 3.3], ['a', 3.4], ['retirar', 3.6], ['el', 3.9], ['vehículo', 4.1, true], ['que', 4.4], ['compramos.', 4.8, true]], 2.05)} />
      </Sequence>

      {/* 2 · WHATSAPP real */}
      <Sequence {...at(C.chat)}>
        <Chat dur={144} />
        <Sequence durationInFrames={44}><Sticker text="Nos escribió por la web" /></Sequence>
        <Sequence from={44} durationInFrames={52}><Sticker text="SX4 2010 · 4x4" sub="Automático · caja mala" /></Sequence>
        <Sequence from={96}><Sticker text="Pidió $1.500.000" red /></Sequence>
      </Sequence>

      {/* 3 · EN CAMINO (tu voz sigue) */}
      <Sequence {...at(C.drive)}>
        <Shot src="compra/drive.mp4" segs={[{from: 0, take: 4.16, rate: 1.6}]} zoom={[1.05, 1.12]} audio={0.15} />
      </Sequence>

      {/* 4 · LLEGADA + oferta */}
      <Sequence {...at(C.llegada)}>
        <Shot src="compra/llegada_anon.mp4" segs={[{from: 0, take: 1.13, rate: 0.6}]} zoom={[1.02, 1.1]} origin="40% 45%" audio={0.15} />
        <Sticker text="Le ofrecimos $1.100.000" red />
      </Sequence>

      {/* 5 · PAPELES: aceptó */}
      <Sequence {...at(C.papeles)}>
        <Shot src="compra/papeles_anon.mp4" segs={[{from: 0, take: 2.37, rate: 1}]} zoom={[1.04, 1.1]} audio={0.15} />
        <Sticker text="¡Aceptó!" sub="Pago y papeles en regla" />
      </Sequence>

      {/* VO: tu voz sobre el trayecto, la llegada y los papeles */}
      <Sequence from={C.drive[0]} durationInFrames={160}>
        <Audio src={S('compra/talk.mp4')} startFrom={Math.round(5.45 * 30)} />
      </Sequence>
      <Sequence from={C.drive[0]} durationInFrames={33}>
        <Caption4 dur={33} y={1220} size={50} words={words([['Les', 5.5], ['podemos', 5.6], ['mostrar', 5.8], ['el', 6.0], ['proceso', 6.4, true]], 5.45)} />
      </Sequence>
      <Sequence from={C.drive[0] + 33} durationInFrames={127}>
        <Caption4 dur={127} y={1220} size={50} words={words([['y', 6.7], ['cómo', 6.9], ['es,', 7.5], ['cómo', 7.9], ['retiramos', 8.1], ['con', 8.6], ['nuestra', 8.8], ['grúa', 9.2, true]], 6.55)} />
      </Sequence>

      {/* 6 · A LA GRÚA */}
      <Sequence {...at(C.grua)}>
        <Sequence durationInFrames={rampF}>
          <Shot src="footage/IMG_3240.mp4" segs={GRUA_RAMP} zoom={[1.06, 1.16]} origin="38% 62%" shake={3} />
        </Sequence>
        <Sequence from={rampF}>
          <Shot src="footage/IMG_3244.mp4" segs={GRUA_HERO} look="warm" zoom={[1.0, 1.08]} origin="55% 42%" audio={0.3} />
        </Sequence>
        <Sticker text="Directo a la grúa" sub="Grúas Saravia" />
      </Sequence>

      {/* 7 · PUBLICADO en autopartschile.cl (grabación real del sitio) */}
      <Sequence {...at(C.ficha)}>
        <Screen src="compra/web-ficha.mp4" segs={[{from: 1.2, take: 3.4, rate: 2.2}, {from: 6.6, take: 4.5, rate: 1.7}]} />
        <Sticker text="Ya está publicado" sub="autopartschile.cl" red y={1420} />
      </Sequence>

      {/* 8 · BUSCA "SX4" y pide tu repuesto */}
      <Sequence {...at(C.busqueda)}>
        <Screen src="compra/web-busqueda.mp4" segs={[{from: 1.0, take: 5.0, rate: 2.5}, {from: 6.4, take: 5.0, rate: 2.5}]} />
        <Sticker text="Pide tu repuesto" sub="Busca SX4 en autopartschile.cl" red y={1420} />
      </Sequence>

      {/* 9 · CIERRE */}
      <Sequence {...at(C.cta)}>
        <AbsoluteFill style={{filter: 'blur(10px)'}}>
          <Shot src="footage/IMG_3244.mp4" segs={[{from: 2.0, take: 1.5, rate: 0.5}]} look="warm" zoom={[1.1, 1.14]} />
        </AbsoluteFill>
        <CTA dur={90} />
      </Sequence>

      <Grain opacity={0.05} />

      {/* música de fondo: baja bajo tu voz, sube en el resto */}
      <Audio src={S('audio/music_fallback.wav')} volume={(fr) => interpolate(fr, [0, 100, 110, 400, 412, 860, 873], [0.1, 0.1, 0.6, 0.6, 0.85, 0.85, 0], cl)} />
      {[102 + 44, 102 + 70, 102 + 96].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={324}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={381}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
      <Sequence from={451}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={541}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={781}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
