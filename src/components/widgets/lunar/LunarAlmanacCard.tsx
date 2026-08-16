import React, { useMemo } from 'react';
import { Compass, Eye, Calendar } from 'lucide-react';
import { PhaseVisual } from '../../common/PhaseVisual';
import { 
  formatTime, 
  getDaysInYear, 
  getDayOfYear 
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
          <TidalWaveOscillator
            tides={tides}
            phaseValue={activeData.phaseValue}
            localTideStatus={localTideStatus}
          />

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
