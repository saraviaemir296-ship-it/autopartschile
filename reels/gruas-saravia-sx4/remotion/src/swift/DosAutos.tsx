import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

import {cl} from '../v2/look';
import {Chip} from './CuatroAutos';
import {Brackets, GRADE, LightLeaks} from './Fx';
import {SX4Compra, SX4_T, SX4_TOTAL} from './SX4Compra';

/* "Compré 2 vehículos en 2 horas — tratos hechos": Jeep Grand Cherokee + Suzuki
   SX4 2015. Los tratos se cerraron el mismo martes con ~2 h de diferencia (Messenger
   del SX4 14:13, Jeep en la grúa 16:19); el SX4 se retiró al día siguiente.
   Gancho en pantalla dividida con cronómetro → Jeep → historia completa del SX4
   (reutiliza SX4Compra sin su cold open) → CTA y cierre → loop al gancho. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const DISP = "'Anton', sans-serif";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sp = (t: number, d = 0, damping = 12, stiffness = 260) => spring({frame: t - d, fps: 30, config: {damping, stiffness, mass: 0.5}});

const HOOK = 96;
const JEEP = 96;
const SX4_FROM = HOOK + JEEP;                 // donde empieza la historia del SX4
const SX4_OFFSET = SX4_FROM - SX4_T.msg;      // la historia arranca en su escena de Messenger
const SX4_LOOP = SX4_TOTAL - 10;              // SX4Compra sin su loop propio
export const DOS_TOTAL = SX4_OFFSET + SX4_LOOP + 10;

/* sello "TRATO HECHO" */
const Deal: React.FC<{f: number; at: number; top: number; left?: number}> = ({f, at, top, left = 0}) => {
  if (f < at) return null;
  const k = f - at;
  return (
    <div style={{position: 'absolute', top, left, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${interpolate(k, [0, 3, 8], [2.4, 0.92, 1], cl)})`, opacity: interpolate(k, [0, 2], [0, 1], cl)}}>
      <span style={{display: 'inline-block', border: `7px solid ${RED2}`, padding: '0 22px 6px', fontFamily: DISP, fontSize: 86, color: '#fff', background: 'rgba(209,11,12,0.88)', letterSpacing: 2, boxShadow: `0 0 34px ${RED}, 0 16px 34px rgba(0,0,0,0.7)`}}>TRATO HECHO ✅</span>
    </div>
  );
};

/* cronómetro: la aguja da 2 vueltas (= 2 horas) */
const Clock: React.FC<{f: number; at: number; cx: number; cy: number; r: number}> = ({f, at, cx, cy, r}) => {
  if (f < at) return null;
  const t = f - at;
  const p = sp(f, at, 11, 240);
  const turns = interpolate(t, [0, 36], [0, 2], {...cl, easing: Easing.inOut(Easing.cubic)});
  const arc = Math.min(1, turns / 2);
  const C = 2 * Math.PI * (r - 14);
  return (
    <div style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, transform: `scale(${p})`}}>
      <svg width={r * 2} height={r * 2}>
        <circle cx={r} cy={r} r={r - 4} fill="#0A0A0A" stroke="#fff" strokeWidth={8} />
        <circle cx={r} cy={r} r={r - 14} fill="none" stroke={RED2} strokeWidth={12} strokeDasharray={C} strokeDashoffset={C * (1 - arc)} transform={`rotate(-90 ${r} ${r})`} />
        {Array.from({length: 12}).map((_, i) => <line key={i} x1={r} y1={20} x2={r} y2={32} stroke="#fff" strokeWidth={4} transform={`rotate(${i * 30} ${r} ${r})`} />)}
        <line x1={r} y1={r} x2={r} y2={30} stroke="#fff" strokeWidth={7} strokeLinecap="round" transform={`rotate(${turns * 360} ${r} ${r})`} />
        <circle cx={r} cy={r} r={9} fill={RED2} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: r * 2 + 6, textAlign: 'center', fontFamily: DISP, fontSize: 44, color: '#fff', textShadow: '0 4px 12px #000'}}>{Math.min(2, Math.floor(turns * 60) / 60).toFixed(0)}:{String(Math.floor((turns % 1) * 60)).padStart(2, '0')} H</div>
    </div>
  );
};

/* gancho: pantalla dividida Jeep / SX4 */
const Hook: React.FC<{f: number}> = ({f}) => {
  const split = interpolate(f, [0, 8], [0, 1], {...cl, easing: OUT});
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - split) * -1080}px)`}}>
        <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} playbackRate={0.38} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${1.12 + f * 0.002})`}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - split) * 1080}px)`}}>
        <OffthreadVideo src={S('swift/sx4b_arriba.mp4')} muted startFrom={9} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${1.1 + f * 0.002})`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED, boxShadow: `0 0 24px ${RED}`}} />
      {/* nombres de cada vehículo */}
      {f >= 10 && <div style={{position: 'absolute', top: 200, left: 40, transform: `translateX(${interpolate(f, [10, 17], [-700, 0], {...cl, easing: OUT})}px)`}}><Chip size={60}>🚙 JEEP GRAND CHEROKEE</Chip></div>}
      {f >= 14 && <div style={{position: 'absolute', top: 1660, right: 40, transform: `translateX(${interpolate(f, [14, 21], [700, 0], {...cl, easing: OUT})}px)`}}><Chip size={60}>🚗 SUZUKI SX4 2015</Chip></div>}
      {/* titular sobre la costura */}
      {f >= 4 && (
        <div style={{position: 'absolute', top: 690, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 4, [0, 3, 8], [1.7, 0.95, 1], cl)})`}}>
          <span style={{display: 'inline-block', background: '#0A0A0A', padding: '6px 28px 12px', fontFamily: DISP, fontSize: 92, lineHeight: 1, color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'}}>COMPRÉ <span style={{color: RED2}}>2</span> VEHÍCULOS</span>
        </div>
      )}
      {f >= 12 && (
        <div style={{position: 'absolute', top: 1048, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 12, [0, 3, 8], [1.7, 0.95, 1], cl)})`}}>
          <span style={{display: 'inline-block', background: RED, padding: '6px 28px 12px', fontFamily: DISP, fontSize: 96, lineHeight: 1, color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'}}>EN 2 HORAS ⏱️</span>
        </div>
      )}
      <Clock f={f} at={14} cx={150} cy={440} r={92} />
      <Deal f={f} at={54} top={420} />
      <Deal f={f} at={66} top={1360} />
    </AbsoluteFill>
  );
};

const HookLocal: React.FC = () => <Hook f={useCurrentFrame()} />;

/* vehículo 1: Jeep en formato cine (clip horizontal sobre su versión desenfocada) */
const Jeep: React.FC<{f: number}> = ({f}) => {
  const t = f - HOOK;
  const k = sp(f, HOOK, 13, 200);
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      <Sequence from={HOOK} durationInFrames={JEEP}>
        <AbsoluteFill style={{filter: 'blur(30px) brightness(0.4)', transform: 'scale(1.3)'}}>
          <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} playbackRate={0.37} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: 540, width: 1080, height: 810, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', borderTop: `6px solid ${RED}`, borderBottom: `6px solid ${RED}`, transform: `perspective(1600px) rotateY(${(1 - k) * 25}deg) scale(${0.85 + 0.15 * k})`}}>
          <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={0} playbackRate={0.37} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${interpolate(t, [0, JEEP], [1.02, 1.18], cl)})`, transformOrigin: '40% 55%'}} />
        </div>
      </Sequence>
      <div style={{position: 'absolute', top: 205, left: 60, right: 60, transform: `translateX(${(1 - sp(f, HOOK + 2, 11, 280)) * -700}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{width: 70, height: 70, background: RED, color: '#fff', fontFamily: DISP, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1/2</span>
          <Chip size={58}>VEHÍCULO 1</Chip>
        </div>
      </div>
      <div style={{position: 'absolute', top: 330, left: 60, right: 60}}>
        {t >= 6 && <div style={{fontFamily: DISP, fontSize: 64, color: '#fff', transform: `translateY(${interpolate(t, [6, 12], [40, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(t, [6, 10], [0, 1], cl), letterSpacing: interpolate(t, [6, 18], [20, 2], cl)}}>JEEP</div>}
        {t >= 9 && <div style={{fontFamily: DISP, fontSize: 118, lineHeight: 1, color: '#fff', transform: `translateY(${interpolate(t, [9, 15], [40, 0], {...cl, easing: OUT})}px)`, opacity: interpolate(t, [9, 13], [0, 1], cl)}}>GRAND CHEROKEE</div>}
      </div>
      <Brackets f={f} at={HOOK + 16} until={HOOK + JEEP - 4} x={70} y={640} w={940} h={560} />
      <Deal f={f} at={HOOK + 40} top={1400} />
      {t >= 58 && <div style={{position: 'absolute', top: 1570, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(f, HOOK + 58, 11, 280)})`}}><Chip red size={54}>DIRECTO A LA GRÚA 🚛</Chip></div>}
    </AbsoluteFill>
  );
};

/* contador "2/2" sobre la historia del SX4 */
const Counter: React.FC<{f: number}> = ({f}) => {
  const a = SX4_FROM, b = SX4_OFFSET + SX4_T.cta;
  if (f < a || f >= b) return null;
  return (
    <div style={{position: 'absolute', top: 70, right: 40, transform: `scale(${sp(f, a, 11, 280)})`}}>
      <span style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: DISP, fontSize: 40, padding: '4px 16px 8px', boxShadow: '0 8px 20px rgba(0,0,0,0.6)'}}>VEHÍCULO 2/2</span>
    </div>
  );
};

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_whip', 0.7], [0, 'sfx_sub', 0.6, 20], [4, 'sfx_impact', 0.7, 16], [12, 'sfx_impact', 0.7, 16], [10, 'sfx_whoosh', 0.4], [14, 'sfx_whoosh', 0.4],
  ...Array.from({length: 12}, (_, i) => [16 + i * 3, 'sfx_tick', 0.45] as Sfx), [50, 'sfx_ding', 0.6],
  [54, 'sfx_kaching_real', 0.8], [54, 'sfx_metal', 0.6], [66, 'sfx_kaching_real', 0.8], [66, 'sfx_metal', 0.6], [67, 'sfx_coins', 0.5],
  [HOOK - 2, 'sfx_whip', 0.7], [HOOK + 4, 'sfx_click', 0.5], [HOOK + 8, 'sfx_rev', 0.45], [HOOK + 16, 'sfx_shutter', 0.5],
  [HOOK + 40, 'sfx_kaching_real', 0.85], [HOOK + 40, 'sfx_impact', 0.6, 18], [HOOK + 58, 'sfx_pop', 0.5],
  [SX4_FROM - 2, 'sfx_whip', 0.7], [SX4_FROM, 'sfx_impact_soft', 0.5, 20],
  [DOS_TOTAL - 12, 'sfx_whip', 0.6],
];

export const DosAutos: React.FC = () => {
  const f = useCurrentFrame();
  const flash = [[0, 0.6], [54, 0.35], [66, 0.35], [HOOK, 0.4], [HOOK + 40, 0.3], [SX4_FROM, 0.4]].reduce((m, [at, a]) => (f === at ? Math.max(m, a) : f === at + 1 ? Math.max(m, a * 0.4) : m), 0);
  const loopStart = DOS_TOTAL - 10;
  return (
    <AbsoluteFill style={{background: '#0A0A0A'}}>
      {f < HOOK && <Sequence from={0} durationInFrames={HOOK}><HookLocal /></Sequence>}
      {f >= HOOK && f < SX4_FROM && <Jeep f={f} />}
      {f >= SX4_FROM && f < loopStart && (
        <Sequence from={SX4_OFFSET}>
          <SX4Compra intro={false} />
        </Sequence>
      )}
      {f >= loopStart && <Sequence from={loopStart}><HookLocal /></Sequence>}
      {f < SX4_FROM && <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 320, top: 46, width: 440, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))'}} />}
      <Counter f={f} />
      <LightLeaks f={f} at={[HOOK, SX4_FROM]} />
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      {SFX.map(([at, n, v, d], i) => (
        <Sequence key={i} from={at} durationInFrames={d ?? 90}><Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
