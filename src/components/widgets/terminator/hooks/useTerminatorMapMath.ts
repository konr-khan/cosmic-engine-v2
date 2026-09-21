import { useMemo } from 'react';
import { 
  getTerminatorShadowPaths, 
  clamp, 
  calculateEarthOrbitalPhysics, 
  getJulianDate,
  generate24HourGroundTrack,
  findActiveNodalCrossing,
  getLunarNodeProximityTelemetry,
  GroundTrackResult,
  ActiveNodalMarker,
  LunarNodeProximityTelemetry,
  TerminatorShadowPaths
} from '../../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData, JulianDate } from '../../../../types';
import { useHoverTime } from '../../../../store/hoverStore';

export interface UseTerminatorMapMathParams {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  hoverTime?: number | null;
  currentDate?: Date;
  showSunTrack?: boolean;
  showMoonTrack?: boolean;
}

export interface UseTerminatorMapMathReturn {
  effectiveHoverTime: number | null;
  activeTime: number;
  activeJD: JulianDate;
  // Subsolar / Keplerian metrics
  declination: number;
  sunDistanceAU: number;
  sunDistanceKm: number;
  sunAngularDiamArcmin: number;
  sunRadius: number;
  sunGlowRadius: number;
  normalizedSunLong: number;
  sunCy: number;
  userCy: number;
  relSunX: number;
  // Sublunar / Ephemeris metrics
  lunarDec: number;
  transit: number;
  moonPhase: string;
  moonIllum: string;
  moonDistKm: number;
  moonAngularDiamArcmin: number;
  isSupermoon: boolean;
  isMicromoon: boolean;
  moonRadius: number;
  moonGlowRadius: number;
  relMoonX: number;
  moonCy: number;
  // Diurnal ground tracks & nodes
  sunTrack: GroundTrackResult | null;
  moonTrack: GroundTrackResult | null;
  activeNodalMarker: ActiveNodalMarker | null;
  lunarNodeTelemetry: LunarNodeProximityTelemetry;
  // Layered spherical twilight shadow polygons
  astroShadow: TerminatorShadowPaths;
  nauticalShadow: TerminatorShadowPaths;
  civilShadow: TerminatorShadowPaths;
  dayShadow: TerminatorShadowPaths;
}

/**
 * useTerminatorMapMath
 * 
 * Container calculation hook for TerminatorMap. Decouples astronomical geometry,
 * Keplerian distance scaling, sublunar coordinates, 24-hour diurnal ground tracks,
 * and 4-tier spherical twilight shadow paths from SVG presentation components.
 */
export const useTerminatorMapMath = ({
  solarData,
  orbitalData,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12,
  hoverTime,
  currentDate = new Date(),
  showSunTrack = false,
  showMoonTrack = false
}: UseTerminatorMapMathParams): UseTerminatorMapMathReturn => {
  const storeHoverTime = useHoverTime();
  const effectiveHoverTime = hoverTime !== undefined ? hoverTime : storeHoverTime;

  const declination = (solarData?.declination ?? 0) as number;
  const activeTime = effectiveHoverTime !== null ? effectiveHoverTime : timeOfDay;
  const activeJD = useMemo(() => getJulianDate(currentDate, activeTime), [currentDate, activeTime]);

  // --- 1. Earth-Sun Keplerian Distance & Dynamic Disc Scaling ---
  const fallbackPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(activeJD),
    [activeJD]
  );
  const sunDistanceAU = solarData?.distanceAU ?? fallbackPhysics.distanceAU;
  const sunDistanceKm = solarData?.distanceKm ?? fallbackPhysics.distanceKm;
  const sunAngularDiamArcmin = solarData?.sunAngularDiameterArcmin ?? fallbackPhysics.sunAngularDiameterArcmin;

  // Dynamic Sun Disc Radius (Base 4.5px, dynamically scaled with orbital distance)
  const sunScale = 1.0 + (1.0 / sunDistanceAU - 1.0) * 4.0;
  const sunRadius = clamp(4.5 * sunScale, 3.5, 6.0);
  const sunGlowRadius = sunRadius * 2.4;

  const sunLong = (12 - activeTime) * 15;
  const normalizedSunLong = ((sunLong + 180) % 360 + 360) % 360 - 180;
  const sunCy = 90 - declination;
  const userCy = 90 - latitude;

  // --- 2. Sublunar Point (Moon) Coordinates, Distance & Ephemeris ---
  const lunarDec = (orbitalData?.lunarEvents?.declination ?? orbitalData?.lunarPos?.declination ?? 0) as number;
  const transit = orbitalData?.lunarEvents?.transit ?? 12;
  const moonPhase = orbitalData?.phase?.name || 'Waxing Crescent';
  const moonIllum = ((orbitalData?.phase?.value ?? 0.34) * 100).toFixed(0);
  const moonDistKm = orbitalData?.lunarEvents?.distanceKm || orbitalData?.lunarPos?.distanceKm || 384400;
  const moonAngularDiamArcmin = 31.13 * (384400 / moonDistKm);
  const isSupermoon = moonDistKm < 365000;
  const isMicromoon = moonDistKm > 400000;

  // Dynamic Moon Disc Radius (Base 4.0px, dynamically scaled with geocentric distance)
  const moonScale = 1.0 + (384400 / moonDistKm - 1.0) * 2.5;
  const moonRadius = clamp(4.0 * moonScale, 3.0, 5.5);
  const moonGlowRadius = moonRadius * 2.5;

  // Map subsolar & sublunar positions relative to centered observer longitude
  const relSunX = (normalizedSunLong - longitude + 180 + 360) % 360;
  const moonHourAngle = (activeTime - transit) * 15;
  const relMoonX = ((180 - moonHourAngle) % 360 + 360) % 360;
  const moonCy = 90 - lunarDec;

  // --- 3. 24-Hour Diurnal Subsolar & Sublunar Ground Tracks ---
  const sunTrack = useMemo(() => {
    if (!showSunTrack) return null;
    return generate24HourGroundTrack('sun', activeJD, longitude, 30);
  }, [showSunTrack, activeJD, longitude]);

  const moonTrack = useMemo(() => {
    if (!showMoonTrack) return null;
    return generate24HourGroundTrack('moon', activeJD, longitude, 30);
  }, [showMoonTrack, activeJD, longitude]);

  const activeNodalMarker = useMemo(() => {
    if (!showMoonTrack) return null;
    return findActiveNodalCrossing(activeJD, longitude);
  }, [showMoonTrack, activeJD, longitude]);

  const lunarNodeTelemetry = useMemo(() => {
    return getLunarNodeProximityTelemetry(activeJD);
  }, [activeJD]);

  // Compute precise 3D spherical shadow paths for twilight layers
  const astroShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -18.0),
    [longitude, normalizedSunLong, declination]
  );
  const nauticalShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -12.0),
    [longitude, normalizedSunLong, declination]
  );
  const civilShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -6.0),
    [longitude, normalizedSunLong, declination]
  );
  const dayShadow = useMemo(
    () => getTerminatorShadowPaths(longitude, normalizedSunLong, declination, -0.833),
    [longitude, normalizedSunLong, declination]
  );

  return {
    effectiveHoverTime,
    activeTime,
    activeJD,
    declination,
    sunDistanceAU,
    sunDistanceKm,
    sunAngularDiamArcmin,
    sunRadius,
    sunGlowRadius,
    normalizedSunLong,
    sunCy,
    userCy,
    relSunX,
    lunarDec,
    transit,
    moonPhase,
    moonIllum,
    moonDistKm,
    moonAngularDiamArcmin,
    isSupermoon,
    isMicromoon,
    moonRadius,
    moonGlowRadius,
    relMoonX,
    moonCy,
    sunTrack,
    moonTrack,
    activeNodalMarker,
    lunarNodeTelemetry,
    astroShadow,
    nauticalShadow,
    civilShadow,
    dayShadow
  };
};
