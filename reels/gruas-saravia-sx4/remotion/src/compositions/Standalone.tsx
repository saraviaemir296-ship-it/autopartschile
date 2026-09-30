import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {AnimatedMap} from '../components/AnimatedMap';
import {SALVIInterface} from '../components/SALVIInterface';
import {CTAFinal} from '../components/CTAFinal';
import {Clip} from '../components/Footage';
import {C, F, SAFE} from '../theme';

/** Mapa + bottom sheet SALVI, 3 s, para importar tal cual en CapCut. */
export const MapSegment: React.FC<{etaMinutes?: number}> = ({etaMinutes}) => (
  <AbsoluteFill>
    <AnimatedMap duration={90} etaMinutes={etaMinutes} sheetAt={40} />
    <Sequence from={40}>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 440}}>
        <SALVIInterface duration={50} width={900} />
      </AbsoluteFill>
    </Sequence>
  </AbsoluteFill>
);

/** Solo la tarjeta SALVI con fondo transparente (ProRes 4444) para superponer sobre video. */
export const SALVIOverlay: React.FC = () => (
  <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 440}}>
    <SALVIInterface duration={75} width={900} />
  </AbsoluteFill>
);

export const CTAEndCard: React.FC = () => <CTAFinal />;

/**
 * Portada del Reel (fotograma real de IMG_3244 + pregunta). Se exporta como PNG.
 * El texto va en el cielo y dentro del recorte 3:4 del grid de Instagram (y 240–1680).
 */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Clip src="footage/IMG_3244.mp4" segments={[{from: 1.5, take: 1, rate: 1}]} look="vivid" zoom={[1.12, 1.12]} origin="50% 38%" />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0) 55%)'}} />
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: 360, fontFamily: F.display, color: C.white}}>
      <div style={{fontWeight: 600, fontSize: 58, lineHeight: 1.05}}>Si hoy quedas botado,</div>
      <div style={{fontWeight: 800, fontSize: 96, lineHeight: 1.0, marginTop: 8}}>
        ¿a quién <span style={{color: C.red}}>llamas?</span>
      </div>
      <div style={{width: 120, height: 6, background: C.red, marginTop: 34, borderRadius: 3}} />
    </div>
  </AbsoluteFill>
);
