/**
 * @file meridian.ts
 * Celestial meridian profiles, Solstice/Standstill swaths, radial tick marks,
 * and 3D diurnal colure projections & chords.
 */

import { toRadians, toDegrees, clamp } from '../core';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from '../astroConstants';
import {
  CulminationDirection,
  CulminationInfo,
  calculateCulminationBearing,
  EL_R,
  EL_CX,
  EL_CY
} from './elevation';

export interface SolsticeCulminations {
  summer: CulminationInfo;
  winter: CulminationInfo;
}

export interface LunarExtremaCulminations {
  maxBound: CulminationInfo;
  minBound: CulminationInfo;
}

export interface MeridianPoint {
  x: number;
  y: number;
  thetaDeg: number;
  altitudeDeg: number;
  bearing: CulminationDirection;
}

export interface RadialTickLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MeridianDiurnalPoint {
  x: number;
  y: number;
  altitude: number;
  isAboveHorizon: boolean;
  isSubHorizon: boolean;
  isParked: boolean;
}

export interface MeridianDiurnalChord {
  peakPoint: { x: number; y: number };
  horizonPoint: { x: number; y: number } | null;
  anchorPoint: { x: number; y: number };
  daylightD: string;
  twilightD: string;
  isCircumpolar: boolean;
  isNeverVisible: boolean;
}

/**
 * Computes the Summer and Winter Solstice meridian culminations for a given latitude,
 * preserving physical Northern vs. Southern sky bearings for tropical and temperate observers.
 */
export const calculateSolsticeCulminations = (
  latitudeDeg: number
): SolsticeCulminations => {
  const obliquity = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
  const summerDec = latitudeDeg >= 0 ? obliquity : -obliquity;
  const winterDec = latitudeDeg >= 0 ? -obliquity : obliquity;

  return {
    summer: calculateCulminationBearing(latitudeDeg, summerDec),
    winter: calculateCulminationBearing(latitudeDeg, winterDec)
  };
};

/**
 * Computes the monthly maximum and minimum lunar transit culminations for a given latitude,
 * identifying when the Moon crosses the Zenith into the opposite sky hemisphere.
 */
export const calculateLunarExtremaCulminations = (
  latitudeDeg: number,
  maxDec: number,
  minDec: number
): LunarExtremaCulminations => {
  return {
    maxBound: calculateCulminationBearing(latitudeDeg, maxDec),
    minBound: calculateCulminationBearing(latitudeDeg, minDec)
  };
};

/**
 * Maps a celestial body's culmination altitude and meridian bearing to 2D SVG canvas coordinates
 * on the canonical 260x138 Sky Dome coordinate space (EL_R = 92, EL_CX = 130, EL_CY = 104).
 *
 * Angle theta is measured from the North horizon (0° = North, 90° = Zenith, 180° = South):
 *   theta = 180° - h  if South
 *   theta = 90°       if Zenith
 *   theta = h         if North
 *
 * Coordinates:
 *   X = EL_CX + EL_R * cos(theta)
 *   Y = EL_CY - EL_R * sin(theta)
 */
export const calculateMeridianPoint = (
  altitudeDeg: number,
  bearing: CulminationDirection,
  cx: number = EL_CX,
  cy: number = EL_CY,
  r: number = EL_R
): MeridianPoint => {
  const clAlti = Math.max(0, Math.min(90, altitudeDeg));
  let thetaDeg: number;
  if (bearing === 'South') {
    thetaDeg = 180 - clAlti;
  } else if (bearing === 'North') {
    thetaDeg = clAlti;
  } else {
    thetaDeg = 90;
  }

  const rad = toRadians(thetaDeg);
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  return {
    x: parseFloat(x.toFixed(2)),
    y: parseFloat(y.toFixed(2)),
    thetaDeg: parseFloat(thetaDeg.toFixed(2)),
    altitudeDeg: clAlti,
    bearing
  };
};

/**
 * Generates an SVG circular arc path string along the R=92 dome between two meridian angles.
 * In SVG screen space where Y is inverted downward:
 * radMin is closer to North (Right, 3 o'clock) and radMax is closer to South (Left, 9 o'clock).
 * Sweeping counter-clockwise (sweep-flag = 0) travels along the upper semicircle (Y < 104).
 */
export const generateMeridianSwathD = (
  startThetaDeg: number,
  endThetaDeg: number,
  cx: number = EL_CX,
  cy: number = EL_CY,
  r: number = EL_R
): string => {
  const tMin = Math.min(startThetaDeg, endThetaDeg);
  const tMax = Math.max(startThetaDeg, endThetaDeg);
  if (Math.abs(tMax - tMin) < 0.01) return '';

  const radMin = toRadians(tMin);
  const radMax = toRadians(tMax);

  const x1 = cx + r * Math.cos(radMin);
  const y1 = cy - r * Math.sin(radMin);
  const x2 = cx + r * Math.cos(radMax);
  const y2 = cy - r * Math.sin(radMax);

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

/**
 * Computes normal perpendicular radial tick mark coordinates on the dome arc
 * for solstice, standstill, and equinox pins.
 */
export const calculateMeridianRadialTick = (
  thetaDeg: number,
  rInner: number = 88,
  rOuter: number = 96,
  cx: number = EL_CX,
  cy: number = EL_CY
): RadialTickLine => {
  const rad = toRadians(thetaDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x1: parseFloat((cx + rInner * cos).toFixed(1)),
    y1: parseFloat((cy - rInner * sin).toFixed(1)),
    x2: parseFloat((cx + rOuter * cos).toFixed(1)),
    y2: parseFloat((cy - rOuter * sin).toFixed(1))
  };
};

/**
 * Calculates the exact 2D projection of Today's Diurnal Chord in the celestial
 * meridian plane (South <-> Zenith <-> North).
 *
 * Every diurnal parallel of constant declination delta viewed from the side projects
 * as an inclined straight chord parallel to the celestial equator (slope cot(phi)).
 *
 * - The chord ascends through the sky and touches the outer R=92 Meridian Arc at the
 *   exact upper culmination peak altitude for today.
 * - For bodies with normal rise/set, it crosses the horizon baseline (Y=104) at X_horizon = cx + r*sin(delta)*sec(phi).
 * - For the Sun, it extends into twilight strata down to thresholdElevationDeg (-18°), terminating at the Twilight Gate anchor.
 * - For the Moon (threshold = 0°), twilight does not apply, so the chord terminates directly at the Horizon Gate anchor (Y=104).
 */
export const calculateMeridianDiurnalChord = (
  latitudeDeg: number,
  declinationDeg: number,
  thresholdElevationDeg: number = -18,
  cx: number = EL_CX,
  cy: number = EL_CY,
  r: number = EL_R
): MeridianDiurnalChord => {
  const phi = toRadians(latitudeDeg);
  const delta = toRadians(declinationDeg);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosDelta = Math.cos(delta);
  const sinDelta = Math.sin(delta);

  // Peak Upper Culmination Point (H = 0)
  // Touches the R circle at angle (delta - phi) from zenith
  const yNorthPeak = Math.sin(delta - phi);
  const zZenithPeak = Math.cos(delta - phi);
  const peakX = parseFloat((cx + r * yNorthPeak).toFixed(2));
  const peakY = parseFloat((cy - r * zZenithPeak).toFixed(2));

  // Check horizon crossing: cos(H_0) = -tan(phi)*tan(delta)
  const tanPhi = Math.abs(cosPhi) > 1e-6 ? sinPhi / cosPhi : 0;
  const tanDelta = Math.abs(cosDelta) > 1e-6 ? sinDelta / cosDelta : 0;
  const cosH0 = -tanPhi * tanDelta;

  let horizonPoint: { x: number; y: number } | null = null;
  let daylightD = '';
  let twilightD = '';
  let isCircumpolar = false;
  let isNeverVisible = false;

  if (cosH0 < -1) {
    // Circumpolar (Midnight Sun) - Entire 24h diurnal path is above horizon
    isCircumpolar = true;
    // Lower culmination (H = 180°)
    const yNorthMin = Math.sin(phi + delta);
    const zZenithMin = -Math.cos(phi + delta);
    const minX = parseFloat((cx + r * yNorthMin).toFixed(2));
    const minY = parseFloat((cy - r * zZenithMin).toFixed(2));
    daylightD = `M ${minX} ${minY} L ${peakX} ${peakY}`;
    return {
      peakPoint: { x: peakX, y: peakY },
      horizonPoint: null,
      anchorPoint: { x: minX, y: minY },
      daylightD,
      twilightD: '',
      isCircumpolar: true,
      isNeverVisible: false,
    };
  }

  if (cosH0 > 1) {
    // Polar Night - Never rises above horizon
    isNeverVisible = true;
    daylightD = '';
  } else {
    // Crosses horizon at y_north = sin(delta) / cos(phi)
    const yNorthHorizon = Math.abs(cosPhi) > 1e-6 ? sinDelta / cosPhi : 0;
    const horizonX = parseFloat((cx + r * yNorthHorizon).toFixed(2));
    const horizonY = cy; // exactly baseline 104
    horizonPoint = { x: horizonX, y: horizonY };
    daylightD = `M ${horizonX} ${horizonY} L ${peakX} ${peakY}`;
  }

  // Anchor Point at thresholdElevationDeg (e.g. -18° for Sun, 0° for Moon)
  if (thresholdElevationDeg >= 0) {
    // For Moon (threshold = 0°): Anchor is exactly the horizon crossing!
    const anchorX = horizonPoint ? horizonPoint.x : cx;
    const anchorY = cy;
    return {
      peakPoint: { x: peakX, y: peakY },
      horizonPoint,
      anchorPoint: { x: anchorX, y: anchorY },
      daylightD,
      twilightD: '',
      isCircumpolar,
      isNeverVisible,
    };
  }

  // Sub-horizon / Twilight extension down to thresholdElevationDeg (e.g. -18°)
  const zThresh = Math.sin(toRadians(thresholdElevationDeg));
  const zZenithMin = -Math.cos(phi + delta);
  const effectiveZ = Math.max(zZenithMin, zThresh);
  const anchorY = parseFloat((cy - r * effectiveZ).toFixed(2));
  const horizonX = horizonPoint ? horizonPoint.x : (cx + r * (Math.abs(cosPhi) > 1e-6 ? sinDelta / cosPhi : 0));
  const anchorX = parseFloat((horizonX + (anchorY - cy) * tanPhi).toFixed(2));

  if (horizonPoint) {
    twilightD = `M ${anchorX} ${anchorY} L ${horizonPoint.x} ${horizonPoint.y}`;
  }

  return {
    peakPoint: { x: peakX, y: peakY },
    horizonPoint,
    anchorPoint: { x: anchorX, y: anchorY },
    daylightD,
    twilightD,
    isCircumpolar,
    isNeverVisible,
  };
};

/**
 * Calculates the exact 2D projection of a celestial body's 3D diurnal position onto the
 * North-South vertical meridian plane (South <-> Zenith <-> North).
 *
 * In 3D horizontal coordinates:
 *   y_north = cos(phi) * sin(delta) - sin(phi) * cos(delta) * cos(H)
 *   z_zenith = sin(phi) * sin(delta) + cos(phi) * cos(delta) * cos(H) = sin(altitude)
 *
 * Screen coordinates (where South is Left at X=38, Zenith is Top at Y=12, North is Right at X=222,
 * and the horizon is baseline Y=104):
 *   x = cx + r * y_north
 *   y = cy - r * z_zenith
 *
 * When the celestial body's altitude drops below minElevationDeg (-18° for Sun, 0° for Moon),
 * the body gracefully parks at the static Anchor Point (Approach C), avoiding horizontal
 * sliding along the canvas floor during irrelevant nocturnal hours.
 */
export const calculateMeridianDiurnalPoint = (
  latitudeDeg: number,
  declinationDeg: number,
  hourAngleDeg: number,
  minElevationDeg: number = -18,
  cx: number = EL_CX,
  cy: number = EL_CY,
  r: number = EL_R
): MeridianDiurnalPoint => {
  const phi = toRadians(latitudeDeg);
  const delta = toRadians(declinationDeg);
  const H = toRadians(hourAngleDeg);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosDelta = Math.cos(delta);
  const sinDelta = Math.sin(delta);
  const cosH = Math.cos(H);

  // 3D Horizontal Direction Cosines
  const yNorth = cosPhi * sinDelta - sinPhi * cosDelta * cosH;
  const zZenith = sinPhi * sinDelta + cosPhi * cosDelta * cosH;

  // True horizontal altitude in degrees
  const altitudeDeg = toDegrees(Math.asin(clamp(zZenith, -1, 1)));

  // If elevation is below minElevationDeg, park quietly at the Anchor Point
  if (altitudeDeg < minElevationDeg) {
    const chord = calculateMeridianDiurnalChord(latitudeDeg, declinationDeg, minElevationDeg, cx, cy, r);
    return {
      x: chord.anchorPoint.x,
      y: chord.anchorPoint.y,
      altitude: parseFloat(altitudeDeg.toFixed(2)),
      isAboveHorizon: altitudeDeg >= 0,
      isSubHorizon: altitudeDeg < 0,
      isParked: true,
    };
  }

  const x = parseFloat((cx + r * yNorth).toFixed(2));
  const y = parseFloat((cy - r * zZenith).toFixed(2));

  return {
    x,
    y,
    altitude: parseFloat(altitudeDeg.toFixed(2)),
    isAboveHorizon: altitudeDeg >= 0,
    isSubHorizon: altitudeDeg < 0,
    isParked: false,
  };
};
