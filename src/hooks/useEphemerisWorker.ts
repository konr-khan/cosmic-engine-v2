import { useState, useEffect, useMemo } from 'react';
import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import { ephemerisWorkerManager } from '../workers/ephemerisWorkerManager';
import { EphemerisCalculationParams, EphemerisWorkerPayload } from '../types/worker';
import { LunarEvents, EclipseData, AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude, JulianDate, HoursDecimal } from '../types/units';

export interface UseEphemerisWorkerParams {
  latitude: Latitude;
  longitude: Longitude;
  julianDate: JulianDate | number;
  timeOfDay: HoursDecimal;
  isLunarActive?: boolean;
  isEclipseActive?: boolean;
  isOrbitalActive?: boolean;
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
  isOrbitalActive = true
}: UseEphemerisWorkerParams): UseEphemerisWorkerResult => {
  const [workerResult, setWorkerResult] = useState<EphemerisWorkerPayload | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(() => ephemerisWorkerManager.isAvailable());

  // Post calculation request to singleton worker manager when inputs change
  useEffect(() => {
    if (!isOrbitalActive || (!isLunarActive && !isEclipseActive)) {
      setWorkerResult(null);
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
        calculateEclipse: isEclipseActive
      },
      (payload) => {
        setWorkerResult(payload);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive]);

  // Synchronous calculation fallback (used when worker is unavailable or pending initial result)
  const syncResult = useMemo(() => {
    if (!isOrbitalActive) return { lunarEvents: null, eclipse: null };

    const JD_midnight = julianDate - (timeOfDay / 24);
    const lunarEvents = isLunarActive 
      ? calculateLunarEvents(latitude, longitude, JD_midnight, timeOfDay)
      : null;
    const eclipse = isEclipseActive
      ? calculateEclipseData(julianDate)
      : null;

    return { lunarEvents, eclipse };
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive]);

  // If worker is unavailable, return synchronous fallback immediately.
  // If worker is available, prefer workerResult if available, fallback to syncResult.
  if (!isWorkerActive) {
    return {
      lunarEvents: syncResult.lunarEvents,
      eclipse: syncResult.eclipse,
      isWorkerActive: false
    };
  }

  return {
    lunarEvents: workerResult ? workerResult.lunarEvents : syncResult.lunarEvents,
    eclipse: workerResult ? workerResult.eclipse : syncResult.eclipse,
    isWorkerActive: true
  };
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
    return calculateAnnualSolarMatrix(year, latitude);
  }, [year, latitude]);

  if (!isWorkerActive) {
    return syncSolar;
  }

  return workerSolar || syncSolar;
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
    return calculateAnnualLunarMatrix(year, latitude, longitude);
  }, [year, latitude, longitude]);

  if (!isWorkerActive) {
    return syncLunar;
  }

  return workerLunar || syncLunar;
};
