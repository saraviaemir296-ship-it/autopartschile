import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile} from 'remotion';
import {cl} from '../v2/look';

/* Piezas para invitar a los otros servicios sin cortar la historia:
   notificación estilo iPhone, ráfaga de emojis y barrido con las franjas de
   la marca. Los emojis se dibujan con Noto Color Emoji (libre); los de Apple
   son propiedad de Apple y no se pueden incrustar. */

const S = (f: string) => staticFile(f);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);

/* notificación tipo iOS que baja desde arriba */
export const IOSNotif: React.FC<{f: number; at: number; dur?: number; icon: string; iconBg?: string; app: string; title: string; body: string}> = ({f, at, dur = 72, icon, iconBg = '#0A0A0A', app, title, body}) => {
  if (f < at || f >= at + dur) return null;
  const t = f - at;
  const inK = spring({frame: t, fps: 30, config: {damping: 15, stiffness: 220, mass: 0.6}});
  const outK = interpolate(t, [dur - 8, dur], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const y = -260 * (1 - inK) - 260 * outK;
  return (
    <div style={{position: 'absolute', top: 26, left: 34, right: 34, transform: `translateY(${y}px) scale(${0.96 + 0.04 * inK})`}}>
      <div style={{background: 'rgba(245,245,247,0.94)', borderRadius: 40, padding: '22px 26px', display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.55)'}}>
        <div style={{width: 84, height: 84, borderRadius: 20, background: iconBg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={S(icon)} style={{width: '86%', height: '86%', objectFit: 'contain'}} />
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: 1}}>
            <span>{app}</span><span style={{textTransform: 'none'}}>ahora</span>
          </div>
          <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 32, color: '#111', marginTop: 4}}>{title}</div>
          <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 28, color: '#333', lineHeight: 1.25}}>{body}</div>
        </div>
      </div>
    </div>
  );
};

/* ráfaga de emojis que salta desde un punto, con gravedad y giro */
export const EmojiBurst: React.FC<{f: number; at: number; x: number; y: number; emojis: string[]; n?: number; spread?: number; sides?: number}> = ({f, at, x, y, emojis, n = 9, spread = 1, sides = 0}) => {
  const t = f - at;
  if (t < 0 || t > 38) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        // sides > 0: nacen en los bordes (x ± sides) y salen hacia afuera, sin cruzar el centro
        const side = sides ? (i % 2 ? 1 : -1) : 0;
        const a = sides ? (side > 0 ? -0.25 : Math.PI + 0.25) + (random(`ea${at}${i}`) - 0.5) * 1.0 : (-Math.PI / 2) + (random(`ea${at}${i}`) - 0.5) * Math.PI * 1.4;
        const v = (16 + random(`ev${at}${i}`) * 18) * spread;
        const px = x + side * sides + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 0.9 * t * t;
        const s = 0.7 + random(`es${at}${i}`) * 0.8;
        const rot = (random(`er${at}${i}`) - 0.5) * 40 * t;
        return <span key={i} style={{position: 'absolute', left: px, top: py, fontSize: 86 * s, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${interpolate(t, [0, 4], [0.2, 1], cl)})`, opacity: interpolate(t, [26, 38], [1, 0], cl)}}>{emojis[i % emojis.length]}</span>;
      })}
    </AbsoluteFill>
  );
};

/* barrido de transición con las franjas diagonales del logo (negro/rojo/blanco) */
export const StripeWipe: React.FC<{f: number; at: number}> = ({f, at}) => {
  const t = f - at;
  if (t < -7 || t > 7) return null;
  const p = interpolate(t, [-7, 7], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const bands: [string, number][] = [['#0A0A0A', 520], ['#D10B0C', 160], ['#fff', 40], ['#D10B0C', 90], ['#0A0A0A', 380]];
  let off = 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {bands.map(([c, w], i) => {
        const left = -1600 + p * 3400 - off; off += w;
        return <div key={i} style={{position: 'absolute', top: -500, bottom: -500, left, width: w, background: c, transform: 'rotate(18deg)'}} />;
      })}
    </AbsoluteFill>
  );
};

/* aviso grande de servicio (pantalla dividida no; tarjeta que entra desde abajo) */
export const ServiceCard: React.FC<{f: number; at: number; dur?: number; img: string; line1: string; line2: string}> = ({f, at, dur = 60, img, line1, line2}) => {
  if (f < at || f >= at + dur) return null;
  const t = f - at;
  const k = spring({frame: t, fps: 30, config: {damping: 14, stiffness: 200, mass: 0.6}});
  const out = interpolate(t, [dur - 8, dur], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1330, transform: `translateY(${(1 - k) * 700 + out * 700}px)`}}>
      <div style={{background: '#0A0A0A', borderRadius: 26, border: '3px solid #D10B0C', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 18, padding: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.7)'}}>
        <Img src={S(img)} style={{width: 300, borderRadius: 14}} />
        <div>
          <div style={{fontFamily: "'Anton', sans-serif", fontSize: 50, color: '#fff', lineHeight: 1.05}}>{line1}</div>
          <div style={{fontFamily: "'Anton', sans-serif", fontSize: 40, color: '#FF2A2A', lineHeight: 1.1, marginTop: 6, transform: `translateX(${interpolate(t, [6, 14], [-40, 0], {...cl, easing: OUT})}px)`}}>{line2}</div>
        </div>
      </div>
    </div>
  );
};

/* destello de rayos rojo/blanco al aparecer un sello (vectorial, sin emojis) */
export const RayBurst: React.FC<{f: number; at: number; x: number; y: number; r0?: number; n?: number}> = ({f, at, x, y, r0 = 260, n = 14}) => {
  const t = f - at;
  if (t < 0 || t > 16) return null;
  const p = interpolate(t, [0, 16], [0, 1], {...cl, easing: OUT});
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: interpolate(t, [8, 16], [1, 0], cl)}}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + random(`ra${at}${i}`) * 0.3;
        const r1 = r0 + p * 160, r2 = r1 + 40 + random(`rl${at}${i}`) * 70 * (1 - p);
        return <line key={i} x1={x + Math.cos(a) * r1} y1={y + Math.sin(a) * r1 * 0.55} x2={x + Math.cos(a) * r2} y2={y + Math.sin(a) * r2 * 0.55} stroke={i % 3 ? '#FF2A2A' : '#fff'} strokeWidth={9 - p * 6} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/* check blanco en cuadro rojo (bullet de marca) */
export const CheckIcon: React.FC<{size?: number; bg?: string}> = ({size = 58, bg = '#D10B0C'}) => (
  <span style={{width: size, height: size, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);
