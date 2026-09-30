import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TruckArrive} from './TruckAccel';
import {E, K, cl} from './look';
import {MONT as INTER} from './Type4';

/**
 * Cierre de 2 s sobre la grúa desenfocada (no pantalla negra):
 * logo real con revelado por máscara + escala mínima, claim, número y CTA.
 */
const ICON = 30;
export const Fb = ({s = ICON}: {s?: number}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path fill={K.white} d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" /></svg>
);
export const Ig = ({s = ICON}: {s?: number}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={K.white} strokeWidth="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.3" /><circle cx="17.6" cy="6.4" r="1.1" fill={K.white} stroke="none" /></svg>
);
export const Web = ({s = ICON}: {s?: number}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={K.white} strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2c2.8 3 2.8 17 0 20M12 2c-2.8 3-2.8 17 0 20" /></svg>
);
/** Redes oficiales: Facebook Grúas Saravia · Instagram @gruasaravia.cl · gruasaravia.cl */
const Socials: React.FC<{opacity: number}> = ({opacity}) => (
  <div style={{marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity, transform: `translateY(${(1 - opacity) * 10}px)`}}>
    {[
      [<Fb key="f" />, 'Grúas Saravia'],
      [<Ig key="i" />, '@gruasaravia.cl'],
      [<Web key="w" />, 'gruasaravia.cl'],
    ].map(([icon, label], i) => (
      <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, width: 430}}>
        {icon}
        <div style={{fontSize: 32, fontWeight: 600, letterSpacing: '0.01em', color: K.white}}>{label as string}</div>
      </div>
    ))}
  </div>
);

export const LogoReveal: React.FC<{dur: number; phone?: string}> = ({dur, phone = '+56 9 5381 7335'}) => {
  const f = useCurrentFrame();
  const dim = interpolate(f, [0, 10], [0, 0.72], {...cl, easing: E.out});
  const a = (d: number) => interpolate(f, [d + 14, d + 24], [0, 1], {...cl, easing: E.out});
  const line = interpolate(f, [40, 54], [0, 1], {...cl, easing: E.out});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(8,8,8,${dim})`}} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <TruckArrive y={330} w={820} />
        <div style={{position: 'absolute', top: 800, left: 0, right: 0, textAlign: 'center', fontFamily: INTER, color: K.white}}>
          <div style={{fontSize: 30, fontWeight: 500, letterSpacing: '0.24em', color: K.dim, opacity: a(8)}}>ASISTENCIA VEHICULAR 24/7</div>
          <div style={{marginTop: 26, fontSize: 80, fontWeight: 600, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', opacity: a(12), transform: `translateY(${(1 - a(12)) * 12}px)`}}>{phone}</div>
          <div style={{marginTop: 40, display: 'inline-block', position: 'relative', opacity: a(20)}}>
            <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '0.26em'}}>GUÁRDALO AHORA.</div>
            <div style={{position: 'absolute', left: 0, right: '0.26em', bottom: -14, height: 3, background: K.red, transformOrigin: 'left', transform: `scaleX(${line})`}} />
          </div>
          <Socials opacity={a(28)} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
