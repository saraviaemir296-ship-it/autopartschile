import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain, PhotoShot, Shot} from '../v2/Shot';
import {LogoReveal} from '../v2/LogoReveal';
import {Caption4, Headline4, MONT, W} from '../v2/Type4';
import {K, cl} from '../v2/look';

/* Grúas Saravia — video de humor: "rescatamos al cosomóvil en panne por sobrepeso".
   Estilo de los reels de Grúas Saravia (titulares itálicos, subtítulos palabra a palabra,
   cierre con logo y WhatsApp). Patente del auto pixelada en todo el video.
   `literal`: true dice "cocaína"; por defecto usa el chiste chileno de la "harina"
   (mismo remate, menos riesgo de que las redes limiten el video por mencionar drogas). */

const SRC = 'swift/coso_anon.mp4';
const T = {hook: [0, 90], zoom: [90, 140], freeze: [140, 200], vuelta: [200, 275], remate: [275, 345], cta: [345, 435]} as const;
const BODY = 435;
const CHAT = 150;   // 5 s de chat de WhatsApp al inicio
export const COSO_TOTAL = CHAT + BODY;
const at = (r: readonly [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});
const w = (s: string, start: number, gap = 5, hi: number[] = []): W[] => s.split(' ').map((t, i) => ({t, at: start + i * gap, hi: hi.includes(i)}));

/* congelado "carga sospechosa": círculo rojo dibujado a mano + sello */
const Sospecha: React.FC<{literal: boolean}> = ({literal}) => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [4, 16], [0, 1], cl);
  const stamp = spring({frame: f - 14, fps: 30, config: {damping: 9, stiffness: 220, mass: 0.6}});
  const shake = f < 8 ? Math.sin(f * 9) * (8 - f) * 2.5 : 0;
  const len = 1500;
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
      <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, 60], [1.12, 1.2])})`, transformOrigin: '20% 60%'}}>
        <Img src={staticFile('swift/coso_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.9)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 21% 60%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.55) 70%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <ellipse cx={225} cy={1155} rx={240} ry={145} fill="none" stroke={K.red} strokeWidth={14} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} transform="rotate(-8 225 1155)" />
      </svg>
      <div style={{position: 'absolute', top: 1290, left: 330, transform: `scale(${0.4 + 0.6 * stamp}) rotate(-10deg)`, opacity: Math.min(1, stamp * 2)}}>
        <div style={{border: `8px solid ${K.red}`, padding: '10px 26px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 64, color: K.red, textTransform: 'uppercase', lineHeight: 1}}>
          Carga<br />sospechosa
        </div>
      </div>
      <Caption4 dur={60} y={420} size={62} words={w(literal ? 'Muchos kilos de… cocaína.' : 'Muchos kilos de… harina.', 18, 4, [3])} />
    </AbsoluteFill>
  );
};

/* remate: "cualquier auto, cualquier carga*" con la letra chica */
const Remate: React.FC = () => {
  const f = useCurrentFrame();
  const foot = interpolate(f, [34, 42], [0, 1], cl);
  return (
    <>
      <Headline4 text={'Cualquier auto.\nCualquier carga*'} kicker="GRÚAS SARAVIA" dur={70} y={300} size={74} />
      <div style={{position: 'absolute', top: 520, left: 72, fontFamily: MONT, fontWeight: 700, fontSize: 40, color: '#fff', opacity: foot, transform: `translateY(${(1 - foot) * 14}px)`, textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>
        *legal, obvio.
      </div>
    </>
  );
};

const Cuerpo: React.FC<{literal?: boolean}> = ({literal = false}) => {
  const S = (f: string) => staticFile(f);
  return (
    <AbsoluteFill style={{backgroundColor: '#080808'}}>
      {/* 0–3 s · gancho */}
      <Sequence {...at(T.hook)}>
        <Shot src={SRC} segs={[{from: 0.1, take: 2.7, rate: 0.9}]} zoom={[1.12, 1.02]} origin="45% 50%" shake={3} audio={0.3} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0) 45%)'}} />
        <Headline4 text={'Cosomóvil\nen panne'} kicker="RESCATE DEL DÍA" dur={90} y={260} size={120} />
        <Sequence from={44}><Caption4 dur={46} y={1180} words={w('¿La causa? Sobrepeso.', 0, 6, [2])} /></Sequence>
      </Sequence>

      {/* 3–4,7 s · zoom lento a los bultos negros */}
      <Sequence {...at(T.zoom)}>
        <Shot src={SRC} segs={[{from: 0.0, take: 0.6, rate: 0.36}]} zoom={[1.1, 1.6]} origin="18% 60%" darken={0.1} />
        <Caption4 dur={50} y={420} size={62} words={w('Venía cargado con…', 4, 6)} />
      </Sequence>

      {/* 4,7–6,7 s · congelado: carga sospechosa */}
      <Sequence {...at(T.freeze)}><Sospecha literal={literal} /></Sequence>

      {/* 6,7–9,2 s · "nosotros solo llevamos el auto" */}
      <Sequence {...at(T.vuelta)}>
        <Shot src={SRC} segs={[{from: 5.2, take: 1.4, rate: 0.56}]} zoom={[1.06, 1.1]} origin="50% 55%" audio={0.3} />
        <Sequence durationInFrames={40}><Caption4 dur={40} y={1180} words={w('Tranquilos: nosotros solo llevamos el auto.', 0, 4, [5, 6])} /></Sequence>
        <Sequence from={40} durationInFrames={35}><Caption4 dur={35} y={1180} words={w(literal ? 'Lo otro se lo dejamos a los pacos.' : 'La harina se la dejamos a los pacos.', 0, 3, [7])} /></Sequence>
      </Sequence>

      {/* 9,2–11,5 s · remate con el control de la grúa */}
      <Sequence {...at(T.remate)}>
        <Shot src={SRC} segs={[{from: 6.7, take: 1.4, rate: 0.6}]} zoom={[1.0, 1.06]} origin="70% 70%" darken={0.25} />
        <Remate />
      </Sequence>

      {/* 11,5–14,5 s · cierre de marca */}
      <Sequence {...at(T.cta)}>
        <AbsoluteFill style={{filter: 'blur(12px)'}}>
          <PhotoShot src="equipo/grua-rotulada.jpg" dur={90} zoom={[1.1, 1.14]} origin="40% 55%" />
        </AbsoluteFill>
        <LogoReveal dur={90} />
      </Sequence>

      <Grain opacity={0.06} />

      {/* SFX de humor */}
      <Sequence from={2}><Audio src={S('audio/sfx_impact.wav')} volume={0.6} /></Sequence>
      <Sequence from={56}><Audio src={S('audio/sfx_trombon.wav')} volume={0.55} /></Sequence>
      <Sequence from={T.zoom[0]} durationInFrames={50}><Audio src={S('audio/sfx_riser.wav')} volume={(x) => 0.35 * interpolate(x, [40, 50], [1, 0], cl)} /></Sequence>
      <Sequence from={T.freeze[0]}><Audio src={S('audio/sfx_scratch.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.freeze[0] + 14}><Audio src={S('audio/sfx_pop.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.freeze[0] + 30}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.75} /></Sequence>
      <Sequence from={T.vuelta[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.remate[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.remate[0] + 34}><Audio src={S('audio/sfx_ding.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.cta[0] + 4}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};

/* ---- chat de WhatsApp (modo oscuro) del amigo dueño del auto */
const WA = {bg: '#0B141A', head: '#202C33', inn: '#202C33', out: '#005C4B', txt: '#E9EDEF', sub: '#8696A0', green: '#25D366'};
type Msg = {at: number; out: boolean; text: string; time: string};
const MSGS: Msg[] = [
  {at: 8, out: false, text: 'Hermano quedé en pana', time: '16:21'},
  {at: 40, out: false, text: 'Esforcé el motor porque estaba muy cargado el auto', time: '16:21'},
  {at: 62, out: true, text: '¿Cargado con qué?', time: '16:22'},
  {at: 96, out: false, text: 'No preguntí y ven no má', time: '16:22'},
  {at: 116, out: true, text: 'Voy altiro con la grúa', time: '16:22'},
];
const TYPING = [[24, 40], [80, 96]];
const Bubble: React.FC<{m: Msg; f: number}> = ({m, f}) => {
  const k = spring({frame: f - m.at, fps: 30, config: {damping: 14, stiffness: 260, mass: 0.5}});
  return (
    <div style={{display: 'flex', justifyContent: m.out ? 'flex-end' : 'flex-start', margin: '10px 26px', transform: `scale(${0.85 + 0.15 * k}) translateY(${(1 - k) * 20}px)`, transformOrigin: m.out ? '100% 100%' : '0% 100%', opacity: Math.min(1, k * 1.5)}}>
      <div style={{maxWidth: 760, background: m.out ? WA.out : WA.inn, color: WA.txt, borderRadius: 22, borderTopLeftRadius: m.out ? 22 : 6, borderTopRightRadius: m.out ? 6 : 22, padding: '18px 24px 12px', fontFamily: "'Inter', sans-serif", fontSize: 46, lineHeight: 1.25}}>
        {m.text}
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 26, color: m.out ? 'rgba(233,237,239,0.7)' : WA.sub}}>
          {m.time}
          {m.out && <svg width="34" height="20" viewBox="0 0 34 20"><path d="M2 11l5 5L18 4M14 14l2 2L28 4" fill="none" stroke="#53BDEB" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      </div>
    </div>
  );
};
const Chat: React.FC = () => {
  const f = useCurrentFrame();
  const shown = MSGS.filter((m) => f >= m.at);
  const typing = TYPING.some(([a, b]) => f >= a && f < b);
  const push = interpolate(f, [0, CHAT], [1, 1.06], cl);
  const out = interpolate(f, [CHAT - 10, CHAT], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: WA.bg, transform: `scale(${push + out * 0.4})`, opacity: 1 - out * 0.6}}>
      {/* encabezado */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 250, background: WA.head, display: 'flex', alignItems: 'flex-end', padding: '0 30px 30px', gap: 24}}>
        <svg width="40" height="60" viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" fill="none" stroke={WA.txt} strokeWidth="2.4" strokeLinecap="round" /></svg>
        <div style={{width: 110, height: 110, borderRadius: '50%', background: '#6B7C85', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="70" height="70" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.2" fill="#CFD8DC" /><path d="M3.5 21c1.2-4.4 4.6-6.6 8.5-6.6s7.3 2.2 8.5 6.6z" fill="#CFD8DC" /></svg>
        </div>
        <div style={{flex: 1, fontFamily: "'Inter', sans-serif"}}>
          <div style={{fontSize: 52, fontWeight: 600, color: WA.txt}}>Hermano</div>
          <div style={{fontSize: 32, color: typing ? WA.green : WA.sub}}>{typing ? 'escribiendo…' : 'en línea'}</div>
        </div>
      </div>
      {/* mensajes, anclados abajo como en la app */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 230, display: 'flex', flexDirection: 'column'}}>
        {shown.map((m, i) => <Bubble key={i} m={m} f={f} />)}
        {typing && (
          <div style={{margin: '10px 26px', alignSelf: 'flex-start', background: WA.inn, borderRadius: 22, padding: '24px 30px', display: 'flex', gap: 12}}>
            {[0, 1, 2].map((d) => <div key={d} style={{width: 16, height: 16, borderRadius: 8, background: WA.sub, opacity: 0.4 + 0.6 * Math.abs(Math.sin((f + d * 4) / 5))}} />)}
          </div>
        )}
      </div>
      {/* barra de escribir */}
      <div style={{position: 'absolute', left: 20, right: 20, bottom: 70, height: 120, display: 'flex', gap: 18, alignItems: 'center'}}>
        <div style={{flex: 1, height: 110, borderRadius: 60, background: WA.head, display: 'flex', alignItems: 'center', padding: '0 40px', fontFamily: "'Inter', sans-serif", fontSize: 40, color: WA.sub}}>Mensaje</div>
        <div style={{width: 110, height: 110, borderRadius: '50%', background: WA.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="50" height="50" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="#0B141A" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#0B141A" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
        </div>
      </div>
      {MSGS.map((m, i) => (
        <Sequence key={i} from={m.at}><Audio src={staticFile(m.out ? 'audio/sfx_blip.wav' : 'audio/sfx_notif.wav')} volume={m.out ? 0.35 : 0.5} /></Sequence>
      ))}
      <Sequence from={CHAT - 8}><Audio src={staticFile('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};

export const Cosomovil: React.FC<{literal?: boolean}> = ({literal = false}) => (
  <AbsoluteFill style={{backgroundColor: '#080808'}}>
    <Sequence durationInFrames={CHAT}><Chat /></Sequence>
    <Sequence from={CHAT}><Cuerpo literal={literal} /></Sequence>
  </AbsoluteFill>
);

/* ---- versión orgánica: texto estilo TikTok (cajita blanca), cortes simples, sin titulares ni cierre animado */
const TT: React.FC<{f: number; at: number; until: number; top: number; red?: boolean; size?: number; children: React.ReactNode}> = ({f, at, until, top, red, size = 56, children}) => {
  if (f < at || f >= until) return null;
  const k = interpolate(f, [at, at + 4], [0.9, 1], cl);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', transform: `scale(${k})`}}>
      <span style={{background: red ? K.red : '#fff', color: red ? '#fff' : '#000', fontFamily: MONT, fontWeight: 700, fontSize: size, lineHeight: 1.45, padding: '6px 18px', borderRadius: 12, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>
    </div>
  );
};
const O = {a: [0, 75], b: [75, 125], c: [125, 190], d: [190, 262], e: [262, 330], f: [330, 375]} as const;
const BODY_ORG = 375;
export const COSO_ORG_TOTAL = CHAT + BODY_ORG;
const CuerpoOrg: React.FC<{literal: boolean}> = ({literal}) => {
  const f = useCurrentFrame();
  const S = (x: string) => staticFile(x);
  const draw = interpolate(f, [O.c[0] + 3, O.c[0] + 13], [0, 1], cl);
  const shake = f >= O.c[0] && f < O.c[0] + 8 ? Math.sin(f * 9) * (O.c[0] + 8 - f) * 2.5 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...at(O.a)}><Shot src={SRC} segs={[{from: 0.1, take: 2.5, rate: 1}]} audio={0.5} /></Sequence>
      <Sequence {...at(O.b)}><Shot src={SRC} segs={[{from: 0.25, take: 1.0, rate: 0.6}]} zoom={[1.0, 1.35]} origin="18% 60%" audio={0.4} /></Sequence>
      <Sequence {...at(O.c)}>
        <AbsoluteFill style={{transform: `translate(${shake}px,${shake * 0.5}px) scale(${interpolate(f - O.c[0], [0, 65], [1.35, 1.42])})`, transformOrigin: '18% 60%'}}>
          <Img src={S('swift/coso_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={225} cy={1155} rx={240} ry={145} fill="none" stroke={K.red} strokeWidth={11} strokeLinecap="round" strokeDasharray={1500} strokeDashoffset={1500 * (1 - draw)} transform="rotate(-8 225 1155)" />
          </svg>
        </AbsoluteFill>
      </Sequence>
      <Sequence {...at(O.d)}><Shot src={SRC} segs={[{from: 5.2, take: 1.4, rate: 0.58}]} audio={0.4} /></Sequence>
      <Sequence from={O.e[0]} durationInFrames={O.f[1] - O.e[0]}><Shot src={SRC} segs={[{from: 6.7, take: 1.4, rate: 0.62}, {from: 8.05, take: 0.02, rate: 0.01}]} audio={0.4} /></Sequence>

      <TT f={f} at={4} until={O.a[1]} top={430}>rescate del día: el cosomóvil de mi amigo</TT>
      <TT f={f} at={O.b[0] + 4} until={O.b[1]} top={430}>¿y qué traía tan pesado?</TT>
      <TT f={f} at={O.c[0] + 6} until={O.c[1]} top={430}>kilos de…</TT>
      <TT f={f} at={O.c[0] + 28} until={O.c[1]} top={530} red size={70}>{literal ? 'COCAÍNA' : 'HARINA'}</TT>
      <TT f={f} at={O.d[0] + 4} until={O.d[1]} top={430}>tranquilos, nosotros solo llevamos el auto</TT>
      <TT f={f} at={O.e[0] + 4} until={O.f[0]} top={430}>cualquier auto,<br />cualquier carga*</TT>
      <TT f={f} at={O.e[0] + 36} until={O.f[0]} top={615} size={38}>*legal, obvio</TT>
      <TT f={f} at={O.f[0]} until={O.f[1] + 1} top={430}>Grúas Saravia · 24/7</TT>
      <TT f={f} at={O.f[0] + 6} until={O.f[1] + 1} top={530} size={42}>+56 9 5381 7335</TT>

      <Sequence from={O.b[0] + 4}><Audio src={S('audio/sfx_trombon.wav')} volume={0.4} /></Sequence>
      <Sequence from={O.c[0]}><Audio src={S('audio/sfx_scratch.wav')} volume={0.65} /></Sequence>
      <Sequence from={O.c[0] + 28}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.75} /></Sequence>
      <Sequence from={O.e[0] + 36}><Audio src={S('audio/sfx_ding.wav')} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
export const CosomovilOrg: React.FC<{literal?: boolean}> = ({literal = false}) => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Sequence durationInFrames={CHAT}><Chat /></Sequence>
    <Sequence from={CHAT}><CuerpoOrg literal={literal} /></Sequence>
  </AbsoluteFill>
);

/* ---- versión POV: el clip de IA (Higgsfield, estilo Ray-Ban Meta) como gancho de suspenso */
const HF = 'swift/hf_anon.mp4';
const HOOK = 150;
const B2 = {d: [0, 72], e: [72, 140], f: [140, 185]} as const;
export const COSO_POV_TOTAL = HOOK + CHAT + 185;
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const S = (x: string) => staticFile(x);
  const punch = f >= 99 && f < 120 ? interpolate(f, [99, 104], [1.28, 1.12], cl) : 1;
  const flash = f >= 99 ? interpolate(f, [99, 103], [0.7, 0], cl) : 0;
  const fz = f >= 120;
  const shake = fz && f < 128 ? Math.sin(f * 9) * (128 - f) * 3 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={39}><Shot src={HF} segs={[{from: 0, take: 1.3, rate: 1}]} audio={0.5} /></Sequence>
      <Sequence from={39} durationInFrames={60}><Shot src={HF} segs={[{from: 1.3, take: 1.3, rate: 0.65}]} zoom={[1.0, 1.06]} audio={0.3} /></Sequence>
      <Sequence from={99} durationInFrames={21}>
        <AbsoluteFill style={{transform: `scale(${punch})`}}><Shot src={HF} segs={[{from: 2.6, take: 0.7, rate: 1}]} audio={0.4} /></AbsoluteFill>
      </Sequence>
      {fz && (
        <AbsoluteFill style={{transform: `translate(${shake}px,${shake * 0.4}px) scale(${interpolate(f, [120, 150], [1.15, 1.25], cl)})`, transformOrigin: '50% 72%'}}>
          <Img src={S('swift/hf_freeze.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.1) saturate(1.1)'}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      {/* viñeta que se cierra durante el suspenso */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) ${interpolate(f, [39, 99], [60, 35], cl)}%, rgba(0,0,0,0.7) 100%)`}} />
      <TT f={f} at={3} until={99} top={300}>POV: vas a remolcar el auto de tu amigo</TT>
      <TT f={f} at={45} until={99} top={560}>y abres el maletero…</TT>
      <TT f={f} at={121} until={HOOK + 1} top={330} red size={76}>HERMANO???</TT>
      <Sequence from={0}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={39} durationInFrames={60}><Audio src={S('audio/sfx_heartbeat.wav')} volume={0.9} /></Sequence>
      <Sequence from={45} durationInFrames={54}><Audio src={S('audio/sfx_riser.wav')} volume={(x) => 0.4 * interpolate(x, [44, 54], [1, 0], cl)} /></Sequence>
      <Sequence from={99}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.85} /></Sequence>
      <Sequence from={120}><Audio src={S('audio/sfx_scratch.wav')} volume={0.7} /></Sequence>
    </AbsoluteFill>
  );
};
const CierrePOV: React.FC = () => {
  const f = useCurrentFrame();
  const S = (x: string) => staticFile(x);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...at(B2.d)}><Shot src={SRC} segs={[{from: 5.2, take: 1.4, rate: 0.58}]} audio={0.4} /></Sequence>
      <Sequence from={B2.e[0]} durationInFrames={B2.f[1] - B2.e[0]}><Shot src={SRC} segs={[{from: 6.7, take: 1.4, rate: 0.62}, {from: 8.05, take: 0.02, rate: 0.01}]} audio={0.4} /></Sequence>
      <TT f={f} at={4} until={B2.d[1]} top={430}>tranquilos, nosotros solo llevamos el auto</TT>
      <TT f={f} at={B2.e[0] + 4} until={B2.f[0]} top={430}>cualquier auto,<br />cualquier carga*</TT>
      <TT f={f} at={B2.e[0] + 36} until={B2.f[0]} top={615} size={38}>*legal, obvio. Video del maletero hecho con IA</TT>
      <TT f={f} at={B2.f[0]} until={B2.f[1] + 1} top={430}>Grúas Saravia · 24/7</TT>
      <TT f={f} at={B2.f[0] + 6} until={B2.f[1] + 1} top={530} size={42}>+56 9 5381 7335</TT>
      <Sequence from={B2.e[0] + 36}><Audio src={S('audio/sfx_ding.wav')} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
export const CosomovilPOV: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Sequence durationInFrames={HOOK}><Hook /></Sequence>
    <Sequence from={HOOK} durationInFrames={CHAT}><Chat /></Sequence>
    <Sequence from={HOOK + CHAT}><CierrePOV /></Sequence>
  </AbsoluteFill>
);
