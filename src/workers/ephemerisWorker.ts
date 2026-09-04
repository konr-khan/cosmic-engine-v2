import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import { EphemerisWorkerRequest, EphemerisWorkerResponse } from '../types/worker';

/**
 * Dedicated Web Worker for off-main-thread Meeus lunar ephemeris,
 * syzygy eclipse shadow geometry, and annual solar/lunar ephemeris matrix calculations.
 */
self.onmessage = (event: MessageEvent<EphemerisWorkerRequest>) => {
  const message = event.data;
  if (!message) return;

  const { type, id } = message;

  if (type === 'CALCULATE_EPHEMERIS') {
    try {
      const {
        latitude,
        longitude,
        julianDate,
        timeOfDay,
        calculateLunar = true,
        calculateEclipse = true
      } = message.payload || {};

      const JD_midnight = julianDate - (timeOfDay / 24);

      const lunarEvents = calculateLunar
        ? calculateLunarEvents(latitude, longitude, JD_midnight, timeOfDay)
        : null;

      const eclipse = calculateEclipse
        ? calculateEclipseData(julianDate)
        : null;

      const response: EphemerisWorkerResponse = {
        type: 'EPHEMERIS_SUCCESS',
        id,
        payload: {
          lunarEvents,
          eclipse,
          timestamp: Date.now()
        }
      };
      self.postMessage(response);
    } catch (error) {
      const response: EphemerisWorkerResponse = {
        type: 'EPHEMERIS_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Ephemeris worker calculation failed'
      };
      self.postMessage(response);
    }
  } else if (type === 'CALCULATE_ANNUAL_SOLAR') {
    try {
      const { year, latitude } = message.payload || {};
      const annualSolar = calculateAnnualSolarMatrix(year, latitude);

      const response: EphemerisWorkerResponse = {
        type: 'ANNUAL_SOLAR_SUCCESS',
        id,
        payload: {
          annualSolar
        }
      };
      self.postMessage(response);
    } catch (error) {
      const response: EphemerisWorkerResponse = {
        type: 'ANNUAL_SOLAR_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Annual solar worker calculation failed'
      };
      self.postMessage(response);
    }
  } else if (type === 'CALCULATE_ANNUAL_LUNAR') {
    try {
      const { year, latitude, longitude } = message.payload || {};
      const annualLunar = calculateAnnualLunarMatrix(year, latitude, longitude);

      const response: EphemerisWorkerResponse = {
        type: 'ANNUAL_LUNAR_SUCCESS',
        id,
        payload: {
          annualLunar
        }
      };
      self.postMessage(response);
    } catch (error) {
      const response: EphemerisWorkerResponse = {
        type: 'ANNUAL_LUNAR_ERROR',
        id,
        error: error instanceof Error ? error.message : 'Annual lunar worker calculation failed'
      };
      self.postMessage(response);
    }
  }
};
