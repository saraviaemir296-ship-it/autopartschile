import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS, H, W} from './theme';
import {TOTAL} from './timeline';
import {ReelSX4, reelDefaults} from './compositions/ReelSX4';
import {CTAEndCard, Cover, MapSegment, SALVIOverlay} from './compositions/Standalone';

export const Root: React.FC = () => (
  <>
    <Composition id="ReelSX4" component={ReelSX4} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={reelDefaults} />
    <Composition id="MapSegment" component={MapSegment} durationInFrames={90} fps={FPS} width={W} height={H} defaultProps={{}} />
    <Composition id="SALVIOverlay" component={SALVIOverlay} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="CTAEndCard" component={CTAEndCard} durationInFrames={90} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
