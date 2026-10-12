import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Grúas Saravia — "Trabajando en feriado" (12 de octubre) + aviso del
   recargo de 20% en días feriados. Video real de la grúa en la autopista
   (patente del auto pixelada) y animaciones del logo: gancho que cae
   balanceándose, camión que entra frenando y el logo armándose. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const TXT = "'Montserrat', sans-serif";
const VIDEO = 312;                 // 10,4 s de video
const END = VIDEO - 12;            // el cierre entra sobre el final del video
export const FERIADO_TOTAL = END + 150;

const sp = (f: number, at: number, cfg = {damping: 12, stiffness: 200, mass: 0.6}) => spring({frame: f - at, fps: 30, config: cfg});

/* gancho del logo: cae desde arriba balanceándose como el gancho de una
   grúa y después se achica a la esquina como marca de agua */
const HookIcon: React.FC<{f: number}> = ({f}) => {
  if (f > END) return null;
  const drop = sp(f, 0, {damping: 10, stiffness: 90, mass: 0.8});
  const swing = Math.sin(f * 0.32) * 26 * Math.exp(-f / 14);
  const toCorner = interpolate(f, [30, 44], [0, 1], cl);
  const ease = 1 - Math.pow(1 - toCorner, 3);
  const size = interpolate(ease, [0, 1], [560, 150]);
  const cx = interpolate(ease, [0, 1], [540, 110]);
  const cy = interpolate(drop, [0, 1], [-400, 760]) * (1 - ease) + 110 * ease;
  return (
    <>
      {/* cable */}
      {ease < 1 && <div style={{position: 'absolute', left: 538, top: 0, width: 4, height: Math.max(0, cy - size * 0.4), background: 'linear-gradient(#999, #555)', opacity: 1 - ease}} />}
      <Img src={S('marca/gruas/icon-a.png')} style={{position: 'absolute', left: cx - size / 2, top: cy - size * 0.45, width: size, transformOrigin: '50% 0%', transform: `rotate(${swing * (1 - ease)}deg)`, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.6))'}} />
    </>
  );
};

/* sello FERIADO + barra "y seguimos trabajando" */
const Hook: React.FC<{f: number}> = ({f}) => {
  if (f < 26 || f > 150) return null;
  const k = sp(f, 26);
  const k2 = sp(f, 36);
  const out = interpolate(f, [140, 150], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', opacity: out}}>
      <div style={{display: 'inline-block', transform: `scale(${interpolate(k, [0, 1], [2.6, 1])}) rotate(-6deg)`, opacity: Math.min(1, k * 2), padding: '6px 40px 14px', border: '10px solid #fff', borderRadius: 18, background: RED, boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}>
        <span style={{fontFamily: "'Anton', sans-serif", fontSize: 190, lineHeight: 1, color: '#fff', letterSpacing: 6}}>FERIADO</span>
      </div>
      <div style={{marginTop: 40, transform: `translateY(${(1 - k2) * 60}px)`, opacity: k2}}>
        <span style={{display: 'inline-block', background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 64, padding: '12px 34px 16px', borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.4)'}}>Y SEGUIMOS TRABAJANDO</span>
      </div>
    </div>
  );
};

/* aviso del recargo: tarjeta con contador 0 → 20% */
const Recargo: React.FC<{f: number}> = ({f}) => {
  const at = 158;
  if (f < at || f > END + 4) return null;
  const t = f - at;
  const k = sp(f, at, {damping: 14, stiffness: 160, mass: 0.7});
  const n = Math.round(interpolate(t, [10, 34], [0, 20], cl));
  const hit = sp(f, at + 34, {damping: 8, stiffness: 300, mass: 0.5});
  const out = interpolate(f, [END - 6, END + 4], [1, 0], cl);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1080, opacity: out, transform: `translateY(${(1 - k) * 500}px)`}}>
      <div style={{background: 'rgba(10,10,10,0.88)', border: `4px solid ${RED}`, borderRadius: 34, padding: '34px 40px 40px', textAlign: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
        <div style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 44, letterSpacing: 4, padding: '6px 26px 10px', borderRadius: 12}}>RECUERDA</div>
        <div style={{fontFamily: TXT, fontWeight: 700, fontSize: 50, color: '#fff', marginTop: 22, lineHeight: 1.2}}>En días feriados el servicio<br />tiene un recargo de</div>
        <div style={{fontFamily: "'Anton', sans-serif", fontSize: 260, lineHeight: 1, color: '#fff', marginTop: 10, transform: `scale(${t >= 34 ? interpolate(hit, [0, 1], [1.35, 1]) : 1})`, textShadow: `0 0 ${t >= 34 ? 40 : 0}px rgba(209,11,12,0.9), 6px 6px 0 ${RED}`}}>+{n}%</div>
      </div>
    </div>
  );
};

/* cierre: el camión entra frenando y el logo se arma por partes */
const EndCard: React.FC<{f: number}> = ({f}) => {
  const t = f - END;
  if (t < 0) return null;
  const bg = interpolate(t, [0, 10], [0, 1], cl);
  const truck = sp(t, 4, {damping: 13, stiffness: 70, mass: 1});
  const brake = Math.sin(Math.max(0, t - 18) * 0.5) * 3 * Math.exp(-Math.max(0, t - 18) / 6) * (t > 18 ? 1 : 0);
  const blur = interpolate(truck, [0, 0.85, 1], [14, 2, 0], cl);
  const gru = interpolate(t, [24, 36], [0, 1], cl);
  const sar = sp(t, 30, {damping: 9, stiffness: 220, mass: 0.6});
  const tag = interpolate(t, [42, 58], [0, 1], cl);
  const pill = sp(t, 58);
  const rem = interpolate(t, [70, 80], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: `rgba(6,6,6,${bg})`}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, rgba(209,11,12,${0.22 * bg}) 0%, rgba(0,0,0,0) 55%)`}} />
      {/* líneas de velocidad mientras entra el camión */}
      {truck < 0.97 && Array.from({length: 7}).map((_, i) => (
        <div key={i} style={{position: 'absolute', top: 690 + i * 34, left: interpolate(truck, [0, 1], [-200, 900]) - 600 - (i % 3) * 120, width: 420 - (i % 2) * 140, height: 4, borderRadius: 2, background: i % 2 ? '#fff' : RED, opacity: 0.7 * (1 - truck)}} />
      ))}
      <Img src={S('marca/gruas/lg_truck.png')} style={{position: 'absolute', top: 640, left: interpolate(truck, [0, 1], [-1100, 45]), width: 990, transform: `rotate(${brake}deg)`, transformOrigin: '80% 100%', filter: `blur(${blur}px) drop-shadow(0 20px 30px rgba(0,0,0,0.6))`}} />
      <Img src={S('marca/gruas/lg_gruas.png')} style={{position: 'absolute', top: 902, left: 72, width: 936, opacity: gru, clipPath: `inset(0 ${(1 - gru) * 50}% 0 ${(1 - gru) * 50}%)`}} />
      <Img src={S('marca/gruas/lg_saravia.png')} style={{position: 'absolute', top: 980, left: 40, width: 1000, opacity: Math.min(1, sar * 1.5), transform: `scale(${interpolate(sar, [0, 1], [1.6, 1])})`}} />
      <Img src={S('marca/gruas/lg_tag.png')} style={{position: 'absolute', top: 1140, left: 45, width: 990, clipPath: `inset(0 ${(1 - tag) * 100}% 0 0)`}} />
      <div style={{position: 'absolute', top: 1290, left: 0, right: 0, textAlign: 'center', transform: `scale(${pill})`}}>
        <span style={{display: 'inline-block', background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 60, padding: '14px 46px 18px', borderRadius: 60}}>gruasaravia.cl</span>
      </div>
      <div style={{position: 'absolute', top: 1500, left: 80, right: 80, textAlign: 'center', opacity: rem, transform: `translateY(${(1 - rem) * 30}px)`, fontFamily: TXT, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: 'rgba(255,255,255,0.88)'}}>
        Trabajamos también en feriados<br /><span style={{color: '#fff', background: RED, padding: '2px 16px 6px', borderRadius: 10, fontWeight: 900}}>recargo de 20%</span>
      </div>
    </AbsoluteFill>
  );
};

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_whoosh', 0.6], [14, 'sfx_metal', 0.5, 24],
  [26, 'sfx_impact', 0.9], [26, 'sfx_sub', 0.6, 30], [36, 'sfx_pop', 0.5],
  [158, 'sfx_whoosh', 0.6], ...Array.from({length: 6}).map((_, i) => [168 + i * 4, 'sfx_tick', 0.45] as Sfx), [192, 'sfx_impact', 0.85], [192, 'sfx_kaching_real', 0.5],
  [END, 'sfx_whoosh', 0.6], [END + 4, 'sfx_rev', 0.6, 30], [END + 30, 'sfx_impact', 0.8], [END + 30, 'sfx_sub', 0.6, 30], [END + 58, 'sfx_pop', 0.5], [END + 70, 'sfx_ding', 0.35],
];

export const Feriado: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={VIDEO}>
        <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, VIDEO], [1.04, 1.12])})`}}>
          <OffthreadVideo src={S('swift/feriado_anon.mp4')} volume={0.35} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.06) saturate(1.1)'}} />
        </AbsoluteFill>
      </Sequence>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)'}} />
      <HookIcon f={f} />
      <Hook f={f} />
      <Recargo f={f} />
      <EndCard f={f} />
      {SFX.map(([at, n, v, d], k) => (
        <Sequence key={k} from={at} durationInFrames={d ?? 60}>
          <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 5, d], [1, 0], cl) : v)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
