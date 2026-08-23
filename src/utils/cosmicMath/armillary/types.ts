import { Degrees, Latitude, Longitude, HoursDecimal, JulianDate } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';

export type { Vector2D, Vector3D };

export type ArmillaryModelMode = 'heliocentric' | 'geocentric' | 'stereographic' | 'rojas' | 'horizon';
export type ArmillaryProjectionMode = ArmillaryModelMode;

export interface ArmillaryMilestoneNode {
  id: string;
  label: string;
  date: string;
  color: string;
  textColor: string;
  fillColor: string;
  p3d: Vector3D;
  pCam: Vector3D;
  screenPos: Vector2D;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  description: string;
  isFront: boolean;
}

export interface ArmillaryOrbitalPhysics {
  distanceAU: number;
  distanceKm: number;
  orbitalSpeedKms: number;
  solarIrradiancePercent: number;
  sunAngularDiameterArcmin: number;
}

export interface ArmillaryStarData {
  id: string;
  name: string;
  bayer: string;
  constellation: string;
  raDeg: Degrees;
  decDeg: Degrees;
  magnitude: number;
  p3d: Vector3D;
}

export interface ZodiacSignSegment {
  name: string;
  symbol: string;
  startLambda: number;
  endLambda: number;
  color: string;
}

export interface AlmucantarCircleData {
  altitude: Degrees;
  centerY: number;
  radius: number;
  isHorizon: boolean;
}

export interface UnequalHourArcData {
  hourIndex: number;
  label: string;
  points2D: Vector2D[];
}

export interface ArmillaryRingVertex {
  p3d: Vector3D;
  pCam: Vector3D;
  pProj: Vector2D;
  screenPos: Vector2D;
  isFront: boolean;
}

export interface ArmillaryRingPath {
  id: string;
  label: string;
  color: string;
  frontStrokeWidth: number;
  backStrokeWidth: number;
  vertices: ArmillaryRingVertex[];
  frontPathD: string;
  backPathD: string;
  fullPathD: string;
}

export interface ArmillaryObserverCone {
  observerScreenPos: Vector2D;
  zenithScreenPos: Vector2D;
  horizonDiscPathD: string;
  conePathD: string;
  zenithRay: { start: Vector2D; end: Vector2D };
  isDaytime: boolean;
  sunElevationDeg: number;
  label: string;
}

export interface ArmillaryLunarNodes {
  ascendingNode: {
    screenPos: Vector2D;
    isFront: boolean;
    lonDeg: number;
  };
  descendingNode: {
    screenPos: Vector2D;
    isFront: boolean;
    lonDeg: number;
  };
}

export interface LaserRay {
  start: Vector2D;
  end: Vector2D;
  color: string;
  opacity: number;
}

export interface ProjectionFocalBeaconOutput {
  focal3D: Vector3D;
  focalScreenPos: Vector2D;
  focalZCam: number;
  laserRays: LaserRay[];
  conePathD: string;
}

export interface AlidadeSightingInfo {
  ruleAngleDeg: number;
  rightAscensionDeg: number;
  rightAscensionHours: number;
  localAltitudeDeg: number;
  localAzimuthDeg: number;
  nearestTarget?: {
    name: string;
    type: 'star' | 'sun' | 'moon';
    angularDiffDeg: number;
    magnitude?: number;
  };
}

export interface ArmillaryModelOutput {
  rings: ArmillaryRingPath[];
  almucantars: AlmucantarCircleData[];
  unequalHours: UnequalHourArcData[];
  milestones: ArmillaryMilestoneNode[];
  physics?: ArmillaryOrbitalPhysics;
  earth: {
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
  };
  stars: (ArmillaryStarData & {
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  })[];
  sun: {
    raDeg: Degrees;
    decDeg: Degrees;
    lambdaDeg: Degrees;
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  };
  moon: {
    raDeg: Degrees;
    decDeg: Degrees;
    lambdaDeg: Degrees;
    phase: number;
    p3d: Vector3D;
    pCam: Vector3D;
    pProj: Vector2D;
    screenPos: Vector2D;
    isFront: boolean;
    altDeg: number;
    azDeg: number;
  };
  siderealTimeDeg: Degrees;
  localSiderealTimeDeg: Degrees;
  apparentSolarHours?: number;
  isFreeRete?: boolean;
  focalBeacon?: ProjectionFocalBeaconOutput;
  observerCone?: ArmillaryObserverCone;
  lunarNodes?: ArmillaryLunarNodes;
  planetaryHour: {
    hourNumber: number;
    isDay: boolean;
    rulingPlanet: string;
    label: string;
    progressPercent: number;
  };
  celestialRingsOpacity: number;
  orbitRingOpacity: number;
  lunarOrbitOpacity: number;
  milestonesOpacity: number;
  starsOpacity: number;
  bezelOpacity: number;
  alidadeOpacity: number;
}
