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
  'Después hicieron un pedido por el sitio web: piolas de cambio, varilla de aceite y lips delanteros del SX4.',
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

/* lluvia de billetes y monedas (vectorial) que salta desde el precio */
const Bill: React.FC<{i: number; t: number; y0: number}> = ({i, t, y0}) => {
  const coin = i % 4 === 3;
  const a = -Math.PI / 2 + (random(`ba${y0}${i}`) - 0.5) * Math.PI * 1.25;
  const v = 26 + random(`bv${y0}${i}`) * 22;
  const x = 540 + Math.cos(a) * v * t;
  const y = y0 + Math.sin(a) * v * t + 1.15 * t * t;
  const rot = (random(`br${y0}${i}`) - 0.5) * 30 * t;
  const flip = Math.cos(t * (0.3 + random(`bf${y0}${i}`) * 0.4));
  const o = interpolate(t, [0, 3, 30, 40], [0, 1, 1, 0], cl);
  if (coin) {
    return <div style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30, background: 'radial-gradient(circle at 35% 35%, #FFE680 0%, #E8B10E 60%, #A87800 100%)', border: '4px solid #C99400', transform: `scaleX(${flip})`, opacity: o, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Anton', sans-serif", fontSize: 34, color: '#8A6100'}}>$</div>;
  }
  return (
    <div style={{position: 'absolute', left: x - 75, top: y - 36, width: 150, height: 72, borderRadius: 8, background: 'linear-gradient(135deg, #3FA34D 0%, #2E7D32 100%)', border: '4px solid #1B5E20', transform: `rotate(${rot}deg) scaleY(${flip})`, opacity: o, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(0,0,0,0.35)'}}>
      <div style={{width: 46, height: 46, borderRadius: 23, border: '3px solid #C8E6C9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Anton', sans-serif", fontSize: 32, color: '#E8F5E9'}}>$</div>
    </div>
  );
};
const MoneyRain: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {[...MONEY_OUT, [COMPRADO_OUT, 1080] as [number, number]].map(([at, y0]) => {
      const t = f - at;
      if (t < 0 || t > 40) return null;
      return Array.from({length: 16}).map((_, i) => <Bill key={`${at}-${i}`} i={i} t={t} y0={y0} />);
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
