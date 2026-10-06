import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Reel estilo "motion graphics neón" (referencia: reel de pantalla con
   texto que se decodifica, gráficos que suben, radares y tarjetas que
   brillan). Datos reales:
   - Motor Suzuki Swift 1.2 vendido en $1.078.990 (dato del dueño); cotizó
     en la web, vino a verlo y se le despachó a su automotora.
   - Block de motor Suzuki Mastervan G13B 1.3 vendido en $119.000 IVA
     incluido (factura electrónica N°164, datos personales tapados).
   - Cliente #3 vio el Suzuki Vitara azul publicado en la web y escribió
     por el portalón (chat real, nombre tapado). Se llevó portalón,
     refuerzo de parachoques y parachoques trasero, más un corte que sale
     al día siguiente a Viña del Mar (dato del dueño). Sin precios.
   - 242 repuestos con stock en autopartschile.cl (tabla products,
     2026-10-06). Marcas con stock: Suzuki, Kia, Chevrolet, Jeep. */

const S = (f: string) => staticFile(f);
const SORA = "'Sora', 'Montserrat', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const SCRIPT = "'Kaushan', cursive";
const BLUE = '#3D8BFF';
const CYAN = '#7FD8FF';
const RED = '#FF2D46';
const GREEN = '#2BE38A';
const BG = '#04060C';

const sp = (f: number, d = 0, damping = 13, stiffness = 200) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');
const glow = (c: string, k = 1) => `0 0 ${8 * k}px ${c}, 0 0 ${22 * k}px ${c}, 0 0 ${48 * k}px ${c}88`;

const ORDER = [
  ['intro', 72],
  ['swift', 126],
  ['master', 96],
  ['vitara', 326],
  ['stock', 108],
  ['flujo', 84],
  ['fin', 96],
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
export const NEON_TOTAL = T.fin[1];
const at = (r: [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});

/* ---------- fondo: glow + grilla en perspectiva + partículas ---------- */
const Bg: React.FC<{f: number; tint?: string}> = ({f, tint = BLUE}) => (
  <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 38%, ${tint}33 0%, transparent 70%)`}} />
    <div style={{position: 'absolute', left: -540, right: -540, bottom: -200, height: 900, transform: 'perspective(700px) rotateX(62deg)', transformOrigin: 'bottom', backgroundImage: `linear-gradient(${tint}40 2px, transparent 2px), linear-gradient(90deg, ${tint}40 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0 ${(f * 3) % 90}px`, maskImage: 'linear-gradient(to top, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)'}} />
    {Array.from({length: 36}, (_, i) => {
      const x = (i * 197) % 1080;
      const y = 1920 - ((f * (1 + (i % 5) * 0.6) + i * 131) % 2100);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: 9, background: i % 4 ? CYAN : RED, opacity: 0.25 + (i % 5) * 0.08, boxShadow: glow(i % 4 ? CYAN : RED, 0.4)}} />;
    })}
  </AbsoluteFill>
);

/* ---------- texto que se "decodifica" ---------- */
const GLY = '#$%&@X0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const Decode: React.FC<{text: string; t: number; speed?: number; style?: React.CSSProperties}> = ({text, t, speed = 1.2, style}) => {
  const out = text
    .split('')
    .map((c, i) => {
      if (c === ' ' || c === '.' || c === '$' || c === ',') return t * speed > i ? c : ' ';
      const done = t * speed > i + 6;
      if (done) return c;
      if (t * speed < i) return ' ';
      return GLY[(i * 7 + Math.floor(t * 2)) % GLY.length];
    })
    .join('');
  return <span style={{whiteSpace: 'pre', ...style}}>{out}</span>;
};

const Kicker: React.FC<{t: number; children: React.ReactNode; color?: string; top: number}> = ({t, children, color = CYAN, top}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: '0.32em', color, opacity: interpolate(t, [0, 8], [0, 1], cl), textShadow: glow(color, 0.5)}}>
    {children}
  </div>
);

const Chip: React.FC<{t: number; a: number; children: React.ReactNode; color?: string}> = ({t, a, children, color = GREEN}) => {
  const p = sp(t, a, 12, 260);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 26px', borderRadius: 18, background: 'rgba(10,18,36,0.85)', border: `2px solid ${color}88`, boxShadow: `0 0 24px ${color}44, inset 0 0 18px ${color}22`, fontFamily: SORA, fontWeight: 800, fontSize: 38, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -80}px)`}}>
      <span style={{width: 34, height: 34, borderRadius: 99, background: color, boxShadow: glow(color, 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: BG}}>✓</span>
      {children}
    </div>
  );
};

/* tarjeta holográfica con foto real */
const HoloCard: React.FC<{t: number; src: string; top: number; h: number; color?: string}> = ({t, src, top, h, color = BLUE}) => {
  const p = sp(t, 0, 14, 160);
  const scan = interpolate(t % 60, [0, 60], [-10, 110]);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top, height: h, borderRadius: 28, overflow: 'hidden', border: `3px solid ${color}`, boxShadow: `${glow(color, 1)}, inset 0 0 40px ${color}55`, transform: `perspective(1200px) rotateX(${(1 - p) * 35}deg) scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2)}}>
      <Img src={S(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1) contrast(1.05)'}} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, transparent 55%, ${BG}cc 100%)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: `${scan}%`, height: 6, background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`, boxShadow: glow(CYAN, 0.6), opacity: 0.7}} />
      {/* esquinas tipo HUD */}
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
        <div key={`${x}${y}`} style={{position: 'absolute', [x ? 'right' : 'left']: 14, [y ? 'bottom' : 'top']: 14, width: 40, height: 40, borderColor: CYAN, borderStyle: 'solid', borderWidth: `${y ? 0 : 4}px ${x ? 4 : 0}px ${y ? 4 : 0}px ${x ? 0 : 4}px`}} />
      ))}
    </div>
  );
};

/* tarjeta holográfica con video real */
const HoloVideo: React.FC<{t: number; src: string; from: number; top: number; h: number; color?: string}> = ({t, src, from, top, h, color = BLUE}) => {
  const p = sp(t, 0, 14, 180);
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top, height: h, borderRadius: 28, overflow: 'hidden', border: `3px solid ${color}`, boxShadow: `${glow(color, 1)}, inset 0 0 40px ${color}55`, transform: `perspective(1200px) rotateY(${(1 - p) * -30}deg) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 2)}}>
      <OffthreadVideo src={S(src)} startFrom={Math.round(from * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
        <div key={`${x}${y}`} style={{position: 'absolute', [x ? 'right' : 'left']: 14, [y ? 'bottom' : 'top']: 14, width: 40, height: 40, borderColor: CYAN, borderStyle: 'solid', borderWidth: `${y ? 0 : 4}px ${x ? 4 : 0}px ${y ? 4 : 0}px ${x ? 0 : 4}px`}} />
      ))}
    </div>
  );
};

/* ---------- escenas ---------- */
const Intro: React.FC<{t: number}> = ({t}) => {
  const big = sp(t, 26, 9, 260);
  return (
    <AbsoluteFill>
      <Kicker t={t} top={520}>DESARMADURÍA SARAVIA</Kicker>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 112, color: '#fff', textShadow: glow(BLUE, 0.8), letterSpacing: '-0.02em'}}>
        <Decode text="VENDIMOS A" t={t - 4} speed={1} />
      </div>
      {t >= 26 && (
        <div style={{position: 'absolute', top: 780, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, transform: `scale(${interpolate(big, [0, 1], [2.2, 1])})`, opacity: Math.min(1, big * 2)}}>
          <span style={{fontFamily: SCRIPT, fontSize: 330, color: RED, textShadow: glow(RED, 1.2), lineHeight: 1}}>3</span>
          <span style={{fontFamily: SORA, fontWeight: 800, fontSize: 130, color: '#fff', textShadow: glow(RED, 0.6)}}>CLIENTES</span>
        </div>
      )}
      {t >= 40 && <Kicker t={t - 40} top={1180} color="#fff">SUZUKI · VENTAS REALES</Kicker>}
      {/* anillo de impacto */}
      {t >= 26 && t < 60 && (
        <div style={{position: 'absolute', left: 540 - (t - 26) * 30, top: 960 - (t - 26) * 30, width: (t - 26) * 60, height: (t - 26) * 60, borderRadius: 9999, border: `4px solid ${RED}`, boxShadow: glow(RED, 0.8), opacity: interpolate(t, [26, 60], [1, 0], cl)}} />
      )}
    </AbsoluteFill>
  );
};

/* gráfico que sube detrás del precio */
const Chart: React.FC<{t: number; top: number}> = ({t, top}) => {
  const pts = [[0, 210], [120, 190], [220, 200], [330, 150], [430, 160], [540, 110], [650, 120], [760, 60], [900, 20]];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const len = 1100;
  const draw = interpolate(t, [0, 22], [len, 0], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  return (
    <svg width={900} height={240} style={{position: 'absolute', left: 90, top, overflow: 'visible'}}>
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L900 240 L0 240 Z`} fill="url(#area)" opacity={interpolate(t, [10, 22], [0, 1], cl)} />
      <path d={d} fill="none" stroke={GREEN} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={draw} style={{filter: `drop-shadow(0 0 10px ${GREEN})`}} />
      {t > 22 && <circle cx={900} cy={20} r={12 + Math.sin(t / 3) * 3} fill={GREEN} style={{filter: `drop-shadow(0 0 14px ${GREEN})`}} />}
    </svg>
  );
};

const Swift: React.FC<{t: number}> = ({t}) => {
  const PRICE_AT = 34;
  return (
    <AbsoluteFill>
      <Kicker t={t} top={150}>CLIENTE #1 · MOTOR</Kicker>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 82, color: '#fff', textShadow: glow(BLUE, 0.6)}}>
        <Decode text="SUZUKI SWIFT 1.2" t={t} speed={1.4} />
      </div>
      <HoloCard t={t - 4} src="swift/motor-vano.jpg" top={360} h={560} />
      <Chart t={t - PRICE_AT + 10} top={940} />
      <div style={{position: 'absolute', top: 1020, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 150, color: t >= PRICE_AT + 14 ? GREEN : '#fff', textShadow: glow(t >= PRICE_AT + 14 ? GREEN : BLUE, 0.9), transform: `scale(${t >= PRICE_AT + 14 ? interpolate(t, [PRICE_AT + 14, PRICE_AT + 18, PRICE_AT + 22], [1.2, 0.96, 1], cl) : 1})`}}>
        {t >= PRICE_AT && <Decode text={clp(1078990)} t={(t - PRICE_AT) * 0.7} speed={1} />}
      </div>
      <div style={{position: 'absolute', top: 1230, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 16}}>
        <Chip t={t} a={58}>Cotizó en autopartschile.cl</Chip>
        <Chip t={t} a={68}>Vino a verlo en persona</Chip>
        <Chip t={t} a={78}>Despacho a su automotora</Chip>
      </div>
    </AbsoluteFill>
  );
};

const Master: React.FC<{t: number}> = ({t}) => {
  const PRICE_AT = 30;
  const done = t >= PRICE_AT + 12;
  const fac = sp(t, 58, 13, 200);
  return (
    <AbsoluteFill>
      <Kicker t={t} top={150} color={RED}>CLIENTE #2 · BLOCK DE MOTOR</Kicker>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: glow(RED, 0.5)}}>
        <Decode text="SUZUKI MASTERVAN" t={t} speed={1.4} />
      </div>
      <div style={{position: 'absolute', top: 310, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 46, color: CYAN, textShadow: glow(CYAN, 0.4)}}>
        <Decode text="BLOCK G13B · 1.3" t={t - 8} speed={1.6} />
      </div>
      {t < 58 && <HoloVideo t={t - 4} src="swift/mv_carga.mp4" from={0.9} top={400} h={640} color={RED} />}
      {t >= 58 && (
        <div style={{position: 'absolute', left: 110, right: 110, top: 410, borderRadius: 24, overflow: 'hidden', border: `3px solid ${RED}`, boxShadow: glow(RED, 0.8), transform: `perspective(1200px) rotateY(${(1 - fac) * 40}deg) scale(${0.85 + 0.15 * fac})`, opacity: Math.min(1, fac * 2)}}>
          <Img src={S('swift/factura_mv.png')} style={{display: 'block', width: '100%'}} />
        </div>
      )}
      <div style={{position: 'absolute', top: 1100, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 150, color: done ? GREEN : '#fff', textShadow: glow(done ? GREEN : RED, 0.9), transform: `scale(${done ? interpolate(t, [PRICE_AT + 12, PRICE_AT + 16, PRICE_AT + 20], [1.2, 0.96, 1], cl) : 1})`}}>
        {t >= PRICE_AT && <Decode text={clp(119000)} t={(t - PRICE_AT) * 0.8} speed={1} />}
      </div>
      <div style={{position: 'absolute', top: 1300, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 16}}>
        <Chip t={t} a={44}>Cargado en su camioneta</Chip>
        <Chip t={t} a={62}>Venta con factura</Chip>
      </div>
    </AbsoluteFill>
  );
};


const V_WEB = 40;
const V_CHAT = 54;
const V_LOCAL = 34;
const V_PORT = 84;
const V_CARGA = 32;
const V_RUTA = 66;
export const VITARA_LEN = V_WEB + V_CHAT + V_LOCAL + V_PORT + V_CARGA + V_RUTA;
const V_ITEMS = ['Portalón', 'Refuerzo de parachoques', 'Parachoques trasero'];

/* ruta neón La Pintana → Viña del Mar */
const Ruta: React.FC<{t: number}> = ({t}) => {
  const d = 'M760 1300 C 700 1100, 520 1050, 470 860 S 300 600, 280 470';
  const len = 1000;
  const draw = interpolate(t, [6, 40], [len, 0], {...cl, easing: (x) => x * x * (3 - 2 * x)});
  const pts: [number, number][] = [[760, 1300], [705, 1150], [560, 1030], [470, 860], [380, 680], [280, 470]];
  const k = interpolate(t, [6, 40], [0, 1], cl) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(k));
  const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * (k - i);
  const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (k - i);
  const pin = sp(t, 40, 9, 300);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d={d} fill="none" stroke={`${GREEN}33`} strokeWidth="14" strokeLinecap="round" />
        <path d={d} fill="none" stroke={GREEN} strokeWidth="10" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={draw} style={{filter: `drop-shadow(0 0 12px ${GREEN})`}} />
        <circle cx={760} cy={1300} r={20} fill="#fff" style={{filter: `drop-shadow(0 0 12px ${CYAN})`}} />
        <g transform={`translate(280 470) scale(${pin})`}>
          <circle r={70} fill={GREEN} opacity={0.2} />
          <circle r={26} fill={GREEN} style={{filter: `drop-shadow(0 0 16px ${GREEN})`}} />
        </g>
      </svg>
      {t > 6 && t < 42 && <div style={{position: 'absolute', left: x - 46, top: y - 46, width: 92, height: 92, borderRadius: 99, background: BG, border: `4px solid ${GREEN}`, boxShadow: glow(GREEN, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48}}>🚚</div>}
      <div style={{position: 'absolute', left: 560, top: 1340, fontFamily: SORA, color: '#fff'}}>
        <div style={{fontFamily: MONO, fontSize: 28, color: CYAN, letterSpacing: '0.2em'}}>DESDE</div>
        <div style={{fontWeight: 800, fontSize: 44}}>La Pintana</div>
      </div>
      <div style={{position: 'absolute', left: 380, top: 400, fontFamily: SORA, color: '#fff', opacity: interpolate(t, [40, 48], [0, 1], cl)}}>
        <div style={{fontFamily: MONO, fontSize: 28, color: GREEN, letterSpacing: '0.2em'}}>HASTA</div>
        <div style={{fontWeight: 800, fontSize: 64, textShadow: glow(GREEN, 0.5)}}>Viña del Mar</div>
      </div>
    </AbsoluteFill>
  );
};

const Vitara: React.FC<{t: number}> = ({t}) => {
  const a1 = V_WEB, a2 = a1 + V_CHAT, a3 = a2 + V_LOCAL, a4 = a3 + V_PORT, a5 = a4 + V_CARGA;
  const webP = sp(t, 2, 14, 170);
  const chatP = sp(t, a1 + 2, 14, 170);
  const scroll = interpolate(t, [a1 + 14, a2 - 6], [0, -40], {...cl, easing: (x) => x * x * (3 - 2 * x)});
  return (
    <AbsoluteFill>
      <Kicker t={t} top={150} color={GREEN}>CLIENTE #3 · DESDE LA WEB</Kicker>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: glow(GREEN, 0.5)}}>
        <Decode text="SUZUKI VITARA AZUL" t={t} speed={1.4} />
      </div>
      {/* 1. lo vio publicado */}
      {t < a1 && (
        <>
          <div style={{position: 'absolute', left: 320, width: 440, top: 340, borderRadius: 34, overflow: 'hidden', border: `4px solid ${GREEN}`, boxShadow: glow(GREEN, 0.9), transform: `perspective(1200px) rotateX(${(1 - webP) * 40}deg) scale(${0.8 + 0.2 * webP})`, opacity: Math.min(1, webP * 2)}}>
            <Img src={S('swift/web_vitara.png')} style={{display: 'block', width: '100%'}} />
          </div>
          <div style={{position: 'absolute', top: 1520, left: 90, right: 90}}><Chip t={t} a={10}>Lo vio publicado en autopartschile.cl</Chip></div>
        </>
      )}
      {/* 2. escribió */}
      {t >= a1 && t < a2 && (
        <div style={{position: 'absolute', left: 130, right: 130, top: 380, height: 780, borderRadius: 40, overflow: 'hidden', border: `4px solid ${GREEN}`, boxShadow: `${glow(GREEN, 0.9)}`, background: '#efe7de', transform: `translateY(${(1 - chatP) * 400}px) rotate(${(1 - chatP) * 6}deg)`, opacity: Math.min(1, chatP * 2)}}>
          <Img src={S('swift/chat_vitara.png')} style={{width: '100%', transform: `translateY(${scroll}px)`}} />
        </div>
      )}
      {t >= a1 + 16 && t < a2 && (
        <div style={{position: 'absolute', top: 1260, left: 0, right: 0, textAlign: 'center', fontFamily: SCRIPT, fontSize: 84, color: '#fff', textShadow: glow(GREEN, 0.8), opacity: interpolate(t, [a1 + 16, a1 + 24], [0, 1], cl)}}>
          "¿el portalón está disponible?"
        </div>
      )}
      {/* 3. el auto en el local */}
      <Sequence from={a2} durationInFrames={V_LOCAL}><HoloVideo t={t - a2} src="swift/vitara_local_anon.mp4" from={0} top={360} h={980} color={GREEN} /></Sequence>
      {t >= a2 && t < a3 && <div style={{position: 'absolute', top: 1380, left: 90, right: 90}}><Chip t={t - a2} a={4}>En desarme en nuestro local</Chip></div>}
      {/* 4. lo que se llevó */}
      <Sequence from={a3} durationInFrames={V_PORT}><HoloVideo t={t - a3} src="swift/vitara_portalon.mp4" from={0.6} top={360} h={760} color={GREEN} /></Sequence>
      {t >= a3 && t < a4 && (
        <>
          <div style={{position: 'absolute', top: 1150, left: 90, fontFamily: MONO, fontWeight: 800, fontSize: 34, color: GREEN, letterSpacing: '0.2em', textShadow: glow(GREEN, 0.5)}}>SE LLEVÓ:</div>
          <div style={{position: 'absolute', top: 1210, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 14}}>
            {V_ITEMS.map((it, i) => <Chip key={it} t={t - a3} a={8 + i * 12}>{it}</Chip>)}
            <Chip t={t - a3} a={48} color={CYAN}>+ un corte que sale mañana</Chip>
          </div>
        </>
      )}
      {/* 5. cargado */}
      <Sequence from={a4} durationInFrames={V_CARGA}><HoloVideo t={t - a4} src="swift/vitara_carga.mp4" from={1.0} top={360} h={980} color={GREEN} /></Sequence>
      {t >= a4 && t < a5 && <div style={{position: 'absolute', top: 1380, left: 90, right: 90}}><Chip t={t - a4} a={2}>Cargado y listo</Chip></div>}
      {/* 6. despacho a región */}
      {t >= a5 && (
        <>
          <Ruta t={t - a5} />
          <div style={{position: 'absolute', top: 1520, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <div style={{fontFamily: SORA, fontWeight: 800, fontSize: 52, color: BG, background: GREEN, borderRadius: 18, padding: '10px 30px', boxShadow: glow(GREEN, 0.8), opacity: interpolate(t - a5, [44, 50], [0, 1], cl), transform: `scale(${interpolate(t - a5, [44, 48, 52], [1.4, 0.95, 1], cl)})`}}>
              El corte sale mañana a región 📦
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

const STOCK_N = 242;
const BRANDS = ['Suzuki', 'Kia', 'Chevrolet', 'Jeep'];
const Stock: React.FC<{t: number}> = ({t}) => {
  const n = interpolate(t, [14, 50], [0, STOCK_N], {...cl, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const done = t >= 50;
  return (
    <AbsoluteFill>
      <Kicker t={t} top={260}>¿Y QUÉ NOS QUEDA?</Kicker>
      {/* radar */}
      {[0, 1, 2, 3].map((i) => {
        const k = ((t + i * 18) % 72) / 72;
        return <div key={i} style={{position: 'absolute', left: 540 - 420 * k, top: 860 - 420 * k, width: 840 * k, height: 840 * k, borderRadius: 9999, border: `3px solid ${BLUE}`, opacity: (1 - k) * 0.8, boxShadow: glow(BLUE, 0.4)}} />;
      })}
      <div style={{position: 'absolute', left: 540 - 210, top: 860 - 210, width: 420, height: 420, borderRadius: 9999, border: `6px solid ${done ? RED : BLUE}`, boxShadow: `${glow(done ? RED : BLUE, 1)}, inset 0 0 60px ${done ? RED : BLUE}66`, background: `${BG}dd`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${done ? interpolate(t, [50, 54, 58], [1.12, 0.97, 1], cl) : 1})`}}>
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 170, color: '#fff', lineHeight: 1, textShadow: glow(done ? RED : BLUE, 0.8)}}>{Math.round(n)}</div>
        <div style={{fontFamily: SORA, fontWeight: 800, fontSize: 34, color: CYAN, letterSpacing: '0.12em', marginTop: 10}}>REPUESTOS</div>
        <div style={{fontFamily: SORA, fontWeight: 400, fontSize: 30, color: '#fff'}}>en stock hoy</div>
      </div>
      {/* marcas orbitando */}
      {BRANDS.map((b, i) => {
        const a = (i / BRANDS.length) * Math.PI * 2 + t / 40;
        const p = sp(t, 56 + i * 5, 12, 240);
        return (
          <div key={b} style={{position: 'absolute', left: 540 + Math.cos(a) * 360 - 120, top: 860 + Math.sin(a) * 300 - 36, width: 240, textAlign: 'center', padding: '14px 0', borderRadius: 16, background: 'rgba(10,18,36,0.9)', border: `2px solid ${CYAN}`, boxShadow: glow(CYAN, 0.4), fontFamily: SORA, fontWeight: 800, fontSize: 36, color: '#fff', opacity: Math.min(1, p * 2), transform: `scale(${p})`}}>
            {b}
          </div>
        );
      })}
      {t >= 70 && <Kicker t={t - 70} top={1420} color="#fff">TODO PUBLICADO EN AUTOPARTSCHILE.CL</Kicker>}
    </AbsoluteFill>
  );
};

const STEPS = [
  {ic: '💻', tx: 'Cotizas en la web'},
  {ic: '💬', tx: 'Te respondemos'},
  {ic: '💳', tx: 'Pagas en línea o local'},
  {ic: '🚚', tx: 'Despacho a todo Chile'},
];
const Flujo: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: glow(BLUE, 0.6)}}>
      <Decode text="ASÍ DE FÁCIL" t={t} speed={1.3} />
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <line x1="200" y1="520" x2="200" y2={interpolate(t, [10, 60], [520, 1480], cl)} stroke={BLUE} strokeWidth="6" style={{filter: `drop-shadow(0 0 10px ${BLUE})`}} />
    </svg>
    {STEPS.map((s, i) => {
      const a = 10 + i * 14;
      const p = sp(t, a, 11, 260);
      const y = 470 + i * 320;
      return (
        <React.Fragment key={s.tx}>
          <div style={{position: 'absolute', left: 200 - 70, top: y, width: 140, height: 140, borderRadius: 9999, background: BG, border: `5px solid ${t >= a ? (i === 3 ? GREEN : BLUE) : '#223'}`, boxShadow: t >= a ? glow(i === 3 ? GREEN : BLUE, 0.9) : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, transform: `scale(${0.6 + 0.4 * p})`}}>{s.ic}</div>
          <div style={{position: 'absolute', left: 330, right: 50, top: y + 40, fontFamily: SORA, fontWeight: 800, fontSize: 46, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 60}px)`, textShadow: glow(BLUE, 0.3)}}>
            <span style={{fontFamily: MONO, color: CYAN, fontSize: 34, marginRight: 14}}>0{i + 1}</span>
            {s.tx}
          </div>
        </React.Fragment>
      );
    })}
  </AbsoluteFill>
);

const Fin: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 12, 200);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 260, left: 80, right: 80, borderRadius: 30, overflow: 'hidden', boxShadow: `${glow(BLUE, 1.1)}`, border: `3px solid ${BLUE}`, transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2)}}>
        <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
      </div>
      <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: SCRIPT, fontSize: 96, color: '#fff', textShadow: glow(RED, 0.9), opacity: interpolate(t, [10, 18], [0, 1], cl)}}>
        ¿El próximo eres tú?
      </div>
      <div style={{position: 'absolute', top: 940, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 80, color: '#fff', textShadow: glow(BLUE, 0.7)}}>
        <Decode text="AUTOPARTSCHILE.CL" t={t - 20} speed={1.5} />
      </div>
      <div style={{position: 'absolute', top: 1080, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: interpolate(t, [36, 44], [0, 1], cl)}}>
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 58, color: BG, background: GREEN, borderRadius: 18, padding: '12px 34px', boxShadow: glow(GREEN, 0.8)}}>WhatsApp +56 9 5381 7335</div>
      </div>
      <div style={{position: 'absolute', top: 1230, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', opacity: interpolate(t, [48, 56], [0, 1], cl)}}>
        {[['242', 'repuestos'], ['3', 'clientes reales'], ['CL', 'despacho a todo Chile']].map(([a, b]) => (
          <div key={b} style={{textAlign: 'center', width: 280}}>
            <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 72, color: '#fff', textShadow: glow(CYAN, 0.6)}}>{a}</div>
            <div style={{fontFamily: SORA, fontWeight: 400, fontSize: 28, color: CYAN}}>{b}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composición ---------- */
export const NeonMotores: React.FC = () => {
  const f = useCurrentFrame();
  const l = (k: Key) => f - T[k][0];
  const tint = f >= T.master[0] && f < T.master[1] ? RED : f >= T.vitara[0] && f < T.vitara[1] ? GREEN : BLUE;
  // destello entre escenas
  const cut = Math.min(...ORDER.map(([k]) => Math.abs(f - T[k][0])));
  return (
    <AbsoluteFill style={{background: BG}}>
      <Bg f={f} tint={tint} />
      <Sequence {...at(T.intro)}><Intro t={l('intro')} /></Sequence>
      <Sequence {...at(T.swift)}><Swift t={l('swift')} /></Sequence>
      <Sequence {...at(T.master)}><Master t={l('master')} /></Sequence>
      <Sequence {...at(T.vitara)}><Vitara t={l('vitara')} /></Sequence>
      <Sequence {...at(T.stock)}><Stock t={l('stock')} /></Sequence>
      <Sequence {...at(T.flujo)}><Flujo t={l('flujo')} /></Sequence>
      <Sequence {...at(T.fin)}><Fin t={l('fin')} /></Sequence>
      <AbsoluteFill style={{background: CYAN, opacity: f > 0 && cut < 4 ? (4 - cut) * 0.08 : 0, pointerEvents: 'none'}} />
      {/* viñeta */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none'}} />

      {/* ---- sonido ---- */}
      <Audio src={S('audio/sfx_riser.wav')} volume={0.4} />
      {Array.from({length: 8}, (_, i) => (
        <Sequence key={'d' + i} from={4 + i * 2}><Audio src={S('audio/sfx_key.wav')} volume={0.3} /></Sequence>
      ))}
      <Sequence from={26}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.55} /></Sequence>
      <Sequence from={27}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.35} /></Sequence>
      {/* swift */}
      <Sequence from={T.swift[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      {Array.from({length: 10}, (_, i) => (
        <Sequence key={'s' + i} from={T.swift[0] + i * 1}><Audio src={S('audio/sfx_key.wav')} volume={0.25} /></Sequence>
      ))}
      <Sequence from={T.swift[0] + 26}><Audio src={S('audio/sfx_billcount.wav')} volume={0.8} /></Sequence>
      <Sequence from={T.swift[0] + 47}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.75} /></Sequence>
      <Sequence from={T.swift[0] + 49}><Audio src={S('audio/sfx_coins.wav')} volume={0.4} /></Sequence>
      {[58, 68, 78].map((x) => (
        <Sequence key={'c' + x} from={T.swift[0] + x}><Audio src={S('audio/sfx_pop.wav')} volume={0.45} /></Sequence>
      ))}
      {/* mastervan */}
      <Sequence from={T.master[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.master[0] + 22}><Audio src={S('audio/sfx_billcount.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.master[0] + 41}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.7} /></Sequence>
      <Sequence from={T.master[0] + 44}><Audio src={S('audio/sfx_pop.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.master[0] + 58}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.master[0] + 62}><Audio src={S('audio/sfx_correct.wav')} volume={0.4} /></Sequence>
      {/* vitara */}
      <Sequence from={T.vitara[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.vitara[0] + 10}><Audio src={S('audio/sfx_pop.wav')} volume={0.4} /></Sequence>
      <Sequence from={T.vitara[0] + V_WEB}><Audio src={S('audio/sfx_ding.wav')} volume={0.55} /></Sequence>
      <Sequence from={T.vitara[0] + V_WEB + V_CHAT - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.vitara[0] + V_WEB + V_CHAT + V_LOCAL - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {[8, 20, 32].map((x) => (
        <Sequence key={'vi' + x} from={T.vitara[0] + V_WEB + V_CHAT + V_LOCAL + x}><Audio src={S('audio/sfx_coin.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={T.vitara[0] + V_WEB + V_CHAT + V_LOCAL + 48}><Audio src={S('audio/sfx_pop.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.vitara[0] + V_WEB + V_CHAT + V_LOCAL + 54}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.6} /></Sequence>
      <Sequence from={T.vitara[0] + V_WEB + V_CHAT + V_LOCAL + V_PORT - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={T.vitara[0] + VITARA_LEN - V_RUTA + 6}><Audio src={S('audio/sfx_rev.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.vitara[0] + VITARA_LEN - V_RUTA + 40}><Audio src={S('audio/sfx_map.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.vitara[0] + VITARA_LEN - V_RUTA + 44}><Audio src={S('audio/sfx_correct.wav')} volume={0.4} /></Sequence>
      {/* stock */}
      <Sequence from={T.stock[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      {Array.from({length: 12}, (_, i) => (
        <Sequence key={'t' + i} from={T.stock[0] + 14 + i * 3}><Audio src={S('audio/sfx_tick.wav')} volume={0.25} /></Sequence>
      ))}
      <Sequence from={T.stock[0] + 50}><Audio src={S('audio/sfx_impact.wav')} volume={0.5} /></Sequence>
      {BRANDS.map((b, i) => (
        <Sequence key={'b' + i} from={T.stock[0] + 56 + i * 5}><Audio src={S('audio/sfx_blip.wav')} volume={0.3} /></Sequence>
      ))}
      {/* flujo */}
      <Sequence from={T.flujo[0] - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      {STEPS.map((s, i) => (
        <Sequence key={'f' + i} from={T.flujo[0] + 10 + i * 14}><Audio src={S('audio/sfx_pop.wav')} volume={0.45} /></Sequence>
      ))}
      <Sequence from={T.flujo[0] + 52}><Audio src={S('audio/sfx_correct.wav')} volume={0.35} /></Sequence>
      {/* fin */}
      <Sequence from={T.fin[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.5} /></Sequence>
      <Sequence from={T.fin[0] + 36}><Audio src={S('audio/sfx_ding.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
