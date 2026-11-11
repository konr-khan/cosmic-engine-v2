/**
 * @file MiniMoon.tsx
 * Reusable, high-precision SVG Lunar Bead & Visualizer component for Cosmic Engine V2.0.
 * 
 * Harmonizes the 3D Moon model from the Gyro-Morph Armillary orbital view with the
 * Eclipse Demonstrator's Syzygy (side-on transverse) and Axial sightline views.
 * 
 * Capabilities:
 * - True 3D analytical spherical limb terminator path facing the Sun via subsolarCameraVector
 * - Topocentric / apparent 2D phase crescent disc oriented toward in-plane sunAngleDeg
 * - Dark nightside base sphere with optional umbra/penumbra eclipse tints
 * - Directional illuminated dayside hemisphere / crescent
 * - Soft outer corona radiance glow
 * - Nodal color-coding (Sky Blue #38bdf8 for ascending node, Rose Red #f43f5e for descending node)
 * - Prograde orbital kinematics (solid outline when waxing / viewer-side, dashed '3 2' when waning / far-side)
 * - Active eclipse highlights (amber #fbbf24 stroke, blood-red #f43f5e or copper #fb923c umbral fills)
 */

import React, { useMemo } from 'react';
import { Vector3D } from '../../types/coordinates';
import { generateAnalyticalLimbPath } from '../../utils/cosmicMath/globe';
import { computeMoonPhasePath } from '../../utils/cosmicMath/armillary';

export interface MiniMoonProps {
  /** Center X in SVG user coordinates (default: 0) */
  cx?: number;
  /** Center Y in SVG user coordinates (default: 0) */
  cy?: number;
  /** Disc radius in SVG user coordinates (default: 8) */
  radius: number;

  /** 3D Subsolar unit vector in camera perspective (for true 3D analytical terminator) */
  subsolarCameraVector?: Vector3D | null;

  /** Normalized lunar phase in [0, 1) (0 = New, 0.25 = First Qtr, 0.5 = Full, 0.75 = Third Qtr) */
  phase?: number;

  /** In-plane angle in degrees pointing from Moon toward Sun in SVG screen coordinates */
  sunAngleDeg?: number;

  /** Ascending (true -> Sky Blue #38bdf8) vs Descending (false -> Rose Red #f43f5e) hemisphere */
  isAscending?: boolean;

  /** Waxing (true -> solid outline) vs Waning (false -> dashed '3 2' outline) */
  isWaxing?: boolean;

  /** Whether an active solar or lunar eclipse is occurring (triggers amber stroke & eclipse fills) */
  isEclipseActive?: boolean;

  /** Whether the Moon is inside the umbral shadow core during an active lunar eclipse */
  isInsideUmbra?: boolean;

  /** If true, the Moon is viewed from its unilluminated back / nightside (e.g. Axial Sightline view) */
  isDark?: boolean;

  /** Custom stroke color override */
  stroke?: string;
  /** Stroke width in SVG user units (default: 2.0) */
  strokeWidth?: number;
  /** Custom stroke-dasharray override */
  strokeDasharray?: string;

  /** Custom nightside fill color override (defaults to #0f172a or eclipse red/copper) */
  fill?: string;
  /** Nightside fill opacity (default: 0.95 or 1.0 during eclipse) */
  fillOpacity?: number;

  /** Whether to render the soft outer corona glow circle (default: true) */
  showCoronaGlow?: boolean;
  /** Custom corona glow color override */
  coronaColor?: string;

  /** Whether to render the central node/sightline pin dot (default: false) */
  showCenterPin?: boolean;
  /** Custom center pin color override */
  centerPinColor?: string;

  /** Whole-group opacity (default: 1.0) */
  opacity?: number;
  /** Additional CSS class names */
  className?: string;
  /** SVG clip-path URL if occluded */
  clipPath?: string;
  /** SVG mask URL */
  mask?: string;
}

export const MiniMoon: React.FC<MiniMoonProps> = ({
  cx = 0,
  cy = 0,
  radius,
  subsolarCameraVector,
  phase,
  sunAngleDeg,
  isAscending,
  isWaxing,
  isEclipseActive = false,
  isInsideUmbra = false,
  isDark = false,
  stroke,
  strokeWidth = 2.0,
  strokeDasharray,
  fill,
  fillOpacity,
  showCoronaGlow = true,
  coronaColor,
  showCenterPin = false,
  centerPinColor,
  opacity,
  className,
  clipPath,
  mask
}) => {
  // 1. Color encodings conforming to SED Design System & Eclipse Visual Language
  const effectiveStroke = stroke ?? (
    isEclipseActive
      ? '#fbbf24'
      : (isAscending !== undefined ? (isAscending ? '#38bdf8' : '#f43f5e') : '#475569')
  );

  const effectiveDash = strokeDasharray !== undefined
    ? strokeDasharray
    : (isWaxing !== undefined ? (isWaxing ? undefined : '3 2') : undefined);

  const effectiveCoronaColor = coronaColor ?? (
    isEclipseActive
      ? '#fbbf24'
      : (isAscending !== undefined ? (isAscending ? '#38bdf8' : '#f43f5e') : '#94a3b8')
  );

  const effectiveNightsideFill = fill ?? (
    isEclipseActive
      ? (isInsideUmbra ? '#f43f5e' : '#fb923c')
      : '#0f172a'
  );

  const effectiveFillOpacity = fillOpacity ?? (isEclipseActive ? 1.0 : 0.95);

  const daysideFill = isEclipseActive
    ? (isInsideUmbra ? '#f43f5e' : '#fb923c')
    : '#f8fafc';

  // 2. Directional dayside / crescent path computation
  // Case A: 3D analytical limb path in camera perspective (suppressed if viewed from the dark back)
  const limbPath = useMemo(() => {
    if (isDark || !subsolarCameraVector) return null;
    return generateAnalyticalLimbPath(
      radius,
      subsolarCameraVector.x,
      subsolarCameraVector.y,
      subsolarCameraVector.z,
      0
    );
  }, [isDark, subsolarCameraVector, radius]);

  // Case B: Topocentric / apparent 2D phase disc (suppressed if viewed from the dark back)
  const phaseData = useMemo(() => {
    if (isDark || limbPath !== null || phase === undefined) return null;
    return computeMoonPhasePath(phase, radius);
  }, [isDark, limbPath, phase, radius]);

  // Render dayside illuminated path (only if not viewing from the dark back)
  let daysideElement: React.ReactNode = null;
  if (!isDark) {
    if (limbPath) {
      daysideElement = <path d={limbPath} fill={daysideFill} />;
    } else if (phaseData) {
      if (phaseData.isFull) {
        daysideElement = <circle cx={0} cy={0} r={radius} fill={daysideFill} />;
      } else if (!phaseData.isNew && phaseData.pathD) {
        daysideElement = (
          <g transform={sunAngleDeg !== undefined ? `rotate(${sunAngleDeg})` : undefined}>
            <path d={phaseData.pathD} fill={daysideFill} />
          </g>
        );
      }
    }
  }

  const transform = cx !== 0 || cy !== 0 ? `translate(${cx}, ${cy})` : undefined;

  return (
    <g
      transform={transform}
      opacity={opacity}
      className={className}
      clipPath={clipPath}
      mask={mask}
    >
      {/* 1. Moon Soft Outer Corona Glow */}
      {showCoronaGlow && (
        <circle
          cx={0}
          cy={0}
          r={radius * 1.5}
          fill={effectiveCoronaColor}
          fillOpacity={0.18}
          className="pointer-events-none"
        />
      )}

      {/* 2. Moon Dark Nightside Base Sphere */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={effectiveNightsideFill}
        fillOpacity={effectiveFillOpacity}
      />

      {/* 3. Directional Illuminated Dayside Hemisphere / Apparent Phase Crescent */}
      {daysideElement}

      {/* 4. Center Sightline Pin Dot (for Axial sightline target view) */}
      {showCenterPin && (
        <circle
          cx={0}
          cy={0}
          r={1.5}
          fill={centerPinColor ?? (isAscending !== undefined ? (isAscending ? '#38bdf8' : '#f43f5e') : '#cbd5e1')}
          className="pointer-events-none"
        />
      )}

      {/* 5. Outer Rim Stroke (Dashed/solid node color-coded outline) */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="none"
        stroke={effectiveStroke}
        strokeWidth={strokeWidth}
        strokeDasharray={effectiveDash}
        className="pointer-events-none drop-shadow"
      />
    </g>
  );
};

export default MiniMoon;
