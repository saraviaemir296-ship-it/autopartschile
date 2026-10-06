import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {CuatroAutos, SFX, STAMPS, T} from './CuatroAutos';
import {STING_SFX} from './LogoSting';
import {CRIS_SEGS, CRIS_TOTAL, CRIS_VO} from './voCris';

/* "1 día" con la voz real de Cristian. El corte sigue a la voz: cada escena
   del timeline original se estira linealmente hasta durar lo que dura su
   frase (CRIS_SEGS), renderizando el video original con el tiempo re-mapeado
   (<Freeze> por frame). Los SFX se recalculan al nuevo tiempo y bajan cuando
   habla la voz. */

export const UNDIA_VOZ_TOTAL = CRIS_TOTAL;
const S = (f: string) => staticFile(f);

const toInner = (o: number) => {
  const seg = CRIS_SEGS.find(([, , A, L]) => o >= A && o < A + L) ?? CRIS_SEGS[CRIS_SEGS.length - 1];
  const [a, b, A, L] = seg;
  return Math.min(b - 0.001, a + ((o - A) / L) * (b - a));
};
const toOuter = (i: number) => {
  const seg = CRIS_SEGS.find(([a, b]) => i >= a && i < b) ?? CRIS_SEGS[CRIS_SEGS.length - 1];
  const [a, b, A, L] = seg;
  return Math.round(A + ((i - a) / (b - a)) * L);
};
const voOn = (fr: number) => CRIS_VO.some(([a, d]) => fr >= a && fr < a + d);

type Sfx = [number, string, number, number?];
const ALL_SFX: Sfx[] = [
  ...SFX,
  ...STAMPS.map(([at]) => [at, 'sfx_metal', 0.8, 20] as Sfx),
  ...STING_SFX.map(([at, n, v, d]) => [T.end + at, n, v, d] as Sfx),
];


/* subtítulos palabra a palabra de la voz (en grupos de hasta 3, la palabra
   que suena en rojo). Solo en frases cuyo contenido no está ya en pantalla. */
const LINES: Record<number, string> = {
  2: 'Primer cliente: motor de Swift. Cotizó en la web, vino a verlo y se lo llevó.',
  3: 'Segundo: motor de Mastervan. Quinientas veinte lucas.',
  4: 'El tercero nos escribió por un portalón de Vitara, y se llevó cuatro piezas.',
  6: 'Cuarto: kit de airbag de Swift y piolas de SX4.',
  9: 'Y hoy también despachamos a regiones, con seguimiento.',
};
const HOT = /swift|web|llevó|mastervan|quinientas|veinte|lucas|vitara|portalón|cuatro|piezas|airbag|sx4|regiones|seguimiento/i;
type W = {w: string; a: number; b: number; chunk: number};
const WORDS: W[] = (() => {
  const out: W[] = [];
  let chunkId = 0;
  CRIS_VO.forEach(([st, du], idx) => {
    const txt = LINES[idx];
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
})();
const Captions: React.FC<{f: number}> = ({f}) => {
  const inner = toInner(f);
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

export const UnDiaVoz: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Freeze frame={toInner(f)}>
        <CuatroAutos dia mute />
      </Freeze>
      <Captions f={f} />
      {ALL_SFX.map(([at, n, v, d], i) => {
        const o = toOuter(at);
        return (
          <Sequence key={i} from={o} durationInFrames={d ?? 90}>
            <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(o + x) ? 0.4 : 1)} />
          </Sequence>
        );
      })}
      {CRIS_VO.map(([st, du, file]) => (
        <Sequence key={file} from={st} durationInFrames={du + 3}><Audio src={S(file)} volume={1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
