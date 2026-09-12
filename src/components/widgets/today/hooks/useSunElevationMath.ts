/**
 * @file useSunElevationMath.ts
 * Custom hook encapsulating all astronomical mathematics and SVG path generation
 * for SunElevationDome. Separates orbital distance physics, analemma calculations,
 * solstice peaks, twilight thresholds, and diurnal path generation from the UI renderer.
 */

import { useMemo } from 'react';
import { 
  toRadians, 
  calculateEarthOrbitalPhysics, 
  getJulianDate,
  projectSkyDomePoint,
  generateDiurnalPath,
  getSolarTwilightStatus,
  calculateCulminationBearing,
  calculateRiseSetAzimuth,
  calculateSolsticeCulminations
} from '../../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../../types';
import { EL_R, EL_CX, EL_CY, SkyDomeDiurnalPath } from '../SkyDomeBase';

export interface UseSunElevationMathParams {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  isTwilightModeActive: boolean;
}

export const OBLIQUITY = 23.439281;

export const useSunElevationMath = ({
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  isTwilightModeActive,
}: UseSunElevationMathParams) => {
  // Earth-Sun Distance & Orbital Physics from Canonical Solver
  const fallbackPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(getJulianDate(currentDate, displayTime)),
    [currentDate, displayTime]
  );
  const sunDistanceAU = solarData?.distanceAU ?? fallbackPhysics.distanceAU;
  const sunDistanceKm = solarData?.distanceKm ?? fallbackPhysics.distanceKm;

  // --- Sun Elevation Math ---
  const {
    noonElevation = 45,
    solarNoon = 12,
    equationOfTime = 0,
    sunrise = 6,
    sunset = 18,
    declination: sunDeclination = 0,
  } = solarData || {};

  const sunHourAngle = (displayTime - solarNoon) * 15;
  const sunPos = projectSkyDomePoint(sunHourAngle, Number(sunDeclination), latitude);
  const currentSunElevation = sunPos.elevation;
  const sunX = sunPos.x;
  const sunY = sunPos.y;

  // --- Culmination & Sighting Bearing Math ---
  const culmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const riseSetAz = useMemo(
    () => calculateRiseSetAzimuth(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const solsticeCulminations = useMemo(
    () => calculateSolsticeCulminations(latitude),
    [latitude]
  );

  // --- Solstice Peaks & Zenith Cap Math ---
  const absLat = Math.abs(latitude);
  const isTropical = absLat <= OBLIQUITY;
  const isPolar = absLat >= 89.9;

  // Maximum annual noon elevation ceiling (Zenith Cap boundary)
  const maxAnnualNoon = isTropical ? 90 : (90 - absLat + OBLIQUITY);
  const summerSolsticeNoon = solsticeCulminations.summer.altitude;
  const winterSolsticeNoon = solsticeCulminations.winter.altitude;

  // Zenith Cap geometry (unreachable sector when latitude is outside tropics)
  const capPathD = useMemo(() => {
    if (!isTropical && maxAnnualNoon < 89.5) {
      const yCap = EL_CY - EL_R * Math.sin(toRadians(maxAnnualNoon));
      const xCapL = EL_CX - EL_R * Math.cos(toRadians(maxAnnualNoon));
      const xCapR = EL_CX + EL_R * Math.cos(toRadians(maxAnnualNoon));
      return `M ${xCapL.toFixed(1)} ${yCap.toFixed(1)} A ${EL_R} ${EL_R} 0 0 1 ${xCapR.toFixed(1)} ${yCap.toFixed(1)} Z`;
    }
    return '';
  }, [isTropical, maxAnnualNoon]);

  // --- Curved Diurnal Paths ---
  const summerDec = latitude >= 0 ? OBLIQUITY : -OBLIQUITY;
  const winterDec = latitude >= 0 ? -OBLIQUITY : OBLIQUITY;

  const summerPathResult = useMemo(
    () => generateDiurnalPath(latitude, summerDec),
    [latitude, summerDec]
  );
  const winterPathResult = useMemo(
    () => generateDiurnalPath(latitude, winterDec),
    [latitude, winterDec]
  );
  const equinoxPathResult = useMemo(
    () => generateDiurnalPath(latitude, 0),
    [latitude]
  );
  const todayPathResult = useMemo(
    () => generateDiurnalPath(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );

  const diurnalPaths = useMemo<SkyDomeDiurnalPath[]>(() => {
    const paths: SkyDomeDiurnalPath[] = [];

    // 1. Summer Solstice Arc (Amber dashed hairline)
    if (summerPathResult.pathD && summerSolsticeNoon > 0) {
      paths.push({
        id: 'summer-solstice',
        d: summerPathResult.pathD,
        stroke: '#fbbf24',
        strokeWidth: 0.75,
        strokeDasharray: '3 2',
        strokeOpacity: 0.7,
        title: `Summer Solstice Noon Peak: ${summerSolsticeNoon.toFixed(1)}° ${solsticeCulminations.summer.shortTag}`
      });
    }

    // 2. Active Today's Sun Path (Glowing Solid Gold Track)
    if (todayPathResult.pathD) {
      paths.push({
        id: 'today-sun-path',
        d: todayPathResult.pathD,
        stroke: '#f59e0b',
        strokeWidth: 1.5,
        strokeOpacity: 0.95,
        isGlowing: true,
        title: `Today's Solar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}°`
      });
    }

    // 2b. Today's Twilight Sub-Horizon Continuation (0° to -18°)
    if (isTwilightModeActive && todayPathResult.twilightD) {
      paths.push({
        id: 'today-twilight-path',
        d: todayPathResult.twilightD,
        stroke: '#f59e0b',
        strokeWidth: 1.0,
        strokeOpacity: 0.4,
        title: "Today's Twilight Track (0° to −18°)"
      });
    }

    // 3. Equinox Arc (Muted slate dashed hairline)
    if (equinoxPathResult.pathD && equinoxPathResult.peakAlt > 0) {
      const eqPeak = equinoxPathResult.peakAlt;
      paths.push({
        id: 'equinox-path',
        d: equinoxPathResult.pathD,
        stroke: '#64748b',
        strokeWidth: 0.75,
        strokeDasharray: '2 3',
        strokeOpacity: 0.5,
        title: `Equinox Noon Peak: ${eqPeak.toFixed(1)}°`
      });
    }

    // 4. Winter Solstice Arc (Bronze dashed hairline)
    if (winterPathResult.pathD && winterSolsticeNoon > 0) {
      paths.push({
        id: 'winter-solstice',
        d: winterPathResult.pathD,
        stroke: '#d97706',
        strokeWidth: 0.75,
        strokeDasharray: '3 2',
        strokeOpacity: 0.7,
        title: `Winter Solstice Noon Peak: ${winterSolsticeNoon.toFixed(1)}° ${solsticeCulminations.winter.shortTag}`
      });
    }

    return paths;
  }, [
    summerPathResult,
    summerSolsticeNoon,
    solsticeCulminations.summer.shortTag,
    solsticeCulminations.winter.shortTag,
    todayPathResult,
    isTwilightModeActive,
    equinoxPathResult,
    winterPathResult,
    winterSolsticeNoon
  ]);

  const twilightStatus = useMemo(
    () => getSolarTwilightStatus(currentSunElevation),
    [currentSunElevation]
  );

  return {
    sunDistanceAU,
    sunDistanceKm,
    noonElevation,
    solarNoon,
    equationOfTime,
    sunrise,
    sunset,
    sunDeclination,
    sunPos,
    currentSunElevation,
    sunX,
    sunY,
    culmination,
    riseSetAz,
    solsticeCulminations,
    absLat,
    isTropical,
    isPolar,
    maxAnnualNoon,
    summerSolsticeNoon,
    winterSolsticeNoon,
    capPathD,
    diurnalPaths,
    twilightStatus,
  };
};

export type SunElevationMathResult = ReturnType<typeof useSunElevationMath>;
