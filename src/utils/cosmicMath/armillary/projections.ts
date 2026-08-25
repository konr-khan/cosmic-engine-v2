import { Degrees, Latitude } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, clamp } from '../core';
import { cartesian3DToEquatorial, equatorialToHorizontal } from './coordinates';
import { ArmillaryProjectionMode } from './types';

/**
 * Stereographic Conformal Projection
 * Projects from South Celestial Pole (0, -R0, 0) onto equatorial plane y = 0.
 * Conformal property: preserves all circles and angles (MATH_SPEC.md Section 7.E.1).
 * Singularity Guard: Bounded finite clamping for points near South Pole (y -> -R0).
 */
export function projectStereographicConformal(p: Vector3D, r0: number = 100): Vector2D {
  const denom = r0 + p.y;
  const maxBound = r0 * 10;
  if (Math.abs(denom) < 1e-6) {
    const safeSign = denom >= 0 ? 1 : -1;
    return {
      x: clamp(p.x * (r0 / (safeSign * 1e-6)), -maxBound, maxBound),
      y: clamp(p.z * (r0 / (safeSign * 1e-6)), -maxBound, maxBound)
    };
  }
  const scale = r0 / denom;
  return {
    x: clamp(p.x * scale, -maxBound, maxBound),
    y: clamp(p.z * scale, -maxBound, maxBound)
  };
}

/**
 * Universal Rojas Orthographic Projection
 * Projects orthographically onto the solstitial colure plane (meridian z = 0).
 * Historical property: Declinations map to parallel horizontal chords, hour circles to semi-ellipses.
 */
export function projectRojasOrthographic(p: Vector3D, _r0: number = 100): Vector2D {
  return {
    x: p.x,
    y: p.y
  };
}

/**
 * Topocentric Horizon Stereonet Projection
 * Projected from Nadir (a = -90°) onto the horizon plane (a = 0°).
 * Zenith (a = +90°) is at (0, 0), horizon is a circle of radius R0.
 */
export function projectTopocentricHorizon(altDeg: number, azDeg: number, r0: number = 100): Vector2D {
  const clampedAlt = clamp(altDeg, -89.9, 90);
  const r = r0 * Math.tan(toRadians((90 - clampedAlt) / 2));
  const azRad = toRadians(azDeg);

  return {
    x: r * Math.sin(azRad),
    y: -r * Math.cos(azRad)
  };
}

/**
 * Projects a 3D point into a specified 2D historical astrolabe coordinate frame.
 */
export function computeProjection2D(
  p3d: Vector3D,
  mode: ArmillaryProjectionMode,
  r0: number,
  latitude: Latitude,
  lstDeg: Degrees | number
): Vector2D {
  if (mode === 'stereographic') {
    return projectStereographicConformal(p3d, r0);
  } else if (mode === 'rojas') {
    return projectRojasOrthographic(p3d, r0);
  } else {
    const { raDeg, decDeg } = cartesian3DToEquatorial(p3d);
    const horiz = equatorialToHorizontal(raDeg, decDeg, latitude, lstDeg);
    return projectTopocentricHorizon(horiz.altDeg, horiz.azDeg, r0);
  }
}

/**
 * Continuous, circle-preserving cross-projection interpolation between historical astrolabe models.
 * Transitions between stereographic, rojas, and horizon frames using SO(3) coordinate rotation
 * and continuous perspective focal scale u in [R0, infinity), preserving circles and conic contours.
 */
export function computeContinuousProjection2D(
  p3d: Vector3D,
  fromMode: ArmillaryProjectionMode | undefined,
  targetMode: ArmillaryProjectionMode,
  transT: number = 1.0,
  r0: number = 100,
  latitude: Latitude = 47.06,
  lstDeg: Degrees | number = 0
): Vector2D {
  const t = clamp(transT, 0, 1);
  if (!fromMode || fromMode === targetMode || t >= 1.0) {
    return computeProjection2D(p3d, targetMode, r0, latitude, lstDeg);
  }
  if (t <= 0.0) {
    return computeProjection2D(p3d, fromMode, r0, latitude, lstDeg);
  }

  // 1. Stereographic <-> Horizon (Continuous Latitude Rotation on S^2)
  if (
    (fromMode === 'stereographic' && targetMode === 'horizon') ||
    (fromMode === 'horizon' && targetMode === 'stereographic')
  ) {
    const isToHorizon = targetMode === 'horizon';
    const currentT = isToHorizon ? t : 1 - t;
    // Interpolate observer latitude from 90° (North Pole = Stereographic) to actual observer latitude
    const effLat = 90 - (90 - latitude) * currentT;
    const effLst = lstDeg * currentT;
    const { raDeg, decDeg } = cartesian3DToEquatorial(p3d);
    const horiz = equatorialToHorizontal(raDeg, decDeg, effLat, effLst);
    return projectTopocentricHorizon(horiz.altDeg, horiz.azDeg, r0);
  }

  // 2. Stereographic <-> Rojas (Optical Focal Pull + Colure Plane Rotation)
  if (
    (fromMode === 'stereographic' && targetMode === 'rojas') ||
    (fromMode === 'rojas' && targetMode === 'stereographic')
  ) {
    const isToRojas = targetMode === 'rojas';
    const currentT = isToRojas ? t : 1 - t;

    // Colure plane rotation angle theta: 0° (equatorial) -> 90° (solstitial colure)
    const thetaRad = currentT * (Math.PI / 2);
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);

    // Rotate around X axis
    const yt = p3d.y * cosT + p3d.z * sinT;
    const zt = -p3d.y * sinT + p3d.z * cosT;

    // Continuous perspective focal scaling (d = R0 -> infinity)
    const stereoWeight = 1 - currentT;
    const denom = Math.max(0.1, r0 + yt * stereoWeight);
    const focalScale = (r0 * stereoWeight + denom * (1 - stereoWeight)) / denom;

    const xProj = p3d.x * focalScale;
    const yProj = (1 - currentT) * (zt * (r0 / denom)) + currentT * yt;

    return { x: xProj, y: yProj };
  }

  // 3. Rojas <-> Horizon (Composite continuous rotation & focal transition)
  if (
    (fromMode === 'rojas' && targetMode === 'horizon') ||
    (fromMode === 'horizon' && targetMode === 'rojas')
  ) {
    const isToHorizon = targetMode === 'horizon';
    const currentT = isToHorizon ? t : 1 - t;

    if (currentT < 0.5) {
      const subT = currentT * 2;
      return computeContinuousProjection2D(p3d, 'rojas', 'stereographic', subT, r0, latitude, lstDeg);
    } else {
      const subT = (currentT - 0.5) * 2;
      return computeContinuousProjection2D(p3d, 'stereographic', 'horizon', subT, r0, latitude, lstDeg);
    }
  }

  // Default fallback for 3D modes
  const p1 = computeProjection2D(p3d, fromMode, r0, latitude, lstDeg);
  const p2 = computeProjection2D(p3d, targetMode, r0, latitude, lstDeg);
  return {
    x: (1 - t) * p1.x + t * p2.x,
    y: (1 - t) * p1.y + t * p2.y
  };
}

