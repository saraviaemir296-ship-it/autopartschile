import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';

/* v3 "nativa": misma venta real del motor Swift (vendido en $1.078.990,
   dato del dueño), pero con estética de video grabado y editado en el
   celular — solo material real, texto tipo TikTok (cajas blancas), cortes
   con zoom y una pregunta para comentar. Sin pantallas de plantilla. */

const S = (f: string) => staticFile(f);
const TXT = "'Montserrat', 'Inter', sans-serif";

const ORDER = [
  ['hook', 72],
  ['vano', 57],
  ['auto', 57],
  ['local', 105],
  ['carga', 36],
  ['entrega', 33],
  ['fin', 90],
] as const;
type Key = (typeof ORDER)[number][0];
const T = (() => {
  const o = {} as Record<Key, [number, number]>;
  let x = 0;
  for (const [k, d] of ORDER) {
    o[k] = [x, x + d];
    x += d;
  }
  return o;
})();
export const SWIFT_UGC_TOTAL = T.fin[1];
const at = (r: [number, number]) => ({from: r[0], durationInFrames: r[1] - r[0]});

/* zoom "punch" de cada corte, como en CapCut */
const Punch: React.FC<{t: number; children: React.ReactNode; drift?: number}> = ({t, children, drift = 0.04}) => {
  const s = interpolate(t, [0, 7], [1.1, 1], {...cl}) + t * (drift / 60);
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};
const Clip: React.FC<{src: string; from: number; vol?: number}> = ({src, from, vol = 0.5}) => (
  <OffthreadVideo src={S(src)} startFrom={Math.round(from * 30)} volume={vol} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
);
/* foto real a pantalla completa: fondo desenfocado + foto entera */
const Photo: React.FC<{src: string; top: number}> = ({src, top}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Img src={S(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) brightness(0.55)', transform: 'scale(1.2)'}} />
    <Img src={S(src)} style={{position: 'absolute', left: 0, top, width: '100%'}} />
  </AbsoluteFill>
);

/* texto nativo: cada línea en su caja blanca */
const Cap: React.FC<{t: number; lines: React.ReactNode[]; y: number; size?: number; dark?: boolean}> = ({t, lines, y, size = 52, dark}) => {
  const p = spring({frame: t, fps: 30, config: {damping: 14, stiffness: 320, mass: 0.5}});
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, transform: `scale(${0.92 + 0.08 * p})`, opacity: Math.min(1, p * 3)}}>
      {lines.map((l, i) => (
        <div key={i} style={{background: dark ? 'rgba(0,0,0,0.78)' : '#fff', color: dark ? '#fff' : '#111', fontFamily: TXT, fontWeight: 800, fontSize: size, lineHeight: 1.18, padding: '6px 22px', borderRadius: 14, marginTop: i ? -6 : 0, textAlign: 'center'}}>
          {l}
        </div>
      ))}
    </div>
  );
};

export const MotorSwiftUGC: React.FC = () => {
  const f = useCurrentFrame();
  const l = (k: Key) => f - T[k][0];
  const h = l('hook');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* 1. precio de entrada */}
      <Sequence {...at(T.hook)}>
        <Punch t={h} drift={0.06}><Clip src="swift/entrega_anon.mp4" from={0.3} vol={0.35} /></Punch>
        <Cap t={h} y={560} lines={['Vendimos este motor en']} />
        {h >= 10 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 660, display: 'flex', justifyContent: 'center'}}>
            <div style={{background: '#fff', color: '#D10B0C', fontFamily: TXT, fontWeight: 900, fontSize: 132, lineHeight: 1.05, padding: '4px 30px 10px', borderRadius: 18, transform: `scale(${interpolate(h, [10, 14, 18], [1.5, 0.94, 1], cl)}) rotate(-2deg)`}}>
              $1.078.990
            </div>
          </div>
        )}
        {h >= 34 && <Cap t={h - 34} y={860} lines={['¿caro o barato? 🤔']} size={54} dark />}
      </Sequence>

      {/* 2. el motor */}
      <Sequence {...at(T.vano)}>
        <Punch t={l('vano')}><Photo src="swift/motor-vano.jpg" top={460} /></Punch>
        <Cap t={l('vano')} y={1260} lines={['Motor Suzuki Swift 1.2 K12MN', 'tapa de aluminio · mecánico']} size={46} />
      </Sequence>

      {/* 3. de dónde salió */}
      <Sequence {...at(T.auto)}>
        <Punch t={l('auto')}><Photo src="swift/auto.jpg" top={600} /></Punch>
        <Cap t={l('auto')} y={1220} lines={['Salió de este Dzire 2012–2017', 'que entró a desarme']} size={46} />
      </Sequence>

      {/* 4. cotizó en la web y vino */}
      <Sequence {...at(T.local)}>
        <Punch t={l('local')} drift={0.02}><Clip src="swift/mostrador_anon.mp4" from={0.6} vol={0.5} /></Punch>
        <Cap t={l('local')} y={1150} lines={['El cliente lo cotizó', 'en nuestra web 💻']} size={48} />
        {l('local') >= 50 && <Cap t={l('local') - 50} y={1300} lines={['…y vino a verlo en persona']} size={48} />}
      </Sequence>

      {/* 5. despacho */}
      <Sequence {...at(T.carga)}>
        <Punch t={l('carga')}><Clip src="swift/entrega_anon.mp4" from={2.0} vol={0.5} /></Punch>
        <Cap t={l('carga')} y={1150} lines={['Se lo despachamos', 'a su automotora 🚚']} size={50} />
      </Sequence>
      <Sequence {...at(T.entrega)}>
        <Punch t={l('entrega')}><Clip src="swift/entrega_anon.mp4" from={5.5} vol={0.5} /></Punch>
        <Cap t={l('entrega')} y={1150} lines={['Entregado ✅']} size={60} />
      </Sequence>

      {/* 6. cierre: pregunta + palabra clave */}
      <Sequence {...at(T.fin)}>
        <Punch t={l('fin')} drift={0.05}><Photo src="swift/motor-vano.jpg" top={460} /></Punch>
        <AbsoluteFill style={{background: 'rgba(0,0,0,0.35)'}} />
        <Cap t={l('fin')} y={560} lines={['¿Caro o barato? 👇']} size={72} />
        {l('fin') >= 18 && <Cap t={l('fin') - 18} y={1240} lines={['¿Tienes un Swift?', 'Escribe SWIFT al WhatsApp']} size={46} />}
        {l('fin') >= 30 && <Cap t={l('fin') - 30} y={1400} lines={['Desarmaduría Saravia · La Pintana']} size={34} dark />}
      </Sequence>

      {/* sonido mínimo: el resto lo pone la canción de la app */}
      <Sequence from={10}><Audio src={S('audio/sfx_pa.wav')} volume={0.55} /></Sequence>
      <Sequence from={34}><Audio src={S('audio/sfx_blip.wav')} volume={0.35} /></Sequence>
      {[T.vano[0], T.auto[0], T.local[0], T.carga[0], T.entrega[0], T.fin[0]].map((x) => (
        <Sequence key={x} from={x - 2}><Audio src={S('audio/sfx_whoosh.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={T.entrega[0] + 2}><Audio src={S('audio/sfx_correct.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};
