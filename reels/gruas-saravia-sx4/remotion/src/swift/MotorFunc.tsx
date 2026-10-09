import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* Video de venta de un motor funcionando: clip real con su audio (motor + voz
   del dueño), franja igual a las fichas de desarme y cierre con contacto. */

const S = (f: string) => staticFile(f);
const RED = '#E10606';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
export const MOTOR_CLIP = 514;          // 17,1 s del clip
export const MOTOR_TOTAL = MOTOR_CLIP + 75;

const Band: React.FC<{f: number; anios: string; lineas: string[]}> = ({f, anios, lineas}) => {
  const k = spring({frame: f - 4, fps: 30, config: {damping: 15, stiffness: 180, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: 210, left: 0, right: 0, transform: `translateX(${(1 - k) * -1100}px)`}}>
      <div style={{position: 'absolute', left: 12, top: 0, width: 360}}>
        <div style={{background: '#fff', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 96, color: '#000'}}>DESARME</div>
        <div style={{background: RED, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 76, color: '#FFE1E4'}}>{anios}</div>
      </div>
      <div style={{position: 'absolute', left: 386, top: 0}}>
        {lineas.map((l, i) => (
          <div key={i} style={{display: 'table', background: '#000', padding: '4px 26px 8px', fontFamily: DISP, fontSize: 58, lineHeight: 1.1, color: '#fff', whiteSpace: 'nowrap'}}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export const MotorFunc: React.FC = () => {
  const f = useCurrentFrame();
  const end = f >= MOTOR_CLIP - 6;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={MOTOR_CLIP}>
        <AbsoluteFill style={{transform: `scale(${interpolate(f, [0, MOTOR_CLIP], [1.0, 1.05], cl)})`}}>
          <OffthreadVideo src={S('swift/sx4n_motor_func.mp4')} volume={1} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      </Sequence>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.6) 100%)'}} />
      {!end && (
        <>
          <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 330, top: 50, width: 420, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />
          <Band f={f} anios="2006-2015" lineas={['MOTOR SUZUKI 1.6 M16A VVT', 'SX4 CROSSOVER 4x4 AUTOMÁTICO']} />
          {/* indicador "en funcionamiento" */}
          <div style={{position: 'absolute', top: 1530, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,10,0.8)', borderRadius: 40, padding: '14px 30px', border: '2px solid rgba(255,255,255,0.2)'}}>
              <span style={{width: 26, height: 26, borderRadius: 13, background: RED, opacity: Math.floor(f / 12) % 2 ? 1 : 0.3, boxShadow: `0 0 16px ${RED}`}} />
              <span style={{fontFamily: TXT, fontWeight: 900, fontSize: 38, color: '#fff', letterSpacing: 2, whiteSpace: 'nowrap'}}>MOTOR FUNCIONANDO · AUDIO REAL</span>
            </div>
          </div>
        </>
      )}
      {end && (
        <AbsoluteFill style={{background: `rgba(8,8,8,${interpolate(f, [MOTOR_CLIP - 6, MOTOR_CLIP + 4], [0, 0.7], cl)})`, backdropFilter: `blur(${interpolate(f, [MOTOR_CLIP - 6, MOTOR_CLIP + 4], [0, 16], cl)}px)`}}>
          <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 190, top: 420, width: 700, transform: `scale(${spring({frame: f - MOTOR_CLIP, fps: 30, config: {damping: 14, stiffness: 180, mass: 0.6}})})`}} />
          <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', fontFamily: DISP, fontSize: 86, color: '#fff', opacity: interpolate(f, [MOTOR_CLIP + 6, MOTOR_CLIP + 12], [0, 1], cl)}}>PREGUNTA POR ESTE MOTOR</div>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 170, top: 960, width: 740, transform: `scale(${spring({frame: f - MOTOR_CLIP - 12, fps: 30, config: {damping: 13, stiffness: 220, mass: 0.6}})})`}} />
          <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 150, top: 1080, width: 780, transform: `scale(${spring({frame: f - MOTOR_CLIP - 18, fps: 30, config: {damping: 13, stiffness: 220, mass: 0.6}})})`}} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
