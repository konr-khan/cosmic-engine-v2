import React from 'react';
import { AnnualLunarMatrixItem } from '../../../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface LunarRibbonAxesProps {
  chartW: number;
  chartH: number;
  padLeft: number;
  padTop: number;
  ribbonHeight: number;
  isSynodic: boolean;
  activeDay: number;
  startDay: number;
  endDay: number;
  year: number;
  visibleDays: AnnualLunarMatrixItem[];
  dayToX: (day: number) => number;
  timeToY: (time: number) => number;
  getDayLabel: (dayNum: number) => string;
  timeMode: 'utc' | 'local';
  targetHoverDay: number | null;
}

export const LunarRibbonAxes: React.FC<LunarRibbonAxesProps> = ({
  chartW,
  chartH,
  padLeft,
  padTop,
  ribbonHeight,
  isSynodic,
  activeDay,
  startDay,
  endDay,
  year,
  visibleDays,
  dayToX,
  timeToY,
  getDayLabel,
  timeMode,
  targetHoverDay
}) => {
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
    <>
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
                stroke={isCur ? '#f43f5e' : (isSunday ? '#475569' : '#334155')}
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
              stroke={isSelected ? '#f43f5e' : (isHovered ? '#38bdf8' : '#475569')}
              strokeWidth={isSelected || isHovered ? 1.5 : 0.75}
            />
          </g>
        );
      })}
    </>
  );
};
