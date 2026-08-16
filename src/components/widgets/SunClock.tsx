import React from 'react';
import { Sun } from 'lucide-react';
import { CONFIG, toRadians, toDegrees, formatTime, getSectorPath, clamp } from '../../utils/cosmicMath';
import { SolarAlmanacData } from '../../types';

export interface SunClockProps {
  solarData?: SolarAlmanacData | null;
  currentTime?: number;
  latitude?: number;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
}

export const SunClock: React.FC<SunClockProps> = ({ 
  solarData, 
  currentTime = 12, 
  latitude = 47.06, 
  hoverTime, 
  onHoverTime 
}) => {
  const { 
    dayLength = 12, civil = 13, nautical = 14, astronomical = 15, 
    noonElevation = 45, solarNoon = 12, equationOfTime = 0, 
    isPolarNight = false, isMidnightSun = false, sunrise = 6, sunset = 18, declination = 0 
  } = solarData || {};
  
  const radius = 90;
  const center = 110;
  // 00:00 UTC is at the top (12 o'clock); Solar Noon (12:00) is at the bottom (6 o'clock)
  const rotationAngle = (solarNoon * 15);

  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  // Instantaneous Elevation Math (Clamped to [-1, 1] to prevent NaN at subsolar zenith)
  const hourAngle = (displayTime - solarNoon) * 15; 
  const sinAlt = 
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(declination as number)) + 
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(declination as number)) * Math.cos(toRadians(hourAngle));
  const currentElevation = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));

  // 2D Elevation Arc Viewport Coordinates
  const elR = 62;
  const elCx = 100;
  const elCy = 72;
  const sunX = elCx + elR * Math.sin(toRadians(hourAngle));
  const sunY = elCy - elR * Math.sin(toRadians(currentElevation)); 
  
  // Clock Hand Angle: 00:00 UTC at -90° (top), 06:00 UTC at 0° (right), 12:00 UTC at 90° (bottom), 18:00 UTC at 180° (left)
  const handAngle = displayTime * 15 - 90;

  // Display Text Logic
  let mainText: string, subText: string, mainClass: string, subClass: string;
  if (isMidnightSun) {
    mainText = "MIDNIGHT"; 
    subText = "SUN";
    mainClass = "text-sm font-bold fill-amber-400 font-mono tracking-widest";
    subClass = mainClass;
  } else if (isPolarNight) {
    mainText = "POLAR"; 
    subText = "NIGHT";
    mainClass = "text-sm font-bold fill-indigo-400 font-mono tracking-widest";
    subClass = mainClass;
  } else {
    const hours = Math.floor(dayLength);
    const minutes = Math.round((dayLength - hours) * 60);
    mainText = `${hours}h ${minutes}m`;
    subText = "HOURS OF SUNLIGHT";
    mainClass = "text-xl font-bold fill-amber-400 font-mono tracking-tight";
    subClass = "text-[7px] font-bold fill-amber-400/80 uppercase tracking-widest"; 
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onHoverTime) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = toDegrees(Math.atan2(dy, dx)) + 90;
    let t = ((angle / 15) % 24 + 24) % 24;
    const quantized = Math.round(t * 20) / 20;
    onHoverTime(quantized);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between items-center select-none space-y-3">
      
      {/* Upper Area: 24-Hour Polar Sector Dial (00:00 UTC at Top, 12:00 UTC at Bottom) */}
      <div 
        className="relative cursor-crosshair group touch-none flex justify-center w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onHoverTime && onHoverTime(null)}
      >
        <svg width="220" height="220" className="drop-shadow-lg overflow-visible">
          <circle cx={center} cy={center} r={radius + 5} fill={CONFIG.THEME.NIGHT_BG} stroke="#334155" strokeWidth="1" />
          <circle cx={center} cy={center} r={radius} fill={CONFIG.THEME.NIGHT_STROKE} stroke="#334155" strokeWidth="2" />
          {[0, 6, 12, 18].map(h => {
             const a = h * 15 - 90;
             return <line key={h} x1={center + (radius - 5) * Math.cos(toRadians(a))} y1={center + (radius - 5) * Math.sin(toRadians(a))} x2={center + radius * Math.cos(toRadians(a))} y2={center + radius * Math.sin(toRadians(a))} stroke="#64748b" strokeWidth="2" />;
          })}
          <g transform={`rotate(${rotationAngle}, ${center}, ${center})`}>
             <path d={getSectorPath(astronomical, center, radius)} fill="#4338ca" opacity="0.3" />
             <path d={getSectorPath(nautical, center, radius)} fill="#3b82f6" opacity="0.4" />
             <path d={getSectorPath(civil, center, radius)} fill="#f87171" opacity="0.5" />
             <path d={getSectorPath(dayLength, center, radius)} fill={CONFIG.THEME.SUN_FILL} opacity="0.8" />
             <line x1={center} y1={center - radius} x2={center} y2={center - radius + 10} stroke={CONFIG.THEME.SUN_FILL} strokeWidth="2" />
          </g>
          
          {/* Active / Hover Ray */}
          <line 
            x1={center} y1={center} 
            x2={center + radius * Math.cos(toRadians(handAngle))} 
            y2={center + radius * Math.sin(toRadians(handAngle))} 
            stroke={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "white"} 
            strokeWidth={hoverTime !== null && hoverTime !== undefined ? 3 : 2} 
            strokeLinecap="round" 
          />
          <circle cx={center} cy={center} r="4" fill={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "white"} />
          <text x={center} y={center - radius - 12} textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">00:00 UTC</text>
          <text x={center} y={center + radius + 15} textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">12:00 UTC</text>
          
          {/* Center Hub Overlay */}
          <circle cx={center} cy={center} r="42" fill={CONFIG.THEME.NIGHT_BG} stroke="#334155" strokeWidth="2" />
          <text x={center} y={center - 4} textAnchor="middle" className={mainClass}>{mainText}</text>
          <text x={center} y={center + 10} textAnchor="middle" className={subClass}>{subText}</text>
        </svg>

        {/* Hover Pill Readout */}
        {hoverTime !== null && hoverTime !== undefined && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-sky-950/90 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-lg pointer-events-none">
            {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
          </div>
        )}
      </div>

      {/* Sun Elevation Arc Dome Viewport */}
      <div className="w-full bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col items-center shadow-inner">
        <div className="w-full flex justify-between items-center mb-1 px-2 font-mono">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" /> Sun Elevation Arc
          </div>
          <div className="text-[10px] font-bold text-amber-400">
            Noon Peak: <strong className="text-white">{(noonElevation as number).toFixed(1)}°</strong>
          </div>
        </div>

        <svg viewBox="0 0 200 90" className="w-full max-h-[85px] overflow-visible" preserveAspectRatio="xMidYMid meet">
          {/* Horizon Line (0°) */}
          <line x1="20" y1={elCy} x2="180" y2={elCy} stroke="#475569" strokeWidth="1.5" />
          <text x="18" y={elCy + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-500">0°</text>
          <text x="182" y={elCy + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-500">0°</text>

          {/* Semicircular Elevation Arc Dome */}
          <path d={`M ${elCx - elR} ${elCy} A ${elR} ${elR} 0 0 1 ${elCx + elR} ${elCy}`} fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3" />
          
          {/* Zenith Marker (90°) */}
          <line x1={elCx} y1={elCy - elR - 3} x2={elCx} y2={elCy - elR + 3} stroke="#64748b" strokeWidth="1" />
          <text x={elCx} y={elCy - elR - 6} textAnchor="middle" className="text-[8px] font-mono fill-slate-500">+90°</text>

          {/* Observer Horizon Center Origin */}
          <circle cx={elCx} cy={elCy} r="3" fill="#64748b" stroke="#334155" strokeWidth="1" />

          {/* Sun Elevation Vector & Disc */}
          {currentElevation > -18 && (
            <g>
              <line 
                x1={elCx} y1={elCy} 
                x2={sunX} y2={sunY} 
                stroke={currentElevation >= 0 ? "#fbbf24" : "#64748b"} 
                strokeWidth="1.5" 
                strokeDasharray="2 2" 
                opacity="0.8" 
              />
              <circle 
                cx={sunX} 
                cy={sunY} 
                r="6" 
                fill={currentElevation >= 0 ? "#fbbf24" : "#475569"} 
                stroke="#ffffff" 
                strokeWidth="1.5" 
                className="drop-shadow" 
              />
            </g>
          )}
        </svg>

        {/* Live Elevation Angle Readout Badge */}
        <div className="text-center -mt-3 bg-slate-950/90 px-3 py-0.5 rounded-lg border border-slate-800 shadow-md">
          <div className={`text-base font-mono font-bold ${currentElevation >= 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {currentElevation >= 0 ? `+${currentElevation.toFixed(1)}°` : `${currentElevation.toFixed(1)}°`}
            <span className="text-[9px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
              {currentElevation > 0 ? '(Above Horizon)' : '(Below Horizon)'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Footer Badges */}
      <div className="grid grid-cols-3 gap-2 w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
         <div className="text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Sunrise / Sunset</span>
            <span className="text-slate-200 font-bold">{formatTime(sunrise).substring(0, 5)} / {formatTime(sunset).substring(0, 5)}</span>
         </div>
         <div className="text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Solar Noon</span>
            <span className="text-amber-400 font-bold">{formatTime(solarNoon).substring(0, 5)} UTC</span>
         </div>
         <div className="text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Eq of Time</span>
            <span className={equationOfTime >= 0 ? 'text-indigo-400 font-bold' : 'text-rose-400 font-bold'}>
              {equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}
            </span>
         </div>
      </div>

    </div>
  );
};

export default SunClock;
