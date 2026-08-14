import React, { useState, useRef, useCallback } from 'react';
import { CONFIG, toRadians, toDegrees } from '../../utils/cosmicMath';

const PRIMARY_MERIDIANS = [
  { lon: 0, label: "Prime Meridian (0° Greenwich)", short: "Prime (0°)" },
  { lon: 180, label: "Intl Date Line (180°)", short: "IDL (180°)" },
  { lon: 90, label: "90° East (Asia)", short: "90° E" },
  { lon: -90, label: "90° West (Americas)", short: "90° W" }
];

const CITY_MERIDIANS = [
  { lon: -74.0, label: "New York (74.0° W)", short: "New York" },
  { lon: 139.7, label: "Tokyo (139.7° E)", short: "Tokyo" },
  { lon: -122.8, label: "Olympia / WA (122.8° W)", short: "Olympia" },
  { lon: 0, label: "Greenwich / UK (0°)", short: "Greenwich" }
];

export const PolarLongitudeSelector = ({ longitude, onChange, isDarkMode = true }) => {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);
  
  // Internal coordinate system (fixed 200x200 logic)
  const size = 200, radius = 65, center = size / 2;
  const angleRad = toRadians(90 - longitude);
  
  // Visual handle position (internal coords)
  const handleX = center + radius * Math.cos(angleRad);
  const handleY = center + radius * Math.sin(angleRad);

  const updateLongitude = useCallback((clientX, clientY) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const dx = clientX - (rect.left + centerX);
    const dy = clientY - (rect.top + centerY);
    
    let newLon = 90 - toDegrees(Math.atan2(dy, dx));
    newLon = ((newLon + 180) % 360 + 360) % 360 - 180;
    onChange(Math.round(newLon));
  }, [onChange]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateLongitude(e.clientX, e.clientY);
  };

  return (
    <div className="flex flex-col items-center select-none w-full space-y-3 touch-none">
      
      {/* 360° Polar Dial Canvas */}
      <div 
        className={`w-full max-w-[190px] aspect-square relative touch-none shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => isDragging && updateLongitude(e.clientX, e.clientY)}
        onPointerUp={(e) => { 
          setIsDragging(false); 
          e.currentTarget.releasePointerCapture(e.pointerId); 
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%" className="drop-shadow-lg pointer-events-none overflow-visible">
          {/* Dial Background */}
          <circle cx={center} cy={center} r={radius + 18} fill={isDarkMode ? "#090d16" : "#f8fafc"} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1.5" />
          
          {/* Axis Spoke Lines */}
          {[0, 45, 90, 135].map(deg => (
            <line key={deg}
              x1={center + (radius + 10) * Math.cos(toRadians(deg))} 
              y1={center + (radius + 10) * Math.sin(toRadians(deg))} 
              x2={center + (radius + 10) * Math.cos(toRadians(deg + 180))} 
              y2={center + (radius + 10) * Math.sin(toRadians(deg + 180))} 
              stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3 3"
            />
          ))}

          {/* Prime Meridian (0°) Highlighted Line & Badge */}
          <line x1={center} y1={center} x2={center} y2={center - radius - 14} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
          <text x={center} y={center - radius - 18} textAnchor="middle" className="text-[7.5px] font-mono font-black fill-amber-400">
            PRIME MERIDIAN (0°)
          </text>

          {/* Outer Ring */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke={isDarkMode ? "#475569" : "#475569"} strokeWidth="2" />
          
          {/* Active Ray */}
          <line x1={center} y1={center} x2={handleX} y2={handleY} stroke="#f59e0b" strokeWidth="2.5" />
          <g transform={`translate(${handleX}, ${handleY})`}>
            <circle r="8" fill="white" fillOpacity="0.9" />
            <circle r="4" fill="#f59e0b" stroke="white" strokeWidth="1.5" className="shadow-md" />
          </g>

          {/* Center Readout */}
          <circle cx={center} cy={center} r="20" fill={isDarkMode ? "#1e293b" : "white"} stroke={isDarkMode ? "#475569" : "#e2e8f0"} strokeWidth="1.5" />
          <text x={center} y={center + 3.5} textAnchor="middle" className="text-[10px] font-black fill-amber-400 font-mono">
            {Math.abs(longitude)}°{longitude >= 0 ? (longitude === 0 ? '' : 'E') : 'W'}
          </text>
        </svg>
      </div>

      {/* Preset Quick Buttons Categorized */}
      <div className="w-full space-y-2 text-xs">
        {/* Primary Meridians */}
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1 text-center">
            Standard Reference Meridians:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRIMARY_MERIDIANS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChange(preset.lon)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border text-center ${
                  Math.abs(longitude - preset.lon) < 1.5
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-amber-500'
                }`}
              >
                {preset.short}
              </button>
            ))}
          </div>
        </div>

        {/* City Reference Observatories */}
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1 text-center">
            Observatory & City Presets:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CITY_MERIDIANS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChange(preset.lon)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border text-center ${
                  Math.abs(longitude - preset.lon) < 1.5
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-amber-500'
                }`}
              >
                {preset.short}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PolarLongitudeSelector;

