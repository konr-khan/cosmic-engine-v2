import React from 'react';
import { Sun } from 'lucide-react';
import { 
  formatTime, 
  toDegrees,
  toRadians,
  getSectorPath 
} from '../../../utils/cosmicMath';
import { AnnualSolarMatrixItem, SolarAlmanacData } from '../../../types';

export interface PolarSunlightDialProps {
  solarData?: SolarAlmanacData | null;
  activeData: AnnualSolarMatrixItem;
  currentTime?: number;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  timeMode: 'solar' | 'utc';
  setTimeMode: (mode: 'solar' | 'utc') => void;
  lonOffsetHours: number;
  eotOffsetHours: number;
}

export const PolarSunlightDial: React.FC<PolarSunlightDialProps> = ({
  solarData,
  activeData,
  currentTime = 12,
  hoverTime,
  onHoverTime,
  timeMode,
  setTimeMode,
  lonOffsetHours,
  eotOffsetHours,
}) => {
  const {
    dayLength = activeData.dayLength,
    civil = 13,
    nautical = 14,
    astronomical = 15,
    solarNoon = activeData.solarNoon ?? 12,
    isPolarNight = false,
    isMidnightSun = false,
  } = solarData || {};

  const radius = 90;
  const center = 110;
  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  // Mode-dependent rotation & hand calculation
  const rotationAngle = timeMode === 'solar' ? 0 : solarNoon * 15;
  const localDisplayTime = ((displayTime + lonOffsetHours + eotOffsetHours) % 24 + 24) % 24;
  const handAngle = timeMode === 'solar' 
    ? (localDisplayTime - 12) * 15 - 90 
    : displayTime * 15 - 90;

  let polarMainText: string, polarSubText: string, polarMainClass: string, polarSubClass: string;
  if (isMidnightSun) {
    polarMainText = "MIDNIGHT";
    polarSubText = "SUN";
    polarMainClass = "text-sm font-bold fill-amber-400 font-mono tracking-widest";
    polarSubClass = polarMainClass;
  } else if (isPolarNight) {
    polarMainText = "POLAR";
    polarSubText = "NIGHT";
    polarMainClass = "text-sm font-bold fill-indigo-400 font-mono tracking-widest";
    polarSubClass = polarMainClass;
  } else {
    const hours = Math.floor(dayLength);
    const minutes = Math.round((dayLength - hours) * 60);
    polarMainText = `${hours}h ${minutes}m`;
    polarSubText = timeMode === 'solar' ? "SOLAR DAYLIGHT" : "UTC DAYLIGHT";
    polarMainClass = "text-xl font-bold fill-amber-400 font-mono tracking-tight";
    polarSubClass = "text-[7px] font-bold fill-amber-400/80 uppercase tracking-widest";
  }

  const handlePolarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onHoverTime) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = toDegrees(Math.atan2(dy, dx));

    if (timeMode === 'solar') {
      const localTime = (((angle + 90) / 15 + 12) % 24 + 24) % 24;
      const utcHoverTime = ((localTime - lonOffsetHours - eotOffsetHours) % 24 + 24) % 24;
      const quantized = Math.round(utcHoverTime * 20) / 20;
      onHoverTime(quantized);
    } else {
      const utcAngle = angle + 90;
      const utcTime = ((utcAngle / 15) % 24 + 24) % 24;
      const quantized = Math.round(utcTime * 20) / 20;
      onHoverTime(quantized);
    }
  };

  return (
    <div className="xl:col-span-4 2xl:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 shadow-inner">
      <div className="w-full flex justify-between items-center mb-2 px-1 font-mono text-xs text-slate-400">
        <span className="font-semibold text-amber-400 flex items-center gap-1 font-sans text-xs uppercase tracking-wider">
          <Sun className="w-3.5 h-3.5" /> 24h Polar Sunlight Clock
        </span>
        {/* Segmented Time Mode Toggle */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
          <button
            onClick={() => setTimeMode('solar')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'solar'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Solar Noon Anchored at 12 o'clock Top (Local Solar Time)"
          >
            ☀️ Solar
          </button>
          <button
            onClick={() => setTimeMode('utc')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'utc'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="00:00 UTC Anchored at Top (Universal Time)"
          >
            🌐 UTC
          </button>
        </div>
      </div>

      <div 
        className="relative cursor-crosshair group touch-none flex justify-center w-full my-1"
        onPointerMove={handlePolarPointerMove}
        onPointerLeave={() => onHoverTime && onHoverTime(null)}
      >
        <svg width="220" height="220" className="drop-shadow-lg overflow-visible">
          <defs>
            <linearGradient id="solarAlmanacPolarDayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="solarAlmanacPolarCivilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="solarAlmanacPolarNauticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="solarAlmanacPolarAstroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {/* Base Dial Plate with Subtle Border */}
          <circle cx={center} cy={center} r={radius} fill="#0b0f19" stroke="#334155" strokeWidth="1" />

          {/* Sector Paths */}
          <g transform={`rotate(${rotationAngle}, ${center}, ${center})`}>
            <path d={getSectorPath(astronomical, center, radius)} fill="url(#solarAlmanacPolarAstroGrad)" />
            <path d={getSectorPath(nautical, center, radius)} fill="url(#solarAlmanacPolarNauticalGrad)" />
            <path d={getSectorPath(civil, center, radius)} fill="url(#solarAlmanacPolarCivilGrad)" />
            <path d={getSectorPath(dayLength, center, radius)} fill="url(#solarAlmanacPolarDayGrad)" />
          </g>

          {/* Dial 24-Hour Tick Marks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = i * 15 - 90;
            const isMajor = i % 6 === 0;
            const tickLen = isMajor ? 6 : 3;
            const x1 = center + (radius - tickLen) * Math.cos(toRadians(angle));
            const y1 = center + (radius - tickLen) * Math.sin(toRadians(angle));
            const x2 = center + radius * Math.cos(toRadians(angle));
            const y2 = center + radius * Math.sin(toRadians(angle));
            return (
              <line 
                key={i} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke={isMajor ? "#64748b" : "#334155"} 
                strokeWidth={isMajor ? 1 : 0.5} 
              />
            );
          })}

          {/* Hand Vector Line */}
          <line 
            x1={center} y1={center} 
            x2={center + radius * Math.cos(toRadians(handAngle))} 
            y2={center + radius * Math.sin(toRadians(handAngle))} 
            stroke={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "#f8fafc"} 
            strokeWidth={hoverTime !== null && hoverTime !== undefined ? 2 : 1.5} 
            strokeLinecap="round" 
          />
          <circle cx={center} cy={center} r="3" fill={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "#f8fafc"} />
          
          {/* Dial Cardinal Labels */}
          {timeMode === 'solar' ? (
            <>
              <text x={center} y={center - radius - 6} textAnchor="middle" className="text-[9px] font-mono fill-amber-400 font-semibold">12:00 (Noon)</text>
              <text x={center} y={center + radius + 12} textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-medium">00:00 (Midnight)</text>
              <text x={center - radius - 4} y={center + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-500">06:00</text>
              <text x={center + radius + 4} y={center + 3} textAnchor="start" className="text-[8px] font-mono fill-slate-500">18:00</text>
            </>
          ) : (
            <>
              <text x={center} y={center - radius - 6} textAnchor="middle" className="text-[9px] font-mono fill-indigo-400 font-semibold">00:00 UTC</text>
              <text x={center} y={center + radius + 12} textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-medium">12:00 UTC</text>
              <text x={center - radius - 4} y={center + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-500">18:00</text>
              <text x={center + radius + 4} y={center + 3} textAnchor="start" className="text-[8px] font-mono fill-slate-500">06:00</text>
            </>
          )}
          
          {/* Center Hub Overlay */}
          <circle cx={center} cy={center} r="40" fill="#020617" stroke="#334155" strokeWidth="1" />
          <text x={center} y={center - 3} textAnchor="middle" className={polarMainClass}>{polarMainText}</text>
          <text x={center} y={center + 10} textAnchor="middle" className={polarSubClass}>{polarSubText}</text>
        </svg>

        {/* Hover Pill Readout */}
        {hoverTime !== null && hoverTime !== undefined && (() => {
          const localHover = ((hoverTime + lonOffsetHours + eotOffsetHours) % 24 + 24) % 24;
          return (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-sky-950/95 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold shadow-xl pointer-events-none whitespace-nowrap">
              {timeMode === 'solar'
                ? `${formatTime(localHover).substring(0, 5)} LST (${formatTime(hoverTime).substring(0, 5)}Z)`
                : `${formatTime(hoverTime).substring(0, 5)}Z (${formatTime(localHover).substring(0, 5)} LST)`
              }
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default PolarSunlightDial;
