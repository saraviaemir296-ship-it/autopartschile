import {interpolate, spring} from 'remotion';
import {ease, springSoft, FPS} from './theme';

/** 0→1 de entrada y 1→0 de salida, en frames relativos a la secuencia. */
export const inOut = (
  frame: number,
  duration: number,
  enter = 12,
  exit = 10,
) => {
  const i = interpolate(frame, [0, enter], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.out,
  });
  const o = interpolate(frame, [duration - exit, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.in,
  });
  return Math.min(i, o);
};

export const soft = (frame: number, delay = 0) =>
  spring({frame: frame - delay, fps: FPS, config: springSoft});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
