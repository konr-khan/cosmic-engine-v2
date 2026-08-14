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
    /** @type {Map<number, (payload: EphemerisWorkerPayload) => void>} */
    this.pendingRequests = new Map();
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
            const callback = this.pendingRequests.get(id);
            if (callback) {
              this.pendingRequests.delete(id);
              callback(payload);
            }
          } else if (type === 'EPHEMERIS_ERROR') {
            this.pendingRequests.delete(id);
          }
        };

        this.worker.onerror = () => {
          this._isAvailable = false;
          this.pendingRequests.clear();
          if (this.worker) {
            try {
              this.worker.terminate();
            } catch {
              // Ignore termination error on failed worker
            }
            this.worker = null;
          }
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
   * Requests an asynchronous ephemeris calculation from the singleton worker.
   * 
   * @param {EphemerisCalculationParams} params
   * @param {(payload: EphemerisWorkerPayload) => void} onResult Callback on successful computation
   * @returns {() => void} Cleanup function to unsubscribe and cancel the pending callback
   */
  requestCalculation(params, onResult) {
    if (!this.isAvailable()) {
      return () => {};
    }

    const worker = this._getWorker();
    if (!worker) {
      return () => {};
    }

    const requestId = ++this.nextRequestId;
    this.pendingRequests.set(requestId, onResult);

    try {
      worker.postMessage({
        type: 'CALCULATE_EPHEMERIS',
        id: requestId,
        payload: {
          latitude: params.latitude,
          longitude: params.longitude,
          julianDate: params.julianDate,
          timeOfDay: params.timeOfDay,
          calculateLunar: params.calculateLunar !== false,
          calculateEclipse: params.calculateEclipse !== false
        }
      });
    } catch {
      this._isAvailable = false;
      this.pendingRequests.delete(requestId);
    }

    return () => {
      this.pendingRequests.delete(requestId);
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
    this._isAvailable = typeof Worker !== 'undefined';
  }
}

export const ephemerisWorkerManager = new EphemerisWorkerManager();
