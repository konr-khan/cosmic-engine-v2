/**
 * @file units.ts
 * Core astronomical and physical unit types with branded nominal typing for
 * high-risk angular and temporal values.
 */

// Branded Nominal Unit Identifiers
declare const DegreesBrand: unique symbol;
declare const RadiansBrand: unique symbol;
declare const JulianDateBrand: unique symbol;
declare const JulianCenturiesBrand: unique symbol;

/** Angle measured in decimal degrees [0..360) or [-90..90] */
export type Degrees = number & { readonly [DegreesBrand]: true };

/** Angle measured in radians [0..2pi) or [-pi..pi] */
export type Radians = number & { readonly [RadiansBrand]: true };

/** Astronomical Julian Date epoch (days since Jan 1, 4713 BC 12:00 UTC) */
export type JulianDate = number & { readonly [JulianDateBrand]: true };

/** Julian Centuries elapsed since standard epoch J2000.0 (36,525 ephemeris days) */
export type JulianCenturies = number & { readonly [JulianCenturiesBrand]: true };

// Ergonomic Type Aliases (Frictionless Primitives for UI & Controls)
export type Latitude = number;
export type Longitude = number;
export type HoursDecimal = number;
export type DayOfYear = number;
export type Pixels = number;
export type SpeedMultiplier = number;
export type Percentage = number;

// Nominal Type Casting & Constructor Helpers
export const asDegrees = (val: number): Degrees => val as Degrees;
export const asRadians = (val: number): Radians => val as Radians;
export const asJulianDate = (val: number): JulianDate => val as JulianDate;
export const asCenturies = (val: number): JulianCenturies => val as JulianCenturies;

/**
 * Converts decimal degrees to radians.
 * Acts as a verified conversion gatekeeper between degree and radian domain models.
 */
export const toRadians = (deg: Degrees | number): Radians => {
  return (deg * (Math.PI / 180)) as Radians;
};

/**
 * Converts radians to decimal degrees.
 */
export const toDegrees = (rad: Radians | number): Degrees => {
  return (rad * (180 / Math.PI)) as Degrees;
};

/**
 * Converts a Julian Date to Julian Centuries elapsed since J2000.0 (JD 2451545.0).
 */
export const julianDateToCenturies = (jd: JulianDate | number): JulianCenturies => {
  return ((jd - 2451545.0) / 36525.0) as JulianCenturies;
};
