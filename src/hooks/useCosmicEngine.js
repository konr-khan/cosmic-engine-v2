import { useMemo } from 'react';
import { 
  CONFIG, 
  getJulianDate, 
  calculateSolarPosition, 
  calculateDaylightDurationPrecise,
  calculateLunarPosition,
  getPhaseName,
  toRadians,
  toDegrees
} from '../utils/cosmicMath';
import { useChronometerStore } from '../store/cosmicStore';
import { useEphemerisWorker } from './useEphemerisWorker';

export const useCosmicEngine = (
  paramDate, 
  paramTimeOfDay, 
  paramLatitude, 
  paramLongitude, 
  paramUseAnalemma,
  activeWidgets = {}
) => {
  const storeState = useChronometerStore((state) => ({
    date: state.date,
    timeOfDay: state.timeOfDay,
    latitude: state.latitude,
    longitude: state.longitude,
    useAnalemma: state.useAnalemma
  }));

  const date = paramDate ?? storeState.date;
  const timeOfDay = paramTimeOfDay ?? storeState.timeOfDay;
  const latitude = paramLatitude ?? storeState.latitude;
  const longitude = paramLongitude ?? storeState.longitude;
  const useAnalemma = paramUseAnalemma ?? storeState.useAnalemma;

  const hasExplicitPositiveOnly = 
    Object.values(activeWidgets).some(v => v === true) && 
    !Object.values(activeWidgets).some(v => v === false);

  const isLunarActive = hasExplicitPositiveOnly 
    ? Boolean(activeWidgets.lunarAlmanac)
    : activeWidgets.lunarAlmanac !== false;

  const isEclipseActive = hasExplicitPositiveOnly
    ? Boolean(activeWidgets.eclipse || activeWidgets.macroOrbit)
    : (activeWidgets.eclipse !== false || activeWidgets.macroOrbit !== false);

  const isOrbitalActive = hasExplicitPositiveOnly
    ? Boolean(activeWidgets.macroOrbit || activeWidgets.microTides || activeWidgets.lunarAlmanac || activeWidgets.celestialSphere || activeWidgets.eclipse)
    : (activeWidgets.macroOrbit !== false || 
       activeWidgets.microTides !== false || 
       activeWidgets.lunarAlmanac !== false || 
       activeWidgets.celestialSphere !== false ||
       activeWidgets.eclipse !== false);

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

    const solarPos = calculateSolarPosition(JD);
    const { declination, equationOfTime, n, lambda: solarLambda } = solarPos;
    const { OFFICIAL, CIVIL, NAUTICAL, ASTRONOMICAL } = CONFIG.SOLAR.TWILIGHT;
    
    const eotCorrection = useAnalemma ? equationOfTime : 0;
    const solarNoon = 12 - (longitude / 15) - (eotCorrection / 60);
    const dayLen = calculateDaylightDurationPrecise(latitude, declination, OFFICIAL);
    
    const solarData = {
      dayLength: dayLen,
      civil: calculateDaylightDurationPrecise(latitude, declination, CIVIL),
      nautical: calculateDaylightDurationPrecise(latitude, declination, NAUTICAL),
      astronomical: calculateDaylightDurationPrecise(latitude, declination, ASTRONOMICAL),
      sunrise: solarNoon - (dayLen / 2),
      sunset: solarNoon + (dayLen / 2),
      solarNoon,
      equationOfTime: eotCorrection,
      daysSinceEpoch: n,
      noonElevation: 90 - Math.abs(latitude - declination),
      declination,
      lambda: solarLambda,
      eclipticLongitude: solarLambda,
      isPolarNight: dayLen <= 0,
      isMidnightSun: dayLen >= 24
    };

    let orbitalData = null;

    if (isOrbitalActive) {
      const lunarPos = calculateLunarPosition(JD);
      const { earthOrbitRadius, moonOrbitRadius, daysInYear, earthRadius } = CONFIG.ORBIT;

      const earthTheta = (n / daysInYear) * 2 * Math.PI;
      const earthPos = {
        x: earthOrbitRadius * Math.cos(earthTheta),
        y: earthOrbitRadius * Math.sin(earthTheta),
      };

      const meanElongationDeg = 297.85 + (12.19075 * n);
      const elongationRad = toRadians(meanElongationDeg);
      const angleToSun = earthTheta + Math.PI;
      const moonTheta = angleToSun + elongationRad;

      const moonPos = {
        x: earthPos.x + moonOrbitRadius * Math.cos(moonTheta),
        y: earthPos.y + moonOrbitRadius * Math.sin(moonTheta),
      };

      const angleToMoon = Math.atan2(moonPos.y - earthPos.y, moonPos.x - earthPos.x);
      let phaseRad = (angleToMoon - angleToSun) % (2 * Math.PI);
      if (phaseRad < 0) phaseRad += 2 * Math.PI;
      const phase0to1 = phaseRad / (2 * Math.PI);

      const alignmentFactor = Math.cos(2 * (angleToMoon - angleToSun));
      const baseOceanSize = earthRadius + 4;
      const tideRx = baseOceanSize + 6 + (3 * alignmentFactor);
      let tideType = alignmentFactor > 0.8 ? "Spring Tide" : (alignmentFactor < -0.8 ? "Neap Tide" : "Transitional");

      const userRotation = ((timeOfDay - 12) * 15) + longitude;
      const moonPhaseAngleDeg = phase0to1 * 360;
      
      let diff = (userRotation - moonPhaseAngleDeg) % 360;
      if (diff < 0) diff += 360; 
      
      let localTideStatus = "Low Tide";
      if (diff <= 45 || diff >= 315 || (diff >= 135 && diff <= 225)) {
        localTideStatus = "High Tide";
      }

      orbitalData = {
        positions: { sun: { x: 0, y: 0 }, earth: earthPos, moon: moonPos },
        angles: { 
          toSun: angleToSun, 
          toMoon: angleToMoon, 
          sunDegrees: toDegrees(Math.atan2(Math.sin(angleToSun), Math.cos(angleToSun))), 
          moonDegrees: toDegrees(angleToMoon),
          nodeLongitude: lunarPos.nodeLongitude,
          descendingNodeLongitude: lunarPos.descendingNodeLongitude
        },
        nodeLongitude: lunarPos.nodeLongitude,
        descendingNodeLongitude: lunarPos.descendingNodeLongitude,
        lunarPos,
        phase: { value: phase0to1, name: getPhaseName(phase0to1) },
        tides: { rx: tideRx, ry: baseOceanSize, type: tideType, alignment: alignmentFactor },
        userRotation,
        localTideStatus,
        lunarEvents: ephemeris.lunarEvents,
        eclipse: ephemeris.eclipse
      };
    }

    return { solarData, orbitalData, julianDate: JD };
  }, [date, timeOfDay, latitude, longitude, useAnalemma, isLunarActive, isEclipseActive, isOrbitalActive, julianDate, ephemeris]);
};



