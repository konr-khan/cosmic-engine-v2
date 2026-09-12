import { 
  calculateLunarEvents, 
  calculateEclipseData,
  calculateAnnualSolarMatrix,
  calculateAnnualLunarMatrix
} from '../utils/cosmicMath';
import { 
  EphemerisCalculationParams, 
  EphemerisWorkerPayload,
  EphemerisWorkerRequest,
  EphemerisWorkerResponse,
  PendingRequestEntry,
  PendingEphemerisEntry,
  PendingAnnualSolarEntry,
  PendingAnnualLunarEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude } from '../types/units';
import { LruCache } from '../utils/lruCache';

export interface PendingThrottledEphemerisEntry {
  signature: string;
  params: EphemerisCalculationParams;
  calculateLunar: boolean;
  calculateEclipse: boolean;
  callbacks: Set<(payload: EphemerisWorkerPayload) => void>;
  dispatchedEntry: PendingEphemerisEntry | null;
}

export type { 
  PendingRequestEntry, 
  PendingEphemerisEntry, 
  PendingAnnualSolarEntry, 
  PendingAnnualLunarEntry 
};

/**
 * Ephemeris Worker Singleton Manager
 * 
 * Manages a single application-level Web Worker instance for Meeus lunar ephemeris,
 * syzygy eclipse shadow geometry, and annual solar/lunar ephemeris matrix calculations,
 * multiplexing concurrent calculation requests across mounted dashboard windows to prevent
 * worker thread proliferation.
 */
export class EphemerisWorkerManager {
  public static readonly MAX_ANNUAL_CACHE_SIZE = 16;

  /**
   * Sets an entry into an annual matrix cache using an LRU eviction policy capped at MAX_ANNUAL_CACHE_SIZE.
   */
  public _setInAnnualCache<T>(cache: Map<string, T> | LruCache<string, T>, key: string, value: T): void {
    if (cache instanceof LruCache) {
      cache.set(key, value);
    } else {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= EphemerisWorkerManager.MAX_ANNUAL_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }
      cache.set(key, value);
    }
  }

  /**
   * Retrieves an entry from an annual matrix cache and promotes it to most recently used.
   */
  public _getFromAnnualCache<T>(cache: Map<string, T> | LruCache<string, T>, key: string): T | undefined {
    if (cache instanceof LruCache) {
      return cache.get(key);
    }
    const value = cache.get(key);
    if (value !== undefined) {
      cache.delete(key);
      cache.set(key, value);
    }
    return value;
  }

  public worker: Worker | null;
  public nextRequestId: number;
  public pendingRequests: Map<number, PendingRequestEntry>;
  public signatureToRequestId: Map<string, number>;
  public annualSolarCache: Map<string, AnnualSolarMatrixItem[]>;
  public annualLunarCache: Map<string, AnnualLunarMatrixItem[]>;
  public requestTimeouts: Map<number, ReturnType<typeof setTimeout>>;
  public _isAvailable: boolean;
  public latestProcessedEphemerisId: number;
  public lastEphemerisDispatchTime: number;
  public ephemerisThrottleTimer: ReturnType<typeof setTimeout> | null;
  public pendingThrottledEntry: PendingThrottledEphemerisEntry | null;

  constructor() {
    this.worker = null;
    this.nextRequestId = 0;
    this.pendingRequests = new Map();
    this.signatureToRequestId = new Map();
    this.annualSolarCache = new Map();
    this.annualLunarCache = new Map();
    this.requestTimeouts = new Map();
    this._isAvailable = typeof Worker !== 'undefined';
    this.latestProcessedEphemerisId = 0;
    this.lastEphemerisDispatchTime = 0;
    this.ephemerisThrottleTimer = null;
    this.pendingThrottledEntry = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.terminate());
      window.addEventListener('pagehide', () => this.terminate());
    }
  }

  /**
   * Returns whether Web Worker support is available and functional.
   */
  isAvailable(): boolean {
    return typeof Worker !== 'undefined' && this._isAvailable !== false;
  }

  /**
   * Computes synchronous fallback ephemeris calculations and dispatches to registered callbacks.
   */
  public _executeSyncFallbackForEntry(entry: PendingRequestEntry): void {
    if (!entry || entry.callbacks.size === 0) return;
    try {
      if (entry.type === 'ANNUAL_SOLAR') {
        const { year, latitude } = entry.params;
        const annualSolar = calculateAnnualSolarMatrix(year, latitude);
        this._setInAnnualCache(this.annualSolarCache, entry.signature, annualSolar);
        const payload = { annualSolar };
        entry.callbacks.forEach((cb) => {
          try {
            cb(payload);
          } catch (e) {
            console.error('Annual solar fallback callback error:', e);
          }
        });
      } else if (entry.type === 'ANNUAL_LUNAR') {
        const { year, latitude, longitude } = entry.params;
        const annualLunar = calculateAnnualLunarMatrix(year, latitude, longitude);
        this._setInAnnualCache(this.annualLunarCache, entry.signature, annualLunar);
        const payload = { annualLunar };
        entry.callbacks.forEach((cb) => {
          try {
            cb(payload);
          } catch (e) {
            console.error('Annual lunar fallback callback error:', e);
          }
        });
      } else {
        const { latitude, longitude, julianDate, timeOfDay, calculateLunar, calculateEclipse } = entry.params;
        const JD_midnight = julianDate - (timeOfDay / 24);
        const lunarEvents = calculateLunar
          ? calculateLunarEvents(latitude, longitude, JD_midnight, timeOfDay)
          : null;
        const eclipse = calculateEclipse
          ? calculateEclipseData(julianDate)
          : null;
        const payload: EphemerisWorkerPayload = {
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
      }
    } catch (e) {
      console.error('Ephemeris synchronous fallback calculation failed:', e);
    }
  }

  /**
   * Sets a safety timeout guard for a dispatched worker request.
   * If the worker hangs or fails to respond within ms (default 5000ms),
   * the timeout callback invokes synchronous fallback and cleans up.
   */
  public _setRequestTimeout(requestId: number, entry: PendingRequestEntry, ms: number = 5000): void {
    this._clearRequestTimeout(requestId);
    const timer = setTimeout(() => {
      this.requestTimeouts.delete(requestId);
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        this.signatureToRequestId.delete(pending.signature);
        console.warn(`[EphemerisWorkerManager] Request ${requestId} (${pending.type}) timed out after ${ms}ms; invoking synchronous fallback.`);
        this._executeSyncFallbackForEntry(pending);
      }
    }, ms);
    this.requestTimeouts.set(requestId, timer);
  }

  /**
   * Clears any active timeout guard for a completed or cancelled request.
   */
  public _clearRequestTimeout(requestId: number): void {
    const timer = this.requestTimeouts.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.requestTimeouts.delete(requestId);
    }
  }

  /**
   * Handles unexpected worker failure (onerror / postMessage failure) by notifying pending requests
   * via synchronous fallback calculations and safely clearing the worker instance.
   */
  public _handleWorkerFailure(error?: unknown): void {
    this._isAvailable = false;
    if (this.ephemerisThrottleTimer) {
      clearTimeout(this.ephemerisThrottleTimer);
      this.ephemerisThrottleTimer = null;
    }
    for (const timer of this.requestTimeouts.values()) {
      clearTimeout(timer);
    }
    this.requestTimeouts.clear();
    const pending = Array.from(this.pendingRequests.values());
    if (this.pendingThrottledEntry && this.pendingThrottledEntry.callbacks.size > 0) {
      const throttled = this.pendingThrottledEntry;
      pending.push({
        type: 'EPHEMERIS',
        signature: throttled.signature,
        callbacks: throttled.callbacks,
        params: {
          latitude: throttled.params.latitude,
          longitude: throttled.params.longitude,
          julianDate: throttled.params.julianDate,
          timeOfDay: throttled.params.timeOfDay,
          calculateLunar: throttled.calculateLunar,
          calculateEclipse: throttled.calculateEclipse
        }
      });
    }
    this.pendingThrottledEntry = null;
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
   */
  public _getWorker(): Worker | null {
    if (!this.isAvailable()) {
      return null;
    }

    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('./ephemerisWorker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent<EphemerisWorkerResponse>) => {
          const response = event.data;
          if (!response) return;
          const { type, id } = response;
          if (typeof id === 'number') {
            this._clearRequestTimeout(id);
          }
          if (type === 'EPHEMERIS_SUCCESS') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry && requestEntry.type === 'EPHEMERIS') {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);

              // Discard stale responses that completed out of order
              if (id < this.latestProcessedEphemerisId) {
                return;
              }
              this.latestProcessedEphemerisId = id;

              requestEntry.callbacks.forEach((cb) => {
                try {
                  cb(response.payload);
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
              if (id >= this.latestProcessedEphemerisId) {
                this._executeSyncFallbackForEntry(requestEntry);
              }
            }
          } else if (type === 'ANNUAL_SOLAR_SUCCESS') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry && requestEntry.type === 'ANNUAL_SOLAR') {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);
              if (response.payload?.annualSolar) {
                this._setInAnnualCache(this.annualSolarCache, requestEntry.signature, response.payload.annualSolar);
              }
              requestEntry.callbacks.forEach((cb) => {
                try {
                  cb(response.payload);
                } catch (e) {
                  console.error('Annual solar callback error:', e);
                }
              });
            }
          } else if (type === 'ANNUAL_SOLAR_ERROR') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry) {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);
              this._executeSyncFallbackForEntry(requestEntry);
            }
          } else if (type === 'ANNUAL_LUNAR_SUCCESS') {
            const requestEntry = this.pendingRequests.get(id);
            if (requestEntry && requestEntry.type === 'ANNUAL_LUNAR') {
              this.pendingRequests.delete(id);
              this.signatureToRequestId.delete(requestEntry.signature);
              if (response.payload?.annualLunar) {
                this._setInAnnualCache(this.annualLunarCache, requestEntry.signature, response.payload.annualLunar);
              }
              requestEntry.callbacks.forEach((cb) => {
                try {
                  cb(response.payload);
                } catch (e) {
                  console.error('Annual lunar callback error:', e);
                }
              });
            }
          } else if (type === 'ANNUAL_LUNAR_ERROR') {
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
   * Internal helper to dispatch an ephemeris calculation request directly to the worker.
   */
  public _dispatchEphemerisRequest(
    signature: string,
    params: EphemerisCalculationParams & { calculateLunar?: boolean; calculateEclipse?: boolean },
    calculateLunar: boolean,
    calculateEclipse: boolean,
    onResult: (payload: EphemerisWorkerPayload) => void
  ): () => void {
    const worker = this._getWorker();
    if (!worker) {
      return () => {};
    }

    const requestId = ++this.nextRequestId;
    const requestEntry: PendingEphemerisEntry = {
      type: 'EPHEMERIS',
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
    this._setRequestTimeout(requestId, requestEntry);

    try {
      const message: EphemerisWorkerRequest = {
        type: 'CALCULATE_EPHEMERIS',
        id: requestId,
        payload: requestEntry.params
      };
      worker.postMessage(message);
    } catch (error) {
      this._handleWorkerFailure(error);
    }

    return () => {
      requestEntry.callbacks.delete(onResult);
    };
  }

  /**
   * Dispatches the pending throttled entry to the worker once the throttle interval elapses.
   */
  public _dispatchPendingThrottledEntry(): void {
    if (!this.pendingThrottledEntry) return;
    const entry = this.pendingThrottledEntry;
    this.pendingThrottledEntry = null;

    if (entry.callbacks.size === 0) return;

    const worker = this._getWorker();
    if (!worker) return;

    const requestId = ++this.nextRequestId;
    const requestEntry: PendingEphemerisEntry = {
      type: 'EPHEMERIS',
      signature: entry.signature,
      callbacks: new Set(entry.callbacks),
      params: {
        latitude: entry.params.latitude,
        longitude: entry.params.longitude,
        julianDate: entry.params.julianDate,
        timeOfDay: entry.params.timeOfDay,
        calculateLunar: entry.calculateLunar,
        calculateEclipse: entry.calculateEclipse
      }
    };

    entry.dispatchedEntry = requestEntry;
    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(entry.signature, requestId);
    this._setRequestTimeout(requestId, requestEntry);

    try {
      const message: EphemerisWorkerRequest = {
        type: 'CALCULATE_EPHEMERIS',
        id: requestId,
        payload: requestEntry.params
      };
      worker.postMessage(message);
    } catch (error) {
      this._handleWorkerFailure(error);
    }
  }

  /**
   * Requests an asynchronous ephemeris calculation from the singleton worker with in-flight request
   * deduplication, rate throttling, and monotonic sequence tracking.
   */
  requestCalculation(
    params: EphemerisCalculationParams & { 
      calculateLunar?: boolean; 
      calculateEclipse?: boolean;
      throttleMs?: number;
    },
    onResult: (payload: EphemerisWorkerPayload) => void
  ): () => void {
    if (!this.isAvailable()) {
      return () => {};
    }

    const calculateLunar = params.calculateLunar !== false && params.isLunarActive !== false;
    const calculateEclipse = params.calculateEclipse !== false && params.isEclipseActive !== false;
    const signature = `EPHEMERIS_${params.latitude}_${params.longitude}_${params.julianDate}_${params.timeOfDay}_${calculateLunar}_${calculateEclipse}`;

    // 1. In-flight request deduplication / coalescing
    if (this.signatureToRequestId.has(signature)) {
      const existingId = this.signatureToRequestId.get(signature)!;
      const existingEntry = this.pendingRequests.get(existingId);
      if (existingEntry && existingEntry.type === 'EPHEMERIS') {
        existingEntry.callbacks.add(onResult);
        return () => {
          existingEntry.callbacks.delete(onResult);
        };
      }
    }

    // 2. Throttle handling if throttleMs is requested (> 0)
    const throttleMs = params.throttleMs ?? 0;
    if (throttleMs > 0) {
      const now = Date.now();
      const elapsed = now - this.lastEphemerisDispatchTime;

      // Outside throttle window: dispatch immediately (leading-edge)
      if (elapsed >= throttleMs) {
        if (this.ephemerisThrottleTimer) {
          clearTimeout(this.ephemerisThrottleTimer);
          this.ephemerisThrottleTimer = null;
        }
        this.pendingThrottledEntry = null;
        this.lastEphemerisDispatchTime = now;
        return this._dispatchEphemerisRequest(signature, params, calculateLunar, calculateEclipse, onResult);
      }

      // Within throttle window: coalesce into pendingThrottledEntry (trailing-edge)
      if (this.pendingThrottledEntry) {
        this.pendingThrottledEntry.signature = signature;
        this.pendingThrottledEntry.params = params;
        this.pendingThrottledEntry.calculateLunar = calculateLunar;
        this.pendingThrottledEntry.calculateEclipse = calculateEclipse;
        this.pendingThrottledEntry.callbacks.add(onResult);
      } else {
        this.pendingThrottledEntry = {
          signature,
          params,
          calculateLunar,
          calculateEclipse,
          callbacks: new Set([onResult]),
          dispatchedEntry: null
        };
      }

      const throttledEntry = this.pendingThrottledEntry;

      if (!this.ephemerisThrottleTimer) {
        const remaining = Math.max(0, throttleMs - elapsed);
        this.ephemerisThrottleTimer = setTimeout(() => {
          this.ephemerisThrottleTimer = null;
          this.lastEphemerisDispatchTime = Date.now();
          this._dispatchPendingThrottledEntry();
        }, remaining);
      }

      return () => {
        throttledEntry.callbacks.delete(onResult);
        if (throttledEntry.dispatchedEntry) {
          throttledEntry.dispatchedEntry.callbacks.delete(onResult);
        }
      };
    }

    // Default un-throttled immediate dispatch
    return this._dispatchEphemerisRequest(signature, params, calculateLunar, calculateEclipse, onResult);
  }

  /**
   * Requests an annual solar ephemeris matrix calculation with caching, deduplication, and fallback.
   */
  requestAnnualSolarCalculation(
    { year, latitude }: { year: number; latitude: Latitude },
    onResult: (payload: { annualSolar: AnnualSolarMatrixItem[] }) => void
  ): () => void {
    const signature = `SOLAR_${year}_${latitude}`;

    // Cache hit
    if (this.annualSolarCache.has(signature)) {
      const annualSolar = this._getFromAnnualCache(this.annualSolarCache, signature)!;
      onResult({ annualSolar });
      return () => {};
    }

    // Synchronous fallback if worker unavailable
    if (!this.isAvailable()) {
      try {
        const annualSolar = calculateAnnualSolarMatrix(year, latitude);
        this._setInAnnualCache(this.annualSolarCache, signature, annualSolar);
        onResult({ annualSolar });
      } catch (e) {
        console.error('Annual solar sync execution failed:', e);
      }
      return () => {};
    }

    // In-flight request deduplication / coalescing
    if (this.signatureToRequestId.has(signature)) {
      const existingId = this.signatureToRequestId.get(signature)!;
      const existingEntry = this.pendingRequests.get(existingId);
      if (existingEntry && existingEntry.type === 'ANNUAL_SOLAR') {
        existingEntry.callbacks.add(onResult);
        return () => {
          existingEntry.callbacks.delete(onResult);
        };
      }
    }

    const worker = this._getWorker();
    if (!worker) {
      try {
        const annualSolar = calculateAnnualSolarMatrix(year, latitude);
        this._setInAnnualCache(this.annualSolarCache, signature, annualSolar);
        onResult({ annualSolar });
      } catch (e) {
        console.error('Annual solar sync execution failed:', e);
      }
      return () => {};
    }

    const requestId = ++this.nextRequestId;
    const requestEntry: PendingAnnualSolarEntry = {
      type: 'ANNUAL_SOLAR',
      signature,
      callbacks: new Set([onResult]),
      params: { year, latitude }
    };

    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(signature, requestId);
    this._setRequestTimeout(requestId, requestEntry);

    try {
      const message: EphemerisWorkerRequest = {
        type: 'CALCULATE_ANNUAL_SOLAR',
        id: requestId,
        payload: { year, latitude }
      };
      worker.postMessage(message);
    } catch (error) {
      this._handleWorkerFailure(error);
    }

    return () => {
      requestEntry.callbacks.delete(onResult);
    };
  }

  /**
   * Requests an annual lunar ephemeris matrix calculation with caching, deduplication, and fallback.
   */
  requestAnnualLunarCalculation(
    { year, latitude, longitude }: { year: number; latitude: Latitude; longitude: Longitude },
    onResult: (payload: { annualLunar: AnnualLunarMatrixItem[] }) => void
  ): () => void {
    const signature = `LUNAR_${year}_${latitude}_${longitude}`;

    // Cache hit
    if (this.annualLunarCache.has(signature)) {
      const annualLunar = this._getFromAnnualCache(this.annualLunarCache, signature)!;
      onResult({ annualLunar });
      return () => {};
    }

    // Synchronous fallback if worker unavailable
    if (!this.isAvailable()) {
      try {
        const annualLunar = calculateAnnualLunarMatrix(year, latitude, longitude);
        this._setInAnnualCache(this.annualLunarCache, signature, annualLunar);
        onResult({ annualLunar });
      } catch (e) {
        console.error('Annual lunar sync execution failed:', e);
      }
      return () => {};
    }

    // In-flight request deduplication / coalescing
    if (this.signatureToRequestId.has(signature)) {
      const existingId = this.signatureToRequestId.get(signature)!;
      const existingEntry = this.pendingRequests.get(existingId);
      if (existingEntry && existingEntry.type === 'ANNUAL_LUNAR') {
        existingEntry.callbacks.add(onResult);
        return () => {
          existingEntry.callbacks.delete(onResult);
        };
      }
    }

    const worker = this._getWorker();
    if (!worker) {
      try {
        const annualLunar = calculateAnnualLunarMatrix(year, latitude, longitude);
        this._setInAnnualCache(this.annualLunarCache, signature, annualLunar);
        onResult({ annualLunar });
      } catch (e) {
        console.error('Annual lunar sync execution failed:', e);
      }
      return () => {};
    }

    const requestId = ++this.nextRequestId;
    const requestEntry: PendingAnnualLunarEntry = {
      type: 'ANNUAL_LUNAR',
      signature,
      callbacks: new Set([onResult]),
      params: { year, latitude, longitude }
    };

    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(signature, requestId);
    this._setRequestTimeout(requestId, requestEntry);

    try {
      const message: EphemerisWorkerRequest = {
        type: 'CALCULATE_ANNUAL_LUNAR',
        id: requestId,
        payload: { year, latitude, longitude }
      };
      worker.postMessage(message);
    } catch (error) {
      this._handleWorkerFailure(error);
    }

    return () => {
      requestEntry.callbacks.delete(onResult);
    };
  }

  /**
   * Terminates the active singleton worker instance and resets pending requests and caches.
   */
  terminate(): void {
    if (this.ephemerisThrottleTimer) {
      clearTimeout(this.ephemerisThrottleTimer);
      this.ephemerisThrottleTimer = null;
    }
    for (const timer of this.requestTimeouts.values()) {
      clearTimeout(timer);
    }
    this.requestTimeouts.clear();
    this.pendingThrottledEntry = null;
    this.lastEphemerisDispatchTime = 0;
    this.latestProcessedEphemerisId = 0;

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
    this.annualSolarCache.clear();
    this.annualLunarCache.clear();
    this._isAvailable = typeof Worker !== 'undefined';
  }
}

export const ephemerisWorkerManager = new EphemerisWorkerManager();
