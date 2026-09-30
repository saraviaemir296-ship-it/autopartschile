import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT} from './Type4';

const pop = (f: number, d: number) => spring({frame: f - d, fps: 30, config: {damping: 16, stiffness: 200, mass: 0.6}});
const fade = (f: number, d: number, len = 12) => interpolate(f, [d, d + len], [0, 1], {...cl, easing: E.out});

/* ---------- íconos simples (propios, no de marcas) ---------- */
const Ico: React.FC<{d: string; s?: number}> = ({d, s = 40}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d={d} fill={K.white} /></svg>
);
const I = {
  shield: 'M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z',
  wrench: 'M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  gear: 'M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11a2 2 0 0 1 2 2v5h-2v1.5a1.5 1.5 0 0 1-3 0V18H8v1.5a1.5 1.5 0 0 1-3 0V18H3v-5a2 2 0 0 1 2-2zm2.2 0h9.6l-1-3H8.2z',
  moto: 'M5 18.5A3.5 3.5 0 1 1 5 11.5a3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm14 2a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 6h3l2.4 5.6-1.8.8L16.8 11H15l-3 4H8.9a3.5 3.5 0 0 0-1.4-2.4L10 9h3.3L12.5 8H10V6h4z',
  box: 'M21 7.5 12 3 3 7.5v9L12 21l9-4.5v-9zM12 5.2 17.6 8 12 10.8 6.4 8 12 5.2zM5 9.6l6 3v6.2l-6-3V9.6zm8 9.2v-6.2l6-3v6.2l-6 3z',
  fork: 'M3 3h2v11h4V7h6l3 7h1v5h-2.3a2.5 2.5 0 0 1-4.9 0H8.2a2.5 2.5 0 0 1-4.9 0H3V3zm8 6v5h5.4l-2.1-5H11zM21 3v9h-2V3h2z',
};

/* ---------- CONFIANZA: +60 clientes frecuentes + convenios ---------- */
export const Trust: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const n = Math.round(interpolate(f, [4, 30], [0, 60], {...cl, easing: E.out}));
  const chips: [string, string][] = [
    [I.shield, 'Aseguradoras'],
    [I.wrench, 'Talleres'],
    [I.gear, 'Desarmadurías'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      <div style={{position: 'absolute', top: 300, left: 72, right: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: fade(f, 0)}}>
          <span style={{width: 44 * fade(f, 0), height: 4, background: K.red, display: 'inline-block'}} />
          CONFÍAN EN NOSOTROS
        </div>
        <div style={{marginTop: 10, fontFamily: MONT, fontStyle: 'italic', fontWeight: 900, fontSize: 230, lineHeight: 1, color: K.white, letterSpacing: '-0.03em', textShadow: '0 8px 40px rgba(0,0,0,0.5)'}}>
          +{n}
        </div>
        <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 46, lineHeight: 1.1, textTransform: 'uppercase', color: K.white, opacity: fade(f, 10)}}>
          clientes frecuentes <span style={{background: K.red, padding: '0 10px'}}>al mes</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1010, left: 72, right: 150}}>
        <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.75)', opacity: fade(f, 22)}}>CONVENIOS CON</div>
        <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
          {chips.map(([d, label], i) => {
            const p = pop(f, 26 + i * 6);
            return (
              <div key={label} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '18px 26px', borderRadius: 18, background: 'rgba(8,8,8,0.7)', border: '1.5px solid rgba(255,255,255,0.16)', borderLeft: `6px solid ${K.red}`, backdropFilter: 'blur(10px)', opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -50}px)`}}>
                <Ico d={d} s={42} />
                <div style={{fontFamily: MONT, fontWeight: 800, fontSize: 42, color: K.white}}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------- QUÉ TRASLADAMOS (va dentro de Cobertura) ---------- */
export const VehicleTypes: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const items: [string, string][] = [
    [I.car, 'Livianos'],
    [I.moto, 'Motos'],
    [I.fork, 'Yales'],
    [I.box, 'Repuestos grandes'],
  ];
  return (
    <div style={{position: 'absolute', top: 1320, left: 60, right: 140, display: 'flex', flexWrap: 'wrap', gap: 12}}>
      {items.map(([d, label], i) => {
        const p = pop(f, at + i * 5);
        return (
          <div key={label} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 99, background: 'rgba(8,8,8,0.75)', border: '1.5px solid rgba(255,255,255,0.2)', opacity: Math.min(1, p * 1.5), transform: `scale(${0.85 + 0.15 * p})`}}>
            <Ico d={d} s={32} />
            <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 30, color: K.white}}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- MEDIOS DE PAGO (va dentro de Tarifa) ---------- */
// Logos oficiales (simple-icons, trazo único), en blanco sobre el color de cada marca.
const P = {
  visa: 'M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z',
  mastercard: 'M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z',
  americanexpress: 'M16.015 14.378c0-.32-.135-.496-.344-.622-.21-.12-.464-.135-.81-.135h-1.543v2.82h.675v-1.027h.72c.24 0 .39.024.478.125.12.13.104.38.104.55v.35h.66v-.555c-.002-.25-.017-.376-.108-.516-.06-.08-.18-.18-.33-.234l.02-.008c.18-.072.48-.297.48-.747zm-.87.407l-.028-.002c-.09.053-.195.058-.33.058h-.81v-.63h.824c.12 0 .24 0 .33.05.098.048.156.147.15.255 0 .12-.045.215-.134.27zM20.297 15.837H19v.6h1.304c.676 0 1.05-.278 1.05-.884 0-.28-.066-.448-.187-.582-.153-.133-.392-.193-.73-.207l-.376-.015c-.104 0-.18 0-.255-.03-.09-.03-.15-.105-.15-.21 0-.09.017-.166.09-.21.083-.046.177-.066.272-.06h1.23v-.602h-1.35c-.704 0-.958.437-.958.84 0 .9.776.855 1.407.87.104 0 .18.015.225.06.046.03.082.106.082.18 0 .077-.035.15-.08.18-.06.053-.15.07-.277.07zM0 0v10.096L.81 8.22h1.75l.225.464V8.22h2.043l.45 1.02.437-1.013h6.502c.295 0 .56.057.756.236v-.23h1.787v.23c.307-.17.686-.23 1.12-.23h2.606l.24.466v-.466h1.918l.254.465v-.466h1.858v3.948H20.87l-.36-.6v.585h-2.353l-.256-.63h-.583l-.27.614h-1.213c-.48 0-.84-.104-1.08-.24v.24h-2.89v-.884c0-.12-.03-.12-.105-.135h-.105v1.036H6.067v-.48l-.21.48H4.69l-.202-.48v.465H2.235l-.256-.624H1.4l-.256.624H0V24h23.786v-7.108c-.27.135-.613.18-.973.18H21.09v-.255c-.21.165-.57.255-.914.255H14.71v-.9c0-.12-.018-.12-.12-.12h-.075v1.022h-1.8v-1.066c-.298.136-.643.15-.928.136h-.214v.915h-2.18l-.54-.617-.57.6H4.742v-3.93h3.61l.518.602.554-.6h2.412c.28 0 .74.03.942.225v-.24h2.177c.202 0 .644.045.903.225v-.24h3.265v.24c.163-.164.508-.24.803-.24h1.89v.24c.194-.15.464-.24.84-.24h1.176V0H0zM21.156 14.955c.004.005.006.012.01.016.01.01.024.01.032.02l-.042-.035zM23.828 13.082h.065v.555h-.065zM23.865 15.03v-.005c-.03-.025-.046-.048-.075-.07-.15-.153-.39-.215-.764-.225l-.36-.012c-.12 0-.194-.007-.27-.03-.09-.03-.15-.105-.15-.21 0-.09.03-.16.09-.204.076-.045.15-.05.27-.05h1.223v-.588h-1.283c-.69 0-.96.437-.96.84 0 .9.78.855 1.41.87.104 0 .18.015.224.06.046.03.076.106.076.18 0 .07-.034.138-.09.18-.045.056-.136.07-.27.07h-1.288v.605h1.287c.42 0 .734-.118.9-.36h.03c.09-.134.135-.3.135-.523 0-.24-.045-.39-.135-.526zM18.597 14.208v-.583h-2.235V16.458h2.235v-.585h-1.57v-.57h1.533v-.584h-1.532v-.51M13.51 8.787h.685V11.6h-.684zM13.126 9.543l-.007.006c0-.314-.13-.5-.34-.624-.217-.125-.47-.135-.81-.135H10.43v2.82h.674v-1.034h.72c.24 0 .39.03.487.12.122.136.107.378.107.548v.354h.677v-.553c0-.25-.016-.375-.11-.516-.09-.107-.202-.19-.33-.237.172-.07.472-.3.472-.75zm-.855.396h-.015c-.09.054-.195.056-.33.056H11.1v-.623h.825c.12 0 .24.004.33.05.09.04.15.128.15.25s-.047.22-.134.266zM15.92 9.373h.632v-.6h-.644c-.464 0-.804.105-1.02.33-.286.3-.362.69-.362 1.11 0 .512.123.833.36 1.074.232.238.645.31.97.31h.78l.255-.627h1.39l.262.627h1.36v-2.11l1.272 2.11h.95l.002.002V8.786h-.684v1.963l-1.18-1.96h-1.02V11.4L18.11 8.744h-1.004l-.943 2.22h-.3c-.177 0-.362-.03-.468-.134-.125-.15-.186-.36-.186-.662 0-.285.08-.51.194-.63.133-.135.272-.165.516-.165zm1.668-.108l.464 1.118v.002h-.93l.466-1.12zM2.38 10.97l.254.628H4V9.393l.972 2.205h.584l.973-2.202.015 2.202h.69v-2.81H6.118l-.807 1.904-.876-1.905H3.343v2.663L2.205 8.787h-.997L.01 11.597h.72l.26-.626h1.39zm-.688-1.705l.46 1.118-.003.002h-.915l.457-1.12zM11.856 13.62H9.714l-.85.923-.825-.922H5.346v2.82H8l.855-.932.824.93h1.302v-.94h.838c.6 0 1.17-.164 1.17-.945l-.006-.003c0-.78-.598-.93-1.128-.93zM7.67 15.853l-.014-.002H6.02v-.557h1.47v-.574H6.02v-.51H7.7l.733.82-.764.824zm2.642.33l-1.03-1.147 1.03-1.108v2.253zm1.553-1.258h-.885v-.717h.885c.24 0 .42.098.42.344 0 .243-.15.372-.42.372zM9.967 9.373v-.586H7.73V11.6h2.237v-.58H8.4v-.564h1.527V9.88H8.4v-.507',
};
const Brand: React.FC<{d: string; bg: string; w?: number}> = ({d, bg, w = 78}) => (
  <div style={{width: w + 30, height: 70, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={w} height={w} viewBox="0 0 24 24"><path d={d} fill="#fff" /></svg>
  </div>
);
export const Payments: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const a = fade(f, at, 10);
  const txt = (s: string) => (
    <div style={{height: 70, padding: '0 22px', borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 28, color: '#111'}}>{s}</div>
  );
  return (
    <div style={{position: 'absolute', top: 1390, left: 60, right: 140, opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>
      <div style={{fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.8)', marginBottom: 14}}>PAGA COMO QUIERAS</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
        {txt('Webpay')}
        <Brand d={P.visa} bg="#1A1F71" w={84} />
        <Brand d={P.mastercard} bg="#EB001B" w={62} />
        <Brand d={P.americanexpress} bg="#2E77BC" w={60} />
        {txt('Transferencia')}
        {txt('Efectivo')}
      </div>
    </div>
  );
};

/* ---------- SELLO 24/7 (cierre) ---------- */
export const Seal247: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f - at, fps: 30, config: {damping: 10, stiffness: 170, mass: 0.7}});
  const rot = (f - at) * 0.8;
  const R = 92;
  const text = ' ATENCIÓN 24 HORAS · 7 DÍAS ·';
  return (
    <div style={{position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, opacity: Math.min(1, p * 2), transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -30}deg)`}}>
      <svg width={R * 2} height={R * 2} viewBox={`0 0 ${R * 2} ${R * 2}`}>
        <defs>
          <path id="sealpath" d={`M ${R} ${R} m -${R - 18} 0 a ${R - 18} ${R - 18} 0 1 1 ${2 * (R - 18)} 0 a ${R - 18} ${R - 18} 0 1 1 -${2 * (R - 18)} 0`} />
        </defs>
        <circle cx={R} cy={R} r={R - 2} fill={K.red} />
        <circle cx={R} cy={R} r={R - 34} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
        <g transform={`rotate(${rot} ${R} ${R})`}>
          <text fill="#fff" style={{fontFamily: MONT, fontWeight: 800, fontSize: 15, letterSpacing: '0.12em'}}>
            <textPath href="#sealpath">{text}</textPath>
          </text>
        </g>
        <text x={R} y={R + 14} textAnchor="middle" fill="#fff" style={{fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 44}}>24/7</text>
      </svg>
    </div>
  );
};
