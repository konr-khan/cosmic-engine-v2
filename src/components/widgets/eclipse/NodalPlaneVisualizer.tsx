import React from 'react';
import { EclipseData } from '../../../types';

export interface NodalPlaneVisualizerProps {
  eclipse?: EclipseData | null;
}

export const NodalPlaneVisualizer: React.FC<NodalPlaneVisualizerProps> = ({ eclipse }) => {
  if (!eclipse) return null;

  const beta = eclipse.beta;
  const distKm = eclipse.distanceKm || 384000;
  const offsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));

  return (
    <div className="w-full h-full flex flex-col justify-between p-2">
      <div className="text-xs text-slate-300 mb-1 font-mono flex justify-between items-center">
        <span className="font-bold text-amber-300">Why Eclipses Don't Happen Every Month:</span>
        <span className="text-emerald-400 font-bold">Moon Orbit Tilt = 5.14°</span>
      </div>

      <svg viewBox="0 0 500 180" className="w-full h-full max-h-[180px]" preserveAspectRatio="xMidYMid meet">
        {/* Ecliptic Reference Line (0°) */}
        <line x1="20" y1="90" x2="480" y2="90" stroke="#f59e0b" strokeWidth="1.2" />
        <text x="30" y="82" className="text-[10px] font-mono font-bold fill-amber-400">Ecliptic Plane (0° Earth-Sun Orbit)</text>

        {/* Tilted Lunar Orbit Line (5.14°) */}
        <line x1="30" y1="150" x2="470" y2="30" stroke="#10b981" strokeWidth="1.2" strokeDasharray="5 3" />
        <text x="360" y="34" className="text-[10px] font-mono font-bold fill-emerald-400">Moon Orbit (5.14° Tilt)</text>

        {/* Eclipse Corridor Threshold Box (< 1.5°) */}
        <rect x="202" y="72" width="96" height="36" fill="#f43f5e" fillOpacity="0.08" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" rx="6" />
        <text x="250" y="66" textAnchor="middle" className="text-[8px] font-mono font-bold fill-rose-300">
          ECLIPSE CORRIDOR (|β| &lt; 1.5°)
        </text>

        {/* Intersection Node Point (Ascending Node ☊) */}
        <circle cx="250" cy="90" r="8" fill="#f43f5e" opacity="0.25" />
        <circle cx="250" cy="90" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
        <text x="250" y="112" textAnchor="middle" className="text-[10px] font-mono font-bold fill-rose-400">
          Ascending Node ☊ (Eclipse Crossing Point)
        </text>

        {/* Current Moon Position Marker along Tilted Path */}
        {(() => {
          const nodeX = 250 + (beta * 32);
          const nodeY = 90 - (beta * 32 * (120 / 440));
          return (
            <g transform={`translate(${nodeX}, ${nodeY})`}>
              <line x1="0" y1="0" x2="0" y2={90 - nodeY} stroke={eclipse.isEclipseActive ? '#f43f5e' : '#64748b'} strokeWidth="1" strokeDasharray="2 2" />
              <circle 
                r="8" 
                fill={eclipse.isEclipseActive ? '#f43f5e' : '#f8fafc'} 
                stroke={eclipse.isEclipseActive ? '#fbbf24' : '#475569'} 
                strokeWidth="1.5" 
                className="drop-shadow-md" 
              />
              <text 
                x="12" 
                y="4" 
                className={`text-[10px] font-mono font-bold ${eclipse.isEclipseActive ? 'fill-amber-300' : 'fill-slate-300'}`}
              >
                CURRENT MOON (β = {beta}°, Y = {offsetKm > 0 ? `+${offsetKm.toLocaleString()}` : offsetKm.toLocaleString()} km)
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 gap-1.5">
        <span>Node Alignment Proximity: <strong className="text-amber-400">{eclipse.nodeProximityDeg}°</strong></span>
        <span>Ecliptic Plane Latitude (β): <strong className="text-emerald-400">{beta}°</strong></span>
        <span>State: <strong className={eclipse.isEclipseActive ? 'text-rose-400' : 'text-slate-300'}>{eclipse.isEclipseActive ? 'ALIGNMENT ACHIEVED' : 'MISSED (Outside Plane)'}</strong></span>
      </div>
    </div>
  );
};

export default NodalPlaneVisualizer;
