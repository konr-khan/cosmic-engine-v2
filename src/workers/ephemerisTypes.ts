import {
  EphemerisCalculationParams,
  EphemerisWorkerPayload,
  PendingRequestEntry,
  PendingEphemerisEntry,
  PendingAnnualSolarEntry,
  PendingAnnualLunarEntry,
  AnnualCalculationType,
  PendingAnnualCalculationEntry
} from '../types/worker';
import { AnnualSolarMatrixItem, AnnualLunarMatrixItem } from '../types/astronomy';

export interface PendingThrottledEphemerisEntry {
  signature: string;
  params: EphemerisCalculationParams;
  calculateLunar: boolean;
  calculateEclipse: boolean;
  callbacks: Set<(payload: EphemerisWorkerPayload) => void>;
  dispatchedEntry: PendingEphemerisEntry | null;
}

export interface EphemerisRequestParams extends EphemerisCalculationParams {
  calculateLunar?: boolean;
  calculateEclipse?: boolean;
  throttleMs?: number;
}

export interface EphemerisSubscription {
  /** Updates parameters for a mounted consumer without cancelling in-flight worker work. */
  update: (
    params: EphemerisRequestParams,
    onResult: (payload: EphemerisWorkerPayload, jd: number, lat: number, lon: number) => void
  ) => void;
  /** Disposes all queued and in-flight registrations for an unmounting/disabled consumer. */
  dispose: () => void;
}

export interface EphemerisRequestHandle {
  unsubscribe: () => void;
  isQueued: () => boolean;
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
 * Canonical deduplication signature for ephemeris worker requests.
 */
export function buildEphemerisSignature(
  params: Pick<EphemerisCalculationParams, 'latitude' | 'longitude' | 'julianDate' | 'timeOfDay'>,
  calculateLunar: boolean,
  calculateEclipse: boolean
): string {
  return `EPHEMERIS_${params.latitude}_${params.longitude}_${params.julianDate}_${params.timeOfDay}_${calculateLunar}_${calculateEclipse}`;
}
