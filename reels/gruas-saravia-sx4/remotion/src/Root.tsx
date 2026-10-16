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
import {CuatroAutos, CUATRO_TOTAL, UnDiaClientes} from './swift/CuatroAutos';
import {UnDiaVoz, UNDIA_ATENCION_TOTAL, UNDIA_VOZ_TOTAL} from './swift/UnDiaVoz';
import {SX4Compra, SX4_TOTAL} from './swift/SX4Compra';
import {DosAutos, DOS_TOTAL} from './swift/DosAutos';
import {DosAutos2, DOS2_TOTAL} from './swift/DosAutos2';
import {Portada} from './swift/Portada';
import {MisDias, MISDIAS_TOTAL} from './swift/MisDias';
import {MisDiasVoz, MISDIAS_VOZ_TOTAL} from './swift/MisDiasVoz';
import {Santorini, SANTORINI_TOTAL} from './santorini/Santorini';
import {Cerro, CERRO_TOTAL} from './personal/Cerro';
import {Cosomovil, COSO_TOTAL, CosomovilOrg, COSO_ORG_TOTAL, CosomovilPOV, COSO_POV_TOTAL} from './swift/Cosomovil';
import {LogoCine, LOGOCINE_TOTAL} from './swift/LogoCine';
import {MalDia, MALDIA_TOTAL} from './personal/MalDia';
import {FeriadoV4, FERIADO_V4_TOTAL} from './swift/FeriadoV4';
import {Feriado, FERIADO_TOTAL, FeriadoOrganico, FERIADO_ORG_TOTAL} from './swift/Feriado';
import {SemanaVentas, SEMANA2_TOTAL} from './swift/Semana';
import {MotorFunc, MOTOR_TOTAL} from './swift/MotorFunc';
import {Organico, ORGANICO_TOTAL} from './swift/Organico';
import {DosAutosVoz, DOS_VOZ_TOTAL} from './swift/DosAutosVoz';
import {DosAutosFinal, DOS_FINAL_TOTAL} from './swift/DosAutosFinal';
import {SuzukiConfianza, SUZUKI_CONF_TOTAL} from './swift/SuzukiConfianza';

export const Root: React.FC = () => (
  <>
    <Composition id="SuzukiConfianza" component={SuzukiConfianza} durationInFrames={SUZUKI_CONF_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
    <Still id="PortadaA" component={Portada} defaultProps={{v: "A" as const}} width={W} height={H} />
    <Still id="PortadaB" component={Portada} defaultProps={{v: "B" as const}} width={W} height={H} />
    <Composition id="MotorFunc" component={MotorFunc} durationInFrames={MOTOR_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="FeriadoOrganico" component={FeriadoOrganico} durationInFrames={FERIADO_ORG_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Feriado" component={Feriado} durationInFrames={FERIADO_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="FeriadoV4" component={FeriadoV4} durationInFrames={FERIADO_V4_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MalDia" component={MalDia} durationInFrames={MALDIA_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="LogoCine" component={LogoCine} durationInFrames={LOGOCINE_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Cosomovil" component={Cosomovil} durationInFrames={COSO_TOTAL} fps={FPS} width={W} height={H} defaultProps={{literal: false}} />
    <Composition id="CosomovilLiteral" component={Cosomovil} durationInFrames={COSO_TOTAL} fps={FPS} width={W} height={H} defaultProps={{literal: true}} />
    <Composition id="CosomovilOrg" component={CosomovilOrg} durationInFrames={COSO_ORG_TOTAL} fps={FPS} width={W} height={H} defaultProps={{literal: false}} />
    <Composition id="CosomovilOrgLiteral" component={CosomovilOrg} durationInFrames={COSO_ORG_TOTAL} fps={FPS} width={W} height={H} defaultProps={{literal: true}} />
    <Composition id="CosomovilPOV" component={CosomovilPOV} durationInFrames={COSO_POV_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Cerro" component={Cerro} durationInFrames={CERRO_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Santorini" component={Santorini} durationInFrames={SANTORINI_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MisDiasVoz" component={MisDiasVoz} durationInFrames={MISDIAS_VOZ_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="MisDias" component={MisDias} durationInFrames={MISDIAS_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="SemanaVentas" component={SemanaVentas} durationInFrames={SEMANA2_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="Organico" component={Organico} durationInFrames={ORGANICO_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="DosAutosFinal" component={DosAutosFinal} durationInFrames={DOS_FINAL_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="DosAutosVoz" component={DosAutosVoz} durationInFrames={DOS_VOZ_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="DosAutos2A" component={DosAutos2} defaultProps={{hook: "mensaje" as const}} durationInFrames={DOS2_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="DosAutos2B" component={DosAutos2} defaultProps={{hook: "foco" as const}} durationInFrames={DOS2_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="DosAutos" component={DosAutos} durationInFrames={DOS_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="SX4Compra" component={SX4Compra} durationInFrames={SX4_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="UnDiaVoz" component={UnDiaVoz} durationInFrames={UNDIA_VOZ_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="UnDiaAtencion" component={UnDiaVoz} defaultProps={{atencion: true}} durationInFrames={UNDIA_ATENCION_TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="UnDiaClientes" component={UnDiaClientes} durationInFrames={CUATRO_TOTAL} fps={FPS} width={W} height={H} defaultProps={{vo: undefined as string | undefined}} />
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
