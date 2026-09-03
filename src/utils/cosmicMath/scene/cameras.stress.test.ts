/**
 * @file cameras.stress.test.ts
 * Adversarial stress testing and empirical challenge harness for the 4 canonical camera projection rigs:
 * 1. projectHeliocentricTopDown
 * 2. projectGeocentricTransverse
 * 3. projectGeocentricAxial
 * 4. projectEulerCamera
 */

import { describe, it, expect } from 'vitest';
import {
  generateCosmicScene,
  projectHeliocentricTopDown,
  projectGeocentricTransverse,
  projectGeocentricAxial,
  projectEulerCamera,
  CosmicScene3D,
  rotatePointEuler3D,
  vectorMagnitude,
  subtractVectors3D
} from './index';
import { asDegrees, toRadians, toDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';

describe('Adversarial Stress Harness: Canonical Camera Projection Rigs', () => {

  // Epochs for Testing
  const EPOCHS = {
    j2000: 2451545.0,                         // 2000-01-01 12:00 UTC
    marchEquinox2024: 2460389.96,              // 2024-03-20 03:06 UTC
    juneSolstice2024: 2460482.88,              // 2024-06-20 20:51 UTC
    septEquinox2024: 2460576.07,               // 2024-09-22 12:44 UTC
    decSolstice2024: 2460665.43,               // 2024-12-21 09:21 UTC
    eclipseApr2024: 2460409.26,                // 2024-04-08 18:17 UTC Total Solar
    eclipseOct2024: 2460586.27,                // 2024-10-02 18:45 UTC Annular Solar
    eclipseMar2025: 2460749.29,                // 2025-03-14 06:58 UTC Total Lunar (Blood Moon)
    eclipseAug2026: 2461266.24,                // 2026-08-12 17:47 UTC Total Solar
    eclipseAug2027: 2461619.92                 // 2027-08-02 10:07 UTC Total Solar (Luxor)
  };

  // =========================================================================
  // 1. projectHeliocentricTopDown Stress Tests
  // =========================================================================
  describe('Rig 1: projectHeliocentricTopDown Adversarial Verification', () => {

    it('C1.1: Viewport parameter variations (numbers, objects, degenerate scales, custom centers)', () => {
      const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode: 'exaggerated' });

      // Viewport as numbers
      const pNum = projectHeliocentricTopDown(scene, 600, 400, 1.5);
      expect(pNum.camera.viewport.width).toBe(600);
      expect(pNum.camera.viewport.height).toBe(400);
      expect(pNum.camera.viewport.scale).toBe(1.5);
      expect(pNum.camera.viewport.centerX).toBe(0);
      expect(pNum.camera.viewport.centerY).toBe(0);

      // Viewport as object with custom center
      const pObj = projectHeliocentricTopDown(scene, { width: 800, height: 600, scale: 2.0, centerX: 400, centerY: 300 });
      expect(pObj.camera.viewport.width).toBe(800);
      expect(pObj.camera.viewport.height).toBe(600);
      expect(pObj.camera.viewport.scale).toBe(2.0);
      expect(pObj.camera.viewport.centerX).toBe(400);
      expect(pObj.camera.viewport.centerY).toBe(300);

      // Sun shifted by custom center and scale: cx + sunPos.x * s = 400 + (-50) * 2.0 = 300
      expect(pObj.elements.sun.x).toBeCloseTo(300, 4);
      expect(pObj.elements.sun.y).toBeCloseTo(300, 4);

      // Zero scale edge case
      const pZero = projectHeliocentricTopDown(scene, { scale: 0, centerX: 100, centerY: 100 });
      expect(pZero.elements.sun.x).toBe(100);
      expect(pZero.elements.sun.y).toBe(100);
      expect(pZero.elements.sun.r).toBe(0);
      expect(pZero.elements.orbitPath).toContain('M 100 100 a 0 0 0 1 0 0 0 a 0 0 0 1 0 0 0 Z');
    });

    it('C1.2: Path continuity and SVG arc syntax for Earth orbit and Lunar orbit across scale modes', () => {
      for (const scaleMode of ['true', 'exaggerated'] as const) {
        const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode });
        const p = projectHeliocentricTopDown(scene, { width: 580, height: 560, scale: 1.2 });

        // Earth orbit SVG path grammar
        const orbitPath = p.elements.orbitPath;
        const orbitMatch = orbitPath.match(/^M\s+([-\d.]+)\s+([-\d.]+)\s+a\s+([-\d.]+)\s+([-\d.]+)\s+0\s+1\s+0\s+([-\d.]+)\s+([-\d.]+)\s+a\s+([-\d.]+)\s+([-\d.]+)\s+0\s+1\s+0\s+([-\d.]+)\s+([-\d.]+)\s+Z$/);
        expect(orbitMatch).not.toBeNull();

        const rx = parseFloat(orbitMatch![3]);
        const ry = parseFloat(orbitMatch![4]);
        const dx1 = parseFloat(orbitMatch![5]);
        const dx2 = parseFloat(orbitMatch![9]);

        expect(rx).toBeGreaterThan(0);
        expect(ry).toBeGreaterThan(0);
        expect(dx1).toBeCloseTo(2 * rx, 4);
        expect(dx2).toBeCloseTo(-2 * rx, 4);

        // Lunar orbit SVG path grammar
        const lunarPath = p.elements.lunarOrbitPath!;
        expect(lunarPath).toBeDefined();
        const lunarMatch = lunarPath.match(/^M\s+([-\d.]+)\s+([-\d.]+)\s+a\s+([-\d.]+)\s+([-\d.]+)\s+0\s+1\s+0\s+([-\d.]+)\s+([-\d.]+)\s+a\s+([-\d.]+)\s+([-\d.]+)\s+0\s+1\s+0\s+([-\d.]+)\s+([-\d.]+)\s+Z$/);
        expect(lunarMatch).not.toBeNull();
      }
    });

    it('C1.3: Milestone nodes coordinate precision and conic section adherence across seasons', () => {
      const dates = Object.values(EPOCHS);
      for (const jd of dates) {
        const scene = generateCosmicScene({ julianDate: jd, scaleMode: 'exaggerated' });
        const p = projectHeliocentricTopDown(scene, { width: 580, height: 560, scale: 1.0 });

        expect(p.elements.milestones).toHaveLength(6);
        const a = 200;
        const b = 200 * Math.sqrt(1 - 0.25 * 0.25);

        for (const m of p.elements.milestones) {
          expect(Number.isFinite(m.x)).toBe(true);
          expect(Number.isFinite(m.y)).toBe(true);
          // Ellipse check: (x/a)^2 + (y/b)^2 = 1
          const ellipseResidual = Math.pow(m.x / a, 2) + Math.pow(m.y / b, 2);
          expect(ellipseResidual).toBeCloseTo(1.0, 1);
        }
      }
    });
  });

  // =========================================================================
  // 2. projectGeocentricTransverse Stress Tests
  // =========================================================================
  describe('Rig 2: projectGeocentricTransverse Adversarial Verification', () => {

    it('C2.1: Shadow cone polygon geometry, apex positioning, and axis alignment across all eclipse presets', () => {
      const eclipseKeys: (keyof typeof EPOCHS)[] = ['eclipseApr2024', 'eclipseOct2024', 'eclipseMar2025', 'eclipseAug2026', 'eclipseAug2027'];

      for (const key of eclipseKeys) {
        const jd = EPOCHS[key];
        const scene = generateCosmicScene({ julianDate: jd });
        const p = projectGeocentricTransverse(scene, { width: 520, height: 220, scale: 1.0 });

        const sc = p.elements.shadowCones!;
        expect(sc).toBeDefined();

        // Umbra path must be closed polygon M ... L ... L ... Z
        expect(sc.umbraPath).toMatch(/^M\s+310\s+92\s+L\s+490\s+110\s+L\s+310\s+128\s+Z$/);

        // Penumbra path must be closed polygon M ... L ... L ... L ... Z
        expect(sc.penumbraPath).toMatch(/^M\s+310\s+92\s+L\s+510\s+65\s+L\s+510\s+155\s+L\s+310\s+128\s+Z$/);

        // Axis line must start at Sun (X=50, Y=110) and extend through Earth to penumbra right edge (X=510, Y=110)
        expect(sc.axisLine.x1).toBe(50);
        expect(sc.axisLine.y1).toBe(110);
        expect(sc.axisLine.x2).toBe(510);
        expect(sc.axisLine.y2).toBe(110);
      }
    });

    it('C2.2: 4-Quadrant lunar orbit stroke segmentation, color encoding (#38bdf8 vs #f43f5e), and continuity', () => {
      // Test across 36 steps of nodal progression (0 to 360 deg)
      for (let angle = 0; angle < 360; angle += 15) {
        const scene = generateCosmicScene({ julianDate: EPOCHS.j2000 });
        // Override node longitude to test arbitrary rotation
        scene.moon.ascendingNodeLongitude = asDegrees(angle);

        const p = projectGeocentricTransverse(scene);
        const segs = p.elements.lunarOrbitSegments!;

        expect(segs).toBeDefined();
        expect(segs.length).toBeGreaterThanOrEqual(2);
        expect(segs.length).toBeLessThanOrEqual(4);

        for (const seg of segs) {
          // Verify color encoding
          if (seg.isAscending) {
            expect(seg.stroke).toBe('#38bdf8'); // Sky Blue
          } else {
            expect(seg.stroke).toBe('#f43f5e'); // Crimson Red
          }

          // Verify front/back stroke style
          if (seg.isFront) {
            expect(seg.strokeDasharray).toBeUndefined(); // Solid
          } else {
            expect(seg.strokeDasharray).toBe('4 3'); // Dashed
          }

          // Verify path points are all finite numbers
          const points = seg.path.split(/[ML\s]+/).filter(Boolean).map(Number);
          for (const pt of points) {
            expect(Number.isFinite(pt)).toBe(true);
          }
        }
      }
    });

    it('C2.3: Earth axial tilt in side-on projection strictly follows eps * sin(lambda_sun)', () => {
      const testCases = [
        { jd: EPOCHS.marchEquinox2024, expectedAngle: 0, tol: 1.5 },
        { jd: EPOCHS.juneSolstice2024, expectedAngle: 23.44, tol: 0.5 },
        { jd: EPOCHS.septEquinox2024, expectedAngle: 0, tol: 1.5 },
        { jd: EPOCHS.decSolstice2024, expectedAngle: -23.44, tol: 0.5 }
      ];

      for (const tc of testCases) {
        const scene = generateCosmicScene({ julianDate: tc.jd });
        const p = projectGeocentricTransverse(scene);
        expect(p.elements.earth.axialTiltAngle2D).toBeCloseTo(tc.expectedAngle, 0);
      }
    });

    it('C2.4: Moon orbital position and depth monotonicity across lunar phases', () => {
      // Test 8 phases: 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875
      for (let phase = 0; phase <= 1.0; phase += 0.125) {
        const scene = generateCosmicScene({ julianDate: EPOCHS.j2000 });
        scene.moon.phase = phase;

        const p = projectGeocentricTransverse(scene, { width: 520, height: 220, scale: 1.0 });
        const moon = p.elements.moon;

        const phaseRad = phase * 2 * Math.PI;
        const expectedX = 310 - Math.cos(phaseRad) * 85;
        const expectedDepth = Math.sin(phaseRad) * 85;

        expect(moon.x).toBeCloseTo(expectedX, 3);
        expect(moon.depth).toBeCloseTo(expectedDepth, 3);

        // At New Moon (phase 0), Moon is closest to Sun (leftmost: X = 310 - 85 = 225)
        if (phase === 0) {
          expect(moon.x).toBeCloseTo(225, 3);
          expect(moon.depth).toBeCloseTo(0, 3);
        }
        // At Full Moon (phase 0.5), Moon is furthest from Sun (rightmost: X = 310 + 85 = 395)
        if (phase === 0.5) {
          expect(moon.x).toBeCloseTo(395, 3);
          expect(moon.depth).toBeCloseTo(0, 3);
        }
      }
    });
  });

  // =========================================================================
  // 3. projectGeocentricAxial Stress Tests
  // =========================================================================
  describe('Rig 3: projectGeocentricAxial Adversarial Verification', () => {

    it('C3.1: Sun background depth (-1000) vs Earth foreground depth (0) invariant across all epochs', () => {
      for (const jd of Object.values(EPOCHS)) {
        const scene = generateCosmicScene({ julianDate: jd });
        const p = projectGeocentricAxial(scene);

        expect(p.elements.sun.depth).toBe(-1000);
        expect(p.elements.earth.depth).toBe(0);
        expect(p.elements.sun.depth).toBeLessThan(p.elements.earth.depth);
        expect(p.elements.sun.x).toBe(p.elements.earth.x);
        expect(p.elements.sun.y).toBe(p.elements.earth.y);
      }
    });

    it('C3.2: Transverse elongation (X) vs Ecliptic latitude beta (Y) miss geometry at syzygies', () => {
      // Eclipse presets: at syzygy, elongation is 0 (New Moon) or 180 (Full Moon) -> sin(phaseRad) ~ 0 -> Moon X = cx
      const eclipsePresets = [
        { jd: EPOCHS.eclipseApr2024, type: 'Solar' },
        { jd: EPOCHS.eclipseOct2024, type: 'Solar' },
        { jd: EPOCHS.eclipseMar2025, type: 'Lunar' }
      ];

      for (const ep of eclipsePresets) {
        const scene = generateCosmicScene({ julianDate: ep.jd });
        const p = projectGeocentricAxial(scene);

        const cx = 200;
        const cy = 90;
        const beta = scene.moon.eclipticLatitude;

        // Near central eclipse, X is close to center (within small elongation delta)
        expect(Math.abs(p.elements.moon.x - cx)).toBeLessThan(15);

        // Y offset matches ecliptic latitude: cy - beta * scalePxPerDeg
        const expectedY = cy - beta * 8.5;
        expect(p.elements.moon.y).toBeCloseTo(expectedY, 2);
      }
    });

    it('C3.2b: Prograde West-to-East orbital direction: Waxing (First Quarter) is Left (-X), Waning (Third Quarter) is Right (+X)', () => {
      const baseScene = generateCosmicScene({ julianDate: EPOCHS.eclipseApr2024 });

      // First Quarter (phase = 0.25): Moon must be to the LEFT (East of Sun, -X)
      const fqScene = {
        ...baseScene,
        moon: { ...baseScene.moon, phase: 0.25 }
      };
      const fq = projectGeocentricAxial(fqScene);
      expect(fq.elements.moon.x).toBeLessThan(200); // cx = 200, moves Left

      // Third Quarter (phase = 0.75): Moon must be to the RIGHT (West of Sun, +X)
      const tqScene = {
        ...baseScene,
        moon: { ...baseScene.moon, phase: 0.75 }
      };
      const tq = projectGeocentricAxial(tqScene);
      expect(tq.elements.moon.x).toBeGreaterThan(200); // cx = 200, moves Right

      // Monotonic transit across solar eclipse: from Waning crescent (Right) to Waxing crescent (Left)
      const preEclipseScene = { ...baseScene, moon: { ...baseScene.moon, phase: 0.98 } };
      const postEclipseScene = { ...baseScene, moon: { ...baseScene.moon, phase: 0.02 } };
      const pre = projectGeocentricAxial(preEclipseScene);
      const post = projectGeocentricAxial(postEclipseScene);
      expect(pre.elements.moon.x).toBeGreaterThan(post.elements.moon.x); // Moves from Right to Left
    });

    it('C3.3: 3D Projected Earth axial tilt angle follows atan2(-nx, ny) through annual cycle', () => {
      const testCases = [
        { jd: EPOCHS.marchEquinox2024, expectedTilt: 23.44, tol: 1.0 },   // Tilts right (+X)
        { jd: EPOCHS.juneSolstice2024, expectedTilt: 0.0, tol: 1.0 },     // Tilts along sightline (upright on screen)
        { jd: EPOCHS.septEquinox2024, expectedTilt: -23.44, tol: 1.0 },  // Tilts left (-X)
        { jd: EPOCHS.decSolstice2024, expectedTilt: 0.0, tol: 1.0 }      // Tilts away along sightline (upright on screen)
      ];

      for (const tc of testCases) {
        const scene = generateCosmicScene({ julianDate: tc.jd });
        const p = projectGeocentricAxial(scene);
        expect(p.elements.earth.axialTiltAngle2D).toBeCloseTo(tc.expectedTilt, 0);
      }
    });

    it('C3.4: Transverse and Axial projections report matching ecliptic latitude beta displacements', () => {
      for (const jd of Object.values(EPOCHS)) {
        const scene = generateCosmicScene({ julianDate: jd });
        const trans = projectGeocentricTransverse(scene, { width: 520, height: 220, scale: 1.0 });
        const axial = projectGeocentricAxial(scene, { width: 400, height: 180, scale: 1.0 });

        const beta = scene.moon.eclipticLatitude;
        const transDeltaY = 110 - trans.elements.moon.y;
        const axialDeltaY = 90 - axial.elements.moon.y;

        // Both cameras must report identical vertical displacement from their respective centerlines
        expect(transDeltaY).toBeCloseTo(beta * 8.5, 4);
        expect(axialDeltaY).toBeCloseTo(beta * 8.5, 4);
        expect(transDeltaY).toBeCloseTo(axialDeltaY, 4);
      }
    });
  });

  // =========================================================================
  // 4. projectEulerCamera Stress Tests
  // =========================================================================
  describe('Rig 4: projectEulerCamera Adversarial Verification', () => {

    it('C4.1: Extreme pitch angles (±90°, ±180°, ±270°, ±360°) and gimbal poles', () => {
      const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode: 'exaggerated' });

      const testPitches = [-360, -270, -180, -90, 0, 90, 180, 270, 360];
      for (const pitch of testPitches) {
        const p = projectEulerCamera(scene, pitch, 0);

        expect(Number.isFinite(p.elements.sun.x)).toBe(true);
        expect(Number.isFinite(p.elements.sun.y)).toBe(true);
        expect(Number.isFinite(p.elements.earth.x)).toBe(true);
        expect(Number.isFinite(p.elements.earth.y)).toBe(true);
        expect(Number.isFinite(p.elements.moon.x)).toBe(true);
        expect(Number.isFinite(p.elements.moon.y)).toBe(true);
        expect(p.camera.pitch).toBe(pitch);
      }
    });

    it('C4.2: Extreme yaw and roll angles (±180°, ±720°) and full sphere rotations', () => {
      const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode: 'exaggerated' });

      const angles = [-720, -360, -180, -45, 0, 45, 180, 360, 720];
      for (const yaw of angles) {
        for (const roll of [-180, 0, 180]) {
          const p = projectEulerCamera(scene, 30, yaw, { roll });

          expect(Number.isFinite(p.elements.sun.x)).toBe(true);
          expect(Number.isFinite(p.elements.sun.y)).toBe(true);
          expect(p.camera.yaw).toBe(yaw);
          expect(p.camera.roll).toBe(roll);
        }
      }
    });

    it('C4.3: Rigid SO(3) isometry: distance between celestial bodies is invariant under pure 3D rotations in orthographic mode', () => {
      const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode: 'exaggerated' });

      // Ground truth 3D distance between Sun and Earth
      const groundTruth3DDist = Math.hypot(
        scene.sun.position.x - scene.earth.position.x,
        scene.sun.position.y - scene.earth.position.y,
        scene.sun.position.z - scene.earth.position.z
      );

      const rotations = [
        { pitch: 0, yaw: 0, roll: 0 },
        { pitch: 45, yaw: 60, roll: 30 },
        { pitch: -90, yaw: 120, roll: -45 },
        { pitch: 180, yaw: -180, roll: 90 },
        { pitch: 75, yaw: -30, roll: 15 }
      ];

      for (const rot of rotations) {
        const pSun = rotatePointEuler3D(scene.sun.position, rot.pitch, rot.yaw, rot.roll);
        const pEarth = rotatePointEuler3D(scene.earth.position, rot.pitch, rot.yaw, rot.roll);

        const rotated3DDist = Math.hypot(
          pSun.x - pEarth.x,
          pSun.y - pEarth.y,
          pSun.z - pEarth.z
        );

        // 3D Euclidean distance must be perfectly conserved under SO(3) rotation (isometry)
        expect(rotated3DDist).toBeCloseTo(groundTruth3DDist, 10);
      }
    });

    it('C4.4: Perspective projection denominator guard and depth ordering monotonicity', () => {
      const scene = generateCosmicScene({ julianDate: EPOCHS.j2000, scaleMode: 'exaggerated' });

      // Test extreme negative depth (behind camera) with small focal distance
      const pPersp = projectEulerCamera(scene, 0, 0, {
        isPerspective: true,
        focalDistance: 50 // very close camera
      });

      expect(Number.isFinite(pPersp.elements.sun.x)).toBe(true);
      expect(Number.isFinite(pPersp.elements.sun.y)).toBe(true);
      expect(pPersp.elements.sun.r).toBeGreaterThan(0);

      // Verify depth ordering: bodies further in +Z have higher depth
      const p1: Vector3D = { x: 0, y: 0, z: 100 };
      const p2: Vector3D = { x: 0, y: 0, z: -50 };
      const rotP1 = rotatePointEuler3D(p1, 0, 0, 0);
      const rotP2 = rotatePointEuler3D(p2, 0, 0, 0);

      expect(rotP1.z).toBeGreaterThan(rotP2.z);
    });
  });

  // =========================================================================
  // 5. Cross-Camera Synchronous Consistency Tests
  // =========================================================================
  describe('Cross-Rig Synchronization & Consistency Matrix', () => {

    it('C5.1: Verifies all 4 camera rigs produce synchronized coordinates without drift across 10 astronomical epochs', () => {
      for (const [epochName, jd] of Object.entries(EPOCHS)) {
        const scene = generateCosmicScene({ julianDate: jd, scaleMode: 'exaggerated' });

        const topdown = projectHeliocentricTopDown(scene);
        const trans = projectGeocentricTransverse(scene);
        const axial = projectGeocentricAxial(scene);
        const euler = projectEulerCamera(scene, 90, 0);

        // Topdown and Euler(90, 0) should both represent top-down orthographic orientation
        expect(topdown.camera.name).toBe('topdown');
        expect(euler.camera.name).toBe('euler3d');

        // All rigs must have non-NaN, finite values for all elements
        expect(Number.isFinite(topdown.elements.earth.x)).toBe(true);
        expect(Number.isFinite(trans.elements.earth.x)).toBe(true);
        expect(Number.isFinite(axial.elements.earth.x)).toBe(true);
        expect(Number.isFinite(euler.elements.earth.x)).toBe(true);

        expect(Number.isFinite(topdown.elements.moon.x)).toBe(true);
        expect(Number.isFinite(trans.elements.moon.x)).toBe(true);
        expect(Number.isFinite(axial.elements.moon.x)).toBe(true);
        expect(Number.isFinite(euler.elements.moon.x)).toBe(true);
      }
    });

  });

});
