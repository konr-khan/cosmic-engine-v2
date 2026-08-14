import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Calendar, Clock, Target } from 'lucide-react';
import { 
  CONFIG, 
  getJulianDate, 
  calculateSolarPosition, 
  calculateDailySolarEvents, 
  formatTime,
  getDaysInYear,
  getDayOfYear,
  clamp
} from '../../utils/cosmicMath';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SolarAlmanac = ({ latitude = 47.06, longitude = -122.81, currentDay = 1, onDayChange, year = 2026, hoverTime, onHoverTime }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);

  const totalDays = getDaysInYear(year);
  const activeDay = Math.min(totalDays, hoverDay !== null ? hoverDay : currentDay);

  // Compute totalDays of solar twilight thresholds for the current latitude
  const almanacData = useMemo(() => {
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, 0, day);
      const jd = getJulianDate(d, 12);
      const { declination, equationOfTime } = calculateSolarPosition(jd);
      const localSolarNoon = 12 - (equationOfTime / 60);
      const events = calculateDailySolarEvents(latitude, declination, localSolarNoon);

      days.push({
        day,
        declination,
        equationOfTime,
        solarNoon: events.solarNoon,
        sunrise: events.official.morning,
        sunset: events.official.evening,
        civilDawn: events.civil.morning,
        civilDusk: events.civil.evening,
        nauticalDawn: events.nautical.morning,
        nauticalDusk: events.nautical.evening,
        astroDawn: events.astronomical.morning,
        astroDusk: events.astronomical.evening,
        dayLength: events.official.evening - events.official.morning
      });
    }
    return days;
  }, [latitude, year, totalDays]);

  const keyStats = useMemo(() => {
    let earliestSunrise = almanacData[0] || {};
    let latestSunset = almanacData[0] || {};
    let longestDay = almanacData[0] || {};
    let shortestDay = almanacData[0] || {};

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

  const xToDay = useCallback((x) => {
    const rawDay = 1 + ((x - paddingLeft) / chartW) * (totalDays - 1);
    return Math.max(1, Math.min(totalDays, Math.round(rawDay)));
  }, [chartW, paddingLeft, totalDays]);

  const dayToX = (day) => paddingLeft + ((day - 1) / (totalDays - 1)) * chartW;
  const timeToY = (timeHours) => {
    const clamped = Math.max(0, Math.min(24, timeHours));
    return paddingTop + chartH - (clamped / 24) * chartH;
  };

  const buildBandPath = (topKey, bottomKey) => {
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][topKey])}`;
    for (let i = 0; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][topKey])}`;
    }
    for (let i = almanacData.length - 1; i >= 0; i--) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][bottomKey])}`;
    }
    path += ` Z`;
    return path;
  };

  const buildLinePath = (key) => {
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][key])}`;
    for (let i = 1; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][key])}`;
    }
    return path;
  };

  const handlePointer = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * width;
    const svgY = (clientY / rect.height) * height;
    const day = xToDay(svgX);
    setHoverDay(day);

    if (onHoverTime && svgY >= paddingTop && svgY <= paddingTop + chartH) {
      const timeHours = (1 - (svgY - paddingTop) / chartH) * 24;
      onHoverTime(parseFloat(clamp(timeHours, 0, 24).toFixed(2)));
    }

    if (isDragging || e.type === 'pointerdown') {
      onDayChange(day);
    }
  };

  const getDayLabel = (dayNum) => {
    const d = new Date(year, 0, dayNum);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeData = almanacData[activeDay - 1] || almanacData[0];
  const sunriseY = timeToY(activeData.sunrise);
  const sunsetY = timeToY(activeData.sunset);

  // Compute equivalent daylight mirror day across Solstice
  const mirrorDayData = useMemo(() => {
    if (!almanacData.length) return null;
    const targetLength = activeData.dayLength;
    
    let bestDay = null;
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

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Date Badge & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          24-hour annual sun path showing daylight, civil, nautical &amp; astronomical twilights
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-slate-200">{getDayLabel(activeDay)}</span>
          <span className="text-slate-500">|</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-400">{(activeData.dayLength).toFixed(1)}h Daylight</span>
        </div>
      </div>

      {/* Solstice & Equinox Fast-Jump Shortcut Bar */}
      <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1 border-b border-slate-800 text-xs">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
          <Target className="w-3 h-3 text-indigo-400" /> Fast-Jump:
        </span>
        {shortcuts.map(s => {
          const isActive = Math.abs(activeDay - s.day) <= 1;
          return (
            <button
              key={s.label}
              onClick={() => onDayChange(s.day)}
              title={s.title}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' 
                  : 'bg-slate-950/60 hover:bg-slate-800 hover:text-white text-slate-300 border border-slate-800/80'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Main SVG Chart */}
      <div className="relative w-full flex-1 min-h-[320px] touch-none">
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full block overflow-visible"
          onPointerDown={(e) => { setIsDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
          onPointerMove={(e) => handlePointer(e)}
          onPointerUp={(e) => { setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
          onPointerLeave={() => { setIsDragging(false); setHoverDay(null); if (onHoverTime) onHoverTime(null); }}
          style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
        >
          <defs>
            <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
            <linearGradient id="civilGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="nauticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="astroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <rect x={paddingLeft} y={paddingTop} width={chartW} height={chartH} fill={CONFIG.THEME.NIGHT_FILL} rx="4" />

          <path d={buildBandPath('astroDusk', 'astroDawn')} fill="url(#astroGrad)" />
          <path d={buildBandPath('nauticalDusk', 'nauticalDawn')} fill="url(#nauticalGrad)" />
          <path d={buildBandPath('civilDusk', 'civilDawn')} fill="url(#civilGrad)" />
          <path d={buildBandPath('sunset', 'sunrise')} fill="url(#dayGrad)" />

          {/* Month Axis Labels */}
          {MONTH_NAMES.map((m, idx) => {
            const firstDayOfMonth = Math.round(idx * 30.4 + 1);
            const x = dayToX(firstDayOfMonth);
            return (
              <g key={m}>
                <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartH} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="3 3" />
                <text x={x + 10} y={height - 10} className="text-xs font-bold fill-slate-400 font-mono">{m}</text>
              </g>
            );
          })}

          {/* Time Axis Labels */}
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((h) => {
            const y = timeToY(h);
            const label = h === 0 || h === 24 ? "12 AM" : (h === 12 ? "12 PM" : (h < 12 ? `${h} AM` : `${h - 12} PM`));
            const isMidnightOrNoon = h === 0 || h === 12 || h === 24;
            return (
              <g key={h}>
                <line 
                  x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} 
                  stroke={isMidnightOrNoon ? "#ffffff" : "#ffffff"} 
                  strokeWidth={isMidnightOrNoon ? "1" : "0.5"} 
                  strokeOpacity={isMidnightOrNoon ? "0.35" : "0.1"} 
                />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className={`text-xs font-mono ${isMidnightOrNoon ? 'fill-slate-200 font-bold' : 'fill-slate-400'}`}>
                  {label}
                </text>
                <text x={paddingLeft + chartW + 8} y={y + 4} textAnchor="start" className="text-xs font-mono fill-slate-400 font-bold">
                  {h === 0 || h === 24 ? "Midnight" : (h === 12 ? "Noon" : "")}
                </text>
              </g>
            );
          })}

          {/* Black Boundary Curves */}
          <path d={buildLinePath('sunrise')} fill="none" stroke="#000000" strokeWidth="1.5" />
          <path d={buildLinePath('sunset')} fill="none" stroke="#000000" strokeWidth="1.5" />
          <path d={buildLinePath('solarNoon')} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 2" />
          <path d={buildLinePath('civilDawn')} fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.6" />
          <path d={buildLinePath('civilDusk')} fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.6" />

          {/* Key Stats Annotations */}
          <g transform={`translate(${dayToX(keyStats.earliestSunrise.day)}, ${timeToY(keyStats.earliestSunrise.sunrise)})`}>
            <circle r="3" fill="#000000" />
            <text y="14" textAnchor="middle" className="text-[10px] font-bold fill-indigo-300 font-mono">
              {getDayLabel(keyStats.earliestSunrise.day)}
            </text>
          </g>

          <g transform={`translate(${dayToX(keyStats.latestSunset.day)}, ${timeToY(keyStats.latestSunset.sunset)})`}>
            <circle r="3" fill="#000000" />
            <text y="-8" textAnchor="middle" className="text-[10px] font-bold fill-indigo-300 font-mono">
              {getDayLabel(keyStats.latestSunset.day)}
            </text>
          </g>

          {/* Dynamic Horizontal Guidelines for Sunrise & Sunset on Active Day */}
          <line 
            x1={paddingLeft} y1={sunriseY} 
            x2={paddingLeft + chartW} y2={sunriseY} 
            stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" 
          />
          <line 
            x1={paddingLeft} y1={sunsetY} 
            x2={paddingLeft + chartW} y2={sunsetY} 
            stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" 
          />

          {/* Synced Hover Time Horizontal Guideline */}
          {hoverTime !== null && hoverTime !== undefined && (
            <g>
              <line 
                x1={paddingLeft} y1={timeToY(hoverTime)} 
                x2={paddingLeft + chartW} y2={timeToY(hoverTime)} 
                stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" className="drop-shadow-sm" 
              />
              <g transform={`translate(${paddingLeft - 6}, ${timeToY(hoverTime) + 4})`}>
                <text textAnchor="end" className="text-[10px] font-mono font-black fill-sky-500">
                  {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
                </text>
              </g>
            </g>
          )}

          {/* Dynamically Generated Sunrise & Sunset Labels (Bumped Font Size) */}
          <g transform={`translate(${paddingLeft + chartW + 6}, ${sunriseY + 4})`}>
            <text className="text-xs font-mono font-black fill-amber-400">
              {formatTime(activeData.sunrise).substring(0, 5)}
            </text>
          </g>
          <g transform={`translate(${paddingLeft + chartW + 6}, ${sunsetY + 4})`}>
            <text className="text-xs font-mono font-black fill-amber-400">
              {formatTime(activeData.sunset).substring(0, 5)}
            </text>
          </g>

          {/* Dynamic Solstice Mirrored Equivalent Daylight Vertical Guideline */}
          {mirrorDayData && (
            <g>
              <line 
                x1={dayToX(mirrorDayData.day)} y1={paddingTop} 
                x2={dayToX(mirrorDayData.day)} y2={paddingTop + chartH} 
                stroke="#6366f1" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.9" 
              />
              {/* Intersection Dots on Mirrored Day */}
              <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunrise)} r="4" fill="#6366f1" stroke="white" strokeWidth="1.5" />
              <circle cx={dayToX(mirrorDayData.day)} cy={timeToY(mirrorDayData.sunset)} r="4" fill="#6366f1" stroke="white" strokeWidth="1.5" />
              {/* Top Mirrored Day Badge */}
              <g transform={`translate(${dayToX(mirrorDayData.day)}, ${paddingTop - 8})`}>
                <text textAnchor="middle" className="text-xs font-mono font-bold fill-indigo-400">
                  Equiv: {getDayLabel(mirrorDayData.day)} ({mirrorDayData.dayLength.toFixed(1)}h)
                </text>
              </g>
            </g>
          )}

          {/* Current Selected Day Vertical Cursor Line */}
          <line 
            x1={dayToX(activeDay)} y1={paddingTop} 
            x2={dayToX(activeDay)} y2={paddingTop + chartH} 
            stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 3" 
          />

          {/* Active Day Markers */}
          <circle cx={dayToX(activeDay)} cy={sunriseY} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
          <circle cx={dayToX(activeDay)} cy={sunsetY} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
          <circle cx={dayToX(activeDay)} cy={timeToY(activeData.solarNoon)} r="3" fill="#fbbf24" stroke="black" strokeWidth="1" />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-800 text-[10px] font-medium font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-300 border border-amber-400" />
          <span className="text-slate-300 font-bold">Daylight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-slate-400">Civil (-6°)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-400" />
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
