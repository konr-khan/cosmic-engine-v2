import React from 'react';
import { AlmucantarCircleData } from '../types';

export interface ArmillaryTympanLayerProps {
  showTympan: boolean;
  isStereo2D: boolean;
  celestialRingsOpacity: number;
  almucantars: AlmucantarCircleData[];
}

export const ArmillaryTympanLayer: React.FC<ArmillaryTympanLayerProps> = ({
  showTympan,
  isStereo2D,
  celestialRingsOpacity,
  almucantars
}) => {
  if (!showTympan || !isStereo2D || celestialRingsOpacity <= 0.05) return null;

  return (
    <g className="pointer-events-none" opacity={0.35 * celestialRingsOpacity}>
      {almucantars.map((a) => (
        <circle
          key={`almucantar-${a.altitude}`}
          cx="0"
          cy={-a.centerY}
          r={a.radius}
          fill="none"
          stroke={a.isHorizon ? '#06b6d4' : '#64748b'}
          strokeWidth={a.isHorizon ? 1.0 : 0.5}
          strokeDasharray={a.isHorizon ? 'none' : '3,3'}
        />
      ))}
    </g>
  );
};
