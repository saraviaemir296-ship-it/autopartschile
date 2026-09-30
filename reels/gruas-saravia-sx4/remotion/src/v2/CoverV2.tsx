import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Grain, Shot} from './Shot';
import {INTER, K} from './look';

/** Portada: grúa + SX4 real, una frase, marca pequeña. Texto dentro del recorte 3:4 del grid. */
export const CoverV2: React.FC = () => (
  <AbsoluteFill>
    <Shot src="footage/IMG_3244.mp4" segs={[{from: 1.5, take: 1, rate: 1}]} look="warm" zoom={[1.1, 1.1]} origin="50% 40%" />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,8,8,0.7) 0%, rgba(8,8,8,0.1) 34%, rgba(8,8,8,0) 50%)'}} />
    <div style={{position: 'absolute', top: 330, left: 72, right: 72, fontFamily: INTER, color: K.white}}>
      <div style={{width: 56, height: 3, background: K.red, marginBottom: 28}} />
      <div style={{fontSize: 92, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.03em'}}>CUANDO{'\n'}</div>
      <div style={{fontSize: 92, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.03em'}}>QUEDAS BOTADO</div>
      <div style={{marginTop: 28, fontSize: 24, fontWeight: 600, letterSpacing: '0.3em', color: K.dim}}>GRÚAS SARAVIA</div>
    </div>
    <Grain opacity={0.06} />
  </AbsoluteFill>
);
