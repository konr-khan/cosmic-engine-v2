import { useState, useEffect, useMemo } from 'react';
import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import { ephemerisWorkerManager } from '../workers/ephemerisWorkerManager';
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
  const [workerState, setWorkerState] = useState<{ payload: EphemerisWorkerPayload; jd: number } | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  // Detect stale epoch on discontinuous jumps (> 0.01 days ~ 14.4 mins)
  const isWorkerEpochStale = !workerState || Math.abs(Number(julianDate) - workerState.jd) > 0.01;
  const activePayload = isWorkerEpochStale ? null : workerState?.payload;

  // Post calculation request to singleton worker manager when inputs change
  useEffect(() => {
    if (!isOrbitalActive || (!isLunarActive && !isEclipseActive)) {
      setWorkerState(null);
      return;
    }

    if (!ephemerisWorkerManager.isAvailable()) {
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);

    const unsubscribe = ephemerisWorkerManager.requestCalculation(
      {
        latitude,
        longitude,
        julianDate,
        timeOfDay,
        calculateLunar: isLunarActive,
        calculateEclipse: isEclipseActive,
        throttleMs
      },
      (payload) => {
        setWorkerState({ payload, jd: Number(julianDate) });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive, throttleMs]);

  // Synchronous calculation fallback (used when worker is unavailable, pending initial result, or epoch is stale on date jumps)
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

  const lunarEvents = activePayload ? activePayload.lunarEvents : (syncResult ? syncResult.lunarEvents : null);
  const eclipse = activePayload ? activePayload.eclipse : (syncResult ? syncResult.eclipse : null);

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
 * Encapsulates LRU cache lookup, render-time key synchronization, worker subscription,
 * and synchronous fallback seeding.
 */
function useAnnualMatrixWorker<TItem>({
  currentKey,
  getCached,
  requestAsync,
  computeAndSeedSync,
  hookLabel
}: UseAnnualMatrixWorkerConfig<TItem>): TItem[] {
  const [activeKey, setActiveKey] = useState(currentKey);
  const [workerMatrix, setWorkerMatrix] = useState<TItem[] | null>(() => getCached() ?? null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  if (activeKey !== currentKey) {
    setActiveKey(currentKey);
    setWorkerMatrix(getCached() ?? null);
  }

  useEffect(() => {
    if (!ephemerisWorkerManager.isAvailable()) {
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);

    const unsubscribe = requestAsync((items) => {
      if (items) {
        setWorkerMatrix(items);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentKey]);

  const hasWorkerMatrix = workerMatrix !== null;
  const syncMatrix = useMemo(() => {
    if (isWorkerActive && hasWorkerMatrix) return null;
    const cached = getCached();
    if (cached) return cached;
    try {
      return computeAndSeedSync();
    } catch (err) {
      console.error(`[${hookLabel}] Synchronous fallback calculation failed:`, err);
      return [];
    }
  }, [currentKey, isWorkerActive, hasWorkerMatrix]);

  return workerMatrix || syncMatrix || [];
}

/**
 * Custom hook to offload annual 365-day solar ephemeris matrix calculation to a Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 */
export const useAnnualSolarWorker = ({ year, latitude }: { year: number; latitude: Latitude }): AnnualSolarMatrixItem[] => {
  return useAnnualMatrixWorker<AnnualSolarMatrixItem>({
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
  });
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
  return useAnnualMatrixWorker<AnnualLunarMatrixItem>({
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
  });
};
