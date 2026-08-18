import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Calendar, Clock, Target, Sun } from 'lucide-react';
import { 
  formatTime, 
  getDaysInYear, 
  toDegrees,
  toRadians,
  getSectorPath,
  clamp 
} from '../../utils/cosmicMath';
import { useAnnualSolarWorker } from '../../hooks/useEphemerisWorker';
import { AnnualSolarMatrixItem, SolarAlmanacData } from '../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SolarAlmanacProps {
  latitude?: number;
  longitude?: number;
  currentDay?: number;
  onDayChange?: (day: number) => void;
  year?: number;
  solarData?: SolarAlmanacData | null;
  currentTime?: number;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
}

export const SolarAlmanac: React.FC<SolarAlmanacProps> = ({ 
  latitude = 47.06, 
  longitude = -122.81, 
  currentDay = 1, 
  onDayChange, 
  year = 2026, 
  solarData,
  currentTime = 12,
  hoverTime, 
  onHoverTime 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const totalDays = getDaysInYear(year);
  const activeDay = Math.min(totalDays, hoverDay !== null ? hoverDay : currentDay);

  // Compute totalDays of solar twilight thresholds for the current latitude (offloaded to Web Worker)
  const almanacData: AnnualSolarMatrixItem[] = useAnnualSolarWorker({ year, latitude }) || [];

  const keyStats = useMemo(() => {
    let earliestSunrise = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let latestSunset = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let longestDay = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let shortestDay = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };

    almanacData.forEach(d => {
      if (d.sunrise < earliestSunrise.sunrise) earliestSunrise = d;
      if (d.sunset > latestSunset.sunset) latestSunset = d;
      if (d.dayLength > longestDay.dayLength) longestDay = d;
      if (d.dayLength < shortestDay.dayLength) shortestDay = d;
    });

    return { earliestSunrise, latestSunset, longestDay, shortestDay };
  }, [almanacData]);

  const width = 800;
  const height = 440;
  const paddingLeft = 55;
  const paddingRight = 65;
  const paddingTop = 30;
  const paddingBottom = 35;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const xToDay = useCallback((x: number): number => {
    const rawDay = 1 + ((x - paddingLeft) / chartW) * (totalDays - 1);
    return Math.max(1, Math.min(totalDays, Math.round(rawDay)));
  }, [chartW, paddingLeft, totalDays]);

  const dayToX = (day: number): number => paddingLeft + ((day - 1) / (totalDays - 1)) * chartW;
  const timeToY = (timeHours: number): number => {
    const clamped = Math.max(0, Math.min(24, timeHours));
    return paddingTop + chartH - (clamped / 24) * chartH;
  };

  const buildBandPath = (topKey: keyof AnnualSolarMatrixItem, bottomKey: keyof AnnualSolarMatrixItem): string => {
    if (!almanacData.length) return '';
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][topKey] as number)}`;
    for (let i = 0; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][topKey] as number)}`;
    }
    for (let i = almanacData.length - 1; i >= 0; i--) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][bottomKey] as number)}`;
    }
    path += ` Z`;
    return path;
  };

  const buildLinePath = (key: keyof AnnualSolarMatrixItem): string => {
    if (!almanacData.length) return '';
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][key] as number)}`;
    for (let i = 1; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][key] as number)}`;
    }
    return path;
  };

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * width;
    const svgY = (clientY / rect.height) * height;
    const day = xToDay(svgX);
    setHoverDay(day);

    // Calculate time from vertical Y position and broadcast hover time
    const relY = svgY - paddingTop;
    if (relY >= 0 && relY <= chartH && onHoverTime) {
      const timeVal = ((chartH - relY) / chartH) * 24;
      onHoverTime(parseFloat(timeVal.toFixed(3)));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handlePointer(e);
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    handlePointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    if (hoverDay !== null && onDayChange) {
      onDayChange(hoverDay);
    }
    setHoverDay(null);
    if (onHoverTime) onHoverTime(null);
    if (svgRef.current) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }
    }
  };

  const getDayLabel = (dayNum: number): string => {
    const d = new Date(year, 0, dayNum);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeData = almanacData[activeDay - 1] || almanacData[0] || { sunrise: 6, sunset: 18, dayLength: 12, solarNoon: 12 };
  const sunriseY = timeToY(activeData.sunrise);
  const sunsetY = timeToY(activeData.sunset);

  // Compute equivalent daylight mirror day across Solstice
  const mirrorDayData = useMemo<AnnualSolarMatrixItem | null>(() => {
    if (!almanacData.length) return null;
    const targetLength = activeData.dayLength;
    
    let bestDay: AnnualSolarMatrixItem | null = null;
    let minDiff = 999;
    
    almanacData.forEach(d => {
      if (Math.abs(d.day - activeDay) > 5 && Math.abs(d.day - activeDay) < (totalDays - 5)) {
        const diff = Math.abs(d.dayLength - targetLength);
        if (diff < minDiff) {
          minDiff = diff;
          bestDay = d;
        }
      }
    });
    
    return bestDay;
  }, [almanacData, activeDay, activeData.dayLength, totalDays]);

  // Fast-jump shortcut pins
  const shortcuts = [
    { label: "🌸 Mar Eq", day: 79, title: "Spring Equinox (Mar 20)" },
    { label: "☀️ Jun Sol", day: 172, title: "Summer Solstice (Jun 21)" },
    { label: "🍂 Sep Eq", day: 266, title: "Autumn Equinox (Sep 22)" },
    { label: "❄️ Dec Sol", day: 355, title: "Winter Solstice (Dec 21)" },
    { label: "🌅 Earliest Sunrise", day: keyStats.earliestSunrise.day, title: `Earliest Sunrise (${getDayLabel(keyStats.earliestSunrise.day)})` },
    { label: "🌇 Latest Sunset", day: keyStats.latestSunset.day, title: `Latest Sunset (${getDayLabel(keyStats.latestSunset.day)})` }
  ];

  // --- 24-Hour Polar Clock Dial Math & Render Logic ---
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
  const rotationAngle = solarNoon * 15;
  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;
  const handAngle = displayTime * 15 - 90;

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
    polarSubText = "HOURS OF SUNLIGHT";
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
    let angle = toDegrees(Math.atan2(dy, dx)) + 90;
    let t = ((angle / 15) % 24 + 24) % 24;
    const quantized = Math.round(t * 20) / 20;
    onHoverTime(quantized);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Date Badge & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          24-hour annual sun path showing daylight, twilights &amp; instantaneous 24h polar sector dial
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-slate-200">{getDayLabel(activeDay)}</span>
          <span className="text-slate-500">|</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-400">{(activeData.dayLength).toFixed(1)}h Daylight</span>
        </div>
      </div>

      {/* Solstice & Equinox Fast-Jump Shortcut Bar */}
      <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1.5 border-b border-slate-800/80 text-xs">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
          <Target className="w-3 h-3 text-indigo-400" /> Fast-Jump:
        </span>
        {shortcuts.map(s => {
          const isActive = Math.abs(activeDay - s.day) <= 1;
          return (
            <button
              key={s.label}
              onClick={() => onDayChange && onDayChange(s.day)}
              title={s.title}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' 
                  : 'bg-slate-900/60 hover:bg-slate-800 hover:text-white text-slate-300 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Main Dual-View Container: 365-Day Ribbon Chart + 24h Polar Sector Clock */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 items-center min-h-[340px]">
        
        {/* Left Side (8 cols on XL): Main 365-Day SVG Chart */}
        <div className="xl:col-span-8 2xl:col-span-8 relative w-full h-full min-h-[300px] touch-none flex items-center">
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full block overflow-visible"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => { setIsDragging(false); setHoverDay(null); if (onHoverTime) onHoverTime(null); }}
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
          >
            <defs>
              <linearGradient id="solarAlmanacDayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="solarAlmanacCivilGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="solarAlmanacNauticalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="solarAlmanacAstroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Night Base Canvas */}
            <rect x={paddingLeft} y={paddingTop} width={chartW} height={chartH} fill="#020617" rx="6" />

            {/* Twilight Bands */}
            <path d={buildBandPath('astroDusk', 'astroDawn')} fill="url(#solarAlmanacAstroGrad)" />
            <path d={buildBandPath('nauticalDusk', 'nauticalDawn')} fill="url(#solarAlmanacNauticalGrad)" />
            <path d={buildBandPath('civilDusk', 'civilDawn')} fill="url(#solarAlmanacCivilGrad)" />
            <path d={buildBandPath('sunset', 'sunrise')} fill="url(#solarAlmanacDayGrad)" />

            {/* Month Axis Dividers & Labels */}
            {MONTH_NAMES.map((m, idx) => {
              const firstDayOfMonth = Math.round(idx * 30.4 + 1);
              const x = dayToX(firstDayOfMonth);
              return (
                <g key={m}>
                  <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartH} stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="3 3" />
                  <text x={x + 10} y={height - 10} className="text-xs font-bold fill-slate-400 font-mono">{m}</text>
                </g>
              );
            })}

            {/* Time Axis Grid Lines & Labels */}
            {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((h) => {
              const y = timeToY(h);
              const label = h === 0 || h === 24 ? "12 AM" : (h === 12 ? "12 PM" : (h < 12 ? `${h} AM` : `${h - 12} PM`));
              const isMidnightOrNoon = h === 0 || h === 12 || h === 24;
              return (
                <g key={h}>
                  <line 
                    x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} 
                    stroke="#334155" 
                    strokeWidth={isMidnightOrNoon ? 0.75 : 0.5} 
                    strokeOpacity={isMidnightOrNoon ? 0.45 : 0.2} 
                  />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className={`text-xs font-mono ${isMidnightOrNoon ? 'fill-slate-200 font-bold' : 'fill-slate-400'}`}>
                    {label}
                  </text>
                  <text x={paddingLeft + chartW + 8} y={y + 4} textAnchor="start" className="text-xs font-mono fill-slate-400 font-bold">
                    {h === 0 || h === 24 ? "Midnight" : (h === 12 ? "Noon" : "")}
                  </text>
                </g>
              );
            })}

            {/* Boundary Curves */}
            <path d={buildLinePath('sunrise')} fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.85" />
            <path d={buildLinePath('sunset')} fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.85" />
            <path d={buildLinePath('solarNoon')} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
            <path d={buildLinePath('civilDawn')} fill="none" stroke="#475569" strokeWidth="0.75" opacity="0.5" />
            <path d={buildLinePath('civilDusk')} fill="none" stroke="#475569" strokeWidth="0.75" opacity="0.5" />

            {/* Key Stats Annotations */}
            <g transform={`translate(${dayToX(keyStats.earliestSunrise.day)}, ${timeToY(keyStats.earliestSunrise.sunrise)})`}>
              <circle r="3" fill="#000000" />
              <text y="14" textAnchor="middle" className="text-[10px] font-bold fill-indigo-300 font-mono">
                {getDayLabel(keyStats.earliestSunrise.day)}
              </text>
            </g>

            <g transform={`translate(${dayToX(keyStats.latestSunset.day)}, ${timeToY(keyStats.latestSunset.sunset)})`}>
              <circle r="3" fill="#000000" />
              <text y="-8" textAnchor="middle" className="text-[10px] font-bold fill-indigo-300 font-mono">
                {getDayLabel(keyStats.latestSunset.day)}
              </text>
            </g>

            {/* Dynamic Horizontal Guidelines for Sunrise & Sunset on Active Day */}
            <line 
              x1={paddingLeft} y1={sunriseY} 
              x2={paddingLeft + chartW} y2={sunriseY} 
              stroke="#eab308" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.85" 
            />
            <line 
              x1={paddingLeft} y1={sunsetY} 
              x2={paddingLeft + chartW} y2={sunsetY} 
              stroke="#eab308" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.85" 
            />

            {/* Synced Hover Time Horizontal Guideline */}
            {hoverTime !== null && hoverTime !== undefined && (
              <g>
                <line 
                  x1={paddingLeft} y1={timeToY(hoverTime)} 
                  x2={paddingLeft + chartW} y2={timeToY(hoverTime)} 
                  stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" className="drop-shadow-sm" 
                />
                <g transform={`translate(${paddingLeft - 6}, ${timeToY(hoverTime) + 4})`}>
                  <text textAnchor="end" className="text-[10px] font-mono font-black fill-sky-400">
                    {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
                  </text>
                </g>
              </g>
            )}

            {/* Dynamically Generated Sunrise & Sunset Labels */}
            <g transform={`translate(${paddingLeft + chartW + 6}, ${sunriseY + 4})`}>
              <text className="text-xs font-mono font-black fill-amber-400">
                {formatTime(activeData.sunrise).substring(0, 5)}
              </text>
            </g>
            <g transform={`translate(${paddingLeft + chartW + 6}, ${sunsetY + 4})`}>
              <text className="text-xs font-mono font-black fill-amber-400">
                {formatTime(activeData.sunset).substring(0, 5)}
              </text>
            </g>

            {/* Dynamic Solstice Mirrored Equivalent Daylight Vertical Guideline */}
            {mirrorDayData && (
              <g>
                <line 
                  x1={dayToX(mirrorDayData.day)} y1={paddingTop} 
                  x2={dayToX(mirrorDayData.day)} y2={paddingTop + chartH} 
                  stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" 
                />
                {/* Intersection Dots on Mirrored Day */}
                <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunrise)} r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunset)} r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                {/* Top Mirrored Day Badge */}
                <g transform={`translate(${dayToX(mirrorDayData.day)}, ${paddingTop - 8})`}>
                  <text textAnchor="middle" className="text-xs font-mono font-bold fill-indigo-400">
                    Equiv: {getDayLabel(mirrorDayData.day)} ({mirrorDayData.dayLength.toFixed(1)}h)
                  </text>
                </g>
              </g>
            )}

            {/* Current Selected Day Vertical Cursor Line */}
            <line 
              x1={dayToX(activeDay)} y1={paddingTop} 
              x2={dayToX(activeDay)} y2={paddingTop + chartH} 
              stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 3" 
            />

            {/* Active Day Markers */}
            <circle cx={dayToX(activeDay)} cy={sunriseY} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
            <circle cx={dayToX(activeDay)} cy={sunsetY} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
            <circle cx={dayToX(activeDay)} cy={timeToY(activeData.solarNoon)} r="3" fill="#fbbf24" stroke="black" strokeWidth="1" />
          </svg>
        </div>

        {/* Right Side (4 cols on XL): 24-Hour Polar Clock Dial */}
        <div className="xl:col-span-4 2xl:col-span-4 flex flex-col items-center justify-center p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-inner">
          <div className="w-full flex justify-between items-center mb-2 px-1 font-mono text-xs text-slate-400">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> 24h Polar Sunlight Clock
            </span>
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
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="solarAlmanacPolarAstroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              <circle cx={center} cy={center} r={radius + 5} fill="#020617" stroke="#334155" strokeWidth="0.75" />
              <circle cx={center} cy={center} r={radius} fill="#020617" stroke="#1e293b" strokeWidth="1" />
              
              {[0, 6, 12, 18].map(h => {
                const a = h * 15 - 90;
                return (
                  <line 
                    key={h} 
                    x1={center + (radius - 5) * Math.cos(toRadians(a))} 
                    y1={center + (radius - 5) * Math.sin(toRadians(a))} 
                    x2={center + radius * Math.cos(toRadians(a))} 
                    y2={center + radius * Math.sin(toRadians(a))} 
                    stroke="#64748b" 
                    strokeWidth="1.5" 
                    strokeOpacity="0.8" 
                  />
                );
              })}

              <g transform={`rotate(${rotationAngle}, ${center}, ${center})`}>
                <path d={getSectorPath(astronomical, center, radius)} fill="url(#solarAlmanacPolarAstroGrad)" />
                <path d={getSectorPath(nautical, center, radius)} fill="url(#solarAlmanacPolarNauticalGrad)" />
                <path d={getSectorPath(civil, center, radius)} fill="url(#solarAlmanacPolarCivilGrad)" />
                <path d={getSectorPath(dayLength, center, radius)} fill="url(#solarAlmanacPolarDayGrad)" />
                <line x1={center} y1={center - radius} x2={center} y2={center - radius + 10} stroke="#fbbf24" strokeWidth="2" />
              </g>
              
              {/* Active / Hover Ray */}
              <line 
                x1={center} y1={center} 
                x2={center + radius * Math.cos(toRadians(handAngle))} 
                y2={center + radius * Math.sin(toRadians(handAngle))} 
                stroke={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "#f8fafc"} 
                strokeWidth={hoverTime !== null && hoverTime !== undefined ? 2.5 : 1.8} 
                strokeLinecap="round" 
              />
              <circle cx={center} cy={center} r="3.5" fill={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "#f8fafc"} />
              
              <text x={center} y={center - radius - 8} textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-bold">00:00 UTC</text>
              <text x={center} y={center + radius + 12} textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-bold">12:00 UTC</text>
              
              {/* Center Hub Overlay */}
              <circle cx={center} cy={center} r="40" fill="#020617" stroke="#334155" strokeWidth="1.5" />
              <text x={center} y={center - 3} textAnchor="middle" className={polarMainClass}>{polarMainText}</text>
              <text x={center} y={center + 10} textAnchor="middle" className={polarSubClass}>{polarSubText}</text>
            </svg>

            {/* Hover Pill Readout */}
            {hoverTime !== null && hoverTime !== undefined && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-sky-950/95 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold shadow-xl pointer-events-none">
                {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 border-t border-slate-800/80 text-[10px] font-medium font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
          <span className="text-slate-300 font-bold">Daylight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500/80" />
          <span className="text-slate-400">Civil (-6°)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-500" />
          <span className="text-slate-400">Nautical (-12°)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-700" />
          <span className="text-slate-400">Astronomical (-18°)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
          <span className="text-slate-400">Night</span>
        </div>
      </div>
    </div>
  );
};

export default SolarAlmanac;
