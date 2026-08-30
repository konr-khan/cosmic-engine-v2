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
import { calculateGMST, calculateLST } from './armillary/coordinates';

/**
 * Calculates a complete, immutable EphemerisFrame snapshot containing instantaneous
 * solar, lunar, and coordinate ephemeris.
 *
 * @param julianDate - Astronomical Julian Date epoch
 * @param latitude - Observer latitude [-90..90]
 * @param longitude - Observer longitude [-180..180]
 * @param useAnalemma - Whether equation of time correction is enabled
 * @returns Precomputed flat ephemeris snapshot record
 */
export const calculateEphemerisFrame = (
  julianDate: JulianDate | number,
  latitude: Latitude,
  longitude: Longitude,
  useAnalemma = true
): EphemerisFrame => {
  const jd = typeof julianDate === 'number' ? asJulianDate(julianDate) : julianDate;
  const solarPos = calculateSolarPosition(jd);
  const lunarPos = calculateLunarPosition(jd);

  const gmst = calculateGMST(jd);
  const lst = calculateLST(jd, longitude);

  const eotCorrection = useAnalemma ? solarPos.equationOfTime : 0;
  const solarNoon = 12 - (longitude / 15) - (eotCorrection / 60);
  const dayLength = calculateDaylightDurationPrecise(latitude, solarPos.declination, CONFIG.SOLAR.TWILIGHT.OFFICIAL);

  const subsolarLon = ((((gmst - solarPos.rightAscension + 540) % 360) + 360) % 360) - 180;
  const sublunarLon = ((((gmst - lunarPos.rightAscension + 540) % 360) + 360) % 360) - 180;

  return {
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
};
