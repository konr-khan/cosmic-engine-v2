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
      {/* Background Track with Inner/Outer Hairline Borders */}
      <circle cx="0" cy="0" r={radius} fill="none" stroke="#0f172a" strokeWidth={width} />
      <circle cx="0" cy="0" r={radius - width / 2} fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
      <circle cx="0" cy="0" r={radius + width / 2} fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
      
      {/* Active Arc Trail with Subtle Glow */}
      <path 
        d={`M 0 -${radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${ix} ${iy}`} 
        fill="none" 
        stroke={color} 
        strokeWidth={2.5} 
        strokeOpacity="0.8" 
      />

      {/* Ticks at 12, 3, 6, 9 o'clock */}
      {[0, 90, 180, 270].map(d => {
         const tx = Math.cos(toRadians(d - 90)) * (radius);
         const ty = Math.sin(toRadians(d - 90)) * (radius);
         return (
           <circle 
             key={d} 
             cx={tx} 
             cy={ty} 
             r={1.5} 
             fill="#94a3b8" 
             opacity="0.5" 
           />
         );
      })}

      {/* Handle Thumb with Glow Halo */}
      <g transform={`translate(${ix}, ${iy})`}>
        <circle r={width / 1.5} fill={color} opacity="0.2" className="group-hover:opacity-35 transition-opacity" />
        <circle r={width / 2.0} fill="#020617" stroke={color} strokeWidth={1.8} className="drop-shadow-md" />
        <circle r={3.5} fill={color} />
      </g>
    </g>
  );
};

export default ControlRing;
