import { Degrees, Latitude } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, clamp } from '../core';
import { cartesian3DToEquatorial, equatorialToHorizontal } from './coordinates';
import { ArmillaryProjectionMode } from './types';

/**
 * Stereographic Conformal Projection
 * Projects from South Celestial Pole (0, -R0, 0) onto equatorial plane y = 0.
 * Conformal property: preserves all circles and angles (MATH_SPEC.md Section 7.E.1).
 * 
 * Mathematical Invariants:
 * - Celestial Equator (dec = 0°): Projects to concentric circle with radius R = R0.
 * - Tropic of Cancer (dec = +eps): Projects to concentric circle with radius R = R0 * tan((90° - eps) / 2).
 * - Tropic of Capricorn (dec = -eps): Projects to concentric circle with radius R = R0 * tan((90° + eps) / 2).
 * - Ecliptic Great Circle (inclined by eps): Projects to eccentric circle with
 *   Center (X_c, Y_c) = (0, -R0 * tan(eps)) and Radius R_ecl = R0 / cos(eps) = R0 * sec(eps).
 * 
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
 * Creates a specialized 2D projection function for a given transition state.
 * Pre-computes all mode branching, trig coefficients, and focal parameters once,
 * returning a fast resolver (p3d: Vector3D) => Vector2D for batch vertex operations.
 */
export function createContinuousProjectionResolver(
  fromMode: ArmillaryProjectionMode | undefined,
  targetMode: ArmillaryProjectionMode,
  transT: number = 1.0,
  r0: number = 100,
  latitude: Latitude = 47.06,
  lstDeg: Degrees | number = 0
): (p3d: Vector3D) => Vector2D {
  const t = clamp(transT, 0, 1);

  // If transitioning to a 3D mode (geocentric or heliocentric), anchor 2D projection basis to fromMode
  if (targetMode === 'geocentric' || targetMode === 'heliocentric') {
    if (fromMode && fromMode !== 'geocentric' && fromMode !== 'heliocentric') {
      return createContinuousProjectionResolver(undefined, fromMode, 1.0, r0, latitude, lstDeg);
    }
    return (p3d: Vector3D) => projectStereographicConformal(p3d, r0);
  }

  if (!fromMode || fromMode === targetMode || t >= 1.0) {
    if (targetMode === 'stereographic') {
      return (p3d: Vector3D) => projectStereographicConformal(p3d, r0);
    } else if (targetMode === 'rojas') {
      return (p3d: Vector3D) => projectRojasOrthographic(p3d, r0);
    } else {
      return (p3d: Vector3D) => {
        const { raDeg, decDeg } = cartesian3DToEquatorial(p3d);
        const horiz = equatorialToHorizontal(raDeg, decDeg, latitude, lstDeg);
        return projectTopocentricHorizon(horiz.altDeg, horiz.azDeg, r0);
      };
    }
  }

  if (t <= 0.0) {
    return createContinuousProjectionResolver(undefined, fromMode, 1.0, r0, latitude, lstDeg);
  }

  // 1. Stereographic <-> Horizon (Continuous Latitude Rotation on S^2)
  if (
    (fromMode === 'stereographic' && targetMode === 'horizon') ||
    (fromMode === 'horizon' && targetMode === 'stereographic')
  ) {
    const isToHorizon = targetMode === 'horizon';
    const currentT = isToHorizon ? t : 1 - t;
    const effLat = 90 - (90 - latitude) * currentT;
    const effLst = lstDeg * currentT;
    return (p3d: Vector3D) => {
      const { raDeg, decDeg } = cartesian3DToEquatorial(p3d);
      const horiz = equatorialToHorizontal(raDeg, decDeg, effLat, effLst);
      return projectTopocentricHorizon(horiz.altDeg, horiz.azDeg, r0);
    };
  }

  // 2. Stereographic <-> Rojas (Optical Focal Pull + Colure Plane Rotation)
  if (
    (fromMode === 'stereographic' && targetMode === 'rojas') ||
    (fromMode === 'rojas' && targetMode === 'stereographic')
  ) {
    const isToRojas = targetMode === 'rojas';
    const currentT = isToRojas ? t : 1 - t;

    const thetaRad = currentT * (Math.PI / 2);
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);
    const stereoWeight = 1 - currentT;

    return (p3d: Vector3D) => {
      const yDepth = p3d.y * cosT - p3d.z * sinT;
      const yTarget = p3d.z * cosT + p3d.y * sinT;
      const denom = Math.max(0.1, r0 + yDepth * stereoWeight);
      const focalScale = (r0 * stereoWeight + denom * (1 - stereoWeight)) / denom;
      return { x: p3d.x * focalScale, y: yTarget * focalScale };
    };
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
      return createContinuousProjectionResolver('rojas', 'stereographic', subT, r0, latitude, lstDeg);
    } else {
      const subT = (currentT - 0.5) * 2;
      return createContinuousProjectionResolver('stereographic', 'horizon', subT, r0, latitude, lstDeg);
    }
  }

  // Default fallback for 3D modes
  const p1Resolver = createContinuousProjectionResolver(undefined, fromMode, 1.0, r0, latitude, lstDeg);
  const p2Resolver = createContinuousProjectionResolver(undefined, targetMode, 1.0, r0, latitude, lstDeg);
  return (p3d: Vector3D) => {
    const p1 = p1Resolver(p3d);
    const p2 = p2Resolver(p3d);
    return {
      x: (1 - t) * p1.x + t * p2.x,
      y: (1 - t) * p1.y + t * p2.y
    };
  };
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
  return createContinuousProjectionResolver(fromMode, targetMode, transT, r0, latitude, lstDeg)(p3d);
}

