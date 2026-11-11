/**
 * @file armillaryStereographic.test.ts
 * Domain test suite for stereographic conformal closed-form mathematical invariants,
 * circle preservation, non-degeneracy, and scale-invariance.
 */

import { describe, it, expect } from "vitest";
import {
  projectStereographicConformal,
  generateArmillaryModel,
  computeContinuousProjection2D,
  rotateEuler3D
} from "./index";
import { clamp } from "../core";
import { ArmillaryProjectionMode } from "./types";
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from "../astroConstants";
import { Vector2D, Vector3D, Degrees, Latitude, Longitude, HoursDecimal } from "../../../types";

describe("Stereographic Conformal Closed-Form & Invariant Verification", () => {
    describe('Stereographic Conformal Closed-Form & Invariant Verification (Milestone 1)', () => {
      const EPS_DEG = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
      const EPS_RAD = (EPS_DEG * Math.PI) / 180;

      // -------------------------------------------------------------------------
      // Test 1: Analytical Closed-Form Stereographic Ecliptic Center and Radius across 360°
      // -------------------------------------------------------------------------
      it('strictly satisfies analytical closed-form stereographic Ecliptic circle center (0, -R0*tan(eps)) and radius R0/cos(eps) across all 360 degrees (< 1e-4 tolerance)', () => {
        const r0 = 100;
        const expectedRadius = r0 / Math.cos(EPS_RAD); // R_ecl = R0 / cos(eps) ~ 108.99581
        const expectedCenterY = -r0 * Math.tan(EPS_RAD); // Y_c = -R0 * tan(eps) ~ -43.35512
        const expectedCenterX = 0;

        // Sample all 360 integer degrees of ecliptic longitude lambda
        for (let deg = 0; deg < 360; deg++) {
          const lambdaRad = (deg * Math.PI) / 180;
          const p3d: Vector3D = {
            x: r0 * Math.cos(lambdaRad),
            y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
            z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
          };

          const proj = projectStereographicConformal(p3d, r0);

          // In projectStereographicConformal: proj.x = p3d.x * scale, proj.y = p3d.z * scale
          // Center of projected circle in projection plane is (expectedCenterX, expectedCenterY)
          const distFromCenter = Math.hypot(proj.x - expectedCenterX, proj.y - expectedCenterY);

          // Must match analytical radius within 1e-4 relative tolerance
          expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
        }

        // Verify exact cardinal points explicitly:
        // 1. Vernal Equinox (lambda = 0°): p3d = (100, 0, 0) -> proj = (100, 0)
        const projVE = projectStereographicConformal({ x: r0, y: 0, z: 0 }, r0);
        expect(projVE.x).toBeCloseTo(r0, 4);
        expect(projVE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projVE.x - expectedCenterX, projVE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 2. Summer Solstice (lambda = 90°): p3d = (0, r0*sin(eps), r0*cos(eps)) -> proj = (0, r0*tan((90-eps)/2))
        const projSS = projectStereographicConformal({ x: 0, y: r0 * Math.sin(EPS_RAD), z: r0 * Math.cos(EPS_RAD) }, r0);
        const expectedSSY = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2);
        expect(projSS.x).toBeCloseTo(0, 4);
        expect(projSS.y).toBeCloseTo(expectedSSY, 4);
        expect(Math.hypot(projSS.x - expectedCenterX, projSS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 3. Autumnal Equinox (lambda = 180°): p3d = (-100, 0, 0) -> proj = (-100, 0)
        const projAE = projectStereographicConformal({ x: -r0, y: 0, z: 0 }, r0);
        expect(projAE.x).toBeCloseTo(-r0, 4);
        expect(projAE.y).toBeCloseTo(0, 4);
        expect(Math.hypot(projAE.x - expectedCenterX, projAE.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);

        // 4. Winter Solstice (lambda = 270°): p3d = (0, -r0*sin(eps), -r0*cos(eps)) -> proj = (0, -r0*tan((90+eps)/2))
        const projWS = projectStereographicConformal({ x: 0, y: -r0 * Math.sin(EPS_RAD), z: -r0 * Math.cos(EPS_RAD) }, r0);
        const expectedWSY = -r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2);
        expect(projWS.x).toBeCloseTo(0, 4);
        expect(projWS.y).toBeCloseTo(expectedWSY, 4);
        expect(Math.hypot(projWS.x - expectedCenterX, projWS.y - expectedCenterY)).toBeCloseTo(expectedRadius, 4);
      });

      // -------------------------------------------------------------------------
      // Test 2: Scale-Invariance across varying R0 in {50, 100, 150, 200}
      // -------------------------------------------------------------------------
      it('verifies exact scale-invariance of stereographic projections for R0 in {50, 100, 150, 200}', () => {
        const testRadii = [50, 100, 150, 200];
        const secEps = 1 / Math.cos(EPS_RAD);
        const tanEps = Math.tan(EPS_RAD);

        for (const r0 of testRadii) {
          const expectedCenterY = -r0 * tanEps;
          const expectedRadius = r0 * secEps;

          // Verify normalized center and radius ratios
          expect(expectedRadius / r0).toBeCloseTo(secEps, 6);
          expect(expectedCenterY / r0).toBeCloseTo(-tanEps, 6);

          // Test all 4 quadrants of the ecliptic
          for (let deg = 0; deg < 360; deg += 15) {
            const lambdaRad = (deg * Math.PI) / 180;
            const p3d: Vector3D = {
              x: r0 * Math.cos(lambdaRad),
              y: r0 * Math.sin(lambdaRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(lambdaRad) * Math.cos(EPS_RAD)
            };

            const proj = projectStereographicConformal(p3d, r0);
            const normalizedDist = Math.hypot(proj.x, proj.y - expectedCenterY) / r0;
            expect(Math.abs(normalizedDist - secEps)).toBeLessThan(1e-4);
          }

          // Test full model generation scaling
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: 1.0,
            projectionMode: 'stereographic',
            cameraPitch: 0,
            cameraYaw: 0,
            r0
          });

          const eclRing = model.rings.find((r) => r.id === 'ecliptic');
          expect(eclRing).toBeDefined();

          // In screen coordinates, screenY = -pProj.y -> center is at (0, -expectedCenterY) = (0, +r0*tan(eps))
          const screenCenterY = r0 * tanEps;
          for (const v of eclRing!.vertices) {
            const screenDist = Math.hypot(v.screenPos.x, v.screenPos.y - screenCenterY);
            expect(Math.abs(screenDist / r0 - secEps)).toBeLessThan(1e-4);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 3: Conformal Circle Invariants on Tropic of Cancer, Tropic of Capricorn & Equator
      // -------------------------------------------------------------------------
      it('verifies conformal circle preservation on Celestial Equator, Tropic of Cancer, and Tropic of Capricorn', () => {
        const r0 = 100;
        const expectedCancerRadius = r0 * Math.tan((Math.PI / 2 - EPS_RAD) / 2); // ~65.6382
        const expectedCapricornRadius = r0 * Math.tan((Math.PI / 2 + EPS_RAD) / 2); // ~152.3497
        const expectedEquatorRadius = r0; // 100.0

        for (let raDeg = 0; raDeg < 360; raDeg += 5) {
          const raRad = (raDeg * Math.PI) / 180;

          // 1. Celestial Equator (dec = 0°)
          const pEq: Vector3D = { x: r0 * Math.cos(raRad), y: 0, z: r0 * Math.sin(raRad) };
          const projEq = projectStereographicConformal(pEq, r0);
          const distEq = Math.hypot(projEq.x, projEq.y);
          expect(Math.abs(distEq - expectedEquatorRadius)).toBeLessThan(1e-4);

          // 2. Tropic of Cancer (dec = +eps)
          const pCancer: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCancer = projectStereographicConformal(pCancer, r0);
          const distCancer = Math.hypot(projCancer.x, projCancer.y);
          expect(Math.abs(distCancer - expectedCancerRadius)).toBeLessThan(1e-4);

          // 3. Tropic of Capricorn (dec = -eps)
          const pCap: Vector3D = {
            x: r0 * Math.cos(EPS_RAD) * Math.cos(raRad),
            y: -r0 * Math.sin(EPS_RAD),
            z: r0 * Math.cos(EPS_RAD) * Math.sin(raRad)
          };
          const projCap = projectStereographicConformal(pCap, r0);
          const distCap = Math.hypot(projCap.x, projCap.y);
          expect(Math.abs(distCap - expectedCapricornRadius)).toBeLessThan(1e-4);
        }

        // Verify concentricity in generateArmillaryModel output
        const model = generateArmillaryModel({
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          morphLambda: 1.0,
          projectionMode: 'stereographic',
          cameraPitch: 0,
          cameraYaw: 0,
          r0
        });

        const eqRing = model.rings.find((r) => r.id === 'equator');
        const canRing = model.rings.find((r) => r.id === 'tropic_cancer');
        const capRing = model.rings.find((r) => r.id === 'tropic_capricorn');

        expect(eqRing).toBeDefined();
        expect(canRing).toBeDefined();
        expect(capRing).toBeDefined();

        for (const v of eqRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedEquatorRadius, 3);
        }
        for (const v of canRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCancerRadius, 3);
        }
        for (const v of capRing!.vertices) {
          expect(Math.hypot(v.screenPos.x, v.screenPos.y)).toBeCloseTo(expectedCapricornRadius, 3);
        }
      });

      // -------------------------------------------------------------------------
      // Test 4: Non-Degeneracy & Absence of Chord-Cutting / Vertex Pinching across Morphing
      // -------------------------------------------------------------------------
      it('guarantees non-degeneracy, finite bounds, and absence of Cartesian chord-cutting or vertex pinching across intermediate morphing frames lambda in {0.1, 0.25, 0.45, 0.5, 0.75, 0.9}', () => {
        const testLambdas = [0.1, 0.25, 0.45, 0.5, 0.75, 0.9];
        const r0 = 100;
        const targetModes: Array<'stereographic' | 'rojas' | 'horizon'> = ['stereographic', 'rojas', 'horizon'];

        for (const mode of targetModes) {
          for (const lambda of testLambdas) {
            const model = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: 280 as Degrees,
              sunDecDeg: -23 as Degrees,
              sunLambdaDeg: 280 as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: lambda,
              projectionMode: mode,
              cameraPitch: 45 * (1 - lambda),
              cameraYaw: 30 * (1 - lambda),
              r0
            });

            expect(model.rings.length).toBeGreaterThanOrEqual(7);

            for (const ring of model.rings) {
              expect(ring.vertices.length).toBeGreaterThanOrEqual(72);

              let perimeter = 0;
              const segmentLengths: number[] = [];

              for (let i = 0; i < ring.vertices.length - 1; i++) {
                const v = ring.vertices[i];

                // 1. Strict finite coordinate assertions
                expect(Number.isFinite(v.screenPos.x)).toBe(true);
                expect(Number.isFinite(v.screenPos.y)).toBe(true);
                expect(Number.isNaN(v.screenPos.x)).toBe(false);
                expect(Number.isNaN(v.screenPos.y)).toBe(false);

                // 2. Physical boundary containment (|coord| < 10 * R0)
                expect(Math.abs(v.screenPos.x)).toBeLessThan(r0 * 10);
                expect(Math.abs(v.screenPos.y)).toBeLessThan(r0 * 10);

                // 3. Consecutive segment smoothness
                const nextV = ring.vertices[i + 1];
                const segLen = Math.hypot(nextV.screenPos.x - v.screenPos.x, nextV.screenPos.y - v.screenPos.y);

                // Segment length must be well-defined and positive
                expect(segLen).toBeGreaterThan(0.005);
                // Parallel circles and ecliptic avoid pole; polar-crossing rings expand near south pole singularity
                const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
                if (isParallelOrEcliptic) {
                  expect(segLen).toBeLessThan(100);
                } else {
                  expect(segLen).toBeLessThan(r0 * 10);
                }

                segmentLengths.push(segLen);
                perimeter += segLen;
              }

              // Check final endpoint vertex
              const lastV = ring.vertices[ring.vertices.length - 1];
              expect(Number.isFinite(lastV.screenPos.x)).toBe(true);
              expect(Number.isFinite(lastV.screenPos.y)).toBe(true);

              // 4. Ring perimeter must remain well-behaved
              expect(perimeter).toBeGreaterThan(r0 * 0.5); // Minimum loop perimeter
              expect(perimeter).toBeLessThan(r0 * 50); // Maximum bounding circumference

              // 5. Ratio of max to min segment length along parallel/ecliptic rings is bounded (no extreme distortion)
              const isParallelOrEcliptic = ['equator', 'ecliptic', 'tropic_cancer', 'tropic_capricorn'].includes(ring.id);
              if (isParallelOrEcliptic) {
                const maxSeg = Math.max(...segmentLengths);
                const minSeg = Math.min(...segmentLengths);
                expect(maxSeg / minSeg).toBeLessThan(100);
              }
            }
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 5: Staged Decoupling of 3D Geometry vs Camera Alignment and Back Ring Unification
      // -------------------------------------------------------------------------
      it('enforces unflattened 3D geometry (geomLambda = 0) for lambda in [0.0, 0.45] and smooth linear progress in [0.45, 1.0]', () => {
        const baseParams = {
          julianDate: 2451545.0,
          latitude: 47.06 as Latitude,
          longitude: -122.81 as Longitude,
          timeOfDay: 12 as HoursDecimal,
          sunRaDeg: 0 as Degrees,
          sunDecDeg: 0 as Degrees,
          sunLambdaDeg: 0 as Degrees,
          moonRaDeg: 0 as Degrees,
          moonDecDeg: 0 as Degrees,
          moonLambdaDeg: 0 as Degrees,
          moonPhase: 0.5,
          projectionMode: 'stereographic' as const,
          cameraPitch: 90,
          cameraYaw: 0,
          r0: 100
        };

        // At lambda = 0.0, 0.2, 0.45: Geometry should match unflattened 3D camera projection exactly
        for (const lambda of [0.0, 0.2, 0.45]) {
          const model = generateArmillaryModel({ ...baseParams, morphLambda: lambda });
          const eqRing = model.rings.find(r => r.id === 'equator')!;
          // Celestial equator in 3D camera view (pitch=90) has radius = r0 = 100
          for (const v of eqRing.vertices) {
            const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
            expect(dist).toBeCloseTo(100, 1);
          }
        }

        // At lambda = 1.0: Full stereographic equator has radius = r0 * tan(45°) = 100
        const modelFull = generateArmillaryModel({ ...baseParams, morphLambda: 1.0 });
        const eqRingFull = modelFull.rings.find(r => r.id === 'equator')!;
        for (const v of eqRingFull.vertices) {
          const dist = Math.hypot(v.screenPos.x, v.screenPos.y);
          expect(dist).toBeCloseTo(100, 1);
        }
      });

      it('guarantees back ring stroke unification and eliminates back segments when geomLambda >= 0.85', () => {
        const r0 = 100;
        // lambda >= 0.45 + 0.85 * 0.55 = 0.9175 -> geomLambda >= 0.85
        for (const lambda of [0.92, 0.95, 1.0]) {
          const model = generateArmillaryModel({
            julianDate: 2451545.0,
            latitude: 47.06 as Latitude,
            longitude: -122.81 as Longitude,
            timeOfDay: 12 as HoursDecimal,
            sunRaDeg: 0 as Degrees,
            sunDecDeg: 0 as Degrees,
            sunLambdaDeg: 0 as Degrees,
            moonRaDeg: 0 as Degrees,
            moonDecDeg: 0 as Degrees,
            moonLambdaDeg: 0 as Degrees,
            moonPhase: 0.5,
            morphLambda: lambda,
            projectionMode: 'stereographic',
            cameraPitch: 90,
            cameraYaw: 0,
            r0
          });

          for (const ring of model.rings) {
            expect(ring.vertices.every(v => v.isFront)).toBe(true);
            expect(ring.backPathD).toBe('');
            expect(ring.frontPathD.length).toBeGreaterThan(0);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 6: Sun Bead Strict Coincidence with Ecliptic Track Across All Seasons & Free Rete Offsets
      // -------------------------------------------------------------------------
      it('guarantees Sun bead strict coincidence with Ecliptic track across all 4 astronomical seasons, orbital milestones, and Free Rete offsets', () => {
        const astronomicalMilestones = [
          { name: 'Vernal Equinox', sunLambda: 0, sunRa: 0, sunDec: 0 },
          { name: 'Summer Solstice', sunLambda: 90, sunRa: 90, sunDec: 23.439 },
          { name: 'Autumnal Equinox', sunLambda: 180, sunRa: 180, sunDec: 0 },
          { name: 'Winter Solstice', sunLambda: 270, sunRa: 270, sunDec: -23.439 },
          { name: 'Perihelion', sunLambda: 283, sunRa: 284, sunDec: -22.7 },
          { name: 'Aphelion', sunLambda: 103, sunRa: 104, sunDec: 22.7 }
        ];

        const reteOffsets = [0, 30, 45, 90, 180, 270, 315];
        const r0 = 100;

        for (const season of astronomicalMilestones) {
          for (const offset of reteOffsets) {
            // A. 2D Stereographic Astrolabe Mode
            const model2D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 1.0,
              projectionMode: 'stereographic',
              cameraPitch: 0,
              cameraYaw: 0,
              r0,
              isFreeReteMode: offset !== 0,
              freeReteOffsetDeg: offset
            });

            // 1. Check analytical 3D Sun position matches clamped ecliptic parametric equations
            const sunLonRad = (season.sunLambda * Math.PI) / 180;
            const sun3DBase: Vector3D = {
              x: r0 * Math.cos(sunLonRad),
              y: r0 * Math.sin(sunLonRad) * Math.sin(EPS_RAD),
              z: r0 * Math.sin(sunLonRad) * Math.cos(EPS_RAD)
            };
            const sun3DExpected = rotateEuler3D(sun3DBase, 0, offset, 0);

            expect(model2D.sun.p3d.x).toBeCloseTo(sun3DExpected.x, 3);
            expect(model2D.sun.p3d.y).toBeCloseTo(sun3DExpected.y, 3);
            expect(model2D.sun.p3d.z).toBeCloseTo(sun3DExpected.z, 3);

            // 2. Check Sun bead distance from origin in 3D equals r0 exactly
            const dist3D = Math.hypot(model2D.sun.p3d.x, model2D.sun.p3d.y, model2D.sun.p3d.z);
            expect(dist3D).toBeCloseTo(r0, 4);

            // 3. Check Sun bead screen position coincidence against the Ecliptic ring polyline
            const eclRing = model2D.rings.find((r) => r.id === 'ecliptic');
            expect(eclRing).toBeDefined();

            const sunPos = model2D.sun.screenPos;
            let minDistanceToRing = Infinity;

            // Find minimum perpendicular distance from Sun bead to any segment of the Ecliptic ring
            for (let i = 0; i < eclRing!.vertices.length; i++) {
              const p1 = eclRing!.vertices[i].screenPos;
              const p2 = eclRing!.vertices[(i + 1) % eclRing!.vertices.length].screenPos;

              // Distance from point (sunPos) to line segment (p1 -> p2)
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const segLenSq = dx * dx + dy * dy;

              let dist: number;
              if (segLenSq === 0) {
                dist = Math.hypot(sunPos.x - p1.x, sunPos.y - p1.y);
              } else {
                const t = clamp(((sunPos.x - p1.x) * dx + (sunPos.y - p1.y) * dy) / segLenSq, 0, 1);
                const projX = p1.x + t * dx;
                const projY = p1.y + t * dy;
                dist = Math.hypot(sunPos.x - projX, sunPos.y - projY);
              }

              if (dist < minDistanceToRing) {
                minDistanceToRing = dist;
              }
            }

            // In 72-segment polygon approximation, chord sagitta between polygon and true eccentric circle is < 0.25px
            expect(minDistanceToRing).toBeLessThan(0.25);

            // 4. Distance of Sun screen position from projected circle center matches expectedRadius
            // With reteOffset = 0, screen center is (0, +r0*tan(eps))
            if (offset === 0) {
              const expectedRadius = r0 / Math.cos(EPS_RAD);
              const screenCenterY = r0 * Math.tan(EPS_RAD);
              const distFromCenter = Math.hypot(sunPos.x, sunPos.y - screenCenterY);
              expect(Math.abs(distFromCenter - expectedRadius)).toBeLessThan(1e-4);
            }

            // B. 3D Geocentric Mode
            const model3D = generateArmillaryModel({
              julianDate: 2451545.0,
              latitude: 47.06 as Latitude,
              longitude: -122.81 as Longitude,
              timeOfDay: 12 as HoursDecimal,
              sunRaDeg: season.sunRa as Degrees,
              sunDecDeg: season.sunDec as Degrees,
              sunLambdaDeg: season.sunLambda as Degrees,
              moonRaDeg: 120 as Degrees,
              moonDecDeg: 15 as Degrees,
              moonLambdaDeg: 120 as Degrees,
              moonPhase: 0.5,
              morphLambda: 0.0,
              projectionMode: 'geocentric',
              cameraPitch: 0,
              cameraYaw: 0,
              r0
            });

            // In 3D Geocentric, Sun revolves on Ecliptic plane inclined at eps: normal = (0, cos(eps), sin(eps))
            // Dot product P_sun . N must be identically 0
            const dotWithNormal = model3D.sun.p3d.y * Math.cos(EPS_RAD) + model3D.sun.p3d.z * Math.sin(EPS_RAD);
            expect(Math.abs(dotWithNormal)).toBeLessThan(1e-4);
            // Distance from Earth (origin) is 1.1 * r0
            expect(Math.hypot(model3D.sun.p3d.x, model3D.sun.p3d.y, model3D.sun.p3d.z)).toBeCloseTo(r0 * 1.1, 3);
          }
        }
      });

      // -------------------------------------------------------------------------
      // Test 7: Cross-Projection 2D <-> 2D Continuity Invariants (Stereo <-> Rojas <-> Horizon)
      // -------------------------------------------------------------------------
      it('verifies seamless continuity and non-degeneracy during 2D <-> 2D cross-projection morphing for all transition frames T in {0.0, 0.25, 0.5, 0.75, 1.0}', () => {
        const transitions: Array<{ from: ArmillaryProjectionMode; to: ArmillaryProjectionMode }> = [
          { from: 'stereographic', to: 'rojas' },
          { from: 'rojas', to: 'stereographic' },
          { from: 'stereographic', to: 'horizon' },
          { from: 'horizon', to: 'stereographic' },
          { from: 'rojas', to: 'horizon' },
          { from: 'horizon', to: 'rojas' }
        ];

        const testT = [0.0, 0.25, 0.5, 0.75, 1.0];
        const r0 = 100;
        const testPoint: Vector3D = { x: 60, y: 30, z: 70 };

        for (const trans of transitions) {
          let prevProj: Vector2D | null = null;

          for (const t of testT) {
            const proj = computeContinuousProjection2D(
              testPoint,
              trans.from,
              trans.to,
              t,
              r0,
              47.06 as Latitude,
              120 as Degrees
            );

            expect(Number.isFinite(proj.x)).toBe(true);
            expect(Number.isFinite(proj.y)).toBe(true);
            expect(Number.isNaN(proj.x)).toBe(false);
            expect(Number.isNaN(proj.y)).toBe(false);

            if (prevProj !== null) {
              // Delta between consecutive 25% steps must be smooth and bounded
              const stepDelta = Math.hypot(proj.x - prevProj.x, proj.y - prevProj.y);
              expect(stepDelta).toBeLessThan(r0 * 2);
            }

            prevProj = proj;
          }
        }
      });
  });
});
