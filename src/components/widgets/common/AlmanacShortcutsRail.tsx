import React from 'react';
import { Target } from 'lucide-react';

export interface AlmanacShortcut {
  label: string;
  day: number;
  title: string;
}

export interface AlmanacShortcutsRailProps {
  shortcuts: AlmanacShortcut[];
  activeDay: number;
  onDayChange?: (day: number) => void;
  title?: string;
}

export const AlmanacShortcutsRail: React.FC<AlmanacShortcutsRailProps> = ({
  shortcuts,
  activeDay,
  onDayChange,
  title = 'Fast-Jump:'
}) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1.5 border-b border-slate-800/60 text-xs">
      <span className="text-[10px] font-medium uppercase font-sans text-slate-400 tracking-wider mr-1 flex items-center gap-1">
        <Target className="w-3 h-3 text-indigo-400" /> {title}
      </span>
      {shortcuts.map((s) => {
        const isActive = Math.abs(activeDay - s.day) <= 1;
        return (
          <button
            key={s.label}
            onClick={() => onDayChange && onDayChange(s.day)}
            title={s.title}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium font-mono transition-all flex items-center gap-1 cursor-pointer border ${
              isActive 
                ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm' 
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border-slate-800/40 hover:border-slate-700'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

export default AlmanacShortcutsRail;
