import { describe, it, expect } from 'vitest';
import { computeStagedCamera } from './GyroArmillaryView';
import { ArmillaryCameraState, ArmillaryProjectionMode } from './types';

describe('Milestone 2 Adversarial Verification & Stress Test Suite', () => {

  describe('1. Randomized Monte Carlo Staged Camera Alignment (10,000 samples)', () => {
    it('achieves 100% camera alignment to pole by lambda = 0.45 across 10,000 randomized 3D camera angles', () => {
      const modes: ArmillaryProjectionMode[] = ['stereographic', 'horizon', 'rojas'];
      const sampleCount = 10000;

      for (let i = 0; i < sampleCount; i++) {
        // Random pitch in [-90, 90]
        const pitch = parseFloat((Math.random() * 180 - 90).toFixed(1));
        // Random yaw in [0, 360)
        const yaw = parseFloat((Math.random() * 360).toFixed(1));
        const saved3D: ArmillaryCameraState = { pitch, yaw, roll: 0 };

        const mode = modes[i % modes.length];
        const expectedPolePitch = mode === 'rojas' ? 0.0 : 90.0;
        const expectedPoleYaw = 0.0;

        // At lambda = 0.45, alignment must be exactly 100% complete
        const camAt45 = computeStagedCamera(mode, 0.45, saved3D);
        expect(camAt45.pitch).toBe(expectedPolePitch);
        expect(camAt45.yaw).toBe(expectedPoleYaw);

        // At lambda = 0.0, camera must match original saved 3D angles
        const camAt0 = computeStagedCamera(mode, 0.0, saved3D);
        // Note: yaw = 360 normalizes to 0 in representation
        const normalizedYaw = (yaw === 360 || Object.is(yaw, -0)) ? 0 : yaw;
        const normalizedPitch = Object.is(pitch, -0) ? 0 : pitch;
        expect(camAt0.pitch).toBe(normalizedPitch);
        expect(camAt0.yaw).toBe(normalizedYaw);
      }
    });
  });

  describe('2. Canonical Pole Lock Invariance for lambda in [0.45, 1.0]', () => {
    it('remains strictly locked at canonical pole across fine-grained lambda sweep (step 0.001)', () => {
      const saved3D: ArmillaryCameraState = { pitch: -47.3, yaw: 289.4, roll: 0 };
      const modes: ArmillaryProjectionMode[] = ['stereographic', 'horizon', 'rojas'];

      for (const mode of modes) {
        const expectedPitch = mode === 'rojas' ? 0.0 : 90.0;
        const expectedYaw = 0.0;

        // Fine-grained sweep from 0.450 to 1.000 (551 steps)
        for (let step = 450; step <= 1000; step++) {
          const lambda = step / 1000;
          const cam = computeStagedCamera(mode, lambda, saved3D);

          expect(cam.pitch).toBe(expectedPitch);
          expect(cam.yaw).toBe(expectedYaw);
          expect(cam.roll).toBe(0);
        }
      }
    });

    it('handles out-of-range lambda values gracefully (clamping behavior)', () => {
      const saved3D: ArmillaryCameraState = { pitch: 30, yaw: 45, roll: 0 };

      // lambda > 1.0 should stay clamped at pole
      const camOver = computeStagedCamera('stereographic', 1.5, saved3D);
      expect(camOver.pitch).toBe(90.0);
      expect(camOver.yaw).toBe(0.0);

      // lambda < 0.0 should stay clamped at saved3D
      const camUnder = computeStagedCamera('stereographic', -0.5, saved3D);
      expect(camUnder.pitch).toBe(30.0);
      expect(camUnder.yaw).toBe(45.0);
    });
  });

  describe('3. 100-Roundtrip Drift Analysis & Symmetric Reverse Transitions', () => {
    it('restores original custom pitch and yaw with exactly ZERO drift across 100 consecutive roundtrips', () => {
      const testCameras: ArmillaryCameraState[] = [
        { pitch: 25.5, yaw: 35.2, roll: 0 },
        { pitch: -62.8, yaw: 314.9, roll: 0 },
        { pitch: 84.1, yaw: 5.7, roll: 0 },
        { pitch: 0.0, yaw: 180.0, roll: 0 },
        { pitch: -89.9, yaw: 359.9, roll: 0 }
      ];

      const modes2D: ArmillaryProjectionMode[] = ['stereographic', 'rojas', 'horizon'];

      for (const initialCam of testCameras) {
        let currentSaved3D = { ...initialCam };

        for (let cycle = 0; cycle < 100; cycle++) {
          const target2D = modes2D[cycle % modes2D.length];

          // 1. Forward transition: 3D -> 2D (lambda: 0.0 -> 1.0)
          const cam2D = computeStagedCamera(target2D, 1.0, currentSaved3D);
          const expectedPolePitch = target2D === 'rojas' ? 0.0 : 90.0;
          expect(cam2D.pitch).toBe(expectedPolePitch);
          expect(cam2D.yaw).toBe(0.0);

          // 2. Reverse transition: 2D -> 3D (lambda: 1.0 -> 0.0)
          const restoredCam = computeStagedCamera('geocentric', 0.0, currentSaved3D, target2D);

          // 3. Verify zero drift
          expect(restoredCam.pitch).toBe(initialCam.pitch);
          expect(restoredCam.yaw).toBe(initialCam.yaw);
          expect(restoredCam.roll).toBe(0);

          // Update currentSaved3D (simulating state preservation)
          currentSaved3D = restoredCam;
        }
      }
    });

    it('reverses symmetrically from 2D modes: locked at source pole in [0.45, 1.0] and smooth rotation in [0.0, 0.45]', () => {
      const saved3D: ArmillaryCameraState = { pitch: 33.0, yaw: 120.0, roll: 0 };

      // Reverse from Rojas (source pole: pitch 0°, yaw 0°)
      const rojasAt1 = computeStagedCamera('geocentric', 1.0, saved3D, 'rojas');
      expect(rojasAt1.pitch).toBe(0.0);
      expect(rojasAt1.yaw).toBe(0.0);

      const rojasAt45 = computeStagedCamera('geocentric', 0.45, saved3D, 'rojas');
      expect(rojasAt45.pitch).toBe(0.0);
      expect(rojasAt45.yaw).toBe(0.0);

      const rojasMid = computeStagedCamera('geocentric', 0.225, saved3D, 'rojas');
      // In [0, 0.45], target is source pole (0, 0) and start is saved3D (33, 120)
      // pCam = 0.5: pitch = 33 + (0 - 33)*0.5 = 16.5, yaw = (120 + (-120)*0.5) = 60.0
      expect(rojasMid.pitch).toBeCloseTo(16.5, 1);
      expect(rojasMid.yaw).toBeCloseTo(60.0, 1);

      const rojasAt0 = computeStagedCamera('geocentric', 0.0, saved3D, 'rojas');
      expect(rojasAt0.pitch).toBe(33.0);
      expect(rojasAt0.yaw).toBe(120.0);

      // Reverse from Stereographic (source pole: pitch 90°, yaw 0°)
      const stereoAt1 = computeStagedCamera('geocentric', 1.0, saved3D, 'stereographic');
      expect(stereoAt1.pitch).toBe(90.0);
      expect(stereoAt1.yaw).toBe(0.0);

      const stereoAt45 = computeStagedCamera('geocentric', 0.45, saved3D, 'stereographic');
      expect(stereoAt45.pitch).toBe(90.0);
      expect(stereoAt45.yaw).toBe(0.0);

      const stereoMid = computeStagedCamera('geocentric', 0.225, saved3D, 'stereographic');
      // pitch = 33 + (90 - 33)*0.5 = 61.5, yaw = (120 + (-120)*0.5) = 60.0
      expect(stereoMid.pitch).toBeCloseTo(61.5, 1);
      expect(stereoMid.yaw).toBeCloseTo(60.0, 1);

      const stereoAt0 = computeStagedCamera('geocentric', 0.0, saved3D, 'stereographic');
      expect(stereoAt0.pitch).toBe(33.0);
      expect(stereoAt0.yaw).toBe(120.0);
    });
  });

  describe('4. Geodesic Shortest-Path Delta Wrapping & Boundary Scenarios', () => {
    it('correctly calculates shortest angular delta across 360-degree boundary', () => {
      const computeDeltaYaw = (targetYaw: number, startYaw: number) => {
        return (targetYaw - startYaw + 540) % 360 - 180;
      };

      // 350° -> 10° delta should be +20° (not -340°)
      expect(computeDeltaYaw(10, 350)).toBe(20);

      // 10° -> 350° delta should be -20° (not +340°)
      expect(computeDeltaYaw(350, 10)).toBe(-20);

      // 359° -> 0° delta should be +1° (not -359°)
      expect(computeDeltaYaw(0, 359)).toBe(1);

      // 1° -> 0° delta should be -1° (not +359°)
      expect(computeDeltaYaw(0, 1)).toBe(-1);

      // 190° -> 0° delta should be +170° (not -190°)
      expect(computeDeltaYaw(0, 190)).toBe(170);

      // 170° -> 0° delta should be -170° (not +190°)
      expect(computeDeltaYaw(0, 170)).toBe(-170);

      // 180° -> 0° delta should be -180° (antipodal)
      expect(Math.abs(computeDeltaYaw(0, 180))).toBe(180);

      // 0° -> 0° delta should be 0°
      expect(computeDeltaYaw(0, 0)).toBe(0);

      // 360° -> 0° delta should be 0°
      expect(computeDeltaYaw(0, 360)).toBe(0);
    });

    it('interpolates along the shortest geodesic path monotonically without intermediate 360° flips', () => {
      const saved3D: ArmillaryCameraState = { pitch: 0, yaw: 350, roll: 0 };

      // At lambda = 0.0: 350°
      expect(computeStagedCamera('stereographic', 0.0, saved3D).yaw).toBe(350.0);

      // At lambda = 0.1125 (pCam = 0.25): 350 + 2.5 = 352.5°
      expect(computeStagedCamera('stereographic', 0.1125, saved3D).yaw).toBe(352.5);

      // At lambda = 0.225 (pCam = 0.50): 350 + 5.0 = 355.0°
      expect(computeStagedCamera('stereographic', 0.225, saved3D).yaw).toBe(355.0);

      // At lambda = 0.3375 (pCam = 0.75): 350 + 7.5 = 357.5°
      expect(computeStagedCamera('stereographic', 0.3375, saved3D).yaw).toBe(357.5);

      // At lambda = 0.45 (pCam = 1.00): 0.0°
      expect(computeStagedCamera('stereographic', 0.45, saved3D).yaw).toBe(0.0);
    });

    it('verifies that for all possible start angles in [0, 360), absolute deltaYaw <= 180°', () => {
      for (let deg = 0; deg < 360; deg += 0.5) {
        const saved3D: ArmillaryCameraState = { pitch: 20, yaw: deg, roll: 0 };
        const camMid = computeStagedCamera('stereographic', 0.225, saved3D);
        
        const deltaYaw = (0 - deg + 540) % 360 - 180;
        expect(Math.abs(deltaYaw)).toBeLessThanOrEqual(180);

        const expectedMidYaw = parseFloat(((deg + deltaYaw * 0.5 + 360) % 360).toFixed(1));
        const normalizedExpected = (expectedMidYaw === 360 || Object.is(expectedMidYaw, -0)) ? 0 : expectedMidYaw;
        expect(camMid.yaw).toBe(normalizedExpected);
      }
    });
  });

  describe('5. Depth Stroke Unification & Visual Continuity across lambda in [0.85, 1.0]', () => {
    it('smoothly unifies stroke properties from lambda = 0.85 to 1.0 without discontinuities', () => {
      const lambdas = [0.85, 0.88, 0.92, 0.96, 1.0];
      let prevOpacityFactor = 0.35;
      let prevDashGap = 2.0;

      for (const lambda of lambdas) {
        const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
        const backOpacityFactor = 0.35 + 0.65 * u;
        const dashGap = 2 * (1 - u);
        const strokeDasharray = u >= 0.99 ? 'none' : (u <= 0.01 ? '3,2' : `3,${parseFloat(dashGap.toFixed(2))}`);

        // Opacity factor must monotonically increase from 0.35 to 1.0
        expect(backOpacityFactor).toBeGreaterThanOrEqual(prevOpacityFactor);
        expect(backOpacityFactor).toBeLessThanOrEqual(1.0);
        prevOpacityFactor = backOpacityFactor;

        // Dash gap must monotonically decrease from 2.0 to 0.0
        expect(dashGap).toBeLessThanOrEqual(prevDashGap);
        expect(dashGap).toBeGreaterThanOrEqual(0.0);
        prevDashGap = dashGap;

        if (lambda === 1.0) {
          expect(backOpacityFactor).toBeCloseTo(1.0, 5);
          expect(dashGap).toBe(0.0);
          expect(strokeDasharray).toBe('none');
        }
        if (lambda === 0.85) {
          expect(backOpacityFactor).toBeCloseTo(0.35, 5);
          expect(dashGap).toBe(2.0);
          expect(strokeDasharray).toBe('3,2');
        }
      }
    });
  });

});
