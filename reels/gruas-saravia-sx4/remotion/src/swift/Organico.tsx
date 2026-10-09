import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

/* Video orgánico (sin edición pesada): la voz real del dueño con el llamado
   (auto parado → trato/pago/retiro directo → $20.000 por dato → WhatsApp →
   Desarmaduría Saravia) sobre cortes secos de clips reales, sin efectos ni
   gradación, con subtítulos estilo TikTok. La música la pone el dueño en la app. */

const S = (f: string) => staticFile(f);
const TXT = "'Montserrat', sans-serif";

// [archivo, inicio en este video, largo, segundo de inicio del clip]
type Clip = [string, number, number, number];
const CLIPS: Clip[] = [
  ['swift/vitara_local_anon.mp4', 0, 34, 0.3],
  ['swift/mv_desarme.mp4', 34, 32, 1.0],
  ['swift/sx4b_jeep.mp4', 66, 35, 0],
  ['swift/sx4b_mano.mp4', 101, 36, 0],      // trato directo
  ['swift/sx4b_papeles.mp4', 137, 36, 0.2], // pago directo
  ['swift/sx4b_carga.mp4', 173, 40, 1.0],   // retiro directo
  ['swift/sx4b_arriba.mp4', 213, 47, 0.3],
  ['swift/mv_carga.mp4', 260, 47, 3.0],
  ['swift/vitara_portalon.mp4', 307, 50, 0.5],
  ['img:swift/jeep_whatsapp.png', 357, 43, 0],
  ['swift/entrega_anon.mp4', 400, 42, 4.0],
  ['swift/airbag_kit.mp4', 442, 83, 0.2],
];
export const ORGANICO_TOTAL = 525;

// [archivo, inicio, largo, texto dicho]
const VO: [string, number, number, string][] = [
  ['audio/vo/dos2_16.wav', 0, 98, 'Mi gente, si tienes un auto parado, chocado o malo, en cualquier estado…'],
  ['audio/vo/dos2_17.wav', 101, 109, 'trato directo, pago directo y retiro directo.'],
  ['audio/vo/dos2_18.wav', 213, 141, 'Y si sabes de alguien que tenga uno, te pagamos veinte lucas por el dato si se concreta.'],
  ['audio/vo/dos2_19.wav', 357, 82, 'Mándanos tres fotos y la patente por WhatsApp.'],
  ['audio/vo/dos2_20.wav', 442, 52, 'Desarmaduría Saravia.'],
];

/* subtítulos: grupos de hasta 4 palabras, repartidos según el largo de cada palabra */
type Chunk = {a: number; b: number; txt: string};
const CHUNKS: Chunk[] = VO.flatMap(([, st, du, txt]) => {
  const ws = txt.split(' ');
  const wt = ws.map((w) => w.length + 2);
  const tot = wt.reduce((x, y) => x + y, 0);
  const out: Chunk[] = [];
  let acc = 0, cur: string[] = [], a0 = st + 2;
  ws.forEach((w, i) => {
    cur.push(w); acc += wt[i];
    const t = st + 2 + (acc / tot) * (du - 4);
    if (cur.length >= 4 || /[,.…:]$/.test(w) || i === ws.length - 1) { out.push({a: a0, b: t, txt: cur.join(' ')}); cur = []; a0 = t; }
  });
  return out;
});

const Caption: React.FC<{f: number}> = ({f}) => {
  const c = CHUNKS.find(({a, b}) => f >= a && f < b + 2);
  if (!c) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1180, textAlign: 'center'}}>
      <span style={{fontFamily: TXT, fontWeight: 800, fontSize: 64, lineHeight: 1.2, color: '#fff', textShadow: '0 0 4px #000, 0 2px 10px rgba(0,0,0,0.9), 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'}}>{c.txt}</span>
    </div>
  );
};

/* rótulos simples tipo "texto de TikTok" (caja blanca, letra negra) */
const Label: React.FC<{f: number; at: number; until: number; top: number; children: React.ReactNode}> = ({f, at, until, top, children}) => {
  if (f < at || f >= until) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{display: 'inline-block', background: '#fff', color: '#000', fontFamily: TXT, fontWeight: 800, fontSize: 54, lineHeight: 1.25, padding: '10px 26px', borderRadius: 14}}>{children}</span>
    </div>
  );
};

export const Organico: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {CLIPS.map(([src, at, dur, st]) => (
        <Sequence key={at} from={at} durationInFrames={dur}>
          {src.startsWith('img:') ? (
            <AbsoluteFill style={{background: '#efe7de'}}>
              <Img src={S(src.slice(4))} style={{position: 'absolute', left: 0, width: 1080, top: -1130 - (f - at) * 6}} />
            </AbsoluteFill>
          ) : (
            <OffthreadVideo src={S(src)} muted startFrom={Math.round(st * 30)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          )}
        </Sequence>
      ))}
      <Label f={f} at={0} until={101} top={300}>¿Tienes un auto parado?</Label>
      <Label f={f} at={240} until={357} top={300}>$20.000 por dato<br /><span style={{fontSize: 36, fontWeight: 700}}>si se concreta la compra</span></Label>
      <Label f={f} at={370} until={442} top={300}>WhatsApp +56 9 5381 7335</Label>
      <Label f={f} at={470} until={ORGANICO_TOTAL} top={300}>Desarmaduría Saravia<br /><span style={{fontSize: 38, fontWeight: 700}}>repuestos · grúa · compramos tu auto</span></Label>
      <Caption f={f} />
      {VO.map(([file, st, du]) => (
        <Sequence key={file} from={st} durationInFrames={du + 3}><Audio src={S(file)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
