/**
 * LÍNEA DE TIEMPO MAESTRA (30 fps). Todo el montaje sale de aquí:
 * la composición ReelSX4 y el documento de CapCut usan los mismos números.
 * `from`/`take` están en segundos del archivo ORIGINAL de cada clip.
 */
export const T = {
  hook: {start: 0, dur: 90}, // 00:00.0–00:03.0
  arrival: {start: 90, dur: 120}, // 00:03.0–00:07.0
  rescue: {start: 210, dur: 180}, // 00:07.0–00:13.0
  cinematic: {start: 390, dur: 180}, // 00:13.0–00:19.0
  tech: {start: 570, dur: 117}, // 00:19.0–00:22.9
  map: {start: 687, dur: 90}, // 00:22.9–00:25.9
  close: {start: 777, dur: 150}, // 00:25.9–00:30.9
  cta: {start: 927, dur: 78}, // 00:30.9–00:33.5
};
export const TOTAL = T.cta.start + T.cta.dur; // 1005 frames = 33.5 s
