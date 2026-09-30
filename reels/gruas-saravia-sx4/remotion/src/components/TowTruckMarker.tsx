import React from 'react';
import {getPointAtLength, getTangentAtLength, getLength} from '@remotion/paths';
import {C} from '../theme';

/**
 * Ícono de grúa (plataforma, vista lateral simplificada: cabina blanca + plataforma roja,
 * igual que la grúa real) dentro de una "cápsula" que avanza por la ruta.
 * Se mantiene horizontal (sin rotar el ícono): rotar un camión de perfil se ve raro;
 * solo gira la flecha de dirección.
 */
export const TowTruckMarker: React.FC<{d: string; progress: number}> = ({d, progress}) => {
  const len = getLength(d);
  const at = Math.max(0.001, Math.min(len - 0.001, len * progress));
  const p = getPointAtLength(d, at) ?? {x: 0, y: 0};
  const tg = getTangentAtLength(d, at) ?? {x: 1, y: 0};
  const angle = (Math.atan2(tg.y, tg.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <circle r={58} fill={C.red} opacity={0.18} />
      <g transform={`rotate(${angle})`}>
        <path d="M 62 0 L 50 -9 L 50 9 Z" fill={C.white} />
      </g>
      <circle r={44} fill={C.black} stroke={C.white} strokeWidth={3} />
      {/* grúa plataforma: 56 px de ancho */}
      <g transform="translate(-29 -14)">
        <rect x={0} y={12} width={38} height={6} rx={1.5} fill={C.red} />
        <path d="M 38 2 h 11 l 7 8 v 12 h -18 z" fill={C.white} />
        <rect x={41} y={5} width={6} height={5} rx={1} fill={C.black} />
        <circle cx={11} cy={23} r={4.5} fill={C.white} />
        <circle cx={47} cy={23} r={4.5} fill={C.white} />
        <rect x={42} y={-1} width={8} height={3} rx={1} fill="#FFB020" />
      </g>
    </g>
  );
};
