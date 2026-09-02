import { Degrees, Latitude, Longitude, HoursDecimal, JulianDate, asDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { toRadians, clamp, slerp3D } from '../core';
import { calculateEarthOrbitalPhysics } from '../solar';
import { 
  ArmillaryProjectionMode,
  ArmillaryOrbitalPhysics,
  ArmillaryRingVertex,
  ArmillaryRingPath,
  ArmillaryModelOutput
} from './types';
import { 
  calculateGMST, 
  calculateLST, 
  equatorialToCartesian3D, 
  horizontalToCartesian3D,
  rotateEuler3D,
  createEulerCameraRotator 
} from './coordinates';
import { computeContinuousProjection2D, createContinuousProjectionResolver } from './projections';
import { 
  generateContinuousAlmucantars,
  calculatePlanetaryHour, 
  calculateReteAngleToLST 
} from './astrolabe';
import { generateProjectionFocalBeacon } from './focalBeacon';
import { generateParametricRing3D } from './paths';
import { computeRawModeGeometry } from './generatorGeometry';
import { 
  computeArmillaryStars, 
  computeArmillaryMilestones, 
  computeArmillaryLunarNodes, 
  computeArmillaryObserverCone, 
  computeArmillaryBodies 
} from './generatorBeads';

export * from './generatorGeometry';
export * from './generatorBeads';

/**
 * Builds the 8 depth-sorted celestial and orbital ring paths for the armillary sphere.
 */
function generateArmillaryRings(params: {
  r0: number;
  obliquity: number;
  latitude: Latitude;
  reteOffset: number;
  exaggerateEccentricity: boolean;
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode?: ArmillaryProjectionMode;
  transT: number;
  blendedEarth3D: Vector3D;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryRingPath[] {
  const {
    r0,
    obliquity,
    latitude,
    reteOffset,
    exaggerateEccentricity,
    projectionMode,
    fromProjectionMode,
    transT,
    blendedEarth3D,
    transformVertex
  } = params;

  const rings: ArmillaryRingPath[] = [];
  const NUM_SAMPLES = 72;

  // 0. Orbital Path Ring (Keplerian / Ecliptic orbit with rigid plane tilt)
  const isTargetHelio = projectionMode === 'heliocentric';
  const isSourceHelio = fromProjectionMode === 'heliocentric';
  const isHelioT = (1 - transT) * (isSourceHelio ? 1 : 0) + transT * (isTargetHelio ? 1 : 0);
  const aOrb = r0 * 1.1;
  const eOrb = exaggerateEccentricity ? 0.25 : 0.01671;
  const bOrb = aOrb * Math.sqrt(1 - eOrb * eOrb);
  const cOrb = aOrb * eOrb;
  const tiltRad = toRadians((1 - isHelioT) * obliquity);

  rings.push(
    generateParametricRing3D(
      {
        id: 'orbit_path',
        label: 'Orbital Path',
        color: '#38bdf8', // Sky Blue
        frontStrokeWidth: 1.6,
        backStrokeWidth: 0.8,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const angleRad = t * 2 * Math.PI;
          const xOrb = aOrb * Math.cos(angleRad) + (exaggerateEccentricity ? -cOrb * 0.5 * isHelioT : 0);
          const zOrb = (isHelioT * bOrb + (1 - isHelioT) * aOrb) * Math.sin(angleRad);
          return {
            x: xOrb,
            y: zOrb * Math.sin(tiltRad),
            z: zOrb * Math.cos(tiltRad)
          };
        }
      },
      transformVertex
    )
  );

  // 1. Lunar Orbit Ring (5.14° Inclined around Earth)
  const isHelioMode = projectionMode === 'heliocentric';
  const lunarOrbitRadius = isHelioMode ? 16 : 26;
  const incRad = toRadians(5.14);
  const epsRad = toRadians(obliquity);

  rings.push(
    generateParametricRing3D(
      {
        id: 'lunar_orbit',
        label: 'Lunar Orbit (5.14° Inclined)',
        color: '#cbd5e1', // Silver/Slate
        frontStrokeWidth: 1.2,
        backStrokeWidth: 0.6,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const angleRad = t * 2 * Math.PI;
          const xRel = lunarOrbitRadius * Math.cos(angleRad);
          const yRel = lunarOrbitRadius * Math.sin(angleRad) * Math.sin(incRad);
          const zRel = lunarOrbitRadius * Math.sin(angleRad) * Math.cos(incRad);
          return isHelioMode
            ? { x: blendedEarth3D.x + xRel, y: blendedEarth3D.y + yRel, z: blendedEarth3D.z + zRel }
            : {
                x: blendedEarth3D.x + xRel,
                y: blendedEarth3D.y + yRel * Math.cos(epsRad) - zRel * Math.sin(epsRad),
                z: blendedEarth3D.z + yRel * Math.sin(epsRad) + zRel * Math.cos(epsRad)
              };
        }
      },
      transformVertex
    )
  );

  // Blooming parameters for celestial sphere rings (expand from Earth globe r=14px to R0=100px)
  const tGeo = 1.0 - isHelioT;
  const rGlobe = 14;
  const rBloom = (1.0 - tGeo) * rGlobe + tGeo * r0;
  const cBloom: Vector3D = {
    x: (1.0 - tGeo) * blendedEarth3D.x,
    y: (1.0 - tGeo) * blendedEarth3D.y,
    z: (1.0 - tGeo) * blendedEarth3D.z
  };

  // 2. Celestial Equator Ring (Dec = 0°)
  rings.push(
    generateParametricRing3D(
      {
        id: 'equator',
        label: 'Celestial Equator',
        color: '#10b981', // Emerald
        frontStrokeWidth: 2.0,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const p = equatorialToCartesian3D(t * 360, 0, rBloom);
          return { x: cBloom.x + p.x, y: cBloom.y + p.y, z: cBloom.z + p.z };
        }
      },
      transformVertex
    )
  );

  // 3. Ecliptic Rete Ring (Inclined at 23.44°, Rotates with LST or Free Rete Offset)
  rings.push(
    generateParametricRing3D(
      {
        id: 'ecliptic',
        label: 'Ecliptic (Zodiac Rete)',
        color: '#f59e0b', // Amber/Gold
        frontStrokeWidth: 2.2,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const lRad = toRadians(t * 360);
          const xBase = rBloom * Math.cos(lRad);
          const yBase = rBloom * Math.sin(lRad) * Math.sin(epsRad);
          const zBase = rBloom * Math.sin(lRad) * Math.cos(epsRad);
          const p = rotateEuler3D({ x: xBase, y: yBase, z: zBase }, 0, reteOffset, 0);
          return { x: cBloom.x + p.x, y: cBloom.y + p.y, z: cBloom.z + p.z };
        }
      },
      transformVertex
    )
  );

  // 4. Tropic of Cancer (Dec = +23.44° - Muted Antique Brass)
  rings.push(
    generateParametricRing3D(
      {
        id: 'tropic_cancer',
        label: 'Tropic of Cancer (+23.44°)',
        color: '#d97706', // Muted Antique Brass / Amber
        frontStrokeWidth: 0.9,
        backStrokeWidth: 0.5,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const p = equatorialToCartesian3D(t * 360, obliquity, rBloom);
          return { x: cBloom.x + p.x, y: cBloom.y + p.y, z: cBloom.z + p.z };
        }
      },
      transformVertex
    )
  );

  // 5. Tropic of Capricorn (Dec = -23.44° - Muted Slate/Silver)
  rings.push(
    generateParametricRing3D(
      {
        id: 'tropic_capricorn',
        label: 'Tropic of Capricorn (-23.44°)',
        color: '#94a3b8', // Muted Slate
        frontStrokeWidth: 0.9,
        backStrokeWidth: 0.5,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const p = equatorialToCartesian3D(t * 360, -obliquity, rBloom);
          return { x: cBloom.x + p.x, y: cBloom.y + p.y, z: cBloom.z + p.z };
        }
      },
      transformVertex
    )
  );

  // 6. Local Horizon Ring (Alt = 0°)
  rings.push(
    generateParametricRing3D(
      {
        id: 'horizon',
        label: 'Local Horizon',
        color: '#06b6d4', // Cyan
        frontStrokeWidth: 2.0,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const p3dHoriz = horizontalToCartesian3D(0, t * 360, rBloom);
          const p = rotateEuler3D(p3dHoriz, -(90 - latitude), 0, 0);
          return { x: cBloom.x + p.x, y: cBloom.y + p.y, z: cBloom.z + p.z };
        }
      },
      transformVertex
    )
  );

  // 7. Solstitial Colure Ring (RA = 90° and 270° plane, x = 0)
  rings.push(
    generateParametricRing3D(
      {
        id: 'colure',
        label: 'Solstitial Colure',
        color: '#64748b', // Slate
        frontStrokeWidth: 1.2,
        backStrokeWidth: 0.8,
        sampleCount: NUM_SAMPLES,
        samplePoint: (t) => {
          const theta = t * 2 * Math.PI;
          return {
            x: cBloom.x,
            y: cBloom.y + rBloom * Math.sin(theta),
            z: cBloom.z + rBloom * Math.cos(theta)
          };
        }
      },
      transformVertex
    )
  );

  return rings;
}

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
  const obliquity = 23.439;
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
    distanceKm: physicsSolar.distanceKm ?? 149597870,
    orbitalSpeedKms: physicsSolar.orbitalSpeedKms ?? 29.78,
    solarIrradiancePercent: physicsSolar.solarIrradiancePercent ?? 100.0,
    sunAngularDiameterArcmin: physicsSolar.sunAngularDiameterArcmin ?? 32.0
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
    transformVertex
  });

  // Blooming center and radius for star sphere
  const isTargetHelio = projectionMode === 'heliocentric';
  const isSourceHelio = fromProjectionMode === 'heliocentric';
  const isHelioT = (1 - transT) * (isSourceHelio ? 1 : 0) + transT * (isTargetHelio ? 1 : 0);
  const tGeo = 1.0 - isHelioT;
  const rGlobe = 14;
  const rBloom = (1.0 - tGeo) * rGlobe + tGeo * r0;
  const cBloom: Vector3D = {
    x: (1.0 - tGeo) * blendedEarth3D.x,
    y: (1.0 - tGeo) * blendedEarth3D.y,
    z: (1.0 - tGeo) * blendedEarth3D.z
  };

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
  const lunarNodes = computeArmillaryLunarNodes({
    isHelioMode,
    blendedEarth3D,
    transformVertex
  });

  // Observer FOV Sky Cone
  const observerCone = computeArmillaryObserverCone({
    orbitRingOpacity,
    latitude,
    longitude,
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
