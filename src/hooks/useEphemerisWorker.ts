import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import { ephemerisWorkerManager, EphemerisSubscription } from '../workers/ephemerisWorkerManager';
import { EphemerisWorkerPayload } from '../types/worker';
import { LunarEvents, EclipseData, AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude, JulianDate, HoursDecimal } from '../types/units';
import {
  sanitizeYear,
  sanitizeLatitude,
  sanitizeLongitude,
  sanitizeJulianDate,
  sanitizeTimeOfDay
} from '../workers/workerSanitizers';

export interface UseEphemerisWorkerParams {
  latitude: Latitude;
  longitude: Longitude;
  julianDate: JulianDate | number;
  timeOfDay: HoursDecimal;
  isLunarActive?: boolean;
  isEclipseActive?: boolean;
  isOrbitalActive?: boolean;
  throttleMs?: number;
}

export interface UseEphemerisWorkerResult {
  lunarEvents: LunarEvents | null;
  eclipse: EclipseData | null;
  isWorkerActive: boolean;
}

/**
 * Custom hook to offload heavy Meeus lunar ephemeris and eclipse calculations to a singleton Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 */
export const useEphemerisWorker = ({
  latitude,
  longitude,
  julianDate,
  timeOfDay,
  isLunarActive = true,
  isEclipseActive = true,
  isOrbitalActive = true,
  throttleMs = 100
}: UseEphemerisWorkerParams): UseEphemerisWorkerResult => {
  const [workerState, setWorkerState] = useState<{
    payload: EphemerisWorkerPayload;
    jd: number;
    lat: number;
    lon: number;
  } | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());
  const subscriptionRef = useRef<EphemerisSubscription | null>(null);

  // Detect stale epoch or location jumps (> 0.01 days ~ 14.4 mins or > 0.05 deg)
  const isWorkerEpochStale =
    !workerState ||
    Math.abs(Number(julianDate) - workerState.jd) > 0.01 ||
    Math.abs(Number(latitude) - workerState.lat) > 0.05 ||
    Math.abs(Number(longitude) - workerState.lon) > 0.05;
  const activePayload = isWorkerEpochStale ? null : workerState?.payload;

  // Dispose persistent subscription strictly on unmount (never mid-flight across 60 FPS frame ticks)
  useEffect(() => {
    return () => {
      subscriptionRef.current?.dispose();
      subscriptionRef.current = null;
    };
  }, []);

  // Post calculation updates via persistent worker channel when inputs change
  useEffect(() => {
    if (!isOrbitalActive || (!isLunarActive && !isEclipseActive)) {
      subscriptionRef.current?.dispose();
      subscriptionRef.current = null;
      setWorkerState(null);
      return;
    }

    if (!ephemerisWorkerManager.isAvailable()) {
      subscriptionRef.current?.dispose();
      subscriptionRef.current = null;
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);
    if (!subscriptionRef.current) {
      subscriptionRef.current = ephemerisWorkerManager.createEphemerisSubscription();
    }

    subscriptionRef.current.update(
      {
        latitude,
        longitude,
        julianDate,
        timeOfDay,
        calculateLunar: isLunarActive,
        calculateEclipse: isEclipseActive,
        throttleMs
      },
      (payload, resolvedJd, resolvedLat, resolvedLon) => {
        setWorkerState({ payload, jd: resolvedJd, lat: resolvedLat, lon: resolvedLon });
      }
    );
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive, throttleMs]);

  // Synchronous calculation fallback (used when worker is unavailable, pending initial result, or epoch/location is stale on jumps)
  const syncResult = useMemo(() => {
    if (!isOrbitalActive) return { lunarEvents: null, eclipse: null };
    if (isWorkerActive && !isWorkerEpochStale && activePayload !== null) return null;

    try {
      const safeLat = sanitizeLatitude(latitude);
      const safeLon = sanitizeLongitude(longitude);
      const safeJD = sanitizeJulianDate(julianDate);
      const safeTime = sanitizeTimeOfDay(timeOfDay);

      const JD_midnight = Number(safeJD) - (safeTime / 24);
      const lunarEvents = isLunarActive 
        ? calculateLunarEvents(safeLat, safeLon, JD_midnight, safeTime)
        : null;
      const eclipse = isEclipseActive
        ? calculateEclipseData(safeJD)
        : null;

      return { lunarEvents, eclipse };
    } catch (err) {
      console.error('[useEphemerisWorker] Synchronous fallback calculation failed:', err);
      return { lunarEvents: null, eclipse: null };
    }
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive, isWorkerActive, isWorkerEpochStale, activePayload]);

  const lunarEvents = isOrbitalActive && isLunarActive
    ? (activePayload ? activePayload.lunarEvents : (syncResult ? syncResult.lunarEvents : null))
    : null;
  const eclipse = isOrbitalActive && isEclipseActive
    ? (activePayload ? activePayload.eclipse : (syncResult ? syncResult.eclipse : null))
    : null;

  return useMemo(() => ({
    lunarEvents,
    eclipse,
    isWorkerActive
  }), [lunarEvents, eclipse, isWorkerActive]);
};

interface UseAnnualMatrixWorkerConfig<TItem> {
  currentKey: string;
  getCached: () => TItem[] | undefined;
  requestAsync: (onItems: (items: TItem[] | undefined) => void) => () => void;
  computeAndSeedSync: () => TItem[];
  hookLabel: string;
}

/**
 * Shared generic hook for annual 365/366-day solar and lunar ephemeris matrices.
 * Encapsulates key-matched state, LRU cache lookup, worker subscription, and synchronous fallback seeding
 * without render-phase setState mutations.
 */
function useAnnualMatrixWorker<TItem>({
  currentKey,
  getCached,
  requestAsync,
  computeAndSeedSync,
  hookLabel
}: UseAnnualMatrixWorkerConfig<TItem>): TItem[] {
  const [workerEntry, setWorkerEntry] = useState<{ key: string; items: TItem[] } | null>(() => {
    const cached = getCached();
    return cached ? { key: currentKey, items: cached } : null;
  });
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  useEffect(() => {
    if (!ephemerisWorkerManager.isAvailable()) {
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);
    let cancelled = false;

    const unsubscribe = requestAsync((items) => {
      if (!cancelled && items) {
        setWorkerEntry((prev) =>
          prev && prev.key === currentKey && prev.items === items
            ? prev
            : { key: currentKey, items }
        );
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentKey, requestAsync]);

  const matchingWorkerItems = workerEntry?.key === currentKey ? workerEntry.items : null;

  // Stale-while-revalidate: once an initial matrix is available and the Web Worker is active,
  // defer subsequent latitude/year recomputations to the worker instead of blocking the main thread.
  const canDeferToWorker = isWorkerActive && (matchingWorkerItems !== null || workerEntry !== null);

  const syncMatrix = useMemo(() => {
    if (canDeferToWorker) return null;
    const cached = getCached();
    if (cached) return cached;
    try {
      return computeAndSeedSync();
    } catch (err) {
      console.error(`[${hookLabel}] Synchronous fallback calculation failed:`, err);
      return [];
    }
  }, [currentKey, canDeferToWorker, getCached, computeAndSeedSync, hookLabel]);

  return matchingWorkerItems ?? (isWorkerActive && workerEntry ? workerEntry.items : syncMatrix) ?? [];
}

/**
 * Custom hook to offload annual 365-day solar ephemeris matrix calculation to a Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 */
export const useAnnualSolarWorker = ({ year, latitude }: { year: number; latitude: Latitude }): AnnualSolarMatrixItem[] => {
  const config = useMemo<UseAnnualMatrixWorkerConfig<AnnualSolarMatrixItem>>(() => ({
    currentKey: `${year}_${latitude}`,
    getCached: () => ephemerisWorkerManager.getCachedAnnualSolar(year, latitude),
    requestAsync: (onItems) =>
      ephemerisWorkerManager.requestAnnualSolarCalculation(
        { year, latitude },
        (payload) => onItems(payload?.annualSolar)
      ),
    computeAndSeedSync: () => {
      const safeYear = sanitizeYear(year);
      const safeLat = sanitizeLatitude(latitude);
      const matrix = calculateAnnualSolarMatrix(safeYear, safeLat);
      ephemerisWorkerManager.seedAnnualSolarCache(year, latitude, matrix);
      return matrix;
    },
    hookLabel: 'useAnnualSolarWorker'
  }), [year, latitude]);

  return useAnnualMatrixWorker<AnnualSolarMatrixItem>(config);
};

/**
 * Custom hook to offload annual 365-day lunar ephemeris matrix calculation to a Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 */
export const useAnnualLunarWorker = ({ 
  year, 
  latitude, 
  longitude 
}: { 
  year: number; 
  latitude: Latitude; 
  longitude: Longitude; 
}): AnnualLunarMatrixItem[] => {
  const config = useMemo<UseAnnualMatrixWorkerConfig<AnnualLunarMatrixItem>>(() => ({
    currentKey: `${year}_${latitude}_${longitude}`,
    getCached: () => ephemerisWorkerManager.getCachedAnnualLunar(year, latitude, longitude),
    requestAsync: (onItems) =>
      ephemerisWorkerManager.requestAnnualLunarCalculation(
        { year, latitude, longitude },
        (payload) => onItems(payload?.annualLunar)
      ),
    computeAndSeedSync: () => {
      const safeYear = sanitizeYear(year);
      const safeLat = sanitizeLatitude(latitude);
      const safeLon = sanitizeLongitude(longitude);
      const matrix = calculateAnnualLunarMatrix(safeYear, safeLat, safeLon);
      ephemerisWorkerManager.seedAnnualLunarCache(year, latitude, longitude, matrix);
      return matrix;
    },
    hookLabel: 'useAnnualLunarWorker'
  }), [year, latitude, longitude]);

  return useAnnualMatrixWorker<AnnualLunarMatrixItem>(config);
};
