import React, { useMemo } from 'react';
import { Compass, Calendar } from 'lucide-react';
import { 
  formatTime, 
  getDaysInYear, 
  getDayOfYear 
} from '../../../utils/cosmicMath';
import { useAnnualLunarWorker } from '../../../hooks/useEphemerisWorker';
import { OrbitalData, AnnualLunarMatrixItem, LunarEvents } from '../../../types';
import { LunarShortcutsRail, LunarShortcutItem } from './LunarShortcutsRail';
import { LunarRibbonChart } from './LunarRibbonChart';

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
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
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
  onHoverDate,
  hoverTime,
  onHoverTime
}) => {
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents: Partial<LunarEvents> = safeOrbital.lunarEvents || {};

  const { 
    moonrise = 6, transit = 12, moonset = 18
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

  const transitHour = activeData.transit ?? transit ?? 12;
  const decDeg = (orbitalData?.lunarPos?.declination ?? lunarEvents.declination ?? 0) as number;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Date Badge & Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          365-day 24h moonrise/moonset braided ribbon, ephemeris transit &amp; declination matrix
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">{getDayLabel(activeDay)}</span>
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
        hoverTime={hoverTime}
        onHoverTime={onHoverTime}
      />

      {/* Lower Area: Clean 3-Box Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5 font-mono">
        {/* Box 1 (Moonrise / Moonset) */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center shadow-inner">
          <span className="text-[9px] text-slate-400 block uppercase font-bold">Moonrise / Moonset</span>
          <span className="text-slate-200 font-bold text-xs mt-0.5">
            {activeData.moonrise !== null && activeData.moonrise !== undefined ? formatTime(activeData.moonrise).substring(0, 5) : '--:--'} / {activeData.moonset !== null && activeData.moonset !== undefined ? formatTime(activeData.moonset).substring(0, 5) : '--:--'}
          </span>
        </div>

        {/* Box 2 (Lunar Transit) */}
        <div 
          onClick={() => transitHour && onSetTime && onSetTime(transitHour)}
          className="bg-indigo-950/80 hover:bg-indigo-900/90 transition-all cursor-pointer p-2.5 rounded-xl border border-indigo-500/50 flex flex-col items-center justify-center text-center text-indigo-300 shadow-sm"
          title="Click to jump clock to Lunar Transit"
        >
          <span className="text-[9px] font-bold text-indigo-400 uppercase flex items-center gap-0.5">
            <Compass className="w-2.5 h-2.5" /> Transit
          </span>
          <span className="text-xs font-mono font-bold text-indigo-200 mt-0.5">
            {formatTime(transitHour).substring(0, 5)} UTC
          </span>
        </div>

        {/* Box 3 (Declination) */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center shadow-inner">
          <span className="text-[9px] text-slate-400 block uppercase font-bold">Declination (δ)</span>
          <span className="text-indigo-300 font-bold text-xs mt-0.5">
            {decDeg >= 0 ? `+${decDeg.toFixed(1)}°` : `${decDeg.toFixed(1)}°`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LunarAlmanacCard;
