import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  formatTime,
  getJulianDate,
  isLeapYear,
  getDaysInYear,
  calculateSolarPosition,
  calculateLunarPosition,
  getPhaseName,
  calculateEclipseData,
  calculateDailySolarEvents,
  calculateDaylightDurationPrecise,
  calculatePolarState,
  POLAR_STATES,
  ECLIPSE_PRESETS,
  CONFIG
} from './cosmicMath';

describe('cosmicMath utilities', () => {

  describe('Angle & Unit Conversions', () => {
    it('converts degrees to radians accurately', () => {
      expect(toRadians(0)).toBe(0);
      expect(toRadians(180)).toBeCloseTo(Math.PI);
      expect(toRadians(360)).toBeCloseTo(2 * Math.PI);
    });

    it('converts radians to degrees accurately', () => {
      expect(toDegrees(0)).toBe(0);
      expect(toDegrees(Math.PI)).toBeCloseTo(180);
      expect(toDegrees(2 * Math.PI)).toBeCloseTo(360);
    });

    it('formats decimal hours to HH:MM:SS format', () => {
      expect(formatTime(12.5)).toBe('12:30:00');
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(23.5)).toBe('23:30:00');
      expect(formatTime(-1)).toBe('23:00:00');
      expect(formatTime(NaN)).toBe('--:--:--');
    });
  });

  describe('Calendar & Julian Date Engine', () => {
    it('calculates correct Julian Date for J2000 epoch (2000-01-01 at 12:00)', () => {
      const j2000Date = new Date(2000, 0, 1);
      const jd = getJulianDate(j2000Date, 12);
      expect(jd).toBe(2451545.0);
    });

    it('identifies leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('returns 366 days for leap years and 365 for non-leap years', () => {
      expect(getDaysInYear(2024)).toBe(366);
      expect(getDaysInYear(2025)).toBe(365);
    });
  });

  describe('Solar Ephemeris Solver', () => {
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

    it('returns Earth-Sun distance between 0.98 AU and 1.02 AU', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const solar = calculateSolarPosition(jd);
      expect(solar.distanceAU).toBeGreaterThan(0.98);
      expect(solar.distanceAU).toBeLessThan(1.02);
    });
  });

  describe('Lunar Ephemeris & Phase Solver', () => {
    it('returns lunar distance within valid physical bounds (350,000 km to 410,000 km)', () => {
      const testDate = new Date(2026, 7, 11);
      const jd = getJulianDate(testDate, 12);
      const lunar = calculateLunarPosition(jd);
      expect(lunar.distanceKm).toBeGreaterThan(350000);
      expect(lunar.distanceKm).toBeLessThan(410000);
    });

    it('names lunar phases correctly', () => {
      expect(getPhaseName(0.0)).toBe('New Moon');
      expect(getPhaseName(0.25)).toBe('First Quarter');
      expect(getPhaseName(0.50)).toBe('Full Moon');
      expect(getPhaseName(0.75)).toBe('Last Quarter');
    });
  });

  describe('Eclipse Alignment Engine', () => {
    it('correctly identifies the Great American Solar Eclipse preset (April 8, 2024)', () => {
      const preset = ECLIPSE_PRESETS[0];
      const jd = getJulianDate(preset.date, 18.28);
      const eclipse = calculateEclipseData(jd);
      expect(eclipse.isEclipseActive).toBe(true);
      expect(eclipse.category).toBe('SOLAR');
    });
  });

  describe('Daily Solar Events & Twilight Calculator', () => {
    it('calculates symmetrical daylight hours around solar noon at equator', () => {
      const events = calculateDailySolarEvents(0, 0, 12);
      expect(events.official.morning).toBeGreaterThan(5.8);
      expect(events.official.morning).toBeLessThan(6.1);
      expect(events.official.evening).toBeGreaterThan(17.9);
      expect(events.official.evening).toBeLessThan(18.2);
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

    it('evaluates extreme polar latitudes (+-70, +-80, +-90) across equinoxes and solstices', () => {
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

      // High Arctic (+80°)
      expect(calculateDaylightDurationPrecise(80, summerDec, official)).toBe(24.0);
      expect(calculatePolarState(80, summerDec)).toBe(POLAR_STATES.PERPETUAL_DAY);

      expect(calculateDaylightDurationPrecise(80, winterDec, official)).toBe(0.0);
      expect(calculatePolarState(80, winterDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

      // Antarctic (-80°)
      expect(calculateDaylightDurationPrecise(-80, winterDec, official)).toBe(24.0);
      expect(calculatePolarState(-80, winterDec)).toBe(POLAR_STATES.PERPETUAL_DAY);

      expect(calculateDaylightDurationPrecise(-80, summerDec, official)).toBe(0.0);
      expect(calculatePolarState(-80, summerDec)).toBe(POLAR_STATES.PERPETUAL_TWILIGHT);

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

});
