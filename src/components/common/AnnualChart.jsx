import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';
import { CONFIG } from '../../utils/cosmicMath';

export const AnnualChart = ({ annualData, currentDay, onDayChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);

  // Determine which day to target for the crosshair visual
  const activeDay = hoverDay !== null ? hoverDay : currentDay;
  
  // Calculate the daylight length for the active target
  const activeLength = useMemo(() => {
    const dayData = annualData.find(d => d.day === activeDay);
    return dayData ? dayData.length : 0;
  }, [annualData, activeDay]);

  const handleInteraction = (e) => { 
    if (e && e.activeLabel) {
       const numericLabel = Number(e.activeLabel);
       // Only commit the global date change if dragging or clicking
       if (isDragging || e.type === 'click') {
          onDayChange(numericLabel);
       }
       // Always update the local hover state for the crosshair visual
       setHoverDay(numericLabel);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Annual Daylight Curve</h3>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={annualData} 
            margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
            onMouseDown={(e) => { setIsDragging(true); handleInteraction(e); }}
            onMouseMove={(e) => handleInteraction(e)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => { setIsDragging(false); setHoverDay(null); }}
            onClick={handleInteraction}
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="day" 
              type="number" 
              domain={[1, 365]} 
              ticks={CONFIG.DATES.map(d => d.day)}
              tickFormatter={(tick) => CONFIG.DATES.find(d => d.day === tick)?.short || ""}
              stroke="#94a3b8" 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
              interval={0}
            />
            
            <YAxis 
              domain={[0, 24]} 
              ticks={[0, 4, 8, 12, 16, 20, 24]} 
              stroke="#94a3b8" 
              tick={{ fontSize: 12 }} 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8' } }} 
            />
            
            <RechartsTooltip 
              cursor={{ stroke: CONFIG.THEME.ACCENT, strokeWidth: 2, strokeDasharray: "4 4" }}
              content={({ label }) => (
                <div className="bg-white p-2 rounded-lg shadow-md border border-slate-100 text-sm font-semibold text-slate-600">
                  {label ? new Date(2023, 0, label).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}
                </div>
              )} 
            />
            
            {/* Vertical Reference Line (Day) - Tracks hover or selected day */}
            <ReferenceLine x={activeDay} stroke={CONFIG.THEME.ACCENT} strokeDasharray="3 3" />
            
            {/* Horizontal Reference Line (Length) - Tracks hover or selected day */}
            <ReferenceLine y={activeLength} stroke={CONFIG.THEME.ACCENT} strokeDasharray="3 3">
              <Label value={`${activeLength}h`} position="right" fill={CONFIG.THEME.ACCENT} fontSize={10} fontWeight="bold" />
            </ReferenceLine>

            {/* Configured Date Markers (Fixed) */}
            {CONFIG.DATES.map(kd => (
              <ReferenceLine key={kd.day} x={kd.day} stroke="#cbd5e1" strokeDasharray="2 2" />
            ))}

            <Line 
              type="monotone" 
              dataKey="length" 
              stroke={CONFIG.THEME.SUN_FILL} 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: CONFIG.THEME.SUN_FILL, stroke: "white", strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualChart;
