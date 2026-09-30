import React from 'react';
import {getLength} from '@remotion/paths';
import {C} from '../theme';

/**
 * Ruta roja animada. `progress` 0→1 dibuja la línea (strokeDashoffset).
 * Debajo lleva una "sombra" roja difusa para que se lea sobre el mapa oscuro.
 */
export const RouteLine: React.FC<{d: string; progress: number; width?: number}> = ({d, progress, width = 10}) => {
  const len = getLength(d);
  const dash = {strokeDasharray: len, strokeDashoffset: len * (1 - progress)};
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={width + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={C.red} strokeOpacity={0.35} strokeWidth={width + 14} strokeLinecap="round" strokeLinejoin="round" style={{...dash, filter: 'blur(10px)'}} />
      <path d={d} fill="none" stroke={C.red} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={dash} />
    </g>
  );
};
