import {
  EphemerisCalculationParams,
  EphemerisWorkerPayload,
  PendingEphemerisEntry
} from '../types/worker';
import {
  buildEphemerisSignature,
  EphemerisRequestHandle,
  PendingThrottledEphemerisEntry
} from './ephemerisTypes';

export interface ThrottleDispatchHost {
  getWorker: () => Worker | null;
  registerAndPost: (
    worker: Worker,
    entry: PendingEphemerisEntry,
    requestType: 'CALCULATE_EPHEMERIS'
  ) => number;
  clearDispatchedEntry: (entry: PendingEphemerisEntry) => void;
  dispatchImmediate: (
    signature: string,
    params: EphemerisCalculationParams & { calculateLunar?: boolean; calculateEclipse?: boolean },
    calculateLunar: boolean,
    calculateEclipse: boolean,
    onResult: (payload: EphemerisWorkerPayload) => void
  ) => () => void;
}

/**
 * Coordinates leading-edge dispatch and trailing-edge flag-merging coalescing
 * for high-frequency ephemeris calculation requests.
 */
export class EphemerisThrottleQueue {
  public lastDispatchTime: number = 0;
  public timer: ReturnType<typeof setTimeout> | null = null;
  public readonly pendingEntries: Map<string, PendingThrottledEphemerisEntry> = new Map();

  /**
   * Dispatches immediately on the leading edge if elapsed >= throttleMs; otherwise
   * coalesces parameters and merges lunar/eclipse flags into a trailing-edge batch.
   */
  public enqueueOrDispatch(
    host: ThrottleDispatchHost,
    signature: string,
    params: EphemerisCalculationParams,
    calculateLunar: boolean,
    calculateEclipse: boolean,
    onResult: (payload: EphemerisWorkerPayload) => void,
    now: number,
    throttleMs: number
  ): EphemerisRequestHandle {
    const elapsed = now - this.lastDispatchTime;

    if (elapsed >= throttleMs) {
      this.flushPendingEntries(host);
      this.lastDispatchTime = now;
      return {
        unsubscribe: host.dispatchImmediate(signature, params, calculateLunar, calculateEclipse, onResult),
        isQueued: () => false
      };
    }

    const baseKey = `${params.julianDate}_${params.timeOfDay}_${params.latitude}_${params.longitude}`;
    let throttledEntry = this.pendingEntries.get(baseKey);

    if (throttledEntry) {
      throttledEntry.calculateLunar = throttledEntry.calculateLunar || calculateLunar;
      throttledEntry.calculateEclipse = throttledEntry.calculateEclipse || calculateEclipse;
      throttledEntry.signature = buildEphemerisSignature(params, throttledEntry.calculateLunar, throttledEntry.calculateEclipse);
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
      this.pendingEntries.set(baseKey, throttledEntry);
    }

    const activeEntry = throttledEntry;

    if (!this.timer) {
      const remaining = Math.max(0, throttleMs - elapsed);
      this.timer = setTimeout(() => {
        this.timer = null;
        this.lastDispatchTime = Date.now();
        this.flushPendingEntries(host);
      }, remaining);
    }

    return {
      isQueued: () =>
        activeEntry.dispatchedEntry === null &&
        this.pendingEntries.get(baseKey) === activeEntry &&
        activeEntry.callbacks.has(onResult),
      unsubscribe: () => {
        activeEntry.callbacks.delete(onResult);
        if (activeEntry.callbacks.size === 0) {
          if (this.pendingEntries.get(baseKey) === activeEntry) {
            this.pendingEntries.delete(baseKey);
          }
          if (this.pendingEntries.size === 0 && this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }
        }
        if (activeEntry.dispatchedEntry) {
          activeEntry.dispatchedEntry.callbacks.delete(onResult);
          if (activeEntry.dispatchedEntry.callbacks.size === 0) {
            host.clearDispatchedEntry(activeEntry.dispatchedEntry);
          }
        }
      }
    };
  }

  /**
   * Flushes all queued trailing-edge entries to the worker.
   */
  public flushPendingEntries(host: ThrottleDispatchHost): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.pendingEntries.size === 0) return;

    const entries = Array.from(this.pendingEntries.values());
    this.pendingEntries.clear();

    const worker = host.getWorker();
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
      host.registerAndPost(worker, requestEntry, 'CALCULATE_EPHEMERIS');
    }
  }

  /**
   * Drains active throttled entries into PendingEphemerisEntry records during worker failure.
   */
  public drainForFailure(): PendingEphemerisEntry[] {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const drained: PendingEphemerisEntry[] = [];
    for (const throttled of this.pendingEntries.values()) {
      if (throttled.callbacks.size > 0) {
        drained.push({
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
    this.pendingEntries.clear();
    return drained;
  }

  /**
   * Clears queued entries, active timer, and dispatch timestamp tracking.
   */
  public clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingEntries.clear();
    this.lastDispatchTime = 0;
  }
}
