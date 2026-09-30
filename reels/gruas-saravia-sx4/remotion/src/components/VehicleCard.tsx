import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, F, ease} from '../theme';
import {clamp} from '../anim';

/**
 * Ficha de vehículo anclada a la escena. Ojo con el texto: en Chile
 * "vehículo asegurado" se lee como "con seguro". Usamos "fijado a plataforma".
 */
export const VehicleCard: React.FC<{
  duration: number;
  model?: string;
  status?: string;
  x: number;
  y: number;
}> = ({duration, model = 'Suzuki SX4', status = 'Fijado a plataforma', x, y}) => {
  const frame = useCurrentFrame();
  const i = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: ease.out});
  const o = interpolate(frame, [duration - 8, duration], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 24px',
        borderRadius: 18,
        background: C.glass,
        border: `1px solid ${C.line}`,
        backdropFilter: 'blur(12px)',
        opacity: Math.min(i, o),
        transform: `translateY(${(1 - i) * 14}px)`,
      }}
    >
      <div style={{width: 6, alignSelf: 'stretch', background: C.red, borderRadius: 3}} />
      <div>
        <div style={{fontFamily: F.mono, fontSize: 20, letterSpacing: '0.16em', color: C.mute}}>VEHÍCULO</div>
        <div style={{fontFamily: F.display, fontWeight: 800, fontSize: 38, color: C.white}}>{model}</div>
        <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 26, color: C.white, opacity: 0.85}}>● {status}</div>
      </div>
    </div>
  );
};
