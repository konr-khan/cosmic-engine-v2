/**
 * @file useSunMeridianMath.ts
 * Custom hook encapsulating all astronomical mathematics, coordinate projections,
 * solstice swaths, radial tick pins, and configuration models for SunMeridianDome.
 * Separates the mathematical engine and geometric projection from the visual presenter.
 */

import { useMemo } from 'react';
import {
  projectSkyDomePoint,
  calculateCulminationBearing,
  calculateSolsticeCulminations,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
  calculateMeridianDiurnalPoint,
  calculateMeridianDiurnalChord,
  calculatePolarMeridianCounterpart,
  CulminationInfo,
  MeridianDiurnalPoint,
  MeridianDiurnalChord,
  PolarMeridianCounterpart,
  MeridianPoint,
  EARTH_AXIAL_OBLIQUITY_J2000_DEG,
  getPolarColureInfo,
  PolarColureInfo,
  getDayOfYear,
  J2000_DATE,
} from '../../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../../types';
import {
  EL_CX,
  EL_CY,
  EL_R,
  MeridianSwathConfig,
  MeridianRadialTickConfig,
  MeridianGateAnchorConfig,
  MeridianPeakTargetConfig,
  MeridianDiurnalChordConfig,
} from '../MeridianDomeBase';
import {
  createMeridianRadialTickConfig,
  createMeridianSwathConfig,
  createMeridianGateAnchorConfig,
  createMeridianPeakTargetConfig,
} from './meridianConfigHelpers';

export interface UseSunMeridianMathParams {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  isTwilightModeActive: boolean;
}

export const OBLIQUITY = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);

export const getTwilightTier = (alt: number): string => {
  if (alt >= 0) return 'Daylight';
  if (alt >= -6) return 'Civil Twilight';
  if (alt >= -12) return 'Nautical Twilight';
  if (alt >= -18) return 'Astro Twilight';
  return 'Polar Night';
};

export const useSunMeridianMath = ({
  solarData,
  displayTime,
  latitude,
  currentDate = J2000_DATE,
  isTwilightModeActive,
}: UseSunMeridianMathParams) => {
  const {
    solarNoon = 12,
    declination: sunDeclination = 0,
  } = solarData || {};

  // --- Real-Time Sun Elevation & Meridian Diurnal Trajectory ---
  const sunHourAngle = (displayTime - solarNoon) * 15;
  const currentSunPos = projectSkyDomePoint(sunHourAngle, Number(sunDeclination), latitude);
  const currentSunElevation = currentSunPos.elevation;

  // Sub-horizon threshold: -18° when Twilight mode active, 0° (horizon baseline) in Std mode
  const thresholdElevation = isTwilightModeActive ? -18 : 0;

  // Real-time instantaneous Sun position along continuous 3D diurnal path
  const activeSunPoint: MeridianDiurnalPoint = useMemo(
    () => calculateMeridianDiurnalPoint(latitude, Number(sunDeclination), sunHourAngle, thresholdElevation),
    [latitude, sunDeclination, sunHourAngle, thresholdElevation]
  );

  // Today's Diurnal Chord in the Meridian projection (touching Meridian Arc at Solar Noon)
  const todayChord: MeridianDiurnalChord = useMemo(
    () => calculateMeridianDiurnalChord(latitude, Number(sunDeclination), thresholdElevation),
    [latitude, sunDeclination, thresholdElevation]
  );

  // --- Culminations & Bearings ---
  const todayCulmination: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const peakAlt = todayCulmination.altitude;

  const solsticeCulminations = useMemo(
    () => calculateSolsticeCulminations(latitude),
    [latitude]
  );

  const equinoxCulmination: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, 0),
    [latitude]
  );

  const absLat = Math.abs(latitude);
  const isTropical = absLat <= OBLIQUITY;
  const polarColureInfo: PolarColureInfo = useMemo(
    () => getPolarColureInfo(latitude),
    [latitude]
  );
  const { isPolar, isNorth } = polarColureInfo;

  const juneSolstice: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, OBLIQUITY),
    [latitude]
  );
  const decemberSolstice: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, -OBLIQUITY),
    [latitude]
  );
  const juneNoon = juneSolstice.altitude;
  const decemberNoon = decemberSolstice.altitude;

  const summerSolstice = solsticeCulminations.summer;
  const winterSolstice = solsticeCulminations.winter;
  const summerNoon = summerSolstice.altitude;
  const winterNoon = winterSolstice.altitude;

  // --- Meridian Coordinate Points on Dome Arc (R=92) ---
  const todayPeakPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(peakAlt, todayCulmination.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [peakAlt, todayCulmination, thresholdElevation]
  );

  const junePoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(juneNoon, juneSolstice.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [juneNoon, juneSolstice, thresholdElevation]
  );

  const decemberPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(decemberNoon, decemberSolstice.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [decemberNoon, decemberSolstice, thresholdElevation]
  );

  const equinoxPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(equinoxCulmination.altitude, equinoxCulmination.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [equinoxCulmination, thresholdElevation]
  );

  // --- Split Solstice Milestone Swaths (along R=92 dome) ---
  const juneSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, junePoint.thetaDeg),
    [todayPeakPoint.thetaDeg, junePoint.thetaDeg]
  );

  const decemberSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, decemberPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, decemberPoint.thetaDeg]
  );

  // Annual seasonal migration direction:
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;
  const isApproachingJune = useMemo(() => {
    if (sunLambda !== undefined) {
      const normLambda = ((sunLambda % 360) + 360) % 360;
      return normLambda >= 270 || normLambda < 90;
    }
    const dayOfYear = getDayOfYear(currentDate);
    return dayOfYear < 172 || dayOfYear >= 355;
  }, [sunLambda, currentDate]);

  const summerSolsticeColor = isNorth ? '#fbbf24' : '#d97706';
  const winterSolsticeColor = isNorth ? '#d97706' : '#fbbf24';
  const isApproachingSummer = isNorth ? isApproachingJune : !isApproachingJune;

  const showJuneTick = juneNoon >= 0 || (isTwilightModeActive && juneNoon >= -18);
  const showDecemberTick = decemberNoon >= 0 || (isTwilightModeActive && decemberNoon >= -18);

  const juneTickTitle = juneNoon >= 0
    ? `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}`
    : `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag} (${getTwilightTier(juneNoon)})`;

  const decemberTickTitle = decemberNoon >= 0
    ? `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}`
    : `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag} (${getTwilightTier(decemberNoon)})`;

  const juneSwathTitle = juneNoon >= -18
    ? `June Solstice Arc (+23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}${juneNoon < 0 ? ` (${getTwilightTier(juneNoon)})` : ''}${isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `June Solstice Arc (+23.4°): Plunges below −18° Astro Twilight (Polar Night)${isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  const decemberSwathTitle = decemberNoon >= -18
    ? `December Solstice Arc (−23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}${decemberNoon < 0 ? ` (${getTwilightTier(decemberNoon)})` : ''}${!isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `December Solstice Arc (−23.4°): Plunges below −18° Astro Twilight (Polar Night)${!isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  // --- Perpendicular Radial Tick Pins ---
  const juneTick = useMemo(
    () => calculateMeridianRadialTick(junePoint.thetaDeg, 86, 98),
    [junePoint.thetaDeg]
  );

  const decemberTick = useMemo(
    () => calculateMeridianRadialTick(decemberPoint.thetaDeg, 86, 98),
    [decemberPoint.thetaDeg]
  );

  const equinoxTick = useMemo(
    () => calculateMeridianRadialTick(equinoxPoint.thetaDeg, 88, 96),
    [equinoxPoint.thetaDeg]
  );

  // Polar Latitudes: Counterpart solstice pins, chords & bilateral migration swaths across 180° antimeridian
  const polarSummerCounterpart: PolarMeridianCounterpart | null = useMemo(() => {
    if (!isPolar) return null;
    const activeSummerPoint = isNorth ? junePoint : decemberPoint;
    return calculatePolarMeridianCounterpart(activeSummerPoint, EL_CX, EL_CY, EL_R, 86, 98);
  }, [isPolar, isNorth, junePoint, decemberPoint]);

  const polarWinterCounterpart: PolarMeridianCounterpart | null = useMemo(() => {
    if (!isPolar || !isTwilightModeActive) return null;
    const activeWinterPoint = isNorth ? decemberPoint : junePoint;
    return calculatePolarMeridianCounterpart(activeWinterPoint, EL_CX, EL_CY, EL_R, 86, 98);
  }, [isPolar, isTwilightModeActive, isNorth, decemberPoint, junePoint]);

  const polarSummerCounterpartSwathD = useMemo(() => {
    if (!isPolar || !polarSummerCounterpart) return '';
    return generateMeridianSwathD(
      180 - todayPeakPoint.thetaDeg,
      polarSummerCounterpart.oppositePoint.thetaDeg
    );
  }, [isPolar, polarSummerCounterpart, todayPeakPoint.thetaDeg]);

  const polarWinterCounterpartSwathD = useMemo(() => {
    if (!isPolar || !polarWinterCounterpart || !isTwilightModeActive) return '';
    return generateMeridianSwathD(
      180 - todayPeakPoint.thetaDeg,
      polarWinterCounterpart.oppositePoint.thetaDeg
    );
  }, [isPolar, polarWinterCounterpart, isTwilightModeActive, todayPeakPoint.thetaDeg]);

  // Solstice Span in declination: 2 * 23.439° = 46.88°
  const solsticeSpanDeg = 2 * OBLIQUITY;

  const elevationSubtitle = currentSunElevation >= 0
    ? 'Daylight'
    : currentSunElevation >= -6
    ? 'Civil Twilight'
    : currentSunElevation >= -12
    ? 'Nautical Twilight'
    : currentSunElevation >= -18
    ? 'Astro Twilight'
    : 'Night';

  const showPolarSummerChord = Boolean(isPolar && polarSummerCounterpart && (isNorth ? showJuneTick : showDecemberTick));
  const showPolarWinterChord = Boolean(isPolar && polarWinterCounterpart && (isNorth ? showDecemberTick : showJuneTick));

  // --- Swaths configuration model ---
  const swaths = useMemo<MeridianSwathConfig[]>(() => [
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
  ], [
    juneSwathD,
    isApproachingJune,
    juneSwathTitle,
    decemberSwathD,
    decemberSwathTitle,
    isPolar,
    polarSummerCounterpartSwathD,
    isNorth,
    showJuneTick,
    showDecemberTick,
    summerSolsticeColor,
    isApproachingSummer,
    summerNoon,
    polarWinterCounterpartSwathD,
    winterSolsticeColor,
    winterNoon,
  ]);

  // --- Radial ticks configuration model ---
  const radialTicks = useMemo<MeridianRadialTickConfig[]>(() => [
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
            `Winter Solstice 24h Antimeridian (180°) Culmination: ${winterNoon.toFixed(1)}° (${getTwilightTier(winterNoon)})`,
            1.4
          ),
        ]
      : []),
  ], [
    showJuneTick,
    juneTick,
    juneTickTitle,
    showDecemberTick,
    decemberTick,
    decemberTickTitle,
    equinoxTick,
    equinoxCulmination,
    isPolar,
    polarSummerCounterpart,
    isNorth,
    summerSolsticeColor,
    summerNoon,
    polarWinterCounterpart,
    winterSolsticeColor,
    winterNoon,
  ]);

  // --- Today Diurnal Chord Configuration Model ---
  const todayChordConfig = useMemo<MeridianDiurnalChordConfig>(() => ({
    daylightId: 'sun-today-diurnal-chord',
    twilightId: isTwilightModeActive ? 'sun-today-twilight-chord' : undefined,
    chord: todayChord,
    stroke: '#f59e0b',
    strokeWidth: 1.5,
    strokeOpacity: 0.95,
    glow: true,
    glowWidth: 3.5,
    glowOpacity: 0.25,
    twilightStroke: '#f59e0b',
    twilightWidth: 1.0,
    twilightOpacity: 0.40,
    daylightTitle: `Today's Solar Diurnal Path (Noon Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag})`,
    twilightTitle: "Today's Sub-Horizon Twilight Extension down to −18°",
  }), [isTwilightModeActive, todayChord, peakAlt, todayCulmination.shortTag]);

  // --- Gate Anchor Configuration Model ---
  const gateAnchor = useMemo<MeridianGateAnchorConfig | undefined>(() => (
    isTwilightModeActive
      ? createMeridianGateAnchorConfig(
          'sun-twilight-gate-anchor',
          todayChord.anchorPoint,
          '#64748b',
          'Astronomical Twilight Gate (−18°): Deep Night Station',
          3.5
        )
      : undefined
  ), [isTwilightModeActive, todayChord.anchorPoint.x, todayChord.anchorPoint.y]);

  // --- Peak Target Configuration Model ---
  const peakTarget = useMemo<MeridianPeakTargetConfig>(() => (
    createMeridianPeakTargetConfig(
      'meridian-noon-peak-target',
      todayPeakPoint,
      '#f59e0b',
      `Today's Noon Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`
    )
  ), [todayPeakPoint, peakAlt, todayCulmination.shortTag]);

  return {
    currentSunElevation,
    elevationSubtitle,
    activeSunPoint,
    todayChord,
    todayCulmination,
    peakAlt,
    solsticeCulminations,
    equinoxCulmination,
    absLat,
    isTropical,
    polarColureInfo,
    isPolar,
    isNorth,
    juneSolstice,
    decemberSolstice,
    juneNoon,
    decemberNoon,
    summerSolstice,
    winterSolstice,
    summerNoon,
    winterNoon,
    todayPeakPoint,
    junePoint,
    decemberPoint,
    equinoxPoint,
    juneSwathD,
    decemberSwathD,
    isApproachingJune,
    isApproachingSummer,
    summerSolsticeColor,
    winterSolsticeColor,
    showJuneTick,
    showDecemberTick,
    juneTickTitle,
    decemberTickTitle,
    juneSwathTitle,
    decemberSwathTitle,
    juneTick,
    decemberTick,
    equinoxTick,
    polarSummerCounterpart,
    polarWinterCounterpart,
    polarSummerCounterpartSwathD,
    polarWinterCounterpartSwathD,
    showPolarSummerChord,
    showPolarWinterChord,
    solsticeSpanDeg,
    swaths,
    radialTicks,
    todayChordConfig,
    gateAnchor,
    peakTarget,
  };
};

export type SunMeridianMathResult = ReturnType<typeof useSunMeridianMath>;
