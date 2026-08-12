import { useState, useEffect, useRef, useMemo } from 'react';
import { calculateLunarEvents, calculateEclipseData } from '../utils/cosmicMath';

/**
 * Custom hook to offload heavy Meeus lunar ephemeris and eclipse calculations to a Web Worker.
 * Automatically falls back to synchronous main-thread execution if Web Workers are unsupported or blocked.
 *
 * @param {Object} params
 * @param {number} params.latitude Observer latitude in degrees
 * @param {number} params.longitude Observer longitude in degrees
 * @param {number} params.julianDate Current Julian Date
 * @param {number} params.timeOfDay Hour of day (0-24)
 * @param {boolean} [params.isLunarActive=true] Whether lunar almanac events are requested
 * @param {boolean} [params.isEclipseActive=true] Whether eclipse data is requested
 * @param {boolean} [params.isOrbitalActive=true] Whether orbital data calculation is active
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
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(() => typeof Worker !== 'undefined');
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Initialize Web Worker instance if supported
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      setIsWorkerAvailable(false);
      return;
    }

    try {
      const worker = new Worker(
        new URL('../workers/ephemerisWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        const { type, id, payload } = event.data || {};
        if (type === 'EPHEMERIS_SUCCESS' && id === requestIdRef.current) {
          setWorkerResult(payload);
        }
      };

      worker.onerror = () => {
        setIsWorkerAvailable(false);
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      setIsWorkerAvailable(false);
    }
  }, []);

  // Post calculation request to worker when inputs change
  useEffect(() => {
    if (!isOrbitalActive || (!isLunarActive && !isEclipseActive)) {
      setWorkerResult(null);
      return;
    }

    if (!isWorkerAvailable || !workerRef.current) {
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      workerRef.current.postMessage({
        type: 'CALCULATE_EPHEMERIS',
        id: requestId,
        payload: {
          latitude,
          longitude,
          julianDate,
          timeOfDay,
          calculateLunar: isLunarActive,
          calculateEclipse: isEclipseActive
        }
      });
    } catch {
      setIsWorkerAvailable(false);
    }
  }, [latitude, longitude, julianDate, timeOfDay, isLunarActive, isEclipseActive, isOrbitalActive, isWorkerAvailable]);

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
  if (!isWorkerAvailable) {
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
