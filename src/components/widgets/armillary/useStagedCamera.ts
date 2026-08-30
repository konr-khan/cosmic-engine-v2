import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArmillaryProjectionMode, ArmillaryCameraState } from './types';

export const DEFAULT_ARMILLARY_CAMERA: ArmillaryCameraState = {
  pitch: 25,
  yaw: 35,
  roll: 0
};

/**
 * 2-Phase Staged SO(3) Camera Choreography Helper:
 * - Phase A (lambda in [0.0 -> 0.45]): Smoothly reorients pitch -> 90°/0° and yaw -> 0° using shortest angular geodesic delta.
 * - Phase B (lambda in [0.45 -> 1.0]): Camera remains strictly locked at canonical pole (90°, 0° for stereographic/horizon, 0°, 0° for rojas).
 * - Symmetric Reverse (lambda in [1.0 -> 0.0]): Camera remains locked at pole until lambda <= 0.45, then smoothly uncurls to saved3DCamera.
 */
export const computeStagedCamera = (
  targetMode: ArmillaryProjectionMode,
  lambda: number,
  saved3D: ArmillaryCameraState,
  fromMode?: ArmillaryProjectionMode
): ArmillaryCameraState => {
  const is3DTarget = targetMode === 'heliocentric' || targetMode === 'geocentric';
  if (is3DTarget && lambda <= 0.001) {
    return saved3D;
  }

  // Canonical projection pole:
  // Rojas Orthographic aligns along solstitial colure (pitch = 0°, yaw = 0°)
  // Stereographic and Topocentric Horizon align with Zenith/NCP pole (pitch = 90°, yaw = 0°)
  const isRojas = targetMode === 'rojas' || (is3DTarget && fromMode === 'rojas');
  const targetCam: ArmillaryCameraState = isRojas
    ? { pitch: 0, yaw: 0, roll: 0 }
    : { pitch: 90, yaw: 0, roll: 0 };

  // Phase A: Alignment completes across lambda in [0.0 -> 0.45]
  // Phase B: Camera is locked at canonical pole for lambda in [0.45 -> 1.0]
  const pCam = Math.max(0, Math.min(1, lambda / 0.45));
  const deltaPitch = targetCam.pitch - saved3D.pitch;
  const deltaYaw = (targetCam.yaw - saved3D.yaw + 540) % 360 - 180;

  const pitchVal = parseFloat((saved3D.pitch + deltaPitch * pCam).toFixed(1));
  const yawVal = parseFloat(((saved3D.yaw + deltaYaw * pCam + 360) % 360).toFixed(1));

  return {
    pitch: Object.is(pitchVal, -0) ? 0 : pitchVal,
    yaw: Object.is(yawVal, -0) || yawVal === 360 ? 0 : yawVal,
    roll: 0
  };
};

export interface UseStagedCameraOptions {
  initialCamera?: ArmillaryCameraState;
  initialMode?: ArmillaryProjectionMode;
  initialLambda?: number;
}

export interface UseStagedCameraResult {
  camera: ArmillaryCameraState;
  saved3DCameraRef: React.MutableRefObject<ArmillaryCameraState>;
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode: ArmillaryProjectionMode;
  projectionTransitionT: number;
  morphLambda: number;
  setCamera: React.Dispatch<React.SetStateAction<ArmillaryCameraState>>;
  setProjectionMode: React.Dispatch<React.SetStateAction<ArmillaryProjectionMode>>;
  setFromProjectionMode: React.Dispatch<React.SetStateAction<ArmillaryProjectionMode>>;
  setProjectionTransitionT: React.Dispatch<React.SetStateAction<number>>;
  setMorphLambda: React.Dispatch<React.SetStateAction<number>>;
  handleCameraChange: (newCam: ArmillaryCameraState) => void;
  handleMorphChange: (newLambda: number) => void;
  handleSnapToPreset: (targetMode: ArmillaryProjectionMode, targetLambda: number) => void;
  getCanonicalCameraForMode: (mode: ArmillaryProjectionMode, lambda: number) => ArmillaryCameraState;
}

/**
 * Custom hook decoupling 2-phase SO(3) camera staging choreography,
 * canonical projection pole locking, shortest geodesic wrapping,
 * and user 3D angle restoration.
 */
export function useStagedCamera(options: UseStagedCameraOptions = {}): UseStagedCameraResult {
  const initialCam = options.initialCamera ?? DEFAULT_ARMILLARY_CAMERA;
  const initialMode = options.initialMode ?? 'geocentric';
  const initialLambda = options.initialLambda ?? 0.0;

  const [projectionMode, setProjectionMode] = useState<ArmillaryProjectionMode>(initialMode);
  const [fromProjectionMode, setFromProjectionMode] = useState<ArmillaryProjectionMode>(initialMode);
  const [projectionTransitionT, setProjectionTransitionT] = useState<number>(1.0);
  const [morphLambda, setMorphLambda] = useState<number>(initialLambda);
  const [camera, setCamera] = useState<ArmillaryCameraState>(initialCam);

  // Persistent reference preserving user's custom 3D viewing perspective
  const saved3DCameraRef = useRef<ArmillaryCameraState>(initialCam);
  const animRef = useRef<number | null>(null);

  // Cancel any in-flight spring animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  const getCanonicalCameraForMode = useCallback(
    (mode: ArmillaryProjectionMode, lambda: number): ArmillaryCameraState => {
      return computeStagedCamera(mode, lambda, saved3DCameraRef.current, fromProjectionMode);
    },
    [fromProjectionMode]
  );

  const handleCameraChange = useCallback(
    (newCam: ArmillaryCameraState) => {
      setCamera(newCam);
      // Geodesic Delta Memory Invariant: Only update saved3D perspective during 3D modes
      const is3D = projectionMode === 'geocentric' || projectionMode === 'heliocentric' || morphLambda <= 0.05;
      if (is3D) {
        saved3DCameraRef.current = newCam;
      }
    },
    [projectionMode, morphLambda]
  );

  const handleMorphChange = useCallback(
    (newLambda: number) => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      setMorphLambda(newLambda);
      const nextCam = computeStagedCamera(projectionMode, newLambda, saved3DCameraRef.current, fromProjectionMode);
      setCamera(nextCam);
    },
    [fromProjectionMode, projectionMode]
  );

  const handleSnapToPreset = useCallback(
    (targetMode: ArmillaryProjectionMode, targetLambda: number) => {
      if (animRef.current) cancelAnimationFrame(animRef.current);

      const isModeSwitch = targetMode !== projectionMode;

      if (isModeSwitch) {
        setFromProjectionMode(projectionMode);
        setProjectionMode(targetMode);
        setProjectionTransitionT(0.0);
      } else {
        setProjectionMode(targetMode);
        setFromProjectionMode(targetMode);
        setProjectionTransitionT(1.0);
      }

      const startLambda = morphLambda;
      const startT = isModeSwitch ? 0.0 : 1.0;
      const saved3D = saved3DCameraRef.current;
      const prevMode = projectionMode;

      const startTime = performance.now();
      const duration = 650; // ms ease-out cubic spring curve

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic curve for natural deceleration
        const ease = 1 - Math.pow(1 - progress, 3);

        const nextLambda = startLambda + (targetLambda - startLambda) * ease;
        const clampedLambda = parseFloat(nextLambda.toFixed(3));
        setMorphLambda(clampedLambda);

        if (isModeSwitch) {
          const nextT = startT + (1.0 - startT) * ease;
          setProjectionTransitionT(parseFloat(nextT.toFixed(3)));
        }

        // Smoothly swing camera into projection pole alignment using 2-phase staged choreography
        const nextCam = computeStagedCamera(targetMode, clampedLambda, saved3D, prevMode);
        setCamera(nextCam);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          setMorphLambda(targetLambda);
          setProjectionTransitionT(1.0);
          setFromProjectionMode(targetMode);
          setCamera(computeStagedCamera(targetMode, targetLambda, saved3D, prevMode));
          animRef.current = null;
        }
      };

      animRef.current = requestAnimationFrame(step);
    },
    [morphLambda, projectionMode]
  );

  return {
    camera,
    saved3DCameraRef,
    projectionMode,
    fromProjectionMode,
    projectionTransitionT,
    morphLambda,
    setCamera,
    setProjectionMode,
    setFromProjectionMode,
    setProjectionTransitionT,
    setMorphLambda,
    handleCameraChange,
    handleMorphChange,
    handleSnapToPreset,
    getCanonicalCameraForMode
  };
}
