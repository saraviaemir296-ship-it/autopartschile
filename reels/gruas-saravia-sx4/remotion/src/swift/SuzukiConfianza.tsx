import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {VO_SUZ, voOn} from './voLines';
import {Brackets, GRADE, LightLeaks, PremiumBg} from './Fx';
import {Bug, LogoSting, STING_LEN} from './LogoSting';
import {Chip, Rise, Shot} from './CuatroAutos';

/* Reel de CAPTACIÓN para dueños de Suzuki y mecánicos.
   Una sola idea: confianza → WhatsApp con MODELO + AÑO + FOTO.
   Arco: ¿tienes un Suzuki? → dudas reales del cliente → escríbenos (demo de
   cómo pedir) → conversaciones REALES donde verificamos año/versión →
   repuestos Suzuki reales (solo modelos con stock en la base al 2026-10-06:
   Swift, Dzire, Alto, Celerio, Baleno, Vitara, SX4; sin S-Cross ni Grand
   Vitara) → "tu Suzuki, el repuesto correcto" → CTA.
   Sin precios ni montos: los recortes de afiches excluyen el precio impreso.
   La demo de WhatsApp es un ejemplo rotulado "ASÍ DE FÁCIL", no un cliente. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const BG = '#0A0A0A';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sp = (t: number, d = 0, damping = 12, stiffness = 260) => spring({frame: t - d, fps: 30, config: {damping, stiffness, mass: 0.5}});

const T = {hook: 0, prob: 60, sol: 180, demo: 216, ayuda: 312, prueba: 360, airChat: 455, exp: 540, conf: 690, cta: 780, end: 852, total: 852 + STING_LEN};
export const SUZUKI_CONF_TOTAL = T.total;

const HITS: [number, number][] = [[6, 14], [30, 12], [160, 10], [552, 16], [732, 12], [800, 10]];
const FLASH: [number, number][] = [[0, 0.5], [6, 0.35], [552, 0.3]];

const Big: React.FC<{f: number; at: number; children: React.ReactNode; top: number; size?: number; color?: string}> = ({f, at, children, top, size = 150, color = '#fff'}) =>
  f < at ? null : (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', fontFamily: DISP, fontSize: size, lineHeight: 1, color, textShadow: '0 8px 34px rgba(0,0,0,0.9)', transform: `scale(${interpolate(f - at, [0, 3, 8], [1.6, 0.96, 1], cl)})`}}>{children}</div>
  );

/* ───────── 0–2 s: gancho ───────── */
const HOOK_CUTS: [string, number, number][] = [
  ['swift/airbag_kit.mp4', 3.0, 8], ['swift/vitara_local_anon.mp4', 0.2, 8], ['swift/vitara_portalon.mp4', 0.3, 7],
  ['swift/mv_motor.mp4', 0.2, 7], ['swift/airbag_kit.mp4', 4.9, 8], ['swift/entrega_anon.mp4', 0.4, 8], ['swift/vitara_portalon.mp4', 1.0, 14],
];
const HookFootage: React.FC = () => {
  let at = 0;
  return <>{HOOK_CUTS.map(([src, st, d], i) => { const from = at; at += d; return <Shot key={i} src={src} from={from} dur={d} start={st} z={[1.28, 1.12]} dim={0.5} />; })}</>;
};
/* notificación real (mensaje de un cliente del kit de airbag) */
const Notif: React.FC<{f: number; at: number; until: number; who: string; msg: string}> = ({f, at, until, who, msg}) => {
  if (f < at || f >= until) return null;
  const p = sp(f, at, 13, 240);
  const out = interpolate(f, [until - 6, until], [0, 1], cl);
  return (
    <div style={{position: 'absolute', top: 210, left: 50, right: 50, transform: `translateY(${(1 - p) * -260 - out * 260}px)`, background: 'rgba(245,245,245,0.96)', borderRadius: 30, padding: '22px 26px', display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
      <div style={{width: 72, height: 72, borderRadius: 18, background: '#25D366', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width={44} height={44} viewBox="0 0 24 24"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" /></svg>
      </div>
      <div style={{minWidth: 0}}>
        <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 30, color: '#111'}}>{who} <span style={{fontWeight: 600, color: '#888', fontSize: 24}}>· ahora</span></div>
        <div style={{fontFamily: TXT, fontWeight: 600, fontSize: 30, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{msg}</div>
      </div>
    </div>
  );
};
const HookText: React.FC<{f: number}> = ({f}) => (
  <>
    <Notif f={f} at={0} until={60} who="WhatsApp" msg="busco kit airbag suzuki swift 2015…" />
    {f < 30 && <>
      <Big f={f} at={6} top={720} size={130}>¿TIENES UN</Big>
      <Big f={f} at={10} top={860} size={230} color={RED2}>SUZUKI?</Big>
    </>}
    {f >= 30 && f < T.prob && <>
      <Big f={f} at={30} top={720} size={130}>¿NECESITAS UN</Big>
      <Big f={f} at={34} top={860} size={210}>REPUESTO?</Big>
    </>}
  </>
);

/* ───────── 2–6 s: el problema (dudas reales del cliente) ───────── */
const PARTS = ['suzuki/crop/espejo_swift.jpg', 'suzuki/crop/alternador_swift.jpg', 'suzuki/crop/ecu_sx4.jpg', 'suzuki/crop/ejes_celerio.jpg', 'suzuki/crop/focos_celerio.jpg'];
const DOUBTS: [number, string, number, number, number][] = [
  [66, '¿QUÉ PIEZA ES?', 70, 300, -3], [90, '¿SERÁ COMPATIBLE?', 230, 1150, 2], [114, '¿SIRVE PARA MI AÑO?', 70, 1290, -2], [138, '¿DÓNDE LA ENCUENTRO?', 170, 1430, 3],
];
const Problem: React.FC<{f: number}> = ({f}) => {
  if (f < T.prob || f >= T.sol) return null;
  const t = f - T.prob;
  const idx = Math.min(PARTS.length - 1, Math.floor(t / 24));
  const lt = t - idx * 24;
  const wipe = interpolate(t, [108, 120], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const jit = t > 96 && t < 108 ? Math.sin(t * 5) * 6 : 0;
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <div style={{position: 'absolute', left: 230, top: 470, width: 620, height: 620, transform: `perspective(1200px) rotateY(${interpolate(lt, [0, 24], [14, -8], cl)}deg) scale(${interpolate(lt, [0, 5], [0.88, 1], {...cl, easing: OUT})}) translateX(${jit}px)`, boxShadow: '0 40px 80px rgba(0,0,0,0.7)', border: '6px solid #fff', overflow: 'hidden', background: '#fff'}}>
        <Img src={S(PARTS[idx])} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.35)'}} />
        <div style={{position: 'absolute', right: 20, top: 20, width: 110, height: 110, background: RED, color: '#fff', fontFamily: DISP, fontSize: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${Math.sin(t * 0.3) * 6}deg)`}}>?</div>
      </div>
      {DOUBTS.map(([at, txt, x, y, r], i) => f >= at && (
        <div key={i} style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sp(f, at, 10, 320)}) translateX(${jit * (i % 2 ? -1 : 1)}px)`, transformOrigin: 'left center'}}>
          <Chip size={70} style={{boxShadow: '0 14px 30px rgba(0,0,0,0.6)'}}>{txt}</Chip>
        </div>
      ))}
      {/* barrido rojo de marca que "limpia" las dudas */}
      <div style={{position: 'absolute', top: -400, bottom: -400, width: 1500, left: -2300 + wipe * 3400, opacity: wipe > 0 ? 1 : 0, background: RED, transform: 'rotate(14deg)'}} />
    </AbsoluteFill>
  );
};

/* ───────── 6–12 s: la solución ───────── */
const DEMO_TXT = 'Hola! Tengo un Suzuki Swift 2015. Necesito esta pieza 👇';
const Demo: React.FC<{f: number}> = ({f}) => {
  if (f < T.demo || f >= T.ayuda) return null;
  const t = f - T.demo;
  const n = Math.max(0, Math.min(DEMO_TXT.length, Math.floor((t - 8) * 1.25)));
  const sent = t >= 58;
  const photo = t >= 66;
  const enter = interpolate(t, [0, 7], [1, 0], {...cl, easing: OUT});
  const modelo = n >= 27, ano = n >= 32, foto = photo;
  return (
    <AbsoluteFill style={{transform: `translateY(${enter * 1300}px)`}}>
      <PremiumBg f={f} />
      <div style={{position: 'absolute', top: 200, left: 70}}>
        <Chip red size={54}>ASÍ DE FÁCIL:</Chip>
      </div>
      <div style={{position: 'absolute', left: 100, top: 310, width: 880, height: 900, borderRadius: 44, overflow: 'hidden', border: '10px solid #1b1b1b', background: '#EFE7DE'}}>
        <div style={{height: 110, background: '#F6F6F6', display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', borderBottom: '1px solid #ddd'}}>
          <div style={{width: 66, height: 66, borderRadius: 33, background: '#fff', border: '1px solid #ddd', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={S('marca/logo-saravia-sinfondo.png')} style={{width: 60}} />
          </div>
          <div>
            <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 30, color: '#111'}}>Desarmaduría Saravia</div>
            <div style={{fontFamily: TXT, fontWeight: 600, fontSize: 22, color: '#25a244'}}>en línea</div>
          </div>
        </div>
        {sent && (
          <div style={{position: 'absolute', right: 26, top: 150, maxWidth: 640, background: '#DCF8C6', borderRadius: 22, padding: '18px 24px', fontFamily: TXT, fontWeight: 600, fontSize: 34, color: '#111', transform: `scale(${sp(f, T.demo + 58, 12, 300)})`, transformOrigin: '100% 0%'}}>
            {DEMO_TXT}
          </div>
        )}
        {photo && (
          <div style={{position: 'absolute', right: 26, top: 330, width: 460, background: '#DCF8C6', borderRadius: 22, padding: 10, transform: `scale(${sp(f, T.demo + 66, 12, 300)})`, transformOrigin: '100% 0%'}}>
            <Img src={S('suzuki/crop/alternador_swift.jpg')} style={{width: '100%', borderRadius: 14, display: 'block'}} />
            <div style={{textAlign: 'right', fontFamily: TXT, fontSize: 22, color: '#53bdeb', marginTop: 4}}>✓✓</div>
          </div>
        )}
        {/* barra de escritura */}
        <div style={{position: 'absolute', left: 16, right: 16, bottom: 16, minHeight: 84, background: '#fff', borderRadius: 42, padding: '18px 30px', fontFamily: TXT, fontWeight: 600, fontSize: 32, color: '#111'}}>
          {!sent ? <>{DEMO_TXT.slice(0, n)}<span style={{opacity: Math.floor(t / 8) % 2 ? 0 : 1, color: '#25a244'}}>|</span></> : <span style={{color: '#aaa'}}>Mensaje</span>}
        </div>
      </div>
      {/* lo que hay que mandar se arma mientras se escribe */}
      <div style={{position: 'absolute', top: 1270, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
        {[['MODELO', modelo], ['AÑO', ano], ['FOTO', foto]].map(([l, on], i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{fontFamily: DISP, fontSize: 70, color: on ? RED2 : 'rgba(255,255,255,0.25)'}}>+</span>}
            <span style={{fontFamily: DISP, fontSize: 74, padding: '2px 22px 8px', background: on ? '#fff' : 'transparent', color: on ? BG : 'rgba(255,255,255,0.25)', border: on ? 'none' : '3px solid rgba(255,255,255,0.2)'}}>{l as string}</span>
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
const SolText: React.FC<{f: number}> = ({f}) => (
  <>
    {f >= T.sol && f < T.demo && <>
      <Big f={f} at={T.sol + 2} top={700} size={170}>TRANQUI.</Big>
      <Big f={f} at={T.sol + 16} top={880} size={120} color={RED2}>ESCRÍBENOS.</Big>
    </>}
    {f >= T.ayuda && f < T.prueba && <>
      <div style={{position: 'absolute', top: 1180, left: 70, right: 70}}>
        <Rise f={f} at={T.ayuda + 2} style={{fontFamily: DISP, fontSize: 70, color: '#fff'}}><span style={{color: RED2}}>→</span> REVISAMOS</Rise>
        <Rise f={f} at={T.ayuda + 8} style={{fontFamily: DISP, fontSize: 110, lineHeight: 1, color: '#fff'}}>Y TE AYUDAMOS</Rise>
        <Rise f={f} at={T.ayuda + 12} style={{fontFamily: DISP, fontSize: 110, lineHeight: 1, color: '#fff'}}>A ENCONTRARLO.</Rise>
      </div>
    </>}
  </>
);

/* ───────── 12–18 s: prueba real (conversaciones reales) ───────── */
const K = 880 / 1179;
type Bub = [number, number, number];
type Hl = [number, number, number, number, number];
const Phone: React.FC<{f: number; from: number; to: number; img: string; height: number; bubbles: Bub[]; hls: Hl[]; push: [number, number, number, number]; who: string; typing?: [number, number]}> = ({f, from, to, img, height, bubbles, hls, push, who, typing}) => {
  if (f < from || f >= to) return null;
  const t = f - from;
  const top = 400;
  const enter = interpolate(t, [0, 7], [1, 0], {...cl, easing: OUT});
  const [pa, pb, px, py] = push;
  const z = interpolate(f, [pa, pa + 8, pb, pb + 8], [1, 1.38, 1.38, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const ox = 110 + px * K;
  const oy = top + 10 + 110 + py * K;
  return (
    <AbsoluteFill style={{transform: `translateX(${enter * 1100}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>
      <div style={{position: 'absolute', left: 100, top, width: 880, height, borderRadius: 44, overflow: 'hidden', border: '10px solid #1b1b1b', boxShadow: '0 50px 90px rgba(0,0,0,0.8)', background: '#EFE7DE'}}>
        <div style={{height: 110, background: '#F6F6F6', display: 'flex', alignItems: 'center', gap: 20, padding: '0 30px', borderBottom: '1px solid #ddd'}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: '#c9c9c9'}} />
          <div>
            <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 32, color: '#111'}}>{who}</div>
            <div style={{fontFamily: TXT, fontWeight: 600, fontSize: 22, color: '#25a244'}}>{typing && f >= typing[0] && f < typing[1] ? 'escribiendo…' : 'en línea'}</div>
          </div>
        </div>
        {bubbles.map(([y0, y1, at], i) => {
          if (f < at) return null;
          const p = sp(f, at, 11, 300);
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 110 + y0 * K, width: 880, height: (y1 - y0) * K, overflow: 'hidden', transform: `translateY(${(1 - p) * 50}px) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 1.6)}}>
              <Img src={S(img)} style={{position: 'absolute', left: 0, top: -y0 * K, width: 880}} />
            </div>
          );
        })}
        {hls.map(([x0, y0, x1, y1, at], i) => {
          if (f < at) return null;
          const w = interpolate(f - at, [0, 7], [0, 1], {...cl, easing: OUT});
          return (
            <React.Fragment key={i}>
              <div style={{position: 'absolute', left: x0 * K - 4, top: 110 + y0 * K, width: (x1 - x0) * K * w + 8, height: (y1 - y0) * K, background: 'rgba(209,11,12,0.18)', borderRadius: 6}} />
              <div style={{position: 'absolute', left: x0 * K - 4, top: 110 + y1 * K - 2, width: (x1 - x0) * K * w + 8, height: 6, background: RED2}} />
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
const Verified: React.FC<{f: number; at: number; until: number; children: React.ReactNode}> = ({f, at, until, children}) =>
  f < at || f >= until ? null : (
    <div style={{position: 'absolute', top: 1450, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(f, at, 10, 300)})`}}>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 16, background: '#fff', color: BG, fontFamily: DISP, fontSize: 64, padding: '6px 26px 10px'}}>
        <span style={{background: RED, color: '#fff', width: 64, height: 64, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: TXT, fontWeight: 900, fontSize: 40}}>✓</span>
        {children}
      </span>
    </div>
  );
const Proof: React.FC<{f: number}> = ({f}) => {
  if (f < T.prueba || f >= T.exp) return null;
  return (
    <>
      <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center'}}>
        <Chip red size={58}>CONVERSACIONES REALES</Chip>
      </div>
      {/* Vitara: el cliente pregunta → le pedimos el año → responde */}
      <Phone f={f} from={T.prueba} to={T.airChat} img="swift/chat_vitara.png" height={1000} who="Cliente · Vitara"
        bubbles={[[0, 285, T.prueba + 4], [285, 1065, T.prueba + 26], [1065, 1170, T.prueba + 62]]}
        hls={[[80, 110, 590, 160, T.prueba + 12], [295, 600, 1010, 650, T.prueba + 38], [295, 660, 520, 710, T.prueba + 42]]}
        push={[T.prueba + 34, T.prueba + 58, 650, 660]} typing={[T.prueba + 52, T.prueba + 62]} />
      <Verified f={f} at={T.prueba + 44} until={T.airChat}>PRIMERO VERIFICAMOS EL AÑO</Verified>
      {/* Swift: modelo + año + versión */}
      <Phone f={f} from={T.airChat} to={T.exp} img="swift/chat_airbag.png" height={1100} who="Cliente · Swift"
        bubbles={[[0, 130, T.airChat + 2], [130, 340, T.airChat + 8], [340, 1320, T.airChat + 26]]}
        hls={[[40, 150, 900, 320, T.airChat + 14], [295, 660, 720, 712, T.airChat + 36], [830, 600, 1030, 650, T.airChat + 36]]}
        push={[T.airChat + 32, T.airChat + 62, 600, 660]} />
      <Verified f={f} at={T.airChat + 42} until={T.exp}>MODELO + AÑO + VERSIÓN</Verified>
    </>
  );
};

/* ───────── 18–23 s: experiencia Suzuki (riel de modelos con piezas reales) ───────── */
const RAIL: [string, string, number?][] = [
  ['SWIFT', 'swift/airbag_kit.mp4', 2.9], ['VITARA', 'swift/vitara_portalon.mp4', 0.0], ['SX4', 'suzuki/crop/ecu_sx4.jpg'],
  ['CELERIO', 'suzuki/crop/focos_celerio.jpg'], ['ALTO', 'suzuki/crop/compresor_alto.jpg'], ['SWIFT', 'suzuki/crop/espejo_swift.jpg'],
];
const EACH = 18;
const R0 = T.exp + 18;
const Experience: React.FC<{f: number}> = ({f}) => {
  if (f < T.exp || f >= T.conf) return null;
  const k = Math.floor((f - R0) / EACH);
  const lt = f - R0 - k * EACH;
  const item = f >= R0 && k < RAIL.length ? RAIL[k] : null;
  const end = f >= R0 + RAIL.length * EACH;
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 96, color: '#fff', transform: `scale(${interpolate(f - T.exp, [0, 3, 8], [1.5, 0.96, 1], cl)})`}}>
        REPUESTOS <span style={{color: RED2}}>SUZUKI</span>
      </div>
      {item && (
        <>
          <div style={{position: 'absolute', left: 140, top: 430, width: 800, height: 800, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 40px 90px rgba(0,0,0,0.8)', transform: `perspective(1400px) rotateY(${interpolate(lt, [0, 5, EACH], [-28, -2, 3], {...cl, easing: OUT})}deg) translateX(${interpolate(lt, [0, 5], [260, 0], {...cl, easing: OUT})}px)`, background: '#fff'}}>
            {item[1].endsWith('.mp4') ? (
              <Sequence from={R0 + k * EACH} durationInFrames={EACH}>
                <OffthreadVideo src={S(item[1])} muted startFrom={Math.round((item[2] ?? 0) * 30)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${1.1 + lt * 0.006})`}} />
              </Sequence>
            ) : (
              <Img src={S(item[1])} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: `scale(${1.02 + lt * 0.006})`}} />
            )}
          </div>
          <div style={{position: 'absolute', top: 1270, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 190, lineHeight: 1, color: '#fff', letterSpacing: interpolate(lt, [0, 8], [40, 4], {...cl, easing: OUT}), textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>{item[0]}</div>
        </>
      )}
      {end && (
        <div style={{position: 'absolute', top: 560, left: 70, right: 70}}>
          <Rise f={f} at={R0 + RAIL.length * EACH} style={{fontFamily: DISP, fontSize: 64, color: 'rgba(255,255,255,0.7)', letterSpacing: 3}}>TAMBIÉN BALENO · DZIRE</Rise>
          <Rise f={f} at={R0 + RAIL.length * EACH + 5} style={{fontFamily: DISP, fontSize: 124, lineHeight: 1.02, color: '#fff', marginTop: 30}}>TE AYUDAMOS</Rise>
          <Rise f={f} at={R0 + RAIL.length * EACH + 8} style={{fontFamily: DISP, fontSize: 124, lineHeight: 1.02, color: '#fff'}}>A ENCONTRAR</Rise>
          <Rise f={f} at={R0 + RAIL.length * EACH + 11} style={{fontFamily: DISP, fontSize: 124, lineHeight: 1.02, color: RED2}}>EL CORRECTO.</Rise>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ───────── 23–26 s: momento de confianza (entrega real, cámara lenta) ───────── */
const ConfText: React.FC<{f: number}> = ({f}) => {
  if (f < T.conf || f >= T.cta) return null;
  return (
    <div style={{position: 'absolute', top: 1060, left: 70, right: 70}}>
      <Rise f={f} at={T.conf + 12} dur={10} style={{fontFamily: DISP, fontSize: 130, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>TU SUZUKI.</Rise>
      <Rise f={f} at={T.conf + 38} dur={10} style={{fontFamily: DISP, fontSize: 100, lineHeight: 1, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>EL REPUESTO</Rise>
      <Rise f={f} at={T.conf + 42} dur={10} style={{fontFamily: DISP, fontSize: 150, lineHeight: 1, color: RED2, textShadow: '0 8px 30px rgba(0,0,0,0.9)'}}>CORRECTO.</Rise>
    </div>
  );
};

/* ───────── 26–30 s: CTA ───────── */
const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < T.cta) return null;
  if (f < T.end) {
    const row = (at: number, icon: string, txt: string) => f >= at && (
      <div style={{display: 'flex', alignItems: 'center', gap: 20, transform: `translateX(${interpolate(f - at, [0, 5], [-700, 0], {...cl, easing: OUT})}px)`}}>
        <span style={{fontSize: 64}}>{icon}</span>
        <span style={{fontFamily: DISP, fontSize: 84, color: BG}}>{txt}</span>
      </div>
    );
    return (
      <AbsoluteFill style={{background: '#fff'}}>
        <div style={{position: 'absolute', top: 220, left: 70, right: 70}}>
          <Rise f={f} at={T.cta + 1} style={{fontFamily: DISP, fontSize: 96, lineHeight: 1, color: BG}}>¿NECESITAS UN</Rise>
          <Rise f={f} at={T.cta + 4} style={{fontFamily: DISP, fontSize: 132, lineHeight: 1, color: RED}}>REPUESTO SUZUKI?</Rise>
        </div>
        {f >= T.cta + 18 && (
          <div style={{position: 'absolute', top: 540, left: 70, transform: `scale(${sp(f, T.cta + 18, 11, 280)})`, transformOrigin: 'left center'}}>
            <span style={{display: 'inline-block', background: '#25D366', color: '#fff', fontFamily: DISP, fontSize: 76, padding: '6px 30px 12px', borderRadius: 16}}>ESCRÍBENOS POR WHATSAPP</span>
          </div>
        )}
        <div style={{position: 'absolute', top: 720, left: 70, display: 'flex', flexDirection: 'column', gap: 10}}>
          {row(T.cta + 30, '📸', 'UNA FOTO')}
          {row(T.cta + 36, '🚗', 'MODELO')}
          {row(T.cta + 42, '📅', 'AÑO')}
        </div>
        {f >= T.cta + 52 && <div style={{position: 'absolute', top: 1110, left: 70, right: 70}}><Rise f={f} at={T.cta + 52} style={{fontFamily: DISP, fontSize: 72, color: BG}}>Y TE AYUDAMOS A <span style={{color: RED}}>ENCONTRARLO.</span></Rise></div>}
        {f >= T.cta + 58 && (
          <div style={{position: 'absolute', top: 1260, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(f, T.cta + 58, 12, 260)})`}}>
            <Img src={S('marca/pastilla-whatsapp.png')} style={{width: 820}} />
          </div>
        )}
      </AbsoluteFill>
    );
  }
  return null;
};

const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} style={{position: 'absolute', opacity: f >= T.cta ? 0.04 : 0.08, mixBlendMode: 'overlay'}}>
      <filter id="grainS"><feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={f % 7} /></filter>
      <rect width={1080} height={1920} filter="url(#grainS)" />
    </svg>
    {f < T.cta && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />}
  </AbsoluteFill>
);

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_notif', 0.9], [6, 'sfx_impact', 0.6, 20], [10, 'sfx_sub', 0.6, 20], [30, 'sfx_impact', 0.55, 20], [34, 'sfx_whoosh', 0.4],
  // dudas
  [66, 'sfx_pop', 0.7], [90, 'sfx_pop', 0.7], [114, 'sfx_pop', 0.7], [138, 'sfx_pop', 0.7], [84, 'sfx_whoosh', 0.3], [108, 'sfx_whoosh', 0.3],
  [164, 'sfx_whip', 0.8],
  // solución
  [182, 'sfx_impact_soft', 0.5, 30], [196, 'sfx_notif', 0.6], [214, 'sfx_whoosh', 0.6],
  ...Array.from({length: 12}, (_, i) => [T.demo + 9 + i * 4, 'sfx_key', 0.35] as Sfx),
  [T.demo + 58, 'sfx_blip', 0.7], [T.demo + 66, 'sfx_shutter', 0.6], [T.demo + 67, 'sfx_blip', 0.6],
  [T.ayuda, 'sfx_whoosh', 0.5],
  // prueba real
  [T.prueba, 'sfx_whip', 0.6], [T.prueba + 4, 'sfx_notif', 0.8], [T.prueba + 26, 'sfx_pop', 0.6], [T.prueba + 44, 'sfx_click', 0.7], [T.prueba + 62, 'sfx_notif', 0.7],
  [T.airChat, 'sfx_whip', 0.6], [T.airChat + 8, 'sfx_notif', 0.8], [T.airChat + 26, 'sfx_pop', 0.6], [T.airChat + 42, 'sfx_click', 0.7],
  // experiencia
  [T.exp, 'sfx_impact', 0.6, 18], [T.exp + 12, 'sfx_whoosh', 0.4],
  ...RAIL.map((_, i) => [R0 + i * EACH, 'sfx_click', 0.55] as Sfx),
  ...RAIL.map((_, i) => [R0 + i * EACH, 'sfx_whoosh', 0.25] as Sfx),
  [R0 + RAIL.length * EACH + 11, 'sfx_sub', 0.5, 24],
  // confianza
  [T.conf, 'sfx_whoosh', 0.4], [T.conf + 42, 'sfx_sub', 0.75, 30], [T.conf + 42, 'sfx_impact_soft', 0.45, 30],
  // CTA
  [T.cta - 2, 'sfx_whip', 0.6], [T.cta + 18, 'sfx_notif', 0.8], [T.cta + 20, 'sfx_impact', 0.5, 18],
  [T.cta + 30, 'sfx_click', 0.5], [T.cta + 36, 'sfx_click', 0.5], [T.cta + 42, 'sfx_click', 0.5], [T.cta + 58, 'sfx_pop', 0.6],
  
];

export const SuzukiConfianza: React.FC<{vo?: string}> = ({vo}) => {
  const voLines = VO_SUZ;
  const f = useCurrentFrame();
  let sx = 0, sy = 0;
  for (const [at, a] of HITS) {
    const k = f - at;
    if (k >= 0 && k < 9) { const d = a * (1 - k / 9); sx += Math.sin(k * 2.9) * d; sy += Math.cos(k * 3.7) * d; }
  }
  const flash = FLASH.reduce((m, [at, a]) => (f === at ? Math.max(m, a) : f === at + 1 ? Math.max(m, a * 0.4) : m), 0);
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <HookFootage />
        <Problem f={f} />
        {/* local real con letrero Saravia */}
        <Shot src="swift/vitara_local_anon.mp4" from={T.sol} dur={T.demo - T.sol} start={0.1} z={[1.2, 1.05]} dim={0.45} />
        <Demo f={f} />
        <Shot src="swift/mv_desarme.mp4" from={T.ayuda} dur={24} start={0.6} z={[1.1, 1.2]} dim={0.4} inT="whipL" />
        <Shot src="swift/entrega_anon.mp4" from={T.ayuda + 24} dur={T.prueba - T.ayuda - 24} start={0.3} z={[1.15, 1.05]} dim={0.4} />
        <Sequence from={T.prueba} durationInFrames={T.exp - T.prueba}>
          <AbsoluteFill style={{filter: 'blur(26px) brightness(0.35)', transform: 'scale(1.15)'}}>
            <OffthreadVideo src={S('swift/airbag_kit.mp4')} muted startFrom={60} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>
        <Proof f={f} />
        <Experience f={f} />
        {/* speed ramp: normal → cámara lenta sobre la entrega */}
        <Shot src="swift/vitara_carga.mp4" from={T.conf} dur={14} start={0.9} rate={1.4} z={[1.15, 1.1]} dim={0.3} inT="zoom" />
        <Shot src="swift/vitara_carga.mp4" from={T.conf + 14} dur={T.cta - T.conf - 14} start={1.55} rate={0.45} z={[1.1, 1.24]} dim={0.35} />
        <HookText f={f} />
        <SolText f={f} />
        <ConfText f={f} />
        <Cta f={f} />
        <Sequence from={T.end} durationInFrames={STING_LEN}><LogoSting /></Sequence>
        <LightLeaks f={f} at={[T.prob, T.sol, T.demo, T.ayuda, T.prueba, T.airChat, T.exp, T.conf]} />
        <Brackets f={f} at={T.prob + 4} until={T.sol - 12} x={230} y={470} w={620} h={620} />
        <Brackets f={f} at={R0} until={R0 + RAIL.length * EACH} x={140} y={430} w={800} h={800} />
        <Bug show={f >= T.prob && f < T.cta} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      <Grain f={f} />
      {SFX.map(([at, n, v, d], i) => (
        <Sequence key={i} from={at} durationInFrames={d ?? 90}><Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voLines && voOn(voLines, at + x) ? 0.45 : 1)} /></Sequence>
      ))}
      {voLines && voLines.map(([st, du, file]) => <Sequence key={file} from={st} durationInFrames={du + 2}><Audio src={S(file)} volume={1} /></Sequence>)}
      {vo && <Audio src={S(vo)} />}
    </AbsoluteFill>
  );
};
