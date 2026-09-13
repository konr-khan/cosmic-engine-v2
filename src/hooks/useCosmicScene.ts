/**
 * @file useCosmicScene.ts
 * Master reactive scene hook and specialized projection selectors for Cosmic Engine V2.0.
 * 
 * Subscribes to CosmicStore via useSyncExternalStore and memoizes 60 FPS 3D scene
 * generation and canonical camera projections across Heliocentric Macro Orbit,
 * Eclipse Demonstrator, and Gyro-Morph Armillary subsystems.
 */

import { useMemo } from 'react';
import { useChronometerStore } from '../store/cosmicStore';
import { CosmicStoreState } from '../types/store';
import { 
  Degrees, 
  JulianDate, 
  Latitude, 
  Longitude, 
  HoursDecimal, 
  asDegrees,
  toDegrees
} from '../types/units';
import { Vector2D, Vector3D } from '../types/coordinates';
import { EphemerisFrame, EclipseData, SolarPositionFull } from '../types/astronomy';
import { 
  getJulianDate, 
  calculateEphemerisFrame, 
  calculateEclipseData,
  calculateEarthOrbitalPhysics
} from '../utils/cosmicMath';
import { 
  generateCosmicScene,
  projectHeliocentricTopDown,
  CosmicScene3D,
  ScaleMode,
  ProjectedScene2D,
  MilestoneNode3D
} from '../utils/cosmicMath/scene';

/** Selector for store synchronization with shallow equality protection */
const selectStoreState = (state: CosmicStoreState) => ({
  date: state.date,
  timeOfDay: state.timeOfDay,
  latitude: state.latitude,
  longitude: state.longitude,
  useAnalemma: state.useAnalemma
});

/** Master configuration options for useCosmicScene */
export interface UseCosmicSceneOptions {
  date?: Date | null;
  timeOfDay?: HoursDecimal | number | null;
  latitude?: Latitude | number | null;
  longitude?: Longitude | number | null;
  useAnalemma?: boolean | null;
  scaleMode?: ScaleMode;
}

/** Output data contract for useCosmicScene */
export interface CosmicSceneData {
  julianDate: JulianDate;
  timestamp: Date;
  scene3D: CosmicScene3D;
  scaleMode: ScaleMode;
  ephemerisFrame: EphemerisFrame;
}

/**
 * Master Hook: useCosmicScene
 * 
 * Subscribes to ephemeris chronometer state and evaluates the unified 3D Astronomical
 * Scene Graph (CosmicScene3D) with 60 FPS memoization and zero React render cascades.
 * 
 * @param options - Optional override parameters for date, coordinates, and scale mode
 * @returns CosmicSceneData containing Julian Date, 3D scene graph, and ephemeris frame
 */
export function useCosmicScene(options?: UseCosmicSceneOptions): CosmicSceneData {
  const storeState = useChronometerStore(selectStoreState);

  const date = options?.date ?? storeState.date;
  const timeOfDay = options?.timeOfDay ?? storeState.timeOfDay;
  const latitude = options?.latitude ?? storeState.latitude;
  const longitude = options?.longitude ?? storeState.longitude;
  const useAnalemma = options?.useAnalemma ?? storeState.useAnalemma;
  const scaleMode = options?.scaleMode ?? 'true';

  // 1. Memoized Julian Date derivation
  const julianDate = useMemo(() => {
    return getJulianDate(date, timeOfDay);
  }, [date, timeOfDay]);

  // 2. Pure 3D Scene Graph derivation
  const scene3D = useMemo(() => {
    return generateCosmicScene({
      julianDate,
      scaleMode,
      latitude,
      longitude,
      timeOfDay
    });
  }, [julianDate, scaleMode, latitude, longitude, timeOfDay]);

  // 3. Ephemeris Frame derivation
  const ephemerisFrame = useMemo(() => {
    return calculateEphemerisFrame(
      julianDate,
      latitude as Latitude,
      longitude as Longitude,
      useAnalemma
    );
  }, [julianDate, latitude, longitude, useAnalemma]);

  return useMemo(() => ({
    julianDate,
    timestamp: date,
    scene3D,
    scaleMode,
    ephemerisFrame
  }), [julianDate, date, scene3D, scaleMode, ephemerisFrame]);
}

/** Configuration options for Heliocentric Macro Orbit Sub-Hook */
export interface UseHeliocentricOptions extends UseCosmicSceneOptions {
  orbitalRadius?: number; // default: 200px
}

/** Output data contract for Heliocentric Macro Orbit Scene */
export interface HeliocentricSceneData {
  julianDate: JulianDate;
  scaleMode: ScaleMode;
  scene3D: CosmicScene3D;
  projected2D: ProjectedScene2D;
  sun: { x: number; y: number; radius: number };
  earth: {
    x: number;
    y: number;
    radius: number;
    distanceAU: number;
    distanceKm: number;
    orbitalSpeedKms: number;
    solarIrradiancePercent: number;
    sunAngularDiameterArcmin: number;
    heliocentricLongitude: Degrees;
    physics: SolarPositionFull;
  };
  moon: { x: number; y: number; radius: number };
  focus2X: number;
  focus2Y: number;
  bRatio: number;
  orbitalRadius: number;
  milestones: Array<MilestoneNode3D & { x: number; y: number }>;
  subsolarVector: Vector3D;
  axialTiltDeg: number;
  sunLambdaDeg: number;
  orbitPath: string;
  lunarOrbitPath?: string;
  eclipse?: EclipseData;
  isEclipse?: boolean;
}

/**
 * Sub-Hook: useHeliocentricScene
 * 
 * Specialized projection hook for the Heliocentric Keplerian Macro Orbit Subsystem.
 * Returns 2D screen coordinates, orbital ellipse parameters, 1 AU physics telemetry,
 * and 6 seasonal milestone nodes.
 * 
 * Overloads support:
 * - `useHeliocentricScene(options)`
 * - `useHeliocentricScene(scaleMode, options)`
 */
export function useHeliocentricScene(
  optionsOrScaleMode?: UseHeliocentricOptions | ScaleMode,
  maybeOptions?: UseHeliocentricOptions
): HeliocentricSceneData {
  let options: UseHeliocentricOptions = {};
  if (typeof optionsOrScaleMode === 'string') {
    options = { ...maybeOptions, scaleMode: optionsOrScaleMode };
  } else if (typeof optionsOrScaleMode === 'object' && optionsOrScaleMode !== null) {
    options = optionsOrScaleMode;
  }

  const { julianDate, scene3D, scaleMode } = useCosmicScene(options);
  const orbitalRadius = options.orbitalRadius ?? 200;

  const projected2D = useMemo(() => {
    return projectHeliocentricTopDown(scene3D, {
      width: 580,
      height: 560,
      scale: orbitalRadius / 200,
      centerX: 0,
      centerY: 0
    });
  }, [scene3D, orbitalRadius]);

  const scaleFactor = orbitalRadius / 200;
  const bRatio = scene3D.foci ? (scene3D.foci.semiMinorAxis / scene3D.foci.semiMajorAxis) : 1.0;
  const focus2X = scene3D.foci 
    ? (scene3D.scaleMode === 'true' ? scene3D.foci.f2.x * orbitalRadius : scene3D.foci.f2.x * scaleFactor)
    : 0;
  const focus2Y = scene3D.foci 
    ? (scene3D.scaleMode === 'true' ? scene3D.foci.f2.y * orbitalRadius : scene3D.foci.f2.y * scaleFactor)
    : 0;
  const sunLambdaDeg = scene3D.sun.eclipticLongitude 
    ?? (((scene3D.earth.heliocentricLongitude + 180) % 360 + 360) % 360);
  const axialTiltDeg = toDegrees(scene3D.earth.obliquity);

  const physics: SolarPositionFull = useMemo(() => {
    return calculateEarthOrbitalPhysics(julianDate);
  }, [julianDate]);

  const eclipse: EclipseData = useMemo(() => {
    return calculateEclipseData(julianDate);
  }, [julianDate]);

  const isEclipse = Boolean(eclipse && eclipse.isEclipseActive);

  const milestones = useMemo(() => {
    const posScale = scene3D.scaleMode === 'true' ? orbitalRadius : scaleFactor;
    return scene3D.milestones.map(m => ({
      ...m,
      x: m.position.x * posScale,
      y: m.position.y * posScale
    }));
  }, [scene3D.milestones, scene3D.scaleMode, orbitalRadius, scaleFactor]);

  return useMemo(() => ({
    julianDate,
    scaleMode,
    scene3D,
    projected2D,
    sun: {
      x: projected2D.elements.sun.x,
      y: projected2D.elements.sun.y,
      radius: projected2D.elements.sun.r
    },
    earth: {
      x: projected2D.elements.earth.x,
      y: projected2D.elements.earth.y,
      radius: projected2D.elements.earth.r,
      distanceAU: scene3D.earth.distanceAU,
      distanceKm: scene3D.earth.distanceKm,
      orbitalSpeedKms: scene3D.earth.orbitalSpeedKms,
      solarIrradiancePercent: scene3D.earth.solarIrradiancePercent,
      sunAngularDiameterArcmin: scene3D.earth.sunAngularDiameterArcmin,
      heliocentricLongitude: scene3D.earth.heliocentricLongitude,
      physics
    },
    moon: {
      x: projected2D.elements.moon.x,
      y: projected2D.elements.moon.y,
      radius: projected2D.elements.moon.r
    },
    focus2X,
    focus2Y,
    bRatio,
    orbitalRadius,
    milestones,
    subsolarVector: scene3D.earth.subsolarPoint,
    axialTiltDeg,
    sunLambdaDeg,
    orbitPath: projected2D.elements.orbitPath,
    lunarOrbitPath: projected2D.elements.lunarOrbitPath,
    eclipse,
    isEclipse
  }), [
    julianDate,
    scaleMode,
    scene3D,
    projected2D,
    physics,
    focus2X,
    focus2Y,
    bRatio,
    orbitalRadius,
    milestones,
    axialTiltDeg,
    sunLambdaDeg,
    eclipse,
    isEclipse
  ]);
}

