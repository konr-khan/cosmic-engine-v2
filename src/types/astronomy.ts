/**
 * @file astronomy.ts
 * Astronomical data structures for solar almanac, lunar ephemeris, syzygy eclipse geometry, and tidal vectors.
 */

import { Degrees, HoursDecimal, JulianDate } from './units';
import { OrbitalPositions, OrbitalAngles } from './coordinates';

/** Standard twilight elevation thresholds below true horizon */
export interface TwilightThresholds {
  /** Center of solar disc on true horizon (-0.833° accounting for refraction & solar radius) */
  OFFICIAL: Degrees | number;
  /** Civil twilight threshold (-6°) */
  CIVIL: Degrees | number;
  /** Nautical twilight threshold (-12°) */
  NAUTICAL: Degrees | number;
  /** Astronomical twilight threshold (-18°) */
  ASTRONOMICAL: Degrees | number;
}

/** Instantaneous solar position parameters */
export interface SolarPosition {
  declination: Degrees | number;
  equationOfTime: number;
  n: number;
  lambda: Degrees | number;
}

/** Comprehensive Solar Almanac computation output */
export interface SolarAlmanacData {
  dayLength: number;
  civil: number;
  nautical: number;
  astronomical: number;
  sunrise: number;
  sunset: number;
  solarNoon: number;
  equationOfTime: number;
  daysSinceEpoch: number;
  noonElevation: Degrees | number;
  declination: Degrees | number;
  lambda: Degrees | number;
  eclipticLongitude: Degrees | number;
  isPolarNight: boolean;
  isMidnightSun: boolean;
}

/** Full instantaneous solar position & Earth orbital dynamics */
export interface SolarPositionFull extends SolarPosition {
  rightAscension: number;
  distanceAU: number;
  distanceKm: number;
  orbitalSpeedKms: number;
  solarIrradianceWm2: number;
  solarIrradiancePercent: number;
  sunAngularDiameterArcmin: number;
  sunAngularRadiusDeg: number;
  isPerihelion: boolean;
  isAphelion: boolean;
  meanAnomaly: number;
  eclipticLongitude: number;
}

/** Single-day record in the 365-day annual solar matrix */
export interface AnnualSolarMatrixItem {
  day: number;
  declination: Degrees | number;
  equationOfTime: number;
  solarNoon: number;
  sunrise: number;
  sunset: number;
  civilDawn: number;
  civilDusk: number;
  nauticalDawn: number;
  nauticalDusk: number;
  astroDawn: number;
  astroDusk: number;
  dayLength: number;
}

/** Alias for annual solar matrix item record */
export type SolarMatrixRecord = AnnualSolarMatrixItem;

/** Lunar phase classification names */
export type LunarPhaseName = 
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

/** Meeus analytical lunar ephemeris output */
export interface LunarPosition {
  rightAscension: HoursDecimal | number;
  declination: Degrees | number;
  distance?: number;
  distanceKm: number;
  distanceEarthRadii?: number;
  phase: number;
  phaseName: LunarPhaseName;
  elongation: Degrees | number;
  parallacticAngle: Degrees | number;
  nodeLongitude: Degrees | number;
  descendingNodeLongitude: Degrees | number;
  lambda: Degrees | number;
  eclipticLongitude?: Degrees | number;
  beta: Degrees | number;
  eclipticLatitude?: Degrees | number;
  angularRadiusDeg?: number;
  parallaxDeg?: number;
  argumentOfLatitude?: number;
}

/** Full lunar position solver output with extended angular metrics */
export interface LunarPositionFull extends LunarPosition {
  distanceEarthRadii: number;
  angularRadiusDeg: number;
  parallaxDeg: number;
  argumentOfLatitude: number;
}

/** Lunar calendar events, transit timings & apsides metrics */
export interface LunarEvents {
  moonrise: number | null;
  transit: number;
  moonset: number | null;
  distanceKm: number;
  distanceEarthRadii: number;
  isPerigee: boolean;
  isApogee: boolean;
  declination: Degrees | number;
  parallacticAngle: number;
}

/** Alias for lunar event metrics */
export type LunarEventMetrics = LunarEvents;

/** Single-day record in the 365-day annual lunar matrix */
export interface AnnualLunarMatrixItem {
  day: number;
  moonrise: number | null;
  transit: number;
  moonset: number | null;
  phaseValue: number;
  isPerigee: boolean;
  isApogee: boolean;
  distanceKm: number;
}

/** Alias for annual lunar matrix item record */
export type LunarMatrixRecord = AnnualLunarMatrixItem;

/** Gravitational tidal classification */
export type TideType = 'Spring Tide' | 'Neap Tide' | 'Transitional';

/** Gravitational tidal vector parameters */
export interface TidalVectors {
  rx: number;
  ry: number;
  type: TideType;
  alignment: number;
}

/** Eclipse geometrical classifications */
export type EclipseType = 
  | 'TOTAL_SOLAR' 
  | 'ANNULAR_SOLAR' 
  | 'PARTIAL_SOLAR' 
  | 'TOTAL_LUNAR' 
  | 'PARTIAL_LUNAR' 
  | 'PENUMBRAL_LUNAR' 
  | 'NONE'
  | 'total' 
  | 'annular' 
  | 'partial' 
  | 'penumbral' 
  | 'hybrid' 
  | 'none';

export type EclipseClassification = 
  | 'Total Solar'
  | 'Annular Solar'
  | 'Partial Solar'
  | 'Total Lunar'
  | 'Partial Lunar'
  | 'Penumbral Lunar'
  | 'None';

/** Syzygy eclipse analysis metrics */
export interface EclipseData {
  type: EclipseType;
  category: 'SOLAR' | 'LUNAR' | 'NO_ECLIPSE';
  label: string;
  obscuration: number;
  beta: number;
  nodeProximityDeg: number;
  alignmentPercent: number;
  isEclipseActive: boolean;
  distanceKm: number;
  umbraRadiusKm: number;
  penumbraRadiusKm: number;
  raDiff: number;
  elongation: number;
  phaseValue: number;
  isEclipse?: boolean;
  classification?: EclipseClassification | string;
  target?: 'Solar' | 'Lunar' | 'None';
  magnitude?: number;
  nodeAlignment?: number;
  nodeAngleDeg?: number;
  isWithinNodeCorridor?: boolean;
  gamma?: number;
  pathWidthKm?: number;
}

/** Historical or future eclipse scanner preset */
export interface EclipseScannerPreset {
  id: string;
  name: string;
  date: string | Date;
  timeOfDay: number;
  latitude: number;
  longitude: number;
  description: string;
  type: EclipseType;
}

/** Orbital simulation data package */
export interface OrbitalData {
  positions: OrbitalPositions;
  angles: OrbitalAngles;
  nodeLongitude: number;
  descendingNodeLongitude: number;
  lunarPos: LunarPosition;
  phase: { value: number; name: LunarPhaseName };
  tides: TidalVectors;
  userRotation: number;
  localTideStatus: 'High Tide' | 'Low Tide';
  lunarEvents: LunarEvents | null;
  eclipse: EclipseData | null;
}

/** Root output returned by useCosmicEngine */
export interface CosmicEngineData {
  solarData: SolarAlmanacData;
  orbitalData: OrbitalData | null;
  julianDate: JulianDate | number;
}

/** Active widget visibility filter map */
export interface ActiveWidgetsFilter {
  solarAlmanac?: boolean;
  sunClock?: boolean;
  lunarAlmanac?: boolean;
  eclipse?: boolean;
  celestialSphere?: boolean;
  terminator?: boolean;
  macroOrbit?: boolean;
  microTides?: boolean;
  [key: string]: boolean | undefined;
}
