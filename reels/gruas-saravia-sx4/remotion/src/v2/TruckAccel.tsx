import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {K, cl} from './look';

const TRUCK_W = 1499;
const TRUCK_H = 344;

/** Camión del logo con desenfoque de movimiento horizontal proporcional a la velocidad. */
const Truck: React.FC<{x: number; y: number; w: number; blur: number; tilt?: number; bob?: number}> = ({x, y, w, blur, tilt = 0, bob = 0}) => {
  const h = (w * TRUCK_H) / TRUCK_W;
  const id = `mb${Math.round(blur * 10)}`;
  return (
    <svg
      width={w + 400}
      height={h + 40}
      viewBox={`-200 -20 ${w + 400} ${h + 40}`}
      style={{position: 'absolute', left: x - 200, top: y - 20 + bob, overflow: 'visible', transform: `rotate(${tilt}deg)`, transformOrigin: `${200 + w * 0.8}px ${20 + h}px`}}
    >
      <defs>
        <filter id={id} x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </defs>
      <image href={staticFile('logo-camion.png')} width={w} height={h} filter={blur > 0.3 ? `url(#${id})` : undefined} />
    </svg>
  );
};

/** Estelas de velocidad detrás del camión (blancas y rojas, finas). */
const Streaks: React.FC<{x: number; y: number; h: number; speed: number; seed?: number}> = ({x, y, h, speed, seed = 0}) => {
  const lines = [0.18, 0.34, 0.52, 0.68, 0.84];
  return (
    <>
      {lines.map((p, i) => {
        const len = speed * (260 + ((i * 97 + seed) % 5) * 70);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - len - 40 - ((i * 53) % 80),
              top: y + h * p,
              width: len,
              height: i % 2 ? 3 : 5,
              borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${i === 2 ? K.red : 'rgba(255,255,255,0.85)'})`,
              opacity: Math.min(1, speed * 1.4),
            }}
          />
        );
      })}
    </>
  );
};

/**
 * TRANSICIÓN: el camión cruza la pantalla acelerando de izquierda a derecha y
 * "arrastra" la escena nueva (children) detrás de él. Debe ir superpuesta a la
 * escena anterior (la Sequence empieza `dur` frames antes del corte).
 */
export const TruckWipe: React.FC<{dur?: number; y?: number; children: React.ReactNode}> = ({dur = 18, y = 780, children}) => {
  const f = useCurrentFrame();
  const w = 1250;
  const h = (w * TRUCK_H) / TRUCK_W;
  // acelera: ease-in fuerte
  const t = interpolate(f, [0, dur], [0, 1], {...cl, easing: Easing.bezier(0.5, 0, 0.9, 0.6)});
  const x = -w + t * (1080 + w + 300);
  const prevT = interpolate(f - 1, [0, dur], [0, 1], {...cl, easing: Easing.bezier(0.5, 0, 0.9, 0.6)});
  const speed = Math.min(1, Math.max(0, (t - prevT) * 16));
  const edge = Math.max(0, x + w * 0.35); // la escena nueva aparece detrás de la cabina
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: f >= dur ? 'none' : `inset(0 ${Math.max(0, 1080 - edge)}px 0 0)`}}>{children}</AbsoluteFill>
      {f < dur + 2 && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {/* borde oscuro de la cortina para separar escenas */}
          <div style={{position: 'absolute', top: 0, bottom: 0, left: edge - 140, width: 160, background: 'linear-gradient(90deg, rgba(8,8,8,0), rgba(8,8,8,0.85))', opacity: f < dur ? 1 : 0}} />
          <Streaks x={x} y={y} h={h} speed={speed} />
          <Truck x={x} y={y} w={w} blur={speed * 16} tilt={-speed * 1.2} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * CIERRE: el camión entra rápido desde la izquierda, frena en el centro con
 * rebote de suspensión (inclinación hacia adelante y vuelta) y después
 * aparece "GRÚAS SARAVIA · ASISTENCIA EN RUTA 24/7".
 */
export const TruckArrive: React.FC<{y?: number; w?: number}> = ({y = 360, w = 860}) => {
  const f = useCurrentFrame();
  const h = (w * TRUCK_H) / TRUCK_W;
  const target = (1080 - w) / 2;
  const t = interpolate(f, [0, 16], [0, 1], {...cl, easing: Easing.bezier(0.12, 0.9, 0.25, 1)});
  const x = -w - 200 + t * (target + w + 200);
  const prevT = interpolate(f - 1, [0, 16], [0, 1], {...cl, easing: Easing.bezier(0.12, 0.9, 0.25, 1)});
  const speed = Math.min(1, Math.max(0, (t - prevT) * 9));
  // frenada: la trompa baja y rebota (resorte amortiguado tras llegar)
  const s = Math.max(0, f - 14);
  const brake = f < 14 ? 0 : Math.exp(-s / 5) * Math.sin(s / 2.2);
  const tilt = brake * 2.4;
  const bob = brake * 6;
  const text = interpolate(f, [16, 30], [0, 100], {...cl, easing: Easing.bezier(0.22, 1, 0.36, 1)});
  const textH = (w * 1.02 * 354) / 1518;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Streaks x={x} y={y} h={h} speed={speed} seed={3} />
      <Truck x={x} y={y} w={w} blur={speed * 22} tilt={tilt} bob={bob} />
      {/* sombra de contacto */}
      <div style={{position: 'absolute', left: x + w * 0.1, top: y + h - 8, width: w * 0.85, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', filter: 'blur(10px)'}} />
      <div style={{position: 'absolute', left: (1080 - w * 1.02) / 2, top: y + h + 12, width: w * 1.02, height: textH, clipPath: `inset(0 ${100 - text}% 0 0)`}}>
        <Img src={staticFile('logo-texto.png')} style={{width: '100%', height: '100%'}} />
      </div>
    </AbsoluteFill>
  );
};
