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
  twilightD?: string;
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

export interface SkyDomeLunarNode {
  x: number;
  y: number;
  elevation: number;
  hourAngle: number;
  declination: number;
  rightAscension: number;
  eclipticLongitude: number;
  isAboveHorizon: boolean;
  isVisible: boolean; // elevation >= -18
}

export interface SkyDomeLunarNodesResult {
  ascendingNode: SkyDomeLunarNode;
  descendingNode: SkyDomeLunarNode;
  moonBeta: number;
  isMoonAscending: boolean;
  isWaxing: boolean;
  argumentOfLatitude: number;
  orbitalProgressPercent: number;
  daysToNextNode: number;
  upcomingNodeType: 'ascending' | 'descending';
  upcomingNode: SkyDomeLunarNode;
  isNearNode: boolean;
  quadrantLabel: string;
}

/**
 * Calculates the exact instantaneous Sky Dome positions and elevation angles for the
 * Moon's Ascending Node (☊) and Descending Node (☋), along with 4-quadrant orbital
 * progress, argument of latitude, and approaching node intersection geometry.
 *
 * The nodes lie on the Ecliptic plane (beta = 0). Their right ascension and declination
 * are solved from the nodal longitude Omega and obliquity epsilon, and projected into
 * 2D Sky Dome space matching the local sidereal time of the observer.
 */
export const calculateSkyDomeLunarNodes = (
  latitudeDeg: number,
  julianDate: number,
  displayTime: number,
  solarNoon: number = 12,
  sunLambdaDeg?: number,
  options?: {
    cx?: number;
    cy?: number;
    r?: number;
    phaseValue?: number;
    moonBeta?: number;
  }
): SkyDomeLunarNodesResult => {
  const cx = options?.cx ?? EL_CX;
  const cy = options?.cy ?? EL_CY;
  const r = options?.r ?? EL_R;

  const lunarPos = calculateLunarPosition(julianDate);
  const ascLon = Number(lunarPos.nodeLongitude);
  const descLon = Number(lunarPos.descendingNodeLongitude);
  const moonBeta = options?.moonBeta !== undefined 
    ? options.moonBeta 
    : Number(lunarPos.beta ?? lunarPos.eclipticLatitude ?? 0);
  const isMoonAscending = moonBeta >= 0;
  const phaseVal = options?.phaseValue !== undefined 
    ? options.phaseValue 
    : Number(lunarPos.phase ?? 0);
  const isWaxing = phaseVal < 0.5;
  const F = Number(lunarPos.argumentOfLatitude ?? 0);
  const normF = ((F % 360) + 360) % 360;
  const orbitalProgressPercent = (normF / 360) * 100;

  // Determine which node is upcoming along the prograde orbital path
  let upcomingNodeType: 'ascending' | 'descending';
  let deltaF: number;
  if (normF < 180) {
    upcomingNodeType = 'descending';
    deltaF = 180 - normF;
  } else {
    upcomingNodeType = 'ascending';
    deltaF = 360 - normF;
  }
  const daysToNextNode = parseFloat(((deltaF / 360) * 27.21222).toFixed(1));
  const isNearNode = Math.abs(moonBeta) <= 2.0 || daysToNextNode <= 2.0;

  const OBLIQUITY = 23.439281;
  const epsRad = toRadians(OBLIQUITY);

  // Derive solar right ascension to establish local sidereal time (LST)
  let solLam = sunLambdaDeg;
  if (solLam === undefined) {
    const n = julianDate - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    solLam = L + 1.915 * Math.sin(toRadians(g)) + 0.020 * Math.sin(toRadians(2 * g));
  }
  const solLamRad = toRadians(solLam);
  let sunRa: number = Number(toDegrees(Math.atan2(Math.cos(epsRad) * Math.sin(solLamRad), Math.cos(solLamRad))));
  if (sunRa < 0) sunRa += 360;

  // LST at the active display time: H_sun = (displayTime - solarNoon) * 15 => LST = H_sun + sunRA
  const lstDeg = (displayTime - solarNoon) * 15 + sunRa;

  const projectNode = (nodeLonDeg: number): SkyDomeLunarNode => {
    const lamRad = toRadians(nodeLonDeg);
    const sinDec = Math.sin(epsRad) * Math.sin(lamRad);
    const decDeg = Number(toDegrees(Math.asin(clamp(sinDec, -1, 1))));
    let raDeg: number = Number(toDegrees(Math.atan2(Math.cos(epsRad) * Math.sin(lamRad), Math.cos(lamRad))));
    if (raDeg < 0) raDeg += 360;

    let hDeg = ((lstDeg - raDeg) % 360 + 360) % 360;
    if (hDeg > 180) hDeg -= 360;

    const pt = projectSkyDomePoint(hDeg, decDeg, latitudeDeg, cx, cy, r);
    return {
      x: pt.x,
      y: pt.y,
      elevation: pt.elevation,
      hourAngle: hDeg,
      declination: decDeg,
      rightAscension: raDeg,
      eclipticLongitude: nodeLonDeg,
      isAboveHorizon: pt.elevation >= 0,
      isVisible: pt.elevation >= -18
    };
  };

  const ascendingNode = projectNode(ascLon);
  const descendingNode = projectNode(descLon);
  const upcomingNode = upcomingNodeType === 'ascending' ? ascendingNode : descendingNode;
  const quadrantLabel = `${isWaxing ? 'Waxing' : 'Waning'} ${isMoonAscending ? 'North (☊)' : 'South (☋)'}`;

  return {
    ascendingNode,
    descendingNode,
    moonBeta,
    isMoonAscending,
    isWaxing,
    argumentOfLatitude: normF,
    orbitalProgressPercent,
    daysToNextNode,
    upcomingNodeType,
    upcomingNode,
    isNearNode,
    quadrantLabel
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
