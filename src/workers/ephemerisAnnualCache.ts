import {
  AnnualCalculationType,
  AnnualCalculationPayloadMap,
  AnnualCalculationParamsMap,
  AnnualCalculationRequestTypeMap,
  AnnualCalculationCacheItemMap,
  PendingAnnualCalculationEntry,
  PendingRequestEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import { Latitude, Longitude } from '../types/units';
import { LruCache } from '../utils/lruCache';
import {
  executeSyncAnnualSolarFallback,
  executeSyncAnnualLunarFallback
} from './workerFallback';

export interface AnnualCacheTransportBridge {
  isAvailable: () => boolean;
  getWorker: () => Worker | null;
  getExistingRequestId: (signature: string) => number | undefined;
  getPendingRequest: (id: number) => PendingRequestEntry | undefined;
  createUnsubscribe: <TCallback>(
    requestId: number,
    signature: string,
    callbacks: Set<TCallback>,
    callback: TCallback
  ) => () => void;
  registerAndPost: (
    worker: Worker,
    entry: PendingRequestEntry,
    requestType: AnnualCalculationRequestTypeMap[AnnualCalculationType]
  ) => number;
}

const solarKey = (year: number, latitude: number): string => `SOLAR_${year}_${latitude}`;
const lunarKey = (year: number, latitude: number, longitude: number): string => `LUNAR_${year}_${latitude}_${longitude}`;

/**
 * Bounded LRU cache manager and request coalescer for 365/366-day solar and lunar matrices.
 */
export class AnnualMatrixCacheService {
  public static readonly MAX_CACHE_SIZE = 16;

  public readonly solarCache: LruCache<string, AnnualSolarMatrixItem[]>;
  public readonly lunarCache: LruCache<string, AnnualLunarMatrixItem[]>;

  constructor(maxCacheSize: number = AnnualMatrixCacheService.MAX_CACHE_SIZE) {
    this.solarCache = new LruCache<string, AnnualSolarMatrixItem[]>(maxCacheSize);
    this.lunarCache = new LruCache<string, AnnualLunarMatrixItem[]>(maxCacheSize);
  }

  /**
   * Sets an entry into an annual matrix cache using bounded LRU eviction.
   */
  public setInCache<T>(cache: LruCache<string, T> | Map<string, T>, key: string, value: T): void {
    cache.set(key, value);
  }

  /**
   * Retrieves an entry from an annual matrix cache and promotes it as recently used.
   */
  public getFromCache<T>(cache: LruCache<string, T> | Map<string, T>, key: string): T | undefined {
    return cache.get(key);
  }

  private _requestCalculation<K extends AnnualCalculationType>(
    bridge: AnnualCacheTransportBridge,
    signature: string,
    cache: LruCache<string, AnnualCalculationCacheItemMap[K]>,
    entryType: K,
    requestType: AnnualCalculationRequestTypeMap[K],
    params: AnnualCalculationParamsMap[K],
    fallbackFn: () => AnnualCalculationPayloadMap[K],
    wrapCached: (item: AnnualCalculationCacheItemMap[K]) => AnnualCalculationPayloadMap[K],
    onResult: (result: AnnualCalculationPayloadMap[K]) => void
  ): () => void {
    if (cache.has(signature)) {
      const item = this.getFromCache(cache, signature)!;
      onResult(wrapCached(item));
      return () => {};
    }

    if (!bridge.isAvailable()) {
      onResult(fallbackFn());
      return () => {};
    }

    const existingId = bridge.getExistingRequestId(signature);
    if (existingId !== undefined) {
      const existingEntry = bridge.getPendingRequest(existingId);
      if (existingEntry && existingEntry.type === entryType) {
        const entry = existingEntry as PendingAnnualCalculationEntry<K>;
        const callbacks = entry.callbacks as Set<(result: AnnualCalculationPayloadMap[K]) => void>;
        callbacks.add(onResult);
        return bridge.createUnsubscribe(existingId, signature, callbacks, onResult);
      }
    }

    const worker = bridge.getWorker();
    if (!worker) {
      onResult(fallbackFn());
      return () => {};
    }

    const callbacks = new Set<(result: AnnualCalculationPayloadMap[K]) => void>([onResult]);
    const requestEntry = {
      type: entryType,
      signature,
      callbacks,
      params
    } as PendingAnnualCalculationEntry<K>;

    const requestId = bridge.registerAndPost(worker, requestEntry, requestType);
    return bridge.createUnsubscribe(requestId, signature, callbacks, onResult);
  }

  /**
   * Requests an annual solar ephemeris matrix with caching, coalescing, and fallback.
   */
  public requestSolar(
    bridge: AnnualCacheTransportBridge,
    { year, latitude }: { year: number; latitude: Latitude },
    onResult: (payload: { annualSolar: AnnualSolarMatrixItem[] }) => void
  ): () => void {
    const signature = solarKey(year, latitude);
    return this._requestCalculation(
      bridge,
      signature,
      this.solarCache,
      'ANNUAL_SOLAR',
      'CALCULATE_ANNUAL_SOLAR',
      { year, latitude },
      () => executeSyncAnnualSolarFallback(
        year,
        latitude,
        signature,
        this.solarCache,
        (c, k, v) => this.setInCache(c, k, v)
      ),
      (annualSolar) => ({ annualSolar }),
      onResult
    );
  }

  /**
   * Requests an annual lunar ephemeris matrix with caching, coalescing, and fallback.
   */
  public requestLunar(
    bridge: AnnualCacheTransportBridge,
    { year, latitude, longitude }: { year: number; latitude: Latitude; longitude: Longitude },
    onResult: (payload: { annualLunar: AnnualLunarMatrixItem[] }) => void
  ): () => void {
    const signature = lunarKey(year, latitude, longitude);
    return this._requestCalculation(
      bridge,
      signature,
      this.lunarCache,
      'ANNUAL_LUNAR',
      'CALCULATE_ANNUAL_LUNAR',
      { year, latitude, longitude },
      () => executeSyncAnnualLunarFallback(
        year,
        latitude,
        longitude,
        signature,
        this.lunarCache,
        (c, k, v) => this.setInCache(c, k, v)
      ),
      (annualLunar) => ({ annualLunar }),
      onResult
    );
  }

  public getCachedSolar(year: number, latitude: number): AnnualSolarMatrixItem[] | undefined {
    return this.solarCache.get(solarKey(year, latitude));
  }

  public seedSolar(year: number, latitude: number, data: AnnualSolarMatrixItem[]): void {
    this.setInCache(this.solarCache, solarKey(year, latitude), data);
  }

  public getCachedLunar(year: number, latitude: number, longitude: number): AnnualLunarMatrixItem[] | undefined {
    return this.lunarCache.get(lunarKey(year, latitude, longitude));
  }

  public seedLunar(year: number, latitude: number, longitude: number, data: AnnualLunarMatrixItem[]): void {
    this.setInCache(this.lunarCache, lunarKey(year, latitude, longitude), data);
  }

  public clear(): void {
    this.solarCache.clear();
    this.lunarCache.clear();
  }
}
