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
      const year = date ? date.getFullYear() : new Date().getFullYear();
      onDateChange(new Date(year, month, day));
    }
  };

  return (
    <div className="flex flex-col items-start justify-between h-full gap-2 w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Settings className="w-3.5 h-3.5 text-indigo-400" /> Twilight Phase
        </span>
        <span className="text-xs font-mono text-amber-400 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
          {currentTwilightPhase}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 w-full text-xs">
        <button 
          onClick={() => handleJump(2, 20)} 
          className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700 cursor-pointer"
        >
          🌸 Mar Equinox
        </button>
        <button 
          onClick={() => handleJump(5, 21)} 
          className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700 cursor-pointer"
        >
          ☀️ Jun Solstice
        </button>
        <button 
          onClick={() => handleJump(8, 22)} 
          className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700 cursor-pointer"
        >
          🍂 Sep Equinox
        </button>
        <button 
          onClick={() => handleJump(11, 21)} 
          className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700 cursor-pointer"
        >
          ❄️ Dec Solstice
        </button>
      </div>
    </div>
  );
};

export default SolsticeJumpControls;
