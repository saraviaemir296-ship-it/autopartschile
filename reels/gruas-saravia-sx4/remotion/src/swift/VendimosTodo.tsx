import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* "Vendimos $2.704.990": suma de ventas reales con precios dados por el
   dueño el 2026-10-06 (motor Swift $900.000, motor Mastervan $520.000,
   repuestos Vitara $900.000, kit airbag Swift + piolas SX4 $384.990).
   Colores de marca: negro, blanco y rojo. La voz (Krea/ElevenLabs) se
   monta cuando llegue el archivo: prop `vo` con la ruta en public/. */

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

export type Item = {title: string; sub: string; price: number; src: string; from: number; chip: string; chat?: string; ask?: string};
export const ITEMS: Item[] = [
  {title: 'Motor Suzuki Swift', sub: '1.2 K12', price: 900000, src: 'swift/entrega_anon.mp4', from: 0.3, chip: 'Directo a su automotora'},
  {title: 'Motor Suzuki Mastervan', sub: 'G13B 1.3', price: 520000, src: 'swift/mv_carga.mp4', from: 0.9, chip: 'Cargado en su camioneta'},
  {title: 'Repuestos Suzuki Vitara', sub: 'portalón · refuerzo · parachoques · corte', price: 900000, src: 'swift/vitara_portalon.mp4', from: 0.6, chip: 'Un corte va a Viña del Mar', chat: 'swift/chat_vitara.png', ask: '“¿el portalón está disponible?”'},
  {title: 'Kit airbag Swift + piolas SX4', sub: 'embalado y listo', price: 384990, src: 'swift/airbag_kit.mp4', from: 0.4, chip: 'Kit completo, embalado', chat: 'swift/chat_airbag.png', ask: '“busco kit airbag Swift”'},
];
export const TOTAL = ITEMS.reduce((a, b) => a + b.price, 0); // 2.704.990
const HOOK = 84;
const EACH = 120;
export const CHAT_LEN = 46;
const END = 120;
export const VENDIMOS_TOTAL = HOOK + ITEMS.length * EACH + END;

export const Bg: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 40%, ${RED}40 0%, transparent 70%)`}} />
    <div style={{position: 'absolute', left: -540, right: -540, bottom: -200, height: 900, transform: 'perspective(700px) rotateX(62deg)', transformOrigin: 'bottom', backgroundImage: `linear-gradient(${RED}55 2px, transparent 2px), linear-gradient(90deg, ${RED}55 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0 ${(f * 3) % 90}px`, maskImage: 'linear-gradient(to top, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)'}} />
    {/* franjas del logo */}
    <div style={{position: 'absolute', top: -60, right: -160, width: 520, height: 70, background: RED, transform: 'rotate(-35deg)'}} />
    <div style={{position: 'absolute', top: 40, right: -170, width: 520, height: 20, background: '#fff', transform: 'rotate(-35deg)'}} />
  </AbsoluteFill>
);

/* barra de total acumulado (retención: la gente quiere ver dónde termina) */
const TotalBar: React.FC<{f: number}> = ({f}) => {
  const idx = Math.floor((f - HOOK) / EACH);
  const acc = (k: number) => ITEMS.slice(0, k).reduce((a, b) => a + b.price, 0);
  const cur = idx < 0 ? 0 : Math.min(ITEMS.length, idx + 1);
  const local = f - HOOK - idx * EACH;
  const off = idx >= 0 && idx < ITEMS.length && ITEMS[idx].chat ? CHAT_LEN : 0;
  const shown = idx < 0 ? 0 : interpolate(local, [20 + off, 34 + off], [acc(cur - 1), acc(cur)], cl);
  if (f < HOOK) return null;
  return (
    <div style={{position: 'absolute', top: 70, left: 50, right: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.9)', border: `3px solid ${RED}`, borderRadius: 18, padding: '10px 24px', boxShadow: glow(RED, 0.5)}}>
      <div style={{fontFamily: TXT, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: '0.1em'}}>TOTAL VENDIDO</div>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 52, color: '#fff', textShadow: glow(RED, 0.6)}}>{clp(shown)}</div>
    </div>
  );
};

const Hook: React.FC<{t: number}> = ({t}) => {
  const n = interpolate(t, [4, 34], [0, TOTAL], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const done = t >= 34;
  const st = sp(t, 40, 9, 300);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: '#fff', color: BG, fontFamily: DISP, fontSize: 86, padding: '0 26px 6px', transform: `scale(${sp(t, 0, 12, 260)})`}}>VENDIMOS</span>
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 150, color: '#fff', textShadow: glow(done ? RED2 : RED, 1), transform: `scale(${done ? interpolate(t, [34, 38, 42], [1.18, 0.96, 1], cl) : 1}) translateX(${done && t < 42 ? Math.sin(t * 2.6) * (42 - t) * 2 : 0}px)`}}>
        {clp(n)}
      </div>
      <div style={{position: 'absolute', top: 850, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: DISP, fontSize: 80, padding: '0 26px 6px', opacity: interpolate(t, [36, 42], [0, 1], cl)}}>EN REPUESTOS</span>
      </div>
      {t >= 40 && (
        <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{fontFamily: DISP, fontSize: 120, color: RED2, border: `8px solid ${RED2}`, borderRadius: 22, padding: '0 34px 8px', background: '#fff', transform: `rotate(-7deg) scale(${interpolate(st, [0, 1], [2.3, 1])})`, opacity: Math.min(1, st * 3)}}>4 VENTAS REALES</div>
        </div>
      )}
      {t >= 50 && <div style={{position: 'absolute', top: 1320, left: 0, right: 0, textAlign: 'center', fontFamily: TXT, fontWeight: 900, fontSize: 46, color: '#fff', opacity: interpolate(t, [50, 58], [0, 1], cl)}}>mira cómo se reparte 👇</div>}
    </AbsoluteFill>
  );
};

export const ItemScene: React.FC<{it: Item; t: number; i: number}> = ({it, t, i}) => {
  const p = sp(t, 0, 14, 170);
  const off = it.chat ? CHAT_LEN : 0;
  const priceOn = t >= 20 + off;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 200, left: 50, display: 'flex', gap: 10}}>
        <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 44, padding: '2px 18px 4px', borderRadius: 8}}>VENTA {i + 1}/{ITEMS.length}</div>
      </div>
      <div style={{position: 'absolute', top: 280, left: 50, right: 50, fontFamily: DISP, fontSize: 92, lineHeight: 1.02, color: '#fff', textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>{it.title}</div>
      <div style={{position: 'absolute', top: 390 + (it.title.length > 24 ? 90 : 0), left: 50, fontFamily: TXT, fontWeight: 800, fontSize: 36, color: '#ddd'}}>{it.sub}</div>
      {it.chat && t < CHAT_LEN && (
        <>
          <div style={{position: 'absolute', left: 120, right: 120, top: it.title.length > 24 ? 560 : 470, maxHeight: 740, borderRadius: 30, overflow: 'hidden', border: '4px solid #fff', boxShadow: glow(RED, 0.9), background: '#efe7de', transform: `translateY(${(1 - p) * 300}px) rotate(${(1 - p) * 5}deg)`, opacity: Math.min(1, p * 2)}}>
            <Img src={S(it.chat)} style={{width: '100%', display: 'block'}} />
          </div>
          <div style={{position: 'absolute', left: 50, right: 50, top: 1360, textAlign: 'center'}}>
            <span style={{display: 'inline-block', background: '#fff', color: BG, fontFamily: TXT, fontWeight: 900, fontSize: 42, padding: '8px 22px', borderRadius: 12, borderLeft: `12px solid ${RED}`}}>💬 Nos escribió por WhatsApp</span>
          </div>
        </>
      )}
      <Sequence from={it.chat ? CHAT_LEN : 0}>
        <div style={{position: 'absolute', left: 90, right: 90, top: it.title.length > 24 ? 560 : 470, height: 820, borderRadius: 28, overflow: 'hidden', border: `4px solid ${RED}`, boxShadow: glow(RED, 0.9), transform: `perspective(1200px) rotateY(${(1 - (it.chat ? sp(t, CHAT_LEN, 14, 170) : p)) * -30}deg) scale(${0.85 + 0.15 * (it.chat ? sp(t, CHAT_LEN, 14, 170) : p)})`}}>
          <OffthreadVideo src={S(it.src)} startFrom={Math.round(it.from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      </Sequence>
      {priceOn && (
        <div style={{position: 'absolute', right: 60, top: 1250, transform: `rotate(-6deg) scale(${interpolate(t - off, [20, 24, 28], [1.8, 0.93, 1], cl)})`}}>
          <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 120, padding: '0 30px 8px', borderRadius: 18, border: '6px solid #fff', boxShadow: '0 14px 40px rgba(0,0,0,0.6)'}}>{clp(it.price)}</div>
        </div>
      )}
      {t >= 40 + off && (
        <div style={{position: 'absolute', left: 50, top: 1480, display: 'inline-flex', alignItems: 'center', gap: 14, background: '#fff', color: BG, fontFamily: TXT, fontWeight: 900, fontSize: 40, padding: '10px 24px', borderRadius: 14, borderLeft: `12px solid ${RED}`, transform: `translateX(${(1 - sp(t, 40 + off, 12, 260)) * -200}px)`}}>
          ✓ {it.chip}
        </div>
      )}
    </AbsoluteFill>
  );
};

const End: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 12, 200);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 230, left: 70, right: 70, borderRadius: 26, overflow: 'hidden', border: `4px solid ${RED}`, boxShadow: glow(RED, 0.9), transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2)}}>
        <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 740, left: 50, right: 50, textAlign: 'center', fontFamily: DISP, fontSize: 96, lineHeight: 1.05, color: '#fff', textTransform: 'uppercase', opacity: interpolate(t, [8, 14], [0, 1], cl)}}>
        ¿Buscas repuesto<br />pa' tu <span style={{background: RED, padding: '0 16px'}}>Suzuki</span>?
      </div>
      <div style={{position: 'absolute', top: 1030, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <div style={{fontFamily: DISP, fontSize: 66, color: '#fff', background: RED, border: '4px solid #fff', borderRadius: 18, padding: '4px 34px 10px', opacity: interpolate(t, [24, 30], [0, 1], cl), boxShadow: glow(RED, 0.7)}}>WhatsApp +56 9 5381 7335</div>
        <div style={{fontFamily: DISP, fontSize: 64, color: BG, background: '#fff', borderRadius: 18, padding: '4px 34px 10px', opacity: interpolate(t, [34, 40], [0, 1], cl)}}>autopartschile.cl</div>
        <div style={{fontFamily: TXT, fontWeight: 900, fontSize: 40, color: '#fff', opacity: interpolate(t, [44, 50], [0, 1], cl)}}>📦 Despachamos a todo Chile</div>
      </div>
    </AbsoluteFill>
  );
};

export const VendimosTodo: React.FC<{vo?: string}> = ({vo}) => {
  const f = useCurrentFrame();
  const cuts = [HOOK, ...ITEMS.map((_, i) => HOOK + (i + 1) * EACH)];
  const cut = Math.min(...cuts.map((c) => Math.abs(f - c)));
  return (
    <AbsoluteFill style={{background: BG}}>
      <Bg f={f} />
      <Sequence from={0} durationInFrames={HOOK}><Hook t={f} /></Sequence>
      {ITEMS.map((it, i) => (
        <Sequence key={i} from={HOOK + i * EACH} durationInFrames={EACH}><ItemScene it={it} t={f - HOOK - i * EACH} i={i} /></Sequence>
      ))}
      <Sequence from={HOOK + ITEMS.length * EACH} durationInFrames={END}><End t={f - HOOK - ITEMS.length * EACH} /></Sequence>
      <TotalBar f={f} />
      {/* corte: barrido diagonal rojo/blanco */}
      {cut < 7 && f > 4 && (
        <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
          {[[RED, 0], ['#fff', 0.2], [RED, 0.32]].map(([c, off], k) => {
            const near = cuts.reduce((a, b) => (Math.abs(f - b) < Math.abs(f - a) ? b : a));
            const pp = interpolate(f - near, [-7, 7], [-1.4, 1.4]);
            return <div key={k} style={{position: 'absolute', top: -600, bottom: -600, width: k === 1 ? 70 : 520, left: 280 + (pp - (off as number)) * 1700, background: c as string, transform: 'rotate(18deg)'}} />;
          })}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />

      {vo && <Audio src={S(vo)} volume={1} />}
      {/* efectos (bajos si hay voz) */}
      <Sequence from={4}><Audio src={S('audio/sfx_billcount.wav')} volume={vo ? 0.45 : 0.85} /></Sequence>
      <Sequence from={32}><Audio src={S('audio/sfx_kaching_real.wav')} volume={vo ? 0.5 : 0.75} /></Sequence>
      <Sequence from={34}><Audio src={S('audio/sfx_impact.wav')} volume={0.4} /></Sequence>
      <Sequence from={40}><Audio src={S('audio/sfx_pa.wav')} volume={vo ? 0.35 : 0.55} /></Sequence>
      {cuts.map((c) => <Sequence key={'w' + c} from={c - 6}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>)}
      {ITEMS.map((_, i) => (
        <React.Fragment key={'i' + i}>
          {ITEMS[i].chat && <Sequence from={HOOK + i * EACH + 4}><Audio src={S('audio/sfx_ding.wav')} volume={0.5} /></Sequence>}
          <Sequence from={HOOK + i * EACH + 20 + (ITEMS[i].chat ? CHAT_LEN : 0)}><Audio src={S('audio/sfx_kaching_real.wav')} volume={vo ? 0.4 : 0.65} /></Sequence>
          <Sequence from={HOOK + i * EACH + 22 + (ITEMS[i].chat ? CHAT_LEN : 0)}><Audio src={S('audio/sfx_coins.wav')} volume={0.3} /></Sequence>
          <Sequence from={HOOK + i * EACH + 40 + (ITEMS[i].chat ? CHAT_LEN : 0)}><Audio src={S('audio/sfx_pop.wav')} volume={0.35} /></Sequence>
        </React.Fragment>
      ))}
      <Sequence from={HOOK + ITEMS.length * EACH + 24}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
