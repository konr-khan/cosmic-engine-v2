import React from 'react';
import { formatTime, getDayOfYear } from '../../../../utils/cosmicMath';
import { AnnualSolarMatrixItem } from '../../../../types';

export interface SolarRibbonOverlayProps {
  width: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  chartW: number;
  chartH: number;
  activeDay: number;
  activeData: AnnualSolarMatrixItem;
  hoverDay: number | null;
  hoverDate?: Date | null;
  hoverTime?: number | null;
  almanacData: AnnualSolarMatrixItem[];
  currentMirrorDayData: AnnualSolarMatrixItem | null;
  lonOffsetHours: number;
  eotOffsetHours: number;
  dayToX: (day: number) => number;
  timeToY: (time: number) => number;
  getDayLabel: (dayNum: number) => string;
}

export const SolarRibbonOverlay: React.FC<SolarRibbonOverlayProps> = ({
  width,
  paddingLeft,
  paddingRight,
  paddingTop,
  chartW,
  chartH,
  activeDay,
  activeData,
  hoverDay,
  hoverDate,
  hoverTime,
  almanacData,
  currentMirrorDayData,
  lonOffsetHours,
  eotOffsetHours,
  dayToX,
  timeToY,
  getDayLabel,
}) => {
  const sunriseY = timeToY(activeData.sunrise);
  const sunsetY = timeToY(activeData.sunset);

  const targetHoverDay = hoverDay !== null 
    ? hoverDay 
    : (hoverDate ? getDayOfYear(hoverDate) : null);
  const hoverData = targetHoverDay && almanacData.length >= targetHoverDay 
    ? almanacData[targetHoverDay - 1] 
    : null;

  return (
    <>
      {/* Dynamic Horizontal Guidelines for Sunrise & Sunset on Active Day */}
      <line 
        x1={paddingLeft} y1={sunriseY} 
        x2={paddingLeft + chartW} y2={sunriseY} 
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" 
      />
      <line 
        x1={paddingLeft} y1={sunsetY} 
        x2={paddingLeft + chartW} y2={sunsetY} 
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" 
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

      {/* Dynamic Solstice Mirrored Equivalent Daylight Vertical Guideline (glides on mouseover) */}
      {currentMirrorDayData && (
        <g>
          <line 
            x1={dayToX(currentMirrorDayData.day)} y1={paddingTop} 
            x2={dayToX(currentMirrorDayData.day)} y2={paddingTop + chartH} 
            stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity={targetHoverDay !== null ? "0.95" : "0.8"} 
          />
          {/* Intersection Dots on Mirrored Day */}
          <circle cx={dayToX(currentMirrorDayData.day)} cy={timeToY(currentMirrorDayData.sunrise)} r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.2" />
          <circle cx={dayToX(currentMirrorDayData.day)} cy={timeToY(currentMirrorDayData.sunset)} r="3.5" fill="#6366f1" stroke="white" strokeWidth="1.2" />
          {/* Top Mirrored Day Badge */}
          <g transform={`translate(${dayToX(currentMirrorDayData.day)}, ${paddingTop - 8})`}>
            <text textAnchor="middle" className="text-xs font-mono font-semibold fill-indigo-400 drop-shadow-sm">
              Equiv: {getDayLabel(currentMirrorDayData.day)} ({currentMirrorDayData.dayLength.toFixed(1)}h)
            </text>
          </g>
        </g>
      )}

      {/* Current Selected Day Vertical Cursor Line */}
      <line 
        x1={dayToX(activeDay)} y1={paddingTop} 
        x2={dayToX(activeDay)} y2={paddingTop + chartH} 
        stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3" 
      />

      {/* Active Day Markers */}
      <circle cx={dayToX(activeDay)} cy={sunriseY} r="3.5" fill="#f43f5e" stroke="white" strokeWidth="1.2" />
      <circle cx={dayToX(activeDay)} cy={sunsetY} r="3.5" fill="#f43f5e" stroke="white" strokeWidth="1.2" />
      <circle cx={dayToX(activeDay)} cy={timeToY(activeData.solarNoon)} r="2.5" fill="#fbbf24" stroke="black" strokeWidth="1" />

      {/* Interactive Hover Day Hairline, Curve Intersection Markers & Floating Tooltip */}
      {targetHoverDay !== null && targetHoverDay !== activeDay && hoverData && (() => {
        const hx = dayToX(targetHoverDay);
        const hyRise = timeToY(hoverData.sunrise);
        const hySet = timeToY(hoverData.sunset);
        const hyNoon = timeToY(hoverData.solarNoon);

        const tooltipW = 160;
        const tooltipH = 58;
        const tooltipX = hx > width - paddingRight - tooltipW - 10
          ? hx - tooltipW - 12
          : (hx < paddingLeft + 10 ? hx + 12 : hx + 12);
        const tooltipY = paddingTop + 10;

        return (
          <g className="pointer-events-none">
            {/* Vertical Guide Hairline */}
            <line
              x1={hx} y1={paddingTop}
              x2={hx} y2={paddingTop + chartH}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              className="drop-shadow-sm"
            />

            {/* Curve Intersection Markers */}
            <circle cx={hx} cy={hyRise} r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={hx} cy={hySet} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={hx} cy={hyNoon} r="2.5" fill="#38bdf8" stroke="#000000" strokeWidth="1" />

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
            <text x={tooltipX + tooltipW - 8} y={tooltipY + 15} textAnchor="end" className="text-[10px] font-mono font-semibold fill-amber-400">
              {hoverData.dayLength.toFixed(1)}h Day
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
              Rise: <tspan className="font-bold fill-amber-300">{formatTime(hoverData.sunrise).substring(0, 5)}</tspan>
            </text>
            <text x={tooltipX + tooltipW - 8} y={tooltipY + 34} textAnchor="end" className="text-[9px] font-mono fill-slate-300">
              Set: <tspan className="font-bold fill-amber-300">{formatTime(hoverData.sunset).substring(0, 5)}</tspan>
            </text>
            <text x={tooltipX + 8} y={tooltipY + 48} className="text-[9px] font-mono fill-slate-400">
              Solar Noon: <tspan className="font-semibold fill-slate-200">{formatTime(hoverData.solarNoon).substring(0, 5)}</tspan>
              {currentMirrorDayData && (
                <tspan className="fill-indigo-300 font-semibold"> · Equiv: {getDayLabel(currentMirrorDayData.day)}</tspan>
              )}
            </text>
          </g>
        );
      })()}
    </>
  );
};

export default SolarRibbonOverlay;
