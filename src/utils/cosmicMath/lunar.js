import { toRadians, toDegrees } from './core';
import { calculateSolarPosition } from './solar';

/**
 * High-precision Lunar Ephemeris Solver based on Meeus truncated series.
 * @param {number} julianDate - Julian Date
 * @returns {{
 *   lambda: number,
 *   beta: number,
 *   declination: number,
 *   rightAscension: number,
 *   distanceKm: number,
 *   distanceEarthRadii: number
 * }} Lunar position and coordinates
 */
export const calculateLunarPosition = (julianDate) => {
  const T = (julianDate - 2451545.0) / 36525.0;
  
  let L_prime = (218.3164477 + 481267.88123421 * T) % 360;
  if (L_prime < 0) L_prime += 360;

  let D = (297.8501921 + 445267.1114034 * T) % 360;
  if (D < 0) D += 360;

  let M = (357.5291092 + 35999.0502909 * T) % 360;
  if (M < 0) M += 360;

  let M_prime = (134.9633964 + 477198.8675055 * T) % 360;
  if (M_prime < 0) M_prime += 360;

  let F = (93.2720950 + 483202.0175233 * T) % 360;
  if (F < 0) F += 360;

  const dRad = toRadians(D);
  const mRad = toRadians(M);
  const mpRad = toRadians(M_prime);
  const fRad = toRadians(F);

  const lambda = L_prime 
    + 6.2886 * Math.sin(mpRad)
    + 1.2740 * Math.sin(2 * dRad - mpRad)
    + 0.6583 * Math.sin(2 * dRad)
    + 0.2136 * Math.sin(2 * mpRad)
    - 0.1856 * Math.sin(mRad)
    - 0.1143 * Math.sin(2 * fRad);

  const beta = 5.1282 * Math.sin(fRad)
    + 0.2806 * Math.sin(mpRad + fRad)
    + 0.2777 * Math.sin(mpRad - fRad)
    + 0.1732 * Math.sin(2 * dRad - fRad);

  const distanceKm = 385001
    - 20905 * Math.cos(mpRad)
    - 3699 * Math.cos(2 * dRad - mpRad)
    - 2956 * Math.cos(2 * dRad)
    - 569 * Math.cos(2 * mpRad);

  const epsilon = 23.439 - 0.0000004 * (julianDate - 2451545.0);
  const epsRad = toRadians(epsilon);
  const lRad = toRadians(lambda);
  const bRad = toRadians(beta);

  const sinDec = Math.sin(bRad) * Math.cos(epsRad) + Math.cos(bRad) * Math.sin(epsRad) * Math.sin(lRad);
  const declination = toDegrees(Math.asin(sinDec));

  const raRad = Math.atan2(
    Math.sin(lRad) * Math.cos(epsRad) - Math.tan(bRad) * Math.sin(epsRad),
    Math.cos(lRad)
  );
  let rightAscension = toDegrees(raRad);
  if (rightAscension < 0) rightAscension += 360;

  return { lambda, beta, declination, rightAscension, distanceKm, distanceEarthRadii: distanceKm / 6371 };
};

/**
 * Computes Astronomical Parallactic Angle (tilt of Moon relative to local zenith).
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {number} julianDate - Julian Date
 * @param {number} decDeg - Declination in degrees
 * @param {number} raDeg - Right Ascension in degrees
 * @returns {number} Parallactic angle in degrees
 */
export const calculateParallacticAngle = (lat, lon, julianDate, decDeg, raDeg) => {
  const d = julianDate - 2451545.0;
  const gmst = (280.46061837 + 360.98564736629 * d) % 360;
  const lst = (gmst + lon + 360) % 360;
  let H = (lst - raDeg + 360) % 360;

  const latRad = toRadians(Math.max(-89.9, Math.min(89.9, lat)));
  const decRad = toRadians(decDeg);
  const hRad = toRadians(H);

  const num = Math.sin(hRad);
  const den = Math.tan(latRad) * Math.cos(decRad) - Math.sin(decRad) * Math.cos(hRad);
  
  let eta = toDegrees(Math.atan2(num, den));
  return eta;
};

/**
 * Calculates Moonrise, Transit, Moonset, Perigee/Apogee, and Parallactic Angle.
 * @param {number} lat - Observer latitude
 * @param {number} lon - Observer longitude
 * @param {number} julianDate - Julian Date
 * @param {number} [timeOfDay=12] - Decimal hour of day
 * @returns {{
 *   moonrise: number|null,
 *   transit: number,
 *   moonset: number|null,
 *   distanceKm: number,
 *   distanceEarthRadii: number,
 *   isPerigee: boolean,
 *   isApogee: boolean,
 *   declination: number,
 *   parallacticAngle: number
 * }} Lunar event metrics
 */
export const calculateLunarEvents = (lat, lon, julianDate, timeOfDay = 12) => {
  const julianDateExact = julianDate - 0.5 + (timeOfDay / 24.0);
  const lunarNow = calculateLunarPosition(julianDateExact);
  const solarNoon = calculateSolarPosition(julianDateExact);

  let transitUTC = 12 - (lon / 15) - ((solarNoon.equationOfTime || 0) / 60);
  const solarRA = solarNoon.rightAscension || 0;
  const raDiffDeg = ((lunarNow.rightAscension - solarRA) % 360 + 360) % 360;
  const phaseDiffHours = raDiffDeg / 15;
  transitUTC = (transitUTC + phaseDiffHours + 24) % 24;

  const decRad = toRadians(lunarNow.declination);
  const latRad = toRadians(Math.max(-89.9, Math.min(89.9, lat)));
  
  const altRad = toRadians(0.125);
  const numerator = Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad);
  const denominator = Math.cos(latRad) * Math.cos(decRad);
  const cosH = numerator / denominator;

  let moonriseUTC = null;
  let moonsetUTC = null;

  if (cosH >= -1 && cosH <= 1) {
    const halfDayHours = (toDegrees(Math.acos(cosH)) / 15) * 1.035;
    moonriseUTC = (transitUTC - halfDayHours + 24) % 24;
    moonsetUTC = (transitUTC + halfDayHours + 24) % 24;
  }

  const isPerigee = lunarNow.distanceKm < 365000;
  const isApogee = lunarNow.distanceKm > 400000;

  // Calculate parallactic angle for current time & location
  const parallacticAngle = calculateParallacticAngle(lat, lon, julianDateExact, lunarNow.declination, lunarNow.rightAscension);

  return {
    moonrise: moonriseUTC,
    transit: transitUTC,
    moonset: moonsetUTC,
    distanceKm: Math.round(lunarNow.distanceKm),
    distanceEarthRadii: parseFloat(lunarNow.distanceEarthRadii.toFixed(1)),
    isPerigee,
    isApogee,
    declination: lunarNow.declination,
    parallacticAngle: parseFloat(parallacticAngle.toFixed(1))
  };
};

/**
 * Returns human-readable lunar phase name from a 0.0 to 1.0 phase fraction.
 * @param {number} phase - Lunar phase value (0 = New Moon, 0.5 = Full Moon)
 * @returns {string} Name of moon phase
 */
export const getPhaseName = (phase) => {
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
};
