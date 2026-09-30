import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {E, K, cl} from './look';
import {MONT} from './Type4';

const INTERF = "'Inter', sans-serif";
const sp = (f: number, d: number, stiff = 200) => spring({frame: f - d, fps: 30, config: {damping: 18, stiffness: stiff, mass: 0.6}});
const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: E.out});

/** Toque del dedo: círculo + onda expansiva. */
const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  if (f < at - 8 || f > at + 16) return null;
  const inn = lin(f, at - 8, at);
  const ring = lin(f, at, at + 14);
  return (
    <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: -34, top: -34, width: 68, height: 68, borderRadius: 99, background: 'rgba(255,255,255,0.55)', border: '3px solid rgba(255,255,255,0.9)', transform: `scale(${0.6 + 0.4 * inn - (f > at ? 0.15 : 0)})`, opacity: f > at + 8 ? 1 - lin(f, at + 8, at + 16) : inn}} />
      <div style={{position: 'absolute', left: -34, top: -34, width: 68, height: 68, borderRadius: 99, border: `3px solid ${K.red}`, transform: `scale(${1 + ring * 1.6})`, opacity: f >= at ? 1 - ring : 0}} />
    </div>
  );
};

const Field: React.FC<{icon: React.ReactNode; placeholder: string; value?: string; typed: number; active: boolean}> = ({icon, placeholder, value, typed, active}) => {
  const shown = value ? value.slice(0, Math.round(value.length * typed)) : '';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        height: 78,
        borderRadius: 16,
        background: '#F4F4F5',
        border: `2px solid ${active ? K.red : 'transparent'}`,
        fontFamily: INTERF,
        fontSize: 25,
        color: shown ? '#111' : '#8A8A8E',
        fontWeight: shown ? 600 : 500,
      }}
    >
      {icon}
      <div style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden'}}>{shown || placeholder}</div>
      {typed >= 1 && value && (
        <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={K.red} /><path d="M7 12.5l3.3 3.3L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </div>
  );
};

const Pin = () => (
  <svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill={K.red} /></svg>
);
const Flag = () => (
  <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 21V3h2v1h11l-2 4 2 4H7v9z" fill={K.red} /></svg>
);
const Car = () => (
  <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11a2 2 0 0 1 2 2v5h-2v1.5a1.5 1.5 0 0 1-3 0V18H8v1.5a1.5 1.5 0 0 1-3 0V18H3v-5a2 2 0 0 1 2-2zm2.2 0h9.6l-1-3H8.2zM6.5 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="#222" /></svg>
);

/**
 * Demo del sitio gruasaravia.cl dentro de un teléfono: el cliente pone su
 * ubicación, destino y vehículo, toca "Calcular costo" y ve la tarifa
 * (base + km, total antes de pedir). Sin montos inventados.
 */
export const WebDemo: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const enter = sp(f, 0, 150);
  const out = interpolate(f, [dur - 8, dur], [1, 0], cl);
  const T = {loc: 14, dest: 32, veh: 52, calc: 66, result: 76};
  const loading = f >= T.calc && f < T.result;
  const res = sp(f, T.result, 170);
  // cámara: leve push-in al teléfono y al resultado
  const cam = 1 + 0.06 * lin(f, 0, dur) + 0.04 * lin(f, T.result, T.result + 20);
  const PW = 600;
  const PH = 1240;
  const px = (1080 - PW) / 2;
  const py = 330;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out, transform: `scale(${cam})`, transformOrigin: '50% 60%'}}>
      {/* rótulo */}
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', fontFamily: MONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.24em', color: K.white, opacity: lin(f, 4, 16)}}>
        COTIZA EN <span style={{color: K.red}}>GRUASARAVIA.CL</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: px,
          top: py + 40,
          width: PW,
          height: PH,
          borderRadius: 70,
          background: '#0E0E10',
          border: '10px solid #1C1C1F',
          boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 0 2px #2A2A2E',
          overflow: 'hidden',
          transform: `translateY(${(1 - enter) * 500}px) rotate(${(1 - enter) * 6}deg)`,
        }}
      >
        {/* barra de estado + URL */}
        <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 44px 0', fontFamily: INTERF, fontWeight: 600, fontSize: 22, color: '#fff'}}>
          <span>9:41</span>
          <span style={{width: 150, height: 34, borderRadius: 20, background: '#000'}} />
          <span>● ●</span>
        </div>
        <div style={{margin: '8px 26px 0', height: 58, borderRadius: 16, background: '#2A2A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: INTERF, fontSize: 24, fontWeight: 500, color: '#fff'}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="#bbb" /><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#bbb" strokeWidth="2" fill="none" /></svg>
          gruasaravia.cl
        </div>
        {/* cabecera con logo */}
        <div style={{height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile('logo-gruas-saravia.png')} style={{width: 330, mixBlendMode: 'screen'}} />
        </div>
        {/* formulario */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, bottom: 0, background: '#fff', borderRadius: '34px 34px 0 0', padding: '34px 30px'}}>
          <div style={{fontFamily: INTERF, fontWeight: 800, fontSize: 38, color: '#111', marginBottom: 24}}>Solicitar grúa</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <Field icon={<Pin />} placeholder="Mi ubicación actual" value="Ubicación actual detectada" typed={lin(f, T.loc, T.loc + 10)} active={f >= T.loc && f < T.dest} />
            <Field icon={<Flag />} placeholder="¿A dónde necesitas llegar?" value="Mi taller de confianza" typed={lin(f, T.dest, T.dest + 16)} active={f >= T.dest && f < T.veh} />
            <Field icon={<Car />} placeholder="Tipo de vehículo" value="Automóvil" typed={lin(f, T.veh, T.veh + 8)} active={f >= T.veh && f < T.calc} />
          </div>
          <div
            style={{
              marginTop: 26,
              height: 86,
              borderRadius: 18,
              background: K.red,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              fontFamily: INTERF,
              fontWeight: 700,
              fontSize: 30,
              color: '#fff',
              transform: `scale(${f >= T.calc && f < T.calc + 5 ? 0.96 : 1})`,
              boxShadow: '0 10px 26px rgba(209,11,12,0.35)',
            }}
          >
            {loading ? (
              <div style={{width: 34, height: 34, borderRadius: 99, border: '4px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', transform: `rotate(${(f - T.calc) * 40}deg)`}} />
            ) : (
              'Calcular costo'
            )}
          </div>
          {/* barra inferior */}
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontFamily: INTERF, fontSize: 19, color: '#888'}}>
            {['Inicio', 'Servicios', 'Seguimiento', 'Perfil'].map((n, i) => (
              <div key={n} style={{textAlign: 'center', color: i === 0 ? '#111' : '#888', fontWeight: i === 0 ? 700 : 500}}>
                <div style={{width: 28, height: 28, margin: '0 auto 6px', borderRadius: 8, background: i === 0 ? '#111' : '#ccc'}} />
                {n}
              </div>
            ))}
          </div>
          {/* resultado */}
          <div
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 16,
              borderRadius: 28,
              background: '#111',
              padding: '30px 30px 26px',
              transform: `translateY(${(1 - res) * 560}px)`,
              boxShadow: '0 -20px 50px rgba(0,0,0,0.35)',
              fontFamily: INTERF,
              color: '#fff',
            }}
          >
            <div style={{fontSize: 20, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)'}}>TARIFA CALCULADA</div>
            <div style={{marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 12, fontFamily: MONT, fontWeight: 900, fontStyle: 'italic', fontSize: 50}}>
              BASE <span style={{color: K.red}}>+</span> KM
            </div>
            <div style={{marginTop: 8, fontSize: 24, color: 'rgba(255,255,255,0.8)'}}>Total antes de pedir la grúa</div>
            <div style={{marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, fontSize: 26, fontWeight: 700}}>
              <svg width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={K.red} /><path d="M7 12.5l3.3 3.3L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Sin cobros ocultos
            </div>
            <div style={{marginTop: 22, height: 76, borderRadius: 16, background: K.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28}}>Solicitar grúa</div>
          </div>
        </div>
      </div>
      {/* toques del dedo (coordenadas de pantalla) */}
      <Tap x={540} y={py + 40 + 330 + 34 + 62 + 39} at={T.loc} />
      <Tap x={540} y={py + 40 + 330 + 34 + 62 + 78 + 16 + 39} at={T.dest} />
      <Tap x={540} y={py + 40 + 330 + 34 + 62 + (78 + 16) * 2 + 39} at={T.veh} />
      <Tap x={540} y={py + 40 + 330 + 34 + 62 + (78 + 16) * 3 + 10 + 43} at={T.calc} />
    </div>
  );
};
