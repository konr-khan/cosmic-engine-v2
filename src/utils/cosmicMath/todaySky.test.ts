/**
 * @file todaySky.test.ts
 * Unit test suite for sky dome projection, diurnal path generator,
 * and monthly lunar declination extrema solver.
 */

import { describe, it, expect } from 'vitest';
import { getJulianDate } from './core';
import { 
  projectSkyDomePoint, 
  generateDiurnalPath, 
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  getSolarTwilightStatus,
  getLunarElevationStatus,
  calculateCulminationBearing,
  calculateRiseSetAzimuth,
  calculateSolsticeCulminations,
  calculateLunarExtremaCulminations,
  azimuthToCompassOctant,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
  calculateMeridianDiurnalPoint,
  calculateMeridianDiurnalChord,
  EL_R, 
  EL_CX, 
  EL_CY 
} from './todaySky';

describe('Sky Dome Coordinate Projection (projectSkyDomePoint)', () => {
  it('projects meridian transit (H = 0) exactly onto the central meridian X = EL_CX', () => {
    // Equinox at latitude 45°N
    const pt = projectSkyDomePoint(0, 0, 45);
    expect(pt.x).toBeCloseTo(EL_CX, 4);
    expect(pt.elevation).toBeCloseTo(45, 2);
    expect(pt.y).toBeCloseTo(EL_CY - EL_R * Math.sin((45 * Math.PI) / 180), 2);
  });

  it('projects equinox sunrise and sunset exactly onto East (38, 104) and West (222, 104)', () => {
    // Equinox delta = 0 at any temperate latitude
    const sunrise = projectSkyDomePoint(-90, 0, 45);
    expect(sunrise.x).toBeCloseTo(EL_CX - EL_R, 4); // 130 - 92 = 38
    expect(sunrise.elevation).toBeCloseTo(0, 4);
    expect(sunrise.y).toBeCloseTo(EL_CY, 4); // 104

    const sunset = projectSkyDomePoint(90, 0, 45);
    expect(sunset.x).toBeCloseTo(EL_CX + EL_R, 4); // 130 + 92 = 222
    expect(sunset.elevation).toBeCloseTo(0, 4);
    expect(sunset.y).toBeCloseTo(EL_CY, 4); // 104
  });

  it('ensures body bead projection satisfies clamping invariants', () => {
    const pt = projectSkyDomePoint(180, -23.44, 45);
    // At midnight in winter, elevation is deep below horizon
    expect(pt.elevation).toBeLessThan(-20);
    expect(pt.y).toBeGreaterThan(EL_CY);
  });
});

describe('Diurnal Path Generator (generateDiurnalPath)', () => {
  it('generates an exact Equinox arc connecting East and West on the horizon', () => {
    const res = generateDiurnalPath(47.06, 0);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    expect(res.peakAlt).toBeCloseTo(90 - 47.06, 2);
    expect(res.riseHourAngle).toBeCloseTo(90, 2);

    expect(res.risePoint).not.toBeNull();
    expect(res.setPoint).not.toBeNull();
    expect(res.risePoint!.x).toBeCloseTo(EL_CX - EL_R, 1);
    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.x).toBeCloseTo(EL_CX + EL_R, 1);
    expect(res.setPoint!.y).toBe(EL_CY);

    // SVG path starts at rise and ends at set
    expect(res.pathD.startsWith('M 38.0 104.0')).toBe(true);
    expect(res.pathD.endsWith('222.0 104.0')).toBe(true);
  });

  it('generates Winter Solstice arc with narrower horizon span and lower culmination', () => {
    const res = generateDiurnalPath(47.06, -23.439);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    // Culmination at ~19.5°
    expect(res.peakAlt).toBeCloseTo(90 - 47.06 - 23.439, 1);
    expect(res.peakPoint.y).toBeGreaterThan(EL_CY - EL_R * Math.sin((40 * Math.PI) / 180));

    // Sunrise occurs south of east: risePoint.x > EL_CX - EL_R (closer to center)
    expect(res.risePoint!.x).toBeGreaterThan(EL_CX - EL_R);
    expect(res.setPoint!.x).toBeLessThan(EL_CX + EL_R);
    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.y).toBe(EL_CY);
  });

  it('generates Summer Solstice arc with high culmination and horizon contact', () => {
    const res = generateDiurnalPath(47.06, 23.439);

    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    // Culmination at ~66.38°
    expect(res.peakAlt).toBeCloseTo(90 - 47.06 + 23.439, 1);
    expect(res.riseHourAngle).toBeGreaterThan(90);

    expect(res.risePoint!.y).toBe(EL_CY);
    expect(res.setPoint!.y).toBe(EL_CY);
  });

  it('correctly detects and handles Polar Night', () => {
    // Latitude 75°N, Winter Solstice (-23.44°)
    const res = generateDiurnalPath(75, -23.439);

    expect(res.isPolarNight).toBe(true);
    expect(res.isCircumpolar).toBe(false);
    expect(res.pathD).toBe('');
    expect(res.risePoint).toBeNull();
    expect(res.setPoint).toBeNull();
    expect(res.peakAlt).toBeLessThan(0);
  });

  it('correctly detects and handles Midnight Sun / Circumpolar motion', () => {
    // Latitude 75°N, Summer Solstice (+23.44°)
    const res = generateDiurnalPath(75, 23.439);

    expect(res.isCircumpolar).toBe(true);
    expect(res.isPolarNight).toBe(false);
    expect(res.pathD.length).toBeGreaterThan(0);
    // Culmination at 90 - 75 + 23.44 = 38.44°
    expect(res.peakAlt).toBeCloseTo(38.44, 1);
  });

  it('handles tropical latitudes with overhead zenith culmination (90°)', () => {
    // Latitude 10°N, declination 10°
    const res = generateDiurnalPath(10, 10);
    expect(res.peakAlt).toBeCloseTo(90, 4);
    expect(res.peakPoint.y).toBeCloseTo(EL_CY - EL_R, 4); // Zenith = 12
  });
});

describe('Monthly Lunar Declination Bounds (calculateMonthlyLunarDeclinationBounds)', () => {
  it('computes realistic monthly min and max declination bounds over a 30-day window', () => {
    const testDate = new Date('2026-09-08T12:00:00Z');
    const bounds = calculateMonthlyLunarDeclinationBounds(testDate);

    expect(bounds.minDec).toBeLessThan(0);
    expect(bounds.maxDec).toBeGreaterThan(0);
    // Range between max and min should span a full tropical month excursion (> 35°)
    const range = bounds.maxDec - bounds.minDec;
    expect(range).toBeGreaterThan(35);
    expect(range).toBeLessThan(60);

    // Bounds should not exceed physical Major Standstill limits (±29°)
    expect(bounds.maxDec).toBeLessThanOrEqual(29);
    expect(bounds.minDec).toBeGreaterThanOrEqual(-29);
  });
});

describe('Solar & Lunar Twilight Status Helpers', () => {
  it('correctly maps solar elevation to the 5 twilight phases', () => {
    // Daylight
    const day = getSolarTwilightStatus(25);
    expect(day.phase).toBe('daylight');
    expect(day.label).toBe('Daylight');

    // Civil Twilight (0° to -6°)
    const civil = getSolarTwilightStatus(-3.5);
    expect(civil.phase).toBe('civil_twilight');
    expect(civil.label).toBe('Civil Twilight');
    expect(civil.badgeClass).toBe('text-amber-300');

    // Nautical Twilight (-6° to -12°)
    const naut = getSolarTwilightStatus(-8.2);
    expect(naut.phase).toBe('nautical_twilight');
    expect(naut.label).toBe('Nautical Twilight');
    expect(naut.badgeClass).toBe('text-slate-300');

    // Astronomical Twilight (-12° to -18°)
    const astro = getSolarTwilightStatus(-14.7);
    expect(astro.phase).toBe('astronomical_twilight');
    expect(astro.label).toBe('Astronomical Twilight');
    expect(astro.badgeClass).toBe('text-slate-400');

    // Astronomical Night (<-18°)
    const night = getSolarTwilightStatus(-30);
    expect(night.phase).toBe('night');
    expect(night.label).toBe('Astronomical Night');
    expect(night.badgeClass).toBe('text-slate-500');
  });

  it('correctly maps lunar elevation status', () => {
    expect(getLunarElevationStatus(15).label).toBe('Above Horizon');
    expect(getLunarElevationStatus(-2).label).toBe('Near Horizon');
    expect(getLunarElevationStatus(-25).label).toBe('Below Horizon');
  });

  it('generates twilight sub-horizon path segments for temperate day', () => {
    const res = generateDiurnalPath(47.06, 0);
    expect(res.twilightD).toBeDefined();
    expect(res.twilightD!.length).toBeGreaterThan(0);
    expect(res.twilightD).toContain('M');
    expect(res.twilightD).toContain('L');
  });
});

describe('Sky Dome Lunar Nodes (calculateSkyDomeLunarNodes)', () => {
  it('correctly computes Ascending and Descending nodes 180° apart on the Ecliptic', () => {
    // J2000 epoch (JD 2451545.0) at Solar Noon
    const nodes = calculateSkyDomeLunarNodes(47.06, 2451545.0, 12, 12);

    expect(nodes.ascendingNode).toBeDefined();
    expect(nodes.descendingNode).toBeDefined();

    // Ecliptic longitude separation should be 180°
    const diff = Math.abs(nodes.descendingNode.eclipticLongitude - nodes.ascendingNode.eclipticLongitude);
    expect(diff).toBeCloseTo(180, 1);

    // Declination symmetry: sin(dec_asc) = -sin(dec_desc)
    expect(nodes.ascendingNode.declination).toBeCloseTo(-nodes.descendingNode.declination, 1);

    // Nodes must be projected within valid SVG canvas ranges
    expect(Number.isFinite(nodes.ascendingNode.x)).toBe(true);
    expect(Number.isFinite(nodes.ascendingNode.y)).toBe(true);
    expect(Number.isFinite(nodes.ascendingNode.elevation)).toBe(true);
    expect(Number.isFinite(nodes.descendingNode.x)).toBe(true);
    expect(Number.isFinite(nodes.descendingNode.y)).toBe(true);
    expect(Number.isFinite(nodes.descendingNode.elevation)).toBe(true);

    // Moon ecliptic latitude beta check
    expect(typeof nodes.moonBeta).toBe('number');
    expect(typeof nodes.isMoonAscending).toBe('boolean');
    expect(nodes.isMoonAscending).toBe(nodes.moonBeta >= 0);

    // Orbital progress and upcoming / previous node properties
    expect(nodes.orbitalProgressPercent).toBeGreaterThanOrEqual(0);
    expect(nodes.orbitalProgressPercent).toBeLessThanOrEqual(100);
    expect(nodes.argumentOfLatitude).toBeGreaterThanOrEqual(0);
    expect(nodes.argumentOfLatitude).toBeLessThan(360);
    expect(nodes.daysToNextNode).toBeGreaterThanOrEqual(0);
    expect(nodes.daysToNextNode).toBeLessThanOrEqual(14); // half draconic cycle max ~13.6d
    expect(nodes.daysSincePrevNode).toBeGreaterThanOrEqual(0);
    expect(nodes.daysSincePrevNode).toBeLessThanOrEqual(14);
    expect(['ascending', 'descending']).toContain(nodes.upcomingNodeType);
    expect(['ascending', 'descending']).toContain(nodes.prevNodeType);
    expect(nodes.upcomingNodeType).not.toBe(nodes.prevNodeType);
    expect(nodes.upcomingNode).toBeDefined();
    expect(typeof nodes.isNearNode).toBe('boolean');
    expect(typeof nodes.quadrantLabel).toBe('string');
    expect(nodes.quadrantLabel.length).toBeGreaterThan(0);

    // Centered ±15-day timeline nodes & segments
    expect(nodes.timelineNodes.length).toBeGreaterThanOrEqual(2);
    for (const node of nodes.timelineNodes) {
      expect(node.daysOffset).toBeGreaterThanOrEqual(-15);
      expect(node.daysOffset).toBeLessThanOrEqual(15);
      expect(['☊', '☋']).toContain(node.symbol);
      expect(['#38bdf8', '#f43f5e']).toContain(node.color);
    }

    expect(nodes.timelineSegments.length).toBeGreaterThanOrEqual(2);
    expect(nodes.timelineSegments[0].startDays).toBe(-15);
    expect(nodes.timelineSegments[nodes.timelineSegments.length - 1].endDays).toBe(15);
    for (const seg of nodes.timelineSegments) {
      expect(seg.startDays).toBeLessThan(seg.endDays);
      expect(['#38bdf8', '#f43f5e']).toContain(seg.color);
    }
  });

  it('correctly tracks descending node crossing and suppresses distant ascending node on 2026-09-10/11', () => {
    // 9/09/2026 18:05 UTC: Descending node crossing
    const jdCrossing = getJulianDate(new Date('2026-09-09T00:00:00Z'), 18 + 5 / 60);
    const nodesCrossing = calculateSkyDomeLunarNodes(47.06, jdCrossing, 18 + 5 / 60);
    expect(nodesCrossing.nearestNodeType).toBe('descending');
    expect(nodesCrossing.nearestNodeDistDays).toBeLessThanOrEqual(0.3);
    expect(nodesCrossing.isNearNode).toBe(true);

    // 9/10/2026 02:08 UTC: ~8 hours after crossing
    const jdAfter = getJulianDate(new Date('2026-09-10T00:00:00Z'), 2 + 8 / 60);
    const nodesAfter = calculateSkyDomeLunarNodes(47.06, jdAfter, 2 + 8 / 60);
    // Nearest node MUST be descending (passed ~8h ago), NOT upcoming ascending (13d away)
    expect(nodesAfter.nearestNodeType).toBe('descending');
    expect(nodesAfter.nearestNodeDistDays).toBeLessThanOrEqual(0.5);
    expect(nodesAfter.isNearNode).toBe(true);
    expect(nodesAfter.upcomingNodeType).toBe('ascending');
    expect(nodesAfter.daysToNextNode).toBeGreaterThan(12);

    // 9/11/2026 02:00 UTC: ~32 hours after crossing (> 1.0 day)
    const jdDistant = getJulianDate(new Date('2026-09-11T00:00:00Z'), 2);
    const nodesDistant = calculateSkyDomeLunarNodes(47.06, jdDistant, 2);
    // isNearNode MUST be false because nearest node is > 1.0 day away
    expect(nodesDistant.nearestNodeDistDays).toBeGreaterThan(1.0);
    expect(nodesDistant.isNearNode).toBe(false);
  });

  it('accurately tracks the September 22-24, 2026 True Ascending Node Crossing (beta = 0)', () => {
    // 9/22/2026 23:17 UTC: ~29 hours before true crossing
    const jd22 = getJulianDate(new Date('2026-09-22T00:00:00Z'), 23 + 17 / 60);
    const nodes22 = calculateSkyDomeLunarNodes(47.06, jd22, 23 + 17 / 60);
    expect(nodes22.upcomingNodeType).toBe('ascending');
    expect(nodes22.isMoonAscending).toBe(false);
    expect(nodes22.daysToNextNode).toBeCloseTo(1.2, 1);
    expect(nodes22.isNearNode).toBe(false);

    // 9/23/2026 15:17 UTC: Mean argument F reaches 0°, but true beta is still -0.631°
    const jd23 = getJulianDate(new Date('2026-09-23T00:00:00Z'), 15 + 17 / 60);
    const nodes23 = calculateSkyDomeLunarNodes(47.06, jd23, 15 + 17 / 60);
    // True crossing is still upcoming in ~13.3 hours (0.6d)
    expect(nodes23.upcomingNodeType).toBe('ascending');
    expect(nodes23.daysToNextNode).toBeCloseTo(0.6, 1);
    expect(nodes23.isMoonAscending).toBe(false); // Arc is still Rose Red
    expect(nodes23.moonBeta).toBeLessThan(-0.6);
    expect(nodes23.isNearNode).toBe(true);

    // 9/24/2026 04:34 UTC: True node crossing where beta = 0.000°
    const jd24Crossing = getJulianDate(new Date('2026-09-24T00:00:00Z'), 4 + 34 / 60);
    const nodes24Crossing = calculateSkyDomeLunarNodes(47.06, jd24Crossing, 4 + 34 / 60);
    expect(nodes24Crossing.nearestNodeType).toBe('ascending');
    expect(nodes24Crossing.nearestNodeDistDays).toBeLessThanOrEqual(0.05);
    expect(nodes24Crossing.isNearNode).toBe(true);
    expect(nodes24Crossing.isMoonAscending).toBe(true); // Arc turns Sky Blue

    // 9/24/2026 06:00 UTC: Past the node
    const jd24Past = getJulianDate(new Date('2026-09-24T00:00:00Z'), 6);
    const nodes24Past = calculateSkyDomeLunarNodes(47.06, jd24Past, 6);
    expect(nodes24Past.prevNodeType).toBe('ascending');
    expect(nodes24Past.daysSincePrevNode).toBeLessThanOrEqual(0.1);
    expect(nodes24Past.isMoonAscending).toBe(true);
  });
});

describe('Dynamic Culmination Bearing & Observer Perspective (calculateCulminationBearing)', () => {
  it('identifies South culmination for Northern temperate observers (London 51.5°N, dec = 23.44°)', () => {
    const bearing = calculateCulminationBearing(51.5, 23.439);
    expect(bearing.direction).toBe('South');
    expect(bearing.meridianLabel).toBe('S');
    expect(bearing.altitude).toBeCloseTo(90 - (51.5 - 23.439), 2);
    expect(bearing.shortTag).toBe('S');
    expect(bearing.sightingSummary).toContain('Looking South');
  });

  it('identifies North culmination for Southern temperate observers (Sydney -33.86°S, dec = -23.44°)', () => {
    // In Sydney (-33.86°), winter sun at dec +23.44° or summer sun at dec -23.44°
    // For dec = -23.44°, delta = -23.44 - (-33.86) = +10.42° > 0 => North!
    const bearing = calculateCulminationBearing(-33.86, -23.439);
    expect(bearing.direction).toBe('North');
    expect(bearing.meridianLabel).toBe('N');
    expect(bearing.altitude).toBeCloseTo(90 - 10.42, 1);
    expect(bearing.shortTag).toBe('N');
    expect(bearing.sightingSummary).toContain('Looking North');
  });

  it('correctly flips between North and South in the Tropics (Honolulu 21.3°N)', () => {
    // June Solstice (dec = +23.44° > 21.3° => North culmination!)
    const june = calculateCulminationBearing(21.3, 23.439);
    expect(june.direction).toBe('North');
    expect(june.meridianLabel).toBe('N');
    expect(june.altitude).toBeCloseTo(87.86, 1);
    expect(june.shortTag).toBe('N');
    expect(june.sightingSummary).toContain('Looking North');

    // December Solstice (dec = -23.44° < 21.3° => South culmination!)
    const dec = calculateCulminationBearing(21.3, -23.439);
    expect(dec.direction).toBe('South');
    expect(dec.meridianLabel).toBe('S');
    expect(dec.altitude).toBeCloseTo(90 - (21.3 - (-23.439)), 1); // 45.26°
    expect(dec.shortTag).toBe('S');
    expect(dec.sightingSummary).toContain('Looking South');
  });

  it('identifies Zenith transit (Lahaina Noon) when body declination matches latitude within 0.25°', () => {
    const zenith = calculateCulminationBearing(21.3, 21.35);
    expect(zenith.direction).toBe('Zenith');
    expect(zenith.meridianLabel).toBe('Z');
    expect(zenith.altitude).toBe(90.0);
    expect(zenith.shortTag).toBe('ZENITH');
    expect(zenith.sightingSummary).toContain('Overhead Zenith');
  });

  it('captures lunar super-tropical declination flips for sub-tropical observers (Miami 25.8°N)', () => {
    // Major standstill northern lunar limit: dec = +28.58° > 25.8° => North culmination!
    const moonNorth = calculateCulminationBearing(25.8, 28.58);
    expect(moonNorth.direction).toBe('North');
    expect(moonNorth.meridianLabel).toBe('N');
    expect(moonNorth.altitude).toBeCloseTo(87.22, 1);

    // Major standstill southern lunar limit: dec = -28.58° < 25.8° => South culmination!
    const moonSouth = calculateCulminationBearing(25.8, -28.58);
    expect(moonSouth.direction).toBe('South');
    expect(moonSouth.meridianLabel).toBe('S');
    expect(moonSouth.altitude).toBeCloseTo(90 - (25.8 + 28.58), 1); // 35.62°
  });
});

describe('Rise and Set Horizon Azimuths (calculateRiseSetAzimuth)', () => {
  it('computes exact Due East (090°) rise and Due West (270°) set at Equinox (dec = 0°)', () => {
    const res = calculateRiseSetAzimuth(45, 0);
    expect(res.isCircumpolar).toBe(false);
    expect(res.isPolarNight).toBe(false);
    expect(res.riseAzimuth).toBe(90.0);
    expect(res.setAzimuth).toBe(270.0);
    expect(res.riseOctant).toBe('E');
    expect(res.setOctant).toBe('W');
    expect(res.riseFormatted).toBe('090° E');
    expect(res.setFormatted).toBe('270° W');
  });

  it('computes Northeast rise (Az < 90°) and Northwest set (Az > 270°) during Northern Summer', () => {
    const res = calculateRiseSetAzimuth(51.5, 23.439);
    expect(res.riseAzimuth).toBeLessThan(90);
    expect(res.setAzimuth).toBeGreaterThan(270);
    expect(res.riseOctant).toMatch(/NE|ENE/);
    expect(res.setOctant).toMatch(/NW|WNW/);
  });

  it('computes Southeast rise (Az > 90°) and Southwest set (Az < 270°) during Northern Winter', () => {
    const res = calculateRiseSetAzimuth(51.5, -23.439);
    expect(res.riseAzimuth).toBeGreaterThan(90);
    expect(res.setAzimuth).toBeLessThan(270);
    expect(res.riseOctant).toMatch(/SE|ESE/);
    expect(res.setOctant).toMatch(/SW|WSW/);
  });

  it('guards against polar night and midnight sun conditions', () => {
    // Polar night: latitude 75°N, dec = -23.44°
    const polarNight = calculateRiseSetAzimuth(75, -23.439);
    expect(polarNight.isPolarNight).toBe(true);
    expect(polarNight.riseAzimuth).toBeNull();
    expect(polarNight.riseFormatted).toBe('--');

    // Midnight sun: latitude 75°N, dec = +23.44°
    const midnightSun = calculateRiseSetAzimuth(75, 23.439);
    expect(midnightSun.isCircumpolar).toBe(true);
    expect(midnightSun.riseAzimuth).toBeNull();
    expect(midnightSun.riseFormatted).toBe('--');
  });
});

describe('Solstice and Lunar Extrema Culminations', () => {
  it('computes Solstice culminations with physical sky directions in the tropics', () => {
    // Honolulu (21.3°N)
    const solstices = calculateSolsticeCulminations(21.3);
    // Summer (June) is in the North!
    expect(solstices.summer.direction).toBe('North');
    expect(solstices.summer.meridianLabel).toBe('N');
    expect(solstices.summer.altitude).toBeCloseTo(87.86, 1);
    // Winter (December) is in the South!
    expect(solstices.winter.direction).toBe('South');
    expect(solstices.winter.meridianLabel).toBe('S');
    expect(solstices.winter.altitude).toBeCloseTo(45.26, 1);
  });

  it('computes Lunar extrema culminations spanning across zenith', () => {
    // Taipei (25.0°N) during standstill
    const extrema = calculateLunarExtremaCulminations(25.0, 28.5, -28.5);
    expect(extrema.maxBound.direction).toBe('North');
    expect(extrema.maxBound.meridianLabel).toBe('N');
    expect(extrema.minBound.direction).toBe('South');
    expect(extrema.minBound.meridianLabel).toBe('S');
  });

  it('converts decimal azimuth to 16-point compass octant correctly', () => {
    expect(azimuthToCompassOctant(0)).toBe('N');
    expect(azimuthToCompassOctant(45)).toBe('NE');
    expect(azimuthToCompassOctant(90)).toBe('E');
    expect(azimuthToCompassOctant(135)).toBe('SE');
    expect(azimuthToCompassOctant(180)).toBe('S');
    expect(azimuthToCompassOctant(225)).toBe('SW');
    expect(azimuthToCompassOctant(270)).toBe('W');
    expect(azimuthToCompassOctant(315)).toBe('NW');
    expect(azimuthToCompassOctant(67.5)).toBe('ENE');
    expect(azimuthToCompassOctant(292.5)).toBe('WNW');
  });
});

describe('Meridian Profile Coordinate Projections and Swaths', () => {
  describe('calculateMeridianPoint', () => {
    it('projects South horizon (0° S) exactly to left baseline (38, 104) at theta = 180°', () => {
      const pt = calculateMeridianPoint(0, 'South');
      expect(pt.thetaDeg).toBe(180);
      expect(pt.altitudeDeg).toBe(0);
      expect(pt.bearing).toBe('South');
      expect(pt.x).toBeCloseTo(EL_CX - EL_R, 2); // 130 - 92 = 38
      expect(pt.y).toBeCloseTo(EL_CY, 2); // 104
    });

    it('projects North horizon (0° N) exactly to right baseline (222, 104) at theta = 0°', () => {
      const pt = calculateMeridianPoint(0, 'North');
      expect(pt.thetaDeg).toBe(0);
      expect(pt.altitudeDeg).toBe(0);
      expect(pt.bearing).toBe('North');
      expect(pt.x).toBeCloseTo(EL_CX + EL_R, 2); // 130 + 92 = 222
      expect(pt.y).toBeCloseTo(EL_CY, 2); // 104
    });

    it('projects Zenith (90° Z) exactly to upper apex (130, 12) at theta = 90°', () => {
      const pt = calculateMeridianPoint(90, 'Zenith');
      expect(pt.thetaDeg).toBe(90);
      expect(pt.altitudeDeg).toBe(90);
      expect(pt.bearing).toBe('Zenith');
      expect(pt.x).toBeCloseTo(EL_CX, 2); // 130
      expect(pt.y).toBeCloseTo(EL_CY - EL_R, 2); // 104 - 92 = 12
    });

    it('projects South culmination (45° S) with theta = 135° in upper-left quadrant', () => {
      const pt = calculateMeridianPoint(45, 'South');
      expect(pt.thetaDeg).toBe(135);
      expect(pt.altitudeDeg).toBe(45);
      expect(pt.x).toBeLessThan(EL_CX);
      expect(pt.x).toBeCloseTo(130 + 92 * Math.cos((135 * Math.PI) / 180), 2);
      expect(pt.y).toBeLessThan(EL_CY);
      expect(pt.y).toBeCloseTo(104 - 92 * Math.sin((135 * Math.PI) / 180), 2);
    });

    it('projects North culmination (45° N) with theta = 45° in upper-right quadrant', () => {
      const pt = calculateMeridianPoint(45, 'North');
      expect(pt.thetaDeg).toBe(45);
      expect(pt.altitudeDeg).toBe(45);
      expect(pt.x).toBeGreaterThan(EL_CX);
      expect(pt.x).toBeCloseTo(130 + 92 * Math.cos((45 * Math.PI) / 180), 2);
      expect(pt.y).toBeLessThan(EL_CY);
      expect(pt.y).toBeCloseTo(104 - 92 * Math.sin((45 * Math.PI) / 180), 2);
    });

    it('clamps negative (sub-horizon) altitudes to 0° baseline', () => {
      const pt = calculateMeridianPoint(-15, 'South');
      expect(pt.altitudeDeg).toBe(0);
      expect(pt.thetaDeg).toBe(180);
      expect(pt.x).toBeCloseTo(38, 2);
      expect(pt.y).toBeCloseTo(104, 2);
    });

    it('clamps excess altitudes > 90° to 90° zenith', () => {
      const pt = calculateMeridianPoint(95, 'North');
      expect(pt.altitudeDeg).toBe(90);
      expect(pt.thetaDeg).toBe(90);
      expect(pt.x).toBeCloseTo(130, 2);
      expect(pt.y).toBeCloseTo(12, 2);
    });
  });

  describe('generateMeridianSwathD', () => {
    it('generates a valid SVG arc path string spanning between two angles', () => {
      const pathD = generateMeridianSwathD(114.16, 161.04);
      expect(pathD.startsWith('M ')).toBe(true);
      expect(pathD).toContain('A 92 92 0 0 0');
      expect(pathD).not.toContain('NaN');
    });

    it('generates cross-zenith arc connecting North and South hemispheres in the tropics', () => {
      // Honolulu: Summer Solstice 87.9°N (theta = 87.9°) to Winter Solstice 45.3°S (theta = 134.7°)
      const pathD = generateMeridianSwathD(87.9, 134.7);
      expect(pathD.startsWith('M ')).toBe(true);
      expect(pathD).toContain('A 92 92 0 0 0');

      // The arc must sweep counter-clockwise through the apex
      const matches = pathD.match(/M ([\d.]+) ([\d.]+) A 92 92 0 0 0 ([\d.]+) ([\d.]+)/);
      expect(matches).not.toBeNull();
      const [, x1, y1, x2, y2] = matches!;
      // x1 at radMin (87.9° - North of apex, slightly right)
      expect(parseFloat(x1)).toBeGreaterThan(130);
      // x2 at radMax (134.7° - South of apex, left)
      expect(parseFloat(x2)).toBeLessThan(130);
    });

    it('is order-independent for start and end theta angles', () => {
      const pathA = generateMeridianSwathD(60, 120);
      const pathB = generateMeridianSwathD(120, 60);
      expect(pathA).toBe(pathB);
    });

    it('returns empty string for degenerate zero-delta angles', () => {
      expect(generateMeridianSwathD(90, 90)).toBe('');
      expect(generateMeridianSwathD(45.001, 45.005)).toBe('');
    });
  });

  describe('calculateMeridianRadialTick', () => {
    it('calculates vertical radial tick at Zenith (90°)', () => {
      const tick = calculateMeridianRadialTick(90, 88, 96);
      expect(tick.x1).toBeCloseTo(EL_CX, 1);
      expect(tick.x2).toBeCloseTo(EL_CX, 1);
      // R_inner = 88 => Y = 104 - 88 = 16
      expect(tick.y1).toBeCloseTo(16, 1);
      // R_outer = 96 => Y = 104 - 96 = 8
      expect(tick.y2).toBeCloseTo(8, 1);
    });

    it('calculates horizontal radial tick at South horizon (180°)', () => {
      const tick = calculateMeridianRadialTick(180, 88, 96);
      expect(tick.y1).toBeCloseTo(EL_CY, 1);
      expect(tick.y2).toBeCloseTo(EL_CY, 1);
      // R_inner = 88 => X = 130 - 88 = 42
      expect(tick.x1).toBeCloseTo(42, 1);
      // R_outer = 96 => X = 130 - 96 = 34
      expect(tick.x2).toBeCloseTo(34, 1);
    });

    it('calculates horizontal radial tick at North horizon (0°)', () => {
      const tick = calculateMeridianRadialTick(0, 88, 96);
      expect(tick.y1).toBeCloseTo(EL_CY, 1);
      expect(tick.y2).toBeCloseTo(EL_CY, 1);
      // R_inner = 88 => X = 130 + 88 = 218
      expect(tick.x1).toBeCloseTo(218, 1);
      // R_outer = 96 => X = 130 + 96 = 226
      expect(tick.x2).toBeCloseTo(226, 1);
    });
  });

  describe('Meridian Diurnal Trajectory Projection (calculateMeridianDiurnalPoint)', () => {
    it('projects noon upper culmination (H = 0) to expected altitude and bearing', () => {
      // London (51.5°N), Summer Solstice (23.44°) -> Peak altitude = 90 - (51.5 - 23.44) = 61.94° South
      const pt = calculateMeridianDiurnalPoint(51.5, 23.44, 0);
      expect(pt.isAboveHorizon).toBe(true);
      expect(pt.isSubHorizon).toBe(false);
      expect(pt.altitude).toBeCloseTo(61.94, 1);
      // South of zenith -> X < EL_CX
      expect(pt.x).toBeLessThan(EL_CX);
      // Above horizon -> Y < EL_CY
      expect(pt.y).toBeLessThan(EL_CY);
      // Lies on upper semicircle R = 92
      const dist = Math.hypot(pt.x - EL_CX, pt.y - EL_CY);
      expect(dist).toBeCloseTo(EL_R, 1);
    });

    it('projects overhead Zenith culmination (Lahaina transit, lat = dec = 20.0°) at X = EL_CX, Y = EL_CY - EL_R', () => {
      const pt = calculateMeridianDiurnalPoint(20.0, 20.0, 0);
      expect(pt.altitude).toBeCloseTo(90, 1);
      expect(pt.x).toBeCloseTo(EL_CX, 1);
      expect(pt.y).toBeCloseTo(EL_CY - EL_R, 1);
    });

    it('projects setting point onto the horizon line (Y = EL_CY) at true setting azimuth offset', () => {
      // London (51.5°N), Summer Solstice (23.44°).
      // cos(H_set) = -tan(51.5)*tan(23.44) = -0.545 => H_set = 123.03°
      const H_set = (Math.acos(-Math.tan(51.5 * Math.PI / 180) * Math.tan(23.44 * Math.PI / 180)) * 180) / Math.PI;
      const pt = calculateMeridianDiurnalPoint(51.5, 23.44, H_set);
      // Exactly on the horizon baseline Y = 104
      expect(pt.altitude).toBeCloseTo(0, 1);
      expect(pt.y).toBeCloseTo(EL_CY, 1);
      // Sets in the Northwest -> X > EL_CX, NOT collapsed to observer center (130)
      expect(pt.x).toBeGreaterThan(EL_CX + 50);
    });

    it('continues smoothly below horizon into twilight strata (Y > EL_CY) without diving to center', () => {
      // 1 hour after sunset (H = H_set + 15°)
      const H_set = (Math.acos(-Math.tan(51.5 * Math.PI / 180) * Math.tan(23.44 * Math.PI / 180)) * 180) / Math.PI;
      const ptTwilight = calculateMeridianDiurnalPoint(51.5, 23.44, H_set + 15);
      expect(ptTwilight.isAboveHorizon).toBe(false);
      expect(ptTwilight.isSubHorizon).toBe(true);
      expect(ptTwilight.altitude).toBeLessThan(0);
      // Deep below horizon baseline Y = 104
      expect(ptTwilight.y).toBeGreaterThan(EL_CY);
      // Smooth continuation along X, still in Northwest quadrant
      expect(ptTwilight.x).toBeGreaterThan(EL_CX);
    });

    it('clamps deep nocturnal depth to astronomical twilight boundary and parks gracefully', () => {
      // Midnight lower culmination (H = 180°) for Sun with default -18° threshold
      const ptMidnight = calculateMeridianDiurnalPoint(51.5, -23.44, 180);
      expect(ptMidnight.isSubHorizon).toBe(true);
      expect(ptMidnight.isParked).toBe(true);
      // Clamped to astronomical twilight gate ~132.4
      expect(ptMidnight.y).toBeLessThanOrEqual(133);
      expect(ptMidnight.y).toBeGreaterThan(125);
    });

    it('parks Moon at horizon baseline (Y = 104) when below horizon (threshold = 0°)', () => {
      // Moon with minElevationDeg = 0 below horizon
      const ptMoonDown = calculateMeridianDiurnalPoint(47.06, 10.0, 180, 0);
      expect(ptMoonDown.isSubHorizon).toBe(true);
      expect(ptMoonDown.isParked).toBe(true);
      expect(ptMoonDown.y).toBe(EL_CY);
    });
  });

  describe('Meridian Diurnal Chord Generator (calculateMeridianDiurnalChord)', () => {
    it('generates diurnal chord touching the Meridian Arc (R = 92) at upper culmination peak', () => {
      // Equinox at 47.06°N: Peak altitude = 90 - 47.06 = 42.94°
      const chord = calculateMeridianDiurnalChord(47.06, 0.0, -18);
      // Peak point distance from center must equal exactly EL_R = 92
      const distFromCenter = Math.hypot(chord.peakPoint.x - EL_CX, chord.peakPoint.y - EL_CY);
      expect(distFromCenter).toBeCloseTo(EL_R, 1);
      // Culmination is South of zenith (X < 130)
      expect(chord.peakPoint.x).toBeLessThan(EL_CX);
      // Above horizon (Y < 104)
      expect(chord.peakPoint.y).toBeLessThan(EL_CY);
    });

    it('crosses horizon line (Y = 104) and maintains collinear slope cot(latitude)', () => {
      const chord = calculateMeridianDiurnalChord(47.06, 0.0, -18);
      expect(chord.horizonPoint).not.toBeNull();
      expect(chord.horizonPoint!.y).toBe(EL_CY);
      // At Equinox, rise/set is due East/West => in N-S projection, X = EL_CX = 130
      expect(chord.horizonPoint!.x).toBeCloseTo(EL_CX, 1);

      // Verify collinear slope cot(phi) = 1 / tan(47.06°) ~ 0.9307
      const slopeDay = (EL_CY - chord.peakPoint.y) / (EL_CX - chord.peakPoint.x);
      const cotPhi = 1 / Math.tan(47.06 * Math.PI / 180);
      expect(slopeDay).toBeCloseTo(cotPhi, 2);

      // Twilight extension slope
      const slopeTwilight = (chord.anchorPoint.y - EL_CY) / (chord.anchorPoint.x - EL_CX);
      expect(slopeTwilight).toBeCloseTo(cotPhi, 2);
    });

    it('generates daylight path and twilight path for solar threshold (-18°)', () => {
      const sunChord = calculateMeridianDiurnalChord(47.06, 15.0, -18);
      expect(sunChord.daylightD).toContain('M ');
      expect(sunChord.daylightD).toContain('L ');
      expect(sunChord.twilightD).toContain('M ');
      expect(sunChord.twilightD).toContain('L ');
      expect(sunChord.anchorPoint.y).toBeGreaterThan(EL_CY);
    });

    it('terminates directly at horizon baseline for lunar threshold (0°)', () => {
      const moonChord = calculateMeridianDiurnalChord(47.06, 15.0, 0);
      expect(moonChord.daylightD).toContain('M ');
      expect(moonChord.daylightD).toContain('L ');
      // Moon has no twilight extension
      expect(moonChord.twilightD).toBe('');
      // Anchor point is coincident with horizon point
      expect(moonChord.anchorPoint.y).toBe(EL_CY);
      expect(moonChord.anchorPoint.x).toBeCloseTo(moonChord.horizonPoint!.x, 2);
    });

    it('handles circumpolar midnight sun without horizon crossing', () => {
      // Tromsø (69.6°N) at Summer Solstice (23.44°): 69.6 + 23.44 = 93.04° > 90°
      const polarChord = calculateMeridianDiurnalChord(69.6, 23.44, -18);
      expect(polarChord.isCircumpolar).toBe(true);
      expect(polarChord.horizonPoint).toBeNull();
      expect(polarChord.daylightD).toContain('M ');
      expect(polarChord.twilightD).toBe('');
    });
  });
});
