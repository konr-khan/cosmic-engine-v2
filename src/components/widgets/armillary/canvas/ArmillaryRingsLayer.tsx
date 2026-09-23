import React from 'react';
import { ArmillaryRingPath } from '../types';
import { ZODIAC_SIGNS } from '../../../../utils/cosmicMath';

export interface ArmillaryRingsLayerProps {
  rings: ArmillaryRingPath[];
  is3D?: boolean;
  morphLambda?: number;
  cameraPitch?: number;
  orbitRingOpacity: number;
  celestialRingsOpacity: number;
  lunarOrbitOpacity?: number;
}

/**
 * Evaluates the absolute Z-component of the ring's camera-space unit normal (|n_z|).
 * - |n_z| = 0: Edge-on viewing (ring plane contains camera sightline, collapses to a 1D line)
 * - |n_z| = 1: Face-on viewing (ring plane perpendicular to camera sightline, circular profile)
 */
function getRingNormalAbsZ(ring: ArmillaryRingPath): number | null {
  const verts = ring.vertices;
  if (!verts || verts.length < 4) return null;
  const len = verts.length;
  const idx0 = 0;
  const idx1 = Math.floor(len / 4);
  const idx2 = Math.floor(len / 2);

  const p0 = verts[idx0].pCam;
  const p1 = verts[idx1].pCam;
  const p2 = verts[idx2].pCam;

  const ax = p1.x - p0.x;
  const ay = p1.y - p0.y;
  const az = p1.z - p0.z;

  const bx = p2.x - p0.x;
  const by = p2.y - p0.y;
  const bz = p2.z - p0.z;

  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;

  const lenSq = nx * nx + ny * ny + nz * nz;
  if (lenSq < 1e-8) return null;

  return Math.abs(nz) / Math.sqrt(lenSq);
}

export const ArmillaryRingsLayer: React.FC<ArmillaryRingsLayerProps> = ({
  rings,
  is3D = true,
  morphLambda,
  cameraPitch,
  orbitRingOpacity,
  celestialRingsOpacity,
  lunarOrbitOpacity = 1.0
}) => {
  const lambda = morphLambda !== undefined ? morphLambda : (is3D ? 0.0 : 1.0);
  const uMorph = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));

  // Top-down / bottom-up pitch unification factor:
  // As pitch approaches ±90° (|pitch| >= 65° up to 80°),
  // Earth's orbital path (and ecliptic rings) smoothly fuse from dashed back segments into fully solid strokes
  const absPitch = Math.abs(cameraPitch ?? 0);
  const uPitch = Math.max(0, Math.min(1, (absPitch - 65) / 15));

  // Helper to compute effective unification progress u in [0, 1] for a ring.
  // Fuses back dashed segments into solid continuous strokes when:
  // 1. Morphing to 2D astrolabe plate (uMorph)
  // 2. Viewed face-on / top-down (uPitch or uFaceOn)
  // 3. Viewed edge-on (|n_z| <= 0.08, e.g. equator or tropics at pitch ≈ 0°)
  const getRingUnification = (ring: ArmillaryRingPath): number => {
    const absNz = getRingNormalAbsZ(ring);
    const uEdgeOn = absNz !== null ? Math.max(0, Math.min(1, (0.08 - absNz) / 0.06)) : 0;
    const uFaceOn = absNz !== null ? Math.max(0, Math.min(1, (absNz - 0.88) / 0.10)) : 0;

    const isOrbitPath = ring.id === 'orbit_path';
    return isOrbitPath || ring.id === 'ecliptic'
      ? Math.max(uMorph, uPitch, uFaceOn, uEdgeOn)
      : Math.max(uMorph, uFaceOn, uEdgeOn);
  };

  return (
    <>
      {/* Back Ring Segments (Depth Sorted: zCam < 0) */}
      <g>
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const isLunarOrbit = ring.id === 'lunar_orbit';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : (isLunarOrbit ? lunarOrbitOpacity : celestialRingsOpacity);
          if (ringOpacity <= 0.01 || !ring.backPathD) return null;

          const u = getRingUnification(ring);
          if (u >= 0.99) {
            // When fully unified (top-down pitch, edge-on view, or 2D plate), fullPathD is rendered in the front group
            return null;
          }

          const backOpacityFactor = 0.35 + 0.65 * u;
          const dashGap = 2 * (1 - u);
          const strokeDasharray = u <= 0.01 ? '3,2' : `3,${parseFloat(dashGap.toFixed(2))}`;
          const strokeWidth = ring.backStrokeWidth + (ring.frontStrokeWidth - ring.backStrokeWidth) * u;

          return (
            <path
              key={`back-${ring.id}`}
              d={ring.backPathD}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              opacity={ringOpacity * backOpacityFactor}
            />
          );
        })}
      </g>

      {/* Front Ring Segments (Depth Sorted: zCam >= 0, or full path when unified) */}
      <g filter="url(#ringGlow)">
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const isLunarOrbit = ring.id === 'lunar_orbit';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : (isLunarOrbit ? lunarOrbitOpacity : celestialRingsOpacity);
          if (ringOpacity <= 0.01) return null;

          const u = getRingUnification(ring);
          const isUnified = u >= 0.99;
          const pathD = isUnified && ring.fullPathD ? ring.fullPathD : ring.frontPathD;
          if (!pathD) return null;

          return (
            <path
              key={`front-${ring.id}`}
              d={pathD}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.frontStrokeWidth}
              opacity={ringOpacity}
            />
          );
        })}
      </g>

      {/* Zodiac Ecliptic Rete Segments & Glyphs */}
      {celestialRingsOpacity > 0.05 && ZODIAC_SIGNS.map((sign, idx) => {
        const eclRing = rings.find((r) => r.id === 'ecliptic');
        if (!eclRing || eclRing.vertices.length === 0) return null;

        const midIndex = Math.floor(((idx * 30 + 15) / 360) * (eclRing.vertices.length - 1));
        const v = eclRing.vertices[midIndex];
        if (!v) return null;

        return (
          <g key={`zodiac-${sign.name}`} opacity={celestialRingsOpacity}>
            <circle
              cx={v.screenPos.x}
              cy={v.screenPos.y}
              r="1.0"
              fill={sign.color}
            />
            <text
              x={v.screenPos.x}
              y={v.screenPos.y - 2.8}
              fontSize="4.2"
              fill={sign.color}
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none drop-shadow"
            >
              {sign.symbol}
            </text>
          </g>
        );
      })}
    </>
  );
};
