import React from 'react';
import {AbsoluteFill, Audio, Easing, Freeze, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Chip} from './CuatroAutos';
import {Brackets, GRADE, LightLeaks, PremiumBg} from './Fx';
import {IOSNotif, RayBurst, ServiceCard, StripeWipe} from './Promo';
import {SX4Compra, SX4_T, SX4_TOTAL} from './SX4Compra';

/* "2 autos comprados en 2 horas" — v2, contado como carrera contra el reloj con
   las horas REALES de las grabaciones:
   MAR 14:13 Messenger del SX4 (hora del chat) → MAR 14:33 WhatsApp del Jeep
   (hora del chat) → MAR 16:19 Jeep en la grúa
   (hora del video) → "2 tratos en 2 horas" → MIÉ 15:03–15:15 retiro del SX4
   (horas de los videos) → cagada del día → CTA → loop.
   Un reloj tipo cámara arriba a la derecha marca la hora de cada escena. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const DISP = "'Anton', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sp = (t: number, d = 0, damping = 12, stiffness = 260) => spring({frame: t - d, fps: 30, config: {damping, stiffness, mass: 0.5}});

// ---- línea de tiempo
const HOOK = 84;
const CH1 = HOOK;                         // MAR 14:13 · Messenger (SX4 interno 40–150)
const CH1_LEN = 76;                       // Messenger comprimido: 110 frames internos → 2,5 s
const M1 = (x: number) => CH1 + Math.round((x * CH1_LEN) / (SX4_T.ver - SX4_T.msg)); // frame interno del Messenger (relativo) → este video
const WA = CH1 + CH1_LEN;                 // MAR 14:33 · WhatsApp del Jeep
const WA_LEN = 96;
const CH2 = WA + WA_LEN;                  // MAR 16:19 · Jeep
const CH2_LEN = 96;
const PAY = CH2 + CH2_LEN;                // 2 tratos en 2 horas
const PAY_LEN = 54;
const CH3 = PAY + PAY_LEN;                // MIÉ 15:03 · retiro del SX4 (SX4 interno 150 → fin)
const SX4_END = SX4_TOTAL - 10;
const CH3_LEN = SX4_END - SX4_T.ver;
export const DOS2_TOTAL = CH3 + CH3_LEN + 10;
const LOOP = DOS2_TOTAL - 10;
const X3 = (inner: number) => CH3 + (inner - SX4_T.ver);   // frame del SX4 (parte 2) → este video

/* reloj tipo cámara (minutos del día) */
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const M1433 = 14 * 60 + 33;
const M1413 = 14 * 60 + 13, M1619 = 16 * 60 + 19, M1503 = 15 * 60 + 3, M1515 = 15 * 60 + 15;
type Hook = 'mensaje' | 'foco';
// [día, minutos, etiqueta de velocidad]
const clockAt = (f: number, hook: Hook): [string, number, string | null] | null => {
  if (hook === 'foco') {
    if (f < 48) return ['MIÉ', M1515, null];
    if (f < HOOK) {
      // rebobinado: MIÉ 15:15 → MAR 14:13 (minutos desde el martes 00:00)
      const m = interpolate(f, [50, 80], [1440 + M1515, M1413], {...cl, easing: Easing.inOut(Easing.quad)});
      return [m >= 1440 ? 'MIÉ' : 'MAR', m % 1440, '◀◀ REW'];
    }
  } else {
    if (f < 14) return null;
    if (f < 48) return ['MAR', interpolate(f, [14, 46], [M1413, M1619], {...cl, easing: Easing.in(Easing.quad)}), '▶▶ x4'];
    if (f < HOOK) return null;
  }
  if (f < WA) return ['MAR', M1413, null];
  if (f < CH2) return ['MAR', M1433, null];
  if (f < PAY) return ['MAR', M1619, null];
  if (f < CH3) return null;
  if (f < X3(SX4_T.cta)) return ['MIÉ', interpolate(f, [CH3, X3(SX4_T.oops)], [M1503, M1515], cl), null];
  return null;
};
const CamClock: React.FC<{f: number; hook: Hook}> = ({f, hook}) => {
  const c = clockAt(f, hook);
  if (!c) return null;
  const [day, m, ff] = c;
  return (
    <div style={{position: 'absolute', top: 64, left: 28, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,10,10,0.72)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '6px 14px'}}>
      <span style={{width: 16, height: 16, borderRadius: 8, background: RED2, opacity: Math.floor(f / 10) % 2 ? 1 : 0.35}} />
      <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: 1}}>{day} {hhmm(m)}</span>
      {ff && <span style={{fontFamily: DISP, fontSize: 32, color: RED2}}>{ff}</span>}
    </div>
  );
};

/* tarjeta de capítulo (se superpone 1 s sin cortar la escena) */
const Chapter: React.FC<{f: number; at: number; day: string; time: string; txt: string}> = ({f, at, day, time, txt}) => {
  const t = f - at;
  if (t < 0 || t >= 34) return null;
  const k = interpolate(t, [0, 6, 26, 34], [0, 1, 1, 0], {...cl, easing: OUT});
  return (
    <div style={{position: 'absolute', top: 820, left: 0, right: 0, height: 250, transform: `scaleY(${k})`, background: 'rgba(10,10,10,0.82)', borderTop: `6px solid ${RED}`, borderBottom: `6px solid ${RED}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 44, color: RED2, letterSpacing: 4, transform: `translateX(${(1 - k) * -200}px)`}}>{day} · {time}</div>
      <div style={{fontFamily: DISP, fontSize: 84, color: '#fff', lineHeight: 1.05, transform: `translateX(${(1 - k) * 200}px)`}}>{txt}</div>
    </div>
  );
};

const Deal: React.FC<{f: number; at: number; top: number; txt?: string; size?: number}> = ({f, at, top, txt = 'TRATO HECHO', size = 86}) => {
  if (f < at) return null;
  const k = f - at;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${interpolate(k, [0, 3, 8], [2.4, 0.92, 1], cl)})`, opacity: interpolate(k, [0, 2], [0, 1], cl)}}>
      <span style={{display: 'inline-block', border: `7px solid ${RED2}`, padding: '0 22px 6px', fontFamily: DISP, fontSize: size, color: '#fff', background: 'rgba(209,11,12,0.9)', letterSpacing: 2, boxShadow: `0 0 34px ${RED}, 0 16px 34px rgba(0,0,0,0.7)`}}>{txt}</span>
    </div>
  );
};

/* ---- GANCHO: mensaje 14:13 → Jeep a velocidad x4 → 16:19 → pantalla dividida */
const Hook: React.FC<{f: number}> = ({f}) => {
  if (f < 14) {
    return (
      <AbsoluteFill style={{background: '#0A0A0A'}}>
        <Img src={S('swift/sx4b_fotochat.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: `${GRADE} blur(3px) brightness(0.55)`, transform: `scale(${1.15 - f * 0.006})`}} />
        <IOSNotif f={f} at={0} dur={20} icon="marca/icono-chat.png" iconBg="transparent" app="Messenger" title="Marketplace · nuevo mensaje" body="Te ofrecen un vehículo para desarme" />
        <div style={{position: 'absolute', top: 820, left: 60, right: 60, textAlign: 'center', fontFamily: DISP, fontSize: 104, lineHeight: 1.02, color: '#fff', transform: `scale(${interpolate(f, [2, 5, 10], [1.5, 0.96, 1], cl)})`, opacity: f >= 2 ? 1 : 0}}>UN MENSAJE<br /><span style={{color: RED2}}>A LAS 14:13…</span></div>
      </AbsoluteFill>
    );
  }
  if (f < 48) {
    const t = f - 14;
    return (
      <AbsoluteFill style={{background: '#0A0A0A'}}>
        <Sequence from={14} durationInFrames={34}>
          <AbsoluteFill style={{transform: `scale(${interpolate(t, [0, 34], [1.75, 1.45], cl)}) translateX(${Math.sin(t * 1.7) * 4}px)`}}>
            <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
        {/* líneas de velocidad */}
        {Array.from({length: 10}).map((_, i) => <div key={i} style={{position: 'absolute', left: ((i * 137 + t * 90) % 1300) - 200, top: 200 + i * 160, width: 260, height: 4, background: 'rgba(255,255,255,0.35)'}} />)}
        <div style={{position: 'absolute', top: 1430, left: 60, right: 60, textAlign: 'center', fontFamily: DISP, fontSize: 104, lineHeight: 1.02, color: '#fff', textShadow: '0 8px 30px #000'}}>…Y A LAS <span style={{color: RED2}}>16:19</span></div>
      </AbsoluteFill>
    );
  }
  const k = f - 48;
  const split = interpolate(k, [0, 8], [0, 1], {...cl, easing: OUT});
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - split) * -1080}px)`}}>
        <Sequence from={48}><OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={8} playbackRate={0.5} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: 'scale(1.15)'}} /></Sequence>
      </div>
      <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - split) * 1080}px)`}}>
        <Sequence from={48}><OffthreadVideo src={S('swift/sx4b_arriba.mp4')} muted startFrom={9} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: 'scale(1.1)'}} /></Sequence>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED, boxShadow: `0 0 24px ${RED}`}} />
      {k >= 2 && <div style={{position: 'absolute', top: 690, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(k - 2, [0, 3, 8], [1.7, 0.95, 1], cl)})`}}><span style={{display: 'inline-block', background: '#0A0A0A', padding: '6px 26px 12px', fontFamily: DISP, fontSize: 88, lineHeight: 1, color: '#fff'}}>2 AUTOS COMPRADOS</span></div>}
      {k >= 8 && <div style={{position: 'absolute', top: 1050, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(k - 8, [0, 3, 8], [1.7, 0.95, 1], cl)})`}}><span style={{display: 'inline-block', background: RED, padding: '6px 26px 12px', fontFamily: DISP, fontSize: 96, lineHeight: 1, color: '#fff'}}>EN 2 HORAS</span></div>}
      {k >= 22 && <div style={{position: 'absolute', top: 1660, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(k, 22, 11, 280)})`}}><Chip size={58}>MIRA CÓMO FUE</Chip></div>}
    </AbsoluteFill>
  );
};

/* ---- GANCHO B: el foco roto primero → rebobinado al mensaje del martes */
const HookFoco: React.FC<{f: number}> = ({f}) => {
  const big = (at: number, txt: React.ReactNode, top: number, size: number, bg?: string) => f >= at && (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - at, [0, 3, 8], [1.7, 0.95, 1], cl)})`}}>
      <span style={{display: 'inline-block', background: bg ?? '#0A0A0A', padding: '6px 26px 12px', fontFamily: DISP, fontSize: size, lineHeight: 1, color: '#fff'}}>{txt}</span>
    </div>
  );
  const rew = f >= 48;
  const t = f - 48;
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <Sequence from={0} durationInFrames={HOOK}>
        <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, 6, 48], [1.7, 1.35, 1.2], cl)})`, transformOrigin: '50% 58%'}}>
          {/* en el rebobinado el clip corre hacia atrás: se congela el cuadro según el avance */}
          {!rew
            ? <OffthreadVideo src={S('swift/sx4b_foco.mp4')} muted startFrom={24} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
            : <Freeze frame={Math.max(0, 48 - t * 3)}><OffthreadVideo src={S('swift/sx4b_foco.mp4')} muted startFrom={24} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.6) contrast(1.2) brightness(0.6)'}} /></Freeze>}
        </AbsoluteFill>
      </Sequence>
      {!rew && big(2, 'COMPRÉ 2 AUTOS EN 2 HORAS…', 1480, 78)}
      {!rew && big(20, '…Y TERMINÉ ASÍ', 1600, 96, RED)}
      {rew && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {Array.from({length: 9}).map((_, i) => {
            const y = (random(`ry${i}-${f}`) * 1920) | 0;
            return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 6 + random(`rh${i}-${f}`) * 26, background: 'rgba(255,255,255,0.18)', transform: `translateX(${(random(`rx${i}-${f}`) - 0.5) * 120}px)`}} />;
          })}
          <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 120, color: '#fff', textShadow: `-5px 0 ${RED2}, 5px 0 #29f`, transform: `translateX(${Math.sin(t * 3) * 8}px)`}}>◀◀ REW</div>
          {t >= 6 && <div style={{position: 'absolute', top: 930, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(t, 6, 11, 280)})`}}><Chip size={60}>PARTAMOS DEL INICIO</Chip></div>}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
const HookLocal: React.FC<{hook: Hook}> = ({hook}) => (hook === 'foco' ? <HookFoco f={useCurrentFrame()} /> : <Hook f={useCurrentFrame()} />);

/* ---- MAR 14:33 · el cliente del Jeep escribe por WhatsApp (captura real,
   nombre, número y patente pixelados). Imagen 1179×2870, mismo recorrido de
   cámara que el Messenger del SX4. */
const KW = 600 / 1179;
const WhatsApp: React.FC<{f: number}> = ({f}) => {
  const t = f - WA;
  const enter = interpolate(t, [0, 8], [1, 0], {...cl, easing: OUT});
  // [t, x, y, zoom] en coordenadas de la captura: en t la cámara sale de ese punto hacia el siguiente (10 frames)
  const keys: [number, number, number, number][] = [[0, 590, 1100, 0.95], [34, 440, 540, 1.6], [52, 590, 1880, 1.2], [999, 420, 2760, 1.6]];
  let ki = 0; while (ki < keys.length - 2 && t >= keys[ki + 1][0]) ki++;
  const [t0, x0, y0, z0] = keys[ki], [, x1, y1, z1] = keys[ki + 1];
  const m = interpolate(t, [t0, t0 + 10], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const cx = x0 + (x1 - x0) * m, cy = y0 + (y1 - y0) * m, z = z0 + (z1 - z0) * m;
  const L = 240, TOP = 170, HEAD = 96;
  const px = L + cx * KW, py = TOP + HEAD + cy * KW;
  const hl = (a: number, x0: number, y0: number, x1: number, y1: number) => {
    const w = interpolate(t, [a, a + 7], [0, 1], {...cl, easing: OUT});
    return t >= a && <div style={{position: 'absolute', left: x0 * KW - 4, top: HEAD + y0 * KW, width: (x1 - x0) * KW * w + 8, height: (y1 - y0) * KW, background: 'rgba(209,11,12,0.2)', borderBottom: `5px solid ${RED2}`}} />;
  };
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <AbsoluteFill style={{transform: `translateY(${enter * 1500}px) translate(${540 - px}px, ${1000 - py}px) scale(${z})`, transformOrigin: `${px}px ${py}px`}}>
        <div style={{position: 'absolute', left: L, top: TOP, width: 600, height: HEAD + 2870 * KW, borderRadius: 50, overflow: 'hidden', border: '12px solid #161616', boxShadow: '0 50px 100px rgba(0,0,0,0.85)', background: '#efe7de'}}>
          <div style={{height: HEAD, background: '#f6f6f6', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 26px 0', boxSizing: 'border-box', borderBottom: '1px solid #ddd'}}>
            <div style={{width: 50, height: 50, borderRadius: 25, background: '#f3d4c6'}} />
            <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 26, color: '#111'}}>Cliente · WhatsApp</div>
          </div>
          <Img src={S('swift/jeep_whatsapp.png')} style={{width: 600, display: 'block'}} />
          {hl(14, 40, 450, 830, 560)}
          {hl(64, 40, 2680, 790, 2790)}
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 205, left: 60, transform: `translateX(${(1 - sp(f, WA + 2, 11, 280)) * -700}px)`}}><Chip red size={54}>20 MINUTOS DESPUÉS</Chip></div>
      <div style={{position: 'absolute', top: 1520, left: 50, right: 50, textAlign: 'center'}}>
        {t >= 18 && t < 50 && <div style={{fontFamily: DISP, fontSize: 70, lineHeight: 1.05, color: '#fff', textShadow: '0 6px 20px rgba(0,0,0,0.9)', transform: `scale(${interpolate(t - 18, [0, 3, 8], [1.5, 0.96, 1], cl)})`}}><span style={{background: '#0A0A0A', padding: '4px 22px 10px'}}>OTRO CLIENTE: <span style={{color: RED2}}>UN JEEP</span></span></div>}
        {t >= 68 && <div style={{fontFamily: DISP, fontSize: 70, lineHeight: 1.05, color: '#fff', textShadow: '0 6px 20px rgba(0,0,0,0.9)', transform: `scale(${interpolate(t - 68, [0, 3, 8], [1.5, 0.96, 1], cl)})`}}><span style={{background: '#0A0A0A', padding: '4px 22px 10px'}}>NECESITA SACARLO…</span><br /><span style={{display: 'inline-block', marginTop: 8, background: RED, padding: '4px 22px 10px'}}>VAMOS CON LA GRÚA</span></div>}
      </div>
    </AbsoluteFill>
  );
};

/* ---- MAR 16:19 · Jeep en formato cine */
const Jeep: React.FC<{f: number}> = ({f}) => {
  const t = f - CH2;
  const k = sp(f, CH2, 13, 200);
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <Sequence from={CH2} durationInFrames={CH2_LEN}>
        <AbsoluteFill style={{filter: 'blur(30px) brightness(0.4)', transform: 'scale(1.3)'}}>
          <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} playbackRate={0.37} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: 540, width: 1080, height: 810, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', borderTop: `6px solid ${RED}`, borderBottom: `6px solid ${RED}`, transform: `perspective(1600px) rotateY(${(1 - k) * 25}deg) scale(${0.85 + 0.15 * k})`}}>
          <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} playbackRate={0.37} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${interpolate(t, [0, CH2_LEN], [1.02, 1.16], cl)})`, transformOrigin: '40% 55%'}} />
        </div>
      </Sequence>
      <div style={{position: 'absolute', top: 205, left: 60, transform: `translateX(${(1 - sp(f, CH2 + 2, 11, 280)) * -700}px)`}}><Chip red size={54}>ESA MISMA TARDE</Chip></div>
      <div style={{position: 'absolute', top: 300, left: 60, right: 60}}>
        {t >= 6 && <div style={{fontFamily: DISP, fontSize: 64, color: '#fff', opacity: interpolate(t, [6, 10], [0, 1], cl), letterSpacing: interpolate(t, [6, 18], [20, 2], cl)}}>JEEP</div>}
        {t >= 9 && <div style={{fontFamily: DISP, fontSize: 118, lineHeight: 1, color: '#fff', transform: `translateY(${interpolate(t, [9, 15], [40, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(t, [9, 13], [0, 1], cl)}}>GRAND CHEROKEE</div>}
      </div>
      <Brackets f={f} at={CH2 + 16} until={CH2 + CH2_LEN - 4} x={70} y={640} w={940} h={560} />
      <Deal f={f} at={CH2 + 38} top={1400} />
      <RayBurst f={f} at={CH2 + 38} x={540} y={1460} r0={300} />
      {t >= 58 && <div style={{position: 'absolute', top: 1570, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(f, CH2 + 58, 11, 280)})`}}><Chip size={52}>DIRECTO A LA GRÚA</Chip></div>}
    </AbsoluteFill>
  );
};

/* ---- remate parcial: el reloj se llena de 14:13 a 16:19 */
const Payoff: React.FC<{f: number}> = ({f}) => {
  const t = f - PAY;
  const p = interpolate(t, [4, 30], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const r = 230, C = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #2a0d0d 0%, #0A0A0A 65%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <circle cx={540} cy={820} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={30} />
        <circle cx={540} cy={820} r={r} fill="none" stroke={RED2} strokeWidth={30} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 540 820)" style={{filter: `drop-shadow(0 0 16px ${RED})`}} />
      </svg>
      <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 100, color: '#fff'}}>{hhmm(M1413 + (M1619 - M1413) * p)}</div>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,0.6)', letterSpacing: 4}}>MARTES · 14:13 → 16:19</div>
      <Deal f={f} at={PAY + 30} top={1140} txt="2 TRATOS EN 2 HORAS" size={92} />
      <RayBurst f={f} at={PAY + 30} x={540} y={1210} r0={380} n={18} />
    </AbsoluteFill>
  );
};

type Sfx = [number, string, number, number?];
const HOOK_SFX: Record<Hook, Sfx[]> = {
  mensaje: [
    [0, 'sfx_notif', 0.9], [2, 'sfx_impact', 0.5, 14],
    [13, 'sfx_whip', 0.7], [14, 'sfx_rev', 0.5], ...Array.from({length: 10}, (_, i) => [16 + i * 3, 'sfx_tick', 0.4] as Sfx),
    [46, 'sfx_whip', 0.6], [48, 'sfx_sub', 0.6, 20], [50, 'sfx_impact', 0.7, 16], [56, 'sfx_impact', 0.7, 16], [56, 'sfx_kaching_real', 0.6], [70, 'sfx_pop', 0.5],
  ],
  foco: [
    [0, 'sfx_scratch', 1], [2, 'sfx_impact', 0.6, 14], [20, 'sfx_trombon', 0.8], [20, 'sfx_impact', 0.5, 14],
    [47, 'sfx_whip', 0.6], [48, 'sfx_scratch', 0.7], ...Array.from({length: 10}, (_, i) => [52 + i * 3, 'sfx_tick', 0.4] as Sfx), [54, 'sfx_pop', 0.5],
  ],
};
// Messenger comprimido: mismos efectos que en SX4Compra, en su nuevo tiempo
const MSG_SFX: Sfx[] = [[M1(6), 'sfx_notif', 0.8], [M1(14), 'sfx_click', 0.5], [M1(34), 'sfx_whoosh', 0.4], [M1(44), 'sfx_shutter', 0.6], [M1(62), 'sfx_whoosh', 0.4], [M1(66), 'sfx_click', 0.6], [M1(70), 'sfx_pop', 0.5]];
const SFX: Sfx[] = [
  [CH1 - 2, 'sfx_whoosh', 0.5], ...MSG_SFX,
  [WA - 2, 'sfx_whip', 0.6], [WA + 4, 'sfx_notif', 0.8], [WA + 14, 'sfx_click', 0.5], [WA + 18, 'sfx_pop', 0.5], [WA + 36, 'sfx_whoosh', 0.4], [WA + 44, 'sfx_shutter', 0.5], [WA + 58, 'sfx_whoosh', 0.4], [WA + 64, 'sfx_click', 0.6], [WA + 68, 'sfx_impact', 0.5, 14],
  [CH2 - 2, 'sfx_whip', 0.7], [CH2 + 4, 'sfx_click', 0.5], [CH2 + 38, 'sfx_kaching_real', 0.85], [CH2 + 38, 'sfx_impact', 0.6, 18], [CH2 + 58, 'sfx_pop', 0.5], [CH2 + 50, 'sfx_notif', 0.7],
  [PAY - 2, 'sfx_whoosh', 0.6], [PAY + 4, 'sfx_riser', 0.5, 26], ...Array.from({length: 8}, (_, i) => [PAY + 4 + i * 3, 'sfx_tick', 0.4] as Sfx),
  [PAY + 30, 'sfx_sub', 0.8, 24], [PAY + 30, 'sfx_kaching_real', 0.9], [PAY + 31, 'sfx_coins', 0.5],
  [CH3 - 2, 'sfx_whip', 0.7], [X3(SX4_T.papeles) + 6, 'sfx_notif', 0.8], [X3(SX4_T.grua) + 22, 'sfx_whoosh', 0.5],
  [LOOP - 2, 'sfx_whip', 0.6],
];

// notificaciones (inicio, duración): mientras están en pantalla se ocultan logo y reloj
const NOTIFS = (hook: Hook): [number, number][] => [...(hook === 'mensaje' ? [[0, 20] as [number, number]] : []), [CH2 + 50, 44], [X3(SX4_T.papeles) + 6, 72]];

export const DosAutos2: React.FC<{hook?: Hook}> = ({hook = 'mensaje'}) => {
  const f = useCurrentFrame();
  const notifOn = (x: number) => NOTIFS(hook).some(([a, d]) => x >= a - 2 && x < a + d);
  const flash = [[0, 0.5], [hook === 'foco' ? 20 : 14, 0.6], [48, 0.5], [CH2, 0.35], [PAY + 30, 0.4], [CH3, 0.35]].reduce((m, [at, a]) => (f === at ? Math.max(m, a) : f === at + 1 ? Math.max(m, a * 0.4) : m), 0);
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      {f < HOOK && <Sequence from={0} durationInFrames={HOOK}><HookLocal hook={hook} /></Sequence>}
      {f >= WA && f < CH2 && <WhatsApp f={f} />}
      {f >= CH1 && f < WA && <Freeze frame={SX4_T.msg + ((f - CH1) * (SX4_T.ver - SX4_T.msg)) / CH1_LEN}><SX4Compra intro={false} win={[0, 0]} /></Freeze>}
      {f >= CH2 && f < PAY && <Jeep f={f} />}
      {f >= PAY && f < CH3 && <Payoff f={f} />}
      {f >= CH3 && f < LOOP && <Sequence from={CH3 - SX4_T.ver}><SX4Compra intro={false} win={[SX4_T.ver, SX4_END]} logoOff={(i) => notifOn(i + CH3 - SX4_T.ver)} /></Sequence>}
      {f >= LOOP && <Sequence from={LOOP}><HookLocal hook={hook} /></Sequence>}
      {!notifOn(f) && ((f < CH1 && (hook === 'foco' ? f < 48 : f >= 48)) || (f >= WA && f < CH3)) && <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 320, top: 46, width: 440, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))'}} />}
      {!notifOn(f) && <CamClock f={f} hook={hook} />}
      <Chapter f={f} at={CH1 + 2} day="MARTES" time="14:13" txt="NOS OFRECEN UN SX4" />
      <Chapter f={f} at={CH3 + 2} day="MIÉRCOLES" time="15:03" txt="VAMOS A BUSCAR EL SX4" />
      {/* invitaciones a los otros servicios */}
      <IOSNotif f={f} at={CH2 + 50} dur={44} icon="marca/gruas/icon.png" iconBg="#fff" app="Grúas Saravia" title="¿Necesitas mover un auto?" body="Asistencia en ruta 24/7 · gruasaravia.cl" />
      <IOSNotif f={f} at={X3(SX4_T.papeles) + 6} icon="marca/logo-autopartschile-sinfondo.png" iconBg="#fff" app="AutopartsChile" title="¿Buscas repuestos?" body="Repuestos multimarca · autopartschile.cl" />
      <ServiceCard f={f} at={X3(SX4_T.grua) + 22} dur={72} img="marca/gruas/logo-truck-full.png" line1="¿NECESITAS GRÚA?" line2="GRÚAS SARAVIA · 24/7" />
      <StripeWipe f={f} at={WA} />
      <StripeWipe f={f} at={CH2} />
      <StripeWipe f={f} at={CH3} />
      <StripeWipe f={f} at={X3(SX4_T.cta)} />
      <LightLeaks f={f} at={[48, CH1, PAY]} />
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      {[...HOOK_SFX[hook], ...SFX].map(([at, n, v, d], i) => (
        <Sequence key={i} from={at} durationInFrames={d ?? 90}><Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
