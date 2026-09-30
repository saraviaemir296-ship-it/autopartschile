import React, {useMemo} from 'react';
import {interpolate, random, spring, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT} from './Type4';
import {VehicleTypes} from './Extras';

/**
 * COBERTURA: "Todo Santiago · todas las comunas y alrededores".
 * Mapa abstracto (no geográfico): un centro y ~60 puntos que se encienden
 * en ondas desde el centro hacia afuera, sobre la ciudad real desenfocada.
 */
export const Coverage: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const cx = 540;
  const cy = 1010;
  const dots = useMemo(
    () =>
      Array.from({length: 64}, (_, i) => {
        const r = 70 + Math.sqrt(random(`r${i}`)) * 390;
        const a = random(`a${i}`) * Math.PI * 2;
        return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.78, r};
      }),
    [],
  );
  const wave = interpolate(f, [8, 44], [0, 470], {...cl, easing: E.out});
  const title = spring({frame: f - 2, fps: 30, config: {damping: 200, stiffness: 140}});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {[1, 2, 3].map((k) => {
          const rr = ((f * 4 + k * 150) % 470) + 20;
          return <ellipse key={k} cx={cx} cy={cy} rx={rr} ry={rr * 0.78} fill="none" stroke={K.red} strokeOpacity={0.5 * (1 - rr / 490)} strokeWidth={3} />;
        })}
        <ellipse cx={cx} cy={cy} rx={470} ry={470 * 0.78} fill="none" stroke="#fff" strokeOpacity={0.22 * Math.min(1, wave / 470)} strokeWidth={2} strokeDasharray="6 10" />
        {dots.map((d, i) => {
          const on = wave >= d.r;
          const k = on ? Math.min(1, (wave - d.r) / 40) : 0;
          return (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={14 * k} fill={K.red} opacity={0.25 * k} />
              <circle cx={d.x} cy={d.y} r={5 * k + 1} fill={on ? '#fff' : 'rgba(255,255,255,0.18)'} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={20} fill={K.red} />
        <circle cx={cx} cy={cy} r={8} fill="#fff" />
      </svg>
      <div style={{position: 'absolute', top: 290, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: title}}>
          <span style={{width: 44 * title, height: 4, background: K.red, display: 'inline-block'}} />
          COBERTURA 24/7
        </div>
        <div style={{marginTop: 16, fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 104, lineHeight: 0.95, textTransform: 'uppercase', color: K.white, clipPath: `inset(0 ${(1 - title) * 100}% 0 0)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)'}}>
          Todo<br />Santiago
        </div>
      </div>
      <div style={{position: 'absolute', top: 560, left: 72, right: 150, fontFamily: MONT, fontWeight: 800, fontSize: 40, lineHeight: 1.15, textTransform: 'uppercase', color: K.white, opacity: interpolate(f, [16, 28], [0, 1], cl), textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>
        Todas las comunas <span style={{color: K.red}}>y alrededores</span>
      </div>
      <div style={{position: 'absolute', top: 1270, left: 60, fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.8)', opacity: interpolate(f, [34, 44], [0, 1], cl)}}>TRASLADAMOS</div>
      <VehicleTypes at={38} />
    </div>
  );
};
