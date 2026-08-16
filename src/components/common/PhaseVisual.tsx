import React from 'react';
import { CONFIG } from '../../utils/cosmicMath';

export interface PhaseVisualProps {
  phase: number;
  parallacticAngle?: number;
}

export const PhaseVisual: React.FC<PhaseVisualProps> = ({ phase, parallacticAngle = 0 }) => {
  const r = 24;
  const isWaxing = phase < 0.5;
  const startY = isWaxing ? 8 : 56;
  const endY = isWaxing ? 56 : 8;
  
  const rxAbs = Math.abs(24 * Math.cos(phase * 2 * Math.PI));
  let termSweep: number;
  if (isWaxing) {
    termSweep = phase < 0.25 ? 0 : 1;
  } else {
    termSweep = phase < 0.75 ? 1 : 0;
  }
  
  const d = `M 32,${startY} A 24,24 0 0,1 32,${endY} A ${rxAbs},24 0 0,${termSweep} 32,${startY}`;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-md">
      <circle cx="32" cy="32" r={r} fill={CONFIG.THEME.NIGHT_BG} stroke="#475569" strokeWidth="1" />
      <g transform={`rotate(${parallacticAngle}, 32, 32)`}>
        { phase > 0.02 && phase < 0.98 && <path d={d} fill="#f1f5f9" /> }
        { phase > 0.48 && phase < 0.52 && <circle cx="32" cy="32" r={r} fill="#f1f5f9" /> }
      </g>
    </svg>
  );
};

export default PhaseVisual;
