import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
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
      <Section f={f} />
      <Subs f={f} />
      {VO.map(([st, du, k]) => (
        <Sequence key={k} from={st} durationInFrames={du + 3}><Audio src={S(`audio/vo/dia3_${String(k).padStart(2, '0')}.wav`)} volume={1.1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
