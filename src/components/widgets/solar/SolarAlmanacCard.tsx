import React, { useState, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { getDaysInYear } from '../../../utils/cosmicMath';
import { useAnnualSolarWorker } from '../../../hooks/useEphemerisWorker';
import { AnnualSolarMatrixItem, SolarAlmanacData } from '../../../types';
import { SolarShortcutsRail, SolarShortcut } from './SolarShortcutsRail';
import { SolarRibbonChart } from './SolarRibbonChart';
import { PolarSunlightDial } from './PolarSunlightDial';

export interface SolarAlmanacProps {
  latitude?: number;
  longitude?: number;
  currentDay?: number;
  onDayChange?: (day: number) => void;
  year?: number;
  solarData?: SolarAlmanacData | null;
  currentTime?: number;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
}

export const SolarAlmanacCard: React.FC<SolarAlmanacProps> = ({ 
  latitude = 47.06, 
  longitude = -122.81, 
  currentDay = 1, 
  onDayChange, 
  year = 2026, 
  solarData,
  currentTime = 12,
  hoverTime, 
  onHoverTime 
}) => {
  const [timeMode, setTimeMode] = useState<'solar' | 'utc'>('solar');

  const lonOffsetHours = longitude / 15;
  const eotOffsetHours = (solarData?.equationOfTime ?? 0) / 60;

  const totalDays = getDaysInYear(year);
  const activeDay = Math.min(totalDays, currentDay);

  // Compute totalDays of solar twilight thresholds for the current latitude (offloaded to Web Worker)
  const almanacData: AnnualSolarMatrixItem[] = useAnnualSolarWorker({ year, latitude }) || [];

  const keyStats = useMemo(() => {
    let earliestSunrise = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let latestSunset = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let longestDay = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };
    let shortestDay = almanacData[0] || { day: 1, sunrise: 6, sunset: 18, dayLength: 12 };

    almanacData.forEach(d => {
      if (d.sunrise < earliestSunrise.sunrise) earliestSunrise = d;
      if (d.sunset > latestSunset.sunset) latestSunset = d;
      if (d.dayLength > longestDay.dayLength) longestDay = d;
      if (d.dayLength < shortestDay.dayLength) shortestDay = d;
    });

    return { earliestSunrise, latestSunset, longestDay, shortestDay };
  }, [almanacData]);

  const getDayLabel = (dayNum: number): string => {
    const d = new Date(year, 0, dayNum);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeData = almanacData[activeDay - 1] || almanacData[0] || { sunrise: 6, sunset: 18, dayLength: 12, solarNoon: 12 };

  // Compute equivalent daylight mirror day across Solstice
  const mirrorDayData = useMemo<AnnualSolarMatrixItem | null>(() => {
    if (!almanacData.length) return null;
    const targetLength = activeData.dayLength;
    
    let bestDay: AnnualSolarMatrixItem | null = null;
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
  const shortcuts: SolarShortcut[] = useMemo(() => [
    { label: "🌸 Mar Eq", day: 79, title: "Spring Equinox (Mar 20)" },
    { label: "☀️ Jun Sol", day: 172, title: "Summer Solstice (Jun 21)" },
    { label: "🍂 Sep Eq", day: 266, title: "Autumn Equinox (Sep 22)" },
    { label: "❄️ Dec Sol", day: 355, title: "Winter Solstice (Dec 21)" },
    { label: "🌅 Earliest Sunrise", day: keyStats.earliestSunrise.day, title: `Earliest Sunrise (${getDayLabel(keyStats.earliestSunrise.day)})` },
    { label: "🌇 Latest Sunset", day: keyStats.latestSunset.day, title: `Latest Sunset (${getDayLabel(keyStats.latestSunset.day)})` }
  ], [keyStats, year]);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Date Badge & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          24-hour annual sun path showing daylight, twilights &amp; instantaneous 24h polar sector
        </p>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{getDayLabel(activeDay)}</span>
          <span className="text-slate-600">|</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-amber-400">{(activeData.dayLength).toFixed(1)}h <span className="text-slate-400 text-[10px] font-normal font-sans">Daylight</span></span>
        </div>
      </div>

      {/* Solstice & Equinox Fast-Jump Shortcut Bar */}
      <SolarShortcutsRail 
        shortcuts={shortcuts}
        activeDay={activeDay}
        onDayChange={onDayChange}
      />

      {/* Main Dual-View Container: 365-Day Ribbon Chart + 24h Polar Sector Clock */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 items-center min-h-[340px]">
        {/* Left Side (8 cols on XL): Main 365-Day SVG Chart */}
        <SolarRibbonChart
          almanacData={almanacData}
          totalDays={totalDays}
          activeDay={activeDay}
          activeData={activeData}
          mirrorDayData={mirrorDayData}
          keyStats={keyStats}
          hoverTime={hoverTime}
          onHoverTime={onHoverTime}
          onDayChange={onDayChange}
          lonOffsetHours={lonOffsetHours}
          eotOffsetHours={eotOffsetHours}
          getDayLabel={getDayLabel}
        />

        {/* Right Side (4 cols on XL): 24-Hour Polar Clock Dial */}
        <PolarSunlightDial
          solarData={solarData}
          activeData={activeData}
          currentTime={currentTime}
          hoverTime={hoverTime}
          onHoverTime={onHoverTime}
          timeMode={timeMode}
          setTimeMode={setTimeMode}
          lonOffsetHours={lonOffsetHours}
          eotOffsetHours={eotOffsetHours}
        />
      </div>

      {/* Bottom Legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2.5 border-t border-slate-800/60 text-[10px] font-medium font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-300" />
          <span className="text-slate-300 font-semibold">Daylight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500/80" />
          <span className="text-slate-400">Civil (-6°)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-500" />
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

export default SolarAlmanacCard;
