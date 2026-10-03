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

const PARTS: {img: string; model: string}[] = [
  {img: 'suzuki/a800_10_900x1600.jpg', model: 'Alto 800'},
  {img: 'suzuki/celerio-hd-kit-ecu-chapa-llave-33920-76m30.jpg', model: 'Celerio'},
  {img: 'suzuki/ecu-sx4-16-at-m16a-mm-2006-2014.jpg', model: 'SX4 4x4'},
  {img: 'suzuki/spresso-k10c-kit-ecu-bcm.jpg', model: 'S-Presso'},
  {img: 'suzuki/swift-japones-alternador.jpg', model: 'Swift'},
  {img: 'suzuki/dzire-pc-ecu-33920-74l21.jpg', model: 'Dzire'},
  {img: 'suzuki/celerio-k10b-2015-2023-focos-opticos-delanteros.jpg', model: 'Celerio'},
  {img: 'suzuki/suzuki-alto-800-compresor-ac-f8d.jpg', model: 'Alto 800'},
  {img: 'suzuki/swift-espejo-conductor.jpg', model: 'Swift'},
];
const HOOK = 72;
const CLIENT = 45;
const EACH = 24;
const MONTAGE = PARTS.length * EACH;
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
        <Cap t={h} y={520} lines={['Este cliente pagó']} />
        {h >= 8 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 618, display: 'flex', justifyContent: 'center'}}>
            <div style={{background: '#fff', color: '#D10B0C', fontFamily: TXT, fontWeight: 900, fontSize: 132, lineHeight: 1.05, padding: '4px 30px 10px', borderRadius: 18, transform: `scale(${interpolate(h, [8, 12, 16], [1.5, 0.94, 1], cl)}) rotate(-2deg)`}}>
              $1.078.990
            </div>
          </div>
        )}
        {h >= 18 && <Cap t={h - 18} y={812} lines={['por este motor Suzuki Swift']} size={50} />}
        {h >= 40 && <Cap t={h - 40} y={940} lines={['¿y tú qué Suzuki tienes? 👇']} size={54} dark />}
      </Sequence>

      {/* 2. el cliente en el local */}
      <Sequence from={HOOK} durationInFrames={CLIENT}>
        <Punch t={f - HOOK} drift={0.02}><Clip src="swift/mostrador_anon.mp4" from={0.8} vol={0.5} /></Punch>
        <Cap t={f - HOOK} y={1180} lines={['Lo cotizó en nuestra web', 'y vino a verlo en persona']} size={48} />
      </Sequence>

      {/* 3. desfile de repuestos Suzuki con precio real */}
      {PARTS.map((p, i) => {
        const a = M0 + i * EACH;
        const t = f - a;
        return (
          <Sequence key={p.img} from={a} durationInFrames={EACH}>
            <Punch t={t} drift={0.08}>
              <AbsoluteFill style={{background: '#000'}}>
                <Img src={S(p.img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.5)', transform: 'scale(1.2)'}} />
                <Img src={S(p.img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain'}} />
              </AbsoluteFill>
            </Punch>
            <div style={{position: 'absolute', top: 40, right: 36, background: 'rgba(0,0,0,0.78)', color: '#fff', fontFamily: TXT, fontWeight: 800, fontSize: 38, padding: '8px 18px', borderRadius: 14}}>{i + 1}/{PARTS.length}</div>
          </Sequence>
        );
      })}

      {/* 4. cierre: escribe tu modelo */}
      <Sequence from={F0} durationInFrames={FIN}>
        <Punch t={f - F0} drift={0.04}>
          <AbsoluteFill>
            <Img src={S('swift/motor-vano.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(26px) brightness(0.4)', transform: 'scale(1.2)'}} />
          </AbsoluteFill>
        </Punch>
        <Cap t={f - F0} y={420} lines={['¿Buscas un repuesto', 'para tu Suzuki?']} size={64} />
        <div style={{position: 'absolute', top: 720, left: 90, right: 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16}}>
          {MODELS.map((m, i) => {
            const k = f - F0 - 10 - i * 4;
            return (
              <div key={m} style={{background: '#fff', color: '#111', fontFamily: TXT, fontWeight: 900, fontSize: 48, padding: '8px 26px', borderRadius: 14, opacity: k > 0 ? 1 : 0, transform: `scale(${interpolate(k, [0, 4, 8], [1.4, 0.95, 1], cl)})`}}>
                {m}
              </div>
            );
          })}
        </div>
        {f - F0 >= 36 && <Cap t={f - F0 - 36} y={1020} lines={['Escribe tu modelo', 'al WhatsApp 👇']} size={60} />}
        {f - F0 >= 50 && <Cap t={f - F0 - 50} y={1220} lines={['+56 9 5381 7335']} size={58} dark />}
        {f - F0 >= 58 && <Cap t={f - F0 - 58} y={1340} lines={['Despacho a todo Chile 📦']} size={42} dark />}
      </Sequence>

      {/* sonido mínimo: la canción la pone la app */}
      <Sequence from={8}><Audio src={S('audio/sfx_pa.wav')} volume={0.55} /></Sequence>
      <Sequence from={40}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      <Sequence from={HOOK - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.25} /></Sequence>
      <Sequence from={M0 - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.3} /></Sequence>
      {PARTS.map((p, i) => (
        <Sequence key={'t' + i} from={M0 + i * EACH}><Audio src={S('audio/sfx_tick.wav')} volume={0.3} /></Sequence>
      ))}
      <Sequence from={F0}><Audio src={S('audio/sfx_impact_soft.wav')} volume={0.4} /></Sequence>
      {MODELS.map((m, i) => (
        <Sequence key={'m' + i} from={F0 + 10 + i * 4}><Audio src={S('audio/sfx_blip.wav')} volume={0.2} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
