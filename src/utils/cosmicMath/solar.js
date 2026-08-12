import { CONFIG } from './constants';
import { toRadians, toDegrees } from './core';

/**
 * Calculates solar position, declination, right ascension, equation of time, and Earth-Sun orbital physics.
 * @param {number} julianDate - Julian Date
 * @returns {{
 *   declination: number,
 *   equationOfTime: number,
 *   rightAscension: number,
 *   n: number,
 *   distanceAU: number,
 *   distanceKm: number,
 *   orbitalSpeedKms: number,
 *   solarIrradianceWm2: number,
 *   solarIrradiancePercent: number,
 *   sunAngularDiameterArcmin: number,
 *   isPerihelion: boolean,
 *   isAphelion: boolean,
 *   meanAnomaly: number
 * }} Solar position and orbital metrics
 */
export const calculateSolarPosition = (julianDate) => {
  const n = julianDate - 2451545.0;
  let L = (280.460 + 0.9856474 * n) % 360;
  if (L < 0) L += 360;
  
  let g = (357.528 + 0.9856003 * n) % 360;
  if (g < 0) g += 360;
  
  const gRad = toRadians(g);
  const lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
  const lambdaRad = toRadians(lambda);
  const epsilon = 23.439 - 0.0000004 * n;
  const epsilonRad = toRadians(epsilon);
  
  const alphaRad = Math.atan2(Math.cos(epsilonRad) * Math.sin(lambdaRad), Math.cos(lambdaRad));
  let alpha = toDegrees(alphaRad);
  if (alpha < 0) alpha += 360;
  
  const deltaRad = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad));
  const declination = toDegrees(deltaRad);
  
  let diff = L - alpha;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const equationOfTime = 4 * diff;
  
  // Keplerian Earth Orbital Distance & Dynamics (e = 0.01671)
  const distanceAU = 1.00014 - 0.01671 * Math.cos(gRad) - 0.00014 * Math.cos(2 * gRad);
  const distanceKm = distanceAU * 149597870.7;
  const orbitalSpeedKms = 29.7847 * Math.sqrt(Math.max(0.1, (2.0 / distanceAU) - 1.0));
  const solarIrradianceWm2 = 1361.0 / (distanceAU * distanceAU);
  const solarIrradiancePercent = (1.0 / (distanceAU * distanceAU)) * 100.0;
  const sunAngularDiameterArcmin = 31.986 / distanceAU;
  const isPerihelion = distanceAU < 0.985;
  const isAphelion = distanceAU > 1.015;
  
  return { 
    declination, 
    equationOfTime, 
    rightAscension: alpha, 
    n,
    distanceAU: parseFloat(distanceAU.toFixed(5)),
    distanceKm: Math.round(distanceKm),
    orbitalSpeedKms: parseFloat(orbitalSpeedKms.toFixed(2)),
    solarIrradianceWm2: Math.round(solarIrradianceWm2),
    solarIrradiancePercent: parseFloat(solarIrradiancePercent.toFixed(1)),
    sunAngularDiameterArcmin: parseFloat(sunAngularDiameterArcmin.toFixed(2)),
    isPerihelion,
    isAphelion,
    meanAnomaly: g
  };
};

/**
 * Alias for calculateSolarPosition providing Earth orbital dynamics.
 * @param {number} julianDate - Julian Date
 * @returns {Object} Earth orbital physics
 */
export const calculateEarthOrbitalPhysics = (julianDate) => calculateSolarPosition(julianDate);

/**
 * Computes SVG polygon paths for Earth's daylight terminator shadow overlay.
 * @param {number} longitude - Observer center longitude (-180 to 180)
 * @param {number} sunLong - Solar sub-point longitude (-180 to 180)
 * @param {number} declination - Solar declination in degrees
 * @param {number} [altThreshold=-0.833] - Solar altitude threshold in degrees
 * @returns {{ southPath: string, northPath: string, combinedPath: string }} SVG path d attributes
 */
export const getTerminatorShadowPaths = (longitude, sunLong, declination, altThreshold = -0.833) => {
  const step = 2;
  const decRad = toRadians(declination);
  const altRad = toRadians(altThreshold);
  const sinAlt = Math.sin(altRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);

  const southPoints = [];
  const northPoints = [];

  for (let x = 0; x <= 360; x += step) {
    const geoLon = longitude - 180 + x;
    const H = toRadians(geoLon - sunLong);
    const A = sinDec;
    const B = cosDec * Math.cos(H);
    const R = Math.sqrt(A * A + B * B);

    let latSouth = -90;
    let latNorth = 90;

    if (R < 1e-7) {
      if (sinAlt > 0) {
        latSouth = 90;
        latNorth = -90;
      }
    } else {
      const ratio = sinAlt / R;
      if (ratio > 1) {
        latSouth = 90;
        latNorth = -90;
      } else if (ratio < -1) {
        latSouth = -90;
        latNorth = 90;
      } else {
        const alpha = Math.acos(ratio);
        const gamma = Math.atan2(A, B);
        latSouth = Math.max(-90, Math.min(90, toDegrees(gamma - alpha)));
        latNorth = Math.max(-90, Math.min(90, toDegrees(gamma + alpha)));
      }
    }

    const ySouth = 90 - latSouth;
    const yNorth = 90 - latNorth;

    southPoints.push(`${x},${ySouth.toFixed(2)}`);
    northPoints.push(`${x},${yNorth.toFixed(2)}`);
  }

  let southPath = `M 0,180`;
  for (let i = 0; i < southPoints.length; i++) {
    southPath += ` L ${southPoints[i]}`;
  }
  southPath += ` L 360,180 Z`;

  let northPath = `M 0,0`;
  for (let i = 0; i < northPoints.length; i++) {
    northPath += ` L ${northPoints[i]}`;
  }
  northPath += ` L 360,0 Z`;

  return { southPath, northPath, combinedPath: `${southPath} ${northPath}` };
};

/**
 * Calculates daylight or twilight duration in decimal hours for a specific latitude and declination.
 * @param {number} lat - Observer latitude in degrees (-90 to +90)
 * @param {number} declination - Solar declination in degrees (-23.44 to +23.44)
 * @param {number} angleThreshold - Solar altitude threshold in degrees (-0.833, -6, -12, -18)
 * @returns {number} Duration in decimal hours (0 to 24)
 */
export const calculateDaylightDurationPrecise = (lat, declination, angleThreshold) => {
  const safeLat = Math.max(-89.9, Math.min(89.9, lat));
  const latRad = toRadians(safeLat);
  const decRad = toRadians(declination);
  const altRad = toRadians(angleThreshold);

  const numerator = Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad);
  const denominator = Math.cos(latRad) * Math.cos(decRad);
  const cosOmega = numerator / denominator;

  if (cosOmega >= 1) return 0.0;
  if (cosOmega <= -1) return 24.0;

  const hourAngleDeg = toDegrees(Math.acos(cosOmega));
  return (2 * hourAngleDeg) / 15;
};

/**
 * Calculates daily solar events (twilight boundaries, solar noon, solar midnight) for a given location.
 * @param {number} lat - Observer latitude in degrees (-90 to +90)
 * @param {number} declination - Solar declination in degrees
 * @param {number} solarNoon - Solar noon in local decimal hours
 * @returns {{
 *   official: { morning: number, evening: number, isFullSun: boolean, isPolarNight: boolean },
 *   civil: { morning: number, evening: number, isFullSun: boolean, isPolarNight: boolean },
 *   nautical: { morning: number, evening: number, isFullSun: boolean, isPolarNight: boolean },
 *   astronomical: { morning: number, evening: number, isFullSun: boolean, isPolarNight: boolean },
 *   solarNoon: number,
 *   solarMidnightStart: number,
 *   solarMidnightEnd: number
 * }} Daily solar event timestamps
 */
export const calculateDailySolarEvents = (lat, declination, solarNoon) => {
  const { OFFICIAL, CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;
  
  const getTimesForAngle = (angle) => {
    const duration = calculateDaylightDurationPrecise(lat, declination, angle);
    if (duration <= 0) return { morning: solarNoon, evening: solarNoon, isFullSun: false, isPolarNight: true };
    if (duration >= 24) return { morning: solarNoon - 12, evening: solarNoon + 12, isFullSun: true, isPolarNight: false };
    const half = duration / 2;
    return { morning: solarNoon - half, evening: solarNoon + half, isFullSun: false, isPolarNight: false };
  };

  return {
    official: getTimesForAngle(OFFICIAL),       
    civil: getTimesForAngle(CIVIL),             
    nautical: getTimesForAngle(NAUTICAL),       
    astronomical: getTimesForAngle(ASTRONOMICAL),
    solarNoon,
    solarMidnightStart: solarNoon - 12,
    solarMidnightEnd: solarNoon + 12
  };
};
