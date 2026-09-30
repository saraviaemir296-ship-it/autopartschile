import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F, H, W, ease} from '../theme';
import {clamp} from '../anim';
import {RouteLine} from './RouteLine';
import {TowTruckMarker} from './TowTruckMarker';
import {LocationPin} from './LocationPin';
import {ServiceStatus} from './ServiceStatus';
import {ETAIndicator} from './ETAIndicator';

/**
 * Mapa propio estilo app de movilidad (NO Google Maps): fondo negro,
 * calles en grises, manzanas sutiles, una avenida y un parque. Todo vectorial
 * y determinista (random con seed) para que el render sea reproducible.
 */
export const ROUTE =
  'M 250 1330 L 250 1130 Q 250 1080 300 1080 L 550 1080 Q 600 1080 600 1030 L 600 810 Q 600 760 650 760 L 810 760 Q 860 760 860 710 L 860 560';

const Streets: React.FC = () => {
  const grid = useMemo(() => {
    const v: number[] = [];
    const h: number[] = [];
    for (let x = -50; x < W + 100; x += 175 + Math.floor(random(`v${x}`) * 40)) v.push(x);
    for (let y = 80; y < H + 100; y += 160 + Math.floor(random(`h${y}`) * 50)) h.push(y);
    return {v, h};
  }, []);
  return (
    <g>
      {/* manzanas */}
      {grid.v.slice(0, -1).map((x, i) =>
        grid.h.slice(0, -1).map((y, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + 14}
            y={y + 14}
            width={grid.v[i + 1] - x - 28}
            height={grid.h[j + 1] - y - 28}
            rx={10}
            fill={random(`b${i}${j}`) > 0.86 ? '#12201A' : '#121212'}
          />
        )),
      )}
      {/* calles */}
      {grid.v.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#262626" strokeWidth={12} />
      ))}
      {grid.h.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#262626" strokeWidth={12} />
      ))}
      {/* avenida diagonal */}
      <path d={`M -40 ${H * 0.78} L ${W + 40} ${H * 0.28}`} stroke="#303030" strokeWidth={26} />
      <path d={`M -40 ${H * 0.78} L ${W + 40} ${H * 0.28}`} stroke="#3A3A3A" strokeWidth={2} strokeDasharray="18 22" />
    </g>
  );
};

export const AnimatedMap: React.FC<{
  duration: number;
  etaMinutes?: number;
  conceptLabel?: boolean;
  /** frame en que entra el bottom sheet de SALVI: el mapa sube para dejarle espacio */
  sheetAt?: number;
}> = ({duration, etaMinutes, conceptLabel = true, sheetAt}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: ease.out});
  const exit = interpolate(frame, [duration - 8, duration], [1, 0], clamp);
  // cámara: leve push-in + deriva, como si el mapa siguiera a la grúa
  const cam = interpolate(frame, [0, duration], [0, 1], {...clamp, easing: ease.inOut});
  const scale = 1.12 - cam * 0.08;
  const drawn = interpolate(frame, [6, 34], [0, 1], {...clamp, easing: ease.inOut});
  const lift = sheetAt === undefined ? 0 : interpolate(frame, [sheetAt, sheetAt + 18], [0, -170], {...clamp, easing: ease.out});
  const truck = interpolate(frame, [18, duration - 6], [0.02, 0.62], {...clamp, easing: ease.inOut});

  return (
    <AbsoluteFill style={{backgroundColor: C.black, opacity: Math.min(enter, exit)}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{transform: `translateY(${lift}px)`}}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${scale}) translate(${-W / 2 + cam * -18} ${-H / 2 + cam * 30})`}>
          <Streets />
          <RouteLine d={ROUTE} progress={drawn} />
          <LocationPin x={250} y={1330} kind="A" label="Ubicación del vehículo" delay={2} />
          <LocationPin x={860} y={560} kind="B" label="Destino" delay={22} labelSide="left" />
          {frame >= 16 && <TowTruckMarker d={ROUTE} progress={truck} />}
        </g>
      </svg>
      {/* degradados para legibilidad de UI */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0) 22%, rgba(10,10,10,0) 70%, rgba(10,10,10,0.9) 100%)'}} />
      <div style={{position: 'absolute', top: 270, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <ServiceStatus delay={4} />
      </div>
      <div style={{position: 'absolute', top: 380, left: 72}}>
        <ETAIndicator minutes={etaMinutes} delay={14} />
      </div>
      {conceptLabel && (
        <div
          style={{
            position: 'absolute',
            bottom: 440,
            left: 72,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          SALVI · VISTA ILUSTRATIVA
        </div>
      )}
    </AbsoluteFill>
  );
};
