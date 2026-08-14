import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Compass, Eye, Waves, Calendar, Target } from 'lucide-react';
import { PhaseVisual } from '../common/PhaseVisual';
import { 
  CONFIG, 
  formatTime, 
  getJulianDate, 
  calculateSolarPosition, 
  calculateLunarPosition, 
  calculateLunarEvents, 
  getDaysInYear,
  getDayOfYear
} from '../../utils/cosmicMath';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const LunarAlmanacCard = ({ 
  orbitalData, 
  onSetTime, 
  latitude = 47.06, 
  longitude = -122.81, 
  currentDay = 1, 
  onDayChange, 
  currentDate = new Date(),
  hoverDate,
  onHoverDate
}) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);

  const safeOrbital = orbitalData || {};
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {};
  const tides = safeOrbital.tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const localTideStatus = safeOrbital.localTideStatus || 'Low Tide';
  const illPercent = ((phase.value ?? 0) * 100).toFixed(0);

  const { 
    moonrise, transit, moonset, 
    distanceKm, distanceEarthRadii, 
    isPerigee, isApogee, 
    parallacticAngle = 0 
  } = lunarEvents;

  const year = currentDate ? currentDate.getFullYear() : 2026;
  const totalDays = getDaysInYear(year);
  const activeDay = Math.min(
    totalDays, 
    hoverDay !== null 
      ? hoverDay 
      : (hoverDate ? getDayOfYear(hoverDate) : currentDay)
  );

  // 1. CONCEPT 1: 365-Day Annual Lunar Ribbon Ephemeris Computation
  const annualLunarData = useMemo(() => {
    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, 0, day);
      const jd = getJulianDate(d, 12);
      const events = calculateLunarEvents(latitude, longitude, jd, 12);
      const solarPos = calculateSolarPosition(jd);
      const lunarPos = calculateLunarPosition(jd);
      
      const raDiff = ((lunarPos.rightAscension - solarPos.rightAscension) % 360 + 360) % 360;
      const phaseVal = raDiff / 360;

      list.push({
        day,
        moonrise: events.moonrise,
        transit: events.transit,
        moonset: events.moonset,
        phaseValue: phaseVal,
        isPerigee: events.isPerigee,
        isApogee: events.isApogee,
        distanceKm: events.distanceKm
      });
    }
    return list;
  }, [latitude, longitude, year, totalDays]);

  // Key Lunar Solstice / Phase Fast-Jump Shortcuts
  const shortcuts = useMemo(() => {
    let fullMoonDay = 1;
    let newMoonDay = 1;
    let perigeeDay = 1;

    let minPhaseDiff = 1;
    let maxPhaseDiff = 0;
    let minDistance = 999999;

    annualLunarData.forEach(d => {
      const diffFull = Math.abs(d.phaseValue - 0.5);
      if (diffFull < minPhaseDiff) { minPhaseDiff = diffFull; fullMoonDay = d.day; }
      
      const diffNew = Math.min(d.phaseValue, 1 - d.phaseValue);
      if (diffNew < maxPhaseDiff || d.day === 1) { maxPhaseDiff = diffNew; newMoonDay = d.day; }

      if (d.distanceKm && d.distanceKm < minDistance) {
        minDistance = d.distanceKm;
        perigeeDay = d.day;
      }
    });

    return [
      { label: "🌕 Full Moon", day: fullMoonDay, title: "Peak Illumination" },
      { label: "🌑 New Moon", day: newMoonDay, title: "Dark Sky Night" },
      { label: "✨ Supermoon", day: perigeeDay, title: "Closest Lunar Proximity" }
    ];
  }, [annualLunarData]);

  // Chart dimensions & scaling helpers for Ribbon Matrix
  const width = 800;
  const height = 280;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const dayToX = (day) => paddingLeft + ((day - 1) / (totalDays - 1)) * chartW;
  const timeToY = (timeHours) => {
    const clamped = Math.max(0, Math.min(24, timeHours));
    return paddingTop + chartH - (clamped / 24) * chartH;
  };

  const xToDay = useCallback((x) => {
    const rawDay = 1 + ((x - paddingLeft) / chartW) * (totalDays - 1);
    return Math.max(1, Math.min(totalDays, Math.round(rawDay)));
  }, [chartW, paddingLeft, totalDays]);

  const handlePointer = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;
    const day = xToDay(svgX);
    setHoverDay(day);
    if (onHoverDate) {
      onHoverDate(new Date(year, 0, day));
    }
    if ((isDragging || e.type === 'pointerdown') && onDayChange) {
      onDayChange(day);
    }
  };

  const activeData = annualLunarData[activeDay - 1] || annualLunarData[0];

  // 2. CONCEPT 2: 48-Hour Ocean Harmonic Waveform Computation
  const tideWavePoints = useMemo(() => {
    const points = [];
    const alignment = tides ? tides.alignment : 0; // -1 (Neap) to +1 (Spring)
    const baseAmp = 24; 
    const springFactor = 1 + (alignment * 0.35);

    const omegaM = (2 * Math.PI) / 12.42;
    const omegaS = (2 * Math.PI) / 12.0;

    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const tRelHours = -24 + (i / steps) * 48;
      const tAbs = (transit || 12) + tRelHours;

      const hM = Math.cos(omegaM * tAbs);
      const hS = Math.cos(omegaS * tAbs) * Math.max(0, alignment);
      const hTide = (hM * 0.75 + hS * 0.25) * baseAmp * springFactor;

      const x = (i / steps) * 800;
      const y = 45 - hTide;
      points.push({ x, y, tRelHours, hTide });
    }
    return points;
  }, [transit, tides]);

  // Floating Observer Buoy derivative & flow direction
  const centerIndex = 50; // tRelHours = 0
  const buoyPoint = tideWavePoints[centerIndex] || { x: 400, y: 45, hTide: 0 };
  const prevPoint = tideWavePoints[centerIndex - 2] || buoyPoint;
  const nextPoint = tideWavePoints[centerIndex + 2] || buoyPoint;

  const dy = nextPoint.y - prevPoint.y;
  const isFloodTide = dy < 0; // In SVG, Y decreases as water rises (Flood)

  const tideTypeLabel = tides ? tides.type : "Transitional";

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Fast-Jump Shortcuts Rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          365-day annual moonrise/moonset drift ribbons &amp; live ocean harmonic tide wave
        </p>

        {/* Solstice & Phase Shortcut Pins */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
            <Target className="w-3 h-3 text-indigo-400" /> Fast-Jump:
          </span>
          {shortcuts.map(s => {
            const isActive = Math.abs(activeDay - s.day) <= 1;
            return (
              <button
                key={s.label}
                onClick={() => onDayChange && onDayChange(s.day)}
                title={s.title}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 border-indigo-500' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Responsive Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-[300px]">
        
        {/* Left Column: Annual Lunar Ribbon Matrix (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-white">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> 365-Day Moonrise & Moonset Ribbon Matrix
            </span>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">
              Day {activeDay} | Rise: {formatTime(activeData.moonrise)} UTC
            </span>
          </div>

          <div className="relative w-full flex-1 min-h-[220px] touch-none">
            <svg 
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-full block"
              preserveAspectRatio="xMidYMid meet"
              onPointerDown={(e) => { setIsDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
              onPointerMove={(e) => handlePointer(e)}
              onPointerUp={(e) => { setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
              onPointerLeave={() => { setIsDragging(false); setHoverDay(null); if (onHoverDate) onHoverDate(null); }}
              style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
            >
              {/* Background Night Sky Canvas */}
              <rect x={paddingLeft} y={paddingTop} width={chartW} height={chartH} fill="#0b0f19" rx="6" />

              {/* Month Column Dividers & Labels */}
              {MONTH_NAMES.map((m, idx) => {
                const firstDayOfMonth = Math.round(idx * 30.4 + 1);
                const x = dayToX(firstDayOfMonth);
                return (
                  <g key={m}>
                    <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartH} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="3 3" />
                    <text x={x + 6} y={height - 6} className="text-xs font-bold fill-slate-300 font-mono">{m}</text>
                  </g>
                );
              })}

              {/* 6-Hour Horizontal Time Guides */}
              {[0, 6, 12, 18, 24].map((h) => {
                const y = timeToY(h);
                const label = h === 0 || h === 24 ? "0000Z" : (h === 12 ? "1200Z" : (h < 12 ? `0${h}00Z` : `${h}00Z`));
                return (
                  <g key={h}>
                    <line x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" />
                    <text x={paddingLeft - 6} y={y + 4} textAnchor="end" className="text-xs font-mono font-bold fill-slate-300">
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Render 365 Days of Moonrise / Moonset Braided Ribbons */}
              {annualLunarData.map((d) => {
                if (d.moonrise === null || d.moonset === null) return null;
                const x = dayToX(d.day);
                const yRise = timeToY(d.moonrise);
                const ySet = timeToY(d.moonset);
                
                const isFull = Math.abs(d.phaseValue - 0.5) < 0.15;
                const isSuper = d.isPerigee;
                
                const strokeColor = isSuper ? "#34d399" : (isFull ? "#f8fafc" : "#64748b");
                const opacity = isFull ? 0.85 : 0.45;

                return (
                  <g key={d.day}>
                    <line 
                      x1={x} y1={yRise} 
                      x2={x} y2={ySet} 
                      stroke={strokeColor} 
                      strokeWidth={isSuper ? "2.5" : "1.8"} 
                      strokeOpacity={opacity} 
                    />
                  </g>
                );
              })}

              {/* Selected Active Day Vertical Cursor */}
              <line 
                x1={dayToX(activeDay)} y1={paddingTop} 
                x2={dayToX(activeDay)} y2={paddingTop + chartH} 
                stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" 
              />
              <circle cx={dayToX(activeDay)} cy={timeToY(activeData.moonrise || 12)} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Right Column: Tidal Rhythm Harmonic Waveform & Sky View (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full gap-3">
          
          {/* Sky Orientation & Phase Banner */}
          <div className="bg-slate-950/80 text-slate-200 rounded-xl p-3 border border-slate-800 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase & Observer View</span>
              <h4 className="text-base font-black text-blue-100">{phase.name} ({illPercent}%)</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Sky Tilt: {parallacticAngle > 0 ? `+${parallacticAngle}` : parallacticAngle}°
                </span>
                {isPerigee && <span className="text-[9px] font-bold text-emerald-400">✨ Supermoon</span>}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <PhaseVisual phase={phase.value} parallacticAngle={parallacticAngle} />
            </div>
          </div>

          {/* CONCEPT 2: Tidal Rhythm Harmonic Waveform */}
          <div className="bg-slate-950/80 text-slate-200 rounded-xl p-3 border border-slate-800 flex flex-col justify-between flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" /> Tidal Rhythm Waveform
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {isFloodTide ? "FLOOD ▲" : "EBB ▼"}
              </span>
            </div>

            <div className="relative w-full h-[75px] my-1">
              <svg viewBox="0 0 800 90" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="tideWaveGradCard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="45" x2="800" y2="45" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                {(() => {
                  let pathD = `M ${tideWavePoints[0].x} ${tideWavePoints[0].y}`;
                  for (let i = 1; i < tideWavePoints.length; i++) {
                    pathD += ` L ${tideWavePoints[i].x} ${tideWavePoints[i].y}`;
                  }
                  const fillD = `${pathD} L 800 90 L 0 90 Z`;

                  return (
                    <g>
                      <path d={fillD} fill="url(#tideWaveGradCard)" />
                      <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  );
                })()}

                <g transform={`translate(${buoyPoint.x}, ${buoyPoint.y})`}>
                  <circle r="6" fill="#0284c7" stroke="white" strokeWidth="1.5" className="animate-pulse" />
                  <circle r="2.5" fill="#fef08a" />
                </g>
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
              <span>Potential: <strong className="text-indigo-300">{tideTypeLabel}</strong></span>
              <span>Water: <strong className="text-amber-300">{localTideStatus}</strong></span>
            </div>
          </div>

          {/* Moonrise, Transit, Moonset Triple Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Moonrise</span>
              <span className="text-xs font-mono font-bold text-slate-200">{formatTime(moonrise)}</span>
            </div>
            <div 
              onClick={() => transit && onSetTime && onSetTime(transit)}
              className="bg-indigo-950/60 hover:bg-indigo-900/80 transition-colors cursor-pointer p-2 rounded-lg border border-indigo-500/40 flex flex-col items-center text-indigo-300"
              title="Click to jump clock to Lunar Transit"
            >
              <span className="text-[9px] font-bold text-indigo-400 uppercase flex items-center gap-0.5"><Compass className="w-2.5 h-2.5" /> Transit</span>
              <span className="text-xs font-mono font-bold text-indigo-200">{formatTime(transit)}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Moonset</span>
              <span className="text-xs font-mono font-bold text-slate-200">{formatTime(moonset)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LunarAlmanacCard;
