import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';

/**
 * Dedicated Web Worker for off-main-thread Meeus lunar ephemeris,
 * syzygy eclipse shadow geometry, and annual solar/lunar ephemeris matrix calculations.
 */
self.onmessage = (event: MessageEvent) => {
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
        error: error instanceof Error ? error.message : 'Ephemeris worker calculation failed'
      });
    }
  } else if (type === 'CALCULATE_ANNUAL_SOLAR') {
    try {
      const { year, latitude } = payload || {};
      const annualSolar = calculateAnnualSolarMatrix(year, latitude);

      self.postMessage({
        type: 'ANNUAL_SOLAR_SUCCESS',
        id,
        payload: {
          annualSolar
        }
      });
    } catch (error) {
      self.postMessage({
        type: 'ANNUAL_SOLAR_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Annual solar worker calculation failed'
      });
    }
  } else if (type === 'CALCULATE_ANNUAL_LUNAR') {
    try {
      const { year, latitude, longitude } = payload || {};
      const annualLunar = calculateAnnualLunarMatrix(year, latitude, longitude);

      self.postMessage({
        type: 'ANNUAL_LUNAR_SUCCESS',
        id,
        payload: {
          annualLunar
        }
      });
    } catch (error) {
      self.postMessage({
        type: 'ANNUAL_LUNAR_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Annual lunar worker calculation failed'
      });
    }
  }
};
