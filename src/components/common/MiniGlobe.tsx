/**
 * @file MiniGlobe.tsx
 * Reusable, high-precision SVG Earth Mini-Globe component for Cosmic Engine V2.0.
 * 
 * Supports 5 canonical projection view modes:
 * - 'topdown': Heliocentric Keplerian Macro Orbit (illuminated sunward semicircle, 23.44° tilt)
 * - 'transverse': Geocentric side-on transverse profile (Eclipse left pane)
 * - 'axial': Geocentric down-the-barrel sightline (Eclipse right pane)
 * - 'euler3d': Free 3D Euler camera rotation with analytical limb clipping (Armillary 3D Apparent)
 * - 'flat': 2D flattened astrolabe plate pin (Astrolabe Rete/Rojas/Horizon)
 */

import React, { useId, useMemo } from 'react';
import { Degrees, Latitude, Longitude, HoursDecimal, toRadians } from '../../types/units';
import { Vector3D } from '../../types/coordinates';
import { calculateEarthSideGeometry, calculateEarthAxialGeometry } from '../../utils/cosmicMath/projection';
import { rotatePointEuler3D } from '../../utils/cosmicMath/scene/transforms';
import { WORLD_LANDMASSES } from '../../utils/cosmicMath/geoData';

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

export interface MiniGlobeProps {
  /** Center X position in SVG user coordinates (default: 0) */
  cx?: number;
  /** Center Y position in SVG user coordinates (default: 0) */
  cy?: number;
  /** Radius of the globe disc in SVG user coordinates (default: 12) */
  radius?: number;

  /** Projection view mode (default: 'topdown') */
  viewMode?: MiniGlobeViewMode;

  /** Solar ecliptic longitude λ_sun in degrees (0° = March Equinox, 90° = June Solstice) */
  sunLambdaDeg?: Degrees | number;

  /** In-plane solar illumination angle in degrees (0° = +X Right, 90° = +Y Down, 180° = -X Left, 270° = -Y Up). If omitted, derived from viewMode & sunLambdaDeg */
  sunAngleDeg?: Degrees | number;

  /** 3D Subsolar unit illumination vector (for spherical illumination) */
  subsolarVector?: Vector3D;

  /** Solar declination in degrees (for equatorial coordinate systems) */
  declination?: Degrees | number;

  /** Solar Right Ascension in degrees */
  rightAscension?: Degrees | number;

  /** 3D Euler camera angles (used in 'euler3d' mode) */
  camera?: MiniGlobeCamera;

  /** Observer geographic latitude in degrees (-90 to +90) */
  latitude?: Latitude | number;
  /** Observer geographic longitude in degrees (-180 to +180) */
  longitude?: Longitude | number;
  /** Observer local mean solar time in decimal hours (0 to 24) */
  timeOfDay?: HoursDecimal | number;

  /** Earth axial obliquity ε in degrees (default: 23.439281°) */
  obliquityDeg?: Degrees | number;

  /** Layer visibility toggles */
  showTerminator?: boolean;     // Day/Night illuminated hemisphere (default: true)
  showTwilightBands?: boolean;  // Civil, Nautical, Astronomical twilight bands (default: true in euler3d)
  showContinents?: boolean;     // 3D Rotational vector world continents (default: true)
  showParallels?: boolean;      // Equator and Tropics of Cancer/Capricorn (default: true)
  showPolarAxis?: boolean;      // 23.44° Rotational polar axis line (default: true)
  showObserverPin?: boolean;    // Observer location pin "YOU" (default: true)
  showAtmosphereGlow?: boolean; // Outer cyan atmospheric glow halo (default: true)
  showLabel?: boolean;          // Monospace text label below globe (default: false)
  label?: string;               // Custom label string (default: "EARTH")

  /** Styling & Event Handlers */
  className?: string;
  id?: string;
  onPointerEnter?: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerLeave?: (e: React.PointerEvent<SVGGElement>) => void;
  onClick?: (e: React.MouseEvent<SVGGElement>) => void;
}

/**
 * Projects 2D geographic landmass polygons onto 3D Earth sphere and clips to visible front hemisphere.
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

        const pEq: Vector3D = {
          x: Math.cos(latRad) * Math.cos(hRad),
          y: Math.cos(latRad) * Math.sin(hRad),
          z: Math.sin(latRad)
        };
        return rotatePointEuler3D(pEq, pitch, yaw, roll);
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
        const zProj = -zBody;
        return { x: xProj, y: yProj, z: zProj };
      }

      if (viewMode === 'axial') {
        const sunLambdaRad = toRadians(sunLambdaVal);
        const nx = -Math.sin(epsRad) * Math.cos(sunLambdaRad);
        const ny = Math.cos(epsRad);
        const nz = -Math.sin(epsRad) * Math.sin(sunLambdaRad);
        const nLen = Math.sqrt(nx * nx + ny * ny) || 1;

        const ux = ny / nLen;
        const uy = -nx / nLen;
        const vx = (nx * nz) / nLen;
        const vy = (ny * nz) / nLen;

        const xBody = Math.cos(latRad) * Math.cos(hRad);
        const yBody = Math.cos(latRad) * Math.sin(hRad);
        const zBody = Math.sin(latRad);

        const xProj = xBody * ux + yBody * vx + zBody * (nx / nLen);
        const yProj = xBody * uy + yBody * vy + zBody * (ny / nLen);
        const zProj = -yBody * nLen + zBody * (nz / nLen);
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
 */
function generateAnalyticalLimbPath(
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
  const phi0 = Math.asin(mu);
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

export const MiniGlobe: React.FC<MiniGlobeProps> = ({
  cx = 0,
  cy = 0,
  radius = 12,
  viewMode = 'topdown',
  sunLambdaDeg = 0,
  sunAngleDeg,
  subsolarVector,
  declination = 0,
  rightAscension = 0,
  camera,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12.0,
  obliquityDeg = 23.439281,
  showTerminator = true,
  showTwilightBands = true,
  showContinents = true,
  showParallels = true,
  showPolarAxis = true,
  showObserverPin = true,
  showAtmosphereGlow = true,
  showLabel = false,
  label = 'EARTH',
  className = '',
  id,
  onPointerEnter,
  onPointerLeave,
  onClick
}) => {
  // Unique SVG IDs using React useId() to prevent DOM collisions across multiple instances
  const rawId = useId();
  const safeId = rawId.replace(/[:/]/g, '_');
  const uid = id ? `${id}-${safeId}` : `globe-${safeId}`;

  const clipPathId = `${uid}-clip`;
  const atmoGradId = `${uid}-atmo-grad`;
  const dayGradId = `${uid}-day-grad`;

  const safeRadius = Math.max(0, Number(radius) || 0);
  const safeObliquity = Number.isFinite(Number(obliquityDeg)) ? Number(obliquityDeg) : 23.439281;
  const epsRad = toRadians(safeObliquity);
  const sunLambdaVal = Number.isFinite(Number(sunLambdaDeg)) ? Number(sunLambdaDeg) : 0;
  const latVal = Number.isFinite(Number(latitude)) ? Number(latitude) : 0;
  const lonVal = Number.isFinite(Number(longitude)) ? Number(longitude) : 0;
  const todVal = Number.isFinite(Number(timeOfDay)) ? Number(timeOfDay) : 12;

  // -------------------------------------------------------------
  // Geometry Derivations per View Mode
  // -------------------------------------------------------------

  // 1. TOPDOWN MODE
  const topdownGeometry = useMemo(() => {
    if (viewMode !== 'topdown') return null;

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

    // Observer Pin in Top-Down
    const latRad = toRadians(latVal);
    const hourAngleDeg = ((todVal - 12) * 15) + lonVal;
    const hRad = toRadians(hourAngleDeg);

    const xb = Math.cos(latRad) * Math.sin(hRad);
    const yb = Math.cos(latRad) * Math.cos(hRad);
    const zb = Math.sin(latRad);

    const xecl = xb;
    const yecl = yb * Math.cos(epsRad) - zb * Math.sin(epsRad);
    const zecl = yb * Math.sin(epsRad) + zb * Math.cos(epsRad);

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
  }, [viewMode, safeRadius, sunAngleDeg, sunLambdaVal, epsRad, latVal, lonVal, todVal]);

  // 2. TRANSVERSE MODE (Eclipse Left Pane)
  const transverseGeometry = useMemo(() => {
    if (viewMode !== 'transverse') return null;
    const sideGeom = calculateEarthSideGeometry(0, 0, safeRadius, sunLambdaVal, latVal, todVal, lonVal);
    const dayPath = safeRadius > 0 ? `M 0 -${safeRadius} A ${safeRadius} ${safeRadius} 0 0 0 0 ${safeRadius} Z` : '';

    return {
      sideGeom,
      dayPath
    };
  }, [viewMode, safeRadius, sunLambdaVal, latVal, todVal, lonVal]);

  // 3. AXIAL MODE (Eclipse Right Pane)
  const axialGeometry = useMemo(() => {
    if (viewMode !== 'axial') return null;
    return calculateEarthAxialGeometry(0, 0, safeRadius, sunLambdaVal, latVal, todVal, lonVal);
  }, [viewMode, safeRadius, sunLambdaVal, latVal, todVal, lonVal]);

  // 4. EULER3D MODE (Armillary 3D Apparent Mode)
  const eulerGeometry = useMemo(() => {
    if (viewMode !== 'euler3d') return null;

    const pitch = Number.isFinite(Number(camera?.pitch)) ? Number(camera?.pitch) : 0;
    const yaw = Number.isFinite(Number(camera?.yaw)) ? Number(camera?.yaw) : 0;
    const roll = Number.isFinite(Number(camera?.roll)) ? Number(camera?.roll) : 0;

    // Subsolar vector in Equatorial coordinates
    let sEq: Vector3D;
    if (subsolarVector) {
      sEq = subsolarVector;
    } else {
      const decRad = toRadians(Number.isFinite(Number(declination)) ? Number(declination) : 0);
      const raRad = toRadians(Number.isFinite(Number(rightAscension)) ? Number(rightAscension) : 0);
      sEq = {
        x: Math.cos(decRad) * Math.cos(raRad),
        y: Math.cos(decRad) * Math.sin(raRad),
        z: Math.sin(decRad)
      };
    }

    // Transform subsolar vector to camera coordinates
    const sCam = rotatePointEuler3D(sEq, pitch, yaw, roll);

    const dayPath = generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, 0);
    const civilPath = showTwilightBands ? generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, -6) : '';
    const nauticalPath = showTwilightBands ? generateAnalyticalLimbPath(safeRadius, sCam.x, sCam.y, sCam.z, -12) : '';

    // Rotated Polar Axis
    const poleCam = rotatePointEuler3D({ x: 0, y: 0, z: 1 }, pitch, yaw, roll);
    const poleLen = Math.hypot(poleCam.x, poleCam.y);
    const polePx = poleLen > 1e-4 ? (poleCam.x / poleLen) * safeRadius : 0;
    const polePy = poleLen > 1e-4 ? -(poleCam.y / poleLen) * safeRadius : -safeRadius;

    // Observer Pin
    const latRad = toRadians(latVal);
    const hourAngleDeg = ((todVal - 12) * 15) + lonVal;
    const hRad = toRadians(hourAngleDeg);
    const pObsEq: Vector3D = {
      x: Math.cos(latRad) * Math.cos(hRad),
      y: Math.cos(latRad) * Math.sin(hRad),
      z: Math.sin(latRad)
    };
    const pObsCam = rotatePointEuler3D(pObsEq, pitch, yaw, roll);
    const obsPx = safeRadius * pObsCam.x;
    const obsPy = -safeRadius * pObsCam.y;
    const isObsDay = (pObsCam.x * sCam.x + pObsCam.y * sCam.y + pObsCam.z * sCam.z) > 0;

    return {
      dayPath,
      civilPath,
      nauticalPath,
      polePx,
      polePy,
      obsPx,
      obsPy,
      isObsDay,
      isObsVisible: pObsCam.z >= 0
    };
  }, [viewMode, camera, subsolarVector, declination, rightAscension, safeRadius, showTwilightBands, latVal, lonVal, todVal]);

  // 5. 3D Rotational Vector World Continents (Living Marble Earth)
  const continentPaths = useMemo(() => {
    if (!showContinents || safeRadius <= 0 || viewMode === 'flat') return [];
    return projectContinentLandmasses(
      WORLD_LANDMASSES,
      safeRadius,
      viewMode,
      todVal,
      epsRad,
      sunLambdaVal,
      camera
    );
  }, [showContinents, safeRadius, viewMode, todVal, epsRad, sunLambdaVal, camera]);

  return (
    <g 
      transform={`translate(${cx}, ${cy})`} 
      className={`miniglobe-root ${className}`}
      role="img"
      aria-label={`${label} Mini Globe`}
    >
      <title>{`${label} — View: ${viewMode}, Obliquity: ${safeObliquity.toFixed(2)}°, Observer: ${latVal.toFixed(1)}°N ${lonVal.toFixed(1)}°E`}</title>

      <defs>
        {/* Unique Clip Path per Instance */}
        {safeRadius > 0 && (
          <clipPath id={clipPathId}>
            <circle cx="0" cy="0" r={safeRadius} />
          </clipPath>
        )}

        {/* Outer Atmospheric Radial Gradient */}
        {showAtmosphereGlow && viewMode !== 'flat' && safeRadius > 0 && (
          <radialGradient id={atmoGradId} cx="50%" cy="50%" r="50%">
            <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#0284c7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
          </radialGradient>
        )}

        {/* Daylight Core Radial Gradient */}
        {showTerminator && safeRadius > 0 && (
          <radialGradient id={dayGradId} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="70%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
          </radialGradient>
        )}
      </defs>

      {/* Layer 1: Outer Cyan Atmospheric Glow Halo */}
      {showAtmosphereGlow && viewMode !== 'flat' && safeRadius > 0 && (
        <circle 
          cx="0" 
          cy="0" 
          r={safeRadius * 1.35} 
          fill={`url(#${atmoGradId})`} 
          className="pointer-events-none" 
        />
      )}

      {/* ============================================================ */}
      {/* 2D FLAT ASTROLABE PLATE PIN MODE                             */}
      {/* ============================================================ */}
      {viewMode === 'flat' ? (
        <g className="miniglobe-flat">
          <circle cx="0" cy="0" r={safeRadius} fill="#b45309" stroke="#78350f" strokeWidth="0.75" />
          <circle cx="0" cy="0" r={safeRadius * 0.82} fill="#0f172a" stroke="#38bdf8" strokeWidth="0.5" />
          <circle cx="0" cy="0" r={safeRadius * 0.38} fill="#38bdf8" className="animate-pulse" />
          <line x1={-safeRadius * 0.6} y1="0" x2={safeRadius * 0.6} y2="0" stroke="#78350f" strokeWidth="0.5" />
          <line x1="0" y1={-safeRadius * 0.6} x2="0" y2={safeRadius * 0.6} stroke="#78350f" strokeWidth="0.5" />
        </g>
      ) : (
        /* ============================================================ */
        /* SPHERICAL 3D / TOPDOWN / TRANSVERSE / AXIAL MODES            */
        /* ============================================================ */
        <g>
          {/* Layer 2: Base Nighttime Hemisphere (Deep Slate #020617) */}
          <circle cx="0" cy="0" r={safeRadius} fill="#020617" />

          {/* Layer 3: Daylight & Twilight Terminator Bands (Clipped) */}
          {showTerminator && safeRadius > 0 && (
            <g clipPath={`url(#${clipPathId})`}>
              {/* TOPDOWN Daylight */}
              {viewMode === 'topdown' && topdownGeometry?.dayPath && (
                <path d={topdownGeometry.dayPath} fill={`url(#${dayGradId})`} />
              )}

              {/* TRANSVERSE Daylight */}
              {viewMode === 'transverse' && transverseGeometry?.dayPath && (
                <path d={transverseGeometry.dayPath} fill={`url(#${dayGradId})`} />
              )}

              {/* EULER3D Twilight & Daylight Bands */}
              {viewMode === 'euler3d' && eulerGeometry && (
                <g fillRule="evenodd">
                  {eulerGeometry.nauticalPath && (
                    <path d={eulerGeometry.nauticalPath} fill="#1e293b" fillRule="evenodd" />
                  )}
                  {eulerGeometry.civilPath && (
                    <path d={eulerGeometry.civilPath} fill="#1e40af" fillRule="evenodd" />
                  )}
                  {eulerGeometry.dayPath && (
                    <path d={eulerGeometry.dayPath} fill={`url(#${dayGradId})`} fillRule="evenodd" />
                  )}
                </g>
              )}
            </g>
          )}

          {/* Layer 3b: World Continents Landmasses (Living Marble Earth) */}
          {showContinents && safeRadius > 0 && continentPaths.length > 0 && (
            <g className="miniglobe-continents pointer-events-none" clipPath={`url(#${clipPathId})`}>
              {continentPaths.map((d, idx) => (
                <path 
                  key={idx} 
                  d={d} 
                  fill="#10b981" 
                  fillOpacity="0.35" 
                  stroke="#34d399" 
                  strokeWidth="0.4" 
                  strokeOpacity="0.55" 
                  strokeLinejoin="round" 
                />
              ))}
            </g>
          )}

          {/* Layer 4: Parallels (Equator, Tropic of Cancer, Tropic of Capricorn) */}
          {showParallels && safeRadius > 0 && (
            <g className="miniglobe-parallels pointer-events-none" clipPath={`url(#${clipPathId})`}>
              {/* TOPDOWN Mode Parallels */}
              {viewMode === 'topdown' && topdownGeometry && (
                <>
                  {/* Tropic of Cancer (+23.44°) */}
                  <ellipse 
                    cx="0" 
                    cy={-topdownGeometry.tropShiftY} 
                    rx={safeRadius * Math.cos(epsRad)} 
                    ry={topdownGeometry.tropRy} 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="0.5" 
                    strokeDasharray="2 1.5" 
                    opacity="0.6" 
                  />
                  {/* Equator (0°) */}
                  <ellipse 
                    cx="0" 
                    cy="0" 
                    rx={safeRadius} 
                    ry={topdownGeometry.eqRy} 
                    fill="none" 
                    stroke="#38bdf8" 
                    strokeWidth="0.75" 
                    strokeDasharray="2 1.5" 
                    opacity="0.85" 
                  />
                  {/* Tropic of Capricorn (-23.44°) */}
                  <ellipse 
                    cx="0" 
                    cy={topdownGeometry.tropShiftY} 
                    rx={safeRadius * Math.cos(epsRad)} 
                    ry={topdownGeometry.tropRy} 
                    fill="none" 
                    stroke="#64748b" 
                    strokeWidth="0.5" 
                    strokeDasharray="2 1.5" 
                    opacity="0.6" 
                  />
                </>
              )}

              {/* TRANSVERSE Mode Parallels */}
              {viewMode === 'transverse' && transverseGeometry && (
                <line 
                  x1={transverseGeometry.sideGeom.eqX1} 
                  y1={transverseGeometry.sideGeom.eqY1} 
                  x2={transverseGeometry.sideGeom.eqX2} 
                  y2={transverseGeometry.sideGeom.eqY2} 
                  stroke="#38bdf8" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.85" 
                />
              )}

              {/* AXIAL Mode Parallels */}
              {viewMode === 'axial' && axialGeometry && (
                <path 
                  d={axialGeometry.equatorPathD} 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.85" 
                />
              )}

              {/* EULER3D Mode Equator Parallel */}
              {viewMode === 'euler3d' && (
                <ellipse 
                  cx="0" 
                  cy="0" 
                  rx={safeRadius} 
                  ry={Math.max(0.5, safeRadius * Math.sin(toRadians(Math.abs(Number(camera?.pitch) || 0))))} 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="0.65" 
                  strokeDasharray="2 1.5" 
                  opacity="0.75" 
                />
              )}
            </g>
          )}

          {/* Layer 5: Polar Axis Line (23.44° Rotational Axis) */}
          {showPolarAxis && safeRadius > 0 && (
            <g className="miniglobe-polar-axis pointer-events-none" clipPath={`url(#${clipPathId})`}>
              {viewMode === 'topdown' && (
                <line 
                  x1="0" 
                  y1={-safeRadius} 
                  x2="0" 
                  y2={safeRadius} 
                  stroke="#93c5fd" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.75" 
                />
              )}
              {viewMode === 'transverse' && transverseGeometry && (
                <line 
                  x1={-transverseGeometry.sideGeom.poleLineX} 
                  y1={transverseGeometry.sideGeom.poleLineY} 
                  x2={transverseGeometry.sideGeom.poleLineX} 
                  y2={-transverseGeometry.sideGeom.poleLineY} 
                  stroke="#93c5fd" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.75" 
                />
              )}
              {viewMode === 'axial' && axialGeometry && (
                <line 
                  x1={-axialGeometry.poleLineX} 
                  y1={axialGeometry.poleLineY} 
                  x2={axialGeometry.poleLineX} 
                  y2={-axialGeometry.poleLineY} 
                  stroke="#93c5fd" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.75" 
                />
              )}
              {viewMode === 'euler3d' && eulerGeometry && (
                <line 
                  x1={-eulerGeometry.polePx} 
                  y1={-eulerGeometry.polePy} 
                  x2={eulerGeometry.polePx} 
                  y2={eulerGeometry.polePy} 
                  stroke="#93c5fd" 
                  strokeWidth="0.85" 
                  strokeDasharray="2.5 1.5" 
                  opacity="0.75" 
                />
              )}
            </g>
          )}

          {/* Layer 6: Planetary Specular Limb Rim */}
          {safeRadius > 0 && (
            <>
              <circle 
                cx="0" 
                cy="0" 
                r={safeRadius} 
                fill="none" 
                stroke="#60a5fa" 
                strokeWidth="1.2" 
                strokeOpacity="0.8" 
                className="pointer-events-none" 
              />
              <circle 
                cx="0" 
                cy="0" 
                r={Math.max(0, safeRadius - 0.4)} 
                fill="none" 
                stroke="#93c5fd" 
                strokeWidth="0.4" 
                strokeOpacity="0.4" 
                className="pointer-events-none" 
              />
            </>
          )}

          {/* Layer 7: Topocentric Observer Location Pin ("YOU") */}
          {showObserverPin && safeRadius > 0 && (
            <g className="miniglobe-observer-pin pointer-events-none">
              {/* TOPDOWN Observer Pin */}
              {viewMode === 'topdown' && topdownGeometry && (
                <g transform={`translate(${topdownGeometry.obsPx.toFixed(2)}, ${topdownGeometry.obsPy.toFixed(2)})`}>
                  {topdownGeometry.isDaylight ? (
                    <>
                      <circle r="3.2" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                      <circle r="1.6" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                    </>
                  ) : (
                    <circle r="1.4" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
                  )}
                </g>
              )}

              {/* TRANSVERSE Observer Pin */}
              {viewMode === 'transverse' && transverseGeometry && (
                <g transform={`translate(${transverseGeometry.sideGeom.obsPx.toFixed(2)}, ${transverseGeometry.sideGeom.obsPy.toFixed(2)})`}>
                  {transverseGeometry.sideGeom.isDaylight ? (
                    <>
                      <circle r="3.5" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                      <circle r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
                    </>
                  ) : (
                    <circle r="1.5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
                  )}
                </g>
              )}

              {/* AXIAL Observer Pin */}
              {viewMode === 'axial' && axialGeometry && (
                <g transform={`translate(${axialGeometry.obsPx.toFixed(2)}, ${axialGeometry.obsPy.toFixed(2)})`}>
                  {axialGeometry.isDaylight ? (
                    <>
                      <circle r="3.5" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                      <circle r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
                    </>
                  ) : (
                    <circle r="1.5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
                  )}
                </g>
              )}

              {/* EULER3D Observer Pin */}
              {viewMode === 'euler3d' && eulerGeometry && eulerGeometry.isObsVisible && (
                <g transform={`translate(${eulerGeometry.obsPx.toFixed(2)}, ${eulerGeometry.obsPy.toFixed(2)})`}>
                  {eulerGeometry.isObsDay ? (
                    <>
                      <circle r="3.0" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                      <circle r="1.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                    </>
                  ) : (
                    <circle r="1.3" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
                  )}
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* Layer 8: Text Label */}
      {showLabel && (
        <text 
          x="0" 
          y={safeRadius + 8} 
          textAnchor="middle" 
          fontFamily="monospace" 
          fontSize="9" 
          fontWeight="bold" 
          fill="#93c5fd" 
          className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
        >
          {label}
        </text>
      )}

      {/* Layer 9: Stable Enlarged Touch/Pointer Hit Target */}
      <circle 
        cx="0" 
        cy="0" 
        r={Math.max(16, safeRadius * 1.6)} 
        fill="transparent" 
        className="cursor-pointer" 
        onPointerEnter={onPointerEnter} 
        onPointerLeave={onPointerLeave} 
        onClick={onClick} 
      />
    </g>
  );
};

export default MiniGlobe;
