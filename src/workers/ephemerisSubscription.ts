import { EphemerisWorkerPayload } from '../types/worker';
import {
  EphemerisRequestHandle,
  EphemerisRequestParams,
  EphemerisSubscription
} from './ephemerisTypes';

export interface SubscriptionChannelHost {
  isAvailable: () => boolean;
  getLastDispatchTime: () => number;
  dispatchInternal: (
    params: EphemerisRequestParams,
    onResult: (payload: EphemerisWorkerPayload) => void,
    now: number
  ) => EphemerisRequestHandle;
}

/**
 * Creates a persistent per-consumer subscription channel for high-frequency consumers (e.g. 60 FPS playback).
 * Replaces superseded queued-but-undispatched throttled entries without cancelling in-flight worker work
 * or resetting active throttle timers.
 */
export function createManagedEphemerisSubscription(
  host: SubscriptionChannelHost
): EphemerisSubscription {
  let disposed = false;
  let nextSeq = 0;
  let queuedEntry: { seq: number; handle: EphemerisRequestHandle } | null = null;
  const inFlight = new Map<number, EphemerisRequestHandle>();

  const pruneOlderInFlight = (completedSeq: number) => {
    for (const [seq, handle] of Array.from(inFlight.entries())) {
      if (seq <= completedSeq && !handle.isQueued()) {
        handle.unsubscribe();
        inFlight.delete(seq);
      }
    }
  };

  return {
    update: (params, onResult) => {
      if (disposed || !host.isAvailable()) return;

      // Promote any previously queued entry whose throttle timer already fired into inFlight
      if (queuedEntry && !queuedEntry.handle.isQueued()) {
        inFlight.set(queuedEntry.seq, queuedEntry.handle);
        queuedEntry = null;
      }

      const seq = ++nextSeq;
      const reqJd = Number(params.julianDate);
      const reqLat = Number(params.latitude);
      const reqLon = Number(params.longitude);

      const wrappedCallback = (payload: EphemerisWorkerPayload) => {
        inFlight.delete(seq);
        if (queuedEntry?.seq === seq) {
          queuedEntry = null;
        }
        pruneOlderInFlight(seq);
        if (disposed) return;
        onResult(payload, reqJd, reqLat, reqLon);
      };

      const now = Date.now();
      const throttleMs = params.throttleMs ?? 0;
      const elapsed = now - host.getLastDispatchTime();
      const willDispatchImmediately = throttleMs <= 0 || elapsed >= throttleMs;

      // If a leading-edge dispatch runs immediately, discard our stale queued entry first
      // so it is not flushed right alongside this newer frame.
      if (queuedEntry && willDispatchImmediately) {
        queuedEntry.handle.unsubscribe();
        queuedEntry = null;
      }

      const newHandle = host.dispatchInternal(params, wrappedCallback, now);

      // Within an active throttle window, cancel our superseded queued callback after adding the new one
      // so pendingThrottledEntries remains non-empty and the existing timer is preserved without churn.
      if (queuedEntry) {
        queuedEntry.handle.unsubscribe();
        queuedEntry = null;
      }

      if (newHandle.isQueued()) {
        queuedEntry = { seq, handle: newHandle };
      } else {
        inFlight.set(seq, newHandle);
      }
    },

    dispose: () => {
      disposed = true;
      if (queuedEntry) {
        queuedEntry.handle.unsubscribe();
        queuedEntry = null;
      }
      for (const handle of inFlight.values()) {
        handle.unsubscribe();
      }
      inFlight.clear();
    }
  };
}
