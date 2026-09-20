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
}

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
    r0 = 100
  } = params;

  if (orbitRingOpacity <= 0.05 && morphLambda <= 0.05) return undefined;

  const phi = toRadians(latitude);
  // Match MiniGlobe euler3d hourAngle convention: ((timeOfDay - 12) * 15) + longitude
  const hourAngleDeg = timeOfDay !== undefined
    ? (((timeOfDay - 12) * 15 + longitude) % 360 + 360) % 360
    : (((gmstDeg ?? 0) + longitude) % 360 + 360) % 360;
  const hRad = toRadians(hourAngleDeg);

  // Observer normal vector on Earth in Armillary frame (where North Pole is +Y, matching MiniGlobe euler3d)
  const nzX = Math.cos(phi) * Math.sin(hRad);
  const nzY = Math.sin(phi);
  const nzZ = Math.cos(phi) * Math.cos(hRad);

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

  const NUM_DISC_SAMPLES = 72;
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
    x: Object.is(rawAx, -0) ? 0 : rawAx,
    y: Object.is(rawAy, -0) ? 0 : rawAy
  };

  // 1. Compute 72 rim vertices around the circumference
  const morphedPoints: Vector2D[] = [];
  for (let k = 0; k < NUM_DISC_SAMPLES; k++) {
    const alphaK = (k / NUM_DISC_SAMPLES) * 2 * Math.PI;
    const cosA = Math.cos(alphaK);
    const sinA = Math.sin(alphaK);

    // Celestial canopy point around zenith tip
    const pt3D: Vector3D = {
      x: pZenith3D.x + rCanopy * (u.x * cosA + w.x * sinA),
      y: pZenith3D.y + rCanopy * (u.y * cosA + w.y * sinA),
      z: pZenith3D.z + rCanopy * (u.z * cosA + w.z * sinA)
    };
    const ScK = transformVertex(pt3D).screenPos;

    if (phaseBU === 0) {
      morphedPoints.push(ScK);
    } else {
      // Plate base ring vertex in equatorial plane
      const l3D: Vector3D = {
        x: r0 * cosA,
        y: 0,
        z: r0 * sinA
      };
      const SlK = transformVertex(l3D).screenPos;
      const px = oneMinusU * ScK.x + phaseBU * SlK.x;
      const py = oneMinusU * ScK.y + phaseBU * SlK.y;
      morphedPoints.push({
        x: Object.is(px, -0) ? 0 : px,
        y: Object.is(py, -0) ? 0 : py
      });
    }
  }

  // Close loop: index 72 matches index 0
  morphedPoints.push(morphedPoints[0]);

  // 2. Continuous closed disc path (Horizon tangent disc -> Astrolabe plate base rim)
  let horizonDiscPathD = '';
  if (morphedPoints.length > 0) {
    horizonDiscPathD = `M ${morphedPoints[0].x.toFixed(1)} ${morphedPoints[0].y.toFixed(1)} `;
    for (let i = 1; i < morphedPoints.length; i++) {
      horizonDiscPathD += `L ${morphedPoints[i].x.toFixed(1)} ${morphedPoints[i].y.toFixed(1)} `;
    }
    horizonDiscPathD += 'Z';
  }

  // 3. Volumetric conical fill envelope connecting Apex A to the outer rim
  let conePathD = `M ${A.x.toFixed(1)} ${A.y.toFixed(1)} `;
  for (let i = 0; i < morphedPoints.length; i++) {
    conePathD += `L ${morphedPoints[i].x.toFixed(1)} ${morphedPoints[i].y.toFixed(1)} `;
  }
  conePathD += `L ${A.x.toFixed(1)} ${A.y.toFixed(1)} Z`;

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

  // 5. Morphed zenith ray
  const rawZenithEndX = oneMinusU * zenithV.screenPos.x;
  const rawZenithEndY = oneMinusU * zenithV.screenPos.y;
  const zenithEnd: Vector2D = {
    x: Object.is(rawZenithEndX, -0) ? 0 : rawZenithEndX,
    y: Object.is(rawZenithEndY, -0) ? 0 : rawZenithEndY
  };

  // 6. Silhouette rays connecting Apex A to extreme tangent points of the rim
  const zDirX = zenithEnd.x - A.x;
  const zDirY = zenithEnd.y - A.y;
  const zDirLen = Math.hypot(zDirX, zDirY);

  let pLeft: Vector2D;
  let pRight: Vector2D;

  if (zDirLen < 1e-4) {
    pLeft = morphedPoints[0] || A;
    pRight = morphedPoints[Math.floor(NUM_DISC_SAMPLES / 2)] || A;
  } else {
    let minCross = Infinity;
    let maxCross = -Infinity;
    pLeft = morphedPoints[0] || A;
    pRight = morphedPoints[0] || A;

    for (let i = 0; i < NUM_DISC_SAMPLES; i++) {
      const pt = morphedPoints[i];
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

  const silhouetteLinesPathD = `M ${A.x.toFixed(1)} ${A.y.toFixed(1)} L ${pLeft.x.toFixed(1)} ${pLeft.y.toFixed(1)} M ${A.x.toFixed(1)} ${A.y.toFixed(1)} L ${pRight.x.toFixed(1)} ${pRight.y.toFixed(1)}`;

  // 7. Solar elevation angle for observer
  const sunDir = {
    x: blendedSun3D.x - blendedEarth3D.x,
    y: blendedSun3D.y - blendedEarth3D.y,
    z: blendedSun3D.z - blendedEarth3D.z
  };
  const sunLen = Math.sqrt(sunDir.x * sunDir.x + sunDir.y * sunDir.y + sunDir.z * sunDir.z) || 1;
  const sinAlt = (nzX * sunDir.x + nzY * sunDir.y + nzZ * sunDir.z) / sunLen;
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
