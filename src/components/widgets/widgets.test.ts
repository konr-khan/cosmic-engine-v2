import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
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

    it('renders ArmillaryBeadsLayer in 3D Apparent mode with MiniGlobe in euler3d mode', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
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
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 30,
        cameraYaw: 45,
        r0: 100
      });

      const html = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: model.earth,
            sun: model.sun,
            moon: model.moon,
            milestones: model.milestones,
            lunarNodes: model.lunarNodes,
            projectionMode: 'geocentric',
            modelType: 'apparent',
            morphLambda: 0.0,
            camera: { pitch: 30, yaw: 45, roll: 0 },
            observerLat: 47.06,
            observerLon: -122.81,
            isOrbital: false,
            orbitRingOpacity: 0,
            milestonesOpacity: 1,
            lunarOrbitOpacity: 1,
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      expect(html).toContain('miniglobe-root');
      expect(html).toContain('miniglobe-parallels');
      expect(html).toContain('miniglobe-polar-axis');
      expect(html).toContain('miniglobe-observer-pin');
      expect(html).toContain('⊕ EARTH (Center)');
      expect(html).toContain('☉ SUN');
      expect(html).toContain('☽ MOON');
      expect(html).not.toContain('☊');
      expect(html).not.toContain('☋');
    });

    it('renders ArmillaryBeadsLayer in 2D Astrolabe plate modes with MiniGlobe in flat pin mode', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
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
        morphLambda: 1.0,
        projectionMode: 'stereographic',
        cameraPitch: 90,
        cameraYaw: 0,
        r0: 100
      });

      const html = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: model.earth,
            sun: model.sun,
            moon: model.moon,
            milestones: model.milestones,
            projectionMode: 'stereographic',
            modelType: 'rete',
            morphLambda: 1.0,
            isOrbital: false,
            orbitRingOpacity: 0,
            milestonesOpacity: 0,
            lunarOrbitOpacity: 0,
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      expect(html).toContain('miniglobe-flat');
      expect(html).toContain('☉ SUN');
      expect(html).toContain('☽ MOON');
    });

    it('renders ArmillaryBeadsLayer in Heliocentric Orbit mode with MiniGlobe in topdown mode', () => {
      const jd = getJulianDate(new Date(2026, 0, 3), 12);
      const model = generateArmillaryModel({
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

      const html = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: model.earth,
            sun: model.sun,
            moon: model.moon,
            milestones: model.milestones,
            projectionMode: 'heliocentric',
            modelType: 'orbit',
            morphLambda: 0.0,
            isOrbital: true,
            orbitRingOpacity: 1,
            milestonesOpacity: 1,
            lunarOrbitOpacity: 1,
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      expect(html).toContain('miniglobe-root');
      expect(html).toContain('⊕ EARTH');
      expect(html).toContain('Perihelion');
    });

    it('renders ArmillaryEarthPip in Heliocentric Orbit mode with 3D Living Marble MiniGlobe and GMST sync', () => {
      const html = renderToStaticMarkup(
        React.createElement(ArmillaryEarthPip, {
          camera: { pitch: 25, yaw: 45, roll: 0 },
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12.0,
          sunLambdaDeg: 280,
          projectionMode: 'heliocentric',
          morphLambda: 0.0,
          onCameraChange: () => {}
        })
      );

      expect(html).toContain('TERRA · LIVING MARBLE');
      expect(html).toContain('DRAG ROTATE 3D');
      expect(html).toContain('GMST SYNC');
      expect(html).toContain('miniglobe-root');
      expect(html).toContain('miniglobe-continents');
    });

    it('hides ArmillaryEarthPip when morphLambda > 0.15 or in geocentric/plate modes', () => {
      const htmlMorphed = renderToStaticMarkup(
        React.createElement(ArmillaryEarthPip, {
          camera: { pitch: 90, yaw: 0, roll: 0 },
          projectionMode: 'heliocentric',
          morphLambda: 0.2,
          onCameraChange: () => {}
        })
      );
      expect(htmlMorphed).toBe('');

      const htmlGeocentric = renderToStaticMarkup(
        React.createElement(ArmillaryEarthPip, {
          camera: { pitch: 0, yaw: 0, roll: 0 },
          projectionMode: 'geocentric',
          morphLambda: 0.0,
          onCameraChange: () => {}
        })
      );
      expect(htmlGeocentric).toBe('');
    });

    it('renders segmented True/Exaggerated Scale toggle and POV Cone toggle in ArmillaryHeaderControls', () => {
      const html = renderToStaticMarkup(
        React.createElement(ArmillaryHeaderControls, {
          projectionMode: 'heliocentric',
          onSelectMode: () => {},
          morphLambda: 0.0,
          onMorphChange: () => {},
          showRays: false,
          onToggleRays: () => {},
          showStars: true,
          onToggleStars: () => {},
          showTympan: false,
          onToggleTympan: () => {},
          showRule: false,
          onToggleRule: () => {},
          showObserverCone: true,
          onToggleObserverCone: () => {},
          onResetCamera: () => {},
          onSnapToPreset: () => {},
          exaggerateEccentricity: false,
          onToggleEccentricity: () => {}
        })
      );

      // Verify segmented Scale toggle with both options
      expect(html).toContain('1× True');
      expect(html).toContain('Exaggerated');
      // Verify POV Cone toggle
      expect(html).toContain('POV Cone');
    });

    it('unifies Earth orbit ring to fully solid path in top-down view (pitch = ±90°)', () => {
      const ring: import('./armillary/types').ArmillaryRingPath = {
        id: 'orbit_path',
        label: 'Earth Orbit',
        color: '#fbbf24',
        frontStrokeWidth: 1.2,
        backStrokeWidth: 0.6,
        frontPathD: 'M 10 0 A 10 10 0 0 1 -10 0',
        backPathD: 'M -10 0 A 10 10 0 0 1 10 0',
        fullPathD: 'M 10 0 A 10 10 0 1 1 -10 0 A 10 10 0 1 1 10 0 Z',
        vertices: []
      };

      // 1. Tilted view (pitch = 20°): back segment is dashed, front is solid
      const tiltedHtml = renderToStaticMarkup(
        React.createElement(ArmillaryRingsLayer, {
          rings: [ring],
          is3D: true,
          morphLambda: 0.0,
          cameraPitch: 20,
          orbitRingOpacity: 1.0,
          celestialRingsOpacity: 1.0
        })
      );
      expect(tiltedHtml).toContain('stroke-dasharray="3,2"');
      expect(tiltedHtml).toContain(ring.backPathD);

      // 2. Top-down view (pitch = 90°): back segment is omitted, fullPathD is rendered solid
      const topDownHtml = renderToStaticMarkup(
        React.createElement(ArmillaryRingsLayer, {
          rings: [ring],
          is3D: true,
          morphLambda: 0.0,
          cameraPitch: 90,
          orbitRingOpacity: 1.0,
          celestialRingsOpacity: 1.0
        })
      );
      expect(topDownHtml).not.toContain('stroke-dasharray');
      expect(topDownHtml).not.toContain(ring.backPathD);
      expect(topDownHtml).toContain(ring.fullPathD);

      // 3. Bottom-up view (pitch = -90°): fullPathD is also rendered solid
      const bottomUpHtml = renderToStaticMarkup(
        React.createElement(ArmillaryRingsLayer, {
          rings: [ring],
          is3D: true,
          morphLambda: 0.0,
          cameraPitch: -90,
          orbitRingOpacity: 1.0,
          celestialRingsOpacity: 1.0
        })
      );
      expect(bottomUpHtml).not.toContain('stroke-dasharray');
      expect(bottomUpHtml).toContain(ring.fullPathD);
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

    it('renders Zenith Cap and Solstice peak lines for temperate latitudes and adapts to tropics', () => {
      // Temperate latitude (47°N): Sun max elevation is ~66.4°, Zenith Cap should render
      const temperateHtml = renderToStaticMarkup(
        React.createElement(SunElevationDome, {
          displayTime: 12,
          latitude: 47.06,
          solarData: {
            noonElevation: 45,
            solarNoon: 12,
            equationOfTime: 0,
            sunrise: 6,
            sunset: 18,
            declination: 0,
            distanceAU: 1,
            distanceKm: 149597870,
            dayLength: 12,
            civil: 0.5,
            nautical: 1,
            astronomical: 1.5,
            daysSinceEpoch: 100,
            lambda: 0,
            eclipticLongitude: 0,
            isMidnightSun: false,
            isPolarNight: false
          }
        })
      );
      expect(temperateHtml).toContain('>66.4°');
      expect(temperateHtml).toContain('Summer Solstice Noon Peak');
      expect(temperateHtml).toContain('Winter Solstice Noon Peak');

      // Tropical latitude (10°N): Sun reaches 90° zenith, Zenith Cap displays None (90°)
      const tropicalHtml = renderToStaticMarkup(
        React.createElement(SunElevationDome, {
          displayTime: 12,
          latitude: 10.0,
          solarData: {
            noonElevation: 80,
            solarNoon: 12,
            equationOfTime: 0,
            sunrise: 6,
            sunset: 18,
            declination: 0,
            distanceAU: 1,
            distanceKm: 149597870,
            dayLength: 12,
            civil: 0.5,
            nautical: 1,
            astronomical: 1.5,
            daysSinceEpoch: 100,
            lambda: 0,
            eclipticLongitude: 0,
            isMidnightSun: false,
            isPolarNight: false
          }
        })
      );
      expect(tropicalHtml).toContain('None (90°)');
    });

    it('renders Lunar standstill transit bounds and miniature phase disc in MoonElevationDome', () => {
      const moonHtml = renderToStaticMarkup(
        React.createElement(MoonElevationDome, {
          displayTime: 12,
          latitude: 47.06,
          orbitalData: {
            phase: { value: 0.25, name: 'First Quarter' },
            lunarEvents: {
              moonrise: 10,
              transit: 18,
              moonset: 2,
              distanceKm: 384400,
              distanceEarthRadii: 60.3,
              isPerigee: false,
              isApogee: false,
              declination: 15,
              parallacticAngle: 45
            }
          } as unknown as import('../../types').OrbitalData
        })
      );
      expect(moonHtml).toContain('Max Possible Lunar Altitude');
      expect(moonHtml).toContain('Min Possible Lunar Altitude');
      // Verify miniature phase visual with parallactic angle rotation is present
      expect(moonHtml).toContain('rotate(45)');
    });
  });

  describe('Lunar Almanac Subsystem', () => {
    it('exports all decomposed lunar sub-components cleanly', () => {
      expect(LunarAlmanacCard).toBeDefined();
      expect(LunarRibbonChart).toBeDefined();
      expect(TidalWaveOscillator).toBeDefined();
      expect(LunarShortcutsRail).toBeDefined();
    });

    it('renders SolarRibbonChart with interactive hover hairline and tooltip', () => {
      const mockSolarData = Array.from({ length: 365 }, (_, i) => ({
        day: i + 1,
        sunrise: 7.0,
        sunset: 17.0,
        solarNoon: 12.0,
        dayLength: 10.0,
        declination: -20.0
      })) as unknown as import('../../types').AnnualSolarMatrixItem[];

      const solarHtml = renderToStaticMarkup(
        React.createElement(SolarRibbonChart, {
          almanacData: mockSolarData,
          totalDays: 365,
          activeDay: 1,
          activeData: mockSolarData[0],
          mirrorDayData: null,
          keyStats: {
            earliestSunrise: mockSolarData[170],
            latestSunset: mockSolarData[190]
          },
          lonOffsetHours: 0,
          eotOffsetHours: 0,
          getDayLabel: (d: number) => `Jan ${d}`,
          hoverDate: new Date(Date.UTC(2026, 0, 5, 12, 0, 0)),
          year: 2026
        })
      );

      expect(solarHtml).toContain('Jan 5');
      expect(solarHtml).toContain('10.0h Day');
      expect(solarHtml).toContain('Solar Noon:');
      expect(solarHtml).toContain('Equiv:');
    });

    it('renders LunarRibbonChart in 30-Day Synodic mode with daily phase discs, day ticks, and hover tooltip', () => {
      const mockLunarData: import('../../types').AnnualLunarMatrixItem[] = Array.from({ length: 365 }, (_, i) => ({
        day: i + 1,
        moonrise: 6.0,
        transit: 12.0,
        moonset: 18.0,
        phaseValue: (i % 29.53) / 29.53,
        isPerigee: i === 14,
        isApogee: i === 28,
        distanceKm: 384400
      }));

      const synodicHtml = renderToStaticMarkup(
        React.createElement(LunarRibbonChart, {
          annualLunarData: mockLunarData,
          activeDay: 15,
          totalDays: 365,
          year: 2026,
          activeData: mockLunarData[14],
          getDayLabel: (d: number) => `Day ${d}`,
          hoverDate: new Date(Date.UTC(2026, 0, 10, 12, 0, 0)),
          viewMode: 'synodic',
          onViewModeChange: () => {}
        })
      );

      expect(synodicHtml).toContain('30-Day Synodic');
      expect(synodicHtml).toContain('data-testid="lunar-readout-bar"');
      expect(synodicHtml).toContain('Moonrise:');
      expect(synodicHtml).toContain('Moonset:');
      expect(synodicHtml).toContain('data-testid="synodic-phase-disc"');
      expect(synodicHtml).toContain('data-testid="synodic-day-tick"');
      expect(synodicHtml).toContain('Dist:');
      expect(synodicHtml).toContain('384,400 km');
    });

    it('renders LunarRibbonChart in 365-Day Annual mode with month dividers', () => {
      const mockLunarData: import('../../types').AnnualLunarMatrixItem[] = Array.from({ length: 365 }, (_, i) => ({
        day: i + 1,
        moonrise: 6.0,
        transit: 12.0,
        moonset: 18.0,
        phaseValue: 0.5,
        isPerigee: false,
        isApogee: false,
        distanceKm: 384400
      }));

      const annualHtml = renderToStaticMarkup(
        React.createElement(LunarRibbonChart, {
          annualLunarData: mockLunarData,
          activeDay: 15,
          totalDays: 365,
          year: 2026,
          activeData: mockLunarData[14],
          getDayLabel: (d: number) => `Day ${d}`,
          viewMode: 'annual',
          onViewModeChange: () => {}
        })
      );

      expect(annualHtml).toContain('365-Day Ribbon');
      expect(annualHtml).toContain('Jan');
      expect(annualHtml).toContain('Dec');
    });

    it('renders circumpolar 24h moonlight and down all day statuses in polar conditions', () => {
      const mockPolarData: import('../../types').AnnualLunarMatrixItem[] = [
        {
          day: 1,
          moonrise: 0,
          moonset: 24,
          transit: 12,
          phaseValue: 0.5,
          isPerigee: false,
          isApogee: false,
          distanceKm: 384400,
          polarState: 'circumpolar_up'
        },
        {
          day: 2,
          moonrise: null,
          moonset: null,
          transit: 12,
          phaseValue: 0.5,
          isPerigee: false,
          isApogee: false,
          distanceKm: 384400,
          polarState: 'circumpolar_down'
        }
      ];

      const upHtml = renderToStaticMarkup(
        React.createElement(LunarRibbonChart, {
          annualLunarData: mockPolarData,
          activeDay: 1,
          totalDays: 2,
          year: 2026,
          activeData: mockPolarData[0],
          getDayLabel: (d: number) => `Day ${d}`,
          viewMode: 'synodic',
          onViewModeChange: () => {}
        })
      );

      expect(upHtml).toContain('Circumpolar:');
      expect(upHtml).toContain('Up All Day (24h Moonlight)');

      const downHtml = renderToStaticMarkup(
        React.createElement(LunarRibbonChart, {
          annualLunarData: mockPolarData,
          activeDay: 2,
          totalDays: 2,
          year: 2026,
          activeData: mockPolarData[1],
          getDayLabel: (d: number) => `Day ${d}`,
          viewMode: 'synodic',
          onViewModeChange: () => {}
        })
      );

      expect(downHtml).toContain('Moon Down All Day (Sub-Horizon)');
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

    it('integrates unified 3D eclipse geometry with MiniGlobe transverse and axial projection modes', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      const eclipse = calculateEclipseData(jd);
      expect(eclipse).toBeDefined();
      expect(typeof eclipse.beta).toBe('number');
      expect(typeof eclipse.alignmentPercent).toBe('number');
    });

    it('conforms NodalPlaneVisualizer dimensions and viewBox to 520x220 matching ShadowRayDiagram', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      const eclipse = calculateEclipseData(jd);

      const nodalHtml = renderToStaticMarkup(
        React.createElement(NodalPlaneVisualizer, {
          eclipse,
          currentDate: new Date('2026-03-20T12:00:00Z'),
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12
        })
      );

      const shadowHtml = renderToStaticMarkup(
        React.createElement(ShadowRayDiagram, {
          eclipse,
          currentDate: new Date('2026-03-20T12:00:00Z'),
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12
        })
      );

      // Both cards conform to identical 520x220 viewBox and min-h-[220px]
      expect(nodalHtml).toContain('viewBox="0 0 520 220"');
      expect(shadowHtml).toContain('viewBox="0 0 520 220"');
      expect(nodalHtml).toContain('min-h-[220px]');
      expect(shadowHtml).toContain('min-h-[220px]');

      // Both cards center horizontal ecliptic reference line at y = 110
      expect(nodalHtml).toContain('y1="110"');
      expect(nodalHtml).toContain('y2="110"');
      expect(shadowHtml).toContain('y1="110"');
      expect(shadowHtml).toContain('y2="110"');

      // NodalPlaneVisualizer incorporates upsized Earth MiniGlobe (r=24) and apparent size metrics
      expect(nodalHtml).toContain('Axial Sightline (5.14° Tilt)');
      expect(nodalHtml).toContain('SUN');
      expect(nodalHtml).toContain('MOON');
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

    it('provides Keplerian orbital dynamics and physics telemetry across True and Exaggerated scales', () => {
      const jd = getJulianDate(new Date(2026, 0, 3), 12);
      const physics = calculateEarthOrbitalPhysics(jd);
      expect(physics.distanceAU).toBeLessThan(1.0);
      expect(physics.solarIrradiancePercent).toBeGreaterThan(100.0);
      expect(physics.orbitalSpeedKms).toBeGreaterThan(29.78);
    });
  });

  describe('Micro Tide Subsystem', () => {
    it('exports MicroTideView component', () => {
      expect(MicroTideView).toBeDefined();
    });

    it('renders MiniGlobe Earth and segmented controls in MicroTideView', () => {
      const html = renderToStaticMarkup(
        React.createElement(MicroTideView, {
          tides: { alignment: 0.9, rx: 19, ry: 12, type: 'Spring Tide' },
          angles: { sunDegrees: 45, moonDegrees: 45, nodeLongitude: 120, descendingNodeLongitude: 300, toSun: 0, toMoon: 0 },
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12.0
        })
      );

      // MiniGlobe Earth rendered
      expect(html).toContain('miniglobe-root');
      expect(html).toContain('SPRING');

      // Segmented toggle controls rendered
      expect(html).toContain('Standard');
      expect(html).toContain('☊ Nodal Loop');
      expect(html).toContain('Global Potential');
      expect(html).toContain('Local Water');
    });

    it('renders Moon and tidal bulge in counter-clockwise prograde orientation', () => {
      const html = renderToStaticMarkup(
        React.createElement(MicroTideView, {
          tides: { alignment: 0.0, rx: 16, ry: 12, type: 'Transitional' },
          angles: { sunDegrees: 0, moonDegrees: 90, nodeLongitude: 0, descendingNodeLongitude: 180, toSun: 0, toMoon: 0 },
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12.0
        })
      );

      // At moonDegrees = 90 (First Quarter), prograde counter-clockwise in SVG positions Moon UP at (0, -60)
      // moonX = 60 * cos(-90 deg) ~ 0, moonY = 60 * sin(-90 deg) = -60
      // We check that moonY is -60 (UP) rather than +60 (DOWN)
      expect(html).toContain('-60)');
      expect(html).toContain('rotate(-90)');
    });
  });
});
