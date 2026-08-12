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

  // Ecliptic longitude difference
  const raDiff = ((lunarPos.rightAscension - solarPos.rightAscension) % 360 + 360) % 360;
  const beta = lunarPos.beta; // Moon ecliptic latitude (-5.14° to +5.14°)
  const absBeta = Math.abs(beta);
  const distanceKm = lunarPos.distanceKm;

  // Phase value 0 (New Moon) to 1
  const phaseValue = raDiff / 360;

  // Distance to nearest Syzygy (0° = New Moon, 180° = Full Moon)
  const distToNewMoon = Math.min(raDiff, 360 - raDiff);
  const distToFullMoon = Math.abs(raDiff - 180);

  const isNearNewMoon = distToNewMoon < 12; // within ~1 day of New Moon
  const isNearFullMoon = distToFullMoon < 12; // within ~1 day of Full Moon

  let type = "NONE";
  let category = "NO_ECLIPSE"; // 'SOLAR' | 'LUNAR' | 'NO_ECLIPSE'
  let label = "No Eclipse";
  let obscuration = 0; // 0 to 100%

  if (isNearNewMoon && absBeta < 1.5) {
    category = "SOLAR";
    if (absBeta < 0.35) {
      if (distanceKm < 378000) {
        type = "TOTAL_SOLAR";
        label = "Total Solar Eclipse";
        obscuration = Math.min(100, Math.round(100 - (absBeta * 15)));
      } else {
        type = "ANNULAR_SOLAR";
        label = "Annular Solar Eclipse";
        obscuration = Math.min(98, Math.round(95 - (absBeta * 15)));
      }
    } else if (absBeta < 1.1) {
      type = "PARTIAL_SOLAR";
      label = "Partial Solar Eclipse";
      obscuration = Math.max(10, Math.round(85 - (absBeta * 65)));
    } else {
      type = "PARTIAL_SOLAR";
      label = "Minor Partial Solar Alignment";
      obscuration = Math.max(2, Math.round(30 - (absBeta * 20)));
    }
  } else if (isNearFullMoon && absBeta < 1.6) {
    category = "LUNAR";
    if (absBeta < 0.45) {
      type = "TOTAL_LUNAR";
      label = "Total Lunar Eclipse (Blood Moon)";
      obscuration = 100;
    } else if (absBeta < 0.9) {
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
  
  // Scan forward up to 365 days in 1-day steps
  for (let dayOffset = 0; dayOffset < 365 && list.length < limit; dayOffset++) {
    const jd = startJD + dayOffset;
    const eclipse = calculateEclipseData(jd);
    
    if (eclipse.isEclipseActive) {
      // Check if we already added an eclipse within 5 days of this peak
      const isDuplicate = list.some(item => Math.abs(item.dayOffset - dayOffset) < 5);
      if (!isDuplicate) {
        const eventDate = new Date(startDate.getTime() + dayOffset * 86400000);
        list.push({
          date: eventDate,
          dayOffset,
          title: `${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          ...eclipse
        });
      }
    }
  }
  return list;
};
