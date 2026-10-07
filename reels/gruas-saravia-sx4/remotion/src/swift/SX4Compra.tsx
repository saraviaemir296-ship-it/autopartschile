import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Chip, Rise, Shot} from './CuatroAutos';
import {Brackets, GRADE, LightLeaks, PremiumBg} from './Fx';
import {LogoSting, STING_LEN} from './LogoSting';

/* "Compramos un SX4 2007 para desarme" — captación de vendedores de autos.
   Arco: cold open con el chascarro (foco de la grúa roto) → rebobinado →
   Messenger → lo vimos → trato → pagado → papeles → patentes devueltas (baja
   en Registro Civil) → arriba de la grúa → remate del chascarro → CTA "te lo
   compramos". Datos personales pixelados en origen (patentes, cédulas,
   papeles, cara del vendedor, fotos de perfil). Sin montos: no se informaron. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const BG = '#0A0A0A';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const sp = (t: number, d = 0, damping = 12, stiffness = 260) => spring({frame: t - d, fps: 30, config: {damping, stiffness, mass: 0.5}});

export const SX4_T = {cold: 0, rew: 28, msg: 40, ver: 150, trato: 200, pago: 260, papeles: 300, patentes: 360, grua: 420, arriba: 540, oops: 600, cta: 700, end: 790};
const T = SX4_T;
export const SX4_TOTAL = T.end + STING_LEN + 10;
const LOOP = T.end + STING_LEN;

const HITS: [number, number][] = [[T.trato + 4, 16], [T.pago + 4, 14], [T.arriba + 6, 12], [T.oops, 26], [T.oops + 40, 18]];
const FLASH: [number, number][] = [[0, 0.6], [T.trato + 4, 0.3], [T.pago + 4, 0.3], [T.oops, 0.8]];

/* paso numerado (progreso de la compra) */
const Step: React.FC<{f: number; at: number; until: number; n: number; txt: string; sub?: string}> = ({f, at, until, n, txt, sub}) => {
  if (f < at || f >= until) return null;
  const p = sp(f, at, 11, 280);
  return (
    <div style={{position: 'absolute', top: 205, left: 60, right: 60, transform: `translateX(${(1 - p) * -700}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{width: 70, height: 70, background: RED, color: '#fff', fontFamily: DISP, fontSize: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.6)'}}>{n}</span>
        <Chip size={58} style={{boxShadow: '0 8px 20px rgba(0,0,0,0.6)'}}>{txt}</Chip>
      </div>
      {sub && f >= at + 8 && <div style={{marginTop: 12, marginLeft: 84}}><Chip red size={40}>{sub}</Chip></div>}
    </div>
  );
};

/* sello grande (TRATO CERRADO / PAGADO / LISTO) */
const Stamp: React.FC<{f: number; at: number; until: number; txt: string; top?: number}> = ({f, at, until, txt, top = 1080}) => {
  if (f < at || f >= until) return null;
  const k = f - at;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `rotate(-7deg) scale(${interpolate(k, [0, 3, 8], [2.4, 0.92, 1], cl)})`, opacity: interpolate(k, [0, 2], [0, 1], cl)}}>
      <span style={{display: 'inline-block', border: `9px solid ${RED2}`, padding: '0 30px 8px', fontFamily: DISP, fontSize: 132, color: '#fff', background: 'rgba(209,11,12,0.88)', letterSpacing: 3, boxShadow: `0 0 40px ${RED}, 0 20px 40px rgba(0,0,0,0.7)`}}>{txt}</span>
    </div>
  );
};

/* Messenger real (anonimizado): la cámara recorre publicación → foto del auto
   → nuestra respuesta pidiendo la patente para revisarlo */
const K = 600 / 1179;
const Messenger: React.FC<{f: number}> = ({f}) => {
  if (f < T.msg || f >= T.ver) return null;
  const t = f - T.msg;
  const enter = interpolate(t, [0, 8], [1, 0], {...cl, easing: OUT});
  // puntos de foco (coordenadas de la captura original)
  const keys: [number, number, number, number][] = [[0, 590, 1278, 1.0], [10, 470, 410, 1.55], [34, 430, 1690, 1.45], [62, 740, 1050, 1.55], [100, 740, 1050, 1.55]];
  const at = (i: number) => keys[i];
  let ki = 0; while (ki < keys.length - 2 && t >= keys[ki + 1][0]) ki++;
  const [t0, x0, y0, z0] = at(ki), [t1, x1, y1, z1] = at(ki + 1);
  const m = interpolate(t, [t0, t0 + 10], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const cx = x0 + (x1 - x0) * m, cy = y0 + (y1 - y0) * m, z = z0 + (z1 - z0) * m;
  const L = 240, TOP = 300;
  const px = L + cx * K, py = TOP + cy * K;
  const hl = (a: number, x0: number, y0: number, x1: number, y1: number) => {
    const w = interpolate(t, [a, a + 7], [0, 1], {...cl, easing: OUT});
    return t >= a && <div style={{position: 'absolute', left: x0 * K - 4, top: y0 * K, width: (x1 - x0) * K * w + 8, height: (y1 - y0) * K, background: 'rgba(209,11,12,0.22)', borderBottom: `5px solid ${RED2}`}} />;
  };
  return (
    <AbsoluteFill>
      <PremiumBg f={f} />
      <AbsoluteFill style={{transform: `translateY(${enter * 1400}px) translate(${540 - px}px, ${1000 - py}px) scale(${z})`, transformOrigin: `${px}px ${py}px`}}>
        <div style={{position: 'absolute', left: L, top: TOP, width: 600, height: 1300, borderRadius: 50, overflow: 'hidden', border: '12px solid #161616', boxShadow: '0 50px 100px rgba(0,0,0,0.85)', background: '#fff'}}>
          <Img src={S('swift/sx4b_messenger.png')} style={{width: 600, display: 'block'}} />
          {hl(14, 150, 375, 760, 436)}
          {hl(66, 360, 1020, 1010, 1088)}
        </div>
      </AbsoluteFill>
      <Brackets f={f} at={T.msg + 44} until={T.msg + 62} x={330} y={760} w={420} h={600} />
      <div style={{position: 'absolute', top: 1500, left: 0, right: 0, textAlign: 'center'}}>
        {t >= 70 && <Rise f={f} at={T.msg + 70} style={{fontFamily: DISP, fontSize: 64, color: '#fff', textShadow: '0 6px 20px rgba(0,0,0,0.9)'}}>PEDIMOS LA PATENTE PARA <span style={{color: RED2}}>REVISARLO</span> ✓</Rise>}
      </div>
    </AbsoluteFill>
  );
};

/* rebobinado VHS entre el cold open y el inicio de la historia */
const Rewind: React.FC<{f: number}> = ({f}) => {
  if (f < T.rew || f >= T.msg) return null;
  const t = f - T.rew;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'rgba(10,10,10,0.55)'}} />
      {Array.from({length: 9}).map((_, i) => {
        const y = (random(`ry${i}-${f}`) * 1920) | 0;
        return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 6 + random(`rh${i}-${f}`) * 26, background: 'rgba(255,255,255,0.18)', transform: `translateX(${(random(`rx${i}-${f}`) - 0.5) * 120}px)`}} />;
      })}
      <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 120, color: '#fff', textShadow: `-5px 0 ${RED2}, 5px 0 #29f`, transform: `translateX(${Math.sin(t * 3) * 8}px)`}}>◀◀ REW</div>
      <div style={{position: 'absolute', top: 980, left: 0, right: 0, textAlign: 'center'}}><Chip size={60}>PERO PARTAMOS DEL INICIO</Chip></div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  if (f < T.cta || f >= T.end) return null;
  const row = (at: number, icon: string, txt: string) => f >= at && (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${interpolate(f - at, [0, 6], [-760, 0], {...cl, easing: OUT})}px)`}}>
      <span style={{fontSize: 62}}>{icon}</span>
      <span style={{fontFamily: DISP, fontSize: 70, color: BG}}>{txt}</span>
    </div>
  );
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <div style={{position: 'absolute', top: 230, left: 70, right: 70}}>
        <Rise f={f} at={T.cta + 1} style={{fontFamily: DISP, fontSize: 92, lineHeight: 1, color: BG}}>¿TIENES UN AUTO</Rise>
        <Rise f={f} at={T.cta + 4} style={{fontFamily: DISP, fontSize: 92, lineHeight: 1, color: BG}}>PARA DESARME?</Rise>
        <Rise f={f} at={T.cta + 10} style={{fontFamily: DISP, fontSize: 150, lineHeight: 1.05, color: RED}}>TE LO COMPRAMOS</Rise>
      </div>
      <div style={{position: 'absolute', top: 760, left: 70, display: 'flex', flexDirection: 'column', gap: 18}}>
        {row(T.cta + 24, '🤝', 'TRATO DIRECTO CONTIGO')}
        {row(T.cta + 30, '📄', 'PAPELES Y BAJA EN REGLA')}
        {row(T.cta + 36, '🚛', 'LO RETIRAMOS CON GRÚA')}
      </div>
      {f >= T.cta + 48 && (
        <div style={{position: 'absolute', top: 1160, left: 0, right: 0, textAlign: 'center', transform: `scale(${sp(f, T.cta + 48, 12, 260)})`}}>
          <div style={{fontFamily: DISP, fontSize: 56, color: BG, marginBottom: 14}}>ESCRÍBENOS CON FOTOS DEL AUTO 👇</div>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{width: 820}} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const TopLogo: React.FC<{f: number}> = ({f}) => {
  if (f >= T.end || (f >= T.rew && f < T.msg)) return null;
  const white = f >= T.cta;
  return <Img src={S(`marca/anim/${white ? 'logo_color' : 'logo_blanco'}.png`)} style={{position: 'absolute', left: 320, top: 46, width: 440, filter: white ? undefined : 'drop-shadow(0 3px 10px rgba(0,0,0,0.7))'}} />;
};

const Grain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} style={{position: 'absolute', opacity: f >= T.cta ? 0.04 : 0.08, mixBlendMode: 'overlay'}}>
      <filter id="grainX"><feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={f % 7} /></filter>
      <rect width={1080} height={1920} filter="url(#grainX)" />
    </svg>
    {f < T.cta && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />}
  </AbsoluteFill>
);

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_whip', 0.7], [0, 'sfx_sub', 0.6, 20], [16, 'sfx_slap', 0.7], [T.rew, 'sfx_scratch', 0.8],
  [T.msg, 'sfx_whoosh', 0.6], [T.msg + 6, 'sfx_notif', 0.8], [T.msg + 14, 'sfx_click', 0.5], [T.msg + 34, 'sfx_whoosh', 0.4], [T.msg + 44, 'sfx_shutter', 0.6], [T.msg + 62, 'sfx_whoosh', 0.4], [T.msg + 66, 'sfx_click', 0.6], [T.msg + 70, 'sfx_pop', 0.5],
  [T.ver - 2, 'sfx_whip', 0.6], [T.ver + 4, 'sfx_click', 0.5],
  [T.trato - 2, 'sfx_whoosh', 0.5], [T.trato + 4, 'sfx_impact', 0.8, 24], [T.trato + 4, 'sfx_sub', 0.6, 20],
  [T.pago + 4, 'sfx_kaching_real', 0.9], [T.pago + 5, 'sfx_coins', 0.5], [T.pago + 4, 'sfx_impact', 0.6, 20],
  [T.papeles - 2, 'sfx_whip', 0.6], [T.papeles + 4, 'sfx_click', 0.5], [T.papeles + 20, 'sfx_shutter', 0.5],
  [T.patentes - 2, 'sfx_whoosh', 0.5], [T.patentes + 4, 'sfx_metal', 0.8], [T.patentes + 12, 'sfx_pop', 0.5],
  [T.grua - 2, 'sfx_whip', 0.6], [T.grua + 4, 'sfx_click', 0.5], [T.grua + 2, 'sfx_rev', 0.35],
  [T.arriba + 6, 'sfx_impact', 0.7, 20], [T.arriba + 7, 'sfx_correct', 0.5],
  [T.oops, 'sfx_scratch', 1], [T.oops + 18, 'sfx_pop', 0.5], [T.oops + 26, 'sfx_trombon', 0.8], [T.oops + 40, 'sfx_slap', 0.8],
  [T.cta - 2, 'sfx_whip', 0.6], [T.cta + 10, 'sfx_impact', 0.5, 18], [T.cta + 24, 'sfx_click', 0.5], [T.cta + 30, 'sfx_click', 0.5], [T.cta + 36, 'sfx_click', 0.5], [T.cta + 48, 'sfx_notif', 0.7],
  [LOOP - 2, 'sfx_whip', 0.6],
];

export const SX4Compra: React.FC<{intro?: boolean}> = ({intro = true}) => {
  const f = useCurrentFrame();
  let sx = 0, sy = 0;
  for (const [at, a] of HITS) { const k = f - at; if (k >= 0 && k < 10) { const d = a * (1 - k / 10); sx += Math.sin(k * 2.9) * d; sy += Math.cos(k * 3.7) * d; } }
  const flash = FLASH.reduce((m, [at, a]) => (f === at ? Math.max(m, a) : f === at + 1 ? Math.max(m, a * 0.4) : m), 0);
  const big = (at: number, txt: React.ReactNode, top: number, size = 110, color = '#fff') => f >= at && (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', fontFamily: DISP, fontSize: size, lineHeight: 1.02, color, textShadow: '0 8px 30px rgba(0,0,0,0.9)', transform: `scale(${interpolate(f - at, [0, 3, 8], [1.6, 0.96, 1], cl)})`}}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* cold open: el chascarro */}
        <Shot src="swift/sx4b_foco.mp4" from={0} dur={T.msg} start={0.8} z={[1.35, 1.12]} dim={0.15} />
        {f < T.rew && big(4, 'ASÍ TERMINÓ LA COMPRA', 700, 100)}
        {f < T.rew && big(10, 'DE ESTE AUTO… 🤦‍♂️', 820, 100, RED2)}
        <Rewind f={f} />
        <Messenger f={f} />
        <Shot src="swift/sx4b_patentes.mp4" from={T.ver} dur={T.trato - T.ver} start={1.7} z={[1.25, 1.1]} inT="whipL" dim={0.15} />
        <Sequence from={T.trato} durationInFrames={T.pago - T.trato}>
          <AbsoluteFill style={{transform: `scale(${interpolate(f - T.trato, [0, 60], [1.25, 1.1], cl)})`}}>
            <OffthreadVideo src={S('swift/sx4b_mano.mp4')} muted startFrom={0} playbackRate={0.6} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
        <Shot src="swift/sx4b_mano.mp4" from={T.pago} dur={T.papeles - T.pago} start={3.4} z={[1.1, 1.22]} dim={0.2} />
        <Shot src="swift/sx4b_papeles.mp4" from={T.papeles} dur={T.patentes - T.papeles} start={0} z={[1.2, 1.08]} inT="whipL" dim={0.1} />
        <Sequence from={T.patentes} durationInFrames={T.grua - T.patentes}>
          <AbsoluteFill style={{transform: `scale(${interpolate(f - T.patentes, [0, 60], [1.15, 1.32], cl)})`}}>
            <OffthreadVideo src={S('swift/sx4b_patentes.mp4')} muted startFrom={0} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
        {/* la carga con su sonido real (huinche/rampa) bajo los efectos */}
        <Sequence from={T.grua} durationInFrames={T.arriba - T.grua}>
          <AbsoluteFill style={{transform: `scale(${interpolate(f - T.grua, [0, 120], [1.08, 1.2], cl)})`}}>
            <OffthreadVideo src={S('swift/sx4b_carga.mp4')} startFrom={15} playbackRate={1.8} volume={0.35} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
        <Shot src="swift/sx4b_arriba.mp4" from={T.arriba} dur={T.oops - T.arriba} start={0.3} z={[1.05, 1.18]} inT="zoom" />
        {/* remate del chascarro */}
        <Sequence from={T.oops} durationInFrames={T.cta - T.oops}>
          <AbsoluteFill style={{transform: `scale(${interpolate(f - T.oops, [0, 6, 40, 100], [1.6, 1.25, 1.25, 1.45], cl)})`, transformOrigin: '50% 58%'}}>
            <OffthreadVideo src={S('swift/sx4b_foco.mp4')} muted startFrom={0} style={{width: '100%', height: '100%', objectFit: 'cover', filter: f - T.oops < 16 ? 'grayscale(1) contrast(1.2)' : GRADE}} />
          </AbsoluteFill>
        </Sequence>
        {intro && <Shot src="swift/sx4b_foco.mp4" from={LOOP} dur={10} start={0.47} z={[1.6, 1.36]} inT="whipL" dim={0.15} />}

        {/* textos */}
        <Step f={f} at={T.msg + 4} until={T.ver} n={1} txt="NOS OFRECIÓ SU SX4 POR MESSENGER" />
        <Step f={f} at={T.ver + 4} until={T.trato} n={2} txt="FUIMOS A VERLO" />
        <Step f={f} at={T.trato + 2} until={T.papeles} n={3} txt="TRATO CERRADO" />
        <Stamp f={f} at={T.trato + 4} until={T.pago} txt="🤝 TRATO HECHO" />
        <Stamp f={f} at={T.pago + 4} until={T.papeles} txt="PAGADO ✅" />
        <Step f={f} at={T.papeles + 4} until={T.patentes} n={4} txt="PAPELES FIRMADOS ✍️" />
        <Step f={f} at={T.patentes + 4} until={T.grua} n={5} txt="PATENTES DEVUELTAS" sub="PARA LA BAJA EN EL REGISTRO CIVIL" />
        <Step f={f} at={T.grua + 4} until={T.arriba} n={6} txt="ARRIBA DE LA GRÚA 🚛" />
        <Stamp f={f} at={T.arriba + 6} until={T.oops} txt="LISTO PA'L DESARME" top={1180} />
        {f >= T.oops && f < T.cta && (
          <>
            {big(T.oops + 6, '…Y DE PASO', 300, 96)}
            {big(T.oops + 16, 'ME PITIÉ UN FOCO', 420, 120, RED2)}
            {big(T.oops + 24, 'DE MI PROPIA GRÚA', 550, 96)}
            {f >= T.oops + 40 && <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', fontSize: 190, transform: `scale(${sp(f, T.oops + 40, 8, 300)}) rotate(${Math.sin((f - T.oops) * 0.4) * 6}deg)`}}>🤦‍♂️😂</div>}
            <Brackets f={f} at={T.oops + 4} until={T.oops + 40} x={160} y={980} w={760} h={340} />
          </>
        )}
        <Cta f={f} />
        <Sequence from={T.end} durationInFrames={STING_LEN}><LogoSting /></Sequence>
        <TopLogo f={f} />
        <LightLeaks f={f} at={[T.msg, T.trato, T.papeles, T.grua, T.arriba, T.cta - 30]} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
      <Grain f={f} />
      {SFX.filter(([at]) => intro || (at >= T.msg - 2 && at < LOOP - 2)).map(([at, n, v, d], i) => (
        <Sequence key={i} from={at} durationInFrames={d ?? 90}><Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
