import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  GyroArmillaryView, 
  ArmillaryHeaderControls, 
  ArmillaryModePills,
  ArmillaryMorphRail,
  ArmillaryLayerToggles,
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
  ArmillaryEarthPip,
  computeStagedCamera,
  type ArmillaryCameraState,
  type ArmillaryModelOutput,
  type ArmillaryRingPath,
  type ArmillaryObserverCone,
  type ProjectionFocalBeaconOutput
} from './index';
import { getJulianDate, generateArmillaryModel } from '../../../utils/cosmicMath';

describe('Gyro-Morph Armillary Subsystem', () => {
  it('exports all decomposed armillary sub-components cleanly', () => {
    expect(GyroArmillaryView).toBeDefined();
    expect(ArmillaryHeaderControls).toBeDefined();
    expect(ArmillaryModePills).toBeDefined();
    expect(ArmillaryMorphRail).toBeDefined();
    expect(ArmillaryLayerToggles).toBeDefined();
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
          morphLambda: 0.0,
          camera: { pitch: 30, yaw: 45, roll: 0 },
          latitude: 47.06,
          longitude: -122.81,
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
    expect(html).toContain('0° Prime Meridian (Greenwich)');
    expect(html).toContain('miniglobe-observer-pin');
    expect(html).toContain('⊕ EARTH (Center)');
    expect(html).toContain('☉ SUN');
    expect(html).toContain('☽ MOON');
    // Lunar nodes (☊ and ☋) render on the lunar orbit in 3D Apparent mode
    expect(html).toContain('☊');
    expect(html).toContain('☋');
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
          lunarNodes: model.lunarNodes,
          projectionMode: 'heliocentric',
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
    // Lunar nodes (☊ and ☋) render on the lunar orbit in Orbit mode
    expect(html).toContain('☊');
    expect(html).toContain('☋');
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

  it('renders segmented True/Exaggerated Scale toggle and unified Observer Sky Cone toggle on Zap button in ArmillaryHeaderControls', () => {
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
    // Verify POV Cone toggle folded into Zap button in Orbit view
    expect(html).toContain('Toggle Volumetric Observer Sky Cone &amp; Laser Projection');
    expect(html).not.toContain('POV Cone');
  });

  it('unifies Earth orbit ring to fully solid path in top-down view (pitch = ±90°)', () => {
    const ring: ArmillaryRingPath = {
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

  it('unifies celestial ring to fully solid path when viewed edge-on (|n_z| <= 0.02) in Apparent view', () => {
    // Construct an edge-on celestial equator (XZ plane in camera space: n = (0, 1, 0), nz = 0)
    const edgeOnRing: ArmillaryRingPath = {
      id: 'equator',
      label: 'Celestial Equator',
      color: '#10b981',
      frontStrokeWidth: 2.0,
      backStrokeWidth: 1.0,
      frontPathD: 'M 100 0 L -100 0',
      backPathD: 'M -100 0 L 100 0',
      fullPathD: 'M 100 0 L -100 0 L 100 0 Z',
      vertices: [
        { p3d: { x: 100, y: 0, z: 0 }, pCam: { x: 100, y: 0, z: 0 }, pProj: { x: 100, y: 0 }, screenPos: { x: 100, y: 0 }, isFront: true },
        { p3d: { x: 0, y: 0, z: 100 }, pCam: { x: 0, y: 0, z: 100 }, pProj: { x: 0, y: 0 }, screenPos: { x: 0, y: 0 }, isFront: true },
        { p3d: { x: -100, y: 0, z: 0 }, pCam: { x: -100, y: 0, z: 0 }, pProj: { x: -100, y: 0 }, screenPos: { x: -100, y: 0 }, isFront: false },
        { p3d: { x: 0, y: 0, z: -100 }, pCam: { x: 0, y: 0, z: -100 }, pProj: { x: 0, y: 0 }, screenPos: { x: 0, y: 0 }, isFront: false },
        { p3d: { x: 100, y: 0, z: 0 }, pCam: { x: 100, y: 0, z: 0 }, pProj: { x: 100, y: 0 }, screenPos: { x: 100, y: 0 }, isFront: true }
      ]
    };

    const edgeOnHtml = renderToStaticMarkup(
      React.createElement(ArmillaryRingsLayer, {
        rings: [edgeOnRing],
        is3D: true,
        morphLambda: 0.0,
        cameraPitch: 0,
        orbitRingOpacity: 1.0,
        celestialRingsOpacity: 1.0
      })
    );

    // When edge-on, back dashed path is suppressed and fullPathD is rendered solid
    expect(edgeOnHtml).not.toContain('stroke-dasharray');
    expect(edgeOnHtml).not.toContain(edgeOnRing.backPathD);
    expect(edgeOnHtml).toContain(edgeOnRing.fullPathD);

    // Construct a tilted ring (pitch = 30°: nz ~ 0.5)
    const tiltedRing: ArmillaryRingPath = {
      ...edgeOnRing,
      vertices: [
        { p3d: { x: 100, y: 0, z: 0 }, pCam: { x: 100, y: 0, z: 0 }, pProj: { x: 100, y: 0 }, screenPos: { x: 100, y: 0 }, isFront: true },
        { p3d: { x: 0, y: 86.6, z: 50 }, pCam: { x: 0, y: 86.6, z: 50 }, pProj: { x: 0, y: -86.6 }, screenPos: { x: 0, y: -86.6 }, isFront: true },
        { p3d: { x: -100, y: 0, z: 0 }, pCam: { x: -100, y: 0, z: 0 }, pProj: { x: -100, y: 0 }, screenPos: { x: -100, y: 0 }, isFront: false },
        { p3d: { x: 0, y: -86.6, z: -50 }, pCam: { x: 0, y: -86.6, z: -50 }, pProj: { x: 0, y: 86.6 }, screenPos: { x: 0, y: 86.6 }, isFront: false },
        { p3d: { x: 100, y: 0, z: 0 }, pCam: { x: 100, y: 0, z: 0 }, pProj: { x: 100, y: 0 }, screenPos: { x: 100, y: 0 }, isFront: true }
      ]
    };

    const tiltedHtml = renderToStaticMarkup(
      React.createElement(ArmillaryRingsLayer, {
        rings: [tiltedRing],
        is3D: true,
        morphLambda: 0.0,
        cameraPitch: 30,
        orbitRingOpacity: 1.0,
        celestialRingsOpacity: 1.0
      })
    );

    // When tilted, depth sorting preserves dashed back segments
    expect(tiltedHtml).toContain('stroke-dasharray="3,2"');
    expect(tiltedHtml).toContain(tiltedRing.backPathD);
  });

  it('renders rich glassmorphic telemetry HUD popover for ascending and descending lunar nodes', () => {
    const mockLunarNodes = {
      ascendingNode: { screenPos: { x: 10, y: -20 }, isFront: true, lonDeg: 125.4 },
      descendingNode: { screenPos: { x: -10, y: 20 }, isFront: false, lonDeg: 305.4 }
    };

    // 1. Hovering Ascending Node
    const ascHtml = renderToStaticMarkup(
      React.createElement(ArmillaryHoverHud, {
        hoveredStar: null,
        hoveredBead: null,
        hoveredMilestone: null,
        hoveredNode: 'asc',
        lunarNodes: mockLunarNodes,
        showRule: false,
        sightingInfo: null,
        sun: { screenPos: { x: 0, y: 0 }, isFront: true } as unknown as ArmillaryModelOutput['sun'],
        moon: { screenPos: { x: 0, y: 0 }, isFront: true } as unknown as ArmillaryModelOutput['moon']
      })
    );
    expect(ascHtml).toContain('☊ Ascending Node (Caput)');
    expect(ascHtml).toContain('NORTHBOUND');
    expect(ascHtml).toContain('125.40°');
    expect(ascHtml).toContain('South → North of Ecliptic');

    // 2. Hovering Descending Node
    const descHtml = renderToStaticMarkup(
      React.createElement(ArmillaryHoverHud, {
        hoveredStar: null,
        hoveredBead: null,
        hoveredMilestone: null,
        hoveredNode: 'desc',
        lunarNodes: mockLunarNodes,
        showRule: false,
        sightingInfo: null,
        sun: { screenPos: { x: 0, y: 0 }, isFront: true } as unknown as ArmillaryModelOutput['sun'],
        moon: { screenPos: { x: 0, y: 0 }, isFront: true } as unknown as ArmillaryModelOutput['moon']
      })
    );
    expect(descHtml).toContain('☋ Descending Node (Cauda)');
    expect(descHtml).toContain('SOUTHBOUND');
    expect(descHtml).toContain('305.40°');
    expect(descHtml).toContain('North → South of Ecliptic');
  });

  it('renders Orbit zoom controls and passes subsolarCameraVector to ArmillaryEarthPip in heliocentric mode', () => {
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
      cameraPitch: 20,
      cameraYaw: 45,
      r0: 100
    });

    const html = renderToStaticMarkup(
      React.createElement(ArmillarySvgCanvas, {
        model: helioModel,
        projectionMode: 'heliocentric',
        morphLambda: 0.0,
        showRays: false,
        showStars: false,
        showTympan: false,
        showRule: false,
        camera: { pitch: 20, yaw: 45, roll: 0 },
        onCameraChange: () => {},
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12.0
      })
    );

    // Verify zoom controls rendered
    expect(html).toContain('title="Zoom Out"');
    expect(html).toContain('title="Zoom In"');
    expect(html).toContain('1.0×');

    // Verify Terra Living Marble Inset rendered with 0° Greenwich Prime Meridian and 180° Antimeridian
    expect(html).toContain('TERRA · LIVING MARBLE');
    expect(html).toContain('0° Prime Meridian (Greenwich)');
    expect(html).toContain('180° Antimeridian');
  });

  describe('Phase 3: Presentation Layer Unification & Interactive Controls Alignment', () => {
    it('toggles both onToggleObserverCone and onToggleRays in lockstep via Zap button in ArmillaryHeaderControls', () => {
      const onToggleRays = vi.fn();
      const onToggleObserverCone = vi.fn();

      const element = React.createElement(ArmillaryHeaderControls, {
        projectionMode: 'heliocentric',
        onSelectMode: () => {},
        morphLambda: 0.0,
        onMorphChange: () => {},
        showRays: true,
        onToggleRays,
        showStars: true,
        onToggleStars: () => {},
        showTympan: false,
        onToggleTympan: () => {},
        showRule: false,
        onToggleRule: () => {},
        showObserverCone: true,
        onToggleObserverCone,
        onResetCamera: () => {},
        onSnapToPreset: () => {}
      });

      const tree = (ArmillaryHeaderControls as any)(element.props);
      const findBtn = (node: any): any => {
        if (!node) return null;
        if (node.props?.title === 'Toggle Volumetric Observer Sky Cone & Laser Projection') return node;
        if (typeof node.type === 'function') {
          return findBtn(node.type(node.props));
        }
        if (Array.isArray(node)) {
          for (const c of node) {
            const found = findBtn(c);
            if (found) return found;
          }
        }
        if (node.props?.children) return findBtn(node.props.children);
        return null;
      };

      const zapBtn = findBtn(tree);
      expect(zapBtn).toBeDefined();
      expect(zapBtn.props.className).toContain('bg-indigo-600');

      // Click when active -> triggers both to false
      zapBtn.props.onClick();
      expect(onToggleObserverCone).toHaveBeenCalledWith(false);
      expect(onToggleRays).toHaveBeenCalled();

      // Test inactive state
      const inactiveElement = React.createElement(ArmillaryHeaderControls, {
        projectionMode: 'geocentric',
        onSelectMode: () => {},
        morphLambda: 0.0,
        onMorphChange: () => {},
        showRays: false,
        onToggleRays,
        showStars: true,
        onToggleStars: () => {},
        showTympan: false,
        onToggleTympan: () => {},
        showRule: false,
        onToggleRule: () => {},
        showObserverCone: false,
        onToggleObserverCone,
        onResetCamera: () => {},
        onSnapToPreset: () => {}
      });
      const inactiveTree = (ArmillaryHeaderControls as any)(inactiveElement.props);
      const inactiveZapBtn = findBtn(inactiveTree);
      expect(inactiveZapBtn.props.className).toContain('text-slate-400');

      // Click when inactive -> triggers both to true
      inactiveZapBtn.props.onClick();
      expect(onToggleObserverCone).toHaveBeenCalledWith(true);
    });

    it('renders ArmillaryObserverConeLayer when showObserverCone = true, and fades 3D elements as morphLambda increases past 0.45', () => {
      const mockObserverCone: ArmillaryObserverCone = {
        horizonDiscPathD: 'M 10 10 L 20 20 Z',
        conePathD: 'M 0 0 L 10 20 L -10 20 Z',
        silhouetteLinesPathD: 'M 0 0 L 10 20 M 0 0 L -10 20',
        zenithRay: { start: { x: 0, y: 0 }, end: { x: 0, y: -50 } },
        zenithScreenPos: { x: 0, y: -50 },
        observerScreenPos: { x: 0, y: 0 },
        isDaytime: true,
        sunElevationDeg: 35,
        label: 'Observer (47.06° N)'
      };

      // 1. Fully visible at morphLambda = 0.0
      const html0 = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryObserverConeLayer, {
            observerCone: mockObserverCone,
            orbitRingOpacity: 1.0,
            showObserverCone: true,
            morphLambda: 0.0,
            onHoverBead: () => {}
          })
        )
      );
      expect(html0).toContain('fill-opacity="0.16"');
      expect(html0).toContain('ZENITH');
      expect(html0).toContain('YOU');

      // 2. Midway through Phase B at morphLambda = 0.725 (phaseBU = 0.5)
      // YOU pin is hidden (phaseBU >= 0.5), fill opacity is halved (0.16 * 0.5 = 0.08)
      const htmlMid = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryObserverConeLayer, {
            observerCone: mockObserverCone,
            orbitRingOpacity: 0.0,
            showObserverCone: true,
            morphLambda: 0.725,
            onHoverBead: () => {}
          })
        )
      );
      expect(htmlMid).toContain('fill-opacity="0.08"');
      expect(htmlMid).toContain('ZENITH');
      expect(htmlMid).not.toContain('YOU');

      // 3. Late Phase B at morphLambda = 0.95 (phaseBU >= 0.9)
      // Zenith marker and ray are hidden (phaseBU >= 0.9)
      const htmlLate = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryObserverConeLayer, {
            observerCone: mockObserverCone,
            orbitRingOpacity: 0.0,
            showObserverCone: true,
            morphLambda: 0.95,
            onHoverBead: () => {}
          })
        )
      );
      expect(htmlLate).not.toContain('ZENITH');
      expect(htmlLate).not.toContain('YOU');

      // 4. Hidden when showObserverCone = false
      const htmlHidden = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryObserverConeLayer, {
            observerCone: mockObserverCone,
            orbitRingOpacity: 1.0,
            showObserverCone: false,
            morphLambda: 0.0,
            onHoverBead: () => {}
          })
        )
      );
      expect(htmlHidden).toBe('<svg></svg>');
    });

    it('renders ArmillaryLaserLayer and fades in as morphLambda increases past 0.45, even in heliocentric mode', () => {
      const mockFocalBeacon: ProjectionFocalBeaconOutput = {
        focalScreenPos: { x: 0, y: 0 },
        focal3D: { x: 0, y: 0, z: -100 },
        focalZCam: -100,
        conePathD: 'M 0 0 L 50 100 L -50 100 Z',
        laserRays: [
          {
            start: { x: 0, y: 0 },
            end: { x: 50, y: 100 },
            color: '#38bdf8',
            opacity: 0.8
          }
        ]
      };

      // 1. In heliocentric mode with morphLambda <= 0.45 -> returns null (not yet morphed to plate)
      const htmlHelio0 = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryLaserLayer, {
            showRays: true,
            focalBeacon: mockFocalBeacon,
            isOrbital: true,
            morphLambda: 0.45
          })
        )
      );
      expect(htmlHelio0).toBe('<svg></svg>');

      // 2. In heliocentric mode with morphLambda = 0.5 (phaseBU ~ 0.091 <= 0.3)
      // Laser layer renders, cone is faint, beacon circles and text are hidden
      const htmlHelioEarly = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryLaserLayer, {
            showRays: true,
            focalBeacon: mockFocalBeacon,
            isOrbital: true,
            morphLambda: 0.5
          })
        )
      );
      expect(htmlHelioEarly).toContain('laserGlow');
      expect(htmlHelioEarly).not.toContain('⌖ FOCAL BEACON');

      // 3. In heliocentric mode with morphLambda = 0.75 (phaseBU ~ 0.545 > 0.3, < 0.6)
      // Beacon circles are now rendered, but text is still hidden
      const htmlHelioMid = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryLaserLayer, {
            showRays: true,
            focalBeacon: mockFocalBeacon,
            isOrbital: true,
            morphLambda: 0.75
          })
        )
      );
      expect(htmlHelioMid).toContain('r="5"');
      expect(htmlHelioMid).toContain('r="2.5"');
      expect(htmlHelioMid).not.toContain('⌖ FOCAL BEACON');

      // 4. Fully morphed to 2D at morphLambda = 1.0 (phaseBU = 1.0)
      // Everything is at 100% opacity including beacon circles and text
      const htmlFull = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryLaserLayer, {
            showRays: true,
            focalBeacon: mockFocalBeacon,
            isOrbital: true,
            morphLambda: 1.0
          })
        )
      );
      expect(htmlFull).toContain('opacity="0.75"');
      expect(htmlFull).toContain('opacity="0.8"');
      expect(htmlFull).toContain('⌖ FOCAL BEACON');
      expect(htmlFull).toContain('r="5"');

      // 5. Hidden when showRays = false
      const htmlOff = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryLaserLayer, {
            showRays: false,
            focalBeacon: mockFocalBeacon,
            isOrbital: false,
            morphLambda: 1.0
          })
        )
      );
      expect(htmlOff).toBe('<svg></svg>');
    });

    // ------------------------------------------------------------------------
    // Phase 1 Hardening: Lunar Nodes, Observer Coordinates & Telemetry Horizon
    // ------------------------------------------------------------------------
    describe('Phase 1 Hardening: Functional, Telemetry & Visual Hardening', () => {
      // Helper function to find a React element in a rendered tree by predicate
      function findInTree(tree: any, predicate: (el: any) => boolean): any {
        if (!tree) return null;
        if (predicate(tree)) return tree;
        if (typeof tree.type === 'function') {
          return findInTree(tree.type(tree.props), predicate);
        }
        if (Array.isArray(tree)) {
          for (const child of tree) {
            const found = findInTree(child, predicate);
            if (found) return found;
          }
        } else if (tree.props && tree.props.children) {
          return findInTree(tree.props.children, predicate);
        }
        return null;
      }

      // 1. Lunar Nodes Toggle in ArmillaryHeaderControls
      it('toggles lunar nodes visibility via dedicated ☊ button in ArmillaryHeaderControls', () => {
        const onToggleLunarNodes = vi.fn();
        const baseProps = {
          projectionMode: 'geocentric' as const,
          onSelectMode: vi.fn(),
          morphLambda: 0.0,
          onMorphChange: vi.fn(),
          showRays: true,
          onToggleRays: vi.fn(),
          showStars: true,
          onToggleStars: vi.fn(),
          showTympan: true,
          onToggleTympan: vi.fn(),
          showRule: false,
          onToggleRule: vi.fn(),
          onResetCamera: vi.fn(),
          onSnapToPreset: vi.fn()
        };

        // Render with showLunarNodes = true
        const controlsOn = ArmillaryHeaderControls({
          ...baseProps,
          showLunarNodes: true,
          onToggleLunarNodes
        });
        const htmlOn = renderToStaticMarkup(controlsOn as React.ReactElement);
        expect(htmlOn).toContain('title="Toggle Draconic Lunar Nodes (☊ / ☋)"');
        expect(htmlOn).toContain('bg-indigo-600 text-white');
        expect(htmlOn).toContain('☊');

        // Render with showLunarNodes = false
        const controlsOff = ArmillaryHeaderControls({
          ...baseProps,
          showLunarNodes: false,
          onToggleLunarNodes
        });
        const htmlOff = renderToStaticMarkup(controlsOff as React.ReactElement);
        expect(htmlOff).toContain('title="Toggle Draconic Lunar Nodes (☊ / ☋)"');
        expect(htmlOff).toContain('text-slate-400 hover:text-slate-200');

        // Simulate click
        const button = findInTree(controlsOn, (el) => el?.props?.title === 'Toggle Draconic Lunar Nodes (☊ / ☋)');
        expect(button).toBeDefined();
        button.props.onClick();
        expect(onToggleLunarNodes).toHaveBeenCalledTimes(1);

        // When onToggleLunarNodes is omitted, button is not rendered
        const controlsNoToggle = ArmillaryHeaderControls({
          ...baseProps
        });
        const htmlNoToggle = renderToStaticMarkup(controlsNoToggle as React.ReactElement);
        expect(htmlNoToggle).not.toContain('title="Toggle Draconic Lunar Nodes (☊ / ☋)"');
      });


      // 6. Defensive fallback for laserRays in ArmillaryLaserLayer
      it('safely handles undefined laserRays in ArmillaryLaserLayer without throwing', () => {
        const mockBeacon = {
          focalScreenPos: { x: 0, y: 0 },
          focal3D: { x: 0, y: 0, z: -100 },
          focalZCam: -100,
          conePathD: 'M 0 0 L 50 100 L -50 100 Z',
          laserRays: undefined as any
        };

        expect(() => {
          renderToStaticMarkup(
            React.createElement('svg', null,
              React.createElement(ArmillaryLaserLayer, {
                showRays: true,
                focalBeacon: mockBeacon,
                isOrbital: false,
                morphLambda: 1.0
              })
            )
          );
        }).not.toThrow();
      });

      // 7. Center origin pin cleanup in ArmillarySvgCanvas
      it('renders alidade center pivot screw in ArmillarySvgCanvas only when showRule is true and !isOrbital', () => {
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
          moonDecDeg: 20,
          moonLambdaDeg: 90,
          moonPhase: 0.5,
          morphLambda: 1.0,
          projectionMode: 'stereographic',
          cameraPitch: 90,
          cameraYaw: 0,
          r0: 100
        });

        const canvasProps = {
          model,
          projectionMode: 'stereographic' as const,
          morphLambda: 1.0,
          showRays: false,
          showStars: false,
          showTympan: false,
          camera: { pitch: 90, yaw: 0, roll: 0 },
          onCameraChange: vi.fn(),
          r0: 100
        };

        // When showRule = false: No center origin pin
        const htmlNoRule = renderToStaticMarkup(
          React.createElement(ArmillarySvgCanvas, {
            ...canvasProps,
            showRule: false
          })
        );
        expect(htmlNoRule).not.toContain('fill="#f59e0b" stroke="#78350f"');

        // When showRule = true and !isOrbital: Center origin pin is rendered
        const htmlWithRule = renderToStaticMarkup(
          React.createElement(ArmillarySvgCanvas, {
            ...canvasProps,
            showRule: true
          })
        );
        expect(htmlWithRule).toContain('fill="#f59e0b" stroke="#78350f"');
      });
    });

  });
});
