import { calculateLunarEvents, calculateEclipseData } from '../utils/cosmicMath';

/**
 * Dedicated Web Worker for off-main-thread Meeus lunar ephemeris
 * and syzygy eclipse shadow geometry calculations.
 */
self.onmessage = (event) => {
  const { type, id, payload } = event.data || {};

  if (type === 'CALCULATE_EPHEMERIS') {
    try {
      const {
        latitude,
        longitude,
        julianDate,
        timeOfDay,
        calculateLunar = true,
        calculateEclipse = true
      } = payload || {};

      const JD_midnight = julianDate - (timeOfDay / 24);

      const lunarEvents = calculateLunar
        ? calculateLunarEvents(latitude, longitude, JD_midnight, timeOfDay)
        : null;

      const eclipse = calculateEclipse
        ? calculateEclipseData(julianDate)
        : null;

      self.postMessage({
        type: 'EPHEMERIS_SUCCESS',
        id,
        payload: {
          lunarEvents,
          eclipse,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      self.postMessage({
        type: 'EPHEMERIS_ERROR',
        id,
        error: error?.message || 'Ephemeris worker calculation failed'
      });
    }
  }
};
