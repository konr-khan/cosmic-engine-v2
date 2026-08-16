/**
 * @file store.ts
 * External state store contracts, window layout definitions, and subscriber types.
 */

import { Latitude, Longitude, HoursDecimal, SpeedMultiplier } from './units';

/** Master state model for CosmicStore */
export interface CosmicStoreState {
  date: Date;
  timeOfDay: HoursDecimal;
  speed: SpeedMultiplier;
  isPlaying: boolean;
  latitude: Latitude;
  longitude: Longitude;
  useAnalemma: boolean;
}

/** Partial state updater for store mutations */
export type StateUpdater<T> = Partial<T> | ((prevState: T) => Partial<T>);

/** Selector subscription function type */
export type StateSelector<T, R> = (state: T) => R;

/** Layout item configuration for draggable/resizable windows */
export interface WindowLayoutItem {
  id: string;
  title?: string;
  colSpan?: number;
  rowSpan?: number;
  isMinimized?: boolean;
  isLocked?: boolean;
  order?: number;
}

/** Complete window layout configuration dictionary */
export type WindowLayoutConfig = Record<string, WindowLayoutItem>;

/** Predefined observatory dashboard layouts */
export type WindowLayoutPreset = 'default' | 'astronomer' | 'solar' | 'lunar' | 'eclipses' | 'minimal';
