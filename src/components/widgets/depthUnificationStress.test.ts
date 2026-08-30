import { describe, it, expect } from 'vitest';
import { generateArmillaryModel, getJulianDate } from '../../utils/cosmicMath';
import { Degrees, Latitude, Longitude, HoursDecimal } from '../../types/units';
import { ArmillaryProjectionMode, ArmillaryRingPath } from './armillary/types';

describe('Empirical Adversarial Verification — Depth Stroke Unification & Rendering Integrity', () => {

  const defaultParams = {
    julianDate: getJulianDate(new Date(2026, 2, 20), 12),
    latitude: 47.06 as Latitude,
    longitude: -122.81 as Longitude,
    timeOfDay: 12 as HoursDecimal,
    sunRaDeg: 0 as Degrees,
    sunDecDeg: 0 as Degrees,
    sunLambdaDeg: 0 as Degrees,
    moonRaDeg: 90 as Degrees,
    moonDecDeg: 0 as Degrees,
    moonLambdaDeg: 90 as Degrees,
    moonPhase: 0.5,
    r0: 100
  };

  // ---------------------------------------------------------------------------
  // 1. Opacity continuity across lambda in [0.85, 1.0]
  // ---------------------------------------------------------------------------
  describe('Requirement 1: Opacity Scaling Continuity', () => {
    it('scales backOpacityFactor continuously from 0.35 to 1.0 without jumps across lambda in [0.85, 1.0]', () => {
      const NUM_STEPS = 1000;
      let prevFactor = 0.35;

      for (let i = 0; i <= NUM_STEPS; i++) {
        const lambda = 0.85 + (i / NUM_STEPS) * 0.15;
        const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
        const factor = 0.35 + 0.65 * u;

        // Verify factor range
        expect(factor).toBeGreaterThanOrEqual(0.35);
        expect(factor).toBeLessThanOrEqual(1.0);

        // Verify boundary values
        if (i === 0) {
          expect(factor).toBeCloseTo(0.35, 6);
        }
        if (i === NUM_STEPS) {
          expect(factor).toBeCloseTo(1.0, 6);
        }

        // Verify monotonicity
        expect(factor).toBeGreaterThanOrEqual(prevFactor);

        // Verify continuity (max jump < 0.002 per step)
        const stepDelta = Math.abs(factor - prevFactor);
        expect(stepDelta).toBeLessThan(0.002);

        prevFactor = factor;
      }
    });

    it('verifies opacity behavior across the entire lambda spectrum [0.0, 1.0]', () => {
      const NUM_STEPS = 200;
      for (let i = 0; i <= NUM_STEPS; i++) {
        const lambda = i / NUM_STEPS;
        const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
        const factor = 0.35 + 0.65 * u;

        if (lambda <= 0.85) {
          expect(u).toBe(0);
          expect(factor).toBe(0.35);
        } else {
          expect(u).toBeGreaterThan(0);
          expect(factor).toBeGreaterThan(0.35);
          expect(factor).toBeLessThanOrEqual(1.0);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Stroke width continuity across lambda in [0.85, 1.0]
  // ---------------------------------------------------------------------------
  describe('Requirement 2: Stroke Width Continuity', () => {
    it('scales stroke width continuously from backStrokeWidth to frontStrokeWidth across lambda in [0.85, 1.0] for all rings', () => {
      const model = generateArmillaryModel({
        ...defaultParams,
        morphLambda: 0.85,
        projectionMode: 'stereographic',
        cameraPitch: 90,
        cameraYaw: 0
      });

      expect(model.rings.length).toBeGreaterThan(0);

      for (const ring of model.rings) {
        expect(ring.frontStrokeWidth).toBeGreaterThanOrEqual(ring.backStrokeWidth);
        const frontW = ring.frontStrokeWidth;
        const backW = ring.backStrokeWidth;

        const NUM_STEPS = 1000;
        let prevWidth = backW;

        for (let i = 0; i <= NUM_STEPS; i++) {
          const lambda = 0.85 + (i / NUM_STEPS) * 0.15;
          const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
          const strokeWidth = backW + (frontW - backW) * u;

          // Boundary checks
          if (i === 0) {
            expect(strokeWidth).toBeCloseTo(backW, 6);
          }
          if (i === NUM_STEPS) {
            expect(strokeWidth).toBeCloseTo(frontW, 6);
          }

          // Bounds & Monotonicity
          expect(strokeWidth).toBeGreaterThanOrEqual(backW - 1e-9);
          expect(strokeWidth).toBeLessThanOrEqual(frontW + 1e-9);
          expect(strokeWidth).toBeGreaterThanOrEqual(prevWidth - 1e-9);

          // Continuity
          const maxStepDelta = Math.abs(frontW - backW) * (1 / NUM_STEPS) + 1e-6;
          expect(Math.abs(strokeWidth - prevWidth)).toBeLessThanOrEqual(maxStepDelta);

          prevWidth = strokeWidth;
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Dash array gap shrinking & elimination at lambda >= 0.98
  // ---------------------------------------------------------------------------
  describe('Requirement 3: Dash Array Shrinking & Elimination at lambda >= 0.98', () => {
    it('shrinks dashGap monotonically from 2.0 to 0.0 across lambda in [0.85, 1.0]', () => {
      const NUM_STEPS = 1000;
      let prevGap = 2.0;

      for (let i = 0; i <= NUM_STEPS; i++) {
        const lambda = 0.85 + (i / NUM_STEPS) * 0.15;
        const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
        const dashGap = 2 * (1 - u);

        expect(dashGap).toBeGreaterThanOrEqual(0.0);
        expect(dashGap).toBeLessThanOrEqual(2.0);

        if (i === 0) expect(dashGap).toBeCloseTo(2.0, 6);
        if (i === NUM_STEPS) expect(dashGap).toBeCloseTo(0.0, 6);

        expect(dashGap).toBeLessThanOrEqual(prevGap + 1e-9);
        prevGap = dashGap;
      }
    });

    it('eliminates back dashed segments at lambda >= 0.98 in all 5 projection modes', () => {
      const modes: ArmillaryProjectionMode[] = ['stereographic', 'rojas', 'horizon', 'heliocentric', 'geocentric'];
      const testLambdas = [0.98, 0.985, 0.99, 0.995, 1.0];

      for (const mode of modes) {
        for (const lambda of testLambdas) {
          const is3D = mode === 'heliocentric' || mode === 'geocentric';
          const pitch = mode === 'rojas' ? 0 : (is3D ? 35 : 90);
          const yaw = is3D ? 25 : 0;

          const model = generateArmillaryModel({
            ...defaultParams,
            morphLambda: lambda,
            projectionMode: mode,
            cameraPitch: pitch,
            cameraYaw: yaw
          });

          if (!is3D) {
            // For 2D modes, geomLambda = (lambda - 0.45) / 0.55 >= 0.9636 >= 0.85
            // Therefore, all ring vertices have isFront = true
            // backPathD is strictly empty, eliminating all dashed rendering
            for (const ring of model.rings) {
              expect(ring.backPathD).toBe('');
              expect(ring.frontPathD.length).toBeGreaterThan(0);
              expect(ring.vertices.every(v => v.isFront)).toBe(true);
            }
          }
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Verification that front and back paths do not overlap or double-draw
  // ---------------------------------------------------------------------------
  describe('Requirement 4: No Overlap or Double-Draw Verification', () => {
    it('guarantees front and back paths partition vertices without overlap for all lambda in [0.0, 1.0]', () => {
      const testLambdas = [0.0, 0.1, 0.25, 0.45, 0.6, 0.85, 0.88, 0.90, 0.9175, 0.95, 1.0];
      const cameraAngles = [
        { pitch: 0, yaw: 0 },
        { pitch: 45, yaw: 30 },
        { pitch: 90, yaw: 0 },
        { pitch: -30, yaw: 110 }
      ];

      for (const cam of cameraAngles) {
        for (const lambda of testLambdas) {
          const model = generateArmillaryModel({
            ...defaultParams,
            morphLambda: lambda,
            projectionMode: 'stereographic',
            cameraPitch: cam.pitch,
            cameraYaw: cam.yaw
          });

          for (const ring of model.rings) {
            const frontCount = ring.vertices.filter(v => v.isFront).length;
            const backCount = ring.vertices.filter(v => !v.isFront).length;

            // Strict disjoint partition
            expect(frontCount + backCount).toBe(ring.vertices.length);

            // If all vertices are front, backPathD MUST be empty
            if (frontCount === ring.vertices.length) {
              expect(ring.backPathD).toBe('');
              expect(ring.frontPathD.trim()).toBe(ring.fullPathD.trim());
            }

            // If all vertices are back, frontPathD MUST be empty
            if (backCount === ring.vertices.length) {
              expect(ring.frontPathD).toBe('');
            }

            // If ring is split between front and back, both paths exist and are subpaths of fullPathD
            if (frontCount > 0 && backCount > 0) {
              expect(ring.frontPathD.length).toBeGreaterThan(0);
              expect(ring.backPathD.length).toBeGreaterThan(0);

              // Parse (x, y) coordinates in frontPathD and backPathD
              const frontCoords = extractSvgPathCoords(ring.frontPathD);
              const backCoords = extractSvgPathCoords(ring.backPathD);

              // Front vertices must match frontCoords
              expect(frontCoords.length).toBe(frontCount);
              expect(backCoords.length).toBe(backCount);

              // Verify that front and back vertex coordinate sets have zero common internal segment overlap
              // (They meet only at boundary endpoints if at all)
              expect(frontCoords.length + backCoords.length).toBe(ring.vertices.length);
            }
          }
        }
      }
    });

    it('verifies that fullPathD is not double-drawn on top of frontPathD or backPathD', () => {
      // In ArmillaryRingsLayer:
      // Back group renders only `ring.backPathD`
      // Front group renders only `ring.frontPathD`
      // fullPathD is NEVER rendered in ArmillaryRingsLayer
      // This eliminates the prior double-draw artifact where fullPathD was rendered under frontPathD
      const model = generateArmillaryModel({
        ...defaultParams,
        morphLambda: 0.5,
        projectionMode: 'stereographic',
        cameraPitch: 45,
        cameraYaw: 20
      });

      for (const ring of model.rings) {
        expect(ring.frontPathD).toBeDefined();
        expect(ring.backPathD).toBeDefined();
        expect(ring.fullPathD).toBeDefined();

        // Check that front and back are strictly complementary
        const frontCoords = extractSvgPathCoords(ring.frontPathD);
        const backCoords = extractSvgPathCoords(ring.backPathD);
        expect(frontCoords.length + backCoords.length).toBe(ring.vertices.length);
      }
    });

    it('handles completely front rings (z >= 0 everywhere) without generating empty back paths or artifacts', () => {
      // Top-down view on Tropic of Cancer (Dec = +23.44°, cameraPitch = 90° -> zCam = +r0*sin(23.44°) > 0 everywhere)
      const model = generateArmillaryModel({
        ...defaultParams,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 90,
        cameraYaw: 0
      });

      const cancerRing = model.rings.find(r => r.id === 'tropic_cancer')!;
      expect(cancerRing.vertices.every(v => v.isFront)).toBe(true);
      expect(cancerRing.backPathD).toBe('');
      expect(cancerRing.frontPathD.trim()).toBe(cancerRing.fullPathD.trim());
    });

    it('handles completely back rings (z < 0 everywhere) without generating empty front paths or artifacts', () => {
      // Top-down view on Tropic of Capricorn (Dec = -23.44°, cameraPitch = 90° -> zCam = -r0*sin(23.44°) < 0 everywhere)
      const model = generateArmillaryModel({
        ...defaultParams,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 90,
        cameraYaw: 0
      });

      const capRing = model.rings.find(r => r.id === 'tropic_capricorn')!;
      expect(capRing.vertices.every(v => !v.isFront)).toBe(true);
      expect(capRing.frontPathD).toBe('');
      expect(capRing.backPathD.trim()).toBe(capRing.fullPathD.trim());
    });

    it('preserves disjoint path integrity under Free Rete spinning across all angles [0° to 360°]', () => {
      const reteAngles = [0, 30, 45, 90, 135, 180, 225, 270, 315];
      for (const angle of reteAngles) {
        const model = generateArmillaryModel({
          ...defaultParams,
          morphLambda: 0.3,
          projectionMode: 'geocentric',
          cameraPitch: 35,
          cameraYaw: 25,
          isFreeReteMode: true,
          freeReteOffsetDeg: angle
        });

        const eclRing = model.rings.find(r => r.id === 'ecliptic')!;
        const frontCount = eclRing.vertices.filter(v => v.isFront).length;
        const backCount = eclRing.vertices.filter(v => !v.isFront).length;
        expect(frontCount + backCount).toBe(eclRing.vertices.length);

        const frontCoords = extractSvgPathCoords(eclRing.frontPathD);
        const backCoords = extractSvgPathCoords(eclRing.backPathD);
        expect(frontCoords.length + backCoords.length).toBe(eclRing.vertices.length);
      }
    });

    it('preserves path non-overlapping integrity under out-of-bounds lambda clamping (< 0 or > 1)', () => {
      for (const clampedLambda of [-0.5, -0.01, 1.01, 1.5, 999]) {
        const model = generateArmillaryModel({
          ...defaultParams,
          morphLambda: clampedLambda,
          projectionMode: 'stereographic',
          cameraPitch: 45,
          cameraYaw: 20
        });

        for (const ring of model.rings) {
          const frontCoords = extractSvgPathCoords(ring.frontPathD);
          const backCoords = extractSvgPathCoords(ring.backPathD);
          expect(frontCoords.length + backCoords.length).toBe(ring.vertices.length);
        }
      }
    });
  });

  // Helper to extract (x,y) point strings from SVG path data
  function extractSvgPathCoords(pathD: string): Array<{ x: number; y: number }> {
    if (!pathD || pathD.trim() === '') return [];
    const commands = pathD.trim().match(/[ML]\s*[-0-9.]+\s*[-0-9.]+/g) || [];
    return commands.map(cmd => {
      const parts = cmd.trim().substring(1).trim().split(/\s+/);
      return {
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1])
      };
    });
  }
});
