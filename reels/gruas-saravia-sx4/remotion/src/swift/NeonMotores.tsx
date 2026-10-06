import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Reel estilo "motion graphics neón" (referencia: reel de pantalla con
   texto que se decodifica, gráficos que suben, radares y tarjetas que
   brillan). Datos reales:
   - Motor Suzuki Swift 1.2 vendido en $1.078.990 (dato del dueño); cotizó
     en la web, vino a verlo y se le despachó a su automotora.
   - Motor Suzuki Mastervan G13B 1.3 vendido (precio NO confirmado: no se
     muestra).
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

/* ---------- escenas ---------- */
const Intro: React.FC<{t: number}> = ({t}) => {
  const big = sp(t, 26, 9, 260);
  return (
    <AbsoluteFill>
      <Kicker t={t} top={520}>DESARMADURÍA SARAVIA</Kicker>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 112, color: '#fff', textShadow: glow(BLUE, 0.8), letterSpacing: '-0.02em'}}>
        <Decode text="VENDIMOS" t={t - 4} speed={1} />
      </div>
      {t >= 26 && (
        <div style={{position: 'absolute', top: 780, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, transform: `scale(${interpolate(big, [0, 1], [2.2, 1])})`, opacity: Math.min(1, big * 2)}}>
          <span style={{fontFamily: SCRIPT, fontSize: 330, color: RED, textShadow: glow(RED, 1.2), lineHeight: 1}}>2</span>
          <span style={{fontFamily: SORA, fontWeight: 800, fontSize: 130, color: '#fff', textShadow: glow(RED, 0.6)}}>MOTORES</span>
        </div>
      )}
      {t >= 40 && <Kicker t={t - 40} top={1180} color="#fff">SUZUKI · CLIENTES REALES</Kicker>}
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
      <Kicker t={t} top={150}>MOTOR #1</Kicker>
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
  const st = sp(t, 40, 9, 300);
  return (
    <AbsoluteFill>
      <Kicker t={t} top={150} color={RED}>MOTOR #2</Kicker>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: SORA, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: glow(RED, 0.5)}}>
        <Decode text="SUZUKI MASTERVAN" t={t} speed={1.4} />
      </div>
      <div style={{position: 'absolute', top: 310, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 46, color: CYAN, textShadow: glow(CYAN, 0.4)}}>
        <Decode text="G13B · 1.3 · COMPLETO" t={t - 8} speed={1.6} />
      </div>
      <HoloCard t={t - 6} src="suzuki/mastervan.jpg" top={420} h={600} color={RED} />
      {t >= 40 && (
        <div style={{position: 'absolute', top: 1090, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{fontFamily: SORA, fontWeight: 800, fontSize: 140, color: RED, border: `8px solid ${RED}`, borderRadius: 26, padding: '0 40px 10px', textShadow: glow(RED, 1), boxShadow: `${glow(RED, 0.8)}, inset ${glow(RED, 0.4)}`, transform: `rotate(-6deg) scale(${interpolate(st, [0, 1], [2.4, 1])})`, opacity: Math.min(1, st * 3)}}>
            VENDIDO
          </div>
        </div>
      )}
      {t >= 54 && (
        <div style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center', fontFamily: SCRIPT, fontSize: 92, color: '#fff', textShadow: glow(BLUE, 0.8), opacity: interpolate(t, [54, 62], [0, 1], cl)}}>
          otro cliente más
        </div>
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
        {[['242', 'repuestos'], ['2', 'motores vendidos'], ['CL', 'despacho a todo Chile']].map(([a, b]) => (
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
  const tint = f >= T.master[0] && f < T.master[1] ? RED : BLUE;
  // destello entre escenas
  const cut = Math.min(...ORDER.map(([k]) => Math.abs(f - T[k][0])));
  return (
    <AbsoluteFill style={{background: BG}}>
      <Bg f={f} tint={tint} />
      <Sequence {...at(T.intro)}><Intro t={l('intro')} /></Sequence>
      <Sequence {...at(T.swift)}><Swift t={l('swift')} /></Sequence>
      <Sequence {...at(T.master)}><Master t={l('master')} /></Sequence>
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
      <Sequence from={T.master[0] + 18}><Audio src={S('audio/sfx_riser.wav')} volume={0.35} /></Sequence>
      <Sequence from={T.master[0] + 40}><Audio src={S('audio/sfx_pa.wav')} volume={0.6} /></Sequence>
      <Sequence from={T.master[0] + 41}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={T.master[0] + 54}><Audio src={S('audio/sfx_sparkle.wav')} volume={0.3} /></Sequence>
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
