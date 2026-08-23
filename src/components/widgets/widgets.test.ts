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
  ArmillaryAlidadeLayer
} from './index';
import { calculateSolarPosition, calculateEarthOrbitalPhysics, getJulianDate, calculateEclipseData, generateArmillaryModel } from '../../utils/cosmicMath';

describe('Observatory 8-Widget Architecture & Integration Tests', () => {
  
  describe('Central Barrel Exports', () => {
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
  });

  describe('Gyro-Morph Armillary Subsystem', () => {
    it('exports all decomposed armillary sub-components cleanly', () => {
      expect(GyroArmillaryView).toBeDefined();
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
    });

    it('generates multi-model geometry with Keplerian orbital physics and 6 milestones', () => {
      const jd = getJulianDate(new Date(2026, 0, 3), 12);
      const helioModel = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 280,
        sunDecDeg: -23,
        sunLambdaDeg: 280,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      expect(helioModel.milestones.length).toBe(6);
      expect(helioModel.physics).toBeDefined();
      expect(helioModel.physics?.distanceAU).toBeCloseTo(0.983, 2);
      expect(helioModel.orbitRingOpacity).toBe(1.0);
      expect(helioModel.celestialRingsOpacity).toBe(0.0);
    });
  });

  describe('Solar Almanac Subsystem', () => {
    it('exports all decomposed solar sub-components cleanly', () => {
      expect(SolarAlmanac).toBeDefined();
      expect(SolarShortcutsRail).toBeDefined();
      expect(PolarSunlightDial).toBeDefined();
      expect(SolarRibbonChart).toBeDefined();
    });

    it('computes accurate Keplerian solar metrics through calculateSolarPosition and calculateEarthOrbitalPhysics', () => {
      const jd = getJulianDate(new Date(2026, 0, 3), 12); // Near Perihelion
      const solar = calculateSolarPosition(jd);
      const physics = calculateEarthOrbitalPhysics(jd);

      expect(solar.distanceAU).toBeCloseTo(physics.distanceAU, 4);
      expect(solar.distanceAU).toBeLessThan(0.99); // Perihelion < 0.99 AU
      expect(solar.isPerihelion).toBe(true);
      expect(solar.sunAngularDiameterArcmin).toBeGreaterThan(32.0);
      expect(solar.orbitalSpeedKms).toBeGreaterThan(30.0);
    });
  });

  describe('Today Horizon Subsystem', () => {
    it('exports all decomposed today sub-components cleanly', () => {
      expect(TodayHorizonView).toBeDefined();
      expect(SunElevationDome).toBeDefined();
      expect(MoonElevationDome).toBeDefined();
    });
  });

  describe('Lunar Almanac Subsystem', () => {
    it('exports all decomposed lunar sub-components cleanly', () => {
      expect(LunarAlmanacCard).toBeDefined();
      expect(LunarRibbonChart).toBeDefined();
      expect(TidalWaveOscillator).toBeDefined();
      expect(LunarShortcutsRail).toBeDefined();
    });
  });

  describe('Eclipse Demonstrator Subsystem', () => {
    it('exports all decomposed eclipse sub-components and sub-views cleanly', () => {
      expect(EclipseDemonstrator).toBeDefined();
      expect(EclipseStatusBadge).toBeDefined();
      expect(ShadowRayDiagram).toBeDefined();
      expect(ShadowRayHoverHud).toBeDefined();
      expect(LiveSyzygyView).toBeDefined();
      expect(LunarSurfacePovView).toBeDefined();
      expect(NodalPlaneVisualizer).toBeDefined();
      expect(SkyViewSimulator).toBeDefined();
      expect(EclipseScanner).toBeDefined();
    });

    it('computes direct eclipse syzygy data for historic Great American Eclipse (Apr 8, 2024)', () => {
      const jdApr2024 = getJulianDate(new Date(2024, 3, 8), 18.283);
      const eclipse = calculateEclipseData(jdApr2024);

      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
      expect(eclipse.obscuration).toBeGreaterThanOrEqual(95);
      expect(eclipse.type).toBe('TOTAL_SOLAR');
    });
  });

  describe('Daylight Terminator Map Subsystem', () => {
    it('exports TerminatorMap component', () => {
      expect(TerminatorMap).toBeDefined();
    });
  });

  describe('Macro Orbit Subsystem', () => {
    it('exports MacroOrbitView and all decomposed sub-components cleanly', () => {
      expect(MacroOrbitView).toBeDefined();
      expect(OrbitHeaderControls).toBeDefined();
      expect(OrbitHoverHud).toBeDefined();
      expect(OrbitSvgCanvas).toBeDefined();
      expect(OrbitPhysicsHud).toBeDefined();
      expect(MILESTONES).toBeDefined();
      expect(EARTH_MILESTONES).toBeDefined();
      expect(MILESTONES.length).toBe(6);
    });

    it('contains all 6 key orbital milestones with accurate astronomical properties', () => {
      const ids = MILESTONES.map(m => m.id);
      expect(ids).toContain('perihelion');
      expect(ids).toContain('mar_equinox');
      expect(ids).toContain('jun_solstice');
      expect(ids).toContain('aphelion');
      expect(ids).toContain('sep_equinox');
      expect(ids).toContain('dec_solstice');
    });
  });

  describe('Micro Tide Subsystem', () => {
    it('exports MicroTideView component', () => {
      expect(MicroTideView).toBeDefined();
    });
  });
});
