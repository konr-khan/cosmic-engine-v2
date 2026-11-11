import React from 'react';
import { LunarPhaseDisc } from '../widgets/today/common/LunarPhaseDisc';

export interface PhaseVisualProps {
  phase: number;
  size?: number;
  parallacticAngle?: number;
}

export const PhaseVisual: React.FC<PhaseVisualProps> = ({ phase, size = 64, parallacticAngle = 0 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="drop-shadow-md">
      <g transform="translate(32, 32)">
        <LunarPhaseDisc
          radius={24}
          phaseValue={phase}
          parallacticAngle={parallacticAngle}
          rimStrokeOpacity={0}
        />
      </g>
    </svg>
  );
};

export default PhaseVisual;
