import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Compass, Eye, Waves, Calendar, Target, Moon } from 'lucide-react';
import { PhaseVisual } from '../common/PhaseVisual';
import { 
  formatTime, 
  getDaysInYear, 
  getDayOfYear,
  clamp 
} from '../../utils/cosmicMath';
import { useAnnualLunarWorker } from '../../hooks/useEphemerisWorker';
import { OrbitalData, AnnualLunarMatrixItem, LunarEvents } from '../../types';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface LunarAlmanacCardProps {
  orbitalData?: OrbitalData | null;
  onSetTime?: (hours: number) => void;
  latitude?: number;
  longitude?: number;
  currentDay?: number;
  onDayChange?: (day: number) => void;
  currentDate?: Date;
  hoverDate?: Date | null;
  onHoverDate?: (date: Date | null) => void;
}

export const LunarAlmanacCard: React.FC<LunarAlmanacCardProps> = ({ 
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents: Partial<LunarEvents> = safeOrbital.lunarEvents || {};
  const tides = safeOrbital.tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const localTideStatus = safeOrbital.localTideStatus || 'Low Tide';
  const illPercent = ((phase.value ?? 0) * 100).toFixed(0);

  const { 
    moonrise = 6, transit = 12, moonset = 18, 
    distanceKm = 384400, distanceEarthRadii = 60.3, 
    isPerigee = false, isApogee = false, 
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

  // 1. 365-Day Annual Lunar Ephemeris Computation (offloaded to Web Worker)
  const annualLunarData: AnnualLunarMatrixItem[] = useAnnualLunarWorker({ year, latitude, longitude }) || [];

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

      if (d.distanceKm < minDistance) {
        minDistance = d.distanceKm;
        perigeeDay = d.day;
      }
    });

    return [
      { label: "🌕 Full Moon", day: fullMoonDay, title: "Closest Full Moon" },
      { label: "🌑 New Moon", day: newMoonDay, title: "Closest New Moon" },
      { label: "🚀 Supermoon (Perigee)", day: perigeeDay, title: "Closest Lunar Perigee Approach" }
    ];
  }, [annualLunarData]);

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
    const svgX = (clientX / rect.width) * ribbonWidth;
    const day = xToDay(svgX);
    setHoverDay(day);

    if (onHoverDate) {
      const d = new Date(year, 0, day);
      onHoverDate(d);
    }

    if ((isDragging || e.type === 'pointerdown') && onDayChange) {
      onDayChange(day);
    }
  };

  const getDayLabel = (dayNum: number): string => {
    const d = new Date(year, 0, dayNum);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeData = annualLunarData[activeDay - 1] || { 
    day: activeDay, 
    moonrise: moonrise ?? 6, 
    moonset: moonset ?? 18, 
    transit: transit ?? 12, 
    phaseValue: phase.value ?? 0.5 
  };

  const activeRiseY = activeData.moonrise !== null && activeData.moonrise !== undefined ? timeToY(activeData.moonrise) : null;
  const activeSetY = activeData.moonset !== null && activeData.moonset !== undefined ? timeToY(activeData.moonset) : null;

  // 2. Harmonized Tidal Wave Oscillator
  const tideWavePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const width = 800;
    const steps = 100;
    const midY = 45;
    const amplitude = 28 * ((tides.rx - 10) / 10);

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const rad = (i / steps) * Math.PI * 4;
      const y = midY - Math.cos(rad) * amplitude;
      points.push({ x, y });
    }
    return points;
  }, [tides.rx]);

  const buoyPoint = useMemo(() => {
    const frac = activeData.phaseValue ?? 0.5;
    const x = frac * 800;
    const midY = 45;
    const amplitude = 28 * ((tides.rx - 10) / 10);
    const y = midY - Math.cos(frac * Math.PI * 4) * amplitude;
    return { x, y };
  }, [activeData.phaseValue, tides.rx]);

  const tideTypeLabel = tides.rx >= 18 ? "Maximum Spring Tide (Syzygy)" : (tides.rx <= 13 ? "Minimal Neap Tide (Quadrature)" : "Transitional Moderate Tide");

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

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Date Badge & Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          365-day 24h moonrise/moonset braided ribbon, distance variation &amp; ocean tides
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">{getDayLabel(activeDay)}</span>
          <span className="text-slate-500">|</span>
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-cyan-400">{illPercent}% Illuminated</span>
        </div>
      </div>

      {/* Fast Jump Solstice / Phase Bar */}
      <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1 border-b border-slate-800 text-xs">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
          <Target className="w-3 h-3 text-cyan-400" /> Fast-Jump:
        </span>
        {shortcuts.map(s => {
          const isActive = Math.abs(activeDay - s.day) <= 1;
          return (
            <button
              key={s.label}
              onClick={() => onDayChange && onDayChange(s.day)}
              title={s.title}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isActive 
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400' 
                  : 'bg-slate-950/60 hover:bg-slate-800 hover:text-white text-slate-300 border border-slate-800/80'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Upper Area: 365-Day 24h Moonrise / Moonset Braided Ribbon Chart */}
      <div className="relative w-full bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 my-1 touch-none">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between items-center">
          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Moon className="w-3 h-3 text-cyan-400" /> 365-Day Moonrise &amp; Moonset Braided Ribbon (24h UTC)
          </span>
          <span className="text-slate-400">Scrub chart to jump calendar date</span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
          className="w-full h-[200px] block overflow-visible cursor-crosshair"
          onPointerDown={(e) => { setIsDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
          onPointerMove={(e) => handlePointer(e)}
          onPointerUp={(e) => { setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
          onPointerLeave={() => { setIsDragging(false); setHoverDay(null); if (onHoverDate) onHoverDate(null); }}
        >
          {/* Chart Background */}
          <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="#020617" rx="4" />

          {/* Month Axis Dividers & Labels */}
          {MONTH_NAMES.map((m, idx) => {
            const firstDay = Math.round(idx * 30.4 + 1);
            const x = dayToX(firstDay);
            return (
              <g key={m}>
                <line x1={x} y1={padTop} x2={x} y2={padTop + chartH} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
                <text x={x + 6} y={ribbonHeight - 8} className="text-[10px] font-mono font-bold fill-slate-400">{m}</text>
              </g>
            );
          })}

          {/* 6-Hour Horizontal Time Guides (0000Z, 0600Z, 1200Z, 1800Z, 2400Z) */}
          {[0, 6, 12, 18, 24].map((h) => {
            const y = timeToY(h);
            const label = h === 0 || h === 24 ? "00:00Z" : (h < 10 ? `0${h}:00Z` : `${h}:00Z`);
            const isNoonOrMidnight = h === 0 || h === 12 || h === 24;
            return (
              <g key={h}>
                <line 
                  x1={padLeft} y1={y} 
                  x2={padLeft + chartW} y2={y} 
                  stroke="#334155" 
                  strokeWidth={isNoonOrMidnight ? 1 : 0.5} 
                  strokeOpacity={isNoonOrMidnight ? 0.4 : 0.2} 
                />
                <text x={padLeft - 6} y={y + 3} textAnchor="end" className="text-[9px] font-mono fill-slate-400 font-bold">
                  {label}
                </text>
                <text x={padLeft + chartW + 6} y={y + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400 font-bold">
                  {h === 0 || h === 24 ? "Midnight" : (h === 12 ? "Noon" : "")}
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
            const opacity = isSuper ? 0.9 : (isFull ? 0.8 : 0.4);

            return (
              <line 
                key={d.day}
                x1={x} y1={yRise} 
                x2={x} y2={ySet} 
                stroke={strokeColor} 
                strokeWidth={isSuper ? 2.2 : (isFull ? 1.8 : 1.2)} 
                strokeOpacity={opacity} 
              />
            );
          })}

          {/* Continuous Moonrise Curve */}
          {moonrisePathD && (
            <path d={moonrisePathD} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeOpacity="0.85" />
          )}

          {/* Continuous Moonset Curve */}
          {moonsetPathD && (
            <path d={moonsetPathD} fill="none" stroke="#818cf8" strokeWidth="1.8" strokeOpacity="0.85" strokeDasharray="3 2" />
          )}

          {/* Active / Hover Day Vertical Cursor */}
          <line
            x1={dayToX(activeDay)} y1={padTop}
            x2={dayToX(activeDay)} y2={padTop + chartH}
            stroke="#ef4444" strokeWidth="1.8" strokeDasharray="4 3"
          />

          {/* Active Day Intersection Markers */}
          {activeRiseY !== null && (
            <g transform={`translate(${dayToX(activeDay)}, ${activeRiseY})`}>
              <circle r="4.5" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
              <text x="7" y="3" className="text-[9px] font-mono font-bold fill-sky-300">
                Rise: {formatTime(activeData.moonrise).substring(0, 5)}
              </text>
            </g>
          )}

          {activeSetY !== null && (
            <g transform={`translate(${dayToX(activeDay)}, ${activeSetY})`}>
              <circle r="4.5" fill="#818cf8" stroke="white" strokeWidth="1.5" />
              <text x="7" y="3" className="text-[9px] font-mono font-bold fill-indigo-300">
                Set: {formatTime(activeData.moonset).substring(0, 5)}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 px-1 border-t border-slate-800/80 pt-1.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-sky-400 inline-block" /> Moonrise Path
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-indigo-400 inline-block" /> Moonset Path
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-emerald-400 inline-block" /> Supermoon (Perigee)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-white inline-block" /> Full Moon
            </span>
          </div>
          <span className="text-slate-400 font-bold">Selected: {getDayLabel(activeDay)}</span>
        </div>
      </div>

      {/* Lower Half: Instantaneous Physical Metrics & Dynamic Harmonized Tidal Wave */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-1 items-center">
        
        {/* Left: Moon Phase Visual & Distance Readout (col-span-5) */}
        <div className="col-span-12 md:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-slate-900 rounded-full border border-slate-800">
            <PhaseVisual 
              phase={phase.value} 
              size={56} 
              parallacticAngle={parallacticAngle} 
            />
          </div>

          <div className="flex-1 font-mono space-y-0.5">
            <div className="text-xs font-bold text-slate-200">{phase.name}</div>
            <div className="text-[10px] text-cyan-400 font-bold">{illPercent}% Illuminated</div>
            <div className="text-[10px] text-slate-400">
              Dist: <strong className="text-slate-200">{(distanceKm || 384400).toLocaleString()} km</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Apsides: <strong className={isPerigee ? 'text-rose-400' : isApogee ? 'text-indigo-400' : 'text-slate-300'}>
                {isPerigee ? 'Perigee (Closest)' : isApogee ? 'Apogee (Furthest)' : 'Mean Orbit'}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Harmonized Tidal Wave & Moon Times (col-span-7) */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-2">
          
          {/* Tidal Vector Wave Card */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 mb-1">
              <span className="flex items-center gap-1 font-bold text-sky-300">
                <Waves className="w-3.5 h-3.5 text-sky-400" /> Harmonized Ocean Tidal Bulge
              </span>
              <span className="text-[10px] text-slate-400">
                Bulge Axis: <strong className="text-cyan-400">{tides.rx}x</strong>
              </span>
            </div>

            {/* Harmonized Ocean Wave SVG */}
            <div className="relative w-full h-[60px] overflow-hidden">
              <svg viewBox="0 0 800 90" className="w-full h-full" preserveAspectRatio="none">
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
