import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {Vignette} from './Footage';

/**
 * Plano tuyo a cámara. Si `src` es null muestra un placeholder con la
 * indicación de lo que falta grabar (hoy NO hay tomas a cámara en el material).
 */
export const TalkingHead: React.FC<{src: string | null; label: string; startFrom?: number}> = ({src, label, startFrom = 0}) => {
  const frame = useCurrentFrame();
  if (src) {
    // Push-in muy lento (100 %→104 %) para que el plano "respire".
    const z = 1 + Math.min(frame / 900, 0.04);
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <AbsoluteFill style={{transform: `scale(${z})`, filter: 'contrast(1.06) saturate(0.95)'}}>
          <OffthreadVideo src={staticFile(src)} startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        <Vignette strength={0.4} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#1a1a1a,#0A0A0A)', alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 430, width: 360, height: 360, borderRadius: 999, border: '3px dashed rgba(255,255,255,0.25)'}} />
      <div style={{position: 'absolute', top: 470, fontFamily: F.mono, fontSize: 26, letterSpacing: '0.18em', color: C.red}}>● REC · FALTA GRABAR</div>
      <div style={{position: 'absolute', top: 830, left: 90, right: 90, textAlign: 'center', fontFamily: F.body, fontWeight: 600, fontSize: 38, color: 'rgba(255,255,255,0.7)'}}>
        {label}
      </div>
    </AbsoluteFill>
  );
};
