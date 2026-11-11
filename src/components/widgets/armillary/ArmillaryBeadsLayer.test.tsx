import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ArmillaryBeadsLayer,
  ArmillarySvgCanvas
} from './index';
import {
  getJulianDate,
  generateArmillaryModel,
  computeMoonPhasePath,
  computeArmillaryObserverCone
} from '../../../utils/cosmicMath';

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

describe('ArmillaryBeadsLayer Subsystem', () => {
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

      // Verify generatorBeads derives normalized 3D subsolar vectors for both Earth and Moon
      expect(baseModel.earth.subsolarCameraVector).toBeDefined();
      expect(baseModel.moon.subsolarCameraVector).toBeDefined();
      const eLen = Math.hypot(baseModel.earth.subsolarCameraVector!.x, baseModel.earth.subsolarCameraVector!.y, baseModel.earth.subsolarCameraVector!.z);
      expect(eLen).toBeCloseTo(1, 4);
      const mLen = Math.hypot(baseModel.moon.subsolarCameraVector!.x, baseModel.moon.subsolarCameraVector!.y, baseModel.moon.subsolarCameraVector!.z);
      expect(mLen).toBeCloseTo(1, 4);

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
      const mockMoonBacklit = {
        ...mockMoon,
        subsolarCameraVector: { x: 0, y: 0, z: -1 }
      };

      const htmlBacklit = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: baseModel.earth,
            sun: mockSunBacklit,
            moon: mockMoonBacklit,
            milestones: [],
            projectionMode: 'heliocentric',
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
      const mockMoonFrontlit = {
        ...mockMoon,
        subsolarCameraVector: { x: 0, y: 0, z: 1 }
      };

      const htmlFrontlit = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: baseModel.earth,
            sun: mockSunFrontlit,
            moon: mockMoonFrontlit,
            milestones: [],
            projectionMode: 'heliocentric',
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

    it('dynamically sorts Moon behind Earth when z_moon < z_earth in 3D Apparent mode', () => {
      const baseModel = generateArmillaryModel({
        julianDate: getJulianDate(new Date(2026, 2, 20), 12),
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
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Earth at center (z = 0)
      const mockEarth = {
        ...baseModel.earth,
        pCam: { x: 0, y: 0, z: 0 },
        screenPos: { x: 0, y: 0 }
      };

      // 1. Moon behind Earth (z_moon = -26 < z_earth = 0)
      const mockMoonFar = {
        ...baseModel.moon,
        pCam: { x: 0, y: 0, z: -26 },
        screenPos: { x: 0, y: 0 }
      };

      const htmlFar = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: mockEarth,
            sun: baseModel.sun,
            moon: mockMoonFar,
            milestones: [],
            projectionMode: 'geocentric',
            isOrbital: false,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      const moonIndexFar = htmlFar.indexOf('☽ MOON');
      const earthIndexFar = htmlFar.indexOf('miniglobe-root');
      expect(moonIndexFar).toBeGreaterThan(-1);
      expect(earthIndexFar).toBeGreaterThan(-1);
      // Moon rendered BEFORE Earth -> Earth occludes Moon
      expect(moonIndexFar).toBeLessThan(earthIndexFar);

      // 2. Moon in front of Earth (z_moon = +26 > z_earth = 0)
      const mockMoonNear = {
        ...baseModel.moon,
        pCam: { x: 0, y: 0, z: 26 },
        screenPos: { x: 0, y: 0 }
      };

      const htmlNear = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: mockEarth,
            sun: baseModel.sun,
            moon: mockMoonNear,
            milestones: [],
            projectionMode: 'geocentric',
            isOrbital: false,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      const moonIndexNear = htmlNear.indexOf('☽ MOON');
      const earthIndexNear = htmlNear.indexOf('miniglobe-root');
      expect(moonIndexNear).toBeGreaterThan(-1);
      expect(earthIndexNear).toBeGreaterThan(-1);
      // Earth rendered BEFORE Moon -> Moon is on top of Earth
      expect(earthIndexNear).toBeLessThan(moonIndexNear);
    });

    it('dynamically sorts Moon behind Earth in 3D Heliocentric Orbit mode and anchors ray to Earth', () => {
      const baseModel = generateArmillaryModel({
        julianDate: getJulianDate(new Date(2026, 2, 20), 12),
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
        projectionMode: 'heliocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      // Earth at screen (80, 50), depth z = 50
      const mockEarth = {
        ...baseModel.earth,
        pCam: { x: 80, y: 50, z: 50 },
        screenPos: { x: 80, y: 50 }
      };

      // Moon behind Earth (z_moon = 34 < z_earth = 50)
      const mockMoon = {
        ...baseModel.moon,
        pCam: { x: 85, y: 52, z: 34 },
        screenPos: { x: 85, y: 52 }
      };

      const html = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            earth: mockEarth,
            sun: baseModel.sun,
            moon: mockMoon,
            milestones: [],
            projectionMode: 'heliocentric',
            isOrbital: true,
            camera: { pitch: 0, yaw: 0, roll: 0 },
            onHoverBead: () => {},
            onHoverMilestone: () => {},
            onHoverNode: () => {},
            onTargetClick: () => {}
          })
        )
      );

      const moonIndex = html.indexOf('☽ MOON');
      const earthIndex = html.indexOf('miniglobe-root');
      // Moon rendered before Earth
      expect(moonIndex).toBeLessThan(earthIndex);

      // Moon's connection ray connects Earth (80, 50) to Moon (85, 52), NOT (0, 0)
      expect(html).toContain('x1="80" y1="50" x2="85" y2="52"');
    });
  });

  describe('Interactive Lunar Node Pins', () => {
    it('renders interactive Lunar Node Pins (☊ and ☋) in ArmillaryBeadsLayer when showLunarNodes is true and unmounts when false', () => {
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
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 30,
        cameraYaw: 45,
        r0: 100
      });

      const defaultProps = {
        earth: model.earth,
        sun: model.sun,
        moon: model.moon,
        milestones: model.milestones,
        lunarNodes: model.lunarNodes,
        projectionMode: 'geocentric' as const,
        morphLambda: 0.0,
        camera: { pitch: 30, yaw: 45, roll: 0 },
        latitude: 47.06,
        longitude: -122.81,
        isOrbital: false,
        orbitRingOpacity: 0,
        milestonesOpacity: 1,
        lunarOrbitOpacity: 1,
        onHoverBead: vi.fn(),
        onHoverMilestone: vi.fn(),
        onHoverNode: vi.fn(),
        onTargetClick: vi.fn()
      };

      // Render with showLunarNodes = true (default)
      const htmlOn = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            ...defaultProps,
            showLunarNodes: true
          })
        )
      );

      expect(htmlOn).toContain('data-testid="lunar-node-asc"');
      expect(htmlOn).toContain('data-testid="lunar-node-desc"');
      expect(htmlOn).toContain('☊');
      expect(htmlOn).toContain('☋');
      expect(htmlOn).toContain('#38bdf8'); // Sky blue for ascending node
      expect(htmlOn).toContain('#f43f5e'); // Rose red for descending node

      // Render with showLunarNodes = false
      const htmlOff = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            ...defaultProps,
            showLunarNodes: false
          })
        )
      );

      expect(htmlOff).not.toContain('data-testid="lunar-node-asc"');
      expect(htmlOff).not.toContain('data-testid="lunar-node-desc"');
      expect(htmlOff).not.toContain('☊');
      expect(htmlOff).not.toContain('☋');

      // When lunarOrbitOpacity <= 0.05, node pins are hidden
      const htmlHiddenOrbit = renderToStaticMarkup(
        React.createElement('svg', null,
          React.createElement(ArmillaryBeadsLayer, {
            ...defaultProps,
            showLunarNodes: true,
            lunarOrbitOpacity: 0.0
          })
        )
      );
      expect(htmlHiddenOrbit).not.toContain('data-testid="lunar-node-asc"');
      expect(htmlHiddenOrbit).not.toContain('data-testid="lunar-node-desc"');
    });

    it('triggers onHoverNode and onTargetClick when interacting with Lunar Node Pins in ArmillaryBeadsLayer', () => {
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
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 30,
        cameraYaw: 45,
        r0: 100
      });

      const onHoverNode = vi.fn();
      const onTargetClick = vi.fn();

      let ascGroup: any = null;
      let descGroup: any = null;

      const TestWrapper: React.FC = () => {
        const layerTree = ArmillaryBeadsLayer({
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
          showLunarNodes: true,
          hoveredNode: null,
          isDragging: false,
          onHoverBead: vi.fn(),
          onHoverMilestone: vi.fn(),
          onHoverNode,
          onTargetClick
        });

        ascGroup = findInTree(layerTree, (el) => el?.props?.['data-testid'] === 'lunar-node-asc');
        descGroup = findInTree(layerTree, (el) => el?.props?.['data-testid'] === 'lunar-node-desc');

        return React.createElement('svg', null, layerTree as any);
      };

      renderToStaticMarkup(React.createElement(TestWrapper));

      expect(ascGroup).toBeDefined();
      expect(descGroup).toBeDefined();

      // 1. Pointer Enter Ascending Node
      ascGroup.props.onPointerEnter();
      expect(onHoverNode).toHaveBeenCalledWith('asc');

      // 2. Pointer Leave Ascending Node
      ascGroup.props.onPointerLeave();
      expect(onHoverNode).toHaveBeenCalledWith(null);

      // 3. Click Ascending Node
      const mockStopPropagation = vi.fn();
      ascGroup.props.onClick({ stopPropagation: mockStopPropagation });
      expect(mockStopPropagation).toHaveBeenCalled();
      expect(onTargetClick).toHaveBeenCalledWith('Ascending Node (☊ Caput)', model.lunarNodes!.ascendingNode.screenPos);

      // 4. Pointer Enter Descending Node
      descGroup.props.onPointerEnter();
      expect(onHoverNode).toHaveBeenCalledWith('desc');

      // 5. Pointer Leave Descending Node
      descGroup.props.onPointerLeave();
      expect(onHoverNode).toHaveBeenCalledWith(null);

      // 6. Click Descending Node
      descGroup.props.onClick({ stopPropagation: mockStopPropagation });
      expect(onTargetClick).toHaveBeenCalledWith('Descending Node (☋ Cauda)', model.lunarNodes!.descendingNode.screenPos);
    });
  });
});
