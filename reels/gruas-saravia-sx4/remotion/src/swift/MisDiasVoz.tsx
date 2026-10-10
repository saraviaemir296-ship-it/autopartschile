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

type Seg = ['M' | 'L', number, number, number, [number, number][]];
const PLAN: Seg[] = [
  ['M', 0, 75, 125, [[0, 2]]],           // "Buenos días mi gente…"
  ['M', 75, 200, 203, [[1, 2]]],         // ramal Verna, cliente de Valdivia
  ['M', 200, 290, 255, [[2, 2]]],        // pedido piolas/varilla/lips SX4
  ['M', 290, 405, 318, [[3, 2]]],        // Mastervan: nos vio en TikTok, compró por la web
  ['L', 0, 140, 140, [[4, 1]]],          // "llegaron unos cabros a mi local…"
  ['M', 405, 472, 133, [[5, 1]]],        // "me subí a su auto…"
  ['M', 472, 620, 136, [[6, 2]]],        // notaría
  ['M', 620, 800, 134, [[7, 1]]],        // grúa + Ciaz blanco
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
    <Tag t={t} at={4} top={190} red size={50}>ya en la tarde…</Tag>
    <Tag t={t} at={14} top={290} size={56}>llegaron unos cabros al local</Tag>
    <Tag t={t} at={60} top={1480} dark size={54}>“Hermano, tenemos un Ciaz</Tag>
    <Tag t={t} at={66} top={1585} dark size={54}>pa' vender”</Tag>
  </AbsoluteFill>
);

export const MisDiasVoz: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, STARTS.findIndex((s, k) => f >= s && f < STARTS[k + 1]));
  const [src, a, b, L] = PLAN[i];
  const t = f - STARTS[i];
  const inner = Math.min(b - 0.001, a + (t / L) * (b - a));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {src === 'M' ? <Freeze frame={inner}><MisDias /></Freeze> : <Sequence from={STARTS[i]} durationInFrames={L}><Local t={t} /></Sequence>}
      {VO.map(([st, du, k]) => (
        <Sequence key={k} from={st} durationInFrames={du + 3}><Audio src={S(`audio/vo/dia3_${String(k).padStart(2, '0')}.wav`)} volume={1.1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
