import { useState, useEffect, useMemo } from 'react';
import { calculateLunarEvents, calculateEclipseData } from '../utils/cosmicMath';
import { ephemerisWorkerManager } from '../workers/ephemerisWorkerManager';

/**
 * Custom hook to offload heavy Meeus lunar ephemeris and eclipse calculations to a singleton Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported, blocked, or pending.
 *
 * @param {Object} params
 * @param {number} params.latitude Observer latitude in degrees
 * @param {number} params.longitude Observer longitude in degrees
 * @param {number} params.julianDate Current Julian Date
 * @param {number} params.timeOfDay Hour of day (0-24)
 * @param {boolean} [params.isLunarActive=true] Whether lunar almanac events are requested
 * @param {boolean} [params.isEclipseActive=true] Whether eclipse data is requested
 * @param {boolean} [params.isOrbitalActive=true] Whether orbital data calculation is active
 * @returns {{
 *   lunarEvents: Object|null,
 *   eclipse: Object|null,
 *   isWorkerActive: boolean
 * }}
 */
export const useEphemerisWorker = ({
  latitude,
  longitude,
  julianDate,
  timeOfDay,
  isLunarActive = true,
  isEclipseActive = true,
  isOrbitalActive = true
}) => {
  const [workerResult, setWorkerResult] = useState(null);
  const [isWorkerActive, setIsWorkerActive] = useState(() => ephemerisWorkerManager.isAvailable());

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
