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
  onHoverTime
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setHoverDay] = useState<number | null>(null);

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
      const timeVal = ((chartH - relY) / chartH) * 24;
      onHoverTime(parseFloat(timeVal.toFixed(3)));
    }

    if ((isDragging || e.type === 'pointerdown') && onDayChange) {
      onDayChange(day);
    }
  };

  const activeRiseY = activeData.moonrise !== null && activeData.moonrise !== undefined ? timeToY(activeData.moonrise) : null;
  const activeSetY = activeData.moonset !== null && activeData.moonset !== undefined ? timeToY(activeData.moonset) : null;

  // Generate Braided Ribbon Curves for Moonrise and Moonset
  const moonrisePathD = useMemo(() => {
    if (!annualLunarData.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < annualLunarData.length; i++) {
      const d = annualLunarData[i];
      if (d.moonrise !== null && d.moonrise !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(d.moonrise);
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
  }, [annualLunarData, chartW, chartH, totalDays]);

  const moonsetPathD = useMemo(() => {
    if (!annualLunarData.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < annualLunarData.length; i++) {
      const d = annualLunarData[i];
      if (d.moonset !== null && d.moonset !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(d.moonset);
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
  }, [annualLunarData, chartW, chartH, totalDays]);

  // Zulu tick label formatter
  const getZuluLabel = (h: number): string => {
    if (h === 0) return "0000Z";
    if (h === 6) return "0600Z";
    if (h === 12) return "1200Z";
    if (h === 18) return "1800Z";
    if (h === 24) return "2400Z";
    return `${h.toString().padStart(2, '0')}00Z`;
  };

  return (
    <div className="relative w-full bg-slate-950/60 rounded-xl border border-slate-800/60 p-3 my-1 touch-none">
      <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between items-center">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
          <Moon className="w-3 h-3 text-slate-300" /> 365-Day Moonrise &amp; Moonset Braided Ribbon (24h UTC)
        </span>
        <span className="text-slate-500 text-[9px] font-sans">Scrub chart to scan date &amp; time</span>
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

        {/* 6-Hour Horizontal Time Guides (0000Z, 0600Z, 1200Z, 1800Z, 2400Z) */}
        {[0, 6, 12, 18, 24].map((h) => {
          const y = timeToY(h);
          const label = getZuluLabel(h);
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
          if (d.moonrise === null || d.moonset === null) return null;
          const x = dayToX(d.day);
          const yRise = timeToY(d.moonrise);
          const ySet = timeToY(d.moonset);
          
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
        {hoverTime !== null && hoverTime !== undefined && (
          <g>
            <line 
              x1={padLeft} y1={timeToY(hoverTime)} 
              x2={padLeft + chartW} y2={timeToY(hoverTime)} 
              stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 3" className="drop-shadow-sm" 
            />
            <g transform={`translate(${padLeft - 6}, ${timeToY(hoverTime) + 3})`}>
              <text textAnchor="end" className="text-[9px] font-mono font-black fill-sky-400">
                {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
              </text>
            </g>
          </g>
        )}

        {/* Active Day Intersection Markers */}
        {activeRiseY !== null && (
          <g transform={`translate(${dayToX(activeDay)}, ${activeRiseY})`}>
            <circle r="4" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
            <text x="7" y="3" className="text-[9px] font-mono font-bold fill-sky-300">
              Rise: {formatTime(activeData.moonrise).substring(0, 5)}
            </text>
          </g>
        )}

        {activeSetY !== null && (
          <g transform={`translate(${dayToX(activeDay)}, ${activeSetY})`}>
            <circle r="4" fill="#818cf8" stroke="white" strokeWidth="1.5" />
            <text x="7" y="3" className="text-[9px] font-mono font-bold fill-indigo-300">
              Set: {formatTime(activeData.moonset).substring(0, 5)}
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
