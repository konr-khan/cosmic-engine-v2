import React, { useState, useRef, useCallback } from 'react';
import { CONFIG, toRadians } from '../../utils/cosmicMath';

export interface LatitudeSliderProps {
  latitude: number;
  onChange: (lat: number) => void;
  isDarkMode?: boolean;
}

export const LatitudeSlider: React.FC<LatitudeSliderProps> = ({ 
  latitude, 
  onChange, 
  isDarkMode = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const globeRef = useRef<HTMLDivElement>(null);
  
  // Internal coordinate system
  const { size, radius, sliderX, labelsX } = { size: 200, radius: 65, sliderX: 135, labelsX: 148 };
  const centerY = size / 2, centerX = 65;
  const handleY = centerY + (-radius * (latitude / 90));

  const updateLat = useCallback((clientY: number) => {
    if (!globeRef.current) return;
    const rect = globeRef.current.getBoundingClientRect();
    const centerY = rect.height / 2;
    const relativeY = clientY - (rect.top + centerY);
    const scaleFactor = size / rect.height;
    const internalY = relativeY * scaleFactor;
    
    const clampedY = Math.max(-radius, Math.min(radius, internalY));
    const linearLat = Math.round(-90 * (clampedY / radius));
    onChange(Math.max(-90, Math.min(90, linearLat)));
  }, [onChange, radius, size]);

  return (
    <div className="flex flex-col items-center select-none w-full space-y-2 touch-none">
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
          const internalY = centerY + (-radius * (preset.lat / 90));
          const customTop = `${(internalY / size) * 100}%`;
          const isSelected = Math.abs(latitude - preset.lat) < 2;

          return (
            <button 
              key={preset.label} 
              onPointerDown={(e) => { e.stopPropagation(); onChange(preset.lat); }}
              className={`absolute text-[9.5px] font-mono transition-all duration-150 rounded px-1 -translate-y-1/2 cursor-pointer z-10 ${
                isSelected 
                  ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              style={{ 
                left: `${(labelsX / size) * 100}%`,
                top: customTop,
                whiteSpace: 'nowrap'
              }}
            >
              {preset.label}
            </button>
          );
        })}

        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full pointer-events-none drop-shadow-md overflow-visible">
          {/* Globe Background and Ring */}
          <circle cx={centerX} cy={centerY} r={radius} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          
          {/* Vertical Slider Guide Axis */}
          <line x1={sliderX} y1={centerY - radius} x2={sliderX} y2={centerY + radius} stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />

          {/* Latitude Lines on Globe */}
          {[-66.5, -23.5, 0, 23.5, 66.5].map((lat) => {
            const y = centerY + (-radius * Math.sin(toRadians(lat)));
            const rx = radius * Math.cos(toRadians(lat));
            const tickY = centerY + (-radius * (lat / 90));
            return (
              <g key={lat}>
                <ellipse cx={centerX} cy={y} rx={rx} ry={rx * 0.25} fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.4" />
                <line x1={sliderX - 4} y1={tickY} x2={sliderX + 4} y2={tickY} stroke="#64748b" strokeWidth="1" />
              </g>
            );
          })}

          {/* Current Latitude Indicator Line */}
          <line x1={sliderX - 8} y1={handleY} x2={sliderX + 8} y2={handleY} stroke="#f43f5e" strokeWidth="2" />
          <line x1={centerX - radius} y1={handleY} x2={sliderX} y2={handleY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

          {/* Draggable Handle Thumb on Slider Axis */}
          <circle cx={sliderX} cy={handleY} r="7" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" className="drop-shadow-lg" />
          <circle cx={sliderX} cy={handleY} r="2.5" fill="#f43f5e" />
        </svg>
      </div>

      <span className="text-xs text-slate-400 font-medium">
        Drag vertical slider or click presets
      </span>
    </div>
  );
};

export default LatitudeSlider;
