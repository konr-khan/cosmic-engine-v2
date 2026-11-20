import { useMemo, useCallback } from 'react';
import { 
  SOLAR_TWILIGHT_THRESHOLDS,
  getJulianDate, 
  calculateEphemerisFrame,
  calculateDaylightDurationPrecise,
  calculateOrbitalTideMetrics,
  getPhaseName,
  toRadians
} from '../utils/cosmicMath';
import { useChronometerStore } from '../store/cosmicStore';
import { CosmicStoreState } from '../types/store';
import { useEphemerisWorker } from './useEphemerisWorker';
import { ActiveWidgetsFilter, CosmicEngineData, SolarAlmanacData, OrbitalData } from '../types/astronomy';
import { Latitude, Longitude, HoursDecimal } from '../types/units';

const ORBITAL_WIDGET_KEYS = ['macroOrbit', 'microTides', 'lunarAlmanac', 'armillary', 'eclipse', 'today', 'map'] as const;
const LUNAR_WIDGET_KEYS = ['lunarAlmanac', 'armillary', 'today', 'map'] as const;
const ECLIPSE_WIDGET_KEYS = ['eclipse', 'macroOrbit'] as const;

export const resolveActiveCategory = (
  categoryKeys: readonly string[],
  activeWidgets: ActiveWidgetsFilter
): boolean => {
  const hasExplicitPositiveOnly = 
    Object.values(activeWidgets).some(v => v === true) && 
    !Object.values(activeWidgets).some(v => v === false);

  return hasExplicitPositiveOnly
    ? categoryKeys.some(k => Boolean(activeWidgets[k as keyof ActiveWidgetsFilter]))
    : categoryKeys.some(k => activeWidgets[k as keyof ActiveWidgetsFilter] === true) ||
      (!categoryKeys.some(k => activeWidgets[k as keyof ActiveWidgetsFilter] === false));
};

export const useCosmicEngine = (
  paramDate?: Date | null, 
  paramTimeOfDay?: HoursDecimal | null, 
  paramLatitude?: Latitude | null, 
  paramLongitude?: Longitude | null, 
  activeWidgets: ActiveWidgetsFilter = {}
): CosmicEngineData => {
  const isDateProvided = paramDate != null;
  const isTimeProvided = paramTimeOfDay != null;
  const isLatProvided = paramLatitude != null;
  const isLonProvided = paramLongitude != null;
  const needsStoreSubscription = !(isDateProvided && isTimeProvided && isLatProvided && isLonProvided);
  const selector = useCallback((state: CosmicStoreState) => ({
    date: isDateProvided ? null : state.date,
    timeOfDay: isTimeProvided ? null : state.timeOfDay,
    latitude: isLatProvided ? null : state.latitude,
    longitude: isLonProvided ? null : state.longitude,
  }), [isDateProvided, isTimeProvided, isLatProvided, isLonProvided]);
  const storeState = useChronometerStore(selector, undefined, needsStoreSubscription);
  const date = (paramDate ?? storeState.date) as Date;
  const timeOfDay = (paramTimeOfDay ?? storeState.timeOfDay) as HoursDecimal;
  const latitude = (paramLatitude ?? storeState.latitude) as Latitude;
  const longitude = (paramLongitude ?? storeState.longitude) as Longitude;

  const isLunarActive = resolveActiveCategory(LUNAR_WIDGET_KEYS, activeWidgets);
  const isEclipseActive = resolveActiveCategory(ECLIPSE_WIDGET_KEYS, activeWidgets);
  const isOrbitalActive = resolveActiveCategory(ORBITAL_WIDGET_KEYS, activeWidgets);

  const julianDate = useMemo(() => getJulianDate(date, timeOfDay), [date, timeOfDay]);

  const { lunarEvents, eclipse } = useEphemerisWorker({
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
    const frame = calculateEphemerisFrame(JD, latitude, longitude);
    const { solarPos } = frame;
    const { declination, n, lambda: solarLambda } = solarPos;
    const { CIVIL, NAUTICAL, ASTRONOMICAL } = SOLAR_TWILIGHT_THRESHOLDS;
    
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
      rightAscension: solarPos.rightAscension,
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
      const tideMetrics = calculateOrbitalTideMetrics({
        solarLambdaDeg: sunDegrees,
        lunarLambdaDeg: moonDegrees,
        lunarPhase: phase0to1,
        lunarElongationDeg: lunarPos.elongation,
        timeOfDay,
        longitude
      });

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
        tides: {
          rx: tideMetrics.rx,
          ry: tideMetrics.ry,
          type: tideMetrics.type,
          alignment: tideMetrics.alignment
        },
        localTideStatus: tideMetrics.localTideStatus,
        lunarEvents,
        eclipse
      };
    }

    return { solarData, orbitalData, julianDate: JD };
  }, [julianDate, timeOfDay, latitude, longitude, isOrbitalActive, lunarEvents, eclipse]);
};
