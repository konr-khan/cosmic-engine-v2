/**
 * @file transforms.ts
 * Pure mathematical coordinate frame transformations, 3x3 matrix algebra,
 * inertial axial tilt vectors, subsolar illumination vectors, and 3D shadow cones.
 */

import { Degrees, Radians, Latitude, Longitude, asDegrees, asRadians, toRadians, toDegrees } from '../../../types/units';
import { Vector2D, Vector3D, AltAzimuthCoordinates, EquatorialCoordinates, EclipticCoordinates } from '../../../types/coordinates';
import { Matrix3x3, ShadowCones3D } from './types';
import { clamp } from '../core';

// Standard J2000.0 Earth Obliquity
export const OBLIQUITY_J2000_DEG = 23.439281;
export const OBLIQUITY_J2000_RAD = (23.439281 * Math.PI) / 180;

// Astronomical Dimensions in Kilometers
export const SUN_RADIUS_KM = 696340.0;
export const EARTH_RADIUS_KM = 6378.137;
export const MOON_RADIUS_KM = 1737.4;
export const AU_IN_KM = 149597870.7;

// ==========================================
// 1. 3x3 Matrix Algebra & Vector Operations
// ==========================================

/**
 * Creates an identity 3x3 matrix.
 */
export function identityMatrix3x3(): Matrix3x3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];
}

/**
 * Multiplies two 3x3 matrices: C = A * B.
 */
export function multiplyMatrix3x3(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const result: Matrix3x3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[r][c] = a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c];
    }
  }
  return result;
}

/**
 * Multiplies a 3x3 matrix by a 3D vector: v_out = M * v_in.
 */
export function transformVector3D(m: Matrix3x3, v: Vector3D): Vector3D {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
  };
}

/**
 * Multiplies a 3x3 matrix by scalar 3D coordinates: (x, y, z)_out = M * (x, y, z)_in.
 * Eliminates intermediate vector allocation for high-frequency inner loops.
 */
export function transformCoords3D(m: Matrix3x3, x: number, y: number, z: number): Vector3D {
  return {
    x: m[0][0] * x + m[0][1] * y + m[0][2] * z,
    y: m[1][0] * x + m[1][1] * y + m[1][2] * z,
    z: m[2][0] * x + m[2][1] * y + m[2][2] * z
  };
}

/**
 * Transposes a 3x3 matrix (for orthogonal rotation matrices, M^T = M^-1).
 */
export function transposeMatrix3x3(m: Matrix3x3): Matrix3x3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]]
  ];
}

/**
 * Elementary rotation matrix around X-axis: Rx(theta).
 */
export function rotationMatrixX(angleRad: Radians | number): Matrix3x3 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c]
  ];
}

/**
 * Elementary rotation matrix around Y-axis: Ry(theta).
 */
export function rotationMatrixY(angleRad: Radians | number): Matrix3x3 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c]
  ];
}

/**
 * Elementary rotation matrix around Z-axis: Rz(theta).
 */
export function rotationMatrixZ(angleRad: Radians | number): Matrix3x3 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1]
  ];
}

/**
 * Calculates vector magnitude (L2 norm).
 */
export function vectorMagnitude(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Normalizes a 3D vector to unit length.
 */
export function normalizeVector3D(v: Vector3D): Vector3D {
  const mag = vectorMagnitude(v);
  if (mag < 1e-12) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * Dot product of two 3D vectors: a . b.
 */
export function dotProduct3D(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Cross product of two 3D vectors: a x b.
 */
export function crossProduct3D(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

/**
 * Vector addition: a + b.
 */
export function addVectors3D(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Vector subtraction: a - b.
 */
export function subtractVectors3D(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Vector scalar multiplication: s * v.
 */
export function scaleVector3D(v: Vector3D, s: number): Vector3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

// ==========================================
// 2. Coordinate Frame Transformations
// ==========================================

/**
 * Converts Heliocentric Ecliptic J2000 coordinates to Geocentric Ecliptic coordinates.
 * r_geo = r_helio - R_earth
 */
export function heliocentricToGeocentricEcliptic(
  bodyHelioPos: Vector3D,
  earthHelioPos: Vector3D
): Vector3D {
  return subtractVectors3D(bodyHelioPos, earthHelioPos);
}

/**
 * Converts Geocentric Ecliptic coordinates to Heliocentric Ecliptic J2000 coordinates.
 * r_helio = r_geo + R_earth
 */
export function geocentricToHeliocentricEcliptic(
  bodyGeoPos: Vector3D,
  earthHelioPos: Vector3D
): Vector3D {
  return addVectors3D(bodyGeoPos, earthHelioPos);
}

/**
 * Matrix transforming Geocentric Ecliptic coordinates to Geocentric Equatorial coordinates.
 * M_ecl->eq = Rx(+eps)
 * 
 * [ x_eq ]   [ 1      0           0     ] [ x_ecl ]
 * [ y_eq ] = [ 0   cos(eps)   -sin(eps) ] [ y_ecl ]
 * [ z_eq ]   [ 0   sin(eps)    cos(eps) ] [ z_ecl ]
 */
export function getEclipticToEquatorialMatrix(obliquityRad: Radians | number = OBLIQUITY_J2000_RAD): Matrix3x3 {
  return rotationMatrixX(obliquityRad);
}

/**
 * Matrix transforming Geocentric Equatorial coordinates to Geocentric Ecliptic coordinates.
 * M_eq->ecl = Rx(-eps) = (M_ecl->eq)^T
 */
export function getEquatorialToEclipticMatrix(obliquityRad: Radians | number = OBLIQUITY_J2000_RAD): Matrix3x3 {
  return rotationMatrixX(-obliquityRad);
}

/**
 * Converts a 3D point from Geocentric Ecliptic to Geocentric Equatorial coordinates.
 */
export function eclipticToEquatorial3D(
  pEcl: Vector3D,
  obliquityRad: Radians | number = OBLIQUITY_J2000_RAD
): Vector3D {
  const m = getEclipticToEquatorialMatrix(obliquityRad);
  return transformVector3D(m, pEcl);
}

/**
 * Converts a 3D point from Geocentric Equatorial to Geocentric Ecliptic coordinates.
 */
export function equatorialToEcliptic3D(
  pEq: Vector3D,
  obliquityRad: Radians | number = OBLIQUITY_J2000_RAD
): Vector3D {
  const m = getEquatorialToEclipticMatrix(obliquityRad);
  return transformVector3D(m, pEq);
}

// ==========================================
// 3. Earth Inertial Axial Tilt Vector
// ==========================================

/**
 * Computes Earth's unit North Pole rotation axis in Geocentric Ecliptic space.
 * In Equatorial space, the North Pole is (0, 0, 1).
 * In Ecliptic space, p_ecl = Rx(-eps) * (0, 0, 1)^T = (0, sin(eps), cos(eps))^T.
 * 
 * At Summer Solstice (lambda_sun = 90°), Sun is at (0, 1, 0), so p_ecl . s = +sin(eps) > 0 (tilted toward Sun).
 * At Winter Solstice (lambda_sun = 270°), Sun is at (0, -1, 0), so p_ecl . s = -sin(eps) < 0 (tilted away).
 */
export function calculateEarthAxialTiltVector(
  obliquityRad: Radians | number = OBLIQUITY_J2000_RAD
): Vector3D {
  const s = Math.sin(obliquityRad);
  const c = Math.cos(obliquityRad);
  return { x: 0, y: s, z: c };
}

// ==========================================
// 4. Subsolar Illumination Vector
// ==========================================

/**
 * Computes the unit illumination vector pointing towards the Sun in Geocentric Ecliptic coordinates.
 * Given solar ecliptic longitude lambda_sun:
 * s_ecl = (cos(lambda_sun), sin(lambda_sun), 0)^T
 */
export function calculateSubsolarVectorEcliptic(sunLambdaDeg: Degrees | number): Vector3D {
  const rad = toRadians(sunLambdaDeg);
  return {
    x: Math.cos(rad),
    y: Math.sin(rad),
    z: 0
  };
}

/**
 * Computes the unit illumination vector pointing towards the Sun in Earth Body-Fixed coordinates
 * (Z: Geographic North Pole, X: Prime Meridian intersection with Equator, Y: +90° East Longitude).
 * 
 * @param declinationDeg - Solar declination (-23.44° to +23.44°)
 * @param subsolarLonDeg - Geographic longitude of subsolar point (-180° to +180° or 0° to 360°)
 */
export function calculateSubsolarVectorBody(
  declinationDeg: Degrees | number,
  subsolarLonDeg: Longitude | number
): Vector3D {
  const decRad = toRadians(declinationDeg);
  const lonRad = toRadians(subsolarLonDeg);
  const cosDec = Math.cos(decRad);

  return {
    x: cosDec * Math.cos(lonRad),
    y: cosDec * Math.sin(lonRad),
    z: Math.sin(decRad)
  };
}

// ==========================================
// 5. Topocentric Observer Coordinate Transforms
// ==========================================

/**
 * Matrix transforming Geocentric Equatorial coordinates to Local Topocentric Horizontal coordinates.
 * 
 * 1. Rotate by LST around Z: aligns with observer meridian.
 * 2. Rotate by (90° - lat) around East axis: aligns +Y with Zenith, +X with North, +Z with East.
 */
export function getEquatorialToHorizontalMatrix(
  latitudeDeg: Latitude | number,
  lstDeg: Degrees | number
): Matrix3x3 {
  const latRad = toRadians(latitudeDeg);
  const lstRad = toRadians(lstDeg);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLst = Math.sin(lstRad);
  const cosLst = Math.cos(lstRad);

  // Composite Matrix: M = R_tangent * R_lst
  return [
    [-sinLat * cosLst, -sinLat * sinLst, cosLat],
    [cosLat * cosLst,  cosLat * sinLst,  sinLat],
    [-sinLst,          cosLst,           0     ]
  ];
}

/**
 * Converts a 3D Equatorial vector to Local Topocentric Horizontal coordinates.
 * Returns: { x: North, y: Zenith, z: East }
 */
export function equatorialToTopocentric3D(
  vEq: Vector3D,
  latitudeDeg: Latitude | number,
  lstDeg: Degrees | number
): Vector3D {
  const m = getEquatorialToHorizontalMatrix(latitudeDeg, lstDeg);
  return transformVector3D(m, vEq);
}

/**
 * Converts topocentric Cartesian vector (x: North, y: Zenith, z: East) to Altitude and Azimuth.
 */
export function topocentric3DToAltAz(vTopo: Vector3D): AltAzimuthCoordinates {
  const r = vectorMagnitude(vTopo);
  if (r < 1e-12) {
    return { altitude: asDegrees(0), azimuth: asDegrees(0), zenithAngle: asDegrees(90) };
  }

  const altRad = Math.asin(clamp(vTopo.y / r, -1, 1));
  const altDeg = toDegrees(altRad);

  // Azimuth measured clockwise from North (+X towards +Z East)
  const azRad = Math.atan2(vTopo.z, vTopo.x);
  const azDeg = (toDegrees(azRad) + 360) % 360;
  const zenithDeg = 90 - altDeg;

  return {
    altitude: asDegrees(altDeg),
    azimuth: asDegrees(azDeg),
    zenithAngle: asDegrees(zenithDeg)
  };
}

// ==========================================
// 6. Generalized 3D Euler Camera Rotations
// ==========================================

/**
 * Constructs a 3D Euler rotation matrix for camera orientation:
 * R_euler = Rz(roll) * Rx(pitch) * Ry(yaw)
 * 
 * Order of rotations:
 * 1. Yaw around Y (pan)
 * 2. Pitch around X (tilt)
 * 3. Roll around Z (spin)
 */
export function createEulerRotationMatrix(
  pitchDeg: Degrees | number,
  yawDeg: Degrees | number,
  rollDeg: Degrees | number = 0
): Matrix3x3 {
  const rx = rotationMatrixX(toRadians(pitchDeg));
  const ry = rotationMatrixY(toRadians(yawDeg));
  const rz = rotationMatrixZ(toRadians(rollDeg));

  // M = Rz * Rx * Ry
  const rx_ry = multiplyMatrix3x3(rx, ry);
  return multiplyMatrix3x3(rz, rx_ry);
}

/**
 * Constructs a 3D Euler rotation matrix following the classical Rz(yaw) * Rx(pitch) * Rz(roll) convention.
 */
export function createZXZRotationMatrix(
  yawDeg: Degrees | number,
  pitchDeg: Degrees | number,
  rollDeg: Degrees | number = 0
): Matrix3x3 {
  const rz1 = rotationMatrixZ(toRadians(yawDeg));
  const rx = rotationMatrixX(toRadians(pitchDeg));
  const rz2 = rotationMatrixZ(toRadians(rollDeg));

  const rz1_rx = multiplyMatrix3x3(rz1, rx);
  return multiplyMatrix3x3(rz1_rx, rz2);
}

/**
 * Rotates a 3D point using camera pitch, yaw, and roll angles.
 */
export function rotatePointEuler3D(
  p: Vector3D,
  pitchDeg: Degrees | number,
  yawDeg: Degrees | number,
  rollDeg: Degrees | number = 0
): Vector3D {
  const m = createEulerRotationMatrix(pitchDeg, yawDeg, rollDeg);
  return transformVector3D(m, p);
}

/**
 * Rotates raw 3D coordinates using camera pitch, yaw, and roll angles without requiring a Vector3D object input.
 */
export function rotatePointEuler3DCoords(
  x: number,
  y: number,
  z: number,
  pitchDeg: Degrees | number,
  yawDeg: Degrees | number,
  rollDeg: Degrees | number = 0
): Vector3D {
  const m = createEulerRotationMatrix(pitchDeg, yawDeg, rollDeg);
  return transformCoords3D(m, x, y, z);
}

// ==========================================
// 7. Analytical Syzygy Shadow Cones (3D)
// ==========================================

/**
 * Solves exact 3D Umbra and Penumbra shadow cones for an occluding sphere (Moon or Earth)
 * illuminated by the Sun.
 * 
 * @param sunCenter - 3D Center of Sun
 * @param sunRadius - Radius of Sun (same distance unit, e.g. km)
 * @param occluderCenter - 3D Center of occluding body (e.g. Moon or Earth)
 * @param occluderRadius - Radius of occluder (same distance unit)
 * @param targetCenter - 3D Center of shadow recipient (e.g. Earth or Moon)
 */
export function calculateShadowCones3D(
  sunCenter: Vector3D,
  sunRadius: number,
  occluderCenter: Vector3D,
  occluderRadius: number,
  targetCenter: Vector3D
): ShadowCones3D {
  // Vector from Sun to Occluder
  const sunToOcc = subtractVectors3D(occluderCenter, sunCenter);
  const dSunOcc = Math.max(1e-3, vectorMagnitude(sunToOcc));
  const axisDir = normalizeVector3D(sunToOcc);

  // 1. Umbra Cone Apex & Geometry
  // By similar triangles: L_umbra / R_occ = (D_sun_occ + L_umbra) / R_sun
  // L_umbra * (R_sun - R_occ) = R_occ * D_sun_occ
  // L_umbra = (R_occ * D_sun_occ) / (R_sun - R_occ)
  const deltaR_umbra = Math.max(1e-6, sunRadius - occluderRadius);
  const umbraLength = (occluderRadius * dSunOcc) / deltaR_umbra;
  const umbraApex = addVectors3D(occluderCenter, scaleVector3D(axisDir, umbraLength));
  const umbraAngle = asRadians(Math.asin(clamp(deltaR_umbra / dSunOcc, 0, 1)));

  // 2. Penumbra Cone Apex & Geometry
  // By similar triangles: L_penumbra / R_occ = (D_sun_occ - L_penumbra) / R_sun
  // L_penumbra * (R_sun + R_occ) = R_occ * D_sun_occ
  // L_penumbra = (R_occ * D_sun_occ) / (R_sun + R_occ)
  const sumR_penumbra = sunRadius + occluderRadius;
  const penumbraLength = (occluderRadius * dSunOcc) / sumR_penumbra;
  const penumbraApex = subtractVectors3D(occluderCenter, scaleVector3D(axisDir, penumbraLength));
  const penumbraAngle = asRadians(Math.asin(clamp(sumR_penumbra / dSunOcc, 0, 1)));

  return {
    umbraApex,
    umbraAngle,
    penumbraApex,
    penumbraAngle,
    axisDirection: axisDir,
    moonCenter: occluderCenter,
    earthCenter: targetCenter,
    umbraLength,
    umbraLengthKm: umbraLength,
    penumbraLength,
    penumbraLengthKm: penumbraLength
  };
}
