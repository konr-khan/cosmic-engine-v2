import { toRadians, toDegrees, clamp, getJulianDate } from './core';
import { calculateLunarPosition } from './lunar';

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
  peakAlt: number;
  riseHourAngle: number | null;
  isCircumpolar: boolean;
  isPolarNight: boolean;
  peakPoint: { x: number; y: number };
  risePoint: { x: number; y: number } | null;
  setPoint: { x: number; y: number } | null;
}

export interface MonthlyLunarBounds {
  minDec: number;
  maxDec: number;
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

  // Check polar conditions: cos(H0) = -tan(phi)*tan(delta)
  const tanProduct = Math.tan(phiRad) * Math.tan(decRad);

  // Polar Night: body never rises above horizon
  if (tanProduct <= -1) {
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
  if (tanProduct >= 1) {
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
  const cosH0 = -tanProduct;
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

  return {
    pathD: points.join(' '),
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
 * Computes the monthly minimum and maximum lunar declination bounds across a rolling
 * 30-day window centered on the target date (t - 15 days to t + 15 days).
 *
 * Because the Moon's tropical month declination cycle is 27.32 days, a 30-day window
 * is mathematically guaranteed to capture both the absolute peak (northernmost declination)
 * and trough (southernmost declination) for the current lunar cycle.
 */
export const calculateMonthlyLunarDeclinationBounds = (
  currentDate: Date = new Date()
): MonthlyLunarBounds => {
  const centerJD = getJulianDate(currentDate, 12);
  let minDec = 90;
  let maxDec = -90;

  // Sample at 6-hour intervals across 30 days (121 samples, < 0.03ms execution)
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const sampleJD = centerJD - 15 + (30 * i) / steps;
    const pos = calculateLunarPosition(sampleJD);
    const dec = Number(pos.declination);

    if (dec < minDec) minDec = dec;
    if (dec > maxDec) maxDec = dec;
  }

  return {
    minDec: parseFloat(minDec.toFixed(2)),
    maxDec: parseFloat(maxDec.toFixed(2))
  };
};
