/**
 * @file workerFallback.ts
 * Synchronous ephemeris fallback routines and failsafe execution handlers.
 * Used when Web Workers are unavailable or requests encounter timeouts / unexpected errors.
 * Ensures off-thread calculations can execute deterministically on the main thread
 * without zombie promises or hung UI callbacks.
 */

import {
  calculateLunarEvents,
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import {
  EphemerisWorkerPayload,
  PendingRequestEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude, JulianDate, HoursDecimal } from '../types/units';
import { LruCache } from '../utils/lruCache';
import {
  sanitizeYear,
  sanitizeLatitude,
  sanitizeLongitude,
  sanitizeJulianDate,
  sanitizeTimeOfDay
} from './workerSanitizers';

/**
 * Cache setter callback signature compatible with EphemerisWorkerManager._setInAnnualCache.
 */
export type AnnualCacheSetter = <T>(
  cache: Map<string, T> | LruCache<string, T>,
  key: string,
  value: T
) => void;

/**
 * Result returned by synchronous annual solar fallback calculation.
 */
export interface SyncAnnualSolarFallbackResult {
  annualSolar: AnnualSolarMatrixItem[];
}

/**
 * Result returned by synchronous annual lunar fallback calculation.
 */
export interface SyncAnnualLunarFallbackResult {
  annualLunar: AnnualLunarMatrixItem[];
}

/**
 * Instantaneous ephemeris calculation parameters for fallback execution.
 */
export interface SyncEphemerisFallbackParams {
  latitude: Latitude | number;
  longitude: Longitude | number;
  julianDate: JulianDate | number;
  timeOfDay: HoursDecimal | number;
  calculateLunar?: boolean;
  calculateEclipse?: boolean;
}

/**
 * Executes a synchronous calculation of the 365-day annual solar ephemeris matrix,
 * optionally updating an LRU/Map cache via setter callback.
 *
 * @param year - Calendar year (will be clamped/sanitized)
 * @param latitude - Observer geographic latitude
 * @param signature - Optional cache key signature
 * @param cache - Optional cache instance
 * @param setInCache - Optional setter callback (e.g. manager._setInAnnualCache)
 * @returns Result object containing `annualSolar`
 */
export function executeSyncAnnualSolarFallback(
  year: number,
  latitude: Latitude | number,
  signature?: string,
  cache?: Map<string, AnnualSolarMatrixItem[]> | LruCache<string, AnnualSolarMatrixItem[]>,
  setInCache?: AnnualCacheSetter
): SyncAnnualSolarFallbackResult {
  let annualSolar: AnnualSolarMatrixItem[] = [];
  try {
    const safeYear = sanitizeYear(year);
    const safeLat = sanitizeLatitude(latitude);
    annualSolar = calculateAnnualSolarMatrix(safeYear, safeLat);
    if (signature && cache) {
      if (setInCache) {
        setInCache(cache, signature, annualSolar);
      } else if (cache instanceof LruCache || cache instanceof Map) {
        cache.set(signature, annualSolar);
      }
    }
  } catch (calcError) {
    console.error('[WorkerFallback] Annual solar sync calculation failed:', calcError);
  }
  return { annualSolar };
}

/**
 * Executes a synchronous calculation of the 365-day annual lunar ephemeris matrix,
 * optionally updating an LRU/Map cache via setter callback.
 *
 * @param year - Calendar year (will be clamped/sanitized)
 * @param latitude - Observer geographic latitude
 * @param longitude - Observer geographic longitude
 * @param signature - Optional cache key signature
 * @param cache - Optional cache instance
 * @param setInCache - Optional setter callback (e.g. manager._setInAnnualCache)
 * @returns Result object containing `annualLunar`
 */
export function executeSyncAnnualLunarFallback(
  year: number,
  latitude: Latitude | number,
  longitude: Longitude | number,
  signature?: string,
  cache?: Map<string, AnnualLunarMatrixItem[]> | LruCache<string, AnnualLunarMatrixItem[]>,
  setInCache?: AnnualCacheSetter
): SyncAnnualLunarFallbackResult {
  let annualLunar: AnnualLunarMatrixItem[] = [];
  try {
    const safeYear = sanitizeYear(year);
    const safeLat = sanitizeLatitude(latitude);
    const safeLon = sanitizeLongitude(longitude);
    annualLunar = calculateAnnualLunarMatrix(safeYear, safeLat, safeLon);
    if (signature && cache) {
      if (setInCache) {
        setInCache(cache, signature, annualLunar);
      } else if (cache instanceof LruCache || cache instanceof Map) {
        cache.set(signature, annualLunar);
      }
    }
  } catch (calcError) {
    console.error('[WorkerFallback] Annual lunar sync calculation failed:', calcError);
  }
  return { annualLunar };
}

/**
 * Executes a synchronous calculation of instantaneous ephemerides (lunar events and syzygy eclipses).
 *
 * @param params - Instantaneous calculation parameters
 * @returns EphemerisWorkerPayload
 */
export function executeSyncEphemerisFallback(
  params: SyncEphemerisFallbackParams
): EphemerisWorkerPayload {
  let lunarEvents = null;
  let eclipse = null;

  try {
    const safeLat = sanitizeLatitude(params.latitude);
    const safeLon = sanitizeLongitude(params.longitude);
    const safeJD = sanitizeJulianDate(params.julianDate);
    const safeTime = sanitizeTimeOfDay(params.timeOfDay);
    const { calculateLunar, calculateEclipse } = params;

    if (calculateLunar) {
      try {
        const JD_midnight = Number(safeJD) - (Number(safeTime) / 24);
        lunarEvents = calculateLunarEvents(safeLat, safeLon, JD_midnight, safeTime);
      } catch (lunarError) {
        console.error('[WorkerFallback] Lunar events fallback calculation failed:', lunarError);
      }
    }

    if (calculateEclipse) {
      try {
        eclipse = calculateEclipseData(safeJD);
      } catch (eclipseError) {
        console.error('[WorkerFallback] Eclipse fallback calculation failed:', eclipseError);
      }
    }
  } catch (error) {
    console.error('[WorkerFallback] Ephemeris fallback parameter processing failed:', error);
  }

  return {
    lunarEvents,
    eclipse,
    timestamp: Date.now()
  };
}

/**
 * Dispatches synchronous fallback calculations for any pending worker request entry
 * (ANNUAL_SOLAR, ANNUAL_LUNAR, or EPHEMERIS), delivering results to all registered callbacks.
 * Catches all calculation and dispatch errors with a failsafe dispatch ensuring no subscriber
 * is left in an unfulfilled zombie state.
 *
 * @param entry - The pending request entry containing type, parameters, and callback set
 * @param annualSolarCache - Optional annual solar LRU/Map cache
 * @param annualLunarCache - Optional annual lunar LRU/Map cache
 * @param setInCache - Optional cache setter callback
 */
export function executeSyncFallbackForEntry(
  entry: PendingRequestEntry,
  annualSolarCache?: Map<string, AnnualSolarMatrixItem[]> | LruCache<string, AnnualSolarMatrixItem[]>,
  annualLunarCache?: Map<string, AnnualLunarMatrixItem[]> | LruCache<string, AnnualLunarMatrixItem[]>,
  setInCache?: AnnualCacheSetter
): void {
  if (!entry || !entry.callbacks || entry.callbacks.size === 0) return;

  try {
    if (entry.type === 'ANNUAL_SOLAR') {
      const payload = executeSyncAnnualSolarFallback(
        entry.params.year,
        entry.params.latitude,
        entry.signature,
        annualSolarCache,
        setInCache
      );
      entry.callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('[WorkerFallback] Annual solar fallback callback error:', e);
        }
      });
    } else if (entry.type === 'ANNUAL_LUNAR') {
      const payload = executeSyncAnnualLunarFallback(
        entry.params.year,
        entry.params.latitude,
        entry.params.longitude,
        entry.signature,
        annualLunarCache,
        setInCache
      );
      entry.callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('[WorkerFallback] Annual lunar fallback callback error:', e);
        }
      });
    } else {
      const payload = executeSyncEphemerisFallback(entry.params);
      entry.callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('[WorkerFallback] Ephemeris fallback callback error:', e);
        }
      });
    }
  } catch (e) {
    console.error('[WorkerFallback] Ephemeris synchronous fallback calculation failed:', e);
    // Failsafe callback dispatch: never leave callers hung in a zombie state
    try {
      if (entry.type === 'ANNUAL_SOLAR') {
        (entry.callbacks as Set<(p: any) => void>).forEach((cb) => {
          try { cb({ annualSolar: [] }); } catch {}
        });
      } else if (entry.type === 'ANNUAL_LUNAR') {
        (entry.callbacks as Set<(p: any) => void>).forEach((cb) => {
          try { cb({ annualLunar: [] }); } catch {}
        });
      } else {
        (entry.callbacks as Set<(p: any) => void>).forEach((cb) => {
          try { cb({ lunarEvents: null, eclipse: null, timestamp: Date.now() }); } catch {}
        });
      }
    } catch {}
  }
}
