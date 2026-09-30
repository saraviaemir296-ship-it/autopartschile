import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {E, INTER, K, cl} from './look';

/**
 * Mapa del software de Grúas Saravia sobre el video real: un plano de calles abstractas en perspectiva
 * (como el modo navegación de una app de movilidad), transparente, flotando
 * sobre la toma. Nada de Google Maps: geometría propia y determinista.
 */
const PW = 1000; // ancho del plano del mapa (px)
const PH = 1300; // alto del plano del mapa (px)
export const ROUTE_V2 = 'M 240 1150 L 240 930 Q 240 880 290 880 L 520 880 Q 570 880 570 830 L 570 560 Q 570 510 620 510 L 760 510 Q 810 510 810 460 L 810 190';

const Streets: React.FC<{reveal: number}> = ({reveal}) => {
  const lines = useMemo(() => {
    const out: {d: string; w: number; o: number}[] = [];
    for (let x = 0; x <= PW; x += 110 + Math.floor(random(`x${x}`) * 70)) out.push({d: `M ${x} 0 L ${x} ${PH}`, w: 3, o: 0.22});
    for (let y = 40; y <= PH; y += 120 + Math.floor(random(`y${y}`) * 80)) out.push({d: `M 0 ${y} L ${PW} ${y}`, w: 3, o: 0.22});
    out.push({d: `M 0 ${PH * 0.82} L ${PW} ${PH * 0.18}`, w: 9, o: 0.3}); // avenida
    out.push({d: `M ${PW * 0.15} 0 C ${PW * 0.35} ${PH * 0.4}, ${PW * 0.05} ${PH * 0.7}, ${PW * 0.3} ${PH}`, w: 5, o: 0.18});
    return out;
  }, []);
  return (
    <g opacity={reveal}>
      {lines.map((l, i) => (
        <path key={i} d={l.d} stroke="#FFFFFF" strokeOpacity={l.o} strokeWidth={l.w} fill="none" />
      ))}
    </g>
  );
};

/** RouteAnimation: la línea roja se dibuja progresivamente, con halo. */
export const RouteAnimation: React.FC<{d: string; progress: number}> = ({d, progress}) => {
  const len = getLength(d);
  const dash = {strokeDasharray: len, strokeDashoffset: len * (1 - progress)};
  return (
    <g>
      <path d={d} fill="none" stroke={K.red} strokeOpacity={0.45} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" style={{...dash, filter: 'blur(12px)'}} />
      <path d={d} fill="none" stroke={K.red} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" style={dash} />
    </g>
  );
};

/** LocationPin: punto en el suelo + etiqueta vertical ("billboard") que mira a cámara. */
export const LocationPin: React.FC<{x: number; y: number; label: string; kind: 'origin' | 'dest'; appear: number}> = ({x, y, label, kind, appear}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [appear, appear + 12], [0, 1], {...cl, easing: E.out});
  const pulse = ((f - appear) % 40) / 40;
  return (
    <>
      <g transform={`translate(${x} ${y})`} opacity={a}>
        {kind === 'origin' && <circle r={20 + pulse * 60} fill="none" stroke="#fff" strokeOpacity={0.6 * (1 - pulse)} strokeWidth={3} />}
        <circle r={22 * a} fill={kind === 'origin' ? K.white : K.red} />
        <circle r={9 * a} fill={kind === 'origin' ? K.black : K.white} />
      </g>
      <foreignObject x={x - 200} y={y - 170} width={400} height={140} opacity={a}>
        <div style={{height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
          <div
            style={{
              transform: `rotateX(-52deg) translateY(${(1 - a) * 12}px)`,
              transformOrigin: 'bottom center',
              fontFamily: INTER,
              fontWeight: 600,
              fontSize: 30,
              letterSpacing: '0.16em',
              color: K.white,
              background: 'rgba(8,8,8,0.72)',
              padding: '10px 18px',
              borderRadius: 10,
              borderLeft: `3px solid ${kind === 'origin' ? K.white : K.red}`,
            }}
          >
            {label}
          </div>
        </div>
      </foreignObject>
    </>
  );
};

/** TowTruckMarker: disco negro con grúa plataforma estilizada (cabina blanca, plataforma roja). */
export const TowTruckMarker: React.FC<{d: string; progress: number}> = ({d, progress}) => {
  const len = getLength(d);
  const p = getPointAtLength(d, Math.max(0.01, Math.min(len - 0.01, len * progress))) ?? {x: 0, y: 0};
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <circle r={62} fill={K.red} opacity={0.2} />
      <circle r={40} fill={K.black} stroke={K.white} strokeWidth={3} />
      <g transform="translate(-27 -12)">
        <rect x={0} y={11} width={36} height={6} rx={1.5} fill={K.red} />
        <path d="M 36 1 h 10 l 7 8 v 11 h -17 z" fill={K.white} />
        <circle cx={10} cy={21} r={4.2} fill={K.white} />
        <circle cx={45} cy={21} r={4.2} fill={K.white} />
      </g>
    </g>
  );
};

export const AnimatedMap: React.FC<{dur: number; dimAt?: number}> = ({dur, dimAt}) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 16], [0, 1], {...cl, easing: E.out});
  const exit = interpolate(f, [dur - 10, dur], [1, 0], cl);
  const draw = interpolate(f, [8, 44], [0, 1], {...cl, easing: E.inOut});
  const truck = interpolate(f, [30, dur - 4], [0.03, 0.55], {...cl, easing: E.inOut});
  // "tracking": el plano avanza lentamente, como si la cámara siguiera a la grúa
  const drift = interpolate(f, [0, dur], [0, 60], {...cl, easing: E.inOut});
  const dimK = dimAt === undefined ? 1 : interpolate(f, [dimAt, dimAt + 10], [1, 0.45], cl);
  const tilt = interpolate(f, [0, 20], [62, 52], {...cl, easing: E.out});
  return (
    <AbsoluteFill style={{opacity: Math.min(enter, exit) * dimK, perspective: 1500, perspectiveOrigin: '50% 30%'}}>
      <div
        style={{
          position: 'absolute',
          left: (1080 - PW) / 2,
          top: 260,
          width: PW,
          height: PH,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 60%',
          transform: `rotateX(${tilt}deg) translateY(${drift}px) scale(1.15)`,
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 50%, #000 55%, transparent 100%)',
          maskImage: 'radial-gradient(70% 60% at 50% 50%, #000 55%, transparent 100%)',
        }}
      >
        <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{overflow: 'visible'}}>
          <Streets reveal={enter} />
          <RouteAnimation d={ROUTE_V2} progress={draw} />
          <LocationPin x={240} y={1150} label="VEHÍCULO" kind="origin" appear={4} />
          <LocationPin x={810} y={190} label="DESTINO" kind="dest" appear={36} />
          {f >= 28 && <TowTruckMarker d={ROUTE_V2} progress={truck} />}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
