import {Easing} from 'remotion';

// V2 · lenguaje editorial automotriz. Una sola familia (Inter), mucho aire.
export const K = {
  red: '#D10B0C',
  black: '#080808',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  hair: 'rgba(255,255,255,0.22)',
  glass: 'rgba(8,8,8,0.62)',
};
export const INTER = "'Inter', sans-serif";
export const E = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
};
export const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
