import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

/* Santorini Ventas — anuncio de lujo con fotos reales del inventario
   (grilla de @santorini.ventas, escaladas x4). Negro + dorado como su logo.
   Sin música: el sonido en tendencia lo pone el cliente en la app. */

loadFont({family: 'Cinzel', url: staticFile('fonts/Cinzel.ttf'), weight: '400 900', format: 'truetype'});
loadFont({family: 'Playfair', url: staticFile('fonts/PlayfairItalic.ttf'), weight: '400 900', style: 'italic', format: 'truetype'});

const S = (f: string) => staticFile(f);
const P = (n: number) => S(`santorini/p${String(n).padStart(2, '0')}.jpg`);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GOLD = 'linear-gradient(180deg, #FFF3C4 0%, #E9C766 30%, #C9A13B 55%, #8E6B1A 78%, #E8CF7E 100%)';
const GOLD_LINE = 'linear-gradient(90deg, rgba(212,175,55,0) 0%, #D4AF37 50%, rgba(212,175,55,0) 100%)';
const CINZEL = "'Cinzel', serif";
const PLAY = "'Playfair', serif";

const gold: React.CSSProperties = {backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.8))'};

/* ---- tiempos */
const HOOK = 100;
const ITEM = 38;
const ITEMS: [number, string, string][] = [
  [1, 'DOLCE & GABBANA', 'Zapatillas'],
  [12, 'GUCCI', 'Zapatillas'],
  [3, 'GIUSEPPE ZANOTTI', 'Zapatillas'],
  [4, 'JORDAN', 'Zapatillas'],
  [6, 'NIKE × SUPREME', 'Zapatillas'],
  [8, 'DOLCE & GABBANA', 'Cinturón'],
  [9, 'GIUSEPPE ZANOTTI', 'Cinturón'],
  [11, 'KARL LAGERFELD', 'Zapatillas'],
];
const SHOW = HOOK;
const RING = SHOW + ITEMS.length * ITEM;   // 404
const TRUST = RING + 96;                   // 500
const END = TRUST + 76;                    // 576
export const SANTORINI_TOTAL = END + 120;  // 696 ≈ 23 s

/* ---- polvo dorado */
const Dust: React.FC<{f: number; n?: number}> = ({f, n = 70}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: n}).map((_, i) => {
      const r = (k: string) => random(`d${k}${i}`);
      const sz = 2 + r('s') * 6;
      const y = ((r('y') * 2200 - f * (0.6 + r('v') * 1.6)) % 2200 + 2200) % 2200 - 140;
      const x = r('x') * 1080 + Math.sin(f * 0.02 + r('p') * 6) * 30;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * (0.05 + r('t') * 0.08) + r('o') * 6));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: '#F3D77A', opacity: tw * (0.3 + r('a') * 0.6), boxShadow: `0 0 ${sz * 3}px ${sz}px rgba(233,199,102,0.45)`, filter: r('b') > 0.6 ? 'blur(1.5px)' : undefined}} />;
    })}
  </AbsoluteFill>
);

/* ---- tarjeta con marco dorado, brillo que cruza y reflejo en el piso */
const Card: React.FC<{n: number; w: number; shine?: number; reflect?: boolean; style?: React.CSSProperties}> = ({n, w, shine = -1, reflect = true, style}) => {
  const h = w * 4 / 3;
  const sx = interpolate(shine, [0, 1], [-0.6, 1.4], cl);
  return (
    <div style={{position: 'absolute', width: w, height: h, padding: 5, background: 'linear-gradient(135deg, #FFF0B5, #C9A13B 35%, #7A5A12 60%, #F0D78A)', borderRadius: 10, boxShadow: '0 40px 90px rgba(0,0,0,0.75)', WebkitBoxReflect: reflect ? 'below 18px linear-gradient(transparent 72%, rgba(255,255,255,0.22))' : undefined, ...style} as React.CSSProperties}>
      <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 6}}>
        <Img src={P(n)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(1.05) brightness(1.02)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
        {shine >= 0 && shine <= 1 && (
          <div style={{position: 'absolute', top: '-20%', bottom: '-20%', left: `${sx * 100}%`, width: '35%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,246,214,0.55), rgba(255,255,255,0))', transform: 'skewX(-18deg)', mixBlendMode: 'screen'}} />
        )}
      </div>
    </div>
  );
};

/* ---- 1. gancho: ruleta de marcas + túnel 3D de fotos, golpe a "LUJO 100% ORIGINAL" */
const BRANDS = ['DOLCE & GABBANA', 'GUCCI', 'GIUSEPPE ZANOTTI', 'JORDAN', 'SUPREME', 'KARL LAGERFELD'];
const TUNNEL = [1, 12, 3, 4, 6, 11];
const Hook: React.FC<{f: number}> = ({f}) => {
  const slam = 54;
  const k = spring({frame: f - slam, fps: 30, config: {damping: 11, stiffness: 200, mass: 0.6}});
  const flash = f >= slam ? interpolate(f, [slam, slam + 6], [0.85, 0], cl) : 0;
  const shake = f >= slam && f < slam + 8 ? Math.sin(f * 7) * (slam + 8 - f) * 2.2 : 0;
  return (
    <AbsoluteFill style={{background: '#050505', transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      {f >= slam && (
        <AbsoluteFill>
          <Img src={P(12)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.32) saturate(0.8)', transform: `scale(${1.3 + (f - slam) * 0.002})`}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{perspective: 1100}}>
        {f < slam + 4 && TUNNEL.map((n, i) => {
          const t = f - i * 8 + 10;
          if (t < 0 || t > 24) return null;
          const z = interpolate(t, [0, 24], [-2600, 700]);
          const side = i % 2 ? 1 : -1;
          return <Card key={i} n={n} w={560} reflect={false} style={{left: 260 + side * 250, top: 560 + (i % 3 - 1) * 120, transform: `translateZ(${z}px) rotateY(${side * -22}deg) rotateZ(${side * 4}deg)`, opacity: interpolate(t, [0, 4, 20, 24], [0, 1, 1, 0], cl)}} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)'}} />
      <Dust f={f} />
      {f < slam && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{position: 'absolute', left: -100, right: -100, top: 760, height: 400, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 70%)'}} />
          <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: BRANDS[Math.max(0, Math.min(5, Math.floor((f - 4) / 8)))].length > 12 ? 70 : 100, letterSpacing: 5, textAlign: 'center', whiteSpace: 'nowrap', transform: `scale(${interpolate(((f - 4) % 8 + 8) % 8, [0, 2, 8], [1.25, 1, 0.97], cl)})`}}>{BRANDS[Math.max(0, Math.min(5, Math.floor((f - 4) / 8)))]}</div>
        </AbsoluteFill>
      )}
      {f >= slam && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <div style={{...gold, fontFamily: CINZEL, fontWeight: 900, fontSize: 250, lineHeight: 1, letterSpacing: 18, transform: `scale(${interpolate(k, [0, 1], [2.4, 1])})`, opacity: Math.min(1, k * 2)}}>LUJO</div>
          <div style={{width: interpolate(f, [slam + 6, slam + 20], [0, 760], cl), height: 3, background: GOLD_LINE, margin: '26px 0'}} />
          <div style={{fontFamily: CINZEL, fontWeight: 700, fontSize: 74, letterSpacing: 10, color: '#fff', opacity: interpolate(f, [slam + 8, slam + 16], [0, 1], cl), transform: `translateY(${interpolate(f, [slam + 8, slam + 18], [30, 0], cl)}px)`}}>100% ORIGINAL</div>
          <div style={{fontFamily: PLAY, fontStyle: 'italic', fontSize: 64, color: '#E9C766', marginTop: 18, opacity: interpolate(f, [slam + 16, slam + 26], [0, 1], cl)}}>ahora en Chile</div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#FFF3C4', opacity: flash}} />
    </AbsoluteFill>
  );
};

/* ---- 2. vitrina: cada pieza gira en 3D con su marca */
const Show: React.FC<{f: number}> = ({f}) => {
  const i = Math.min(ITEMS.length - 1, Math.floor(f / ITEM));
  const t = f - i * ITEM;
  const [n, brand, kind] = ITEMS[i];
  const dir = i % 2 ? -1 : 1;
  const inK = spring({frame: t, fps: 30, config: {damping: 14, stiffness: 120, mass: 0.7}});
  const out = interpolate(t, [ITEM - 5, ITEM], [0, 1], cl);
  const ry = interpolate(inK, [0, 1], [dir * 55, 0]) + interpolate(t, [0, ITEM], [dir * -6, dir * 6]) - out * dir * 55;
  const x = interpolate(inK, [0, 1], [dir * 380, 0]) - out * dir * 520;
  const z = interpolate(inK, [0, 1], [-700, 0]) - out * 500;
  const brandK = interpolate(t, [5, 14], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <Img src={P(n)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.3) saturate(0.9)', transform: 'scale(1.35)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(212,175,55,0.16) 0%, rgba(0,0,0,0) 45%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)'}} />
      <Dust f={f + 200} n={50} />
      <AbsoluteFill style={{perspective: 1500}}>
        <Card n={n} w={780} shine={interpolate(t, [10, 26], [0, 1])} style={{left: 150, top: 300, transform: `translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${1 + t * 0.0012})`}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 1520, left: 0, right: 0, textAlign: 'center', opacity: 1 - out}}>
        <div style={{display: 'inline-block', clipPath: `inset(0 ${(1 - brandK) * 50}% 0 ${(1 - brandK) * 50}%)`}}>
          <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: brand.length > 14 ? 74 : 92, letterSpacing: 7, whiteSpace: 'nowrap'}}>{brand}</div>
        </div>
        <div style={{width: 520 * brandK, height: 2, background: GOLD_LINE, margin: '18px auto'}} />
        <div style={{fontFamily: PLAY, fontStyle: 'italic', fontSize: 56, color: '#fff', opacity: interpolate(t, [10, 18], [0, 0.92], cl)}}>{kind}</div>
      </div>
      <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: CINZEL, fontWeight: 600, fontSize: 34, letterSpacing: 12, color: 'rgba(233,199,102,0.85)'}}>{String(i + 1).padStart(2, '0')} / {String(ITEMS.length).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

/* ---- 3. carrusel 3D con todo el inventario */
const Ring: React.FC<{f: number}> = ({f}) => {
  const enter = spring({frame: f, fps: 30, config: {damping: 16, stiffness: 90}});
  const rot = -f * 1.9 - 40 + (1 - enter) * 120;
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(212,175,55,0.22) 0%, rgba(0,0,0,0) 50%)'}} />
      <Dust f={f + 400} />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', left: 540, top: 1060, transformStyle: 'preserve-3d', transform: `translateZ(${interpolate(enter, [0, 1], [-3600, -1500])}px) rotateX(-13deg) rotateY(${rot}deg)`}}>
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: -230, top: -307, width: 460, height: 614, transformStyle: 'preserve-3d', transform: `rotateY(${i * 30}deg) translateZ(880px)`}}>
              <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}><Card n={i + 1} w={460} reflect={false} /></div>
              {/* dorso: monograma dorado, para que se lea el anillo completo */}
              <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #1a1408, #070604)', border: '4px solid #8E6B1A', borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <div style={{...gold, fontFamily: CINZEL, fontWeight: 900, fontSize: 220, opacity: 0.8}}>S</div>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f, [8, 18], [0, 1], cl)}}>
        <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: 60, letterSpacing: 8}}>ZAPATILLAS</div>
        <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: 60, letterSpacing: 8}}>CINTURONES</div>
        <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: 60, letterSpacing: 8}}>ACCESORIOS</div>
      </div>
      <div style={{position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', fontFamily: PLAY, fontStyle: 'italic', fontSize: 62, color: '#fff', opacity: interpolate(f, [24, 34], [0, 1], cl)}}>Venta y compra</div>
    </AbsoluteFill>
  );
};

/* ---- 4. confianza: originales + entregas */
const Icon: React.FC<{d: string}> = ({d}) => (
  <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#E9C766" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d.split('|').map((p, i) => <path key={i} d={p} />)}</svg>
);
const TRUCK = 'M1 6h13v10H1z|M14 10h4l3 3v3h-7z|M5.5 19a1.8 1.8 0 1 0 0-.01|M17.5 19a1.8 1.8 0 1 0 0-.01';
const HAND = 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z';
const SEAL = 'M12 2l2.4 2.2 3.2-.4.9 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.8-1.6 1.2-3-1.2-3 2.8-1.6.9-3.1 3.2.4z|M8.5 12l2.5 2.5 4.5-5';
const Trust: React.FC<{f: number}> = ({f}) => {
  const rows: [string, string][] = [[SEAL, 'Calidad · Estilo · Exclusividad'], [HAND, 'Entregas presenciales'], [TRUCK, 'Envíos a todo Chile']];
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <AbsoluteFill style={{transformOrigin: '82% 30%', transform: `scale(${interpolate(f, [0, 76], [1.05, 1.5])})`}}>
        <Img src={P(4)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) contrast(1.05)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,5,5,0.2) 0%, rgba(5,5,5,0.55) 45%, rgba(5,5,5,0.95) 75%)'}} />
      <Dust f={f + 600} n={40} />
      <div style={{position: 'absolute', top: 960, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{...gold, fontFamily: CINZEL, fontWeight: 900, fontSize: 110, letterSpacing: 8, transform: `scale(${interpolate(spring({frame: f, fps: 30, config: {damping: 12}}), [0, 1], [1.4, 1])})`}}>ORIGINALES</div>
        <div style={{fontFamily: CINZEL, fontWeight: 600, fontSize: 44, letterSpacing: 10, color: '#fff', marginTop: 6, opacity: interpolate(f, [6, 14], [0, 1], cl)}}>EE.UU. · EUROPA</div>
      </div>
      <div style={{position: 'absolute', top: 1300, left: 150, right: 100}}>
        {rows.map(([d, txt], i) => {
          const a = 14 + i * 9;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, marginBottom: 34, opacity: interpolate(f, [a, a + 7], [0, 1], cl), transform: `translateX(${interpolate(f, [a, a + 9], [-60, 0], cl)}px)`}}>
              <Icon d={d} />
              <span style={{fontFamily: PLAY, fontStyle: 'italic', fontSize: 56, color: '#fff'}}>{txt}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---- 5. cierre: monograma S dorado que gira y arma la marca */
const End: React.FC<{f: number}> = ({f}) => {
  const k = spring({frame: f, fps: 30, config: {damping: 13, stiffness: 70, mass: 1}});
  const shine = interpolate(f, [34, 52], [-0.4, 1.4], cl);
  const word = interpolate(f, [18, 40], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 36%, rgba(212,175,55,${0.28 * k}) 0%, rgba(0,0,0,0) 42%)`}} />
      <Dust f={f + 800} n={90} />
      <AbsoluteFill style={{perspective: 1200}}>
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, height: 470, display: 'flex', justifyContent: 'center', transform: `rotateY(${interpolate(k, [0, 1], [540, 0])}deg) scale(${interpolate(k, [0, 1], [0.4, 1])})`}}>
          <div style={{position: 'relative', width: 440, height: 440, borderRadius: '50%', border: '5px solid #C9A13B', boxShadow: '0 0 60px rgba(212,175,55,0.35), inset 0 0 40px rgba(212,175,55,0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
            <div style={{...gold, fontFamily: CINZEL, fontWeight: 900, fontSize: 330, lineHeight: 1, marginTop: -20}}>S</div>
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${shine * 100}%`, width: '30%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,248,220,0.6), rgba(255,255,255,0))', transform: 'skewX(-20deg)', mixBlendMode: 'screen'}} />
          </div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 830, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{...gold, fontFamily: CINZEL, fontWeight: 700, fontSize: 118, letterSpacing: interpolate(word, [0, 1], [34, 14]), opacity: word}}>SANTORINI</div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 4, opacity: interpolate(f, [30, 42], [0, 1], cl)}}>
          <div style={{width: 150, height: 2, background: '#C9A13B'}} />
          <span style={{fontFamily: CINZEL, fontWeight: 600, fontSize: 48, letterSpacing: 18, color: '#fff'}}>VENTAS</span>
          <div style={{width: 150, height: 2, background: '#C9A13B'}} />
        </div>
        <div style={{fontFamily: CINZEL, fontWeight: 600, fontSize: 34, letterSpacing: 8, color: 'rgba(233,199,102,0.9)', marginTop: 30, opacity: interpolate(f, [40, 50], [0, 1], cl)}}>ROPA Y ACCESORIOS DE LUJO</div>
      </div>
      <div style={{position: 'absolute', top: 1340, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f, [54, 64], [0, 1], cl), transform: `translateY(${interpolate(f, [54, 66], [40, 0], cl)}px)`}}>
        <div style={{fontFamily: PLAY, fontStyle: 'italic', fontSize: 62, color: '#fff'}}>Encuentra tu próxima pieza</div>
        <div style={{display: 'inline-block', marginTop: 40, padding: '20px 56px 22px', border: '3px solid #D4AF37', borderRadius: 60, fontFamily: CINZEL, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: '#F3DC8A', background: 'rgba(212,175,55,0.08)', boxShadow: `0 0 ${20 + Math.sin(f * 0.15) * 14}px rgba(212,175,55,0.35)`}}>ESCRÍBENOS POR DM</div>
        <div style={{fontFamily: CINZEL, fontWeight: 600, fontSize: 42, letterSpacing: 4, color: '#fff', marginTop: 40, opacity: 0.9}}>@santorini.ventas</div>
      </div>
    </AbsoluteFill>
  );
};

type Sfx = [number, string, number, number?];
const SFX: Sfx[] = [
  [0, 'sfx_whoosh', 0.7], [0, 'sfx_riser', 0.35, 54],
  ...BRANDS.map((_, i) => [4 + i * 8, 'sfx_tick', 0.55] as Sfx),
  [54, 'sfx_impact', 0.9], [54, 'sfx_sub', 0.8, 40], [62, 'sfx_sparkle', 0.4],
  ...ITEMS.map((_, i) => [SHOW + i * ITEM - 2, 'sfx_whip', 0.5] as Sfx),
  ...ITEMS.map((_, i) => [SHOW + i * ITEM + 10, 'sfx_sparkle', 0.22] as Sfx),
  [RING - 26, 'sfx_riser', 0.35, 26], [RING, 'sfx_whoosh', 0.7], [RING + 2, 'sfx_sub', 0.5, 30],
  [TRUST, 'sfx_impact_soft', 0.8], ...[14, 23, 32].map((a) => [TRUST + a, 'sfx_pop', 0.4] as Sfx),
  [END, 'sfx_whoosh', 0.6], [END + 10, 'sfx_sub', 0.7, 40], [END + 34, 'sfx_sparkle', 0.5], [END + 54, 'sfx_ding', 0.35],
];

export const Santorini: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      {f < SHOW && <Hook f={f} />}
      {f >= SHOW && f < RING && <Show f={f - SHOW} />}
      {f >= RING && f < TRUST && <Ring f={f - RING} />}
      {f >= TRUST && f < END && <Trust f={f - TRUST} />}
      {f >= END && <End f={f - END} />}
      {/* grano fino de película */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />
      {SFX.map(([at, n, v, d], k) => (
        <Sequence key={k} from={at} durationInFrames={d ?? 60}>
          <Audio src={S(`audio/${n}.wav`)} volume={(x) => (d ? v * interpolate(x, [d - 5, d], [1, 0], cl) : v)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
