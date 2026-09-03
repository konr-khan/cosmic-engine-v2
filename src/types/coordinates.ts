/**
 * @file coordinates.ts
 * Astronomical coordinate systems and 2D/3D vector definitions.
 */

import { Degrees, HoursDecimal, Radians } from './units';

/** Local topocentric horizon coordinate system */
export interface AltAzimuthCoordinates {
  /** Altitude angle above horizon [-90..+90 degrees] */
  altitude: Degrees | number;
  /** Azimuth angle from true North [0..360 degrees, clockwise] */
  azimuth: Degrees | number;
  /** Zenith angle from overhead [0..180 degrees] */
  zenithAngle?: Degrees | number;
}

/** Equatorial coordinate system */
export interface EquatorialCoordinates {
  /** Right Ascension [0..24 decimal hours or 0..360 degrees] */
  rightAscension: HoursDecimal | Degrees | number;
  /** Declination [-90..+90 degrees] */
  declination: Degrees | number;
  /** Local Hour Angle [0..24 hours or 0..360 degrees] */
  hourAngle?: Degrees | number;
}

/** Ecliptic coordinate system */
export interface EclipticCoordinates {
  /** Ecliptic longitude [0..360 degrees] */
  eclipticLongitude: Degrees | number;
  /** Ecliptic latitude [-90..+90 degrees] */
  eclipticLatitude: Degrees | number;
  /** Radial distance (AU or km) */
  distance?: number;
}

/** 2D Vector in Cartesian screen or plane coordinates */
export interface Vector2D {
  x: number;
  y: number;
}

/** 3D Vector in Cartesian celestial or orbital space */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/** Orbital angular metrics in plane */
export interface OrbitalAngles {
  toSun: Radians | number;
  toMoon: Radians | number;
  sunDegrees: Degrees | number;
  moonDegrees: Degrees | number;
  nodeLongitude: Degrees | number;
  descendingNodeLongitude: Degrees | number;
}
