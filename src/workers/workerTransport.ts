import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';
import {
  EphemerisWorkerRequest,
  EphemerisWorkerResponse,
  PendingEphemerisEntry,
  PendingRequestEntry
} from '../types/worker';

export interface WorkerTransportCallbacks {
  onSyncFallback: (entry: PendingRequestEntry) => void;
  onAnnualSolarSuccess: (signature: string, data: AnnualSolarMatrixItem[]) => void;
  onAnnualLunarSuccess: (signature: string, data: AnnualLunarMatrixItem[]) => void;
  drainThrottledForFailure: () => PendingEphemerisEntry[];
  onUnloadTerminate: () => void;
}

/**
 * Low-level singleton Web Worker transport, request registry, timeout guard,
 * out-of-order monotonic sequence filter, and page-unload lifecycle handler.
 */
export class WorkerTransport {
  public worker: Worker | null = null;
  public nextRequestId: number = 0;
  public readonly pendingRequests: Map<number, PendingRequestEntry> = new Map();
  public readonly signatureToRequestId: Map<string, number> = new Map();
  public readonly requestTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map();
  public isAvailableFlag: boolean = typeof Worker !== 'undefined';
  public latestProcessedEphemerisId: number = 0;

  private readonly _callbacks: WorkerTransportCallbacks;
  private readonly _boundOnUnload: () => void;
  private _hasUnloadListeners: boolean = false;

  constructor(callbacks: WorkerTransportCallbacks) {
    this._callbacks = callbacks;
    this._boundOnUnload = () => this._callbacks.onUnloadTerminate();
    this.ensureUnloadListeners();
  }

  public ensureUnloadListeners(): void {
    if (this._hasUnloadListeners) return;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('beforeunload', this._boundOnUnload);
      window.addEventListener('pagehide', this._boundOnUnload);
      this._hasUnloadListeners = true;
    }
  }

  public removeUnloadListeners(): void {
    if (!this._hasUnloadListeners) return;
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('beforeunload', this._boundOnUnload);
      window.removeEventListener('pagehide', this._boundOnUnload);
    }
    this._hasUnloadListeners = false;
  }

  public isAvailable(): boolean {
    return typeof Worker !== 'undefined' && this.isAvailableFlag !== false;
  }

  /**
   * Initializes or retrieves the singleton Web Worker instance.
   */
  public getWorker(): Worker | null {
    if (!this.isAvailable()) {
      return null;
    }

    if (!this.worker) {
      try {
        this.ensureUnloadListeners();
        this.worker = new Worker(
          new URL('./ephemerisWorker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (event: MessageEvent<EphemerisWorkerResponse>) => {
          this.handleWorkerMessage(event.data);
        };

        this.worker.onerror = (error) => {
          this.handleWorkerFailure(error);
        };
      } catch {
        this.isAvailableFlag = false;
        this.worker = null;
        return null;
      }
    }

    return this.worker;
  }

  /**
   * Sets a safety timeout guard for a dispatched worker request.
   */
  public setRequestTimeout(requestId: number, _entry: PendingRequestEntry, ms: number = 5000): void {
    this.clearRequestTimeout(requestId);
    const timer = setTimeout(() => {
      this.requestTimeouts.delete(requestId);
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        this.signatureToRequestId.delete(pending.signature);
        console.warn(`[EphemerisWorkerManager] Request ${requestId} (${pending.type}) timed out after ${ms}ms; invoking synchronous fallback.`);
        this._callbacks.onSyncFallback(pending);
      }
    }, ms);
    this.requestTimeouts.set(requestId, timer);
  }

  /**
   * Clears any active timeout guard for a completed or cancelled request.
   */
  public clearRequestTimeout(requestId: number): void {
    const timer = this.requestTimeouts.get(requestId);
    if (timer) {
      clearTimeout(timer);
      this.requestTimeouts.delete(requestId);
    }
  }

  public notifyCallbacks<TPayload>(
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

  public createUnsubscribe<TCallback>(
    requestId: number,
    signature: string,
    callbacks: Set<TCallback>,
    callback: TCallback
  ): () => void {
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.clearRequestTimeout(requestId);
        this.pendingRequests.delete(requestId);
        this.signatureToRequestId.delete(signature);
      }
    };
  }

  public clearDispatchedBySignature(signature: string): void {
    const reqId = this.signatureToRequestId.get(signature);
    if (reqId !== undefined) {
      this.clearRequestTimeout(reqId);
      this.pendingRequests.delete(reqId);
      this.signatureToRequestId.delete(signature);
    }
  }

  public registerAndPost(
    worker: Worker,
    requestEntry: PendingRequestEntry,
    requestType: EphemerisWorkerRequest['type']
  ): number {
    const requestId = ++this.nextRequestId;
    this.pendingRequests.set(requestId, requestEntry);
    this.signatureToRequestId.set(requestEntry.signature, requestId);
    this.setRequestTimeout(requestId, requestEntry);

    try {
      const message = {
        type: requestType,
        id: requestId,
        payload: requestEntry.params
      } as EphemerisWorkerRequest;
      worker.postMessage(message);
    } catch (error) {
      this.handleWorkerFailure(error);
    }

    return requestId;
  }

  public handleWorkerMessage(response: EphemerisWorkerResponse): void {
    if (!response) return;
    const { type, id } = response;
    if (typeof id === 'number') {
      this.clearRequestTimeout(id);
    }

    const requestEntry = this.pendingRequests.get(id);
    if (!requestEntry) return;

    if (type === 'EPHEMERIS_SUCCESS' && requestEntry.type === 'EPHEMERIS') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);

      if (id < this.latestProcessedEphemerisId) {
        return;
      }
      this.latestProcessedEphemerisId = id;
      this.notifyCallbacks(requestEntry.callbacks, response.payload, 'Ephemeris');
    } else if (type === 'ANNUAL_SOLAR_SUCCESS' && requestEntry.type === 'ANNUAL_SOLAR') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (response.payload?.annualSolar) {
        this._callbacks.onAnnualSolarSuccess(requestEntry.signature, response.payload.annualSolar);
      }
      this.notifyCallbacks(requestEntry.callbacks, response.payload, 'Annual solar');
    } else if (type === 'ANNUAL_LUNAR_SUCCESS' && requestEntry.type === 'ANNUAL_LUNAR') {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (response.payload?.annualLunar) {
        this._callbacks.onAnnualLunarSuccess(requestEntry.signature, response.payload.annualLunar);
      }
      this.notifyCallbacks(requestEntry.callbacks, response.payload, 'Annual lunar');
    } else if (
      type === 'EPHEMERIS_ERROR' ||
      type === 'ANNUAL_SOLAR_ERROR' ||
      type === 'ANNUAL_LUNAR_ERROR'
    ) {
      this.pendingRequests.delete(id);
      this.signatureToRequestId.delete(requestEntry.signature);
      if (type !== 'EPHEMERIS_ERROR' || id >= this.latestProcessedEphemerisId) {
        this._callbacks.onSyncFallback(requestEntry);
      }
    }
  }

  /**
   * Handles unexpected worker failure by draining pending requests into synchronous fallbacks
   * and terminating the broken worker instance.
   */
  public handleWorkerFailure(_error?: unknown): void {
    this.isAvailableFlag = false;
    for (const timer of this.requestTimeouts.values()) {
      clearTimeout(timer);
    }
    this.requestTimeouts.clear();

    const pending = Array.from(this.pendingRequests.values());
    const drainedThrottled = this._callbacks.drainThrottledForFailure();
    pending.push(...drainedThrottled);

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
      this._callbacks.onSyncFallback(entry);
    }
  }

  /**
   * Terminates the active worker, removes unload listeners, and resets request state.
   */
  public terminate(): void {
    this.removeUnloadListeners();
    for (const timer of this.requestTimeouts.values()) {
      clearTimeout(timer);
    }
    this.requestTimeouts.clear();
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
    this.isAvailableFlag = typeof Worker !== 'undefined';
  }
}
