/**
 * @file mockWorkerFixture.ts
 * Shared strongly-typed Web Worker double for EphemerisWorkerManager and hook test suites.
 * Eliminates ad-hoc inline MockWorker class definitions while tracking instances and messages.
 */

import { vi } from 'vitest';

export interface MockWorkerMessageEvent<T = unknown> {
  data: T;
}

export class MockWorker {
  static instances: MockWorker[] = [];

  static reset(): void {
    MockWorker.instances = [];
  }

  readonly url: string | URL | undefined;
  readonly options: WorkerOptions | undefined;
  readonly postMessage = vi.fn<(message: unknown) => void>();
  readonly terminate = vi.fn<() => void>();
  onmessage: ((event: MockWorkerMessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent | Error) => void) | null = null;

  constructor(url?: string | URL, options?: WorkerOptions) {
    this.url = url;
    this.options = options;
    MockWorker.instances.push(this);
  }

  emitMessage<T>(data: T): void {
    this.onmessage?.({ data });
  }

  emitError(error: ErrorEvent | Error): void {
    this.onerror?.(error);
  }
}

export function installMockWorker(): typeof MockWorker {
  MockWorker.reset();
  globalThis.Worker = MockWorker as unknown as typeof Worker;
  return MockWorker;
}
