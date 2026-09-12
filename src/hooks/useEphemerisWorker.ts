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

/**
 * Custom hook to offload annual 365-day solar ephemeris matrix calculation to a Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 */
export const useAnnualSolarWorker = ({ year, latitude }: { year: number; latitude: Latitude }): AnnualSolarMatrixItem[] => {
  const [workerSolar, setWorkerSolar] = useState<AnnualSolarMatrixItem[] | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  useEffect(() => {
    if (!ephemerisWorkerManager.isAvailable()) {
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);

    const unsubscribe = ephemerisWorkerManager.requestAnnualSolarCalculation(
      { year, latitude },
      (payload) => {
        if (payload?.annualSolar) {
          setWorkerSolar(payload.annualSolar);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [year, latitude]);

  const syncSolar = useMemo(() => {
    if (isWorkerActive && workerSolar !== null) return null;
    try {
      const safeYear = sanitizeYear(year);
      const safeLat = sanitizeLatitude(latitude);
      return calculateAnnualSolarMatrix(safeYear, safeLat);
    } catch (err) {
      console.error('[useAnnualSolarWorker] Synchronous fallback calculation failed:', err);
      return [];
    }
  }, [year, latitude, isWorkerActive, workerSolar !== null]);

  return workerSolar || syncSolar || [];
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
  const [workerLunar, setWorkerLunar] = useState<AnnualLunarMatrixItem[] | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  useEffect(() => {
    if (!ephemerisWorkerManager.isAvailable()) {
      setIsWorkerActive(false);
      return;
    }

    setIsWorkerActive(true);

    const unsubscribe = ephemerisWorkerManager.requestAnnualLunarCalculation(
      { year, latitude, longitude },
      (payload) => {
        if (payload?.annualLunar) {
          setWorkerLunar(payload.annualLunar);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [year, latitude, longitude]);

  const syncLunar = useMemo(() => {
    if (isWorkerActive && workerLunar !== null) return null;
    try {
      const safeYear = sanitizeYear(year);
      const safeLat = sanitizeLatitude(latitude);
      const safeLon = sanitizeLongitude(longitude);
      return calculateAnnualLunarMatrix(safeYear, safeLat, safeLon);
    } catch (err) {
      console.error('[useAnnualLunarWorker] Synchronous fallback calculation failed:', err);
      return [];
    }
  }, [year, latitude, longitude, isWorkerActive, workerLunar !== null]);

  return workerLunar || syncLunar || [];
};

