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

import React, { useMemo } from 'react';
import { Degrees, Latitude, Longitude, HoursDecimal, toRadians } from '../../types/units';
import { Vector3D } from '../../types/coordinates';
import { WORLD_LANDMASSES } from '../../utils/cosmicMath/geoData';
import { EARTH_AXIAL_OBLIQUITY_J2000_DEG, DEFAULT_OBSERVER_LATITUDE, DEFAULT_OBSERVER_LONGITUDE } from '../../utils/cosmicMath';
import { 
  MiniGlobeViewMode, 
  MiniGlobeCamera, 
  projectContinentLandmasses, 
  generateAnalyticalLimbPath 
} from '../../utils/cosmicMath/globe';
import { useSafeSvgId } from './useSafeSvgId';
import { MiniGlobeFlat } from './miniglobe/MiniGlobeFlat';
import { MiniGlobeSphere } from './miniglobe/MiniGlobeSphere';
import {
  buildTopdownGlobeGeometry,
  buildTransverseGlobeGeometry,
  buildAxialGlobeGeometry,
  buildEulerGlobeGeometry
} from './miniglobe/globeGeometry';
import { 
  TopdownGlobeGeometry, 
  TransverseGlobeGeometry, 
  AxialGlobeGeometry, 
  EulerGlobeGeometry 
} from './miniglobe/types';

export type { MiniGlobeViewMode, MiniGlobeCamera };
export { projectContinentLandmasses, generateAnalyticalLimbPath };

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
  /** Direct 3D Subsolar unit vector in camera frame (for heliocentric orbit lighting) */
  subsolarCameraVector?: Vector3D;

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
  observerPinScale?: number;    // Relative scale multiplier for observer pin (default: 1.0)
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

export const MiniGlobe: React.FC<MiniGlobeProps> = ({
  cx = 0,
  cy = 0,
  radius = 12,
  viewMode = 'topdown',
  sunLambdaDeg = 0,
  sunAngleDeg,
  subsolarCameraVector,
  declination = 0,
  camera,
  latitude = DEFAULT_OBSERVER_LATITUDE,
  longitude = DEFAULT_OBSERVER_LONGITUDE,
  timeOfDay = 12.0,
  obliquityDeg = Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG),
  showTerminator = true,
  showTwilightBands = true,
  showContinents = true,
  showParallels = true,
  showPolarAxis = true,
  showObserverPin = true,
  observerPinScale = 1.0,
  showAtmosphereGlow = true,
  showLabel = false,
  label = 'EARTH',
  className = '',
  id,
  onPointerEnter,
  onPointerLeave,
  onClick
}) => {
  const safeId = useSafeSvgId();
  const uid = id ? `${id}-${safeId}` : `globe-${safeId}`;

  const clipPathId = `${uid}-clip`;
  const atmoGradId = `${uid}-atmo-grad`;
  const dayGradId = `${uid}-day-grad`;

  const safeRadius = Math.max(0, Number(radius) || 0);
  const safeObliquity = Number.isFinite(Number(obliquityDeg)) ? Number(obliquityDeg) : Number(EARTH_AXIAL_OBLIQUITY_J2000_DEG);
  const epsRad = toRadians(safeObliquity);
  const sunLambdaVal = Number.isFinite(Number(sunLambdaDeg)) ? Number(sunLambdaDeg) : 0;
  const latVal = Number.isFinite(Number(latitude)) ? Number(latitude) : 0;
  const lonVal = Number.isFinite(Number(longitude)) ? Number(longitude) : 0;
  const todVal = Number.isFinite(Number(timeOfDay)) ? Number(timeOfDay) : 12;
  const sunAngleNum = sunAngleDeg !== undefined && Number.isFinite(Number(sunAngleDeg)) ? Number(sunAngleDeg) : undefined;
  const declinationNum = Number.isFinite(Number(declination)) ? Number(declination) : undefined;

  const topdownGeometry = useMemo<TopdownGlobeGeometry | null>(() => {
    if (viewMode !== 'topdown') return null;
    return buildTopdownGlobeGeometry({
      safeRadius,
      sunAngleDeg: sunAngleNum,
      sunLambdaVal,
      epsRad,
      latVal,
      lonVal,
      todVal
    });
  }, [viewMode, safeRadius, sunAngleNum, sunLambdaVal, epsRad, latVal, lonVal, todVal]);

  const transverseGeometry = useMemo<TransverseGlobeGeometry | null>(() => {
    if (viewMode !== 'transverse') return null;
    return buildTransverseGlobeGeometry(safeRadius, sunLambdaVal, latVal, todVal, lonVal);
  }, [viewMode, safeRadius, sunLambdaVal, latVal, todVal, lonVal]);

  const axialGeometry = useMemo<AxialGlobeGeometry | null>(() => {
    if (viewMode !== 'axial') return null;
    return buildAxialGlobeGeometry(safeRadius, sunLambdaVal, latVal, todVal, lonVal);
  }, [viewMode, safeRadius, sunLambdaVal, latVal, todVal, lonVal]);

  const eulerGeometry = useMemo<EulerGlobeGeometry | null>(() => {
    if (viewMode !== 'euler3d') return null;
    return buildEulerGlobeGeometry({
      safeRadius,
      camera,
      declination: declinationNum,
      sunLambdaVal,
      showTwilightBands,
      latVal,
      lonVal,
      todVal
    });
  }, [viewMode, camera, declinationNum, safeRadius, showTwilightBands, latVal, lonVal, todVal, sunLambdaVal]);

  const continentPaths = useMemo(() => {
    if (!showContinents || safeRadius <= 0 || viewMode === 'flat') return [];
    return projectContinentLandmasses(
      WORLD_LANDMASSES,
      safeRadius,
      viewMode,
      todVal,
      epsRad,
      sunLambdaVal,
      camera,
      sunAngleDeg,
      subsolarCameraVector
    );
  }, [showContinents, safeRadius, viewMode, todVal, epsRad, sunLambdaVal, camera, sunAngleDeg, subsolarCameraVector]);

  return (
    <g 
      transform={`translate(${cx}, ${cy})`} 
      className={`miniglobe-root ${className}`}
      role="img"
      aria-label={`${label} Mini Globe`}
    >
      <title>{`${label} — View: ${viewMode}, Obliquity: ${safeObliquity.toFixed(2)}°, Observer: ${latVal.toFixed(1)}°N ${lonVal.toFixed(1)}°E`}</title>

      <defs>
        {safeRadius > 0 && (
          <clipPath id={clipPathId}>
            <circle cx="0" cy="0" r={safeRadius} />
          </clipPath>
        )}

        {showAtmosphereGlow && viewMode !== 'flat' && safeRadius > 0 && (
          <radialGradient id={atmoGradId} cx="50%" cy="50%" r="50%">
            <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#0284c7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
          </radialGradient>
        )}

        {showTerminator && safeRadius > 0 && (
          <radialGradient id={dayGradId} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="70%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
          </radialGradient>
        )}
      </defs>

      {showAtmosphereGlow && viewMode !== 'flat' && safeRadius > 0 && (
        <circle 
          cx="0" 
          cy="0" 
          r={safeRadius * 1.35} 
          fill={`url(#${atmoGradId})`} 
          className="pointer-events-none" 
        />
      )}

      {viewMode === 'flat' ? (
        <MiniGlobeFlat safeRadius={safeRadius} />
      ) : (
        <MiniGlobeSphere
          viewMode={viewMode}
          safeRadius={safeRadius}
          clipPathId={clipPathId}
          dayGradId={dayGradId}
          epsRad={epsRad}
          camera={camera}
          showTerminator={showTerminator}
          showTwilightBands={showTwilightBands}
          showContinents={showContinents}
          showParallels={showParallels}
          showPolarAxis={showPolarAxis}
          showObserverPin={showObserverPin}
          observerPinScale={observerPinScale}
          topdownGeometry={topdownGeometry}
          transverseGeometry={transverseGeometry}
          axialGeometry={axialGeometry}
          eulerGeometry={eulerGeometry}
          continentPaths={continentPaths}
        />
      )}

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

      <circle 
        cx="0" 
        cy="0" 
        r={Math.max(16, safeRadius * 1.6)} 
        fill="transparent" 
        className={onClick || onPointerEnter || onPointerLeave ? 'cursor-pointer' : 'cursor-default'} 
        onPointerEnter={onPointerEnter} 
        onPointerLeave={onPointerLeave} 
        onClick={onClick} 
      />
    </g>
  );
};

export default MiniGlobe;
