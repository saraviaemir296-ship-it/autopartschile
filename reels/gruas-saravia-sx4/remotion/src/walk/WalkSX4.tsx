import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../v2/Shot';
import {MONT} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {E, K, cl} from '../v2/look';

/**
 * SX4 · vuelta en 360° alrededor del auto. En cada pieza la toma se congela,
 * pasa a rayos X, se muestra la pieza real con su precio y vuela a la web.
 */
const S = (f: string) => staticFile(f);
const CYAN = '#7FE3FF';
const NAVY = '#06122A';

type Part = {name: string; short: string; x: number; y: number; price: string; img?: string; card?: 'left' | 'right'};
type Freeze = {still: string; xray: string; parts: Part[]};

const F1: Freeze = {
  still: 'atlas/walk_f1.jpg',
  xray: 'atlas/walk_f1_xray.jpg',
  parts: [
    {name: 'Motor M16A 1.6 VVT', short: 'Motor M16A 1.6 VVT', x: 300, y: 950, price: 'Andando · consultar', card: 'right'},
    {name: 'Computador ECU AT 4x4', short: 'Computador ECU AT 4x4', x: 560, y: 900, price: '$224.990', card: 'left'},
    {name: 'Radiador de calefacción', short: 'Radiador calefacción', x: 880, y: 850, price: '$94.990', img: 'p-radiador.jpg', card: 'left'},
  ],
};
const F2: Freeze = {
  still: 'atlas/walk_f2.jpg',
  xray: 'atlas/walk_f2_xray.jpg',
  parts: [{name: 'Foco trasero derecho', short: 'Foco trasero derecho', x: 940, y: 780, price: '$84.990', img: 'p-foco-trasero.jpg', card: 'left'}],
};
const F3: Freeze = {
  still: 'atlas/walk_f3.jpg',
  xray: 'atlas/walk_f3_xray.jpg',
  parts: [
    {name: 'Focos delanteros RH y LH', short: 'Focos delanteros (par)', x: 760, y: 930, price: '$119.990 el par', img: 'p-focos-delanteros.jpg', card: 'left'},
    {name: 'Parachoque completo', short: 'Parachoque delantero', x: 820, y: 1130, price: '$119.990', img: 'p-parachoque.jpg', card: 'left'},
    {name: 'Refuerzo de parachoque', short: 'Refuerzo parachoque', x: 940, y: 1210, price: '$79.990', img: 'p-refuerzo.jpg', card: 'left'},
  ],
};
const ALL = [...F1.parts, ...F2.parts, ...F3.parts];

/* línea de tiempo (se arma por duraciones) */
const PART_STEP = 60;
const START = {f1: 40, f2: 26, f3: 26};
const freezeLen = (fr: Freeze, start: number) => start + fr.parts.length * PART_STEP + 6;
const DUR = {
  w0: 48,
  f1: freezeLen(F1, START.f1),
  enc: 120,
  w1: 72,
  f2: freezeLen(F2, START.f2),
  w2: 73,
  f3: freezeLen(F3, START.f3),
  sum: 105,
  web: 100,
  cta: 150,
};
type Key = keyof typeof DUR;
const ORDER: Key[] = ['w0', 'f1', 'enc', 'w1', 'f2', 'w2', 'f3', 'sum', 'web', 'cta'];
export const W = (() => {
  const o = {} as Record<Key, [number, number]>;
  let c = 0;
  for (const k of ORDER) {
    o[k] = [c, c + DUR[k]];
    c += DUR[k];
  }
  return o;
})();
export const W_TOTAL = W.cta[1];

/* frames absolutos en que cada pieza "llega" a la web */
const ARRIVALS: number[] = [
  ...F1.parts.map((_, i) => W.f1[0] + START.f1 + i * PART_STEP + PART_STEP - 2),
  ...F2.parts.map((_, i) => W.f2[0] + START.f2 + i * PART_STEP + PART_STEP - 2),
  ...F3.parts.map((_, i) => W.f3[0] + START.f3 + i * PART_STEP + PART_STEP - 2),
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
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '0.16em', color: CYAN}}>{kicker}</div>
      <div style={{marginTop: 6, fontSize: size, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.0}}>
        {text} {red && <span style={{background: K.red, padding: '0 12px'}}>{red}</span>}
      </div>
    </div>
  );
};

/* contador "piezas publicadas en la web" (destino de cada pieza) */
const Counter: React.FC<{n: number; bump: number}> = ({n, bump}) => (
  <div style={{position: 'absolute', left: 0, right: 80, top: 1390, display: 'flex', justifyContent: 'center', fontFamily: MONT}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(6,18,42,0.92)', border: `2px solid ${CYAN}`, borderRadius: 99, padding: '12px 26px', color: '#fff', fontWeight: 800, fontSize: 30, boxShadow: `0 0 30px rgba(127,227,255,0.35)`, transform: `scale(${1 + 0.12 * bump})`}}>
      <span style={{width: 16, height: 16, borderRadius: 99, background: '#4ADE80'}} />
      autopartschile.cl · <span style={{color: '#4ADE80', fontWeight: 900}}>{n} {n === 1 ? 'pieza publicada' : 'piezas publicadas'}</span>
    </div>
  </div>
);

/* congelada: foto real → flash → escaneo con glitch → rayos X, cámara que entra a cada pieza */
const FreezeScene: React.FC<{fr: Freeze; t: number; base: number; title?: boolean; start: number}> = ({fr, t, base, title, start}) => {
  const scan = interpolate(t, [3, 24], [0, 1], {...cl, easing: E.inOut});
  const sx = scan * 1080;
  const flash = interpolate(t, [0, 5], [0.7, 0], cl);
  // cámara: entra a la pieza activa (zoom anclado en el punto de la pieza)
  let origin = '50% 50%';
  let zoom = 1;
  fr.parts.forEach((p, i) => {
    const tt = t - (start + i * PART_STEP);
    if (tt >= 0 && tt < PART_STEP) {
      origin = `${p.x}px ${p.y}px`;
      const zin = interpolate(tt, [0, 14], [0, 1], {...cl, easing: E.inOut});
      const zout = interpolate(tt, [PART_STEP - 12, PART_STEP], [1, 0], {...cl, easing: E.inOut});
      zoom = 1 + 0.28 * Math.min(zin, zout);
    }
  });
  const glitch = scan > 0 && scan < 1 ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: NAVY, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: origin}}>
        <Img src={S(fr.still)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 0 0 ${sx}px)`}} />
        <Img src={S(fr.xray)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 ${1080 - sx}px 0 0)`}} />
        {glitch > 0 && (
          <>
            <Img src={S(fr.xray)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 ${1080 - sx}px 0 ${Math.max(0, sx - 160)}px)`, transform: 'translateX(-10px)', mixBlendMode: 'screen', opacity: 0.55, filter: 'sepia(1) saturate(6) hue-rotate(-50deg)'}} />
            <Img src={S(fr.xray)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, clipPath: `inset(0 ${1080 - sx}px 0 ${Math.max(0, sx - 160)}px)`, transform: 'translateX(10px)', mixBlendMode: 'screen', opacity: 0.45}} />
          </>
        )}
        {/* marcadores dentro de la cámara (siguen el zoom) */}
        {fr.parts.map((p, i) => {
          const tt = t - (start + i * PART_STEP);
          if (tt < 0) return null;
          return <Dot key={i} p={p} t={tt} active={tt < PART_STEP} />;
        })}
      </AbsoluteFill>
      {scan > 0 && scan < 1 && <div style={{position: 'absolute', top: 0, bottom: 0, left: sx - 3, width: 6, background: CYAN, boxShadow: `0 0 34px 12px ${CYAN}`}} />}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,18,42,0.92) 0%, rgba(6,18,42,0.7) 22%, rgba(6,18,42,0) 38%)'}} />
      <HudFrame t={t} />
      {title && <Title kicker="SUZUKI SX4 2006–2015" text="Piezas recién" red="publicadas en la web" t={t - 6} size={62} />}
      {fr.parts.map((p, i) => {
        const tt = t - (start + i * PART_STEP);
        if (tt < 0 || tt > PART_STEP + 4) return null;
        return (
          <React.Fragment key={i}>
            <Reticle p={p} t={tt} />
            <Card p={p} t={tt} />
            <Fly p={p} t={tt} />
          </React.Fragment>
        );
      })}
      <Counter n={countAt(base + t)} bump={bumpAt(base + t)} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
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
      <div style={{position: 'absolute', left: 50, top: 1510, fontFamily: MONT, fontSize: 20, fontWeight: 800, letterSpacing: '0.2em', color: CYAN, opacity: 0.8 * k}}>SCAN · SUZUKI SX4 · M16A</div>
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
      <div style={{position: 'absolute', left: p.x - 22, top: p.y - 22, width: 44, height: 44, borderRadius: 99, border: `4px solid ${active ? '#fff' : CYAN}`, background: active ? K.red : 'rgba(127,227,255,0.45)', transform: `scale(${pop * (active ? pulse : 0.6)})`, boxShadow: `0 0 26px ${active ? K.red : CYAN}`}} />
    </>
  );
};

/* visor que se cierra sobre la pieza (en coordenadas de pantalla: el punto queda fijo con el zoom) */
const Reticle: React.FC<{p: Part; t: number}> = ({p, t}) => {
  const k = interpolate(t, [0, 12], [0, 1], {...cl, easing: E.out});
  const out = interpolate(t, [PART_STEP - 10, PART_STEP], [1, 0], cl);
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
const Card: React.FC<{p: Part; t: number}> = ({p, t}) => {
  const lab = sp(t, 6, 15, 170);
  const out = interpolate(t, [PART_STEP - 14, PART_STEP - 8], [1, 0], cl);
  const cx = p.card === 'right' ? 1080 - 140 - CARD_W : 60;
  const cy = 450;
  const cardH = p.img ? 380 : 160;
  const money = p.price.startsWith('$');
  const target = priceNum(p.price);
  const run = interpolate(t, [14, 32], [0, 1], {...cl, easing: E.out});
  const suffix = p.price.includes('el par') ? ' el par' : '';
  const stamp = sp(t, 30, 9, 260);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
        <line x1={p.x} y1={p.y} x2={cx + CARD_W / 2} y2={cy + cardH} stroke="#fff" strokeWidth={3} strokeDasharray="1600" strokeDashoffset={1600 * (1 - lab)} />
        <circle cx={cx + CARD_W / 2} cy={cy + cardH} r={7 * lab} fill="#fff" />
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, width: CARD_W, perspective: 900, opacity: Math.min(1, lab * 2) * out}}>
        <div style={{transform: `rotateY(${(1 - lab) * (p.card === 'right' ? 70 : -70)}deg) scale(${0.85 + 0.15 * lab})`, transformOrigin: p.card === 'right' ? 'right center' : 'left center', fontFamily: MONT, position: 'relative'}}>
          {p.img && (
            <div style={{width: CARD_W, height: 220, borderRadius: 16, overflow: 'hidden', border: '4px solid #fff', boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 30px rgba(127,227,255,${0.5 * lab})`, background: '#fff'}}>
              <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.15 * lab})`}} />
            </div>
          )}
          <div style={{display: 'inline-block', marginTop: p.img ? 10 : 0, background: '#fff', color: '#0b0b0b', fontWeight: 900, fontSize: 36, padding: '6px 16px 8px', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)'}}>{p.name}</div>
          <div style={{marginTop: 8, display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{background: money ? K.red : '#16A34A', color: '#fff', fontWeight: 900, fontSize: money ? 44 : 32, padding: '2px 16px 4px', borderRadius: 10, fontVariantNumeric: 'tabular-nums', boxShadow: '0 10px 26px rgba(0,0,0,0.4)'}}>
              {money ? clp(target * run) + (run >= 1 ? suffix : '') : p.price}
            </span>
          </div>
          {t >= 30 && (
            <div style={{position: 'absolute', right: p.img ? -6 : 0, top: p.img ? 170 : 118, transform: `rotate(-10deg) scale(${2.2 - 1.2 * stamp})`, opacity: Math.min(1, stamp * 3), border: '5px solid #4ADE80', color: '#4ADE80', background: 'rgba(6,18,42,0.85)', borderRadius: 10, padding: '4px 14px', fontWeight: 900, fontSize: 30, letterSpacing: '0.06em'}}>✓ PUBLICADO</div>
          )}
        </div>
      </div>
    </>
  );
};

/* la pieza viaja al contador de la web con estela */
const Fly: React.FC<{p: Part; t: number}> = ({p, t}) => {
  const a = PART_STEP - 14;
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
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #0B2347 0%, ${NAVY} 55%, #02060F 100%)`}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(127,227,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(127,227,255,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
  </AbsoluteFill>
);

export const WalkSX4: React.FC<{music?: boolean}> = ({music = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      {/* 1 · gancho sobre la vuelta real */}
      <Sequence {...at(W.w0)}>
        <Walk from={0.9} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 28%)'}} />
        <Title kicker="DUEÑOS DE SUZUKI SX4" text="¿Buscas" red="repuestos?" t={f} />
      </Sequence>

      {/* 2 · congelada lateral: motor, ECU, radiador */}
      <Sequence {...at(W.f1)}>
        <FreezeScene fr={F1} t={f - W.f1[0]} base={W.f1[0]} start={START.f1} title />
      </Sequence>

      {/* 3 · prueba: encendido real */}
      <Sequence {...at(W.enc)}>
        <OffthreadVideo src={S('atlas/encendido.mp4')} volume={1} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(f - W.enc[0], [0, 120], [1.0, 1.08], cl)})`}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)'}} />
        <div style={{position: 'absolute', top: 260, left: 60, right: 140, fontFamily: MONT, color: '#fff'}}>
          {f - W.enc[0] < 58 ? (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: K.red, fontWeight: 900, fontSize: 56, fontStyle: 'italic', textTransform: 'uppercase', padding: '8px 22px 12px', borderRadius: 14, transform: `scale(${sp(f - W.enc[0])})`, transformOrigin: 'left'}}>
              <span style={{width: 22, height: 22, borderRadius: 99, background: '#fff', opacity: f % 20 < 12 ? 1 : 0.3}} /> Encendido en vivo
            </div>
          ) : (
            <>
              <div style={{display: 'inline-block', background: '#fff', color: '#111', fontWeight: 900, fontSize: 58, padding: '10px 22px 12px', borderRadius: 14, transform: `scale(${sp(f - W.enc[0], 58)})`, transformOrigin: 'left'}}>MOTOR M16A 1.6 VVT</div>
              <br />
              <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 12, background: '#16A34A', fontWeight: 900, fontSize: 50, padding: '6px 22px 10px', borderRadius: 14, transform: `scale(${sp(f - W.enc[0], 66)})`, transformOrigin: 'left'}}>✓ ANDANDO</div>
              <div style={{marginTop: 12, fontSize: 30, fontWeight: 700, opacity: fade(f - W.enc[0], 84)}}>Caja automática con falla · se informa siempre</div>
            </>
          )}
        </div>
      </Sequence>

      {/* 4 · sigue la vuelta → atrás */}
      <Sequence {...at(W.w1)}>
        <Walk from={2.5} rate={2.5} />
        <Counter n={countAt(f)} bump={0} />
      </Sequence>
      <Sequence {...at(W.f2)}>
        <FreezeScene fr={F2} t={f - W.f2[0]} base={W.f2[0]} start={START.f2} />
      </Sequence>

      {/* 5 · sigue la vuelta → frente */}
      <Sequence {...at(W.w2)}>
        <Walk from={8.5} rate={2.5} />
        <Counter n={countAt(f)} bump={0} />
      </Sequence>
      <Sequence {...at(W.f3)}>
        <FreezeScene fr={F3} t={f - W.f3[0]} base={W.f3[0]} start={START.f3} />
      </Sequence>

      {/* 6 · resumen: todo lo publicado con precio */}
      <Sequence {...at(W.sum)}>
        <Bg />
        <AbsoluteFill style={{opacity: 0.28}}><Img src={S(F3.xray)} style={{width: 1080, height: 1920}} /></AbsoluteFill>
        <Summary t={f - W.sum[0]} />
      </Sequence>

      {/* 7 · la web real */}
      <Sequence from={W.web[0]} durationInFrames={50}>
        <OffthreadVideo src={S('atlas/web_7362820f.mp4')} startFrom={15} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 210, top: 711, width: 312, height: 46, background: '#0b0b0b', color: '#fff', fontFamily: MONT, fontWeight: 800, fontSize: 23, display: 'flex', alignItems: 'center', paddingLeft: 10, whiteSpace: 'nowrap'}}>INTEGRAL ·&nbsp;<span style={{color: '#FCA5A5'}}>CAJA MALA</span></div>
      </Sequence>
      <Sequence from={W.web[0] + 50} durationInFrames={50}>
        <OffthreadVideo src={S('atlas/web_b02931f7.mp4')} startFrom={15} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>
      <Sequence {...at(W.web)}>
        <div style={{position: 'absolute', left: 0, right: 80, top: 1330, display: 'flex', justifyContent: 'center', fontFamily: MONT}}>
          <div style={{background: K.red, color: '#fff', fontWeight: 900, fontSize: 50, padding: '12px 26px 16px', borderRadius: 16, textTransform: 'uppercase', fontStyle: 'italic', boxShadow: '0 16px 40px rgba(0,0,0,0.45)', transform: `scale(${sp(f - W.web[0])}) rotate(-2deg)`}}>
            {f - W.web[0] < 50 ? 'Ya publicado en la web' : 'Búscalo en 30 segundos'}
          </div>
        </div>
      </Sequence>

      {/* 8 · CTA WhatsApp */}
      <Sequence {...at(W.cta)}>
        <Bg />
        <CTA t={f - W.cta[0]} />
      </Sequence>

      <Grain opacity={0.05} />

      {/* sonido */}
      {music && <Audio src={S('audio/music_fallback.wav')} volume={(fr) => interpolate(fr, [0, W.enc[0] - 4, W.enc[0] + 4, W.enc[1] - 4, W.enc[1] + 4, W_TOTAL - 15, W_TOTAL], [0.55, 0.55, 0.12, 0.12, 0.55, 0.55, 0], cl)} />}
      {[W.f1[0], W.f2[0], W.f3[0]].map((x) => (
        <React.Fragment key={x}>
          <Sequence from={x}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
          <Sequence from={x + 2}><Audio src={S('audio/sfx_map.wav')} volume={0.4} /></Sequence>
        </React.Fragment>
      ))}
      {[[W.f1[0] + START.f1, 3], [W.f2[0] + START.f2, 1], [W.f3[0] + START.f3, 3]].flatMap(([x, n]) =>
        Array.from({length: n}, (_, i) => {
          const a = x + i * PART_STEP;
          return (
            <React.Fragment key={a}>
              <Sequence from={a}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
              <Sequence from={a + 14}><Audio src={S('audio/sfx_tick.wav')} volume={0.25} /></Sequence>
              <Sequence from={a + 30}><Audio src={S('audio/sfx_correct.wav')} volume={0.2} /></Sequence>
              <Sequence from={a + PART_STEP - 14}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.22} /></Sequence>
              <Sequence from={a + PART_STEP - 2}><Audio src={S('audio/sfx_coin.wav')} volume={0.3} /></Sequence>
            </React.Fragment>
          );
        }),
      )}
      {[W.w1[0], W.w2[0], W.sum[0], W.web[0]].map((x) => (
        <Sequence key={x} from={x}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={W.enc[0] + 66}><Audio src={S('audio/sfx_correct.wav')} volume={0.35} /></Sequence>
      <Sequence from={W.sum[0] + 70}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.4} /></Sequence>
      <Sequence from={W.cta[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      <Sequence from={W.cta[0] + 66}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};

const Summary: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', top: 250, left: 60, right: 140, fontFamily: MONT, color: '#fff'}}>
    <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '0.16em', color: CYAN, opacity: fade(t, 0)}}>SUZUKI SX4 2006–2015 · 1.6 M16A</div>
    <div style={{marginTop: 6, fontSize: 62, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.0, opacity: fade(t, 4)}}>
      Piezas recién <span style={{background: K.red, padding: '0 12px'}}>publicadas en la web</span>
    </div>
    <div style={{marginTop: 30, background: 'rgba(6,18,42,0.94)', border: `2px solid ${CYAN}`, borderRadius: 22, padding: '14px 24px', boxShadow: `0 0 40px rgba(127,227,255,0.25)`}}>
      {ALL.map((p, i) => {
        const pp = sp(t, 10 + i * 6, 14, 220);
        return (
          <div key={i} style={{height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: i < ALL.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: Math.min(1, pp * 2), transform: `translateX(${(1 - pp) * -40}px)`}}>
            <span style={{fontSize: 32, fontWeight: 700}}>{p.short}</span>
            <span style={{fontSize: 32, fontWeight: 900, color: '#4ADE80', whiteSpace: 'nowrap'}}>{p.price.startsWith('$') ? p.price.replace(' el par', '') : 'CONSULTAR'}</span>
          </div>
        );
      })}
    </div>
    <div style={{marginTop: 18, fontSize: 28, fontWeight: 700, color: CYAN, opacity: fade(t, 64)}}>+ carrocería · suspensión · 4x4 · electrónica y más</div>
  </div>
);

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
      <div style={{marginTop: 34, fontSize: 80, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, opacity: fade(t, 10), transform: `translateY(${(1 - fade(t, 10)) * 20}px)`}}>
        Escribe <span style={{background: '#25D366', padding: '0 12px'}}>“SX4”</span>
        <br />al WhatsApp
      </div>
      <div style={{marginTop: 22, fontSize: 36, fontWeight: 700, opacity: fade(t, 24)}}>y te respondemos con foto, precio y despacho</div>
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
      <div style={{marginTop: 8, fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.7)', opacity: fade(t, 104)}}>o comenta la pieza que buscas</div>
    </div>
  );
};
