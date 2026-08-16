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

/** Worker request message discriminators */
export type EphemerisWorkerRequestType = 
  | 'INSTANT_EPHEMERIS' 
  | 'ANNUAL_SOLAR_MATRIX' 
  | 'ANNUAL_LUNAR_MATRIX';

/** Base request payload sent from manager to worker */
export interface EphemerisWorkerRequest {
  id: number;
  type: EphemerisWorkerRequestType;
  params: EphemerisCalculationParams | AnnualMatrixParams;
}

/** Base response payload returned from worker to manager */
export interface EphemerisWorkerResponse {
  id: number;
  type: EphemerisWorkerRequestType;
  success: boolean;
  data?: EphemerisWorkerPayload | AnnualSolarMatrixItem[] | AnnualLunarMatrixItem[];
  error?: string;
}

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
  callbacks: Set<(payload: { annualSolar: AnnualSolarMatrixItem[] }) => void>;
  params: { year: number; latitude: Latitude };
}

/** Discriminated pending entry for 365-day annual lunar matrix calculation */
export interface PendingAnnualLunarEntry {
  type: 'ANNUAL_LUNAR';
  signature: string;
  callbacks: Set<(payload: { annualLunar: AnnualLunarMatrixItem[] }) => void>;
  params: { year: number; latitude: Latitude; longitude: Longitude };
}

/** Discriminated union of all pending worker manager requests */
export type PendingRequestEntry =
  | PendingEphemerisEntry
  | PendingAnnualSolarEntry
  | PendingAnnualLunarEntry;

