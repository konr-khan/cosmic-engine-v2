import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Moon } from 'lucide-react';
import { formatTime, clamp } from '../../../utils/cosmicMath';
import { AnnualLunarMatrixItem } from '../../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface LunarRibbonChartProps {
  annualLunarData: AnnualLunarMatrixItem[];
  activeDay: number;
  totalDays: number;
  year: number;
  activeData: AnnualLunarMatrixItem;
  onDayChange?: (day: number) => void;
  onHoverDate?: (date: Date | null) => void;
  getDayLabel: (dayNum: number) => string;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  longitude?: number;
  timeMode?: 'utc' | 'local';
  onTimeModeChange?: (mode: 'utc' | 'local') => void;
}

export const LunarRibbonChart: React.FC<LunarRibbonChartProps> = ({
  annualLunarData,
  activeDay,
  totalDays,
  year,
  activeData,
  onDayChange,
  onHoverDate,
  getDayLabel,
  hoverTime,
  onHoverTime,
  longitude = -122.81,
  timeMode = 'utc',
  onTimeModeChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setHoverDay] = useState<number | null>(null);

  const lonOffsetHours = longitude / 15;

  const ribbonWidth = 800;
  const ribbonHeight = 220;
  const padLeft = 55;
  const padRight = 65;
  const padTop = 20;
  const padBottom = 30;
  const chartW = ribbonWidth - padLeft - padRight;
  const chartH = ribbonHeight - padTop - padBottom;

  const dayToX = (d: number): number => padLeft + ((d - 1) / (totalDays - 1)) * chartW;
  const timeToY = (timeHours: number): number => {
    const clamped = clamp(timeHours, 0, 24);
    return padTop + chartH - (clamped / 24) * chartH;
  };

  const transformTime = useCallback((time: number | null | undefined): number | null => {
    if (time === null || time === undefined) return null;
    if (timeMode === 'utc') return time;
    return ((time + lonOffsetHours) % 24 + 24) % 24;
  }, [timeMode, lonOffsetHours]);

  const xToDay = useCallback((x: number): number => {
    const rawDay = 1 + ((x - padLeft) / chartW) * (totalDays - 1);
    return Math.max(1, Math.min(totalDays, Math.round(rawDay)));
  }, [chartW, padLeft, totalDays]);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * ribbonWidth;
    const svgY = (clientY / rect.height) * ribbonHeight;
    const day = xToDay(svgX);
    setHoverDay(day);

    if (onHoverDate) {
      const d = new Date(year, 0, day);
      onHoverDate(d);
    }

    // Bidirectional time scanner: compute hoverTime from vertical pointer Y
    const relY = svgY - padTop;
    if (relY >= 0 && relY <= chartH && onHoverTime) {
      const chartTime = ((chartH - relY) / chartH) * 24;
      const utcTime = timeMode === 'utc' 
        ? chartTime 
        : ((chartTime - lonOffsetHours) % 24 + 24) % 24;
      onHoverTime(parseFloat(utcTime.toFixed(3)));
    }

    if ((isDragging || e.type === 'pointerdown') && onDayChange) {
      onDayChange(day);
    }
  };

  const activeMoonrise = transformTime(activeData.moonrise);
  const activeMoonset = transformTime(activeData.moonset);
  const activeRiseY = activeMoonrise !== null ? timeToY(activeMoonrise) : null;
  const activeSetY = activeMoonset !== null ? timeToY(activeMoonset) : null;

  // Generate Braided Ribbon Curves for Moonrise and Moonset
  const moonrisePathD = useMemo(() => {
    if (!annualLunarData.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < annualLunarData.length; i++) {
      const d = annualLunarData[i];
      const t = transformTime(d.moonrise);
      if (t !== null && t !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(t);
        if (!isDrawing) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          isDrawing = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    }
    return path;
  }, [annualLunarData, chartW, chartH, totalDays, transformTime]);

  const moonsetPathD = useMemo(() => {
    if (!annualLunarData.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < annualLunarData.length; i++) {
      const d = annualLunarData[i];
      const t = transformTime(d.moonset);
      if (t !== null && t !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(t);
        if (!isDrawing) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          isDrawing = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    }
    return path;
  }, [annualLunarData, chartW, chartH, totalDays, transformTime]);

  // Tick label formatter
  const getTimeLabel = (h: number): string => {
    if (timeMode === 'utc') {
      if (h === 0) return "0000Z";
      if (h === 6) return "0600Z";
      if (h === 12) return "1200Z";
      if (h === 18) return "1800Z";
      if (h === 24) return "2400Z";
      return `${h.toString().padStart(2, '0')}00Z`;
    } else {
      if (h === 0 || h === 24) return "12 AM";
      if (h === 6) return "6 AM";
      if (h === 12) return "12 PM";
      if (h === 18) return "6 PM";
      return `${h}h`;
    }
  };

  return (
    <div className="relative w-full bg-slate-950/60 rounded-xl border border-slate-800/60 p-3 my-1 touch-none">
      <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between items-center">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
          <Moon className="w-3 h-3 text-slate-300" /> 365-Day Moonrise &amp; Moonset Ribbon ({timeMode === 'utc' ? '24h UTC' : 'Local Solar Time'})
        </span>
        
        {/* Segmented Timeframe Mode Toggle */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
          <button
            onClick={() => onTimeModeChange && onTimeModeChange('utc')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'utc'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Coordinated Universal Time (0000Z to 2400Z)"
          >
            🌐 UTC (Zulu)
          </button>
          <button
            onClick={() => onTimeModeChange && onTimeModeChange('local')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'local'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Local Mean Time relative to Observer Meridian"
          >
            🌙 Local (LMT)
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
        className="w-full h-[200px] block overflow-visible cursor-crosshair"
        onPointerDown={(e) => { setIsDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
        onPointerMove={(e) => handlePointer(e)}
        onPointerUp={(e) => { setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
        onPointerLeave={() => { setIsDragging(false); setHoverDay(null); if (onHoverDate) onHoverDate(null); if (onHoverTime) onHoverTime(null); }}
      >
        {/* Chart Background */}
        <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="#020617" rx="6" />

        {/* Month Axis Dividers & Labels */}
        {MONTH_NAMES.map((m, idx) => {
          const firstDay = Math.round(idx * 30.4 + 1);
          const x = dayToX(firstDay);
          return (
            <g key={m}>
              <line x1={x} y1={padTop} x2={x} y2={padTop + chartH} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.25" />
              <text x={x + 6} y={ribbonHeight - 8} className="text-[10px] font-mono font-medium fill-slate-400">{m}</text>
            </g>
          );
        })}

        {/* 6-Hour Horizontal Time Guides */}
        {[0, 6, 12, 18, 24].map((h) => {
          const y = timeToY(h);
          const label = getTimeLabel(h);
          const isKeyHour = h === 0 || h === 12 || h === 24;
          return (
            <g key={h}>
              <line 
                x1={padLeft} y1={y} 
                x2={padLeft + chartW} y2={y} 
                stroke="#334155" 
                strokeWidth={0.5} 
                strokeOpacity={isKeyHour ? 0.35 : 0.18} 
              />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" className={`text-[9px] font-mono ${isKeyHour ? 'fill-slate-200 font-semibold' : 'fill-slate-400 font-normal'}`}>
                {label}
              </text>
              <text x={padLeft + chartW + 6} y={y + 3} textAnchor="start" className={`text-[9px] font-mono ${isKeyHour ? 'fill-slate-200 font-semibold' : 'fill-slate-400 font-normal'}`}>
                {label}
              </text>
            </g>
          );
        })}

        {/* Render 365 Daily Moonrise-to-Moonset Braided Lines */}
        {annualLunarData.map((d) => {
          const riseT = transformTime(d.moonrise);
          const setT = transformTime(d.moonset);
          if (riseT === null || setT === null) return null;
          const x = dayToX(d.day);
          const yRise = timeToY(riseT);
          const ySet = timeToY(setT);
          
          const isFull = Math.abs(d.phaseValue - 0.5) < 0.08;
          const isSuper = d.isPerigee;
          
          const strokeColor = isSuper ? "#10b981" : (isFull ? "#f8fafc" : "#38bdf8");
          const opacity = isSuper ? 0.9 : (isFull ? 0.85 : 0.4);

          return (
            <line 
              key={d.day}
              x1={x} y1={yRise} 
              x2={x} y2={ySet} 
              stroke={strokeColor} 
              strokeWidth={isSuper ? 2 : (isFull ? 1.6 : 1)} 
              strokeOpacity={opacity} 
            />
          );
        })}

        {/* Continuous Moonrise Curve */}
        {moonrisePathD && (
          <path d={moonrisePathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.9" />
        )}

        {/* Continuous Moonset Curve */}
        {moonsetPathD && (
          <path d={moonsetPathD} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.9" strokeDasharray="3 2" />
        )}

        {/* Active / Hover Day Vertical Cursor */}
        <line
          x1={dayToX(activeDay)} y1={padTop}
          x2={dayToX(activeDay)} y2={padTop + chartH}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3"
        />

        {/* Synced Hover Time Horizontal Guideline */}
        {hoverTime !== null && hoverTime !== undefined && (() => {
          const chartHTime = timeMode === 'utc'
            ? hoverTime
            : ((hoverTime + lonOffsetHours) % 24 + 24) % 24;
          const hy = timeToY(chartHTime);
          const badgeText = timeMode === 'utc'
            ? `${formatTime(hoverTime).substring(0, 5)}Z`
            : `${formatTime(chartHTime).substring(0, 5)} LMT (${formatTime(hoverTime).substring(0, 5)}Z)`;
          const badgeWidth = timeMode === 'utc' ? 65 : 135;
          return (
            <g>
              <line 
                x1={padLeft} y1={hy} 
                x2={padLeft + chartW} y2={hy} 
                stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" className="drop-shadow-sm" 
              />
              {/* Left Axis Tick Time */}
              <g transform={`translate(${padLeft - 8}, ${hy + 3.5})`}>
                <text textAnchor="end" className="text-[9px] font-mono font-bold fill-sky-400">
                  {formatTime(chartHTime).substring(0, 5)}
                </text>
              </g>
              {/* Floating Dual Time Readout Badge */}
              <g transform={`translate(${padLeft + 8}, ${hy > padTop + 20 ? hy - 18 : hy + 6})`}>
                <rect x="0" y="0" width={badgeWidth} height="16" rx="4" fill="#020617" fillOpacity="0.92" stroke="#0284c7" strokeWidth="0.8" className="drop-shadow-md" />
                <text x={badgeWidth / 2} y="11.5" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-sky-300">
                  {badgeText}
                </text>
              </g>
            </g>
          );
        })()}

        {/* Active Day Intersection Markers */}
        {activeRiseY !== null && activeMoonrise !== null && (
          <g transform={`translate(${dayToX(activeDay)}, ${activeRiseY})`}>
            <circle r="4" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
            <text x="7" y="3" className="text-[9px] font-mono font-bold fill-sky-300">
              Rise: {formatTime(activeMoonrise).substring(0, 5)}
            </text>
          </g>
        )}

        {activeSetY !== null && activeMoonset !== null && (
          <g transform={`translate(${dayToX(activeDay)}, ${activeSetY})`}>
            <circle r="4" fill="#818cf8" stroke="white" strokeWidth="1.5" />
            <text x="7" y="3" className="text-[9px] font-mono font-bold fill-indigo-300">
              Set: {formatTime(activeMoonset).substring(0, 5)}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 px-1 border-t border-slate-800/60 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-sky-400 inline-block rounded-sm" /> Moonrise Path
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-indigo-400 inline-block rounded-sm" /> Moonset Path
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded-sm" /> Supermoon (Perigee)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-white inline-block rounded-sm" /> Full Moon
          </span>
        </div>
        <span className="text-slate-400 font-medium">Selected: {getDayLabel(activeDay)}</span>
      </div>
    </div>
  );
};

export default LunarRibbonChart;
