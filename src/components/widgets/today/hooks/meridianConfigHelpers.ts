/**
 * @file meridianConfigHelpers.ts
 * Reusable view-model transformation helper functions for Meridian Dome widgets.
 * Constructs typed configurations for radial tick pins, milestone swaths, gate anchors,
 * and peak targets across Sun and Moon meridian visualizers.
 */

import {
  CulminationInfo,
  PolarMeridianCounterpart,
  RadialTickLine,
} from '../../../../utils/cosmicMath';
import {
  MeridianSwathConfig,
  MeridianRadialTickConfig,
  MeridianGateAnchorConfig,
  MeridianPeakTargetConfig,
} from '../MeridianDomeBase';

/**
 * Classifies a solar elevation angle (in degrees) into its twilight/daylight tier label.
 */
export function getSolarTwilightTier(alt: number): string {
  if (alt >= 0) return 'Daylight';
  if (alt >= -6) return 'Civil Twilight';
  if (alt >= -12) return 'Nautical Twilight';
  if (alt >= -18) return 'Astro Twilight';
  return 'Polar Night';
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

export interface BuildSunMeridianSwathsParams {
  juneSwathD: string;
  decemberSwathD: string;
  todayCulmination: CulminationInfo;
  juneSolstice: CulminationInfo;
  decemberSolstice: CulminationInfo;
  isApproachingJune: boolean;
  isApproachingSummer: boolean;
  isPolar: boolean;
  isNorth: boolean;
  showJuneTick: boolean;
  showDecemberTick: boolean;
  polarSummerCounterpartSwathD: string;
  polarWinterCounterpartSwathD: string;
  summerSolsticeColor: string;
  winterSolsticeColor: string;
  summerNoon: number;
  winterNoon: number;
}

/**
 * Builds the solstice and polar antimeridian swath configurations for SunMeridianDome.
 */
export function buildSunMeridianSwaths({
  juneSwathD,
  decemberSwathD,
  todayCulmination,
  juneSolstice,
  decemberSolstice,
  isApproachingJune,
  isApproachingSummer,
  isPolar,
  isNorth,
  showJuneTick,
  showDecemberTick,
  polarSummerCounterpartSwathD,
  polarWinterCounterpartSwathD,
  summerSolsticeColor,
  winterSolsticeColor,
  summerNoon,
  winterNoon,
}: BuildSunMeridianSwathsParams): MeridianSwathConfig[] {
  const juneNoon = juneSolstice.altitude;
  const decemberNoon = decemberSolstice.altitude;

  const juneSwathTitle = juneNoon >= -18
    ? `June Solstice Arc (+23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}${juneNoon < 0 ? ` (${getSolarTwilightTier(juneNoon)})` : ''}${isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `June Solstice Arc (+23.4°): Plunges below −18° Astro Twilight (Polar Night)${isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  const decemberSwathTitle = decemberNoon >= -18
    ? `December Solstice Arc (−23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}${decemberNoon < 0 ? ` (${getSolarTwilightTier(decemberNoon)})` : ''}${!isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `December Solstice Arc (−23.4°): Plunges below −18° Astro Twilight (Polar Night)${!isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  return [
    ...(juneSwathD
      ? [
          createMeridianSwathConfig(
            'solstice-swath-june',
            juneSwathD,
            '#fbbf24',
            juneSwathTitle,
            {
              strokeWidth: isApproachingJune ? 1.25 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: isApproachingJune ? 0.85 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: isApproachingJune ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
    ...(decemberSwathD
      ? [
          createMeridianSwathConfig(
            'solstice-swath-december',
            decemberSwathD,
            '#d97706',
            decemberSwathTitle,
            {
              strokeWidth: !isApproachingJune ? 1.25 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: !isApproachingJune ? 0.85 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: !isApproachingJune ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
    ...(isPolar && polarSummerCounterpartSwathD && (isNorth ? showJuneTick : showDecemberTick)
      ? [
          createMeridianSwathConfig(
            'polar-counterpart-summer-swath',
            polarSummerCounterpartSwathD,
            summerSolsticeColor,
            `Polar Summer Solstice Antimeridian Arc (180°): ${summerNoon.toFixed(1)}° (${isApproachingSummer ? 'Approaching Milestone' : 'Receding'})`,
            {
              strokeWidth: isApproachingSummer ? 1.25 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: isApproachingSummer ? 0.85 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: isApproachingSummer ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
    ...(isPolar && polarWinterCounterpartSwathD && (isNorth ? showDecemberTick : showJuneTick)
      ? [
          createMeridianSwathConfig(
            'polar-counterpart-winter-swath',
            polarWinterCounterpartSwathD,
            winterSolsticeColor,
            `Polar Winter Solstice Antimeridian Arc (180°): ${winterNoon.toFixed(1)}° (${!isApproachingSummer ? 'Approaching Milestone' : 'Receding'})`,
            {
              strokeWidth: !isApproachingSummer ? 1.25 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: !isApproachingSummer ? 0.85 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: !isApproachingSummer ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
  ];
}

export interface BuildSunMeridianRadialTicksParams {
  showJuneTick: boolean;
  showDecemberTick: boolean;
  juneTick: RadialTickLine;
  decemberTick: RadialTickLine;
  equinoxTick: RadialTickLine;
  juneSolstice: CulminationInfo;
  decemberSolstice: CulminationInfo;
  equinoxCulmination: CulminationInfo;
  isPolar: boolean;
  isNorth: boolean;
  polarSummerCounterpart: PolarMeridianCounterpart | null;
  polarWinterCounterpart: PolarMeridianCounterpart | null;
  summerSolsticeColor: string;
  winterSolsticeColor: string;
  summerNoon: number;
  winterNoon: number;
}

/**
 * Builds the perpendicular radial tick pins for SunMeridianDome.
 */
export function buildSunMeridianRadialTicks({
  showJuneTick,
  showDecemberTick,
  juneTick,
  decemberTick,
  equinoxTick,
  juneSolstice,
  decemberSolstice,
  equinoxCulmination,
  isPolar,
  isNorth,
  polarSummerCounterpart,
  polarWinterCounterpart,
  summerSolsticeColor,
  winterSolsticeColor,
  summerNoon,
  winterNoon,
}: BuildSunMeridianRadialTicksParams): MeridianRadialTickConfig[] {
  const juneNoon = juneSolstice.altitude;
  const decemberNoon = decemberSolstice.altitude;

  const juneTickTitle = juneNoon >= 0
    ? `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}`
    : `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag} (${getSolarTwilightTier(juneNoon)})`;

  const decemberTickTitle = decemberNoon >= 0
    ? `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}`
    : `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag} (${getSolarTwilightTier(decemberNoon)})`;

  return [
    ...(showJuneTick
      ? [
          createMeridianRadialTickConfig(
            'summer-solstice-tick',
            juneTick,
            '#fbbf24',
            juneTickTitle,
            1.4
          ),
        ]
      : []),
    ...(showDecemberTick
      ? [
          createMeridianRadialTickConfig(
            'winter-solstice-tick',
            decemberTick,
            '#d97706',
            decemberTickTitle,
            1.4
          ),
        ]
      : []),
    createMeridianRadialTickConfig(
      'equinox-tick',
      equinoxTick,
      '#64748b',
      `Equinox Noon Peak: ${equinoxCulmination.altitude.toFixed(1)}° ${equinoxCulmination.shortTag}`,
      1.0
    ),
    ...(isPolar && polarSummerCounterpart && (isNorth ? showJuneTick : showDecemberTick)
      ? [
          createMeridianRadialTickConfig(
            'polar-counterpart-summer-tick',
            polarSummerCounterpart.oppositeTick,
            summerSolsticeColor,
            `Summer Solstice 24h Antimeridian (180°) Culmination: ${summerNoon.toFixed(1)}° (Midnight Sun)`,
            1.4
          ),
        ]
      : []),
    ...(isPolar && polarWinterCounterpart && (isNorth ? showDecemberTick : showJuneTick)
      ? [
          createMeridianRadialTickConfig(
            'polar-counterpart-winter-tick',
            polarWinterCounterpart.oppositeTick,
            winterSolsticeColor,
            `Winter Solstice 24h Antimeridian (180°) Culmination: ${winterNoon.toFixed(1)}° (${getSolarTwilightTier(winterNoon)})`,
            1.4
          ),
        ]
      : []),
  ];
}

export interface BuildMoonMeridianSwathsParams {
  isStandstillActive: boolean;
  monthlySwathD: string;
  standstillSwathD: string;
  maxSwathD: string;
  minSwathD: string;
  monthMax: CulminationInfo;
  monthMin: CulminationInfo;
  standstillMax: CulminationInfo;
  standstillMin: CulminationInfo;
  isNodalModeActive: boolean;
  nodalThemeColor: string;
  isAscendingBranch: boolean;
  isApproachingMax: boolean;
  targetTierLabel: string;
  peakAlt: number;
  todayShortTag: string;
  targetMaxAlt: number;
  targetMinAlt: number;
  targetMaxTag: string;
  targetMinTag: string;
  isPolar: boolean;
  polarLunarMaxCounterpartSwathD: string;
}

/**
 * Builds the standstill, monthly guide, migration, and polar antimeridian swaths for MoonMeridianDome.
 */
export function buildMoonMeridianSwaths({
  isStandstillActive,
  monthlySwathD,
  standstillSwathD,
  maxSwathD,
  minSwathD,
  monthMax,
  monthMin,
  standstillMax,
  standstillMin,
  isNodalModeActive,
  nodalThemeColor,
  isAscendingBranch,
  isApproachingMax,
  targetTierLabel,
  peakAlt,
  todayShortTag,
  targetMaxAlt,
  targetMinAlt,
  targetMaxTag,
  targetMinTag,
  isPolar,
  polarLunarMaxCounterpartSwathD,
}: BuildMoonMeridianSwathsParams): MeridianSwathConfig[] {
  return [
    ...(isStandstillActive
      ? (monthlySwathD
          ? [
              createMeridianSwathConfig(
                'monthly-lunar-swath-guide',
                monthlySwathD,
                '#94a3b8',
                `Monthly Lunar Transit Range: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'} to ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`,
                {
                  strokeWidth: 0.85,
                  strokeDasharray: '2 3',
                  strokeOpacity: 0.30,
                }
              ),
            ]
          : [])
      : (standstillSwathD
          ? [
              createMeridianSwathConfig(
                'standstill-swath-guide',
                standstillSwathD,
                '#818cf8',
                `18.6-Year Major Standstill Range: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'} to ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`,
                {
                  strokeWidth: 0.85,
                  strokeDasharray: '2 3',
                  strokeOpacity: 0.25,
                }
              ),
            ]
          : [])),
    ...(maxSwathD
      ? [
          createMeridianSwathConfig(
            'lunar-migration-swath-max',
            maxSwathD,
            isNodalModeActive ? nodalThemeColor : isStandstillActive ? '#818cf8' : '#e0e7ff',
            `${targetTierLabel} Max Arc: ${peakAlt.toFixed(1)}° ${todayShortTag} ↔ ${targetMaxAlt.toFixed(1)}° ${targetMaxTag}${isApproachingMax ? ' (Approaching Peak)' : ''}`,
            {
              strokeWidth: isApproachingMax ? 1.4 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: isApproachingMax ? 0.90 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: isApproachingMax ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
    ...(minSwathD
      ? [
          createMeridianSwathConfig(
            'lunar-migration-swath-min',
            minSwathD,
            isNodalModeActive ? (isAscendingBranch ? '#f43f5e' : '#38bdf8') : isStandstillActive ? '#6366f1' : '#94a3b8',
            `${targetTierLabel} Min Arc: ${peakAlt.toFixed(1)}° ${todayShortTag} ↔ ${targetMinAlt > 0 ? targetMinAlt.toFixed(1) + '° ' + targetMinTag : 'Below 0°'}${!isApproachingMax ? ' (Approaching Trough)' : ''}`,
            {
              strokeWidth: !isApproachingMax ? 1.4 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: !isApproachingMax ? 0.90 : 0.40,
              glow: true,
              glowWidth: 4,
              glowOpacity: !isApproachingMax ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
    ...(isPolar && polarLunarMaxCounterpartSwathD && targetMaxAlt >= 0
      ? [
          createMeridianSwathConfig(
            'polar-counterpart-lunar-max-swath',
            polarLunarMaxCounterpartSwathD,
            isStandstillActive ? '#818cf8' : '#e0e7ff',
            `Polar Lunar Max Antimeridian Arc (180°): ${targetMaxAlt.toFixed(1)}° (${isApproachingMax ? 'Approaching Peak' : 'Receding'})`,
            {
              strokeWidth: isApproachingMax ? 1.4 : 0.9,
              strokeDasharray: '3 2',
              strokeOpacity: isApproachingMax ? 0.85 : 0.35,
              glow: true,
              glowWidth: 4,
              glowOpacity: isApproachingMax ? 0.25 : 0.10,
            }
          ),
        ]
      : []),
  ];
}

export interface BuildMoonMeridianRadialTicksParams {
  standstillMaxTick: RadialTickLine;
  standstillMinTick: RadialTickLine;
  monthMaxTick: RadialTickLine;
  monthMinTick: RadialTickLine;
  standstillMax: CulminationInfo;
  standstillMin: CulminationInfo;
  monthMax: CulminationInfo;
  monthMin: CulminationInfo;
  isStandstillActive: boolean;
  isPolar: boolean;
  polarMaxCounterpart: PolarMeridianCounterpart | null;
  targetMaxAlt: number;
  targetTierLabel: string;
}

/**
 * Builds the standstill, monthly, and polar antimeridian radial tick pins for MoonMeridianDome.
 */
export function buildMoonMeridianRadialTicks({
  standstillMaxTick,
  standstillMinTick,
  monthMaxTick,
  monthMinTick,
  standstillMax,
  standstillMin,
  monthMax,
  monthMin,
  isStandstillActive,
  isPolar,
  polarMaxCounterpart,
  targetMaxAlt,
  targetTierLabel,
}: BuildMoonMeridianRadialTicksParams): MeridianRadialTickConfig[] {
  return [
    createMeridianRadialTickConfig(
      'standstill-max-tick',
      standstillMaxTick,
      '#818cf8',
      `Major Standstill Max: ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}${isStandstillActive ? ' (Active Standstill Target)' : ''}`,
      isStandstillActive ? 1.4 : 1.1,
      isStandstillActive ? undefined : '2 1'
    ),
    createMeridianRadialTickConfig(
      'standstill-min-tick',
      standstillMinTick,
      '#6366f1',
      `Major Standstill Min: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'}${isStandstillActive ? ' (Active Standstill Target)' : ''}`,
      isStandstillActive ? 1.4 : 1.1,
      isStandstillActive ? undefined : '2 1'
    ),
    createMeridianRadialTickConfig(
      'monthly-max-tick',
      monthMaxTick,
      '#e2e8f0',
      `Monthly Max Transit Peak: ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}${!isStandstillActive ? ' (Active Monthly Target)' : ''}`,
      !isStandstillActive ? 1.4 : 1.1
    ),
    createMeridianRadialTickConfig(
      'monthly-min-tick',
      monthMinTick,
      '#94a3b8',
      `Monthly Min Transit Peak: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'}${!isStandstillActive ? ' (Active Monthly Target)' : ''}`,
      !isStandstillActive ? 1.4 : 1.1
    ),
    ...(isPolar && polarMaxCounterpart && targetMaxAlt >= 0
      ? [
          createMeridianRadialTickConfig(
            'polar-counterpart-lunar-max-tick',
            polarMaxCounterpart.oppositeTick,
            isStandstillActive ? '#818cf8' : '#e2e8f0',
            `Polar Lunar Max 24h Antimeridian (180°) Culmination: ${targetMaxAlt.toFixed(1)}° (${targetTierLabel})`,
            1.4
          ),
        ]
      : []),
  ];
}
