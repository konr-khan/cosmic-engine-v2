import React from 'react';
import { ArmillaryRingPath } from '../types';
import { ZODIAC_SIGNS } from '../../../../utils/cosmicMath';

export interface ArmillaryRingsLayerProps {
  rings: ArmillaryRingPath[];
  is3D?: boolean;
  morphLambda?: number;
  orbitRingOpacity: number;
  celestialRingsOpacity: number;
}

export const ArmillaryRingsLayer: React.FC<ArmillaryRingsLayerProps> = ({
  rings,
  is3D = true,
  morphLambda,
  orbitRingOpacity,
  celestialRingsOpacity
}) => {
  const lambda = morphLambda !== undefined ? morphLambda : (is3D ? 0.0 : 1.0);
  const u = Math.max(0, Math.min(1, (lambda - 0.85) / 0.15));
  const backOpacityFactor = 0.35 + 0.65 * u;
  const dashGap = 2 * (1 - u);
  const strokeDasharray = u >= 0.99 ? 'none' : (u <= 0.01 ? '3,2' : `3,${parseFloat(dashGap.toFixed(2))}`);

  return (
    <>
      {/* Back Ring Segments (Depth Sorted: zCam < 0) */}
      <g>
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
          if (ringOpacity <= 0.01 || !ring.backPathD) return null;

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

      {/* Front Ring Segments (Depth Sorted: zCam >= 0) */}
      <g filter="url(#ringGlow)">
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
          if (ringOpacity <= 0.01 || !ring.frontPathD) return null;

          return (
            <path
              key={`front-${ring.id}`}
              d={ring.frontPathD}
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
