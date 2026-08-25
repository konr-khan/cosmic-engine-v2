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
