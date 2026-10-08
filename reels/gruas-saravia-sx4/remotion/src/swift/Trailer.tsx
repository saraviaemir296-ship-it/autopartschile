import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile} from 'remotion';
import {cl} from '../v2/look';
import {Chip} from './CuatroAutos';
import {GRADE} from './Fx';

/* Gancho tipo "resumen": en ~4 s pasan los momentos clave de la historia
   (los mensajes reales de los clientes, el Jeep arriba, el trato y el pago,
   los papeles, el SX4 arriba y un adelanto del foco) con un contador de autos
   comprados. Se usa con frame local t. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const DISP = "'Anton', sans-serif";
const MONO = "'JetBrains Mono', monospace";

export const TRAILER_LEN = 120;
// [inicio, fin, etiqueta reloj, texto]
const SHOTS: [number, number, string, string][] = [
  [0, 14, 'MAR 14:13', 'NOS OFRECEN UN SX4'],
  [14, 28, 'MAR 14:33', 'OTRO CLIENTE: UN JEEP'],
  [28, 43, 'MAR 16:19', 'JEEP ARRIBA'],
  [43, 57, 'MIÉ 15:03', 'PAPELES EN REGLA'],
  [57, 70, 'MIÉ 15:10', 'TRATO + PAGO'],
  [70, 85, 'MIÉ 15:13', 'SX4 ARRIBA'],
  [85, 97, 'MIÉ 15:15', 'Y ENTONCES…'],
];
const COLLAGE = 97;

const punch = (t: number) => interpolate(t, [0, 3, 14], [1.32, 1.1, 1.04], cl);

const Vid: React.FC<{src: string; at: number; dur: number; start: number; t: number; fit?: 'cover' | 'contain'; filter?: string; origin?: string}> = ({src, at, dur, start, t, filter = GRADE, origin = '50% 50%'}) => (
  <Sequence from={at} durationInFrames={dur}>
    <AbsoluteFill style={{transform: `scale(${punch(t - at)})`, transformOrigin: origin}}>
      <OffthreadVideo src={S(src)} muted startFrom={start} style={{width: '100%', height: '100%', objectFit: 'cover', filter}} />
    </AbsoluteFill>
  </Sequence>
);

/* burbuja de chat (texto real del cliente) que aparece con rebote */
const Bubble: React.FC<{t: number; at: number; until: number; txt: string; top: number; right?: boolean; app: string}> = ({t, at, until, txt, top, right, app}) => {
  if (t < at || t >= until) return null;
  const k = spring({frame: t - at, fps: 30, config: {damping: 11, stiffness: 260, mass: 0.5}});
  return (
    <div style={{position: 'absolute', top, left: right ? undefined : 50, right: right ? 50 : undefined, maxWidth: 860, transform: `scale(${k})`, transformOrigin: right ? '100% 100%' : '0% 100%'}}>
      {app && <div style={{fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 6, textShadow: '0 2px 8px #000'}}>{app}</div>}
      <div style={{background: app.startsWith('Messenger') ? '#fff' : '#E7FFDB', color: '#111', borderRadius: 34, padding: '20px 30px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 46, lineHeight: 1.15, boxShadow: '0 18px 40px rgba(0,0,0,0.6)'}}>{txt}</div>
    </div>
  );
};

export const Trailer: React.FC<{t: number}> = ({t}) => {
  const shot = SHOTS.findIndex(([a, b]) => t >= a && t < b);
  const autos = t >= 70 ? 2 : t >= 28 ? 1 : 0;
  const bump = (at: number) => (t >= at && t < at + 8 ? interpolate(t - at, [0, 3, 8], [1.5, 0.95, 1], cl) : 1);
  const glitch = t >= 85 && t < COLLAGE;
  return (
    <AbsoluteFill style={{background: '#0A0A0A', overflow: 'hidden'}}>
      {/* 1 · Messenger */}
      {t < 14 && (
        <AbsoluteFill style={{background: '#fff', transform: `scale(${punch(t) * 1.25})`, transformOrigin: '30% 55%'}}>
          <Img src={S('swift/sx4b_messenger.png')} style={{position: 'absolute', left: 0, top: -700, width: 1080}} />
        </AbsoluteFill>
      )}
      {/* 2 · WhatsApp del Jeep */}
      {t >= 14 && t < 28 && (
        <AbsoluteFill style={{background: '#efe7de', transform: `scale(${punch(t - 14) * 1.3})`, transformOrigin: '50% 30%'}}>
          <Img src={S('swift/jeep_whatsapp.png')} style={{position: 'absolute', left: 0, top: -1260, width: 1080}} />
        </AbsoluteFill>
      )}
      {/* 3 · Jeep arriba */}
      {t >= 28 && t < 43 && (
        <Sequence from={28} durationInFrames={15}>
          <AbsoluteFill style={{transform: `scale(${punch(t - 28) * 1.9})`, transformOrigin: '45% 50%'}}>
            <OffthreadVideo src={S('swift/sx4b_jeep.mp4')} muted startFrom={10} style={{width: '100%', height: '100%', objectFit: 'contain', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
      )}
      {t >= 43 && t < 57 && <Vid src="swift/sx4b_papeles.mp4" at={43} dur={14} start={4} t={t} />}
      {t >= 57 && t < 70 && <Vid src="swift/sx4b_mano.mp4" at={57} dur={13} start={0} t={t} origin="40% 55%" />}
      {t >= 70 && t < 85 && <Vid src="swift/sx4b_arriba.mp4" at={70} dur={15} start={30} t={t} origin="55% 55%" />}
      {glitch && (
        <Vid src="swift/sx4b_foco.mp4" at={85} dur={12} start={30} t={t} filter={`grayscale(1) contrast(1.4) brightness(${t % 4 < 2 ? 0.7 : 1.1})`} origin="50% 45%" />
      )}
      {glitch && Array.from({length: 7}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: random(`g${i}-${t}`) * 1920, height: 8 + random(`h${i}-${t}`) * 40, background: i % 2 ? 'rgba(255,42,42,0.35)' : 'rgba(255,255,255,0.25)', transform: `translateX(${(random(`x${i}-${t}`) - 0.5) * 160}px)`}} />
      ))}
      {/* collage final */}
      {t >= COLLAGE && (
        <AbsoluteFill>
          {[['swift/sx4b_jeep.mp4', 12, 0, 0], ['swift/sx4b_arriba.mp4', 40, 540, 0], ['swift/sx4b_mano.mp4', 6, 0, 960], ['swift/sx4b_carga.mp4', 60, 540, 960]].map(([src, st, x, y], i) => {
            const k = spring({frame: t - COLLAGE - i * 2, fps: 30, config: {damping: 13, stiffness: 240, mass: 0.5}});
            return (
              <div key={i} style={{position: 'absolute', left: x as number, top: y as number, width: 540, height: 960, overflow: 'hidden', border: `6px solid ${RED}`, boxSizing: 'border-box', transform: `scale(${k})`}}>
                <Sequence from={COLLAGE}><OffthreadVideo src={S(src as string)} muted startFrom={st as number} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} /></Sequence>
              </div>
            );
          })}
          <AbsoluteFill style={{background: 'rgba(0,0,0,0.25)'}} />
        </AbsoluteFill>
      )}
      {/* burbujas reales de los clientes */}
      <Bubble t={t} at={1} until={14} app="Messenger · Marketplace" txt="Te ofrecen un vehículo para desarme" top={340} />
      <Bubble t={t} at={15} until={28} app="WhatsApp · cliente" txt="Tengo una Jeep Cherokee para chatarra" top={340} right />
      <Bubble t={t} at={20} until={28} app="" txt="Necesito sacarla de dónde la tengo" top={560} right />
      {/* contador */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'stretch', transform: t >= COLLAGE ? `translateY(${interpolate(t - COLLAGE, [0, 8], [0, 560], cl)}px) scale(${interpolate(t - COLLAGE, [0, 8], [1, 1.25], cl)})` : undefined}}>
        <div style={{background: '#0A0A0A', color: '#fff', fontFamily: DISP, fontSize: 64, padding: '10px 24px', display: 'flex', alignItems: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.6)'}}>AUTOS COMPRADOS</div>
        <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 110, lineHeight: 1, padding: '6px 26px 12px', transform: `scale(${bump(28) * bump(70)})`, boxShadow: `0 0 30px ${RED}`}}>{autos}/2</div>
      </div>
      {t >= COLLAGE && (
        <div style={{position: 'absolute', top: 900, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(t - COLLAGE - 6, [0, 3, 8], [1.8, 0.95, 1], cl)}) rotate(-4deg)`, opacity: t >= COLLAGE + 6 ? 1 : 0}}>
          <span style={{display: 'inline-block', background: RED, border: `7px solid ${RED2}`, padding: '4px 30px 12px', fontFamily: DISP, fontSize: 120, color: '#fff', boxShadow: `0 0 40px ${RED}`}}>EN 2 HORAS</span>
        </div>
      )}
      {/* reloj + texto de cada toma */}
      {shot >= 0 && (
        <>
          <div style={{position: 'absolute', top: 64, left: 28, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,10,10,0.78)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '6px 14px'}}>
            <span style={{width: 16, height: 16, borderRadius: 8, background: RED2}} />
            <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 30, color: '#fff'}}>{SHOTS[shot][2]}</span>
          </div>
          <div style={{position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(t - SHOTS[shot][0], [0, 3, 7], [1.4, 0.96, 1], cl)})`}}>
            <Chip red={shot % 2 === 0} size={70}>{SHOTS[shot][3]}</Chip>
          </div>
        </>
      )}
      {/* destello en cada corte */}
      {SHOTS.some(([a]) => t === a || t === a + 1) && <AbsoluteFill style={{background: `rgba(255,255,255,${SHOTS.some(([a]) => t === a) ? 0.45 : 0.15})`}} />}
      {/* barra de progreso */}
      <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${(t / TRAILER_LEN) * 100}%`, background: RED2}} />
    </AbsoluteFill>
  );
};

type Sfx = [number, string, number, number?];
export const TRAILER_SFX: Sfx[] = [
  ...SHOTS.map(([a]) => [a, 'sfx_whip', 0.55] as Sfx),
  [2, 'sfx_notif', 0.7], [15, 'sfx_notif', 0.7], [20, 'sfx_pop', 0.6],
  [28, 'sfx_impact', 0.6, 16], [28, 'sfx_kaching_real', 0.6], [43, 'sfx_shutter', 0.6], [57, 'sfx_slap', 0.5],
  [70, 'sfx_impact', 0.7, 16], [70, 'sfx_kaching_real', 0.7], [85, 'sfx_scratch', 0.7], [COLLAGE, 'sfx_sub', 0.8, 22], [COLLAGE + 6, 'sfx_impact', 0.8, 18],
];
