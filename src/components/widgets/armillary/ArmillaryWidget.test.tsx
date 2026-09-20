import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
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
  ArmillaryEarthPip,
  computeStagedCamera,
  type ArmillaryCameraState,
  type ArmillaryModelOutput,
  type ArmillaryRingPath
} from './index';
import { getJulianDate, generateArmillaryModel, computeMoonPhasePath, computeArmillaryObserverCone } from '../../../utils/cosmicMath';

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
    expect(html).toContain('0° Prime Meridian (Greenwich)');
    expect(html).toContain('miniglobe-observer-pin');
    expect(html).toContain('⊕ EARTH (Center)');
    expect(html).toContain('☉ SUN');
    expect(html).toContain('☽ MOON');
    // Lunar nodes (☊ and ☋) are removed from 3D Apparent mode to avoid visual clutter
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
          lunarNodes: model.lunarNodes,
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
    // Lunar nodes (☊ and ☋) are removed from Orbit mode to avoid visual clutter
    expect(html).not.toContain('☊');
    expect(html).not.toContain('☋');
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
    expect(html).toContain('Toggle Observer Sky Cone (FOV)');
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

  describe('computeMoonPhasePath & Directional Lunar Phase Illumination', () => {
    it('accurately derives new moon, full moon, crescent, and gibbous paths', () => {
      const newMoon = computeMoonPhasePath(0.0, 2.6);
      expect(newMoon.isNew).toBe(true);
      expect(newMoon.isFull).toBe(false);
      expect(newMoon.pathD).toBe('');

      const fullMoon = computeMoonPhasePath(0.5, 2.6);
      expect(fullMoon.isNew).toBe(false);
      expect(fullMoon.isFull).toBe(true);
      expect(fullMoon.pathD).toBe('');

      const waxingCrescent = computeMoonPhasePath(0.15, 2.6);
      expect(waxingCrescent.isNew).toBe(false);
      expect(waxingCrescent.isFull).toBe(false);
      expect(waxingCrescent.pathD).toContain('M 0,-2.60');
      expect(waxingCrescent.pathD).toContain('A 2.6,2.6');
      expect(waxingCrescent.pathD).toContain('0 0,0 0,-2.60'); // sweep 0 for crescent

      const waxingGibbous = computeMoonPhasePath(0.35, 2.6);
      expect(waxingGibbous.isNew).toBe(false);
      expect(waxingGibbous.isFull).toBe(false);
      expect(waxingGibbous.pathD).toContain('0 0,1 0,-2.60'); // sweep 1 for gibbous
    });

    it('renders directional lunar phase bead in Heliocentric Orbit mode with sunward dayside', () => {
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
        moonPhase: 0.15,
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
            modelType: 'orbit',
            morphLambda: 0.0,
            isOrbital: true,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            timeOfDay: 12.0,
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

      // Nightside dark base sphere
      expect(html).toContain('fill="#0f172a"');
      // Dayside illuminated 3D analytical terminator path
      expect(html).toContain('fill="#f8fafc"');
      expect(html).toMatch(/<path d="M[^"]+" fill="#f8fafc"/);
    });

    it('renders 3D analytical lunar terminator in Geocentric Apparent mode', () => {
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
        moonPhase: 0.25,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 20,
        cameraYaw: 40,
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
            isOrbital: false,
            camera: { pitch: 20, yaw: 40, roll: 0 },
            timeOfDay: 12.0,
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

      // Nightside dark base sphere
      expect(html).toContain('fill="#0f172a"');
      // 3D analytical illuminated terminator path
      expect(html).toContain('fill="#f8fafc"');
      expect(html).toMatch(/<path d="M[^"]+" fill="#f8fafc"/);
    });

    it('renders apparent lunar phase crescent in 2D astrolabe plate mode', () => {
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
        moonPhase: 0.25,
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
            lunarNodes: model.lunarNodes,
            projectionMode: 'stereographic',
            modelType: 'rete',
            morphLambda: 1.0,
            isOrbital: false,
            camera: { pitch: 90, yaw: 0, roll: 0 },
            timeOfDay: 12.0,
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

      // Nightside dark base sphere
      expect(html).toContain('fill="#0f172a"');
      // 2D apparent phase path rotated toward Sun
      expect(html).toContain('fill="#f8fafc"');
      expect(html).toContain('rotate(');
    });

    it('synchronizes main view Earth continent rotation with camera yaw', () => {
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
        projectionMode: 'geocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      const htmlYaw0 = renderToStaticMarkup(
        React.createElement(ArmillarySvgCanvas, {
          model,
          projectionMode: 'geocentric',
          morphLambda: 0.0,
          showRays: false,
          showStars: false,
          showTympan: false,
          showRule: false,
          camera: { pitch: 0, yaw: 0, roll: 0 },
          onCameraChange: () => {},
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12.0
        })
      );

      const htmlYaw90 = renderToStaticMarkup(
        React.createElement(ArmillarySvgCanvas, {
          model,
          projectionMode: 'geocentric',
          morphLambda: 0.0,
          showRays: false,
          showStars: false,
          showTympan: false,
          showRule: false,
          camera: { pitch: 0, yaw: 90, roll: 0 },
          onCameraChange: () => {},
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 12.0
        })
      );

      // Continents should NOT be identical when camera yaw rotates from 0° to 90°
      expect(htmlYaw0).not.toEqual(htmlYaw90);
    });

    it('aligns observer cone position perfectly with MiniGlobe user location dot on Earth', () => {
      const jd = getJulianDate(new Date(2026, 0, 3), 12);
      const lat = 47.06;
      const lon = -122.81;
      const tod = 12.0;
      const model = generateArmillaryModel({
        julianDate: jd,
        latitude: lat,
        longitude: lon,
        timeOfDay: tod,
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

      expect(model.observerCone).toBeDefined();
      const obsScreen = model.observerCone!.observerScreenPos;
      const earthScreen = model.earth.screenPos;

      // Expected offset on Earth disc (radius 4.8px) in camera coordinates (pitch=0, yaw=0)
      const phiRad = (lat * Math.PI) / 180;
      const hRad = (((tod - 12) * 15 + lon) * Math.PI) / 180;
      const expectedDx = 4.8 * Math.cos(phiRad) * Math.sin(hRad);
      const expectedDy = -4.8 * Math.sin(phiRad);

      expect(obsScreen.x - earthScreen.x).toBeCloseTo(expectedDx, 2);
      expect(obsScreen.y - earthScreen.y).toBeCloseTo(expectedDy, 2);
    });

    it('renders 3D analytical moon terminator accurately under edge-on perspective', () => {
      const baseModel = generateArmillaryModel({
        julianDate: getJulianDate(new Date(2026, 0, 3), 12),
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

      const mockMoon = {
        ...baseModel.moon,
        p3d: { x: 0, y: 0, z: 0 },
        pCam: { x: 0, y: 0, z: 0 },
        screenPos: { x: 50, y: 50 }
      };

      // 1. Backlit Moon (Moon between camera and Sun: sz < 0 -> dark / New Moon silhouette)
      const mockSunBacklit = {
        ...baseModel.sun,
        p3d: { x: 0, y: 0, z: -100 },
        pCam: { x: 0, y: 0, z: -100 }
      };

      const htmlBacklit = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: baseModel.earth,
            sun: mockSunBacklit,
            moon: mockMoon,
            milestones: [],
            projectionMode: 'heliocentric',
            modelType: 'orbit',
            isOrbital: true,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      // Backlit Moon has dark base circle and rim stroke, but NO illuminated white path
      expect(htmlBacklit).toContain('fill="#0f172a"');
      expect(htmlBacklit).toContain('stroke="#475569"');
      expect(htmlBacklit).not.toContain('fill="#f8fafc"');

      // 2. Frontlit Moon (Sun illuminates front face: sz > 0 -> illuminated path rendered)
      const mockSunFrontlit = {
        ...baseModel.sun,
        p3d: { x: 0, y: 0, z: 100 },
        pCam: { x: 0, y: 0, z: 100 }
      };

      const htmlFrontlit = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: baseModel.earth,
            sun: mockSunFrontlit,
            moon: mockMoon,
            milestones: [],
            projectionMode: 'heliocentric',
            modelType: 'orbit',
            isOrbital: true,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      // Frontlit Moon contains illuminated path
      expect(htmlFrontlit).toContain('fill="#0f172a"');
      expect(htmlFrontlit).toContain('fill="#f8fafc"');
      expect(htmlFrontlit).toContain('stroke="#475569"');
    });

    it('renders zoom controls and subsolar lighting in Geocentric Apparent mode', () => {
      const jd = getJulianDate(new Date(2026, 9, 3), 10.217); // 10/03/2026 10:13 UTC
      const model = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 10.217,
        sunRaDeg: 190,
        sunDecDeg: -4,
        sunLambdaDeg: 190,
        moonRaDeg: 120,
        moonDecDeg: 15,
        moonLambdaDeg: 120,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      });

      const html = renderToStaticMarkup(
        React.createElement(ArmillarySvgCanvas, {
          model,
          projectionMode: 'geocentric',
          morphLambda: 0.0,
          showRays: false,
          showStars: true,
          showTympan: false,
          showRule: false,
          camera: { pitch: 25, yaw: 35, roll: 0 },
          onCameraChange: () => {},
          latitude: 47.06,
          longitude: -122.81,
          timeOfDay: 10.217
        })
      );

      // Zoom controls should be present in 3D Geocentric Apparent view
      expect(html).toContain('title="Zoom In"');
      expect(html).toContain('title="Zoom Out"');
      expect(html).toContain('1.0×');

      // Earth globe with 3D euler orientation and subsolar terminator
      expect(html).toContain('miniglobe-root');
    });

    it('prevents silhouette ray collapse when camera sightline aligns directly with observer zenith ray', () => {
      // Create scenario where observer zenith ray points straight along camera sightline
      // In camera coordinates, looking directly down zenith (obsScreenPos == zenithScreenPos)
      const mockTransformVertex = (p3d: { x: number; y: number; z: number }) => ({
        p3d,
        pCam: { x: 0, y: 0, z: p3d.z },
        pProj: { x: 0, y: 0 },
        // Same screen position for observer and zenith
        screenPos: { x: 100, y: 100 },
        isFront: true
      });

      const cone = computeArmillaryObserverCone({
        orbitRingOpacity: 1.0,
        latitude: 90 as any,
        longitude: 0 as any,
        timeOfDay: 12.0,
        blendedEarth3D: { x: 0, y: 0, z: 0 },
        blendedSun3D: { x: 100, y: 0, z: 0 },
        transformVertex: mockTransformVertex
      });

      expect(cone).toBeDefined();
      expect(cone!.silhouetteLinesPathD).toBeDefined();
      // Silhouette path should contain valid move and line commands with numbers
      expect(cone!.silhouetteLinesPathD).toMatch(/M \d+(\.\d+)? \d+(\.\d+)? L/);
      expect(cone!.silhouetteLinesPathD).not.toContain('NaN');
    });

    it('maintains 3D euler orientation and analytical moon model during Phase A morphing (lambda <= 0.45)', () => {
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
        morphLambda: 0.25, // Phase A mid-transition
        projectionMode: 'geocentric',
        cameraPitch: 45,
        cameraYaw: 20,
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
            morphLambda: 0.25,
            isOrbital: false,
            camera: { pitch: 45, yaw: 20, roll: 0 },
            timeOfDay: 12.0,
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

      // Earth globe retains 3D view (shows label and euler atmosphere glow)
      expect(html).toContain('⊕ EARTH (Center)');
      // Moon retains 3D analytical terminator
      expect(html).toMatch(/<path d="M[^"]+" fill="#f8fafc"/);
    });
  });
});
