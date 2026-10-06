import {Easing} from 'remotion';
import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Paleta de marca — el rojo es acento, no fondo.
export const C = {
  red: '#D10B0C',
  black: '#0A0A0A',
  white: '#FFFFFF',
  // Derivados neutros (no son colores nuevos de marca)
  ink2: '#141414',
  line: 'rgba(255,255,255,0.14)',
  mute: 'rgba(255,255,255,0.62)',
  glass: 'rgba(10,10,10,0.72)',
};

// Fuentes variables (Google Fonts, licencia OFL) servidas localmente desde
// public/fonts: el render no depende de internet.
const fonts = [
  ['Archivo', 'fonts/Archivo-var.woff2'],
  ['Inter', 'fonts/Inter-var.woff2'],
  ['JetBrains Mono', 'fonts/JetBrainsMono-var.woff2'],
] as const;
for (const [family, file] of fonts) {
  loadFont({family, url: staticFile(file), weight: '100 900', format: 'woff2'});
}
loadFont({family: 'Montserrat', url: staticFile('fonts/Montserrat-normal-var.woff2'), weight: '500 900', format: 'woff2'});
loadFont({family: 'Anton', url: staticFile('fonts/Anton.woff2'), weight: '400', format: 'woff2'});
loadFont({family: 'Anton', url: staticFile('fonts/Anton-ext.woff2'), weight: '400', format: 'woff2'});
loadFont({family: 'Montserrat', url: staticFile('fonts/Montserrat-italic-var.woff2'), weight: '700 900', style: 'italic', format: 'woff2'});

export const F = {
  display: "'Archivo', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Zona segura de Reels/TikTok: evita los 250 px superiores (header) y los
// ~420 px inferiores (caption, botones). Márgenes laterales 72 px.
export const SAFE = {top: 250, bottom: 420, side: 72};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo suave
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const springSoft = {damping: 200, stiffness: 120, mass: 0.9};
export const springPop = {damping: 18, stiffness: 160, mass: 0.7};

export const s = (seconds: number) => Math.round(seconds * FPS);
// Tipografías del estilo "neón" (OFL): Sora geométrica + Kaushan Script para acentos.
loadFont({family: 'Sora', url: staticFile('fonts/Sora-800.woff2'), weight: '800', format: 'woff2'});
loadFont({family: 'Sora', url: staticFile('fonts/Sora-800-ext.woff2'), weight: '800', format: 'woff2'});
loadFont({family: 'Sora', url: staticFile('fonts/Sora-400.woff2'), weight: '400', format: 'woff2'});
loadFont({family: 'Kaushan', url: staticFile('fonts/Kaushan.woff2'), weight: '400', format: 'woff2'});
loadFont({family: 'Kaushan', url: staticFile('fonts/Kaushan-ext.woff2'), weight: '400', format: 'woff2'});
