import { describe, it, expect } from 'vitest';
import { 
  TodayHorizonView, 
  SunElevationDome, 
  MoonElevationDome,
  SolarAlmanac, 
  SolarShortcutsRail, 
  PolarSunlightDial, 
  SolarRibbonChart,
  LunarAlmanacCard, 
  LunarRibbonChart, 
  TidalWaveOscillator, 
  LunarShortcutsRail,
  EclipseDemonstrator, 
  EclipseStatusBadge, 
  ShadowRayDiagram, 
  ShadowRayHoverHud,
  LiveSyzygyView,
  LunarSurfacePovView,
  NodalPlaneVisualizer, 
  SkyViewSimulator, 
  EclipseScanner,
  TerminatorMap,
  MacroOrbitView,
  OrbitHeaderControls,
  OrbitHoverHud,
  OrbitSvgCanvas,
  OrbitPhysicsHud,
  MILESTONES,
  EARTH_MILESTONES,
  MicroTideView,
  GyroArmillaryView,
  ArmillaryHeaderControls,
  ArmillarySvgCanvas,
  ArmillaryHoverHud,
  ArmillaryTelemetryHud,
  ArmillaryDefs,
  ArmillaryBezelLayer,
  ArmillaryTympanLayer,
  ArmillaryLaserLayer,
  ArmillaryObserverConeLayer,
  ArmillaryRingsLayer,
  ArmillaryStarsLayer,
  ArmillaryBeadsLayer,
  ArmillaryAlidadeLayer,
  ArmillaryEarthPip
} from './index';

describe('Observatory Central Barrel Re-Exports', () => {
  it('exports all 8 primary dashboard window visualizers', () => {
    expect(TodayHorizonView).toBeDefined();
    expect(SolarAlmanac).toBeDefined();
    expect(LunarAlmanacCard).toBeDefined();
    expect(EclipseDemonstrator).toBeDefined();
    expect(TerminatorMap).toBeDefined();
    expect(MacroOrbitView).toBeDefined();
    expect(MicroTideView).toBeDefined();
    expect(GyroArmillaryView).toBeDefined();
  });

  it('exports all decomposed child components and layers across widget subsystems', () => {
    // Today
    expect(SunElevationDome).toBeDefined();
    expect(MoonElevationDome).toBeDefined();

    // Solar
    expect(SolarShortcutsRail).toBeDefined();
    expect(PolarSunlightDial).toBeDefined();
    expect(SolarRibbonChart).toBeDefined();

    // Lunar
    expect(LunarRibbonChart).toBeDefined();
    expect(TidalWaveOscillator).toBeDefined();
    expect(LunarShortcutsRail).toBeDefined();

    // Eclipse
    expect(EclipseStatusBadge).toBeDefined();
    expect(ShadowRayDiagram).toBeDefined();
    expect(ShadowRayHoverHud).toBeDefined();
    expect(LiveSyzygyView).toBeDefined();
    expect(LunarSurfacePovView).toBeDefined();
    expect(NodalPlaneVisualizer).toBeDefined();
    expect(SkyViewSimulator).toBeDefined();
    expect(EclipseScanner).toBeDefined();

    // Macro Orbit
    expect(OrbitHeaderControls).toBeDefined();
    expect(OrbitHoverHud).toBeDefined();
    expect(OrbitSvgCanvas).toBeDefined();
    expect(OrbitPhysicsHud).toBeDefined();
    expect(MILESTONES).toBeDefined();
    expect(EARTH_MILESTONES).toBeDefined();

    // Armillary
    expect(ArmillaryHeaderControls).toBeDefined();
    expect(ArmillarySvgCanvas).toBeDefined();
    expect(ArmillaryHoverHud).toBeDefined();
    expect(ArmillaryTelemetryHud).toBeDefined();
    expect(ArmillaryDefs).toBeDefined();
    expect(ArmillaryBezelLayer).toBeDefined();
    expect(ArmillaryTympanLayer).toBeDefined();
    expect(ArmillaryLaserLayer).toBeDefined();
    expect(ArmillaryObserverConeLayer).toBeDefined();
    expect(ArmillaryRingsLayer).toBeDefined();
    expect(ArmillaryStarsLayer).toBeDefined();
    expect(ArmillaryBeadsLayer).toBeDefined();
    expect(ArmillaryAlidadeLayer).toBeDefined();
    expect(ArmillaryEarthPip).toBeDefined();
  });
});
