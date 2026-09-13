/**
 * @file generatorRings.ts
 * Builds the 8 depth-sorted celestial and orbital ring paths for the Armillary sphere
 * and Astrolabe continuum.
 */

import { Latitude } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { toRadians } from '../core';
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
import {
  equatorialToCartesian3D,
  horizontalToCartesian3D,
  rotateEuler3D
} from './coordinates';
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
    transformVertex
  } = params;

  const rings: ArmillaryRingPath[] = [];
  const NUM_SAMPLES = 72;

  // 0. Orbital Path Ring (Keplerian / Ecliptic orbit with rigid plane tilt)
  const isTargetHelio = projectionMode === 'heliocentric';
  const isSourceHelio = fromProjectionMode === 'heliocentric';
  const isHelioT = (1 - transT) * (isSourceHelio ? 1 : 0) + transT * (isTargetHelio ? 1 : 0);
  const aOrb = r0 * 1.1;
  const eOrb = exaggerateEccentricity ? EARTH_ECCENTRICITY_EXAGGERATED : EARTH_ECCENTRICITY_TRUE;
  const bOrb = aOrb * Math.sqrt(Math.max(0, 1 - eOrb * eOrb));
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
          const xOrb = aOrb * Math.cos(angleRad);
          const yOrb = (1 - isHelioT) * aOrb * Math.sin(angleRad) * Math.sin(tiltRad);
          const zOrb = -(isHelioT * bOrb + (1 - isHelioT) * aOrb * Math.cos(tiltRad)) * Math.sin(angleRad);
          return {
            x: xOrb,
            y: yOrb,
            z: zOrb
          };
        }
      },
      transformVertex
    )
  );

  // 1. Lunar Orbit Ring (5.145° Inclined around Earth, precessing node Omega)
  const isHelioMode = projectionMode === 'heliocentric';
  const lunarOrbitRadius = isHelioMode ? 16 : 26;
  const incRad = toRadians(MOON_ORBIT_INCLINATION_DEG);
  const epsRad = toRadians(obliquity);
  const nodeRad = toRadians(nodeLonDeg);

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
          // u is the orbital angle starting from the ascending node Omega
          const u = t * 2 * Math.PI;
          // In the orbital plane:
          const xOrb = lunarOrbitRadius * Math.cos(u);
          const yOrb = lunarOrbitRadius * Math.sin(u) * Math.sin(incRad);
          const zOrb = lunarOrbitRadius * Math.sin(u) * Math.cos(incRad);
          // Rotate in ecliptic plane by node longitude Omega:
          const xEcl = xOrb * Math.cos(nodeRad) - zOrb * Math.sin(nodeRad);
          const yEcl = yOrb;
          const zEcl = xOrb * Math.sin(nodeRad) + zOrb * Math.cos(nodeRad);

          // In Helio mode: already in ecliptic frame centered on Earth
          // In Geocentric/Apparent mode: transform from Ecliptic to Equatorial frame via +obliquity
          const xRel = xEcl;
          const yRel = isHelioMode
            ? yEcl
            : (yEcl * Math.cos(epsRad) + zEcl * Math.sin(epsRad));
          const zRel = isHelioMode
            ? zEcl
            : (-yEcl * Math.sin(epsRad) + zEcl * Math.cos(epsRad));

          const isGeoApparent = projectionMode === 'geocentric';
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
          const isGeoApparent = projectionMode === 'geocentric';
          const lRad = toRadians(t * 360);
          const xBase = rBloom * Math.cos(lRad);
          const yBase = rBloom * Math.sin(lRad) * Math.sin(epsRad);
          const zBase = (isGeoApparent ? -1 : 1) * rBloom * Math.sin(lRad) * Math.cos(epsRad);
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
