/**
 * @file terminatorTracks.ts
 * Pure astronomical math utilities for generating 24-hour diurnal subsolar and
 * sublunar ground tracks on an equirectangular world map with antimeridian seam
 * splitting, active ecliptic lunar node crossing detection, and proximity telemetry.
 *
 * Hardened with defensive boundary clamping, non-finite guardrails, and singularity
 * protection ensuring zero NaN propagation and valid SVG path strings under all inputs.
 *
 * References:
 * - Jean Meeus, Astronomical Algorithms (Chapters 12, 25, 47, 48)
 * - Standard Greenwich Mean Sidereal Time (GMST) and hour angle projections
 */

import { JulianDate, asJulianDate } from '../../types/units';
import { J2000_JD } from './astroConstants';
import { calculateGMST, clamp } from './core';
import { calculateSolarPosition } from './solar';
import { calculateLunarPosition, calculateTrueLunarNodeEvents, TrueLunarNodeCrossing } from './lunar';

export interface GroundTrackPoint {
  /** Map X coordinate [0..360] centered on observer meridian */
  x: number;
  /** Map Y coordinate [0..180] from North Pole (0) to South Pole (180) */
  y: number;
  /** Geographic longitude [-180..180] */
  lon: number;
  /** Geographic latitude / declination [-90..90] */
  lat: number;
  /** Offset in fractional hours relative to target epoch [-12..+12] */
  hoursOffset: number;
}

export interface GroundTrackResult {
  /** SVG path d string for the past 12 hours ([-12h..0h]) */
  pastD: string;
  /** SVG path d string for the future 12 hours ([0h..+12h]) */
  futureD: string;
  /** Array of raw track points */
  points: GroundTrackPoint[];
}

export interface ActiveNodalMarker {
  /** Ecliptic node type */
  type: 'ascending' | 'descending';
  /** Astronomical unicode symbol */
  symbol: '☊' | '☋';
  /** Map X coordinate [0..360] centered on observer meridian */
  x: number;
  /** Map Y coordinate [0..180] */
  y: number;
  /** Geographic longitude [-180..180] */
  lon: number;
  /** Geographic latitude / declination [-90..90] */
  lat: number;
  /** Offset in fractional hours relative to active epoch [-12..+12] */
  hoursOffset: number;
  /** Human-readable label (e.g., "Ascending Node in 4.2h") */
  label: string;
}

export interface LunarNodeProximityTelemetry {
  /** Whether the Moon is within +-24 hours of an ecliptic node crossing */
  isNear: boolean;
  /** Nearest node type if near */
  type?: 'ascending' | 'descending';
  /** Astronomical unicode symbol if near */
  symbol?: '☊' | '☋';
  /** Time delta in hours to nearest node */
  hoursToNearestNode?: number;
  /** Whether the Moon is approaching the node (true) or passed it (false) */
  isApproaching?: boolean;
  /** Concise badge message for hover HUD */
  badgeText?: string;
}

/**
 * Defensive parameter gatekeeper for Julian Dates.
 * Clamps to valid astronomical range [0, 5,000,000] and defaults to J2000_JD on NaN/non-finite.
 */
export const sanitizeTrackJD = (jd: JulianDate | number): JulianDate => {
  const num = Number(jd);
  if (!Number.isFinite(num) || num < 0 || num > 5000000) {
    return asJulianDate(J2000_JD);
  }
  return asJulianDate(num);
};

/**
 * Defensive parameter gatekeeper for geographic longitudes.
 * Normalizes to standard [-180, 180] and defaults to 0.0 on NaN/non-finite.
 */
export const sanitizeTrackLon = (lon: number): number => {
  if (!Number.isFinite(lon)) return 0;
  return ((lon + 180) % 360 + 360) % 360 - 180;
};

/**
 * Defensive parameter gatekeeper for geographic latitudes.
 * Clamps to [-90, 90] and defaults to 0.0 on NaN/non-finite.
 */
export const sanitizeTrackLat = (lat: number): number => {
  if (!Number.isFinite(lat)) return 0;
  return clamp(lat, -90, 90);
};

/**
 * Calculates instantaneous subsolar point (lat, lon) on Earth where the Sun is at zenith (+90°).
 *
 * @param julianDate - Julian Date epoch
 * @returns Latitude (declination) and Longitude in degrees
 */
export const calculateSubsolarPoint = (
  julianDate: JulianDate | number = J2000_JD
): { lat: number; lon: number } => {
  const safeJD = sanitizeTrackJD(julianDate);
  const solarPos = calculateSolarPosition(safeJD);
  const gmst = calculateGMST(safeJD);
  const lon = ((((solarPos.rightAscension - gmst + 540) % 360) + 360) % 360) - 180;
  return {
    lat: clamp(Number(solarPos.declination), -90, 90),
    lon: sanitizeTrackLon(lon)
  };
};

/**
 * Calculates instantaneous sublunar point (lat, lon) on Earth where the Moon is at zenith (+90°).
 *
 * @param julianDate - Julian Date epoch
 * @returns Latitude (declination) and Longitude in degrees
 */
export const calculateSublunarPoint = (
  julianDate: JulianDate | number = J2000_JD
): { lat: number; lon: number } => {
  const safeJD = sanitizeTrackJD(julianDate);
  const lunarPos = calculateLunarPosition(safeJD);
  const gmst = calculateGMST(safeJD);
  const lon = ((((lunarPos.rightAscension - gmst + 540) % 360) + 360) % 360) - 180;
  return {
    lat: clamp(Number(lunarPos.declination), -90, 90),
    lon: sanitizeTrackLon(lon)
  };
};

/**
 * Converts a geographic longitude to observer-centered map coordinate X [0..360].
 * Observer meridian is centered at X = 180.
 * Hardened with defensive sanitization and boundary clamping.
 */
export const projectMapX = (lon: number, observerLon: number): number => {
  const safeLon = sanitizeTrackLon(lon);
  const safeObserverLon = sanitizeTrackLon(observerLon);
  const x = ((safeLon - safeObserverLon + 180 + 360) % 360 + 360) % 360;
  return clamp(x, 0, 360);
};

/**
 * Converts a geographic latitude / declination to map coordinate Y [0..180].
 * North Pole (+90°) = 0, Equator (0°) = 90, South Pole (-90°) = 180.
 * Hardened with defensive sanitization and boundary clamping.
 */
export const projectMapY = (lat: number): number => {
  const safeLat = sanitizeTrackLat(lat);
  return clamp(90 - safeLat, 0, 180);
};

/**
 * Connects an array of sequential map points into an SVG path `d` string,
 * automatically handling antimeridian seam wrapping across X = 0 / 360.
 *
 * Hardened with point filtering, Y_edge boundary clamping [0..180], and
 * non-finite coordinate rejection.
 *
 * @param points - Array of sequential map coordinates
 * @returns SVG path string `d`
 */
export const buildSeamSafeSvgPath = (points: Array<{ x: number; y: number }>): string => {
  if (!Array.isArray(points)) return '';
  const validPoints = points.filter(pt => pt && Number.isFinite(pt.x) && Number.isFinite(pt.y));
  if (validPoints.length < 2) return '';

  let d = '';
  let inSegment = false;

  for (let i = 0; i < validPoints.length; i++) {
    const pt = validPoints[i];
    const curX = clamp(parseFloat(pt.x.toFixed(2)), 0, 360);
    const curY = clamp(parseFloat(pt.y.toFixed(2)), 0, 180);

    if (!inSegment) {
      d += `M ${curX} ${curY}`;
      inSegment = true;
      continue;
    }

    const prevPt = validPoints[i - 1];
    const deltaX = pt.x - prevPt.x;

    // Check for antimeridian seam wrapping across 0 <-> 360
    if (Math.abs(deltaX) > 180) {
      if (deltaX < 0) {
        // Moving westward: prevPt is near 360, pt is near 0
        const distTo360 = 360 - prevPt.x;
        const distFrom0 = pt.x;
        const total = distTo360 + distFrom0;
        const f = total > 0 ? clamp(distTo360 / total, 0, 1) : 0.5;
        const rawYEdge = prevPt.y + f * (pt.y - prevPt.y);
        const yEdge = clamp(parseFloat(rawYEdge.toFixed(2)), 0, 180);

        d += ` L 360 ${yEdge} M 0 ${yEdge} L ${curX} ${curY}`;
      } else {
        // Moving eastward: prevPt is near 0, pt is near 360
        const distTo0 = prevPt.x;
        const distFrom360 = 360 - pt.x;
        const total = distTo0 + distFrom360;
        const f = total > 0 ? clamp(distTo0 / total, 0, 1) : 0.5;
        const rawYEdge = prevPt.y + f * (pt.y - prevPt.y);
        const yEdge = clamp(parseFloat(rawYEdge.toFixed(2)), 0, 180);

        d += ` L 0 ${yEdge} M 360 ${yEdge} L ${curX} ${curY}`;
      }
    } else {
      d += ` L ${curX} ${curY}`;
    }
  }

  return d;
};

/**
 * Generates a 24-hour diurnal ground track ([-12h..+12h]) for either the Sun or Moon,
 * returning separate SVG path strings for past (-12h..0h) and future (0h..+12h).
 *
 * Hardened with parameter bounds clamping and graceful fallbacks.
 *
 * @param type - 'sun' or 'moon'
 * @param targetJD - Central Julian Date epoch (active time)
 * @param observerLon - Observer longitude for map centering
 * @param stepMinutes - Sampling interval in minutes (default 30 mins = 49 points)
 * @returns GroundTrackResult with pastD and futureD SVG paths
 */
export const generate24HourGroundTrack = (
  type: 'sun' | 'moon',
  targetJD: JulianDate | number = J2000_JD,
  observerLon: number = 0,
  stepMinutes: number = 30
): GroundTrackResult => {
  const safeType = type === 'moon' ? 'moon' : 'sun';
  const safeJD0 = sanitizeTrackJD(targetJD);
  const safeObserverLon = sanitizeTrackLon(observerLon);
  const safeStepMinutes = Number.isFinite(stepMinutes) && stepMinutes > 0 ? clamp(stepMinutes, 5, 720) : 30;

  const numSteps = Math.round((24 * 60) / safeStepMinutes);
  const stepHours = safeStepMinutes / 60;
  const points: GroundTrackPoint[] = [];

  const pastPoints: Array<{ x: number; y: number }> = [];
  const futurePoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= numSteps; i++) {
    const hoursOffset = -12 + i * stepHours;
    const jd = asJulianDate(Number(safeJD0) + hoursOffset / 24);

    const geo = safeType === 'sun' ? calculateSubsolarPoint(jd) : calculateSublunarPoint(jd);
    const x = projectMapX(geo.lon, safeObserverLon);
    const y = projectMapY(geo.lat);

    const pt: GroundTrackPoint = {
      x,
      y,
      lon: geo.lon,
      lat: geo.lat,
      hoursOffset
    };
    points.push(pt);

    if (hoursOffset <= 0.0001) {
      pastPoints.push({ x, y });
    }
    if (hoursOffset >= -0.0001) {
      futurePoints.push({ x, y });
    }
  }

  const pastD = buildSeamSafeSvgPath(pastPoints);
  const futureD = buildSeamSafeSvgPath(futurePoints);

  return {
    pastD,
    futureD,
    points
  };
};

/**
 * Scans for true ecliptic lunar node crossings (where ecliptic latitude beta = 0)
 * falling strictly within the active [-12h..+12h] window.
 *
 * Hardened with defensive date checks and null-safety guards.
 *
 * @param targetJD - Central Julian Date epoch
 * @param observerLon - Observer longitude for map coordinate projection
 * @returns Active nodal marker if a crossing occurs today, or null
 */
export const findActiveNodalCrossing = (
  targetJD: JulianDate | number = J2000_JD,
  observerLon: number = 0
): ActiveNodalMarker | null => {
  const safeJD = sanitizeTrackJD(targetJD);
  const safeObserverLon = sanitizeTrackLon(observerLon);
  const trueEvents = calculateTrueLunarNodeEvents(safeJD, 2);

  if (!trueEvents || !Array.isArray(trueEvents.allCrossings)) {
    return null;
  }

  // Find any crossing with |daysOffset| <= 0.5 (within +-12 hours)
  const crossing: TrueLunarNodeCrossing | undefined = trueEvents.allCrossings.find(
    (c) => c && Number.isFinite(c.daysOffset) && Math.abs(c.daysOffset) <= 0.5
  );

  if (!crossing || !Number.isFinite(crossing.jd)) return null;

  const crossingJD = asJulianDate(Number(crossing.jd));
  const sublunar = calculateSublunarPoint(crossingJD);
  const x = projectMapX(sublunar.lon, safeObserverLon);
  const y = projectMapY(sublunar.lat);
  const hoursOffset = crossing.daysOffset * 24;

  const isAscending = crossing.type === 'ascending';
  const symbol: '☊' | '☋' = isAscending ? '☊' : '☋';
  const timeStr = Math.abs(hoursOffset) < 0.1
    ? 'now'
    : hoursOffset > 0
      ? `in ${hoursOffset.toFixed(1)}h`
      : `${Math.abs(hoursOffset).toFixed(1)}h ago`;

  const label = `${isAscending ? 'Ascending Node (☊)' : 'Descending Node (☋)'} ${timeStr}`;

  return {
    type: crossing.type,
    symbol,
    x,
    y,
    lon: sublunar.lon,
    lat: sublunar.lat,
    hoursOffset,
    label
  };
};

/**
 * Evaluates lunar node proximity telemetry for the Moon hover HUD.
 * Only returns active telemetry if the Moon is within +-24 hours of an ecliptic node crossing.
 *
 * Hardened with defensive date checks and non-finite guards.
 *
 * @param targetJD - Julian Date epoch
 * @returns LunarNodeProximityTelemetry object
 */
export const getLunarNodeProximityTelemetry = (
  targetJD: JulianDate | number = J2000_JD
): LunarNodeProximityTelemetry => {
  const safeJD = sanitizeTrackJD(targetJD);
  const trueEvents = calculateTrueLunarNodeEvents(safeJD, 2);

  if (
    !trueEvents ||
    !Number.isFinite(trueEvents.nearestNodeDistDays) ||
    trueEvents.nearestNodeDistDays > 1.0
  ) {
    return { isNear: false };
  }

  const nearestType = trueEvents.nearestNodeType;
  const symbol: '☊' | '☋' = nearestType === 'ascending' ? '☊' : '☋';
  const hours = parseFloat((trueEvents.nearestNodeDistDays * 24).toFixed(1));
  const isApproaching = trueEvents.isApproachingNearestNode;

  const timeDesc = isApproaching ? `in ${hours}h` : `${hours}h ago`;
  const nodeName = nearestType === 'ascending' ? 'Ascending Node (☊)' : 'Descending Node (☋)';
  const badgeText = `${symbol} ${nodeName} ${timeDesc}`;

  return {
    isNear: true,
    type: nearestType,
    symbol,
    hoursToNearestNode: hours,
    isApproaching,
    badgeText
  };
};
