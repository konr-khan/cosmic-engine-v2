import React from 'react';

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SolarRibbonAxesProps {
  width: number;
  height: number;
  paddingLeft: number;
  paddingTop: number;
  chartW: number;
  chartH: number;
  dayToX: (day: number) => number;
  timeToY: (time: number) => number;
}

export const SolarRibbonAxes: React.FC<SolarRibbonAxesProps> = ({
  width,
  height,
  paddingLeft,
  paddingTop,
  chartW,
  chartH,
  dayToX,
  timeToY,
}) => {
  return (
    <>
      {/* Month Axis Dividers & Labels */}
      {MONTH_NAMES.map((m, idx) => {
        const firstDayOfMonth = Math.round(idx * 30.4 + 1);
        const x = dayToX(firstDayOfMonth);
        return (
          <g key={m}>
            <line 
              x1={x} y1={paddingTop} 
              x2={x} y2={paddingTop + chartH} 
              stroke="#334155" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="3 3" 
            />
            <text x={x + 10} y={height - 10} className="text-[11px] font-medium fill-slate-400 font-mono">
              {m}
            </text>
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
              x1={paddingLeft} y1={y} 
              x2={paddingLeft + chartW} y2={y} 
              stroke="#334155" 
              strokeWidth="0.5" 
              strokeOpacity={isMidnightOrNoon ? 0.4 : 0.18} 
            />
            <text 
              x={paddingLeft - 8} y={y + 4} 
              textAnchor="end" 
              className={`text-xs font-mono ${isMidnightOrNoon ? 'fill-slate-200 font-semibold' : 'fill-slate-400 font-normal'}`}
            >
              {label}
            </text>
            <text 
              x={paddingLeft + chartW + 8} y={y + 4} 
              textAnchor="start" 
              className="text-xs font-mono fill-slate-400 font-medium"
            >
              {h === 0 || h === 24 ? "Midnight" : (h === 12 ? "Noon" : "")}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default SolarRibbonAxes;
