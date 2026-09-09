import { toRadians, toDegrees, clamp, getJulianDate } from './core';
import { calculateLunarPosition, calculateTrueLunarNodeEvents } from './lunar';
import { calculateSolarPosition } from './solar';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from './astroConstants';

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

export interface TimelineNodeEvent {
  type: 'ascending' | 'descending';
  daysOffset: number; // relative to Today (t=0) within [-15, +15]
  symbol: '☊' | '☋';
  color: string;
  isUpcoming: boolean;
}

export interface TimelineTrackSegment {
  startDays: number;
  endDays: number;
  isNorth: boolean;
  color: string;
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
  daysSincePrevNode: number;
  upcomingNodeType: 'ascending' | 'descending';
  prevNodeType: 'ascending' | 'descending';
  upcomingNode: SkyDomeLunarNode;
  nearestNode: SkyDomeLunarNode;
  nearestNodeType: 'ascending' | 'descending';
  nearestNodeDistDays: number;
  isApproachingNearestNode: boolean;
  isNearNode: boolean;
  quadrantLabel: string;
  timelineNodes: TimelineNodeEvent[];
  timelineSegments: TimelineTrackSegment[];
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

  // Solve true lunar node crossing events (where true ecliptic latitude beta = 0)
  const trueEvents = calculateTrueLunarNodeEvents(julianDate);
  const {
    daysToNextNode,
    daysSincePrevNode,
    upcomingNodeType,
    prevNodeType,
    nearestNodeType,
    nearestNodeDistDays,
    isApproachingNearestNode,
    isNearNode
  } = trueEvents;

  // Build sorted list of true node events within the [-15, +15] days window
  const timelineNodes: TimelineNodeEvent[] = trueEvents.allCrossings
    .filter((c) => c.daysOffset >= -15.2 && c.daysOffset <= 15.2)
    .map((c) => ({
      type: c.type,
      daysOffset: parseFloat(c.daysOffset.toFixed(1)),
      symbol: c.type === 'ascending' ? '☊' : '☋',
      color: c.type === 'ascending' ? '#38bdf8' : '#f43f5e',
      isUpcoming: c.daysOffset > 0
    }));

  // Generate continuous color track segments spanning [-15, +15] based on true beta >= 0
  const timelineSegments: TimelineTrackSegment[] = [];
  const cutPoints = [-15, ...timelineNodes.map((n) => n.daysOffset), 15];

  for (let i = 0; i < cutPoints.length - 1; i++) {
    const startDays = cutPoints[i];
    const endDays = cutPoints[i + 1];
    if (endDays - startDays < 0.05) continue;

    const midDays = (startDays + endDays) / 2;
    const sampleBeta = Number(calculateLunarPosition(julianDate + midDays).beta);
    const isNorth = sampleBeta >= 0;

    timelineSegments.push({
      startDays,
      endDays,
      isNorth,
      color: isNorth ? '#38bdf8' : '#f43f5e'
    });
  }

  const epsRad = toRadians(EARTH_AXIAL_OBLIQUITY_J2000_DEG);

  // Derive solar right ascension to establish local sidereal time (LST)
  let sunRa: number;
  if (sunLambdaDeg === undefined) {
    const solPos = calculateSolarPosition(julianDate);
    sunRa = solPos.rightAscension;
  } else {
    const solLamRad = toRadians(sunLambdaDeg);
    sunRa = Number(toDegrees(Math.atan2(Math.cos(epsRad) * Math.sin(solLamRad), Math.cos(solLamRad))));
    if (sunRa < 0) sunRa += 360;
  }

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
  const prevNode = prevNodeType === 'ascending' ? ascendingNode : descendingNode;
  const nearestNode = isApproachingNearestNode ? upcomingNode : prevNode;

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
    daysSincePrevNode,
    upcomingNodeType,
    prevNodeType,
    upcomingNode,
    nearestNode,
    nearestNodeType,
    nearestNodeDistDays,
    isApproachingNearestNode,
    isNearNode,
    quadrantLabel,
    timelineNodes,
    timelineSegments
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

  const tanProduct = Math.tan(phiRad) * Math.tan(decRad);

  // Polar Night: body never rises above horizon
  if (tanProduct <= -1) {
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
  if (tanProduct >= 1) {
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

