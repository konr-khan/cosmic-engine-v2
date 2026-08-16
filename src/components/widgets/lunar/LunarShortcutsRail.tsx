import React from 'react';
import { Target } from 'lucide-react';

export interface LunarShortcutItem {
  label: string;
  day: number;
  title: string;
}

export interface LunarShortcutsRailProps {
  shortcuts: LunarShortcutItem[];
  activeDay: number;
  onDayChange?: (day: number) => void;
}

export const LunarShortcutsRail: React.FC<LunarShortcutsRailProps> = ({
  shortcuts,
  activeDay,
  onDayChange
}) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap my-2 pb-1 border-b border-slate-800 text-xs">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 flex items-center gap-1">
        <Target className="w-3 h-3 text-cyan-400" /> Fast-Jump:
      </span>
      {shortcuts.map((s) => {
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
  );
};
