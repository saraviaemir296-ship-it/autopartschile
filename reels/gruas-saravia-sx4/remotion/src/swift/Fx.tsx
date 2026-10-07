import React from 'react';
import {AbsoluteFill, Easing, interpolate, random} from 'remotion';
import {cl} from '../v2/look';

/* Capa "premium": gradación de color, fondos con profundidad, destellos de
   luz en los cortes y marcos de enfoque. Todo dentro de la paleta de marca
   (rojo como acento + blancos cálidos); el "color" extra sale de la gradación
   del material real, no de colores nuevos. */

const OUT = Easing.bezier(0.16, 1, 0.3, 1);

// gradación para video/fotos: más saturación y contraste, sin quemar blancos
export const GRADE = 'saturate(1.12) contrast(1.07) brightness(1.02)';

/* fondo oscuro vivo: dos brillos rojos que respiran, piso en perspectiva tipo
   showroom que avanza hacia cámara y bokeh flotando */
export const PremiumBg: React.FC<{f: number}> = ({f}) => {
  const b1x = 540 + Math.sin(f * 0.021) * 380, b1y = 620 + Math.cos(f * 0.017) * 240;
  const b2x = 540 + Math.cos(f * 0.015) * 420, b2y = 1380 + Math.sin(f * 0.019) * 200;
  const hz = 1220;
  const floor = Array.from({length: 16}, (_, i) => {
    const z = (i + ((f * 0.05) % 1)) / 16;
    return {y: hz + Math.pow(z, 2.3) * 720, o: 0.08 + z * 0.35};
  });
  return (
    <AbsoluteFill style={{background: '#070707', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: b1x - 520, top: b1y - 520, width: 1040, height: 1040, borderRadius: '50%', background: 'radial-gradient(circle, rgba(209,11,12,0.55) 0%, rgba(209,11,12,0) 65%)'}} />
      <div style={{position: 'absolute', left: b2x - 460, top: b2y - 460, width: 920, height: 920, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,70,45,0.32) 0%, rgba(255,70,45,0) 65%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="hzg" x1="0" x2="1"><stop offset="0" stopColor="#FF2A2A" stopOpacity="0" /><stop offset="0.5" stopColor="#FF2A2A" stopOpacity="0.9" /><stop offset="1" stopColor="#FF2A2A" stopOpacity="0" /></linearGradient>
        </defs>
        {floor.map((l, i) => <line key={i} x1={0} x2={1080} y1={l.y} y2={l.y} stroke="#fff" strokeOpacity={l.o * 0.5} strokeWidth={1.5} />)}
        {Array.from({length: 15}, (_, i) => -1300 + i * 260).map((x, i) => <line key={`v${i}`} x1={540} y1={hz} x2={x} y2={1920} stroke="#fff" strokeOpacity={0.09} strokeWidth={1.5} />)}
        <rect x={0} y={hz - 2} width={1080} height={4} fill="url(#hzg)" />
      </svg>
      {Array.from({length: 22}, (_, i) => {
        const x = random(`bx${i}`) * 1080;
        const sp = 0.6 + random(`bs${i}`) * 1.6;
        const y = 1920 - ((random(`by${i}`) * 1920 + f * sp) % 2100);
        const r = 4 + random(`br${i}`) * 14;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: i % 4 ? 'rgba(255,255,255,0.5)' : 'rgba(255,42,42,0.8)', filter: `blur(${r * 0.35}px)`, opacity: 0.55}} />;
      })}
    </AbsoluteFill>
  );
};

/* destello de luz (light leak) que cruza la pantalla en un corte */
export const LightLeaks: React.FC<{f: number; at: number[]; dur?: number}> = ({f, at, dur = 18}) => {
  const a = at.find((x) => f >= x - 4 && f < x + dur);
  if (a === undefined) return null;
  const p = (f - (a - 4)) / (dur + 4);
  const x = -500 + p * 2100;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * p) * 0.5}}>
      <div style={{position: 'absolute', left: x - 500, top: 100, width: 1000, height: 1720, transform: 'rotate(18deg)', background: 'radial-gradient(ellipse at center, rgba(255,246,236,0.95) 0%, rgba(255,60,40,0.75) 28%, rgba(255,130,50,0.35) 52%, rgba(0,0,0,0) 70%)'}} />
    </AbsoluteFill>
  );
};

/* marco de enfoque tipo visor: 4 esquinas rojas que se cierran sobre el producto */
export const Brackets: React.FC<{f: number; at: number; until: number; x: number; y: number; w: number; h: number}> = ({f, at, until, x, y, w, h}) => {
  if (f < at || f >= until) return null;
  const p = interpolate(f - at, [0, 9], [0, 1], {...cl, easing: OUT});
  const o = interpolate(f, [until - 5, until], [1, 0], cl) * p;
  const pad = (1 - p) * 90;
  const L = 74, Tk = 8;
  const c = '#FF2A2A';
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <>
      <div style={{position: 'absolute', left: sx > 0 ? cx : cx - L, top: sy > 0 ? cy : cy - Tk, width: L, height: Tk, background: c}} />
      <div style={{position: 'absolute', left: sx > 0 ? cx : cx - Tk, top: sy > 0 ? cy : cy - L, width: Tk, height: L, background: c}} />
    </>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o, filter: 'drop-shadow(0 0 10px rgba(209,11,12,0.8))'}}>
      {corner(x - pad, y - pad, 1, 1)}
      {corner(x + w + pad, y - pad, -1, 1)}
      {corner(x - pad, y + h + pad, 1, -1)}
      {corner(x + w + pad, y + h + pad, -1, -1)}
      <div style={{position: 'absolute', left: x + w / 2 - 14, top: y + h / 2 - 2, width: 28, height: 4, background: 'rgba(255,255,255,0.7)', opacity: 0.6 * p}} />
      <div style={{position: 'absolute', left: x + w / 2 - 2, top: y + h / 2 - 14, width: 4, height: 28, background: 'rgba(255,255,255,0.7)', opacity: 0.6 * p}} />
    </AbsoluteFill>
  );
};

/* precio orbitando en 3D alrededor de un repuesto: las letras recorren una
   elipse inclinada; adelante se ven grandes y brillantes, atrás chicas,
   tenues y desenfocadas (sensación de pasar por detrás del objeto) */
export const PriceOrbit: React.FC<{f: number; at: number; until: number; cx: number; cy: number; rx: number; ry: number; text: string; size?: number; speed?: number; tilt?: number}> = ({f, at, until, cx, cy, rx, ry, text, size = 58, speed = 0.045, tilt = -8}) => {
  if (f < at || f >= until) return null;
  const t = f - at;
  const grow = interpolate(t, [0, 12], [0.25, 1], {...cl, easing: OUT});
  const fade = interpolate(f, [until - 6, until], [1, 0], cl) * interpolate(t, [0, 5], [0, 1], cl);
  const ch = text.split('');
  const n = ch.length;
  const base = Math.PI / 2 + t * speed + (1 - grow) * 2.5;
  const rad = (tilt * Math.PI) / 180;
  const items = ch.map((c, i) => {
    const th = base - (i / n) * Math.PI * 2; // sentido inverso: adelante se lee de izquierda a derecha
    const x0 = Math.cos(th) * rx * grow, y0 = Math.sin(th) * ry * grow;
    const x = cx + x0 * Math.cos(rad) - y0 * Math.sin(rad);
    const y = cy + x0 * Math.sin(rad) + y0 * Math.cos(rad);
    const depth = Math.sin(th); // 1 = adelante, -1 = atrás
    const ang = 0;
    return {c, x, y, depth, ang, i};
  });
  items.sort((a, b) => a.depth - b.depth);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: fade}}>
      {items.map(({c, x, y, depth, ang, i}) => {
        const k = (depth + 1) / 2;
        const red = c === '$' || c === '•';
        return (
          <span key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${-Math.cos(Math.atan2(y - cy, x - cx)) * 10 + tilt * 0.5}deg) scale(${0.55 + 0.75 * k})`, fontFamily: "'Anton', sans-serif", fontSize: size, lineHeight: 1, color: red ? '#FF2A2A' : '#fff', opacity: 0.25 + 0.75 * k, filter: k < 0.45 ? `blur(${(0.45 - k) * 6}px)` : undefined, textShadow: k > 0.5 ? '0 0 14px rgba(209,11,12,0.9), 0 4px 10px rgba(0,0,0,0.8)' : 'none'}}>{c}</span>
        );
      })}
    </AbsoluteFill>
  );
};
