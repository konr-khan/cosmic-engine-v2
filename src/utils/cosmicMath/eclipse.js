import { getJulianDate } from './core';
import { calculateSolarPosition } from './solar';
import { calculateLunarPosition } from './lunar';

/**
 * Solves solar and lunar eclipse alignment, shadow radiuses, and obscuration percentages for a Julian Date.
 * @param {number} julianDate - Julian Date
 * @returns {{
 *   type: string,
 *   category: 'SOLAR'|'LUNAR'|'NO_ECLIPSE',
 *   label: string,
 *   obscuration: number,
 *   beta: number,
 *   nodeProximityDeg: number,
 *   alignmentPercent: number,
 *   isEclipseActive: boolean,
 *   distanceKm: number,
 *   umbraRadiusKm: number,
 *   penumbraRadiusKm: number,
 *   raDiff: number,
 *   phaseValue: number
 * }} Eclipse status and alignment details
 */
export const calculateEclipseData = (julianDate) => {
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
  const sunDistanceKm = solarPos.distanceKm || 149597870.7;

  // Phase value 0 (New Moon) to 1
  const phaseValue = elongation / 360;

  // Angular distance to Syzygy along ecliptic (0° = New Moon, 180° = Full Moon)
  const distToNewMoon = Math.min(elongation, 360 - elongation);
  const distToFullMoon = Math.abs(elongation - 180);

  // Angular radii and parallax
  const sSun = solarPos.sunAngularRadiusDeg ?? (31.986 / (solarPos.distanceAU || 1) / 120); // ~0.267°
  const sMoon = lunarPos.angularRadiusDeg ?? (Math.asin(1737.4 / distanceKm) * (180 / Math.PI)); // ~0.26° - 0.28°
  const piMoon = lunarPos.parallaxDeg ?? (Math.asin(6378.137 / distanceKm) * (180 / Math.PI)); // ~0.95° - 1.02°
  const piSun = Math.asin(6378.137 / sunDistanceKm) * (180 / Math.PI); // ~0.0024°

  // Earth umbra & penumbra radii at Moon's distance (including 1.02 atmospheric enlargement)
  const umbraRadiusDeg = (piMoon + piSun - sSun) * 1.02;
  const penumbraRadiusDeg = (piMoon + piSun + sSun) * 1.02;

  // Angular separation from center of Earth's shadow (for Lunar Eclipse)
  const dLonOpp = ((elongation - 180 + 540) % 360) - 180;
  const gammaLunar = Math.sqrt(Math.pow(dLonOpp * Math.cos(beta * Math.PI / 180), 2) + Math.pow(beta, 2));

  // Angular separation from Sun center (for Solar Eclipse)
  const dLonConj = ((elongation + 180) % 360) - 180;
  const gammaSolar = Math.sqrt(Math.pow(dLonConj * Math.cos(beta * Math.PI / 180), 2) + Math.pow(beta, 2));

  let type = "NONE";
  let category = "NO_ECLIPSE"; // 'SOLAR' | 'LUNAR' | 'NO_ECLIPSE'
  let label = "No Eclipse";
  let obscuration = 0; // 0 to 100%

  // Solar Eclipse Condition (New Moon syzygy & shadow alignment)
  const isNearNewMoon = distToNewMoon <= 2.2;
  const solarMaxLimit = piMoon + sSun + sMoon; // ~1.55°

  if (isNearNewMoon && gammaSolar < solarMaxLimit) {
    category = "SOLAR";
    if (gammaSolar < 1.0) {
      if (distanceKm < 378000) {
        type = "TOTAL_SOLAR";
        label = "Total Solar Eclipse";
        obscuration = Math.min(100, Math.round(100 - (absBeta * 10)));
      } else {
        type = "ANNULAR_SOLAR";
        label = "Annular Solar Eclipse";
        obscuration = Math.min(98, Math.round(95 - (absBeta * 10)));
      }
    } else {
      type = "PARTIAL_SOLAR";
      label = "Partial Solar Eclipse";
      obscuration = Math.max(10, Math.round(85 - ((gammaSolar - 1.0) / (solarMaxLimit - 1.0) * 75)));
    }
  } 
  // Lunar Eclipse Condition (Full Moon syzygy & shadow alignment)
  else if (distToFullMoon <= 2.2 && gammaLunar < (penumbraRadiusDeg + sMoon)) {
    category = "LUNAR";
    if (gammaLunar <= (umbraRadiusDeg - sMoon + 0.05) && absBeta < 0.45) {
      type = "TOTAL_LUNAR";
      label = "Total Lunar Eclipse (Blood Moon)";
      obscuration = 100;
    } else if (gammaLunar <= (umbraRadiusDeg + sMoon) && absBeta < 0.9) {
      type = "PARTIAL_LUNAR";
      label = "Partial Lunar Eclipse";
      obscuration = Math.max(15, Math.round(90 - (absBeta * 70)));
    } else {
      type = "PENUMBRAL_LUNAR";
      label = "Penumbral Lunar Eclipse";
      obscuration = Math.max(5, Math.round(50 - (absBeta * 30)));
    }
  }

  // Node proximity metric (0° = exact node crossing, 5.14° = max tilt)
  const nodeProximityDeg = parseFloat(absBeta.toFixed(2));
  const alignmentPercent = Math.max(0, Math.min(100, Math.round((1 - absBeta / 5.14) * 100)));

  // Shadow Cone radiuses (scaled for visual rendering)
  const umbraRadiusKm = Math.max(0, 3474 - (distanceKm * 0.009));
  const penumbraRadiusKm = 3474 + (distanceKm * 0.015);

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
    phaseValue: parseFloat(phaseValue.toFixed(3))
  };
};

/**
 * Preset historic and future total/annular solar and lunar eclipses.
 */
export const ECLIPSE_PRESETS = [
  {
    date: new Date(2024, 3, 8, 18, 17), // April 8, 2024 Total Solar Eclipse
    title: "Apr 8, 2024 - Great American Eclipse",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "Total Solar Eclipse spanning North America from Mexico through Maine."
  },
  {
    date: new Date(2024, 9, 2, 18, 45), // Oct 2, 2024 Annular Solar Eclipse
    title: "Oct 2, 2024 - Annular Solar Eclipse",
    type: "ANNULAR_SOLAR",
    category: "SOLAR",
    description: "Ring of Fire eclipse visible across South America and Easter Island."
  },
  {
    date: new Date(2025, 2, 14, 6, 58), // March 14, 2025 Total Lunar Eclipse
    title: "Mar 14, 2025 - Total Lunar Eclipse",
    type: "TOTAL_LUNAR",
    category: "LUNAR",
    description: "Deep Blood Moon visible across North & South America, Europe, and Africa."
  },
  {
    date: new Date(2026, 7, 12, 17, 47), // August 12, 2026 Total Solar Eclipse
    title: "Aug 12, 2026 - European Total Eclipse",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "First Total Solar Eclipse in mainland Europe in 27 years (Spain/Iceland)."
  },
  {
    date: new Date(2027, 7, 2, 10, 7), // August 2, 2027 Great North African Eclipse
    title: "Aug 2, 2027 - Luxor 6-Min Totality",
    type: "TOTAL_SOLAR",
    category: "SOLAR",
    description: "Extraordinary 6-minute 23-second Total Eclipse over Egypt."
  }
];

/**
 * Scans forward from a start date to detect upcoming solar or lunar eclipses.
 * @param {Date} [startDate=new Date()] - Starting calendar date
 * @param {number} [limit=4] - Maximum number of upcoming eclipses to return
 * @returns {Array<{ date: Date, dayOffset: number, title: string, type: string, obscuration: number }>} List of upcoming eclipse events
 */
export const findUpcomingEclipses = (startDate = new Date(), limit = 4) => {
  const list = [];
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
      peakJD = jd - (dLonConj / 12.19);
      isCandidate = true;
    } else if (distToFullMoon < 7 && Math.abs(lun.beta) < 1.6) {
      const dLonOpp = ((elongation - 180 + 540) % 360) - 180;
      peakJD = jd - (dLonOpp / 12.19);
      isCandidate = true;
    }

    if (isCandidate) {
      const eclipse = calculateEclipseData(peakJD);
      if (eclipse.isEclipseActive) {
        const peakOffset = peakJD - startJD;
        const isDuplicate = list.some(item => Math.abs(item.dayOffset - peakOffset) < 10);
        if (!isDuplicate && peakOffset >= 0) {
          const eventDate = new Date(startDate.getTime() + peakOffset * 86400000);
          list.push({
            date: eventDate,
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
