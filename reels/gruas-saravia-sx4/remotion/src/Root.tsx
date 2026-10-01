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

export const Root: React.FC = () => (
  <>
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
