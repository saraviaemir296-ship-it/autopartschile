import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile} from 'remotion';
import {cl} from '../v2/look';
import {Chip} from './CuatroAutos';
import {GRADE} from './Fx';

/* Gancho: los dos clientes escribiendo al mismo tiempo (pantalla dividida con
   sus chats reales: mensajes y fotos de los autos), después el apretón de manos
   con el pago, los papeles y los dos autos arriba de la grúa. Frame local t. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
const MONO = "'JetBrains Mono', monospace";

export const TRAILER_LEN = 135;
const CHATS = 0, MANO = 46, PAPEL = 74, GRUAS = 88;

const pop = (t: number, at: number) => spring({frame: t - at, fps: 30, config: {damping: 12, stiffness: 260, mass: 0.5}});

type Msg = {at: number; me?: boolean; txt?: string; img?: string; audio?: boolean};
const Panel: React.FC<{t: number; top: number; app: 'messenger' | 'whatsapp'; who: string; hora: string; msgs: Msg[]}> = ({t, top, app, who, hora, msgs}) => {
  const wa = app === 'whatsapp';
  const enter = interpolate(t, [0, 7], [wa ? 1 : -1, 0], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const shown = msgs.filter((m) => t >= m.at);
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1080, height: 960, overflow: 'hidden', background: wa ? '#efe7de' : '#fff', transform: `translateX(${enter * 1080}px)`}}>
      <div style={{height: 120, background: wa ? '#f6f6f6' : '#fff', borderBottom: '2px solid #ddd', display: 'flex', alignItems: 'center', gap: 20, padding: '20px 40px 0', boxSizing: 'border-box'}}>
        <div style={{width: 74, height: 74, borderRadius: 37, background: wa ? '#25D366' : 'linear-gradient(135deg,#00B2FF,#A033FF,#FF5C87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 40, color: '#fff'}}>{wa ? '2' : '1'}</div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: TXT, fontWeight: 800, fontSize: 40, color: '#111'}}>{who}</div>
          <div style={{fontFamily: TXT, fontWeight: 600, fontSize: 26, color: '#777'}}>{wa ? 'WhatsApp' : 'Messenger · Marketplace'}</div>
        </div>
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 34, color: '#fff', background: RED, padding: '6px 16px', borderRadius: 10}}>{hora}</div>
      </div>
      {/* mensajes: se apilan desde abajo, como un chat real */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 122, bottom: 26, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14}}>
        {shown.map((m, i) => {
          const k = pop(t, m.at);
          const me = !!m.me;
          const bg = me ? (wa ? '#D9FDD3' : '#0084FF') : wa ? '#fff' : '#F0F0F0';
          return (
            <div key={i} style={{alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: m.img ? 290 : 800, flexShrink: 0, transform: `scale(${k})`, transformOrigin: me ? '100% 100%' : '0% 100%'}}>
              {m.img ? (
                <Img src={S(m.img)} style={{width: 270, borderRadius: 24, display: 'block', boxShadow: '0 10px 24px rgba(0,0,0,0.25)'}} />
              ) : m.audio ? (
                <div style={{background: bg, borderRadius: 34, padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 14}}>
                  <span style={{width: 0, height: 0, borderLeft: '22px solid #111', borderTop: '14px solid transparent', borderBottom: '14px solid transparent'}} />
                  {Array.from({length: 22}).map((_, j) => <span key={j} style={{width: 6, height: 10 + ((j * 37) % 34), background: '#111', borderRadius: 3}} />)}
                  <span style={{fontFamily: TXT, fontWeight: 700, fontSize: 28, color: '#333'}}>0:10</span>
                </div>
              ) : (
                <div style={{background: bg, color: me && !wa ? '#fff' : '#111', borderRadius: 34, padding: '18px 28px', fontFamily: TXT, fontWeight: 600, fontSize: 44, lineHeight: 1.2, boxShadow: wa ? '0 2px 4px rgba(0,0,0,0.1)' : undefined}}>{m.txt}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const punch = (t: number) => interpolate(t, [0, 4, 30], [1.3, 1.08, 1.02], cl);

export const Trailer: React.FC<{t: number}> = ({t}) => {
  const autos = t >= GRUAS + 14 ? 2 : 1;
  return (
    <AbsoluteFill style={{background: '#0A0A0A', overflow: 'hidden'}}>
      {/* 1 · los dos clientes escribiendo (textos y fotos reales de los chats) */}
      {t < MANO && (
        <>
          <Panel t={t} top={0} app="messenger" who="Cliente 1" hora="MAR 14:13" msgs={[
            {at: 6, audio: true},
            {at: 14, img: 'swift/chat_sx4_foto.png'},
            {at: 28, me: true, txt: 'Ok amigo… si me puede dar la patente para consultarlo'},
          ]} />
          <Panel t={t} top={960} app="whatsapp" who="Cliente 2" hora="MAR 14:33" msgs={[
            {at: 10, txt: 'Tengo una Jeep Cherokee para chatarra'},
            {at: 20, img: 'swift/chat_jeep_foto.png'},
            {at: 32, txt: 'Necesito sacarla de dónde la tengo'},
          ]} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED, boxShadow: `0 0 24px ${RED}`}} />
        </>
      )}
      {/* 2 · apretón de manos + pago */}
      {t >= MANO && t < PAPEL && (
        <Sequence from={MANO} durationInFrames={PAPEL - MANO}>
          <AbsoluteFill style={{transform: `scale(${punch(t - MANO)})`, transformOrigin: '40% 55%'}}>
            <OffthreadVideo src={S('swift/sx4b_mano.mp4')} muted startFrom={0} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
      )}
      {t >= MANO + 3 && t < PAPEL && (
        <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', transform: `rotate(-6deg) scale(${interpolate(t - MANO - 3, [0, 3, 8], [2.2, 0.94, 1], cl)})`}}>
          <span style={{display: 'inline-block', border: `7px solid ${RED2}`, padding: '0 24px 8px', fontFamily: DISP, fontSize: 110, color: '#fff', background: 'rgba(209,11,12,0.9)', boxShadow: `0 0 34px ${RED}`}}>TRATO HECHO</span>
        </div>
      )}
      {t >= MANO + 14 && t < PAPEL && <div style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(t, MANO + 14)})`}}><Chip size={70}>PAGO DIRECTO</Chip></div>}
      {/* 3 · papeles */}
      {t >= PAPEL && t < GRUAS && (
        <Sequence from={PAPEL} durationInFrames={GRUAS - PAPEL}>
          <AbsoluteFill style={{transform: `scale(${punch(t - PAPEL)})`}}>
            <OffthreadVideo src={S('swift/sx4b_papeles.mp4')} muted startFrom={4} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
          </AbsoluteFill>
        </Sequence>
      )}
      {t >= PAPEL + 2 && t < GRUAS && <div style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(t, PAPEL + 2)})`}}><Chip red size={70}>PAPELES EN REGLA</Chip></div>}
      {/* 4 · los dos autos arriba de la grúa */}
      {t >= GRUAS && (
        <>
          {[['swift/sx4b_jeep.mp4', 8, 0, -1], ['swift/sx4b_arriba.mp4', 30, 960, 1]].map(([src, st, y, dir], i) => (
            <div key={i} style={{position: 'absolute', left: 0, top: y as number, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - pop(t, GRUAS + i * 3)) * 1080 * (dir as number)}px)`}}>
              <Sequence from={GRUAS}><OffthreadVideo src={S(src as string)} muted startFrom={st as number} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE, transform: 'scale(1.12)'}} /></Sequence>
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED, boxShadow: `0 0 24px ${RED}`}} />
          <div style={{position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${t >= GRUAS + 6 ? interpolate(t - GRUAS - 6, [0, 3, 8], [1.6, 0.95, 1], cl) * (t >= GRUAS + 14 && t < GRUAS + 22 ? interpolate(t - GRUAS - 14, [0, 3, 8], [1.25, 0.97, 1], cl) : 1) : 0})`}}>
            <div style={{background: '#0A0A0A', color: '#fff', fontFamily: DISP, fontSize: 70, padding: '14px 26px', display: 'flex', alignItems: 'center'}}>AUTOS COMPRADOS</div>
            <div style={{background: RED, color: '#fff', fontFamily: DISP, fontSize: 130, lineHeight: 1, padding: '10px 28px 16px', boxShadow: `0 0 34px ${RED}`}}>{autos}/2</div>
          </div>
          {t >= GRUAS + 18 && (
            <div style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', transform: `rotate(-4deg) scale(${interpolate(t - GRUAS - 18, [0, 3, 8], [1.8, 0.95, 1], cl)})`}}>
              <span style={{display: 'inline-block', background: RED, border: `7px solid ${RED2}`, padding: '4px 30px 12px', fontFamily: DISP, fontSize: 120, color: '#fff', boxShadow: `0 0 40px ${RED}`}}>EN 2 HORAS</span>
            </div>
          )}
        </>
      )}
      {/* destellos en los cortes */}
      {[MANO, PAPEL, GRUAS].some((a) => t === a) && <AbsoluteFill style={{background: 'rgba(255,255,255,0.45)'}} />}
    </AbsoluteFill>
  );
};

type Sfx = [number, string, number, number?];
export const TRAILER_SFX: Sfx[] = [
  [0, 'sfx_whoosh', 0.6], [6, 'sfx_notif', 0.7], [10, 'sfx_notif', 0.6], [14, 'sfx_pop', 0.6], [20, 'sfx_pop', 0.6], [28, 'sfx_click', 0.5], [32, 'sfx_pop', 0.6],
  [MANO, 'sfx_whip', 0.6], [MANO + 3, 'sfx_impact', 0.8, 18], [MANO + 14, 'sfx_kaching_real', 0.8], [MANO + 15, 'sfx_coins', 0.5],
  [PAPEL, 'sfx_whip', 0.5], [PAPEL + 2, 'sfx_shutter', 0.6],
  [GRUAS, 'sfx_whip', 0.6], [GRUAS + 6, 'sfx_impact', 0.7, 16], [GRUAS + 14, 'sfx_kaching_real', 0.7], [GRUAS + 18, 'sfx_impact', 0.8, 18], [GRUAS + 18, 'sfx_sub', 0.7, 22],
];
