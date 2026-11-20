/**
 * @file frame.ts
 * Centralized EphemerisFrame generator computing instantaneous solar, lunar,
 * and observer coordinate ephemeris in a single immutable pass.
 */

import { SOLAR_TWILIGHT_THRESHOLDS } from './astroConstants';
import { JulianDate, Latitude, Longitude, asJulianDate, asDegrees } from '../../types/units';
import { EphemerisFrame } from '../../types/astronomy';
import { calculateSolarPosition, calculateDaylightDurationPrecise } from './solar';
import { calculateLunarPosition } from './lunar';
import { calculateGMST, calculateLST } from './core';
import { calculateSubPointLon } from './terminatorTracks';
import { LruCache } from '../lruCache';

const EPHEMERIS_FRAME_CACHE_SIZE = 4;
const frameCache = new LruCache<string, EphemerisFrame>(EPHEMERIS_FRAME_CACHE_SIZE);

/**
 * Resets the bounded LRU memoization cache for test isolation.
 */
export const _clearEphemerisFrameCache = (): void => {
  frameCache.clear();
};

/**
 * Calculates a complete, immutable EphemerisFrame snapshot containing instantaneous
 * solar, lunar, and coordinate ephemeris.
 *
 * Employs a bounded 4-entry LRU cache to eliminate redundant calculations across
 * both noon-anchored almanac widgets and live-time 60 FPS subscribers without cache thrashing.
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
  const cacheKey = `${jd}_${latitude}_${longitude}`;

  const cached = frameCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const solarPos = calculateSolarPosition(jd);
  const lunarPos = calculateLunarPosition(jd);

  const gmst = calculateGMST(jd);
  const lst = calculateLST(jd, longitude);

  const eotCorrection = solarPos.equationOfTime;
  const solarNoon = 12 - (longitude / 15) - (eotCorrection / 60);
  const dayLength = calculateDaylightDurationPrecise(latitude as Latitude, solarPos.declination, SOLAR_TWILIGHT_THRESHOLDS.OFFICIAL);

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

  frameCache.set(cacheKey, frame);

  return frame;
};

