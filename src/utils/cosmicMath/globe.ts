/**
 * @file globe.ts
 * Pure mathematical algorithms for 3D Earth spherical projection, analytical limb clipping,
 * and rotational vector landmass rendering.
 */

import { Degrees, toRadians } from '../../types/units';
import { Vector3D } from '../../types/coordinates';
import { clamp } from './core';
import { rotateEuler3D } from './armillary/coordinates';

export type MiniGlobeViewMode = 
  | 'topdown'
  | 'transverse'
  | 'axial'
  | 'euler3d'
  | 'flat';

export interface MiniGlobeCamera {
  pitch?: Degrees | number;
  yaw?: Degrees | number;
  roll?: Degrees | number;
}

/**
 * Projects 2D geographic landmass polygons onto 3D Earth sphere and clips to visible front hemisphere.
 * 
 * @param landmasses - Array of [lonDeg, latDeg] polygon rings
 * @param radius - Globe display radius in SVG pixels
 * @param viewMode - Canonical projection mode
 * @param todVal - Time of day in decimal hours (0..24)
 * @param epsRad - Axial obliquity in radians
 * @param sunLambdaVal - Solar ecliptic longitude in degrees
 * @param camera - Optional 3D Euler camera angles
 * @returns Array of SVG path `d` strings for visible polygon facets
 */
export function projectContinentLandmasses(
  landmasses: [number, number][][],
  radius: number,
  viewMode: MiniGlobeViewMode,
  todVal: number,
  epsRad: number,
  sunLambdaVal: number,
  camera?: MiniGlobeCamera
): string[] {
  if (radius <= 0 || viewMode === 'flat') return [];

  const paths: string[] = [];

  for (const poly of landmasses) {
    if (poly.length < 3) continue;

    // 1. Transform each vertex to 3D unit coordinates in camera frame
    const vertices3D: Vector3D[] = poly.map(([lonDeg, latDeg]) => {
      const latRad = toRadians(latDeg);
      const hourAngleDeg = ((todVal - 12) * 15) + lonDeg;
      const hRad = toRadians(hourAngleDeg);

      if (viewMode === 'euler3d') {
        const pitch = Number.isFinite(Number(camera?.pitch)) ? Number(camera?.pitch) : 0;
        const yaw = Number.isFinite(Number(camera?.yaw)) ? Number(camera?.yaw) : 0;
        const roll = Number.isFinite(Number(camera?.roll)) ? Number(camera?.roll) : 0;

        const xBody = Math.cos(latRad) * Math.sin(hRad);
        const yBody = Math.sin(latRad);
        const zBody = Math.cos(latRad) * Math.cos(hRad);

        return rotateEuler3D({ x: xBody, y: yBody, z: zBody }, pitch, yaw, roll);
      }

      if (viewMode === 'topdown') {
        const xb = Math.cos(latRad) * Math.sin(hRad);
        const yb = Math.cos(latRad) * Math.cos(hRad);
        const zb = Math.sin(latRad);

        const xecl = xb;
        const yecl = yb * Math.cos(epsRad) - zb * Math.sin(epsRad);
        const zecl = yb * Math.sin(epsRad) + zb * Math.cos(epsRad);
        return { x: xecl, y: yecl, z: zecl };
      }

      if (viewMode === 'transverse') {
        const sunLambdaRad = toRadians(sunLambdaVal);
        const thetaSide = epsRad * Math.sin(sunLambdaRad);
        const xBody = -Math.cos(latRad) * Math.cos(hRad);
        const yBody = Math.sin(latRad);
        const zBody = Math.cos(latRad) * Math.sin(hRad);

        const xProj = xBody * Math.cos(thetaSide) - yBody * Math.sin(thetaSide);
        const yProj = xBody * Math.sin(thetaSide) + yBody * Math.cos(thetaSide);
        const zProj = zBody;
        return { x: xProj, y: yProj, z: zProj };
      }

      if (viewMode === 'axial') {
        const sunLambdaRad = toRadians(sunLambdaVal);
        const nx = -Math.sin(epsRad) * Math.cos(sunLambdaRad);
        const ny = Math.cos(epsRad);
        const nz = -Math.sin(epsRad) * Math.sin(sunLambdaRad);
        const nLen = Math.max(1e-6, Math.sqrt(nx * nx + ny * ny));

        const ux = ny / nLen;
        const uy = -nx / nLen;
        const vx = (nx * nz) / nLen;
        const vy = (ny * nz) / nLen;

        const xBody = Math.cos(latRad) * Math.sin(hRad);
        const yBody = Math.sin(latRad);
        const zBody = Math.cos(latRad) * Math.cos(hRad);

        const xProj = xBody * ux + yBody * nx - zBody * vx;
        const yProj = xBody * uy + yBody * ny - zBody * vy;
        const zProj = yBody * nz + zBody * nLen;
        return { x: xProj, y: yProj, z: zProj };
      }

      return { x: 0, y: 0, z: 0 };
    });

    // 2. Clip edges to front hemisphere (z >= -0.02)
    const clippedPts: { x: number; y: number }[] = [];
    const n = vertices3D.length;

    for (let i = 0; i < n; i++) {
      const curr = vertices3D[i];
      const next = vertices3D[(i + 1) % n];

      const currIn = curr.z >= -0.02;
      const nextIn = next.z >= -0.02;

      if (currIn) {
        clippedPts.push({ x: radius * curr.x, y: -radius * curr.y });
      }

      if (currIn !== nextIn) {
        const dz = next.z - curr.z;
        if (Math.abs(dz) > 1e-6) {
          const t = (-0.02 - curr.z) / dz;
          if (t >= 0 && t <= 1) {
            const ix = (1 - t) * curr.x + t * next.x;
            const iy = (1 - t) * curr.y + t * next.y;
            const iz = (1 - t) * curr.z + t * next.z;
            const len = Math.hypot(ix, iy, iz) || 1;
            clippedPts.push({ x: radius * (ix / len), y: -radius * (iy / len) });
          }
        }
      }
    }

    if (clippedPts.length >= 3) {
      let d = `M ${clippedPts[0].x.toFixed(2)} ${clippedPts[0].y.toFixed(2)} `;
      for (let k = 1; k < clippedPts.length; k++) {
        d += `L ${clippedPts[k].x.toFixed(2)} ${clippedPts[k].y.toFixed(2)} `;
      }
      d += 'Z';
      paths.push(d);
    }
  }

  return paths;
}

/**
 * Analytical spherical limb intersection algorithm for non-tearing daylight and twilight paths.
 * Directly transforms subsolar coordinates in camera frame into closed SVG arc geometries.
 * 
 * @param radius - Globe radius in SVG pixels
 * @param sx - Subsolar unit vector X in camera frame
 * @param sy - Subsolar unit vector Y in camera frame
 * @param sz - Subsolar unit vector Z in camera frame
 * @param thresholdDeg - Solar elevation threshold in degrees (0 for daylight, -6 civil, -12 nautical, -18 astro)
 * @returns SVG path string
 */
export function generateAnalyticalLimbPath(
  radius: number,
  sx: number,
  sy: number,
  sz: number,
  thresholdDeg: number = 0
): string {
  if (radius <= 0) return '';

  const h0Rad = toRadians(thresholdDeg);
  const sinH0 = Math.sin(h0Rad);
  const cosH0 = Math.cos(h0Rad);

  const sPerpSq = sx * sx + sy * sy;
  const sPerp = Math.sqrt(sPerpSq);

  // Singular pole case (Sun purely along Z-axis)
  if (sPerp < 1e-6) {
    if (sz >= sinH0) {
      return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
    }
    return '';
  }

  // Orthonormal basis in camera space
  const ux = -sy / sPerp;
  const uy = sx / sPerp;
  const vx = -sx * sz / sPerp;
  const vy = -sy * sz / sPerp;

  const denom = cosH0 * sPerp;
  if (Math.abs(denom) < 1e-9) {
    if (sz >= sinH0) {
      return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
    }
    return '';
  }
  const mu = -(sinH0 * sz) / denom;

  // Case A: Entire terminator on backside
  if (mu >= 1) {
    if (sz >= sinH0) {
      return `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z`;
    }
    return '';
  }

  // Case B: Entire terminator circle on front hemisphere
  if (mu <= -1) {
    const NUM_SAMPLES = 48;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const phi = (i / NUM_SAMPLES) * 2 * Math.PI;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const px = cosH0 * cosPhi * ux + cosH0 * sinPhi * vx + sinH0 * sx;
      const py = cosH0 * cosPhi * uy + cosH0 * sinPhi * vy + sinH0 * sy;
      pts.push({ x: radius * px, y: -radius * py });
    }

    if (sz >= 0) {
      let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
      for (let i = 1; i < pts.length; i++) {
        d += `L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} `;
      }
      return d + 'Z';
    } else {
      let d = `M 0 -${radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 -${radius} Z `;
      d += `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
      for (let i = pts.length - 1; i >= 0; i--) {
        d += `L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} `;
      }
      return d + 'Z';
    }
  }

  // Case C: Terminator intersects limb at 2 points
  const phi0 = Math.asin(clamp(mu, -1, 1));
  const phiStart = phi0;
  const phiEnd = Math.PI - phi0;

  const NUM_ARC = 36;
  const frontPts: { x: number; y: number; px: number; py: number }[] = [];
  for (let i = 0; i <= NUM_ARC; i++) {
    const phi = phiStart + (i / NUM_ARC) * (phiEnd - phiStart);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const px = cosH0 * cosPhi * ux + cosH0 * sinPhi * vx + sinH0 * sx;
    const py = cosH0 * cosPhi * uy + cosH0 * sinPhi * vy + sinH0 * sy;
    frontPts.push({ x: radius * px, y: -radius * py, px, py });
  }

  const endPt = frontPts[frontPts.length - 1];
  const startPt = frontPts[0];
  const thetaEnd = Math.atan2(endPt.py, endPt.px);
  const thetaStart = Math.atan2(startPt.py, startPt.px);

  let deltaTheta = thetaStart - thetaEnd;
  while (deltaTheta <= 0) deltaTheta += 2 * Math.PI;

  const midTheta1 = thetaEnd + deltaTheta / 2;
  const illum1 = Math.cos(midTheta1) * sx + Math.sin(midTheta1) * sy;
  let rimSweep = deltaTheta;
  if (illum1 < sinH0) {
    rimSweep = deltaTheta - 2 * Math.PI;
  }

  let path = `M ${frontPts[0].x.toFixed(2)} ${frontPts[0].y.toFixed(2)} `;
  for (let i = 1; i < frontPts.length; i++) {
    path += `L ${frontPts[i].x.toFixed(2)} ${frontPts[i].y.toFixed(2)} `;
  }

  const NUM_RIM = 24;
  for (let j = 1; j <= NUM_RIM; j++) {
    const theta = thetaEnd + (j / NUM_RIM) * rimSweep;
    const rimX = radius * Math.cos(theta);
    const rimY = -radius * Math.sin(theta);
    path += `L ${rimX.toFixed(2)} ${rimY.toFixed(2)} `;
  }

  return path + 'Z';
}
