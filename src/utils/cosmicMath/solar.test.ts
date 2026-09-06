/**
 * @file solar.test.ts
 * Domain test suite for solar ephemeris, twilight calculations, polar boundaries, and annual solar matrix.
 */

import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  clamp,
  formatTime,
  getJulianDate,
  calculateSolarPosition,
  calculateEarthOrbitalPhysics,
  calculateDailySolarEvents,
  calculateDaylightDurationPrecise,
  calculatePolarState,
  getTerminatorShadowPaths,
  POLAR_STATES,
  CONFIG,
  calculateAnnualSolarMatrix,
  ASTRONOMICAL_UNIT_KM
} from './index';
import { Degrees, Latitude, Longitude } from '../../types';

describe('Cosmic Math: Solar Ephemeris & Twilight Solvers', () => {
  describe('Solar Ephemeris & Earth Orbital Dynamics Solver', () => {
    it('calculates near-zero solar declination around Spring Equinox (March 20)', () => {
      const equinoxDate = new Date(2026, 2, 20);
      const jd = getJulianDate(equinoxDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeGreaterThan(-2.0);
      expect(solar.declination).toBeLessThan(2.0);
    });

    it('calculates maximum positive declination (~23.44°) around Summer Solstice (June 21)', () => {
      const solsticeDate = new Date(2026, 5, 21);
      const jd = getJulianDate(solsticeDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeGreaterThan(23.0);
      expect(solar.declination).toBeLessThan(23.5);
    });

    it('calculates maximum negative declination (~-23.44°) around Winter Solstice (December 21)', () => {
      const winterSolstice = new Date(2026, 11, 21);
      const jd = getJulianDate(winterSolstice, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.declination).toBeLessThan(-23.0);
      expect(solar.declination).toBeGreaterThan(-23.5);
    });

    it('returns Earth-Sun distance between 0.98 AU and 1.02 AU with valid orbital metrics', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.distanceAU).toBeGreaterThan(0.98);
      expect(solar.distanceAU).toBeLessThan(1.02);
      expect(solar.distanceKm).toBeGreaterThan(147000000);
      expect(solar.distanceKm).toBeLessThan(153000000);
      expect(solar.orbitalSpeedKms).toBeGreaterThan(29.0);
      expect(solar.orbitalSpeedKms).toBeLessThan(30.5);
      expect(solar.solarIrradianceWm2).toBeGreaterThan(1300);
      expect(solar.solarIrradianceWm2).toBeLessThan(1430);
      expect(solar.sunAngularDiameterArcmin).toBeGreaterThan(31.0);
      expect(solar.sunAngularDiameterArcmin).toBeLessThan(33.0);
    });

    it('provides calculateEarthOrbitalPhysics alias identical to calculateSolarPosition', () => {
      const jd = 2460409.26;
      const direct = calculateSolarPosition(jd);
      const alias = calculateEarthOrbitalPhysics(jd);
      expect(alias.declination).toBe(direct.declination);
      expect(alias.distanceAU).toBe(direct.distanceAU);
    });

    it('computes valid SVG paths for daylight terminator overlay without NaN', () => {
      const normalTerminator = getTerminatorShadowPaths(0, 0, 10);
      expect(normalTerminator.southPath).toContain('M 0,180');
      expect(normalTerminator.southPath).toContain('L 360,180 Z');
      expect(normalTerminator.northPath).toContain('M 0,0');
      expect(normalTerminator.combinedPath).not.toContain('NaN');

      const polarTerminator = getTerminatorShadowPaths(0, 0, 23.44);
      expect(polarTerminator.southPath).not.toContain('NaN');
      expect(polarTerminator.northPath).not.toContain('NaN');
    });

    it('ensures calculateSolarPosition never produces NaN across various Julian dates', () => {
      const dates = [
        2451545.0, // J2000
        getJulianDate(new Date(2026, 2, 20), 12),
        getJulianDate(new Date(2026, 5, 21), 12),
        getJulianDate(new Date(2026, 8, 22), 12),
        getJulianDate(new Date(2026, 11, 21), 12),
        getJulianDate(new Date(2000, 0, 1), 0),
        getJulianDate(new Date(2050, 6, 1), 23.9)
      ];
      dates.forEach(jd => {
        const res = calculateSolarPosition(jd);
        expect(Number.isNaN(res.declination)).toBe(false);
        expect(Number.isNaN(res.equationOfTime)).toBe(false);
        expect(Number.isNaN(res.rightAscension)).toBe(false);
        expect(Number.isNaN(res.distanceAU)).toBe(false);
        expect(Number.isNaN(res.distanceKm)).toBe(false);
        expect(Number.isNaN(res.orbitalSpeedKms)).toBe(false);
      });
    });
  });


  describe('Daily Solar Events & Twilight Calculator', () => {
    it('calculates symmetrical daylight hours around solar noon at equator', () => {
      const events = calculateDailySolarEvents(0, 0, 12);
      expect(events.official.morning).toBeGreaterThan(5.8);
      expect(events.official.morning).toBeLessThan(6.1);
      expect(events.official.evening).toBeGreaterThan(17.9);
      expect(events.official.evening).toBeLessThan(18.2);
      expect(events.solarMidnightStart).toBe(0);
      expect(events.solarMidnightEnd).toBe(24);
    });
  });


  describe('Polar Boundary & Extreme Latitude Hardening', () => {
    it('never outputs NaN or null across all latitudes [-90, +90]', () => {
      const angles = Object.values(CONFIG.SOLAR.TWILIGHT);
      const declinations = [-23.44, -15, 0, 15, 23.44];

      for (let lat = -90; lat <= 90; lat += 1) {
        for (const dec of declinations) {
          for (const alt of angles) {
            const duration = calculateDaylightDurationPrecise(lat, dec, alt);
            expect(duration).not.toBeNull();
            expect(duration).not.toBeUndefined();
            expect(Number.isNaN(duration)).toBe(false);
            expect(duration).toBeGreaterThanOrEqual(0.0);
            expect(duration).toBeLessThanOrEqual(24.0);
          }
        }
      }
    });

    it('enforces twilight band duration monotonicity (official <= civil <= nautical <= astronomical)', () => {
      const latitudes = [-90, -78, -65, -45, 0, 45, 65, 78, 90];
      const declinations = [-23.44, -10, 0, 10, 23.44];

      const { OFFICIAL, CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;

      latitudes.forEach(lat => {
        declinations.forEach(dec => {
          const off = calculateDaylightDurationPrecise(lat, dec, OFFICIAL);
          const civ = calculateDaylightDurationPrecise(lat, dec, CIVIL);
          const nau = calculateDaylightDurationPrecise(lat, dec, NAUTICAL);
          const ast = calculateDaylightDurationPrecise(lat, dec, ASTRONOMICAL);

          expect(off).toBeLessThanOrEqual(civ + 1e-9);
          expect(civ).toBeLessThanOrEqual(nau + 1e-9);
          expect(nau).toBeLessThanOrEqual(ast + 1e-9);
        });
      });
    });

    it('evaluates extreme polar latitudes (+-65, +-70, +-78, +-85, +-90) across equinoxes and solstices', () => {
      const summerDec = 23.44;
      const winterDec = -23.44;
      const equinoxDec = 0.0;
      const official = CONFIG.SOLAR.TWILIGHT.OFFICIAL;

      // North Pole (+90°)
      expect(calculateDaylightDurationPrecise(90, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(90, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      
      expect(calculateDaylightDurationPrecise(90, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(90, winterDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      expect(calculateDaylightDurationPrecise(90, equinoxDec, official)).toBe(24.0);

      // South Pole (-90°)
      expect(calculateDaylightDurationPrecise(-90, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-90, summerDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      expect(calculateDaylightDurationPrecise(-90, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-90, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);

      // High Arctic (+85°)
      expect(calculateDaylightDurationPrecise(85, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(85, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(85, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(85, winterDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      // Sub-Antarctic (-85°)
      expect(calculateDaylightDurationPrecise(-85, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-85, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-85, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-85, summerDec)).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      // Svalbard / High Arctic (+78°)
      expect(calculateDaylightDurationPrecise(78, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(78, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(78, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(78, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // McMurdo / Antarctic (-78°)
      expect(calculateDaylightDurationPrecise(-78, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-78, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-78, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-78, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Arctic (+70°)
      expect(calculateDaylightDurationPrecise(70, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(70, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(70, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(70, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Sub-Antarctic (-70°)
      expect(calculateDaylightDurationPrecise(-70, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-70, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(calculateDaylightDurationPrecise(-70, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-70, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Sub-Arctic Circle (+65°)
      expect(calculateDaylightDurationPrecise(65, summerDec, official)).toBeGreaterThan(21.0);
      expect(calculatePolarState(65, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
      expect(calculateDaylightDurationPrecise(65, winterDec, official)).toBeLessThan(4.0);

      // Sub-Antarctic Circle (-65°)
      expect(calculateDaylightDurationPrecise(-65, winterDec, official)).toBeGreaterThan(21.0);
      expect(calculatePolarState(-65, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
      expect(calculateDaylightDurationPrecise(-65, summerDec, official)).toBeLessThan(4.0);
    });

    it('returns structured POLAR_STATES enums in calculateDailySolarEvents', () => {
      const equatorEvents = calculateDailySolarEvents(0, 0, 12);
      expect(equatorEvents.polarState).toBe(POLAR_STATES.NORMAL);
      expect(equatorEvents.official.polarState).toBe(POLAR_STATES.NORMAL);

      const northPoleSummerEvents = calculateDailySolarEvents(90, 23.44, 12);
      expect(northPoleSummerEvents.polarState).toBe(POLAR_STATES.PERPETUAL_DAY);
      expect(northPoleSummerEvents.official.polarState).toBe(POLAR_STATES.PERPETUAL_DAY);

      const northPoleWinterEvents = calculateDailySolarEvents(90, -23.44, 12);
      expect(northPoleWinterEvents.polarState).toBe(POLAR_STATES.PERPETUAL_NIGHT);
      expect(northPoleWinterEvents.official.polarState).toBe(POLAR_STATES.PERPETUAL_NIGHT);

      const svalbardNovEvents = calculateDailySolarEvents(78, -20, 12);
      expect(svalbardNovEvents.polarState).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);
    });
  });


    describe('calculateAnnualSolarMatrix', () => {
      it('calculates exactly 365 daily entries for a standard year (2026)', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        expect(matrix).toHaveLength(365);
        expect(matrix[0].day).toBe(1);
        expect(matrix[364].day).toBe(365);
      });

      it('calculates exactly 366 daily entries for a leap year (2024)', () => {
        const matrix = calculateAnnualSolarMatrix(2024, 47.06);
        expect(matrix).toHaveLength(366);
        expect(matrix[0].day).toBe(1);
        expect(matrix[365].day).toBe(366);
      });

      it('contains all required solar property fields without NaN values', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        matrix.forEach((entry, idx) => {
          expect(entry.day).toBe(idx + 1);
          expect(Number.isNaN(entry.declination)).toBe(false);
          expect(Number.isNaN(entry.equationOfTime)).toBe(false);
          expect(Number.isNaN(entry.solarNoon)).toBe(false);
          expect(Number.isNaN(entry.sunrise)).toBe(false);
          expect(Number.isNaN(entry.sunset)).toBe(false);
          expect(Number.isNaN(entry.civilDawn)).toBe(false);
          expect(Number.isNaN(entry.civilDusk)).toBe(false);
          expect(Number.isNaN(entry.nauticalDawn)).toBe(false);
          expect(Number.isNaN(entry.nauticalDusk)).toBe(false);
          expect(Number.isNaN(entry.astroDawn)).toBe(false);
          expect(Number.isNaN(entry.astroDusk)).toBe(false);
          expect(Number.isNaN(entry.dayLength)).toBe(false);
          expect(entry.dayLength).toBeGreaterThanOrEqual(0);
          expect(entry.dayLength).toBeLessThanOrEqual(24);
        });
      });

      it('exhibits longer daylight at Summer Solstice than Winter Solstice in Northern Hemisphere', () => {
        const matrix = calculateAnnualSolarMatrix(2026, 47.06);
        const summerSolstice = matrix[171]; // ~June 21 (day 172)
        const winterSolstice = matrix[354]; // ~Dec 21 (day 355)

        expect(summerSolstice.dayLength).toBeGreaterThan(15.0);
        expect(winterSolstice.dayLength).toBeLessThan(9.5);
        expect(summerSolstice.dayLength).toBeGreaterThan(winterSolstice.dayLength);
        expect(summerSolstice.declination).toBeGreaterThan(23.0);
        expect(winterSolstice.declination).toBeLessThan(-23.0);
      });
    });
});
