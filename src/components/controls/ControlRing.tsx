import React from 'react';
import { toRadians } from '../../utils/cosmicMath';

export interface ControlRingProps {
  radius: number;
  width: number;
  value: number;
  max: number;
  color: string;
  formatValue?: (val: number) => string;
  rangeOffset?: number;
  onHover?: (hovered: boolean) => void;
}

export const ControlRing: React.FC<ControlRingProps> = ({ 
  radius, 
  width, 
  value, 
  max, 
  color, 
  formatValue, 
  rangeOffset = 0,
  onHover
}) => {
  // Convert value to angle (0-360 deg, 0° at 12 o'clock, clockwise)
  let normalizedValue = value - rangeOffset;
  normalizedValue = ((normalizedValue % max) + max) % max;
  
  const rawAngle = (normalizedValue / max) * 360;
  // Clamp angle for SVG arc path calculation to prevent 360° -> 0° collapse
  const clampedAngle = Math.min(359.99, Math.max(0.01, rawAngle));
  
  // Calculate indicator position (0° at 12 o'clock)
  const ix = Math.cos(toRadians(clampedAngle - 90)) * radius;
  const iy = Math.sin(toRadians(clampedAngle - 90)) * radius;

  const largeArcFlag = clampedAngle > 180 ? 1 : 0;

  return (
    <g 
      className="select-none group touch-none"
      onPointerEnter={() => onHover && onHover(true)}
      onPointerLeave={() => onHover && onHover(false)}
    >
      {/* Background Track */}
      <circle cx="0" cy="0" r={radius} fill="none" stroke="#1e293b" strokeWidth={width} />
      
      {/* Active Arc Trail */}
      <path 
        d={`M 0 -${radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${ix} ${iy}`} 
        fill="none" 
        stroke={color} 
        strokeWidth={2} 
        opacity="0.45" 
      />

      {/* Ticks at 12, 3, 6, 9 o'clock */}
      {[0, 90, 180, 270].map(d => {
         const tx = Math.cos(toRadians(d - 90)) * (radius - width / 2 + 5);
         const ty = Math.sin(toRadians(d - 90)) * (radius - width / 2 + 5);
         return <circle key={d} cx={tx} cy={ty} r={2} fill="#94a3b8" opacity="0.35" />;
      })}

      {/* Handle Thumb */}
      <g transform={`translate(${ix}, ${iy})`}>
        <circle r={width / 1.8} fill="#0f172a" stroke={color} strokeWidth={2} className="drop-shadow-lg" />
        <circle r={4} fill={color} />
      </g>
    </g>
  );
};

export default ControlRing;
