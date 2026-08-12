import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Settings, ChevronUp, ChevronDown, Compass, Calendar, Target, 
  MapPin, Globe, Clock, X, Sliders, ExternalLink 
} from 'lucide-react';
import { toDegrees, calculateDailySolarEvents, getSectorPath, getDaysInYear, formatYMD } from '../../utils/cosmicMath';
import { ControlRing } from '../controls/ControlRing';
import { ArmillaryRail } from '../controls/ArmillaryRail';
import { LivingMarble } from '../common/LivingMarble';
import { BufferedInput } from '../controls/BufferedInput';
import { LatitudeSlider } from '../controls/LatitudeSlider';
import { PolarLongitudeSelector } from '../controls/PolarLongitudeSelector';

const THEME = {
  bg: "#0f172a",
  ringBg: "#1e293b",
  date: "#10b981", // Outer: Emerald (Date)
  time: "#3b82f6", // 3rd: Blue (Time)
  lon: "#f59e0b",  // 2nd: Amber (Longitude)
  lat: "#f43f5e",  // Innermost: Rose (Latitude Armillary Rail)
  text: "#94a3b8"
};

const getAngle = (clientX, clientY, rect) => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = toDegrees(Math.atan2(dy, dx)) + 90; 
  if (angle < 0) angle += 360;
  return angle;
};

export const OrbitalChronometer = ({
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
  const svgRef = useRef(null);
  const [activeRing, setActiveRing] = useState(null);
  const [activePopup, setActivePopup] = useState(null); // 'lat' | 'lon' | null

  // References to track previous drag values for boundary crossing/rollover detection
  const prevTimeRef = useRef(timeOfDay);
  const prevDayRef = useRef(1);

  const totalDays = getDaysInYear(date.getFullYear());
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = solarData ? solarData.declination : 0;

  useEffect(() => {
    prevTimeRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    prevDayRef.current = dayOfYear;
  }, [dayOfYear]);

  const solarEvents = calculateDailySolarEvents(latitude, declination, solarData ? solarData.solarNoon : 12);

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - (rect.left + cx);
    const dy = e.clientY - (rect.top + cy);
    const domDist = Math.sqrt(dx * dx + dy * dy);

    // Convert DOM pixel distance to SVG viewBox radius coordinates (viewBox is -160 to +160, total 320)
    const scale = 320 / rect.width;
    const dist = domDist * scale;

    if (dist >= 122 && dist <= 155) {
      setActiveRing('date');
    } else if (dist >= 95 && dist < 122) {
      setActiveRing('time');
    } else if (dist >= 68 && dist < 95) {
      setActiveRing('lon');
    } else if (dist >= 42 && dist < 68) {
      setActiveRing('lat');
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!activeRing || !svgRef.current) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();

    if (activeRing === 'lat') {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const latAngleRad = Math.atan2(-dy, -dx);
      let latDeg = Math.round(toDegrees(latAngleRad));
      latDeg = Math.max(-90, Math.min(90, latDeg));
      if (onLatChange) onLatChange(latDeg);
      return;
    }

    const angle = getAngle(e.clientX, e.clientY, rect);

    if (activeRing === 'date') {
      const rawDay = (angle / 360) * totalDays;
      const roundedDay = Math.max(1, Math.min(totalDays, Math.round(rawDay)));
      const prevDay = prevDayRef.current;

      let targetYear = date.getFullYear();
      if (prevDay > 340 && roundedDay < 20) {
        targetYear += 1;
      } else if (prevDay < 20 && roundedDay > 340) {
        targetYear -= 1;
      }

      const newDate = new Date(targetYear, 0, roundedDay);
      onDateChange(newDate);
    } 
    else if (activeRing === 'lon') {
      let lon = angle;
      if (lon > 180) lon -= 360;
      onLonChange(Math.round(lon));
    } 
    else if (activeRing === 'time') {
      let newTime = (angle / 360) * 24; 
      if (newTime >= 24) newTime -= 24;

      const prevTime = prevTimeRef.current;

      if (prevTime > 20 && newTime < 4) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        onDateChange(nextDay);
      } else if (prevTime < 4 && newTime > 20) {
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        onDateChange(prevDay);
      }

      onTimeChange(parseFloat(newTime.toFixed(3)));
    }
  }, [activeRing, date, totalDays, onDateChange, onLonChange, onTimeChange, onLatChange]);

  const handlePointerUp = () => setActiveRing(null);

  useEffect(() => {
    if (activeRing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeRing, handlePointerMove]);

  const formatDate = (d) => {
    const tempDate = new Date(date.getFullYear(), 0, d);
    return tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatLat = (l) => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'N') : 'S'}`;
  const formatLon = (l) => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'E') : 'W'}`;
  const formatTimeStr = (t) => {
    const h = Math.floor(t);
    const m = Math.floor((t - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}Z`;
  };

  // Direct Input Parsers
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

  const parseTimeString = (val) => {
    if (val === undefined || val === null) return undefined;
    const str = String(val).trim();
    if (!str) return undefined;

    // 1. Format "HH:MM" or "H:MM" (e.g. "14:15", "9:30")
    if (str.includes(':')) {
      const parts = str.split(':').map(s => parseInt(s, 10));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const h = Math.max(0, Math.min(23, parts[0]));
        const m = Math.max(0, Math.min(59, parts[1]));
        return h + (m / 60);
      }
    }

    // 2. Format "xxxx" 4-digit military time (e.g. "1415", "0930", "0000", "2359")
    if (/^\d{4}$/.test(str)) {
      const h = parseInt(str.slice(0, 2), 10);
      const m = parseInt(str.slice(2, 4), 10);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return h + (m / 60);
      }
    }

    // 3. Format "xxx" 3-digit military time (e.g. "930" -> 09:30)
    if (/^\d{3}$/.test(str)) {
      const h = parseInt(str.slice(0, 1), 10);
      const m = parseInt(str.slice(1, 3), 10);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return h + (m / 60);
      }
    }

    // 4. Decimal float (e.g. "14.25", "9.5")
    const num = parseFloat(str);
    if (!isNaN(num)) {
      return Math.max(0, Math.min(23.999, num));
    }

    return undefined;
  };

  const formatTimeHHMM = (t) => {
    if (t === undefined || t === null || isNaN(t)) return "00:00";
    let norm = (t % 24 + 24) % 24;
    const h = Math.floor(norm);
    const m = Math.floor((norm - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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

  let currentTwilightPhase = "Daylight";
  if (solarData) {
    const { sunrise, sunset } = solarData;
    const dayLen = solarData.dayLength;
    if (dayLen <= 0) currentTwilightPhase = "Polar Night";
    else if (dayLen >= 24) currentTwilightPhase = "Midnight Sun";
    else if (timeOfDay >= sunrise && timeOfDay <= sunset) currentTwilightPhase = "Full Daylight";
    else if (timeOfDay >= (solarEvents.civil.morning) && timeOfDay <= (solarEvents.civil.evening)) currentTwilightPhase = "Civil Twilight";
    else if (timeOfDay >= (solarEvents.nautical.morning) && timeOfDay <= (solarEvents.nautical.evening)) currentTwilightPhase = "Nautical Twilight";
    else if (timeOfDay >= (solarEvents.astronomical.morning) && timeOfDay <= (solarEvents.astronomical.evening)) currentTwilightPhase = "Astronomical Twilight";
    else currentTwilightPhase = "Night";
  }

  const normalizedLon = (longitude + 360) % 360;

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
          
          {/* Left Column: Compact 4-Ring Astrolabe Dial (col-span-4) */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="relative w-[210px] h-[210px] shrink-0 touch-none cursor-crosshair flex items-center justify-center">
              <svg 
                ref={svgRef}
                width="100%" 
                height="100%" 
                viewBox="-160 -160 320 320"
                onPointerDown={handlePointerDown}
                className="drop-shadow-2xl overflow-visible"
              >
                {/* Outermost Ring (Layer 4): Date */}
                <ControlRing 
                  radius={136} 
                  width={22} 
                  value={dayOfYear} 
                  max={totalDays} 
                  color={THEME.date}
                  formatValue={(d) => formatDate(d)}
                />
                <g className="pointer-events-none opacity-40">
                  <text x="0" y="-120" textAnchor="middle" className="text-[7px] font-bold fill-slate-400 font-mono tracking-widest">JUN SOL</text>
                  <text x="0" y="126" textAnchor="middle" className="text-[7px] font-bold fill-slate-400 font-mono tracking-widest">DEC SOL</text>
                </g>

                {/* Third Ring (Layer 3): Time */}
                <ControlRing 
                  radius={108} 
                  width={20} 
                  value={timeOfDay} 
                  max={24}
                  rangeOffset={0} 
                  color={THEME.time}
                  formatValue={formatTimeStr}
                />
                <g className="pointer-events-none opacity-40">
                  <text x="0" y="-92" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-300 font-mono">0000Z</text>
                  <text x="0" y="98" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-300 font-mono">1200Z</text>
                </g>

                {/* Second Ring (Layer 2): Longitude */}
                <ControlRing 
                  radius={82} 
                  width={20} 
                  value={normalizedLon} 
                  max={360}
                  rangeOffset={0} 
                  color={THEME.lon}
                  formatValue={() => formatLon(longitude)}
                />
                <g className="pointer-events-none opacity-40">
                  <text x="0" y="-66" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">0°</text>
                  <text x="0" y="72" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">180°</text>
                  <text x="70" y="3" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">90°E</text>
                  <text x="-70" y="3" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">90°W</text>
                </g>

                {/* Innermost Ring (Layer 1): Armillary Meridian Rail (Latitude) */}
                <ArmillaryRail 
                  radius={54} 
                  width={16} 
                  latitude={latitude} 
                  color={THEME.lat} 
                />

                {/* Living Earth Center */}
                <LivingMarble 
                  declination={declination} 
                  timeOfDay={timeOfDay} 
                  longitude={longitude} 
                  radius={36}
                />
              </svg>
            </div>
          </div>

          {/* Center Column: 4 Readout Dashboard Cards with DIRECT TYPING (col-span-5) */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative">
            
            {/* 1. LATITUDE DIRECT INPUT CARD */}
            <div className="flex flex-col items-center bg-slate-800/90 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/80 shadow-sm transition-all group">
              <div className="flex justify-between items-center w-full mb-1">
                <span className="text-[9px] font-bold text-slate-400 tracking-wider">LATITUDE</span>
                <button 
                  onClick={() => setActivePopup(activePopup === 'lat' ? null : 'lat')} 
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-mono flex items-center gap-0.5"
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
                  onClick={() => setActivePopup(activePopup === 'lon' ? null : 'lon')} 
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-mono flex items-center gap-0.5"
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

          {/* Right Column: Twilight Phase & Solstice Fast-Jumps (col-span-3) */}
          <div className="lg:col-span-3 flex flex-col items-start justify-between h-full gap-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-indigo-400" /> Twilight Phase
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {currentTwilightPhase}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full text-xs">
              <button onClick={() => onDateChange(new Date(date.getFullYear(), 2, 20))} className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700">🌸 Mar Equinox</button>
              <button onClick={() => onDateChange(new Date(date.getFullYear(), 5, 21))} className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700">☀️ Jun Solstice</button>
              <button onClick={() => onDateChange(new Date(date.getFullYear(), 8, 22))} className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700">🍂 Sep Equinox</button>
              <button onClick={() => onDateChange(new Date(date.getFullYear(), 11, 21))} className="bg-slate-800 hover:bg-indigo-600 hover:text-white py-1.5 px-2 rounded-lg text-slate-300 font-bold text-[10px] transition-colors border border-slate-700">❄️ Dec Solstice</button>
            </div>
          </div>

        </div>
      )}

      {/* =======================================================
          POPOVER 1: GLOBULAR LATITUDE SELECTOR MODAL
         ======================================================= */}
      {activePopup === 'lat' && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setActivePopup(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl max-w-sm sm:max-w-md w-full relative space-y-3 max-h-[85vh] my-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-400" /> Globular Latitude Selector
              </h4>
              <button 
                onClick={() => setActivePopup(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800 flex justify-center">
              <LatitudeSlider latitude={latitude} onChange={onLatChange} />
            </div>

            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-slate-400">Selected Latitude:</span>
              <strong className="text-rose-400 font-bold text-sm">{formatLat(latitude)}</strong>
            </div>

            <button 
              onClick={() => setActivePopup(null)} 
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          POPOVER 2: POLAR 360° LONGITUDE SELECTOR MODAL
         ======================================================= */}
      {activePopup === 'lon' && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setActivePopup(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl max-w-sm sm:max-w-md w-full relative space-y-3 max-h-[85vh] my-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" /> Polar 360° Longitude Selector
              </h4>
              <button 
                onClick={() => setActivePopup(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800 flex justify-center">
              <PolarLongitudeSelector longitude={longitude} onChange={onLonChange} isDarkMode={true} />
            </div>

            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-slate-400">Selected Longitude:</span>
              <strong className="text-amber-400 font-bold text-sm">{formatLon(longitude)}</strong>
            </div>

            <button 
              onClick={() => setActivePopup(null)} 
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrbitalChronometer;

