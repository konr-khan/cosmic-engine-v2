/**
 * @file generatorObserverCone.ts
 * Derives the topocentric observer sky cone, zenith ray, silhouette rays,
 * and tangent horizon disc for the Armillary & Astrolabe model.
 */

import { Latitude, Longitude } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp } from '../core';
import { ArmillaryRingVertex, ArmillaryObserverCone, ArmillaryProjectionMode, LaserRay } from './types';

export interface ComputeArmillaryObserverConeParams {
  orbitRingOpacity: number;
  latitude: Latitude;
  longitude: Longitude;
  timeOfDay?: number;
  gmstDeg?: number;
  obliquity?: number;
  blendedEarth3D: Vector3D;
  blendedSun3D: Vector3D;
  transformVertex: (p3d: Vector3D) => ArmillaryRingVertex;
  morphLambda?: number;
  projectionMode?: ArmillaryProjectionMode;
  r0?: number;
  cameraPitch?: number;
  cameraYaw?: number;
  sunDecDeg?: number;
  projectScreenPos?: (x: number, y: number, z: number) => Vector2D;
}

const NUM_DISC_SAMPLES = 72;
const PRECOMPUTED_CONE_TRIG = Array.from({ length: NUM_DISC_SAMPLES }, (_, k) => {
  const alphaK = (k / NUM_DISC_SAMPLES) * 2 * Math.PI;
  return {
    cos: Math.cos(alphaK),
    sin: Math.sin(alphaK)
  };
});

/**
 * Derives the topocentric observer sky cone, zenith ray, and tangent horizon disc.
 * Seamlessly morphs into volumetric laser projection rays across Phase B (morphLambda in (0.45, 1.0]).
 */
export function computeArmillaryObserverCone(params: ComputeArmillaryObserverConeParams): ArmillaryObserverCone | undefined {
  const {
    orbitRingOpacity,
    latitude,
    longitude,
    timeOfDay,
    gmstDeg,
    blendedEarth3D,
    blendedSun3D,
    transformVertex,
    morphLambda = 0.0,
    projectionMode = 'stereographic',
    r0 = 100,
    sunDecDeg
  } = params;

  if (orbitRingOpacity <= 0.05 && morphLambda <= 0.05) return undefined;

  const phi = toRadians(latitude);
  // Match MiniGlobe euler3d hourAngle convention: ((timeOfDay - 12) * 15) + longitude
  const hourAngleDeg = timeOfDay !== undefined
    ? (((timeOfDay - 12) * 15 + longitude) % 360 + 360) % 360
    : (((gmstDeg ?? 0) + longitude) % 360 + 360) % 360;
  const hRad = toRadians(hourAngleDeg);

  // Observer normal vector on Earth in body frame (matching MiniGlobe euler3d & ArmillaryWidget test)
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosH = Math.cos(hRad);
  const sinH = Math.sin(hRad);

  const nzX = cosPhi * sinH;
  const nzY = sinPhi;
  const nzZ = cosPhi * cosH;

  // Observer pin on Earth surface (radius 4.8 matching MiniGlobe globeRadius)
  const rEarth = 4.8;
  const pObs3D: Vector3D = {
    x: blendedEarth3D.x + rEarth * nzX,
    y: blendedEarth3D.y + rEarth * nzY,
    z: blendedEarth3D.z + rEarth * nzZ
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

  const rCanopy = 20;
  const phaseBU = clamp((morphLambda - 0.45) / 0.55, 0, 1);
  const oneMinusU = 1 - phaseBU;

  // Target focal screen position:
  // For stereographic/horizon: { x: 0, y: r0 * 1.2 }
  // For Rojas: { x: 0, y: 0 }
  const targetFocalY = projectionMode === 'rojas' ? 0 : r0 * 1.2;
  const fScreen: Vector2D = { x: 0, y: targetFocalY };

  // Morphed Apex: A(u) = (1 - phaseBU) * S_obs + phaseBU * F_screen
  const rawAx = oneMinusU * obsV.screenPos.x + phaseBU * fScreen.x;
  const rawAy = oneMinusU * obsV.screenPos.y + phaseBU * fScreen.y;
  const A: Vector2D = {
    x: rawAx === 0 ? 0 : rawAx,
    y: rawAy === 0 ? 0 : rawAy
  };

  const getScreenPos = params.projectScreenPos ?? ((x: number, y: number, z: number) => transformVertex({ x, y, z }).screenPos);

  // 1. Compute 72 rim vertices around the circumference
  const morphedPoints: Vector2D[] = new Array(NUM_DISC_SAMPLES + 1);

  // 5. Morphed zenith ray
  const rawZenithEndX = oneMinusU * zenithV.screenPos.x;
  const rawZenithEndY = oneMinusU * zenithV.screenPos.y;
  const zenithEnd: Vector2D = {
    x: rawZenithEndX === 0 ? 0 : rawZenithEndX,
    y: rawZenithEndY === 0 ? 0 : rawZenithEndY
  };

  const zDirX = zenithEnd.x - A.x;
  const zDirY = zenithEnd.y - A.y;
  const zDirLen = Math.hypot(zDirX, zDirY);
  const hasZDir = zDirLen >= 1e-4;

  let minCross = Infinity;
  let maxCross = -Infinity;
  let pLeft: Vector2D = A;
  let pRight: Vector2D = A;
  const fmt1 = (val: number) => Math.round(val * 10) / 10;

  const ruX = rCanopy * u.x;
  const ruY = rCanopy * u.y;
  const ruZ = rCanopy * u.z;
  const rwX = rCanopy * w.x;
  const rwY = rCanopy * w.y;
  const rwZ = rCanopy * w.z;

  const discCoords: string[] = new Array(NUM_DISC_SAMPLES);

  for (let k = 0; k < NUM_DISC_SAMPLES; k++) {
    const trig = PRECOMPUTED_CONE_TRIG[k];
    const cosA = trig.cos;
    const sinA = trig.sin;

    let pt: Vector2D;
    if (phaseBU === 0) {
      const px = pZenith3D.x + (ruX * cosA + rwX * sinA);
      const py = pZenith3D.y + (ruY * cosA + rwY * sinA);
      const pz = pZenith3D.z + (ruZ * cosA + rwZ * sinA);
      pt = getScreenPos(px, py, pz);
    } else if (phaseBU === 1) {
      pt = getScreenPos(r0 * cosA, 0, r0 * sinA);
    } else {
      const px = pZenith3D.x + (ruX * cosA + rwX * sinA);
      const py = pZenith3D.y + (ruY * cosA + rwY * sinA);
      const pz = pZenith3D.z + (ruZ * cosA + rwZ * sinA);
      const ScK = getScreenPos(px, py, pz);
      const SlK = getScreenPos(r0 * cosA, 0, r0 * sinA);
      const rx = oneMinusU * ScK.x + phaseBU * SlK.x;
      const ry = oneMinusU * ScK.y + phaseBU * SlK.y;
      pt = {
        x: rx === 0 ? 0 : rx,
        y: ry === 0 ? 0 : ry
      };
    }
    morphedPoints[k] = pt;

    const fx = fmt1(pt.x);
    const fy = fmt1(pt.y);
    discCoords[k] = `${fx} ${fy}`;

    if (k === 0) {
      pLeft = pt;
      pRight = pt;
    }

    if (hasZDir) {
      const vx = pt.x - A.x;
      const vy = pt.y - A.y;
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
  }

  // Close loop: index 72 matches index 0
  morphedPoints[NUM_DISC_SAMPLES] = morphedPoints[0];
  const joinedDisc = discCoords.join(' L ');
  const fmtAx = fmt1(A.x);
  const fmtAy = fmt1(A.y);
  const horizonDiscPathD = `M ${joinedDisc} Z`;
  const conePathD = `M ${fmtAx} ${fmtAy} L ${joinedDisc} L ${fmtAx} ${fmtAy} Z`;

  if (!hasZDir) {
    pLeft = morphedPoints[0] || A;
    pRight = morphedPoints[Math.floor(NUM_DISC_SAMPLES / 2)] || A;
  }

  // 4. Morphed 8 cardinal/intercardinal compass rays (indices: [0, 9, 18, 27, 36, 45, 54, 63])
  const RAY_INDICES = [0, 9, 18, 27, 36, 45, 54, 63];
  const laserRays: LaserRay[] = [];
  for (let j = 0; j < RAY_INDICES.length; j++) {
    const angleDeg = j * 45;
    const rayIdx = RAY_INDICES[j];
    laserRays.push({
      start: A,
      end: morphedPoints[rayIdx],
      color: angleDeg % 90 === 0 ? '#38bdf8' : '#fbbf24',
      opacity: 0.6
    });
  }

  const silhouetteLinesPathD = `M ${fmt1(A.x)} ${fmt1(A.y)} L ${fmt1(pLeft.x)} ${fmt1(pLeft.y)} M ${fmt1(A.x)} ${fmt1(A.y)} L ${fmt1(pRight.x)} ${fmt1(pRight.y)}`;

  // 7. Solar elevation angle for observer (Jean Meeus Chapter 13)
  const decRad = toRadians(sunDecDeg ?? 0);
  const sinAlt = sinPhi * Math.sin(decRad) + cosPhi * Math.cos(decRad) * cosH;
  const sunElevationDeg = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));
  const isDaytime = sunElevationDeg > -0.833;

  const label = phaseBU >= 0.8
    ? 'Projection Focal Beacon'
    : (isDaytime ? 'Observer Sky (Daylight)' : 'Observer Sky (Night Cosmos)');

  return {
    observerScreenPos: A,
    zenithScreenPos: zenithEnd,
    horizonDiscPathD,
    conePathD,
    silhouetteLinesPathD,
    zenithRay: { start: A, end: zenithEnd },
    isDaytime,
    sunElevationDeg: parseFloat(sunElevationDeg.toFixed(1)),
    label,
    morphProgress: phaseBU,
    laserRays
  };
}
