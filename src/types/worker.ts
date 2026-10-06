/**
 * @file worker.ts
 * Type definitions for off-main-thread Web Worker serialization contracts and RPC messages.
 */

import { LunarEvents, EclipseData, AnnualSolarMatrixItem, AnnualLunarMatrixItem } from './astronomy';
import { Latitude, Longitude, JulianDate, HoursDecimal } from './units';

/** Instantaneous ephemeris calculation input parameters */
export interface EphemerisCalculationParams {
  latitude: Latitude;
  longitude: Longitude;
  julianDate: JulianDate | number;
  timeOfDay: HoursDecimal;
  isLunarActive?: boolean;
  isEclipseActive?: boolean;
  isOrbitalActive?: boolean;
  throttleMs?: number;
}

/** Instantaneous ephemeris calculation worker payload output */
export interface EphemerisWorkerPayload {
  lunarEvents: LunarEvents | null;
  eclipse: EclipseData | null;
  timestamp: number;
}

/** Annual matrix computation parameters */
export interface AnnualMatrixParams {
  year: number;
  latitude: Latitude;
  longitude: Longitude;
}

export type AnnualCalculationType = 'ANNUAL_SOLAR' | 'ANNUAL_LUNAR';

export interface AnnualCalculationPayloadMap {
  ANNUAL_SOLAR: { annualSolar: AnnualSolarMatrixItem[] };
  ANNUAL_LUNAR: { annualLunar: AnnualLunarMatrixItem[] };
}

export interface AnnualCalculationParamsMap {
  ANNUAL_SOLAR: { year: number; latitude: Latitude };
  ANNUAL_LUNAR: { year: number; latitude: Latitude; longitude: Longitude };
}

export interface AnnualCalculationRequestTypeMap {
  ANNUAL_SOLAR: 'CALCULATE_ANNUAL_SOLAR';
  ANNUAL_LUNAR: 'CALCULATE_ANNUAL_LUNAR';
}

export interface AnnualCalculationCacheItemMap {
  ANNUAL_SOLAR: AnnualSolarMatrixItem[];
  ANNUAL_LUNAR: AnnualLunarMatrixItem[];
}

/** Worker request message discriminators */
export type EphemerisWorkerRequest =
  | {
      id: number;
      type: 'CALCULATE_EPHEMERIS';
      payload: EphemerisCalculationParams & { calculateLunar?: boolean; calculateEclipse?: boolean };
    }
  | {
      id: number;
      type: 'CALCULATE_ANNUAL_SOLAR';
      payload: { year: number; latitude: Latitude };
    }
  | {
      id: number;
      type: 'CALCULATE_ANNUAL_LUNAR';
      payload: { year: number; latitude: Latitude; longitude: Longitude };
    };

export type EphemerisWorkerRequestType = EphemerisWorkerRequest['type'];

/** Worker response message discriminators */
export type EphemerisWorkerResponse =
  | {
      id: number;
      type: 'EPHEMERIS_SUCCESS';
      payload: EphemerisWorkerPayload;
    }
  | {
      id: number;
      type: 'EPHEMERIS_ERROR';
      error: string;
    }
  | {
      id: number;
      type: 'ANNUAL_SOLAR_SUCCESS';
      payload: { annualSolar: AnnualSolarMatrixItem[] };
    }
  | {
      id: number;
      type: 'ANNUAL_SOLAR_ERROR';
      error: string;
    }
  | {
      id: number;
      type: 'ANNUAL_LUNAR_SUCCESS';
      payload: { annualLunar: AnnualLunarMatrixItem[] };
    }
  | {
      id: number;
      type: 'ANNUAL_LUNAR_ERROR';
      error: string;
    };

export type EphemerisWorkerResponseType = EphemerisWorkerResponse['type'];

/** Discriminated pending entry for instantaneous ephemeris calculation */
export interface PendingEphemerisEntry {
  type: 'EPHEMERIS';
  signature: string;
  callbacks: Set<(payload: EphemerisWorkerPayload) => void>;
  params: EphemerisCalculationParams & { calculateLunar?: boolean; calculateEclipse?: boolean };
}

/** Discriminated pending entry for 365-day annual solar matrix calculation */
export interface PendingAnnualSolarEntry {
  type: 'ANNUAL_SOLAR';
  signature: string;
  callbacks: Set<(payload: AnnualCalculationPayloadMap['ANNUAL_SOLAR']) => void>;
  params: AnnualCalculationParamsMap['ANNUAL_SOLAR'];
}

/** Discriminated pending entry for 365-day annual lunar matrix calculation */
export interface PendingAnnualLunarEntry {
  type: 'ANNUAL_LUNAR';
  signature: string;
  callbacks: Set<(payload: AnnualCalculationPayloadMap['ANNUAL_LUNAR']) => void>;
  params: AnnualCalculationParamsMap['ANNUAL_LUNAR'];
}

export type PendingAnnualCalculationEntry<K extends AnnualCalculationType> =
  K extends 'ANNUAL_SOLAR' ? PendingAnnualSolarEntry : PendingAnnualLunarEntry;

/** Discriminated union of all pending worker manager requests */
export type PendingRequestEntry =
  | PendingEphemerisEntry
  | PendingAnnualSolarEntry
  | PendingAnnualLunarEntry;

