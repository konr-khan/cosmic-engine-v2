/**
 * @file frame.ts
 * Centralized EphemerisFrame generator computing instantaneous solar, lunar,
 * and observer coordinate ephemeris in a single immutable pass.
 */

import { CONFIG } from './constants';
import { JulianDate, Latitude, Longitude, asJulianDate, asDegrees } from '../../types/units';
import { EphemerisFrame } from '../../types/astronomy';
import { calculateSolarPosition, calculateDaylightDurationPrecise } from './solar';
import { calculateLunarPosition } from './lunar';
import { calculateGMST, calculateLST } from './core';
import { calculateSubPointLon } from './terminatorTracks';

let lastJd: JulianDate | number | null = null;
let lastLat: Latitude | number | null = null;
let lastLon: Longitude | number | null = null;
let cachedFrame: EphemerisFrame | null = null;

/**
 * Resets the 1-entry memoization cache for test isolation.
 */
export const _clearEphemerisFrameCache = (): void => {
  lastJd = null;
  lastLat = null;
  lastLon = null;
  cachedFrame = null;
};

/**
 * Calculates a complete, immutable EphemerisFrame snapshot containing instantaneous
 * solar, lunar, and coordinate ephemeris.
 *
 * Employs a 1-entry reference memoization cache to eliminate redundant calculations
 * across multiple widget subscribers during high-frequency chronometer animation ticks.
 *
 * @param julianDate - Astronomical Julian Date epoch
 * @param latitude - Observer latitude [-90..90]
 * @param longitude - Observer longitude [-180..180]
 * @returns Precomputed flat ephemeris snapshot record
 */
export const calculateEphemerisFrame = (
  julianDate: JulianDate | number,
  latitude: Latitude | number,
  longitude: Longitude | number
): EphemerisFrame => {
  const jd = typeof julianDate === 'number' ? asJulianDate(julianDate) : julianDate;

  if (
    cachedFrame !== null &&
    lastJd === jd &&
    lastLat === latitude &&
    lastLon === longitude
  ) {
    return cachedFrame;
  }

  const solarPos = calculateSolarPosition(jd);
  const lunarPos = calculateLunarPosition(jd);

  const gmst = calculateGMST(jd);
  const lst = calculateLST(jd, longitude);

  const eotCorrection = solarPos.equationOfTime;
  const solarNoon = 12 - (longitude / 15) - (eotCorrection / 60);
  const dayLength = calculateDaylightDurationPrecise(latitude as Latitude, solarPos.declination, CONFIG.SOLAR.TWILIGHT.OFFICIAL);

  const subsolarLon = calculateSubPointLon(solarPos.rightAscension, gmst);
  const sublunarLon = calculateSubPointLon(lunarPos.rightAscension, gmst);

  const frame: EphemerisFrame = {
    julianDate: jd,
    gmst,
    lst,
    solarPos,
    lunarPos,
    subsolarPoint: { lat: solarPos.declination as Latitude, lon: subsolarLon as Longitude },
    sublunarPoint: { lat: lunarPos.declination as Latitude, lon: sublunarLon as Longitude },
    solarNoon,
    declination: asDegrees(solarPos.declination),
    equationOfTime: eotCorrection,
    dayLength,
    sunrise: solarNoon - (dayLength / 2),
    sunset: solarNoon + (dayLength / 2),
    noonElevation: asDegrees(90 - Math.abs(latitude - solarPos.declination)),
    isPolarNight: dayLength <= 0,
    isMidnightSun: dayLength >= 24
  };

  lastJd = jd;
  lastLat = latitude;
  lastLon = longitude;
  cachedFrame = frame;

  return frame;
};

