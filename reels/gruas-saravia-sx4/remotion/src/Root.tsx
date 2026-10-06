import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS, H, W} from './theme';
import {TOTAL} from './timeline';
import {ReelSX4, reelDefaults} from './compositions/ReelSX4';
import {CTAEndCard, Cover, MapSegment, SALVIOverlay} from './compositions/Standalone';
import {ReelV2, V2_TOTAL, v2Defaults} from './v2/ReelV2';
import {CoverV2} from './v2/CoverV2';
import {ReelV4, V4_TOTAL, v4Defaults} from './v2/ReelV4';
import {CompraSX4, C_TOTAL} from './compra/CompraSX4';
import {AtlasSX4, A_TOTAL} from './atlas/AtlasSX4';
import {WalkSX4, W_TOTAL} from './walk/WalkSX4';
import {WalkV15, W15_TOTAL} from './walk/WalkV15';
import {MotorSwift, SWIFT_TOTAL} from './swift/MotorSwift';
import {MotorSwiftUGC, SWIFT_UGC_TOTAL} from './swift/MotorSwiftUGC';
import {SuzukiLeads, SUZUKI_LEADS_TOTAL} from './swift/SuzukiLeads';
import {MotorCompra, COMPRA_TOTAL} from './swift/MotorCompra';
import {NeonMotores, NEON_TOTAL} from './swift/NeonMotores';
import {SemanaDesarme, SEMANA_TOTAL, Carrusel} from './swift/SemanaDesarme';
import {VendimosTodo, VENDIMOS_TOTAL} from './swift/VendimosTodo';
import {StoryVentas, STORY_TOTAL} from './swift/StoryVentas';
import {CuatroAutos, CUATRO_TOTAL} from './swift/CuatroAutos';
import {SuzukiConfianza, SUZUKI_CONF_TOTAL} from './swift/SuzukiConfianza';

export const Root: React.FC = () => (
  <>
    <Composition id="SuzukiConfianza" component={SuzukiConfianza} durationInFrames={SUZUKI_CONF_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
    <Composition id="CuatroAutos" component={CuatroAutos} durationInFrames={CUATRO_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
    <Composition id="StoryVentas" component={StoryVentas} durationInFrames={STORY_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
    <Composition id="VendimosTodo" component={VendimosTodo} durationInFrames={VENDIMOS_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
    <Composition id="SemanaDesarme" component={SemanaDesarme} durationInFrames={SEMANA_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Carrusel" component={Carrusel} durationInFrames={1} fps={FPS} width={1080} height={1350} defaultProps={{i: 0}} />
    <Composition id="NeonMotores" component={NeonMotores} durationInFrames={NEON_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MotorCompra" component={MotorCompra} durationInFrames={COMPRA_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="SuzukiLeads" component={SuzukiLeads} durationInFrames={SUZUKI_LEADS_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MotorSwiftUGC" component={MotorSwiftUGC} durationInFrames={SWIFT_UGC_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MotorSwift" component={MotorSwift} durationInFrames={SWIFT_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="WalkV15" component={WalkV15} durationInFrames={W15_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="WalkSX4" component={WalkSX4} durationInFrames={W_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="WalkSX4SinMusica" component={WalkSX4} durationInFrames={W_TOTAL} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="AtlasSX4" component={AtlasSX4} durationInFrames={A_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="AtlasSX4SinMusica" component={AtlasSX4} durationInFrames={A_TOTAL} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="CompraSX4" component={CompraSX4} durationInFrames={C_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="CompraSX4SinMusica" component={CompraSX4} durationInFrames={C_TOTAL} fps={FPS} width={W} height={H} defaultProps={{music: false}} />
    <Composition id="ReelV4" component={ReelV4} durationInFrames={V4_TOTAL} fps={FPS} width={W} height={H} defaultProps={v4Defaults} />
    <Composition id="ReelV2" component={ReelV2} durationInFrames={V2_TOTAL} fps={FPS} width={W} height={H} defaultProps={v2Defaults} />
    <Still id="CoverV2" component={CoverV2} width={W} height={H} />
    <Composition id="ReelSX4" component={ReelSX4} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={reelDefaults} />
    <Composition id="MapSegment" component={MapSegment} durationInFrames={90} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="SALVIOverlay" component={SALVIOverlay} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="CTAEndCard" component={CTAEndCard} durationInFrames={90} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
