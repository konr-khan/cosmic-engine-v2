import { getJulianDate, julianDateToDate, toRadians, toDegrees } from './core';
import { 
  J2000_JD,
  ASTRONOMICAL_UNIT_KM, 
  EARTH_RADIUS_WGS84_KM, 
  MOON_RADIUS_MEAN_KM, 
  MOON_DIAMETER_KM, 
  SUN_ANGULAR_DIAMETER_1AU_ARCMIN,
  MOON_ORBIT_INCLINATION_DEG
} from './astroConstants';
import { calculateSolarPosition } from './solar';
import { calculateLunarPosition } from './lunar';
import { JulianDate, asJulianDate } from '../../types/units';
import { EclipseType } from '../../types/astronomy';

export interface EclipseCalculationResult {
  type: EclipseType;
  category: 'SOLAR' | 'LUNAR' | 'NO_ECLIPSE';
  label: string;
  obscuration: number;
  beta: number;
  nodeProximityDeg: number;
  alignmentPercent: number;
  isEclipseActive: boolean;
  distanceKm: number;
  umbraRadiusKm: number;
  penumbraRadiusKm: number;
  raDiff: number;
  elongation: number;
  phaseValue: number;
  nodeAngleDeg?: number;
  argumentOfLatitude?: number;
  isAscendingHemisphere?: boolean;
  nodeLongitude?: number;
  descendingNodeLongitude?: number;
}

/**
 * Solves solar and lunar eclipse alignment, shadow radiuses, and obscuration percentages for a Julian Date.
 * @param julianDate - Julian Date
 * @returns Eclipse status and alignment details
 */
export const calculateEclipseData = (julianDate: JulianDate | number): EclipseCalculationResult => {
  const solarPos = calculateSolarPosition(julianDate);
  const lunarPos = calculateLunarPosition(julianDate);

  // Ecliptic longitude elongation (Moon - Sun)
  const sunLambda = solarPos.lambda ?? solarPos.eclipticLongitude ?? 0;
  const moonLambda = lunarPos.lambda ?? lunarPos.eclipticLongitude ?? 0;
  const elongation = ((moonLambda - sunLambda) % 360 + 360) % 360;
  
  // Right Ascension difference for equatorial compatibility
  const raDiff = ((lunarPos.rightAscension - solarPos.rightAscension) % 360 + 360) % 360;
  const beta = lunarPos.beta; // Moon ecliptic latitude (-5.14° to +5.14°)
  const absBeta = Math.abs(beta);
  const distanceKm = lunarPos.distanceKm;
  const sunDistanceKm = solarPos.distanceKm || ASTRONOMICAL_UNIT_KM;

  // Phase value 0 (New Moon) to 1
  const phaseValue = elongation / 360;

  // Angular distance to Syzygy along ecliptic (0° = New Moon, 180° = Full Moon)
  const distToNewMoon = Math.min(elongation, 360 - elongation);
  const distToFullMoon = Math.abs(elongation - 180);

  // Angular radii and parallax
  const sSun = solarPos.sunAngularRadiusDeg ?? (SUN_ANGULAR_DIAMETER_1AU_ARCMIN / (solarPos.distanceAU || 1) / 120); // ~0.267°
  const sMoon = lunarPos.angularRadiusDeg ?? toDegrees(Math.asin(MOON_RADIUS_MEAN_KM / distanceKm)); // ~0.26° - 0.28°
  const piMoon = lunarPos.parallaxDeg ?? toDegrees(Math.asin(EARTH_RADIUS_WGS84_KM / distanceKm)); // ~0.95° - 1.02°
  const piSun = toDegrees(Math.asin(EARTH_RADIUS_WGS84_KM / sunDistanceKm)); // ~0.0024°

  // Earth umbra & penumbra radii at Moon's distance (including 1.02 atmospheric enlargement)
  const umbraRadiusDeg = (piMoon + piSun - sSun) * 1.02;
  const penumbraRadiusDeg = (piMoon + piSun + sSun) * 1.02;

  // Angular separation from center of Earth's shadow (for Lunar Eclipse)
  const dLonOpp = ((elongation - 180 + 540) % 360) - 180;
  const gammaLunar = Math.sqrt(Math.pow(dLonOpp * Math.cos(toRadians(beta)), 2) + Math.pow(beta, 2));

  // Angular separation from Sun center (for Solar Eclipse)
  const dLonConj = ((elongation + 180) % 360) - 180;
  const gammaSolar = Math.sqrt(Math.pow(dLonConj * Math.cos(toRadians(beta)), 2) + Math.pow(beta, 2));

  let type: EclipseType = "NONE";
  let category: 'SOLAR' | 'LUNAR' | 'NO_ECLIPSE' = "NO_ECLIPSE";
  let label = "No Eclipse";
  let obscuration = 0; // 0 to 100%

  // Solar Eclipse Condition (New Moon syzygy & shadow alignment)
  const isNearNewMoon = distToNewMoon <= 2.2;
  const solarMaxLimit = piMoon + sSun + sMoon; // ~1.55°

  if (isNearNewMoon && gammaSolar < solarMaxLimit) {
    category = "SOLAR";
    const isTotalityCapable = distanceKm < 378000;
    if (gammaSolar < 1.0) {
      if (isTotalityCapable) {
        type = "TOTAL_SOLAR";
        label = "Total Solar Eclipse";
        // Smooth quadratic scaling from 100% at shadow center to 95% at Earth limb boundary
        obscuration = Math.max(95, Math.min(100, Math.round(100 - (gammaSolar * gammaSolar * 5))));
      } else {
        type = "ANNULAR_SOLAR";
        label = "Annular Solar Eclipse";
        const maxAnnular = Math.min(98, Math.round(Math.pow(sMoon / sSun, 2) * 100) || 94);
        obscuration = Math.max(90, Math.min(maxAnnular, Math.round(maxAnnular - (gammaSolar * gammaSolar * 4))));
      }
    } else {
      type = "PARTIAL_SOLAR";
      label = "Partial Solar Eclipse";
      // Smooth continuous power decay from boundary (95% / 90%) down to 1% at penumbral limit
      const fraction = Math.max(0, Math.min(1, (solarMaxLimit - gammaSolar) / (solarMaxLimit - 1.0)));
      const baseEdge = isTotalityCapable ? 95 : 90;
      obscuration = Math.max(1, Math.min(baseEdge, Math.round(baseEdge * Math.pow(fraction, 1.15))));
    }
  } 
  // Lunar Eclipse Condition (Full Moon syzygy & shadow alignment)
  else if (distToFullMoon <= 2.2 && gammaLunar < (penumbraRadiusDeg + sMoon)) {
    category = "LUNAR";
    if (gammaLunar <= (umbraRadiusDeg - sMoon + 0.05)) {
      type = "TOTAL_LUNAR";
      label = "Total Lunar Eclipse (Blood Moon)";
      obscuration = 100;
    } else if (gammaLunar <= (umbraRadiusDeg + sMoon)) {
      type = "PARTIAL_LUNAR";
      label = "Partial Lunar Eclipse";
      const fraction = (umbraRadiusDeg + sMoon - gammaLunar) / (2 * sMoon);
      obscuration = Math.max(10, Math.min(99, Math.round(fraction * 100)));
    } else {
      type = "PENUMBRAL_LUNAR";
      label = "Penumbral Lunar Eclipse";
      obscuration = Math.max(5, Math.round(50 - (absBeta * 30)));
    }
  }

  // Node proximity metric (0° = exact node crossing, 5.145° = max tilt)
  const nodeProximityDeg = parseFloat(absBeta.toFixed(2));
  const alignmentPercent = Math.max(0, Math.min(100, Math.round((1 - absBeta / Number(MOON_ORBIT_INCLINATION_DEG)) * 100)));

  // Shadow Cone radiuses (scaled for visual rendering)
  const umbraRadiusKm = Math.max(0, MOON_DIAMETER_KM - (distanceKm * 0.009));
  const penumbraRadiusKm = MOON_DIAMETER_KM + (distanceKm * 0.015);

  const argumentOfLatitude = lunarPos.argumentOfLatitude !== undefined
    ? parseFloat((((lunarPos.argumentOfLatitude % 360) + 360) % 360).toFixed(4))
    : undefined;
  const isAscendingHemisphere = lunarPos.argumentOfLatitude !== undefined
    ? (lunarPos.argumentOfLatitude % 360 < 180)
    : beta >= 0;
  const nodeLongitude = lunarPos.nodeLongitude !== undefined
    ? parseFloat(lunarPos.nodeLongitude.toFixed(4))
    : undefined;
  const descendingNodeLongitude = lunarPos.descendingNodeLongitude !== undefined
    ? parseFloat(lunarPos.descendingNodeLongitude.toFixed(4))
    : undefined;

  return {
    type,
    category,
    label,
    obscuration,
    beta: parseFloat(beta.toFixed(3)),
    nodeProximityDeg,
    alignmentPercent,
    isEclipseActive: type !== "NONE",
    distanceKm: Math.round(distanceKm),
    umbraRadiusKm: Math.round(umbraRadiusKm),
    penumbraRadiusKm: Math.round(penumbraRadiusKm),
    raDiff: parseFloat(raDiff.toFixed(2)),
    elongation: parseFloat(elongation.toFixed(2)),
    phaseValue: parseFloat(phaseValue.toFixed(3)),
    nodeAngleDeg: parseFloat((((sunLambda - (lunarPos.nodeLongitude ?? 0)) % 360 + 360) % 360).toFixed(2)),
    argumentOfLatitude,
    isAscendingHemisphere,
    nodeLongitude,
    descendingNodeLongitude
  };
};

export interface EclipsePresetItem {
  date: Date;
  timeOfDay: number;
  title: string;
  type: string;
  category: 'SOLAR' | 'LUNAR';
  description: string;
}

/**
 * Preset historic and future total/annular solar and lunar eclipses.
 */
export const ECLIPSE_PRESETS: EclipsePresetItem[] = [
  {
    date: new Date(Date.UTC(2024, 3, 8)), // April 8, 2024 Total Solar Eclipse (18:17 UTC)
    timeOfDay: 18.283,
    title: "Apr 8, 2024 - Great American Eclipse",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "Total Solar Eclipse spanning North America from Mexico through Maine."
  },
  {
    date: new Date(Date.UTC(2024, 9, 2)), // Oct 2, 2024 Annular Solar Eclipse (18:45 UTC)
    timeOfDay: 18.75,
    title: "Oct 2, 2024 - Annular Solar Eclipse",
    type: "ANNULAR_SOLAR",
    category: "SOLAR",
    description: "Ring of Fire eclipse visible across South America and Easter Island."
  },
  {
    date: new Date(Date.UTC(2025, 2, 14)), // March 14, 2025 Total Lunar Eclipse (06:58 UTC)
    timeOfDay: 6.967,
    title: "Mar 14, 2025 - Total Lunar Eclipse",
    type: "TOTAL_LUNAR",
    category: "LUNAR",
    description: "Deep Blood Moon visible across North & South America, Europe, and Africa."
  },
  {
    date: new Date(Date.UTC(2026, 7, 12)), // August 12, 2026 European Total Eclipse (17:47 UTC)
    timeOfDay: 17.783,
    title: "Aug 12, 2026 - European Total Eclipse",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "First Total Solar Eclipse in mainland Europe in 27 years (Spain/Iceland)."
  },
  {
    date: new Date(Date.UTC(2027, 7, 2)), // August 2, 2027 Great North African Eclipse (10:07 UTC)
    timeOfDay: 10.117,
    title: "Aug 2, 2027 - Luxor 6-Min Totality",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "Extraordinary 6-minute 23-second Total Eclipse over Egypt."
  }
];

export interface UpcomingEclipseEvent extends EclipseCalculationResult {
  date: Date;
  timeOfDay: number;
  dayOffset: number;
  title: string;
}

/**
 * Scans forward from a start date to detect upcoming solar or lunar eclipses.
 * @param startDate - Starting calendar date
 * @param limit - Maximum number of upcoming eclipses to return
 * @returns List of upcoming eclipse events
 */
export const findUpcomingEclipses = (
  startDate: Date = julianDateToDate(J2000_JD), 
  limit: number = 4
): UpcomingEclipseEvent[] => {
  const list: UpcomingEclipseEvent[] = [];
  const startJD = getJulianDate(startDate, 12);
  
  // Scan forward up to 365 days in 1-day steps, refining to peak syzygy
  for (let dayOffset = 0; dayOffset < 365 && list.length < limit; dayOffset++) {
    const jd = startJD + dayOffset;
    const sol = calculateSolarPosition(jd);
    const lun = calculateLunarPosition(jd);
    const sunLambda = sol.lambda ?? sol.eclipticLongitude ?? 0;
    const moonLambda = lun.lambda ?? lun.eclipticLongitude ?? 0;
    const elongation = ((moonLambda - sunLambda) % 360 + 360) % 360;
    const distToNewMoon = Math.min(elongation, 360 - elongation);
    const distToFullMoon = Math.abs(elongation - 180);

    // If near syzygy (within ~1 day), solve exact peak JD
    let peakJD = jd;
    let isCandidate = false;

    if (distToNewMoon < 7 && Math.abs(lun.beta) < 1.6) {
      const dLonConj = ((elongation + 180) % 360) - 180;
      peakJD = asJulianDate(jd - (dLonConj / 12.19));
      isCandidate = true;
    } else if (distToFullMoon < 7 && Math.abs(lun.beta) < 1.6) {
      const dLonOpp = ((elongation - 180 + 540) % 360) - 180;
      peakJD = asJulianDate(jd - (dLonOpp / 12.19));
      isCandidate = true;
    }

    if (isCandidate) {
      const eclipse = calculateEclipseData(peakJD);
      if (eclipse.isEclipseActive) {
        const peakOffset = peakJD - startJD;
        const isDuplicate = list.some(item => Math.abs(item.dayOffset - peakOffset) < 10);
        if (!isDuplicate && peakOffset >= 0) {
          const eventDate = new Date(startDate.getTime() + peakOffset * 86400000);
          const peakHour = (((peakJD + 0.5) % 1) * 24 + 24) % 24;
          list.push({
            date: eventDate,
            timeOfDay: parseFloat(peakHour.toFixed(3)),
            dayOffset: Math.round(peakOffset),
            title: `${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            ...eclipse
          });
        }
      }
    }
  }
  return list;
};
