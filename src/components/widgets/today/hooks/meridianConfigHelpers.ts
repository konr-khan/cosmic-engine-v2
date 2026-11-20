/**
 * @file meridianConfigHelpers.ts
 * Reusable view-model transformation helper functions for Meridian Dome widgets.
 * Constructs typed configurations for radial tick pins, milestone swaths, gate anchors,
 * and peak targets across Sun and Moon meridian visualizers.
 */

import {
  RadialTickLine,
  SkyDomeLunarNode,
  calculateSkyDomeLunarNodes,
  classifySolarTwilightPhase,
  SolarTwilightPhase,
} from '../../../../utils/cosmicMath';
import {
  MeridianSwathConfig,
  MeridianRadialTickConfig,
  MeridianGateAnchorConfig,
  MeridianPeakTargetConfig,
} from '../MeridianDomeBase';

export {
  buildSunMeridianSwaths,
  buildSunMeridianRadialTicks,
} from './sunMeridianConfig';
export type {
  BuildSunMeridianSwathsParams,
  BuildSunMeridianRadialTicksParams,
} from './sunMeridianConfig';
export {
  buildMoonMeridianSwaths,
  buildMoonMeridianRadialTicks,
} from './moonMeridianConfig';
export type {
  BuildMoonMeridianSwathsParams,
  BuildMoonMeridianRadialTicksParams,
} from './moonMeridianConfig';

const MERIDIAN_TWILIGHT_TIER_LABELS: Record<SolarTwilightPhase, string> = {
  midnight_sun: 'Daylight',
  daylight: 'Daylight',
  civil_twilight: 'Civil Twilight',
  nautical_twilight: 'Nautical Twilight',
  astronomical_twilight: 'Astro Twilight',
  polar_night: 'Polar Night',
  night: 'Polar Night',
};

/**
 * Classifies a solar elevation angle (in degrees) into its twilight/daylight tier label.
 */
export function getSolarTwilightTier(alt: number): string {
  return MERIDIAN_TWILIGHT_TIER_LABELS[
    classifySolarTwilightPhase(alt, { horizonThresholdDeg: 0 })
  ];
}

/**
 * Creates a MeridianRadialTickConfig for perpendicular dome ticks.
 */
export function createMeridianRadialTickConfig(
  id: string,
  tick: RadialTickLine,
  stroke: string,
  title: string,
  strokeWidth?: number,
  strokeDasharray?: string
): MeridianRadialTickConfig {
  const config: MeridianRadialTickConfig = {
    id,
    tick,
    stroke,
    title,
  };
  if (strokeWidth !== undefined) {
    config.strokeWidth = strokeWidth;
  }
  if (strokeDasharray !== undefined) {
    config.strokeDasharray = strokeDasharray;
  }
  return config;
}

/**
 * Creates a MeridianSwathConfig for arc highlight intervals between milestones.
 */
export function createMeridianSwathConfig(
  id: string,
  d: string,
  stroke: string,
  title?: string,
  options?: Partial<MeridianSwathConfig>
): MeridianSwathConfig {
  return {
    id,
    d,
    stroke,
    ...(title !== undefined ? { title } : {}),
    ...options,
  };
}

/**
 * Creates a MeridianGateAnchorConfig for marking horizon or twilight crossing gates.
 */
export function createMeridianGateAnchorConfig(
  id: string,
  anchorPoint: { x: number; y: number },
  stroke: string,
  title: string,
  r: number = 3.5
): MeridianGateAnchorConfig {
  return {
    id,
    x: anchorPoint.x,
    y: anchorPoint.y,
    r,
    stroke,
    title,
  };
}

/**
 * Creates a MeridianPeakTargetConfig for targeting the daily culmination peak.
 */
export function createMeridianPeakTargetConfig(
  id: string,
  peakPoint: { x: number; y: number },
  stroke: string,
  title: string
): MeridianPeakTargetConfig {
  return {
    id,
    peakPoint,
    stroke,
    title,
  };
}

export type ActiveSkyDomeNodalData = ReturnType<typeof calculateSkyDomeLunarNodes>;

export type NullableSkyDomeNodalData = Omit<
  ActiveSkyDomeNodalData,
  'ascendingNode' | 'descendingNode' | 'upcomingNode' | 'nearestNode'
> & {
  ascendingNode: SkyDomeLunarNode | null;
  descendingNode: SkyDomeLunarNode | null;
  upcomingNode: SkyDomeLunarNode | null;
  nearestNode: SkyDomeLunarNode | null;
};

/**
 * Returns a typed placeholder structure when Draconic Nodal Mode is inactive.
 */
export function createInactiveNodalData(): NullableSkyDomeNodalData {
  return {
    ascendingNode: null,
    descendingNode: null,
    moonBeta: 0,
    isMoonAscending: false,
    isWaxing: false,
    argumentOfLatitude: 0,
    orbitalProgressPercent: 0,
    daysToNextNode: 0,
    daysSincePrevNode: 0,
    upcomingNodeType: 'ascending',
    prevNodeType: 'descending',
    upcomingNode: null,
    nearestNode: null,
    nearestNodeType: 'ascending',
    nearestNodeDistDays: 0,
    isApproachingNearestNode: false,
    isNearNode: false,
    quadrantLabel: '',
    timelineNodes: [],
    timelineSegments: [],
  };
}
