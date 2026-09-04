/**
 * @file generatorGeometry.ts
 * Derives mode-specific 3D positions and layer opacities for the Armillary 5-model continuum.
 */

import { Vector3D } from '../../../types/coordinates';
import { toRadians, clamp } from '../core';
import { EARTH_MILESTONES } from '../milestones';
import { 
  EARTH_ECCENTRICITY_TRUE, 
  EARTH_ECCENTRICITY_EXAGGERATED, 
  MOON_ORBIT_INCLINATION_DEG 
} from '../astroConstants';
import { equatorialToCartesian3D, rotateEuler3D } from './coordinates';
import { ArmillaryModelMode } from './types';

export interface RawModeGeometry {
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

export interface ComputeRawModeGeometryParams {
  r0: number;
  obliquity: number;
  sunLambdaDeg: number;
  moonLambdaDeg: number;
  moonRaDeg: number;
  moonDecDeg: number;
  exaggerateEccentricity: boolean;
  reteOffset: number;
  lambdaClamp: number;
}

/**
 * Computes raw 3D body positions, milestone nodes, and layer opacities for a given continuum mode.
 * 
 * @param mode - Target armillary continuum mode (heliocentric, geocentric, stereographic, rojas, horizon)
 * @param params - Physical and observational parameters
 * @returns RawModeGeometry state
 */
export function computeRawModeGeometry(
  mode: ArmillaryModelMode,
  params: ComputeRawModeGeometryParams
): RawModeGeometry {
  const {
    r0,
    obliquity,
    sunLambdaDeg,
    moonLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    exaggerateEccentricity,
    reteOffset,
    lambdaClamp
  } = params;

  const isHelio = mode === 'heliocentric';
  const isGeo = mode === 'geocentric';

  if (isHelio) {
    const a = r0 * 1.1;
    const e = exaggerateEccentricity ? EARTH_ECCENTRICITY_EXAGGERATED : EARTH_ECCENTRICITY_TRUE;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;
    const sun3D = exaggerateEccentricity ? { x: -c, y: 0, z: 0 } : { x: 0, y: 0, z: 0 };

    // Earth's heliocentric longitude: lambda_earth = sunLambdaDeg + 180°
    const earthLonRad = toRadians((sunLambdaDeg + 180) % 360);
    const earth3D: Vector3D = {
      x: a * Math.cos(earthLonRad),
      y: 0,
      z: -b * Math.sin(earthLonRad)
    };

    // Moon relative to Earth (prograde counter-clockwise orbit)
    const moonAngleRad = toRadians(moonLambdaDeg);
    const moon3D: Vector3D = {
      x: earth3D.x + 16 * Math.cos(moonAngleRad),
      y: earth3D.y + 16 * Math.sin(toRadians(MOON_ORBIT_INCLINATION_DEG)) * Math.sin(moonAngleRad),
      z: earth3D.z - 16 * Math.sin(moonAngleRad)
    };

    // Heliocentric milestones along Earth's orbit
    const milestones3D = EARTH_MILESTONES.map((m) => {
      const lonRad = toRadians(m.helioEclipticLon);
      return {
        id: m.id,
        p3d: {
          x: a * Math.cos(lonRad),
          y: 0,
          z: -b * Math.sin(lonRad)
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
      z: -a * Math.sin(sunLonRad) * Math.cos(epsRad)
    };

    // Geocentric Moon at physical orbit distance (26 px, counter-clockwise prograde orbit)
    const moonRaw = equatorialToCartesian3D(moonRaDeg, moonDecDeg, 26);
    const moon3D: Vector3D = {
      x: moonRaw.x,
      y: moonRaw.y,
      z: -moonRaw.z
    };

    // Milestones along Sun's apparent ecliptic path (helioLon + 180°)
    const milestones3D = EARTH_MILESTONES.map((m) => {
      const apparentSunLonRad = toRadians((m.helioEclipticLon + 180) % 360);
      return {
        id: m.id,
        p3d: {
          x: a * Math.cos(apparentSunLonRad),
          y: a * Math.sin(apparentSunLonRad) * Math.sin(epsRad),
          z: -a * Math.sin(apparentSunLonRad) * Math.cos(epsRad)
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

  const milestones3D = EARTH_MILESTONES.map((m) => {
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
}
