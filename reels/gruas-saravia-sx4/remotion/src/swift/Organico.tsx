import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {GRADE} from './Fx';

/* Video orgánico (sin edición pesada): la voz real del dueño con el llamado
   (auto parado → trato/pago/retiro directo → $20.000 por dato → WhatsApp →
   Desarmaduría Saravia) sobre cortes secos de clips reales, sin efectos ni
   gradación, con subtítulos estilo TikTok. La música la pone el dueño en la app. */

const S = (f: string) => staticFile(f);
const TXT = "'Montserrat', sans-serif";
const RED = '#D10B0C';
const OUT = Easing.bezier(0.16, 1, 0.3, 1);

// [archivo, inicio en este video, largo, segundo de inicio del clip]
type Clip = [string, number, number, number];
const CLIPS: Clip[] = [
  ['swift/vitara_local_anon.mp4', 0, 34, 0.3],
  ['swift/mv_desarme.mp4', 34, 32, 1.0],
  ['swift/sx4b_jeep.mp4', 66, 35, 0],
  ['swift/sx4b_mano.mp4', 101, 36, 0],      // trato directo
  ['swift/sx4b_papeles.mp4', 137, 36, 0.2], // pago directo
  ['swift/sx4b_carga.mp4', 173, 40, 1.0],   // retiro directo
  ['swift/sx4b_arriba.mp4', 213, 47, 0.3],
  ['swift/mv_carga.mp4', 260, 47, 3.0],
  ['swift/vitara_portalon.mp4', 307, 50, 0.5],
  ['img:swift/jeep_whatsapp.png', 357, 43, 0],
  ['swift/entrega_anon.mp4', 400, 42, 4.0],
  ['swift/airbag_kit.mp4', 442, 83, 0.2],
];
export const ORGANICO_TOTAL = 525;

// [archivo, inicio, largo, texto dicho]
const VO: [string, number, number, string][] = [
  ['audio/vo/dos2_16.wav', 0, 98, 'Mi gente, si tienes un auto parado, chocado o malo, en cualquier estado…'],
  ['audio/vo/dos2_17.wav', 101, 109, 'trato directo, pago directo y retiro directo.'],
  ['audio/vo/dos2_18.wav', 213, 141, 'Y si sabes de alguien que tenga uno, te pagamos veinte lucas por el dato si se concreta.'],
  ['audio/vo/dos2_19.wav', 357, 82, 'Mándanos tres fotos y la patente por WhatsApp.'],
  ['audio/vo/dos2_20.wav', 442, 52, 'Desarmaduría Saravia.'],
];

/* subtítulos: grupos de hasta 4 palabras, repartidos según el largo de cada palabra */
type Chunk = {a: number; b: number; txt: string; ws: [string, number][]};
const CHUNKS: Chunk[] = VO.flatMap(([, st, du, txt]) => {
  const ws = txt.split(' ');
  const wt = ws.map((w) => w.length + 2);
  const tot = wt.reduce((x, y) => x + y, 0);
  const out: Chunk[] = [];
  let acc = 0, cur: [string, number][] = [], a0 = st + 2;
  ws.forEach((w, i) => {
    cur.push([w, st + 2 + (acc / tot) * (du - 4)]); acc += wt[i];
    const t = st + 2 + (acc / tot) * (du - 4);
    if (cur.length >= 4 || /[,.…:]$/.test(w) || i === ws.length - 1) { out.push({a: a0, b: t, txt: cur.map(([x]) => x).join(' '), ws: cur}); cur = []; a0 = t; }
  });
  return out;
});

const Caption: React.FC<{f: number}> = ({f}) => {
  const c = CHUNKS.find(({a, b}) => f >= a && f < b + 2);
  if (!c) return null;
  const curW = c.ws.filter(([, t]) => f >= t).length - 1;
  const k = interpolate(f - c.a, [0, 3, 7], [1.12, 0.98, 1], cl);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1200, textAlign: 'center', transform: `scale(${k})`}}>
      {c.ws.map(([w], i) => (
        <span key={i} style={{display: 'inline-block', margin: '4px 8px', padding: '2px 12px 6px', borderRadius: 12, background: i === curW ? RED : 'transparent', fontFamily: TXT, fontWeight: 900, fontSize: 66, lineHeight: 1.15, color: '#fff', textShadow: i === curW ? 'none' : '0 3px 12px rgba(0,0,0,0.85), 0 0 3px #000'}}>{w.replace(/[,.…:]$/, '')}</span>
      ))}
    </div>
  );
};

/* rótulos simples tipo "texto de TikTok" (caja blanca, letra negra) */
const Label: React.FC<{f: number; at: number; until: number; top: number; children: React.ReactNode}> = ({f, at, until, top, children}) => {
  if (f < at || f >= until) return null;
  const k = spring({frame: f - at, fps: 30, config: {damping: 16, stiffness: 200, mass: 0.6}});
  const o = interpolate(f, [until - 6, until], [1, 0], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${(1 - k) * -30}px)`}}>
      <span style={{display: 'inline-block', background: 'rgba(12,12,12,0.82)', borderLeft: `10px solid ${RED}`, color: '#fff', fontFamily: TXT, fontWeight: 800, fontSize: 52, lineHeight: 1.25, padding: '12px 30px 14px', borderRadius: 16, boxShadow: '0 14px 34px rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)'}}>{children}</span>
    </div>
  );
};

export const Organico: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {CLIPS.map(([src, at, dur, st], i) => {
        const z = interpolate(f - at, [0, dur], [1.0, 1.07], cl);
        const origin = ['50% 50%', '45% 60%', '55% 45%'][i % 3];
        const vid = (style: React.CSSProperties) => <OffthreadVideo src={S(src)} muted startFrom={Math.round(st * 30)} style={style} />;
        return (
          <Sequence key={at} from={at} durationInFrames={dur}>
            {src.startsWith('img:') ? (
              <AbsoluteFill>
                <Img src={S('swift/chat_jeep_foto.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.5)', transform: 'scale(1.2)'}} />
                <div style={{position: 'absolute', left: 190, top: 330, width: 700, height: 1260, borderRadius: 60, overflow: 'hidden', border: '14px solid #111', boxShadow: '0 40px 90px rgba(0,0,0,0.7)', background: '#efe7de', transform: `scale(${interpolate(f - at, [0, 8], [0.92, 1], {...cl, easing: OUT})})`}}>
                  <Img src={S(src.slice(4))} style={{position: 'absolute', left: 0, width: 700, top: -760 - (f - at) * 4}} />
                </div>
              </AbsoluteFill>
            ) : src.endsWith('sx4b_jeep.mp4') ? (
              <AbsoluteFill>
                <AbsoluteFill style={{filter: 'blur(30px) brightness(0.55)', transform: 'scale(1.3)'}}>{vid({width: '100%', height: '100%', objectFit: 'cover'})}</AbsoluteFill>
                <div style={{position: 'absolute', left: 0, top: 555, width: 1080, height: 810, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', transform: `scale(${z})`}}>{vid({width: '100%', height: '100%', objectFit: 'cover', filter: GRADE})}</div>
              </AbsoluteFill>
            ) : (
              <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: origin}}>
                {vid({width: '100%', height: '100%', objectFit: 'cover', filter: GRADE})}
              </AbsoluteFill>
            )}
          </Sequence>
        );
      })}
      {/* viñeta suave para que el texto se lea sin tapar la imagen */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      {f < 442 && <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 360, top: 70, width: 360, opacity: 0.95, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />}
      <Label f={f} at={0} until={101} top={260}>¿Tienes un auto parado?</Label>
      <Label f={f} at={240} until={357} top={260}>$20.000 por dato<br /><span style={{fontSize: 36, fontWeight: 700}}>si se concreta la compra</span></Label>
      <Label f={f} at={360} until={442} top={190}>WhatsApp +56 9 5381 7335</Label>
      {f >= 442 && (
        <>
          <AbsoluteFill style={{background: `rgba(8,8,8,${interpolate(f, [442, 452], [0, 0.62], cl)})`, backdropFilter: `blur(${interpolate(f, [442, 452], [0, 16], cl)}px)`}} />
          <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 190, top: 260, width: 700, transform: `scale(${spring({frame: f - 444, fps: 30, config: {damping: 14, stiffness: 180, mass: 0.6}})})`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.7))'}} />
          <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', opacity: interpolate(f, [452, 460], [0, 1], cl), fontFamily: TXT, fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: 2, textShadow: '0 2px 10px #000'}}>REPUESTOS · GRÚA · COMPRAMOS TU AUTO</div>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 170, top: 760, width: 740, transform: `scale(${spring({frame: f - 458, fps: 30, config: {damping: 13, stiffness: 220, mass: 0.6}})})`}} />
          <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 150, top: 880, width: 780, transform: `scale(${spring({frame: f - 464, fps: 30, config: {damping: 13, stiffness: 220, mass: 0.6}})})`}} />
        </>
      )}
      <Caption f={f} />
      {VO.map(([file, st, du]) => (
        <Sequence key={file} from={st} durationInFrames={du + 3}><Audio src={S(file)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
