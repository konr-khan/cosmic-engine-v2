import React from 'react';
import { Moon } from 'lucide-react';
import { AnnualLunarMatrixItem } from '../../../../types';

export interface LunarRibbonHudProps {
  viewMode: 'synodic' | 'annual';
  onViewModeChange?: (mode: 'synodic' | 'annual') => void;
  timeMode: 'utc' | 'local';
  onTimeModeChange?: (mode: 'utc' | 'local') => void;
  isSynodic: boolean;
  hoverData: AnnualLunarMatrixItem | null;
  displayData: AnnualLunarMatrixItem;
  getDayLabel: (dayNum: number) => string;
  displayPhaseName: string;
  displayPhasePct: number;
  isCircumpolarUp: boolean;
  isCircumpolarDown: boolean;
  displayRiseStr: string;
  displaySetStr: string;
  displayTransitT: number | null;
  displayTransitStr: string;
}

export const LunarRibbonHud: React.FC<LunarRibbonHudProps> = ({
  viewMode,
  onViewModeChange,
  timeMode,
  onTimeModeChange,
  isSynodic,
  hoverData,
  displayData,
  getDayLabel,
  displayPhaseName,
  displayPhasePct,
  isCircumpolarUp,
  isCircumpolarDown,
  displayRiseStr,
  displaySetStr,
  displayTransitT,
  displayTransitStr
}) => {
  return (
    <>
      <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Segmented View Mode Toggle: 30-Day Synodic vs 365-Day Ribbon */}
          {onViewModeChange && (
            <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => onViewModeChange('synodic')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'synodic'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="30-Day Centered Synodic Month View (±15 days)"
              >
                🌓 30-Day Synodic
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('annual')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'annual'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="365-Day Annual Braided Ribbon"
              >
                🌐 365-Day Ribbon
              </button>
            </div>
          )}

          <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans hidden sm:flex">
            <Moon className="w-3 h-3 text-slate-300" /> 
            {isSynodic ? '30-Day Synodic Month Ribbon' : '365-Day Moonrise & Moonset Ribbon'}
          </span>
        </div>
        
        {/* Segmented Timeframe Mode Toggle */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => onTimeModeChange && onTimeModeChange('utc')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'utc'
                ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Coordinated Universal Time (0000Z to 2400Z)"
          >
            🌐 UTC (Zulu)
          </button>
          <button
            type="button"
            onClick={() => onTimeModeChange && onTimeModeChange('local')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              timeMode === 'local'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Local Mean Time relative to Observer Meridian"
          >
            🌙 Local (LMT)
          </button>
        </div>
      </div>

      {/* Live Moonrise & Moonset Readout Strip (Instantaneous on Mouseover) */}
      <div 
        data-testid="lunar-readout-bar"
        className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono mb-2 transition-all ${
          hoverData 
            ? 'bg-sky-950/50 border-sky-500/50 shadow-md' 
            : 'bg-slate-900/60 border-slate-800/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-bold flex items-center gap-1.5 ${hoverData ? 'text-sky-300' : 'text-slate-200'}`}>
            <span className={`w-2 h-2 rounded-full ${hoverData ? 'bg-sky-400 animate-pulse' : 'bg-rose-500'}`} />
            {hoverData ? `Inspect: ${getDayLabel(displayData.day)}` : `Selected: ${getDayLabel(displayData.day)}`}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-300 font-semibold">
            {displayPhaseName} ({displayPhasePct}%)
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isCircumpolarUp ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Circumpolar: <span className="underline decoration-emerald-500/50">Up All Day (24h Moonlight)</span>
            </span>
          ) : isCircumpolarDown ? (
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" /> Moon Down All Day (Sub-Horizon)
            </span>
          ) : (
            <>
              <span className="text-slate-300">
                Moonrise: <span className="font-bold text-sky-400">{displayRiseStr}</span>
              </span>
              <span className="text-slate-300">
                Moonset: <span className="font-bold text-indigo-400">{displaySetStr}</span>
              </span>
            </>
          )}
          {displayTransitT !== null && (
            <span className="text-slate-400 hidden sm:inline">
              Transit: <span className="font-semibold text-slate-200">{displayTransitStr}</span>
            </span>
          )}
          <span className="text-slate-400 hidden md:inline">
            Dist: <span className="font-semibold text-slate-200">{Math.round(displayData.distanceKm).toLocaleString()} km</span>
            {displayData.isPerigee && <span className="text-emerald-400 font-bold ml-1">· Supermoon</span>}
            {displayData.isApogee && <span className="text-rose-400 font-bold ml-1">· Apogee</span>}
          </span>
        </div>
      </div>
    </>
  );
};
