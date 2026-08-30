import React from 'react';
import { AlmucantarCircleData } from '../types';

export interface ArmillaryTympanLayerProps {
  showTympan: boolean;
  isTympanVisible: boolean;
  morphLambda: number;
  celestialRingsOpacity: number;
  almucantars: AlmucantarCircleData[];
}

export const ArmillaryTympanLayer: React.FC<ArmillaryTympanLayerProps> = ({
  showTympan,
  isTympanVisible,
  morphLambda,
  celestialRingsOpacity,
  almucantars
}) => {
  if (!showTympan || !isTympanVisible || celestialRingsOpacity <= 0.05) return null;

  const tympanProgress = Math.max(0, Math.min(1, (morphLambda - 0.15) / 0.7));
  const opacity = 0.45 * tympanProgress * celestialRingsOpacity;
  const scale = 0.94 + 0.06 * tympanProgress;

  return (
    <g 
      className="pointer-events-none transition-opacity duration-200" 
      opacity={opacity}
      transform={`scale(${scale})`}
    >
      {almucantars.map((a) => (
        <circle
          key={`almucantar-${a.altitude}`}
          cx="0"
          cy={-a.centerY}
          r={a.radius}
          fill="none"
          stroke={a.isHorizon ? '#06b6d4' : '#64748b'}
          strokeWidth={a.isHorizon ? 1.1 : 0.5}
          strokeDasharray={a.isHorizon ? 'none' : '3,3'}
        />
      ))}
    </g>
  );
};
