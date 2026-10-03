import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {Cap, Clip, Punch} from './MotorSwiftUGC';

/* Reel para leads de repuestos Suzuki (todas las líneas). Gancho = venta
   real del motor Swift en $1.078.990 (prueba social), luego un desfile
   rápido de repuestos Suzuki con stock en autopartschile.cl (flyers reales
   con su precio, consultados en la tabla products el 2026-10-03) y cierre
   "escribe tu modelo". Estética nativa, sin pantallas de plantilla. */

const S = (f: string) => staticFile(f);
const TXT = "'Montserrat', 'Inter', sans-serif";

// Orden de MÁS CARO a MÁS BARATO: así la promesa "el último es el más
// barato" es verdad por construcción (precios de la tabla products).
const PARTS: {img: string; model: string}[] = [
  {img: 'suzuki/a800_10_900x1600.jpg', model: 'Alto 800'}, // 649.990
  {img: 'suzuki/spresso-k10c-kit-ecu-bcm.jpg', model: 'S-Presso'}, // 279.990
  {img: 'suzuki/celerio-hd-kit-ecu-chapa-llave-33920-76m30.jpg', model: 'Celerio'}, // 249.990
  {img: 'suzuki/ecu-sx4-16-at-m16a-mm-2006-2014.jpg', model: 'SX4 4x4'}, // 224.990
  {img: 'suzuki/dzire-pc-ecu-33920-74l21.jpg', model: 'Dzire'}, // 179.990
  {img: 'suzuki/suzuki-alto-800-compresor-ac-f8d.jpg', model: 'Alto 800'}, // 129.990
  {img: 'suzuki/swift-japones-alternador.jpg', model: 'Swift'}, // 104.990
  {img: 'suzuki/swift-espejo-conductor.jpg', model: 'Swift'}, // 87.990
  {img: 'suzuki/celerio-k10b-2015-2023-focos-opticos-delanteros.jpg', model: 'Celerio'}, // 61.990
];
const HOOK = 62;
const CLIENT = 30;
const EACH = 22;
const LAST = 40; // el más barato se queda más tiempo
const MONTAGE = (PARTS.length - 1) * EACH + LAST;
const COUNT_END = 16; // el contador del precio llega a $1.078.990 en el cuadro 16
const PRICE = 1078990;
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL').replace(/,/g, '.');
const FIN = 96;
const M0 = HOOK + CLIENT;
const F0 = M0 + MONTAGE;
export const SUZUKI_LEADS_TOTAL = F0 + FIN;

const MODELS = ['Alto', 'Celerio', 'Swift', 'SX4', 'Dzire', 'S-Presso'];

export const SuzukiLeads: React.FC = () => {
  const f = useCurrentFrame();
  const h = f;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* 1. gancho: venta real */}
      <Sequence from={0} durationInFrames={HOOK}>
        <Punch t={h} drift={0.06}><Clip src="swift/entrega_anon.mp4" from={0.3} vol={0.35} /></Punch>
        {/* golpe de cámara al llegar al precio */}
        <AbsoluteFill style={{background: '#fff', opacity: interpolate(h, [COUNT_END - 1, COUNT_END, COUNT_END + 6], [0, 0.8, 0], cl), pointerEvents: 'none'}} />
        <Cap t={h + 8} y={520} lines={['Este cliente pagó']} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 618, display: 'flex', justifyContent: 'center', transform: `translateX(${h >= COUNT_END && h < COUNT_END + 8 ? Math.sin(h * 2.6) * (COUNT_END + 8 - h) * 2.2 : 0}px)`}}>
          <div style={{background: '#fff', color: h >= COUNT_END ? '#D10B0C' : '#111', fontFamily: TXT, fontWeight: 900, fontSize: 132, lineHeight: 1.05, padding: '4px 30px 10px', borderRadius: 18, fontVariantNumeric: 'tabular-nums', transform: `scale(${interpolate(h, [COUNT_END, COUNT_END + 4, COUNT_END + 8], [1.25, 0.95, 1], cl)}) rotate(-2deg)`}}>
            {clp(interpolate(h, [0, COUNT_END], [0, PRICE], {...cl, easing: (x) => 1 - Math.pow(1 - x, 2)}))}
          </div>
        </div>
        {h >= COUNT_END + 2 && <Cap t={h - COUNT_END - 2} y={812} lines={['por este motor Suzuki Swift']} size={50} />}
        {h >= 34 && <Cap t={h - 34} y={940} lines={['¿y tú qué Suzuki tienes? 👇']} size={54} dark />}
      </Sequence>

      {/* 2. el cliente en el local */}
      <Sequence from={HOOK} durationInFrames={CLIENT}>
        <Punch t={f - HOOK} drift={0.02}><Clip src="swift/mostrador_anon.mp4" from={0.8} vol={0.5} /></Punch>
        <Cap t={f - HOOK} y={1180} lines={['Lo cotizó en la web y vino a verlo 🤝']} size={46} />
      </Sequence>

      {f < M0 && (
        <div style={{position: 'absolute', top: 40, left: 36, width: 300, borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.45)'}}>
          <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
        </div>
      )}

      {/* 3. desfile de repuestos Suzuki con precio real */}
      {PARTS.map((p, i) => {
        const a = M0 + i * EACH;
        const t = f - a;
        const last = i === PARTS.length - 1;
        return (
          <Sequence key={p.img} from={a} durationInFrames={last ? LAST : EACH}>
            <Punch t={t} drift={0.08}>
              <AbsoluteFill style={{background: '#000'}}>
                <Img src={S(p.img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.5)', transform: 'scale(1.2)'}} />
                <Img src={S(p.img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain'}} />
              </AbsoluteFill>
            </Punch>
            <div style={{position: 'absolute', top: 40, right: 36, background: 'rgba(0,0,0,0.78)', color: '#fff', fontFamily: TXT, fontWeight: 800, fontSize: 38, padding: '8px 18px', borderRadius: 14}}>{i + 1}/{PARTS.length}</div>
            {last && t >= 6 && (
              <div style={{position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center'}}>
                <div style={{background: '#FFD400', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 70, padding: '6px 30px', borderRadius: 16, transform: `scale(${interpolate(t, [6, 10, 14], [1.6, 0.92, 1], cl)}) rotate(-4deg)`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
                  EL MÁS BARATO 😳
                </div>
              </div>
            )}
          </Sequence>
        );
      })}

      {f >= M0 && f < F0 - LAST && <Cap t={f - M0} y={150} lines={['👀 el último es el más barato']} size={40} dark />}

      {/* 4. cierre: escribe tu modelo */}
      <Sequence from={F0} durationInFrames={FIN}>
        <Punch t={f - F0} drift={0.04}>
          <AbsoluteFill>
            <Img src={S('swift/motor-vano.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.4)', transform: 'scale(1.2)'}} />
          </AbsoluteFill>
        </Punch>
        <div style={{position: 'absolute', top: 150, left: 70, right: 70, borderRadius: 26, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', transform: `scale(${interpolate(f - F0, [0, 5, 10], [1.25, 0.97, 1], cl)})`}}>
          <Img src={S('suzuki/marca.jpg')} style={{display: 'block', width: '100%'}} />
        </div>
        <Cap t={f - F0} y={620} lines={['¿Buscas un repuesto', 'para tu Suzuki?']} size={64} />
        <div style={{position: 'absolute', top: 900, left: 90, right: 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16}}>
          {MODELS.map((m, i) => {
            const k = f - F0 - 10 - i * 4;
            return (
              <div key={m} style={{background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 48, padding: '8px 26px', borderRadius: 14, opacity: k > 0 ? 1 : 0, transform: `scale(${interpolate(k, [0, 4, 8], [1.4, 0.95, 1], cl)})`}}>
                {m}
              </div>
            );
          })}
        </div>
        {f - F0 >= 36 && <Cap t={f - F0 - 36} y={1180} lines={['Escribe tu modelo', 'al WhatsApp 👇']} size={60} />}
        {f - F0 >= 50 && <Cap t={f - F0 - 50} y={1370} lines={['+56 9 5381 7335']} size={58} dark />}
        {f - F0 >= 58 && <Cap t={f - F0 - 58} y={1480} lines={['Despacho a todo Chile 📦']} size={42} dark />}
      </Sequence>

      {/* ---- sonido: plata ---- */}
      {/* contadora de billetes mientras sube el precio, remate con caja registradora */}
      <Audio src={S('audio/sfx_billcount.wav')} volume={0.9} />
      <Sequence from={COUNT_END - 2}><Audio src={S('audio/sfx_kaching_real.wav')} volume={0.75} /></Sequence>
      <Sequence from={COUNT_END}><Audio src={S('audio/sfx_impact.wav')} volume={0.45} /></Sequence>
      <Sequence from={COUNT_END + 4}><Audio src={S('audio/sfx_coins.wav')} volume={0.4} /></Sequence>
      <Sequence from={34}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={HOOK - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={M0 - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.35} /></Sequence>
      {/* una moneda por repuesto; el último, golpe + caja registradora */}
      {PARTS.slice(0, -1).map((p, i) => (
        <Sequence key={'c' + i} from={M0 + i * EACH}><Audio src={S('audio/sfx_coin.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={F0 - LAST}><Audio src={S('audio/sfx_vineboom.wav')} volume={0.5} /></Sequence>
      <Sequence from={F0 - LAST + 6}><Audio src={S('audio/sfx_kaching.wav')} volume={0.55} /></Sequence>
      {/* cierre */}
      <Sequence from={F0}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.45} /></Sequence>
      {MODELS.map((m, i) => (
        <Sequence key={'m' + i} from={F0 + 10 + i * 4}><Audio src={S('audio/sfx_blip.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={F0 + 50}><Audio src={S('audio/sfx_coins.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
