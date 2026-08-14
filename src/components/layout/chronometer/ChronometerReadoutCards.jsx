import React from 'react';
import { Globe, Compass, Clock } from 'lucide-react';
import { BufferedInput } from '../../controls/BufferedInput';
import { formatYMD, parseTimeString, formatTimeHHMM } from '../../../utils/cosmicMath';

export { parseTimeString, formatTimeHHMM };

export const ChronometerReadoutCards = ({
  latitude,
  longitude,
  timeOfDay,
  date,
  onLatChange,
  onLonChange,
  onTimeChange,
  onDateChange,
  onOpenPopup
}) => {
  const handleDirectLat = (val) => {
    const v = parseFloat(val);
    if (!isNaN(v) && onLatChange) {
      onLatChange(Math.max(-90, Math.min(90, v)));
    }
  };

  const handleDirectLon = (val) => {
    const v = parseFloat(val);
    if (!isNaN(v) && onLonChange) {
      onLonChange(Math.max(-180, Math.min(180, v)));
    }
  };

  const handleNowTime = () => {
    const now = new Date();
    const utcHours = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
    if (onTimeChange) onTimeChange(parseFloat(utcHours.toFixed(3)));
    if (onDateChange) onDateChange(now);
  };

  const handleDirectTime = (val) => {
    const parsed = parseTimeString(val);
    if (parsed !== undefined && onTimeChange) {
      onTimeChange(parseFloat(parsed.toFixed(3)));
    }
  };

  const handleDirectDate = (val) => {
    if (!val || !onDateChange) return;
    const [y, m, d] = val.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      onDateChange(new Date(y, m - 1, d));
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative">
      {/* 1. LATITUDE DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">LATITUDE</span>
          <button 
            onClick={() => onOpenPopup && onOpenPopup('lat')} 
            className="text-rose-400 hover:text-rose-300 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer"
            title="Open Globular Latitude Popup Selector"
          >
            <Globe className="w-3 h-3" /> Selector
          </button>
        </div>
        <BufferedInput
          type="number"
          min="-90"
          max="90"
          step="0.1"
          value={latitude}
          onChange={handleDirectLat}
          className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-xs font-mono font-black text-rose-400 text-center focus:border-rose-500 focus:outline-none"
        />
      </div>

      {/* 2. LONGITUDE DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">LONGITUDE</span>
          <button 
            onClick={() => onOpenPopup && onOpenPopup('lon')} 
            className="text-amber-400 hover:text-amber-300 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer"
            title="Open Polar 360° Longitude Popup Selector"
          >
            <Compass className="w-3 h-3" /> Selector
          </button>
        </div>
        <BufferedInput
          type="number"
          min="-180"
          max="180"
          step="0.1"
          value={longitude}
          onChange={handleDirectLon}
          className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-xs font-mono font-black text-amber-400 text-center focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* 3. TIME DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">TIME (UTC)</span>
          <button 
            onClick={handleNowTime}
            className="text-blue-400 hover:text-blue-200 text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 transition-colors cursor-pointer"
            title="Sync Engine to Current UTC Time & Date"
          >
            <Clock className="w-3 h-3" /> NOW
          </button>
        </div>
        <BufferedInput
          type="text"
          value={formatTimeHHMM(timeOfDay)}
          onChange={handleDirectTime}
          placeholder="14:15 or 1415"
          className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-xs font-mono font-black text-blue-400 text-center focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* 4. DATE DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-1">DATE</span>
        <BufferedInput
          type="date"
          value={formatYMD(date)}
          onChange={handleDirectDate}
          className="w-full bg-slate-950/80 border border-slate-700/60 rounded px-1 py-0.5 text-[10px] font-mono font-black text-emerald-400 text-center focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default ChronometerReadoutCards;
