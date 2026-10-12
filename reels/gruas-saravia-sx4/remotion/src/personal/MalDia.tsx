import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

/* Tendencia "Un mal día no es una mala vida":
   1) tu selfie caminando con la pregunta arriba;
   2) fondo negro: una silueta baja por una línea roja ("Un mal día") y al
      alejarse la cámara se ve que es solo un bache en una subida verde
      ("No es una mala vida"). Sin música: el sonido lo pones en TikTok. */

loadFont({family: 'Playfair', url: staticFile('fonts/Playfair.ttf'), weight: '400 900', format: 'truetype'});
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SERIF = "'Playfair', 'Times New Roman', serif";
const RED = '#E0162B';
const GREEN = '#2BF59B';

const P1 = 135;              // 4,5 s de selfie
const P2 = 255;              // 8,5 s de gráfico
export const MALDIA_TOTAL = P1 + P2;

/* ---- línea: subida previa (verde), bache (rojo), subida posterior (verde) */
type Pt = [number, number];
const zig = (a: Pt, b: Pt, n: number, amp: number, seed: string): Pt[] =>
  Array.from({length: n + 1}).map((_, i) => {
    const t = i / n;
    const j = i === 0 || i === n ? 0 : (random(seed + i) - 0.5) * 2 * amp * (i % 2 ? 1 : -1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + j];
  });
const PRE = zig([-1700, 1300], [0, 0], 16, 140, 'pre');
const DIP = zig([0, 0], [520, 760], 9, 120, 'dip');
const POST = zig([520, 760], [2600, -1700], 20, 160, 'post');

const lens = (pts: Pt[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
const at = (pts: Pt[], k: number): {p: Pt; ang: number} => {
  const L = lens(pts);
  const tot = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, k)) * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) {
      const u = L[i] ? Math.min(1, d / L[i]) : 0;
      const a = pts[i], b = pts[i + 1];
      return {p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], ang: Math.atan2(b[1] - a[1], b[0] - a[0])};
    }
    d -= L[i];
  }
  return {p: pts[pts.length - 1], ang: 0};
};
const partial = (pts: Pt[], k: number): Pt[] => {
  const L = lens(pts);
  const tot = L.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, k)) * tot;
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < L.length; i++) {
    if (d >= L[i]) { out.push(pts[i + 1]); d -= L[i]; continue; }
    const u = L[i] ? d / L[i] : 0;
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]);
    break;
  }
  return out;
};
const D = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/* silueta cabizbaja caminando */
const Walker: React.FC<{x: number; y: number; t: number; s: number; moving: boolean}> = ({x, y, t, s, moving}) => {
  const sw = moving ? Math.sin(t * 0.45) * 22 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
      {/* piernas */}
      <line x1="0" y1="-62" x2={Math.sin((sw * Math.PI) / 180) * 62} y2={-62 + Math.cos((sw * Math.PI) / 180) * 62} strokeWidth="13" />
      <line x1="0" y1="-62" x2={Math.sin((-sw * Math.PI) / 180) * 62} y2={-62 + Math.cos((-sw * Math.PI) / 180) * 62} strokeWidth="13" />
      {/* torso inclinado */}
      <path d="M-11 -64 L-4 -120 Q8 -132 18 -116 L13 -64 Z" stroke="none" />
      {/* brazos colgando */}
      <line x1="10" y1="-116" x2={12 - sw * 0.25} y2="-72" strokeWidth="9" />
      {/* cabeza agachada */}
      <circle cx="22" cy="-126" r="13" stroke="none" />
    </g>
  );
};

const Part1: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('personal/c3930_slow.mp4')} startFrom={30} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.62) contrast(1.1) saturate(0.75)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)'}} />
    <div style={{position: 'absolute', top: 420, left: 120, right: 120, textAlign: 'center', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 50, lineHeight: 1.25, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.8)', opacity: interpolate(f, [6, 14], [0, 1], cl)}}>
      ¿Por qué sigues sonriendo<br />a pesar de todo?
    </div>
  </AbsoluteFill>
);

const Part2: React.FC<{f: number}> = ({f}) => {
  // fase 1: cámara cerca del bache; fase 2: se aleja y aparece la subida
  const red = interpolate(f, [0, 70], [0, 1], cl);
  const walk = interpolate(f, [0, 95], [0.04, 0.58], cl);
  const zoom = interpolate(f, [92, 170], [0, 1], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const pre = interpolate(f, [96, 130], [0, 1], cl);
  const post = interpolate(f, [104, 220], [0, 1], {...cl, easing: (x) => x * (2 - x)});
  const scale = interpolate(zoom, [0, 1], [1.45, 0.27]);
  const w = at(DIP, walk);
  // en la fase 1 la cámara sigue a la silueta
  const cx = interpolate(zoom, [0, 1], [w.p[0] + 90, 450]);
  const cy = interpolate(zoom, [0, 1], [w.p[1] + 120, -130]);
  const headRed = at(DIP, red).p;
  const headGreen = at(POST, post).p;
  const glow = (c: string, k = 1) => `drop-shadow(0 0 ${8 / scale * k}px ${c}) drop-shadow(0 0 ${20 / scale * k}px ${c})`;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(540 980) scale(${scale}) translate(${-cx} ${-cy})`}>
          {pre > 0 && <path d={D(partial(PRE, 1))} fill="none" stroke={GREEN} strokeWidth={5 / scale * 0.9} opacity={pre * 0.9} strokeLinejoin="round" />}
          <path d={D(partial(DIP, red))} fill="none" stroke={RED} strokeWidth={Math.max(5, 5 / scale * 0.9)} strokeLinejoin="round" />
          {red < 1 && <circle cx={headRed[0]} cy={headRed[1]} r={10} fill={RED} style={{filter: glow(RED, 1.6)}} />}
          {f >= 70 && f < 110 && <circle cx={DIP[DIP.length - 1][0]} cy={DIP[DIP.length - 1][1]} r={14} fill={RED} opacity={interpolate(f, [70, 110], [1, 0], cl)} style={{filter: glow(RED, 1.6)}} />}
          {post > 0 && (
            <>
              <path d={D(partial(POST, post))} fill="none" stroke={GREEN} strokeWidth={5 / scale * 0.9} strokeLinejoin="round" style={{filter: glow('rgba(43,245,155,0.55)', 0.6)}} />
              <circle cx={headGreen[0]} cy={headGreen[1]} r={7 / scale} fill={GREEN} style={{filter: glow(GREEN, 1.4)}} />
            </>
          )}
          <Walker x={w.p[0]} y={w.p[1]} t={f} s={1} moving={f < 95} />
        </g>
      </svg>
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 56, color: '#fff', opacity: interpolate(f, [10, 22], [0, 1], cl)}}>Un mal día</div>
      <div style={{position: 'absolute', top: 402, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 56, color: GREEN, textShadow: '0 0 18px rgba(43,245,155,0.5)', opacity: interpolate(f, [112, 126], [0, 1], cl)}}>No es una mala vida</div>
    </AbsoluteFill>
  );
};

export const MalDia: React.FC = () => {
  const f = useCurrentFrame();
  return f < P1 ? <Part1 f={f} /> : <Part2 f={f - P1} />;
};
