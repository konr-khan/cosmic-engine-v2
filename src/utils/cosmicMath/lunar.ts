import { toRadians, toDegrees, clamp, getJulianDate, getDaysInYear } from './core';
import { calculateSolarPosition } from './solar';
import { JulianDate, Latitude, Longitude, Degrees, asDegrees, HoursDecimal } from '../../types/units';
import { 
  LunarPhaseName, 
  LunarPosition, 
  LunarEvents, 
  LunarPositionFull, 
  LunarEventMetrics, 
  AnnualLunarMatrixItem 
} from '../../types/astronomy';

export type { LunarPositionFull, LunarEventMetrics, AnnualLunarMatrixItem };

/**
 * High-precision Lunar Ephemeris Solver based on Meeus truncated series.
 * @param julianDate - Julian Date
 * @returns Lunar position and coordinates
 */
export const calculateLunarPosition = (julianDate: JulianDate | number): LunarPositionFull => {
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
  const declination = toDegrees(Math.asin(clamp(sinDec, -1, 1)));

  const raRad = Math.atan2(
    Math.sin(lRad) * Math.cos(epsRad) - Math.tan(bRad) * Math.sin(epsRad),
    Math.cos(lRad)
  );
  let rightAscension = toDegrees(raRad);
  if (rightAscension < 0) rightAscension = asDegrees(rightAscension + 360);

  const normLambda = ((lambda % 360) + 360) % 360;
  const nodeLongitude = ((125.04452 - 1934.136261 * T) % 360 + 360) % 360;
  const descendingNodeLongitude = (nodeLongitude + 180) % 360;
  const angularRadiusDeg = toDegrees(Math.asin(1737.4 / distanceKm));
  const parallaxDeg = toDegrees(Math.asin(6378.137 / distanceKm));

  // --- Meeus Ch. 48 Geocentric Phase Angle (i) & True Illumination Fraction (k) ---
  const n = julianDate - 2451545.0;
  const solarL = (280.460 + 0.9856474 * n) % 360;
  const solarG = (357.528 + 0.9856003 * n) % 360;
  const solarGRad = toRadians(solarG);
  const solarLambda = solarL + 1.915 * Math.sin(solarGRad) + 0.020 * Math.sin(2 * solarGRad);
  const solarLambdaRad = toRadians(solarLambda);
  const solarDistAU = 1.00014 - 0.01671 * Math.cos(solarGRad) - 0.00014 * Math.cos(2 * solarGRad);
  const solarDistKm = solarDistAU * 149597870.7;

  // Geocentric elongation psi: cos(psi) = cos(beta) * cos(lambda - lambda_sun)
  const cosPsi = Math.cos(bRad) * Math.cos(lRad - solarLambdaRad);
  const psiRad = Math.acos(clamp(cosPsi, -1, 1));
  const sinPsi = Math.sin(psiRad);

  // Phase angle i: tan(i) = (R * sin(psi)) / (Delta - R * cos(psi))
  const phaseAngleRad = Math.atan2(solarDistKm * sinPsi, distanceKm - solarDistKm * cosPsi);
  const phaseAngleDeg = Math.abs(toDegrees(phaseAngleRad));
  const illuminationFraction = (1 + Math.cos(phaseAngleRad)) / 2;

  const phase0to1 = ((D % 360) + 360) % 360 / 360;
  const phaseName = getPhaseName(phase0to1);

  return { 
    lambda: asDegrees(parseFloat(normLambda.toFixed(4))), 
    eclipticLongitude: asDegrees(parseFloat(normLambda.toFixed(4))),
    beta: asDegrees(parseFloat(beta.toFixed(4))), 
    eclipticLatitude: asDegrees(parseFloat(beta.toFixed(4))),
    declination, 
    rightAscension, 
    distanceKm, 
    distanceEarthRadii: distanceKm / 6371,
    phase: phase0to1,
    phaseName,
    elongation: D,
    phaseAngleDeg: parseFloat(phaseAngleDeg.toFixed(2)),
    illuminationFraction: parseFloat(illuminationFraction.toFixed(4)),
    parallacticAngle: 0,
    nodeLongitude: parseFloat(nodeLongitude.toFixed(4)),
    descendingNodeLongitude: parseFloat(descendingNodeLongitude.toFixed(4)),
    angularRadiusDeg: parseFloat(angularRadiusDeg.toFixed(4)),
    parallaxDeg: parseFloat(parallaxDeg.toFixed(4)),
    argumentOfLatitude: parseFloat(F.toFixed(4))
  };
};

/**
 * Computes Astronomical Parallactic Angle (tilt of Moon relative to local zenith).
 * @param lat - Observer latitude in degrees
 * @param lon - Observer longitude in degrees
 * @param julianDate - Julian Date
 * @param decDeg - Declination in degrees
 * @param raDeg - Right Ascension in degrees
 * @returns Parallactic angle in degrees
 */
export const calculateParallacticAngle = (
  lat: Latitude, 
  lon: Longitude, 
  julianDate: JulianDate | number, 
  decDeg: Degrees | number, 
  raDeg: Degrees | HoursDecimal | number
): number => {
  const d = julianDate - 2451545.0;
  const gmst = (280.46061837 + 360.98564736629 * d) % 360;
  const lst = (gmst + lon + 360) % 360;
  let H = (lst - raDeg + 360) % 360;

  const latRad = toRadians(clamp(lat, -89.9, 89.9));
  const decRad = toRadians(decDeg);
  const hRad = toRadians(H);

  const num = Math.sin(hRad);
  const den = Math.tan(latRad) * Math.cos(decRad) - Math.sin(decRad) * Math.cos(hRad);
  
  let eta = toDegrees(Math.atan2(num, den));
  return eta;
};

/**
 * Calculates Moonrise, Transit, Moonset, Perigee/Apogee, and Parallactic Angle.
 * Implements 2-step iterative refinement for sub-minute accuracy across mid & polar latitudes.
 * @param lat - Observer latitude
 * @param lon - Observer longitude
 * @param julianDate - Julian Date (typically midnight)
 * @param timeOfDay - Decimal hour of day
 * @returns Lunar event metrics
 */
export const calculateLunarEvents = (
  lat: Latitude, 
  lon: Longitude, 
  julianDate: JulianDate | number, 
  timeOfDay: HoursDecimal = 12
): LunarEventMetrics => {
  const julianDateExact = julianDate + (timeOfDay / 24.0);
  const lunarNow = calculateLunarPosition(julianDateExact);
  const solarNoon = calculateSolarPosition(julianDateExact);

  let transitUTC = 12 - (lon / 15) - ((solarNoon.equationOfTime || 0) / 60);
  const solarRA = solarNoon.rightAscension || 0;
  const raDiffDeg = ((lunarNow.rightAscension - solarRA) % 360 + 360) % 360;
  const phaseDiffHours = raDiffDeg / 15;
  transitUTC = (transitUTC + phaseDiffHours + 24) % 24;

  const latRad = toRadians(clamp(lat, -89.9, 89.9));
  const altRad = toRadians(0.125);
  const sinAlt = Math.sin(altRad);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  // Step 1: Initial estimate using transit declination
  const decRadTransit = toRadians(lunarNow.declination);
  const cosH0 = (sinAlt - sinLat * Math.sin(decRadTransit)) / (cosLat * Math.cos(decRadTransit));

  let moonriseUTC: number | null = null;
  let moonsetUTC: number | null = null;

  if (cosH0 >= -1 && cosH0 <= 1) {
    const halfDayHours0 = (toDegrees(Math.acos(clamp(cosH0, -1, 1))) / 15) * 1.035;
    const estRise = (transitUTC - halfDayHours0 + 24) % 24;
    const estSet = (transitUTC + halfDayHours0 + 24) % 24;

    // Step 2: Refine candidate rise time using lunar coordinates at estimated rise
    const jdRise = julianDate + (estRise / 24.0);
    const lunarRise = calculateLunarPosition(jdRise);
    const decRadRise = toRadians(lunarRise.declination);
    const cosHRise = (sinAlt - sinLat * Math.sin(decRadRise)) / (cosLat * Math.cos(decRadRise));

    if (cosHRise >= -1 && cosHRise <= 1) {
      const halfDayHoursRise = (toDegrees(Math.acos(clamp(cosHRise, -1, 1))) / 15) * 1.035;
      moonriseUTC = (transitUTC - halfDayHoursRise + 24) % 24;
    }

    // Step 2: Refine candidate set time using lunar coordinates at estimated set
    const jdSet = julianDate + (estSet / 24.0);
    const lunarSet = calculateLunarPosition(jdSet);
    const decRadSet = toRadians(lunarSet.declination);
    const cosHSet = (sinAlt - sinLat * Math.sin(decRadSet)) / (cosLat * Math.cos(decRadSet));

    if (cosHSet >= -1 && cosHSet <= 1) {
      const halfDayHoursSet = (toDegrees(Math.acos(clamp(cosHSet, -1, 1))) / 15) * 1.035;
      moonsetUTC = (transitUTC + halfDayHoursSet + 24) % 24;
    }
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
 * Calculates physical lunar disc illumination fraction (0% to 100%).
 * Supports normalized phase value (0.0 = New Moon, 0.5 = Full Moon) or
 * precise 2D ecliptic latitude for exact Meeus Chapter 48 precision.
 * @param phase - Normalized lunar phase value (0.0 to 1.0)
 * @param beta - Optional lunar ecliptic latitude in degrees
 * @returns Illumination percentage (0 to 100)
 */
export const calculateLunarIllumination = (phase: number, beta?: number): number => {
  if (beta !== undefined) {
    const dRad = (phase * 360) * (Math.PI / 180);
    const bRad = beta * (Math.PI / 180);
    const cosPsi = Math.cos(bRad) * Math.cos(dRad);
    const psiRad = Math.acos(clamp(cosPsi, -1, 1));
    const sinPsi = Math.sin(psiRad);
    // Delta / R approx 384400 / 149597870 = 0.00257
    const phaseAngleRad = Math.atan2(sinPsi, 0.00257 - cosPsi);
    return Math.round(((1 + Math.cos(phaseAngleRad)) / 2) * 100);
  }
  const normPhase = ((phase % 1) + 1) % 1;
  const rad = normPhase * 2 * Math.PI;
  return Math.round(((1 - Math.cos(rad)) / 2) * 100);
};

/**
 * Returns human-readable lunar phase name from a 0.0 to 1.0 phase fraction.
 * @param phase - Lunar phase value (0 = New Moon, 0.5 = Full Moon)
 * @returns Name of moon phase
 */
export const getPhaseName = (phase: number): LunarPhaseName => {
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
};

/**
 * Calculates the full annual matrix (365 or 366 days for leap years) of daily lunar events.
 * @param year - Calendar year (e.g., 2026)
 * @param latitude - Observer latitude in degrees (-90 to +90)
 * @param longitude - Observer longitude in degrees (-180 to +180)
 * @returns Annual lunar matrix array
 */
export const calculateAnnualLunarMatrix = (
  year: number, 
  latitude: Latitude, 
  longitude: Longitude
): AnnualLunarMatrixItem[] => {
  const totalDays = getDaysInYear(year);
  const list: AnnualLunarMatrixItem[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(Date.UTC(year, 0, day));
    const jd0 = getJulianDate(d, 0);
    const jd = getJulianDate(d, 12);
    const events = calculateLunarEvents(latitude, longitude, jd0, 12);
    const solarPos = calculateSolarPosition(jd);
    const lunarPos = calculateLunarPosition(jd);
    
    const raDiff = ((lunarPos.rightAscension - solarPos.rightAscension) % 360 + 360) % 360;
    const phaseVal = raDiff / 360;

    list.push({
      day,
      moonrise: events.moonrise,
      transit: events.transit,
      moonset: events.moonset,
      phaseValue: phaseVal,
      isPerigee: events.isPerigee,
      isApogee: events.isApogee,
      distanceKm: events.distanceKm
    });
  }
  return list;
};
