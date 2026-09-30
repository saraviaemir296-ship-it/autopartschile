import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {C, F, FPS} from '../theme';

/**
 * Pin A/B. A = ubicación del vehículo (anillo blanco con pulso),
 * B = destino (cuadrado rojo, estilo "drop-off" de apps de movilidad, sin copiar ninguna).
 */
export const LocationPin: React.FC<{
  x: number;
  y: number;
  kind: 'A' | 'B';
  label: string;
  delay?: number;
  labelSide?: 'left' | 'right';
}> = ({x, y, kind, label, delay = 0, labelSide = 'right'}) => {
  const frame = useCurrentFrame();
  const p = spring({frame: frame - delay, fps: FPS, config: {damping: 14, stiffness: 180, mass: 0.6}});
  const pulse = ((frame - delay) % 45) / 45;
  const tag = spring({frame: frame - delay - 6, fps: FPS, config: {damping: 200, stiffness: 140}});
  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === 'A' && frame >= delay && (
        <circle r={22 + pulse * 46} fill="none" stroke={C.white} strokeOpacity={0.5 * (1 - pulse)} strokeWidth={3} />
      )}
      <g transform={`scale(${p})`}>
        {kind === 'A' ? (
          <>
            <circle r={24} fill={C.white} />
            <circle r={10} fill={C.black} />
          </>
        ) : (
          <>
            <rect x={-22} y={-22} width={44} height={44} rx={6} fill={C.red} />
            <rect x={-8} y={-8} width={16} height={16} rx={2} fill={C.white} />
          </>
        )}
      </g>
      <g
        opacity={tag}
        transform={`translate(${labelSide === 'right' ? 44 + (1 - tag) * -12 : -44 + (1 - tag) * 12} 0)`}
      >
        <foreignObject x={labelSide === 'right' ? 0 : -420} y={-34} width={420} height={68}>
          <div
            style={{
              display: 'flex',
              justifyContent: labelSide === 'right' ? 'flex-start' : 'flex-end',
            }}
          >
            <div
              style={{
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 30,
                color: C.white,
                background: 'rgba(10,10,10,0.86)',
                border: '1px solid rgba(255,255,255,0.16)',
                padding: '12px 20px',
                borderRadius: 14,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{fontFamily: F.mono, color: kind === 'A' ? C.white : C.red, marginRight: 12}}>{kind}</span>
              {label}
            </div>
          </div>
        </foreignObject>
      </g>
    </g>
  );
};
