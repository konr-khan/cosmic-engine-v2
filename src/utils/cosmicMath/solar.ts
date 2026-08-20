import { CONFIG } from './constants';
import { toRadians, toDegrees, clamp, getJulianDate, getDaysInYear } from './core';
import { JulianDate, Latitude, Longitude, Degrees, asDegrees } from '../../types/units';
import { SolarPosition, SolarPositionFull, AnnualSolarMatrixItem } from '../../types/astronomy';

export type { SolarPositionFull, AnnualSolarMatrixItem };

/**
 * Calculates solar position, declination, right ascension, equation of time, and Earth-Sun orbital physics.
 * @param julianDate - Julian Date
 * @returns Solar position and orbital metrics
 */
export const calculateSolarPosition = (julianDate: JulianDate | number): SolarPositionFull => {
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
  if (alpha < 0) alpha = asDegrees(alpha + 360);
  
  const deltaRad = Math.asin(clamp(Math.sin(epsilonRad) * Math.sin(lambdaRad), -1, 1));
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
  
  const normLambda = ((lambda % 360) + 360) % 360;
  const sunAngularRadiusDeg = (sunAngularDiameterArcmin / 60) / 2;

  return { 
    declination: asDegrees(declination), 
    equationOfTime, 
    rightAscension: alpha,
    lambda: asDegrees(parseFloat(normLambda.toFixed(4))),
    eclipticLongitude: parseFloat(normLambda.toFixed(4)),
    sunAngularRadiusDeg: parseFloat(sunAngularRadiusDeg.toFixed(4)),
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
 * @param julianDate - Julian Date
 * @returns Earth orbital physics
 */
export const calculateEarthOrbitalPhysics = (julianDate: JulianDate | number): SolarPositionFull => {
  return calculateSolarPosition(julianDate);
};

export interface TerminatorShadowPaths {
  southPath: string;
  northPath: string;
  combinedPath: string;
  linePath: string;
}

/**
 * Computes SVG polygon paths for Earth's daylight terminator shadow overlay.
 * @param longitude - Observer center longitude (-180 to 180)
 * @param sunLong - Solar sub-point longitude (-180 to 180)
 * @param declination - Solar declination in degrees
 * @param altThreshold - Solar altitude threshold in degrees (-0.833 default)
 * @returns SVG path d attributes
 */
export const getTerminatorShadowPaths = (
  longitude: Longitude, 
  sunLong: Longitude, 
  declination: Degrees | number, 
  altThreshold: number = -0.833
): TerminatorShadowPaths => {
  const step = 2;
  const decRad = toRadians(declination);
  const altRad = toRadians(altThreshold);
  const sinAlt = Math.sin(altRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);

  const southPoints: string[] = [];
  const northPoints: string[] = [];

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
        const alpha = Math.acos(clamp(ratio, -1, 1));
        const gamma = Math.atan2(A, B);
        latSouth = clamp(toDegrees(gamma - alpha), -90, 90);
        latNorth = clamp(toDegrees(gamma + alpha), -90, 90);
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

  // Line segments that only trace actual boundary curve inside the map (excluding artificial outer borders)
  const lineSegments: string[] = [];
  
  let inSouthSegment = false;
  for (let i = 0; i < southPoints.length; i++) {
    const pt = southPoints[i].split(',');
    const x = pt[0];
    const y = parseFloat(pt[1]);
    if (y < 179.95 && y > 0.05) {
      if (!inSouthSegment) {
        lineSegments.push(`M ${x},${y}`);
        inSouthSegment = true;
      } else {
        lineSegments.push(`L ${x},${y}`);
      }
    } else {
      inSouthSegment = false;
    }
  }

  let inNorthSegment = false;
  for (let i = 0; i < northPoints.length; i++) {
    const pt = northPoints[i].split(',');
    const x = pt[0];
    const y = parseFloat(pt[1]);
    if (y > 0.05 && y < 179.95) {
      if (!inNorthSegment) {
        lineSegments.push(`M ${x},${y}`);
        inNorthSegment = true;
      } else {
        lineSegments.push(`L ${x},${y}`);
      }
    } else {
      inNorthSegment = false;
    }
  }

  const linePath = lineSegments.join(' ');

  return { southPath, northPath, combinedPath: `${southPath} ${northPath}`, linePath };
};

/**
 * Structured polar state enums for extreme high-latitude solar conditions.
 */
export const POLAR_STATES = {
  NORMAL: 'NORMAL',
  PERPETUAL_DAY: 'PERPETUAL_DAY',
  PERPETUAL_NIGHT: 'PERPETUAL_NIGHT',
  PERPETUAL_TWILIGHT: 'PERPETUAL_TWILIGHT'
} as const;

export type PolarState = (typeof POLAR_STATES)[keyof typeof POLAR_STATES];

/**
 * Calculates daylight or twilight duration in decimal hours for a specific latitude and declination.
 * Uses explicit piecewise functions for polar bounds where solar elevation threshold criteria are met.
 * @param lat - Observer latitude in degrees (-90 to +90)
 * @param declination - Solar declination in degrees (-23.44 to +23.44)
 * @param angleThreshold - Solar altitude threshold in degrees (-0.833, -6, -12, -18)
 * @returns Duration in decimal hours (0 to 24)
 */
export const calculateDaylightDurationPrecise = (
  lat: Latitude, 
  declination: Degrees | number, 
  angleThreshold: Degrees | number
): number => {
  const clampLat = clamp(lat, -90, 90);
  
  const latRad = toRadians(clampLat);
  const decRad = toRadians(declination);
  const altRad = toRadians(angleThreshold);

  const cosLat = Math.cos(latRad);
  const cosDec = Math.cos(decRad);
  const cosLatCosDec = cosLat * cosDec;

  // Handle polar singularities at exact poles (|lat| == 90) or where cos(lat)*cos(dec) approx 0
  if (Math.abs(cosLatCosDec) < 1e-9) {
    const poleSolarAlt = clampLat >= 0 ? declination : -declination;
    return poleSolarAlt >= angleThreshold ? 24.0 : 0.0;
  }

  // Piecewise evaluation using solar noon (max) and solar midnight (min) elevation
  // sin(h_max) = sin(lat)*sin(dec) + cos(lat)*cos(dec)
  // sin(h_min) = sin(lat)*sin(dec) - cos(lat)*cos(dec)
  const sinAlt = Math.sin(altRad);
  const sinLatSinDec = Math.sin(latRad) * Math.sin(decRad);
  const sinHMax = sinLatSinDec + cosLatCosDec;
  const sinHMin = sinLatSinDec - cosLatCosDec;

  // Piecewise polar bound 1: Sun stays below threshold all day -> 0h
  if (sinHMax <= sinAlt) {
    return 0.0;
  }

  // Piecewise polar bound 2: Sun stays above threshold all day -> 24h
  if (sinHMin >= sinAlt) {
    return 24.0;
  }

  // Standard diurnal case (-1 < cosOmega < 1)
  const numerator = sinAlt - sinLatSinDec;
  const cosOmega = numerator / cosLatCosDec;

  if (cosOmega >= 1.0) return 0.0;
  if (cosOmega <= -1.0) return 24.0;

  const hourAngleRad = Math.acos(clamp(cosOmega, -1, 1));
  if (isNaN(hourAngleRad)) {
    return cosOmega > 0 ? 0.0 : 24.0;
  }

  const hourAngleDeg = toDegrees(hourAngleRad);
  const duration = (2 * hourAngleDeg) / 15;

  return clamp(duration, 0.0, 24.0);
};

/**
 * Determines the global polar state enum for an observer location and solar declination.
 * @param lat - Observer latitude in degrees (-90 to +90)
 * @param declination - Solar declination in degrees (-23.44 to +23.44)
 * @returns Polar state enum (NORMAL, PERPETUAL_DAY, PERPETUAL_NIGHT, PERPETUAL_TWILIGHT)
 */
export const calculatePolarState = (lat: Latitude, declination: Degrees | number): PolarState => {
  const { OFFICIAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;
  const dayDuration = calculateDaylightDurationPrecise(lat, declination, OFFICIAL);
  const astroDuration = calculateDaylightDurationPrecise(lat, declination, ASTRONOMICAL);

  if (dayDuration >= 24) {
    return POLAR_STATES.PERPETUAL_DAY;
  }
  if (astroDuration <= 0) {
    return POLAR_STATES.PERPETUAL_NIGHT;
  }
  if (dayDuration <= 0 && astroDuration > 0) {
    return POLAR_STATES.PERPETUAL_TWILIGHT;
  }
  if (dayDuration > 0 && dayDuration < 24 && astroDuration >= 24) {
    return POLAR_STATES.PERPETUAL_TWILIGHT;
  }
  return POLAR_STATES.NORMAL;
};

export interface TwilightBandTimes {
  morning: number;
  evening: number;
  duration: number;
  isFullSun: boolean;
  isPolarNight: boolean;
  polarState: PolarState;
}

export interface DailySolarEvents {
  official: TwilightBandTimes;
  civil: TwilightBandTimes;
  nautical: TwilightBandTimes;
  astronomical: TwilightBandTimes;
  solarNoon: number;
  solarMidnightStart: number;
  solarMidnightEnd: number;
  polarState: PolarState;
}

/**
 * Calculates daily solar events (twilight boundaries, solar noon, solar midnight) for a given location.
 * @param lat - Observer latitude in degrees (-90 to +90)
 * @param declination - Solar declination in degrees
 * @param solarNoon - Solar noon in local decimal hours
 * @returns Daily solar event timestamps and polar states
 */
export const calculateDailySolarEvents = (
  lat: Latitude, 
  declination: Degrees | number, 
  solarNoon: number
): DailySolarEvents => {
  const { OFFICIAL, CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;
  const overallPolarState = calculatePolarState(lat, declination);
  
  const getTimesForAngle = (angle: number): TwilightBandTimes => {
    const duration = calculateDaylightDurationPrecise(lat, declination, angle);
    let bandPolarState: PolarState = POLAR_STATES.NORMAL;
    if (duration <= 0) {
      bandPolarState = POLAR_STATES.PERPETUAL_NIGHT;
    } else if (duration >= 24) {
      bandPolarState = POLAR_STATES.PERPETUAL_DAY;
    } else if (overallPolarState === POLAR_STATES.PERPETUAL_TWILIGHT) {
      bandPolarState = POLAR_STATES.PERPETUAL_TWILIGHT;
    }

    if (duration <= 0) {
      return { 
        morning: solarNoon, 
        evening: solarNoon, 
        duration: 0,
        isFullSun: false, 
        isPolarNight: true,
        polarState: bandPolarState
      };
    }
    if (duration >= 24) {
      return { 
        morning: solarNoon - 12, 
        evening: solarNoon + 12, 
        duration: 24,
        isFullSun: true, 
        isPolarNight: false,
        polarState: bandPolarState
      };
    }
    const half = duration / 2;
    return { 
      morning: solarNoon - half, 
      evening: solarNoon + half, 
      duration,
      isFullSun: false, 
      isPolarNight: false,
      polarState: bandPolarState
    };
  };

  return {
    official: getTimesForAngle(OFFICIAL),       
    civil: getTimesForAngle(CIVIL),             
    nautical: getTimesForAngle(NAUTICAL),       
    astronomical: getTimesForAngle(ASTRONOMICAL),
    solarNoon,
    solarMidnightStart: solarNoon - 12,
    solarMidnightEnd: solarNoon + 12,
    polarState: overallPolarState
  };
};

/**
 * Calculates the full annual matrix (365 or 366 days for leap years) of daily solar events.
 * @param year - Calendar year (e.g., 2026)
 * @param latitude - Observer latitude in degrees (-90 to +90)
 * @returns Annual solar matrix array
 */
export const calculateAnnualSolarMatrix = (year: number, latitude: Latitude): AnnualSolarMatrixItem[] => {
  const totalDays = getDaysInYear(year);
  const days: AnnualSolarMatrixItem[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(Date.UTC(year, 0, day));
    const jd = getJulianDate(d, 12);
    const { declination, equationOfTime } = calculateSolarPosition(jd);
    const localSolarNoon = 12 - (equationOfTime / 60);
    const events = calculateDailySolarEvents(latitude, declination, localSolarNoon);

    days.push({
      day,
      declination,
      equationOfTime,
      solarNoon: events.solarNoon,
      sunrise: events.official.morning,
      sunset: events.official.evening,
      civilDawn: events.civil.morning,
      civilDusk: events.civil.evening,
      nauticalDawn: events.nautical.morning,
      nauticalDusk: events.nautical.evening,
      astroDawn: events.astronomical.morning,
      astroDusk: events.astronomical.evening,
      dayLength: events.official.evening - events.official.morning
    });
  }
  return days;
};
