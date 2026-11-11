import { 
  EphemerisCalculationParams, 
  EphemerisWorkerPayload,
  EphemerisWorkerRequest,
  EphemerisWorkerResponse,
  PendingRequestEntry,
  PendingEphemerisEntry,
  PendingAnnualSolarEntry,
  PendingAnnualLunarEntry,
  AnnualCalculationType,
  AnnualCalculationPayloadMap,
  AnnualCalculationParamsMap,
  AnnualCalculationRequestTypeMap,
  AnnualCalculationCacheItemMap,
  PendingAnnualCalculationEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude } from '../types/units';
import { LruCache } from '../utils/lruCache';
import {
  executeSyncFallbackForEntry,
  executeSyncAnnualSolarFallback,
  executeSyncAnnualLunarFallback
} from './workerFallback';

export interface PendingThrottledEphemerisEntry {
  signature: string;
  params: EphemerisCalculationParams;
  calculateLunar: boolean;
  calculateEclipse: boolean;
  callbacks: Set<(payload: EphemerisWorkerPayload) => void>;
  dispatchedEntry: PendingEphemerisEntry | null;
}

export type SolarAlmanacDay = AnnualSolarMatrixItem;
export type LunarAlmanacDay = AnnualLunarMatrixItem;

export type { 
  PendingRequestEntry, 
  PendingEphemerisEntry, 
  PendingAnnualSolarEntry, 
  PendingAnnualLunarEntry,
  AnnualCalculationType,
  PendingAnnualCalculationEntry
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
  public _setInAnnualCache<T>(cache: LruCache<string, T> | Map<string, T>, key: string, value: T): void {
    cache.set(key, value);
  }

  /**
   * Retrieves an entry from an annual matrix cache and promotes it to most recently used.
   */
  public _getFromAnnualCache<T>(cache: LruCache<string, T> | Map<string, T>, key: string): T | undefined {
    return cache.get(key);
  }

  public worker: Worker | null;
  public nextRequestId: number;
  public pendingRequests: Map<number, PendingRequestEntry>;
  public signatureToRequestId: Map<string, number>;
  public annualSolarCache: LruCache<string, AnnualSolarMatrixItem[]>;
  public annualLunarCache: LruCache<string, AnnualLunarMatrixItem[]>;
  public requestTimeouts: Map<number, ReturnType<typeof setTimeout>>;
  public _isAvailable: boolean;
  public latestProcessedEphemerisId: number;
  public lastEphemerisDispatchTime: number;
  public ephemerisThrottleTimer: ReturnType<typeof setTimeout> | null;
  public pendingThrottledEntries: Map<string, PendingThrottledEphemerisEntry>;
  private readonly _boundOnUnload: () => void;
  private _hasUnloadListeners: boolean;

  constructor() {
    this.worker = null;
    this.nextRequestId = 0;
    this.pendingRequests = new Map();
    this.signatureToRequestId = new Map();
    this.annualSolarCache = new LruCache<string, AnnualSolarMatrixItem[]>(EphemerisWorkerManager.MAX_ANNUAL_CACHE_SIZE);
    this.annualLunarCache = new LruCache<string, AnnualLunarMatrixItem[]>(EphemerisWorkerManager.MAX_ANNUAL_CACHE_SIZE);
    this.requestTimeouts = new Map();
    this._isAvailable = typeof Worker !== 'undefined';
    this.latestProcessedEphemerisId = 0;
    this.lastEphemerisDispatchTime = 0;
    this.ephemerisThrottleTimer = null;
    this.pendingThrottledEntries = new Map();
    this._boundOnUnload = () => this.terminate();
    this._hasUnloadListeners = false;

    this._ensureUnloadListeners();
  }

  private _ensureUnloadListeners(): void {
    if (this._hasUnloadListeners) return;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('beforeunload', this._boundOnUnload);
      window.addEventListener('pagehide', this._boundOnUnload);
      this._hasUnloadListeners = true;
    }
  }

  private _removeUnloadListeners(): void {
    if (!this._hasUnloadListeners) return;
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('beforeunload', this._boundOnUnload);
      window.removeEventListener('pagehide', this._boundOnUnload);
    }
    this._hasUnloadListeners = false;
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
    executeSyncFallbackForEntry(
      entry,
      this.annualSolarCache,
      this.annualLunarCache,
      (c, k, v) => this._setInAnnualCache(c, k, v)
    );
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

  private _notifyCallbacks<TPayload>(
    callbacks: Set<(payload: TPayload) => void>,
    payload: TPayload,
    label: string
  ): void {
    callbacks.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(`${label} callback error:`, e);
      }
    });
  }

  private _createUnsubscribe<TCallback>(
    requestId: number,
    signature: string,
    callbacks: Set<TCallback>,
    callback: TCallback
  ): () => void {
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this._clearRequestTimeout(requestId);
        this.pendingRequests.delete(requestId);
        this.signatureToRequestId.delete(signature);
      }
    };
  }

  private _registerAndPost(
    worker: Worker,
    requestEntry: PendingRequestEntry,
    requestType: EphemerisWorkerRequest['type']
  ): number {
    const requestId = ++this.nextRequestId;
    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(requestEntry.signature, requestId);
    this._setRequestTimeout(requestId, requestEntry);

    try {
      const message = {
        type: requestType,
        id: requestId,
        payload: requestEntry.params
      } as EphemerisWorkerRequest;
      worker.postMessage(message);
    } catch (error) {
      this._handleWorkerFailure(error);
    }

    return requestId;
  }

  private _handleWorkerMessage(response: EphemerisWorkerResponse): void {
    if (!response) return;
    const { type, id } = response;
    if (typeof id === 'number') {
      this._clearRequestTimeout(id);
    }

    const requestEntry = this.pendingRequests.get(id);
    if (!requestEntry) return;

    if (type === 'EPHEMERIS_SUCCESS' && requestEntry.type === 'EPHEMERIS') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);

      // Discard stale responses that completed out of order
      if (id < this.latestProcessedEphemerisId) {
        return;
      }
      this.latestProcessedEphemerisId = id;
      this._notifyCallbacks(requestEntry.callbacks, response.payload, 'Ephemeris');
    } else if (type === 'ANNUAL_SOLAR_SUCCESS' && requestEntry.type === 'ANNUAL_SOLAR') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (response.payload?.annualSolar) {
        this._setInAnnualCache(this.annualSolarCache, requestEntry.signature, response.payload.annualSolar);
      }
      this._notifyCallbacks(requestEntry.callbacks, response.payload, 'Annual solar');
    } else if (type === 'ANNUAL_LUNAR_SUCCESS' && requestEntry.type === 'ANNUAL_LUNAR') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (response.payload?.annualLunar) {
        this._setInAnnualCache(this.annualLunarCache, requestEntry.signature, response.payload.annualLunar);
      }
      this._notifyCallbacks(requestEntry.callbacks, response.payload, 'Annual lunar');
    } else if (
      type === 'EPHEMERIS_ERROR' ||
      type === 'ANNUAL_SOLAR_ERROR' ||
      type === 'ANNUAL_LUNAR_ERROR'
    ) {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (type !== 'EPHEMERIS_ERROR' || id >= this.latestProcessedEphemerisId) {
        this._executeSyncFallbackForEntry(requestEntry);
      }
    }
  }

  /**
   * Handles unexpected worker failure (onerror / postMessage failure) by notifying pending requests
   * via synchronous fallback calculations and safely clearing the worker instance.
   */
  public _handleWorkerFailure(_error?: unknown): void {
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
    for (const throttled of this.pendingThrottledEntries.values()) {
      if (throttled.callbacks.size > 0) {
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
    }
    this.pendingThrottledEntries.clear();
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
        this._ensureUnloadListeners();
        this.worker = new Worker(
          new URL('./ephemerisWorker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent<EphemerisWorkerResponse>) => {
          this._handleWorkerMessage(event.data);
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

    const requestId = this._registerAndPost(worker, requestEntry, 'CALCULATE_EPHEMERIS');
    return this._createUnsubscribe(requestId, signature, requestEntry.callbacks, onResult);
  }

  /**
   * Dispatches all pending throttled entries to the worker once the throttle interval elapses.
   */
  public _dispatchPendingThrottledEntries(): void {
    if (this.ephemerisThrottleTimer) {
      clearTimeout(this.ephemerisThrottleTimer);
      this.ephemerisThrottleTimer = null;
    }
    if (this.pendingThrottledEntries.size === 0) return;

    const entries = Array.from(this.pendingThrottledEntries.values());
    this.pendingThrottledEntries.clear();

    const worker = this._getWorker();
    if (!worker) return;

    for (const entry of entries) {
      if (entry.callbacks.size === 0) continue;

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
      this._registerAndPost(worker, requestEntry, 'CALCULATE_EPHEMERIS');
    }
  }

  public _dispatchPendingThrottledEntry(): void {
    this._dispatchPendingThrottledEntries();
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
        return this._createUnsubscribe(existingId, signature, existingEntry.callbacks, onResult);
      }
    }

    // 2. Throttle handling if throttleMs is requested (> 0)
    const throttleMs = params.throttleMs ?? 0;
    if (throttleMs > 0) {
      const now = Date.now();
      const elapsed = now - this.lastEphemerisDispatchTime;

      // Outside throttle window: dispatch immediately (leading-edge)
      if (elapsed >= throttleMs) {
        this._dispatchPendingThrottledEntries();
        this.lastEphemerisDispatchTime = now;
        return this._dispatchEphemerisRequest(signature, params, calculateLunar, calculateEclipse, onResult);
      }

      // Within throttle window: coalesce into pendingThrottledEntries (trailing-edge)
      const baseKey = `${params.julianDate}_${params.timeOfDay}_${params.latitude}_${params.longitude}`;
      let throttledEntry = this.pendingThrottledEntries.get(baseKey);

      if (throttledEntry) {
        throttledEntry.calculateLunar = throttledEntry.calculateLunar || calculateLunar;
        throttledEntry.calculateEclipse = throttledEntry.calculateEclipse || calculateEclipse;
        throttledEntry.signature = `EPHEMERIS_${params.latitude}_${params.longitude}_${params.julianDate}_${params.timeOfDay}_${throttledEntry.calculateLunar}_${throttledEntry.calculateEclipse}`;
        throttledEntry.callbacks.add(onResult);
      } else {
        throttledEntry = {
          signature,
          params,
          calculateLunar,
          calculateEclipse,
          callbacks: new Set([onResult]),
          dispatchedEntry: null
        };
        this.pendingThrottledEntries.set(baseKey, throttledEntry);
      }

      const activeEntry = throttledEntry;

      if (!this.ephemerisThrottleTimer) {
        const remaining = Math.max(0, throttleMs - elapsed);
        this.ephemerisThrottleTimer = setTimeout(() => {
          this.ephemerisThrottleTimer = null;
          this.lastEphemerisDispatchTime = Date.now();
          this._dispatchPendingThrottledEntries();
        }, remaining);
      }

      return () => {
        activeEntry.callbacks.delete(onResult);
        if (activeEntry.callbacks.size === 0) {
          this.pendingThrottledEntries.delete(baseKey);
          if (this.pendingThrottledEntries.size === 0 && this.ephemerisThrottleTimer) {
            clearTimeout(this.ephemerisThrottleTimer);
            this.ephemerisThrottleTimer = null;
          }
        }
        if (activeEntry.dispatchedEntry) {
          activeEntry.dispatchedEntry.callbacks.delete(onResult);
          if (activeEntry.dispatchedEntry.callbacks.size === 0) {
            const reqId = this.signatureToRequestId.get(activeEntry.dispatchedEntry.signature);
            if (reqId !== undefined) {
              this._clearRequestTimeout(reqId);
              this.pendingRequests.delete(reqId);
              this.signatureToRequestId.delete(activeEntry.dispatchedEntry.signature);
            }
          }
        }
      };
    }

    // Default un-throttled immediate dispatch
    return this._dispatchEphemerisRequest(signature, params, calculateLunar, calculateEclipse, onResult);
  }

  /**
   * Private generic dispatcher for annual matrix calculations (Solar or Lunar),
   * encapsulating cache checking, synchronous fallbacks, request coalescing, and postMessage.
   */
  private _requestAnnualCalculation<K extends AnnualCalculationType>(
    signature: string,
    cache: LruCache<string, AnnualCalculationCacheItemMap[K]>,
    entryType: K,
    requestType: AnnualCalculationRequestTypeMap[K],
    params: AnnualCalculationParamsMap[K],
    fallbackFn: () => AnnualCalculationPayloadMap[K],
    wrapCached: (item: AnnualCalculationCacheItemMap[K]) => AnnualCalculationPayloadMap[K],
    onResult: (result: AnnualCalculationPayloadMap[K]) => void
  ): () => void {
    // Cache hit
    if (cache.has(signature)) {
      const item = this._getFromAnnualCache(cache, signature)!;
      onResult(wrapCached(item));
      return () => {};
    }

    // Synchronous fallback if worker unavailable
    if (!this.isAvailable()) {
      const result = fallbackFn();
      onResult(result);
      return () => {};
    }

    // In-flight request deduplication / coalescing
    if (this.signatureToRequestId.has(signature)) {
      const existingId = this.signatureToRequestId.get(signature)!;
      const existingEntry = this.pendingRequests.get(existingId);
      if (existingEntry && existingEntry.type === entryType) {
        const entry = existingEntry as PendingAnnualCalculationEntry<K>;
        const callbacks = entry.callbacks as Set<(result: AnnualCalculationPayloadMap[K]) => void>;
        callbacks.add(onResult);
        return this._createUnsubscribe(existingId, signature, callbacks, onResult);
      }
    }

    const worker = this._getWorker();
    if (!worker) {
      const result = fallbackFn();
      onResult(result);
      return () => {};
    }

    const callbacks = new Set<(result: AnnualCalculationPayloadMap[K]) => void>([onResult]);
    const requestEntry = {
      type: entryType,
      signature,
      callbacks,
      params
    } as PendingAnnualCalculationEntry<K>;

    const requestId = this._registerAndPost(worker, requestEntry, requestType);
    return this._createUnsubscribe(requestId, signature, callbacks, onResult);
  }

  /**
   * Requests an annual solar ephemeris matrix calculation with caching, deduplication, and fallback.
   */
  requestAnnualSolarCalculation(
    { year, latitude }: { year: number; latitude: Latitude },
    onResult: (payload: { annualSolar: AnnualSolarMatrixItem[] }) => void
  ): () => void {
    const signature = `SOLAR_${year}_${latitude}`;
    return this._requestAnnualCalculation(
      signature,
      this.annualSolarCache,
      'ANNUAL_SOLAR',
      'CALCULATE_ANNUAL_SOLAR',
      { year, latitude },
      () => executeSyncAnnualSolarFallback(
        year,
        latitude,
        signature,
        this.annualSolarCache,
        (c, k, v) => this._setInAnnualCache(c, k, v)
      ),
      (annualSolar) => ({ annualSolar }),
      onResult
    );
  }

  /**
   * Requests an annual lunar ephemeris matrix calculation with caching, deduplication, and fallback.
   */
  requestAnnualLunarCalculation(
    { year, latitude, longitude }: { year: number; latitude: Latitude; longitude: Longitude },
    onResult: (payload: { annualLunar: AnnualLunarMatrixItem[] }) => void
  ): () => void {
    const signature = `LUNAR_${year}_${latitude}_${longitude}`;
    return this._requestAnnualCalculation(
      signature,
      this.annualLunarCache,
      'ANNUAL_LUNAR',
      'CALCULATE_ANNUAL_LUNAR',
      { year, latitude, longitude },
      () => executeSyncAnnualLunarFallback(
        year,
        latitude,
        longitude,
        signature,
        this.annualLunarCache,
        (c, k, v) => this._setInAnnualCache(c, k, v)
      ),
      (annualLunar) => ({ annualLunar }),
      onResult
    );
  }

  /**
   * Retrieves an annual solar ephemeris matrix from the manager's LRU cache if present.
   */
  getCachedAnnualSolar(year: number, latitude: number): AnnualSolarMatrixItem[] | undefined {
    const signature = `SOLAR_${year}_${latitude}`;
    return this.annualSolarCache.get(signature);
  }

  /**
   * Directly seeds the annual solar ephemeris matrix cache with precomputed data.
   */
  seedAnnualSolarCache(year: number, latitude: number, data: AnnualSolarMatrixItem[]): void {
    const signature = `SOLAR_${year}_${latitude}`;
    this._setInAnnualCache(this.annualSolarCache, signature, data);
  }

  /**
   * Retrieves an annual lunar ephemeris matrix from the manager's LRU cache if present.
   */
  getCachedAnnualLunar(year: number, latitude: number, longitude: number): AnnualLunarMatrixItem[] | undefined {
    const signature = `LUNAR_${year}_${latitude}_${longitude}`;
    return this.annualLunarCache.get(signature);
  }

  /**
   * Directly seeds the annual lunar ephemeris matrix cache with precomputed data.
   */
  seedAnnualLunarCache(year: number, latitude: number, longitude: number, data: AnnualLunarMatrixItem[]): void {
    const signature = `LUNAR_${year}_${latitude}_${longitude}`;
    this._setInAnnualCache(this.annualLunarCache, signature, data);
  }

  /**
   * Terminates the active singleton worker instance and resets pending requests and caches.
   */
  terminate(): void {
    this._removeUnloadListeners();
    if (this.ephemerisThrottleTimer) {
      clearTimeout(this.ephemerisThrottleTimer);
      this.ephemerisThrottleTimer = null;
    }
    for (const timer of this.requestTimeouts.values()) {
      clearTimeout(timer);
    }
    this.requestTimeouts.clear();
    this.pendingThrottledEntries.clear();
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
