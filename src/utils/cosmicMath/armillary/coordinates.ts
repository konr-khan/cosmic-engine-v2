import { Degrees, Latitude, Longitude, JulianDate, asDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp } from '../core';
import { J2000_JD } from '../astroConstants';

/**
 * Computes Greenwich Mean Sidereal Time (GMST) in degrees [0, 360).
 */
export function calculateGMST(julianDate: JulianDate | number): Degrees {
  const d = julianDate - J2000_JD;
  const gmst = (280.46061837 + 360.98564736629 * d) % 360;
  return asDegrees(((gmst % 360) + 360) % 360);
}

/**
 * Computes Local Sidereal Time (LST) in degrees [0, 360).
 */
export function calculateLST(julianDate: JulianDate | number, longitude: Longitude): Degrees {
  const gmst = calculateGMST(julianDate);
  const lst = (((gmst + longitude) % 360) + 360) % 360;
  return asDegrees(lst);
}

/**
 * Converts equatorial coordinates (RA, Dec) into 3D Cartesian coordinates on celestial sphere of radius R0.
 * Coordinate frame (IAU / MATH_SPEC.md Section 7.D):
 * +X: Vernal Equinox (RA = 0°, Dec = 0°)
 * +Y: North Celestial Pole (Dec = +90°)
 * +Z: RA = 90°, Dec = 0° (Right-handed basis)
 */
export function equatorialToCartesian3D(raDeg: Degrees | number, decDeg: Degrees | number, r0: number = 100): Vector3D {
  const raRad = toRadians(raDeg);
  const decRad = toRadians(decDeg);
  const cosDec = Math.cos(decRad);

  return {
    x: r0 * cosDec * Math.cos(raRad),
    y: r0 * Math.sin(decRad),
    z: r0 * cosDec * Math.sin(raRad)
  };
}

/**
 * Converts 3D Cartesian equatorial point back into RA and Dec.
 */
export function cartesian3DToEquatorial(p: Vector3D): { raDeg: Degrees; decDeg: Degrees } {
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
  if (r < 1e-9) return { raDeg: asDegrees(0), decDeg: asDegrees(0) };

  const decRad = Math.asin(clamp(p.y / r, -1, 1));
  const raRad = Math.atan2(p.z, p.x);
  const raDeg = (toDegrees(raRad) + 360) % 360;

  return {
    raDeg: asDegrees(raDeg),
    decDeg: asDegrees(toDegrees(decRad))
  };
}

/**
 * Converts Alt-Azimuth coordinates to Topocentric 3D Cartesian vector.
 * +Y: Zenith (+90° Alt)
 * +X: North (Az = 0°)
 * +Z: East (Az = 90°)
 */
export function horizontalToCartesian3D(altDeg: Degrees | number, azDeg: Degrees | number, r0: number = 100): Vector3D {
  const altRad = toRadians(altDeg);
  const azRad = toRadians(azDeg);
  const cosAlt = Math.cos(altRad);

  return {
    x: r0 * cosAlt * Math.cos(azRad),
    y: r0 * Math.sin(altRad),
    z: r0 * cosAlt * Math.sin(azRad)
  };
}

/**
 * Computes topocentric Altitude and Azimuth from observer Latitude and Local Hour Angle (H) & Declination.
 * Solves Azimuth via exact 2-argument atan2 matching MATH_SPEC.md Section 7.I (singularity-free).
 */
export function equatorialToHorizontal(
  raDeg: Degrees | number,
  decDeg: Degrees | number,
  latitude: Latitude,
  lstDeg: Degrees | number
): { altDeg: number; azDeg: number } {
  const H = (((lstDeg - raDeg) % 360 + 360) % 360);
  const hRad = toRadians(H);
  const latRad = toRadians(latitude);
  const decRad = toRadians(decDeg);

  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
  const altRad = Math.asin(clamp(sinAlt, -1, 1));
  const altDeg = toDegrees(altRad);

  const sinAz = -Math.cos(decRad) * Math.sin(hRad);
  const cosAz = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(hRad);
  const azRad = Math.atan2(sinAz, cosAz);
  const azDeg = ((toDegrees(azRad) % 360) + 360) % 360;

  return { altDeg: parseFloat(altDeg.toFixed(2)), azDeg: parseFloat(azDeg.toFixed(2)) };
}

/**
 * Creates a specialized Euler camera rotator function.
 * Pre-computes trigonometric coefficients (cos, sin) for camera pitch, yaw, and roll once,
 * returning a fast function (x, y, z) => Vector3D for batch vertex transformations.
 */
export function createEulerCameraRotator(
  pitchDeg: number,
  yawDeg: number,
  rollDeg: number = 0
): (x: number, y: number, z: number) => Vector3D {
  const pitch = toRadians(pitchDeg);
  const yaw = toRadians(yawDeg);
  const roll = toRadians(rollDeg);

  // 1. Roll around Z
  const cosR = Math.cos(roll);
  const sinR = Math.sin(roll);

  // 2. Yaw around Y
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  // 3. Pitch around X
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  return (x: number, y: number, z: number): Vector3D => {
    // 1. Roll around Z
    const x1 = x * cosR - y * sinR;
    const y1 = x * sinR + y * cosR;
    const z1 = z;

    // 2. Yaw around Y
    const x2 = x1 * cosY + z1 * sinY;
    const y2 = y1;
    const z2 = -x1 * sinY + z1 * cosY;

    // 3. Pitch around X
    const x3 = x2;
    const y3 = y2 * cosP - z2 * sinP;
    const z3 = y2 * sinP + z2 * cosP;

    return { x: x3, y: y3, z: z3 };
  };
}

/**
 * Applies 3D Euler rotations for observer camera (pitch around X, yaw around Y, roll/tilt).
 */
export function rotateEuler3D(p: Vector3D, pitchDeg: number, yawDeg: number, rollDeg: number = 0): Vector3D {
  return createEulerCameraRotator(pitchDeg, yawDeg, rollDeg)(p.x, p.y, p.z);
}
