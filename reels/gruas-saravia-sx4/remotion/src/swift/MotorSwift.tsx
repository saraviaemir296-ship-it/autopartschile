import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../v2/Shot';
import {MONT} from '../v2/Type4';
import {E, K, cl} from '../v2/look';
import {Bg, CTA, Local} from '../walk/WalkV15';

/* Venta real (oct-2026): el cliente cotizó por la web, vino al local a ver
   el motor Suzuki Swift Dzire 2012–2017 1.2 K12MN, lo compró y pidió
   despacho a su automotora. Reglas: nombres del cliente y de su automotora
   NO aparecen; caras, pantalla, patentes y letreros van pixelados en
   public/swift (*_anon.mp4). El precio del motor vendido no se muestra
   (no confirmado). Los precios de la escena "En stock" son los de
   autopartschile.cl (tabla products, stock > 0) al 2026-10-03. */

const S = (f: string) => staticFile(f);
const DISP = "'Anton', 'Montserrat', sans-serif";
const WA_GREEN = '#25D366';
const sp = (f: number, d = 0, damping = 13, stiffness = 210) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const fade = (f: number, a: number, len = 8) => interpolate(f, [a, a + len], [0, 1], {...cl, easing: E.out});
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');

const ORDER = [
  ['hook', 78],
  ['web', 108],
  ['vano', 78],
  ['local1', 120],
  ['carga', 36],
  ['ruta', 66],
  ['entrega', 33],
  ['stock', 132],
  ['casa', 45],
  ['cta', 140],
] as const;
type Key = (typeof ORDER)[number][0];
const T = (() => {
  const o = {} as Record<Key, [number, number]>;
  let x = 0;
  for (const [k, d] of ORDER) {
    o[k] = [x, x + d];
    x += d;
  }
  return o;
})();
export const SWIFT_TOTAL = T.cta[1];
const at = (r: [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});

/* ---------- piezas comunes ---------- */
const Clip: React.FC<{src: string; from: number; vol?: number; rate?: number}> = ({src, from, vol = 0.25, rate = 1}) => (
  <OffthreadVideo src={S(src)} startFrom={Math.round(from * 30)} playbackRate={rate} volume={vol} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
);
const Shade: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.18) 36%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'}} />
);
const Red: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = K.red}) => (
  <span style={{display: 'inline-block', background: bg, padding: '6px 14px 2px', lineHeight: 1, marginTop: 8}}>{children}</span>
);
const Title: React.FC<{t: number; kicker: string; text: React.ReactNode; size?: number; top?: number}> = ({t, kicker, text, size = 112, top = 230}) => {
  const p = sp(t, 0, 13, 200);
  return (
    <div style={{position: 'absolute', top, left: 60, right: 140, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px)`, textShadow: '0 4px 22px rgba(0,0,0,0.6)'}}>
      <div style={{fontFamily: MONT, fontSize: 36, fontWeight: 800, letterSpacing: '0.14em', color: '#E6EEF2'}}>{kicker}</div>
      <div style={{marginTop: 6, fontFamily: DISP, fontSize: size, textTransform: 'uppercase', lineHeight: 1.04}}>{text}</div>
    </div>
  );
};
const Chip: React.FC<{t: number; a: number; children: React.ReactNode; y: number}> = ({t, a, children, y}) => {
  const p = sp(t, a, 12, 240);
  return (
    <div style={{position: 'absolute', left: 60, top: y, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,10,0.84)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: '14px 26px', fontFamily: MONT, fontSize: 44, fontWeight: 800, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -60}px)`}}>
      <Tick s={40} />
      {children}
    </div>
  );
};
const Tick: React.FC<{s?: number; bg?: string}> = ({s = 40, bg = K.red}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{flexShrink: 0}}>
    <circle cx="12" cy="12" r="12" fill={bg} />
    <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Flash: React.FC<{t: number}> = ({t}) => <AbsoluteFill style={{background: '#fff', opacity: interpolate(t, [0, 6], [0.85, 0], cl), pointerEvents: 'none'}} />;
/* censura de datos personales en la UI (estilo "tapado con plumón") */
const Hidden: React.FC<{w: number}> = ({w}) => (
  <span style={{display: 'inline-block', width: w, height: '0.8em', verticalAlign: '-0.05em', borderRadius: 6, background: 'repeating-linear-gradient(90deg, #1b1b1b 0 10px, #2a2a2a 10px 20px)'}} />
);

const Photo: React.FC<{src: string; t: number; len: number; top: number}> = ({src, t, len, top}) => {
  const z = interpolate(t, [0, len], [1.0, 1.08], cl);
  const p = sp(t, 0, 14, 180);
  return (
    <AbsoluteFill>
      <Img src={S(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.45)', transform: 'scale(1.2)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 80}px)`}}>
        <Img src={S(src)} style={{display: 'block', width: '100%', transform: `scale(${z})`}} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 1. GANCHO: 4 golpes + VENDIDO ---------- */
const BEATS = [
  {at: 0, a: 'Cotizó en', b: 'la web'},
  {at: 14, a: 'Vino a', b: 'verlo'},
  {at: 28, a: 'Lo', b: 'compró'},
  {at: 42, a: 'Y se lo', b: 'despachamos'},
];
const STAMP_AT = 58;
const Hook: React.FC<{t: number}> = ({t}) => {
  const cur = [...BEATS].reverse().find((b) => t >= b.at) ?? BEATS[0];
  const k = t - cur.at;
  const p = sp(k, 0, 10, 300);
  const shake = k < 5 ? Math.sin(k * 3) * (5 - k) * 2 : 0;
  return (
    <AbsoluteFill>
      <Clip src="swift/entrega_anon.mp4" from={0.3} vol={0.15} />
      <AbsoluteFill style={{background: `rgba(0,0,0,${t < STAMP_AT ? 0.45 : 0.25})`}} />
      {/* contador de pasos */}
      <div style={{position: 'absolute', top: 250, left: 60, display: 'flex', gap: 12}}>
        {BEATS.map((b, i) => (
          <div key={b.at} style={{width: 120, height: 12, borderRadius: 6, background: t >= b.at ? K.red : 'rgba(255,255,255,0.25)'}} />
        ))}
      </div>
      {t < STAMP_AT && (
        <div style={{position: 'absolute', top: 640, left: 60, right: 140, color: '#fff', fontFamily: DISP, textTransform: 'uppercase', lineHeight: 1, transform: `translateX(${shake}px) scale(${0.7 + 0.3 * p})`, transformOrigin: 'left center', opacity: Math.min(1, p * 2), textShadow: '0 6px 30px rgba(0,0,0,0.7)'}}>
          <div style={{fontSize: 150}}>{cur.a}</div>
          <div style={{fontSize: 190}}><Red>{cur.b}</Red></div>
        </div>
      )}
      {t >= STAMP_AT && <Stamp t={t - STAMP_AT} />}
      {t >= STAMP_AT && <Flash t={t - STAMP_AT} />}
      {BEATS.map((b) => t >= b.at && t < b.at + 4 && <Flash key={b.at} t={(t - b.at) * 2 + 2} />)}
    </AbsoluteFill>
  );
};
const Stamp: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 9, 320);
  const s = interpolate(p, [0, 1], [2.4, 1]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{transform: `rotate(-8deg) scale(${s})`, opacity: Math.min(1, p * 3), border: `12px solid ${K.red}`, color: K.red, background: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: '6px 44px 14px', fontFamily: DISP, fontSize: 170, lineHeight: 1}}>
        VENDIDO
      </div>
      <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 46, color: '#fff', opacity: fade(t, 6), textShadow: '0 4px 20px rgba(0,0,0,0.8)'}}>Motor Suzuki Swift 1.2 K12MN</div>
    </div>
  );
};

/* ---------- 2. COTIZACIÓN EN LA WEB (teléfono) ---------- */
const FIELD = 'Motor Swift Dzire 1.2 K12MN';
const Web: React.FC<{t: number}> = ({t}) => {
  const enter = sp(t, 0, 14, 170);
  const typed = FIELD.slice(0, Math.max(0, Math.floor((t - 16) * 1.4)));
  const press = t >= 56 && t < 62;
  const sent = t >= 62;
  const notif = sp(t, 78, 12, 230);
  const Row: React.FC<{label: string; children: React.ReactNode; show: number}> = ({label, children, show}) => (
    <div style={{opacity: fade(t, show), marginBottom: 22}}>
      <div style={{fontSize: 22, fontWeight: 700, color: '#6b6b6b', marginBottom: 8}}>{label}</div>
      <div style={{border: '2px solid #ddd', borderRadius: 14, padding: '16px 18px', fontSize: 30, fontWeight: 700, color: '#111', minHeight: 70}}>{children}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Bg />
      <Title t={t} kicker="PASO 1" text={<>Cotizó en <Red>autopartschile.cl</Red></>} size={92} top={170} />
      <div style={{position: 'absolute', left: 150, top: 520, width: 700, height: 1220, borderRadius: 70, background: '#0c0c0c', border: '10px solid #2b2b2b', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', overflow: 'hidden', transform: `translateY(${(1 - enter) * 500}px) rotate(${(1 - enter) * 6}deg)`, fontFamily: MONT}}>
        <div style={{background: '#0A0A0A', height: 120, display: 'flex', alignItems: 'flex-end', padding: '0 30px 18px', gap: 14, borderBottom: `5px solid ${K.red}`}}>
          <div style={{fontFamily: DISP, fontSize: 40, color: '#fff'}}>AUTOPARTS<span style={{color: K.red}}>CHILE</span></div>
        </div>
        <div style={{background: '#fff', height: '100%', padding: '34px 34px'}}>
          <div style={{fontFamily: DISP, fontSize: 52, color: '#111', textTransform: 'uppercase'}}>Cotizar repuesto</div>
          <div style={{height: 26}} />
          <Row label="Repuesto que buscas" show={6}>{typed}<span style={{opacity: t < 56 && Math.floor(t / 8) % 2 ? 1 : 0}}>|</span></Row>
          <Row label="Nombre" show={10}><Hidden w={300} /></Row>
          <Row label="WhatsApp" show={14}>+56 9 <Hidden w={260} /></Row>
          <div style={{marginTop: 18, background: sent ? WA_GREEN : K.red, color: '#fff', borderRadius: 16, padding: '22px 0', textAlign: 'center', fontSize: 34, fontWeight: 900, transform: `scale(${press ? 0.94 : 1})`, opacity: fade(t, 20)}}>
            {sent ? '✓ Cotización enviada' : 'Enviar cotización'}
          </div>
        </div>
      </div>
      {/* dedo */}
      {t >= 44 && t < 70 && (
        <div style={{position: 'absolute', left: 520, top: interpolate(t, [44, 56], [1700, 1265], {...cl, easing: E.out}), width: 74, height: 74, borderRadius: 99, background: 'rgba(255,255,255,0.75)', border: '4px solid #fff', transform: `scale(${press ? 0.8 : 1})`, opacity: interpolate(t, [62, 70], [1, 0], cl)}} />
      )}
      {/* aviso que nos llega */}
      <div style={{position: 'absolute', left: 90, right: 90, top: 1560, opacity: Math.min(1, notif * 2), transform: `translateY(${(1 - notif) * 60}px)`, display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(28,28,28,0.95)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 26, padding: '22px 26px', fontFamily: MONT, color: '#fff'}}>
        <div style={{width: 70, height: 70, borderRadius: 18, background: WA_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>💬</div>
        <div>
          <div style={{fontSize: 26, color: '#aaa', fontWeight: 700}}>Desarmaduría Saravia · ahora</div>
          <div style={{fontSize: 34, fontWeight: 800}}>Nueva cotización: motor Swift</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 3. RUTA DE DESPACHO ---------- */
const Ruta: React.FC<{t: number}> = ({t}) => {
  const d = 'M190 1350 C 300 1100, 520 1180, 600 950 S 820 700, 880 620';
  const len = 1100;
  const draw = interpolate(t, [10, 46], [len, 0], {...cl, easing: E.inOut});
  const truck = interpolate(t, [10, 46], [0, 1], {...cl, easing: E.inOut});
  const pinB = sp(t, 46, 9, 300);
  return (
    <AbsoluteFill>
      <Bg />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {/* calles de fondo */}
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="14">
          {[500, 700, 900, 1100, 1300, 1500].map((y) => <line key={y} x1="0" x2="1080" y1={y} y2={y - 160} />)}
          {[150, 400, 650, 900].map((x) => <line key={x} x1={x} x2={x + 120} y1="380" y2="1700" />)}
        </g>
        <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="16" strokeLinecap="round" />
        <path d={d} fill="none" stroke={K.red} strokeWidth="16" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={draw} />
        <circle cx="190" cy="1350" r="26" fill="#fff" />
        <circle cx="190" cy="1350" r="12" fill={K.red} />
        <g transform={`translate(880 620) scale(${pinB})`}>
          <circle r="70" fill={K.red} opacity="0.25" />
          <path d="M0-60C-26-60-44-41-44-16C-44 18 0 52 0 52C0 52 44 18 44-16C44-41 26-60 0-60Z" fill={WA_GREEN} />
          <circle cy="-16" r="15" fill="#fff" />
        </g>
      </svg>
      {/* camión siguiendo la ruta: aproximación por puntos de la curva */}
      <TruckOnPath p={truck} />
      <div style={{position: 'absolute', left: 60, top: 1420, fontFamily: MONT, color: '#fff', opacity: fade(t, 4)}}>
        <div style={{fontSize: 30, fontWeight: 700, color: '#bbb'}}>DESDE</div>
        <div style={{fontSize: 40, fontWeight: 900}}>Desarmaduría Saravia</div>
        <div style={{fontSize: 30, fontWeight: 700, color: '#bbb'}}>La Pintana</div>
      </div>
      <div style={{position: 'absolute', right: 60, top: 400, textAlign: 'right', fontFamily: MONT, color: '#fff', opacity: fade(t, 48)}}>
        <div style={{fontSize: 30, fontWeight: 700, color: '#bbb'}}>HASTA</div>
        <div style={{fontSize: 40, fontWeight: 900}}>Su automotora <Hidden w={180} /></div>
      </div>
      <Title t={t} kicker="PASO 3" text={<>Despacho a su <Red>automotora</Red></>} size={92} top={170} />
      <div style={{position: 'absolute', left: 60, top: 1640, fontFamily: DISP, fontSize: 70, color: '#fff', textTransform: 'uppercase', opacity: fade(t, 50), transform: `scale(${0.9 + 0.1 * sp(t, 50)})`, transformOrigin: 'left'}}>
        <Red bg={WA_GREEN}>Entregado ✓</Red>
      </div>
    </AbsoluteFill>
  );
};
const PATH_PTS: [number, number][] = [[190, 1350], [300, 1180], [430, 1140], [560, 1060], [600, 950], [680, 800], [800, 690], [880, 620]];
const TruckOnPath: React.FC<{p: number}> = ({p}) => {
  const n = PATH_PTS.length - 1;
  const i = Math.min(n - 1, Math.floor(p * n));
  const k = p * n - i;
  const [x0, y0] = PATH_PTS[i];
  const [x1, y1] = PATH_PTS[i + 1];
  const x = x0 + (x1 - x0) * k;
  const y = y0 + (y1 - y0) * k;
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x - 44, top: y - 44, width: 88, height: 88, borderRadius: 99, background: '#ffb020', border: '6px solid #0A0A0A', boxShadow: '0 0 40px #ffb020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44}}>
      🚚
    </div>
  );
};

/* ---------- 4. EN STOCK con precios reales ---------- */
const STOCK = [
  {name: 'Motor 1.2 japonés completo', fit: 'Swift GLX 2012–2017', price: 1078990},
  {name: 'Airbag volante original', fit: 'Swift 2011–2017', price: 149990},
  {name: 'Alternador original', fit: 'Swift 1.2 2012–2017', price: 104990},
  {name: 'Espejo conductor c/ intermitente', fit: 'Swift 2012–2017', price: 87990},
  {name: 'Foco trasero original', fit: 'Swift 2012–2017', price: 39990},
];
const Stock: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <Bg />
    <Title t={t} kicker="¿TIENES UN SWIFT?" text={<>Esto sigue <Red>en stock</Red></>} size={104} top={200} />
    <div style={{position: 'absolute', left: 60, right: 140, top: 520, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: MONT, color: '#fff'}}>
      {STOCK.map((s, i) => {
        const a = 14 + i * 14;
        const p = sp(t, a, 12, 230);
        const n = interpolate(t, [a, a + 16], [s.price * 0.55, s.price], {...cl, easing: E.out});
        const done = t >= a + 16;
        return (
          <div key={s.name} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, background: 'rgba(255,255,255,0.07)', border: `2px solid ${done ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 22, padding: '20px 24px', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 80}px)`}}>
            <div>
              <div style={{fontSize: 36, fontWeight: 800, lineHeight: 1.1}}>{s.name}</div>
              <div style={{fontSize: 26, fontWeight: 600, color: '#aaa', marginTop: 4}}>{s.fit}</div>
            </div>
            <div style={{fontFamily: DISP, fontSize: 60, color: done ? '#fff' : '#ddd', background: done ? K.red : 'transparent', borderRadius: 12, padding: '0 14px', transform: `scale(${done && t < a + 22 ? 1.12 : 1})`, whiteSpace: 'nowrap'}}>{clp(n)}</div>
          </div>
        );
      })}
    </div>
    <div style={{position: 'absolute', left: 60, right: 140, top: 1500, fontFamily: MONT, fontSize: 38, fontWeight: 800, color: '#fff', opacity: fade(t, 96)}}>
      Repuestos originales con <span style={{color: WA_GREEN}}>despacho a todo Chile</span>
    </div>
  </AbsoluteFill>
);

/* ---------- composición ---------- */
export const MotorSwift: React.FC = () => {
  const f = useCurrentFrame();
  const l = (k: Key) => f - T[k][0];
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence {...at(T.hook)}><Hook t={l('hook')} /></Sequence>
      <Sequence {...at(T.web)}><Web t={l('web')} /></Sequence>

      <Sequence {...at(T.vano)}>
        <Photo src="swift/motor-vano.jpg" t={l('vano')} len={78} top={790} />
        <Title t={l('vano')} kicker="PASO 2 · VINO A VERLO" text={<>1.2 <Red>K12MN</Red></>} size={124} />
        <Chip t={l('vano')} a={10} y={500}>Swift Dzire 2012–2017</Chip>
        <Chip t={l('vano')} a={18} y={600}>Tapa de aluminio · mecánico</Chip>
      </Sequence>

      <Sequence {...at(T.local1)}>
        <Clip src="swift/mostrador_anon.mp4" from={0.6} vol={0.3} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)'}} />
        <div style={{position: 'absolute', left: 60, right: 140, top: 1300, color: '#fff'}}>
          <div style={{display: 'inline-block', background: K.red, fontFamily: DISP, fontSize: 84, padding: '0 22px 6px', borderRadius: 14, textTransform: 'uppercase', transform: `scale(${sp(l('local1'), 4)})`, transformOrigin: 'left'}}>Compró en el local</div>
          <div style={{marginTop: 18, fontFamily: MONT, fontSize: 44, fontWeight: 800, opacity: fade(l('local1'), 86), transform: `translateY(${(1 - fade(l('local1'), 86)) * 20}px)`}}>
            Y tu reseña en Google, con un toque 📲
          </div>
        </div>
      </Sequence>

      <Sequence {...at(T.ruta)}><Ruta t={l('ruta')} /></Sequence>

      <Sequence {...at(T.carga)}>
        <Clip src="swift/entrega_anon.mp4" from={2.0} vol={0.2} />
        <Shade />
        <Flash t={l('carga')} />
        <Title t={l('carga')} kicker="LISTO Y AMARRADO" text={<>Rumbo a su <Red>automotora</Red></>} size={110} />
      </Sequence>
      <Sequence {...at(T.entrega)}>
        <Clip src="swift/entrega_anon.mp4" from={5.5} vol={0.25} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%)'}} />
        <Title t={l('entrega')} kicker="MOTOR ENTREGADO" text={<>¡Gracias por la <Red>confianza</Red>!</>} size={110} />
      </Sequence>

      <Sequence {...at(T.stock)}><Stock t={l('stock')} /></Sequence>
      <Sequence {...at(T.casa)}><Local t={l('casa')} /></Sequence>
      <Sequence {...at(T.cta)}>
        <Bg />
        <CTA t={l('cta')} word="SWIFT" />
      </Sequence>
      <Grain opacity={0.05} />

      {/* ---- sonido ---- */}
      {BEATS.map((b) => (
        <Sequence key={'b' + b.at} from={b.at}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.55} /></Sequence>
      ))}
      <Sequence from={STAMP_AT}><Audio src={S('audio/sfx_pa.wav')} volume={0.6} /></Sequence>
      {/* web */}
      <Sequence from={T.web[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      {Array.from({length: 9}, (_, i) => (
        <Sequence key={'k' + i} from={T.web[0] + 18 + i * 3}><Audio src={S('audio/sfx_tick.wav')} volume={0.18} /></Sequence>
      ))}
      <Sequence from={T.web[0] + 56}><Audio src={S('audio/sfx_blip.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.web[0] + 62}><Audio src={S('audio/sfx_correct.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.web[0] + 78}><Audio src={S('audio/sfx_coin.wav')} volume={0.35} /></Sequence>
      {/* vano / local */}
      {[T.vano[0], T.local1[0], T.ruta[0], T.carga[0], T.entrega[0], T.stock[0]].map((x) => (
        <Sequence key={'w' + x} from={x - 4}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.32} /></Sequence>
      ))}
      {[T.vano[0] + 10, T.vano[0] + 18].map((x) => (
        <Sequence key={'c' + x} from={x}><Audio src={S('audio/sfx_blip.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={T.local1[0] + 86}><Audio src={S('audio/sfx_correct.wav')} volume={0.3} /></Sequence>
      {/* ruta */}
      <Sequence from={T.ruta[0] + 10}><Audio src={S('audio/sfx_rev.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.ruta[0] + 46}><Audio src={S('audio/sfx_map.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.ruta[0] + 50}><Audio src={S('audio/sfx_correct.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.entrega[0] + 2}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.35} /></Sequence>
      {/* precios */}
      {STOCK.map((s, i) => (
        <React.Fragment key={'p' + i}>
          <Sequence from={T.stock[0] + 14 + i * 14}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
          <Sequence from={T.stock[0] + 30 + i * 14}><Audio src={S('audio/sfx_coin.wav')} volume={0.3} /></Sequence>
        </React.Fragment>
      ))}
      {/* cierre */}
      <Sequence from={T.casa[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.casa[0] + 4}><Audio src={S('audio/vo/v15_5.wav')} volume={1} /></Sequence>
      <Sequence from={T.cta[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.cta[0] + 66}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
