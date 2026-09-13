/**
 * @file terminatorTracks.ts
 * Pure astronomical math utilities for generating 24-hour diurnal subsolar and
 * sublunar ground tracks on an equirectangular world map with antimeridian seam
 * splitting, active ecliptic lunar node crossing detection, and proximity telemetry.
 *
 * References:
 * - Jean Meeus, Astronomical Algorithms (Chapters 12, 25, 47, 48)
 * - Standard Greenwich Mean Sidereal Time (GMST) and hour angle projections
 */

import { JulianDate, asJulianDate } from '../../types/units';
import { J2000_JD } from './astroConstants';
import { calculateGMST } from './core';
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
 * Calculates instantaneous subsolar point (lat, lon) on Earth where the Sun is at zenith (+90°).
 *
 * @param julianDate - Julian Date epoch
 * @returns Latitude (declination) and Longitude in degrees
 */
export const calculateSubsolarPoint = (
  julianDate: JulianDate | number = J2000_JD
): { lat: number; lon: number } => {
  const jd = typeof julianDate === 'number' ? asJulianDate(julianDate) : julianDate;
  const solarPos = calculateSolarPosition(jd);
  const gmst = calculateGMST(jd);
  const lon = ((((solarPos.rightAscension - gmst + 540) % 360) + 360) % 360) - 180;
  return {
    lat: Number(solarPos.declination),
    lon
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
  const jd = typeof julianDate === 'number' ? asJulianDate(julianDate) : julianDate;
  const lunarPos = calculateLunarPosition(jd);
  const gmst = calculateGMST(jd);
  const lon = ((((lunarPos.rightAscension - gmst + 540) % 360) + 360) % 360) - 180;
  return {
    lat: Number(lunarPos.declination),
    lon
  };
};

/**
 * Converts a geographic longitude to observer-centered map coordinate X [0..360].
 * Observer meridian is centered at X = 180.
 */
export const projectMapX = (lon: number, observerLon: number): number => {
  return ((lon - observerLon + 180 + 360) % 360 + 360) % 360;
};

/**
 * Converts a geographic latitude / declination to map coordinate Y [0..180].
 * North Pole (+90°) = 0, Equator (0°) = 90, South Pole (-90°) = 180.
 */
export const projectMapY = (lat: number): number => {
  return 90 - lat;
};

/**
 * Connects an array of sequential map points into an SVG path `d` string,
 * automatically handling antimeridian seam wrapping across X = 0 / 360.
 *
 * If |x_i - x_{i-1}| > 180, the path interpolates to the border boundary (0 or 360),
 * lifts the pen, and resumes at the opposite boundary to eliminate streak artifacts.
 *
 * @param points - Array of sequential map coordinates
 * @returns SVG path string `d`
 */
export const buildSeamSafeSvgPath = (points: Array<{ x: number; y: number }>): string => {
  if (points.length < 2) return '';

  let d = '';
  let inSegment = false;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const curX = parseFloat(pt.x.toFixed(2));
    const curY = parseFloat(pt.y.toFixed(2));

    if (!inSegment) {
      d += `M ${curX} ${curY}`;
      inSegment = true;
      continue;
    }

    const prevPt = points[i - 1];
    const deltaX = pt.x - prevPt.x;

    // Check for antimeridian seam wrapping across 0 <-> 360
    if (Math.abs(deltaX) > 180) {
      if (deltaX < 0) {
        // Moving westward: prevPt is near 360, pt is near 0
        const distTo360 = 360 - prevPt.x;
        const distFrom0 = pt.x;
        const total = distTo360 + distFrom0;
        const f = total > 0 ? distTo360 / total : 0.5;
        const yEdge = parseFloat((prevPt.y + f * (pt.y - prevPt.y)).toFixed(2));

        d += ` L 360 ${yEdge} M 0 ${yEdge} L ${curX} ${curY}`;
      } else {
        // Moving eastward: prevPt is near 0, pt is near 360
        const distTo0 = prevPt.x;
        const distFrom360 = 360 - pt.x;
        const total = distTo0 + distFrom360;
        const f = total > 0 ? distTo0 / total : 0.5;
        const yEdge = parseFloat((prevPt.y + f * (pt.y - prevPt.y)).toFixed(2));

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
  const jd0 = typeof targetJD === 'number' ? asJulianDate(targetJD) : targetJD;
  const numSteps = Math.round((24 * 60) / stepMinutes);
  const stepHours = stepMinutes / 60;
  const points: GroundTrackPoint[] = [];

  const pastPoints: Array<{ x: number; y: number }> = [];
  const futurePoints: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= numSteps; i++) {
    const hoursOffset = -12 + i * stepHours;
    const jd = asJulianDate(Number(jd0) + hoursOffset / 24);

    const geo = type === 'sun' ? calculateSubsolarPoint(jd) : calculateSublunarPoint(jd);
    const x = projectMapX(geo.lon, observerLon);
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
 * @param targetJD - Central Julian Date epoch
 * @param observerLon - Observer longitude for map coordinate projection
 * @returns Active nodal marker if a crossing occurs today, or null
 */
export const findActiveNodalCrossing = (
  targetJD: JulianDate | number = J2000_JD,
  observerLon: number = 0
): ActiveNodalMarker | null => {
  const jd0 = typeof targetJD === 'number' ? asJulianDate(targetJD) : targetJD;
  const trueEvents = calculateTrueLunarNodeEvents(jd0, 2);

  // Find any crossing with |daysOffset| <= 0.5 (within +-12 hours)
  const crossing: TrueLunarNodeCrossing | undefined = trueEvents.allCrossings.find(
    (c) => Math.abs(c.daysOffset) <= 0.5
  );

  if (!crossing) return null;

  const crossingJD = asJulianDate(Number(crossing.jd));
  const sublunar = calculateSublunarPoint(crossingJD);
  const x = projectMapX(sublunar.lon, observerLon);
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
 * @param targetJD - Julian Date epoch
 * @returns LunarNodeProximityTelemetry object
 */
export const getLunarNodeProximityTelemetry = (
  targetJD: JulianDate | number = J2000_JD
): LunarNodeProximityTelemetry => {
  const jd0 = typeof targetJD === 'number' ? asJulianDate(targetJD) : targetJD;
  const trueEvents = calculateTrueLunarNodeEvents(jd0, 2);

  // Gated condition: within +-24 hours (1.0 day)
  if (trueEvents.nearestNodeDistDays > 1.0) {
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
