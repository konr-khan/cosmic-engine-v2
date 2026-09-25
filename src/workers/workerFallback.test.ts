import { describe, it, expect, vi } from 'vitest';
import {
  executeSyncAnnualSolarFallback,
  executeSyncAnnualLunarFallback,
  executeSyncEphemerisFallback,
  executeSyncFallbackForEntry
} from './workerFallback';
import { LruCache } from '../utils/lruCache';
import * as cosmicMath from '../utils/cosmicMath';
import { Latitude, Longitude, JulianDate, HoursDecimal } from '../types/units';
import { PendingRequestEntry } from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';

describe('workerFallback Suite', () => {
  describe('executeSyncAnnualSolarFallback', () => {
    it('computes 365-day annual solar matrix for valid year and latitude', () => {
      const result = executeSyncAnnualSolarFallback(2026, 47.06 as Latitude);
      expect(result.annualSolar).toHaveLength(365);
      expect(result.annualSolar[0].day).toBe(1);
      expect(result.annualSolar[0].sunrise).toBeDefined();
      expect(result.annualSolar[0].sunset).toBeDefined();
    });

    it('populates cache when signature and cache are provided', () => {
      const cache = new Map<string, AnnualSolarMatrixItem[]>();
      const signature = 'SOLAR_2026_47.06';
      const result = executeSyncAnnualSolarFallback(2026, 47.06 as Latitude, signature, cache);
      expect(cache.has(signature)).toBe(true);
      expect(cache.get(signature)).toBe(result.annualSolar);
    });

    it('uses custom setInCache callback when provided', () => {
      const cache = new LruCache<string, AnnualSolarMatrixItem[]>(16);
      const signature = 'SOLAR_2026_47.06';
      const setInCacheSpy = vi.fn((c, k, v) => c.set(k, v));
      executeSyncAnnualSolarFallback(2026, 47.06 as Latitude, signature, cache, setInCacheSpy);
      expect(setInCacheSpy).toHaveBeenCalledTimes(1);
      expect(setInCacheSpy).toHaveBeenCalledWith(cache, signature, expect.any(Array));
      expect(cache.has(signature)).toBe(true);
    });

    it('sanitizes NaN and extreme year / latitude inputs safely', () => {
      const nanResult = executeSyncAnnualSolarFallback(NaN, NaN as any);
      // NaN year defaults to 2000 (a leap year with 366 days)
      expect(nanResult.annualSolar).toHaveLength(366);

      const extremeResult = executeSyncAnnualSolarFallback(999999, 999 as any);
      // 999999 clamps to 3000 (non-leap century year with 365 days)
      expect(extremeResult.annualSolar).toHaveLength(365);
    });

    it('recovers gracefully and returns empty array when calculateAnnualSolarMatrix throws', () => {
      const spy = vi.spyOn(cosmicMath, 'calculateAnnualSolarMatrix').mockImplementationOnce(() => {
        throw new Error('Solar calculation exploded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = executeSyncAnnualSolarFallback(2026, 45 as Latitude);
      expect(result.annualSolar).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WorkerFallback] Annual solar sync calculation failed:'),
        expect.any(Error)
      );

      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('executeSyncAnnualLunarFallback', () => {
    it('computes 365-day annual lunar matrix for valid year, latitude, and longitude', () => {
      const result = executeSyncAnnualLunarFallback(2026, 47.06 as Latitude, -122.81 as Longitude);
      expect(result.annualLunar).toHaveLength(365);
      expect(result.annualLunar[0].day).toBe(1);
      expect(result.annualLunar[0].distanceKm).toBeGreaterThan(350000);
      expect(result.annualLunar[0].phaseValue).toBeDefined();
    });

    it('populates cache when signature and cache are provided', () => {
      const cache = new Map<string, AnnualLunarMatrixItem[]>();
      const signature = 'LUNAR_2026_47.06_-122.81';
      const result = executeSyncAnnualLunarFallback(2026, 47.06 as Latitude, -122.81 as Longitude, signature, cache);
      expect(cache.has(signature)).toBe(true);
      expect(cache.get(signature)).toBe(result.annualLunar);
    });

    it('uses custom setInCache callback when provided', () => {
      const cache = new LruCache<string, AnnualLunarMatrixItem[]>(16);
      const signature = 'LUNAR_2026_47.06_-122.81';
      const setInCacheSpy = vi.fn((c, k, v) => c.set(k, v));
      executeSyncAnnualLunarFallback(2026, 47.06 as Latitude, -122.81 as Longitude, signature, cache, setInCacheSpy);
      expect(setInCacheSpy).toHaveBeenCalledTimes(1);
      expect(setInCacheSpy).toHaveBeenCalledWith(cache, signature, expect.any(Array));
      expect(cache.has(signature)).toBe(true);
    });

    it('sanitizes NaN and extreme coordinates safely', () => {
      const nanResult = executeSyncAnnualLunarFallback(NaN, NaN as any, NaN as any);
      // NaN year defaults to 2000 (a leap year with 366 days)
      expect(nanResult.annualLunar).toHaveLength(366);

      const extremeResult = executeSyncAnnualLunarFallback(-5000, 999 as any, -999 as any);
      // -5000 clamps to -2000
      expect(extremeResult.annualLunar.length).toBeGreaterThanOrEqual(365);
    });

    it('recovers gracefully and returns empty array when calculateAnnualLunarMatrix throws', () => {
      const spy = vi.spyOn(cosmicMath, 'calculateAnnualLunarMatrix').mockImplementationOnce(() => {
        throw new Error('Lunar calculation exploded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = executeSyncAnnualLunarFallback(2026, 45 as Latitude, 0 as Longitude);
      expect(result.annualLunar).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WorkerFallback] Annual lunar sync calculation failed:'),
        expect.any(Error)
      );

      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('executeSyncEphemerisFallback', () => {
    const baseParams = {
      latitude: 47.06 as Latitude,
      longitude: -122.81 as Longitude,
      julianDate: 2451545.0 as JulianDate,
      timeOfDay: 12 as HoursDecimal
    };

    it('calculates lunar events only when calculateLunar is true and calculateEclipse is false', () => {
      const result = executeSyncEphemerisFallback({
        ...baseParams,
        calculateLunar: true,
        calculateEclipse: false
      });
      expect(result.lunarEvents).not.toBeNull();
      expect(result.lunarEvents!.distanceKm).toBeGreaterThan(350000);
      expect(result.eclipse).toBeNull();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('calculates eclipse data only when calculateEclipse is true and calculateLunar is false', () => {
      const result = executeSyncEphemerisFallback({
        ...baseParams,
        calculateLunar: false,
        calculateEclipse: true
      });
      expect(result.lunarEvents).toBeNull();
      expect(result.eclipse).not.toBeNull();
      expect(result.eclipse!.category).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('calculates both lunar events and eclipse data when both flags are true', () => {
      const result = executeSyncEphemerisFallback({
        ...baseParams,
        calculateLunar: true,
        calculateEclipse: true
      });
      expect(result.lunarEvents).not.toBeNull();
      expect(result.eclipse).not.toBeNull();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('calculates neither when both flags are false or omitted', () => {
      const result = executeSyncEphemerisFallback(baseParams);
      expect(result.lunarEvents).toBeNull();
      expect(result.eclipse).toBeNull();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('sanitizes non-finite coordinates, JD, and timeOfDay safely', () => {
      const result = executeSyncEphemerisFallback({
        latitude: NaN as any,
        longitude: NaN as any,
        julianDate: NaN as any,
        timeOfDay: NaN as any,
        calculateLunar: true,
        calculateEclipse: true
      });
      expect(result.lunarEvents).not.toBeNull();
      expect(result.eclipse).not.toBeNull();
    });

    it('handles calculateLunarEvents error and still calculates eclipse', () => {
      const spy = vi.spyOn(cosmicMath, 'calculateLunarEvents').mockImplementationOnce(() => {
        throw new Error('Lunar events error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = executeSyncEphemerisFallback({
        ...baseParams,
        calculateLunar: true,
        calculateEclipse: true
      });
      expect(result.lunarEvents).toBeNull();
      expect(result.eclipse).not.toBeNull();

      spy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles calculateEclipseData error and still calculates lunar events', () => {
      const spy = vi.spyOn(cosmicMath, 'calculateEclipseData').mockImplementationOnce(() => {
        throw new Error('Eclipse data error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = executeSyncEphemerisFallback({
        ...baseParams,
        calculateLunar: true,
        calculateEclipse: true
      });
      expect(result.lunarEvents).not.toBeNull();
      expect(result.eclipse).toBeNull();

      spy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles parameter processing errors when property accessors throw', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const brokenParams = {
        get latitude() {
          throw new Error('Accessor failure');
        },
        longitude: 0 as Longitude,
        julianDate: 2451545.0 as JulianDate,
        timeOfDay: 12 as HoursDecimal,
        calculateLunar: true,
        calculateEclipse: true
      };

      const result = executeSyncEphemerisFallback(brokenParams as any);
      expect(result.lunarEvents).toBeNull();
      expect(result.eclipse).toBeNull();
      expect(result.timestamp).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('executeSyncFallbackForEntry', () => {
    it('handles undefined entry or empty callback set gracefully as a no-op', () => {
      expect(() => {
        executeSyncFallbackForEntry(null as any);
        executeSyncFallbackForEntry({ callbacks: new Set() } as any);
      }).not.toThrow();
    });

    it('dispatches ANNUAL_SOLAR fallback and notifies multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cache = new Map<string, AnnualSolarMatrixItem[]>();

      const entry: PendingRequestEntry = {
        type: 'ANNUAL_SOLAR',
        signature: 'SOLAR_2026_45',
        callbacks: new Set([cb1, cb2]),
        params: { year: 2026, latitude: 45 as Latitude }
      };

      executeSyncFallbackForEntry(entry, cache);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0].annualSolar).toHaveLength(365);
      expect(cb2.mock.calls[0][0].annualSolar).toHaveLength(365);
      expect(cache.has('SOLAR_2026_45')).toBe(true);
    });

    it('dispatches ANNUAL_LUNAR fallback and notifies multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cache = new Map<string, AnnualLunarMatrixItem[]>();

      const entry: PendingRequestEntry = {
        type: 'ANNUAL_LUNAR',
        signature: 'LUNAR_2026_45_0',
        callbacks: new Set([cb1, cb2]),
        params: { year: 2026, latitude: 45 as Latitude, longitude: 0 as Longitude }
      };

      executeSyncFallbackForEntry(entry, undefined, cache);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0].annualLunar).toHaveLength(365);
      expect(cb2.mock.calls[0][0].annualLunar).toHaveLength(365);
      expect(cache.has('LUNAR_2026_45_0')).toBe(true);
    });

    it('dispatches EPHEMERIS fallback and notifies multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const entry: PendingRequestEntry = {
        type: 'EPHEMERIS',
        signature: 'EPHEMERIS_45_0',
        callbacks: new Set([cb1, cb2]),
        params: {
          latitude: 45 as Latitude,
          longitude: 0 as Longitude,
          julianDate: 2451545.0 as JulianDate,
          timeOfDay: 12 as HoursDecimal,
          calculateLunar: true,
          calculateEclipse: true
        }
      };

      executeSyncFallbackForEntry(entry);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0].lunarEvents).not.toBeNull();
      expect(cb1.mock.calls[0][0].eclipse).not.toBeNull();
      expect(cb2.mock.calls[0][0].lunarEvents).not.toBeNull();
    });

    it('continues notifying other callbacks if one callback throws in success path', () => {
      const errorCb = vi.fn(() => {
        throw new Error('Callback thrown');
      });
      const successCb = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const entry: PendingRequestEntry = {
        type: 'ANNUAL_SOLAR',
        signature: 'SOLAR_2026_0',
        callbacks: new Set([errorCb, successCb]),
        params: { year: 2026, latitude: 0 as Latitude }
      };

      executeSyncFallbackForEntry(entry);

      expect(errorCb).toHaveBeenCalledTimes(1);
      expect(successCb).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WorkerFallback] Annual solar fallback callback error:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('guarantees failsafe callback delivery on thrown errors for ANNUAL_SOLAR', () => {
      const cb = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const brokenSolarEntry: any = {
        type: 'ANNUAL_SOLAR',
        signature: 'BROKEN_SOLAR',
        callbacks: new Set([cb]),
        params: {
          get year() {
            throw new Error('Accessor blown');
          },
          latitude: 45
        }
      };

      expect(() => {
        executeSyncFallbackForEntry(brokenSolarEntry);
      }).not.toThrow();

      expect(cb).toHaveBeenCalledWith({ annualSolar: [] });
      consoleSpy.mockRestore();
    });

    it('guarantees failsafe callback delivery on thrown errors for ANNUAL_LUNAR', () => {
      const cb = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const brokenLunarEntry: any = {
        type: 'ANNUAL_LUNAR',
        signature: 'BROKEN_LUNAR',
        callbacks: new Set([cb]),
        params: {
          get year() {
            throw new Error('Accessor blown');
          },
          latitude: 45,
          longitude: 0
        }
      };

      expect(() => {
        executeSyncFallbackForEntry(brokenLunarEntry);
      }).not.toThrow();

      expect(cb).toHaveBeenCalledWith({ annualLunar: [] });
      consoleSpy.mockRestore();
    });

    it('guarantees failsafe callback delivery on thrown errors for EPHEMERIS', () => {
      const cb = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const brokenEphemerisEntry: any = {
        type: 'EPHEMERIS',
        signature: 'BROKEN_EPHEMERIS',
        callbacks: new Set([cb]),
        params: {
          get latitude() {
            throw new Error('Accessor blown');
          },
          longitude: 0,
          julianDate: 2451545.0,
          timeOfDay: 12,
          calculateLunar: true,
          calculateEclipse: true
        }
      };

      expect(() => {
        executeSyncFallbackForEntry(brokenEphemerisEntry);
      }).not.toThrow();

      expect(cb).toHaveBeenCalledWith(expect.objectContaining({
        lunarEvents: null,
        eclipse: null
      }));
      consoleSpy.mockRestore();
    });
  });
});
