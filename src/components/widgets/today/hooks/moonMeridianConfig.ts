/**
 * @file moonMeridianConfig.ts
 * View-model builders for MoonMeridianDome standstill/monthly swaths and radial tick pins.
 */

import {
  CulminationInfo,
  PolarMeridianCounterpart,
  RadialTickLine,
} from '../../../../utils/cosmicMath';
import {
  MeridianSwathConfig,
  MeridianRadialTickConfig,
} from '../MeridianDomeBase';
import {
  createMeridianSwathConfig,
  createMeridianRadialTickConfig,
} from './meridianConfigHelpers';

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
