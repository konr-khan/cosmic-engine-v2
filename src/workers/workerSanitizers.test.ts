import { describe, it, expect } from 'vitest';
import {
  sanitizeYear,
  sanitizeLatitude,
  sanitizeLongitude,
  sanitizeJulianDate,
  sanitizeTimeOfDay,
  sanitizeEphemerisParams
} from './workerSanitizers';
import { J2000_JD } from '../utils/cosmicMath/astroConstants';

describe('workerSanitizers Suite', () => {
  describe('sanitizeYear', () => {
    it('preserves valid standard years', () => {
      expect(sanitizeYear(2026)).toBe(2026);
      expect(sanitizeYear(2000)).toBe(2000);
      expect(sanitizeYear(-500)).toBe(-500);
    });

    it('clamps years outside Meeus validity bounds [-2000, 3000]', () => {
      expect(sanitizeYear(3500)).toBe(3000);
      expect(sanitizeYear(999999)).toBe(3000);
      expect(sanitizeYear(-2500)).toBe(-2000);
      expect(sanitizeYear(-100000)).toBe(-2000);
    });

    it('rounds non-integer years', () => {
      expect(sanitizeYear(2026.4)).toBe(2026);
      expect(sanitizeYear(2026.8)).toBe(2027);
    });

    it('safely handles NaN and non-finite values by defaulting to 2000', () => {
      expect(sanitizeYear(NaN)).toBe(2000);
      expect(sanitizeYear(Infinity)).toBe(2000);
      expect(sanitizeYear(-Infinity)).toBe(2000);
    });
  });

  describe('sanitizeLatitude', () => {
    it('preserves valid latitudes', () => {
      expect(sanitizeLatitude(47.06)).toBe(47.06);
      expect(sanitizeLatitude(-33.86)).toBe(-33.86);
      expect(sanitizeLatitude(0)).toBe(0);
    });

    it('clamps latitudes outside [-90, 90]', () => {
      expect(sanitizeLatitude(95)).toBe(90);
      expect(sanitizeLatitude(180)).toBe(90);
      expect(sanitizeLatitude(-95)).toBe(-90);
      expect(sanitizeLatitude(-1000)).toBe(-90);
    });

    it('safely handles NaN and non-finite values by defaulting to 0', () => {
      expect(sanitizeLatitude(NaN)).toBe(0);
      expect(sanitizeLatitude(Infinity)).toBe(0);
      expect(sanitizeLatitude(-Infinity)).toBe(0);
    });
  });

  describe('sanitizeLongitude', () => {
    it('preserves valid longitudes in [-180, 180]', () => {
      expect(sanitizeLongitude(-122.81)).toBeCloseTo(-122.81, 5);
      expect(sanitizeLongitude(151.2)).toBeCloseTo(151.2, 5);
      expect(sanitizeLongitude(0)).toBe(0);
    });

    it('normalizes longitudes outside [-180, 180]', () => {
      expect(sanitizeLongitude(190)).toBeCloseTo(-170, 5);
      expect(sanitizeLongitude(-190)).toBeCloseTo(170, 5);
      expect(sanitizeLongitude(540)).toBeCloseTo(180, 5);
    });

    it('safely handles NaN and non-finite values by defaulting to 0', () => {
      expect(sanitizeLongitude(NaN)).toBe(0);
      expect(sanitizeLongitude(Infinity)).toBe(0);
      expect(sanitizeLongitude(-Infinity)).toBe(0);
    });
  });

  describe('sanitizeJulianDate', () => {
    it('preserves valid Julian Dates', () => {
      expect(sanitizeJulianDate(2451545.0)).toBe(2451545.0);
      expect(sanitizeJulianDate(2460000.5)).toBe(2460000.5);
    });

    it('bounds Julian Dates and defaults to J2000_JD if out of bounds or non-finite', () => {
      expect(sanitizeJulianDate(-100)).toBe(J2000_JD);
      expect(sanitizeJulianDate(10000000)).toBe(J2000_JD);
      expect(sanitizeJulianDate(NaN)).toBe(J2000_JD);
      expect(sanitizeJulianDate(Infinity)).toBe(J2000_JD);
      expect(sanitizeJulianDate(-Infinity)).toBe(J2000_JD);
    });
  });

  describe('sanitizeTimeOfDay', () => {
    it('preserves valid decimal hours in [0, 24)', () => {
      expect(sanitizeTimeOfDay(12.5)).toBe(12.5);
      expect(sanitizeTimeOfDay(0)).toBe(0);
      expect(sanitizeTimeOfDay(23.99)).toBe(23.99);
    });

    it('normalizes times of day outside [0, 24)', () => {
      expect(sanitizeTimeOfDay(25)).toBe(1);
      expect(sanitizeTimeOfDay(48)).toBe(0);
      expect(sanitizeTimeOfDay(-1)).toBe(23);
      expect(sanitizeTimeOfDay(-25)).toBe(23);
    });

    it('safely handles NaN and non-finite values by defaulting to 12.0', () => {
      expect(sanitizeTimeOfDay(NaN)).toBe(12.0);
      expect(sanitizeTimeOfDay(Infinity)).toBe(12.0);
      expect(sanitizeTimeOfDay(-Infinity)).toBe(12.0);
    });
  });

  describe('sanitizeEphemerisParams', () => {
    it('sanitizes all fields simultaneously and preserves extra properties', () => {
      const raw = {
        latitude: 120,
        longitude: 200,
        julianDate: NaN,
        timeOfDay: -2,
        calculateLunar: true,
        calculateEclipse: false,
        throttleMs: 50
      };

      const sanitized = sanitizeEphemerisParams(raw);

      expect(sanitized.latitude).toBe(90);
      expect(sanitized.longitude).toBeCloseTo(-160, 5);
      expect(sanitized.julianDate).toBe(J2000_JD);
      expect(sanitized.timeOfDay).toBe(22);
      expect(sanitized.calculateLunar).toBe(true);
      expect(sanitized.calculateEclipse).toBe(false);
      expect(sanitized.throttleMs).toBe(50);
    });
  });
});
