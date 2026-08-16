import React from 'react';
import { Globe, Compass, Clock } from 'lucide-react';
import { BufferedInput } from '../../controls/BufferedInput';
import { formatYMD, parseTimeString, formatTimeHHMM } from '../../../utils/cosmicMath';

export { parseTimeString, formatTimeHHMM };

export interface ChronometerReadoutCardsProps {
  latitude: number;
  longitude: number;
  timeOfDay: number;
  date: Date;
  onLatChange?: (lat: number) => void;
  onLonChange?: (lon: number) => void;
  onTimeChange?: (time: number) => void;
  onDateChange?: (date: Date) => void;
  onOpenPopup?: (popup: 'lat' | 'lon') => void;
}

export const ChronometerReadoutCards: React.FC<ChronometerReadoutCardsProps> = ({
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
  const handleDirectLat = (val: string | number) => {
    const v = typeof val === 'number' ? val : parseFloat(val);
    if (!isNaN(v) && onLatChange) {
      onLatChange(Math.max(-90, Math.min(90, v)));
    }
  };

  const handleDirectLon = (val: string | number) => {
    const v = typeof val === 'number' ? val : parseFloat(val);
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

  const handleDirectTime = (val: string | number) => {
    const parsed = parseTimeString(String(val));
    if (parsed !== undefined && onTimeChange) {
      onTimeChange(parseFloat(parsed.toFixed(3)));
    }
  };

  const handleDirectDate = (val: string | number) => {
    if (!val || !onDateChange) return;
    const [y, m, d] = String(val).split('-').map(Number);
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
            className="text-rose-400 hover:text-rose-300 p-0.5 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Open Globular Selector"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-baseline w-full justify-center space-x-1">
          <BufferedInput
            type="number"
            value={latitude}
            onChange={handleDirectLat}
            className="w-16 bg-slate-900/90 text-rose-400 font-mono font-bold text-sm text-center rounded-lg border border-slate-700 px-1 py-0.5 focus:outline-none focus:border-rose-500 shadow-inner"
          />
          <span className="text-[10px] text-slate-400 font-mono">{latitude >= 0 ? '°N' : '°S'}</span>
        </div>
      </div>

      {/* 2. LONGITUDE DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">LONGITUDE</span>
          <button 
            onClick={() => onOpenPopup && onOpenPopup('lon')}
            className="text-amber-400 hover:text-amber-300 p-0.5 rounded hover:bg-amber-950/40 transition-colors cursor-pointer"
            title="Open Polar Longitude Selector"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-baseline w-full justify-center space-x-1">
          <BufferedInput
            type="number"
            value={longitude}
            onChange={handleDirectLon}
            className="w-16 bg-slate-900/90 text-amber-400 font-mono font-bold text-sm text-center rounded-lg border border-slate-700 px-1 py-0.5 focus:outline-none focus:border-amber-500 shadow-inner"
          />
          <span className="text-[10px] text-slate-400 font-mono">{longitude >= 0 ? '°E' : '°W'}</span>
        </div>
      </div>

      {/* 3. TIME OF DAY DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">TIME (UTC)</span>
          <button 
            onClick={handleNowTime} 
            className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded hover:bg-cyan-950/40 transition-colors cursor-pointer" 
            title="Snap to Real-Time UTC Now"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
        <BufferedInput
          type="text"
          value={formatTimeHHMM(timeOfDay)}
          onChange={handleDirectTime}
          className="w-20 bg-slate-900/90 text-blue-400 font-mono font-bold text-sm text-center rounded-lg border border-slate-700 px-1 py-0.5 focus:outline-none focus:border-blue-500 shadow-inner"
        />
      </div>

      {/* 4. CALENDAR DATE DIRECT INPUT CARD */}
      <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">DATE</span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold">
            DOY {Math.round((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
          </span>
        </div>
        <BufferedInput
          type="date"
          value={formatYMD(date)}
          onChange={handleDirectDate}
          className="w-full bg-slate-900/90 text-emerald-400 font-mono font-bold text-[11px] text-center rounded-lg border border-slate-700 px-1 py-0.5 focus:outline-none focus:border-emerald-500 shadow-inner"
        />
      </div>
    </div>
  );
};

export default ChronometerReadoutCards;
