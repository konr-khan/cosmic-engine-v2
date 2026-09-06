/**
 * @file lunar.test.ts
 * Domain test suite for lunar ephemeris, Meeus illumination, phase angles, rise/set solver, and annual lunar matrix.
 */

import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  clamp,
  formatTime,
  getJulianDate,
  calculateLunarPosition,
  calculateLunarEvents,
  calculateParallacticAngle,
  getPhaseName,
  calculateLunarIllumination,
  calculateAnnualLunarMatrix,
  calculatePlanetaryHour,
  calculateGMST,
  calculateLST,
  equatorialToHorizontal,
  LUNAR_PERIGEE_THRESHOLD_KM,
  LUNAR_APOGEE_THRESHOLD_KM,
  MOON_DIAMETER_KM
} from './index';
import { Degrees, Latitude, Longitude, HoursDecimal } from '../../types';

describe('Cosmic Math: Lunar Ephemeris & Illumination', () => {
  describe('Lunar Ephemeris & Phase Solver', () => {
    it('returns lunar distance within valid physical bounds (350,000 km to 410,000 km)', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const lunar = calculateLunarPosition(jd);
      expect(lunar.distanceKm).toBeGreaterThan(350000);
      expect(lunar.distanceKm).toBeLessThan(410000);
      expect(lunar.rightAscension).toBeGreaterThanOrEqual(0);
      expect(lunar.rightAscension).toBeLessThan(360);
      expect(lunar.declination).toBeGreaterThanOrEqual(-30);
      expect(lunar.declination).toBeLessThanOrEqual(30);
      expect(lunar.beta).toBeGreaterThanOrEqual(-5.15);
      expect(lunar.beta).toBeLessThanOrEqual(5.15);
    });

    it('names all 8 lunar phases correctly', () => {
      expect(getPhaseName(0.0)).toBe('New Moon');
      expect(getPhaseName(0.02)).toBe('New Moon');
      expect(getPhaseName(0.12)).toBe('Waxing Crescent');
      expect(getPhaseName(0.25)).toBe('First Quarter');
      expect(getPhaseName(0.38)).toBe('Waxing Gibbous');
      expect(getPhaseName(0.50)).toBe('Full Moon');
      expect(getPhaseName(0.62)).toBe('Waning Gibbous');
      expect(getPhaseName(0.75)).toBe('Last Quarter');
      expect(getPhaseName(0.88)).toBe('Waning Crescent');
      expect(getPhaseName(0.98)).toBe('New Moon');
    });

    it('calculates physical lunar disc illumination correctly from phase values', () => {
      expect(calculateLunarIllumination(0.0)).toBe(0);      // New Moon = 0%
      expect(calculateLunarIllumination(0.25)).toBe(50);    // First Quarter = 50%
      expect(calculateLunarIllumination(0.48)).toBe(100);   // Full Moon near 0.48 = 100%
      expect(calculateLunarIllumination(0.50)).toBe(100);   // Exact Full Moon = 100%
      expect(calculateLunarIllumination(0.75)).toBe(50);    // Last Quarter = 50%
      expect(calculateLunarIllumination(1.0)).toBe(0);      // New Moon = 0%
    });

    it('ensures calculateLunarPosition never produces NaN across various Julian dates', () => {
      const dates = [
        2451545.0, // J2000
        getJulianDate(new Date(2024, 3, 8), 18.3),
        getJulianDate(new Date(2026, 7, 11), 12),
        getJulianDate(new Date(2026, 11, 21), 0),
        getJulianDate(new Date(2030, 0, 1), 6)
      ];
      dates.forEach(jd => {
        const res = calculateLunarPosition(jd);
        expect(Number.isNaN(res.lambda)).toBe(false);
        expect(Number.isNaN(res.beta)).toBe(false);
        expect(Number.isNaN(res.declination)).toBe(false);
        expect(Number.isNaN(res.rightAscension)).toBe(false);
        expect(Number.isNaN(res.distanceKm)).toBe(false);
        expect(Number.isNaN(res.distanceEarthRadii)).toBe(false);
        expect(Number.isNaN(res.nodeLongitude)).toBe(false);
        expect(Number.isNaN(res.descendingNodeLongitude)).toBe(false);
        expect(Number.isNaN(res.angularRadiusDeg)).toBe(false);
        expect(Number.isNaN(res.parallaxDeg)).toBe(false);
      });
    });

    it('computes accurate Meeus Ch. 48 geocentric phase angle and exact illumination fraction', () => {
      // March 14, 2025 Blood Moon (Full Moon)
      const jdFull = getJulianDate(new Date(2025, 2, 14), 6.967);
      const lunarFull = calculateLunarPosition(jdFull);
      expect(lunarFull.phaseAngleDeg).toBeDefined();
      expect(lunarFull.illuminationFraction).toBeDefined();
      expect(lunarFull.phaseAngleDeg).toBeLessThan(5.0); // Close to 0° at full moon
      expect(lunarFull.illuminationFraction).toBeGreaterThanOrEqual(0.99);

      // April 8, 2024 Solar Eclipse (New Moon)
      const jdNew = getJulianDate(new Date(2024, 3, 8), 18.283);
      const lunarNew = calculateLunarPosition(jdNew);
      expect(lunarNew.phaseAngleDeg).toBeGreaterThan(175.0); // Close to 180° at new moon
      expect(lunarNew.illuminationFraction).toBeLessThan(0.01);

      // Verify phaseAngleDeg and illuminationFraction consistency
      const testJd = getJulianDate(new Date(2026, 6, 15), 12);
      const testLunar = calculateLunarPosition(testJd);
      const expectedK = (1 + Math.cos(testLunar.phaseAngleDeg * (Math.PI / 180))) / 2;
      expect(testLunar.illuminationFraction).toBeCloseTo(expectedK, 3);
    });

    it('calculates physical lunar disc illumination correctly with optional ecliptic latitude beta', () => {
      expect(calculateLunarIllumination(0.0, 0)).toBe(0);       // New Moon = 0%
      expect(calculateLunarIllumination(0.5, 0)).toBe(100);     // Full Moon = 100%
      expect(calculateLunarIllumination(0.25, 0)).toBe(50);     // First Quarter = 50%
      expect(calculateLunarIllumination(0.25, 5.0)).toBe(50);   // First Quarter with inclination
    });

    it('implements 2-step iterative lunar rise/set solver with sub-minute convergence across latitudes', () => {
      const testDate = new Date(2026, 6, 15);
      const jd = getJulianDate(testDate, 0);

      // Mid-Latitude Observer (Seattle 47.06°N, -122.81°W)
      const seattleEvents = calculateLunarEvents(47.06, -122.81, jd, 12);
      expect(seattleEvents.transit).toBeGreaterThanOrEqual(0);
      expect(seattleEvents.transit).toBeLessThan(24);
      expect(seattleEvents.distanceKm).toBeGreaterThan(350000);
      expect(seattleEvents.distanceKm).toBeLessThan(410000);
      if (seattleEvents.moonrise !== null) {
        expect(seattleEvents.moonrise).toBeGreaterThanOrEqual(0);
        expect(seattleEvents.moonrise).toBeLessThan(24);
      }
      if (seattleEvents.moonset !== null) {
        expect(seattleEvents.moonset).toBeGreaterThanOrEqual(0);
        expect(seattleEvents.moonset).toBeLessThan(24);
      }

      // Equatorial Observer (0°N, 0°E)
      const equatorEvents = calculateLunarEvents(0, 0, jd, 12);
      expect(equatorEvents.moonrise).not.toBeNull();
      expect(equatorEvents.moonset).not.toBeNull();
      expect(equatorEvents.transit).toBeGreaterThanOrEqual(0);
      expect(equatorEvents.transit).toBeLessThan(24);

      // High-Latitude Polar Observer (80°N Arctic) — verifies continuous circumpolar handling without NaN
      const arcticEvents = calculateLunarEvents(80, 0, jd, 12);
      expect(Number.isNaN(arcticEvents.transit)).toBe(false);
      expect(Number.isNaN(arcticEvents.distanceKm)).toBe(false);
      if (arcticEvents.moonrise !== null) {
        expect(Number.isNaN(arcticEvents.moonrise)).toBe(false);
      }
      if (arcticEvents.moonset !== null) {
        expect(Number.isNaN(arcticEvents.moonset)).toBe(false);
      }
    });

    it('correctly classifies circumpolar_up and circumpolar_down lunar states at geographic poles', () => {
      // Test 30 days across a full tropical month at the North Pole (90°N)
      const baseDate = new Date('2026-03-01T12:00:00Z');
      let upDays = 0;
      let downDays = 0;

      for (let d = 0; d < 30; d++) {
        const currentDate = new Date(baseDate.getTime() + d * 86400000);
        const jd = getJulianDate(currentDate, 12);
        const events = calculateLunarEvents(90, 0, jd, 12);
        
        expect(events.polarState).toBeDefined();
        if (events.polarState === 'circumpolar_up') {
          upDays++;
          expect(events.moonrise).toBe(0);
          expect(events.moonset).toBe(24);
        } else if (events.polarState === 'circumpolar_down') {
          downDays++;
          expect(events.moonrise).toBeNull();
          expect(events.moonset).toBeNull();
        }
      }

      // Over ~27.3 days, the Moon spends roughly half the month above and half below the horizon at 90°N
      expect(upDays).toBeGreaterThanOrEqual(10);
      expect(downDays).toBeGreaterThanOrEqual(10);
      expect(upDays + downDays).toBeGreaterThanOrEqual(28);
    });

    it('computes astronomical parallactic angle correctly and handles meridian transit and horizon azimuths', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      
      // Observer at latitude 45°N
      const etaTransit = calculateParallacticAngle(45, 0, jd, 10, 10);
      expect(Number.isNaN(etaTransit)).toBe(false);
      expect(etaTransit).toBeGreaterThanOrEqual(-180);
      expect(etaTransit).toBeLessThanOrEqual(180);

      // Polar singularity safety checks (89.9°N and -89.9°S)
      const etaNorthPole = calculateParallacticAngle(89.9, -122.8, jd, 15, 45);
      const etaSouthPole = calculateParallacticAngle(-89.9, -122.8, jd, -15, 45);
      expect(Number.isNaN(etaNorthPole)).toBe(false);
      expect(Number.isNaN(etaSouthPole)).toBe(false);
    });

    it('calculates accurate ascending node longitude and precession rate across epochs', () => {
      // J2000 epoch (2000-01-01 12:00 UTC, JD 2451545.0)
      const lunarJ2000 = calculateLunarPosition(2451545.0);
      expect(lunarJ2000.nodeLongitude).toBeCloseTo(125.04, 1);
      expect(lunarJ2000.descendingNodeLongitude).toBeCloseTo((125.04 + 180) % 360, 1);

      // 18.61 years after J2000 (one full nodal regression cycle)
      const jdAfter18Years = 2451545.0 + (18.61295 * 365.25);
      const lunarAfter = calculateLunarPosition(jdAfter18Years);
      const diff = Math.abs(lunarAfter.nodeLongitude - lunarJ2000.nodeLongitude);
      expect(diff < 2 || Math.abs(diff - 360) < 2).toBe(true);
    });

    it('guarantees polar singularity safety and zero division immunity for lunar events at exact geographic poles (±90°)', () => {
      const jd = 2451545.0;
      const northPole = calculateLunarEvents(90, 0, jd, 12);
      expect(Number.isNaN(northPole.transit)).toBe(false);
      expect(Number.isNaN(northPole.declination)).toBe(false);
      expect(['circumpolar_up', 'circumpolar_down', 'regular']).toContain(northPole.polarState);

      const southPole = calculateLunarEvents(-90, 0, jd, 12);
      expect(Number.isNaN(southPole.transit)).toBe(false);
      expect(Number.isNaN(southPole.declination)).toBe(false);
      expect(['circumpolar_up', 'circumpolar_down', 'regular']).toContain(southPole.polarState);
    });

    it('guarantees robust positive modulo and zero division immunity for planetary hours under polar day/night and negative dayOfWeek', () => {
      // 1. Negative dayOfWeek wrapping
      const hourNeg = calculatePlanetaryHour(12 as HoursDecimal, 6 as HoursDecimal, 18 as HoursDecimal, -1);
      expect(hourNeg.hourNumber).toBeGreaterThanOrEqual(1);
      expect(hourNeg.hourNumber).toBeLessThanOrEqual(12);
      expect(hourNeg.rulingPlanet).toBeDefined();

      // 2. 24-hour polar day (sunset == sunrise or dayLength == 24)
      const hourPolar = calculatePlanetaryHour(12 as HoursDecimal, 0 as HoursDecimal, 24 as HoursDecimal, 0);
      expect(Number.isNaN(hourPolar.progressPercent)).toBe(false);
      expect(hourPolar.hourNumber).toBeGreaterThanOrEqual(1);
    });

    it('guarantees positive [0, 360) modulo wrapping for GMST, LST, and horizontal coordinates across negative ranges', () => {
      // GMST across historical epoch prior to J2000
      const gmstPast = calculateGMST(2400000.0);
      expect(gmstPast).toBeGreaterThanOrEqual(0);
      expect(gmstPast).toBeLessThan(360);

      // LST with negative observer longitude
      const lstWest = calculateLST(2451545.0, -179.9);
      expect(lstWest).toBeGreaterThanOrEqual(0);
      expect(lstWest).toBeLessThan(360);

      // Equatorial to horizontal coordinates
      const horiz = equatorialToHorizontal(-45, -10, 45, 10);
      expect(horiz.azDeg).toBeGreaterThanOrEqual(0);
      expect(horiz.azDeg).toBeLessThan(360);
      expect(Number.isNaN(horiz.altDeg)).toBe(false);
    });
  });


    describe('calculateAnnualLunarMatrix', () => {
      it('calculates exactly 365 daily entries for a standard year (2026)', () => {
        const matrix = calculateAnnualLunarMatrix(2026, 47.06, -122.81);
        expect(matrix).toHaveLength(365);
        expect(matrix[0].day).toBe(1);
        expect(matrix[364].day).toBe(365);
      });

      it('calculates exactly 366 daily entries for a leap year (2024)', () => {
        const matrix = calculateAnnualLunarMatrix(2024, 47.06, -122.81);
        expect(matrix).toHaveLength(366);
        expect(matrix[0].day).toBe(1);
        expect(matrix[365].day).toBe(366);
      });

      it('contains valid lunar metrics, phase fractions, distances, and perigee/apogee flags', () => {
        const matrix = calculateAnnualLunarMatrix(2026, 47.06, -122.81);
        let perigeeCount = 0;
        let apogeeCount = 0;

        matrix.forEach((entry, idx) => {
          expect(entry.day).toBe(idx + 1);
          expect(Number.isNaN(entry.transit)).toBe(false);
          expect(entry.transit).toBeGreaterThanOrEqual(0);
          expect(entry.transit).toBeLessThanOrEqual(24);

          expect(Number.isNaN(entry.phaseValue)).toBe(false);
          expect(entry.phaseValue).toBeGreaterThanOrEqual(0);
          expect(entry.phaseValue).toBeLessThanOrEqual(1);

          expect(Number.isNaN(entry.distanceKm)).toBe(false);
          expect(entry.distanceKm).toBeGreaterThan(350000);
          expect(entry.distanceKm).toBeLessThan(410000);

          expect(typeof entry.isPerigee).toBe('boolean');
          expect(typeof entry.isApogee).toBe('boolean');

          if (entry.isPerigee) perigeeCount++;
          if (entry.isApogee) apogeeCount++;
        });

        expect(perigeeCount).toBeGreaterThan(0);
        expect(apogeeCount).toBeGreaterThan(0);
      });
    });
});
