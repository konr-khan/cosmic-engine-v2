import React, { useState, useRef, useCallback } from 'react';
import { CONFIG, toRadians, toDegrees } from '../../utils/cosmicMath';

export interface PolarLongitudeSelectorProps {
  longitude: number;
  onChange: (lon: number) => void;
  isDarkMode?: boolean;
}

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

export const PolarLongitudeSelector: React.FC<PolarLongitudeSelectorProps> = ({ 
  longitude, 
  onChange, 
  isDarkMode = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);
  
  // Internal coordinate system (fixed 200x200 logic)
  const size = 200, radius = 65, center = size / 2;
  const angleRad = toRadians(90 - longitude);
  
  // Visual handle position (internal coords)
  const handleX = center + radius * Math.cos(angleRad);
  const handleY = center + radius * Math.sin(angleRad);

  const updateLongitude = useCallback((clientX: number, clientY: number) => {
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full pointer-events-none drop-shadow-md overflow-visible">
          {/* Outer Earth Circle (Northern Hemisphere Polar View) */}
          <circle cx={center} cy={center} r={radius} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          
          {/* Concentric Latitude Rings (80°N, 60°N, 30°N, 0° Equator) */}
          <circle cx={center} cy={center} r={radius * 0.33} fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
          <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
          
          {/* 12-Spoke Longitude Radial Lines (every 30°) */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = toRadians(deg);
            const x2 = center + radius * Math.cos(rad);
            const y2 = center + radius * Math.sin(rad);
            const isMajor = deg % 90 === 0;
            return (
              <line 
                key={deg} 
                x1={center} y1={center} 
                x2={x2} y2={y2} 
                stroke={isMajor ? "#475569" : "#334155"} 
                strokeWidth={isMajor ? 1 : 0.5} 
                opacity={isMajor ? 0.7 : 0.4} 
              />
            );
          })}

          {/* Meridian Quadrant Labels */}
          <text x={center} y={center - radius - 8} textAnchor="middle" className="text-[9px] font-mono fill-indigo-400 font-bold">0° (Prime)</text>
          <text x={center} y={center + radius + 14} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">180° (IDL)</text>
          <text x={center + radius + 8} y={center + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">90°E</text>
          <text x={center - radius - 8} y={center + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-400">90°W</text>

          {/* Active Radial Indicator Needle */}
          <line 
            x1={center} y1={center} 
            x2={handleX} y2={handleY} 
            stroke="#6366f1" 
            strokeWidth="2" 
          />

          {/* Draggable Handle Indicator at Edge */}
          <circle cx={handleX} cy={handleY} r="7" fill="#0f172a" stroke="#6366f1" strokeWidth="2.5" className="drop-shadow-lg" />
          <circle cx={handleX} cy={handleY} r="2.5" fill="#6366f1" />

          {/* North Pole Center Hub */}
          <circle cx={center} cy={center} r="3" fill="#6366f1" />
        </svg>
      </div>

      {/* Preset Meridian Quick-Jump Chips */}
      <div className="w-full flex flex-col space-y-1.5 pt-1">
        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-center">
          Fast City &amp; Meridian Jumps
        </div>
        <div className="grid grid-cols-2 gap-1.5 w-full">
          {CITY_MERIDIANS.map((item) => {
            const isSelected = Math.abs(longitude - item.lon) < 1;
            return (
              <button
                key={item.short}
                onClick={() => onChange(item.lon)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer text-center ${
                  isSelected 
                    ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                    : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                {item.short} ({item.lon > 0 ? `${item.lon}°E` : item.lon < 0 ? `${Math.abs(item.lon)}°W` : '0°'})
              </button>
            );
          })}
        </div>
      </div>
      
      <span className="text-xs text-slate-400 font-medium">
        Drag dial around pole or select preset
      </span>
    </div>
  );
};

export default PolarLongitudeSelector;
