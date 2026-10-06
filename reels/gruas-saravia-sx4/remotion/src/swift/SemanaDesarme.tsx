import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* "Una semana en mi desarmaduría": vlog orgánico con material real del
   2 al 6 de octubre de 2026 (por eso dice "semana" y no "un día").
   Precios solo los confirmados por el dueño: block Mastervan $119.000
   (factura N°164) y motor Swift $1.078.990. Caras, patentes y nombres
   ya vienen tapados en public/swift (*_anon) o los clips no los muestran.
   Colores de marca: rojo #D10B0C, negro y blanco, con las franjas
   diagonales del logo como transición. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const BLACK = '#0A0A0A';
const DISP = "'Anton', 'Montserrat', sans-serif";
const TXT = "'Montserrat', sans-serif";
const sp = (f: number, d = 0, damping = 13, stiffness = 220) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});

type Seg = {src: string; from: number; dur: number; top?: string; caption: string; sub?: string; price?: string; tag?: string};
const SEGS: Seg[] = [
  {src: 'swift/vitara_local_anon.mp4', from: 0, dur: 38, tag: 'LLEGADA', caption: 'Entra un Vitara a desarme', sub: 'directo a nuestro local'},
  {src: 'swift/mv_desarme.mp4', from: 0.2, dur: 48, tag: 'DESARME', caption: 'Desarmamos una Mastervan', sub: 'pieza por pieza'},
  {src: 'swift/mv_motor.mp4', from: 0.2, dur: 36, tag: 'DESARME', caption: 'Sale el motor 💪'},
  {src: 'swift/mv_carga.mp4', from: 0.8, dur: 54, tag: 'CLIENTE', caption: 'Un cliente se lleva el block', sub: 'Mastervan G13B · con factura', price: '$119.000'},
  {src: 'swift/mostrador_anon.mp4', from: 0.6, dur: 42, tag: 'COTIZÓ EN LA WEB', caption: 'Otro cliente nos cotizó en la web', sub: 'y vino a ver el motor en persona'},
  {src: 'swift/entrega_anon.mp4', from: 0.3, dur: 54, tag: 'CLIENTE', caption: 'Se llevó el motor Swift 1.2', sub: 'despachado a su automotora', price: '$1.078.990'},
  {src: 'swift/vitara_portalon.mp4', from: 0.6, dur: 48, tag: 'CLIENTE', caption: 'Uno de la web pidió el portalón', sub: '+ refuerzo y parachoques'},
  {src: 'swift/vitara_carga.mp4', from: 1.0, dur: 36, tag: 'DESPACHO', caption: 'Y mañana sale un corte', sub: 'rumbo a Viña del Mar 📦'},
  {src: 'swift/entrega_anon.mp4', from: 5.5, dur: 33, tag: 'ENTREGA', caption: 'Entregado ✅'},
];
const HOOK = 60;
const END = 96;
const STARTS = (() => {
  let x = HOOK;
  return SEGS.map((s) => {
    const a = x;
    x += s.dur;
    return a;
  });
})();
const END0 = STARTS[STARTS.length - 1] + SEGS[SEGS.length - 1].dur;
export const SEMANA_TOTAL = END0 + END;
const CUTS = [HOOK, ...STARTS.slice(1), END0];

/* transición: franjas diagonales rojo/negro/blanco como el logo */
const Slash: React.FC<{t: number}> = ({t}) => {
  if (t < -7 || t > 7) return null;
  const p = interpolate(t, [-7, 7], [-1.4, 1.4]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {[[RED, 0], [BLACK, 0.18], ['#fff', 0.3], [RED, 0.42]].map(([c, off], i) => (
        <div key={i} style={{position: 'absolute', top: -600, bottom: -600, width: i === 2 ? 70 : 520, left: 540 - 260 + (p - (off as number)) * 1700, background: c as string, transform: 'rotate(18deg)'}} />
      ))}
    </AbsoluteFill>
  );
};

/* caja de texto con borde rojo (marca) */
const Box: React.FC<{t: number; children: React.ReactNode; size?: number; dark?: boolean}> = ({t, children, size = 54, dark}) => {
  const p = sp(t, 0, 14, 320);
  return (
    <div style={{display: 'inline-block', background: dark ? BLACK : '#fff', color: dark ? '#fff' : '#111', fontFamily: TXT, fontWeight: 900, fontSize: size, lineHeight: 1.15, padding: '8px 24px', borderRadius: 12, borderLeft: `12px solid ${RED}`, transform: `scale(${0.9 + 0.1 * p}) translateY(${(1 - p) * 20}px)`, opacity: Math.min(1, p * 3), boxShadow: '0 8px 24px rgba(0,0,0,0.35)'}}>
      {children}
    </div>
  );
};

const Clip: React.FC<{seg: Seg; t: number; i: number}> = ({seg, t, i}) => {
  const zoom = interpolate(t, [0, 6], [1.12, 1], cl) + t * 0.0012;
  const clientN = SEGS.slice(0, i + 1).filter((s) => s.tag === 'CLIENTE').length;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <OffthreadVideo src={S(seg.src)} startFrom={Math.round(seg.from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)'}} />
      {/* etiqueta de capítulo */}
      <div style={{position: 'absolute', top: 120, left: 50, display: 'flex', gap: 10, transform: `translateX(${(1 - sp(t, 0, 14, 260)) * -300}px)`}}>
        <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 46, padding: '2px 18px 4px', borderRadius: 8}}>{seg.tag}</div>
        {seg.tag === 'CLIENTE' && <div style={{background: '#fff', color: BLACK, fontFamily: DISP, fontSize: 46, padding: '2px 18px 4px', borderRadius: 8}}>#{clientN}</div>}
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 1180, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10}}>
        <Box t={t - 2}>{seg.caption}</Box>
        {seg.sub && t >= 8 && <Box t={t - 8} size={38} dark>{seg.sub}</Box>}
      </div>
      {seg.price && t >= 12 && (
        <div style={{position: 'absolute', right: 50, top: 900, transform: `rotate(-6deg) scale(${interpolate(t, [12, 16, 20], [1.8, 0.92, 1], cl)})`}}>
          <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 112, padding: '0 28px 6px', borderRadius: 16, border: '6px solid #fff', boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>{seg.price}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* gancho: 4 cortes rápidos + título */
const FLASH = [
  {src: 'swift/mv_motor.mp4', from: 0.5},
  {src: 'swift/entrega_anon.mp4', from: 1.0},
  {src: 'swift/vitara_portalon.mp4', from: 1.2},
  {src: 'swift/mv_carga.mp4', from: 1.2},
];
const Hook: React.FC<{t: number}> = ({t}) => {
  const k = Math.min(FLASH.length - 1, Math.floor(t / 15));
  const title = sp(t, 2, 11, 260);
  return (
    <AbsoluteFill>
      {FLASH.map((f, i) => (
        <Sequence key={i} from={i * 15} durationInFrames={15}>
          <AbsoluteFill style={{transform: `scale(${1.15 - ((t - i * 15) / 15) * 0.1})`}}>
            <OffthreadVideo src={S(f.src)} startFrom={Math.round(f.from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.35)'}} />
      <AbsoluteFill style={{background: '#fff', opacity: t % 15 < 2 && t > 0 ? 0.5 : 0}} />
      <div style={{position: 'absolute', left: 50, right: 50, top: 560, transform: `scale(${interpolate(title, [0, 1], [1.4, 1])})`, opacity: Math.min(1, title * 3), transformOrigin: 'left center'}}>
        <div style={{display: 'inline-block', background: BLACK, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 58, padding: '6px 20px', borderRadius: 10}}>UNA SEMANA EN MI</div>
        <div style={{marginTop: 10, fontFamily: DISP, fontSize: 132, lineHeight: 1, color: '#fff', textTransform: 'uppercase'}}>
          <span style={{background: RED, padding: '0 18px 6px', display: 'inline-block'}}>Desarmaduría</span>
        </div>
      </div>
      {t >= 24 && <div style={{position: 'absolute', left: 50, top: 1030}}><Box t={t - 24} size={48}>así se ve por dentro 👀</Box></div>}
      <div style={{position: 'absolute', top: 120, right: 50, background: RED, color: '#fff', fontFamily: DISP, fontSize: 44, padding: '2px 16px 4px', borderRadius: 8}}>{k + 1}/4</div>
    </AbsoluteFill>
  );
};

const End: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 12, 200);
  return (
    <AbsoluteFill>
      <OffthreadVideo src={S('atlas/local.mp4')} startFrom={30} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.85) 60%)'}} />
      <div style={{position: 'absolute', top: 220, left: 70, right: 70, borderRadius: 22, overflow: 'hidden', borderBottom: `10px solid ${RED}`, transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2), boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
        <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 860, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14}}>
        {t >= 10 && <Box t={t - 10} size={64}>¿Qué repuesto buscas? 👇</Box>}
        {t >= 22 && <Box t={t - 22} size={44} dark>Cotiza en autopartschile.cl</Box>}
        {t >= 32 && <Box t={t - 32} size={44} dark>WhatsApp +56 9 5381 7335</Box>}
        {t >= 42 && <Box t={t - 42} size={40}>📍 Av. Lo Blanco, La Pintana · Despacho a todo Chile</Box>}
      </div>
    </AbsoluteFill>
  );
};

export const SemanaDesarme: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <Sequence from={0} durationInFrames={HOOK}><Hook t={f} /></Sequence>
      {SEGS.map((s, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={s.dur}><Clip seg={s} t={f - STARTS[i]} i={i} /></Sequence>
      ))}
      <Sequence from={END0} durationInFrames={END}><End t={f - END0} /></Sequence>
      {CUTS.map((c) => <Slash key={c} t={f - c} />)}

      {/* sonido */}
      {FLASH.map((_, i) => <Sequence key={'h' + i} from={i * 15}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>)}
      <Sequence from={2}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.45} /></Sequence>
      <Sequence from={24}><Audio src={S('audio/sfx_pop.wav')} volume={0.45} /></Sequence>
      {CUTS.map((c) => <Sequence key={'w' + c} from={c - 6}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>)}
      {SEGS.map((s, i) => (
        <React.Fragment key={'s' + i}>
          <Sequence from={STARTS[i] + 2}><Audio src={S('audio/sfx_pop.wav')} volume={0.3} /></Sequence>
          {s.price && <Sequence from={STARTS[i] + 12}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.65} /></Sequence>}
          {s.price && <Sequence from={STARTS[i] + 14}><Audio src={S('audio/sfx_coins.wav')} volume={0.35} /></Sequence>}
          {s.caption.includes('✅') && <Sequence from={STARTS[i] + 2}><Audio src={S('audio/sfx_correct.wav')} volume={0.4} /></Sequence>}
        </React.Fragment>
      ))}
      <Sequence from={END0 + 10}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};

/* ---------- CARRUSEL (1080x1350, una imagen por slide) ---------- */
type Slide = {img: string; kicker: string; title: React.ReactNode; sub?: string; price?: string; n: number};
const SLIDES: Slide[] = [
  {img: 'swift/c_hook.jpg', kicker: 'DESARMADURÍA SARAVIA', title: <>Una semana en mi <span style={{background: RED, padding: '0 12px', display: 'inline-block', lineHeight: 1}}>desarmaduría</span></>, sub: 'Desliza → 3 ventas reales', n: 1},
  {img: 'swift/c_mvdesarme.jpg', kicker: 'PASO 1 · DESARME', title: <>Desarmamos una <span style={{color: '#FF3B3B'}}>Mastervan</span></>, sub: 'Pieza por pieza, para publicarlas en la web', n: 2},
  {img: 'swift/c_mvblock.jpg', kicker: 'CLIENTE #1', title: <>Se llevó el block G13B</>, sub: 'Con factura', price: '$119.000', n: 3},
  {img: 'swift/c_swift.jpg', kicker: 'CLIENTE #2', title: <>Motor Suzuki Swift 1.2</>, sub: 'Cotizó en la web · despacho a su automotora', price: '$1.078.990', n: 4},
  {img: 'swift/c_portalon.jpg', kicker: 'CLIENTE #3', title: <>Portalón + parachoques del <span style={{color: '#FF3B3B'}}>Vitara</span></>, sub: 'Nos escribió desde autopartschile.cl', n: 5},
  {img: 'swift/c_vitara.jpg', kicker: 'DESPACHO A REGIÓN', title: <>Y un corte rumbo a <span style={{color: '#FF3B3B'}}>Viña del Mar</span> 📦</>, sub: 'Despachamos a todo Chile', n: 6},
  {img: 'swift/c_local.jpg', kicker: '¿QUÉ REPUESTO BUSCAS?', title: <>Escríbenos y te mandamos <span style={{background: RED, padding: '0 12px', display: 'inline-block', lineHeight: 1}}>foto y precio</span></>, sub: 'WhatsApp +56 9 5381 7335 · autopartschile.cl', n: 7},
];
export const SLIDE_N = SLIDES.length;

export const Carrusel: React.FC<{i: number}> = ({i}) => {
  const s = SLIDES[i];
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <Img src={S(s.img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0) 28%, rgba(10,10,10,0.7) 55%, rgba(10,10,10,0.97) 100%)'}} />
      {/* franjas del logo */}
      <div style={{position: 'absolute', top: -40, right: -120, width: 380, height: 60, background: RED, transform: 'rotate(-35deg)'}} />
      <div style={{position: 'absolute', top: 40, right: -140, width: 380, height: 18, background: '#fff', transform: 'rotate(-35deg)'}} />
      <div style={{position: 'absolute', bottom: -30, left: -120, width: 380, height: 50, background: RED, transform: 'rotate(-35deg)'}} />
      <div style={{position: 'absolute', top: 44, left: 50, width: 300, borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.4)'}}>
        <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 50, right: 60, background: BLACK, color: '#fff', fontFamily: DISP, fontSize: 40, padding: '2px 16px 4px', borderRadius: 8, border: `3px solid ${RED}`}}>{s.n}/{SLIDE_N}</div>
      {s.price && (
        <div style={{position: 'absolute', right: 50, top: 640, transform: 'rotate(-6deg)', background: RED, color: '#fff', fontFamily: DISP, fontSize: 110, padding: '0 28px 6px', borderRadius: 16, border: '6px solid #fff', boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>{s.price}</div>
      )}
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 90}}>
        <div style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: TXT, fontWeight: 900, fontSize: 30, letterSpacing: '0.12em', padding: '6px 16px', borderRadius: 8}}>{s.kicker}</div>
        <div style={{marginTop: 14, fontFamily: DISP, fontSize: 100, lineHeight: 1.12, color: '#fff', textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>{s.title}</div>
        {s.sub && <div style={{marginTop: 18, fontFamily: TXT, fontWeight: 700, fontSize: 38, color: '#eee'}}>{s.sub}</div>}
      </div>
      {s.n < SLIDE_N && <div style={{position: 'absolute', right: 60, bottom: 40, fontFamily: TXT, fontWeight: 900, fontSize: 34, color: '#fff'}}>desliza →</div>}
    </AbsoluteFill>
  );
};
