import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../v2/Shot';
import {MONT} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {E, K, cl} from '../v2/look';

/**
 * SX4 · v15 (~30 s): encendido real + gancho, vuelta 360° con rayos X en 6 piezas
 * (la primera lenta, las demás rápidas, el frente en una sola congelada), +100
 * repuestos, faro de ubicación, casa matriz y WhatsApp.
 */
const S = (f: string) => staticFile(f);
const CYAN = '#E6EEF2';
const NAVY = '#0A0B0D';
const DISP = "'Anton', 'Montserrat', sans-serif";

type Part = {name: string; short: string; x: number; y: number; price: string; img?: string; card?: 'left' | 'right'; oem?: string};
type Freeze = {still: string; xray: string; parts: Part[]};

const F1: Freeze = {
  still: 'atlas/walk_f1.jpg',
  xray: 'atlas/walk_f1_xray.jpg',
  parts: [
    {name: 'Computador ECU AT 4x4', short: 'Computador ECU', x: 560, y: 900, price: '$224.990', img: 'p-ecu.jpg', card: 'left', oem: 'OEM 33910-54L20'},
    {name: 'Radiador de calefacción', short: 'Radiador calefacción', x: 880, y: 850, price: '$94.990', img: 'p-radiador.jpg', card: 'left', oem: 'OEM 74120-61MA0'},
  ],
};
const F2: Freeze = {
  still: 'atlas/walk_f2.jpg',
  xray: 'atlas/walk_f2_xray.jpg',
  parts: [{name: 'Foco trasero derecho', short: 'Foco trasero', x: 940, y: 780, price: '$84.990', img: 'p-foco-trasero.jpg', card: 'left'}],
};
const F3: Freeze = {
  still: 'atlas/walk_f3.jpg',
  xray: 'atlas/walk_f3_xray.jpg',
  parts: [
    {name: 'Focos delanteros (par)', short: 'Focos delanteros', x: 760, y: 930, price: '$119.990', img: 'p-focos-delanteros.jpg'},
    {name: 'Parachoque completo', short: 'Parachoque', x: 820, y: 1130, price: '$119.990', img: 'p-parachoque.jpg'},
    {name: 'Refuerzo de parachoque', short: 'Refuerzo', x: 940, y: 1210, price: '$79.990', img: 'p-refuerzo.jpg'},
  ],
};

/* duraciones: la primera pieza se explica, las demás van rápido */
const FIRST = 50;
const NEXT = 34;
const COMBO = 70;
const SCAN = 18;
const winF1 = [[SCAN, FIRST], [SCAN + FIRST, NEXT]];
const winF2 = [[SCAN, NEXT]];

const DUR = {
  hook: 90,
  w0: 24,
  f1: SCAN + FIRST + NEXT + 6,
  w1: 45,
  f2: SCAN + NEXT + 6,
  w2: 46,
  f3: SCAN + COMBO + 6,
  count: 120,
  beacon: 120,
  local: 50,
  cta: 150,
};
type Key = keyof typeof DUR;
const ORDER: Key[] = ['hook', 'w0', 'f1', 'w1', 'f2', 'w2', 'f3', 'count', 'beacon', 'local', 'cta'];
export const W15 = (() => {
  const o = {} as Record<Key, [number, number]>;
  let c = 0;
  for (const k of ORDER) {
    o[k] = [c, c + DUR[k]];
    c += DUR[k];
  }
  return o;
})();
export const W15_TOTAL = W15.cta[1];
const W = W15;

/* frames absolutos en que cada pieza "llega" a la web (contador) */
const ARRIVALS: number[] = [
  ...winF1.map(([a, l]) => W.f1[0] + a + l - 2),
  ...winF2.map(([a, l]) => W.f2[0] + a + l - 2),
  ...[0, 1, 2].map(() => W.f3[0] + SCAN + COMBO - 4),
];
const countAt = (f: number) => ARRIVALS.filter((a) => f >= a).length;
const bumpAt = (f: number) => Math.max(0, ...ARRIVALS.map((a) => (f >= a && f < a + 10 ? 1 - (f - a) / 10 : 0)));

const sp = (f: number, d = 0, damping = 13, stiffness = 210) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const fade = (f: number, a: number, len = 8) => interpolate(f, [a, a + len], [0, 1], {...cl, easing: E.out});
const at = (r: readonly number[]) => ({from: r[0], durationInFrames: r[1] - r[0]});

const Title: React.FC<{kicker: string; text: string; red?: string; t: number; size?: number}> = ({kicker, text, red, t, size = 70}) => {
  const p = sp(t, 0, 13, 200);
  return (
    <div style={{position: 'absolute', top: 240, left: 60, right: 140, fontFamily: MONT, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px)`, textShadow: '0 4px 18px rgba(0,0,0,0.5)'}}>
      <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '0.14em', color: CYAN}}>{kicker}</div>
      <div style={{marginTop: 6, fontFamily: DISP, fontSize: size * 1.12, fontWeight: 400, textTransform: 'uppercase', lineHeight: 1.0, letterSpacing: '0.01em'}}>
        {text} {red && <span style={{background: K.red, padding: '0 12px'}}>{red}</span>}
      </div>
    </div>
  );
};

/* contador "piezas publicadas en la web" */
const Counter: React.FC<{n: number; bump: number}> = ({n, bump}) => (
  <div style={{position: 'absolute', left: 0, right: 80, top: 1390, display: 'flex', justifyContent: 'center', fontFamily: MONT}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(10,11,13,0.92)', border: `2px solid ${CYAN}`, borderRadius: 99, padding: '12px 28px', color: '#fff', fontWeight: 800, fontSize: 34, boxShadow: '0 0 30px rgba(255,255,255,0.25)', transform: `scale(${1 + 0.14 * bump})`}}>
      <span style={{width: 18, height: 18, borderRadius: 99, background: '#4ADE80'}} />
      autopartschile.cl · <span style={{color: '#4ADE80', fontWeight: 900}}>{n} {n === 1 ? 'pieza publicada' : 'piezas publicadas'}</span>
    </div>
  </div>
);

/* congelada: foto real → flash → escaneo → rayos X, con cámara que entra a la pieza activa */
const FreezeScene: React.FC<{fr: Freeze; t: number; base: number; wins?: number[][]; combo?: boolean; title?: boolean}> = ({fr, t, base, wins, combo, title}) => {
  const scan = interpolate(t, [2, SCAN], [0, 1], {...cl, easing: E.inOut});
  const sx = scan * 1080;
  const flash = interpolate(t, [0, 5], [0.7, 0], cl);
  let origin = '50% 50%';
  let zoom = 1;
  if (wins) {
    fr.parts.forEach((p, i) => {
      const [a, l] = wins[i];
      const tt = t - a;
      if (tt >= 0 && tt < l) {
        origin = `${p.x}px ${p.y}px`;
        zoom = 1 + 0.26 * Math.min(interpolate(tt, [0, 10], [0, 1], {...cl, easing: E.inOut}), interpolate(tt, [l - 8, l], [1, 0], {...cl, easing: E.inOut}));
      }
    });
  } else if (combo) {
    origin = '820px 1080px';
    zoom = 1 + 0.18 * interpolate(t, [SCAN, SCAN + 14], [0, 1], {...cl, easing: E.inOut});
  }
  const glitch = scan > 0 && scan < 1;
  return (
    <AbsoluteFill style={{backgroundColor: NAVY, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: origin}}>
        <Img src={S(fr.still)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 0 0 ${sx}px)`}} />
        <Img src={S(fr.xray)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 ${1080 - sx}px 0 0)`}} />
        {glitch && <Img src={S(fr.xray)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 ${1080 - sx}px 0 ${Math.max(0, sx - 160)}px)`, transform: 'translateX(-10px)', mixBlendMode: 'screen', opacity: 0.5}} />}
        {fr.parts.map((p, i) => {
          const a = wins ? wins[i][0] : SCAN;
          const l = wins ? wins[i][1] : COMBO;
          const tt = t - a;
          if (tt < 0) return null;
          return <Dot key={i} p={p} t={tt} active={tt < l} />;
        })}
      </AbsoluteFill>
      {glitch && <div style={{position: 'absolute', top: 0, bottom: 0, left: sx - 3, width: 6, background: CYAN, boxShadow: `0 0 34px 12px ${CYAN}`}} />}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,11,13,0.92) 0%, rgba(10,11,13,0.7) 22%, rgba(10,11,13,0) 38%)'}} />
      <HudFrame t={t} />
      {title && <Title kicker="SUZUKI SX4 2006–2015" text="Recién publicadas" red="en la web" t={t - 2} size={64} />}
      {wins &&
        fr.parts.map((p, i) => {
          const [a, l] = wins[i];
          const tt = t - a;
          if (tt < 0 || tt > l + 4) return null;
          return (
            <React.Fragment key={i}>
              <Reticle p={p} t={tt} len={l} />
              <Card p={p} t={tt} len={l} />
              <Fly p={p} t={tt} len={l} />
            </React.Fragment>
          );
        })}
      {combo && <ComboCard fr={fr} t={t - SCAN} />}
      <Counter n={countAt(base + t)} bump={bumpAt(base + t)} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

/* las 3 piezas del frente en una sola tarjeta, rápido */
const ComboCard: React.FC<{fr: Freeze; t: number}> = ({fr, t}) => {
  if (t < 0) return null;
  const k = sp(t, 0, 15, 190);
  const out = interpolate(t, [COMBO - 10, COMBO - 4], [1, 0], cl);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
        {fr.parts.map((p, i) => {
          const r = sp(t, 6 + i * 6, 14, 220);
          const ry = 470 + i * 118 + 55;
          return <line key={i} x1={p.x} y1={p.y} x2={60 + 600} y2={ry} stroke="#fff" strokeWidth={3} strokeDasharray="1600" strokeDashoffset={1600 * (1 - r)} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 60, top: 400, width: 600, fontFamily: MONT, opacity: Math.min(1, k * 2) * out, transform: `translateX(${(1 - k) * -60}px)`}}>
        <div style={{display: 'inline-block', background: K.red, color: '#fff', fontFamily: DISP, fontSize: 46, padding: '0 14px 2px', borderRadius: 8, textTransform: 'uppercase'}}>Frente completo</div>
        {fr.parts.map((p, i) => {
          const r = sp(t, 6 + i * 6, 14, 220);
          const run = interpolate(t, [10 + i * 6, 20 + i * 6], [0.7, 1], {...cl, easing: E.out});
          return (
            <div key={i} style={{marginTop: 10, height: 108, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 14, padding: 8, boxShadow: '0 12px 30px rgba(0,0,0,0.45)', opacity: Math.min(1, r * 2), transform: `translateX(${(1 - r) * -50}px)`}}>
              <div style={{width: 150, height: 92, borderRadius: 10, overflow: 'hidden', flexShrink: 0}}>
                <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <div style={{flex: 1}}>
                <div style={{color: '#0b0b0b', fontWeight: 900, fontSize: 34, lineHeight: 1.05}}>{p.short}</div>
                <div style={{color: '#16A34A', fontWeight: 800, fontSize: 24}}>✓ Publicado</div>
              </div>
              <div style={{fontFamily: DISP, color: K.red, fontSize: 52, paddingRight: 8, fontVariantNumeric: 'tabular-nums'}}>{clp(priceNum(p.price) * run)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/* esquinas tipo visor que encuadran toda la pantalla durante la congelada */
const HudFrame: React.FC<{t: number}> = ({t}) => {
  const k = sp(t, 6, 16, 160);
  const L = 70;
  const corner = (x: number, y: number, rx: number, ry: number) => (
    <div style={{position: 'absolute', left: x, top: y, width: L, height: L, borderLeft: rx < 0 ? 'none' : `4px solid ${CYAN}`, borderRight: rx < 0 ? `4px solid ${CYAN}` : 'none', borderTop: ry < 0 ? 'none' : `4px solid ${CYAN}`, borderBottom: ry < 0 ? `4px solid ${CYAN}` : 'none', opacity: 0.8 * k, transform: `translate(${(1 - k) * rx * 40}px, ${(1 - k) * ry * 40}px)`}} />
  );
  return (
    <>
      {corner(40, 470, -1, -1)}
      {corner(1080 - 40 - L - 100, 470, 1, -1)}
      {corner(40, 1500 - L, -1, 1)}
      {corner(1080 - 40 - L - 100, 1500 - L, 1, 1)}
    </>
  );
};

/* punto de la pieza */
const Dot: React.FC<{p: Part; t: number; active: boolean}> = ({p, t, active}) => {
  const pop = sp(t, 0, 10, 260);
  const pulse = 1 + 0.3 * Math.max(0, Math.sin(t / 4));
  return (
    <>
      {active && <div style={{position: 'absolute', left: p.x - 60, top: p.y - 60, width: 120, height: 120, borderRadius: 99, border: `3px solid ${K.red}`, opacity: interpolate(t % 20, [0, 20], [0.9, 0]), transform: `scale(${interpolate(t % 20, [0, 20], [0.3, 1.2])})`}} />}
      <div style={{position: 'absolute', left: p.x - 22, top: p.y - 22, width: 44, height: 44, borderRadius: 99, border: `4px solid ${active ? '#fff' : CYAN}`, background: active ? K.red : 'rgba(255,255,255,0.45)', transform: `scale(${pop * (active ? pulse : 0.6)})`, boxShadow: `0 0 26px ${active ? K.red : CYAN}`}} />
    </>
  );
};

/* visor que se cierra sobre la pieza (en coordenadas de pantalla: el punto queda fijo con el zoom) */
const Reticle: React.FC<{p: Part; t: number; len: number}> = ({p, t, len}) => {
  const k = interpolate(t, [0, 12], [0, 1], {...cl, easing: E.out});
  const out = interpolate(t, [len - 10, len], [1, 0], cl);
  const d = 150 - 70 * k;
  const L = 34;
  const c = (sx: number, sy: number) => (
    <div style={{position: 'absolute', left: p.x + sx * d - (sx < 0 ? 0 : L), top: p.y + sy * d - (sy < 0 ? 0 : L), width: L, height: L, borderLeft: sx < 0 ? '5px solid #fff' : 'none', borderRight: sx > 0 ? '5px solid #fff' : 'none', borderTop: sy < 0 ? '5px solid #fff' : 'none', borderBottom: sy > 0 ? '5px solid #fff' : 'none', opacity: k * out}} />
  );
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: k * out}}>
        <circle cx={p.x} cy={p.y} r={66} fill="none" stroke={CYAN} strokeWidth={3} strokeDasharray="14 10" transform={`rotate(${t * 6} ${p.x} ${p.y})`} />
      </svg>
      {c(-1, -1)}
      {c(1, -1)}
      {c(-1, 1)}
      {c(1, 1)}
    </>
  );
};

const CARD_W = 400;
const priceNum = (s: string) => Number(s.replace(/[^0-9]/g, '')) || 0;
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');

/* tarjeta: gira en 3D, precio que corre hasta el valor real y sello PUBLICADO */
const Card: React.FC<{p: Part; t: number; len: number}> = ({p, t, len}) => {
  const lab = sp(t, 6, 15, 170);
  const out = interpolate(t, [len - 14, len - 8], [1, 0], cl);
  const cx = p.card === 'right' ? 1080 - 140 - CARD_W : 60;
  const cy = 450;
  const cardH = (p.img ? 380 : 160) + (p.oem ? 40 : 0);
  const money = p.price.startsWith('$');
  const target = priceNum(p.price);
  const run = interpolate(t, [8, 18], [0, 1], {...cl, easing: E.out});
  const suffix = p.price.includes('el par') ? ' el par' : '';
  const stamp = sp(t, 18, 9, 260);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
        <line x1={p.x} y1={p.y} x2={cx + CARD_W / 2} y2={cy + cardH} stroke="#fff" strokeWidth={3} strokeDasharray="1600" strokeDashoffset={1600 * (1 - lab)} />
        <circle cx={cx + CARD_W / 2} cy={cy + cardH} r={7 * lab} fill="#fff" />
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, width: CARD_W, perspective: 900, opacity: Math.min(1, lab * 2) * out}}>
        <div style={{transform: `rotateY(${(1 - lab) * (p.card === 'right' ? 70 : -70)}deg) scale(${0.85 + 0.15 * lab})`, transformOrigin: p.card === 'right' ? 'right center' : 'left center', fontFamily: MONT, position: 'relative'}}>
          {p.img && (
            <div style={{width: CARD_W, height: 220, borderRadius: 16, overflow: 'hidden', border: '4px solid #fff', boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 30px rgba(255,255,255,${0.5 * lab})`, background: '#fff'}}>
              <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.15 * lab})`}} />
            </div>
          )}
          <div style={{display: 'inline-block', marginTop: p.img ? 10 : 0, background: '#fff', color: '#0b0b0b', fontWeight: 900, fontSize: 36, padding: '6px 16px 8px', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)'}}>{p.name}</div>
          {p.oem && <div style={{marginTop: 6, display: 'inline-block', background: NAVY, border: `2px solid ${CYAN}`, color: CYAN, fontWeight: 800, fontSize: 28, padding: '3px 12px', borderRadius: 8, letterSpacing: '0.02em'}}>{p.oem}</div>}
          <div style={{marginTop: 8, display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{background: money ? K.red : '#16A34A', color: '#fff', fontFamily: money ? DISP : MONT, fontWeight: money ? 400 : 900, fontSize: money ? 56 : 34, padding: '0px 16px 2px', borderRadius: 10, fontVariantNumeric: 'tabular-nums', boxShadow: '0 10px 26px rgba(0,0,0,0.4)'}}>
              {money ? clp(target * (0.7 + 0.3 * run)) + (run >= 1 ? suffix : '') : p.price}
            </span>
          </div>
          {t >= 18 && (
            <div style={{position: 'absolute', right: p.img ? -10 : 0, top: p.img ? 14 : -46, transform: `rotate(-10deg) scale(${2.2 - 1.2 * stamp})`, opacity: Math.min(1, stamp * 3), border: '5px solid #4ADE80', color: '#4ADE80', background: 'rgba(10,11,13,0.85)', borderRadius: 10, padding: '4px 14px', fontWeight: 900, fontSize: 30, letterSpacing: '0.06em'}}>✓ PUBLICADO</div>
          )}
        </div>
      </div>
    </>
  );
};

/* la pieza viaja al contador de la web con estela */
const Fly: React.FC<{p: Part; t: number; len: number}> = ({p, t, len}) => {
  const a = len - 14;
  if (t < a || t > a + 14) return null;
  const x0 = p.card === 'right' ? 1080 - 140 - CARD_W / 2 : 60 + CARD_W / 2;
  const y0 = 560;
  const pos = (k: number) => ({x: x0 + (470 - x0) * k, y: y0 + (1420 - y0) * k - Math.sin(k * Math.PI) * 160});
  const k0 = interpolate(t, [a, a + 12], [0, 1], {...cl, easing: E.inOut});
  return (
    <>
      {[4, 3, 2, 1, 0].map((j) => {
        const k = Math.max(0, k0 - j * 0.07);
        const {x, y} = pos(k);
        const main = j === 0;
        return (
          <div key={j} style={{position: 'absolute', left: x - 90, top: y - 50, width: 180, height: 100, borderRadius: 12, overflow: 'hidden', border: `3px solid ${CYAN}`, background: NAVY, color: CYAN, fontFamily: MONT, fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transform: `scale(${1 - 0.6 * k})`, boxShadow: main ? `0 0 30px ${CYAN}` : 'none', opacity: main ? 1 : 0.18 * (5 - j) / 5}}>
            {p.img ? <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : p.short}
          </div>
        );
      })}
    </>
  );
};

const Walk: React.FC<{from: number; rate?: number}> = ({from, rate = 1}) => (
  <OffthreadVideo src={S('atlas/walk.mp4')} startFrom={Math.round(from * 30)} playbackRate={rate} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
);

const Bg: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #1C1F23 0%, ${NAVY} 55%, #000000 100%)`}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
  </AbsoluteFill>
);

const MAP_W = 1179;
const MAP_H = 990;
const PIN = {x: 588, y: 440};
/* animación propia: mapa oscuro en 3D, faro rojo sobre el local, radar y rutas que llegan */
const ROUTES = [
  'M 0 512 L 560 548 L 588 470',
  'M 1179 606 L 620 552 L 588 470',
  'M 420 0 L 420 500 L 560 548 L 588 470',
];
const Beacon: React.FC<{t: number}> = ({t}) => {
  const tilt = interpolate(t, [0, 30], [0, 58], {...cl, easing: E.out});
  const rot = interpolate(t, [0, 120], [-8, 10], cl);
  const zoom = interpolate(t, [0, 120], [1.7, 2.05], cl);
  const route = interpolate(t, [18, 70], [0, 1], {...cl, easing: E.inOut});
  const beam = sp(t, 26, 12, 160);
  const lab = sp(t, 50, 13, 200);
  const flash = interpolate(t, [0, 6], [0.8, 0], cl);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #2A0606 0%, #0A0B0D 60%, #000 100%)', overflow: 'hidden', perspective: 1500}}>
      <div style={{position: 'absolute', left: 540 - PIN.x, top: 1050 - PIN.y, width: MAP_W, height: MAP_H, transformStyle: 'preserve-3d', transformOrigin: `${PIN.x}px ${PIN.y}px`, transform: `scale(${zoom}) rotateX(${tilt}deg) rotateZ(${rot}deg)`}}>
        <Img src={S('atlas/maps.png')} style={{position: 'absolute', inset: 0, width: MAP_W, height: MAP_H, filter: 'invert(1) hue-rotate(180deg) grayscale(0.8) brightness(0.95) contrast(1.25)'}} />
        <svg width={MAP_W} height={MAP_H} style={{position: 'absolute', inset: 0}}>
          {ROUTES.map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" stroke={K.red} strokeOpacity={0.45} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - route} style={{filter: 'blur(8px)'}} />
              <path d={d} fill="none" stroke="#FF3B30" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - route} />
            </g>
          ))}
          {/* radar en el suelo */}
          {[0, 1, 2].map((i) => {
            const k = (((t - 20) + i * 14) % 42) / 42;
            if (t < 20) return null;
            return <circle key={i} cx={PIN.x} cy={PIN.y} r={30 + 260 * k} fill="none" stroke="#FF3B30" strokeWidth={6} strokeOpacity={0.8 * (1 - k)} />;
          })}
          <circle cx={PIN.x} cy={PIN.y} r={26} fill="#FF3B30" />
          <circle cx={PIN.x} cy={PIN.y} r={12} fill="#fff" />
        </svg>
        {/* columna de luz que se levanta desde el local */}
        <div style={{position: 'absolute', left: PIN.x - 40, top: PIN.y - 700, width: 80, height: 700, transformOrigin: 'bottom center', transform: `rotateX(-90deg) scaleY(${beam})`, background: 'linear-gradient(0deg, rgba(255,59,48,0.95) 0%, rgba(255,59,48,0.35) 55%, rgba(255,59,48,0) 100%)', filter: 'blur(4px)', borderRadius: 40}} />
        <div style={{position: 'absolute', left: PIN.x - 12, top: PIN.y - 700, width: 24, height: 700, transformOrigin: 'bottom center', transform: `rotateX(-90deg) scaleY(${beam})`, background: 'linear-gradient(0deg, #fff 0%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 100%)'}} />
      </div>
      {/* etiqueta flotante */}
      <div style={{position: 'absolute', left: 0, right: 80, top: 300, display: 'flex', justifyContent: 'center', fontFamily: MONT, opacity: Math.min(1, lab * 2), transform: `translateY(${(1 - lab) * -40}px) scale(${0.85 + 0.15 * lab})`}}>
        <div style={{textAlign: 'center', color: '#fff'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: K.red, padding: '4px 26px 8px', borderRadius: 16, fontFamily: DISP, fontSize: 92, fontWeight: 400, textTransform: 'uppercase', boxShadow: '0 0 60px rgba(255,59,48,0.6)'}}>
            <svg width="52" height="70" viewBox="0 0 24 34"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 34 12 34s12-13.6 12-22.3C24 5.2 18.6 0 12 0z" fill="#fff" /><circle cx="12" cy="11.6" r="4.6" fill={K.red} /></svg>
            Estamos aquí
          </div>
          <div style={{marginTop: 16, fontSize: 44, fontWeight: 900}}>Desarmaduría Saravia</div>
          <div style={{marginTop: 6, fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.85)'}}>Av. Lo Blanco 1072 · La Pintana</div>
        </div>
      </div>
      {/* nombres de calles reales en las rutas */}
      <div style={{position: 'absolute', left: 60, bottom: 470, fontFamily: MONT, fontWeight: 800, fontSize: 34, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', opacity: fade(t, 40)}}>AV. LO BLANCO · LOS LIMONEROS</div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

/* GANCHO: llave + motor rugiendo de fondo, "¿DUEÑO DE UN SX4?" y ráfaga de piezas con precio */
const BURST: {img: string; price: string; name: string}[] = [
  {img: 'p-ecu.jpg', price: '$224.990', name: 'ECU AT 4x4'},
  {img: 'p-focos-delanteros.jpg', price: '$119.990', name: 'Focos (par)'},
  {img: 'p-parachoque.jpg', price: '$119.990', name: 'Parachoque'},
];
const Hook: React.FC<{t: number}> = ({t}) => {
  const slam = sp(t, 0, 9, 280);
  const shake = t < 10 ? Math.sin(t * 2.7) * (10 - t) * 2 : 0;
  const flash = interpolate(t, [0, 4], [0.9, 0], cl);
  const out = interpolate(t, [84, 90], [1, 0], cl);
  const motor = sp(t, 16, 12, 240);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <OffthreadVideo src={S('atlas/encendido.mp4')} volume={(fr) => (fr < 18 ? 1 : 0.32)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(t, [0, 90], [1.05, 1.15], cl)})`, filter: 'brightness(0.55)'}} />
      <div style={{position: 'absolute', top: 240, left: 60, right: 140, color: '#fff', transform: `translate(${shake}px, ${-shake * 0.5}px)`}}>
        <div style={{fontFamily: MONT, fontSize: 52, fontWeight: 900, fontStyle: 'italic', opacity: Math.min(1, slam * 2), textShadow: '0 4px 18px rgba(0,0,0,0.6)'}}>¿DUEÑO DE UN</div>
        <div style={{display: 'inline-block', marginTop: 6, background: K.red, padding: '4px 26px 10px', borderRadius: 14, fontFamily: DISP, fontSize: 170, lineHeight: 1, transform: `scale(${1.6 - 0.6 * slam}) rotate(-3deg)`, transformOrigin: 'left center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>SUZUKI SX4?</div>
        <div style={{marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 12, background: '#16A34A', fontFamily: MONT, fontWeight: 900, fontSize: 36, padding: '6px 18px 8px', borderRadius: 12, transform: `scale(${motor})`, transformOrigin: 'left'}}>
          <span style={{width: 16, height: 16, borderRadius: 99, background: '#fff', opacity: t % 16 < 9 ? 1 : 0.3}} /> Motor M16A andando
        </div>
      </div>
      {BURST.map((b, i) => {
        const a = 30 + i * 12;
        if (t < a) return null;
        const k = sp(t, a, 10, 260);
        return (
          <div key={i} style={{position: 'absolute', left: [110, 260, 120][i], top: [720, 900, 1080][i], width: 620, fontFamily: MONT, transform: `scale(${1.5 - 0.5 * k}) rotate(${[-6, 5, -3][i]}deg)`, opacity: Math.min(1, k * 2)}}>
            <div style={{width: 620, height: 340, borderRadius: 18, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', background: '#fff'}}>
              <Img src={S('atlas/' + b.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div style={{position: 'absolute', right: -20, bottom: -30, background: K.red, color: '#fff', fontFamily: DISP, fontSize: 72, padding: '0 20px 4px', borderRadius: 14, boxShadow: '0 12px 30px rgba(0,0,0,0.5)'}}>{b.price}</div>
            <div style={{position: 'absolute', left: -14, top: -24, background: '#fff', color: '#111', fontWeight: 900, fontSize: 36, padding: '4px 16px 6px', borderRadius: 10}}>{b.name}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 80, top: 1450, display: 'flex', justifyContent: 'center', opacity: fade(t, 64)}}>
        <div style={{background: 'rgba(10,11,13,0.92)', border: `2px solid ${CYAN}`, borderRadius: 16, padding: '6px 26px 8px', color: '#fff', fontFamily: DISP, fontSize: 52, textTransform: 'uppercase'}}>
          Repuestos originales desde <span style={{color: '#4ADE80'}}>$79.990</span>
        </div>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

/* +100 repuestos, grande y legible */
const BIG: [string, number][] = [
  ['Motor', 30],
  ['Carrocería', 22],
  ['Electrónica', 19],
  ['Suspensión y 4x4', 23],
];
const CountScene: React.FC<{t: number}> = ({t}) => {
  const n = Math.round(interpolate(t, [2, 26], [0, 100], {...cl, easing: E.out}));
  const pop = sp(t, 26, 8, 260);
  return (
    <div style={{position: 'absolute', top: 250, left: 60, right: 140, color: '#fff'}}>
      <div style={{fontFamily: MONT, fontSize: 34, fontWeight: 800, letterSpacing: '0.14em', color: CYAN, opacity: fade(t, 0)}}>SE DESARMA COMPLETO</div>
      <div style={{fontFamily: DISP, fontSize: 300, lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums', transform: `scale(${t >= 26 ? 1 + 0.1 * (1 - pop) : 1})`, transformOrigin: 'left bottom'}}>+{n}</div>
      <div style={{display: 'inline-block', background: K.red, fontFamily: DISP, fontSize: 76, padding: '0 16px 4px', borderRadius: 10, textTransform: 'uppercase', marginTop: 4}}>repuestos de este SX4</div>
      <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 14}}>
        {BIG.map(([name, c], i) => {
          const k = sp(t, 32 + i * 6, 14, 230);
          return (
            <div key={name} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,11,13,0.9)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 16, padding: '10px 24px', opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * -50}px)`}}>
              <span style={{fontFamily: MONT, fontSize: 46, fontWeight: 900}}>{name}</span>
              <span style={{fontFamily: DISP, fontSize: 64, color: '#4ADE80'}}>{c}</span>
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 16, fontFamily: MONT, fontSize: 34, fontWeight: 700, color: 'rgba(255,255,255,0.85)', opacity: fade(t, 64)}}>+ frenos, interior, luces y más</div>
    </div>
  );
};

/* la casa matriz real (1,6 s) */
const Local: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <OffthreadVideo src={S('atlas/local.mp4')} startFrom={48} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: '#fff', opacity: interpolate(t, [0, 6], [1, 0], cl)}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
    <div style={{position: 'absolute', left: 60, right: 140, top: 1180, color: '#fff'}}>
      <div style={{display: 'inline-block', background: K.red, fontFamily: DISP, fontSize: 72, padding: '0 20px 4px', borderRadius: 14, textTransform: 'uppercase', transform: `scale(${sp(t, 4)})`, transformOrigin: 'left'}}>Nuestra casa matriz</div>
      <div style={{marginTop: 12, fontFamily: MONT, fontSize: 40, fontWeight: 800, opacity: fade(t, 10)}}>Av. Lo Blanco 1072 · La Pintana</div>
    </div>
  </AbsoluteFill>
);

/* locución chilena */
const VO = [
  {file: 'audio/vo/v15_1.wav', at: 20},
  {file: 'audio/vo/v15_2.wav', at: W.f1[0] + 20},
  {file: 'audio/vo/v15_3.wav', at: W.f3[0] + 8},
  {file: 'audio/vo/v15_4.wav', at: W.count[0] + 34},
  {file: 'audio/vo/v15_5.wav', at: W.beacon[0] + 30},
  {file: 'audio/vo/v15_6.wav', at: W.cta[0] + 10},
];

export const WalkV15: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      <Sequence {...at(W.hook)}><Hook t={f - W.hook[0]} /></Sequence>
      <Sequence {...at(W.w0)}><Walk from={0.9} rate={2} /></Sequence>
      <Sequence {...at(W.f1)}><FreezeScene fr={F1} t={f - W.f1[0]} base={W.f1[0]} wins={winF1} title /></Sequence>
      <Sequence {...at(W.w1)}>
        <Walk from={2.5} rate={4} />
        <Counter n={countAt(f)} bump={0} />
      </Sequence>
      <Sequence {...at(W.f2)}><FreezeScene fr={F2} t={f - W.f2[0]} base={W.f2[0]} wins={winF2} /></Sequence>
      <Sequence {...at(W.w2)}>
        <Walk from={8.5} rate={4} />
        <Counter n={countAt(f)} bump={0} />
      </Sequence>
      <Sequence {...at(W.f3)}><FreezeScene fr={F3} t={f - W.f3[0]} base={W.f3[0]} combo /></Sequence>
      <Sequence {...at(W.count)}>
        <Bg />
        <AbsoluteFill style={{opacity: 0.22}}><Img src={S(F1.xray)} style={{width: 1080, height: 1920}} /></AbsoluteFill>
        <CountScene t={f - W.count[0]} />
      </Sequence>
      <Sequence {...at(W.beacon)}><Beacon t={f - W.beacon[0]} /></Sequence>
      <Sequence {...at(W.local)}><Local t={f - W.local[0]} /></Sequence>
      <Sequence {...at(W.cta)}>
        <Bg />
        <CTA t={f - W.cta[0]} />
      </Sequence>
      <Grain opacity={0.05} />

      {VO.map((v) => (
        <Sequence key={v.file} from={v.at}><Audio src={S(v.file)} volume={1} /></Sequence>
      ))}
      {/* gancho */}
      <Audio src={S('audio/sfx_impact.wav')} volume={0.4} />
      {[30, 42, 54].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      ))}
      <Sequence from={64}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.35} /></Sequence>
      {/* congeladas */}
      {[W.f1[0], W.f2[0], W.f3[0]].map((x) => (
        <React.Fragment key={x}>
          <Sequence from={x}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
          <Sequence from={x + 2}><Audio src={S('audio/sfx_map.wav')} volume={0.35} /></Sequence>
        </React.Fragment>
      ))}
      {[...winF1.map(([a, l]) => [W.f1[0] + a, l]), ...winF2.map(([a, l]) => [W.f2[0] + a, l])].map(([a, l]) => (
        <React.Fragment key={'p' + a}>
          <Sequence from={a}><Audio src={S('audio/sfx_blip.wav')} volume={0.4} /></Sequence>
          <Sequence from={a + 18}><Audio src={S('audio/sfx_correct.wav')} volume={0.18} /></Sequence>
          <Sequence from={a + l - 14}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.2} /></Sequence>
          <Sequence from={a + l - 2}><Audio src={S('audio/sfx_coin.wav')} volume={0.3} /></Sequence>
        </React.Fragment>
      ))}
      {[0, 6, 12].map((x) => (
        <Sequence key={'c' + x} from={W.f3[0] + SCAN + 6 + x}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      ))}
      <Sequence from={W.f3[0] + SCAN + COMBO - 6}><Audio src={S('audio/sfx_coins.wav')} volume={0.35} /></Sequence>
      {[W.w0[0], W.w1[0], W.w2[0]].map((x) => (
        <Sequence key={'w' + x} from={x}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      ))}
      {/* +100 */}
      {Array.from({length: 8}, (_, i) => (
        <Sequence key={'t' + i} from={W.count[0] + 2 + i * 3}><Audio src={S('audio/sfx_tick.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={W.count[0] + 26}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      {/* faro y local */}
      <Sequence from={W.beacon[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      <Sequence from={W.beacon[0] + 26}><Audio src={S('audio/sfx_rev.wav')} volume={0.3} /></Sequence>
      <Sequence from={W.beacon[0] + 50}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={W.local[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
      {/* cierre */}
      <Sequence from={W.cta[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      <Sequence from={W.cta[0] + 66}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 13, 200);
  const typed = 'SX4'.slice(0, Math.max(0, Math.floor((t - 46) / 5)));
  const sent = t > 66;
  const pop = sp(t, 66, 10, 260);
  return (
    <div style={{position: 'absolute', top: 250, left: 60, right: 140, fontFamily: MONT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <div style={{background: '#fff', borderRadius: 22, padding: '10px 24px', opacity: Math.min(1, p * 2), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: 'left'}}>
        <Img src={S('compra/logo-desarmaduria.svg')} style={{height: 120, display: 'block'}} />
      </div>
      <div style={{marginTop: 34, fontFamily: DISP, fontSize: 104, fontWeight: 400, textTransform: 'uppercase', lineHeight: 1, opacity: fade(t, 10), transform: `translateY(${(1 - fade(t, 10)) * 20}px)`}}>
        Escribe <span style={{background: '#25D366', padding: '0 12px'}}>“SX4”</span>
        <br />al WhatsApp
      </div>
      <div style={{marginTop: 22, fontSize: 38, fontWeight: 700, opacity: fade(t, 24)}}>y te respondemos con foto, precio y despacho</div>
      <div style={{marginTop: 30, width: '100%', borderRadius: 26, overflow: 'hidden', background: '#0B141A', border: '1.5px solid rgba(255,255,255,0.15)', opacity: fade(t, 32), transform: `translateY(${(1 - fade(t, 32)) * 30}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, background: '#1F2C34', padding: '14px 20px'}}>
          <div style={{width: 54, height: 54, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <Img src={S('compra/logo-desarmaduria.svg')} style={{width: 50}} />
          </div>
          <div>
            <div style={{fontSize: 30, fontWeight: 800}}>Desarmaduría Saravia</div>
            <div style={{fontSize: 22, color: '#8696A0'}}>+56 9 5381 7335</div>
          </div>
        </div>
        <div style={{height: 120, padding: '18px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start'}}>
          {sent && (
            <div style={{background: '#005C4B', borderRadius: 14, padding: '10px 18px', fontSize: 38, fontWeight: 700, transform: `scale(${pop})`, transformOrigin: 'right top'}}>
              SX4 <span style={{fontSize: 20, color: '#8FD3C4', marginLeft: 8}}>✓✓</span>
            </div>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#1F2C34'}}>
          <div style={{flex: 1, background: '#2A3942', borderRadius: 99, padding: '12px 22px', fontSize: 32, color: !sent && typed ? '#fff' : '#8696A0'}}>{!sent && typed ? typed : 'Mensaje'}</div>
          <div style={{width: 62, height: 62, borderRadius: 99, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t > 62 && t < 70 ? 0.88 : 1})`}}>
            <svg width="32" height="32" viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#0B141A" /></svg>
          </div>
        </div>
      </div>
      <div style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 16, fontSize: 60, fontWeight: 900, opacity: fade(t, 84), transform: `scale(${0.9 + 0.1 * fade(t, 84)})`, transformOrigin: 'left'}}>
        <Wa s={62} /> +56 9 5381 7335
      </div>
      <div style={{marginTop: 14, fontSize: 30, fontWeight: 800, opacity: fade(t, 96)}}>
        autopartschile.cl · <span style={{color: CYAN}}>Despacho a todo Chile</span>
      </div>
      <div style={{marginTop: 8, fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.75)', opacity: fade(t, 104)}}>o comenta la pieza que buscas</div>
    </div>
  );
};
