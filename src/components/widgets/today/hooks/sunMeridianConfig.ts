/**
 * @file sunMeridianConfig.ts
 * View-model builders for SunMeridianDome solstice swaths and radial tick pins.
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
  getSolarTwilightTier,
  createMeridianSwathConfig,
  createMeridianRadialTickConfig,
} from './meridianConfigHelpers';

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
