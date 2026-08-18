import React, { useMemo } from 'react';
import { Compass, Eye, Calendar, Moon } from 'lucide-react';
import { PhaseVisual } from '../../common/PhaseVisual';
import { 
  formatTime, 
  getDaysInYear, 
  getDayOfYear,
  toRadians,
  toDegrees,
  clamp
} from '../../../utils/cosmicMath';
import { useAnnualLunarWorker } from '../../../hooks/useEphemerisWorker';
import { OrbitalData, AnnualLunarMatrixItem, LunarEvents } from '../../../types';
import { LunarShortcutsRail, LunarShortcutItem } from './LunarShortcutsRail';
import { LunarRibbonChart } from './LunarRibbonChart';
import { TidalWaveOscillator } from './TidalWaveOscillator';

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
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents: Partial<LunarEvents> = safeOrbital.lunarEvents || {};
  const tides = safeOrbital.tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const localTideStatus = safeOrbital.localTideStatus || 'Low Tide';
  const illPercent = ((phase.value ?? 0) * 100).toFixed(0);

  const { 
    moonrise = 6, transit = 12, moonset = 18, 
    distanceKm = 384400, 
    isPerigee = false, isApogee = false, 
    parallacticAngle = 0 
  } = lunarEvents;

  const year = currentDate ? currentDate.getFullYear() : 2026;
  const totalDays = getDaysInYear(year);
  const activeDay = Math.min(
    totalDays, 
    hoverDate ? getDayOfYear(hoverDate) : currentDay
  );

  // 1. 365-Day Annual Lunar Ephemeris Computation (offloaded to Web Worker)
  const annualLunarData: AnnualLunarMatrixItem[] = useAnnualLunarWorker({ year, latitude, longitude }) || [];

  // Key Lunar Solstice / Phase Fast-Jump Shortcuts
  const shortcuts: LunarShortcutItem[] = useMemo(() => {
    let fullMoonDay = 1;
    let newMoonDay = 1;
    let perigeeDay = 1;

    let minPhaseDiff = 1;
    let maxPhaseDiff = 0;
    let minDistance = 999999;

    annualLunarData.forEach((d) => {
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

  const currentTimeHours = currentDate.getUTCHours() + currentDate.getUTCMinutes() / 60 + currentDate.getUTCSeconds() / 3600;
  const transitHour = activeData.transit ?? transit ?? 12;
  const decDeg = (lunarEvents.declination as number) ?? 0;

  // Instantaneous Lunar Elevation Math
  const moonHourAngle = (currentTimeHours - transitHour) * 15;
  const sinAlt =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(decDeg)) +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(decDeg)) * Math.cos(toRadians(moonHourAngle));
  const currentElevation = toDegrees(Math.asin(clamp(sinAlt, -1, 1)));

  // Peak Elevation at Transit
  const sinPeak =
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(decDeg)) +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(decDeg));
  const peakElevation = toDegrees(Math.asin(clamp(sinPeak, -1, 1)));

  // Viewport Coordinates for Moon Arc Dome
  const elR = 62;
  const elCx = 100;
  const elCy = 66;
  const moonX = elCx + elR * Math.sin(toRadians(moonHourAngle));
  const moonY = elCy - elR * Math.sin(toRadians(currentElevation));

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
      <LunarShortcutsRail
        shortcuts={shortcuts}
        activeDay={activeDay}
        onDayChange={onDayChange}
      />

      {/* Upper Area: 365-Day 24h Moonrise / Moonset Braided Ribbon Chart */}
      <LunarRibbonChart
        annualLunarData={annualLunarData}
        activeDay={activeDay}
        totalDays={totalDays}
        year={year}
        activeData={activeData}
        onDayChange={onDayChange}
        onHoverDate={onHoverDate}
        getDayLabel={getDayLabel}
      />

      {/* Lower Half: Instantaneous Physical Metrics & Moon Elevation Arc Dome */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-2 items-start">
        
        {/* Left Column: Moon Phase Card & Harmonized Tidal Wave (col-span-5) */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-2.5">
          {/* Moon Phase Visual & Distance Readout */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-slate-950 rounded-full border border-slate-800">
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
                Apsides: <strong className={isPerigee ? 'text-emerald-400' : isApogee ? 'text-indigo-400' : 'text-slate-300'}>
                  {isPerigee ? 'Perigee (Closest)' : isApogee ? 'Apogee (Furthest)' : 'Mean Orbit'}
                </strong>
              </div>
            </div>
          </div>

          {/* Tidal Vector Wave Card */}
          <TidalWaveOscillator
            tides={tides}
            phaseValue={activeData.phaseValue}
            localTideStatus={localTideStatus}
          />
        </div>

        {/* Right Column: Moon Elevation Arc Dome & Moon Times (col-span-7) */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-2.5">
          
          {/* Moon Elevation Arc Dome Viewport */}
          <div className="w-full bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex flex-col items-center shadow-inner backdrop-blur-sm">
            <div className="w-full flex justify-between items-center mb-1 px-1 font-mono">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Moon className="w-3 h-3 text-cyan-400" /> Moon Elevation Arc
              </div>
              <div className="text-[10px] font-bold text-cyan-400">
                Transit Peak: <strong className="text-white">{peakElevation.toFixed(1)}°</strong>
              </div>
            </div>

            <svg viewBox="0 0 200 85" className="w-full max-h-[80px] overflow-visible" preserveAspectRatio="xMidYMid meet">
              {/* Horizon Line (0°) */}
              <line x1="20" y1={elCy} x2="180" y2={elCy} stroke="#475569" strokeWidth="1.2" />
              <text x="18" y={elCy + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-400">0°</text>
              <text x="182" y={elCy + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-400">0°</text>

              {/* Semicircular Elevation Arc Dome */}
              <path d={`M ${elCx - elR} ${elCy} A ${elR} ${elR} 0 0 1 ${elCx + elR} ${elCy}`} fill="none" stroke="#334155" strokeWidth="1.2" strokeDasharray="4 3" />
              
              {/* Zenith Marker (90°) */}
              <line x1={elCx} y1={elCy - elR - 3} x2={elCx} y2={elCy - elR + 3} stroke="#64748b" strokeWidth="1" />
              <text x={elCx} y={elCy - elR - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-400">+90°</text>

              {/* Observer Horizon Center Origin */}
              <circle cx={elCx} cy={elCy} r="2.5" fill="#64748b" stroke="#334155" strokeWidth="1" />

              {/* Moon Elevation Vector & Disc */}
              {currentElevation > -18 && (
                <g>
                  <line 
                    x1={elCx} y1={elCy} 
                    x2={moonX} y2={moonY} 
                    stroke={currentElevation >= 0 ? "#38bdf8" : "#64748b"} 
                    strokeWidth="1.2" 
                    strokeDasharray="2 2" 
                    opacity="0.85" 
                  />
                  <circle 
                    cx={moonX} 
                    cy={moonY} 
                    r="5.5" 
                    fill={currentElevation >= 0 ? "#38bdf8" : "#475569"} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    className="drop-shadow" 
                  />
                </g>
              )}
            </svg>

            {/* Live Elevation Angle Readout Badge */}
            <div className="text-center -mt-2 bg-slate-950/95 px-3 py-1 rounded-lg border border-slate-800 shadow-md">
              <div className={`text-sm font-mono font-bold ${currentElevation >= 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                {currentElevation >= 0 ? `+${currentElevation.toFixed(1)}°` : `${currentElevation.toFixed(1)}°`}
                <span className="text-[9px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
                  {currentElevation > 0 ? '(Above Horizon)' : '(Below Horizon)'}
                </span>
              </div>
            </div>
          </div>

          {/* Moonrise, Transit, Moonset Triple Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Moonrise</span>
              <span className="text-xs font-mono font-bold text-slate-200">{formatTime(activeData.moonrise)}</span>
            </div>
            <div 
              onClick={() => transit && onSetTime && onSetTime(transit)}
              className="bg-indigo-950/80 hover:bg-indigo-900/90 transition-all cursor-pointer p-2 rounded-lg border border-indigo-500/50 flex flex-col items-center text-indigo-300 shadow-sm"
              title="Click to jump clock to Lunar Transit"
            >
              <span className="text-[9px] font-bold text-indigo-400 uppercase flex items-center gap-0.5 font-mono"><Compass className="w-2.5 h-2.5" /> Transit</span>
              <span className="text-xs font-mono font-bold text-indigo-200">{formatTime(transit)}</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Moonset</span>
              <span className="text-xs font-mono font-bold text-slate-200">{formatTime(activeData.moonset)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LunarAlmanacCard;
