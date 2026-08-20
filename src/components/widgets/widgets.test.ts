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
  SolarFocusView,
  LunarSurfacePovView,
  SelenocentricOrbitView,
  NodalPlaneVisualizer, 
  SkyViewSimulator, 
  EclipseScanner,
  TerminatorMap,
  MacroOrbitView,
  MicroTideView
} from './index';
import { calculateSolarPosition, calculateEarthOrbitalPhysics, getJulianDate, calculateEclipseData } from '../../utils/cosmicMath';

describe('Observatory 7-Widget Architecture & Integration Tests', () => {
  
  describe('Central Barrel Exports', () => {
    it('exports all 7 primary dashboard window visualizers', () => {
      expect(TodayHorizonView).toBeDefined();
      expect(SolarAlmanac).toBeDefined();
      expect(LunarAlmanacCard).toBeDefined();
      expect(EclipseDemonstrator).toBeDefined();
      expect(TerminatorMap).toBeDefined();
      expect(MacroOrbitView).toBeDefined();
      expect(MicroTideView).toBeDefined();
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
      expect(SolarFocusView).toBeDefined();
      expect(LunarSurfacePovView).toBeDefined();
      expect(SelenocentricOrbitView).toBeDefined();
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
    it('exports MacroOrbitView component', () => {
      expect(MacroOrbitView).toBeDefined();
    });
  });

  describe('Micro Tide Subsystem', () => {
    it('exports MicroTideView component', () => {
      expect(MicroTideView).toBeDefined();
    });
  });
});
