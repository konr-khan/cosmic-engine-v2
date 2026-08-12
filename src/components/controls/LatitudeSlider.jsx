import React, { useState, useRef, useCallback } from 'react';
import { CONFIG, toRadians, toDegrees } from '../../utils/cosmicMath';

export const LatitudeSlider = ({ latitude, onChange, isDarkMode = true }) => {
  const [isDragging, setIsDragging] = useState(false);
  const globeRef = useRef(null);
  
  // Internal coordinate system
  const { size, radius, sliderX, labelsX } = { size: 200, radius: 65, sliderX: 135, labelsX: 148 };
  const centerY = size / 2, centerX = 65;
  const latRad = toRadians(latitude);
  const handleY = centerY + (-radius * Math.sin(latRad));

  const updateLat = useCallback((clientY) => {
    if (!globeRef.current) return;
    const rect = globeRef.current.getBoundingClientRect();
    const centerY = rect.height / 2;
    const relativeY = clientY - (rect.top + centerY);
    const scaleFactor = size / rect.height;
    const internalY = relativeY * scaleFactor;
    
    const clampedY = Math.max(-radius, Math.min(radius, internalY));
    onChange(Math.round(toDegrees(-Math.asin(clampedY / radius))));
  }, [onChange, radius, size]);

  return (
    <div className="flex flex-col items-center select-none w-full space-y-2">
      <div 
        className={`w-full max-w-[230px] aspect-square relative touch-none shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={globeRef}
        onPointerDown={(e) => { 
          e.preventDefault(); 
          setIsDragging(true); 
          e.currentTarget.setPointerCapture(e.pointerId); 
          updateLat(e.clientY); 
        }}
        onPointerMove={(e) => isDragging && updateLat(e.clientY)}
        onPointerUp={(e) => { 
          setIsDragging(false); 
          e.currentTarget.releasePointerCapture(e.pointerId); 
        }}
      >
        {CONFIG.LAT_PRESETS.map((preset) => {
          const isNorthPole = preset.lat === 90;
          const isSouthPole = preset.lat === -90;
          let customTop = null;
          
          if (isNorthPole) customTop = '2%';
          else if (isSouthPole) customTop = '98%';
          else {
            const internalY = centerY + (-radius * Math.sin(toRadians(preset.lat)));
            customTop = `${(internalY / size) * 100}%`;
          }

          const isSelected = Math.abs(latitude - preset.lat) < 2;

          return (
            <button 
              key={preset.label} 
              onPointerDown={(e) => { e.stopPropagation(); onChange(preset.lat); }}
              className={`absolute text-[9px] leading-none transition-colors text-left pl-1 z-10 font-mono ${
                isSelected 
                  ? 'text-rose-400 font-black' 
                  : isDarkMode 
                  ? 'text-slate-400 hover:text-rose-300' 
                  : 'text-slate-500 hover:text-rose-600'
              }`}
              style={{ 
                top: customTop, 
                left: `${(labelsX / size) * 100}%`, 
                transform: isNorthPole ? 'translateY(0)' : (isSouthPole ? 'translateY(-100%)' : 'translateY(-50%)'),
                cursor: 'pointer' 
              }}
            >
              — {preset.short || preset.label}
            </button>
          );
        })}
        
        <svg viewBox="0 0 200 200" width="100%" height="100%" className="drop-shadow-lg pointer-events-none overflow-visible">
          <circle cx={centerX} cy={centerY} r={radius} fill={isDarkMode ? "#090d16" : "#f8fafc"} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1.5" />
          <path d={`M ${centerX} ${centerY - radius} L ${centerX} ${centerY + radius}`} stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="4 4" />
          <path d={`M ${centerX - radius} ${centerY} L ${centerX + radius} ${centerY}`} stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke={isDarkMode ? "#475569" : "#475569"} strokeWidth="2" />
          <ellipse cx={centerX} cy={handleY} rx={radius * Math.cos(latRad)} ry={radius * 0.15 * Math.cos(latRad)} fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2"/>
          <line x1={centerX - radius * Math.cos(latRad)} y1={handleY} x2={sliderX} y2={handleY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 2" opacity="0.6" />
          <line x1={sliderX} y1={centerY - radius} x2={sliderX} y2={centerY + radius} stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeWidth="4" strokeLinecap="round" />
          <g transform={`translate(${sliderX}, ${handleY})`}>
            <circle r="10" fill="white" fillOpacity="0.01" />
            <circle r="5" fill="#f43f5e" stroke="white" strokeWidth="2" className="shadow-md" />
            <text x="-16" y="3.5" textAnchor="end" className="text-[10px] font-black fill-rose-400 font-mono">{Math.abs(latitude)}°{latitude >= 0 ? 'N' : 'S'}</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LatitudeSlider;

