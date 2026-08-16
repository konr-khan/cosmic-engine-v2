import React, { useState } from 'react';
import { Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { calculateDailySolarEvents, getDayOfYear } from '../../utils/cosmicMath';
import { SolarAlmanacData } from '../../types';
import {
  AstrolabeDial,
  ChronometerReadoutCards,
  SolsticeJumpControls,
  ChronometerModalPopovers
} from './chronometer';

export interface OrbitalChronometerProps {
  date: Date;
  onDateChange?: (date: Date) => void;
  timeOfDay: number;
  onTimeChange?: (time: number) => void;
  longitude: number;
  onLonChange?: (lon: number) => void;
  latitude: number;
  onLatChange?: (lat: number) => void;
  solarData?: SolarAlmanacData | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const THEME = {
  date: "#10b981",
  time: "#3b82f6",
  lon: "#f59e0b",
  lat: "#f43f5e"
};

export const OrbitalChronometer: React.FC<OrbitalChronometerProps> = ({
  date,
  onDateChange,
  timeOfDay,
  onTimeChange,
  longitude,
  onLonChange,
  latitude,
  onLatChange,
  solarData,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activePopup, setActivePopup] = useState<'lat' | 'lon' | null>(null);

  const dayOfYear = getDayOfYear(date);
  const declination = solarData ? solarData.declination : 0;
  const solarEvents = calculateDailySolarEvents(latitude, declination, solarData ? solarData.solarNoon : 12);

  let currentTwilightPhase = "Daylight";
  if (solarData) {
    const { sunrise, sunset, dayLength } = solarData;
    if (dayLength <= 0) currentTwilightPhase = "Polar Night";
    else if (dayLength >= 24) currentTwilightPhase = "Midnight Sun";
    else if (timeOfDay >= sunrise && timeOfDay <= sunset) currentTwilightPhase = "Full Daylight";
    else if (timeOfDay >= solarEvents.civil.morning && timeOfDay <= solarEvents.civil.evening) currentTwilightPhase = "Civil Twilight";
    else if (timeOfDay >= solarEvents.nautical.morning && timeOfDay <= solarEvents.nautical.evening) currentTwilightPhase = "Nautical Twilight";
    else if (timeOfDay >= solarEvents.astronomical.morning && timeOfDay <= solarEvents.astronomical.evening) currentTwilightPhase = "Astronomical Twilight";
    else currentTwilightPhase = "Night";
  }

  const formatDate = (d: number): string => {
    const tempDate = new Date(date.getFullYear(), 0, d);
    return tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatLat = (l: number): string => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'N') : 'S'}`;
  const formatLon = (l: number): string => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'E') : 'W'}`;
  const formatTimeStr = (t: number): string => {
    const h = Math.floor(t);
    const m = Math.floor((t - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}Z`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl transition-all duration-300 relative select-none w-full">
      {/* Top Centered Toggle Tab */}
      <button 
        onClick={onToggleCollapse} 
        className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-4 py-1 rounded-t-xl text-xs font-bold flex items-center gap-1.5 shadow-md z-50 cursor-pointer"
        title={isCollapsed ? "Expand Astrolabe Control Dock" : "Collapse Dock into minimal status bar"}
      >
        {isCollapsed ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
        <span>{isCollapsed ? "EXPAND ASTROLABE DOCK" : "COLLAPSE DOCK"}</span>
      </button>

      {isCollapsed ? (
        /* Collapsed Low-Profile Status Bar */
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 tracking-wider">ASTROLABE PRIMARY DOCK</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              {currentTwilightPhase}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <span>LAT: <strong style={{ color: THEME.lat }}>{formatLat(latitude)}</strong></span>
            <span>LON: <strong style={{ color: THEME.lon }}>{formatLon(longitude)}</strong></span>
            <span>TIME: <strong style={{ color: THEME.time }}>{formatTimeStr(timeOfDay)}</strong></span>
            <span>DATE: <strong style={{ color: THEME.date }}>{formatDate(dayOfYear)}</strong></span>
          </div>
        </div>
      ) : (
        /* Expanded 3-Section Horizontal Astrolabe Primary Control Dock */
        <div className="w-full max-w-[2800px] mx-auto px-4 md:px-8 2xl:px-10 py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Compact 4-Ring Astrolabe Dial */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <AstrolabeDial
              date={date}
              timeOfDay={timeOfDay}
              latitude={latitude}
              longitude={longitude}
              declination={declination}
              onDateChange={onDateChange}
              onTimeChange={onTimeChange}
              onLatChange={onLatChange}
              onLonChange={onLonChange}
            />
          </div>

          {/* Center Column: 4 Readout Dashboard Cards */}
          <div className="lg:col-span-5">
            <ChronometerReadoutCards
              latitude={latitude}
              longitude={longitude}
              timeOfDay={timeOfDay}
              date={date}
              onLatChange={onLatChange}
              onLonChange={onLonChange}
              onTimeChange={onTimeChange}
              onDateChange={onDateChange}
              onOpenPopup={(popup) => setActivePopup(activePopup === popup ? null : popup)}
            />
          </div>

          {/* Right Column: Twilight Phase & Solstice Fast-Jumps */}
          <div className="lg:col-span-3">
            <SolsticeJumpControls
              currentTwilightPhase={currentTwilightPhase}
              date={date}
              onDateChange={onDateChange}
            />
          </div>
        </div>
      )}

      {/* Modal Popovers for Latitude Slider & Polar Longitude Selector */}
      <ChronometerModalPopovers
        activePopup={activePopup}
        onClose={() => setActivePopup(null)}
        latitude={latitude}
        longitude={longitude}
        onLatChange={onLatChange}
        onLonChange={onLonChange}
      />
    </div>
  );
};

export default OrbitalChronometer;
