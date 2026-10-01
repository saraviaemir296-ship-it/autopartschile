import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../v2/Shot';
import {MONT} from '../v2/Type4';
import {Wa} from '../v2/LogoReveal';
import {E, K, cl} from '../v2/look';

/**
 * SX4 ENTRA A DESARME · "anatomía" del auto: radiografía, piezas señaladas
 * que vuelan a autopartschile.cl, prueba del motor andando y CTA a comentar.
 */
const S = (f: string) => staticFile(f);
const CYAN = '#7FE3FF';
const NAVY = '#06122A';

export const A = {
  hook: [0, 100], // foto real → escaneo a radiografía
  motorTag: [100, 145],
  motor: [145, 295], // encendido real + motor
  atlas: [295, 615],
  web: [615, 765],
  cta: [765, 945],
} as const;
export const A_TOTAL = 945;

/* coordenadas dentro de la foto del auto (1080x626), que va en y = CAR_Y */
const CAR_Y = 470;
type Part = {name: string; short: string; x: number; y: number; lx: number; ly: number; price: string; img?: string};
const PARTS: Part[] = [
  {name: 'Motor M16A 1.6 VVT', short: 'Motor M16A 1.6 VVT', x: 820, y: 245, lx: 380, ly: 500, price: 'Consultar'},
  {name: 'Focos delanteros RH y LH', short: 'Focos delanteros (par)', x: 805, y: 300, lx: 60, ly: 520, price: '$119.990 el par', img: 'p-focos-delanteros.jpg'},
  {name: 'Parachoque completo', short: 'Parachoque delantero', x: 965, y: 400, lx: 60, ly: 520, price: '$119.990', img: 'p-parachoque.jpg'},
  {name: 'Refuerzo de parachoque', short: 'Refuerzo parachoque', x: 930, y: 455, lx: 60, ly: 520, price: '$79.990', img: 'p-refuerzo.jpg'},
  {name: 'Computador ECU AT 4x4', short: 'Computador ECU AT 4x4', x: 690, y: 210, lx: 60, ly: 600, price: '$224.990'},
  {name: 'Radiador de calefacción', short: 'Radiador calefacción', x: 560, y: 190, lx: 60, ly: 600, price: '$94.990', img: 'p-radiador.jpg'},
  {name: 'Foco trasero derecho', short: 'Foco trasero derecho', x: 140, y: 265, lx: 600, ly: 520, price: '$84.990', img: 'p-foco-trasero.jpg'},
];
// frame (dentro de atlas) en que aparece cada pieza (la 0 = motor ya se mostró)
const PART_AT = [0, 10, 55, 100, 145, 190, 235];
const ATLAS_END = 280;

const sp = (f: number, d = 0, damping = 13, stiffness = 210) => spring({frame: f - d, fps: 30, config: {damping, stiffness, mass: 0.6}});
const fade = (f: number, a: number, len = 8) => interpolate(f, [a, a + len], [0, 1], {...cl, easing: E.out});

/* ---------- foto real + radiografía con línea de escaneo ---------- */
const Car: React.FC<{scan: number; zoom?: number}> = ({scan, zoom = 1}) => {
  const sx = scan * 1080;
  return (
    <div style={{position: 'absolute', left: 0, top: CAR_Y, width: 1080, height: 626, transform: `scale(${zoom})`, transformOrigin: '60% 50%'}}>
      <Img src={S('atlas/sx4-car.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 626, clipPath: `inset(0 0 0 ${sx}px)`}} />
      <Img src={S('atlas/sx4-xray.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 626, clipPath: `inset(0 ${1080 - sx}px 0 0)`}} />
      {scan > 0 && scan < 1 && (
        <div style={{position: 'absolute', top: -20, bottom: -20, left: sx - 3, width: 6, background: CYAN, boxShadow: `0 0 30px 10px ${CYAN}`}} />
      )}
    </div>
  );
};

/* ---------- marcador + etiqueta de una pieza ---------- */
const Marker: React.FC<{p: Part; t: number; active: boolean}> = ({p, t, active}) => {
  const pop = sp(t, 0, 10, 260);
  const pulse = 1 + 0.35 * Math.max(0, Math.sin(t / 5));
  const lab = sp(t, 5, 14, 200);
  const px = p.x;
  const py = CAR_Y + p.y;
  const labelX = p.lx;
  const labelY = p.ly;
  const below = labelY > py;
  return (
    <>
      <div style={{position: 'absolute', left: px - 22, top: py - 22, width: 44, height: 44, borderRadius: 99, border: `4px solid ${active ? '#fff' : CYAN}`, background: active ? K.red : 'rgba(127,227,255,0.35)', transform: `scale(${pop * (active ? pulse : 0.7)})`, boxShadow: `0 0 22px ${active ? K.red : CYAN}`}} />
      {active && (
        <>
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
            <line x1={px} y1={py} x2={labelX + 40} y2={below ? labelY : labelY + 118} stroke="#fff" strokeWidth={3} strokeDasharray="1200" strokeDashoffset={1200 * (1 - lab)} />
          </svg>
          <div style={{position: 'absolute', left: labelX, top: labelY, width: p.img ? 420 : undefined, opacity: Math.min(1, lab * 2), transform: `translateY(${(1 - lab) * 16}px) scale(${0.9 + 0.1 * lab})`, transformOrigin: 'left top', fontFamily: MONT}}>
            {p.img && (
              <div style={{width: 420, height: 230, borderRadius: 14, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 14px 34px rgba(0,0,0,0.5)', background: '#fff'}}>
                <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
            )}
            <div style={{display: 'inline-block', marginTop: p.img ? 10 : 0, background: '#fff', color: '#0b0b0b', fontWeight: 900, fontSize: p.img ? 34 : 44, padding: '6px 16px 8px', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)'}}>
              {p.name}
            </div>
            <div style={{display: 'flex', gap: 10, marginTop: 8}}>
              {p.price === 'Consultar' ? (
                <span style={{background: '#16A34A', color: '#fff', fontWeight: 800, fontSize: 30, padding: '4px 14px', borderRadius: 10}}>✓ Andando</span>
              ) : (
                <span style={{background: K.red, color: '#fff', fontWeight: 900, fontSize: 40, padding: '2px 16px 4px', borderRadius: 10}}>{p.price}</span>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

/* ---------- panel "autopartschile.cl" que se va llenando ---------- */
const ROW_H = 44;
const PANEL_Y = 1130;
const Panel: React.FC<{rows: {name: string; price: string; t: number}[]; show: number; footer: number}> = ({rows, show, footer}) => (
  <div style={{position: 'absolute', left: 60, right: 140, top: PANEL_Y, opacity: show, transform: `translateY(${(1 - show) * 40}px)`, fontFamily: MONT}}>
    <div style={{background: 'rgba(6,18,42,0.92)', border: `2px solid ${CYAN}`, borderRadius: 22, padding: '14px 22px 12px', boxShadow: `0 0 40px rgba(127,227,255,0.25)`}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontWeight: 900, fontSize: 28}}>
        <span>autopartschile.cl</span>
        <span style={{color: CYAN, fontSize: 22, fontWeight: 800}}>SUZUKI SX4 · EN DESARME</span>
      </div>
      <div style={{marginTop: 8, height: 2, background: 'rgba(127,227,255,0.35)'}} />
      {rows.map((r, i) => {
        const p = sp(r.t, 0, 14, 220);
        if (r.t < 0) return null;
        return (
          <div key={i} style={{height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontWeight: 700, fontSize: 27, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -40}px)`, borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
            <span>{r.name}</span>
            <span style={{fontSize: 26, fontWeight: 900, color: '#4ADE80'}}>{r.price}</span>
          </div>
        );
      })}
      <div style={{marginTop: 8, fontSize: 22, fontWeight: 700, color: CYAN, opacity: footer}}>+ carrocería · suspensión · 4x4 · electrónica y más</div>
    </div>
  </div>
);

/* ---------- ficha que vuela de la pieza al panel ---------- */
const Fly: React.FC<{p: Part; t: number; row: number}> = ({p, t, row}) => {
  const k = interpolate(t, [26, 42], [0, 1], {...cl, easing: E.inOut});
  if (t < 26 || t > 44) return null;
  const x0 = p.x;
  const y0 = CAR_Y + p.y;
  const x1 = 300;
  const y1 = PANEL_Y + 64 + row * ROW_H;
  const x = x0 + (x1 - x0) * k;
  const y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 160;
  return (
    <div style={{position: 'absolute', left: x - 90, top: y - 50, width: 180, height: 100, borderRadius: 12, overflow: 'hidden', border: `3px solid ${CYAN}`, background: NAVY, color: CYAN, fontFamily: MONT, fontWeight: 900, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.55 * k})`, boxShadow: `0 0 26px ${CYAN}`}}>
      {p.img ? <Img src={S('atlas/' + p.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : '+ web'}
    </div>
  );
};

const Title: React.FC<{kicker: string; text: string; red?: string; t: number}> = ({kicker, text, red, t}) => {
  const p = sp(t, 0, 13, 200);
  return (
    <div style={{position: 'absolute', top: 250, left: 60, right: 140, fontFamily: MONT, color: '#fff', opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px)`}}>
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '0.16em', color: CYAN}}>{kicker}</div>
      <div style={{marginTop: 6, fontSize: 70, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.0}}>
        {text} {red && <span style={{background: K.red, padding: '0 12px'}}>{red}</span>}
      </div>
    </div>
  );
};

const Bg: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #0B2347 0%, ${NAVY} 55%, #02060F 100%)`}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(127,227,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(127,227,255,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
  </AbsoluteFill>
);

export const AtlasSX4: React.FC<{music?: boolean}> = ({music = true}) => {
  const f = useCurrentFrame();
  // escaneo: 60→100 en el gancho
  const scan = interpolate(f, [58, 98], [0, 1], {...cl, easing: E.inOut});
  const inAtlas = f >= A.atlas[0] && f < A.atlas[1];
  const at = f - A.atlas[0];
  const rows = PARTS.map((p, i) => ({name: p.short, price: p.price === 'Consultar' ? 'CONSULTAR' : p.price.replace(' el par', ''), t: i === 0 ? at : at - PART_AT[i] - 40}));
  return (
    <AbsoluteFill style={{backgroundColor: NAVY}}>
      {/* 1 · GANCHO + escaneo */}
      <Sequence from={0} durationInFrames={A.motor[0]}>
        <Bg />
        <Car scan={scan} zoom={interpolate(f, [0, 100], [1.12, 1.0], {...cl, easing: E.out})} />
        <Sequence durationInFrames={58}>
          <Title kicker="¿SE ACUERDAN DEL SX4" text="de las" red="109 multas?" t={f} />
        </Sequence>
        <Sequence from={58} durationInFrames={87}>
          <Title kicker="ENTRÓ A DESARME" text="Mira lo que" red="trae adentro" t={f - 58} />
        </Sequence>
        <Sequence from={A.motorTag[0]} durationInFrames={45}>
          <Marker p={PARTS[0]} t={f - A.motorTag[0]} active />
        </Sequence>
      </Sequence>

      {/* 2 · PRUEBA: motor real */}
      <Sequence from={A.motor[0]} durationInFrames={A.motor[1] - A.motor[0]}>
        <Sequence durationInFrames={120}>
          <OffthreadVideo src={S('atlas/encendido.mp4')} volume={1} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(f - A.motor[0], [0, 120], [1.0, 1.08], cl)})`}} />
        </Sequence>
        <Sequence from={120}>
          <AbsoluteFill style={{overflow: 'hidden'}}>
            <OffthreadVideo src={S('atlas/motor.mp4')} startFrom={Math.round(5.2 * 30)} volume={0.5} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)'}} />
          </AbsoluteFill>
        </Sequence>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)'}} />
        <div style={{position: 'absolute', top: 260, left: 60, right: 140, fontFamily: MONT, color: '#fff'}}>
          {f - A.motor[0] < 58 ? (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: K.red, fontWeight: 900, fontSize: 56, fontStyle: 'italic', textTransform: 'uppercase', padding: '8px 22px 12px', borderRadius: 14, transform: `scale(${sp(f - A.motor[0])})`, transformOrigin: 'left'}}>
              <span style={{width: 22, height: 22, borderRadius: 99, background: '#fff', opacity: (f % 20) < 12 ? 1 : 0.3}} /> Encendido en vivo
            </div>
          ) : (
            <>
              <div style={{display: 'inline-block', background: '#fff', color: '#111', fontWeight: 900, fontSize: 58, padding: '10px 22px 12px', borderRadius: 14, transform: `scale(${sp(f - A.motor[0], 58)})`, transformOrigin: 'left'}}>MOTOR M16A 1.6 VVT</div>
              <br />
              <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 12, background: '#16A34A', fontWeight: 900, fontSize: 50, padding: '6px 22px 10px', borderRadius: 14, transform: `scale(${sp(f - A.motor[0], 66)})`, transformOrigin: 'left'}}>✓ ANDANDO</div>
              <div style={{marginTop: 12, fontSize: 30, fontWeight: 700, opacity: fade(f - A.motor[0], 84)}}>Caja automática con falla · se informa siempre</div>
            </>
          )}
        </div>
      </Sequence>

      {/* 3 · ATLAS: piezas que vuelan a la web */}
      <Sequence from={A.atlas[0]} durationInFrames={A.atlas[1] - A.atlas[0]}>
        <Bg />
        <Car scan={1} />
        <Title kicker="ANATOMÍA SUZUKI SX4 · 4x4" text="Repuestos con" red="precio real" t={at} />
        {PARTS.map((p, i) => {
          const t = at - PART_AT[i] + (i === 0 ? 40 : 0);
          if (t < 0) return null;
          const next = i + 1 < PARTS.length ? PART_AT[i + 1] : ATLAS_END;
          const active = i > 0 && at >= PART_AT[i] && at < next;
          return (
            <React.Fragment key={i}>
              <Marker p={p} t={t} active={active} />
              {i > 0 && <Fly p={p} t={at - PART_AT[i]} row={i} />}
            </React.Fragment>
          );
        })}
        <Panel rows={rows} show={inAtlas ? fade(at, 0, 12) : 0} footer={fade(at, ATLAS_END - 10, 12)} />
      </Sequence>

      {/* 4 · YA EN LA WEB */}
      <Sequence from={A.web[0]} durationInFrames={75}>
        <OffthreadVideo src={S('atlas/web_7362820f.mp4')} startFrom={15} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        {/* la tarjeta del sitio aún dice "sin fallas": se corrige en pantalla */}
        <div style={{position: 'absolute', left: 210, top: 711, width: 312, height: 46, background: '#0b0b0b', color: '#fff', fontFamily: MONT, fontWeight: 800, fontSize: 23, display: 'flex', alignItems: 'center', paddingLeft: 10, whiteSpace: 'nowrap'}}>INTEGRAL ·&nbsp;<span style={{color: '#FCA5A5'}}>CAJA MALA</span></div>
      </Sequence>
      <Sequence from={A.web[0] + 75} durationInFrames={75}>
        <OffthreadVideo src={S('atlas/web_b02931f7.mp4')} startFrom={15} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>
      <Sequence from={A.web[0]} durationInFrames={A.web[1] - A.web[0]}>
        <div style={{position: 'absolute', left: 0, right: 80, top: 1330, display: 'flex', justifyContent: 'center', fontFamily: MONT}}>
          <div style={{background: K.red, color: '#fff', fontWeight: 900, fontSize: 50, padding: '12px 26px 16px', borderRadius: 16, textTransform: 'uppercase', fontStyle: 'italic', boxShadow: '0 16px 40px rgba(0,0,0,0.45)', transform: `scale(${sp(f - A.web[0])}) rotate(-2deg)`}}>
            {f - A.web[0] < 75 ? 'Ya publicado en la web' : 'Búscalo en 30 segundos'}
          </div>
        </div>
      </Sequence>

      {/* 5 · CTA */}
      <Sequence from={A.cta[0]} durationInFrames={A.cta[1] - A.cta[0]}>
        <Bg />
        <AbsoluteFill style={{opacity: 0.35}}><Car scan={1} /></AbsoluteFill>
        <CTA t={f - A.cta[0]} />
      </Sequence>

      <Grain opacity={0.05} />

      {/* sonido */}
      {music && <Audio src={S('audio/music_fallback.wav')} volume={(fr) => interpolate(fr, [0, A.motor[0] - 4, A.motor[0] + 4, A.motor[1] - 4, A.motor[1] + 4, A_TOTAL - 15, A_TOTAL], [0.6, 0.6, 0.15, 0.15, 0.6, 0.6, 0], cl)} />}
      <Audio src={S('audio/sfx_impact.wav')} volume={0.5} />
      <Sequence from={56}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={60}><Audio src={S('audio/sfx_map.wav')} volume={0.45} /></Sequence>
      <Sequence from={A.motorTag[0]}><Audio src={S('audio/sfx_blip.wav')} volume={0.5} /></Sequence>
      <Sequence from={A.motor[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
      <Sequence from={A.motor[0] + 66}><Audio src={S('audio/sfx_correct.wav')} volume={0.35} /></Sequence>
      <Sequence from={A.atlas[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.4} /></Sequence>
      {PART_AT.slice(1).map((x) => (
        <React.Fragment key={x}>
          <Sequence from={A.atlas[0] + x}><Audio src={S('audio/sfx_blip.wav')} volume={0.45} /></Sequence>
          <Sequence from={A.atlas[0] + x + 26}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.2} /></Sequence>
          <Sequence from={A.atlas[0] + x + 42}><Audio src={S('audio/sfx_tick.wav')} volume={0.45} /></Sequence>
        </React.Fragment>
      ))}
      <Sequence from={A.atlas[0] + ATLAS_END - 10}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.4} /></Sequence>
      <Sequence from={A.web[0]}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.45} /></Sequence>
      <Sequence from={A.web[0] + 75}><Audio src={S('audio/sfx_tick.wav')} volume={0.45} /></Sequence>
      <Sequence from={A.cta[0]}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{t: number}> = ({t}) => {
  const p = sp(t, 0, 13, 200);
  const typed = 'motor SX4'.slice(0, Math.max(0, Math.floor((t - 50) / 3)));
  return (
    <div style={{position: 'absolute', top: 260, left: 60, right: 140, fontFamily: MONT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <div style={{background: '#fff', borderRadius: 22, padding: '12px 26px', opacity: Math.min(1, p * 2), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: 'left'}}>
        <Img src={S('compra/logo-desarmaduria.svg')} style={{height: 150, display: 'block'}} />
      </div>
      <div style={{marginTop: 40, fontSize: 84, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1, opacity: fade(t, 10), transform: `translateY(${(1 - fade(t, 10)) * 20}px)`}}>
        Comenta el <span style={{background: K.red, padding: '0 12px'}}>repuesto</span>
        <br />que buscas
      </div>
      <div style={{marginTop: 26, fontSize: 38, fontWeight: 700, opacity: fade(t, 24)}}>y te respondemos con foto y precio</div>
      <div style={{marginTop: 34, width: '100%', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 99, padding: '14px 18px 14px 28px', opacity: fade(t, 36)}}>
        <span style={{flex: 1, fontSize: 36, fontWeight: 700, color: typed ? '#fff' : 'rgba(255,255,255,0.45)'}}>{typed || 'Agrega un comentario…'}</span>
        <div style={{width: 64, height: 64, borderRadius: 99, background: K.red, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#fff" /></svg>
        </div>
      </div>
      <div style={{marginTop: 46, display: 'flex', alignItems: 'center', gap: 16, fontSize: 62, fontWeight: 900, opacity: fade(t, 90), transform: `scale(${0.9 + 0.1 * fade(t, 90)})`, transformOrigin: 'left'}}>
        <Wa s={64} /> +56 9 5381 7335
      </div>
      <div style={{marginTop: 18, fontSize: 34, fontWeight: 800, opacity: fade(t, 100)}}>
        autopartschile.cl · <span style={{color: CYAN}}>Despacho a todo Chile</span>
      </div>
    </div>
  );
};
