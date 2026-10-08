import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Chip, Rise} from './CuatroAutos';
import {DOS2_MARKS, DosAutos2, dosSfx} from './DosAutos2';
import {CheckIcon} from './Promo';
import {SX4Compra, SX4_SFX, SX4_T} from './SX4Compra';
import {TRAILER_LEN, TRAILER_SFX, Trailer} from './Trailer';

/* "2 autos en 2 horas" — versión final con el guion escrito por el dueño y su
   voz (2ª grabación, DeepFilterNet). El corte sigue a la voz: cada frase toma
   el tramo de video que le corresponde (de DosAutos2 con gancho A o B, o del
   Messenger original de SX4Compra), estirado o acelerado a su duración.
   El cierre (trato directo / $20.000 por dato / WhatsApp) es una escena nueva. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const BG = '#0A0A0A';
const DISP = "'Anton', sans-serif";
const {CH2, PAY, CH3, LOOP, X3} = DOS2_MARKS;
const WA = DOS2_MARKS.WA;
const VO_LEN = [117, 42, 208, 72, 88, 83, 84, 104, 54, 106, 122, 75, 47, 70, 64, 49, 98, 109, 141, 82, 52];

type Src = 'A' | 'B' | 'S' | 'C' | 'T';
// [fuente, frame interno inicio, fin, largo en este video, [frase, desfase]]
type Seg = [Src, number, number, number, [number, number][]];
const CTA_LEN = 444;
const PLAN: Seg[] = [
  ['T', 0, TRAILER_LEN, TRAILER_LEN, [[0, 2]]],      // resumen · "Mi gente: en dos horas compré dos autos pa' la desarmaduría…"
  ['B', 18, 48, 46, [[1, 2]]],                       // "…y de pasada me mandé una cagada"
  ['B', 48, 84, 40, [[2, 2]]],                       // rebobinado → "Martes, dos de la tarde…"
  ['S', SX4_T.msg, SX4_T.ver, 248, [[3, 172]]],      // Messenger · "Le pedimos la patente y lo revisamos"
  ['A', WA, WA + 34, 92, [[4, 2]]],                  // "Veinte minutos después, me escribe otro cliente por WhatsApp:"
  ['A', CH2, CH2 + 34, 86, [[5, 2]]],                // "un Jeep Grand Cherokee ZJ. Un clásico."
  ['A', WA + 34, CH2, 88, [[6, 2]]],                 // fotos del chat · "Lo tenía botado…"
  ['A', CH2 + 34, PAY, 108, [[7, 2]]],               // "Fuimos con la grúa… cuatro y veinte, el Jeep arriba"
  ['A', PAY, CH3, 58, [[8, 2]]],                     // "Dos tratos. En dos horas."
  ['A', CH3, X3(SX4_T.trato), 110, [[9, 2]]],        // "Miércoles, tres de la tarde…"
  ['A', X3(SX4_T.trato), X3(SX4_T.pago), 125, [[10, 2]]], // "…apretón de manos"
  ['A', X3(SX4_T.pago), X3(SX4_T.grua), 100, [[11, 3]]],  // "Se pagó, papeles firmados y patentes devueltas"
  ['A', X3(SX4_T.arriba), X3(SX4_T.oops), 50, [[12, 2]]], // "El SX4 arriba de la grúa. Impeque."
  ['A', X3(SX4_T.grua), X3(SX4_T.grua) + 70, 74, [[13, 2]]], // "Pero al subirlo, quedó chueca la rueda…"
  ['A', X3(SX4_T.oops), X3(SX4_T.oops) + 50, 68, [[14, 2]]], // "…y por andar grabando el video, me piteé un foco"
  ['A', X3(SX4_T.oops) + 50, X3(SX4_T.cta), 62, [[15, 3]]],  // "Dos minutos me duró el orgullo"
  ['C', 0, CTA_LEN, CTA_LEN, [[16, 2], [17, 103], [18, 217], [19, 358]]],
  ['A', X3(SX4_T.end), LOOP, 96, [[20, 4]]],         // "Desarmaduría Saravia"
  ['A', LOOP, LOOP + 10, 10, []],
];
const STARTS = PLAN.reduce<number[]>((acc, [, , , L], i) => [...acc, acc[i] + L], [0]);
export const DOS_FINAL_TOTAL = STARTS[PLAN.length];
const VO: [number, number, number][] = PLAN.flatMap(([, , , , vo], i) => vo.map(([k, off]) => [STARTS[i] + off, VO_LEN[k], k] as [number, number, number]));
const voOn = (fr: number) => VO.some(([a, d]) => fr >= a && fr < a + d);
const voStart = (k: number) => VO.find(([, , kk]) => kk === k)![0];

const segAt = (o: number) => Math.max(0, STARTS.findIndex((s, k) => o >= s && o < STARTS[k + 1]));
const innerAt = (i: number, o: number) => {
  const [, a, b, L] = PLAN[i];
  return Math.min(b - 0.001, a + ((o - STARTS[i]) / L) * (b - a));
};

/* ---- cierre: trato directo · $20.000 por dato · WhatsApp (frames locales = desde el inicio de la escena) */
const OUTE = (x: number) => 1 - Math.pow(1 - x, 3);
const CtaDato: React.FC<{t: number}> = ({t}) => {
  const v = (k: number) => voStart(k) - STARTS[PLAN.findIndex(([s]) => s === 'C')];
  const t18 = v(17), t19 = v(18), t20 = v(19);
  const row = (at: number, txt: string) => t >= at && (
    <div style={{display: 'flex', alignItems: 'center', gap: 20, transform: `translateX(${interpolate(t - at, [0, 6], [-760, 0], {...cl, easing: OUTE})}px)`}}>
      <CheckIcon size={60} />
      <span style={{fontFamily: DISP, fontSize: 74, color: BG}}>{txt}</span>
    </div>
  );
  const pop = (at: number) => spring({frame: t - at, fps: 30, config: {damping: 12, stiffness: 240, mass: 0.6}});
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Img src={S('marca/anim/logo_color.png')} style={{position: 'absolute', left: 340, top: 50, width: 400}} />
      <div style={{position: 'absolute', top: 230, left: 70, right: 70}}>
        <Rise f={t} at={2} style={{fontFamily: DISP, fontSize: 86, lineHeight: 1, color: BG}}>¿TIENES UN AUTO PARADO,</Rise>
        <Rise f={t} at={30} style={{fontFamily: DISP, fontSize: 86, lineHeight: 1, color: BG}}>CHOCADO O MALO?</Rise>
        <Rise f={t} at={62} style={{fontFamily: DISP, fontSize: 112, lineHeight: 1.05, color: RED}}>EN CUALQUIER ESTADO</Rise>
      </div>
      <div style={{position: 'absolute', top: 570, left: 80, display: 'flex', flexDirection: 'column', gap: 4}}>
        {row(t18 + 2, 'TRATO DIRECTO')}
        {row(t18 + 36, 'PAGO DIRECTO')}
        {row(t18 + 70, 'RETIRO DIRECTO')}
      </div>
      {t >= t19 + 40 && (
        <div style={{position: 'absolute', top: 935, left: 70, right: 70, transform: `scale(${pop(t19 + 40)}) rotate(-2deg)`, background: RED, padding: '18px 26px 22px', boxShadow: '0 20px 50px rgba(209,11,12,0.45)'}}>
          <div style={{fontFamily: DISP, fontSize: 52, color: '#fff', lineHeight: 1.05}}>¿SABES DE UNO? TE PAGAMOS</div>
          <div style={{fontFamily: DISP, fontSize: 150, color: '#fff', lineHeight: 1}}>$20.000 <span style={{fontSize: 92}}>POR DATO*</span></div>
          <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 30, color: 'rgba(255,255,255,0.92)', marginTop: 4}}>*si se concreta la compra del auto</div>
        </div>
      )}
      {t >= t20 && (
        <div style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(t20)})`}}>
          <div style={{fontFamily: DISP, fontSize: 60, color: BG, marginBottom: 12}}>MÁNDANOS 3 FOTOS + LA PATENTE</div>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{width: 820}} />
        </div>
      )}
    </AbsoluteFill>
  );
};
/* remate con las horas reales */
const DosMinutos: React.FC<{f: number}> = ({f}) => {
  const st = voStart(15);
  const end = STARTS[PLAN.findIndex(([s]) => s === 'C')];
  if (f < st || f >= end) return null;
  const k = (d: number) => interpolate(f - st - d, [0, 4, 9], [1.4, 0.96, 1], cl);
  return (
    <>
      <div style={{position: 'absolute', top: 1400, left: 40, right: 40, textAlign: 'center', fontFamily: DISP, fontSize: 92, lineHeight: 1.05, color: '#fff', WebkitTextStroke: '3px #000', textShadow: '0 6px 0 #000, 0 0 26px rgba(0,0,0,0.85)'}}>
        {f >= st + 1 && <span style={{display: 'inline-block', transform: `scale(${k(1)})`, color: '#FF2A2A'}}>2 MINUTOS</span>}{' '}
        {f >= st + 16 && <span style={{display: 'inline-block', transform: `scale(${k(16)})`}}>ME DURÓ EL ORGULLO</span>}
      </div>
      {f >= st + 20 && <div style={{position: 'absolute', top: 1620, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f - st - 20, [0, 5], [0, 1], cl)}}><Chip red size={46}>15:13 ARRIBA · 15:15 FOCO ROTO</Chip></div>}
    </>
  );
};

type Sfx = [number, string, number, number?];
const SFX_A = dosSfx('mensaje'), SFX_B = dosSfx('foco');
const CTA_OWN: Sfx[] = [[0, 'sfx_whip', 0.6], [2, 'sfx_impact', 0.5, 16]];
const ALL_SFX: Sfx[] = PLAN.flatMap(([src, a, b, L], i) => {
  if (src === 'T') return TRAILER_SFX.map(([at, n, vol, d]) => [STARTS[i] + at, n, vol, d] as Sfx);
  if (src === 'C') {
    const s0 = STARTS[i], v = (k: number) => voStart(k) - s0;
    const own: Sfx[] = [...CTA_OWN, [v(17) + 2, 'sfx_click', 0.6], [v(17) + 36, 'sfx_click', 0.6], [v(17) + 70, 'sfx_click', 0.6], [v(18) + 40, 'sfx_kaching_real', 0.8], [v(18) + 41, 'sfx_coins', 0.5], [v(19), 'sfx_notif', 0.7]];
    return own.map(([at, n, vol, d]) => [s0 + at, n, vol, d] as Sfx);
  }
  const list = src === 'A' ? SFX_A : src === 'B' ? SFX_B : SX4_SFX;
  return list.filter(([at]) => at >= a && at < b).map(([at, n, vol, d]) => [Math.round(STARTS[i] + ((at - a) / (b - a)) * L), n, vol, d] as Sfx);
});

export const DosAutosFinal: React.FC = () => {
  const f = useCurrentFrame();
  const i = segAt(f);
  const [src] = PLAN[i];
  const inner = innerAt(i, f);
  return (
    <AbsoluteFill style={{background: BG}}>
      {src === 'A' && <Freeze frame={inner}><DosAutos2 hook="mensaje" mute /></Freeze>}
      {src === 'B' && <Freeze frame={inner}><DosAutos2 hook="foco" mute /></Freeze>}
      {src === 'S' && <Freeze frame={inner}><SX4Compra intro={false} win={[0, 0]} mute /></Freeze>}
      {src === 'C' && <CtaDato t={f - STARTS[i]} />}
      {src === 'T' && <Trailer t={f - STARTS[i]} />}
      <DosMinutos f={f} />
      {ALL_SFX.map(([at, n, v, d], k) => (
        <Sequence key={k} from={at} durationInFrames={d ?? 90}>
          <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 4, d], [1, 0], cl) : v) * (voOn(at + x) ? 0.35 : 1)} />
        </Sequence>
      ))}
      {VO.map(([st, du, k]) => (
        <Sequence key={k} from={st} durationInFrames={du + 3}><Audio src={S(`audio/vo/dos2_${String(k).padStart(2, '0')}.wav`)} volume={1.1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
