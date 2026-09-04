/**
 * @file generatorBeads.ts
 * Derives celestial beads (Sun, Moon, Earth), navigational stars, milestone halo nodes,
 * lunar nodes, and the topocentric observer field-of-view cone for the Armillary model.
 */

import { Degrees, Latitude, Longitude, asDegrees } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp, slerp3D } from '../core';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from '../astroConstants';
import { EARTH_MILESTONES } from '../milestones';
import { ASTROLABE_STARS } from './constants';
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

  return EARTH_MILESTONES.map((m, idx) => {
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
  isGeoApparent?: boolean;
  blendedEarth3D: Vector3D;
  nodeLonDeg?: number;
  obliquity?: number;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
}): ArmillaryLunarNodes {
  const { isHelioMode, isGeoApparent = false, blendedEarth3D, nodeLonDeg = 0, obliquity = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG), transformVertex } = params;

  const nodeDist = isHelioMode ? 16 : 26;
  const nodeRad = toRadians(nodeLonDeg);
  const epsRad = toRadians(obliquity);

  // Ascending Node (u = 0, beta = 0 on the ecliptic)
  const xEclAsc = nodeDist * Math.cos(nodeRad);
  const yEclAsc = 0;
  const zEclAsc = nodeDist * Math.sin(nodeRad);

  const xRelAsc = xEclAsc;
  const yRelAsc = isHelioMode ? yEclAsc : (yEclAsc * Math.cos(epsRad) + zEclAsc * Math.sin(epsRad));
  const zRelAsc = isHelioMode ? zEclAsc : (-yEclAsc * Math.sin(epsRad) + zEclAsc * Math.cos(epsRad));

  const zSigned = isGeoApparent ? -zRelAsc : zRelAsc;

  const ascNode3D: Vector3D = {
    x: blendedEarth3D.x + xRelAsc,
    y: blendedEarth3D.y + yRelAsc,
    z: blendedEarth3D.z + zSigned
  };

  // Descending Node (opposite side through center)
  const descNode3D: Vector3D = {
    x: blendedEarth3D.x - xRelAsc,
    y: blendedEarth3D.y - yRelAsc,
    z: blendedEarth3D.z - zSigned
  };

  const ascV = transformVertex(ascNode3D);
  const descV = transformVertex(descNode3D);

  return {
    ascendingNode: { screenPos: ascV.screenPos, isFront: ascV.isFront, lonDeg: nodeLonDeg },
    descendingNode: { screenPos: descV.screenPos, isFront: descV.isFront, lonDeg: (nodeLonDeg + 180) % 360 }
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

  // Coordinate frame perpendicular to zenith vector
  const uRaw = Math.abs(nzY) < 0.99 ? { x: -nzZ, y: 0, z: nzX } : { x: 1, y: 0, z: 0 };
  const uLen = Math.sqrt(uRaw.x * uRaw.x + uRaw.y * uRaw.y + uRaw.z * uRaw.z) || 1;
  const u = { x: uRaw.x / uLen, y: uRaw.y / uLen, z: uRaw.z / uLen };
  const w = { x: nzY * u.z - nzZ * u.y, y: nzZ * u.x - nzX * u.z, z: nzX * u.y - nzY * u.x };

  // 1. Expanding celestial canopy base in outer space (radius 20 around zenith tip)
  const canopyPoints: Vector2D[] = [];
  const NUM_DISC_SAMPLES = 24;
  const rCanopy = 20;
  for (let i = 0; i <= NUM_DISC_SAMPLES; i++) {
    const aRad = (i / NUM_DISC_SAMPLES) * 2 * Math.PI;
    const pt3D: Vector3D = {
      x: pZenith3D.x + rCanopy * (u.x * Math.cos(aRad) + w.x * Math.sin(aRad)),
      y: pZenith3D.y + rCanopy * (u.y * Math.cos(aRad) + w.y * Math.sin(aRad)),
      z: pZenith3D.z + rCanopy * (u.z * Math.cos(aRad) + w.z * Math.sin(aRad))
    };
    canopyPoints.push(transformVertex(pt3D).screenPos);
  }

  // Circular rim disc in the sky
  let horizonDiscPathD = '';
  if (canopyPoints.length > 0) {
    horizonDiscPathD = `M ${canopyPoints[0].x.toFixed(1)} ${canopyPoints[0].y.toFixed(1)} `;
    for (let i = 1; i < canopyPoints.length; i++) {
      horizonDiscPathD += `L ${canopyPoints[i].x.toFixed(1)} ${canopyPoints[i].y.toFixed(1)} `;
    }
    horizonDiscPathD += 'Z';
  }

  // 2. Compute the two extreme silhouette tangent points on the celestial canopy as seen from the observer
  const zDirX = zenithV.screenPos.x - obsV.screenPos.x;
  const zDirY = zenithV.screenPos.y - obsV.screenPos.y;
  let minCross = Infinity;
  let maxCross = -Infinity;
  let pLeft = canopyPoints[0] || obsV.screenPos;
  let pRight = canopyPoints[0] || obsV.screenPos;

  for (const pt of canopyPoints) {
    const vx = pt.x - obsV.screenPos.x;
    const vy = pt.y - obsV.screenPos.y;
    const cross = zDirX * vy - zDirY * vx;
    if (cross < minCross) {
      minCross = cross;
      pLeft = pt;
    }
    if (cross > maxCross) {
      maxCross = cross;
      pRight = pt;
    }
  }

  // Symmetrical silhouette rays connecting observer to both outer edges of the sky canopy circle
  const silhouetteLinesPathD = `M ${obsV.screenPos.x.toFixed(1)} ${obsV.screenPos.y.toFixed(1)} L ${pLeft.x.toFixed(1)} ${pLeft.y.toFixed(1)} M ${obsV.screenPos.x.toFixed(1)} ${obsV.screenPos.y.toFixed(1)} L ${pRight.x.toFixed(1)} ${pRight.y.toFixed(1)}`;

  // 3. Volumetric conical fill envelope connecting observer to outer rim
  let conePathD = `M ${obsV.screenPos.x.toFixed(1)} ${obsV.screenPos.y.toFixed(1)} `;
  for (const pt of canopyPoints) {
    conePathD += `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
  }
  conePathD += `L ${obsV.screenPos.x.toFixed(1)} ${obsV.screenPos.y.toFixed(1)} Z`;

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
    silhouetteLinesPathD,
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
