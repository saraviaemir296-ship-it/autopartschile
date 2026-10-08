import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {VO_DIA, voOn} from './voLines';
import {Brackets, GRADE, LightLeaks, PremiumBg, PriceOrbit} from './Fx';
import {LogoSting, STING_LEN} from './LogoSting';

/* "4 AUTOS / 4 CLIENTES" — reedición completa (no es StoryVentas con más efectos).
   Decisiones de edición:
   - El gancho NO revela la cifra: muestra "4 AUTOS. 4 CLIENTES." y una cifra
     girando ($?.???.???). La cifra real se paga recién en el reveal final:
     es el bucle de curiosidad que sostiene los 29 s.
   - Cada venta es un mini-proceso real en cortes (no una tarjeta): Swift =
     cotizó en la web → vino → se lo llevó; Mastervan = desarme → motor →
     cargado; Vitara = chat real → piezas → precio → envío a Viña.
   - El ritmo sube: planos de ~1,5 s al inicio, de 0,5–0,6 s en el airbag y
     un silencio corto antes del reveal.
   - Sin música (el dueño agrega el audio en tendencia en la app). Lleva
     SFX por evento; la voz se monta con la prop `vo` cuando exista.
   Precios del dueño (2026-10-06). Nombres y patentes ya anonimizados en los
   clips/capturas de public/swift (que no se versionan). */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const BG = '#0A0A0A';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');
const sp = (t: number, d = 0, damping = 12, stiffness = 260) => spring({frame: t - d, fps: 30, config: {damping, stiffness, mass: 0.5}});

/* ───────────── línea de tiempo (frames @30) ───────────── */
export const T = {
  hook: 0, ctx: 72, swift: 150, master: 270, vitara: 375, vitPieces: 442, vitPrice: 478,
  airbag: 540, airPrice: 624, black: 641, reveal: 651, desp: 750, cta: 870, web: 958, end: 1108, loop: 1108 + STING_LEN, total: 1108 + STING_LEN + 10,
};
export const CUATRO_TOTAL = T.total;

// golpes de cámara (frame, amplitud) y flashes (frame, intensidad)
const HITS: [number, number][] = [[16, 16], [30, 16], [223, 22], [335, 26], [493, 18], [624, 30], [651, 14], [665, 14], [697, 30]];
const FLASH: [number, number][] = [[0, 0.7], [4, 0.5], [8, 0.5], [12, 0.5], [106, 0.35], [223, 0.25], [562, 0.45], [580, 0.45], [598, 0.45], [624, 0.5], [697, 0.55]];

/* ───────────── piezas reutilizables ───────────── */

type Tr = 'cut' | 'whipL' | 'zoom' | 'up';

export const DBlur: React.FC<{id: string; x: number; y?: number; children: React.ReactNode}> = ({id, x, y = 0, children}) =>
  x < 0.5 && y < 0.5 ? (
    <AbsoluteFill>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${x} ${y}`} /></filter>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );

/* Plano de video o foto con cámara digital: push-in, deriva "handheld" muy
   leve y transición de entrada/salida (whip con blur direccional, zoom-through
   o subida enmascarada). */
const ShotBody: React.FC<{src: string; dur: number; abs: number; start: number; z: [number, number]; origin: string; inT: Tr; outT: Tr; dim: number; rate: number; gray?: number}> = ({src, dur, abs, start, z, origin, inT, outT, dim, rate, gray = 0}) => {
  const f = useCurrentFrame();
  let s = interpolate(f, [0, dur], z, {...cl, easing: Easing.out(Easing.quad)});
  let tx = 0, ty = 0, bx = 0, by = 0;
  const ki = interpolate(f, [0, 6], [1, 0], {...cl, easing: OUT});
  if (inT === 'whipL') { tx += ki * 1080; bx += ki * 70; }
  if (inT === 'zoom') { s *= 1 + ki * 0.7; bx += ki * 18; by += ki * 18; }
  if (inT === 'up') { ty += ki * 1920; by += ki * 60; }
  const ko = interpolate(f, [dur - 6, dur], [0, 1], {...cl, easing: Easing.in(Easing.quad)});
  if (outT === 'whipL') { tx -= ko * 1080; bx += ko * 70; }
  if (outT === 'zoom') { s *= 1 + ko * 1.2; bx += ko * 20; by += ko * 20; }
  const hx = Math.sin((abs + f) * 0.11) * 5 + Math.sin((abs + f) * 0.031) * 4;
  const hy = Math.cos((abs + f) * 0.087) * 5;
  const isVid = src.endsWith('.mp4');
  const media: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', filter: GRADE};
  return (
    <DBlur id={`b${abs}`} x={bx} y={by}>
      <AbsoluteFill style={{transform: `translate(${tx + hx}px, ${ty + hy}px) scale(${s})`, transformOrigin: origin, filter: gray ? `grayscale(${gray})` : undefined}}>
        {isVid ? (
          <OffthreadVideo src={S(src)} muted startFrom={Math.round(start * 30)} playbackRate={rate} style={media} />
        ) : (
          <>
            {/* foto horizontal: nítida a lo ancho sobre su versión desenfocada (sin deformar ni recortar el auto) */}
            <Img src={S(src)} style={{...media, filter: 'blur(34px) brightness(0.5)', transform: 'scale(1.2)'}} />
            <Img src={S(src)} style={{position: 'absolute', left: -60, top: 960 - 600, width: 1200, height: 1200 * 640 / 1179, objectFit: 'cover'}} />
          </>
        )}
      </AbsoluteFill>
      {dim > 0 && <AbsoluteFill style={{background: `rgba(10,10,10,${dim})`}} />}
    </DBlur>
  );
};
export const Shot: React.FC<{src: string; from: number; dur: number; start?: number; z?: [number, number]; origin?: string; inT?: Tr; outT?: Tr; dim?: number; rate?: number}> = ({src, from, dur, start = 0, z = [1.06, 1.16], origin = '50% 50%', inT = 'cut', outT = 'cut', dim = 0, rate = 1}) => (
  <Sequence from={from} durationInFrames={dur}>
    <ShotBody src={src} dur={dur} abs={from} start={start} z={z} origin={origin} inT={inT} outT={outT} dim={dim} rate={rate} />
  </Sequence>
);

/* texto que sube desde una máscara */
export const Rise: React.FC<{f: number; at: number; style?: React.CSSProperties; children: React.ReactNode; dur?: number}> = ({f, at, style, children, dur = 7}) => {
  if (f < at) return null;
  const p = interpolate(f - at, [0, dur], [1, 0], {...cl, easing: OUT});
  return (
    <div style={{overflow: 'hidden', paddingBottom: 6}}>
      <div style={{transform: `translateY(${p * 105}%)`, ...style}}>{children}</div>
    </div>
  );
};

/* variante "atención": sin precios ni montos (ver UnDiaVoz atencion) */
export const NoPrice = React.createContext(false);

/* etiqueta de precio de marca: caja roja inclinada (como en la web y los
   afiches) con letra Anton blanca; entra con barrido, aterriza con golpe y la
   cruza un brillo */
const Tag: React.FC<{txt: string; size: number; wipe: number; k: number}> = ({txt, size, wipe, k}) => {
  const sw = interpolate(k, [3, 20], [-40, 140], cl);
  return (
    <div style={{display: 'inline-block', position: 'relative', transform: 'skewX(-9deg)', clipPath: `inset(-30% ${(1 - wipe) * 100}% -30% 0)`}}>
      <div style={{background: 'linear-gradient(180deg, #FF3030 0%, #D10B0C 55%, #9E0707 100%)', padding: `${size * 0.05}px ${size * 0.2}px ${size * 0.09}px`, borderTop: '5px solid rgba(255,255,255,0.4)', boxShadow: '0 0 46px rgba(209,11,12,0.7), 0 20px 44px rgba(0,0,0,0.8)'}}>
        <span style={{display: 'inline-block', transform: 'skewX(9deg)', fontFamily: DISP, fontSize: size, lineHeight: 1.02, color: '#fff', letterSpacing: 3, textShadow: '0 5px 0 rgba(0,0,0,0.3)'}}>{txt}</span>
      </div>
      {k > 2 && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sw - 12}%, rgba(255,255,255,0.6) ${sw}%, transparent ${sw + 12}%)`}} />}
      <div style={{position: 'absolute', left: 0, bottom: -14, height: 9, width: `${wipe * 100}%`, background: '#fff'}} />
    </div>
  );
};

/* precio con conteo por pasos dentro de la etiqueta roja */
const Price: React.FC<{f: number; at: number; seq: number[]; step?: number; size?: number; top: number; alt?: string}> = ({f, at, seq, step = 3, size = 150, top, alt}) => {
  const noPrice = React.useContext(NoPrice);
  if (f < at) return null;
  if (noPrice) {
    if (!alt) return null;
    const k = f - at;
    return (
      <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(k, [0, 3, 9], [1.4, 0.95, 1], cl)})`}}>
        <Tag txt={alt} size={72} wipe={interpolate(k, [0, 6], [0, 1], {...cl, easing: OUT})} k={k} />
      </div>
    );
  }
  const land = at + (seq.length - 1) * step;
  const v = seq[Math.min(seq.length - 1, Math.floor((f - at) / step))];
  const k = f - land;
  const sc = k < 0 ? 0.92 : interpolate(k, [0, 3, 9], [1.3, 0.95, 1], cl);
  const wipe = interpolate(f - at, [0, 6], [0, 1], {...cl, easing: OUT});
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${sc}) rotate(${k >= 0 && k < 8 ? Math.sin(k * 2.2) * (8 - k) * 0.4 : 0}deg)`}}>
      <Tag txt={clp(v)} size={size} wipe={wipe} k={k} />
    </div>
  );
};

export const Chip: React.FC<{children: React.ReactNode; red?: boolean; size?: number; style?: React.CSSProperties}> = ({children, red, size = 44, style}) => (
  <span style={{display: 'inline-block', background: red ? RED : '#fff', color: red ? '#fff' : BG, fontFamily: DISP, fontSize: size, lineHeight: 1.15, padding: '4px 18px 6px', letterSpacing: 1, ...style}}>{children}</span>
);

const Title: React.FC<{f: number; at: number; small: string; big: string; top?: number}> = ({f, at, small, big, top = 230}) => {
  const tr = interpolate(f - at, [0, 14], [26, 2], {...cl, easing: OUT});
  return (
    <div style={{position: 'absolute', top, left: 70, right: 70}}>
      <Rise f={f} at={at} style={{fontFamily: DISP, fontSize: 64, color: '#fff', letterSpacing: tr, textShadow: '0 4px 18px rgba(0,0,0,0.9)'}}>{small}</Rise>
      <Rise f={f} at={at + 3} style={{fontFamily: DISP, fontSize: 132, lineHeight: 0.95, color: '#fff', letterSpacing: tr * 0.4, textShadow: '0 6px 26px rgba(0,0,0,0.9)'}}>{big}</Rise>
    </div>
  );
};

/* ───────────── escenas ───────────── */

/* 0–2,4 s: montaje de impacto + "4 AUTOS. 4 CLIENTES." + cifra girando */
const HOOK_CUTS: [string, number, number][] = [
  ['swift/mv_carga.mp4', 1.5, 4], ['swift/airbag_kit.mp4', 3.0, 4], ['swift/vitara_portalon.mp4', 0.4, 4], ['swift/entrega_anon.mp4', 0.6, 4],
  ['swift/mv_desarme.mp4', 5.8, 8], ['swift/vitara_carga.mp4', 1.0, 8], ['swift/airbag_kit.mp4', 4.0, 8], ['swift/mv_motor.mp4', 0.3, 8],
  ['swift/vitara_local_anon.mp4', 0.3, 8], ['swift/entrega_anon.mp4', 1.8, 16],
];
const HookFootage: React.FC = () => {
  let at = 0;
  return (
    <>
      {HOOK_CUTS.map(([src, st, d], i) => {
        const from = at; at += d;
        return <Shot key={i} src={src} from={from} dur={d} start={st} z={i < 4 ? [1.32, 1.14] : [1.12, 1.2]} dim={i < 4 ? 0 : 0.58} />;
      })}
    </>
  );
};
const HookText: React.FC<{f: number; dia?: boolean}> = ({f, dia}) => {
  if (f >= T.ctx) return null;
  if (dia) {
    // variante "1 día en mi desarmadería": el gancho es el formato vlog, no la cifra
    return (
      <>
        {f >= 16 && <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 16, [0, 3, 8], [1.7, 0.96, 1], cl)})`, fontFamily: DISP, fontSize: 300, lineHeight: 1, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)'}}><span style={{color: RED2}}>1</span> DÍA</div>}
        {f >= 26 && <div style={{position: 'absolute', top: 850, left: 0, right: 0, textAlign: 'center'}}><Rise f={f} at={26} style={{fontFamily: DISP, fontSize: 104, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>EN MI DESARMADURÍA</Rise></div>}
        {f >= 50 && <div style={{position: 'absolute', top: 1190, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 50, [0, 3, 8], [1.5, 0.95, 1], cl)})`}}><span style={{display: 'inline-block', background: '#fff', color: BG, fontFamily: DISP, fontSize: 62, padding: '4px 22px 8px'}}>👀 ESPERA EL <span style={{color: RED}}>TOTAL</span> AL FINAL</span></div>}
        {f >= 38 && <div style={{position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 38, [0, 3, 8], [1.5, 0.96, 1], cl)})`}}><Chip red size={76}>CON NUESTROS CLIENTES</Chip></div>}
      </>
    );
  }
  const roll = (i: number) => (f >= 66 ? '?' : String(Math.floor(random(`d${i}-${Math.floor(f / 2)}`) * 10)));
  const big = (at: number, word: string, top: number) => f >= at && (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - at, [0, 3, 8], [1.7, 0.96, 1], cl)})`, fontFamily: DISP, fontSize: 200, lineHeight: 1, color: '#fff', textShadow: '0 10px 40px rgba(0,0,0,0.9)'}}>
      <span style={{color: RED2}}>4</span> {word}
    </div>
  );
  return (
    <>
      {big(16, 'AUTOS.', 560)}
      {big(30, 'CLIENTES.', 790)}
      {f >= 44 && (
        <div style={{position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f, [44, 47], [0, 1], cl)}}>
          <Chip red size={50}>¿CUÁNTO NOS DEJARON?</Chip>
          <div style={{marginTop: 22, fontFamily: DISP, fontSize: 150, letterSpacing: 6, color: '#fff', textShadow: '0 0 24px rgba(209,11,12,0.6)'}}>
            ${roll(1)}.{roll(2)}{roll(3)}{roll(4)}.{roll(5)}{roll(6)}{roll(7)}
          </div>
        </div>
      )}
    </>
  );
};

/* 2,4–5 s: los 4 autos en un riel 2.5D (profundidad alterna = parallax).
   Giro de sentido: "PA' MUCHOS: CHATARRA" → "PA' NOSOTROS: REPUESTOS",
   y los autos pasan de gris a color en ese instante. */
const CARS = [
  {img: 'swift/auto.jpg', name: 'SWIFT'},
  {img: 'suzuki/mastervan.jpg', name: 'MASTERVAN'},
  {img: 'swift/car_vitara.jpg', name: 'VITARA'},
  {img: 'swift/car_sx4.jpg', name: 'SX4'},
];
const Context: React.FC<{f: number}> = ({f}) => {
  const t = f - T.ctx;
  const cam = interpolate(t, [0, 78], [0, -1920], {...cl, easing: Easing.inOut(Easing.cubic)});
  const color = t >= 34;
  const strike = interpolate(t, [24, 30], [0, 1], cl);
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <AbsoluteFill style={{perspective: 1300, transformStyle: 'preserve-3d'}}>
        {CARS.map((c, i) => {
          const z = i % 2 ? -140 : 40;
          const x = 540 - 300 + i * 700 + cam * (700 / 640) + (i % 2 ? Math.sin(t * 0.08) * 30 : 0);
          const d = Math.abs(x + 300 - 540);
          const focus = interpolate(d, [0, 500], [1, 0], cl);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: 760, width: 600, transform: `translateZ(${z}px) rotateY(${(540 - (x + 300)) * 0.012}deg)`, transformStyle: 'preserve-3d'}}>
              <div style={{width: 600, height: 400, overflow: 'hidden', border: '5px solid #fff', boxShadow: `0 40px 70px rgba(0,0,0,0.75)${focus > 0.6 ? `, 0 0 40px rgba(209,11,12,${0.45 * focus})` : ''}`}}>
                <Img src={S(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: color ? GRADE : 'grayscale(1) brightness(0.75)', transform: `scale(${1.05 + focus * 0.08})`}} />
              </div>
              <div style={{marginTop: 18, fontFamily: DISP, fontSize: 58, color: '#fff', letterSpacing: 2 + (1 - focus) * 12, opacity: 0.4 + focus * 0.6}}>{c.name}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 300, left: 70, right: 70}}>
        {!color ? (
          <>
            <Rise f={f} at={T.ctx + 2} style={{fontFamily: DISP, fontSize: 80, color: '#fff'}}>PA&apos; MUCHOS:</Rise>
            <div style={{position: 'relative', display: 'inline-block'}}>
              <Rise f={f} at={T.ctx + 6} style={{fontFamily: DISP, fontSize: 170, lineHeight: 1, color: '#9a9a9a'}}>CHATARRA</Rise>
              <div style={{position: 'absolute', left: -10, top: '52%', height: 16, width: `${strike * 104}%`, background: RED, transform: 'rotate(-4deg)'}} />
            </div>
          </>
        ) : (
          <>
            <Rise f={f} at={T.ctx + 34} style={{fontFamily: DISP, fontSize: 80, color: '#fff'}}>PA&apos; NOSOTROS:</Rise>
            <Rise f={f} at={T.ctx + 37} style={{fontFamily: DISP, fontSize: 170, lineHeight: 1, color: '#fff'}}>REPUESTOS</Rise>
            <div style={{height: 12, width: `${interpolate(t, [40, 48], [0, 62], {...cl, easing: OUT})}%`, background: RED, marginTop: 6}} />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* foto del vano del Swift: foto nítida centrada en el motor sobre la misma
   foto desenfocada (llena el 9:16 sin deformar) + anillo que se dibuja */
const SwiftEngine: React.FC = () => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 70], [1, 1.14], {...cl, easing: Easing.out(Easing.quad)});
  const ki = interpolate(f, [0, 5], [1, 0], {...cl, easing: OUT});
  const ring = interpolate(f, [10, 22], [0, 1], {...cl, easing: OUT});
  const C = 2 * Math.PI * 300;
  const ko = interpolate(f, [64, 70], [0, 1], {...cl, easing: Easing.in(Easing.quad)});
  return (
    <DBlur id="sweng" x={ki * 40 + ko * 70}>
      <AbsoluteFill style={{transform: `translateX(${-ko * 1080}px)`}}>
        <Img src={S('swift/motor-vano.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) brightness(0.45)', transform: 'scale(1.2)'}} />
        <AbsoluteFill style={{transform: `scale(${s * (1 + ki * 0.25)})`, transformOrigin: '540px 900px'}}>
          <Img src={S('swift/motor-vano.jpg')} style={{position: 'absolute', left: -322, top: -145, width: 1600, maskImage: 'linear-gradient(to bottom, transparent 0%, #000 10%, #000 86%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 10%, #000 86%, transparent 100%)'}} />
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={540} cy={900} r={300} fill="none" stroke={RED2} strokeWidth={8} strokeDasharray={C} strokeDashoffset={C * (1 - ring)} transform="rotate(-90 540 900)" style={{filter: `drop-shadow(0 0 12px ${RED})`}} />
            <circle cx={540} cy={900} r={300 + interpolate(f, [22, 40], [0, 70], cl)} fill="none" stroke="#fff" strokeWidth={3} opacity={interpolate(f, [22, 40], [0.8, 0], cl)} />
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    </DBlur>
  );
};

const Steps: React.FC<{f: number; items: [number, string][]; top: number; until?: number}> = ({f, items, top, until = 99999}) => {
  if (f >= until) return null;
  return (
    <div style={{position: 'absolute', top, left: 70, display: 'flex', flexDirection: 'column', gap: 14}}>
      {items.map(([at, txt], i) => f >= at && (
        <div key={i} style={{transform: `translateX(${interpolate(f - at, [0, 6], [-500, 0], {...cl, easing: OUT})}px)`, display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{width: 58, height: 58, background: RED, color: '#fff', fontFamily: DISP, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</span>
          <Chip size={52}>{txt}</Chip>
        </div>
      ))}
    </div>
  );
};

const SwiftText: React.FC<{f: number}> = ({f}) => {
  if (f < T.swift || f >= T.master) return null;
  return (
    <>
      <Title f={f} at={T.swift + 4} small="MOTOR SUZUKI" big="SWIFT" />
      {f >= T.swift + 12 && <div style={{position: 'absolute', top: 470, left: 70, letterSpacing: interpolate(f - T.swift - 12, [0, 12], [30, 4], {...cl, easing: OUT})}}><Chip red size={60}>1.2 K12</Chip></div>}
      <Steps f={f} top={1060} until={T.swift + 52} items={[[T.swift + 18, 'COTIZÓ EN LA WEB'], [T.swift + 28, 'VINO A VERLO'], [T.swift + 38, 'SE LO LLEVÓ']]} />
      <Price f={f} at={214} seq={[0, 300000, 600000, 900000]} top={1130} alt="LO VIO EN LA WEB, VINO Y LISTO" />
    </>
  );
};

const MasterText: React.FC<{f: number}> = ({f}) => {
  if (f < T.master || f >= T.vitara) return null;
  const tag = f < 296 ? 'DESARME' : f < 318 ? 'MOTOR FUERA' : 'CARGADO ✓';
  const ta = f < 296 ? T.master + 8 : f < 318 ? 296 : 318;
  return (
    <>
      <Title f={f} at={T.master + 3} small="MOTOR SUZUKI" big="MASTERVAN" />
      <div style={{position: 'absolute', top: 480, left: 70, transform: `translateY(${interpolate(f - ta, [0, 5], [30, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(f - ta, [0, 4], [0, 1], cl)}}>
        <Chip red size={52}>{tag}</Chip>
      </div>
      <Price f={f} at={330} seq={[0, 260000, 520000]} step={2} top={1130} alt="LO SACAMOS Y SE LO CARGAMOS" />
    </>
  );
};

/* chat real del Vitara reconstruido como interfaz: cada burbuja es un recorte
   de la captura (prueba real) que entra con resorte; la cámara empuja hacia
   la pregunta del cliente y un subrayado marca "Vitara 1.6 azul ¿portalón". */
const K = 880 / 1179;
const BUB: [number, number, number, 'l' | 'r'][] = [[0, 285, T.vitara + 6, 'l'], [285, 1065, T.vitara + 30, 'r'], [1065, 1170, T.vitara + 44, 'l']];
const VitaraChat: React.FC<{f: number}> = ({f}) => {
  if (f < T.vitara || f >= T.vitPieces) return null;
  const t = f - T.vitara;
  const enter = interpolate(t, [0, 7], [1, 0], {...cl, easing: OUT});
  const push = interpolate(t, [14, 22, 28, 34], [1, 1.42, 1.42, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const thru = interpolate(t, [61, 67], [1, 4.5], {...cl, easing: Easing.in(Easing.cubic)});
  const thruB = interpolate(t, [61, 67], [0, 22], cl);
  const top = 400;
  const chatTop = top + 110;
  const under = interpolate(t, [18, 25], [0, 1], {...cl, easing: OUT});
  const tap = t - 24;
  return (
    <AbsoluteFill style={{transform: `translateY(${enter * 1500}px) scale(${push * thru})`, transformOrigin: push > 1.01 ? `437px ${chatTop + 105}px` : '540px 960px', filter: thruB ? `blur(${thruB}px)` : undefined}}>
      <div style={{position: 'absolute', left: 100, top, width: 880, height: 1000, borderRadius: 44, overflow: 'hidden', border: '10px solid #161616', boxShadow: '0 50px 90px rgba(0,0,0,0.8)', background: '#EFE7DE'}}>
        <div style={{height: 110, background: '#F6F6F6', display: 'flex', alignItems: 'center', gap: 20, padding: '0 30px', borderBottom: '1px solid #ddd'}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: '#c9c9c9'}} />
          <div>
            <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 32, color: '#111'}}>Cliente</div>
            <div style={{fontFamily: TXT, fontWeight: 600, fontSize: 22, color: '#25a244'}}>{t > 36 && t < 44 ? 'escribiendo…' : 'en línea'}</div>
          </div>
        </div>
        {BUB.map(([y0, y1, at, side], i) => {
          if (f < at) return null;
          const p = sp(f, at, 11, 300);
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 110 + y0 * K, width: 880, height: (y1 - y0) * K, overflow: 'hidden', transform: `scale(${0.82 + 0.18 * p}) translateY(${(1 - p) * 40}px)`, transformOrigin: side === 'l' ? '0% 100%' : '100% 100%', opacity: Math.min(1, p * 1.6)}}>
              <Img src={S('swift/chat_vitara.png')} style={{position: 'absolute', left: 0, top: -y0 * K, width: 880}} />
            </div>
          );
        })}
      </div>
      {/* subrayado + toque sobre la pregunta */}
      <div style={{position: 'absolute', left: 160, top: chatTop + 163 * K - 2, height: 8, width: 548 * under, background: RED2, boxShadow: `0 0 14px ${RED}`}} />
      {tap >= 0 && tap < 14 && (
        <div style={{position: 'absolute', left: 649 - 40, top: chatTop + 101 - 40, width: 80, height: 80, borderRadius: 40, border: `5px solid ${RED2}`, transform: `scale(${0.4 + tap * 0.12})`, opacity: 1 - tap / 14}} />
      )}
    </AbsoluteFill>
  );
};

const STEP4 = ['CLIENTE', 'NECESIDAD', 'RESPUESTA', 'VENTA ✓'];
const VitaraText: React.FC<{f: number}> = ({f}) => {
  if (f < T.vitara || f >= T.airbag) return null;
  const act = [T.vitara + 6, T.vitara + 18, T.vitara + 30, 493];
  const pieces: [number, string][] = [[448, 'PORTALÓN'], [454, 'REFUERZO PARACHOQUES'], [460, 'PARACHOQUES TRASERO'], [466, 'UN CORTE → VIÑA DEL MAR']];
  const route = interpolate(f, [508, 528], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  return (
    <>
      {/* progreso de la venta */}
      <div style={{position: 'absolute', top: 240, left: 50, right: 50, display: 'flex', justifyContent: 'center', gap: 10}}>
        {STEP4.map((s, i) => {
          const on = f >= act[i];
          return <span key={i} style={{fontFamily: DISP, fontSize: 36, padding: '6px 14px 8px', background: on ? (i === 3 ? RED : '#fff') : 'rgba(255,255,255,0.12)', color: on ? (i === 3 ? '#fff' : BG) : 'rgba(255,255,255,0.5)', transform: `scale(${on && f - act[i] < 6 ? interpolate(f - act[i], [0, 2, 6], [1, 1.2, 1], cl) : 1})`}}>{s}</span>;
        })}
      </div>
            {f >= T.vitPieces && (
        <>
          <div style={{position: 'absolute', top: 320, left: 70}}>
            <Rise f={f} at={T.vitPieces + 2} style={{fontFamily: DISP, fontSize: 92, color: '#fff', textShadow: '0 6px 22px rgba(0,0,0,0.9)'}}>…Y SE LLEVÓ:</Rise>
          </div>
          <div style={{position: 'absolute', top: 450, left: 70, display: 'flex', flexDirection: 'column', gap: 12}}>
            {pieces.map(([at, p], i) => f >= at && (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, transform: `translateX(${interpolate(f - at, [0, 5], [-600, 0], {...cl, easing: OUT})}px)`}}>
                <span style={{width: 54, height: 54, background: RED, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</span>
                <Chip size={50}>{p}</Chip>
              </div>
            ))}
          </div>
          <Price f={f} at={484} seq={[0, 300000, 600000, 900000]} top={1150} alt="TODO CONFIRMADO POR WHATSAPP" />
          {f >= 506 && (
            <div style={{position: 'absolute', top: 1380, left: 110, right: 110, opacity: interpolate(f, [506, 510], [0, 1], cl)}}>
              <svg width={860} height={110}>
                <line x1={30} y1={55} x2={830} y2={55} stroke="rgba(255,255,255,0.3)" strokeWidth={6} strokeDasharray="14 12" />
                <line x1={30} y1={55} x2={30 + 800 * route} y2={55} stroke={RED2} strokeWidth={8} />
                <circle cx={30} cy={55} r={14} fill="#fff" />
                <circle cx={30 + 800 * route} cy={55} r={18} fill={RED2} />
              </svg>
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: DISP, fontSize: 42, color: '#fff', marginTop: -6}}>
                <span>SANTIAGO</span><span style={{opacity: route > 0.95 ? 1 : 0.4}}>VIÑA DEL MAR 📦</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

/* burbuja real del cliente del airbag, flotando sobre el producto */
const AirbagText: React.FC<{f: number}> = ({f}) => {
  const noPrice = React.useContext(NoPrice);
  if (f < T.airbag || f >= T.black) return null;
  const p = sp(f, T.airbag + 2, 11, 280);
  const sx4 = f >= 614;
  return (
    <>
      <Title f={f} at={T.airbag + 4} small="KIT AIRBAG" big="SWIFT" />
      {sx4 && <div style={{position: 'absolute', top: 470, left: 70}}><Rise f={f} at={614} style={{fontFamily: DISP, fontSize: 96, color: '#fff', textShadow: '0 6px 22px rgba(0,0,0,0.9)'}}><span style={{color: RED2}}>+</span> PIOLAS SX4</Rise></div>}
      {f < 562 && (
        <div style={{position: 'absolute', left: 110, top: 900, width: 860, height: 170, overflow: 'hidden', borderRadius: 26, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: '0% 100%', opacity: Math.min(1, p * 1.5), boxShadow: '0 30px 60px rgba(0,0,0,0.7)'}}>
          <Img src={S('swift/chat_airbag.png')} style={{position: 'absolute', left: -40, top: -150, width: 1179}} />
        </div>
      )}
      {f >= 624 && (
        <div style={{position: 'absolute', top: 1130, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 624, [0, 3, 8], [2.1, 0.94, 1], cl)})`}}>
          {noPrice
            ? <Tag txt="LA PIEZA EXACTA PARA SU VERSIÓN" size={64} wipe={interpolate(f - 624, [0, 3], [0.2, 1], cl)} k={f - 624} />
            : <Tag txt={clp(384990)} size={150} wipe={interpolate(f - 624, [0, 3], [0.2, 1], cl)} k={f - 624} />}
        </div>
      )}
    </>
  );
};



/* despachos del día: paquete embalado → boletas Starken reales (datos
   personales pixelados) → mapa esquemático de Chile → mensaje post-venta real */
const CHILE: [string, number, number, number][] = [ // nombre, latitud, x, frame de llegada
  ['VALLENAR', 28.6, 600, 832], ['VIÑA DEL MAR', 33.0, 470, 836], ['YUNGAY', 37.1, 590, 840],
];
const latY = (lat: number) => 420 + (lat - 27) * 105;
const Despachos: React.FC<{f: number}> = ({f}) => {
  if (f < T.desp || f >= T.cta) return null;
  const t = f - T.desp;
  const card = (at: number, src: string, x: number, y: number, rot: number, city: string) => {
    if (f < at) return null;
    const k = spring({frame: f - at, fps: 30, config: {damping: 13, stiffness: 200, mass: 0.6}});
    return (
      <div style={{position: 'absolute', left: x, top: y, width: 470, transform: `translateY(${(1 - k) * 1400}px) rotate(${rot * k + (1 - k) * rot * 4}deg)`, boxShadow: '0 40px 80px rgba(0,0,0,0.75)'}}>
        <Img src={S(src)} style={{width: 470, display: 'block'}} />
        <div style={{position: 'absolute', left: 16, bottom: -34}}><Chip red size={56}>→ {city}</Chip></div>
      </div>
    );
  };
  if (t < 24) {
    // paquete embalado con tarjeta de la desarmaduría
    return (
      <AbsoluteFill>
        <Img src={S('swift/paquete.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${interpolate(t, [0, 24], [1.18, 1.05], cl)})`}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0) 40%)'}} />
        <div style={{position: 'absolute', top: 230, left: 70, right: 70}}>
          <Rise f={f} at={T.desp + 1} style={{fontFamily: DISP, fontSize: 74, color: '#fff'}}>Y HOY TAMBIÉN</Rise>
          <Rise f={f} at={T.desp + 4} style={{fontFamily: DISP, fontSize: 150, lineHeight: 1, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.8)'}}>DESPACHAMOS</Rise>
        </div>
      </AbsoluteFill>
    );
  }
  if (t < 72) {
    const st = f - (T.desp + 46);
    return (
      <AbsoluteFill>
        <PremiumBg f={f} />
        <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 96, color: '#fff'}}>BOLETAS DE <span style={{color: RED2}}>HOY</span></div>
        {card(T.desp + 26, 'swift/voucher_vallenar.jpg', 50, 400, -5, 'VALLENAR')}
        {card(T.desp + 33, 'swift/voucher_yungay.jpg', 560, 470, 4, 'YUNGAY')}
        {st >= 0 && (
          <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `rotate(-6deg) scale(${interpolate(st, [0, 3, 7], [2.3, 0.92, 1], cl)})`, opacity: interpolate(st, [0, 2], [0, 1], cl)}}>
            <span style={{display: 'inline-block', border: `8px solid ${RED2}`, padding: '0 26px 6px', fontFamily: DISP, fontSize: 92, color: RED2, background: 'rgba(10,10,10,0.7)', letterSpacing: 3, textShadow: `0 0 18px ${RED}`}}>DESPACHADO 06/10</span>
          </div>
        )}
      </AbsoluteFill>
    );
  }
  if (t < 96) {
    const sY = latY(33.45);
    const draw = (at: number) => interpolate(f, [at, at + 9], [0, 1], {...cl, easing: OUT});
    return (
      <AbsoluteFill>
        <PremiumBg f={f} />
        <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center'}}>
          <Rise f={f} at={T.desp + 72} style={{fontFamily: DISP, fontSize: 100, color: '#fff'}}>ENVÍOS A <span style={{color: RED2}}>TODO CHILE</span></Rise>
        </div>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {/* Chile esquemático: eje norte-sur */}
          <line x1={540} y1={latY(27)} x2={540} y2={latY(38.5)} stroke="rgba(255,255,255,0.25)" strokeWidth={6} strokeLinecap="round" />
          {CHILE.map(([n, lat, x, at]) => {
            const y = latY(lat);
            const d = draw(at);
            const cx = 540 + (y < sY ? 260 : 220);
            const len = 900;
            return (
              <g key={n}>
                <path d={`M 560 ${sY} Q ${cx} ${(sY + y) / 2} ${x} ${y}`} fill="none" stroke={RED2} strokeWidth={7} strokeDasharray={len} strokeDashoffset={len * (1 - d)} style={{filter: `drop-shadow(0 0 8px ${RED})`}} />
                <circle cx={x} cy={y} r={16 * d} fill={RED2} />
              </g>
            );
          })}
          <circle cx={560} cy={sY} r={20} fill="#fff" />
        </svg>
        <div style={{position: 'absolute', left: 600, top: latY(33.45) - 24, fontFamily: DISP, fontSize: 52, color: '#fff'}}>SANTIAGO</div>
        {CHILE.map(([n, lat, x, at]) => f >= at + 6 && (
          <div key={n} style={{position: 'absolute', top: latY(lat) - 30, ...(x < 540 ? {right: 1080 - x + 34} : {left: x + 34}), fontFamily: DISP, fontSize: 52, color: '#fff', opacity: interpolate(f, [at + 6, at + 10], [0, 1], cl)}}>{n}</div>
        ))}
      </AbsoluteFill>
    );
  }
  // mensaje post-venta real con número de seguimiento (nombre y número pixelados)
  const k = spring({frame: f - (T.desp + 96), fps: 30, config: {damping: 14, stiffness: 220, mass: 0.6}});
  const hl = interpolate(f, [T.desp + 104, T.desp + 111], [0, 1], {...cl, easing: OUT});
  const sc = 760 / 1180;
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
        <Chip red size={58}>Y TE AVISAMOS CON TU SEGUIMIENTO</Chip>
      </div>
      <div style={{position: 'absolute', left: 160, top: 330, width: 760, height: 1150, overflow: 'hidden', borderRadius: 40, border: '10px solid #1b1b1b', transform: `translateY(${(1 - k) * 1300}px)`, boxShadow: '0 50px 90px rgba(0,0,0,0.8)'}}>
        <Img src={S('swift/postventa.jpg')} style={{width: 760, display: 'block'}} />
        <div style={{position: 'absolute', left: 290 * sc, top: 740 * sc, width: 740 * sc * hl, height: 130 * sc, background: 'rgba(209,11,12,0.2)', borderBottom: `6px solid ${RED2}`}} />
      </div>
    </AbsoluteFill>
  );
};


/* compra en la web: el mockup del afiche entra en 3D, la cámara se mete en su
   celular y pasa a la grabación real del recorrido en autopartschile.cl */
const WEB_SEGS: [number, number, number, number, string][] = [ // desde, largo, inicio(s), velocidad, paso
  [44, 18, 0.4, 2, 'TE BUSCAS EN GOOGLE'], [62, 20, 2.3, 1.5, 'ENTRAS AL SITIO'], [82, 26, 4.6, 2, 'BUSCAS TU REPUESTO'], [108, 42, -1, 1, 'PRECIO Y STOCK AL TIRO'],
];
const WebScene: React.FC<{f: number}> = ({f}) => {
  const noPrice = React.useContext(NoPrice);
  if (f < T.web || f >= T.end) return null;
  const t = f - T.web;
  const PX = 721, PY = 971; // centro del celular dentro del mockup
  if (t < 44) {
    const k = spring({frame: t, fps: 30, config: {damping: 15, stiffness: 160, mass: 0.7}});
    const zoom = interpolate(t, [30, 43], [1, 5.5], {...cl, easing: Easing.in(Easing.cubic)});
    const bl = interpolate(t, [32, 43], [0, 14], cl);
    return (
      <AbsoluteFill>
        <PremiumBg f={f} />
        <div style={{position: 'absolute', top: 230, left: 70, right: 70}}>
          <Rise f={f} at={T.web + 2} style={{fontFamily: DISP, fontSize: 80, color: '#fff'}}>O COMPRA DIRECTO</Rise>
          <Rise f={f} at={T.web + 6} style={{fontFamily: DISP, fontSize: 120, lineHeight: 1, color: RED2}}>EN LA WEB</Rise>
        </div>
        <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${PX}px ${PY}px`, filter: bl ? `blur(${bl}px)` : undefined}}>
          <Img src={S('marca/piezas-grupo.png')} style={{position: 'absolute', left: 40, top: 1250 + (1 - k) * 300, width: 1000, opacity: 0.55 * k, transform: `translateX(${Math.sin(f * 0.05) * 12}px)`}} />
          <div style={{position: 'absolute', left: 60, top: 640, width: 960, perspective: 1600}}>
            <Img src={S('marca/mockup-web-oscuro.png')} style={{width: 960, transform: `translateY(${(1 - k) * 900}px) rotateX(${(1 - k) * 35}deg) rotateY(${(1 - k) * -12}deg)`, boxShadow: '0 50px 90px rgba(0,0,0,0.7)'}} />
          </div>
        </AbsoluteFill>
        {t >= 14 && t < 32 && <Img src={S('marca/compra-directo-domicilio.png')} style={{position: 'absolute', left: 70, top: 1340, width: 640, transform: `translateX(${interpolate(t, [14, 20], [-800, 0], {...cl, easing: OUT})}px)`}} />}
      </AbsoluteFill>
    );
  }
  // dentro del celular: recorrido real (sin el formulario con datos personales)
  const p = spring({frame: t - 44, fps: 30, config: {damping: 14, stiffness: 180, mass: 0.6}});
  const seg = [...WEB_SEGS].reverse().find(([a]) => t >= a) ?? WEB_SEGS[0];
  const si = WEB_SEGS.indexOf(seg);
  const lt = t - seg[0];
  const W = 600, H = Math.round(600 * 2556 / 1180), L = 240, TOP = 300;
  const s0 = 0.22;
  const sc = s0 + (1 - s0) * p;
  const cx = PX + (L + W / 2 - PX) * p, cy = PY + (TOP + H / 2 - PY) * p;
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <div style={{position: 'absolute', top: 205, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 14, transform: `scale(${interpolate(lt, [0, 3, 7], [1.25, 0.96, 1], cl)})`}}>
          <span style={{width: 60, height: 60, background: RED, color: '#fff', fontFamily: DISP, fontSize: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>{si + 1}</span>
          <Chip size={56}>{seg[4]}</Chip>
        </span>
      </div>
      <div style={{position: 'absolute', left: cx - W / 2, top: cy - H / 2, width: W, height: H, transform: `scale(${sc})`, borderRadius: 54, overflow: 'hidden', border: '12px solid #161616', boxShadow: '0 50px 100px rgba(0,0,0,0.85), 0 0 60px rgba(209,11,12,0.25)', background: '#fff'}}>
        {WEB_SEGS.map(([a, d, st, rate]) => st < 0 ? (
          // ficha real del airbag Swift en autopartschile.cl: zoom hacia la pieza
          <Sequence key={a} from={T.web + a} durationInFrames={d}>
            <Img src={S('swift/web_airbag_swift.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '385px 581px', transform: `scale(${interpolate(t - a, [0, 14], [1, 1.3], {...cl, easing: OUT})})`}} />
          </Sequence>
        ) : (
          <Sequence key={a} from={T.web + a} durationInFrames={d}>
            <OffthreadVideo src={S('swift/web_recorrido.mp4')} muted startFrom={Math.round(st * 30)} playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + 0.03 * Math.min(1, (t - a) / d)})`}} />
          </Sequence>
        ))}
      </div>
      <PriceOrbit f={f} at={T.web + 112} until={T.end} cx={625} cy={881} rx={330} ry={95} text={noPrice ? ' DISPONIBLE • AIRBAG SWIFT • STOCK AL DÍA •' : ' $149.990 • DISPONIBLE • AIRBAG SWIFT •'} size={56} />
      {t >= 60 && (
        <div style={{position: 'absolute', top: 1520, left: 0, right: 0, textAlign: 'center', transform: `scale(${spring({frame: t - 60, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}})})`}}>
          <Img src={S('marca/pastilla-url.png')} style={{width: 780}} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* logo de la empresa arriba, siempre visible (versión blanca en fondos oscuros,
   a color sobre el CTA blanco) */
const TopLogo: React.FC<{f: number}> = ({f}) => {
  if (f >= T.end || (f >= T.black && f < T.reveal)) return null;
  const white = f >= T.cta && f < T.web;
  return <Img src={S(`marca/anim/${white ? 'logo_color' : 'logo_blanco'}.png`)} style={{position: 'absolute', left: 320, top: 46, width: 440, filter: white ? undefined : 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))', opacity: interpolate(f, [0, 6], [0, 1], cl)}} />;
};


/* barra "VENTAS DE HOY": se llena con cada venta (1/4 → 4/4) */
const SalesBar: React.FC<{f: number}> = ({f}) => {
  const noPrice = React.useContext(NoPrice);
  if (f < T.swift || f >= T.black) return null;
  const done = STAMPS.filter(([at]) => f >= at).length;
  const last = [...STAMPS].reverse().find(([at]) => f >= at);
  const pop = last ? interpolate(f - last[0], [0, 3, 9], [1.25, 0.97, 1], cl) : 1;
  return (
    <div style={{position: 'absolute', top: 182, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: interpolate(f, [T.swift, T.swift + 6], [0, 1], cl)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(10,10,10,0.78)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 30, padding: '6px 18px', transform: `scale(${pop})`}}>
        <span style={{fontFamily: DISP, fontSize: 30, color: '#fff', letterSpacing: 2}}>{noPrice ? 'CLIENTES DE HOY' : 'VENTAS DE HOY'}</span>
        {[0, 1, 2, 3].map((i) => {
          const fill = i < done ? 1 : 0;
          const just = last && i === done - 1 ? interpolate(f - last[0], [0, 6], [0, 1], cl) : 1;
          return <span key={i} style={{width: 46, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.18)', overflow: 'hidden', display: 'inline-block'}}><span style={{display: 'block', height: '100%', width: `${fill * just * 100}%`, background: '#FF2A2A', boxShadow: '0 0 12px #D10B0C'}} /></span>;
        })}
        <span style={{fontFamily: DISP, fontSize: 34, color: done ? '#FF2A2A' : '#fff'}}>{done}/4</span>
      </div>
    </div>
  );
};

/* ficha del sitio web junto a la venta: entra en 3D, toque de cursor y el
   estado pasa de "Disponible" a "VENDIDO" justo cuando cae el sello */
const WebCard: React.FC<{f: number; at: number; until: number; flip: number; img: string; title: string; x?: number; y?: number; w?: number}> = ({f, at, until, flip, img, title, x = 700, y = 250, w = 320}) => {
  if (f < at || f >= until) return null;
  const k = spring({frame: f - at, fps: 30, config: {damping: 14, stiffness: 190, mass: 0.6}});
  const out = interpolate(f, [until - 6, until], [0, 1], cl);
  const sold = f >= flip;
  const fp = sold ? interpolate(f - flip, [0, 3, 8], [1.35, 0.95, 1], cl) : 1;
  const tap = f - (at + 10);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, perspective: 900, opacity: 1 - out}}>
      <div style={{transform: `translateX(${(1 - k) * 420 + out * 300}px) rotateY(${(1 - k) * -35}deg)`, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 0 3px rgba(255,255,255,0.25)'}}>
        <div style={{background: '#0A0A0A', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{width: 9, height: 9, borderRadius: 5, background: '#D10B0C'}} />
          <span style={{flex: 1, background: '#1f1f1f', borderRadius: 10, padding: '3px 10px', fontFamily: TXT, fontWeight: 700, fontSize: 15, color: '#ddd'}}>🔒 autopartschile.cl</span>
        </div>
        <div style={{position: 'relative', height: w * 0.62, overflow: 'hidden'}}>
          <Img src={S(img)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${1.05 + (f - at) * 0.002})`}} />
          {sold && <div style={{position: 'absolute', inset: 0, background: 'rgba(209,11,12,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><span style={{border: '5px solid #fff', color: '#fff', fontFamily: DISP, fontSize: 46, padding: '0 14px 4px', transform: `rotate(-10deg) scale(${fp})`, letterSpacing: 2}}>VENDIDO</span></div>}
        </div>
        <div style={{padding: '10px 14px 14px'}}>
          <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 21, lineHeight: 1.2, color: '#111'}}>{title}</div>
          <span style={{display: 'inline-block', marginTop: 8, borderRadius: 14, padding: '3px 12px', fontFamily: TXT, fontWeight: 800, fontSize: 17, background: sold ? '#D10B0C' : '#e3f6e8', color: sold ? '#fff' : '#1f9d4a', transform: `scale(${fp})`, transformOrigin: 'left center'}}>{sold ? 'VENDIDO' : 'Disponible'}</span>
        </div>
      </div>
      {tap >= 0 && tap < 14 && <div style={{position: 'absolute', left: w * 0.55 - 30, top: w * 0.4 - 30, width: 60, height: 60, borderRadius: 30, border: '4px solid #FF2A2A', transform: `scale(${0.4 + tap * 0.12})`, opacity: 1 - tap / 14}} />}
    </div>
  );
};

/* ficha real del Vitara en la web (lo que vio el cliente antes de escribir) */
const VitaraWeb: React.FC<{f: number}> = ({f}) => {
  const at = T.vitara, until = T.vitara + 30;
  if (f < at || f >= until) return null;
  const k = spring({frame: f - at, fps: 30, config: {damping: 14, stiffness: 200, mass: 0.6}});
  const fly = interpolate(f, [until - 9, until], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const tap = f - (at + 12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', opacity: 1 - fly}}><Chip red size={54}>LO VIO EN LA WEB 👀</Chip></div>
      <div style={{position: 'absolute', left: 290, top: 330, width: 500, height: 1030, overflow: 'hidden', borderRadius: 26, boxShadow: '0 40px 90px rgba(0,0,0,0.85)', transform: `translateY(${(1 - k) * 1200}px) translate(${fly * 380}px, ${fly * -260}px) scale(${1 - fly * 0.7}) rotate(${fly * 8}deg)`, opacity: 1 - fly * 0.6}}>
        <Img src={S('swift/web_vitara.png')} style={{width: 500, display: 'block'}} />
        {tap >= 0 && tap < 14 && <div style={{position: 'absolute', left: 250 - 40, top: 870 - 40, width: 80, height: 80, borderRadius: 40, border: '5px solid #FF2A2A', transform: `scale(${0.4 + tap * 0.12})`, opacity: 1 - tap / 14}} />}
      </div>
    </AbsoluteFill>
  );
};

/* sello VENDIDO + número de cliente (variante "1 día") */
export const STAMPS: [number, number, number, number][] = [[228, T.master, 900, 1], [340, T.vitara, 900, 2], [498, T.airbag, 880, 3], [629, T.black, 900, 4]];
const Sold: React.FC<{f: number}> = ({f}) => (
  <>
    {STAMPS.map(([at, until, top, n]) => f >= at && f < until && (
      <div key={n} style={{position: 'absolute', top, right: 70, transform: `rotate(-10deg) scale(${interpolate(f - at, [0, 3, 7], [2.3, 0.92, 1], cl)})`, opacity: interpolate(f - at, [0, 2], [0, 1], cl), textAlign: 'center'}}>
        <div style={{border: `7px solid ${RED2}`, padding: '0 22px 4px', fontFamily: DISP, fontSize: 84, color: RED2, letterSpacing: 4, background: 'rgba(10,10,10,0.55)', textShadow: `0 0 18px ${RED}`}}>VENDIDO</div>
        <div style={{marginTop: 10, display: 'inline-block', background: '#fff', padding: '2px 14px 4px', fontFamily: DISP, fontSize: 40, color: BG, letterSpacing: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.6)'}}>CLIENTE <span style={{color: RED}}>{n}</span> DE 4</div>
      </div>
    ))}
  </>
);

/* reveal: negro + silencio → 4 AUTOS → 4 CLIENTES → cifra que crece */
const Reveal: React.FC<{f: number}> = ({f}) => {
  const noPrice = React.useContext(NoPrice);
  if (f < T.black || f >= T.desp) return null;
  const land = 697;
  const shrink = interpolate(f, [land, land + 9], [0, 1], {...cl, easing: OUT});
  const v = interpolate(f, [679, land], [0, 2704990], {...cl, easing: Easing.in(Easing.quad)});
  const ps = f < 679 ? 0 : f < land ? interpolate(f, [679, land], [0.55, 0.9], cl) : interpolate(f - land, [0, 3, 9], [1.35, 1.08, 1.12], cl);
  const word = (at: number, txt: string, top: number) => f >= at && (
    <div style={{position: 'absolute', top: top - shrink * (top - 330 - (top > 600 ? 120 : 0)), left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 190 - shrink * 100, lineHeight: 1, color: '#fff', transform: `scale(${interpolate(f - at, [0, 3, 8], [1.6, 0.97, 1], cl)})`}}>
      <span style={{color: RED2}}>4</span> {txt}
    </div>
  );
  return (
    <AbsoluteFill style={{background: BG}}>
      {f >= T.reveal && <PremiumBg f={f} />}
      {f >= land && <AbsoluteFill style={{background: `radial-gradient(circle at 50% 52%, rgba(209,11,12,${0.4 * Math.min(1, (f - land) / 6)}) 0%, rgba(7,7,7,0) 58%)`}} />}
      {f >= land && Array.from({length: 46}).map((_, i) => {
        const k = f - land;
        const x = random(`px${i}`) * 1080;
        const y0 = 700 + random(`py${i}`) * 900;
        const vy = 4 + random(`pv${i}`) * 9;
        return <div key={i} style={{position: 'absolute', left: x, top: y0 - k * vy, width: 5, height: 5, borderRadius: 3, background: i % 3 ? '#fff' : RED2, opacity: interpolate(k, [0, 4, 45], [0, 0.8, 0], cl)}} />;
      })}
      {word(T.reveal, 'AUTOS', 600)}
      {word(665, 'CLIENTES', 830)}
      {f >= 679 && (
        <div style={{position: 'absolute', top: interpolate(shrink, [0, 1], [1100, 880]), left: 0, right: 0, textAlign: 'center', transform: `scale(${ps})`}}>
          <Tag txt={noPrice ? 'ATENDIDOS EN 1 DÍA' : clp(v)} size={noPrice ? 104 : 136} wipe={interpolate(f, [679, 686], [0, 1], {...cl, easing: OUT})} k={f - land} />
        </div>
      )}
      {f >= 712 && (
        <div style={{position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
          {CARS.map((c, i) => {
            const p = sp(f, 712 + i * 3, 10, 300);
            return <div key={i} style={{width: 200, height: 134, border: '4px solid #fff', overflow: 'hidden', transform: `scale(${p}) rotate(${(i - 1.5) * 3}deg)`}}><Img src={S(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div>;
          })}
        </div>
      )}
      {f >= 722 && <div style={{position: 'absolute', top: 1440, left: 0, right: 0, textAlign: 'center'}}><Rise f={f} at={722} style={{fontFamily: DISP, fontSize: 60, color: 'rgba(255,255,255,0.85)', letterSpacing: 3}}>{noPrice ? 'CADA UNO CON LO QUE BUSCABA' : 'EN REPUESTOS VENDIDOS'}</Rise></div>}
    </AbsoluteFill>
  );
};

/* CTA sobre blanco (cambio de contraste = nueva atención) + cierre de marca */
const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < T.cta || f >= T.web) return null;
  const t = f - T.cta;
  if (f < T.end) {
    const chip = (at: number, txt: string, i: number) => f >= at && (
      <div style={{transform: `translateX(${interpolate(f - at, [0, 5], [-700, 0], {...cl, easing: OUT})}px)`}}>
        <span style={{display: 'inline-block', background: i === 2 ? RED : BG, color: '#fff', fontFamily: DISP, fontSize: 84, padding: '0 26px 6px'}}>{txt}</span>
      </div>
    );
    return (
      <AbsoluteFill style={{background: '#fff'}}>
        <div style={{position: 'absolute', top: 250, left: 70, right: 70}}>
          <Rise f={f} at={T.cta + 1} style={{fontFamily: DISP, fontSize: 110, color: BG, lineHeight: 1}}>¿BUSCAS UN</Rise>
          <Rise f={f} at={T.cta + 4} style={{fontFamily: DISP, fontSize: 176, color: RED, lineHeight: 1}}>REPUESTO?</Rise>
        </div>
        <div style={{position: 'absolute', top: 640, left: 70, display: 'flex', flexDirection: 'column', gap: 10}}>
          <Rise f={f} at={T.cta + 20} style={{fontFamily: DISP, fontSize: 70, color: BG}}>ENVÍANOS:</Rise>
          {chip(T.cta + 26, 'MODELO', 0)}
          {chip(T.cta + 32, '+ AÑO', 1)}
          {chip(T.cta + 38, '+ FOTO', 2)}
        </div>
        {t >= 54 && <div style={{position: 'absolute', top: 1185, left: 70, right: 70}}><Rise f={f} at={T.cta + 54} style={{fontFamily: DISP, fontSize: 66, color: BG}}>Y TE AYUDAMOS A ENCONTRARLO.</Rise></div>}
        {t >= 66 && (
          <div style={{position: 'absolute', top: 1290, left: 70, display: 'flex', flexDirection: 'column', gap: 10, transform: `translateY(${interpolate(t, [66, 72], [40, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(t, [66, 70], [0, 1], cl)}}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 16, background: BG, color: '#fff', fontFamily: DISP, fontSize: 60, padding: '10px 26px', alignSelf: 'flex-start'}}>
              <span style={{width: 26, height: 26, borderRadius: 13, background: '#25D366'}} /> +56 9 5381 7335
            </span>
            <span style={{fontFamily: DISP, fontSize: 70, color: RED, letterSpacing: 2}}>AUTOPARTSCHILE.CL</span>
          </div>
        )}
      </AbsoluteFill>
    );
  }
  return null;
};

/* grano de película + viñeta (textura que saca el look "plantilla") */
const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} style={{position: 'absolute', opacity: f >= T.cta ? 0.05 : 0.09, mixBlendMode: 'overlay'}}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={f % 7} /></filter>
      <rect width={1080} height={1920} filter="url(#grain)" />
    </svg>
    {f < T.cta && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />}
  </AbsoluteFill>
);

/* ───────────── sonido: una capa por evento ───────────── */
type Sfx = [number, string, number, number?];
export const SFX: Sfx[] = [
  // gancho
  [0, 'sfx_whip', 0.8], [0, 'sfx_sub', 0.7], [4, 'sfx_shutter', 0.5], [8, 'sfx_shutter', 0.5], [12, 'sfx_shutter', 0.5],
  [16, 'sfx_impact', 0.75, 14], [30, 'sfx_impact', 0.75, 14], [44, 'sfx_billcount', 0.55], [58, 'sfx_tick', 0.5],
  // contexto
  [70, 'sfx_whoosh', 0.7], [96, 'sfx_metal', 0.8], [106, 'sfx_impact_soft', 0.6, 30],
  // Swift
  [147, 'sfx_whoosh', 0.7], [150, 'sfx_rev', 0.45], [168, 'sfx_click', 0.6], [178, 'sfx_click', 0.6], [188, 'sfx_click', 0.6],
  [200, 'sfx_whoosh', 0.5], [210, 'sfx_riser', 0.35], [214, 'sfx_tick', 0.6], [217, 'sfx_tick', 0.6], [220, 'sfx_tick', 0.6],
  [223, 'sfx_impact', 0.85, 30], [224, 'sfx_kaching_real', 0.7],
  // Mastervan
  [265, 'sfx_whip', 0.8], [270, 'sfx_metal', 0.85], [296, 'sfx_metal', 0.7], [318, 'sfx_click', 0.6],
  [330, 'sfx_tick', 0.6], [332, 'sfx_tick', 0.6], [334, 'sfx_metal', 0.9], [335, 'sfx_impact', 0.85, 30], [336, 'sfx_kaching_real', 0.65],
  // Vitara
  [372, 'sfx_whoosh', 0.6], [381, 'sfx_notif', 0.8], [399, 'sfx_pop', 0.7], [405, 'sfx_notif', 0.6], [419, 'sfx_pop', 0.7],
  [434, 'sfx_whip', 0.8], [448, 'sfx_click', 0.55], [454, 'sfx_click', 0.55], [460, 'sfx_click', 0.55], [466, 'sfx_click', 0.55],
  [478, 'sfx_whoosh', 0.5], [484, 'sfx_tick', 0.6], [487, 'sfx_tick', 0.6], [490, 'sfx_tick', 0.6], [493, 'sfx_impact', 0.8, 26], [494, 'sfx_kaching_real', 0.65],
  [508, 'sfx_whoosh', 0.45],
  // airbag (más rápido)
  [538, 'sfx_whip', 0.7], [542, 'sfx_notif', 0.75], [562, 'sfx_shutter', 0.8], [580, 'sfx_shutter', 0.8], [598, 'sfx_shutter', 0.8], [598, 'sfx_crinkle', 0.5],
  [614, 'sfx_whoosh', 0.6], [616, 'sfx_riser', 0.4, 24], [624, 'sfx_sub', 0.9, 17], [624, 'sfx_impact', 0.9, 17], [625, 'sfx_kaching_real', 0.6, 16],
  // reveal (641–651 en silencio)
  [651, 'sfx_impact', 0.8, 14], [651, 'sfx_sub', 0.6, 14], [655, 'sfx_riser', 0.3, 10], [665, 'sfx_impact', 0.8, 14], [665, 'sfx_sub', 0.6, 14],
  [670, 'sfx_riser', 0.55], [679, 'sfx_billcount', 0.6], [697, 'sfx_sub', 1], [697, 'sfx_impact', 0.95], [698, 'sfx_kaching_real', 0.8],
  [712, 'sfx_pop', 0.5], [715, 'sfx_pop', 0.5], [718, 'sfx_pop', 0.5], [721, 'sfx_pop', 0.5],
  // despachos
  [T.desp - 2, 'sfx_whip', 0.6], [T.desp + 1, 'sfx_shutter', 0.6], [T.desp + 26, 'sfx_crinkle', 0.6], [T.desp + 33, 'sfx_crinkle', 0.5],
  [T.desp + 46, 'sfx_metal', 0.85], [T.desp + 46, 'sfx_impact', 0.6, 16], [T.desp + 70, 'sfx_whoosh', 0.5],
  [T.desp + 82, 'sfx_pop', 0.5], [T.desp + 86, 'sfx_pop', 0.5], [T.desp + 90, 'sfx_pop', 0.5], [T.desp + 96, 'sfx_notif', 0.8],
  // compra web
  [T.web - 2, 'sfx_whoosh', 0.6], [T.web + 8, 'sfx_impact_soft', 0.5, 30], [T.web + 14, 'sfx_whoosh', 0.4], [T.web + 30, 'sfx_riser', 0.4, 14], [T.web + 44, 'sfx_whip', 0.7],
  [T.web + 62, 'sfx_click', 0.6], [T.web + 84, 'sfx_click', 0.6], [T.web + 88, 'sfx_key', 0.4], [T.web + 92, 'sfx_key', 0.4], [T.web + 96, 'sfx_key', 0.4], [T.web + 60, 'sfx_pop', 0.5],
  // anillos de precio + ka-ching de la ficha web
  [206, 'sfx_riser', 0.3, 14], [324, 'sfx_riser', 0.3, 14], [566, 'sfx_riser', 0.3, 14], [T.web + 108, 'sfx_whoosh', 0.5], [T.web + 112, 'sfx_kaching_real', 0.85], [T.web + 113, 'sfx_coins', 0.4],
  // fichas web, barra de ventas y loop final
  [158, 'sfx_whoosh', 0.35], [170, 'sfx_click', 0.5], [274, 'sfx_whoosh', 0.35], [286, 'sfx_click', 0.5], [T.vitara + 2, 'sfx_whoosh', 0.4], [T.vitara + 12, 'sfx_click', 0.6],
  [229, 'sfx_coin', 0.5], [341, 'sfx_coin', 0.5], [499, 'sfx_coin', 0.5], [630, 'sfx_coin', 0.5], [50, 'sfx_pop', 0.5], [T.loop - 2, 'sfx_whip', 0.7],
  // CTA
  [868, 'sfx_whip', 0.75], [896, 'sfx_click', 0.6], [902, 'sfx_click', 0.6], [908, 'sfx_click', 0.6], [924, 'sfx_pop', 0.6],
  [936, 'sfx_notif', 0.7],
];

export const CuatroAutos: React.FC<{vo?: string; dia?: boolean; mute?: boolean}> = ({vo, dia, mute}) => {
  const voLines = dia ? VO_DIA : null;
  const noPrice = React.useContext(NoPrice);
  const f = useCurrentFrame();
  let sx = 0, sy = 0;
  for (const [at, a] of HITS) {
    const k = f - at;
    if (k >= 0 && k < 10) { const d = a * (1 - k / 10); sx += Math.sin(k * 2.9) * d; sy += Math.cos(k * 3.7) * d; }
  }
  const flash = FLASH.reduce((m, [at, a]) => (f === at ? Math.max(m, a) : f === at + 1 ? Math.max(m, a * 0.4) : m), 0);
  const fade = interpolate(f, [636, T.black], [0, 1], cl) * (f < T.black + 1 ? 1 : 0);
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* imagen */}
        <HookFootage />
        <Sequence from={T.ctx} durationInFrames={T.swift - T.ctx}><Context f={f} /></Sequence>
        <Shot src="swift/entrega_anon.mp4" from={T.swift} dur={50} start={0.2} z={[1.06, 1.22]} inT="zoom" dim={0.15} />
        <Sequence from={T.swift + 50} durationInFrames={70}><SwiftEngine /></Sequence>
        <Shot src="swift/mv_desarme.mp4" from={T.master} dur={26} start={5.4} z={[1.15, 1.25]} inT="whipL" dim={0.15} />
        <Shot src="swift/mv_motor.mp4" from={296} dur={22} start={0.1} z={[1.2, 1.1]} dim={0.15} />
        <Shot src="swift/mv_carga.mp4" from={318} dur={57} start={1.3} z={[1.1, 1.3]} origin="50% 45%" outT="whipL" dim={0.2} />
        <Sequence from={T.vitara} durationInFrames={T.vitPieces - T.vitara}>
          <AbsoluteFill style={{filter: 'blur(26px) brightness(0.4)', transform: 'scale(1.15)'}}>
            <OffthreadVideo src={S('swift/vitara_local_anon.mp4')} muted startFrom={6} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>
        <VitaraChat f={f} />
        <Shot src="swift/vitara_portalon.mp4" from={T.vitPieces} dur={36} start={0} z={[1.25, 1.05]} inT="zoom" dim={0.4} />
        <Shot src="swift/vitara_carga.mp4" from={T.vitPrice} dur={62} start={0.9} z={[1.05, 1.2]} dim={0.45} outT="whipL" />
        <Sequence from={T.airbag} durationInFrames={22}>
          <AbsoluteFill style={{filter: 'blur(24px) brightness(0.45)', transform: 'scale(1.15)'}}>
            <OffthreadVideo src={S('swift/airbag_kit.mp4')} muted startFrom={84} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>
        <Shot src="swift/airbag_kit.mp4" from={562} dur={18} start={2.8} z={[1.3, 1.15]} dim={0.2} />
        <Shot src="swift/airbag_kit.mp4" from={580} dur={18} start={4.9} z={[1.25, 1.1]} dim={0.2} />
        <Shot src="swift/airbag_kit.mp4" from={598} dur={16} start={7.2} z={[1.1, 1.22]} dim={0.2} />
        <Shot src="swift/car_sx4.jpg" from={614} dur={T.black - 614} z={[1.0, 1.12]} origin="40% 50%" dim={0.45} />
        {/* texto */}
        <HookText f={f} dia={dia} />
        {dia && <Sold f={f} />}
        <SwiftText f={f} />
        <MasterText f={f} />
        <VitaraText f={f} />
        <AirbagText f={f} />
        <Reveal f={f} />
        <Despachos f={f} />
        <WebScene f={f} />
        <Cta f={f} />
        <Sequence from={T.end} durationInFrames={STING_LEN}><LogoSting mute={mute} /></Sequence>
        <Shot src="swift/mv_carga.mp4" from={T.loop} dur={10} start={1.17} z={[1.55, 1.34]} inT="whipL" />
        <LightLeaks f={f} at={[T.ctx, T.swift, T.master, T.vitara, T.vitPieces, T.vitPrice, T.airbag, 697, T.desp, T.desp + 24]} />
        <PriceOrbit f={f} at={206} until={T.master - 4} cx={540} cy={900} rx={390} ry={105} text={noPrice ? ' MOTOR SWIFT • ENTREGADO • CLIENTE 1 •' : ' $900.000 • MOTOR SWIFT • VENDIDO •'} />
        <PriceOrbit f={f} at={324} until={T.vitara - 4} cx={540} cy={975} rx={370} ry={100} text={noPrice ? ' MOTOR MASTERVAN • CARGADO • CLIENTE 2 •' : ' $520.000 • MOTOR MASTERVAN • VENDIDO •'} />
        <PriceOrbit f={f} at={566} until={612} cx={540} cy={960} rx={400} ry={108} text={noPrice ? ' KIT AIRBAG SWIFT • ENTREGADO • CLIENTE 4 •' : ' $384.990 • KIT AIRBAG SWIFT • VENDIDO •'} />
        <Brackets f={f} at={322} until={T.vitara} x={240} y={760} w={600} h={420} />
        <Brackets f={f} at={564} until={598} x={190} y={640} w={700} h={640} />
        <Brackets f={f} at={616} until={T.black} x={70} y={390} w={940} h={590} />
        <SalesBar f={f} />
        <WebCard f={f} at={160} until={T.master - 2} flip={228} img="swift/c_swift.jpg" title="Motor completo 1.2 japonés (tapa plástica)" />
        <WebCard f={f} at={276} until={T.vitara - 2} flip={340} img="swift/c_mvblock.jpg" title="Motor completo G13B 1.3 · Mastervan" />
        <VitaraWeb f={f} />
        <TopLogo f={f} />
      </AbsoluteFill>
      {fade > 0 && <AbsoluteFill style={{background: `rgba(0,0,0,${fade})`}} />}
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      <Grain f={f} />
      {/* sonido */}
      {!mute && SFX.map(([at, n, v, d], i) => (
        <Sequence key={i} from={at} durationInFrames={d ?? 90}><Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voLines && voOn(voLines, at + x) ? 0.45 : 1)} /></Sequence>
      ))}
      {dia && !mute && STAMPS.map(([at]) => <Sequence key={`st${at}`} from={at} durationInFrames={20}><Audio src={S('audio/sfx_metal.wav')} volume={0.8} /></Sequence>)}
      {!mute && voLines && voLines.map(([st, du, file]) => <Sequence key={file} from={st} durationInFrames={du + 2}><Audio src={S(file)} volume={1} /></Sequence>)}
      {vo && <Audio src={S(vo)} />}
    </AbsoluteFill>
  );
};

export const UnDiaClientes: React.FC<{vo?: string}> = ({vo}) => <CuatroAutos vo={vo} dia />;
