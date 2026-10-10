import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {GRADE} from './Fx';

/* Video personal (redes propias y de la empresa), en primera persona:
   otro día — Mastervan: diferencial trasero + paquete de resortes + capot ($420.000);
   hoy — ramal Hyundai Verna en el mostrador ($240.000), piolas + varilla + lips
   SX4 ($210.000) y la compra del Ciaz gris (me pasaron a buscar, notaría,
   grúa) que se arma con el Ciaz blanco en desarme.
   Estilo orgánico (rótulos tipo TikTok) con animaciones: palabras que saltan,
   lista con checks, contador de ventas, sello y golpe de zoom en cada corte.
   Sin voz ni música (la pone el dueño). Caras y patente pixeladas. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const TXT = "'Montserrat', sans-serif";
const DISP = "'Anton', sans-serif";
export const MISDIAS_TOTAL = 890;

const pop = (f: number, at: number, d = 12) => spring({frame: f - at, fps: 30, config: {damping: d, stiffness: 240, mass: 0.5}});

// [fuente, inicio, largo, segundo inicial del clip, origen del zoom]
type Clip = [string, number, number, number, string];
const CLIPS: Clip[] = [
  ['img:swift/sem_ciaz.jpg', 0, 75, 0, '35% 50%'],
  ['img:swift/sem_ramal.jpg', 75, 75, 0, '50% 55%'],
  ['swift/sem_mostrador_anon.mp4', 150, 50, 0, '50% 50%'],
  ['img:swift/sem_piolas.jpg', 200, 90, 0, '45% 60%'],
  ['swift/sem_auto_anon.mp4', 405, 67, 0, '50% 50%'],
  ['swift/sem_transfer.mp4', 472, 148, 0, '50% 50%'],
  ['img:swift/sem_ciaz.jpg', 620, 90, 0, '40% 48%'],
];

/* rótulo estilo TikTok: caja blanca o negra, esquinas redondeadas, entra con resorte */
const Tag: React.FC<{f: number; at: number; until: number; top: number; dark?: boolean; red?: boolean; size?: number; children: React.ReactNode}> = ({f, at, until, top, dark, red, size = 54, children}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at);
  const out = interpolate(f, [until - 5, until], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', transform: `scale(${k})`, opacity: out}}>
      <span style={{display: 'inline-block', background: red ? RED : dark ? 'rgba(12,12,12,0.86)' : '#fff', color: red || dark ? '#fff' : '#111', fontFamily: TXT, fontWeight: 900, fontSize: size, lineHeight: 1.2, padding: '10px 26px 12px', borderRadius: 18, boxShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>{children}</span>
    </div>
  );
};

/* titular palabra por palabra */
const Words: React.FC<{f: number; at: number; until: number; top: number; txt: string; size?: number; hot?: string[]}> = ({f, at, until, top, txt, size = 92, hot = []}) => {
  if (f < at || f >= until) return null;
  const ws = txt.split(' ');
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', lineHeight: 1.05}}>
      {ws.map((w, i) => {
        const t = at + i * 3;
        if (f < t) return null;
        const k = interpolate(f - t, [0, 3, 7], [1.6, 0.94, 1], cl);
        return <span key={i} style={{display: 'inline-block', margin: '0 12px', fontFamily: DISP, fontSize: size, color: hot.includes(w) ? '#FF2A2A' : '#fff', transform: `scale(${k})`, textShadow: '0 6px 22px rgba(0,0,0,0.85), 0 0 3px #000'}}>{w}</span>;
      })}
    </div>
  );
};

/* lista con checks */
const Check: React.FC<{f: number; at: number; until: number; top: number; items: string[]}> = ({f, at, until, top, items}) => {
  if (f < at || f >= until) return null;
  return (
    <div style={{position: 'absolute', top, left: 70, display: 'flex', flexDirection: 'column', gap: 14}}>
      {items.map((it, i) => {
        const t = at + i * 12;
        if (f < t) return null;
        const k = pop(f, t, 13);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${(1 - k) * -500}px)`}}>
            <span style={{width: 62, height: 62, borderRadius: 31, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(f, t + 4, 9)})`, boxShadow: '0 6px 16px rgba(0,0,0,0.45)'}}>
              <svg width={38} height={38} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span style={{background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 50, padding: '6px 22px 8px', borderRadius: 14, boxShadow: '0 8px 22px rgba(0,0,0,0.35)'}}>{it}</span>
          </div>
        );
      })}
    </div>
  );
};

const Price: React.FC<{f: number; at: number; until: number; top: number; txt: string}> = ({f, at, until, top, txt}) => {
  if (f < at || f >= until) return null;
  const k = interpolate(f - at, [0, 3, 8], [1.8, 0.94, 1], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${k}) rotate(-3deg)`}}>
      <span style={{display: 'inline-block', background: '#fff', borderRadius: 22, padding: '6px 34px 12px', boxShadow: '0 18px 40px rgba(0,0,0,0.5)', border: `6px solid ${RED}`}}>
        <span style={{fontFamily: DISP, fontSize: 120, color: RED}}>{txt}</span>
      </span>
    </div>
  );
};

const Stamp: React.FC<{f: number; at: number; until: number; top: number; txt: string}> = ({f, at, until, top, txt}) => {
  if (f < at || f >= until) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${interpolate(f - at, [0, 3, 8], [2.3, 0.92, 1], cl)})`, opacity: interpolate(f - at, [0, 2], [0, 1], cl)}}>
      <span style={{display: 'inline-block', border: '7px solid #fff', borderRadius: 14, padding: '0 26px 6px', fontFamily: DISP, fontSize: 96, color: '#fff', background: 'rgba(209,11,12,0.9)', letterSpacing: 3}}>{txt}</span>
    </div>
  );
};

/* contador de ventas (arriba a la derecha) */
const SALES = [165, 275, 385];
const Counter: React.FC<{f: number}> = ({f}) => {
  if (f < 160 || f >= 710 || (f >= 290 && f < 405)) return null;
  const n = SALES.filter((s) => f >= s).length;
  const last = [...SALES].reverse().find((s) => f >= s);
  const b = last !== undefined && f - last < 10 ? interpolate(f - last, [0, 3, 10], [1.45, 0.95, 1], cl) : 1;
  return (
    <div style={{position: 'absolute', top: 172, right: 40, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(12,12,12,0.85)', borderRadius: 40, padding: '8px 20px', transform: `scale(${b})`}}>
      <span style={{fontFamily: TXT, fontWeight: 900, fontSize: 34, color: '#fff'}}>VENTAS</span>
      <span style={{fontFamily: DISP, fontSize: 48, color: '#FF2A2A'}}>{n}</span>
    </div>
  );
};

export const MisDias: React.FC = () => {
  const f = useCurrentFrame();
  const cut = CLIPS.find(([, at]) => f >= at && f < at + 6 && at > 0);
  const flash = CLIPS.some(([, at]) => f === at && at > 0) ? 0.3 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {CLIPS.map(([src, at, dur, st, origin], i) => {
        const punch = interpolate(f - at, [0, 6], [1.16, 1.04], cl);
        const z = punch + interpolate(f - at, [0, dur], [0, 0.08], cl);
        return (
          <Sequence key={i} from={at} durationInFrames={dur}>
            <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: origin}}>
              {src.startsWith('img:')
                ? <Img src={S(src.slice(4))} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
                : <OffthreadVideo src={S(src)} muted startFrom={Math.round(st * 30)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* Ciaz blanco (desarme) + gris (comprado) */}
      {f >= 710 && f < 800 && (
        <AbsoluteFill style={{background: '#000'}}>
          {[['swift/sem_ciaz_blanco.jpg', 0, -1, '50% 60%'], ['swift/sem_ciaz.jpg', 960, 1, '35% 50%']].map(([src, y, dir, org], i) => (
            <div key={i} style={{position: 'absolute', left: 0, top: y as number, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - pop(f, 712 + i * 4)) * 1080 * (dir as number)}px)`}}>
              <Img src={S(src as string)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: org as string, filter: GRADE, transform: `scale(${interpolate(f, [585, 675], [1.05, 1.14], cl)})`}} />
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5) 100%)'}} />
      {f < 800 && <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 370, top: 50, width: 340, opacity: 0.95, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />}
      <Counter f={f} />

      {/* gancho */}
      <Words f={f} at={2} until={75} top={330} txt="OTRO DÍA EN MI EMPRESA" size={104} hot={['EMPRESA']} />
      <Tag f={f} at={30} until={75} top={1560} dark size={52}>3 ventas y compré un auto</Tag>

      {/* hoy: ramal */}
      <Tag f={f} at={79} until={200} top={300} size={60}>Ramal de Hyundai Verna</Tag>
      <Price f={f} at={101} until={200} top={1420} txt="$240.000" />
      <Stamp f={f} at={165} until={200} top={1000} txt="VENDIDO" />
      <Tag f={f} at={167} until={200} top={1650} dark size={44}>atendido en el mostrador</Tag>

      {/* hoy: piolas */}
      <Tag f={f} at={202} until={290} top={300} size={52}>Piolas + varilla de aceite</Tag>
      <Tag f={f} at={208} until={290} top={400} size={52}>+ lips frontales Suzuki SX4</Tag>
      <Price f={f} at={227} until={290} top={1420} txt="$210.000" />
      <Stamp f={f} at={275} until={290} top={1080} txt="VENDIDO" />

      {/* otro pedido: repuestos de Mastervan, con la página del sitio */}
      {f >= 290 && f < 405 && (
        <AbsoluteFill>
          <Img src={S('swift/c_mvblock.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.45)', transform: 'scale(1.2)'}} />
          <div style={{position: 'absolute', left: 250, top: 300, width: 580, height: 1256, borderRadius: 56, overflow: 'hidden', border: '12px solid #111', boxShadow: '0 40px 90px rgba(0,0,0,0.7)', transform: `translateY(${(1 - pop(f, 290, 14)) * 1300}px) rotate(${interpolate(f, [290, 405], [-2, 1], cl)}deg)`}}>
            <Sequence from={290} durationInFrames={115}><OffthreadVideo src={S('swift/sem_web_mv.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></Sequence>
          </div>
        </AbsoluteFill>
      )}
      <Tag f={f} at={294} until={405} top={170} red size={56}>Salió otro pedido</Tag>
      <Tag f={f} at={300} until={405} top={268} size={52}>Repuestos de Mastervan</Tag>
      <Check f={f} at={316} until={405} top={1100} items={['Diferencial trasero', 'Paquete de resortes', 'Capot']} />
      <Price f={f} at={356} until={405} top={1430} txt="$420.000" />
      <Stamp f={f} at={385} until={405} top={820} txt="VENDIDO" />

      {/* hoy: compra del Ciaz */}
      <Tag f={f} at={407} until={620} top={300} red size={56}>Y compré un auto</Tag>
      <Tag f={f} at={411} until={472} top={1560} dark size={52}>me pasaron a buscar</Tag>
      <Tag f={f} at={474} until={530} top={1480} dark size={50}>lo fui a ver en persona…</Tag>
      <Tag f={f} at={484} until={530} top={1590} red size={50}>¡al otro lado del mundo!</Tag>
      <Tag f={f} at={532} until={620} top={1480} dark size={54}>en la notaría</Tag>
      <Tag f={f} at={540} until={620} top={1590} red size={50}>transferencia ya hecha ✓</Tag>
      <Words f={f} at={622} until={710} top={320} txt="SUZUKI CIAZ" size={110} />
      <Stamp f={f} at={634} until={710} top={1380} txt="COMPRADO ✓" />
      <Tag f={f} at={714} until={800} top={190} red size={46}>en desarme</Tag>
      <Tag f={f} at={718} until={800} top={280} size={56}>Ciaz blanco</Tag>
      <Tag f={f} at={722} until={800} top={1700} size={56}>Ciaz gris</Tag>
      <Tag f={f} at={726} until={800} top={1610} red size={42}>recién comprado</Tag>
      {f >= 734 && f < 800 && (
        <div style={{position: 'absolute', top: 890, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 734, [0, 3, 8], [1.8, 0.95, 1], cl)}) rotate(-3deg)`}}>
          <span style={{display: 'inline-block', background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 58, padding: '10px 30px 14px', borderRadius: 18, border: `6px solid ${RED}`}}>con el blanco <span style={{color: RED}}>armo el gris</span></span>
        </div>
      )}

      {/* cierre personal */}
      {f >= 794 && (
        <AbsoluteFill style={{background: `rgba(8,8,8,${interpolate(f, [669, 679], [0, 0.68], cl)})`, backdropFilter: `blur(${interpolate(f, [669, 679], [0, 16], cl)}px)`}}>
          <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 190, top: 300, width: 700, transform: `scale(${pop(f, 802)})`}} />
          <Words f={f} at={808} until={890} top={640} size={76} txt="¿BUSCAS REPUESTOS O TIENES UN AUTO PARADO?" hot={['REPUESTOS', 'PARADO?']} />
          <Tag f={f} at={824} until={890} top={880} red size={52}>escríbeme</Tag>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 170, top: 1000, width: 740, transform: `scale(${pop(f, 830)})`}} />
          <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 150, top: 1120, width: 780, transform: `scale(${pop(f, 836)})`}} />
        </AbsoluteFill>
      )}
      {cut && flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
    </AbsoluteFill>
  );
};
