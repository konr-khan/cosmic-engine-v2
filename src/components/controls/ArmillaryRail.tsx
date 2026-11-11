import React from 'react';
import { toRadians } from '../../utils/cosmicMath';

export interface ArmillaryRailProps {
  radius?: number;
  width?: number;
  latitude: number;
  color?: string;
}

const PRESETS = [
  { lat: 90, label: "90°N" },
  { lat: 66.5, label: "66.5°N" },
  { lat: 23.5, label: "23.5°N" },
  { lat: 0, label: "0°" },
  { lat: -23.5, label: "23.5°S" },
  { lat: -66.5, label: "66.5°S" },
  { lat: -90, label: "90°S" }
];

export const ArmillaryRail: React.FC<ArmillaryRailProps> = ({ 
  radius = 54, 
  width = 16, 
  latitude, 
  color = "#f43f5e" 
}) => {
  const latRad = toRadians(Math.max(-90, Math.min(90, latitude)));
  const hx = -radius * Math.cos(latRad);
  const hy = -radius * Math.sin(latRad);

  const formatLatStr = (lat: number): string => `${Math.abs(lat)}°${lat >= 0 ? (lat === 0 ? '' : 'N') : 'S'}`;

  return (
    <g className="select-none group touch-none">
      {/* Structural Right Arc Frame */}
      <path 
        d={`M 0 -${radius} A ${radius} ${radius} 0 0 1 0 ${radius}`} 
        fill="none" 
        stroke="#334155" 
        strokeWidth="1" 
        strokeDasharray="2 2" 
        opacity="0.4" 
      />

      {/* Main Active Left Rail Arc Frame with Hairline Inner/Outer Guides */}
      <path 
        d={`M 0 -${radius} A ${radius} ${radius} 0 0 0 0 ${radius}`} 
        fill="none" 
        stroke="#0f172a" 
        strokeWidth={width} 
      />
      <path 
        d={`M 0 -${radius - width / 2} A ${radius - width / 2} ${radius - width / 2} 0 0 0 0 ${radius - width / 2}`} 
        fill="none" 
        stroke="#334155" 
        strokeWidth="0.5" 
        strokeOpacity="0.4" 
      />
      <path 
        d={`M 0 -${radius + width / 2} A ${radius + width / 2} ${radius + width / 2} 0 0 0 0 ${radius + width / 2}`} 
        fill="none" 
        stroke="#334155" 
        strokeWidth="0.5" 
        strokeOpacity="0.4" 
      />

      {/* Active Arc Highlight Trail (from Equator to current Latitude on Left Arc) */}
      {(() => {
        const sweep = latitude >= 0 ? 1 : 0;
        const startY = 0;
        const startX = -radius;
        return (
          <path 
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweep} ${hx} ${hy}`} 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            opacity="0.9" 
          />
        );
      })()}

      {/* Preset Ticks along the Left Arc */}
      {PRESETS.map((preset) => {
        const pRad = toRadians(preset.lat);
        const px = -radius * Math.cos(pRad);
        const py = -radius * Math.sin(pRad);
        const isEquator = preset.lat === 0;
        return (
          <circle 
            key={preset.label} 
            cx={px} 
            cy={py} 
            r={isEquator ? 2 : 1.5} 
            fill={isEquator ? color : "#94a3b8"} 
            opacity={isEquator ? 0.9 : 0.45} 
          />
        );
      })}

      {/* Latitude Handle Thumb with Outer Glow Halo */}
      <g transform={`translate(${hx}, ${hy})`}>
        <circle r={width / 1.5} fill={color} opacity="0.2" className="group-hover:opacity-35 transition-opacity" />
        <circle r={width / 2.2} fill="#020617" stroke={color} strokeWidth={1.8} className="drop-shadow-md cursor-grab active:cursor-grabbing" />
        <circle r={3} fill={color} />
        
        {/* Tooltip Readout */}
        <text 
          x={-14}
          y={4} 
          textAnchor="end" 
          className="text-[9.5px] font-mono font-bold fill-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}
        >
          {formatLatStr(latitude)}
        </text>
      </g>
    </g>
  );
};

export default ArmillaryRail;
