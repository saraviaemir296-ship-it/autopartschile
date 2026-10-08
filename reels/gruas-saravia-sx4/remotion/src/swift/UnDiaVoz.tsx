import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {CuatroAutos, NoPrice, SFX, STAMPS, T} from './CuatroAutos';
import {STING_SFX} from './LogoSting';
import {CRIS_SEGS, CRIS_TOTAL, CRIS_VO} from './voCris';

/* "1 día" con la voz real de Cristian. El corte sigue a la voz: cada escena
   del timeline original se estira linealmente hasta durar lo que dura su
   frase (CRIS_SEGS), renderizando el video original con el tiempo re-mapeado
   (<Freeze> por frame). Los SFX se recalculan al nuevo tiempo y bajan cuando
   habla la voz. */

export const UNDIA_VOZ_TOTAL = CRIS_TOTAL;
const S = (f: string) => staticFile(f);

/* variante "atención" (sin precios): la frase 3 se corta antes de "quinientas
   veinte lucas" (cris_d03b) y la 8 (el monto total) se elimina; sus escenas se
   acortan y todo lo que sigue se corre. */
type Seg = [number, number, number, number];
type Vo = [number, number, string, number]; // inicio, largo, archivo, índice original
const buildPlan = (atencion: boolean) => {
  const newL: Record<number, number> = atencion ? {3: 80, 8: 60} : {};
  let acc = 0;
  const segs: Seg[] = CRIS_SEGS.map(([a, b, , L], i) => { const s: Seg = [a, b, acc, newL[i] ?? L]; acc += s[3]; return s; });
  const vo: Vo[] = CRIS_VO.flatMap(([st, du, file], idx) => {
    if (atencion && idx === 8) return [];
    const k = CRIS_SEGS.findIndex(([, , A, L]) => st >= A && st < A + L);
    const off = st - CRIS_SEGS[k][2];
    if (atencion && idx === 3) return [[segs[k][2] + off, 70, 'audio/vo/cris_d03b.wav', idx] as Vo];
    return [[segs[k][2] + off, du, file, idx] as Vo];
  });
  return {segs, vo, total: acc};
};
export const UNDIA_ATENCION_TOTAL = buildPlan(true).total;
const PLANS = {base: buildPlan(false), atencion: buildPlan(true)};

const toInner = (segs: Seg[], o: number) => {
  const seg = segs.find(([, , A, L]) => o >= A && o < A + L) ?? segs[segs.length - 1];
  const [a, b, A, L] = seg;
  return Math.min(b - 0.001, a + ((o - A) / L) * (b - a));
};
const toOuter = (segs: Seg[], i: number) => {
  const seg = segs.find(([a, b]) => i >= a && i < b) ?? segs[segs.length - 1];
  const [a, b, A, L] = seg;
  return Math.round(A + ((i - a) / (b - a)) * L);
};

type Sfx = [number, string, number, number?];
const ALL_SFX: Sfx[] = [
  ...SFX,
  ...STAMPS.map(([at]) => [at, 'sfx_metal', 0.8, 20] as Sfx),
  ...STING_SFX.map(([at, n, v, d]) => [T.end + at, n, v, d] as Sfx),
];


/* subtítulos palabra a palabra de la voz (en grupos de hasta 3, la palabra
   que suena en rojo). Solo en frases cuyo contenido no está ya en pantalla. */
const LINES_ATENCION: Record<number, string> = {
  2: 'Primer cliente: motor de Swift. Cotizó en la web, vino a verlo y se lo llevó.',
  3: 'Segundo: motor de Mastervan.',
  4: 'El tercero nos escribió por un portalón de Vitara, y se llevó cuatro piezas.',
  6: 'Cuarto: kit de airbag de Swift y piolas de SX4.',
  9: 'Y hoy también despachamos a regiones, con seguimiento.',
};
const LINES: Record<number, string> = {
  2: 'Primer cliente: motor de Swift. Cotizó en la web, vino a verlo y se lo llevó.',
  3: 'Segundo: motor de Mastervan. Quinientas veinte lucas.',
  4: 'El tercero nos escribió por un portalón de Vitara, y se llevó cuatro piezas.',
  6: 'Cuarto: kit de airbag de Swift y piolas de SX4.',
  9: 'Y hoy también despachamos a regiones, con seguimiento.',
};
const HOT = /swift|web|llevó|mastervan|quinientas|veinte|lucas|vitara|portalón|cuatro|piezas|airbag|sx4|regiones|seguimiento/i;
type W = {w: string; a: number; b: number; chunk: number};
const buildWords = (vo: Vo[], lines: Record<number, string>): W[] => {
  const out: W[] = [];
  let chunkId = 0;
  vo.forEach(([st, du, , idx]) => {
    const txt = lines[idx];
    if (!txt) return;
    const ws = txt.split(' ');
    const wt = ws.map((w) => w.length + 2);
    const tot = wt.reduce((x, y) => x + y, 0);
    const t0 = st + 2, span = du - 5;
    let acc = 0, inChunk = 0;
    ws.forEach((w, i) => {
      const a = t0 + (acc / tot) * span; acc += wt[i];
      const b = t0 + (acc / tot) * span;
      out.push({w, a, b, chunk: chunkId});
      inChunk++;
      if (inChunk >= 3 || /[.,:]$/.test(w)) { chunkId++; inChunk = 0; }
    });
    chunkId++;
  });
  return out;
};
const WORDS = {base: buildWords(PLANS.base.vo, LINES), atencion: buildWords(PLANS.atencion.vo, LINES_ATENCION)};
const Captions: React.FC<{f: number; segs: Seg[]; words: W[]}> = ({f, segs, words: WORDS}) => {
  const inner = toInner(segs, f);
  if (inner >= 822 && inner < 846) return null; // mapa de envíos: sus rótulos ocupan esa zona
  const cur = WORDS.find((w) => f >= w.a && f < w.b);
  if (!cur) return null;
  const ws = WORDS.filter((w) => w.chunk === cur.chunk);
  const p = interpolate(f - ws[0].a, [0, 3, 7], [1.25, 0.96, 1], cl);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1400, textAlign: 'center', transform: `scale(${p})`}}>
      {ws.map((w, i) => {
        const on = w === cur;
        const hot = HOT.test(w.w);
        return (
          <span key={i} style={{display: 'inline-block', margin: '0 12px', fontFamily: "'Anton', sans-serif", fontSize: 92, lineHeight: 1.05, textTransform: 'uppercase', color: on ? '#FF2A2A' : hot ? '#fff' : 'rgba(255,255,255,0.92)', WebkitTextStroke: '3px #000', textShadow: '0 6px 0 #000, 0 0 26px rgba(0,0,0,0.85)', transform: `scale(${on ? 1.12 : 1})`, transformOrigin: 'center bottom'}}>{w.w.replace(/[.,:]/g, '')}</span>
        );
      })}
    </div>
  );
};

export const UnDiaVoz: React.FC<{atencion?: boolean}> = ({atencion = false}) => {
  const f = useCurrentFrame();
  const plan = atencion ? PLANS.atencion : PLANS.base;
  const {segs, vo} = plan;
  const voOn = (fr: number) => vo.some(([a, d]) => fr >= a && fr < a + d);
  // sin precios: fuera el "ka-ching" de la cifra total
  const sfx = atencion ? ALL_SFX.filter(([at, n]) => !(n.includes('kaching') || n.includes('coins'))) : ALL_SFX;
  return (
    <AbsoluteFill>
      <NoPrice.Provider value={atencion}>
        <Freeze frame={toInner(segs, f)}>
          <CuatroAutos dia mute />
        </Freeze>
      </NoPrice.Provider>
      <Captions f={f} segs={segs} words={atencion ? WORDS.atencion : WORDS.base} />
      {sfx.map(([at, n, v, d], i) => {
        const o = toOuter(segs, at);
        return (
          <Sequence key={i} from={o} durationInFrames={d ?? 90}>
            <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(o + x) ? 0.4 : 1)} />
          </Sequence>
        );
      })}
      {vo.map(([st, du, file]) => (
        <Sequence key={file} from={st} durationInFrames={du + 3}><Audio src={S(file)} volume={1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
