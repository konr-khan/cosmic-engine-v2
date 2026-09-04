/**
 * @file astroConstants.ts
 * Physical and astronomical constants for the Cosmic Engine V2.0 ephemeris domain.
 * Standardized to IAU / WGS-84 / Meeus definitions.
 */

import { Degrees, JulianDate, asDegrees, asJulianDate } from '../../types/units';

/**
 * Standard J2000.0 astronomical epoch in Julian Date (2000 January 1.5 TT).
 */
export const J2000_JD: JulianDate = asJulianDate(2451545.0);

/**
 * Days per standard Julian century (36,525 ephemeris days).
 */
export const JULIAN_CENTURY_DAYS = 36525.0;

/**
 * Mean calendar days in a Gregorian/Julian year.
 */
export const DAYS_IN_YEAR_MEAN = 365.25;

/**
 * Mean synodic month (lunar cycle period in days from new moon to new moon).
 */
export const DAYS_IN_SYNODIC_MONTH = 29.530589;

/**
 * Sun volumetric mean radius in kilometers (IAU definition).
 */
export const SUN_RADIUS_KM = 696340.0;

/**
 * International Astronomical Union (IAU) 2012 definition of 1 Astronomical Unit in kilometers.
 */
export const ASTRONOMICAL_UNIT_KM = 149597870.7;

/**
 * Earth equatorial radius according to the WGS-84 reference ellipsoid in kilometers.
 */
export const EARTH_RADIUS_WGS84_KM = 6378.137;

/**
 * Moon volumetric mean radius in kilometers (IAU definition).
 */
export const MOON_RADIUS_MEAN_KM = 1737.4;

/**
 * Moon mean diameter in kilometers (2 * 1737 km).
 */
export const MOON_DIAMETER_KM = 3474.0;

/**
 * Earth mean orbital speed around the Sun at 1 AU in kilometers per second.
 */
export const EARTH_ORBITAL_SPEED_MEAN_KMS = 29.7847;

/**
 * Mean solar constant (total solar irradiance at 1 AU) in Watts per square meter (W/m²).
 */
export const SOLAR_IRRADIANCE_1AU_WM2 = 1361.0;

/**
 * Sun apparent angular diameter at 1 AU distance in arcminutes (~31.986').
 */
export const SUN_ANGULAR_DIAMETER_1AU_ARCMIN = 31.986;

/**
 * Mean obliquity of the ecliptic at epoch J2000.0 (IAU standard) in degrees.
 */
export const EARTH_AXIAL_OBLIQUITY_J2000_DEG: Degrees = asDegrees(23.439281);

/**
 * Lunar orbital inclination to the ecliptic plane in degrees (5.145°).
 */
export const MOON_ORBIT_INCLINATION_DEG: Degrees = asDegrees(5.14);

/**
 * Lunar perigee distance threshold in kilometers.
 */
export const LUNAR_PERIGEE_THRESHOLD_KM = 365000;

/**
 * Lunar apogee distance threshold in kilometers.
 */
export const LUNAR_APOGEE_THRESHOLD_KM = 400000;

/**
 * Earth orbital eccentricity in true physical scale.
 */
export const EARTH_ECCENTRICITY_TRUE = 0.01671022;

/**
 * Earth orbital eccentricity in exaggerated visual mode.
 */
export const EARTH_ECCENTRICITY_EXAGGERATED = 0.25;

/**
 * Earth heliocentric longitude of perihelion at epoch J2000.0 in degrees (~102.937°).
 */
export const EARTH_PERIHELION_LONGITUDE_DEG: Degrees = asDegrees(102.937);
