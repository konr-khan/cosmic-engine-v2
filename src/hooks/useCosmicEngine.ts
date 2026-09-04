import { useMemo } from 'react';
import { 
  CONFIG, 
  getJulianDate, 
  calculateEphemerisFrame,
  calculateDaylightDurationPrecise,
  getPhaseName,
  toRadians
} from '../utils/cosmicMath';
import { useChronometerStore } from '../store/cosmicStore';
import { useEphemerisWorker } from './useEphemerisWorker';
import { ActiveWidgetsFilter, CosmicEngineData, SolarAlmanacData, OrbitalData, TideType } from '../types/astronomy';
import { Latitude, Longitude, HoursDecimal, JulianDate } from '../types/units';

const selectStoreState = (state: { date: Date; timeOfDay: number; latitude: number; longitude: number; useAnalemma: boolean }) => ({
  date: state.date,
  timeOfDay: state.timeOfDay,
  latitude: state.latitude,
  longitude: state.longitude,
  useAnalemma: state.useAnalemma
});

const ORBITAL_WIDGET_KEYS = ['macroOrbit', 'microTides', 'lunarAlmanac', 'armillary', 'eclipse', 'today', 'map'] as const;
const LUNAR_WIDGET_KEYS = ['lunarAlmanac', 'armillary', 'today', 'map'] as const;
const ECLIPSE_WIDGET_KEYS = ['eclipse', 'macroOrbit'] as const;

export const useCosmicEngine = (
  paramDate?: Date | null, 
  paramTimeOfDay?: HoursDecimal | null, 
  paramLatitude?: Latitude | null, 
  paramLongitude?: Longitude | null, 
  paramUseAnalemma?: boolean | null,
  activeWidgets: ActiveWidgetsFilter = {}
): CosmicEngineData => {
  const storeState = useChronometerStore(selectStoreState);

  const date = paramDate ?? storeState.date;
  const timeOfDay = paramTimeOfDay ?? storeState.timeOfDay;
  const latitude = paramLatitude ?? storeState.latitude;
  const longitude = paramLongitude ?? storeState.longitude;
  const useAnalemma = paramUseAnalemma ?? storeState.useAnalemma;

  const hasExplicitPositiveOnly = 
    Object.values(activeWidgets).some(v => v === true) && 
    !Object.values(activeWidgets).some(v => v === false);

  const isLunarActive = hasExplicitPositiveOnly 
    ? LUNAR_WIDGET_KEYS.some(k => Boolean(activeWidgets[k]))
    : LUNAR_WIDGET_KEYS.some(k => activeWidgets[k] === true) ||
      (!LUNAR_WIDGET_KEYS.some(k => activeWidgets[k] === false));

  const isEclipseActive = hasExplicitPositiveOnly
    ? ECLIPSE_WIDGET_KEYS.some(k => Boolean(activeWidgets[k]))
    : ECLIPSE_WIDGET_KEYS.some(k => activeWidgets[k] === true) ||
      (!ECLIPSE_WIDGET_KEYS.every(k => activeWidgets[k] === false) && !ECLIPSE_WIDGET_KEYS.some(k => activeWidgets[k] === false));

  const isOrbitalActive = hasExplicitPositiveOnly
    ? ORBITAL_WIDGET_KEYS.some(k => Boolean(activeWidgets[k]))
    : ORBITAL_WIDGET_KEYS.some(k => activeWidgets[k] === true) ||
      (!ORBITAL_WIDGET_KEYS.some(k => activeWidgets[k] === false));

  const julianDate = useMemo(() => getJulianDate(date, timeOfDay), [date, timeOfDay]);

  const ephemeris = useEphemerisWorker({
    latitude,
    longitude,
    julianDate,
    timeOfDay,
    isLunarActive,
    isEclipseActive,
    isOrbitalActive
  });

  return useMemo(() => {
    const JD = julianDate;
    const frame = calculateEphemerisFrame(JD, latitude, longitude, useAnalemma);
    const { solarPos } = frame;
    const { declination, equationOfTime, n, lambda: solarLambda } = solarPos;
    const { CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;
    
    const solarData: SolarAlmanacData = {
      dayLength: frame.dayLength,
      civil: calculateDaylightDurationPrecise(latitude, declination, CIVIL),
      nautical: calculateDaylightDurationPrecise(latitude, declination, NAUTICAL),
      astronomical: calculateDaylightDurationPrecise(latitude, declination, ASTRONOMICAL),
      sunrise: frame.sunrise,
      sunset: frame.sunset,
      solarNoon: frame.solarNoon,
      equationOfTime: frame.equationOfTime,
      daysSinceEpoch: n,
      noonElevation: frame.noonElevation,
      declination,
      lambda: solarLambda,
      eclipticLongitude: solarLambda,
      isPolarNight: frame.isPolarNight,
      isMidnightSun: frame.isMidnightSun,
      distanceAU: solarPos.distanceAU,
      distanceKm: solarPos.distanceKm,
      orbitalSpeedKms: solarPos.orbitalSpeedKms,
      solarIrradiancePercent: solarPos.solarIrradiancePercent,
      sunAngularDiameterArcmin: solarPos.sunAngularDiameterArcmin,
      isPerihelion: solarPos.isPerihelion,
      isAphelion: solarPos.isAphelion
    };

    let orbitalData: OrbitalData | null = null;

    if (isOrbitalActive) {
      const lunarPos = frame.lunarPos;
      const sunDegrees = solarPos.lambda;
      const moonDegrees = lunarPos.lambda;
      const angleToSun = toRadians(sunDegrees);
      const angleToMoon = toRadians(moonDegrees);

      const phase0to1 = lunarPos.phase;
      const elongationRad = toRadians(lunarPos.elongation ?? ((moonDegrees - sunDegrees + 360) % 360));
      const alignmentFactor = Math.cos(2 * elongationRad);

      const baseOceanSize = CONFIG.ORBIT.earthRadius + 4;
      const tideRx = baseOceanSize + 6 + (3 * alignmentFactor);
      const tideType: TideType = alignmentFactor > 0.8 ? "Spring Tide" : (alignmentFactor < -0.8 ? "Neap Tide" : "Transitional");

      const observerMeridianDeg = ((timeOfDay - 12) * 15) + longitude;
      const moonPhaseAngleDeg = phase0to1 * 360;
      
      let diff = (observerMeridianDeg - moonPhaseAngleDeg) % 360;
      if (diff < 0) diff += 360; 
      
      let localTideStatus: 'High Tide' | 'Low Tide' = "Low Tide";
      if (diff <= 45 || diff >= 315 || (diff >= 135 && diff <= 225)) {
        localTideStatus = "High Tide";
      }

      orbitalData = {
        angles: { 
          toSun: angleToSun, 
          toMoon: angleToMoon, 
          sunDegrees, 
          moonDegrees,
          nodeLongitude: lunarPos.nodeLongitude,
          descendingNodeLongitude: lunarPos.descendingNodeLongitude
        },
        nodeLongitude: lunarPos.nodeLongitude,
        descendingNodeLongitude: lunarPos.descendingNodeLongitude,
        lunarPos,
        phase: { value: phase0to1, name: getPhaseName(phase0to1) },
        tides: { rx: tideRx, ry: baseOceanSize, type: tideType, alignment: alignmentFactor },
        localTideStatus,
        lunarEvents: ephemeris.lunarEvents,
        eclipse: ephemeris.eclipse
      };
    }

    return { solarData, orbitalData, julianDate: JD };
  }, [date, timeOfDay, latitude, longitude, useAnalemma, isLunarActive, isEclipseActive, isOrbitalActive, julianDate, ephemeris]);
};
