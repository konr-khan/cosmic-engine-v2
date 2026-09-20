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
  morphLambda?: number;
}): ArmillaryLunarNodes {
  const {
    isHelioMode,
    isGeoApparent = false,
    blendedEarth3D,
    nodeLonDeg = 0,
    obliquity = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG),
    transformVertex,
    morphLambda
  } = params;

  const phaseAT = clamp((morphLambda ?? 0) / 0.45, 0, 1);
  const nodeDist = isHelioMode ? 16 + 10 * phaseAT : 26;
  const nodeRad = toRadians(nodeLonDeg);
  const epsRad = toRadians(obliquity);
  const rotFrameRad = isHelioMode ? phaseAT * epsRad : epsRad;

  // Ascending Node (u = 0, beta = 0 on the ecliptic)
  const xEclAsc = nodeDist * Math.cos(nodeRad);
  const yEclAsc = 0;
  const zEclAsc = nodeDist * Math.sin(nodeRad);

  const cosFrame = Math.cos(rotFrameRad);
  const sinFrame = Math.sin(rotFrameRad);
  const xRelAsc = xEclAsc;
  const yRelAsc = yEclAsc * cosFrame + zEclAsc * sinFrame;
  const zRelAsc = -yEclAsc * sinFrame + zEclAsc * cosFrame;

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
    ascendingNode: { screenPos: ascV.screenPos, isFront: ascV.isFront, lonDeg: ((nodeLonDeg % 360) + 360) % 360 },
    descendingNode: { screenPos: descV.screenPos, isFront: descV.isFront, lonDeg: (((nodeLonDeg + 180) % 360 + 360) % 360) }
  };
}

export {
  computeArmillaryObserverCone,
  type ComputeArmillaryObserverConeParams
} from './generatorObserverCone';

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

  // Normalized Sun-to-Earth camera-space vector for physical 3D terminator shading
  const edx = sunV.pCam.x - earthV.pCam.x;
  const edy = sunV.pCam.y - earthV.pCam.y;
  const edz = sunV.pCam.z - earthV.pCam.z;
  const eLen = Math.hypot(edx, edy, edz);
  const earthSubsolarCameraVector: Vector3D = eLen < 1e-6
    ? { x: 0, y: 0, z: 1 }
    : { x: edx / eLen, y: edy / eLen, z: edz / eLen };

  // Normalized Sun-to-Moon camera-space vector for 3D analytical lunar terminator
  const mdx = sunV.pCam.x - moonV.pCam.x;
  const mdy = sunV.pCam.y - moonV.pCam.y;
  const mdz = sunV.pCam.z - moonV.pCam.z;
  const mLen = Math.hypot(mdx, mdy, mdz);
  const moonSubsolarCameraVector: Vector3D = mLen < 1e-6
    ? { x: 0, y: 0, z: 1 }
    : { x: mdx / mLen, y: mdy / mLen, z: mdz / mLen };

  return {
    earth: {
      p3d: blendedEarth3D,
      pCam: earthV.pCam,
      pProj: earthV.pProj,
      screenPos: earthV.screenPos,
      isFront: earthV.isFront,
      subsolarCameraVector: earthSubsolarCameraVector
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
      azDeg: moonHoriz.azDeg,
      subsolarCameraVector: moonSubsolarCameraVector
    }
  };
}

/**
 * Analytical SVG path generator for a 2D lunar phase disc of radius r.
 * In a local coordinate frame with origin (0, 0), the illuminated bright limb
 * faces toward +X (0 degrees, pointing toward the Sun).
 *
 * @param phase - Normalized lunar phase in [0, 1) (0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter)
 * @param r - Disc radius in SVG user units (default: 2.6)
 */
export function computeMoonPhasePath(phase: number, r: number = 2.6): {
  pathD: string;
  isFull: boolean;
  isNew: boolean;
} {
  const p = ((phase % 1) + 1) % 1;

  // New Moon threshold (< 2% illuminated)
  if (p < 0.02 || p > 0.98) {
    return { pathD: '', isFull: false, isNew: true };
  }

  // Full Moon threshold (96% - 100% illuminated)
  if (p >= 0.48 && p <= 0.52) {
    return { pathD: '', isFull: true, isNew: false };
  }

  const cosTerm = Math.cos(p * 2 * Math.PI);
  const rx = Math.abs(r * cosTerm);

  // When cos(2*pi*p) > 0 (crescents near new moon), the terminator curves in the same
  // direction as the outer limb (sweep 0), creating a thin illuminated crescent.
  // When cos(2*pi*p) < 0 (gibbous near full moon), the terminator bulges outward (sweep 1).
  const termSweep = cosTerm > 0 ? 0 : 1;

  // Outer semicircle facing +X: from (0, -r) to (0, r)
  // Terminator elliptical arc returning from (0, r) back to (0, -r)
  const pathD = `M 0,${(-r).toFixed(2)} A ${r},${r} 0 0,1 0,${r.toFixed(2)} A ${rx.toFixed(2)},${r} 0 0,${termSweep} 0,${(-r).toFixed(2)} Z`;

  return { pathD, isFull: false, isNew: false };
}
