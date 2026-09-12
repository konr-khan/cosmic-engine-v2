/**
 * @file workerSanitizers.ts
 * Pure domain sanitization and boundary clamping gatekeepers for Web Worker ephemeris requests.
 * Prevents pathological inputs (NaN, Infinity, extreme years, out-of-range coordinates) from
 * blocking or crashing synchronous fallback execution on the main UI thread.
 */

import { Latitude, Longitude, JulianDate, HoursDecimal, asJulianDate } from '../types/units';
import { J2000_JD } from '../utils/cosmicMath/astroConstants';

/**
 * Validates and clamps a calendar year to the standard Meeus validity range [-2000, 3000].
 * Gracefully handles NaN, non-finite values, and non-integers by defaulting to epoch year 2000.
 *
 * @param year - Input year
 * @returns Clamped integer year within [-2000, 3000]
 */
export const sanitizeYear = (year: number): number => {
  if (!Number.isFinite(year)) {
    return 2000;
  }
  return Math.round(Math.max(-2000, Math.min(3000, year)));
};

/**
 * Validates and clamps observer latitude to valid geographic bounds [-90, +90].
 * Defaults to 0.0 (Equator) if input is NaN or non-finite.
 *
 * @param lat - Input latitude in decimal degrees
 * @returns Clamped latitude within [-90, +90]
 */
export const sanitizeLatitude = (lat: Latitude | number): Latitude => {
  if (!Number.isFinite(lat)) {
    return 0 as Latitude;
  }
  return Math.max(-90, Math.min(90, lat)) as Latitude;
};

/**
 * Validates and normalizes observer longitude into standard geographic bounds [-180, +180].
 * Defaults to 0.0 (Prime Meridian) if input is NaN or non-finite.
 *
 * @param lon - Input longitude in decimal degrees
 * @returns Normalized longitude within [-180, +180]
 */
export const sanitizeLongitude = (lon: Longitude | number): Longitude => {
  if (!Number.isFinite(lon)) {
    return 0 as Longitude;
  }
  let normalized = ((lon + 180) % 360 + 360) % 360 - 180;
  if (normalized === -180 && lon > 0) {
    normalized = 180;
  }
  return normalized as Longitude;
};

/**
 * Validates and bounds astronomical Julian Date within [0, 5,000,000].
 * Defaults to J2000_JD (2451545.0) if input is NaN, negative, or non-finite.
 *
 * @param jd - Input Julian Date
 * @returns Validated Julian Date
 */
export const sanitizeJulianDate = (jd: JulianDate | number): JulianDate => {
  if (!Number.isFinite(jd) || jd < 0 || jd > 5000000) {
    return J2000_JD;
  }
  return asJulianDate(jd);
};

/**
 * Validates and normalizes time of day into standard decimal hours [0, 24).
 * Defaults to 12.0 (solar noon) if input is NaN or non-finite.
 *
 * @param tod - Input decimal hours
 * @returns Normalized decimal hour in [0, 24)
 */
export const sanitizeTimeOfDay = (tod: HoursDecimal | number): HoursDecimal => {
  if (!Number.isFinite(tod)) {
    return 12.0 as HoursDecimal;
  }
  if (tod >= 0 && tod < 24) {
    return (tod === 0 ? 0 : tod) as HoursDecimal;
  }
  const normalized = ((tod % 24) + 24) % 24;
  return (normalized >= 24 ? 0 : normalized) as HoursDecimal;
};

/**
 * Parameter container interface for instantaneous ephemeris calculation.
 */
export interface EphemerisRawParams {
  latitude: Latitude | number;
  longitude: Longitude | number;
  julianDate: JulianDate | number;
  timeOfDay: HoursDecimal | number;
}

/**
 * Sanitizes all instantaneous ephemeris calculation parameters in a single pass.
 *
 * @param params - Raw input parameters
 * @returns Sanitized and branded parameters
 */
export const sanitizeEphemerisParams = <T extends EphemerisRawParams>(params: T): T & {
  latitude: Latitude;
  longitude: Longitude;
  julianDate: JulianDate;
  timeOfDay: HoursDecimal;
} => {
  return {
    ...params,
    latitude: sanitizeLatitude(params.latitude),
    longitude: sanitizeLongitude(params.longitude),
    julianDate: sanitizeJulianDate(params.julianDate),
    timeOfDay: sanitizeTimeOfDay(params.timeOfDay)
  };
};
