import {
  EphemerisCalculationParams,
  EphemerisWorkerPayload,
  PendingRequestEntry,
  PendingEphemerisEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude } from '../types/units';
import { LruCache } from '../utils/lruCache';
import { executeSyncFallbackForEntry } from './workerFallback';
import {
  buildEphemerisSignature,
  EphemerisRequestHandle,
  EphemerisRequestParams,
  EphemerisSubscription,
  PendingThrottledEphemerisEntry,
  SolarAlmanacDay,
  LunarAlmanacDay,
  PendingAnnualSolarEntry,
  PendingAnnualLunarEntry,
  AnnualCalculationType,
  PendingAnnualCalculationEntry
} from './ephemerisTypes';
import { createManagedEphemerisSubscription } from './ephemerisSubscription';
import { AnnualMatrixCacheService, AnnualCacheTransportBridge } from './ephemerisAnnualCache';
import { EphemerisThrottleQueue, ThrottleDispatchHost } from './ephemerisThrottle';
import { WorkerTransport } from './workerTransport';

export type {
  PendingThrottledEphemerisEntry,
  EphemerisRequestParams,
  EphemerisSubscription,
  SolarAlmanacDay,
  LunarAlmanacDay,
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
 * Coordinates Web Worker transport, request deduplication, 100ms trailing-edge flag-merging
 * throttling, persistent 60 FPS consumer subscriptions, and bounded LRU annual matrix caches.
 */
export class EphemerisWorkerManager {
  public static readonly MAX_ANNUAL_CACHE_SIZE = AnnualMatrixCacheService.MAX_CACHE_SIZE;

  private readonly _annualCache: AnnualMatrixCacheService;
  private readonly _throttle: EphemerisThrottleQueue;
  private readonly _transport: WorkerTransport;
  private readonly _throttleHost: ThrottleDispatchHost;
  private readonly _annualBridge: AnnualCacheTransportBridge;

  constructor() {
    this._annualCache = new AnnualMatrixCacheService(EphemerisWorkerManager.MAX_ANNUAL_CACHE_SIZE);
    this._throttle = new EphemerisThrottleQueue();
    this._transport = new WorkerTransport({
      onSyncFallback: (entry) =>
        executeSyncFallbackForEntry(
          entry,
          this._annualCache.solarCache,
          this._annualCache.lunarCache,
          (c, k, v) => this._annualCache.setInCache(c, k, v)
        ),
      onAnnualSolarSuccess: (sig, data) => this._annualCache.setInCache(this._annualCache.solarCache, sig, data),
      onAnnualLunarSuccess: (sig, data) => this._annualCache.setInCache(this._annualCache.lunarCache, sig, data),
      drainThrottledForFailure: () => this._throttle.drainForFailure(),
      onUnloadTerminate: () => this.terminate()
    });

    this._throttleHost = {
      getWorker: () => this._transport.getWorker(),
      registerAndPost: (w, entry, reqType) => this._transport.registerAndPost(w, entry, reqType),
      clearDispatchedEntry: (entry) => this._transport.clearDispatchedBySignature(entry.signature),
      dispatchImmediate: (sig, params, calcLunar, calcEclipse, onResult) =>
        this._dispatchEphemerisRequest(sig, params, calcLunar, calcEclipse, onResult)
    };

    this._annualBridge = {
      isAvailable: () => this.isAvailable(),
      getWorker: () => this._transport.getWorker(),
      getExistingRequestId: (sig) => this._transport.signatureToRequestId.get(sig),
      getPendingRequest: (id) => this._transport.pendingRequests.get(id),
      createUnsubscribe: (id, sig, cbs, cb) => this._transport.createUnsubscribe(id, sig, cbs, cb),
      registerAndPost: (w, entry, reqType) => this._transport.registerAndPost(w, entry, reqType)
    };
  }

  public get worker(): Worker | null {
    return this._transport.worker;
  }

  public get pendingRequests(): Map<number, PendingRequestEntry> {
    return this._transport.pendingRequests;
  }

  public get annualSolarCache(): LruCache<string, AnnualSolarMatrixItem[]> {
    return this._annualCache.solarCache;
  }

  public get annualLunarCache(): LruCache<string, AnnualLunarMatrixItem[]> {
    return this._annualCache.lunarCache;
  }

  public get latestProcessedEphemerisId(): number {
    return this._transport.latestProcessedEphemerisId;
  }

  public get pendingThrottledEntries(): Map<string, PendingThrottledEphemerisEntry> {
    return this._throttle.pendingEntries;
  }

  /**
   * Returns whether Web Worker support is available and functional.
   */
  public isAvailable(): boolean {
    return this._transport.isAvailable();
  }

  private _dispatchEphemerisRequest(
    signature: string,
    params: EphemerisCalculationParams & { calculateLunar?: boolean; calculateEclipse?: boolean },
    calculateLunar: boolean,
    calculateEclipse: boolean,
    onResult: (payload: EphemerisWorkerPayload) => void
  ): () => void {
    const worker = this._transport.getWorker();
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

    const requestId = this._transport.registerAndPost(worker, requestEntry, 'CALCULATE_EPHEMERIS');
    return this._transport.createUnsubscribe(requestId, signature, requestEntry.callbacks, onResult);
  }

  private _requestCalculationInternal(
    params: EphemerisRequestParams,
    onResult: (payload: EphemerisWorkerPayload) => void,
    now: number = Date.now()
  ): EphemerisRequestHandle {
    if (!this.isAvailable()) {
      return { unsubscribe: () => {}, isQueued: () => false };
    }

    const calculateLunar = params.calculateLunar !== false && params.isLunarActive !== false;
    const calculateEclipse = params.calculateEclipse !== false && params.isEclipseActive !== false;
    const signature = buildEphemerisSignature(params, calculateLunar, calculateEclipse);

    if (this._transport.signatureToRequestId.has(signature)) {
      const existingId = this._transport.signatureToRequestId.get(signature)!;
      const existingEntry = this._transport.pendingRequests.get(existingId);
      if (existingEntry && existingEntry.type === 'EPHEMERIS') {
        existingEntry.callbacks.add(onResult);
        return {
          unsubscribe: this._transport.createUnsubscribe(existingId, signature, existingEntry.callbacks, onResult),
          isQueued: () => false
        };
      }
    }

    const throttleMs = params.throttleMs ?? 0;
    if (throttleMs > 0) {
      return this._throttle.enqueueOrDispatch(
        this._throttleHost,
        signature,
        params,
        calculateLunar,
        calculateEclipse,
        onResult,
        now,
        throttleMs
      );
    }

    return {
      unsubscribe: this._dispatchEphemerisRequest(signature, params, calculateLunar, calculateEclipse, onResult),
      isQueued: () => false
    };
  }

  /**
   * Requests an asynchronous ephemeris calculation with deduplication, throttling, and sequence filtering.
   */
  public requestCalculation(
    params: EphemerisRequestParams,
    onResult: (payload: EphemerisWorkerPayload) => void
  ): () => void {
    return this._requestCalculationInternal(params, onResult).unsubscribe;
  }

  /**
   * Creates a persistent per-consumer subscription channel for high-frequency consumers (e.g. 60 FPS playback).
   */
  public createEphemerisSubscription(): EphemerisSubscription {
    return createManagedEphemerisSubscription({
      isAvailable: () => this.isAvailable(),
      getLastDispatchTime: () => this._throttle.lastDispatchTime,
      dispatchInternal: (params, onResult, now) => this._requestCalculationInternal(params, onResult, now)
    });
  }

  public requestAnnualSolarCalculation(
    params: { year: number; latitude: Latitude },
    onResult: (payload: { annualSolar: AnnualSolarMatrixItem[] }) => void
  ): () => void {
    return this._annualCache.requestSolar(this._annualBridge, params, onResult);
  }

  public requestAnnualLunarCalculation(
    params: { year: number; latitude: Latitude; longitude: Longitude },
    onResult: (payload: { annualLunar: AnnualLunarMatrixItem[] }) => void
  ): () => void {
    return this._annualCache.requestLunar(this._annualBridge, params, onResult);
  }

  public getCachedAnnualSolar(year: number, latitude: number): AnnualSolarMatrixItem[] | undefined {
    return this._annualCache.getCachedSolar(year, latitude);
  }

  public seedAnnualSolarCache(year: number, latitude: number, data: AnnualSolarMatrixItem[]): void {
    this._annualCache.seedSolar(year, latitude, data);
  }

  public getCachedAnnualLunar(year: number, latitude: number, longitude: number): AnnualLunarMatrixItem[] | undefined {
    return this._annualCache.getCachedLunar(year, latitude, longitude);
  }

  public seedAnnualLunarCache(year: number, latitude: number, longitude: number, data: AnnualLunarMatrixItem[]): void {
    this._annualCache.seedLunar(year, latitude, longitude, data);
  }

  /**
   * Terminates the active singleton worker instance and resets pending requests, throttle state, and caches.
   */
  public terminate(): void {
    this._throttle.clear();
    this._transport.terminate();
    this._annualCache.clear();
  }
}

export const ephemerisWorkerManager = new EphemerisWorkerManager();
