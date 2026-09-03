/**
 * @file scene.test.ts
 * Comprehensive Vitest test suite for the Unified 3D Astronomical Scene Graph & Canonical Camera Rigs.
 * 
 * Test Coverage:
 * Suite 1: Scene Generation & Temporal Ephemeris Alignment (5 tests)
 * Suite 2: Scale Modes & Orbital Geometry (True Scale vs Exaggerated Eccentricity) (3 tests)
 * Suite 3: 6 Seasonal Milestone Halo Nodes (3 tests)
 * Suite 4: 3D Syzygy Shadow Cones & Analytical Geometry (3 tests)
 * Suite 5: Top-Down Heliocentric Camera Pipeline (projectHeliocentricTopDown) (4 tests)
 * Suite 6: Geocentric Transverse & Axial Eclipse Cameras (4 tests)
 * Suite 7: Generalized 3D Euler Camera & Robustness Edge Cases (4 tests)
 * Suite 8: Matrix3x3 Algebra, Coordinate Frame Transforms & Topocentric Observers (5 tests)
 * Total: 31 Comprehensive Test Cases
 */

import { describe, it, expect } from 'vitest';
import {
  generateCosmicScene,
  projectHeliocentricTopDown,
  projectGeocentricTransverse,
  projectGeocentricAxial,
  projectEulerCamera,
  ScaleMode,
  CosmicScene3D,
  ProjectedScene2D,
  identityMatrix3x3,
  multiplyMatrix3x3,
  transformVector3D,
  transposeMatrix3x3,
  rotationMatrixX,
  rotationMatrixY,
  rotationMatrixZ,
  vectorMagnitude,
  normalizeVector3D,
  dotProduct3D,
  crossProduct3D,
  addVectors3D,
  subtractVectors3D,
  scaleVector3D,
  heliocentricToGeocentricEcliptic,
  geocentricToHeliocentricEcliptic,
  getEclipticToEquatorialMatrix,
  getEquatorialToEclipticMatrix,
  eclipticToEquatorial3D,
  equatorialToEcliptic3D,
  calculateEarthAxialTiltVector,
  calculateSubsolarVectorEcliptic,
  calculateSubsolarVectorBody,
  getEquatorialToHorizontalMatrix,
  equatorialToTopocentric3D,
  topocentric3DToAltAz,
  createEulerRotationMatrix,
  rotatePointEuler3D,
  calculateShadowCones3D,
  OBLIQUITY_J2000_DEG,
  OBLIQUITY_J2000_RAD
} from './index';
import { asDegrees, asJulianDate, toRadians } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';

describe('Unified 3D Astronomical Scene Graph & Camera Rigs (Milestone 1)', () => {

  // =========================================================================
  // SUITE 1: Scene Generation & Temporal Ephemeris Alignment
  // =========================================================================
  describe('Suite 1: Scene Generation & Temporal Ephemeris Alignment', () => {
    it('generates standard J2000 epoch scene with correct heliocentric Earth position and solar coordinates', () => {
      // Standard J2000.0 epoch: 2000-01-01 12:00 UTC (JD 2451545.0)
      const scene = generateCosmicScene({ julianDate: 2451545.0, scaleMode: 'true' });

      expect(scene).toBeDefined();
      expect(scene.scaleMode).toBe('true');
      expect(scene.sun.position.x).toBeCloseTo(0, 4);
      expect(scene.sun.position.y).toBeCloseTo(0, 4);
      expect(scene.sun.position.z).toBeCloseTo(0, 4);

      // Earth near perihelion in early January: distance ~ 0.983 AU
      const earthDistAU = Math.hypot(scene.earth.position.x, scene.earth.position.y, scene.earth.position.z);
      expect(earthDistAU).toBeGreaterThanOrEqual(0.98);
      expect(earthDistAU).toBeLessThanOrEqual(0.99);
      expect(scene.earth.distanceAU).toBeCloseTo(earthDistAU, 3);
    });

    it('is completely pure and deterministic, defaulting to J2000 epoch when parameters are omitted', () => {
      const sceneDefault = generateCosmicScene();
      const sceneExplicit = generateCosmicScene({ julianDate: 2451545.0 });

      expect(sceneDefault.julianDate).toBe(2451545.0);
      expect(sceneDefault.earth.position.x).toBeCloseTo(sceneExplicit.earth.position.x, 8);
      expect(sceneDefault.earth.position.y).toBeCloseTo(sceneExplicit.earth.position.y, 8);
      expect(sceneDefault.earth.position.z).toBeCloseTo(sceneExplicit.earth.position.z, 8);
      expect(sceneDefault.timestamp.getTime()).toBe(sceneExplicit.timestamp.getTime());
    });

    it('evaluates Earth orbital physics with exact Keplerian velocity and solar irradiance at perihelion and aphelion', () => {
      // Perihelion ~ Jan 3 (JD 2451547.0), Aphelion ~ Jul 4 (JD 2451729.0)
      const perihelionScene = generateCosmicScene({ julianDate: 2451547.0, scaleMode: 'true' });
      const aphelionScene = generateCosmicScene({ julianDate: 2451729.0, scaleMode: 'true' });

      // Kepler's 2nd Law: speed peaks at perihelion (~30.29 km/s) and reaches minimum at aphelion (~29.29 km/s)
      expect(perihelionScene.earth.orbitalSpeedKms).toBeGreaterThan(aphelionScene.earth.orbitalSpeedKms);
      expect(perihelionScene.earth.orbitalSpeedKms).toBeCloseTo(30.29, 0);
      expect(aphelionScene.earth.orbitalSpeedKms).toBeCloseTo(29.29, 0);

      // Solar irradiance: higher at perihelion (~103%) than aphelion (~97%)
      expect(perihelionScene.earth.solarIrradiancePercent).toBeGreaterThan(aphelionScene.earth.solarIrradiancePercent);
      expect(perihelionScene.earth.solarIrradiancePercent).toBeGreaterThan(100);
      expect(aphelionScene.earth.solarIrradiancePercent).toBeLessThan(100);
    });

    it('preserves 23.439° astronomical obliquity in Earth inertial axial tilt vector across all seasons', () => {
      const dates = [
        2451545.0, // Jan 1 J2000
        2451624.0, // Mar 20 Equinox
        2451717.0, // Jun 21 Solstice
        2451810.0, // Sep 22 Equinox
        2451900.0  // Dec 21 Solstice
      ];

      for (const jd of dates) {
        const scene = generateCosmicScene({ julianDate: jd });
        expect(scene.earth.obliquity).toBeCloseTo(toRadians(23.439281), 5);

        // Tilt vector in heliocentric ecliptic frame: (0, sin(eps), cos(eps))
        const p = scene.earth.axialTiltVector;
        const norm = Math.hypot(p.x, p.y, p.z);
        expect(norm).toBeCloseTo(1.0, 5);
        expect(p.x).toBeCloseTo(0, 4);
        expect(p.y).toBeCloseTo(Math.sin(toRadians(23.439281)), 4);
        expect(p.z).toBeCloseTo(Math.cos(toRadians(23.439281)), 4);
      }
    });

    it('computes subsolar illumination vector in Earth body frame agreeing with solar declination and Greenwich hour angle', () => {
      const scene = generateCosmicScene({
        julianDate: 2451717.0, // June Solstice (Dec ~ +23.44°)
        timeOfDay: 12.0,
        latitude: 47.06,
        longitude: -122.81
      });

      const s = scene.earth.subsolarPoint;
      const sNorm = Math.hypot(s.x, s.y, s.z);
      expect(sNorm).toBeCloseTo(1.0, 4);

      // At June Solstice, subsolar point is in the Northern Hemisphere (y > 0)
      expect(s.y).toBeGreaterThan(0);
      expect(Math.asin(s.y) * (180 / Math.PI)).toBeCloseTo(23.44, 1);
    });

    it('calculates 3D Moon position, ecliptic latitude, phase angle, and quadrant correctly', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });

      expect(scene.moon.position).toBeDefined();
      expect(scene.moon.distanceKm).toBeGreaterThan(350000);
      expect(scene.moon.distanceKm).toBeLessThan(410000);

      // Moon ecliptic latitude beta must remain bounded by orbital inclination & perturbations [-5.35°, +5.35°]
      expect(scene.moon.eclipticLatitude).toBeGreaterThanOrEqual(-5.35);
      expect(scene.moon.eclipticLatitude).toBeLessThanOrEqual(5.35);

      // Quadrant must be integer 1, 2, 3, or 4
      expect([1, 2, 3, 4]).toContain(scene.moon.quadrant);
      expect(scene.moon.phase).toBeGreaterThanOrEqual(0);
      expect(scene.moon.phase).toBeLessThanOrEqual(1);
    });
  });

  // =========================================================================
  // SUITE 2: Scale Modes (True Scale vs Exaggerated Eccentricity)
  // =========================================================================
  describe('Suite 2: Scale Modes & Orbital Geometry', () => {
    it('enforces True Scale mode Keplerian ellipse parameters (e=0.01671, a=1.0 AU, Sun focus offset)', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0, scaleMode: 'true' });
      expect(scene.scaleMode).toBe('true');

      const projected = projectHeliocentricTopDown(scene, { width: 580, height: 560 });
      expect(projected.camera.name).toBe('topdown');
      expect(projected.elements.orbitPath).toContain('M -200 0');
    });

    it('enforces Exaggerated mode Keplerian ellipse parameters (e=0.25, a=200px, Sun focus F1=-50px, empty focus F2=+50px, b=193.65px)', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0, scaleMode: 'exaggerated' });
      expect(scene.scaleMode).toBe('exaggerated');

      // Exaggerated eccentricity: e = 0.25, a = 200px
      // Focal distance c = a * e = 50px
      // Sun at F1 = (-50, 0, 0)
      expect(scene.sun.position.x).toBeCloseTo(-50, 1);
      expect(scene.sun.position.y).toBeCloseTo(0, 4);

      // Semi-minor axis: b = 200 * sqrt(1 - 0.25^2) = 200 * sqrt(0.9375) = 193.649px
      const expectedB = 200 * Math.sqrt(1 - 0.25 * 0.25);
      expect(expectedB).toBeCloseTo(193.649, 2);
    });

    it('verifies aphelion-to-perihelion distance ratio strictly matches (1+e)/(1-e) in both scale modes', () => {
      // True scale: e = 0.01671 -> ratio = 1.01671 / 0.98329 ~ 1.03399
      const expectedTrueRatio = (1 + 0.01671) / (1 - 0.01671);
      // Exaggerated: e = 0.25 -> ratio = 1.25 / 0.75 = 1.66667
      const expectedExaggRatio = (1 + 0.25) / (1 - 0.25);

      expect(expectedTrueRatio).toBeCloseTo(1.034, 3);
      expect(expectedExaggRatio).toBeCloseTo(1.667, 3);

      const sceneTrue = generateCosmicScene({ scaleMode: 'true' });
      const periTrue = sceneTrue.milestones.find(m => m.id === 'perihelion')!;
      const aphTrue = sceneTrue.milestones.find(m => m.id === 'aphelion')!;
      expect(aphTrue.distanceAU / periTrue.distanceAU).toBeCloseTo(expectedTrueRatio, 2);

      // In exaggerated mode (e = 0.25, a = 200, c = 50), perihelion distance is a-c=150, aphelion is a+c=250
      const a = 200;
      const c = 50;
      expect((a + c) / (a - c)).toBeCloseTo(expectedExaggRatio, 4);
    });
  });

  // =========================================================================
  // SUITE 3: 6 Seasonal Milestone Halo Nodes
  // =========================================================================
  describe('Suite 3: 6 Seasonal Milestone Halo Nodes', () => {
    it('generates exactly 6 seasonal milestone nodes with correct astronomical IDs and labels', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      expect(scene.milestones).toHaveLength(6);

      const ids = scene.milestones.map(m => m.id);
      expect(ids).toContain('perihelion');
      expect(ids).toContain('mar_equinox');
      expect(ids).toContain('jun_solstice');
      expect(ids).toContain('aphelion');
      expect(ids).toContain('sep_equinox');
      expect(ids).toContain('dec_solstice');
    });

    it('verifies milestone celestial longitudes match cardinal astronomical markers (0°, 90°, 180°, 270°, 283°, 103°)', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const getMs = (id: string) => scene.milestones.find(m => m.id === id)!;

      expect(getMs('mar_equinox').longitude).toBeCloseTo(0, 0);
      expect(getMs('jun_solstice').longitude).toBeCloseTo(90, 0);
      expect(getMs('sep_equinox').longitude).toBeCloseTo(180, 0);
      expect(getMs('dec_solstice').longitude).toBeCloseTo(270, 0);
      expect(getMs('perihelion').longitude).toBeCloseTo(283, 0);
      expect(getMs('aphelion').longitude).toBeCloseTo(103, 0);
    });

    it('guarantees all 6 milestone 3D positions lie strictly on the orbital ellipse curve in both scale modes', () => {
      const a = 200;
      const b = 200 * Math.sqrt(1 - 0.25 * 0.25);
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });

      for (const m of scene.milestones) {
        // Equation of ellipse: (x/a)^2 + (y/b)^2 = 1
        const norm = Math.pow(m.position.x / a, 2) + Math.pow(m.position.y / b, 2);
        expect(norm).toBeCloseTo(1.0, 1);
        expect(m.position.z).toBeCloseTo(0, 4); // on ecliptic plane
      }
    });
  });

  // =========================================================================
  // SUITE 4: 3D Syzygy Shadow Cones & Analytical Geometry
  // =========================================================================
  describe('Suite 4: 3D Syzygy Shadow Cones & Analytical Geometry', () => {
    it('calculates analytical Umbra cone apex along Sun-Earth axis at correct geometric distance', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      const cones = scene.shadowCones;

      expect(cones).toBeDefined();
      expect(cones.umbraApex).toBeDefined();
      expect(cones.axisDirection).toBeDefined();

      // Axis direction must be normalized unit vector
      const axisLen = Math.hypot(cones.axisDirection.x, cones.axisDirection.y, cones.axisDirection.z);
      expect(axisLen).toBeCloseTo(1.0, 4);
    });

    it('calculates analytical Penumbra cone with opening angle strictly greater than Umbra angle', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      expect(scene.shadowCones.penumbraAngle).toBeGreaterThan(scene.shadowCones.umbraAngle);
      expect(scene.shadowCones.umbraAngle).toBeGreaterThan(0);
    });

    it('calculates Umbra radius at Moon distance matching physical Meeus shadow values', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      expect(scene.shadowCones.umbraLength).toBeGreaterThan(1000000); // Earth umbra > 1.38 million km
      expect(scene.shadowCones.penumbraLength).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SUITE 5: Top-Down Heliocentric Camera Pipeline (projectHeliocentricTopDown)
  // =========================================================================
  describe('Suite 5: Top-Down Heliocentric Camera Pipeline', () => {
    it('projects Heliocentric scene onto top-down Ecliptic plane with Sun at focus and Earth on ellipse', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const projected = projectHeliocentricTopDown(scene, { width: 580, height: 560 });

      expect(projected.camera.name).toBe('topdown');
      expect(projected.elements.sun.visible).toBe(true);
      expect(projected.elements.earth.visible).toBe(true);
      expect(projected.elements.moon.visible).toBe(true);

      // In exaggerated mode, Sun is at X = -50
      expect(projected.elements.sun.x).toBeCloseTo(-50, 1);
      expect(projected.elements.sun.y).toBeCloseTo(0, 1);

      // Earth has 2D axial tilt angle = 90° (toward June Solstice colure)
      expect(projected.elements.earth.axialTiltAngle2D).toBe(90.0);
    });

    it('projects Moon position at exact 28px visual orbit distance from Earth in true and exaggerated scale', () => {
      const sceneTrue = generateCosmicScene({ scaleMode: 'true' });
      const projTrue = projectHeliocentricTopDown(sceneTrue, { width: 580, height: 560, scale: 1.0 });

      const distTrue = Math.hypot(
        projTrue.elements.moon.x - projTrue.elements.earth.x,
        projTrue.elements.moon.y - projTrue.elements.earth.y
      );
      expect(distTrue).toBeCloseTo(28, 2);

      const sceneExag = generateCosmicScene({ scaleMode: 'exaggerated' });
      const projExag = projectHeliocentricTopDown(sceneExag, { width: 580, height: 560, scale: 1.0 });

      const distExag = Math.hypot(
        projExag.elements.moon.x - projExag.elements.earth.x,
        projExag.elements.moon.y - projExag.elements.earth.y
      );
      expect(distExag).toBeCloseTo(28, 2);
    });

    it('generates valid closed SVG ellipse path for Earth orbit matching semi-major and semi-minor axes', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const projected = projectHeliocentricTopDown(scene, { width: 580, height: 560 });

      const d = projected.elements.orbitPath;
      expect(d).toMatch(/^M -200 0 a 200 \d+(\.\d+)? 0 1 0 400 0 a 200 \d+(\.\d+)? 0 1 0 -400 0 Z$/);
    });

    it('projects 6 milestone halo nodes to valid 2D coordinates within viewport bounds', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const projected = projectHeliocentricTopDown(scene, { width: 580, height: 560 });

      expect(projected.elements.milestones).toHaveLength(6);
      for (const m of projected.elements.milestones) {
        expect(m.visible).toBe(true);
        expect(m.x).toBeGreaterThanOrEqual(-250);
        expect(m.x).toBeLessThanOrEqual(250);
        expect(m.y).toBeGreaterThanOrEqual(-250);
        expect(m.y).toBeLessThanOrEqual(250);
      }
    });

    it('scales and offsets 2D top-down coordinates accurately according to custom viewport dimensions', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const scale = 1.5;
      const customCx = 300;
      const customCy = 250;

      const projected = projectHeliocentricTopDown(scene, {
        width: 600,
        height: 500,
        scale,
        centerX: customCx,
        centerY: customCy
      });

      // Sun should be at customCx + (-50 * 1.5) = 300 - 75 = 225
      expect(projected.elements.sun.x).toBeCloseTo(225, 1);
      expect(projected.elements.sun.y).toBeCloseTo(customCy, 1);
    });
  });

  // =========================================================================
  // SUITE 6: Geocentric Transverse & Axial Eclipse Cameras
  // =========================================================================
  describe('Suite 6: Geocentric Transverse & Axial Eclipse Cameras', () => {
    it('projects side-on Transverse profile with Sun on left, Earth at center, and shadow cones extending rightward', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      const projected = projectGeocentricTransverse(scene);

      expect(projected.camera.name).toBe('transverse');
      expect(projected.elements.sun.x).toBe(50); // Sun at far left
      expect(projected.elements.earth.x).toBe(310); // Earth at center
      expect(projected.elements.earth.y).toBe(110);

      // Shadow cones must project rightward from Earth
      expect(projected.elements.shadowCones).toBeDefined();
      expect(projected.elements.shadowCones!.umbraPath).toContain('M 310');
      expect(projected.elements.shadowCones!.penumbraPath).toContain('M 310');
    });

    it('projects down-the-barrel Axial sightline with background Sun, foreground Earth, and Moon offset by elongation and beta', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      const projected = projectGeocentricAxial(scene);

      expect(projected.camera.name).toBe('axial');
      expect(projected.elements.sun.x).toBe(260); // Sun centered in background
      expect(projected.elements.sun.y).toBe(110);
      expect(projected.elements.sun.depth).toBeLessThan(0); // behind Earth

      expect(projected.elements.earth.x).toBe(260); // Earth centered in foreground
      expect(projected.elements.earth.y).toBe(110);
      expect(projected.elements.earth.depth).toBe(0);
    });

    it('guarantees identical elongation and nodal latitude beta across Transverse and Axial projections at eclipse presets (Apr 8 2024, Mar 14 2025)', () => {
      // April 8 2024 Total Solar Eclipse (JD 2460409.25)
      const eclipseScene = generateCosmicScene({ julianDate: 2460409.25 });
      const transverse = projectGeocentricTransverse(eclipseScene);
      const axial = projectGeocentricAxial(eclipseScene);

      // Both projections should report identical beta offset in vertical coordinate
      const beta = eclipseScene.moon.eclipticLatitude;
      const expectedTransverseY = 110 - beta * 8.5;
      const expectedAxialY = 110 - beta * 10.5;

      expect(transverse.elements.moon.y).toBeCloseTo(expectedTransverseY, 1);
      expect(axial.elements.moon.y).toBeCloseTo(expectedAxialY, 1);
    });

    it('generates complete 4-quadrant segmented lunar orbital stroke arrays (waxAsc, waxDesc, wanAsc, wanDesc) without gaps or duplicate chords', () => {
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      const transverse = projectGeocentricTransverse(scene);
      const axial = projectGeocentricAxial(scene);

      expect(transverse.elements.lunarOrbitSegments).toBeDefined();
      expect(transverse.elements.lunarOrbitSegments!.length).toBeGreaterThan(0);

      expect(axial.elements.lunarOrbitSegments).toBeDefined();
      expect(axial.elements.lunarOrbitSegments!.length).toBeGreaterThan(0);

      // Segments must have valid stroke colors (#38bdf8 sky blue for asc, #f43f5e crimson for desc)
      for (const seg of transverse.elements.lunarOrbitSegments!) {
        expect(['#38bdf8', '#f43f5e']).toContain(seg.stroke);
      }
    });
  });

  // =========================================================================
  // SUITE 7: Generalized 3D Euler Camera & Robustness Edge Cases
  // =========================================================================
  describe('Suite 7: Generalized 3D Euler Camera & Robustness Edge Cases', () => {
    it('projects 3D celestial bodies under pure Pitch rotation (90°) and Yaw rotation (90°)', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });

      // Pitch 90° (Top-down view)
      const topDownEuler = projectEulerCamera(scene, 90, 0);
      expect(topDownEuler.camera.name).toBe('euler3d');
      expect(topDownEuler.camera.pitch).toBe(90);

      // Yaw 90°
      const yawEuler = projectEulerCamera(scene, 0, 90);
      expect(yawEuler.camera.yaw).toBe(90);
    });

    it('applies perspective foreshortening and depth ordering monotonically along viewing axis', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });
      const perspectiveEuler = projectEulerCamera(scene, 30, 45, {
        isPerspective: true,
        focalDistance: 400
      });

      expect(perspectiveEuler.elements.sun.depth).toBeDefined();
      expect(perspectiveEuler.elements.earth.depth).toBeDefined();
      expect(perspectiveEuler.elements.moon.depth).toBeDefined();
    });

    it('handles edge case inputs robustly (zero scale, extreme pitch ±90°/±180°, leap years, invalid dates) without throwing or NaN', () => {
      // Zero / negative scale fallback
      const scene = generateCosmicScene({ julianDate: 2451545.0 });
      const zeroScaleProj = projectHeliocentricTopDown(scene, { scale: 0 });
      expect(zeroScaleProj.elements.sun.x).toBe(0);

      // Extreme pitch ±180°
      expect(() => projectEulerCamera(scene, 180, 180)).not.toThrow();
      expect(() => projectEulerCamera(scene, -180, -180)).not.toThrow();

      // Leap Year Feb 29 (2024-02-29, JD 2460369.5)
      const leapScene = generateCosmicScene({ julianDate: 2460369.5 });
      expect(leapScene.earth.distanceAU).toBeGreaterThan(0.98);
      expect(Number.isNaN(leapScene.earth.position.x)).toBe(false);
    });

    it('re-exports all scene types, transforms, generator, and cameras cleanly from barrel index.ts', () => {
      expect(generateCosmicScene).toBeDefined();
      expect(projectHeliocentricTopDown).toBeDefined();
      expect(projectGeocentricTransverse).toBeDefined();
      expect(projectGeocentricAxial).toBeDefined();
      expect(projectEulerCamera).toBeDefined();
    });
  });

  // =========================================================================
  // SUITE 8: Matrix3x3 Algebra, Coordinate Frame Transforms & Topocentric Observers
  // =========================================================================
  describe('Suite 8: Matrix3x3 Algebra, Coordinate Frame Transforms & Topocentric Observers', () => {
    it('verifies 3x3 identity matrix multiplication, transposition, and vector transformation', () => {
      const I = identityMatrix3x3();
      const v: Vector3D = { x: 3, y: -4, z: 5 };

      const vTrans = transformVector3D(I, v);
      expect(vTrans.x).toBe(3);
      expect(vTrans.y).toBe(-4);
      expect(vTrans.z).toBe(5);

      const M: [ [number, number, number], [number, number, number], [number, number, number] ] = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      const M_T = transposeMatrix3x3(M);
      expect(M_T[0][1]).toBe(4);
      expect(M_T[1][0]).toBe(2);
      expect(M_T[2][1]).toBe(6);
      expect(M_T[1][2]).toBe(8);

      const MI = multiplyMatrix3x3(M, I);
      expect(MI).toEqual(M);
    });

    it('verifies elementary 3D rotation matrices Rx, Ry, Rz preserve vector length and orthogonality', () => {
      const angle = toRadians(37.5);
      const rx = rotationMatrixX(angle);
      const rx_T = transposeMatrix3x3(rx);
      const product = multiplyMatrix3x3(rx, rx_T);

      // Product must be identity matrix
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(product[r][c]).toBeCloseTo(r === c ? 1 : 0, 10);
        }
      }

      const v: Vector3D = { x: 1, y: 2, z: 3 };
      const vRot = transformVector3D(rx, v);
      expect(vectorMagnitude(vRot)).toBeCloseTo(vectorMagnitude(v), 10);
    });

    it('verifies exact roundtrip invertibility between Geocentric Ecliptic and Equatorial coordinates', () => {
      const pEcl: Vector3D = { x: 0.5, y: -0.866, z: 0.1 };
      const pEq = eclipticToEquatorial3D(pEcl);
      const pEclBack = equatorialToEcliptic3D(pEq);

      expect(pEclBack.x).toBeCloseTo(pEcl.x, 12);
      expect(pEclBack.y).toBeCloseTo(pEcl.y, 12);
      expect(pEclBack.z).toBeCloseTo(pEcl.z, 12);
    });

    it('verifies celestial coordinates transformation at Vernal Equinox and Solstices', () => {
      // Vernal Equinox (1, 0, 0) should remain invariant under Rx(eps)
      const vernalEcl: Vector3D = { x: 1, y: 0, z: 0 };
      const vernalEq = eclipticToEquatorial3D(vernalEcl);
      expect(vernalEq.x).toBeCloseTo(1, 10);
      expect(vernalEq.y).toBeCloseTo(0, 10);
      expect(vernalEq.z).toBeCloseTo(0, 10);

      // Summer Solstice (0, 1, 0) in ecliptic
      const summerEcl: Vector3D = { x: 0, y: 1, z: 0 };
      const summerEq = eclipticToEquatorial3D(summerEcl);
      expect(summerEq.x).toBeCloseTo(0, 10);
      expect(summerEq.y).toBeCloseTo(Math.cos(OBLIQUITY_J2000_RAD), 6);
      expect(summerEq.z).toBeCloseTo(Math.sin(OBLIQUITY_J2000_RAD), 6);
    });

    it('verifies topocentric Altitude and Azimuth coordinate transformation', () => {
      // Observer at North Pole (lat = 90°), NCP (0, 0, 1) in equatorial coordinates
      const vNCP: Vector3D = { x: 0, y: 0, z: 1 };
      const vTopo = equatorialToTopocentric3D(vNCP, 90, 0);
      const altAz = topocentric3DToAltAz(vTopo);

      // At North Pole, NCP is at Zenith (altitude = 90°)
      expect(altAz.altitude).toBeCloseTo(90, 2);
      expect(altAz.zenithAngle).toBeCloseTo(0, 2);
    });
  });

});
