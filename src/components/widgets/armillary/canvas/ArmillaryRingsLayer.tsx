import React from 'react';
import { ArmillaryRingPath, ZodiacSignSegment } from '../types';
import { ZODIAC_SIGNS } from '../../../../utils/cosmicMath';

export interface ArmillaryRingsLayerProps {
  rings: ArmillaryRingPath[];
  is3D: boolean;
  orbitRingOpacity: number;
  celestialRingsOpacity: number;
}

export const ArmillaryRingsLayer: React.FC<ArmillaryRingsLayerProps> = ({
  rings,
  is3D,
  orbitRingOpacity,
  celestialRingsOpacity
}) => {
  return (
    <>
      {/* Back Ring Segments (Depth Sorted: zCam < 0) */}
      <g>
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
          if (ringOpacity <= 0.01) return null;

          return (
            <path
              key={`back-${ring.id}`}
              d={is3D ? ring.backPathD : ring.fullPathD}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.backStrokeWidth}
              strokeDasharray={is3D ? '3,2' : 'none'}
              opacity={ringOpacity * (is3D ? 0.35 : 0.85)}
            />
          );
        })}
      </g>

      {/* Front Ring Segments (Depth Sorted: zCam >= 0) */}
      <g filter="url(#ringGlow)">
        {rings.map((ring) => {
          const isOrbitPath = ring.id === 'orbit_path';
          const ringOpacity = isOrbitPath ? orbitRingOpacity : celestialRingsOpacity;
          if (ringOpacity <= 0.01) return null;

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
