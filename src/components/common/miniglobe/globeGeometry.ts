/**
 * @file miniglobe/globeGeometry.ts
 * Pure view-mode geometry builders for MiniGlobe ('topdown', 'transverse', 'axial', 'euler3d').
 * Keeps MiniGlobe.tsx focused on SVG defs, layer composition, and pointer/ARIA wiring.
 */

import { toRadians, toDegrees } from '../../../types/units';
import { Vector3D } from '../../../types/coordinates';
import { calculateEarthSideGeometry, calculateEarthAxialGeometry } from '../../../utils/cosmicMath/projection';
import { rotateEuler3D } from '../../../utils/cosmicMath/armillary/coordinates';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG } from '../../../utils/cosmicMath';
import { MiniGlobeCamera, generateAnalyticalLimbPath } from '../../../utils/cosmicMath/globe';
import {
  TopdownGlobeGeometry,
  TransverseGlobeGeometry,
  AxialGlobeGeometry,
  EulerGlobeGeometry
} from './types';

export interface BuildTopdownGlobeGeometryParams {
  safeRadius: number;
  sunAngleDeg?: number;
  sunLambdaVal: number;
  epsRad: number;
  latVal: number;
  lonVal: number;
  todVal: number;
}

export function buildTopdownGlobeGeometry({
  safeRadius,
  sunAngleDeg,
  sunLambdaVal,
  epsRad,
  latVal,
  lonVal,
  todVal
}: BuildTopdownGlobeGeometryParams): TopdownGlobeGeometry {
  const angleDeg = sunAngleDeg !== undefined && Number.isFinite(Number(sunAngleDeg))
    ? Number(sunAngleDeg)
    : ((180 - sunLambdaVal) % 360);
  const angleRad = toRadians(angleDeg);

  // Semicircular daylight path rotated by angleDeg
  const a1 = angleRad - Math.PI / 2;
  const a2 = angleRad + Math.PI / 2;
  const x1 = safeRadius * Math.cos(a1);
  const y1 = safeRadius * Math.sin(a1);
  const x2 = safeRadius * Math.cos(a2);
  const y2 = safeRadius * Math.sin(a2);

  const dayPath = safeRadius > 0
    ? `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${safeRadius} ${safeRadius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    : '';

  // Equator and Tropics in Top-Down (ellipses tilted by obliquity along Y)
  const eqRy = safeRadius * Math.cos(epsRad);
  const tropRy = safeRadius * Math.cos(epsRad) * Math.cos(epsRad);
  const tropShiftY = safeRadius * Math.sin(epsRad) * Math.cos(epsRad);

  // Observer Pin in Top-Down (Sun-aligned diurnal frame)
  const latRad = toRadians(latVal);
  const hourAngleDeg = ((todVal - 12) * 15) + lonVal;
  const hRad = toRadians(hourAngleDeg);
  const theta = angleRad - hRad;

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);

  const xEq = cosLat * Math.cos(theta);
  const yEq = cosLat * Math.sin(theta);
  const zEq = sinLat;

  const xecl = xEq;
  const yecl = -yEq * Math.cos(epsRad) + zEq * Math.sin(epsRad);
  const zecl = yEq * Math.sin(epsRad) + zEq * Math.cos(epsRad);

  const obsPx = safeRadius * xecl;
  const obsPy = -safeRadius * yecl;
  const isDaylight = safeRadius > 0
    ? (obsPx * Math.cos(angleRad) + obsPy * Math.sin(angleRad)) > 0
    : false;

  return {
    dayPath,
    eqRy,
    tropRy,
    tropShiftY,
    obsPx,
    obsPy,
    isDaylight,
    isFrontVisible: zecl >= -0.2
  };
}

export function buildTransverseGlobeGeometry(
  safeRadius: number,
  sunLambdaVal: number,
  latVal: number,
  todVal: number,
  lonVal: number
): TransverseGlobeGeometry {
  const sideGeom = calculateEarthSideGeometry(0, 0, safeRadius, sunLambdaVal, latVal, todVal, lonVal);
  const dayPath = safeRadius > 0 ? `M 0 -${safeRadius} A ${safeRadius} ${safeRadius} 0 0 0 0 ${safeRadius} Z` : '';

  return {
    sideGeom,
    dayPath
  };
}

export function buildAxialGlobeGeometry(
  safeRadius: number,
  sunLambdaVal: number,
  latVal: number,
  todVal: number,
  lonVal: number
): AxialGlobeGeometry {
  return calculateEarthAxialGeometry(0, 0, safeRadius, sunLambdaVal, latVal, todVal, lonVal);
}

export interface BuildEulerGlobeGeometryParams {
  safeRadius: number;
  camera?: MiniGlobeCamera;
  declination?: number;
  sunLambdaVal: number;
  showTwilightBands: boolean;
  latVal: number;
  lonVal: number;
  todVal: number;
}

function sampleMeridianCurvePath(
  safeRadius: number,
  hourAngleRad: number,
  pitch: number,
  yaw: number,
  roll: number,
  northToSouth: boolean
): string {
  const NUM_MERIDIAN_SAMPLES = 48;
  const sinH = Math.sin(hourAngleRad);
  const cosH = Math.cos(hourAngleRad);
  let path = '';

  for (let i = 0; i <= NUM_MERIDIAN_SAMPLES; i++) {
    const latDeg = northToSouth
      ? 90 - (i / NUM_MERIDIAN_SAMPLES) * 180
      : -90 + (i / NUM_MERIDIAN_SAMPLES) * 180;
    const phiRad = toRadians(latDeg);
    const sinPhi = Math.sin(phiRad);
    const cosPhi = Math.cos(phiRad);
    const ptCam = rotateEuler3D(
      {
        x: cosPhi * sinH,
        y: sinPhi,
        z: cosPhi * cosH
      },
      pitch,
      yaw,
      roll
    );
    const px = (safeRadius * ptCam.x).toFixed(2);
    const py = (-safeRadius * ptCam.y).toFixed(2);
    path += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }

  return path.trim();
}

export function buildEulerGlobeGeometry({
  safeRadius,
  camera,
  declination,
  sunLambdaVal,
  showTwilightBands,
  latVal,
  lonVal,
  todVal
}: BuildEulerGlobeGeometryParams): EulerGlobeGeometry {
  const pitch = Number.isFinite(Number(camera?.pitch)) ? Number(camera?.pitch) : 0;
  const yaw = Number.isFinite(Number(camera?.yaw)) ? Number(camera?.yaw) : 0;
  const roll = Number.isFinite(Number(camera?.roll)) ? Number(camera?.roll) : 0;

  // Rotated Polar Axis (North Pole is at Y = +1 in Earth equatorial frame)
  const poleCam = rotateEuler3D({ x: 0, y: 1, z: 0 }, pitch, yaw, roll);
  const poleLen = Math.hypot(poleCam.x, poleCam.y);
  const polePx = poleLen > 1e-4 ? (poleCam.x / poleLen) * safeRadius : 0;
  const polePy = poleLen > 1e-4 ? -(poleCam.y / poleLen) * safeRadius : -safeRadius;

  // Subsolar vector in camera coordinates
  const decVal = Number.isFinite(Number(declination))
    ? Number(declination)
    : (sunLambdaVal
        ? toDegrees(
            Math.asin(
              Math.max(
                -1,
                Math.min(
                  1,
                  Math.sin(toRadians(Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG))) *
                    Math.sin(toRadians(sunLambdaVal))
                )
              )
            )
          )
        : 0);
  const decRad = toRadians(decVal);
  const sEq: Vector3D = {
    x: 0,
    y: Math.sin(decRad),
    z: Math.cos(decRad)
  };
  const sCam = rotateEuler3D(sEq, pitch, yaw, roll);

  const dayPath = generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, 0);
  const civilPath = showTwilightBands ? generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, -6) : '';
  const nauticalPath = showTwilightBands ? generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, -12) : '';
  const astroPath = showTwilightBands ? generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, -18) : '';

  // Observer Pin in camera coordinates (matching continents in body frame)
  const latRad = toRadians(latVal);
  const hourAngleDeg = ((todVal - 12) * 15) + lonVal;
  const hRad = toRadians(hourAngleDeg);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinH = Math.sin(hRad);
  const cosH = Math.cos(hRad);

  const pObsCam = rotateEuler3D(
    {
      x: cosLat * sinH,
      y: sinLat,
      z: cosLat * cosH
    },
    pitch,
    yaw,
    roll
  );

  const obsPx = safeRadius * pObsCam.x;
  const obsPy = -safeRadius * pObsCam.y;
  const isObsDay = (Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad)) > 0;

  // 0° Prime Meridian (Greenwich) & 180° Antimeridian Curves
  const h0Rad = toRadians((todVal - 12) * 15);
  const primeMeridianPath = sampleMeridianCurvePath(safeRadius, h0Rad, pitch, yaw, roll, false);
  const antimeridianPath = sampleMeridianCurvePath(safeRadius, h0Rad + Math.PI, pitch, yaw, roll, true);

  return {
    dayPath,
    civilPath,
    nauticalPath,
    astroPath,
    polePx,
    polePy,
    obsPx,
    obsPy,
    isObsDay,
    isObsVisible: pObsCam.z >= 0,
    primeMeridianPath,
    antimeridianPath
  };
}
