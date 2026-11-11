import React from 'react';
import { Settings } from 'lucide-react';

export interface SolsticeJumpControlsProps {
  currentTwilightPhase?: string;
  date?: Date;
  onDateChange?: (date: Date) => void;
}

export const SolsticeJumpControls: React.FC<SolsticeJumpControlsProps> = ({
  currentTwilightPhase = "Daylight",
  date,
  onDateChange
}) => {
  const handleJump = (month: number, day: number) => {
    if (onDateChange) {
      const year = date ? date.getUTCFullYear() : new Date().getUTCFullYear();
      onDateChange(new Date(Date.UTC(year, month, day)));
    }
  };

  const getPhaseBadgeStyle = (phase: string) => {
    if (phase.includes("Daylight") || phase.includes("Midnight Sun")) {
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    }
    if (phase.includes("Twilight")) {
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="flex flex-col items-start justify-between h-full gap-2 w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-indigo-400" /> Twilight Phase
        </span>
        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${getPhaseBadgeStyle(currentTwilightPhase)}`}>
          {currentTwilightPhase}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 w-full text-xs">
        <button 
          onClick={() => handleJump(2, 20)} 
          className="bg-slate-900/60 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-all border border-slate-800 hover:border-indigo-500 cursor-pointer shadow-sm"
        >
          🌸 Mar Equinox
        </button>
        <button 
          onClick={() => handleJump(5, 21)} 
          className="bg-slate-900/60 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-all border border-slate-800 hover:border-indigo-500 cursor-pointer shadow-sm"
        >
          ☀️ Jun Solstice
        </button>
        <button 
          onClick={() => handleJump(8, 22)} 
          className="bg-slate-900/60 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-all border border-slate-800 hover:border-indigo-500 cursor-pointer shadow-sm"
        >
          🍂 Sep Equinox
        </button>
        <button 
          onClick={() => handleJump(11, 21)} 
          className="bg-slate-900/60 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-all border border-slate-800 hover:border-indigo-500 cursor-pointer shadow-sm"
        >
          ❄️ Dec Solstice
        </button>
      </div>
    </div>
  );
};

export default SolsticeJumpControls;
