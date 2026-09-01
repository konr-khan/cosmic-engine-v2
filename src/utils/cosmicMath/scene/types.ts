/**
 * @file types.ts
 * Type definitions and interface contracts for the Unified 3D Astronomical Scene Graph.
 * 
 * Establishes a single geometric source of truth across Macro Orbit, Eclipse Demonstrator,
 * and Gyro-Morph Armillary subsystems.
 */

import { Degrees, Radians, JulianDate, Latitude, Longitude, HoursDecimal } from '../../../types/units';
import { Vector2D, Vector3D, AltAzimuthCoordinates, EquatorialCoordinates, EclipticCoordinates } from '../../../types/coordinates';
import { LunarPhaseName, EclipseType } from '../../../types/astronomy';

/** Scale rendering mode for planetary orbits */
export type ScaleMode = 'true' | 'exaggerated';

/** 3x3 Matrix for 3D coordinate transformations */
export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

/** Keplerian orbital elements parameterizing a 3D conic section */
export interface KeplerianElements3D {
  /** Semi-major axis in AU or display units */
  semiMajorAxis: number;
  /** Orbital eccentricity (e.g. 0.01671 for Earth true scale, 0.25 for exaggerated) */
  eccentricity: number;
  /** Orbital plane inclination relative to reference plane */
  inclination: Radians;
  /** Longitude of the ascending node (Omega) */
  longitudeOfAscendingNode: Radians;
  /** Argument of periapsis (omega) */
  argumentOfPeriapsis: Radians;
  /** True anomaly (nu) */
  trueAnomaly: Radians;
}

/** Physical and orbital state of a celestial body in 3D scene space */
export interface SceneBody3D {
  /** Cartesian 3D position vector in reference frame */
  position: Vector3D;
  /** Physical or display radius */
  radius: number;
  /** Optional velocity vector */
  velocity?: Vector3D;
  /** Optional Keplerian orbital elements */
  orbitalElements?: KeplerianElements3D;
}

/** 3D Analytical Syzygy Shadow Cones for Solar and Lunar Eclipses */
export interface ShadowCones3D {
  /** 3D Cartesian position of the Umbra cone apex */
  umbraApex: Vector3D;
  /** Semi-vertical apex half-angle of the umbral shadow cone */
  umbraAngle: Radians;
  /** 3D Cartesian position of the Penumbra cone apex */
  penumbraApex: Vector3D;
  /** Semi-vertical apex half-angle of the penumbral shadow cone */
  penumbraAngle: Radians;
  /** Unit vector pointing along the shadow axis (from light source to occluder) */
  axisDirection: Vector3D;
  /** 3D Center of the Moon */
  moonCenter: Vector3D;
  /** 3D Center of the Earth */
  earthCenter: Vector3D;
  /** Length of the umbra cone from occluder center to apex in km */
  umbraLength: number;
  /** Alias length of umbra cone in km */
  umbraLengthKm: number;
  /** Length of the penumbra cone from occluder center to apex in km */
  penumbraLength: number;
  /** Alias length of penumbra cone in km */
  penumbraLengthKm: number;
  /** Radius of umbra cone at lunar distance in km */
  umbraRadiusAtMoonKm?: number;
  /** Radius of penumbra cone at lunar distance in km */
  penumbraRadiusAtMoonKm?: number;
  /** Whether lunar center is inside the umbra core */
  isInsideUmbra?: boolean;
  /** Whether lunar center is inside the penumbra envelope */
  isInsidePenumbra?: boolean;
}

/** 6 Key Seasonal Orbital Milestones */
export type SeasonalMilestoneId = 
  | 'perihelion' 
  | 'mar_eq' 
  | 'jun_sol' 
  | 'aphelion' 
  | 'sep_eq' 
  | 'dec_sol'
  | 'mar_equinox'
  | 'jun_solstice'
  | 'sep_equinox'
  | 'dec_solstice';

/** Seasonal Milestone node along Earth's heliocentric orbit */
export interface MilestoneNode3D {
  id: SeasonalMilestoneId | string;
  label: string;
  shortLabel?: string;
  date: string;
  position: Vector3D;
  longitude: Degrees;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  color: string;
  textColor: string;
  fillColor: string;
  description: string;
  textAnchor: 'start' | 'middle' | 'end';
  textDx: number;
  textDy: number;
  subDy: number;
  isSolsticeOrEquinox?: boolean;
}

/** Alias for MilestoneNode3D */
export type SeasonalMilestoneNode = MilestoneNode3D;

/** Earth-specific 3D body properties */
export interface SceneEarth3D extends SceneBody3D {
  /** True astronomical obliquity of the ecliptic in radians */
  obliquity: Radians;
  /** Ecliptic longitude of Earth relative to Sun (lambda_sun + 180 deg) */
  heliocentricLongitude: Degrees;
  /** Normalized unit vector towards the Sun in Earth body frame (subsolar vector) */
  subsolarPoint: Vector3D;
  /** Inertial North Pole unit vector in reference frame */
  axialTiltVector: Vector3D;
  /** Heliocentric distance in AU */
  distanceAU: number;
  /** Heliocentric distance in km */
  distanceKm: number;
  /** Instantaneous orbital speed in km/s */
  orbitalSpeedKms: number;
  /** Solar irradiance percentage relative to mean 1 AU */
  solarIrradiancePercent: number;
  /** Solar apparent diameter in arcminutes */
  sunAngularDiameterArcmin: number;
  /** Geographic coordinates of subsolar point */
  subsolarGeo?: { lat: Latitude; lon: Longitude };
}

/** Moon-specific 3D body properties */
export interface SceneMoon3D extends SceneBody3D {
  /** Geocentric ecliptic longitude lambda [0..360 degrees] */
  eclipticLongitude: Degrees;
  /** Geocentric ecliptic latitude beta [-5.145..+5.145 degrees] */
  eclipticLatitude: Degrees;
  /** Right Ascension alpha in degrees */
  rightAscension: Degrees;
  /** Declination delta in degrees */
  declination: Degrees;
  /** Geocentric distance in kilometers */
  distanceKm: number;
  /** Normalized phase fraction [0..1] (0=New Moon, 0.5=Full Moon) */
  phase: number;
  /** Human-readable phase name */
  phaseName: LunarPhaseName;
  /** Disc illumination fraction k in [0..1] */
  illuminationFraction: number;
  /** Disc illumination fraction alias */
  illuminatedFraction?: number;
  /** Geocentric phase angle i in degrees [0..180] */
  phaseAngleDeg: number;
  /** Ascending node longitude Omega [0..360 degrees] */
  ascendingNodeLongitude: Degrees;
  /** Descending node longitude Omega + 180 [0..360 degrees] */
  descendingNodeLongitude: Degrees;
  /** Argument of latitude F = L' - Omega */
  argumentOfLatitude: Degrees;
  /** Whether the Moon is in the ascending hemisphere (beta >= 0) */
  isAscendingHemisphere: boolean;
  /** Whether the Moon is waxing (elongation <= 180 deg) */
  isWaxing: boolean;
  /** Current lunar orbital quadrant (1: 0°-90°, 2: 90°-180°, 3: 180°-270°, 4: 270°-360°) */
  quadrant: 1 | 2 | 3 | 4;
}

/** 3D Lunar Orbit geometry package */
export interface LunarOrbit3D {
  /** Orbit inclination i = 5.145 deg in radians */
  inclination: Radians;
  /** Ascending Node longitude Omega in degrees */
  nodeLongitude: Degrees;
  /** Descending Node longitude in degrees */
  descendingNodeLongitude: Degrees;
  /** Annual nodal season alignment angle (lambda_sun - Omega) */
  nodeAngleDeg: Degrees;
  /** Ascending node 3D position */
  ascendingNodePosition: Vector3D;
  /** Descending node 3D position */
  descendingNodePosition: Vector3D;
  /** Sampled 3D ring vertices for 4-quadrant rendering */
  samples: Array<{
    position: Vector3D;
    phaseRad: number;
    betaDeg: number;
    isWaxing: boolean;
    isAscending: boolean;
  }>;
}

/** Full Hierarchical 3D Astronomical Scene Graph Model */
export interface CosmicScene3D {
  /** Gregorian UTC timestamp for the snapshot */
  timestamp: Date;
  /** Astronomical Julian Date */
  julianDate: JulianDate;
  /** Active scale mode */
  scaleMode: ScaleMode;
  /** Sun body in 3D scene */
  sun: SceneBody3D & {
    eclipticLongitude?: Degrees;
    rightAscension?: Degrees;
    declination?: Degrees;
  };
  /** Earth body with axial orientation and subsolar vector */
  earth: SceneEarth3D;
  /** Moon body with 5.14 deg inclined orbit and nodal regression */
  moon: SceneMoon3D;
  /** 6 Seasonal milestone halo nodes */
  milestones: MilestoneNode3D[];
  /** 3D Lunar orbit geometry */
  lunarOrbit?: LunarOrbit3D;
  /** Umbra and Penumbra shadow geometry */
  shadowCones: ShadowCones3D;
  /** Keplerian orbital foci and ellipse geometry */
  foci?: {
    f1: Vector3D;
    f2: Vector3D;
    semiMajorAxis: number;
    semiMinorAxis: number;
    eccentricity: number;
    linearEccentricity: number;
  };
  /** Syzygy eclipse classification details */
  eclipse?: {
    type: EclipseType;
    label: string;
    isEclipseActive: boolean;
    obscuration: number;
    alignmentPercent: number;
  };
}

/** 2D Projected Body with screen coordinates, radius, and depth */
export interface ProjectedBody2D {
  x: number;
  y: number;
  r: number;
  visible: boolean;
  depth: number;
}

/** 2D Projected Earth with 2D axial tilt orientation */
export interface ProjectedEarth2D extends ProjectedBody2D {
  /** Projected axial tilt angle in screen degrees */
  axialTiltAngle2D: number;
}

/** 2D Projected Milestone Node */
export interface ProjectedMilestone2D {
  id: string;
  label: string;
  x: number;
  y: number;
  visible: boolean;
  date?: string;
  color?: string;
  fillColor?: string;
  textColor?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  textDx?: number;
  textDy?: number;
  subDy?: number;
}

/** Segmented lunar orbital path stroke for 4-quadrant depth and node coloring */
export interface LunarOrbitSegment2D {
  path: string;
  stroke: string;
  strokeDasharray?: string;
  isFront: boolean;
  isAscending?: boolean;
}

/** 2D Projected Shadow Cones */
export interface ProjectedShadowCones2D {
  umbraPath: string;
  penumbraPath: string;
  axisLine: { x1: number; y1: number; x2: number; y2: number };
}

/** Canonical Camera Rig Identifiers */
export type CameraRigName = 'topdown' | 'transverse' | 'axial' | 'euler3d' | 'custom';

/** Camera Viewport configuration */
export interface CameraViewport {
  width: number;
  height: number;
  scale: number;
  centerX: number;
  centerY: number;
}

/** Unified 2D Projected Scene Output */
export interface ProjectedScene2D {
  camera: {
    name: CameraRigName;
    viewport: CameraViewport;
    pitch?: Degrees;
    yaw?: Degrees;
    roll?: Degrees;
  };
  elements: {
    sun: ProjectedBody2D;
    earth: ProjectedEarth2D;
    moon: ProjectedBody2D;
    orbitPath: string;
    lunarOrbitPath?: string;
    lunarOrbitSegments?: LunarOrbitSegment2D[];
    shadowCones?: ProjectedShadowCones2D;
    milestones: ProjectedMilestone2D[];
    focus2?: { x: number; y: number; visible: boolean };
    nodeMarkers?: {
      asc: { x: number; y: number; label: string };
      desc: { x: number; y: number; label: string };
    };
  };
}

/** Generator parameters for scene construction */
export interface GenerateCosmicSceneParams {
  date?: Date;
  julianDate?: JulianDate | number | Date;
  scaleMode?: ScaleMode;
  latitude?: Latitude | number;
  longitude?: Longitude | number;
  observerLat?: Latitude;
  observerLon?: Longitude;
  timeOfDay?: HoursDecimal | number;
  r0?: number;
}
