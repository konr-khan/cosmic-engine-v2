import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ECLIPSE_PRESETS, formatYMD } from '../../../utils/cosmicMath';

export const EclipseScanner = ({
  currentDate = new Date(),
  upcomingEclipses = [],
  onSelectPreset
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between overflow-y-auto space-y-3 p-1">
      <div>
        <div className="text-xs font-mono font-bold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Historic & Future Famous Eclipses:</span>
          <span className="text-indigo-400 text-[10px]">Click to Scrub Engine Date</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ECLIPSE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset && onSelectPreset(preset.date)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 p-2.5 rounded-xl text-left transition-all group flex items-start justify-between"
            >
              <div>
                <div className="text-xs font-bold font-mono text-indigo-300 group-hover:text-amber-400">
                  {preset.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {preset.description}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Nearest Discovered Eclipses Scanner */}
      <div className="border-t border-slate-800 pt-2">
        <div className="text-xs font-mono font-bold text-emerald-400 mb-1.5">
          Discovered Eclipses from Current Date ({formatYMD(currentDate)}):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {upcomingEclipses.length > 0 ? (
            upcomingEclipses.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset && onSelectPreset(item.date)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500 p-2 rounded-xl text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-slate-200">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {item.label}
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                  +{item.dayOffset} days
                </span>
              </button>
            ))
          ) : (
            <div className="text-xs text-slate-500 font-mono">No eclipses within 365 days.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EclipseScanner;
