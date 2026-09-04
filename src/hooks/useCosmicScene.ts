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
  Radians, 
  JulianDate, 
  Latitude, 
  Longitude, 
  HoursDecimal, 
  asDegrees, 
  asJulianDate,
  toDegrees,
  toRadians 
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
  projectGeocentricTransverse,
  projectGeocentricAxial,
  projectEulerCamera,
  CosmicScene3D,
  ScaleMode,
  ProjectedScene2D,
  MilestoneNode3D,
  LunarOrbitSegment2D,
  ProjectedShadowCones2D,
  GenerateCosmicSceneParams
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

  return {
    julianDate,
    timestamp: date,
    scene3D,
    scaleMode,
    ephemerisFrame
  };
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
    ?? ((scene3D.earth.heliocentricLongitude + 180) % 360);
  const axialTiltDeg = toDegrees(scene3D.earth.obliquity);

  const physics: SolarPositionFull = useMemo(() => {
    return calculateEarthOrbitalPhysics(julianDate);
  }, [julianDate]);

  const milestones = useMemo(() => {
    const posScale = scene3D.scaleMode === 'true' ? orbitalRadius : scaleFactor;
    return scene3D.milestones.map(m => ({
      ...m,
      x: m.position.x * posScale,
      y: m.position.y * posScale
    }));
  }, [scene3D.milestones, scene3D.scaleMode, orbitalRadius, scaleFactor]);

  return {
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
    lunarOrbitPath: projected2D.elements.lunarOrbitPath
  };
}

/** Configuration options for Eclipse Demonstrator Sub-Hook */
export interface UseEclipseOptions extends UseCosmicSceneOptions {}

/** Output data contract for Eclipse Demonstrator Scene */
export interface EclipseSceneData {
  julianDate: JulianDate;
  scene3D: CosmicScene3D;
  eclipse: EclipseData;
  transverseProjected: ProjectedScene2D;
  axialProjected: ProjectedScene2D;
  sunLambdaDeg: number;
  transverseProfile: {
    sun: { x: number; y: number; r: number };
    earth: { x: number; y: number; r: number; axialTiltAngle2D: number };
    moon: { x: number; y: number; r: number };
    umbraCone: string;
    penumbraCone: string;
    axisLine: { x1: number; y1: number; x2: number; y2: number };
    orbitalSegments: LunarOrbitSegment2D[];
    ascendingNode: { x: number; y: number };
    descendingNode: { x: number; y: number };
  };
  axialSightline: {
    sun: { x: number; y: number; r: number };
    earth: { x: number; y: number; r: number; axialTiltAngle2D: number };
    moon: { x: number; y: number; r: number };
    orbitalSegments: LunarOrbitSegment2D[];
    ascendingNode: { x: number; y: number };
    descendingNode: { x: number; y: number };
  };
}

/**
 * Sub-Hook: useEclipseScene
 * 
 * Specialized projection hook for the Eclipse Demonstrator Subsystem.
 * Returns synchronized side-on Transverse and down-the-barrel Axial projections,
 * Umbra/Penumbra shadow cones, and 4-quadrant 5.14° nodal loops.
 */
export function useEclipseScene(options?: UseEclipseOptions): EclipseSceneData {
  const { julianDate, scene3D } = useCosmicScene(options);

  const eclipse = useMemo(() => {
    return calculateEclipseData(julianDate);
  }, [julianDate]);

  const transverseProjected = useMemo(() => {
    return projectGeocentricTransverse(scene3D);
  }, [scene3D]);

  const axialProjected = useMemo(() => {
    return projectGeocentricAxial(scene3D);
  }, [scene3D]);

  const sunLambdaDeg = scene3D.sun.eclipticLongitude 
    ?? ((scene3D.earth.heliocentricLongitude + 180) % 360);

  // Transverse Node Coordinates
  const nodeAngleRad = toRadians(eclipse.nodeAngleDeg ?? (eclipse.nodeProximityDeg ?? 0));
  const tAsc = (-nodeAngleRad % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tDesc = ((Math.PI - nodeAngleRad) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  // Transverse Node Coordinates
  const transAscNode = transverseProjected.elements.nodeMarkers?.asc ?? {
    x: 310 - Math.cos(tAsc) * 85,
    y: 110
  };
  const transDescNode = transverseProjected.elements.nodeMarkers?.desc ?? {
    x: 310 - Math.cos(tDesc) * 85,
    y: 110
  };

  // Axial Node Coordinates
  const axialAscNode = axialProjected.elements.nodeMarkers?.asc ?? {
    x: 260 - Math.sin(tAsc) * 150,
    y: 110
  };
  const axialDescNode = axialProjected.elements.nodeMarkers?.desc ?? {
    x: 260 - Math.sin(tDesc) * 150,
    y: 110
  };

  return {
    julianDate,
    scene3D,
    eclipse,
    transverseProjected,
    axialProjected,
    sunLambdaDeg,
    transverseProfile: {
      sun: {
        x: transverseProjected.elements.sun.x,
        y: transverseProjected.elements.sun.y,
        r: transverseProjected.elements.sun.r
      },
      earth: {
        x: transverseProjected.elements.earth.x,
        y: transverseProjected.elements.earth.y,
        r: transverseProjected.elements.earth.r,
        axialTiltAngle2D: transverseProjected.elements.earth.axialTiltAngle2D
      },
      moon: {
        x: transverseProjected.elements.moon.x,
        y: transverseProjected.elements.moon.y,
        r: transverseProjected.elements.moon.r
      },
      umbraCone: transverseProjected.elements.shadowCones?.umbraPath ?? '',
      penumbraCone: transverseProjected.elements.shadowCones?.penumbraPath ?? '',
      axisLine: transverseProjected.elements.shadowCones?.axisLine ?? { x1: 50, y1: 110, x2: 510, y2: 110 },
      orbitalSegments: transverseProjected.elements.lunarOrbitSegments ?? [],
      ascendingNode: transAscNode,
      descendingNode: transDescNode
    },
    axialSightline: {
      sun: {
        x: axialProjected.elements.sun.x,
        y: axialProjected.elements.sun.y,
        r: axialProjected.elements.sun.r
      },
      earth: {
        x: axialProjected.elements.earth.x,
        y: axialProjected.elements.earth.y,
        r: axialProjected.elements.earth.r,
        axialTiltAngle2D: axialProjected.elements.earth.axialTiltAngle2D
      },
      moon: {
        x: axialProjected.elements.moon.x,
        y: axialProjected.elements.moon.y,
        r: axialProjected.elements.moon.r
      },
      orbitalSegments: axialProjected.elements.lunarOrbitSegments ?? [],
      ascendingNode: axialAscNode,
      descendingNode: axialDescNode
    }
  };
}

/** Configuration options for Gyro-Morph Armillary Sub-Hook */
export interface UseArmillaryOptions extends UseCosmicSceneOptions {
  radius?: number; // default: 100px
  pitch?: Degrees | number;
  yaw?: Degrees | number;
  roll?: Degrees | number;
}

/** Output data contract for Gyro-Morph Armillary Scene */
export interface ArmillarySceneData {
  julianDate: JulianDate;
  scene3D: CosmicScene3D;
  projected2D: ProjectedScene2D;
  earth: { screenPos: Vector2D; vector3D: Vector3D };
  sun: { screenPos: Vector2D; vector3D: Vector3D; eclipticLongitude: Degrees };
  moon: { screenPos: Vector2D; vector3D: Vector3D };
  milestones: MilestoneNode3D[];
  subsolarVector: Vector3D;
  cameraTilt: { pitch: Degrees; yaw: Degrees; roll: Degrees };
}

/**
 * Sub-Hook: useArmillaryScene
 * 
 * Specialized projection hook for the Gyro-Morph Armillary & Astrolabe Subsystem.
 * Maps 3D inertial celestial coordinates through Euler camera rotations and supplies
 * subsolar illumination vectors for <MiniGlobe />.
 */
export function useArmillaryScene(options?: UseArmillaryOptions): ArmillarySceneData {
  const { julianDate, scene3D } = useCosmicScene(options);

  const pitch = options?.pitch ?? 0;
  const yaw = options?.yaw ?? 0;
  const roll = options?.roll ?? 0;
  const radius = options?.radius ?? 100;

  const projected2D = useMemo(() => {
    return projectEulerCamera(scene3D, pitch, yaw, {
      roll,
      scale: radius / 100,
      centerX: 0,
      centerY: 0
    });
  }, [scene3D, pitch, yaw, roll, radius]);

  const sunLambdaDeg = scene3D.sun.eclipticLongitude 
    ?? ((scene3D.earth.heliocentricLongitude + 180) % 360);

  return {
    julianDate,
    scene3D,
    projected2D,
    earth: {
      screenPos: { x: projected2D.elements.earth.x, y: projected2D.elements.earth.y },
      vector3D: scene3D.earth.position
    },
    sun: {
      screenPos: { x: projected2D.elements.sun.x, y: projected2D.elements.sun.y },
      vector3D: scene3D.sun.position,
      eclipticLongitude: asDegrees(sunLambdaDeg)
    },
    moon: {
      screenPos: { x: projected2D.elements.moon.x, y: projected2D.elements.moon.y },
      vector3D: scene3D.moon.position
    },
    milestones: scene3D.milestones,
    subsolarVector: scene3D.earth.subsolarPoint,
    cameraTilt: {
      pitch: asDegrees(typeof pitch === 'number' ? pitch : Number(pitch)),
      yaw: asDegrees(typeof yaw === 'number' ? yaw : Number(yaw)),
      roll: asDegrees(typeof roll === 'number' ? roll : Number(roll))
    }
  };
}
