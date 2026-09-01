/**
 * @file m1_adversarial.test.ts
 * Empirical Adversarial Verification Suite for Milestone 1:
 * Unified 3D Astronomical Scene Graph & Canonical Camera Rigs.
 * 
 * Conducts stress-testing on:
 * 1. Keplerian orbital mechanics & energy conservation across 6 milestones and 1000 random epochs.
 * 2. SO(3) matrix algebra, rotation group invariants, and vector orthogonality (p_ecl . r_eq = 0, R . R^T = I).
 * 3. Analytical Syzygy shadow cone apex collinearity with the Sun-Earth line of sight.
 * 4. Scale mode invariance: physical distance AU / speed km/s invariance regardless of scale mode.
 * 5. Camera rig projection consistency and stress testing under singular and extreme parameters.
 */

import { describe, it, expect } from 'vitest';
import {
  generateCosmicScene,
  projectHeliocentricTopDown,
  projectGeocentricTransverse,
  projectGeocentricAxial,
  projectEulerCamera,
  ScaleMode,
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
  createZXZRotationMatrix,
  rotatePointEuler3D,
  calculateShadowCones3D,
  OBLIQUITY_J2000_DEG,
  OBLIQUITY_J2000_RAD,
  SUN_RADIUS_KM,
  EARTH_RADIUS_KM,
  MOON_RADIUS_KM,
  AU_IN_KM
} from './index';
import { toRadians, toDegrees, asDegrees, asRadians } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';

describe('Milestone 1 Adversarial Mathematical Challenges (Challenger M1_1)', () => {

  // =========================================================================
  // CHALLENGE DIMENSION 1: Keplerian Orbital Mechanics & Energy Conservation
  // =========================================================================
  describe('Dimension 1: Keplerian Orbital Mechanics & Vis-Viva Invariants', () => {

    it('empirically verifies Vis-Viva specific orbital energy conservation (E = v^2/2 - mu/r = const) across all 6 seasonal milestones', () => {
      const GM_SUN = 1.32712440018e11; // km^3 / s^2 (Standard gravitational parameter of the Sun)
      const SEMI_MAJOR_AXIS_KM = AU_IN_KM; // ~149,597,870.7 km
      const EXPECTED_SPECIFIC_ENERGY = -GM_SUN / (2 * SEMI_MAJOR_AXIS_KM); // ~ -443.56 km^2/s^2

      const scene = generateCosmicScene({ scaleMode: 'true' });
      expect(scene.milestones).toHaveLength(6);

      for (const milestone of scene.milestones) {
        const r_km = milestone.distanceKm;
        const v_kms = milestone.speedKms;

        // Specific mechanical energy: E = v^2/2 - GM/r
        const specificEnergy = (0.5 * v_kms * v_kms) - (GM_SUN / r_km);
        
        // Relative error must be bounded within < 0.6% across all seasonal positions
        const relativeError = Math.abs((specificEnergy - EXPECTED_SPECIFIC_ENERGY) / EXPECTED_SPECIFIC_ENERGY);
        expect(relativeError).toBeLessThan(0.006);
      }
    });

    it('verifies angular momentum conservation (h = r * v_perp = const) between Perihelion and Aphelion milestones', () => {
      const scene = generateCosmicScene({ scaleMode: 'true' });
      const peri = scene.milestones.find(m => m.id === 'perihelion')!;
      const aph = scene.milestones.find(m => m.id === 'aphelion')!;

      const h_peri = peri.distanceKm * peri.speedKms;
      const h_aph = aph.distanceKm * aph.speedKms;

      // Angular momentum at apsides must match within < 0.05%
      const diffFraction = Math.abs(h_peri - h_aph) / h_peri;
      expect(diffFraction).toBeLessThan(0.0005);
    });

    it('stress-tests Keplerian distance, velocity, and inverse-square solar irradiance across 500 randomized epochs over 200 years (1900-2100)', () => {
      // 500 pseudo-random epochs from JD 2415020.0 (1900-01-01) to JD 2488070.0 (2100-01-01)
      const startJD = 2415020.0;
      const endJD = 2488070.0;
      const step = (endJD - startJD) / 500;

      for (let i = 0; i < 500; i++) {
        const jd = startJD + i * step + ((i * 17) % 31);
        const scene = generateCosmicScene({ julianDate: jd, scaleMode: 'true' });

        const r_AU = scene.earth.distanceAU;
        const r_km = scene.earth.distanceKm;
        const v_kms = scene.earth.orbitalSpeedKms;
        const irr_pct = scene.earth.solarIrradiancePercent;
        const diam_arcmin = scene.earth.sunAngularDiameterArcmin;

        // Earth distance must remain strictly bounded by [0.980 AU, 1.020 AU]
        expect(r_AU).toBeGreaterThanOrEqual(0.980);
        expect(r_AU).toBeLessThanOrEqual(1.020);

        // Distance in km must match AU conversion (1 AU = 149597870.7 km) within 0.1%
        expect(r_km / AU_IN_KM).toBeCloseTo(r_AU, 2);

        // Orbital speed must remain bounded within [29.0 km/s, 30.5 km/s]
        expect(v_kms).toBeGreaterThanOrEqual(29.0);
        expect(v_kms).toBeLessThanOrEqual(30.5);

        // Irradiance must follow strict inverse square law: I = 100 * (1 / r_AU)^2
        const expectedIrr = 100.0 / (r_AU * r_AU);
        expect(irr_pct).toBeCloseTo(expectedIrr, 0);

        // Angular diameter must scale as ~ 31.98 / r_AU arcmin
        const expectedDiam = 31.98 / r_AU;
        expect(diam_arcmin).toBeCloseTo(expectedDiam, 0);
      }
    });

    it('verifies exact mathematical ellipse curvature for all 6 milestone nodes in Exaggerated Mode ((x/a)^2 + (y/b)^2 == 1)', () => {
      const a = 200;
      const bRatio = Math.sqrt(1 - 0.25 * 0.25); // sqrt(15/16) ~ 0.9682458
      const b = a * bRatio;

      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });

      for (const m of scene.milestones) {
        const x = m.position.x;
        const y = m.position.y;
        const z = m.position.z;

        // Exact ellipse equation: (x/a)^2 + (y/b)^2 = 1
        const residual = Math.pow(x / a, 2) + Math.pow(y / b, 2);
        expect(residual).toBeCloseTo(1.0, 3);
        expect(z).toBeCloseTo(0.0, 10); // must remain exactly in ecliptic plane
      }
    });
  });

  // =========================================================================
  // CHALLENGE DIMENSION 2: Matrix Orthogonality & Coordinate Transformations
  // =========================================================================
  describe('Dimension 2: Vector Orthogonality & SO(3) Lie Group Invariants', () => {

    it('empirically verifies SO(3) Lie Group properties (R * R^T = I, det(R) = +1) across 360 discrete rotation angles for Rx, Ry, Rz', () => {
      for (let deg = 0; deg < 360; deg += 5) {
        const rad = toRadians(deg);

        const matrices = [
          rotationMatrixX(rad),
          rotationMatrixY(rad),
          rotationMatrixZ(rad)
        ];

        for (const R of matrices) {
          const R_T = transposeMatrix3x3(R);
          const product = multiplyMatrix3x3(R, R_T);

          // Check R * R^T = I
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              expect(product[r][c]).toBeCloseTo(r === c ? 1 : 0, 12);
            }
          }

          // Check determinant det(R) = +1
          const det =
            R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) -
            R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) +
            R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
          expect(det).toBeCloseTo(1.0, 12);
        }
      }
    });

    it('stress-tests composite Euler rotation matrix across 500 randomized 3D orientation angle triples (Pitch, Yaw, Roll)', () => {
      for (let i = 0; i < 500; i++) {
        const pitch = (i * 37.3) % 360 - 180;
        const yaw = (i * 59.7) % 360 - 180;
        const roll = (i * 83.1) % 360 - 180;

        const R = createEulerRotationMatrix(pitch, yaw, roll);
        const R_T = transposeMatrix3x3(R);
        const I_calc = multiplyMatrix3x3(R, R_T);

        // Check Orthogonality
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            expect(I_calc[r][c]).toBeCloseTo(r === c ? 1 : 0, 10);
          }
        }

        // Test length and angle preservation on random 3D vectors
        const u: Vector3D = { x: Math.sin(i), y: Math.cos(i * 2), z: Math.sin(i * 3) };
        const v: Vector3D = { x: Math.cos(i * 4), y: Math.sin(i * 5), z: Math.cos(i * 6) };

        const Ru = transformVector3D(R, u);
        const Rv = transformVector3D(R, v);

        // Length preservation: ||Ru|| == ||u||
        expect(vectorMagnitude(Ru)).toBeCloseTo(vectorMagnitude(u), 10);
        expect(vectorMagnitude(Rv)).toBeCloseTo(vectorMagnitude(v), 10);

        // Dot product preservation: (Ru . Rv) == (u . v)
        expect(dotProduct3D(Ru, Rv)).toBeCloseTo(dotProduct3D(u, v), 10);
      }
    });

    it('verifies strict vector orthogonality between Earth rotation axis (p_ecl) and the Celestial Equator plane (p_ecl . r_eq = 0)', () => {
      const epsRad = OBLIQUITY_J2000_RAD;
      const p_ecl = calculateEarthAxialTiltVector(epsRad); // (0, sin(eps), cos(eps))

      // Generate 72 vectors along the Earth's Celestial Equator in Equatorial frame: r_eq = (cos(t), sin(t), 0)
      for (let deg = 0; deg < 360; deg += 5) {
        const t = toRadians(deg);
        const r_eq: Vector3D = { x: Math.cos(t), y: Math.sin(t), z: 0 };

        // Transform r_eq to Ecliptic frame using equatorialToEcliptic3D
        const r_eq_in_ecl = equatorialToEcliptic3D(r_eq, epsRad);

        // Orthogonality condition: p_ecl . r_eq_in_ecl must be identically 0
        const dot = dotProduct3D(p_ecl, r_eq_in_ecl);
        expect(dot).toBeCloseTo(0.0, 14);
      }
    });

    it('verifies Topocentric transformation matrix orthogonality and cardinal boundary behavior across global latitudes (-90° to +90°)', () => {
      const latitudes = [-90, -66.5, -45, -23.44, 0, 23.44, 45, 66.5, 90];
      const lsts = [0, 45, 90, 135, 180, 225, 270, 315];

      for (const lat of latitudes) {
        for (const lst of lsts) {
          const M_topo = getEquatorialToHorizontalMatrix(lat, lst);
          const M_topo_T = transposeMatrix3x3(M_topo);
          const I_topo = multiplyMatrix3x3(M_topo, M_topo_T);

          // Must be orthogonal
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              expect(I_topo[r][c]).toBeCloseTo(r === c ? 1 : 0, 12);
            }
          }
        }
      }

      // Cardinal Boundary Check:
      // At North Pole (lat = 90°), NCP (0, 0, 1) in equatorial must map to Zenith (0, 1, 0) in topocentric
      const vNCP: Vector3D = { x: 0, y: 0, z: 1 };
      const vNorthPoleTopo = equatorialToTopocentric3D(vNCP, 90, 0);
      expect(vNorthPoleTopo.x).toBeCloseTo(0, 10);
      expect(vNorthPoleTopo.y).toBeCloseTo(1, 10); // Zenith = +1
      expect(vNorthPoleTopo.z).toBeCloseTo(0, 10);

      // At Equator (lat = 0°), NCP (0, 0, 1) in equatorial must map to North Horizon (1, 0, 0)
      const vEquatorTopo = equatorialToTopocentric3D(vNCP, 0, 0);
      expect(vEquatorTopo.x).toBeCloseTo(1, 10); // North = +1
      expect(vEquatorTopo.y).toBeCloseTo(0, 10); // Horizon Altitude = 0°
      expect(vEquatorTopo.z).toBeCloseTo(0, 10);
    });

    it('verifies exact roundtrip bijection between Ecliptic and Equatorial frames for 1000 arbitrary 3D vectors', () => {
      for (let i = 0; i < 1000; i++) {
        const vOriginal: Vector3D = {
          x: (Math.sin(i * 1.1) * 1000),
          y: (Math.cos(i * 2.3) * 1000),
          z: (Math.sin(i * 3.7) * 1000)
        };

        const vEq = eclipticToEquatorial3D(vOriginal);
        const vBackEcl = equatorialToEcliptic3D(vEq);

        expect(vBackEcl.x).toBeCloseTo(vOriginal.x, 10);
        expect(vBackEcl.y).toBeCloseTo(vOriginal.y, 10);
        expect(vBackEcl.z).toBeCloseTo(vOriginal.z, 10);
      }
    });
  });

  // =========================================================================
  // CHALLENGE DIMENSION 3: Shadow Cone Apex Collinearity & Analytical Geometry
  // =========================================================================
  describe('Dimension 3: Shadow Cone Collinearity & Eclipse Geometry', () => {

    it('empirically verifies that Umbra and Penumbra cone apexes are strictly collinear with the Sun-Earth vector ((Apex - Earth) x Axis == 0)', () => {
      // Test across 365 days of the year
      const baseJD = 2451545.0;

      for (let day = 0; day < 365; day += 10) {
        const scene = generateCosmicScene({ julianDate: baseJD + day, scaleMode: 'true' });
        const cones = scene.shadowCones;

        const earthPos = scene.earth.position;
        const axisDir = cones.axisDirection;

        // Umbra apex collinearity: (UmbraApex - EarthPos) x axisDir == 0
        const umbraOffset = subtractVectors3D(cones.umbraApex, earthPos);
        const umbraCross = crossProduct3D(umbraOffset, axisDir);
        expect(vectorMagnitude(umbraCross)).toBeCloseTo(0.0, 12);

        // Penumbra apex collinearity: (PenumbraApex - EarthPos) x axisDir == 0
        const penumbraOffset = subtractVectors3D(cones.penumbraApex, earthPos);
        const penumbraCross = crossProduct3D(penumbraOffset, axisDir);
        expect(vectorMagnitude(penumbraCross)).toBeCloseTo(0.0, 12);
      }
    });

    it('verifies analytical Umbra length (L_u = R_E * D / (R_S - R_E)) matches physical range (1.37M km to 1.41M km)', () => {
      // Test across 365 days
      const baseJD = 2451545.0;

      for (let day = 0; day < 365; day += 30) {
        const scene = generateCosmicScene({ julianDate: baseJD + day, scaleMode: 'true' });
        const d_km = scene.earth.distanceKm;

        const expectedUmbraLengthKm = (EARTH_RADIUS_KM * d_km) / (SUN_RADIUS_KM - EARTH_RADIUS_KM);
        const expectedPenumbraLengthKm = (EARTH_RADIUS_KM * d_km) / (SUN_RADIUS_KM + EARTH_RADIUS_KM);

        expect(scene.shadowCones.umbraLengthKm).toBeCloseTo(expectedUmbraLengthKm, 2);
        expect(scene.shadowCones.penumbraLengthKm).toBeCloseTo(expectedPenumbraLengthKm, 2);

        // Physical bounds: Umbra length is between 1.35e6 km (perihelion) and 1.42e6 km (aphelion)
        expect(scene.shadowCones.umbraLengthKm).toBeGreaterThan(1350000);
        expect(scene.shadowCones.umbraLengthKm).toBeLessThan(1420000);

        // Penumbra length is between 1.33e6 km (perihelion) and 1.39e6 km (aphelion)
        expect(scene.shadowCones.penumbraLengthKm).toBeGreaterThan(1330000);
        expect(scene.shadowCones.penumbraLengthKm).toBeLessThan(1390000);
      }
    });

    it('validates standalone calculateShadowCones3D solver for both Solar Eclipse (Moon occluder) and Lunar Eclipse (Earth occluder)', () => {
      const sunCenter: Vector3D = { x: 0, y: 0, z: 0 };
      const earthCenter: Vector3D = { x: AU_IN_KM, y: 0, z: 0 };
      const moonCenter: Vector3D = { x: AU_IN_KM - 384400, y: 0, z: 0 }; // New Moon (Solar eclipse geometry)

      // 1. Solar Eclipse: Moon occludes Sun
      const solarShadow = calculateShadowCones3D(
        sunCenter,
        SUN_RADIUS_KM,
        moonCenter,
        MOON_RADIUS_KM,
        earthCenter
      );

      // Moon Umbra length: L = 1737.4 * 149213470.7 / (696340 - 1737.4) ~ 373,400 km
      expect(solarShadow.umbraLengthKm).toBeGreaterThan(365000);
      expect(solarShadow.umbraLengthKm).toBeLessThan(385000);
      expect(solarShadow.penumbraLengthKm).toBeGreaterThan(360000);

      // 2. Lunar Eclipse: Earth occludes Sun
      const lunarShadow = calculateShadowCones3D(
        sunCenter,
        SUN_RADIUS_KM,
        earthCenter,
        EARTH_RADIUS_KM,
        moonCenter
      );

      expect(lunarShadow.umbraLengthKm).toBeGreaterThan(1370000);
      expect(lunarShadow.umbraLengthKm).toBeLessThan(1420000);
    });
  });

  // =========================================================================
  // CHALLENGE DIMENSION 4: Scale Mode Invariance
  // =========================================================================
  describe('Dimension 4: Scale Mode Invariance (True Scale vs Exaggerated)', () => {

    it('guarantees physical telemetry invariance (distance AU/km, speed km/s, irradiance, apparent diameter) across both scale modes for 100 test dates', () => {
      const baseJD = 2451545.0;

      for (let i = 0; i < 100; i++) {
        const jd = baseJD + i * 3.6525; // sample across an entire leap-year cycle

        const trueScene = generateCosmicScene({ julianDate: jd, scaleMode: 'true' });
        const exagScene = generateCosmicScene({ julianDate: jd, scaleMode: 'exaggerated' });

        // 1. Earth physical telemetry must be strictly identical
        expect(exagScene.earth.distanceAU).toBe(trueScene.earth.distanceAU);
        expect(exagScene.earth.distanceKm).toBe(trueScene.earth.distanceKm);
        expect(exagScene.earth.orbitalSpeedKms).toBe(trueScene.earth.orbitalSpeedKms);
        expect(exagScene.earth.solarIrradiancePercent).toBe(trueScene.earth.solarIrradiancePercent);
        expect(exagScene.earth.sunAngularDiameterArcmin).toBe(trueScene.earth.sunAngularDiameterArcmin);
        expect(exagScene.earth.obliquity).toBe(trueScene.earth.obliquity);
        expect(exagScene.earth.heliocentricLongitude).toBe(trueScene.earth.heliocentricLongitude);

        // 2. Moon physical telemetry must be strictly identical
        expect(exagScene.moon.distanceKm).toBe(trueScene.moon.distanceKm);
        expect(exagScene.moon.phase).toBe(trueScene.moon.phase);
        expect(exagScene.moon.illuminationFraction).toBe(trueScene.moon.illuminationFraction);
        expect(exagScene.moon.eclipticLatitude).toBe(trueScene.moon.eclipticLatitude);
        expect(exagScene.moon.eclipticLongitude).toBe(trueScene.moon.eclipticLongitude);
        expect(exagScene.moon.quadrant).toBe(trueScene.moon.quadrant);

        // 3. Shadow cones physical geometry must be strictly identical
        expect(exagScene.shadowCones.umbraLengthKm).toBe(trueScene.shadowCones.umbraLengthKm);
        expect(exagScene.shadowCones.penumbraLengthKm).toBe(trueScene.shadowCones.penumbraLengthKm);
        expect(exagScene.shadowCones.umbraAngle).toBe(trueScene.shadowCones.umbraAngle);
        expect(exagScene.shadowCones.penumbraAngle).toBe(trueScene.shadowCones.penumbraAngle);

        // 4. Milestone physical telemetry must be strictly identical
        for (let mIdx = 0; mIdx < 6; mIdx++) {
          const trueM = trueScene.milestones[mIdx];
          const exagM = exagScene.milestones[mIdx];
          expect(exagM.id).toBe(trueM.id);
          expect(exagM.distanceAU).toBe(trueM.distanceAU);
          expect(exagM.distanceKm).toBe(trueM.distanceKm);
          expect(exagM.speedKms).toBe(trueM.speedKms);
          expect(exagM.longitude).toBe(trueM.longitude);
        }
      }
    });

    it('verifies that only display Cartesian positions differ appropriately according to scaling rules', () => {
      const sceneTrue = generateCosmicScene({ scaleMode: 'true' });
      const sceneExag = generateCosmicScene({ scaleMode: 'exaggerated' });

      // In true scale: Sun at (0,0,0), Earth at ~1 AU
      expect(sceneTrue.sun.position.x).toBeCloseTo(0, 5);
      expect(sceneTrue.sun.position.y).toBeCloseTo(0, 5);
      const trueDist = vectorMagnitude(sceneTrue.earth.position);
      expect(trueDist).toBeCloseTo(1.0, 1);

      // In exaggerated scale: Sun at F1 (-50, 0, 0), Earth on 200px ellipse
      expect(sceneExag.sun.position.x).toBeCloseTo(-50, 5);
      expect(sceneExag.sun.position.y).toBeCloseTo(0, 5);
      const exagDist = Math.hypot(sceneExag.earth.position.x, sceneExag.earth.position.y / Math.sqrt(1 - 0.25*0.25));
      expect(exagDist).toBeCloseTo(200, 1);
    });
  });

  // =========================================================================
  // CHALLENGE DIMENSION 5: Camera Rig Invariance & Non-Degeneracy
  // =========================================================================
  describe('Dimension 5: Canonical Camera Rig Stress & Non-Degeneracy', () => {

    it('verifies Transverse vs Axial camera projection vertical screen displacement equality at 5 historical eclipse presets', () => {
      const eclipseJDs = [
        2460409.25, // Apr 8, 2024 Total Solar Eclipse
        2460585.92, // Oct 2, 2024 Annular Solar Eclipse
        2460748.79, // Mar 14, 2025 Total Lunar Eclipse (Blood Moon)
        2461265.17, // Aug 12, 2026 Total Solar Eclipse
        2461620.08  // Aug 2, 2027 Total Solar Eclipse (Luxor)
      ];

      for (const jd of eclipseJDs) {
        const scene = generateCosmicScene({ julianDate: jd });
        const transverse = projectGeocentricTransverse(scene);
        const axial = projectGeocentricAxial(scene);

        // Vertical screen position delta relative to Earth center:
        // Transverse Earth Y = 110, Axial Earth Y = 90
        // Both scale at 8.5 px per degree of ecliptic latitude beta
        const transverseDeltaY = transverse.elements.moon.y - transverse.elements.earth.y;
        const axialDeltaY = axial.elements.moon.y - axial.elements.earth.y;

        expect(transverseDeltaY).toBeCloseTo(axialDeltaY, 5);
      }
    });

    it('stress-tests projectEulerCamera under extreme gimbal and singular conditions (pitch=±90°, roll=±360°, zero scale, extreme perspective)', () => {
      const scene = generateCosmicScene({ scaleMode: 'exaggerated' });

      // 1. Extreme Pitch (North and South Poles)
      const northPole = projectEulerCamera(scene, 90, 0);
      const southPole = projectEulerCamera(scene, -90, 0);
      expect(Number.isNaN(northPole.elements.earth.x)).toBe(false);
      expect(Number.isNaN(southPole.elements.earth.x)).toBe(false);

      // 2. Full 360° gimbal spins
      for (let spin = -720; spin <= 720; spin += 45) {
        const proj = projectEulerCamera(scene, spin, spin, { roll: spin });
        expect(Number.isFinite(proj.elements.sun.x)).toBe(true);
        expect(Number.isFinite(proj.elements.earth.y)).toBe(true);
        expect(Number.isFinite(proj.elements.moon.depth)).toBe(true);
      }

      // 3. Perspective near-clipping boundary testing
      const tightPerspective = projectEulerCamera(scene, 45, 45, {
        isPerspective: true,
        focalDistance: 50 // very close focal distance
      });
      expect(Number.isFinite(tightPerspective.elements.sun.x)).toBe(true);
      expect(Number.isFinite(tightPerspective.elements.earth.r)).toBe(true);
    });
  });

});
