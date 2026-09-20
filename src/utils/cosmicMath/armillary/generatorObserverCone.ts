/**
 * @file generatorObserverCone.ts
 * Derives the topocentric observer sky cone, zenith ray, silhouette rays,
 * and tangent horizon disc for the Armillary & Astrolabe model.
 */

import { Latitude, Longitude } from '../../../types/units';
import { Vector2D, Vector3D } from '../../../types/coordinates';
import { toRadians, toDegrees, clamp } from '../core';
import { ArmillaryRingVertex, ArmillaryObserverCone } from './types';

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
}

/**
 * Derives the topocentric observer sky cone, zenith ray, and tangent horizon disc.
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
    transformVertex
  } = params;

  if (orbitRingOpacity <= 0.05) return undefined;

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
  const zDirLen = Math.hypot(zDirX, zDirY);

  let pLeft: Vector2D;
  let pRight: Vector2D;

  if (zDirLen < 1e-4) {
    // When camera sightline looks directly down the zenith ray, use opposite rim points to prevent ray collapse
    pLeft = canopyPoints[0] || obsV.screenPos;
    pRight = canopyPoints[Math.floor(NUM_DISC_SAMPLES / 2)] || obsV.screenPos;
  } else {
    let minCross = Infinity;
    let maxCross = -Infinity;
    pLeft = canopyPoints[0] || obsV.screenPos;
    pRight = canopyPoints[0] || obsV.screenPos;

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
