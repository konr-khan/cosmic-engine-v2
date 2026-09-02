import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Moon } from 'lucide-react';
import { formatTime, clamp, getDayOfYear } from '../../../utils/cosmicMath';
import { AnnualLunarMatrixItem } from '../../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getPhaseName(phaseValue: number): string {
  if (phaseValue < 0.03 || phaseValue > 0.97) return 'New Moon';
  if (phaseValue < 0.22) return 'Waxing Crescent';
  if (phaseValue < 0.28) return 'First Quarter';
  if (phaseValue < 0.47) return 'Waxing Gibbous';
  if (phaseValue < 0.53) return 'Full Moon';
  if (phaseValue < 0.72) return 'Waning Gibbous';
  if (phaseValue < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export interface LunarRibbonChartProps {
  annualLunarData: AnnualLunarMatrixItem[];
  activeDay: number;
  totalDays: number;
  year: number;
  activeData: AnnualLunarMatrixItem;
  onDayChange?: (day: number) => void;
  hoverDate?: Date | null;
  onHoverDate?: (date: Date | null) => void;
  onHoverDayChange?: (day: number | null) => void;
  getDayLabel: (dayNum: number) => string;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  longitude?: number;
  timeMode?: 'utc' | 'local';
  onTimeModeChange?: (mode: 'utc' | 'local') => void;
  viewMode?: 'synodic' | 'annual';
  onViewModeChange?: (mode: 'synodic' | 'annual') => void;
}

export const LunarRibbonChart: React.FC<LunarRibbonChartProps> = ({
  annualLunarData,
  activeDay,
  totalDays,
  year,
  activeData,
  onDayChange,
  hoverDate,
  onHoverDate,
  onHoverDayChange,
  getDayLabel,
  hoverTime,
  onHoverTime,
  longitude = -122.81,
  timeMode = 'utc',
  onTimeModeChange,
  viewMode = 'synodic',
  onViewModeChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const lonOffsetHours = longitude / 15;

  const ribbonWidth = 800;
  const ribbonHeight = 220;
  const padLeft = 55;
  const padRight = 65;
  const padTop = 20;
  const padBottom = 30;
  const chartW = ribbonWidth - padLeft - padRight;
  const chartH = ribbonHeight - padTop - padBottom;

  const isSynodic = viewMode === 'synodic';
  const span = 30;
  const halfSpan = 15;

  let startDay = 1;
  let endDay = totalDays;

  if (isSynodic) {
    startDay = Math.max(1, activeDay - halfSpan);
    endDay = Math.min(totalDays, activeDay + halfSpan);
    if (endDay - startDay < span) {
      if (startDay === 1) {
        endDay = Math.min(totalDays, 1 + span);
      } else if (endDay === totalDays) {
        startDay = Math.max(1, totalDays - span);
      }
    }
  }

  const dayToX = useCallback((d: number): number => {
    if (isSynodic) {
      return padLeft + ((d - startDay) / Math.max(1, endDay - startDay)) * chartW;
    }
    return padLeft + ((d - 1) / (totalDays - 1)) * chartW;
  }, [isSynodic, startDay, endDay, padLeft, chartW, totalDays]);

  const xToDay = useCallback((x: number): number => {
    if (isSynodic) {
      const rawDay = startDay + ((x - padLeft) / chartW) * (endDay - startDay);
      return Math.max(startDay, Math.min(endDay, Math.round(rawDay)));
    }
    const rawDay = 1 + ((x - padLeft) / chartW) * (totalDays - 1);
    return Math.max(1, Math.min(totalDays, Math.round(rawDay)));
  }, [chartW, padLeft, totalDays, isSynodic, startDay, endDay]);

  const timeToY = (timeHours: number): number => {
    const clamped = clamp(timeHours, 0, 24);
    return padTop + chartH - (clamped / 24) * chartH;
  };

  const transformTime = useCallback((time: number | null | undefined): number | null => {
    if (time === null || time === undefined) return null;
    if (timeMode === 'utc') return time;
    return ((time + lonOffsetHours) % 24 + 24) % 24;
  }, [timeMode, lonOffsetHours]);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * ribbonWidth;
    const day = xToDay(svgX);
    setHoverDay(day);
    if (onHoverDayChange) onHoverDayChange(day);

    // In 30-Day Synodic View, mouseover strictly provides straight data readout
    // without scrubbing through the year or horizontal time guidelines!
    if (!isSynodic) {
      if (onHoverDate) {
        const d = new Date(Date.UTC(year, 0, day, 12, 0, 0));
        onHoverDate(d);
      }

      const clientY = e.clientY - rect.top;
      const svgY = (clientY / rect.height) * ribbonHeight;
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
    }
  };

  const activeMoonrise = transformTime(activeData.moonrise);
  const activeMoonset = transformTime(activeData.moonset);
  const activeRiseY = activeMoonrise !== null ? timeToY(activeMoonrise) : null;
  const activeSetY = activeMoonset !== null ? timeToY(activeMoonset) : null;

  const visibleDays = useMemo(() => {
    if (!isSynodic) return annualLunarData;
    return annualLunarData.filter(d => d.day >= startDay && d.day <= endDay);
  }, [annualLunarData, isSynodic, startDay, endDay]);

  const targetHoverDay = hoverDay !== null
    ? hoverDay
    : (hoverDate ? getDayOfYear(hoverDate) : null);
  const hoverData = targetHoverDay && annualLunarData.length >= targetHoverDay
    ? annualLunarData[targetHoverDay - 1]
    : null;

  const displayData = hoverData ?? activeData;
  const displayRiseT = transformTime(displayData.moonrise);
  const displaySetT = transformTime(displayData.moonset);
  const displayRiseStr = displayRiseT !== null ? formatTime(displayRiseT).substring(0, 5) : 'No Rise';
  const displaySetStr = displaySetT !== null ? formatTime(displaySetT).substring(0, 5) : 'No Set';
  const displayTransitT = transformTime(displayData.transit);
  const displayTransitStr = displayTransitT !== null ? formatTime(displayTransitT).substring(0, 5) : '--:--';
  const displayPhasePct = Math.round(displayData.phaseValue * 100);
  const displayPhaseName = getPhaseName(displayData.phaseValue);

  // Generate Braided Ribbon Curves for Moonrise and Moonset
  const moonrisePathD = useMemo(() => {
    if (!visibleDays.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < visibleDays.length; i++) {
      const d = visibleDays[i];
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
  }, [visibleDays, dayToX, transformTime]);

  const moonsetPathD = useMemo(() => {
    if (!visibleDays.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < visibleDays.length; i++) {
      const d = visibleDays[i];
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
  }, [visibleDays, dayToX, transformTime]);

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
      <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Segmented View Mode Toggle: 30-Day Synodic vs 365-Day Ribbon */}
          {onViewModeChange && (
            <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => onViewModeChange('synodic')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'synodic'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="30-Day Centered Synodic Month View (±15 days)"
              >
                🌓 30-Day Synodic
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('annual')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'annual'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="365-Day Annual Braided Ribbon"
              >
                🌐 365-Day Ribbon
              </button>
            </div>
          )}

          <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans hidden sm:flex">
            <Moon className="w-3 h-3 text-slate-300" /> 
            {isSynodic ? '30-Day Synodic Month Ribbon' : '365-Day Moonrise & Moonset Ribbon'}
          </span>
        </div>
        
        {/* Segmented Timeframe Mode Toggle */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
          <button
            type="button"
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
            type="button"
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

      {/* Live Moonrise & Moonset Readout Strip (Instantaneous on Mouseover) */}
      <div 
        data-testid="lunar-readout-bar"
        className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono mb-2 transition-all ${
          hoverData 
            ? 'bg-sky-950/50 border-sky-500/50 shadow-md' 
            : 'bg-slate-900/60 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-bold flex items-center gap-1.5 ${hoverData ? 'text-sky-300' : 'text-slate-200'}`}>
            <span className={`w-2 h-2 rounded-full ${hoverData ? 'bg-sky-400 animate-pulse' : 'bg-rose-500'}`} />
            {hoverData ? `Inspect: ${getDayLabel(displayData.day)}` : `Selected: ${getDayLabel(displayData.day)}`}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-300 font-semibold">
            {displayPhaseName} ({displayPhasePct}%)
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-slate-300">
            Moonrise: <span className="font-bold text-sky-400">{displayRiseStr}</span>
          </span>
          <span className="text-slate-300">
            Moonset: <span className="font-bold text-indigo-400">{displaySetStr}</span>
          </span>
          {displayTransitT !== null && (
            <span className="text-slate-400 hidden sm:inline">
              Transit: <span className="font-semibold text-slate-200">{displayTransitStr}</span>
            </span>
          )}
          <span className="text-slate-400 hidden md:inline">
            Dist: <span className="font-semibold text-slate-200">{Math.round(displayData.distanceKm).toLocaleString()} km</span>
            {displayData.isPerigee && <span className="text-emerald-400 font-bold ml-1">· Supermoon</span>}
            {displayData.isApogee && <span className="text-rose-400 font-bold ml-1">· Apogee</span>}
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
        className="w-full h-[200px] block overflow-visible cursor-crosshair"
        onPointerDown={(e) => { 
          if (!isSynodic) {
            setIsDragging(true); 
            e.currentTarget.setPointerCapture(e.pointerId); 
          }
          handlePointer(e); 
        }}
        onPointerMove={(e) => handlePointer(e)}
        onPointerUp={(e) => { 
          setIsDragging(false); 
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
          if (!isSynodic && hoverDay !== null && onDayChange) onDayChange(hoverDay);
        }}
        onClick={(e) => {
          if (!svgRef.current) return;
          const rect = svgRef.current.getBoundingClientRect();
          const clientX = e.clientX - rect.left;
          const svgX = (clientX / rect.width) * ribbonWidth;
          const day = xToDay(svgX);
          if (onDayChange) onDayChange(day);
        }}
        onPointerLeave={() => { 
          setIsDragging(false); 
          setHoverDay(null); 
          if (onHoverDayChange) onHoverDayChange(null);
          if (onHoverDate) onHoverDate(null); 
          if (onHoverTime) onHoverTime(null); 
        }}
      >
        {/* Chart Background */}
        <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="#020617" rx="6" />

        {/* Selected Day Highlight Background Pillar in Synodic View */}
        {isSynodic && (
          <rect
            x={dayToX(activeDay) - 10}
            y={padTop}
            width={20}
            height={chartH}
            fill="#38bdf8"
            fillOpacity="0.08"
            rx="4"
            className="pointer-events-none"
          />
        )}

        {/* Axis Dividers & Labels (Month dividers for Annual, Day ticks for Synodic) */}
        {!isSynodic ? (
          MONTH_NAMES.map((m, idx) => {
            const firstDay = Math.round(idx * 30.4 + 1);
            const x = dayToX(firstDay);
            return (
              <g key={m}>
                <line x1={x} y1={padTop} x2={x} y2={padTop + chartH} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.25" />
                <text x={x + 6} y={ribbonHeight - 8} className="text-[10px] font-mono font-medium fill-slate-400">{m}</text>
              </g>
            );
          })
        ) : (
          visibleDays.map((d) => {
            const x = dayToX(d.day);
            const isSunday = new Date(Date.UTC(year, 0, d.day)).getUTCDay() === 0;
            const isCur = d.day === activeDay;
            const showLabel = (d.day % 3 === 0) || d.day === startDay || d.day === endDay || isCur;
            return (
              <g key={`day-grid-${d.day}`}>
                <line
                  data-testid="synodic-day-tick"
                  x1={x} y1={padTop}
                  x2={x} y2={padTop + chartH}
                  stroke={isCur ? '#ef4444' : (isSunday ? '#475569' : '#334155')}
                  strokeWidth={isCur ? 1 : 0.5}
                  strokeDasharray={isCur ? 'none' : '2 2'}
                  strokeOpacity={isCur ? 0.6 : (isSunday ? 0.35 : 0.15)}
                />
                {showLabel && (
                  <text
                    x={x}
                    y={ribbonHeight - 8}
                    textAnchor="middle"
                    className={`text-[9px] font-mono ${isCur ? 'fill-rose-400 font-bold' : 'fill-slate-400 font-medium'}`}
                  >
                    {getDayLabel(d.day)}
                  </text>
                )}
              </g>
            );
          })
        )}

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

        {/* Daily Moon Phase Discs across the top (in 30-Day Synodic View) */}
        {isSynodic && visibleDays.map((d) => {
          const x = dayToX(d.day);
          const phaseVal = d.phaseValue; // 0..1
          const isFull = Math.abs(phaseVal - 0.5) < 0.06;
          const isNew = phaseVal < 0.06 || phaseVal > 0.94;
          const isSelected = d.day === activeDay;
          const isHovered = d.day === targetHoverDay;

          return (
            <g key={`phase-${d.day}`} transform={`translate(${x}, ${padTop + 8})`}>
              <circle
                data-testid="synodic-phase-disc"
                r={isSelected || isHovered ? 5.5 : 4}
                fill={isNew ? '#0f172a' : (isFull ? '#ffffff' : '#38bdf8')}
                fillOpacity={isNew ? 0.6 : (isFull ? 1.0 : 0.8)}
                stroke={isSelected ? '#ef4444' : (isHovered ? '#38bdf8' : '#475569')}
                strokeWidth={isSelected || isHovered ? 1.5 : 0.75}
              />
            </g>
          );
        })}

        {/* Render Daily Moonrise-to-Moonset Braided Lines / Pillars */}
        {visibleDays.map((d) => {
          const riseT = transformTime(d.moonrise);
          const setT = transformTime(d.moonset);
          if (riseT === null || setT === null) return null;
          const x = dayToX(d.day);
          const yRise = timeToY(riseT);
          const ySet = timeToY(setT);
          
          const isFull = Math.abs(d.phaseValue - 0.5) < 0.08;
          const isSuper = d.isPerigee;
          
          const strokeColor = isSuper ? "#10b981" : (isFull ? "#f8fafc" : "#38bdf8");
          const opacity = isSuper ? 0.9 : (isFull ? 0.85 : (isSynodic ? 0.7 : 0.4));
          const strokeW = isSynodic ? (isSuper ? 6 : (isFull ? 5 : 4)) : (isSuper ? 2 : (isFull ? 1.6 : 1));

          return (
            <line 
              key={d.day}
              x1={x} y1={yRise} 
              x2={x} y2={ySet} 
              stroke={strokeColor} 
              strokeWidth={strokeW} 
              strokeOpacity={opacity}
              strokeLinecap="round"
            />
          );
        })}

        {/* Continuous Moonrise Curve */}
        {moonrisePathD && (
          <path d={moonrisePathD} fill="none" stroke="#38bdf8" strokeWidth={isSynodic ? 2 : 1.5} strokeOpacity="0.9" />
        )}

        {/* Continuous Moonset Curve */}
        {moonsetPathD && (
          <path d={moonsetPathD} fill="none" stroke="#818cf8" strokeWidth={isSynodic ? 2 : 1.5} strokeOpacity="0.9" strokeDasharray="3 2" />
        )}

        {/* Active Day Vertical Cursor */}
        <line
          x1={dayToX(activeDay)} y1={padTop}
          x2={dayToX(activeDay)} y2={padTop + chartH}
          stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3"
        />

        {/* Synced Hover Time Horizontal Guideline (only in 365-Day Annual Mode) */}
        {!isSynodic && hoverTime !== null && hoverTime !== undefined && (() => {
          const chartHTime = timeMode === 'utc'
            ? hoverTime
            : ((hoverTime + lonOffsetHours) % 24 + 24) % 24;
          const hy = timeToY(chartHTime);
          const badgeText = timeMode === 'utc'
            ? `${formatTime(hoverTime).substring(0, 5)}Z`
            : `${formatTime(chartHTime).substring(0, 5)} LMT (${formatTime(hoverTime).substring(0, 5)}Z)`;
          const badgeWidth = timeMode === 'utc' ? 65 : 135;
          return (
            <g className="pointer-events-none">
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
                <text x={badgeWidth / 2} y={11.5} textAnchor="middle" className="text-[9px] font-mono font-semibold fill-sky-300">
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

        {/* Interactive Hover Day Hairline, Intersection Circles & Floating Tooltip */}
        {targetHoverDay !== null && targetHoverDay !== activeDay && hoverData && (() => {
          const hx = dayToX(targetHoverDay);
          const hRiseT = transformTime(hoverData.moonrise);
          const hSetT = transformTime(hoverData.moonset);
          const hRiseY = hRiseT !== null ? timeToY(hRiseT) : null;
          const hSetY = hSetT !== null ? timeToY(hSetT) : null;

          const tooltipW = 168;
          const tooltipH = 58;
          const tooltipX = hx > ribbonWidth - padRight - tooltipW - 10
            ? hx - tooltipW - 12
            : (hx < padLeft + 10 ? hx + 12 : hx + 12);
          const tooltipY = padTop + 6;

          const riseStr = hRiseT !== null ? formatTime(hRiseT).substring(0, 5) : '--:--';
          const setStr = hSetT !== null ? formatTime(hSetT).substring(0, 5) : '--:--';
          const phasePct = Math.round(hoverData.phaseValue * 100);

          return (
            <g className="pointer-events-none">
              {/* Vertical Guide Hairline */}
              <line
                x1={hx} y1={padTop}
                x2={hx} y2={padTop + chartH}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="drop-shadow-sm"
              />

              {/* Rise / Set Intersection Circles */}
              {hRiseY !== null && (
                <circle cx={hx} cy={hRiseY} r="4" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
              )}
              {hSetY !== null && (
                <circle cx={hx} cy={hSetY} r="4" fill="#818cf8" stroke="white" strokeWidth="1.5" />
              )}

              {/* Floating Tooltip Card */}
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                rx="6"
                fill="#020617"
                fillOpacity="0.94"
                stroke="#38bdf8"
                strokeWidth="0.9"
                className="drop-shadow-xl"
              />
              <text x={tooltipX + 8} y={tooltipY + 15} className="text-[11px] font-mono font-bold fill-sky-300">
                {getDayLabel(targetHoverDay)}
              </text>
              <text x={tooltipX + tooltipW - 8} y={tooltipY + 15} textAnchor="end" className="text-[10px] font-mono font-semibold fill-indigo-300">
                {getPhaseName(hoverData.phaseValue)} ({phasePct}%)
              </text>
              <line
                x1={tooltipX + 8}
                y1={tooltipY + 21}
                x2={tooltipX + tooltipW - 8}
                y2={tooltipY + 21}
                stroke="#1e293b"
                strokeWidth="0.75"
              />
              <text x={tooltipX + 8} y={tooltipY + 34} className="text-[9px] font-mono fill-slate-300">
                Rise: <tspan className="font-bold fill-sky-300">{riseStr}</tspan>
              </text>
              <text x={tooltipX + tooltipW - 8} y={tooltipY + 34} textAnchor="end" className="text-[9px] font-mono fill-slate-300">
                Set: <tspan className="font-bold fill-indigo-300">{setStr}</tspan>
              </text>
              <text x={tooltipX + 8} y={tooltipY + 48} className="text-[9px] font-mono fill-slate-400">
                Dist: <tspan className="font-semibold fill-slate-200">{Math.round(hoverData.distanceKm).toLocaleString()} km</tspan>
                {hoverData.isPerigee && <tspan className="fill-emerald-400 font-bold"> · Perigee</tspan>}
                {hoverData.isApogee && <tspan className="fill-rose-400 font-bold"> · Apogee</tspan>}
              </text>
            </g>
          );
        })()}
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
