import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Seg, Shot, segFrames} from '../v2/Shot';
import {Caption4, MONT, W} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {TruckWipe} from '../v2/TruckAccel';
import {AvailableLead, DesarmeCTA, OrderFlow} from './Leads';
import {E, K, cl} from '../v2/look';

/**
 * COMPRA DE UN SX4 · Desarmaduría Saravia · video orgánico (~29 s).
 * Historia real: llega por la web → WhatsApp → oferta → firma → grúa →
 * publicado en autopartschile.cl → pide tu repuesto.
 */
export const C = {
  talk: [0, 411],
  chat: [411, 531],
  drive: [531, 576],
  llegada: [576, 651],
  papeles: [651, 741],
  grua: [741, 831],
  ficha: [831, 951],
  busqueda: [951, 1011],
  compra: [1011, 1146],
  cta: [1146, 1281],
} as const;
const C_BODY = 1281;
/** Gancho (cold open) antes de tu saludo. */
export const HOOK = 72;
export const C_TOTAL = HOOK + C_BODY;
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


/* ================= ANIMACIONES ================= */
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');

/** Tu toma completa, sin cortes, con "punch-ins" (zoom) en cada cambio de frase. */
const TalkShot: React.FC<{from: number; dur: number; cuts: number[]}> = ({from, dur, cuts}) => {
  const f = useCurrentFrame();
  const levels = [1.0, 1.13, 1.04, 1.16, 1.06, 1.12];
  let idx = 0;
  cuts.forEach((c, i) => {
    if (f >= c) idx = i + 1;
  });
  const prev = levels[Math.max(0, idx - 1) % levels.length];
  const cur = levels[idx % levels.length];
  const since = idx === 0 ? 99 : f - cuts[idx - 1];
  const z = since < 3 ? prev + (cur - prev) * (since / 3) : cur;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 32%', filter: 'contrast(1.06) saturate(0.95)'}}>
        <OffthreadVideo src={S('compra/talk.mp4')} startFrom={Math.round(from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Píldora pequeña que aparece con rebote (datos al pasar). */
const Pill: React.FC<{text: string; y?: number; red?: boolean}> = ({text, y = 1080, red}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 12, stiffness: 220, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: red ? K.red : 'rgba(8,8,8,0.82)', border: red ? 'none' : '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontFamily: MONT, fontWeight: 800, fontSize: 34, padding: '12px 24px', borderRadius: 99, transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2), backdropFilter: 'blur(8px)'}}>
        {text}
      </div>
    </div>
  );
};

/** Contador de precio: de `from` a `to`, el precio anterior se tacha y aparece la diferencia. */
const PriceDrop: React.FC<{from: number; to: number; y?: number; label?: string; tagText?: string}> = ({from, to, y = 760, label = 'NUESTRA OFERTA', tagText}) => {
  const f = useCurrentFrame();
  const enter = spring({frame: f, fps: 30, config: {damping: 14, stiffness: 200}});
  const t = interpolate(f, [10, 38], [0, 1], {...cl, easing: E.inOut});
  const strike = interpolate(f, [6, 14], [0, 1], cl);
  const tag = spring({frame: f - 36, fps: 30, config: {damping: 10, stiffness: 220, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: MONT, transform: `scale(${0.8 + 0.2 * enter})`, opacity: Math.min(1, enter * 2)}}>
      <div style={{position: 'relative', fontSize: 44, fontWeight: 800, color: 'rgba(255,255,255,0.75)'}}>
        Pidió {fmt(from)}
        <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 6, background: K.red, transformOrigin: 'left', transform: `scaleX(${strike}) rotate(-3deg)`}} />
      </div>
      <div style={{marginTop: 10, background: '#fff', color: '#111', borderRadius: 22, padding: '10px 30px 14px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
        <div style={{fontSize: 24, fontWeight: 800, letterSpacing: '0.2em', color: K.red}}>{label}</div>
        <div style={{fontSize: 96, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{fmt(from + (to - from) * t)}</div>
      </div>
      <div style={{marginTop: 14, background: K.red, color: '#fff', fontSize: tagText ? 54 : 36, fontWeight: 900, textTransform: 'uppercase', padding: '8px 20px', borderRadius: 12, transform: `scale(${tag}) rotate(-4deg)`, opacity: f >= 36 ? 1 : 0}}>
        {tagText ?? `−${fmt(from - to)}`}
      </div>
    </div>
  );
};

/** Sello que cae y rebota (TRATO HECHO / PAGADO). */
const Stamp: React.FC<{text: string; color: string; y: number; rot?: number}> = ({text, color, y, rot = -8}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 9, stiffness: 240, mass: 0.7}});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, border: `7px solid ${color}`, color, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '12px 30px', fontFamily: MONT, fontWeight: 900, fontSize: 72, fontStyle: 'italic', textTransform: 'uppercase', transform: `scale(${2.2 - 1.2 * p}) rotate(${rot}deg)`, opacity: Math.min(1, p * 3), boxShadow: '0 20px 50px rgba(0,0,0,0.4)'}}>
        <svg width="70" height="70" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6L17.8 8.4" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {text}
      </div>
    </div>
  );
};

/** Barra de pago que se completa. */
const PayBar: React.FC<{y: number; amount: number}> = ({y, amount}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, 26], [0, 1], {...cl, easing: E.inOut});
  return (
    <div style={{position: 'absolute', top: y, left: 120, right: 200, fontFamily: MONT, color: '#fff', opacity: interpolate(f, [0, 6], [0, 1], cl)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 800}}>
        <span>Pago</span>
        <span style={{fontVariantNumeric: 'tabular-nums'}}>{fmt(amount * t)}</span>
      </div>
      <div style={{marginTop: 10, height: 16, borderRadius: 99, background: 'rgba(255,255,255,0.25)', overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${t * 100}%`, background: '#22C55E', borderRadius: 99}} />
      </div>
    </div>
  );
};

/** Insignia "NUEVO INGRESO" con destellos. */
const NewBadge: React.FC<{y: number}> = ({y}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 10, stiffness: 220, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
      <div style={{position: 'relative', background: K.red, color: '#fff', fontFamily: MONT, fontWeight: 900, fontSize: 60, fontStyle: 'italic', padding: '14px 32px', borderRadius: 16, transform: `scale(${0.4 + 0.6 * p}) rotate(-3deg)`, boxShadow: '0 16px 40px rgba(209,11,12,0.45)'}}>
        NUEVO INGRESO
        {[[-30, -26], [440, -30], [-24, 70], [452, 66]].map(([x, yy], i) => {
          const s = Math.max(0, Math.sin((f - i * 3) / 3)) * Math.min(1, f / 8);
          return <svg key={i} width="36" height="36" viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: yy, transform: `scale(${s})`}}><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="#FFD43B" /></svg>;
        })}
      </div>
    </div>
  );
};

/** Carrito que rebota (pide tu repuesto). */
const CartBump: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  const b = Math.abs(Math.sin(f / 5)) * Math.exp(-f / 40);
  const p = spring({frame: f, fps: 30, config: {damping: 12, stiffness: 200}});
  return (
    <div style={{position: 'absolute', left: x, top: y - b * 40, width: 120, height: 120, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, boxShadow: '0 14px 30px rgba(0,0,0,0.4)'}}>
      <svg width="70" height="70" viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2h3.3l.9 2H21l-3.6 7.6a2 2 0 0 1-1.8 1.1H8.1l-1.1 2H19v2H5.3a1 1 0 0 1-.9-1.5l1.4-2.6L2.7 4H1z" fill={K.red} /></svg>
      <div style={{position: 'absolute', top: -6, right: -6, width: 42, height: 42, borderRadius: 99, background: K.red, color: '#fff', fontFamily: MONT, fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${spring({frame: f - 12, fps: 30, config: {damping: 9, stiffness: 260}})})`}}>1</div>
    </div>
  );
};

const GRUA_RAMP: Seg[] = [
  {from: 4.6, take: 0.6, rate: 1.5},
  {from: 5.4, take: 1.2, rate: 1.8},
];
const GRUA_HERO: Seg[] = [{from: 0.6, take: 1.75, rate: 0.9}];

const CompraStory: React.FC = () => {
  const rampF = segFrames(GRUA_RAMP);
  // talk.mp4 se usa desde 0,8 s y sin cortes. tiempos de palabras en segundos del archivo.
  const T0 = 0.8;
  const line = (start: number, end: number, list: [string, number, boolean?][], y = 1200) => (
    <Sequence from={Math.round((start - T0) * 30)} durationInFrames={Math.round((end - start) * 30)}>
      <Caption4 dur={Math.round((end - start) * 30)} y={y} size={54} words={words(list, start)} />
    </Sequence>
  );
  const cut = (s: number) => Math.round((s - T0) * 30);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* 1 · TU PARTE COMPLETA (voz real, sin cortes) con zooms en cada frase */}
      <Sequence {...at(C.talk)}>
        <TalkShot from={T0} dur={411} cuts={[cut(2.05), cut(3.35), cut(5.45), cut(7.85), cut(9.5), cut(10.65)]} />
        <Sequence durationInFrames={120}><Sticker text="Compramos un SX4 con la caja mala" sub="Desarmaduría Saravia" /></Sequence>
        <Sequence from={cut(4.1)} durationInFrames={50}><Pill text="Suzuki SX4 2010 · 4x4 · automático" y={1080} /></Sequence>
        <Sequence from={cut(8.8)} durationInFrames={45}><Pill text="Con nuestra grúa · Grúas Saravia" y={1080} red /></Sequence>
        <Sequence from={120} durationInFrames={291}><OpenLoop /></Sequence>
        {line(0.9, 2.05, [['Muy', 0.9], ['buenas,', 1.1], ['mi', 1.4], ['gente.', 1.8, true]])}
        {line(2.05, 3.35, [['Ya', 2.1], ['nos', 2.2], ['encontramos', 2.6], ['en', 3.0], ['camino', 3.3]])}
        {line(3.35, 5.45, [['a', 3.4], ['retirar', 3.6], ['el', 3.9], ['vehículo', 4.1, true], ['que', 4.4], ['compramos.', 4.8, true]])}
        {line(5.45, 7.85, [['Les', 5.5], ['podemos', 5.6], ['mostrar', 5.8], ['el', 6.0], ['proceso', 6.4, true], ['y', 6.7], ['cómo', 6.9], ['es,', 7.5]])}
        {line(7.85, 9.5, [['cómo', 7.9], ['retiramos', 8.1], ['con', 8.6], ['nuestra', 8.8], ['grúa', 9.2, true]])}
        {line(9.5, 10.65, [['y', 9.6], ['todas', 9.7], ['las', 10.1], ['cosas.', 10.3]])}
        {line(10.65, 12.7, [['Así', 10.7], ['que', 10.8], ['les', 10.9], ['voy', 10.95], ['a', 11.0], ['dejar', 11.1], ['el', 11.4], ['proceso,', 11.6, true], ['mi', 11.9], ['gente.', 12.2, true]])}
      </Sequence>

      {/* 2 · WHATSAPP real (datos del vendedor ocultos) */}
      <Sequence {...at(C.chat)}>
        <Chat dur={120} />
        <Sequence durationInFrames={30}><Sticker text="Nos escribió por la web" /></Sequence>
        <Sequence from={30} durationInFrames={44}><Sticker text="SX4 2010 · 4x4" sub="Automático · caja mala" /></Sequence>
        <Sequence from={74}><Sticker text="Pidió $1.500.000" red /></Sequence>
      </Sequence>

      {/* 3 · VAMOS A BUSCARLO */}
      <Sequence {...at(C.drive)}>
        <Shot src="compra/drive.mp4" segs={[{from: 0.4, take: 3.75, rate: 2.5}]} zoom={[1.05, 1.14]} audio={0.15} />
        <Sticker text="Vamos a buscarlo" />
      </Sequence>

      {/* 4 · LLEGADA + OFERTA (contador) */}
      <Sequence {...at(C.llegada)}>
        <Shot src="compra/llegada_anon.mp4" segs={[{from: 0, take: 1.13, rate: 0.45}]} zoom={[1.02, 1.1]} origin="40% 45%" audio={0.15} darken={0.2} />
        <PriceDrop from={1500000} to={500000} y={330} label="NUESTRA 1ª OFERTA" tagText="Tenía 109 multas" />
      </Sequence>

      {/* 5 · ACEPTÓ + PAGO */}
      <Sequence {...at(C.papeles)}>
        <Shot src="compra/papeles_anon.mp4" segs={[{from: 0, take: 2.37, rate: 0.79}]} zoom={[1.04, 1.1]} audio={0.15} darken={0.15} />
        <Sticker text="Cerramos en $700.000" sub="Cliente conforme ✓" red y={250} />
        <Sequence durationInFrames={48}><Stamp text="¡Trato hecho!" color="#16A34A" y={520} /></Sequence>
        <Sequence from={44}><Stamp text="Pagado" color="#16A34A" y={520} rot={6} /></Sequence>
        <Sequence from={44}><PayBar y={780} amount={700000} /></Sequence>
      </Sequence>

      {/* 6 · A LA GRÚA (entra con el camión del logo acelerando) */}
      <Sequence from={C.grua[0] - 22} durationInFrames={C.grua[1] - C.grua[0] + 22}>
        <TruckWipe dur={22}>
          <Sequence from={22} durationInFrames={rampF}>
            <Shot src="footage/IMG_3240.mp4" segs={GRUA_RAMP} zoom={[1.06, 1.16]} origin="38% 62%" shake={3} />
          </Sequence>
          <Sequence from={22 + rampF}>
            <Shot src="footage/IMG_3244.mp4" segs={GRUA_HERO} look="warm" zoom={[1.0, 1.08]} origin="55% 42%" audio={0.3} />
          </Sequence>
          <Sequence from={22}><Sticker text="Directo a la grúa" sub="Grúas Saravia" /></Sequence>
        </TruckWipe>
      </Sequence>

      {/* 7 · YA DISPONIBLE + COTIZA POR WHATSAPP (grabación real del sitio) */}
      <Sequence {...at(C.ficha)}>
        <Screen src="compra/web-ficha.mp4" segs={[{from: 1.2, take: 3.4, rate: 2.4}, {from: 6.6, take: 4.5, rate: 1.4}]} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 70%)'}} />
        <AvailableLead dur={120} />
      </Sequence>

      {/* 8 · BUSCA "SX4" (rápido) */}
      <Sequence {...at(C.busqueda)}>
        <Screen src="compra/web-busqueda.mp4" segs={[{from: 1.0, take: 5.0, rate: 2.5}]} />
        <Sticker text="Busca tu repuesto" sub="Con foto y precio real" red y={1420} />
      </Sequence>

      {/* 9 · COMPRA → PAGO → DESPACHO → CLIENTE FELIZ */}
      <Sequence {...at(C.compra)}>
        <AbsoluteFill style={{filter: 'blur(12px) brightness(0.45)'}}>
          <Shot src="footage/IMG_3244.mp4" segs={[{from: 0.5, take: 2.25, rate: 0.5}]} look="warm" zoom={[1.1, 1.16]} />
        </AbsoluteFill>
        <OrderFlow dur={135} />
      </Sequence>

      {/* 10 · CIERRE DESARMADURÍA */}
      <Sequence {...at(C.cta)}>
        <AbsoluteFill style={{filter: 'blur(10px)'}}>
          <Shot src="footage/IMG_3240.mp4" segs={[{from: 8.0, take: 2.25, rate: 0.5}]} zoom={[1.1, 1.14]} />
        </AbsoluteFill>
        <DesarmeCTA dur={135} />
      </Sequence>

      <Grain opacity={0.05} />

      {/* chat */}
      {[411 + 30, 411 + 52].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={411 + 74}><Audio src={S('audio/sfx_kaching.wav')} volume={0.6} /></Sequence>
      <Sequence from={529}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {/* oferta: tachado, monedas mientras baja el contador, ka-ching al final */}
      <Sequence from={576 + 6}><Audio src={S('audio/sfx_metal.wav')} volume={0.25} /></Sequence>
      <Sequence from={576 + 10}><Audio src={S('audio/sfx_coins.wav')} volume={0.55} /></Sequence>
      <Sequence from={576 + 38}><Audio src={S('audio/sfx_kaching.wav')} volume={0.65} /></Sequence>
      <Sequence from={576 + 40}><Audio src={S('audio/sfx_coin.wav')} volume={0.5} /></Sequence>
      {/* trato hecho + pago */}
      <Sequence from={651}><Audio src={S('audio/sfx_impact.wav')} volume={0.55} /></Sequence>
      <Sequence from={651 + 44}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
      <Sequence from={651 + 46}><Audio src={S('audio/sfx_coins.wav')} volume={0.5} /></Sequence>
      <Sequence from={651 + 70}><Audio src={S('audio/sfx_kaching.wav')} volume={0.65} /></Sequence>
      {/* grúa */}
      <Sequence from={741 - 26}><Audio src={S('audio/sfx_rev.wav')} volume={0.65} /></Sequence>
      <Sequence from={741 - 16}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      {/* ya disponible + cotiza */}
      <Sequence from={831 + 4}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
      <Sequence from={831 + 6}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      {[831 + 38, 831 + 44, 831 + 50].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_tick.wav')} volume={0.3} /></Sequence>
      ))}
      <Sequence from={831 + 70}><Audio src={S('audio/sfx_tick.wav')} volume={0.45} /></Sequence>
      <Sequence from={831 + 76}><Audio src={S('audio/sfx_blip.wav')} volume={0.4} /></Sequence>
      {/* compra: toque, pago aprobado (ka-ching), despacho, entrega */}
      <Sequence from={1011 + 26}><Audio src={S('audio/sfx_tick.wav')} volume={0.45} /></Sequence>
      <Sequence from={1011 + 40}><Audio src={S('audio/sfx_kaching.wav')} volume={0.65} /></Sequence>
      <Sequence from={1011 + 62}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      <Sequence from={1011 + 96}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
      <Sequence from={1011 + 98}><Audio src={S('audio/sfx_blip.wav')} volume={0.4} /></Sequence>
      {/* cierre */}
      <Sequence from={1146}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.55} /></Sequence>
      {[1146 + 26, 1146 + 33, 1146 + 40, 1146 + 47].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_tick.wav')} volume={0.3} /></Sequence>
      ))}
      {/* tu voz completa */}
      <Sequence from={0} durationInFrames={411}><Audio src={S('compra/talk.mp4')} startFrom={24} /></Sequence>
    </AbsoluteFill>
  );
};

/** Loop abierto durante tu saludo: recuerda la pregunta sin taparte la cara. */
const OpenLoop: React.FC = () => {
  const f = useCurrentFrame();
  const p = spring({frame: f, fps: 30, config: {damping: 14, stiffness: 200}});
  const pulse = 1 + 0.04 * Math.max(0, Math.sin(f / 9));
  return (
    <div style={{position: 'absolute', top: 270, left: 60, right: 140, display: 'flex', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * -30}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(8,8,8,0.72)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '12px 20px', fontFamily: MONT, color: '#fff', fontWeight: 800, fontSize: 34}}>
        <span style={{textDecoration: 'line-through', textDecorationColor: K.red, textDecorationThickness: 4, color: 'rgba(255,255,255,0.7)'}}>$1.500.000</span>
        <span>→</span>
        <span style={{background: K.red, padding: '2px 10px', borderRadius: 8}}>$500.000</span>
        <span style={{display: 'inline-block', transform: `scale(${pulse})`, fontWeight: 900}}>¿Abusamos?</span>
      </div>
    </div>
  );
};

/** COLD OPEN: el conflicto (precio) en el primer segundo, pregunta abierta. */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const a = spring({frame: f, fps: 30, config: {damping: 12, stiffness: 230, mass: 0.6}});
  const strike = interpolate(f, [22, 28], [0, 1], cl);
  const b = spring({frame: f - 30, fps: 30, config: {damping: 11, stiffness: 240, mass: 0.6}});
  const q = spring({frame: f - 48, fps: 30, config: {damping: 9, stiffness: 260, mass: 0.6}});
  const flash = interpolate(f, [0, 4], [0.9, 0], cl) + interpolate(f, [29, 30, 34], [0, 0.5, 0], cl);
  const out = interpolate(f, [HOOK - 6, HOOK], [1, 0], cl);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Shot src="footage/IMG_3244.mp4" segs={[{from: 0.6, take: 2.6, rate: 1}]} look="warm" zoom={[1.22, 1.04]} origin="55% 42%" darken={0.35} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.6) 100%)'}} />
      <div style={{position: 'absolute', top: 300, left: 60, right: 140, fontFamily: MONT, color: '#fff'}}>
        <div style={{display: 'inline-block', background: '#fff', color: '#111', fontWeight: 900, fontSize: 30, letterSpacing: '0.12em', padding: '8px 16px', borderRadius: 10, opacity: Math.min(1, a * 2)}}>SUZUKI SX4 · CAJA MALA</div>
        <div style={{marginTop: 22, fontSize: 52, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', opacity: Math.min(1, a * 2), transform: `translateX(${(1 - a) * -60}px)`}}>Nos pidió</div>
        <div style={{position: 'relative', display: 'inline-block', fontSize: 132, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1, transform: `scale(${0.6 + 0.4 * a})`, transformOrigin: 'left center', opacity: f >= 30 ? 0.55 : 1}}>
          $1.500.000
          <div style={{position: 'absolute', left: -8, right: -8, top: '50%', height: 12, background: K.red, transformOrigin: 'left', transform: `scaleX(${strike}) rotate(-4deg)`}} />
        </div>
        <div style={{marginTop: 34, fontSize: 52, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', opacity: Math.min(1, b * 2), transform: `translateX(${(1 - b) * -60}px)`}}>Le ofrecimos</div>
        <div style={{display: 'inline-block', marginTop: 6, background: K.red, padding: '4px 22px 10px', borderRadius: 14, fontSize: 132, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1, transform: `scale(${0.4 + 0.6 * b}) rotate(${(1 - b) * -6}deg)`, transformOrigin: 'left center', opacity: Math.min(1, b * 2), boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
          $500.000
        </div>
        <div style={{marginTop: 40, fontSize: 92, lineHeight: 1, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', transform: `scale(${q})`, transformOrigin: 'left center', textShadow: '0 10px 30px rgba(0,0,0,0.6)'}}>¿Fuimos<br />abusadores?</div>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const CompraSX4: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Sequence durationInFrames={HOOK}><Hook /></Sequence>
    <Sequence from={HOOK}><CompraStory /></Sequence>
    {/* sfx gancho */}
    <Audio src={S('audio/sfx_impact.wav')} volume={0.7} />
    <Sequence from={22}><Audio src={S('audio/sfx_coin.wav')} volume={0.5} /></Sequence>
    <Sequence from={26}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
    <Sequence from={31}><Audio src={S('audio/sfx_kaching.wav')} volume={0.7} /></Sequence>
    <Sequence from={48}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.6} /></Sequence>
    {/* música: fuerte en el gancho, casi muda bajo tu voz, sube en la historia */}
    <Audio src={S('audio/music_fallback.wav')} volume={(fr) => interpolate(fr, [0, HOOK - 6, HOOK + 4, HOOK + 405, HOOK + 418, C_TOTAL - 11, C_TOTAL], [0.75, 0.75, 0.07, 0.07, 0.7, 0.7, 0], cl)} />
  </AbsoluteFill>
);
