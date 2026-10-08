import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Chip} from './CuatroAutos';
import {DOS2_MARKS, DosAutos2, dosSfx} from './DosAutos2';
import {SX4_T} from './SX4Compra';

/* "2 autos en 2 horas" (gancho A) con la voz real del dueño, limpiada con
   DeepFilterNet. El corte sigue a la voz: cada escena del video original se
   estira o acelera para durar lo que dura su frase (PLAN), re-mapeando el
   tiempo con <Freeze>. Los SFX se recalculan y bajan mientras habla. */

const S = (f: string) => staticFile(f);
const {CH1, WA, CH2, PAY, CH3, LOOP, X3} = DOS2_MARKS;
// duración (frames) de cada frase grabada: public/audio/vo/dos_XX.wav
const VO_LEN = [68, 80, 92, 62, 45, 92, 45, 71, 44, 98, 37, 47, 23, 62, 34, 141, 130];

// [frame interno inicio, fin, largo en este video, [frase, desfase]]
type Seg = [number, number, number, [number, number][]];
const PLAN: Seg[] = [
  [0, 14, 72, [[0, 2]]],                          // "A las dos de la tarde me llega un mensaje…"
  [14, CH1, 84, [[1, 2]]],                        // "…y a las cuatro ya teníamos dos autos comprados"
  [CH1, WA, 162, [[2, 4], [3, 98]]],              // Messenger · "le pedimos la patente"
  [WA, CH2, 100, [[4, 4]]],                       // "Y entremedio, sale otro:"
  [CH2, PAY, 100, [[5, 4]]],                      // "un Jeep Grand Cherokee. Arriba de la grúa altiro"
  [PAY, CH3, 60, [[6, 12]]],                      // "Dos tratos en dos horas"
  [CH3, X3(SX4_T.trato), 78, [[7, 4]]],           // "Al otro día fuimos a buscar el SX4"
  [X3(SX4_T.trato), X3(SX4_T.pago), 56, [[8, 4]]], // "Conversamos, trato hecho"
  [X3(SX4_T.pago), X3(SX4_T.grua), 148, [[9, 4], [10, 108]]], // pago/papeles/patentes · "Todo en regla"
  [X3(SX4_T.grua), X3(SX4_T.arriba), 80, [[11, 4]]],          // "Lo subimos a la grúa, impeque…"
  [X3(SX4_T.arriba), X3(SX4_T.oops), 50, [[12, 3]]],          // "listo pa'l desarme"
  [X3(SX4_T.oops), X3(SX4_T.cta), 122, [[13, 10], [14, 80]]], // foco · "Gajes del oficio, nomás"
  [X3(SX4_T.cta), X3(SX4_T.end), 150, [[15, 5]]],             // CTA
  [X3(SX4_T.end), LOOP, 140, [[16, 6]]],                      // cierre de marca
  [LOOP, LOOP + 10, 10, []],
];
const STARTS = PLAN.reduce<number[]>((acc, [, , L], i) => [...acc, (acc[i] ?? 0) + L], [0]);
export const DOS_VOZ_TOTAL = STARTS[PLAN.length];
const VO: [number, number, string][] = PLAN.flatMap(([, , , vo], i) => vo.map(([k, off]) => [STARTS[i] + off, VO_LEN[k], `audio/vo/dos_${String(k).padStart(2, '0')}.wav`] as [number, number, string]));
const voOn = (fr: number) => VO.some(([a, d]) => fr >= a && fr < a + d);

const toInner = (o: number) => {
  const i = Math.max(0, STARTS.findIndex((s, k) => o >= s && o < STARTS[k + 1]));
  const [a, b, L] = PLAN[i];
  return Math.min(b - 0.001, a + ((o - STARTS[i]) / L) * (b - a));
};
const toOuter = (x: number) => {
  const i = Math.max(0, PLAN.findIndex(([a, b]) => x >= a && x < b));
  const [a, b, L] = PLAN[i];
  return Math.round(STARTS[i] + ((x - a) / (b - a)) * L);
};

/* subtítulos palabra a palabra, solo en frases que no están ya escritas en pantalla */
const voAt = (k: number) => VO.find(([, , file]) => file.endsWith(`dos_${String(k).padStart(2, '0')}.wav`))!;
const LINES: [number, string][] = [[10, 'Todo en regla.'], [14, 'Gajes del oficio, nomás.']];
type W = {w: string; a: number; b: number; line: number};
const WORDS: W[] = LINES.flatMap(([k, txt]) => {
  const [st, du] = voAt(k);
  const ws = txt.split(' ');
  const wt = ws.map((w) => w.length + 2);
  const tot = wt.reduce((x, y) => x + y, 0);
  let acc = 0;
  return ws.map((w, i) => {
    const a = st + 1 + (acc / tot) * (du - 3); acc += wt[i];
    return {w, a, b: st + 1 + (acc / tot) * (du - 3), line: k};
  });
});
const Captions: React.FC<{f: number}> = ({f}) => {
  const line = LINES.find(([k]) => { const [st, du] = voAt(k); return f >= st && f < st + du + 14; });
  if (!line) return null;
  const ws = WORDS.filter((w) => w.line === line[0]);
  const cur = ws.filter((w) => f >= w.a).pop();
  if (!cur) return null;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1400, textAlign: 'center'}}>
      {ws.filter((w) => f >= w.a).map((w, i) => (
        <span key={i} style={{display: 'inline-block', margin: '0 12px', fontFamily: "'Anton', sans-serif", fontSize: 96, lineHeight: 1.05, textTransform: 'uppercase', color: w === cur ? '#FF2A2A' : '#fff', WebkitTextStroke: '3px #000', textShadow: '0 6px 0 #000, 0 0 26px rgba(0,0,0,0.85)', transform: `scale(${interpolate(f - w.a, [0, 3, 7], [1.3, 0.96, 1], cl)})`}}>{w.w.replace(/[.,:]/g, '')}</span>
      ))}
    </div>
  );
};

/* remate con las horas reales: 15:13 lo suben · 15:15 foco roto */
const DosMinutos: React.FC<{f: number}> = ({f}) => {
  const [st] = voAt(14);
  const end = STARTS[12];
  if (f < st + 6 || f >= end) return null;
  const k = interpolate(f - st - 6, [0, 6], [0, 1], cl);
  return (
    <div style={{position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 40}px)`}}>
      <Chip red size={50}>15:13 ARRIBA · 15:15 FOCO ROTO</Chip>
    </div>
  );
};

export const DosAutosVoz: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Freeze frame={toInner(f)}>
        <DosAutos2 hook="mensaje" mute />
      </Freeze>
      <Captions f={f} />
      <DosMinutos f={f} />
      {dosSfx('mensaje').map(([at, n, v, d], i) => {
        const o = toOuter(at);
        return (
          <Sequence key={i} from={o} durationInFrames={d ?? 90}>
            <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(o + x) ? 0.35 : 1)} />
          </Sequence>
        );
      })}
      {VO.map(([st, du, file], i) => (
        <Sequence key={i} from={st} durationInFrames={du + 3}><Audio src={S(file)} volume={1.15} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
