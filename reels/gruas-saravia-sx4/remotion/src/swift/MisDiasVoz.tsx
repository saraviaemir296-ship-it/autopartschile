import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {GRADE} from './Fx';
import {MisDias} from './MisDias';

/* "Otro día en mi empresa" con la voz del dueño (su propio guion, grabación
   natural sin IA anti-ruido). El corte sigue a la voz: cada frase toma su
   tramo de MisDias (re-mapeado con <Freeze>), más una escena nueva del local
   ("llegaron unos cabros…") con el frente de la desarmaduría. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const TXT = "'Montserrat', sans-serif";
const VO_LEN = [122, 200, 252, 315, 138, 131, 133, 132, 221, 78];

type Seg = ['M' | 'L' | 'P', number, number, number, [number, number][]];
const PLAN: Seg[] = [
  ['M', 0, 75, 125, [[0, 2]]],           // "Buenos días mi gente…"
  ['M', 75, 200, 203, [[1, 2]]],         // ramal Verna, cliente de Valdivia
  ['M', 200, 290, 255, [[2, 2]]],        // pedido piolas/varilla/lips SX4
  ['M', 290, 405, 318, [[3, 2]]],        // Mastervan: nos vio en TikTok, compró por la web
  ['L', 0, 140, 140, [[4, 1]]],          // "llegaron unos cabros a mi local…"
  ['M', 405, 472, 133, [[5, 1]]],        // "me subí a su auto…"
  ['P', 0, 46, 46, [[6, 2]]],            // "Lo vi, me gustó…" (foto del Ciaz donde estaba)
  ['M', 472, 620, 92, []],               // "…cerramos trato y a la notaría…"
  ['M', 620, 710, 62, [[7, 1]]],         // grúa
  ['M', 710, 800, 72, []],               // Ciaz blanco + gris
  ['M', 800, 890, 311, [[8, 4], [9, 229]]], // cierre + "Desarmaduría Saravia"
];
const STARTS = PLAN.reduce<number[]>((acc, [, , , L], i) => [...acc, acc[i] + L], [0]);
export const MISDIAS_VOZ_TOTAL = STARTS[PLAN.length];
const VO = PLAN.flatMap(([, , , , vo], i) => vo.map(([k, off]) => [STARTS[i] + off, VO_LEN[k], k] as [number, number, number]));

const pop = (f: number, at: number) => spring({frame: f - at, fps: 30, config: {damping: 12, stiffness: 240, mass: 0.5}});
const Tag: React.FC<{t: number; at: number; top: number; dark?: boolean; red?: boolean; size?: number; children: React.ReactNode}> = ({t, at, top, dark, red, size = 54, children}) => {
  if (t < at) return null;
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', transform: `scale(${pop(t, at)})`}}>
      <span style={{display: 'inline-block', background: red ? RED : dark ? 'rgba(12,12,12,0.86)' : '#fff', color: red || dark ? '#fff' : '#111', fontFamily: TXT, fontWeight: 900, fontSize: size, lineHeight: 1.2, padding: '10px 26px 12px', borderRadius: 18, boxShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>{children}</span>
    </div>
  );
};

/* escena del local: frente de la desarmaduría */
const Local: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${interpolate(t, [0, 6, 140], [1.16, 1.04, 1.12], cl)})`}}>
      <OffthreadVideo src={S('swift/vitara_local_anon.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)'}} />
    <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 370, top: 50, width: 340, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />
  </AbsoluteFill>
);

/* foto del Ciaz gris donde estaba (patente pixelada) */
const Visto: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Img src={S('swift/sem_ciaz_visto.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.5)', transform: 'scale(1.2)'}} />
    <div style={{position: 'absolute', left: 0, top: 560, width: 1080, height: 608, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', transform: `scale(${interpolate(t, [0, 5, 46], [1.12, 1.0, 1.06], cl)})`}}>
      <Img src={S('swift/sem_ciaz_visto.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
    </div>
    <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 370, top: 50, width: 340, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />
  </AbsoluteFill>
);

/* título de sección arriba */
const SECTIONS: [number, string, boolean][] = [[1, 'VENTA 1', true], [2, 'VENTA 2', true], [3, 'VENTA 3', true], [4, 'LA COMPRA', false], [5, 'LA COMPRA', false], [6, 'LA COMPRA', false], [7, 'LA COMPRA', false], [8, 'LA COMPRA', false], [9, 'EL PLAN', false]];
const Section: React.FC<{f: number}> = ({f}) => {
  const i = Math.max(0, STARTS.findIndex((s, k) => f >= s && f < STARTS[k + 1]));
  const sec = SECTIONS.find(([k]) => k === i);
  if (!sec) return null;
  // la animación solo cuando cambia el título
  const first = SECTIONS.find(([, txt]) => txt === sec[1])![0];
  const t = f - STARTS[first];
  const k = spring({frame: t, fps: 30, config: {damping: 12, stiffness: 220, mass: 0.5}});
  return (
    <div style={{position: 'absolute', top: 165, left: 0, right: 0, textAlign: 'center', transform: `scale(${k})`}}>
      <span style={{display: 'inline-block', background: sec[2] ? RED : '#0A0A0A', color: '#fff', fontFamily: "'Anton', sans-serif", fontSize: 76, letterSpacing: 3, padding: '4px 34px 10px', borderRadius: 14, border: '4px solid #fff', boxShadow: '0 12px 30px rgba(0,0,0,0.45)'}}>{sec[1]}</span>
    </div>
  );
};

/* subtítulos grandes de la voz (grupos de 3–4 palabras; la palabra que suena en rojo) */
const LINES = [
  'Buenos días mi gente, otro día más en mi empresa.',
  'Partimos tempranito, vino un cliente de Valdivia, se llevó un ramal completo de Hyundai Verna, 240 lucas al bolsillo.',
  'Después hicieron un pedido por el sitio web: piolas de cambio, varilla de aceite y lips delanteros del SX4, se vendió en 210 mil pesos.',
  'Después vino un cliente presencialmente a retirar, pero no grabamos. Nos vio en TikTok y compró por el sitio web diferencial trasero, paquete de resortes y el capot para su Mastervan.',
  'Ya en la tarde pasaron unos cabros a mi local, me dijeron: hermano, tenemos un Ciaz pa’ vender.',
  'Me subí a su auto, fui a verlo al otro lado del mundo, prácticamente.',
  'Lo vi, me gustó, cerramos trato y a la notaría a hacer la transferencia altiro.',
  'Lo subí a mi grúa, y ahora con el Ciaz blanco que tengo en desarme, voy a armarlo.',
  'Así que ya saben mi gente, si buscan repuestos o tienen un vehículo a la venta en cualquier estado, a buen precio, me escriben nomás.',
  'Desarmaduría Saravia.',
];
type W = {w: string; a: number; chunk: number};
const WORDS: W[] = (() => {
  const out: W[] = [];
  let chunk = 0;
  VO.forEach(([st, du, k]) => {
    const ws = LINES[k].split(' ');
    const wt = ws.map((w) => w.length + 2);
    const tot = wt.reduce((x, y) => x + y, 0);
    let acc = 0, n = 0;
    ws.forEach((w, i) => {
      out.push({w, a: st + 3 + (acc / tot) * (du - 8), chunk}); acc += wt[i]; n++;
      if (n >= 4 || /[,.:]$/.test(w)) { chunk++; n = 0; }
    });
    chunk++;
  });
  return out;
})();
const Subs: React.FC<{f: number}> = ({f}) => {
  const cur = WORDS.filter((w) => f >= w.a).pop();
  if (!cur) return null;
  const next = WORDS.find((w) => w.chunk === cur.chunk + 1);
  if (next && f >= next.a) return null;
  const vo = VO.find(([st, du]) => f >= st && f < st + du + 6);
  if (!vo) return null;
  const ws = WORDS.filter((w) => w.chunk === cur.chunk);
  const k = interpolate(f - ws[0].a, [0, 3, 7], [1.15, 0.97, 1], cl);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1290, textAlign: 'center', transform: `scale(${k})`}}>
      {ws.map((w, i) => (
        <span key={i} style={{display: 'inline-block', margin: '4px 7px', padding: '0 12px 6px', borderRadius: 12, background: w === cur ? RED : 'transparent', fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 74, lineHeight: 1.12, color: '#fff', textTransform: 'uppercase', textShadow: w === cur ? 'none' : '0 4px 14px rgba(0,0,0,0.9), 0 0 4px #000, 3px 3px 0 #000'}}>{w.w.replace(/[,.:]$/, '')}</span>
      ))}
    </div>
  );
};

/* ---- efectos: frame interno de MisDias → frame de este video */
const toOuter = (x: number) => {
  const i = PLAN.findIndex(([src, a, b]) => src === 'M' && x >= a && x < b);
  if (i < 0) return -1;
  const [, a, b, L] = PLAN[i];
  return Math.round(STARTS[i] + ((x - a) / (b - a)) * L);
};
// momentos de plata: [frame interno del precio, posición vertical del billete]
const MONEY: [number, number][] = [[101, 1080], [227, 1080], [356, 1120]];
const MONEY_OUT = MONEY.map(([x, y]) => [toOuter(x), y] as [number, number]);
const COMPRADO_OUT = toOuter(634);

/* billete realista (vectorial): papel verde con guilloché, marco, roseta,
   retrato en óvalo y cifras; el dorso es más claro para que se note el giro */
const BillArt: React.FC<{w: number; back?: boolean}> = ({w, back}) => {
  const h = w * 0.45;
  return (
    <svg width={w} height={h} viewBox="0 0 200 90" style={{display: 'block', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
      <defs>
        <linearGradient id="bp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={back ? '#DCEBD6' : '#D3E6CB'} /><stop offset="0.5" stopColor={back ? '#C4DABB' : '#B5D1A8'} /><stop offset="1" stopColor={back ? '#D7E8CF' : '#C9DFBE'} />
        </linearGradient>
        <radialGradient id="bo" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#E9F3E4" /><stop offset="1" stopColor="#9FC193" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="90" rx="3" fill="url(#bp)" />
      <rect x="4" y="4" width="192" height="82" rx="2" fill="none" stroke="#3E6B48" strokeWidth="2.2" />
      <rect x="8" y="8" width="184" height="74" rx="2" fill="none" stroke="#5E8C66" strokeWidth="0.8" strokeDasharray="2 1.5" />
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M8 ${18 + i * 7} C 50 ${10 + i * 7}, 70 ${28 + i * 7}, 100 ${18 + i * 7} S 160 ${10 + i * 7}, 192 ${18 + i * 7}`} fill="none" stroke="#7FA676" strokeWidth="0.5" opacity="0.7" />
      ))}
      {back ? (
        <>
          <ellipse cx="100" cy="45" rx="40" ry="26" fill="none" stroke="#3E6B48" strokeWidth="2" />
          <text x="100" y="56" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="30" fill="#3E6B48">$</text>
        </>
      ) : (
        <>
          <ellipse cx="100" cy="45" rx="26" ry="31" fill="url(#bo)" stroke="#3E6B48" strokeWidth="2" />
          <ellipse cx="100" cy="36" rx="7.5" ry="9" fill="#5B8A62" />
          <path d="M100 27 Q91 27 92.5 36 Q94 31 100 31 Q106 31 107.5 36 Q109 27 100 27 Z" fill="#3E6B48" />
          <path d="M83 72 Q84 52 100 49 Q116 52 117 72 Z" fill="#5B8A62" />
          <path d="M96 49 L100 58 L104 49" fill="none" stroke="#E9F3E4" strokeWidth="1.4" />
          <circle cx="40" cy="45" r="15" fill="none" stroke="#3E6B48" strokeWidth="1.6" />
          {Array.from({length: 8}).map((_, i) => <ellipse key={i} cx="40" cy="45" rx="15" ry="5" fill="none" stroke="#5E8C66" strokeWidth="0.6" transform={`rotate(${i * 22.5} 40 45)`} />)}
          <text x="160" y="52" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="#2F5637">$</text>
        </>
      )}
      <text x="16" y="22" fontFamily="Georgia, serif" fontWeight="700" fontSize="13" fill="#2F5637">$</text>
      <text x="184" y="80" textAnchor="end" fontFamily="Georgia, serif" fontWeight="700" fontSize="13" fill="#2F5637">$</text>
    </svg>
  );
};

/* lluvia de billetes con giro 3D: unos saltan desde el precio y otros caen
   desde arriba por toda la pantalla; los del fondo más chicos y desenfocados */
const Bill: React.FC<{i: number; t: number; y0: number; burst: boolean}> = ({i, t, y0, burst}) => {
  const r = (k: string) => random(`${k}${y0}${i}${burst ? 'b' : 'r'}`);
  const depth = 0.45 + r('d') * 0.9;                 // 0.45 (lejos) … 1.35 (cerca)
  let x: number, y: number;
  if (burst) {
    const a = -Math.PI / 2 + (r('a') - 0.5) * Math.PI * 1.3;
    const v = (22 + r('v') * 20) * depth;
    x = 540 + Math.cos(a) * v * t + Math.sin(t * 0.25 + r('s') * 6) * 30;
    y = y0 + Math.sin(a) * v * t + 0.9 * t * t;
  } else {
    const delay = r('t') * 14;
    const tt = t - delay;
    if (tt < 0) return null;
    x = r('x') * 1080 + Math.sin(tt * (0.12 + r('w') * 0.1) + r('p') * 6) * 90 * depth;
    y = -160 + tt * (26 + r('f') * 18) * depth;
  }
  const rx = Math.sin(t * (0.22 + r('rx') * 0.25) + r('o1') * 6) * 70;
  const ry = Math.cos(t * (0.18 + r('ry') * 0.2) + r('o2') * 6) * 60;
  const rz = (r('rz') - 0.5) * 80 + t * (r('sp') - 0.5) * 9;
  const back = Math.cos((rx * Math.PI) / 180) * Math.cos((ry * Math.PI) / 180) < 0;
  const o = interpolate(t, [0, 3, 34, 46], [0, 1, 1, 0], cl);
  const w = 230 * depth;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.225, width: w, opacity: o, filter: depth < 0.7 ? `blur(${(0.7 - depth) * 6}px)` : undefined, transform: `perspective(900px) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`, zIndex: Math.round(depth * 10)}}>
      <BillArt w={w} back={back} />
    </div>
  );
};
const MoneyRain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {[...MONEY_OUT, [COMPRADO_OUT, 1080] as [number, number]].map(([at, y0]) => {
      const t = f - at;
      if (t < 0 || t > 48) return null;
      return [
        ...Array.from({length: 12}).map((_, i) => <Bill key={`b${at}-${i}`} i={i} t={t} y0={y0} burst />),
        ...Array.from({length: 22}).map((_, i) => <Bill key={`r${at}-${i}`} i={i} t={t} y0={y0} burst={false} />),
      ];
    })}
  </AbsoluteFill>
);

/* destello dorado detrás del precio */
const Glow: React.FC<{f: number}> = ({f}) => {
  const at = MONEY_OUT.find(([o]) => f >= o && f < o + 18);
  if (!at) return null;
  const t = f - at[0];
  return <div style={{position: 'absolute', left: 540 - 420, top: at[1] - 300, width: 840, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,64,0.55) 0%, rgba(255,214,64,0) 65%)', opacity: interpolate(t, [0, 4, 18], [0, 1, 0], cl), transform: `scale(${interpolate(t, [0, 18], [0.6, 1.3], cl)})`}} />;
};

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_whoosh', 0.6], [2, 'sfx_sub', 0.6, 22],
  // cambio de sección
  ...STARTS.slice(1, PLAN.length).map((s) => [s - 2, 'sfx_whip', 0.5] as Sfx),
  // plata: ka-ching + monedas
  ...MONEY_OUT.flatMap(([o]) => [[o - 14, 'sfx_billcount', 0.5, 14], [o, 'sfx_kaching_real', 0.95], [o + 1, 'sfx_coins', 0.7], [o + 2, 'sfx_sparkle', 0.4]] as Sfx[]),
  // sellos VENDIDO / COMPRADO
  ...[165, 275, 385].map((x) => [toOuter(x), 'sfx_impact', 0.7, 18] as Sfx),
  [COMPRADO_OUT, 'sfx_impact', 0.8, 20], [COMPRADO_OUT, 'sfx_kaching_real', 0.8], [COMPRADO_OUT + 1, 'sfx_coins', 0.6],
  // "nos vio en TikTok": notificación
  [toOuter(294), 'sfx_notif', 0.8],
  // checks de la lista
  ...[316, 328, 340].map((x) => [toOuter(x), 'sfx_pop', 0.5] as Sfx),
  // foto del Ciaz: foto
  [STARTS[6], 'sfx_shutter', 0.7],
  // cierre
  [STARTS[PLAN.length - 1], 'sfx_sub', 0.6, 22],
];
const voOn = (fr: number) => VO.some(([a, d]) => fr >= a && fr < a + d);

export const MisDiasVoz: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, STARTS.findIndex((s, k) => f >= s && f < STARTS[k + 1]));
  const [src, a, b, L] = PLAN[i];
  const t = f - STARTS[i];
  const inner = Math.min(b - 0.001, a + (t / L) * (b - a));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {src === 'M' && <Freeze frame={inner}><MisDias voz /></Freeze>}
      {src === 'L' && <Sequence from={STARTS[i]} durationInFrames={L}><Local t={t} /></Sequence>}
      {src === 'P' && <Visto t={t} />}
      <Glow f={f} />
      <MoneyRain f={f} />
      <Section f={f} />
      <Subs f={f} />
      {SFX.filter(([at]) => at >= 0).map(([at, n, v, d], k) => (
        <Sequence key={`s${k}`} from={at} durationInFrames={d ?? 90}>
          <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(at + x) ? 0.55 : 1)} />
        </Sequence>
      ))}
      {VO.map(([st, du, k]) => (
        <Sequence key={k} from={st} durationInFrames={du + 3}><Audio src={S(`audio/vo/dia3_${String(k).padStart(2, '0')}.wav`)} volume={1.1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
