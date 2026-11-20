/**
 * @file generatorRings.ts
 * Builds the 8 depth-sorted celestial and orbital ring paths for the Armillary sphere
 * and Astrolabe continuum.
 */

import { Latitude } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { toRadians, clamp } from '../core';
import {
  EARTH_ECCENTRICITY_TRUE,
  EARTH_ECCENTRICITY_EXAGGERATED,
  MOON_ORBIT_INCLINATION_DEG
} from '../astroConstants';
import {
  ArmillaryProjectionMode,
  ArmillaryRingVertex,
  ArmillaryRingPath
} from './types';
import { generateParametricRing3D } from './paths';

export interface GenerateArmillaryRingsParams {
  r0: number;
  obliquity: number;
  latitude: Latitude;
  reteOffset: number;
  exaggerateEccentricity: boolean;
  projectionMode: ArmillaryProjectionMode;
  fromProjectionMode?: ArmillaryProjectionMode;
  transT: number;
  blendedEarth3D: Vector3D;
  nodeLonDeg: number;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
  morphLambda?: number;
}

const NUM_RING_SAMPLES = 72;
const RING_COS = new Float64Array(NUM_RING_SAMPLES + 1);
const RING_SIN = new Float64Array(NUM_RING_SAMPLES + 1);
for (let i = 0; i <= NUM_RING_SAMPLES; i++) {
  const rad = (i / NUM_RING_SAMPLES) * 2 * Math.PI;
  RING_COS[i] = Math.cos(rad);
  RING_SIN[i] = Math.sin(rad);
}

/**
 * Builds the 8 depth-sorted celestial and orbital ring paths for the armillary sphere:
 * 0. Orbital Path (Keplerian heliocentric / Ecliptic track)
 * 1. Lunar Orbit (5.145° inclined around Earth, precessing node Omega)
 * 2. Celestial Equator (Dec = 0°)
 * 3. Ecliptic (Zodiac Rete ring inclined at 23.44°, rotates with LST or Free Rete offset)
 * 4. Tropic of Cancer (Dec = +23.44°)
 * 5. Tropic of Capricorn (Dec = -23.44°)
 * 6. Local Horizon (Alt = 0°)
 * 7. Solstitial Colure (RA = 90° and 270° meridian plane)
 */
export function generateArmillaryRings(params: GenerateArmillaryRingsParams): ArmillaryRingPath[] {
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
    nodeLonDeg,
    transformVertex,
    morphLambda
  } = params;

  const rings: ArmillaryRingPath[] = [];
  const NUM_SAMPLES = NUM_RING_SAMPLES;

  // 0. Orbital Path Ring (Keplerian / Ecliptic orbit with rigid plane tilt)
  const isTargetHelio = projectionMode === 'heliocentric';
  const isSourceHelio = fromProjectionMode === 'heliocentric';
  const phaseAT = clamp((morphLambda ?? 0) / 0.45, 0, 1);
  const isHelioBase = (1 - transT) * (isSourceHelio ? 1 : 0) + transT * (isTargetHelio ? 1 : 0);
  const isHelioT = isHelioBase * (1.0 - phaseAT);
  const tGeo = 1.0 - isHelioT;
  const aOrb = r0 * 1.1;
  const eOrb = exaggerateEccentricity ? EARTH_ECCENTRICITY_EXAGGERATED : EARTH_ECCENTRICITY_TRUE;
  const bOrb = aOrb * Math.sqrt(Math.max(0, 1 - eOrb * eOrb));
  const tiltRad = toRadians(tGeo * obliquity);
  const yOrbFactor = (1 - isHelioT) * aOrb * Math.sin(tiltRad);
  const zOrbFactor = -(isHelioT * bOrb + (1 - isHelioT) * aOrb * Math.cos(tiltRad));

  rings.push(
    generateParametricRing3D(
      {
        id: 'orbit_path',
        label: 'Orbital Path',
        frontStrokeWidth: 1.6,
        backStrokeWidth: 0.8,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: aOrb * RING_COS[i],
          y: yOrbFactor * RING_SIN[i],
          z: zOrbFactor * RING_SIN[i]
        })
      },
      transformVertex
    )
  );

  // 1. Lunar Orbit Ring (5.145° Inclined around Earth, precessing node Omega)
  const lunarOrbitRadius = 16 + 10 * tGeo;
  const incRad = toRadians(MOON_ORBIT_INCLINATION_DEG);
  const epsRad = toRadians(obliquity);
  const nodeRad = toRadians(nodeLonDeg);
  const rotFrameRad = tGeo * epsRad;

  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);
  const cosNode = Math.cos(nodeRad);
  const sinNode = Math.sin(nodeRad);
  const cosFrame = Math.cos(rotFrameRad);
  const sinFrame = Math.sin(rotFrameRad);
  const isGeoApparent = projectionMode === 'geocentric';

  rings.push(
    generateParametricRing3D(
      {
        id: 'lunar_orbit',
        label: 'Lunar Orbit (5.14° Inclined)',
        frontStrokeWidth: 1.2,
        backStrokeWidth: 0.6,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => {
          const cosA = RING_COS[i];
          const sinA = RING_SIN[i];
          const xOrb = lunarOrbitRadius * cosA;
          const yOrb = lunarOrbitRadius * sinA * sinInc;
          const zOrb = lunarOrbitRadius * sinA * cosInc;

          const xEcl = xOrb * cosNode - zOrb * sinNode;
          const yEcl = yOrb;
          const zEcl = xOrb * sinNode + zOrb * cosNode;

          const xRel = xEcl;
          const yRel = yEcl * cosFrame + zEcl * sinFrame;
          const zRel = -yEcl * sinFrame + zEcl * cosFrame;

          return {
            x: blendedEarth3D.x + xRel,
            y: blendedEarth3D.y + yRel,
            z: blendedEarth3D.z + (isGeoApparent ? -zRel : zRel)
          };
        }
      },
      transformVertex
    )
  );

  // Blooming parameters for celestial sphere rings (expand from Earth globe r=14px to R0=100px)
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
        frontStrokeWidth: 2.0,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: cBloom.x + rBloom * RING_COS[i],
          y: cBloom.y,
          z: cBloom.z + rBloom * RING_SIN[i]
        })
      },
      transformVertex
    )
  );

  // 3. Ecliptic Rete Ring (Inclined at 23.44°, Rotates with LST or Free Rete Offset)
  const sinEps = Math.sin(epsRad);
  const cosEps = Math.cos(epsRad);
  const zBaseSign = isGeoApparent ? -1 : 1;
  const reteRad = toRadians(reteOffset);
  const cosRete = Math.cos(reteRad);
  const sinRete = Math.sin(reteRad);

  rings.push(
    generateParametricRing3D(
      {
        id: 'ecliptic',
        label: 'Ecliptic (Zodiac Rete)',
        frontStrokeWidth: 2.2,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => {
          const cosA = RING_COS[i];
          const sinA = RING_SIN[i];
          const xBase = rBloom * cosA;
          const yBase = rBloom * sinA * sinEps;
          const zBase = zBaseSign * rBloom * sinA * cosEps;
          const px = reteOffset === 0 ? xBase : xBase * cosRete + zBase * sinRete;
          const py = yBase;
          const pz = reteOffset === 0 ? zBase : -xBase * sinRete + zBase * cosRete;
          return { x: cBloom.x + px, y: cBloom.y + py, z: cBloom.z + pz };
        }
      },
      transformVertex
    )
  );

  // 4. Tropic of Cancer (Dec = +23.44° - Muted Antique Brass)
  const rTropic = rBloom * cosEps;
  const yCancer = rBloom * sinEps;

  rings.push(
    generateParametricRing3D(
      {
        id: 'tropic_cancer',
        label: 'Tropic of Cancer (+23.44°)',
        frontStrokeWidth: 0.9,
        backStrokeWidth: 0.5,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: cBloom.x + rTropic * RING_COS[i],
          y: cBloom.y + yCancer,
          z: cBloom.z + rTropic * RING_SIN[i]
        })
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
        frontStrokeWidth: 0.9,
        backStrokeWidth: 0.5,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: cBloom.x + rTropic * RING_COS[i],
          y: cBloom.y - yCancer,
          z: cBloom.z + rTropic * RING_SIN[i]
        })
      },
      transformVertex
    )
  );

  // 6. Local Horizon Ring (Alt = 0°)
  const pitchRad = toRadians(latitude - 90);
  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);
  const pyFactor = rBloom * sinPitch;
  const pzFactor = -rBloom * cosPitch;

  rings.push(
    generateParametricRing3D(
      {
        id: 'horizon',
        label: 'Local Horizon',
        frontStrokeWidth: 2.0,
        backStrokeWidth: 1.0,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: cBloom.x + rBloom * RING_SIN[i],
          y: cBloom.y + pyFactor * RING_COS[i],
          z: cBloom.z + pzFactor * RING_COS[i]
        })
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
        frontStrokeWidth: 1.2,
        backStrokeWidth: 0.8,
        sampleCount: NUM_SAMPLES,
        samplePoint: (_t, i) => ({
          x: cBloom.x,
          y: cBloom.y + rBloom * RING_SIN[i],
          z: cBloom.z + rBloom * RING_COS[i]
        })
      },
      transformVertex
    )
  );

  return rings;
}
