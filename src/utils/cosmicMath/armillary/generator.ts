import { Degrees, Latitude, Longitude, HoursDecimal, JulianDate, asDegrees } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp, slerp3D } from '../core';
import { calculateEarthOrbitalPhysics } from '../solar';
import { 
  ArmillaryModelMode,
  ArmillaryProjectionMode,
  ArmillaryMilestoneNode,
  ArmillaryOrbitalPhysics,
  ArmillaryRingVertex,
  ArmillaryRingPath,
  ArmillaryObserverCone,
  ArmillaryLunarNodes,
  ArmillaryModelOutput
} from './types';
import { ARMILLARY_MILESTONES_DATA, ASTROLABE_STARS } from './constants';
import { 
  calculateGMST, 
  calculateLST, 
  equatorialToCartesian3D, 
  horizontalToCartesian3D,
  equatorialToHorizontal, 
  rotateEuler3D 
} from './coordinates';
import { computeProjection2D, computeContinuousProjection2D } from './projections';
import { 
  generateContinuousAlmucantars,
  calculatePlanetaryHour, 
  calculateReteAngleToLST 
} from './astrolabe';
import { generateProjectionFocalBeacon } from './focalBeacon';
import { buildSegmentedSvgPaths, generateParametricRing3D } from './paths';

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

  // Helper to project a single 3D vector with staged morphing
  const transformVertex = (p3d: Vector3D): ArmillaryRingVertex => {
    // 1. 3D Camera view
    const pCam = rotateEuler3D(p3d, cameraPitch, cameraYaw, 0);

    // 2. 2D Continuous Target Projection (circle-preserving across historical plates)
    const pProj = computeContinuousProjection2D(
      p3d,
      fromProjectionMode,
      projectionMode,
      transT,
      r0,
      latitude,
      lstDeg
    );

    // 3. Continuous Staged Morph Blend (3D vs 2D)
    // Phase A (lambda in [0.0, 0.45]): 3D geometry remains 100% spherical (geomLambda = 0) while camera aligns.
    // Phase B (lambda in [0.45, 1.0]): Unwraps 2D planar geometry with locked canonical camera pole.
    const is3DTarget = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
    const geomLambda = is3DTarget ? 0 : clamp((lambdaClamp - 0.45) / 0.55, 0, 1);

    const screenX = (1 - geomLambda) * pCam.x + geomLambda * pProj.x;
    const screenY = (1 - geomLambda) * (-pCam.y) + geomLambda * (-pProj.y);
    const isFront = geomLambda >= 0.85 ? true : pCam.z >= 0;

    return {
      p3d,
      pCam,
      pProj,
      screenPos: { x: screenX, y: screenY },
      isFront
    };
  };

  // -------------------------------------------------------------
  // Universal Multi-Model Geometry Derivations (5-Mode Continuum)
  // -------------------------------------------------------------
  interface RawModeGeometry {
    sun3D: Vector3D;
    earth3D: Vector3D;
    moon3D: Vector3D;
    milestones3D: Array<{ id: string; p3d: Vector3D }>;
    celestialRingsOpacity: number;
    orbitRingOpacity: number;
    lunarOrbitOpacity: number;
    milestonesOpacity: number;
    starsOpacity: number;
    bezelOpacity: number;
    alidadeOpacity: number;
  }

  const getRawModeGeometry = (mode: ArmillaryModelMode): RawModeGeometry => {
    const isHelio = mode === 'heliocentric';
    const isGeo = mode === 'geocentric';

    if (isHelio) {
      const a = r0 * 1.1;
      const e = exaggerateEccentricity ? 0.25 : 0.01671;
      const b = a * Math.sqrt(1 - e * e);
      const c = a * e;
      const sun3D = exaggerateEccentricity ? { x: -c, y: 0, z: 0 } : { x: 0, y: 0, z: 0 };

      // Earth's heliocentric longitude: lambda_earth = sunLambdaDeg + 180°
      const earthLonRad = toRadians((sunLambdaDeg + 180) % 360);
      const earth3D: Vector3D = {
        x: a * Math.cos(earthLonRad),
        y: 0,
        z: b * Math.sin(earthLonRad)
      };

      // Moon relative to Earth
      const moonAngleRad = toRadians(moonLambdaDeg);
      const moon3D: Vector3D = {
        x: earth3D.x + 16 * Math.cos(moonAngleRad),
        y: earth3D.y + 16 * Math.sin(toRadians(5.14)) * Math.sin(moonAngleRad),
        z: earth3D.z + 16 * Math.sin(moonAngleRad)
      };

      // Heliocentric milestones along Earth's orbit
      const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
        const lonRad = toRadians(m.helioEclipticLon);
        return {
          id: m.id,
          p3d: {
            x: a * Math.cos(lonRad),
            y: 0,
            z: b * Math.sin(lonRad)
          }
        };
      });

      return {
        sun3D,
        earth3D,
        moon3D,
        milestones3D,
        celestialRingsOpacity: 0.0,
        orbitRingOpacity: 1.0,
        lunarOrbitOpacity: 1.0,
        milestonesOpacity: 1.0,
        starsOpacity: 0.25,
        bezelOpacity: 0.0,
        alidadeOpacity: 0.0
      };
    }

    if (isGeo) {
      const earth3D: Vector3D = { x: 0, y: 0, z: 0 };
      const a = r0 * 1.1;
      const sunLonRad = toRadians(sunLambdaDeg);
      const epsRad = toRadians(obliquity);

      // Sun position strictly on Ecliptic track revolving around Earth (r_sun = -r_earth)
      const sun3D: Vector3D = {
        x: a * Math.cos(sunLonRad),
        y: a * Math.sin(sunLonRad) * Math.sin(epsRad),
        z: a * Math.sin(sunLonRad) * Math.cos(epsRad)
      };

      // Geocentric Moon at physical orbit distance (26 px)
      const moon3D = equatorialToCartesian3D(moonRaDeg, moonDecDeg, 26);

      // Milestones along Sun's apparent ecliptic path (helioLon + 180°)
      const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
        const apparentSunLonRad = toRadians((m.helioEclipticLon + 180) % 360);
        return {
          id: m.id,
          p3d: {
            x: a * Math.cos(apparentSunLonRad),
            y: a * Math.sin(apparentSunLonRad) * Math.sin(epsRad),
            z: a * Math.sin(apparentSunLonRad) * Math.cos(epsRad)
          }
        };
      });

      return {
        sun3D,
        earth3D,
        moon3D,
        milestones3D,
        celestialRingsOpacity: 0.85,
        orbitRingOpacity: 1.0,
        lunarOrbitOpacity: 1.0,
        milestonesOpacity: 1.0,
        starsOpacity: 0.8,
        bezelOpacity: 0.0,
        alidadeOpacity: 0.0
      };
    }

    // 2D Astrolabe modes (stereographic, rojas, horizon)
    const earth3D: Vector3D = { x: 0, y: 0, z: 0 };
    const epsRad = toRadians(obliquity);
    const sunLonRad = toRadians(sunLambdaDeg);

    // Mathematical Sun bead clamped strictly to the Ecliptic track:
    // x = r0 * cos(lambda), y = r0 * sin(lambda) * sin(eps), z = r0 * sin(lambda) * cos(eps)
    const sun3DBase: Vector3D = {
      x: r0 * Math.cos(sunLonRad),
      y: r0 * Math.sin(sunLonRad) * Math.sin(epsRad),
      z: r0 * Math.sin(sunLonRad) * Math.cos(epsRad)
    };
    const sun3D = rotateEuler3D(sun3DBase, 0, reteOffset, 0);

    const moon3DBase = equatorialToCartesian3D(moonRaDeg, moonDecDeg, r0);
    const moon3D = rotateEuler3D(moon3DBase, 0, reteOffset, 0);

    const milestones3D = ARMILLARY_MILESTONES_DATA.map((m) => {
      const apparentSunLonRad = toRadians((m.helioEclipticLon + 180) % 360);
      return {
        id: m.id,
        p3d: {
          x: r0 * Math.cos(apparentSunLonRad),
          y: r0 * Math.sin(apparentSunLonRad) * Math.sin(epsRad),
          z: r0 * Math.sin(apparentSunLonRad) * Math.cos(epsRad)
        }
      };
    });

    // Staged plate decorations fade in as lambda increases
    const stagedBezelOpacity = clamp((lambdaClamp - 0.2) / 0.6, 0, 1);
    const stagedAlidadeOpacity = clamp((lambdaClamp - 0.3) / 0.6, 0, 1);

    return {
      sun3D,
      earth3D,
      moon3D,
      milestones3D,
      celestialRingsOpacity: 1.0,
      orbitRingOpacity: 0.0,
      lunarOrbitOpacity: 0.0,
      milestonesOpacity: 0.0,
      starsOpacity: 1.0,
      bezelOpacity: stagedBezelOpacity,
      alidadeOpacity: stagedAlidadeOpacity
    };
  };

  const targetGeom = getRawModeGeometry(projectionMode);
  const sourceGeom = fromProjectionMode && fromProjectionMode !== projectionMode && transT < 1.0
    ? getRawModeGeometry(fromProjectionMode)
    : targetGeom;

  // Blend celestial bodies smoothly across states using spherical SLERP (preserving radius and geodesic trajectory)
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

  // -------------------------------------------------------------
  // Celestial & Orbital Ring Paths (Unified Parametric Pipeline)
  // -------------------------------------------------------------
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

  // 8. Celestial Navigational Stars (Rotates with Rete)
  const stars = ASTROLABE_STARS.map((s) => {
    const p3dBase = equatorialToCartesian3D(s.raDeg, s.decDeg, rBloom);
    const p3dRotated = rotateEuler3D(p3dBase, 0, reteOffset, 0);
    const p3dOffset: Vector3D = {
      x: cBloom.x + p3dRotated.x,
      y: cBloom.y + p3dRotated.y,
      z: cBloom.z + p3dRotated.z
    };
    const v = transformVertex(p3dOffset);
    const horiz = equatorialToHorizontal(s.raDeg, s.decDeg, latitude, lstDeg);
    return {
      ...s,
      p3d: p3dOffset,
      pCam: v.pCam,
      pProj: v.pProj,
      screenPos: v.screenPos,
      isFront: v.isFront,
      altDeg: horiz.altDeg,
      azDeg: horiz.azDeg
    };
  });

  // 9. Milestone Nodes
  const milestones: ArmillaryMilestoneNode[] = ARMILLARY_MILESTONES_DATA.map((m, idx) => {
    const targetM3D = targetGeom.milestones3D[idx]?.p3d || { x: 0, y: 0, z: 0 };
    const sourceM3D = sourceGeom.milestones3D[idx]?.p3d || targetM3D;
    const blendedM3D: Vector3D = slerp3D(sourceM3D, targetM3D, transT);
    const v = transformVertex(blendedM3D);
    return {
      ...m,
      p3d: blendedM3D,
      pCam: v.pCam,
      screenPos: v.screenPos,
      isFront: v.isFront
    };
  });

  // 10. Lunar Nodes (Ascending & Descending)
  const ascNode3D: Vector3D = isHelioMode
    ? { x: blendedEarth3D.x + 16, y: blendedEarth3D.y, z: blendedEarth3D.z }
    : { x: blendedEarth3D.x + 26, y: blendedEarth3D.y, z: blendedEarth3D.z };
  const descNode3D: Vector3D = isHelioMode
    ? { x: blendedEarth3D.x - 16, y: blendedEarth3D.y, z: blendedEarth3D.z }
    : { x: blendedEarth3D.x - 26, y: blendedEarth3D.y, z: blendedEarth3D.z };
  const ascV = transformVertex(ascNode3D);
  const descV = transformVertex(descNode3D);
  const lunarNodes: ArmillaryLunarNodes = {
    ascendingNode: { screenPos: ascV.screenPos, isFront: ascV.isFront, lonDeg: 0 },
    descendingNode: { screenPos: descV.screenPos, isFront: descV.isFront, lonDeg: 180 }
  };

  // 11. Topocentric Observer Field of View (FOV) Sky Cone
  let observerCone: ArmillaryObserverCone | undefined = undefined;
  if (orbitRingOpacity > 0.05) {
    const phi = toRadians(latitude);
    const rotDeg = (gmstDeg + longitude + 360) % 360;
    const rotRad = toRadians(rotDeg);
    const epsRad = toRadians(obliquity);

    // Observer body vector on Earth
    const vx = Math.cos(phi) * Math.sin(rotRad);
    const vy = Math.sin(phi);
    const vz = Math.cos(phi) * Math.cos(rotRad);

    // Tilted zenith direction in 3D space
    const nzX = vx;
    const nzY = vy * Math.cos(epsRad) - vz * Math.sin(epsRad);
    const nzZ = vy * Math.sin(epsRad) + vz * Math.cos(epsRad);

    // Observer pin on Earth surface
    const pObs3D: Vector3D = {
      x: blendedEarth3D.x + 3.5 * nzX,
      y: blendedEarth3D.y + 3.5 * nzY,
      z: blendedEarth3D.z + 3.5 * nzZ
    };

    // Zenith ray tip (30 px outward)
    const pZenith3D: Vector3D = {
      x: pObs3D.x + 30 * nzX,
      y: pObs3D.y + 30 * nzY,
      z: pObs3D.z + 30 * nzZ
    };

    const obsV = transformVertex(pObs3D);
    const zenithV = transformVertex(pZenith3D);

    // Tangent horizon disc (circle of radius 12 perpendicular to zenith)
    const uRaw = Math.abs(nzY) < 0.99 ? { x: -nzZ, y: 0, z: nzX } : { x: 1, y: 0, z: 0 };
    const uLen = Math.sqrt(uRaw.x * uRaw.x + uRaw.y * uRaw.y + uRaw.z * uRaw.z) || 1;
    const u = { x: uRaw.x / uLen, y: uRaw.y / uLen, z: uRaw.z / uLen };
    const w = { x: nzY * u.z - nzZ * u.y, y: nzZ * u.x - nzX * u.z, z: nzX * u.y - nzY * u.x };

    const discPoints: Vector2D[] = [];
    const NUM_DISC_SAMPLES = 24;
    for (let i = 0; i <= NUM_DISC_SAMPLES; i++) {
      const aRad = (i / NUM_DISC_SAMPLES) * 2 * Math.PI;
      const rDisc = 12;
      const pt3D: Vector3D = {
        x: pObs3D.x + rDisc * (u.x * Math.cos(aRad) + w.x * Math.sin(aRad)),
        y: pObs3D.y + rDisc * (u.y * Math.cos(aRad) + w.y * Math.sin(aRad)),
        z: pObs3D.z + rDisc * (u.z * Math.cos(aRad) + w.z * Math.sin(aRad))
      };
      discPoints.push(transformVertex(pt3D).screenPos);
    }

    let horizonDiscPathD = '';
    if (discPoints.length > 0) {
      horizonDiscPathD = `M ${discPoints[0].x.toFixed(1)} ${discPoints[0].y.toFixed(1)} `;
      for (let i = 1; i < discPoints.length; i++) {
        horizonDiscPathD += `L ${discPoints[i].x.toFixed(1)} ${discPoints[i].y.toFixed(1)} `;
      }
      horizonDiscPathD += 'Z';
    }

    // Cone envelope polygon (connecting observer to outer rim and zenith)
    let conePathD = `M ${obsV.screenPos.x.toFixed(1)} ${obsV.screenPos.y.toFixed(1)} `;
    for (const pt of discPoints) {
      conePathD += `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
    }
    conePathD += `L ${zenithV.screenPos.x.toFixed(1)} ${zenithV.screenPos.y.toFixed(1)} Z`;

    // Solar elevation angle for observer
    const sunDir = {
      x: blendedSun3D.x - blendedEarth3D.x,
      y: blendedSun3D.y - blendedEarth3D.y,
      z: blendedSun3D.z - blendedEarth3D.z
    };
    const sunLen = Math.sqrt(sunDir.x * sunDir.x + sunDir.y * sunDir.y + sunDir.z * sunDir.z) || 1;
    const sinAlt = (nzX * sunDir.x + nzY * sunDir.y + nzZ * sunDir.z) / sunLen;
    const sunElevationDeg = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));
    const isDaytime = sunElevationDeg > -0.833;

    observerCone = {
      observerScreenPos: obsV.screenPos,
      zenithScreenPos: zenithV.screenPos,
      horizonDiscPathD,
      conePathD,
      zenithRay: { start: obsV.screenPos, end: zenithV.screenPos },
      isDaytime,
      sunElevationDeg: parseFloat(sunElevationDeg.toFixed(1)),
      label: isDaytime ? 'Observer Sky (Daylight)' : 'Observer Sky (Night Cosmos)'
    };
  }

  // 12. Earth, Sun, and Moon Beads (Clamped Sun Bead)
  const earthV = transformVertex(blendedEarth3D);
  const sunV = transformVertex(blendedSun3D);
  const moonV = transformVertex(blendedMoon3D);
  const sunHoriz = equatorialToHorizontal(sunRaDeg, sunDecDeg, latitude, lstDeg);
  const moonHoriz = equatorialToHorizontal(moonRaDeg, moonDecDeg, latitude, lstDeg);

  // 13. Almucantars and Planetary Hours
  const almucantars = generateContinuousAlmucantars(latitude, projectionMode, fromProjectionMode, transT, 15, r0);
  const planetaryHour = calculatePlanetaryHour(timeOfDay, sunrise, sunset, dayOfWeek);

  return {
    rings,
    almucantars,
    unequalHours: [],
    milestones,
    physics,
    earth: {
      p3d: blendedEarth3D,
      pCam: earthV.pCam,
      pProj: earthV.pProj,
      screenPos: earthV.screenPos,
      isFront: earthV.isFront
    },
    stars,
    sun: {
      raDeg: asDegrees(sunRaDeg),
      decDeg: asDegrees(sunDecDeg),
      lambdaDeg: asDegrees(sunLambdaDeg),
      p3d: blendedSun3D,
      pCam: sunV.pCam,
      pProj: sunV.pProj,
      screenPos: sunV.screenPos,
      isFront: sunV.isFront,
      altDeg: sunHoriz.altDeg,
      azDeg: sunHoriz.azDeg
    },
    moon: {
      raDeg: asDegrees(moonRaDeg),
      decDeg: asDegrees(moonDecDeg),
      lambdaDeg: asDegrees(moonLambdaDeg),
      phase: moonPhase,
      p3d: blendedMoon3D,
      pCam: moonV.pCam,
      pProj: moonV.pProj,
      screenPos: moonV.screenPos,
      isFront: moonV.isFront,
      altDeg: moonHoriz.altDeg,
      azDeg: moonHoriz.azDeg
    },
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
