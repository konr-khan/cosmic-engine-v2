/**
 * @file generatorBeads.ts
 * Derives celestial beads (Sun, Moon, Earth), navigational stars, milestone halo nodes,
 * lunar nodes, and the topocentric observer field-of-view cone for the Armillary model.
 */

import { Degrees, Latitude, Longitude, asDegrees } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp, slerp3D } from '../core';
import { ARMILLARY_MILESTONES_DATA, ASTROLABE_STARS } from './constants';
import { equatorialToCartesian3D, equatorialToHorizontal, rotateEuler3D } from './coordinates';
import { 
  ArmillaryRingVertex, 
  ArmillaryMilestoneNode, 
  ArmillaryLunarNodes, 
  ArmillaryObserverCone,
  ArmillaryStarData,
  ArmillaryModelOutput
} from './types';

export type ArmillaryProjectedStar = ArmillaryStarData & ArmillaryRingVertex & {
  altDeg: number;
  azDeg: number;
};

/**
 * Projects the 12 classical navigational astrolabe stars onto the celestial sphere and plate.
 */
export function computeArmillaryStars(params: {
  rBloom: number;
  reteOffset: number;
  cBloom: Vector3D;
  latitude: Latitude;
  lstDeg: Degrees;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryProjectedStar[] {
  const { rBloom, reteOffset, cBloom, latitude, lstDeg, transformVertex } = params;

  return ASTROLABE_STARS.map((s) => {
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
}

/**
 * Blends source and target seasonal milestone nodes via spherical SLERP and projects them.
 */
export function computeArmillaryMilestones(params: {
  sourceMilestones3D: Array<{ id: string; p3d: Vector3D }>;
  targetMilestones3D: Array<{ id: string; p3d: Vector3D }>;
  transT: number;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryMilestoneNode[] {
  const { sourceMilestones3D, targetMilestones3D, transT, transformVertex } = params;

  return ARMILLARY_MILESTONES_DATA.map((m, idx) => {
    const targetM3D = targetMilestones3D[idx]?.p3d || { x: 0, y: 0, z: 0 };
    const sourceM3D = sourceMilestones3D[idx]?.p3d || targetM3D;
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
}

/**
 * Derives the ascending (☊) and descending (☋) lunar node pins on the inclined lunar orbit.
 */
export function computeArmillaryLunarNodes(params: {
  isHelioMode: boolean;
  blendedEarth3D: Vector3D;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryLunarNodes {
  const { isHelioMode, blendedEarth3D, transformVertex } = params;

  const nodeDist = isHelioMode ? 16 : 26;
  const ascNode3D: Vector3D = { x: blendedEarth3D.x + nodeDist, y: blendedEarth3D.y, z: blendedEarth3D.z };
  const descNode3D: Vector3D = { x: blendedEarth3D.x - nodeDist, y: blendedEarth3D.y, z: blendedEarth3D.z };

  const ascV = transformVertex(ascNode3D);
  const descV = transformVertex(descNode3D);

  return {
    ascendingNode: { screenPos: ascV.screenPos, isFront: ascV.isFront, lonDeg: 0 },
    descendingNode: { screenPos: descV.screenPos, isFront: descV.isFront, lonDeg: 180 }
  };
}

/**
 * Derives the topocentric observer sky cone, zenith ray, and tangent horizon disc.
 */
export function computeArmillaryObserverCone(params: {
  orbitRingOpacity: number;
  latitude: Latitude;
  longitude: Longitude;
  gmstDeg: number;
  obliquity: number;
  blendedEarth3D: Vector3D;
  blendedSun3D: Vector3D;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryObserverCone | undefined {
  const {
    orbitRingOpacity,
    latitude,
    longitude,
    gmstDeg,
    obliquity,
    blendedEarth3D,
    blendedSun3D,
    transformVertex
  } = params;

  if (orbitRingOpacity <= 0.05) return undefined;

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

  return {
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

/**
 * Projects Earth, Sun, and Moon celestial body beads with horizontal Alt/Az and screen positions.
 */
export function computeArmillaryBodies(params: {
  blendedEarth3D: Vector3D;
  blendedSun3D: Vector3D;
  blendedMoon3D: Vector3D;
  sunRaDeg: Degrees | number;
  sunDecDeg: Degrees | number;
  sunLambdaDeg: Degrees | number;
  moonRaDeg: Degrees | number;
  moonDecDeg: Degrees | number;
  moonLambdaDeg: Degrees | number;
  moonPhase: number;
  latitude: Latitude;
  lstDeg: Degrees;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): {
  earth: ArmillaryModelOutput['earth'];
  sun: ArmillaryModelOutput['sun'];
  moon: ArmillaryModelOutput['moon'];
} {
  const {
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
  } = params;

  const earthV = transformVertex(blendedEarth3D);
  const sunV = transformVertex(blendedSun3D);
  const moonV = transformVertex(blendedMoon3D);
  const sunHoriz = equatorialToHorizontal(sunRaDeg, sunDecDeg, latitude, lstDeg);
  const moonHoriz = equatorialToHorizontal(moonRaDeg, moonDecDeg, latitude, lstDeg);

  return {
    earth: {
      p3d: blendedEarth3D,
      pCam: earthV.pCam,
      pProj: earthV.pProj,
      screenPos: earthV.screenPos,
      isFront: earthV.isFront
    },
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
    }
  };
}
