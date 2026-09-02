import React from 'react';
import { CONFIG } from '../../../utils/cosmicMath';
import { MILESTONES } from './milestones';
import { OrbitSvgCanvasProps } from './types';
import { MiniGlobe } from '../../common/MiniGlobe';

export interface ExtendedOrbitSvgCanvasProps extends OrbitSvgCanvasProps {
  sunLambdaDeg?: number;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  lunarOrbitRadius?: number;
  lunarOrbitPath?: string;
}

export const OrbitSvgCanvas: React.FC<ExtendedOrbitSvgCanvasProps> = ({
  renderSunX,
  renderSunY,
  renderEarthX,
  renderEarthY,
  renderMoonX,
  renderMoonY,
  orbitalRadius,
  bRatio,
  focus2X,
  exaggerateEccentricity,
  hoveredId,
  onHover,
  milestones = MILESTONES,
  sunLambdaDeg = 0,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12.0,
  lunarOrbitRadius,
  lunarOrbitPath
}) => {
  // In-plane solar illumination angle pointing from Earth toward Sun
  const sunAngleDeg = Math.atan2(renderSunY - renderEarthY, renderSunX - renderEarthX) * (180 / Math.PI);

  return (
    <svg 
      viewBox="-290 -280 580 560" 
      style={{ touchAction: 'none' }}
      className="w-full h-full max-h-[380px] overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Faint Concentric Distance Reference Rings (0.5 AU, 1.0 AU, 1.25 AU) */}
      <circle r="100" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.4" className="pointer-events-none" />
      <text x="0" y="-103" textAnchor="middle" className="text-[7px] font-mono fill-slate-500 select-none pointer-events-none">0.5 AU</text>

      <circle r="200" fill="none" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" strokeOpacity="0.6" className="pointer-events-none" />
      <text x="-142" y="-142" textAnchor="middle" className="text-[8px] font-mono fill-slate-400 font-bold select-none pointer-events-none">1.0 AU (149.6M km)</text>

      {/* Coordinate Crosshairs */}
      <line x1="-260" y1="0" x2="260" y2="0" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" className="pointer-events-none" />
      <line x1="0" y1="-260" x2="0" y2="260" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.3" className="pointer-events-none" />

      {/* Major Orbit Ellipse */}
      <ellipse 
        cx="0" 
        cy="0" 
        rx={orbitalRadius} 
        ry={orbitalRadius * bRatio} 
        fill="none" 
        stroke="#475569" 
        strokeWidth="1.2" 
        className="pointer-events-none"
      />

      {/* Kepler Empty Focus F2 indicator when exaggerated */}
      {exaggerateEccentricity && (
        <g transform={`translate(${focus2X}, 0)`} className="pointer-events-none">
          <circle r="3" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <text x="0" y="-6" textAnchor="middle" className="text-[7px] font-mono fill-slate-500">Focus F2 (Empty)</text>
        </g>
      )}

      {/* Line connecting Sun (Focus F1) to Earth */}
      <line 
        x1={renderSunX} 
        y1={renderSunY} 
        x2={renderEarthX} 
        y2={renderEarthY} 
        stroke="#e2e8f0" 
        strokeWidth="1" 
        strokeDasharray="3 2" 
        opacity="0.6" 
        className="pointer-events-none"
      />

      {/* Key Astronomical Orbital Milestones */}
      {milestones.map((m) => {
        const mx = m.rawX;
        const my = m.rawY * bRatio;
        const isHovered = hoveredId === m.id;
        return (
          <g key={m.id}>
            {/* Persistent Translucent Glowing Halo Node (Expands on Hover) */}
            <circle 
              cx={mx} 
              cy={my} 
              r={isHovered ? 18 : 11} 
              fill={m.color} 
              opacity={isHovered ? 0.45 : 0.20} 
              className={`pointer-events-none transition-all duration-200 ${isHovered ? 'animate-pulse' : ''}`} 
            />
            <circle 
              cx={mx} 
              cy={my} 
              r={isHovered ? 8 : 5.5} 
              fill={m.color} 
              stroke="#ffffff" 
              strokeWidth="1.5" 
              className="pointer-events-none transition-all duration-150 drop-shadow-md"
            />
            
            {/* Labels & Dates */}
            <text 
              x={mx + m.textDx} 
              y={my + m.textDy} 
              textAnchor={m.textAnchor} 
              className={`text-xs font-mono font-bold ${m.fillColor} select-none pointer-events-none drop-shadow-sm`}
            >
              {m.label}
            </text>
            <text 
              x={mx + m.textDx} 
              y={my + m.subDy} 
              textAnchor={m.textAnchor} 
              className="text-[10px] font-mono fill-slate-400 font-bold select-none pointer-events-none"
            >
              {m.date}
            </text>

            {/* Generous hit target area that does not flicker */}
            <circle
              cx={mx}
              cy={my}
              r="20"
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={() => onHover(m.id)}
              onPointerLeave={() => onHover(null)}
            />
          </g>
        );
      })}

      {/* Center Sun at Focus F1 */}
      <g transform={`translate(${renderSunX}, ${renderSunY})`} className="pointer-events-none">
        {/* Sun Corona Rays */}
        <circle r="22" fill={CONFIG.THEME.SUN_FILL} opacity="0.2" />
        <circle r="15" fill={CONFIG.THEME.SUN_FILL} stroke="#ffffff" strokeWidth="1.5" className="drop-shadow-lg" />
        <text x="0" y="3" textAnchor="middle" className="text-[8px] font-black fill-amber-950 font-mono select-none">
          SUN
        </text>
        {exaggerateEccentricity && (
          <text x="0" y="24" textAnchor="middle" className="text-[7px] font-mono fill-amber-400 font-bold select-none">
            Focus F1 (Sun)
          </text>
        )}
      </g>

      {/* Moon Orbit Ring around Earth */}
      {lunarOrbitPath ? (
        <path
          d={lunarOrbitPath}
          fill="none"
          stroke="#475569"
          strokeWidth="0.75"
          strokeDasharray="2 2"
          className="pointer-events-none"
        />
      ) : (
        <circle 
          cx={renderEarthX} 
          cy={renderEarthY} 
          r={lunarOrbitRadius ?? 28} 
          fill="none" 
          stroke="#475569" 
          strokeWidth="0.75" 
          strokeDasharray="2 2" 
          className="pointer-events-none" 
        />
      )}

      {/* High-Precision MiniGlobe with Sunward Terminator, 23.44° Axial Tilt & Parallels */}
      <MiniGlobe
        cx={renderEarthX}
        cy={renderEarthY}
        radius={11}
        viewMode="topdown"
        sunAngleDeg={sunAngleDeg}
        sunLambdaDeg={sunLambdaDeg}
        latitude={latitude}
        longitude={longitude}
        timeOfDay={timeOfDay}
        showTerminator={true}
        showParallels={true}
        showPolarAxis={true}
        showObserverPin={true}
        showAtmosphereGlow={true}
        showLabel={true}
        onPointerEnter={() => onHover('earth')}
        onPointerLeave={() => onHover(null)}
      />
      
      {/* Moon Body */}
      <circle 
        cx={renderMoonX} 
        cy={renderMoonY} 
        r="4.5" 
        fill="#f8fafc" 
        stroke="#334155" 
        strokeWidth="1" 
        className="drop-shadow pointer-events-none" 
      />
    </svg>
  );
};

export default OrbitSvgCanvas;
