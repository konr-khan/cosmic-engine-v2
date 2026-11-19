/**
 * @file useLunarDomeSharedMath.ts
 * Shared hook unifying common lunar ephemeris unpacking, rolling 30-day declination bounds,
 * 18.6-year major standstill culminations, and Draconic nodal kinematics across
 * MoonElevationDome and MoonMeridianDome.
 *
 * Accepts an optional `precomputed` result so TodayHorizonView's 4-Dome Quad mode can
 * evaluate shared lunar calculations once per tick and reuse them across both lunar domes.
 */

import { useMemo } from 'react';
import {
  getJulianDate,
  projectSkyDomePoint,
  calculateCulminationBearing,
  calculateLunarExtremaCulminations,
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  CulminationInfo,
  LUNAR_MAJOR_STANDSTILL_DEG,
  J2000_DATE,
} from '../../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../../types';
import { NODAL_HEMISPHERE_COLORS } from '../todayTokens';
import { createInactiveNodalData, NullableSkyDomeNodalData } from './meridianConfigHelpers';

// Major lunar standstill: 23.439° + 5.145° = 28.584°
export const LUNAR_MAX_DEC = Number(LUNAR_MAJOR_STANDSTILL_DEG);

export interface UseLunarDomeSharedMathParams {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  isNodalModeActive: boolean;
  precomputed?: LunarDomeSharedMath;
}

export interface LunarDomeSharedMath {
  phase: { value: number; name: string };
  lunarEvents: {
    moonrise: number | null;
    transit: number;
    moonset: number | null;
    distanceKm: number;
    distanceEarthRadii: number;
    isPerigee: boolean;
    isApogee: boolean;
    declination: number;
    parallacticAngle: number;
  };
  moonDeclination: number;
  moonHourAngle: number;
  moonPos: ReturnType<typeof projectSkyDomePoint>;
  currentMoonElevation: number;
  todayCulmination: CulminationInfo;
  standstillMaxCulmination: CulminationInfo;
  standstillMinCulmination: CulminationInfo;
  monthlyBounds: ReturnType<typeof calculateMonthlyLunarDeclinationBounds>;
  extremaCulminations: ReturnType<typeof calculateLunarExtremaCulminations>;
  jd: ReturnType<typeof getJulianDate>;
  solarNoon: number;
  sunDeclination: number;
  sunLambda: number | undefined;
  nodalData: NullableSkyDomeNodalData;
  isAscendingBranch: boolean;
  nodalThemeColor: string;
  moonTrackDash: string | undefined;
}

export const useLunarDomeSharedMath = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  currentDate = J2000_DATE,
  isNodalModeActive,
  precomputed,
}: UseLunarDomeSharedMathParams): LunarDomeSharedMath => {
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const rawEvents = safeOrbital.lunarEvents;
  const lunarEvents = {
    moonrise: rawEvents && 'moonrise' in rawEvents && rawEvents.moonrise !== undefined ? rawEvents.moonrise : 6,
    transit: rawEvents?.transit ?? 12,
    moonset: rawEvents && 'moonset' in rawEvents && rawEvents.moonset !== undefined ? rawEvents.moonset : 18,
    distanceKm: rawEvents?.distanceKm ?? 384400,
    distanceEarthRadii: rawEvents?.distanceEarthRadii ?? 60.3,
    isPerigee: rawEvents?.isPerigee ?? false,
    isApogee: rawEvents?.isApogee ?? false,
    declination: Number(rawEvents?.declination ?? 0),
    parallacticAngle: Number(rawEvents?.parallacticAngle ?? 0),
  };

  const moonDeclination = Number(orbitalData?.lunarPos?.declination ?? lunarEvents.declination ?? 0);
  const moonHourAngle = (displayTime - lunarEvents.transit) * 15;
  const moonPos = precomputed?.moonPos ?? projectSkyDomePoint(moonHourAngle, moonDeclination, latitude);
  const currentMoonElevation = precomputed?.currentMoonElevation ?? moonPos.elevation;

  const todayCulmination = useMemo<CulminationInfo>(
    () => precomputed?.todayCulmination ?? calculateCulminationBearing(latitude, moonDeclination),
    [precomputed, latitude, moonDeclination]
  );

  const standstillMaxCulmination = useMemo<CulminationInfo>(
    () => precomputed?.standstillMaxCulmination ?? calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [precomputed, latitude]
  );

  const standstillMinCulmination = useMemo<CulminationInfo>(
    () => precomputed?.standstillMinCulmination ?? calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [precomputed, latitude]
  );

  const monthlyBounds = useMemo(
    () => precomputed?.monthlyBounds ?? calculateMonthlyLunarDeclinationBounds(currentDate),
    [precomputed, currentDate]
  );

  const extremaCulminations = useMemo(
    () =>
      precomputed?.extremaCulminations ??
      calculateLunarExtremaCulminations(latitude, monthlyBounds.maxDec, monthlyBounds.minDec),
    [precomputed, latitude, monthlyBounds.maxDec, monthlyBounds.minDec]
  );

  const jd = useMemo(
    () => precomputed?.jd ?? getJulianDate(currentDate, displayTime),
    [precomputed, currentDate, displayTime]
  );
  const solarNoon = solarData?.solarNoon ?? 12;
  const sunDeclination = (solarData?.declination ?? 0) as number;
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;
  const phaseVal = phase.value !== undefined ? Number(phase.value) : undefined;
  const moonBetaVal = orbitalData?.lunarPos?.beta !== undefined ? Number(orbitalData.lunarPos.beta) : undefined;

  const nodalData = useMemo<NullableSkyDomeNodalData>(() => {
    if (precomputed) {
      return precomputed.nodalData;
    }
    if (!isNodalModeActive) {
      return createInactiveNodalData();
    }
    return calculateSkyDomeLunarNodes(latitude, jd, displayTime, solarNoon, sunLambda, {
      phaseValue: phaseVal,
      moonBeta: moonBetaVal,
    });
  }, [precomputed, isNodalModeActive, latitude, jd, displayTime, solarNoon, sunLambda, phaseVal, moonBetaVal]);

  if (precomputed) {
    return precomputed;
  }

  const isAscendingBranch = nodalData.isMoonAscending;
  const nodalThemeColor = isNodalModeActive
    ? (isAscendingBranch ? NODAL_HEMISPHERE_COLORS.ascending : NODAL_HEMISPHERE_COLORS.descending)
    : '#e2e8f0';
  const moonTrackDash = isNodalModeActive ? (nodalData.isWaxing ? undefined : '4 3') : undefined;

  return {
    phase,
    lunarEvents,
    moonDeclination,
    moonHourAngle,
    moonPos,
    currentMoonElevation,
    todayCulmination,
    standstillMaxCulmination,
    standstillMinCulmination,
    monthlyBounds,
    extremaCulminations,
    jd,
    solarNoon,
    sunDeclination,
    sunLambda,
    nodalData,
    isAscendingBranch,
    nodalThemeColor,
    moonTrackDash,
  };
};
