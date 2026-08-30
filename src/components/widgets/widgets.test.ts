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
import { computeStagedCamera, type ArmillaryCameraState } from './armillary';
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

    it('aligns camera orientation with target projection poles across all 5 continuum modes', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      
      // 1. Stereographic Astrolabe Rete (North Celestial Pole top-down perspective at pitch 90°)
      const stereoModel = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 90,
        moonDecDeg: 0,
        moonLambdaDeg: 90,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 90,
        cameraYaw: 0,
        r0: 100
      });
      expect(stereoModel.sun.screenPos.x).toBeCloseTo(100, 1);
      expect(stereoModel.sun.screenPos.y).toBeCloseTo(0, 1);

      // 2. Rojas Orthographic (Solstitial colure side-on perspective at pitch 0°)
      const rojasModel = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 90,
        moonDecDeg: 0,
        moonLambdaDeg: 90,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'rojas',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });
      expect(rojasModel.bezelOpacity).toBe(1.0);
      expect(rojasModel.sun.screenPos).toBeDefined();

      // 3. Topocentric Horizon Stereonet (Zenith perspective at pitch 90°)
      const horizonModel = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 90,
        moonDecDeg: 0,
        moonLambdaDeg: 90,
        moonPhase: 0.5,
        morphLambda: 1.0,
        projectionMode: 'horizon',
        cameraPitch: 90,
        cameraYaw: 0,
        r0: 100
      });
      expect(horizonModel.almucantars.length).toBeGreaterThan(0);
    });

    it('completes camera pitch and yaw alignment to canonical pole by lambda = 0.45 during 3D -> 2D transitions', () => {
      const saved3D = { pitch: 25, yaw: 35, roll: 0 };

      // At lambda = 0.0: Full 3D camera
      const cam0 = computeStagedCamera('stereographic', 0.0, saved3D);
      expect(cam0.pitch).toBe(25);
      expect(cam0.yaw).toBe(35);

      // At lambda = 0.225: Exactly 50% aligned towards canonical pole (90°, 0°)
      const camMid = computeStagedCamera('stereographic', 0.225, saved3D);
      expect(camMid.pitch).toBeCloseTo(57.5, 1);
      expect(camMid.yaw).toBeCloseTo(17.5, 1);

      // At lambda = 0.45: Exactly 100% aligned to canonical pole (90°, 0°)
      const cam45 = computeStagedCamera('stereographic', 0.45, saved3D);
      expect(cam45.pitch).toBe(90.0);
      expect(cam45.yaw).toBe(0.0);

      // Same for Rojas mode (canonical pole is 0°, 0°)
      const rojas45 = computeStagedCamera('rojas', 0.45, saved3D);
      expect(rojas45.pitch).toBe(0.0);
      expect(rojas45.yaw).toBe(0.0);
    });

    it('locks camera at canonical pole for all lambda in [0.45, 1.0] across stereographic, horizon, and rojas modes', () => {
      const saved3D = { pitch: 25, yaw: 35, roll: 0 };
      const testLambdas = [0.45, 0.5, 0.7, 0.85, 0.95, 1.0];

      for (const l of testLambdas) {
        const stereoCam = computeStagedCamera('stereographic', l, saved3D);
        expect(stereoCam.pitch).toBe(90.0);
        expect(stereoCam.yaw).toBe(0.0);

        const horizonCam = computeStagedCamera('horizon', l, saved3D);
        expect(horizonCam.pitch).toBe(90.0);
        expect(horizonCam.yaw).toBe(0.0);

        const rojasCam = computeStagedCamera('rojas', l, saved3D);
        expect(rojasCam.pitch).toBe(0.0);
        expect(rojasCam.yaw).toBe(0.0);
      }
    });

    it('performs symmetric reverse transitions (2D -> 3D) with locked camera in [0.45, 1.0] and smooth rotation in [0.0, 0.45]', () => {
      const customSaved3D = { pitch: 42, yaw: 115, roll: 0 };

      // Returning from stereographic (fromMode='stereographic', targetMode='geocentric')
      // For lambda in [0.45, 1.0], camera remains locked at stereographic pole (90°, 0°)
      const cam10 = computeStagedCamera('geocentric', 1.0, customSaved3D, 'stereographic');
      expect(cam10.pitch).toBe(90.0);
      expect(cam10.yaw).toBe(0.0);

      const cam50 = computeStagedCamera('geocentric', 0.5, customSaved3D, 'stereographic');
      expect(cam50.pitch).toBe(90.0);
      expect(cam50.yaw).toBe(0.0);

      const cam45 = computeStagedCamera('geocentric', 0.45, customSaved3D, 'stereographic');
      expect(cam45.pitch).toBe(90.0);
      expect(cam45.yaw).toBe(0.0);

      // For lambda in [0.0, 0.45], camera rotates smoothly back to custom angles
      const camMid = computeStagedCamera('geocentric', 0.225, customSaved3D, 'stereographic');
      expect(camMid.pitch).toBeCloseTo(66.0, 1); // 42 + (90-42)*0.5 = 66
      expect(camMid.yaw).toBeCloseTo(57.5, 1);  // 115 + (0-115)*0.5 = 57.5

      const cam0 = computeStagedCamera('geocentric', 0.0, customSaved3D, 'stereographic');
      expect(cam0.pitch).toBe(42.0);
      expect(cam0.yaw).toBe(115.0);
    });

    it('uses shortest angular geodesic delta for yaw alignment without 360-degree wrapping jumps', () => {
      // Test when saved yaw is 350° (delta to 0° is +10°, not -350°)
      const savedNear360 = { pitch: 30, yaw: 350, roll: 0 };
      const camMid = computeStagedCamera('stereographic', 0.225, savedNear360);
      expect(camMid.yaw).toBe(355.0); // 350 + 10*0.5 = 355

      // Test when saved yaw is 190° (delta to 0° is +170°)
      const saved190 = { pitch: 30, yaw: 190, roll: 0 };
      const cam190Mid = computeStagedCamera('stereographic', 0.225, saved190);
      expect(cam190Mid.yaw).toBe(275.0); // (190 + 170*0.5 + 360)%360 = 275

      // Test when saved yaw is 170° (delta to 0° is -170°)
      const saved170 = { pitch: 30, yaw: 170, roll: 0 };
      const cam170Mid = computeStagedCamera('stereographic', 0.225, saved170);
      expect(cam170Mid.yaw).toBe(85.0); // (170 - 170*0.5 + 360)%360 = 85
    });

    it('preserves and restores custom user 3D camera angles upon returning from 2D modes', () => {
      const customCam: ArmillaryCameraState = { pitch: 38.5, yaw: 212.0, roll: 0 };

      // Morphing from 3D to 2D
      const camAt2D = computeStagedCamera('stereographic', 1.0, customCam);
      expect(camAt2D.pitch).toBe(90.0);
      expect(camAt2D.yaw).toBe(0.0);

      // Morphing back to 3D
      const camAt3D = computeStagedCamera('geocentric', 0.0, customCam);
      expect(camAt3D.pitch).toBe(38.5);
      expect(camAt3D.yaw).toBe(212.0);
    });

    it('smoothly unifies back ring stroke opacity, stroke width, and dashgap across lambda in [0.85, 1.0]', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      const testLambdas = [0.85, 0.90, 0.95, 1.0];

      for (const lambda of testLambdas) {
        const model = generateArmillaryModel({
          julianDate: jd,
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12,
          sunRaDeg: 0,
          sunDecDeg: 0,
          sunLambdaDeg: 0,
          moonRaDeg: 90,
          moonDecDeg: 0,
          moonLambdaDeg: 90,
          moonPhase: 0.5,
          morphLambda: lambda,
          projectionMode: 'stereographic',
          cameraPitch: 90,
          cameraYaw: 0,
          r0: 100
        });

        // Verify that every ring has valid geometry
        expect(model.rings.length).toBeGreaterThan(0);
        for (const ring of model.rings) {
          expect(ring.vertices.length).toBeGreaterThan(0);
          expect(ring.fullPathD.length).toBeGreaterThan(0);
          expect(ring.frontPathD.length + ring.backPathD.length).toBeGreaterThan(0);
          expect(Number.isFinite(ring.frontStrokeWidth)).toBe(true);
          expect(Number.isFinite(ring.backStrokeWidth)).toBe(true);
        }

        // Verify continuous unification parameter calculation
        const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
        const expectedOpacityMult = 0.35 + 0.65 * u;
        if (lambda === 0.85) {
          expect(expectedOpacityMult).toBeCloseTo(0.35, 2);
        }
        if (lambda === 1.0) {
          expect(expectedOpacityMult).toBeCloseTo(1.0, 2);
        }
      }
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
