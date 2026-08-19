import React, { useRef, useState, useCallback } from 'react';
import { formatTime } from '../../../utils/cosmicMath';
import { AnnualSolarMatrixItem } from '../../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SolarRibbonChartProps {
  almanacData: AnnualSolarMatrixItem[];
  totalDays: number;
  activeDay: number;
  activeData: AnnualSolarMatrixItem;
  mirrorDayData: AnnualSolarMatrixItem | null;
  keyStats: {
    earliestSunrise: AnnualSolarMatrixItem;
    latestSunset: AnnualSolarMatrixItem;
  };
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  onDayChange?: (day: number) => void;
  lonOffsetHours: number;
  eotOffsetHours: number;
  getDayLabel: (dayNum: number) => string;
}

export const SolarRibbonChart: React.FC<SolarRibbonChartProps> = ({
  almanacData,
  totalDays,
  activeDay,
  activeData,
  mirrorDayData,
  keyStats,
  hoverTime,
  onHoverTime,
  onDayChange,
  lonOffsetHours,
  eotOffsetHours,
  getDayLabel,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

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

  const sunriseY = timeToY(activeData.sunrise);
  const sunsetY = timeToY(activeData.sunset);

  return (
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
  );
};

export default SolarRibbonChart;
