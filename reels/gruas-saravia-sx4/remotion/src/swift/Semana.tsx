import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {cl} from '../v2/look';
import {GRADE} from './Fx';

/* "Esta semana en la desarmaduría": 2 ventas (ramal Hyundai Verna en el
   mostrador; piolas + varilla + lips de SX4) y 1 compra (Suzuki Ciaz: nos
   pasaron a buscar, transferencia, a la grúa). Sin voz: lo cuentan los
   rótulos; la música la pone el dueño. Caras y patente pixeladas. */

const S = (f: string) => staticFile(f);
const RED = '#D10B0C';
const RED2 = '#FF2A2A';
const DISP = "'Anton', sans-serif";
const TXT = "'Montserrat', sans-serif";
export const SEMANA2_TOTAL = 790;

type Clip = [string, number, number, string?];
const CLIPS: Clip[] = [
  ['img:swift/sem_ciaz.jpg', 0, 90, '35% 50%'],
  ['img:swift/sem_ramal.jpg', 90, 75, '50% 55%'],
  ['swift/sem_mostrador_anon.mp4', 165, 50],
  ['img:swift/sem_piolas.jpg', 215, 90, '45% 60%'],
  ['swift/sem_auto_anon.mp4', 305, 67],
  ['swift/sem_transfer.mp4', 372, 148],
  ['img:swift/sem_ciaz.jpg', 520, 90, '40% 48%'],
];

const pop = (f: number, at: number) => spring({frame: f - at, fps: 30, config: {damping: 12, stiffness: 240, mass: 0.5}});

const Chip: React.FC<{f: number; at: number; until: number; top: number; red?: boolean; size?: number; children: React.ReactNode}> = ({f, at, until, top, red, size = 64, children}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at);
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', transform: `scale(${k})`}}>
      <span style={{display: 'inline-block', background: red ? RED : 'rgba(10,10,10,0.88)', color: '#fff', fontFamily: DISP, fontSize: size, lineHeight: 1.12, padding: '8px 28px 14px', boxShadow: '0 14px 34px rgba(0,0,0,0.5)'}}>{children}</span>
    </div>
  );
};

const Price: React.FC<{f: number; at: number; until: number; top: number; txt: string}> = ({f, at, until, top, txt}) => {
  if (f < at || f >= until) return null;
  const k = interpolate(f - at, [0, 3, 8], [1.8, 0.94, 1], cl);
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `scale(${k}) rotate(-3deg)`}}>
      <span style={{display: 'inline-block', transform: 'skewX(-9deg)', background: 'linear-gradient(180deg,#FF3030 0%,#D10B0C 60%,#9E0707 100%)', padding: '6px 34px 12px', boxShadow: '0 0 40px rgba(209,11,12,0.6), 0 18px 40px rgba(0,0,0,0.6)'}}>
        <span style={{display: 'inline-block', transform: 'skewX(9deg)', fontFamily: DISP, fontSize: 130, color: '#fff'}}>{txt}</span>
      </span>
    </div>
  );
};

const Stamp: React.FC<{f: number; at: number; until: number; top: number; txt: string}> = ({f, at, until, top, txt}) => {
  if (f < at || f >= until) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `rotate(-8deg) scale(${interpolate(f - at, [0, 3, 8], [2.3, 0.92, 1], cl)})`, opacity: interpolate(f - at, [0, 2], [0, 1], cl)}}>
      <span style={{display: 'inline-block', border: `8px solid ${RED2}`, padding: '0 26px 6px', fontFamily: DISP, fontSize: 100, color: '#fff', background: 'rgba(209,11,12,0.88)', letterSpacing: 3, boxShadow: `0 0 30px ${RED}`}}>{txt}</span>
    </div>
  );
};

export const SemanaVentas: React.FC = () => {
  const f = useCurrentFrame();
  const flash = CLIPS.some(([, at]) => f === at && at > 0) ? 0.35 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {CLIPS.map(([src, at, dur, origin], i) => {
        const z = interpolate(f - at, [0, dur], [1.04, 1.13], cl);
        return (
          <Sequence key={i} from={at} durationInFrames={dur}>
            <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: origin ?? '50% 50%'}}>
              {src.startsWith('img:')
                ? <Img src={S(src.slice(4))} style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />
                : <OffthreadVideo src={S(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: GRADE}} />}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)'}} />
      {f < 700 && <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 340, top: 50, width: 400, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))'}} />}

      {/* gancho */}
      <Chip f={f} at={4} until={90} top={250} size={78}>ESTA SEMANA EN LA</Chip>
      <Chip f={f} at={10} until={90} top={360} size={92} red>DESARMADURÍA</Chip>
      <Chip f={f} at={24} until={90} top={1500} size={70}>2 VENTAS · 1 COMPRA</Chip>

      {/* venta 1 */}
      <Chip f={f} at={92} until={215} top={250} size={52} red>VENTA 1</Chip>
      <Chip f={f} at={96} until={215} top={340} size={70}>RAMAL HYUNDAI VERNA</Chip>
      <Price f={f} at={118} until={215} top={1380} txt="$240.000" />
      <Stamp f={f} at={172} until={215} top={1000} txt="VENDIDO" />
      <Chip f={f} at={176} until={215} top={1620} size={48}>ATENDIDO EN EL MOSTRADOR</Chip>

      {/* venta 2 */}
      <Chip f={f} at={217} until={305} top={250} size={52} red>VENTA 2</Chip>
      <Chip f={f} at={221} until={305} top={340} size={56}>PIOLAS + VARILLA DE ACEITE</Chip>
      <Chip f={f} at={227} until={305} top={440} size={56}>+ LIPS FRONTALES SUZUKI SX4</Chip>
      <Price f={f} at={244} until={305} top={1380} txt="$210.000" />
      <Stamp f={f} at={272} until={305} top={1080} txt="VENDIDO" />

      {/* compra */}
      <Chip f={f} at={307} until={520} top={250} size={52} red>Y TAMBIÉN COMPRAMOS</Chip>
      <Chip f={f} at={311} until={372} top={1500} size={60}>NOS PASARON A BUSCAR</Chip>
      <Chip f={f} at={374} until={430} top={1430} size={58}>LO FUIMOS A VER EN PERSONA…</Chip>
      <Chip f={f} at={384} until={430} top={1540} size={58} red>¡AL OTRO LADO DEL MUNDO!</Chip>
      <Chip f={f} at={432} until={520} top={1430} size={62}>EN LA NOTARÍA</Chip>
      <Chip f={f} at={440} until={520} top={1540} size={56} red>TRANSFERENCIA YA HECHA ✓</Chip>
      <Chip f={f} at={522} until={610} top={250} size={86}>SUZUKI CIAZ</Chip>
      <Stamp f={f} at={534} until={610} top={1350} txt="COMPRADO ✓" />
      <Chip f={f} at={546} until={610} top={1560} size={54}>YA ARRIBA DE LA GRÚA</Chip>

      {/* el Ciaz blanco en desarme: con sus piezas se arma el gris */}
      {f >= 610 && f < 700 && (
        <AbsoluteFill style={{background: '#000'}}>
          {[['swift/sem_ciaz_blanco.jpg', 0, -1, '50% 60%'], ['swift/sem_ciaz.jpg', 960, 1, '35% 50%']].map(([src, y, dir, org], i) => (
            <div key={i} style={{position: 'absolute', left: 0, top: y as number, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - pop(f, 612 + i * 4)) * 1080 * (dir as number)}px)`}}>
              <Img src={S(src as string)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: org as string, filter: GRADE, transform: `scale(${interpolate(f, [610, 700], [1.05, 1.14], cl)})`}} />
            </div>
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: RED, boxShadow: `0 0 24px ${RED}`}} />
        </AbsoluteFill>
      )}
      <Chip f={f} at={614} until={700} top={180} size={56} red>EN DESARME</Chip>
      <Chip f={f} at={618} until={700} top={270} size={64}>CIAZ BLANCO</Chip>
      <Chip f={f} at={622} until={700} top={1700} size={64}>CIAZ GRIS</Chip>
      <Chip f={f} at={626} until={700} top={1610} size={46} red>RECIÉN COMPRADO</Chip>
      {f >= 634 && f < 700 && (
        <div style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(f - 634, [0, 3, 8], [1.8, 0.95, 1], cl)}) rotate(-3deg)`}}>
          <span style={{display: 'inline-block', background: '#fff', color: '#0A0A0A', fontFamily: DISP, fontSize: 64, lineHeight: 1.05, padding: '10px 30px 14px', border: `6px solid ${RED}`, boxShadow: '0 18px 40px rgba(0,0,0,0.6)'}}>CON EL BLANCO <span style={{color: RED}}>ARMAMOS EL GRIS</span></span>
        </div>
      )}

      {/* cierre */}
      {f >= 694 && (
        <AbsoluteFill style={{background: `rgba(8,8,8,${interpolate(f, [694, 704], [0, 0.66], cl)})`, backdropFilter: `blur(${interpolate(f, [694, 704], [0, 16], cl)}px)`}}>
          <Img src={S('marca/anim/logo_blanco.png')} style={{position: 'absolute', left: 190, top: 300, width: 700, transform: `scale(${pop(f, 702)})`}} />
          <div style={{position: 'absolute', top: 650, left: 50, right: 50, textAlign: 'center', fontFamily: DISP, fontSize: 70, lineHeight: 1.1, color: '#fff', opacity: interpolate(f, [708, 714], [0, 1], cl)}}>¿BUSCAS REPUESTOS<br />O TIENES UN <span style={{color: RED2}}>AUTO PARADO?</span></div>
          <Img src={S('marca/pastilla-whatsapp.png')} style={{position: 'absolute', left: 170, top: 880, width: 740, transform: `scale(${pop(f, 716)})`}} />
          <Img src={S('marca/pastilla-url.png')} style={{position: 'absolute', left: 150, top: 1000, width: 780, transform: `scale(${pop(f, 722)})`}} />
          <div style={{position: 'absolute', top: 1170, left: 0, right: 0, textAlign: 'center', fontFamily: TXT, fontWeight: 800, fontSize: 36, color: '#fff', opacity: interpolate(f, [728, 734], [0, 1], cl)}}>AV. LO BLANCO 1072 · LA PINTANA</div>
        </AbsoluteFill>
      )}
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />}
    </AbsoluteFill>
  );
};
