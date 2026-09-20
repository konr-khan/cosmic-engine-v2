/**
 * @file generator.ts
 * Master orchestrator and facade for the dynamic Gyro-Morph Armillary Model data structure.
 * Synthesizes 3D celestial geometry, continuous projection morphing, depth-sorted ring paths,
 * astrolabe plate features, and celestial beads at 60 FPS.
 */

import { Degrees, Latitude, Longitude, HoursDecimal, JulianDate, asDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { clamp, slerp3D, calculateGMST, calculateLST } from '../core';
import { calculateEarthOrbitalPhysics } from '../solar';
import {
  J2000_JD,
  JULIAN_CENTURY_DAYS,
  ASTRONOMICAL_UNIT_KM,
  EARTH_ORBITAL_SPEED_MEAN_KMS,
  SUN_ANGULAR_DIAMETER_1AU_ARCMIN,
  EARTH_AXIAL_OBLIQUITY_J2000_DEG
} from '../astroConstants';
import { 
  ArmillaryProjectionMode,
  ArmillaryOrbitalPhysics,
  ArmillaryRingVertex,
  ArmillaryModelOutput
} from './types';
import { createEulerCameraRotator } from './coordinates';
import { createContinuousProjectionResolver } from './projections';
import { 
  generateContinuousAlmucantars,
  calculatePlanetaryHour, 
  calculateReteAngleToLST 
} from './astrolabe';
import { generateProjectionFocalBeacon } from './focalBeacon';
import { computeRawModeGeometry } from './generatorGeometry';
import { 
  computeArmillaryStars, 
  computeArmillaryMilestones, 
  computeArmillaryLunarNodes, 
  computeArmillaryObserverCone, 
  computeArmillaryBodies 
} from './generatorBeads';
import { generateArmillaryRings } from './generatorRings';

export * from './generatorGeometry';
export * from './generatorBeads';
export * from './generatorRings';


/**
 * Generates the complete dynamic Gyro-Morph Armillary Model data structure at 60 FPS.
 * Streamlined to a 5-mode continuum:
 * 1. heliocentric (☉ Copernican Keplerian Orbit)
 * 2. geocentric (⊕ Geocentric Apparent Motion & 3D Celestial Armillary Sphere)
 * 3. stereographic (🧭 Stereographic Conformal Astrolabe Rete & Tympan)
 * 4. rojas (📐 Universal Rojas Orthographic on Solstitial Colure)
 * 5. horizon (🔭 Topocentric Horizon Stereonet)
 */
export function generateArmillaryModel(params: {
  julianDate: JulianDate | number;
  latitude: Latitude;
  longitude: Longitude;
  timeOfDay: HoursDecimal;
  sunRaDeg: Degrees | number;
  sunDecDeg: Degrees | number;
  sunLambdaDeg: Degrees | number;
  moonRaDeg: Degrees | number;
  moonDecDeg: Degrees | number;
  moonLambdaDeg: Degrees | number;
  moonPhase: number;
  moonNodeLonDeg?: number;
  morphLambda: number; // 0.0 (3D Sphere) to 1.0 (2D Astrolabe Plate)
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode?: ArmillaryProjectionMode;
  projectionTransitionT?: number; // 0.0 (fromMode) to 1.0 (targetMode)
  cameraPitch: number;
  cameraYaw: number;
  r0?: number;
  dayOfWeek?: number;
  sunrise?: HoursDecimal;
  sunset?: HoursDecimal;
  isFreeReteMode?: boolean;
  freeReteOffsetDeg?: number;
  exaggerateEccentricity?: boolean;
}): ArmillaryModelOutput {
  const {
    julianDate,
    latitude,
    longitude,
    timeOfDay,
    sunRaDeg,
    sunDecDeg,
    sunLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    moonLambdaDeg,
    moonPhase,
    moonNodeLonDeg,
    morphLambda,
    projectionMode,
    fromProjectionMode,
    projectionTransitionT = 1.0,
    cameraPitch,
    cameraYaw,
    r0 = 100,
    dayOfWeek = 0,
    sunrise = 6,
    sunset = 18,
    isFreeReteMode = false,
    freeReteOffsetDeg = 0,
    exaggerateEccentricity = false
  } = params;

  const lambdaClamp = clamp(morphLambda, 0, 1);
  const transT = clamp(projectionTransitionT, 0, 1);
  const obliquity = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
  const T = (julianDate - J2000_JD) / JULIAN_CENTURY_DAYS;
  const defaultNodeLon = ((125.04452 - 1934.136261 * T) % 360 + 360) % 360;
  const nodeLonDeg = moonNodeLonDeg ?? defaultNodeLon;
  const baseLstDeg = calculateLST(julianDate, longitude);
  const lstDeg = isFreeReteMode 
    ? asDegrees(((baseLstDeg + freeReteOffsetDeg) % 360 + 360) % 360)
    : baseLstDeg;
  const gmstDeg = calculateGMST(julianDate);

  const { apparentSolarHours } = calculateReteAngleToLST(lstDeg, sunRaDeg);
  const focalBeacon = generateProjectionFocalBeacon(projectionMode, r0, cameraPitch, cameraYaw, lambdaClamp);
  const reteOffset = isFreeReteMode ? freeReteOffsetDeg : 0;

  // Calculate live Keplerian orbital physics
  const physicsSolar = calculateEarthOrbitalPhysics(julianDate);
  const physics: ArmillaryOrbitalPhysics = {
    distanceAU: physicsSolar.distanceAU ?? 1.0,
    distanceKm: physicsSolar.distanceKm ?? ASTRONOMICAL_UNIT_KM,
    orbitalSpeedKms: physicsSolar.orbitalSpeedKms ?? EARTH_ORBITAL_SPEED_MEAN_KMS,
    solarIrradiancePercent: physicsSolar.solarIrradiancePercent ?? 100.0,
    sunAngularDiameterArcmin: physicsSolar.sunAngularDiameterArcmin ?? SUN_ANGULAR_DIAMETER_1AU_ARCMIN
  };

  const rotateCamera = createEulerCameraRotator(cameraPitch, cameraYaw, 0);
  const project2D = createContinuousProjectionResolver(
    fromProjectionMode,
    projectionMode,
    transT,
    r0,
    latitude,
    lstDeg
  );

  const is3DTarget = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
  const isSource2D = fromProjectionMode === 'stereographic' || fromProjectionMode === 'rojas' || fromProjectionMode === 'horizon';
  const isReverse3DTransition = is3DTarget && isSource2D && lambdaClamp > 0.001;

  // Staged geometry flattening progress:
  // - In 2D target mode: flattens over lambda in [0.45 -> 1.0]
  // - In reverse transition (2D -> 3D): un-flattens back into 3D over lambda in [1.0 -> 0.45]
  // - In static 3D mode (lambda = 0): geomLambda = 0
  const geomLambda = (is3DTarget && !isReverse3DTransition) 
    ? 0 
    : clamp((lambdaClamp - 0.45) / 0.55, 0, 1);
  const oneMinusGeom = 1 - geomLambda;
  const isFrontFixed = geomLambda >= 0.85;

  // Helper to project a single 3D vector with staged morphing
  const transformVertex = (p3d: Vector3D): ArmillaryRingVertex => {
    const pCam = rotateCamera(p3d.x, p3d.y, p3d.z);
    const pProj = project2D(p3d);

    const screenX = oneMinusGeom * pCam.x + geomLambda * pProj.x;
    const screenY = oneMinusGeom * (-pCam.y) + geomLambda * (-pProj.y);
    const isFront = isFrontFixed ? true : pCam.z >= 0;

    return {
      p3d,
      pCam,
      pProj,
      screenPos: { x: screenX, y: screenY },
      isFront
    };
  };

  // Compute raw 3D body geometry across modes
  const geomParams = {
    r0,
    obliquity,
    sunLambdaDeg,
    moonLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    exaggerateEccentricity,
    reteOffset,
    lambdaClamp
  };

  const targetGeom = computeRawModeGeometry(projectionMode, geomParams);
  const sourceGeom = fromProjectionMode && fromProjectionMode !== projectionMode && transT < 1.0
    ? computeRawModeGeometry(fromProjectionMode, geomParams)
    : targetGeom;

  // Spherical SLERP blending across modes (preserving radius and geodesic trajectory)
  const blendedSun3D: Vector3D = slerp3D(sourceGeom.sun3D, targetGeom.sun3D, transT);
  const blendedEarth3D: Vector3D = slerp3D(sourceGeom.earth3D, targetGeom.earth3D, transT);
  const blendedMoon3D: Vector3D = slerp3D(sourceGeom.moon3D, targetGeom.moon3D, transT);

  const celestialRingsOpacity = (1 - transT) * sourceGeom.celestialRingsOpacity + transT * targetGeom.celestialRingsOpacity;
  const orbitRingOpacity = (1 - transT) * sourceGeom.orbitRingOpacity + transT * targetGeom.orbitRingOpacity;
  const lunarOrbitOpacity = (1 - transT) * sourceGeom.lunarOrbitOpacity + transT * targetGeom.lunarOrbitOpacity;
  const milestonesOpacity = (1 - transT) * sourceGeom.milestonesOpacity + transT * targetGeom.milestonesOpacity;
  const starsOpacity = (1 - transT) * sourceGeom.starsOpacity + transT * targetGeom.starsOpacity;
  const bezelOpacity = (1 - transT) * sourceGeom.bezelOpacity + transT * targetGeom.bezelOpacity;
  const alidadeOpacity = (1 - transT) * sourceGeom.alidadeOpacity + transT * targetGeom.alidadeOpacity;

  // Generate celestial rings
  const rings = generateArmillaryRings({
    r0,
    obliquity,
    latitude,
    reteOffset,
    exaggerateEccentricity,
    projectionMode,
    fromProjectionMode,
    transT,
    blendedEarth3D,
    nodeLonDeg,
    transformVertex
  });

  // Navigational stars reside on the outer celestial sphere at radius r0 centered at the origin
  const rBloom = r0;
  const cBloom: Vector3D = { x: 0, y: 0, z: 0 };

  // Navigational Stars
  const stars = computeArmillaryStars({
    rBloom,
    reteOffset,
    cBloom,
    latitude,
    lstDeg,
    transformVertex
  });

  // Milestone Nodes
  const milestones = computeArmillaryMilestones({
    sourceMilestones3D: sourceGeom.milestones3D,
    targetMilestones3D: targetGeom.milestones3D,
    transT,
    transformVertex
  });

  // Lunar Nodes
  const isHelioMode = projectionMode === 'heliocentric';
  const isGeoApparent = projectionMode === 'geocentric';
  const lunarNodes = computeArmillaryLunarNodes({
    isHelioMode,
    isGeoApparent,
    blendedEarth3D,
    nodeLonDeg,
    obliquity,
    transformVertex
  });

  // Observer FOV Sky Cone
  const observerCone = computeArmillaryObserverCone({
    orbitRingOpacity,
    latitude,
    longitude,
    timeOfDay,
    gmstDeg,
    obliquity,
    blendedEarth3D,
    blendedSun3D,
    transformVertex
  });

  // Earth, Sun (clamped), and Moon beads
  const bodies = computeArmillaryBodies({
    blendedEarth3D,
    blendedSun3D,
    blendedMoon3D,
    sunRaDeg,
    sunDecDeg,
    sunLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    moonLambdaDeg,
    moonPhase,
    latitude,
    lstDeg,
    transformVertex
  });

  // Almucantars and Planetary Hours
  const almucantars = generateContinuousAlmucantars(latitude, projectionMode, fromProjectionMode, transT, 15, r0);
  const planetaryHour = calculatePlanetaryHour(timeOfDay, sunrise, sunset, dayOfWeek);

  return {
    rings,
    almucantars,
    unequalHours: [],
    milestones,
    physics,
    earth: bodies.earth,
    stars,
    sun: bodies.sun,
    moon: bodies.moon,
    siderealTimeDeg: gmstDeg,
    localSiderealTimeDeg: lstDeg,
    apparentSolarHours,
    isFreeRete: isFreeReteMode,
    focalBeacon,
    observerCone,
    lunarNodes,
    planetaryHour,
    celestialRingsOpacity,
    orbitRingOpacity,
    lunarOrbitOpacity,
    milestonesOpacity,
    starsOpacity,
    bezelOpacity,
    alidadeOpacity
  };
}
