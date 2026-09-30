import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT} from './Type4';
import {Fb, Ig, Web} from './LogoReveal';
import {Payments} from './Extras';

const pop = (f: number, d: number) => spring({frame: f - d, fps: 30, config: {damping: 16, stiffness: 200, mass: 0.6}});
const fade = (f: number, d: number, len = 12) => interpolate(f, [d, d + len], [0, 1], {...cl, easing: E.out});

const Chip: React.FC<{label: string; sub?: string; p: number; accent?: boolean}> = ({label, sub, p, accent}) => (
  <div
    style={{
      padding: '20px 24px',
      borderRadius: 18,
      background: accent ? K.red : 'rgba(8,8,8,0.72)',
      border: accent ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
      backdropFilter: 'blur(10px)',
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 26}px) scale(${0.92 + 0.08 * p})`,
      textAlign: 'center',
      minWidth: 210,
    }}
  >
    <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 34, color: K.white, textTransform: 'uppercase', lineHeight: 1.05}}>{label}</div>
    {sub && <div style={{marginTop: 6, fontFamily: MONT, fontWeight: 600, fontSize: 20, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.8)'}}>{sub}</div>}
  </div>
);

const Op: React.FC<{c: string; o: number}> = ({c, o}) => (
  <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 56, color: K.red, opacity: o, margin: '0 6px'}}>{c}</div>
);

/**
 * TARIFA REAL: base + km, calculada con ubicación actual → destino. Sin cobros ocultos.
 * Sin montos: se muestra la fórmula, no precios inventados.
 */
export const Pricing: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const route = interpolate(f, [58, 82], [0, 1], {...cl, easing: E.inOut});
  const stamp = spring({frame: f - 70, fps: 30, config: {damping: 11, stiffness: 180, mass: 0.7}});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      {/* título */}
      <div style={{position: 'absolute', top: 290, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: fade(f, 2)}}>
          <span style={{width: 44 * fade(f, 2), height: 4, background: K.red, display: 'inline-block'}} />
          TARIFA REAL
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: MONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: K.white,
            clipPath: `inset(0 ${(1 - fade(f, 4, 14)) * 100}% 0 0)`,
            textShadow: '0 6px 30px rgba(0,0,0,0.55)',
          }}
        >
          Base <span style={{color: K.red}}>+</span> km
        </div>
      </div>

      {/* fórmula */}
      <div style={{position: 'absolute', top: 620, left: 40, right: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Chip label="Base" sub="TARIFA FIJA" p={pop(f, 18)} />
        <Op c="+" o={fade(f, 24, 8)} />
        <Chip label="Km" sub="RECORRIDOS" p={pop(f, 28)} />
        <Op c="=" o={fade(f, 36, 8)} />
        <Chip label="Total" sub="ANTES DE PEDIR" p={pop(f, 40)} accent />
      </div>

      {/* ubicación actual → destino */}
      <div style={{position: 'absolute', top: 860, left: 72, right: 72, opacity: fade(f, 52)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <svg width="44" height="44" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={K.white} /><circle cx="12" cy="12" r="4" fill={K.black} /></svg>
          <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 36, color: K.white}}>Tu ubicación actual</div>
        </div>
        <div style={{marginLeft: 20, width: 4, height: 90, background: `linear-gradient(${K.red} ${route * 100}%, rgba(255,255,255,0.15) ${route * 100}%)`}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: fade(f, 74)}}>
          <svg width="44" height="44" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill={K.red} /><rect x="9" y="9" width="6" height="6" rx="1" fill={K.white} /></svg>
          <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 36, color: K.white}}>Tu destino</div>
        </div>
      </div>

      <Payments at={80} top={1230} />

      {/* sello */}
      <div style={{position: 'absolute', top: 1090, left: 0, right: 80, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '18px 30px',
            background: K.red,
            transform: `scale(${0.6 + 0.4 * stamp}) rotate(${(1 - stamp) * -6}deg) skewX(-8deg)`,
            opacity: Math.min(1, stamp * 2),
            boxShadow: '0 14px 40px rgba(209,11,12,0.4)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={K.white} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 54, color: K.white, textTransform: 'uppercase', letterSpacing: '-0.01em'}}>Sin cobros ocultos</div>
        </div>
      </div>
    </div>
  );
};

/** Redes sociales a pantalla completa, grandes y en cascada. */
export const SocialsBig: React.FC<{dur: number; tapAt?: number}> = ({dur, tapAt}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const rows: [React.ReactNode, string, string][] = [
    [<Fb key="f" s={64} />, 'Grúas Saravia', 'FACEBOOK'],
    [<Ig key="i" s={64} />, '@gruasaravia.cl', 'INSTAGRAM'],
    [<Web key="w" s={64} />, 'gruasaravia.cl', 'SITIO WEB · COTIZA AQUÍ'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <div style={{position: 'absolute', top: 330, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: fade(f, 0)}}>
          <span style={{width: 44 * fade(f, 0), height: 4, background: K.red, display: 'inline-block'}} />
          SÍGUENOS
        </div>
        <div style={{marginTop: 16, fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 88, lineHeight: 0.98, textTransform: 'uppercase', color: K.white, clipPath: `inset(0 ${(1 - fade(f, 3, 14)) * 100}% 0 0)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)'}}>
          Estamos<br />cerca
        </div>
      </div>
      <div style={{position: 'absolute', top: 760, left: 72, right: 110, display: 'flex', flexDirection: 'column', gap: 34}}>
        {rows.map(([icon, label, sub], i) => {
          const p = pop(f, 14 + i * 9);
          const tapped = tapAt !== undefined && i === 2 && f >= tapAt;
          const press = tapped && f < tapAt! + 6 ? 0.96 : 1;
          const ring = tapAt !== undefined && i === 2 ? interpolate(f, [tapAt, tapAt + 14], [0, 1], cl) : 0;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '24px 30px',
                borderRadius: 22,
                background: 'rgba(8,8,8,0.7)',
                border: '1.5px solid rgba(255,255,255,0.16)',
                borderLeft: `6px solid ${K.red}`,
                backdropFilter: 'blur(12px)',
                opacity: Math.min(1, p * 1.5),
                transform: `translateX(${(1 - p) * -60}px) scale(${press})`,
                position: 'relative',
                boxShadow: tapped ? `0 0 0 3px ${K.red}` : 'none',
              }}
            >
              {i === 2 && tapAt !== undefined && f >= tapAt - 8 && (
                <div style={{position: 'absolute', right: 120, top: '50%'}}>
                  <div style={{position: 'absolute', left: -32, top: -32, width: 64, height: 64, borderRadius: 99, background: 'rgba(255,255,255,0.6)', border: '3px solid #fff', opacity: f < tapAt + 10 ? 1 : 0}} />
                  <div style={{position: 'absolute', left: -32, top: -32, width: 64, height: 64, borderRadius: 99, border: `3px solid ${K.red}`, transform: `scale(${1 + ring * 1.8})`, opacity: f >= tapAt ? 1 - ring : 0}} />
                </div>
              )}
              {icon}
              <div>
                <div style={{fontFamily: MONT, fontWeight: 600, fontSize: 20, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)'}}>{sub}</div>
                <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 48, color: K.white, letterSpacing: '-0.01em'}}>{label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
