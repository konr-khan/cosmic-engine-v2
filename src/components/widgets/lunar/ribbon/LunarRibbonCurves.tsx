import React from 'react';
import { formatTime, getPhaseName } from '../../../../utils/cosmicMath';
import { AnnualLunarMatrixItem } from '../../../../types';

export interface LunarRibbonCurvesProps {
  chartW: number;
  chartH: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  ribbonWidth: number;
  isSynodic: boolean;
  visibleDays: AnnualLunarMatrixItem[];
  activeDay: number;
  activeMoonrise: number | null;
  activeMoonset: number | null;
  activeRiseY: number | null;
  activeSetY: number | null;
  hoverData: AnnualLunarMatrixItem | null;
  targetHoverDay: number | null;
  hoverTime?: number | null;
  timeMode: 'utc' | 'local';
  lonOffsetHours: number;
  dayToX: (day: number) => number;
  timeToY: (time: number) => number;
  transformTime: (time: number | null | undefined) => number | null;
  getDayLabel: (dayNum: number) => string;
  moonrisePathD: string;
  moonsetPathD: string;
}

export const LunarRibbonCurves: React.FC<LunarRibbonCurvesProps> = ({
  chartW,
  chartH,
  padLeft,
  padRight,
  padTop,
  ribbonWidth,
  isSynodic,
  visibleDays,
  activeDay,
  activeMoonrise,
  activeMoonset,
  activeRiseY,
  activeSetY,
  hoverData,
  targetHoverDay,
  hoverTime,
  timeMode,
  lonOffsetHours,
  dayToX,
  timeToY,
  transformTime,
  getDayLabel,
  moonrisePathD,
  moonsetPathD
}) => {
  return (
    <>
      {/* Render Daily Moonrise-to-Moonset Braided Lines / Pillars */}
      {visibleDays.map((d) => {
        const isUp = d.polarState === 'circumpolar_up' || (d.moonrise === 0 && d.moonset === 24);
        const isDown = d.polarState === 'circumpolar_down';
        if (isDown) return null;

        const riseT = isUp ? 0 : transformTime(d.moonrise);
        const setT = isUp ? 24 : transformTime(d.moonset);
        if (riseT === null || setT === null) return null;
        const x = dayToX(d.day);
        const yRise = timeToY(riseT);
        const ySet = timeToY(setT);
        
        const isFull = Math.abs(d.phaseValue - 0.5) < 0.08;
        const isSuper = d.isPerigee;
        
        const strokeColor = isUp ? '#0ea5e9' : (isSuper ? "#10b981" : (isFull ? "#f8fafc" : "#38bdf8"));
        const opacity = isUp ? 0.7 : (isSuper ? 0.9 : (isFull ? 0.85 : (isSynodic ? 0.7 : 0.4)));
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
        stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3"
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
            {hoverData.polarState === 'circumpolar_up' ? (
              <text x={tooltipX + 8} y={tooltipY + 34} className="text-[9px] font-mono fill-emerald-300 font-bold">
                🌕 Up All Day (24h Moonlight)
              </text>
            ) : hoverData.polarState === 'circumpolar_down' ? (
              <text x={tooltipX + 8} y={tooltipY + 34} className="text-[9px] font-mono fill-slate-400 font-medium">
                🌑 Down All Day (Sub-Horizon)
              </text>
            ) : (
              <>
                <text x={tooltipX + 8} y={tooltipY + 34} className="text-[9px] font-mono fill-slate-300">
                  Rise: <tspan className="font-bold fill-sky-300">{riseStr}</tspan>
                </text>
                <text x={tooltipX + tooltipW - 8} y={tooltipY + 34} textAnchor="end" className="text-[9px] font-mono fill-slate-300">
                  Set: <tspan className="font-bold fill-indigo-300">{setStr}</tspan>
                </text>
              </>
            )}
            <text x={tooltipX + 8} y={tooltipY + 48} className="text-[9px] font-mono fill-slate-400">
              Dist: <tspan className="font-semibold fill-slate-200">{Math.round(hoverData.distanceKm).toLocaleString()} km</tspan>
              {hoverData.isPerigee && <tspan className="fill-emerald-400 font-bold"> · Perigee</tspan>}
              {hoverData.isApogee && <tspan className="fill-rose-400 font-bold"> · Apogee</tspan>}
            </text>
          </g>
        );
      })()}
    </>
  );
};
