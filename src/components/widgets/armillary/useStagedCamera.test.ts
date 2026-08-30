import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArmillaryCameraState } from './types';

// Mock React hooks to test useStagedCamera deterministically in node test environment
let stateStore: Record<string, any> = {};
let stateCounter = 0;

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useState: (initial: any) => {
      const id = String(stateCounter++);
      if (!(id in stateStore)) {
        stateStore[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setter = (val: any) => {
        stateStore[id] = typeof val === 'function' ? val(stateStore[id]) : val;
      };
      return [stateStore[id], setter];
    },
    useRef: (initial: any) => {
      const id = 'ref_' + String(stateCounter++);
      if (!(id in stateStore)) {
        stateStore[id] = { current: initial };
      }
      return stateStore[id];
    },
    useCallback: (fn: any) => fn,
    useEffect: (effect: () => any) => { effect(); }
  };
});

import { 
  useStagedCamera, 
  computeStagedCamera, 
  DEFAULT_ARMILLARY_CAMERA 
} from './useStagedCamera';

describe('useStagedCamera & computeStagedCamera', () => {
  beforeEach(() => {
    stateStore = {};
    stateCounter = 0;
  });

  describe('computeStagedCamera (Pure Choreography Derivations)', () => {
    const custom3D: ArmillaryCameraState = { pitch: 25, yaw: 35, roll: 0 };

    it('preserves saved 3D camera state in 3D modes when lambda <= 0.001', () => {
      const camHelio = computeStagedCamera('heliocentric', 0.0, custom3D);
      expect(camHelio).toEqual(custom3D);

      const camGeo = computeStagedCamera('geocentric', 0.0005, custom3D);
      expect(camGeo).toEqual(custom3D);
    });

    it('interpolates pitch towards 90° and yaw towards 0° over Phase A (lambda in [0, 0.45]) for stereographic mode', () => {
      // At lambda = 0.225 (50% through Phase A)
      const camMid = computeStagedCamera('stereographic', 0.225, custom3D);
      // deltaPitch = 90 - 25 = 65 -> 25 + 32.5 = 57.5
      expect(camMid.pitch).toBeCloseTo(57.5, 1);
      // deltaYaw = (0 - 35 + 540) % 360 - 180 = -35 -> 35 - 17.5 = 17.5
      expect(camMid.yaw).toBeCloseTo(17.5, 1);

      // At lambda = 0.45 (100% completion of Phase A)
      const camEndPhaseA = computeStagedCamera('stereographic', 0.45, custom3D);
      expect(camEndPhaseA.pitch).toBe(90);
      expect(camEndPhaseA.yaw).toBe(0);
    });

    it('strictly locks camera at canonical pole (90°, 0°) over Phase B (lambda in [0.45, 1.0]) for stereographic and horizon modes', () => {
      const lambdas = [0.45, 0.5, 0.75, 0.9, 1.0];
      for (const lam of lambdas) {
        const camStereo = computeStagedCamera('stereographic', lam, custom3D);
        expect(camStereo.pitch).toBe(90);
        expect(camStereo.yaw).toBe(0);

        const camHorizon = computeStagedCamera('horizon', lam, custom3D);
        expect(camHorizon.pitch).toBe(90);
        expect(camHorizon.yaw).toBe(0);
      }
    });

    it('aligns to (pitch = 0°, yaw = 0°) for Rojas Orthographic mode', () => {
      const camRojasA = computeStagedCamera('rojas', 0.225, custom3D);
      // deltaPitch = 0 - 25 = -25 -> 25 - 12.5 = 12.5
      expect(camRojasA.pitch).toBeCloseTo(12.5, 1);

      const camRojasB = computeStagedCamera('rojas', 0.85, custom3D);
      expect(camRojasB.pitch).toBe(0);
      expect(camRojasB.yaw).toBe(0);
    });

    it('computes shortest geodesic delta when yaw crosses 180° / 360° boundary', () => {
      // Saved yaw is 350° (10° west of 0°) -> delta must be +10°, not -350°
      const west3D: ArmillaryCameraState = { pitch: 30, yaw: 350, roll: 0 };
      const camHalf = computeStagedCamera('stereographic', 0.225, west3D);
      // deltaYaw = (0 - 350 + 540) % 360 - 180 = +10 -> 350 + 5 = 355
      expect(camHalf.yaw).toBeCloseTo(355, 1);

      const camFull = computeStagedCamera('stereographic', 0.45, west3D);
      expect(camFull.yaw).toBe(0);
    });
  });

  describe('useStagedCamera Hook', () => {
    it('initializes with default camera and mode state', () => {
      const hookResult = useStagedCamera();
      expect(hookResult.camera).toEqual(DEFAULT_ARMILLARY_CAMERA);
      expect(hookResult.projectionMode).toBe('geocentric');
      expect(hookResult.morphLambda).toBe(0.0);
      expect(hookResult.saved3DCameraRef.current).toEqual(DEFAULT_ARMILLARY_CAMERA);
    });

    it('updates saved3DCameraRef when user drags camera in 3D mode (lambda = 0)', () => {
      stateStore = {};
      stateCounter = 0;
      const hookResult = useStagedCamera({ initialMode: 'geocentric', initialLambda: 0.0 });

      const newCustomAngle: ArmillaryCameraState = { pitch: 45, yaw: 120, roll: 0 };
      hookResult.handleCameraChange(newCustomAngle);

      expect(hookResult.saved3DCameraRef.current).toEqual(newCustomAngle);
    });

    it('preserves saved3DCameraRef without overwrite when camera changes in 2D mode (lambda = 1.0)', () => {
      stateStore = {};
      stateCounter = 0;
      const customAngle: ArmillaryCameraState = { pitch: 45, yaw: 120, roll: 0 };
      const hookResult = useStagedCamera({ initialCamera: customAngle, initialMode: 'stereographic', initialLambda: 1.0 });

      // Verify initial saved angle is preserved
      expect(hookResult.saved3DCameraRef.current).toEqual(customAngle);

      // Attempt to change camera in 2D mode
      const tempCam: ArmillaryCameraState = { pitch: 90, yaw: 0, roll: 0 };
      hookResult.handleCameraChange(tempCam);

      // Memory Invariant: saved3D angle must NOT be overwritten in 2D mode
      expect(hookResult.saved3DCameraRef.current).toEqual(customAngle);
    });

    it('smoothly reorients camera on handleMorphChange', () => {
      stateStore = {};
      stateCounter = 0;
      const customAngle: ArmillaryCameraState = { pitch: 20, yaw: 40, roll: 0 };
      const hookResult = useStagedCamera({ initialCamera: customAngle, initialMode: 'stereographic', initialLambda: 0.0 });

      hookResult.handleMorphChange(0.45);

      const canonical = hookResult.getCanonicalCameraForMode('stereographic', 0.45);
      expect(canonical.pitch).toBe(90);
      expect(canonical.yaw).toBe(0);
    });
  });
});
