import { calculateLunarEvents, calculateEclipseData } from '../utils/cosmicMath';

/**
 * Ephemeris Worker Singleton Manager
 * 
 * Manages a single application-level Web Worker instance for Meeus lunar ephemeris
 * and eclipse shadow geometry calculations, multiplexing concurrent calculation requests
 * across mounted dashboard windows to prevent worker thread proliferation.
 */

/**
 * @typedef {Object} EphemerisCalculationParams
 * @property {number} latitude Observer latitude in degrees
 * @property {number} longitude Observer longitude in degrees
 * @property {number} julianDate Current Julian Date
 * @property {number} timeOfDay Hour of day (0-24)
 * @property {boolean} [calculateLunar=true] Whether lunar almanac calculations are requested
 * @property {boolean} [calculateEclipse=true] Whether eclipse geometry calculations are requested
 */

/**
 * @typedef {Object} EphemerisWorkerPayload
 * @property {Object|null} lunarEvents
 * @property {Object|null} eclipse
 * @property {number} timestamp
 */

export class EphemerisWorkerManager {
  constructor() {
    /** @type {Worker|null} */
    this.worker = null;
    /** @type {number} */
    this.nextRequestId = 0;
    /** @type {Map<number, { signature: string, callbacks: Set<(payload: EphemerisWorkerPayload) => void>, params: EphemerisCalculationParams }>} */
    this.pendingRequests = new Map();
    /** @type {Map<string, number>} */
    this.signatureToRequestId = new Map();
    /** @type {boolean} */
    this._isAvailable = typeof Worker !== 'undefined';
  }

  /**
   * Returns whether Web Worker support is available and functional.
   * @returns {boolean}
   */
  isAvailable() {
    return typeof Worker !== 'undefined' && this._isAvailable !== false;
  }

  /**
   * Computes synchronous fallback ephemeris calculations and dispatches to registered callbacks.
   * @private
   * @param {{ signature: string, callbacks: Set<(payload: EphemerisWorkerPayload) => void>, params: EphemerisCalculationParams }} entry
   */
  _executeSyncFallbackForEntry(entry) {
    if (!entry || entry.callbacks.size === 0) return;
    try {
      const { latitude, longitude, julianDate, timeOfDay, calculateLunar, calculateEclipse } = entry.params;
      const JD_midnight = julianDate - (timeOfDay / 24);
      const lunarEvents = calculateLunar
        ? calculateLunarEvents(latitude, longitude, JD_midnight, timeOfDay)
        : null;
      const eclipse = calculateEclipse
        ? calculateEclipseData(julianDate)
        : null;
      const payload = {
        lunarEvents,
        eclipse,
        timestamp: Date.now()
      };
      entry.callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('Ephemeris fallback callback error:', e);
        }
      });
    } catch (e) {
      console.error('Ephemeris synchronous fallback calculation failed:', e);
    }
  }

  /**
   * Handles unexpected worker failure (onerror / postMessage failure) by notifying pending requests
   * via synchronous fallback calculations and safely clearing the worker instance.
   * @private
   * @param {any} [error]
   */
  _handleWorkerFailure(error) {
    this._isAvailable = false;
    const pending = Array.from(this.pendingRequests.values());
    this.pendingRequests.clear();
    this.signatureToRequestId.clear();

    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // Ignore termination error on failed worker
      }
      this.worker = null;
    }

    for (const entry of pending) {
      this._executeSyncFallbackForEntry(entry);
    }
  }

  /**
   * Initializes or retrieves the singleton Web Worker instance.
   * @private
   * @returns {Worker|null}
   */
  _getWorker() {
    if (!this.isAvailable()) {
      return null;
    }

    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('./ephemerisWorker.js', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event) => {
          const { type, id, payload } = event.data || {};
          if (type === 'EPHEMERIS_SUCCESS') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry) {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);
              requestEntry.callbacks.forEach((cb) => {
                try {
                  cb(payload);
                } catch (e) {
                  console.error('Ephemeris callback error:', e);
                }
              });
            }
          } else if (type === 'EPHEMERIS_ERROR') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry) {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);
              this._executeSyncFallbackForEntry(requestEntry);
            }
          }
        };

        this.worker.onerror = (error) => {
          this._handleWorkerFailure(error);
        };
      } catch {
        this._isAvailable = false;
        this.worker = null;
        return null;
      }
    }

    return this.worker;
  }

  /**
   * Requests an asynchronous ephemeris calculation from the singleton worker with in-flight request deduplication.
   * 
   * @param {EphemerisCalculationParams} params
   * @param {(payload: EphemerisWorkerPayload) => void} onResult Callback on successful computation
   * @returns {() => void} Cleanup function to unsubscribe and cancel the pending callback
   */
  requestCalculation(params, onResult) {
    if (!this.isAvailable()) {
      return () => {};
    }

    const calculateLunar = params.calculateLunar !== false;
    const calculateEclipse = params.calculateEclipse !== false;
    const signature = `${params.latitude}_${params.longitude}_${params.julianDate}_${params.timeOfDay}_${calculateLunar}_${calculateEclipse}`;

    // In-flight request deduplication / coalescing
    if (this.signatureToRequestId.has(signature)) {
      const existingId = this.signatureToRequestId.get(signature);
      const existingEntry = this.pendingRequests.get(existingId);
      if (existingEntry) {
        existingEntry.callbacks.add(onResult);
        return () => {
          existingEntry.callbacks.delete(onResult);
        };
      }
    }

    const worker = this._getWorker();
    if (!worker) {
      return () => {};
    }

    const requestId = ++this.nextRequestId;
    const requestEntry = {
      signature,
      callbacks: new Set([onResult]),
      params: {
        latitude: params.latitude,
        longitude: params.longitude,
        julianDate: params.julianDate,
        timeOfDay: params.timeOfDay,
        calculateLunar,
        calculateEclipse
      }
    };

    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(signature, requestId);

    try {
      worker.postMessage({
        type: 'CALCULATE_EPHEMERIS',
        id: requestId,
        payload: requestEntry.params
      });
    } catch (error) {
      this._handleWorkerFailure(error);
    }

    return () => {
      requestEntry.callbacks.delete(onResult);
    };
  }

  /**
   * Terminates the active singleton worker instance and resets pending requests.
   */
  terminate() {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // Ignore termination error
      }
      this.worker = null;
    }
    this.pendingRequests.clear();
    this.signatureToRequestId.clear();
    this._isAvailable = typeof Worker !== 'undefined';
  }
}

export const ephemerisWorkerManager = new EphemerisWorkerManager();
