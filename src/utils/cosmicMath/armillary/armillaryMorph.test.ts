/**
 * @file armillaryMorph.test.ts
 * Domain test suite for Gyro-Morph Armillary mathematical morphing:
 * Phase A (Copernican to Geocentric 3D translation) and Phase B (Observer sky cone to volumetric laser projection).
 */

import { describe, it, expect } from "vitest";
import { generateArmillaryModel } from "./index";
import { Vector2D, Latitude, Longitude, HoursDecimal, Degrees } from "../../../types";

describe("Gyro-Morph Mathematical Morphing Engine (Phases A & B)", () => {
    describe('Phase 1: Copernican to Geocentric 3D Translation (Phase A: lambda <= 0.45)', () => {
      const baseHelioParams = {
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
        projectionMode: 'heliocentric' as const,
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      };

      it('validates Earth 3D distance > 100px at lambda = 0.0 and origin (0, 0, 0) within 1e-4 at lambda = 0.45', () => {
        // At morphLambda = 0.0: Pure heliocentric Keplerian orbit (a = r0 * 1.1 = 110px)
        const model0 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 });
        const earthDist0 = Math.hypot(model0.earth.p3d.x, model0.earth.p3d.y, model0.earth.p3d.z);
        expect(earthDist0).toBeGreaterThan(100);

        // At morphLambda = 0.45: Full translation to geocentric celestial origin (0, 0, 0)
        const model45 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.45 });
        expect(Math.abs(model45.earth.p3d.x)).toBeLessThanOrEqual(1e-4);
        expect(Math.abs(model45.earth.p3d.y)).toBeLessThanOrEqual(1e-4);
        expect(Math.abs(model45.earth.p3d.z)).toBeLessThanOrEqual(1e-4);
        const earthDist45 = Math.hypot(model45.earth.p3d.x, model45.earth.p3d.y, model45.earth.p3d.z);
        expect(earthDist45).toBeCloseTo(0, 4);
      });

      it('strictly decreases Earth distance from origin across intermediate frames [0.10, 0.20, 0.35, 0.45] with finite bounds and no NaNs', () => {
        const intermediateLambdas = [0.10, 0.20, 0.35, 0.45];
        let prevDist = Math.hypot(
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.x,
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.y,
          generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 }).earth.p3d.z
        );

        for (const lambda of intermediateLambdas) {
          const model = generateArmillaryModel({ ...baseHelioParams, morphLambda: lambda });
          const { x, y, z } = model.earth.p3d;

          expect(Number.isFinite(x)).toBe(true);
          expect(Number.isFinite(y)).toBe(true);
          expect(Number.isFinite(z)).toBe(true);
          expect(Number.isNaN(x)).toBe(false);
          expect(Number.isNaN(y)).toBe(false);
          expect(Number.isNaN(z)).toBe(false);

          const dist = Math.hypot(x, y, z);
          expect(dist).toBeLessThan(prevDist);
          expect(dist).toBeGreaterThanOrEqual(0);
          prevDist = dist;
        }
      });

      it('guarantees observerCone is defined across all morphLambda in [0.0, 0.45] and observerScreenPos smoothly translates along with Earth', () => {
        const lambdas = [0.0, 0.10, 0.20, 0.35, 0.45];
        let prevEarthScreenDist = Infinity;
        let prevObsScreenDist = Infinity;

        for (const lambda of lambdas) {
          const model = generateArmillaryModel({ ...baseHelioParams, morphLambda: lambda });

          expect(model.observerCone).toBeDefined();
          const obsCone = model.observerCone!;

          expect(Number.isFinite(obsCone.observerScreenPos.x)).toBe(true);
          expect(Number.isFinite(obsCone.observerScreenPos.y)).toBe(true);
          expect(Number.isNaN(obsCone.observerScreenPos.x)).toBe(false);
          expect(Number.isNaN(obsCone.observerScreenPos.y)).toBe(false);

          // Observer screen position offset from Earth screen position is strictly bounded (radius ~ 4.8px)
          const offsetFromEarth = Math.hypot(
            obsCone.observerScreenPos.x - model.earth.screenPos.x,
            obsCone.observerScreenPos.y - model.earth.screenPos.y
          );
          expect(offsetFromEarth).toBeLessThanOrEqual(5.0);

          // Screen distance from center strictly decreases as Earth translates to origin
          const earthScreenDist = Math.hypot(model.earth.screenPos.x, model.earth.screenPos.y);
          const obsScreenDist = Math.hypot(obsCone.observerScreenPos.x, obsCone.observerScreenPos.y);

          expect(earthScreenDist).toBeLessThan(prevEarthScreenDist);
          expect(obsScreenDist).toBeLessThan(prevObsScreenDist);

          prevEarthScreenDist = earthScreenDist;
          prevObsScreenDist = obsScreenDist;
        }
      });

      it('continuously blends layer opacities, Sun, Moon, and milestone coordinates across Phase A', () => {
        // At lambda = 0.0
        const m0 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.0 });
        expect(m0.celestialRingsOpacity).toBeCloseTo(0.0, 4);
        expect(m0.starsOpacity).toBeCloseTo(0.25, 4);
        expect(m0.orbitRingOpacity).toBe(1.0);
        expect(m0.lunarOrbitOpacity).toBe(1.0);
        expect(m0.milestonesOpacity).toBe(1.0);

        // At lambda = 0.225 (50% of Phase A)
        const mHalf = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.225 });
        expect(mHalf.celestialRingsOpacity).toBeCloseTo(0.85 * 0.5, 4);
        expect(mHalf.starsOpacity).toBeCloseTo(0.25 + 0.55 * 0.5, 4);
        expect(mHalf.orbitRingOpacity).toBe(1.0);

        // At lambda = 0.45 (100% of Phase A)
        const m45 = generateArmillaryModel({ ...baseHelioParams, morphLambda: 0.45 });
        expect(m45.celestialRingsOpacity).toBeCloseTo(0.85, 4);
        expect(m45.starsOpacity).toBeCloseTo(0.80, 4);
        expect(m45.orbitRingOpacity).toBe(1.0);

        // Sun at lambda = 0.45 is at apparent Ecliptic radius a = 110px
        const sunDist45 = Math.hypot(m45.sun.p3d.x, m45.sun.p3d.y, m45.sun.p3d.z);
        expect(sunDist45).toBeCloseTo(110, 2);

        // Moon at lambda = 0.45 is at physical geocentric radius 26px
        const moonDist45 = Math.hypot(m45.moon.p3d.x, m45.moon.p3d.y, m45.moon.p3d.z);
        expect(moonDist45).toBeCloseTo(26, 2);

        // All milestones at lambda = 0.45 are at radius a = 110px
        expect(m45.milestones.length).toBe(6);
        for (const node of m45.milestones) {
          const mDist = Math.hypot(node.p3d.x, node.p3d.y, node.p3d.z);
          expect(mDist).toBeCloseTo(110, 2);
        }
      });
    });

    describe('Phase 2: Mathematical Morph of Observer Sky Cone into Volumetric Laser Rays & Cones (Phase B: lambda > 0.45)', () => {
      const basePhase2Params = {
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
        projectionMode: 'stereographic' as const,
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      };

      // 1. At morphLambda = 0.45 (u = 0), observerCone.observerScreenPos is co-located with Earth's surface pin
      it('co-locates observerCone.observerScreenPos with Earth surface pin at morphLambda = 0.45 (u = 0)', () => {
        const model = generateArmillaryModel({
          ...basePhase2Params,
          projectionMode: 'heliocentric',
          morphLambda: 0.45
        });

        expect(model.observerCone).toBeDefined();
        expect(model.observerCone?.morphProgress).toBe(0);

        // Observer pin is on the Earth surface (radius 4.8px from Earth center in 3D frame)
        const distToEarth = Math.hypot(
          model.observerCone!.observerScreenPos.x - model.earth.screenPos.x,
          model.observerCone!.observerScreenPos.y - model.earth.screenPos.y
        );
        expect(distToEarth).toBeLessThanOrEqual(5.0);
        expect(distToEarth).toBeGreaterThan(2.0);

        // Verification of continuity at Phase A -> Phase B boundary (lambda = 0.45 -> lambda = 0.451)
        const modelNext = generateArmillaryModel({
          ...basePhase2Params,
          projectionMode: 'heliocentric',
          morphLambda: 0.451
        });
        expect(model.observerCone!.observerScreenPos.x).toBeCloseTo(modelNext.observerCone!.observerScreenPos.x, 0);
        expect(model.observerCone!.observerScreenPos.y).toBeCloseTo(modelNext.observerCone!.observerScreenPos.y, 0);
      });

      // 2. At morphLambda = 1.0 (u = 1), observerCone.observerScreenPos equals the projection focal beacon position within 10^-4
      it('equals the projection focal beacon position within 10^-4 at morphLambda = 1.0 (u = 1)', () => {
        // Stereographic mode
        const modelStereo = generateArmillaryModel({
          ...basePhase2Params,
          projectionMode: 'stereographic',
          morphLambda: 1.0
        });

        expect(modelStereo.observerCone).toBeDefined();
        expect(modelStereo.focalBeacon).toBeDefined();
        expect(modelStereo.observerCone?.morphProgress).toBe(1);
        expect(modelStereo.observerCone!.observerScreenPos.x).toBeCloseTo(modelStereo.focalBeacon!.focalScreenPos.x, 4);
        expect(modelStereo.observerCone!.observerScreenPos.y).toBeCloseTo(modelStereo.focalBeacon!.focalScreenPos.y, 4);
        expect(modelStereo.observerCone!.observerScreenPos.x).toBeCloseTo(0, 4);
        expect(modelStereo.observerCone!.observerScreenPos.y).toBeCloseTo(120, 4); // r0 * 1.2 = 120
        expect(modelStereo.observerCone!.label).toBe('Projection Focal Beacon');

        // Rojas mode
        const modelRojas = generateArmillaryModel({
          ...basePhase2Params,
          projectionMode: 'rojas',
          morphLambda: 1.0
        });

        expect(modelRojas.observerCone).toBeDefined();
        expect(modelRojas.focalBeacon).toBeDefined();
        expect(modelRojas.observerCone?.morphProgress).toBe(1);
        expect(modelRojas.observerCone!.observerScreenPos.x).toBeCloseTo(modelRojas.focalBeacon!.focalScreenPos.x, 4);
        expect(modelRojas.observerCone!.observerScreenPos.y).toBeCloseTo(modelRojas.focalBeacon!.focalScreenPos.y, 4);
        expect(modelRojas.observerCone!.observerScreenPos.x).toBeCloseTo(0, 4);
        expect(modelRojas.observerCone!.observerScreenPos.y).toBeCloseTo(0, 4); // Center of projection in Rojas
        expect(modelRojas.observerCone!.label).toBe('Projection Focal Beacon');

        // Horizon mode
        const modelHorizon = generateArmillaryModel({
          ...basePhase2Params,
          projectionMode: 'horizon',
          morphLambda: 1.0
        });

        expect(modelHorizon.observerCone!.observerScreenPos.x).toBeCloseTo(modelHorizon.focalBeacon!.focalScreenPos.x, 4);
        expect(modelHorizon.observerCone!.observerScreenPos.y).toBeCloseTo(modelHorizon.focalBeacon!.focalScreenPos.y, 4);
      });

      // 3. Across intermediate lambda in {0.55, 0.70, 0.85, 0.95}, apex observerScreenPos glides smoothly across the screen without NaNs or coordinate spikes
      it('glides apex observerScreenPos smoothly across the screen without NaNs or coordinate spikes across intermediate lambda', () => {
        const intermediateLambdas = [0.45, 0.55, 0.70, 0.85, 0.95, 1.0];
        let prevPos: Vector2D | null = null;
        let prevProgress = -1;

        for (const morphLambda of intermediateLambdas) {
          const model = generateArmillaryModel({
            ...basePhase2Params,
            morphLambda
          });

          const cone = model.observerCone;
          expect(cone).toBeDefined();
          expect(Number.isFinite(cone!.observerScreenPos.x)).toBe(true);
          expect(Number.isFinite(cone!.observerScreenPos.y)).toBe(true);
          expect(Number.isNaN(cone!.observerScreenPos.x)).toBe(false);
          expect(Number.isNaN(cone!.observerScreenPos.y)).toBe(false);

          // Morph progress must be strictly monotonic
          expect(cone!.morphProgress).toBeGreaterThanOrEqual(prevProgress);
          prevProgress = cone!.morphProgress!;

          if (prevPos) {
            const stepDist = Math.hypot(
              cone!.observerScreenPos.x - prevPos.x,
              cone!.observerScreenPos.y - prevPos.y
            );
            // Smooth glide: step distance between consecutive sampled frames should not spike abruptly
            expect(stepDist).toBeGreaterThanOrEqual(0);
            expect(stepDist).toBeLessThan(60);
          }
          prevPos = cone!.observerScreenPos;
        }
      });

      // 4. conePathD and horizonDiscPathD are non-empty, non-NaN, non-Infinity at all intermediate frames
      it('generates non-empty, non-NaN, non-Infinity conePathD and horizonDiscPathD at all intermediate frames', () => {
        const intermediateLambdas = [0.45, 0.55, 0.70, 0.85, 0.95, 1.0];

        for (const morphLambda of intermediateLambdas) {
          const model = generateArmillaryModel({
            ...basePhase2Params,
            morphLambda
          });

          const cone = model.observerCone;
          expect(cone).toBeDefined();

          // conePathD format and safety
          expect(cone!.conePathD).toMatch(/^M\s.+Z$/);
          expect(cone!.conePathD).not.toContain('NaN');
          expect(cone!.conePathD).not.toContain('Infinity');
          expect(cone!.conePathD).not.toContain('undefined');

          // horizonDiscPathD format and safety
          expect(cone!.horizonDiscPathD).toMatch(/^M\s.+Z$/);
          expect(cone!.horizonDiscPathD).not.toContain('NaN');
          expect(cone!.horizonDiscPathD).not.toContain('Infinity');
          expect(cone!.horizonDiscPathD).not.toContain('undefined');

          // silhouetteLinesPathD format and safety
          expect(cone!.silhouetteLinesPathD).toMatch(/^M\s.+L\s.+M\s.+L\s.+$/);
          expect(cone!.silhouetteLinesPathD).not.toContain('NaN');
          expect(cone!.silhouetteLinesPathD).not.toContain('Infinity');
        }
      });

      // 5. 8 laserRays are generated with valid starts, ends, and alternating colors at all intermediate frames
      it('generates 8 laserRays with valid starts, ends, and alternating colors at all intermediate frames', () => {
        const intermediateLambdas = [0.45, 0.55, 0.70, 0.85, 0.95, 1.0];

        for (const morphLambda of intermediateLambdas) {
          const model = generateArmillaryModel({
            ...basePhase2Params,
            morphLambda
          });

          const cone = model.observerCone;
          expect(cone).toBeDefined();
          expect(cone!.laserRays).toBeDefined();
          expect(cone!.laserRays!.length).toBe(8);

          for (let j = 0; j < 8; j++) {
            const ray = cone!.laserRays![j];
            // Ray start must match apex observerScreenPos
            expect(ray.start.x).toBeCloseTo(cone!.observerScreenPos.x, 3);
            expect(ray.start.y).toBeCloseTo(cone!.observerScreenPos.y, 3);

            // Ray end must be finite
            expect(Number.isFinite(ray.end.x)).toBe(true);
            expect(Number.isFinite(ray.end.y)).toBe(true);
            expect(Number.isNaN(ray.end.x)).toBe(false);
            expect(Number.isNaN(ray.end.y)).toBe(false);

            // Alternating cardinal / intercardinal colors
            const angleDeg = j * 45;
            const expectedColor = angleDeg % 90 === 0 ? '#38bdf8' : '#fbbf24';
            expect(ray.color).toBe(expectedColor);
            expect(ray.opacity).toBe(0.6);
          }
        }
      });

      // 6. focalBeacon and observerCone match in conePathD and ray endpoints when lambda > 0.45
      it('matches focalBeacon and observerCone in conePathD and ray endpoints when lambda > 0.45', () => {
        const activeLambdas = [0.50, 0.65, 0.80, 0.95, 1.0];

        for (const morphLambda of activeLambdas) {
          const model = generateArmillaryModel({
            ...basePhase2Params,
            morphLambda
          });

          expect(model.focalBeacon).toBeDefined();
          expect(model.observerCone).toBeDefined();

          // conePathD exact match
          expect(model.focalBeacon!.conePathD).toBe(model.observerCone!.conePathD);

          // focalScreenPos matches observerScreenPos
          expect(model.focalBeacon!.focalScreenPos.x).toBeCloseTo(model.observerCone!.observerScreenPos.x, 4);
          expect(model.focalBeacon!.focalScreenPos.y).toBeCloseTo(model.observerCone!.observerScreenPos.y, 4);

          // 8 laser rays match identically
          expect(model.focalBeacon!.laserRays.length).toBe(8);
          expect(model.observerCone!.laserRays!.length).toBe(8);

          for (let j = 0; j < 8; j++) {
            const fRay = model.focalBeacon!.laserRays[j];
            const oRay = model.observerCone!.laserRays![j];

            expect(fRay.start.x).toBeCloseTo(oRay.start.x, 4);
            expect(fRay.start.y).toBeCloseTo(oRay.start.y, 4);
            expect(fRay.end.x).toBeCloseTo(oRay.end.x, 4);
            expect(fRay.end.y).toBeCloseTo(oRay.end.y, 4);
            expect(fRay.color).toBe(oRay.color);
            expect(fRay.opacity).toBe(oRay.opacity);
          }
        }
      });
    });
});
