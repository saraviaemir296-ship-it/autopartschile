import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Bg, CHAT_LEN, ITEMS, ItemScene, TOTAL} from './VendimosTodo';

/* Storytelling "4 autos en desarme → $2.704.990".
   Arco: GANCHO (los 4 autos reales + la cifra) → GIRO ("para muchos es
   chatarra / para nosotros, repuestos que alguien necesita") → VIAJE (las 4
   ventas, con chat real cuando lo hay) → CLÍMAX (total) → CTA doble para
   dos tipos de lead: quien busca repuesto y quien tiene un auto chocado.
   Precios dados por el dueño el 2026-10-06. Colores de marca. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const BG = '#0A0A0A';
const DISP = "'Anton', 'Montserrat', sans-serif";
const TXT = "'Montserrat', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const sp = (f: number, d = 0, damping = 13, stiffness = 220) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');
const glow = (c: string, k = 1) => `0 0 ${8 * k}px ${c}, 0 0 ${22 * k}px ${c}, 0 0 ${48 * k}px ${c}88`;

const CARS = [
  {img: 'swift/auto.jpg', name: 'Swift'},
  {img: 'suzuki/mastervan.jpg', name: 'Mastervan'},
  {img: 'swift/car_vitara.jpg', name: 'Vitara'},
  {img: 'swift/car_sx4.jpg', name: 'SX4'},
];
// qué auto "aporta" cada venta (el kit de airbag es de Swift; las piolas, del SX4)
const ITEM_CAR = [0, 1, 2, 3];

const HOOK = 96;
const TURN = 84;
const EACH = 120;
const CLIMAX = 72;
const CTA = 132;
const S0 = HOOK + TURN;
const C0 = S0 + ITEMS.length * EACH;
const E0 = C0 + CLIMAX;
export const STORY_TOTAL = E0 + CTA;

/* carta de auto que cae y se acomoda en abanico */
const CarCard: React.FC<{i: number; t: number; gray: number; fan: boolean; crossed?: number}> = ({i, t, gray, fan, crossed = 0}) => {
  const p = sp(t, i * 6, 11, 200);
  const rot = fan ? [-12, -4, 4, 12][i] : 0;
  const x = fan ? [-300, -100, 100, 300][i] : 0;
  const y = fan ? [30, 0, 0, 30][i] : 0;
  return (
    <div style={{position: 'absolute', left: 540 - 210 + x, top: 760 + y - (1 - p) * 900, width: 420, height: 300, borderRadius: 18, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', transform: `rotate(${rot + (1 - p) * 30}deg)`, filter: `grayscale(${gray}) brightness(${1 - gray * 0.25})`}}>
      <Img src={S(CARS[i].img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(10,10,10,0.85)', color: '#fff', fontFamily: DISP, fontSize: 40, padding: '2px 14px 4px'}}>{CARS[i].name}</div>
      {crossed > 0 && <div style={{position: 'absolute', left: -40, right: -40, top: 140, height: 16, background: RED2, transform: `rotate(-20deg) scaleX(${crossed})`, transformOrigin: 'left'}} />}
    </div>
  );
};

const Hook: React.FC<{t: number}> = ({t}) => {
  const count = interpolate(t, [40, 66], [0, TOTAL], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const color = interpolate(t, [36, 44], [1, 0], cl);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 300, left: 50, right: 50, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: '#fff', color: BG, fontFamily: DISP, fontSize: 92, lineHeight: 1.05, padding: '2px 26px 8px', transform: `scale(${sp(t, 0, 12, 260)})`}}>ESTOS 4 AUTOS EN DESARME</span>
      </div>
      {CARS.map((_, i) => <CarCard key={i} i={i} t={t} gray={color} fan />)}
      {t >= 36 && (
        <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: DISP, fontSize: 70, padding: '0 24px 6px', opacity: interpolate(t, [36, 42], [0, 1], cl)}}>NOS DEJARON</div>
          <div style={{marginTop: 10, fontFamily: MONO, fontWeight: 800, fontSize: 150, color: '#fff', textShadow: glow(t >= 66 ? RED2 : RED, 1), transform: `scale(${t >= 66 ? interpolate(t, [66, 70, 74], [1.2, 0.96, 1], cl) : 1})`}}>{clp(count)}</div>
        </div>
      )}
      {t >= 76 && <div style={{position: 'absolute', top: 1480, left: 0, right: 0, textAlign: 'center', fontFamily: TXT, fontWeight: 900, fontSize: 46, color: '#fff', opacity: interpolate(t, [76, 84], [0, 1], cl)}}>te cuento cómo 👇</div>}
    </AbsoluteFill>
  );
};

const Turn: React.FC<{t: number}> = ({t}) => {
  const flip = t >= 42;
  return (
    <AbsoluteFill>
      {CARS.map((_, i) => <CarCard key={i} i={i} t={60} gray={flip ? interpolate(t, [42, 52], [1, 0], cl) : 1} fan crossed={flip ? 0 : interpolate(t, [10, 22], [0, 1], cl)} />)}
      <div style={{position: 'absolute', top: 320, left: 50, right: 50, textAlign: 'center'}}>
        {!flip ? (
          <span style={{display: 'inline-block', background: BG, color: '#fff', fontFamily: DISP, fontSize: 96, padding: '2px 26px 8px', border: '4px solid #fff'}}>PARA MUCHOS: CHATARRA 🗑️</span>
        ) : (
          <span style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: DISP, fontSize: 84, lineHeight: 1.08, padding: '4px 26px 10px', transform: `scale(${interpolate(t, [42, 46, 50], [1.4, 0.95, 1], cl)})`}}>PARA NOSOTROS:<br />REPUESTOS QUE ALGUIEN NECESITA ✅</span>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Climax: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    {CARS.map((_, i) => <CarCard key={i} i={i} t={60} gray={0} fan />)}
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 84, color: '#fff'}}>
      <span style={{background: BG, padding: '0 20px 6px', border: '4px solid #fff'}}>4 AUTOS · 4 CLIENTES</span>
    </div>
    <div style={{position: 'absolute', top: 1190, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 160, color: '#fff', textShadow: glow(RED2, 1.2), transform: `scale(${interpolate(t, [0, 5, 10], [1.4, 0.95, 1], cl)})`}}>{clp(TOTAL)}</div>
    <div style={{position: 'absolute', top: 1420, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: DISP, fontSize: 64, padding: '0 24px 6px', opacity: interpolate(t, [14, 20], [0, 1], cl)}}>Y UNO VIAJA A VIÑA DEL MAR 📦</span>
    </div>
  </AbsoluteFill>
);

const Cta: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 12, 200);
  const Card: React.FC<{a: number; q: string; a2: string; red?: boolean}> = ({a, q, a2, red}) => {
    const k = sp(t, a, 12, 240);
    return (
      <div style={{background: red ? RED : '#fff', color: red ? '#fff' : BG, borderRadius: 22, padding: '20px 28px', border: '4px solid #fff', opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * (red ? 300 : -300)}px)`}}>
        <div style={{fontFamily: DISP, fontSize: 64, lineHeight: 1.05}}>{q}</div>
        <div style={{fontFamily: TXT, fontWeight: 900, fontSize: 38, marginTop: 6}}>{a2}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 170, left: 70, right: 70, borderRadius: 24, overflow: 'hidden', border: `4px solid ${RED}`, boxShadow: glow(RED, 0.8), transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2)}}>
        <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 640, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 24}}>
        <Card a={8} q="¿BUSCAS UN REPUESTO?" a2="Escríbenos tu modelo y te mandamos foto y precio" />
        <Card a={22} q="¿AUTO CHOCADO O EN MAL ESTADO?" a2="Te lo compramos en cualquier estado" red />
      </div>
      <div style={{position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: interpolate(t, [40, 48], [0, 1], cl)}}>
        <div style={{fontFamily: DISP, fontSize: 70, color: '#fff', textShadow: glow(RED, 0.7)}}>WhatsApp +56 9 5381 7335</div>
        <div style={{fontFamily: DISP, fontSize: 56, color: BG, background: '#fff', padding: '0 26px 6px', borderRadius: 12}}>autopartschile.cl · despacho a todo Chile</div>
      </div>
    </AbsoluteFill>
  );
};

/* mini-carta del auto de origen durante cada venta ("DE ESTE AUTO") */
const Origin: React.FC<{i: number; t: number}> = ({i, t}) => {
  const k = sp(t, 2, 12, 240);
  const c = CARS[ITEM_CAR[i]];
  return (
    <div style={{position: 'absolute', right: 40, top: 520, width: 230, borderRadius: 14, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transform: `rotate(4deg) scale(${k})`, transformOrigin: 'top right'}}>
      <Img src={S(c.img)} style={{display: 'block', width: '100%', height: 150, objectFit: 'cover'}} />
      <div style={{background: RED, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 22, padding: '4px 10px'}}>SALIÓ DE ESTE {c.name.toUpperCase()}</div>
    </div>
  );
};

export const StoryVentas: React.FC<{vo?: string}> = ({vo}) => {
  const f = useCurrentFrame();
  const cuts = [HOOK, S0, ...ITEMS.map((_, i) => S0 + (i + 1) * EACH), E0];
  const near = cuts.reduce((a, b) => (Math.abs(f - b) < Math.abs(f - a) ? b : a));
  return (
    <AbsoluteFill style={{background: BG}}>
      <Bg f={f} />
      <Sequence from={0} durationInFrames={HOOK}><Hook t={f} /></Sequence>
      <Sequence from={HOOK} durationInFrames={TURN}><Turn t={f - HOOK} /></Sequence>
      {ITEMS.map((it, i) => (
        <Sequence key={i} from={S0 + i * EACH} durationInFrames={EACH}>
          <ItemScene it={it} t={f - S0 - i * EACH} i={i} />
          <Origin i={i} t={f - S0 - i * EACH} />
        </Sequence>
      ))}
      <Sequence from={C0} durationInFrames={CLIMAX}><Climax t={f - C0} /></Sequence>
      <Sequence from={E0} durationInFrames={CTA}><Cta t={f - E0} /></Sequence>
      {/* barrido rojo/blanco en cada corte */}
      {Math.abs(f - near) < 7 && f > 4 && (
        <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
          {[[RED, 0], ['#fff', 0.2], [RED, 0.32]].map(([c, off], k) => {
            const pp = interpolate(f - near, [-7, 7], [-1.4, 1.4]);
            return <div key={k} style={{position: 'absolute', top: -600, bottom: -600, width: k === 1 ? 70 : 520, left: 280 + (pp - (off as number)) * 1700, background: c as string, transform: 'rotate(18deg)'}} />;
          })}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />

      {vo && <Audio src={S(vo)} volume={1} />}
      {/* gancho */}
      {CARS.map((_, i) => <Sequence key={'c' + i} from={i * 6 + 6}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>)}
      <Sequence from={36}><Audio src={S('audio/sfx_riser.wav')} volume={0.3} /></Sequence>
      <Sequence from={40}><Audio src={S('audio/sfx_billcount.wav')} volume={vo ? 0.45 : 0.85} /></Sequence>
      <Sequence from={64}><Audio src={S('audio/sfx_kaching_real.wav')} volume={vo ? 0.5 : 0.75} /></Sequence>
      <Sequence from={66}><Audio src={S('audio/sfx_impact.wav')} volume={0.4} /></Sequence>
      {/* giro */}
      <Sequence from={HOOK + 10}><Audio src={S('audio/sfx_fah.wav')} volume={0.35} /></Sequence>
      <Sequence from={HOOK + 42}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.45} /></Sequence>
      <Sequence from={HOOK + 43}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.35} /></Sequence>
      {cuts.map((c) => <Sequence key={'w' + c} from={c - 6}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>)}
      {ITEMS.map((it, i) => (
        <React.Fragment key={'i' + i}>
          {it.chat && <Sequence from={S0 + i * EACH + 4}><Audio src={S('audio/sfx_ding.wav')} volume={0.5} /></Sequence>}
          <Sequence from={S0 + i * EACH + 20 + (it.chat ? CHAT_LEN : 0)}><Audio src={S('audio/sfx_kaching_real.wav')} volume={vo ? 0.4 : 0.65} /></Sequence>
          <Sequence from={S0 + i * EACH + 22 + (it.chat ? CHAT_LEN : 0)}><Audio src={S('audio/sfx_coins.wav')} volume={0.3} /></Sequence>
        </React.Fragment>
      ))}
      {/* clímax y cierre */}
      <Sequence from={C0}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      <Sequence from={C0 + 2}><Audio src={S('audio/sfx_coins.wav')} volume={0.45} /></Sequence>
      <Sequence from={E0 + 8}><Audio src={S('audio/sfx_pop.wav')} volume={0.4} /></Sequence>
      <Sequence from={E0 + 22}><Audio src={S('audio/sfx_pop.wav')} volume={0.4} /></Sequence>
      <Sequence from={E0 + 40}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
