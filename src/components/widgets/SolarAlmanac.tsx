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
  const [timeMode, setTimeMode] = useState<'solar' | 'utc'>('solar');

  const lonOffsetHours = longitude / 15;
  const eotOffsetHours = (solarData?.equationOfTime ?? 0) / 60;

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

    // Calculate time from vertical Y position in Local Solar Time, then bridge to UTC
    const relY = svgY - paddingTop;
    if (relY >= 0 && relY <= chartH && onHoverTime) {
      const localChartTime = ((chartH - relY) / chartH) * 24;
      const utcHoverTime = ((localChartTime - lonOffsetHours - eotOffsetHours) % 24 + 24) % 24;
      onHoverTime(parseFloat(utcHoverTime.toFixed(3)));
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
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Date Badge & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          24-hour annual sun path showing daylight, twilights &amp; instantaneous 24h polar sector
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{getDayLabel(activeDay)}</span>
          <span className="text-slate-600">|</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-amber-400">{(activeData.dayLength).toFixed(1)}h <span className="text-slate-400 text-[10px] font-normal font-sans">Daylight</span></span>
        </div>
      </div>

      {/* Solstice & Equinox Fast-Jump Shortcut Bar */}
      <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1.5 border-b border-slate-800/60 text-xs">
        <span className="text-[10px] font-medium uppercase font-sans text-slate-400 tracking-wider mr-1 flex items-center gap-1">
          <Target className="w-3 h-3 text-indigo-400" /> Fast-Jump:
        </span>
        {shortcuts.map(s => {
          const isActive = Math.abs(activeDay - s.day) <= 1;
          return (
            <button
              key={s.label}
              onClick={() => onDayChange && onDayChange(s.day)}
              title={s.title}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                isActive 
                  ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm' 
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border-slate-800/40 hover:border-slate-700'
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
                  <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartH} stroke="#334155" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="3 3" />
                  <text x={x + 10} y={height - 10} className="text-[11px] font-medium fill-slate-400 font-mono">{m}</text>
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
                    strokeWidth="0.5" 
                    strokeOpacity={isMidnightOrNoon ? 0.4 : 0.18} 
                  />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className={`text-xs font-mono ${isMidnightOrNoon ? 'fill-slate-200 font-semibold' : 'fill-slate-400 font-normal'}`}>
                    {label}
                  </text>
                  <text x={paddingLeft + chartW + 8} y={y + 4} textAnchor="start" className="text-xs font-mono fill-slate-400 font-medium">
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
              <text y="14" textAnchor="middle" className="text-[10px] font-semibold fill-indigo-300 font-mono">
                {getDayLabel(keyStats.earliestSunrise.day)}
              </text>
            </g>

            <g transform={`translate(${dayToX(keyStats.latestSunset.day)}, ${timeToY(keyStats.latestSunset.sunset)})`}>
              <circle r="3" fill="#000000" />
              <text y="-8" textAnchor="middle" className="text-[10px] font-semibold fill-indigo-300 font-mono">
                {getDayLabel(keyStats.latestSunset.day)}
              </text>
            </g>

            {/* Dynamic Horizontal Guidelines for Sunrise & Sunset on Active Day */}
            <line 
              x1={paddingLeft} y1={sunriseY} 
              x2={paddingLeft + chartW} y2={sunriseY} 
              stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" 
            />
            <line 
              x1={paddingLeft} y1={sunsetY} 
              x2={paddingLeft + chartW} y2={sunsetY} 
              stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" 
            />

            {/* Synced Hover Time Horizontal Guideline */}
            {hoverTime !== null && hoverTime !== undefined && (() => {
              const chartHoverTime = ((hoverTime + lonOffsetHours + eotOffsetHours) % 24 + 24) % 24;
              const hy = timeToY(chartHoverTime);
              const textContent = `${formatTime(chartHoverTime).substring(0, 5)} LST (${formatTime(hoverTime).substring(0, 5)}Z)`;
              return (
                <g>
                  <line 
                    x1={paddingLeft} y1={hy} 
                    x2={paddingLeft + chartW} y2={hy} 
                    stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" className="drop-shadow-sm" 
                  />
                  {/* Left Axis Tick Time */}
                  <g transform={`translate(${paddingLeft - 8}, ${hy + 3.5})`}>
                    <text textAnchor="end" className="text-[10px] font-mono font-bold fill-sky-400">
                      {formatTime(chartHoverTime).substring(0, 5)}
                    </text>
                  </g>
                  {/* Floating Dual Time Readout Badge */}
                  <g transform={`translate(${paddingLeft + 8}, ${hy > paddingTop + 20 ? hy - 18 : hy + 6})`}>
                    <rect x="0" y="0" width="135" height="16" rx="4" fill="#020617" fillOpacity="0.92" stroke="#0284c7" strokeWidth="0.8" className="drop-shadow-md" />
                    <text x="67.5" y="11.5" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-sky-300">
                      {textContent}
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Dynamically Generated Sunrise & Sunset Labels */}
            <g transform={`translate(${paddingLeft + chartW + 6}, ${sunriseY + 4})`}>
              <text className="text-xs font-mono font-bold fill-amber-400">
                {formatTime(activeData.sunrise).substring(0, 5)}
              </text>
            </g>
            <g transform={`translate(${paddingLeft + chartW + 6}, ${sunsetY + 4})`}>
              <text className="text-xs font-mono font-bold fill-amber-400">
                {formatTime(activeData.sunset).substring(0, 5)}
              </text>
            </g>

            {/* Dynamic Solstice Mirrored Equivalent Daylight Vertical Guideline */}
            {mirrorDayData && (
              <g>
                <line 
                  x1={dayToX(mirrorDayData.day)} y1={paddingTop} 
                  x2={dayToX(mirrorDayData.day)} y2={paddingTop + chartH} 
                  stroke="#6366f1" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.8" 
                />
                {/* Intersection Dots on Mirrored Day */}
                <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunrise)} r="3" fill="#6366f1" stroke="white" strokeWidth="1.2" />
                <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunset)} r="3" fill="#6366f1" stroke="white" strokeWidth="1.2" />
                {/* Top Mirrored Day Badge */}
                <g transform={`translate(${dayToX(mirrorDayData.day)}, ${paddingTop - 8})`}>
                  <text textAnchor="middle" className="text-xs font-mono font-semibold fill-indigo-400">
                    Equiv: {getDayLabel(mirrorDayData.day)} ({mirrorDayData.dayLength.toFixed(1)}h)
                  </text>
                </g>
              </g>
            )}

            {/* Current Selected Day Vertical Cursor Line */}
            <line 
              x1={dayToX(activeDay)} y1={paddingTop} 
              x2={dayToX(activeDay)} y2={paddingTop + chartH} 
              stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" 
            />

            {/* Active Day Markers */}
            <circle cx={dayToX(activeDay)} cy={sunriseY} r="3.5" fill="#ef4444" stroke="white" strokeWidth="1.2" />
            <circle cx={dayToX(activeDay)} cy={sunsetY} r="3.5" fill="#ef4444" stroke="white" strokeWidth="1.2" />
            <circle cx={dayToX(activeDay)} cy={timeToY(activeData.solarNoon)} r="2.5" fill="#fbbf24" stroke="black" strokeWidth="1" />
          </svg>
        </div>

        {/* Right Side (4 cols on XL): 24-Hour Polar Clock Dial */}
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

      </div>

      {/* Bottom Legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 border-t border-slate-800/60 text-[10px] font-medium font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
          <span className="text-slate-300 font-semibold">Daylight</span>
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
