/**
 * @file elevation.ts
 * Topocentric sky dome projection, diurnal paths, twilight phases,
 * and rising/setting azimuths.
 */

import { toRadians, toDegrees, clamp } from '../core';

export const EL_R = 92;
export const EL_CX = 130;
export const EL_CY = 104;

export interface SkyDomePoint {
  x: number;
  y: number;
  elevation: number;
}

export interface DiurnalPathResult {
  pathD: string;
  twilightD?: string;
  peakAlt: number;
  riseHourAngle: number | null;
  isCircumpolar: boolean;
  isPolarNight: boolean;
  peakPoint: { x: number; y: number };
  risePoint: { x: number; y: number } | null;
  setPoint: { x: number; y: number } | null;
}

export type TwilightPhase = 
  | 'daylight' 
  | 'civil_twilight' 
  | 'nautical_twilight' 
  | 'astronomical_twilight' 
  | 'night';

export interface TwilightStatusInfo {
  phase: TwilightPhase;
  label: string;
  subtitle: string;
  badgeClass: string;
}

export type CulminationDirection = 'South' | 'North' | 'Zenith';

export interface CulminationInfo {
  direction: CulminationDirection;
  meridianLabel: 'S' | 'N' | 'Z';
  altitude: number;
  shortTag: string;
  sightingSummary: string;
}

export interface RiseSetAzimuthInfo {
  riseAzimuth: number | null;
  setAzimuth: number | null;
  riseOctant: string;
  setOctant: string;
  riseFormatted: string;
  setFormatted: string;
  isCircumpolar: boolean;
  isPolarNight: boolean;
}

/**
 * Projects a sky dome coordinate (hour angle, declination, observer latitude)
 * into 2D SVG canvas space (260x120), matching the canonical SkyDome geometry.
 *
 * Elevation is computed via standard spherical trigonometry:
 *   sin(h) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(H)
 *
 * Projection coordinates:
 *   X = EL_CX + EL_R * cos(delta) * sin(H)
 *   Y = EL_CY - EL_R * sin(h)
 *
 * This guarantees the Sun/Moon bead and their diurnal path curves are in 100% agreement.
 */
export const projectSkyDomePoint = (
  hourAngleDeg: number,
  declinationDeg: number,
  latitudeDeg: number,
  cx: number = EL_CX,
  cy: number = EL_CY,
  r: number = EL_R
): SkyDomePoint => {
  const phiRad = toRadians(latitudeDeg);
  const decRad = toRadians(declinationDeg);
  const hRad = toRadians(hourAngleDeg);

  const sinAlt =
    Math.sin(phiRad) * Math.sin(decRad) +
    Math.cos(phiRad) * Math.cos(decRad) * Math.cos(hRad);
  const elevation = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));

  // Canonical orthographic projection onto Prime Vertical plane
  const x = cx + r * Math.cos(decRad) * Math.sin(hRad);
  const y = cy - r * Math.sin(toRadians(elevation));

  return { x, y, elevation };
};

/**
 * Generates an SVG path representing the diurnal transit path of a celestial body
 * across the visible sky dome from horizon rise to horizon set.
 *
 * Handles:
 * - Normal rise / set: semi-diurnal arc H0 = acos(-tan(phi)*tan(delta))
 * - Midnight Sun / Circumpolar: uninterrupted arc looping across the dome
 * - Polar Night: suppressed curve (empty pathD) with isPolarNight = true
 */
export const generateDiurnalPath = (
  latitudeDeg: number,
  declinationDeg: number,
  options?: {
    numSteps?: number;
    cx?: number;
    cy?: number;
    r?: number;
  }
): DiurnalPathResult => {
  const cx = options?.cx ?? EL_CX;
  const cy = options?.cy ?? EL_CY;
  const r = options?.r ?? EL_R;
  const numSteps = options?.numSteps ?? 48;

  const phiRad = toRadians(latitudeDeg);
  const decRad = toRadians(declinationDeg);

  // Peak altitude at meridian transit (H = 0)
  const sinPeak =
    Math.sin(phiRad) * Math.sin(decRad) +
    Math.cos(phiRad) * Math.cos(decRad);
  const peakAlt = toDegrees(Math.asin(clamp(sinPeak, -1, 1)));
  const peakPoint = {
    x: cx,
    y: cy - r * Math.sin(toRadians(peakAlt))
  };

  // Extreme vertical elevation sines across 24h diurnal cycle:
  // sin(h_max) = sin(phi)*sin(delta) + cos(phi)*cos(delta)
  // sin(h_min) = sin(phi)*sin(delta) - cos(phi)*cos(delta)
  const sinLatSinDec = Math.sin(phiRad) * Math.sin(decRad);
  const cosLatCosDec = Math.cos(phiRad) * Math.cos(decRad);
  const sinHMin = sinLatSinDec - cosLatCosDec;
  const sinHMax = sinLatSinDec + cosLatCosDec;

  // Polar Night: body never rises above horizon
  if (sinHMax <= 0 || (Math.abs(latitudeDeg) >= 89.99 && (latitudeDeg >= 0 ? declinationDeg < 0 : declinationDeg > 0))) {
    return {
      pathD: '',
      peakAlt,
      riseHourAngle: null,
      isCircumpolar: false,
      isPolarNight: true,
      peakPoint,
      risePoint: null,
      setPoint: null
    };
  }

  // Midnight Sun / Circumpolar: body never sets below horizon
  if (sinHMin >= 0 || (Math.abs(latitudeDeg) >= 89.99 && (latitudeDeg >= 0 ? declinationDeg >= 0 : declinationDeg <= 0))) {
    const points: string[] = [];
    // Span across the visible 180° dome (H from -90° to +90°)
    for (let i = 0; i <= numSteps; i++) {
      const h = -90 + (180 * i) / numSteps;
      const pt = projectSkyDomePoint(h, declinationDeg, latitudeDeg, cx, cy, r);
      points.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }

    return {
      pathD: points.join(' '),
      peakAlt,
      riseHourAngle: 180,
      isCircumpolar: true,
      isPolarNight: false,
      peakPoint,
      risePoint: { x: cx - r * Math.cos(decRad), y: cy },
      setPoint: { x: cx + r * Math.cos(decRad), y: cy }
    };
  }

  // Normal Rise / Set: H0 = acos(-tan(phi)*tan(delta))
  const cosH0 = -sinLatSinDec / cosLatCosDec;
  const h0Deg = toDegrees(Math.acos(clamp(cosH0, -1, 1)));

  const points: string[] = [];
  let risePoint: { x: number; y: number } | null = null;
  let setPoint: { x: number; y: number } | null = null;

  for (let i = 0; i <= numSteps; i++) {
    const h = -h0Deg + (2 * h0Deg * i) / numSteps;
    const pt = projectSkyDomePoint(h, declinationDeg, latitudeDeg, cx, cy, r);
    
    // Explicitly clamp endpoints to the horizon Y = cy to eliminate numerical float fuzz
    const clampedY = i === 0 || i === numSteps ? cy : Math.min(cy, pt.y);

    if (i === 0) {
      risePoint = { x: pt.x, y: clampedY };
      points.push(`M ${pt.x.toFixed(1)} ${clampedY.toFixed(1)}`);
    } else {
      if (i === numSteps) {
        setPoint = { x: pt.x, y: clampedY };
      }
      points.push(`L ${pt.x.toFixed(1)} ${clampedY.toFixed(1)}`);
    }
  }

  // Generate twilight path segments down to -18° if body rises and sets
  let twilightD = '';
  const sin18 = Math.sin(toRadians(-18));
  const B = Math.cos(phiRad) * Math.cos(decRad);
  const A = Math.sin(phiRad) * Math.sin(decRad);

  if (Math.abs(B) > 1e-6) {
    const ratio18 = (sin18 - A) / B;
    let h18Deg = 180;

    if (ratio18 <= -1) {
      // Sun never dips below -18° (all-night twilight / white nights)
      h18Deg = 180;
    } else if (ratio18 >= 1) {
      // Sun never rises above -18°
      h18Deg = h0Deg;
    } else {
      h18Deg = toDegrees(Math.acos(clamp(ratio18, -1, 1)));
    }

    if (h18Deg > h0Deg) {
      const twilightSteps = 12;
      const morningPoints: string[] = [];
      const eveningPoints: string[] = [];

      // Morning twilight: -h18Deg -> -h0Deg
      for (let i = 0; i <= twilightSteps; i++) {
        const h = -h18Deg + ((h18Deg - h0Deg) * i) / twilightSteps;
        const pt = projectSkyDomePoint(h, declinationDeg, latitudeDeg, cx, cy, r);
        morningPoints.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
      }

      // Evening twilight: +h0Deg -> +h18Deg
      for (let i = 0; i <= twilightSteps; i++) {
        const h = h0Deg + ((h18Deg - h0Deg) * i) / twilightSteps;
        const pt = projectSkyDomePoint(h, declinationDeg, latitudeDeg, cx, cy, r);
        eveningPoints.push(`${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
      }

      twilightD = `${morningPoints.join(' ')} ${eveningPoints.join(' ')}`.trim();
    }
  }

  return {
    pathD: points.join(' '),
    twilightD,
    peakAlt,
    riseHourAngle: h0Deg,
    isCircumpolar: false,
    isPolarNight: false,
    peakPoint,
    risePoint,
    setPoint
  };
};

/**
 * Returns the exact solar twilight phase and human-readable descriptive status
 * for any given sun elevation angle.
 * Harmonized with Solar Almanac Ribbon & Terminator Map design tokens.
 */
export const getSolarTwilightStatus = (elevationDeg: number): TwilightStatusInfo => {
  if (elevationDeg >= 0) {
    return {
      phase: 'daylight',
      label: 'Daylight',
      subtitle: 'Sun Above Horizon',
      badgeClass: 'text-amber-400'
    };
  }
  if (elevationDeg >= -6) {
    return {
      phase: 'civil_twilight',
      label: 'Civil Twilight',
      subtitle: 'Golden / Blue Hour',
      badgeClass: 'text-amber-300'
    };
  }
  if (elevationDeg >= -12) {
    return {
      phase: 'nautical_twilight',
      label: 'Nautical Twilight',
      subtitle: 'Sea Horizon Lost',
      badgeClass: 'text-slate-300'
    };
  }
  if (elevationDeg >= -18) {
    return {
      phase: 'astronomical_twilight',
      label: 'Astronomical Twilight',
      subtitle: 'Faint Stars Emerge',
      badgeClass: 'text-slate-400'
    };
  }
  return {
    phase: 'night',
    label: 'Astronomical Night',
    subtitle: 'Dark Sky',
    badgeClass: 'text-slate-500'
  };
};

/**
 * Returns human-readable status for lunar elevation.
 */
export const getLunarElevationStatus = (
  elevationDeg: number
): { label: string; subtitle: string; badgeClass: string } => {
  if (elevationDeg >= 0) {
    return {
      label: 'Above Horizon',
      subtitle: 'Moonlit Sky',
      badgeClass: 'text-slate-200'
    };
  }
  if (elevationDeg >= -6) {
    return {
      label: 'Near Horizon',
      subtitle: 'Sub-Horizon Transit',
      badgeClass: 'text-slate-400'
    };
  }
  return {
    label: 'Below Horizon',
    subtitle: 'Occluded by Earth',
    badgeClass: 'text-slate-500'
  };
};

const COMPASS_OCTANTS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW'
] as const;

/**
 * Converts a decimal azimuth angle [0, 360) into a standard 16-wind compass octant code.
 */
export const azimuthToCompassOctant = (azimuthDeg: number): string => {
  const norm = ((azimuthDeg % 360) + 360) % 360;
  const idx = Math.floor(((norm + 11.25) % 360) / 22.5) % 16;
  return COMPASS_OCTANTS[idx] || 'N';
};

/**
 * Computes the exact culmination meridian bearing, signed peak altitude,
 * and observer sighting orientation for a celestial body at meridian transit (H = 0).
 *
 * For an observer at latitude phi and a body at declination delta:
 * - Delta = delta - phi
 * - If |Delta| < 0.25°: Zenith overhead transit (Lahaina Noon)
 * - If Delta < 0: Culmination to the South (Az = 180°, facing South)
 * - If Delta > 0: Culmination to the North (Az = 0°, facing North)
 */
export const calculateCulminationBearing = (
  latitudeDeg: number,
  declinationDeg: number
): CulminationInfo => {
  const delta = declinationDeg - latitudeDeg;
  const rawAlt = 90 - Math.abs(delta);
  const altitude = clamp(rawAlt, -90, 90);

  if (Math.abs(delta) < 0.25) {
    return {
      direction: 'Zenith',
      meridianLabel: 'Z',
      altitude: 90.0,
      shortTag: 'ZENITH',
      sightingSummary: 'Overhead Zenith Transit'
    };
  }

  if (delta < 0) {
    return {
      direction: 'South',
      meridianLabel: 'S',
      altitude,
      shortTag: 'S',
      sightingSummary: 'Looking South · S-Sky Arc'
    };
  }

  return {
    direction: 'North',
    meridianLabel: 'N',
    altitude,
    shortTag: 'N',
    sightingSummary: 'Looking North · N-Sky Arc'
  };
};

/**
 * Computes the rising and setting horizon azimuths and 16-point compass octants
 * for a body at declination delta for an observer at latitude phi.
 *
 * Spherical formula: cos(Az_rise) = sin(delta) / cos(phi)
 * Az_set = (360° - Az_rise) % 360°
 */
export const calculateRiseSetAzimuth = (
  latitudeDeg: number,
  declinationDeg: number
): RiseSetAzimuthInfo => {
  const phiRad = toRadians(latitudeDeg);
  const decRad = toRadians(declinationDeg);

  const sinLatSinDec = Math.sin(phiRad) * Math.sin(decRad);
  const cosLatCosDec = Math.cos(phiRad) * Math.cos(decRad);
  const sinHMin = sinLatSinDec - cosLatCosDec;
  const sinHMax = sinLatSinDec + cosLatCosDec;

  // Polar Night: body never rises above horizon
  if (sinHMax <= 0 || (Math.abs(latitudeDeg) >= 89.99 && (latitudeDeg >= 0 ? declinationDeg < 0 : declinationDeg > 0))) {
    return {
      riseAzimuth: null,
      setAzimuth: null,
      riseOctant: '--',
      setOctant: '--',
      riseFormatted: '--',
      setFormatted: '--',
      isCircumpolar: false,
      isPolarNight: true
    };
  }

  // Midnight Sun / Circumpolar: body never sets below horizon
  if (sinHMin >= 0 || (Math.abs(latitudeDeg) >= 89.99 && (latitudeDeg >= 0 ? declinationDeg > 0 : declinationDeg < 0))) {
    return {
      riseAzimuth: null,
      setAzimuth: null,
      riseOctant: '--',
      setOctant: '--',
      riseFormatted: '--',
      setFormatted: '--',
      isCircumpolar: true,
      isPolarNight: false
    };
  }

  // Exact polar singularity check (|latitude| >= 89.99): horizontal azimuths degenerate at poles
  if (Math.abs(latitudeDeg) >= 89.99) {
    return {
      riseAzimuth: null,
      setAzimuth: null,
      riseOctant: '--',
      setOctant: '--',
      riseFormatted: '--',
      setFormatted: '--',
      isCircumpolar: true,
      isPolarNight: false
    };
  }

  const cosPhi = Math.cos(phiRad);
  const cosRise = cosPhi !== 0 ? Math.sin(decRad) / cosPhi : 0;
  const riseAz = toDegrees(Math.acos(clamp(cosRise, -1, 1)));
  const setAz = (360 - riseAz) % 360;

  const riseOctant = azimuthToCompassOctant(riseAz);
  const setOctant = azimuthToCompassOctant(setAz);

  return {
    riseAzimuth: parseFloat(riseAz.toFixed(1)),
    setAzimuth: parseFloat(setAz.toFixed(1)),
    riseOctant,
    setOctant,
    riseFormatted: `${Math.round(riseAz).toString().padStart(3, '0')}° ${riseOctant}`,
    setFormatted: `${Math.round(setAz).toString().padStart(3, '0')}° ${setOctant}`,
    isCircumpolar: false,
    isPolarNight: false
  };
};
