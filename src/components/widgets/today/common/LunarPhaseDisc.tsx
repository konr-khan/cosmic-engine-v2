/**
 * @file LunarPhaseDisc.tsx
 * Miniature SVG lunar phase disc renderer with realistic terminator curvature
 * and parallactic rotation.
 */

import React from 'react';

export interface LunarPhaseDiscProps {
  radius?: number;
  phaseValue: number;
  parallacticAngle?: number;
  rimStroke?: string;
  rimStrokeWidth?: number;
  rimStrokeOpacity?: number;
  rimStrokeDasharray?: string;
}

export const LunarPhaseDisc: React.FC<LunarPhaseDiscProps> = ({
  radius = 5.5,
  phaseValue,
  parallacticAngle = 0,
  rimStroke = '#64748b',
  rimStrokeWidth = 0.5,
  rimStrokeOpacity = 0.6,
  rimStrokeDasharray,
}) => {
  const pVal = phaseValue ?? 0;
  const r = radius;

  return (
    <>
      {/* Dark Body Base Disc */}
      <circle cx="0" cy="0" r={r} fill="#020617" stroke="#334155" strokeWidth="0.75" />

      {/* Phase Illuminated Geometry */}
      <g transform={`rotate(${parallacticAngle || 0})`}>
        {(() => {
          if (pVal > 0.48 && pVal < 0.52) {
            return <circle cx="0" cy="0" r={r} fill="#f8fafc" />;
          }
          if (pVal > 0.02 && pVal < 0.98) {
            const isWaxing = pVal < 0.5;
            const startY = isWaxing ? -r : r;
            const endY = isWaxing ? r : -r;
            const rxAbs = Math.abs(r * Math.cos(pVal * 2 * Math.PI));
            let termSweep: number;
            if (isWaxing) {
              termSweep = pVal < 0.25 ? 0 : 1;
            } else {
              termSweep = pVal < 0.75 ? 1 : 0;
            }
            const d = `M 0,${startY} A ${r},${r} 0 0,1 0,${endY} A ${rxAbs.toFixed(2)},${r} 0 0,${termSweep} 0,${startY}`;
            return <path d={d} fill="#f8fafc" />;
          }
          return null;
        })()}
      </g>

      {/* Specular Rim */}
      <circle
        cx="0"
        cy="0"
        r={r}
        fill="none"
        stroke={rimStroke}
        strokeWidth={rimStrokeWidth}
        strokeOpacity={rimStrokeOpacity}
        strokeDasharray={rimStrokeDasharray}
      />
    </>
  );
};
