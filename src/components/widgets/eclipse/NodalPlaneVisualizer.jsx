import React from 'react';

export const NodalPlaneVisualizer = ({ eclipse }) => {
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
        <line x1="20" y1="90" x2="480" y2="90" stroke="#f59e0b" strokeWidth="2" />
        <text x="30" y="82" className="text-[10px] font-mono font-bold fill-amber-400">Ecliptic Plane (0° Earth-Sun Orbit)</text>

        {/* Tilted Lunar Orbit Line (5.14°) */}
        <line x1="30" y1="150" x2="470" y2="30" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
        <text x="360" y="34" className="text-[10px] font-mono font-bold fill-emerald-400">Moon Orbit (5.14° Tilt)</text>

        {/* Intersection Node Point (Ascending Node ☊) */}
        <circle cx="250" cy="90" r="6" fill="#f43f5e" stroke="white" strokeWidth="1.5" className="animate-ping" />
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
              <line x1="0" y1="0" x2="0" y2={90 - nodeY} stroke={eclipse.isEclipseActive ? '#f43f5e' : '#94a3b8'} strokeWidth="1.5" strokeDasharray="2 2" />
              <circle 
                r="9" 
                fill={eclipse.isEclipseActive ? '#f43f5e' : '#e2e8f0'} 
                stroke={eclipse.isEclipseActive ? '#ffffff' : '#475569'} 
                strokeWidth="2" 
                className="drop-shadow" 
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

        {/* Eclipse Corridor Threshold Box (< 1.5°) */}
        <rect x="202" y="72" width="96" height="36" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" rx="6" />
        <text x="250" y="66" textAnchor="middle" className="text-[8px] font-mono font-bold fill-rose-300">
          ±1.5° Eclipse Corridor
        </text>
      </svg>

      {/* Alignment Proximity Meter & Physical Explanation */}
      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Node Proximity Metric:</span>
          <span className={`font-bold ${eclipse.isEclipseActive ? 'text-amber-400' : 'text-slate-300'}`}>
            {eclipse.alignmentPercent}% Node Alignment (Ecliptic Lat β: {beta}°)
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${eclipse.isEclipseActive ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-indigo-600'}`} 
            style={{ width: `${eclipse.alignmentPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
          {Math.abs(beta) < 1.5 ? (
            <span className="text-amber-300 font-bold">✨ Inside Eclipse Corridor! The Moon is aligned near the node line so its shadow hits Earth.</span>
          ) : (
            <span>💡 The Moon is <strong>{Math.abs(offsetKm).toLocaleString()} km</strong> {offsetKm > 0 ? 'above' : 'below'} the ecliptic plane, causing its shadow to pass into empty space.</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default NodalPlaneVisualizer;
