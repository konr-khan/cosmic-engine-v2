/**
 * @file useMoonMeridianMath.ts
 * Custom hook encapsulating all astronomical mathematics, coordinate projections,
 * standstill/monthly bounds, nodal crossing, swath paths, radial ticks, and configuration
 * models for MoonMeridianDome.
 * Separates the mathematical ephemeris calculations from the visual presenter.
 */

import { useMemo } from 'react';
import {
  getJulianDate,
  projectSkyDomePoint,
  calculateCulminationBearing,
  calculateLunarExtremaCulminations,
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  SkyDomeLunarNode,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
  calculateMeridianDiurnalPoint,
  calculateMeridianDiurnalChord,
  calculatePolarMeridianCounterpart,
  calculateLunarDeclinationVelocity,
  CulminationInfo,
  MeridianDiurnalPoint,
  MeridianDiurnalChord,
  PolarMeridianCounterpart,
  MeridianPoint,
  LUNAR_MAJOR_STANDSTILL_DEG,
  getPolarColureInfo,
  PolarColureInfo,
  J2000_DATE,
} from '../../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../../types';
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
  createMeridianGateAnchorConfig,
  createMeridianPeakTargetConfig,
  buildMoonMeridianSwaths,
  buildMoonMeridianRadialTicks,
} from './meridianConfigHelpers';

export interface UseMoonMeridianMathParams {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  isNodalModeActive: boolean;
}

// Major lunar standstill: 23.439° + 5.145° = 28.584°
export const LUNAR_MAX_DEC = Number(LUNAR_MAJOR_STANDSTILL_DEG);

export const useMoonMeridianMath = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  currentDate = J2000_DATE,
  isNodalModeActive,
}: UseMoonMeridianMathParams) => {
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    transit: 12,
    declination: 0,
    parallacticAngle: 0,
  };
  const {
    transit = 12,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;

  // --- Real-Time Moon Elevation & Meridian Diurnal Trajectory ---
  const moonHourAngle = (displayTime - transit) * 15;
  const currentMoonPos = projectSkyDomePoint(moonHourAngle, Number(moonDeclination), latitude);
  const currentMoonElevation = currentMoonPos.elevation;

  // Real-time instantaneous Moon position along continuous 3D diurnal path
  const activeMoonPoint: MeridianDiurnalPoint = useMemo(
    () => calculateMeridianDiurnalPoint(latitude, Number(moonDeclination), moonHourAngle, 0),
    [latitude, moonDeclination, moonHourAngle]
  );

  // Today's Diurnal Chord in the Meridian projection (touching Meridian Arc at Lunar Transit)
  const todayChord: MeridianDiurnalChord = useMemo(
    () => calculateMeridianDiurnalChord(latitude, Number(moonDeclination), 0),
    [latitude, moonDeclination]
  );

  // --- Culminations & Bearings ---
  const polarColureInfo: PolarColureInfo = useMemo(
    () => getPolarColureInfo(latitude),
    [latitude]
  );
  const { isPolar } = polarColureInfo;

  const todayCulmination: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );
  const peakAlt = todayCulmination.altitude;

  const standstillMax: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [latitude]
  );
  const standstillMin: CulminationInfo = useMemo(
    () => calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [latitude]
  );

  // Monthly Declination Bounds over a rolling 30-day window (±15 days)
  const monthlyBounds = useMemo(
    () => calculateMonthlyLunarDeclinationBounds(currentDate),
    [currentDate]
  );

  const extremaCulminations = useMemo(
    () => calculateLunarExtremaCulminations(latitude, monthlyBounds.maxDec, monthlyBounds.minDec),
    [latitude, monthlyBounds.maxDec, monthlyBounds.minDec]
  );

  const monthMax = extremaCulminations.maxBound;
  const monthMin = extremaCulminations.minBound;

  // --- Nodal Kinematics & Color Conventions ---
  const jd = useMemo(() => getJulianDate(currentDate, displayTime), [currentDate, displayTime]);
  const solarNoon = solarData?.solarNoon ?? 12;
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;

  const nodalData = useMemo(() => {
    if (!isNodalModeActive) {
      return {
        ascendingNode: null as unknown as SkyDomeLunarNode,
        descendingNode: null as unknown as SkyDomeLunarNode,
        moonBeta: 0,
        isMoonAscending: false,
        isWaxing: false,
        argumentOfLatitude: 0,
        orbitalProgressPercent: 0,
        daysToNextNode: 0,
        daysSincePrevNode: 0,
        upcomingNodeType: 'ascending' as const,
        prevNodeType: 'descending' as const,
        upcomingNode: null as unknown as SkyDomeLunarNode,
        nearestNode: null as unknown as SkyDomeLunarNode,
        nearestNodeType: 'ascending' as const,
        nearestNodeDistDays: 0,
        isApproachingNearestNode: false,
        isNearNode: false,
        quadrantLabel: '',
        timelineNodes: [],
        timelineSegments: [],
      };
    }
    return calculateSkyDomeLunarNodes(
      latitude,
      jd,
      displayTime,
      solarNoon,
      sunLambda,
      {
        phaseValue: phase.value !== undefined ? Number(phase.value) : undefined,
        moonBeta: orbitalData?.lunarPos?.beta !== undefined ? Number(orbitalData.lunarPos.beta) : undefined,
      }
    );
  }, [isNodalModeActive, latitude, jd, displayTime, solarNoon, sunLambda, phase.value, orbitalData?.lunarPos?.beta]);

  const isAscendingBranch = nodalData.isMoonAscending;
  // Eclipse-convention: Sky Blue for β >= 0 (North of ecliptic), Rose Red for β < 0 (South of ecliptic)
  const nodalThemeColor = isNodalModeActive
    ? (isAscendingBranch ? '#38bdf8' : '#f43f5e')
    : '#e2e8f0';
  const moonTrackDash = isNodalModeActive
    ? (nodalData.isWaxing ? undefined : '4 3')
    : undefined;

  // Ecliptic Node Crossing point on Meridian (where β = 0°)
  const eclipticCulmination = useMemo(() => {
    const eclipticDec = moonDeclination - nodalData.moonBeta;
    return calculateCulminationBearing(latitude, eclipticDec);
  }, [latitude, moonDeclination, nodalData.moonBeta]);

  const eclipticNodePoint = useMemo(
    () => calculateMeridianPoint(eclipticCulmination.altitude, eclipticCulmination.direction),
    [eclipticCulmination]
  );

  const eclipticNodeTick = useMemo(
    () => calculateMeridianRadialTick(eclipticNodePoint.thetaDeg, 86, 98),
    [eclipticNodePoint.thetaDeg]
  );

  // --- Meridian Coordinate Points on Dome Arc (R=92) ---
  const todayPeakPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(peakAlt, todayCulmination.direction),
    [peakAlt, todayCulmination]
  );

  const standstillMaxPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(standstillMax.altitude, standstillMax.direction),
    [standstillMax]
  );

  const standstillMinPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(standstillMin.altitude, standstillMin.direction),
    [standstillMin]
  );

  const monthMaxPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(monthMax.altitude, monthMax.direction),
    [monthMax]
  );

  const monthMinPoint: MeridianPoint = useMemo(
    () => calculateMeridianPoint(monthMin.altitude, monthMin.direction),
    [monthMin]
  );

  // --- Swath Arcs (along R=92 dome) ---
  const monthlySwathD = useMemo(
    () => generateMeridianSwathD(monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg),
    [monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg]
  );

  const standstillSwathD = useMemo(
    () => generateMeridianSwathD(standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg),
    [standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg]
  );

  // Option C: Standstill epoch is active if in Nodal Mode OR if monthly peak reaches within ~1° of 28.58° (Major Standstill season)
  const isStandstillActive = isNodalModeActive || monthlyBounds.maxDec >= 27.5;

  const targetMaxPoint = isStandstillActive ? standstillMaxPoint : monthMaxPoint;
  const targetMinPoint = isStandstillActive ? standstillMinPoint : monthMinPoint;
  const targetMaxAlt = isStandstillActive ? standstillMax.altitude : monthMax.altitude;
  const targetMinAlt = isStandstillActive ? standstillMin.altitude : monthMin.altitude;
  const targetMaxTag = isStandstillActive ? standstillMax.shortTag : monthMax.shortTag;
  const targetMinTag = isStandstillActive ? standstillMin.shortTag : monthMin.shortTag;
  const targetTierLabel = isStandstillActive ? '18.6y Major Standstill' : 'Monthly Extrema';

  // Instantaneous lunar declination velocity to determine migration direction (approaching Max vs Min)
  const lunarVelocity = useMemo(() => calculateLunarDeclinationVelocity(jd), [jd]);
  const isApproachingMax = lunarVelocity.isApproachingMax;

  // Split Migration Swaths from Today's Lunar Transit Peak to Max and Min milestones
  const maxSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, targetMaxPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, targetMaxPoint.thetaDeg]
  );

  const minSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, targetMinPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, targetMinPoint.thetaDeg]
  );

  // Polar Latitudes: Counterpart pin, chord & bilateral migration swath across 180° antimeridian
  const polarMaxCounterpart: PolarMeridianCounterpart | null = useMemo(() => {
    if (!isPolar) return null;
    return calculatePolarMeridianCounterpart(targetMaxPoint, EL_CX, EL_CY, EL_R, 87, 97);
  }, [isPolar, targetMaxPoint]);

  const polarLunarMaxCounterpartSwathD = useMemo(() => {
    if (!isPolar || !polarMaxCounterpart) return '';
    return generateMeridianSwathD(
      180 - todayPeakPoint.thetaDeg,
      polarMaxCounterpart.oppositePoint.thetaDeg
    );
  }, [isPolar, polarMaxCounterpart, todayPeakPoint.thetaDeg]);

  // --- Perpendicular Radial Tick Pins ---
  const standstillMaxTick = useMemo(
    () => calculateMeridianRadialTick(standstillMaxPoint.thetaDeg, 85, 99),
    [standstillMaxPoint.thetaDeg]
  );

  const standstillMinTick = useMemo(
    () => calculateMeridianRadialTick(standstillMinPoint.thetaDeg, 85, 99),
    [standstillMinPoint.thetaDeg]
  );

  const monthMaxTick = useMemo(
    () => calculateMeridianRadialTick(monthMaxPoint.thetaDeg, 87, 97),
    [monthMaxPoint.thetaDeg]
  );

  const monthMinTick = useMemo(
    () => calculateMeridianRadialTick(monthMinPoint.thetaDeg, 87, 97),
    [monthMinPoint.thetaDeg]
  );

  // Standstill total range in declination: 2 * 28.584° = 57.17°
  const standstillSpanDeg = 2 * LUNAR_MAX_DEC;

  const elevationStatusSubtitle = currentMoonElevation >= 0 ? 'Above Horizon' : 'Sub-Horizon';

  // --- Swaths configuration model ---
  const swaths = useMemo<MeridianSwathConfig[]>(
    () =>
      buildMoonMeridianSwaths({
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
        todayShortTag: todayCulmination.shortTag,
        targetMaxAlt,
        targetMinAlt,
        targetMaxTag,
        targetMinTag,
        isPolar,
        polarLunarMaxCounterpartSwathD,
      }),
    [
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
      todayCulmination.shortTag,
      targetMaxAlt,
      targetMinAlt,
      targetMaxTag,
      targetMinTag,
      isPolar,
      polarLunarMaxCounterpartSwathD,
    ]
  );

  // --- Radial ticks configuration model ---
  const radialTicks = useMemo<MeridianRadialTickConfig[]>(
    () =>
      buildMoonMeridianRadialTicks({
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
      }),
    [
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
    ]
  );

  // --- Today Diurnal Chord Configuration Model ---
  const todayChordConfig = useMemo<MeridianDiurnalChordConfig>(() => ({
    daylightId: 'moon-today-diurnal-chord',
    chord: todayChord,
    stroke: nodalThemeColor,
    strokeWidth: 1.5,
    strokeDasharray: moonTrackDash,
    strokeOpacity: 0.95,
    glow: true,
    glowWidth: 3.5,
    glowOpacity: 0.25,
    daylightTitle: `Today's Lunar Diurnal Path (Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag})`,
  }), [todayChord, nodalThemeColor, moonTrackDash, peakAlt, todayCulmination.shortTag]);

  // --- Gate Anchor Configuration Model ---
  const gateAnchor = useMemo<MeridianGateAnchorConfig>(() => (
    createMeridianGateAnchorConfig(
      'moon-horizon-gate-anchor',
      todayChord.anchorPoint,
      '#64748b',
      'Lunar Horizon Gate (0°): Setting & Rising Station',
      3.5
    )
  ), [todayChord.anchorPoint.x, todayChord.anchorPoint.y]);

  // --- Peak Target Configuration Model ---
  const peakTarget = useMemo<MeridianPeakTargetConfig>(() => (
    createMeridianPeakTargetConfig(
      'meridian-transit-peak-target',
      todayPeakPoint,
      nodalThemeColor,
      `Today's Transit Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`
    )
  ), [todayPeakPoint, nodalThemeColor, peakAlt, todayCulmination.shortTag]);

  const showPolarMaxChord = Boolean(isPolar && polarMaxCounterpart && targetMaxAlt >= 0);

  return {
    phase,
    parallacticAngle,
    currentMoonElevation,
    elevationStatusSubtitle,
    activeMoonPoint,
    todayCulmination,
    peakAlt,
    standstillMax,
    standstillMin,
    monthMax,
    monthMin,
    isPolar,
    isStandstillActive,
    isAscendingBranch,
    nodalThemeColor,
    nodalData,
    eclipticCulmination,
    eclipticNodePoint,
    eclipticNodeTick,
    targetMaxAlt,
    polarMaxCounterpart,
    showPolarMaxChord,
    standstillSpanDeg,
    swaths,
    radialTicks,
    todayChordConfig,
    gateAnchor,
    peakTarget,
  };
};

export type MoonMeridianMathResult = ReturnType<typeof useMoonMeridianMath>;
