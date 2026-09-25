/**
 * @file useMoonElevationMath.ts
 * Custom hook encapsulating all astronomical mathematics and SVG path generation
 * for MoonElevationDome. Separates ephemeris computations, standstill limits,
 * nodal crossing geometry, and diurnal track calculations from the UI renderer.
 */

import { useMemo } from 'react';
import { 
  toRadians, 
  getJulianDate,
  calculateLunarIllumination,
  projectSkyDomePoint,
  generateDiurnalPath,
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  getLunarElevationStatus,
  calculateCulminationBearing,
  calculateRiseSetAzimuth,
  calculateLunarExtremaCulminations,
  calculateParallacticAngle,
  LUNAR_MAJOR_STANDSTILL_DEG,
} from '../../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../../types';
import { EL_R, EL_CX, EL_CY, SkyDomeDiurnalPath } from '../SkyDomeBase';

export interface UseMoonElevationMathParams {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  longitude?: number;
  currentDate?: Date;
  isNodalModeActive: boolean;
}

export const LUNAR_MAX_DEC = Number(LUNAR_MAJOR_STANDSTILL_DEG);

export const useMoonElevationMath = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  longitude,
  currentDate = new Date(),
  isNodalModeActive,
}: UseMoonElevationMathParams) => {
  // --- Moon Elevation & Phase Math ---
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    moonrise: 6,
    transit: 12,
    moonset: 18,
    distanceKm: 384400,
    distanceEarthRadii: 60.3,
    isPerigee: false,
    isApogee: false,
    declination: 0,
    parallacticAngle: 0,
  };

  const {
    moonrise = 6,
    transit = 12,
    moonset = 18,
    distanceKm = 384400,
    distanceEarthRadii = 60.3,
    isPerigee = false,
    isApogee = false,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;
  const illPercent = calculateLunarIllumination(phase.value ?? 0);

  const moonHourAngle = (displayTime - transit) * 15;
  const moonPos = projectSkyDomePoint(moonHourAngle, Number(moonDeclination), latitude);
  const currentMoonElevation = moonPos.elevation;
  const moonX = moonPos.x;
  const moonY = moonPos.y;

  const transitPeakElevation = projectSkyDomePoint(0, Number(moonDeclination), latitude).elevation;

  // --- Culmination & Sighting Bearing Math ---
  const culmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );

  const riseSetAz = useMemo(
    () => calculateRiseSetAzimuth(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
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

  // --- Lunar Altitude Bounds & Zenith Cap Math ---
  const absLat = Math.abs(latitude);
  const isLunarTropical = absLat <= LUNAR_MAX_DEC;
  const isPolar = absLat >= 89.9;

  const standstillMaxCulmination = useMemo(
    () => calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [latitude]
  );

  const standstillMinCulmination = useMemo(
    () => calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [latitude]
  );

  // Maximum possible lunar transit elevation across all 18.6-year nodal cycles
  const maxAnnualMoonNoon = isLunarTropical ? 90 : (90 - absLat + LUNAR_MAX_DEC);
  const minAnnualMoonNoon = 90 - absLat - LUNAR_MAX_DEC;

  // Lunar Zenith Cap geometry (unreachable sector when latitude is outside lunar tropics)
  const lunarCapPathD = useMemo(() => {
    if (!isLunarTropical && maxAnnualMoonNoon < 89.5) {
      const yCap = EL_CY - EL_R * Math.sin(toRadians(maxAnnualMoonNoon));
      const xCapL = EL_CX - EL_R * Math.cos(toRadians(maxAnnualMoonNoon));
      const xCapR = EL_CX + EL_R * Math.cos(toRadians(maxAnnualMoonNoon));
      return `M ${xCapL.toFixed(1)} ${yCap.toFixed(1)} A ${EL_R} ${EL_R} 0 0 1 ${xCapR.toFixed(1)} ${yCap.toFixed(1)} Z`;
    }
    return '';
  }, [isLunarTropical, maxAnnualMoonNoon]);

  // --- Nodal Geometry & Sky Dome Node Pins ---
  const jd = useMemo(() => getJulianDate(currentDate, displayTime), [currentDate, displayTime]);
  const solarNoon = solarData?.solarNoon ?? 12;
  const sunDeclination = (solarData?.declination ?? 0) as number;
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;

  const nodalData = useMemo(() => {
    return calculateSkyDomeLunarNodes(
      latitude,
      jd,
      displayTime,
      solarNoon,
      sunLambda,
      {
        phaseValue: phase.value !== undefined ? Number(phase.value) : undefined
      }
    );
  }, [latitude, jd, displayTime, solarNoon, sunLambda, phase.value]);

  const eclipticPathResult = useMemo(
    () => generateDiurnalPath(latitude, sunDeclination),
    [latitude, sunDeclination]
  );

  // --- Curved Diurnal Paths ---
  const maxPathResult = useMemo(
    () => generateDiurnalPath(latitude, monthlyBounds.maxDec),
    [latitude, monthlyBounds.maxDec]
  );

  const todayPathResult = useMemo(
    () => generateDiurnalPath(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );

  const minPathResult = useMemo(
    () => generateDiurnalPath(latitude, monthlyBounds.minDec),
    [latitude, monthlyBounds.minDec]
  );

  const moonTrackColor = isNodalModeActive
    ? (nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e')
    : '#e2e8f0';

  const moonTrackDash = isNodalModeActive
    ? (nodalData.isWaxing ? undefined : '4 3')
    : undefined;

  const diurnalPaths = useMemo<SkyDomeDiurnalPath[]>(() => {
    const paths: SkyDomeDiurnalPath[] = [];

    // In Nodal Mode: Show Ecliptic Reference diurnal curve (Amber hairline dashed)
    if (isNodalModeActive && eclipticPathResult.pathD) {
      paths.push({
        id: 'ecliptic-reference-path',
        d: eclipticPathResult.pathD,
        stroke: '#f59e0b',
        strokeWidth: 0.75,
        strokeDasharray: '2 2',
        strokeOpacity: 0.6,
        label: 'Ecliptic (☉)',
        labelColor: 'fill-amber-400/80',
        labelX: eclipticPathResult.peakPoint.x + 8,
        labelY: eclipticPathResult.peakPoint.y - 4,
        title: `Ecliptic Plane Baseline (Sun Declination: ${sunDeclination.toFixed(1)}°)`
      });
    }

    // 1. Monthly Max Lunar Transit Arc (Soft silver dashed hairline) - Shown in standard mode
    if (!isNodalModeActive && maxPathResult.pathD && maxPathResult.peakAlt > 0) {
      const maxPeak = extremaCulminations.maxBound.altitude;
      paths.push({
        id: 'moon-monthly-max',
        d: maxPathResult.pathD,
        stroke: '#94a3b8',
        strokeWidth: 0.75,
        strokeDasharray: '3 2',
        strokeOpacity: 0.7,
        title: `Max Possible Lunar Altitude (Monthly ±15d Peak: ${monthlyBounds.maxDec.toFixed(1)}° Dec): ${maxPeak.toFixed(1)}° ${extremaCulminations.maxBound.shortTag}`
      });
    }

    // 2. Active Today's Moon Path
    if (todayPathResult.pathD) {
      paths.push({
        id: 'today-moon-path',
        d: todayPathResult.pathD,
        stroke: moonTrackColor,
        strokeWidth: 1.5,
        strokeDasharray: moonTrackDash,
        strokeOpacity: 0.95,
        isGlowing: true,
        title: isNodalModeActive
          ? `Today's Lunar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}° (${nodalData.quadrantLabel})`
          : `Today's Lunar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}°`
      });
    }

    // 2b. Today's Moon Sub-Horizon Continuation
    if (todayPathResult.twilightD) {
      paths.push({
        id: 'today-moon-twilight-path',
        d: todayPathResult.twilightD,
        stroke: isNodalModeActive ? moonTrackColor : '#94a3b8',
        strokeWidth: 0.8,
        strokeOpacity: 0.20,
        title: "Today's Sub-Horizon Lunar Track"
      });
    }

    // 3. Monthly Min Lunar Transit Arc (Muted slate dashed hairline) - Shown in standard mode
    if (!isNodalModeActive && minPathResult.pathD && minPathResult.peakAlt > 0) {
      const minPeak = extremaCulminations.minBound.altitude;
      paths.push({
        id: 'moon-monthly-min',
        d: minPathResult.pathD,
        stroke: '#64748b',
        strokeWidth: 0.75,
        strokeDasharray: '3 2',
        strokeOpacity: 0.6,
        title: `Min Possible Lunar Altitude (Monthly ±15d Trough: ${monthlyBounds.minDec.toFixed(1)}° Dec): ${minPeak.toFixed(1)}° ${extremaCulminations.minBound.shortTag}`
      });
    }

    return paths;
  }, [
    isNodalModeActive,
    eclipticPathResult,
    sunDeclination,
    maxPathResult,
    extremaCulminations,
    monthlyBounds,
    todayPathResult,
    moonTrackColor,
    moonTrackDash,
    nodalData.quadrantLabel,
    minPathResult
  ]);

  const effectiveLon = longitude ?? -122.8;
  const currentParallacticAngle = useMemo(() => {
    return orbitalData?.lunarPos
      ? calculateParallacticAngle(
          latitude,
          effectiveLon,
          jd,
          moonDeclination,
          (orbitalData.lunarPos.rightAscension ?? 0) as number
        )
      : lunarEvents.parallacticAngle;
  }, [orbitalData?.lunarPos, latitude, effectiveLon, jd, moonDeclination, lunarEvents.parallacticAngle]);

  const lunarStatus = useMemo(
    () => getLunarElevationStatus(currentMoonElevation),
    [currentMoonElevation]
  );

  return {
    phase,
    illPercent,
    moonrise,
    transit,
    moonset,
    distanceKm,
    distanceEarthRadii,
    isPerigee,
    isApogee,
    moonDeclination,
    parallacticAngle,
    currentParallacticAngle,
    moonPos,
    currentMoonElevation,
    moonX,
    moonY,
    transitPeakElevation,
    culmination,
    riseSetAz,
    monthlyBounds,
    extremaCulminations,
    standstillMaxCulmination,
    standstillMinCulmination,
    maxAnnualMoonNoon,
    minAnnualMoonNoon,
    isLunarTropical,
    isPolar,
    lunarCapPathD,
    nodalData,
    diurnalPaths,
    moonTrackColor,
    moonTrackDash,
    lunarStatus,
  };
};

export type MoonElevationMathResult = ReturnType<typeof useMoonElevationMath>;
