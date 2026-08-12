import React, { useState } from 'react';
import { 
  Sun, Moon, Globe, Calendar, RotateCw, MapPin, Layers, Check, 
  Compass, Settings, ChevronUp, ChevronDown, Target, Activity, X, Sliders 
} from 'lucide-react';
import { CONFIG, formatTime, formatYMD } from '../../utils/cosmicMath';
import { BufferedInput } from './BufferedInput';
import { LatitudeSlider } from './LatitudeSlider';
import { PolarLongitudeSelector } from './PolarLongitudeSelector';

export const GlobalCommandBar = ({ 
  date, onDateChange, dayOfYear, onDayChange,
  time, onTimeChange, lat, onLatChange, lon, onLonChange,
  showOptions, toggleOptions, widgets, toggleWidget,
  useAnalemma, toggleAnalemma
}) => {
  const [showVisualControls, setShowVisualControls] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Date Input Handler
  const handleDateInput = (val) => {
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    onDateChange(new Date(y, m - 1, d));
  };

  // 'Now' Button Handler
  const handleNow = () => {
    const now = new Date();
    onDateChange(now);
    onTimeChange(now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600);
  };

  // Safe Input Parsers
  const safeFloat = (val, min, max) => {
    let v = parseFloat(val);
    if (isNaN(v)) return undefined;
    if (v > max) v = max;
    if (v < min) v = min;
    return v;
  };

  return (
    <div className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 select-none">
      <div className="w-full max-w-[2800px] mx-auto px-4 md:px-8 2xl:px-10 py-3">
        
        {/* =======================
            MOBILE STATUS BAR
           ======================= */}
        <div className="md:hidden flex flex-col gap-3">
           <div className="flex justify-between items-center h-10">
             <div className="flex items-center gap-2">
                <div className="bg-indigo-500 p-1.5 rounded text-white"><Globe className="w-4 h-4" /></div>
                <div className="flex flex-col leading-none">
                   <span className="text-xs font-bold text-slate-300">{formatTime(time)} UTC</span>
                   <span className="text-[10px] text-slate-500 font-mono">
                     {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} | {Math.abs(lat).toFixed(1)}°{lat >= 0 ? 'N' : 'S'}
                   </span>
                </div>
             </div>
             <button 
               onClick={() => setIsDrawerOpen(true)}
               className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
             >
               <Settings className="w-3 h-3 text-indigo-400" /> TUNE
             </button>
           </div>

           {/* Persistent Mobile Scrubbers */}
           <div className="flex flex-col gap-2 pb-1">
              {/* Time Scrubber */}
              <div className="flex items-center gap-3">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <input 
                    type="range" 
                    min="0" max="24" step="0.016" 
                    value={time} 
                    onChange={(e) => onTimeChange(parseFloat(e.target.value))} 
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                  />
              </div>
              {/* Date Scrubber */}
              <div className="flex items-center gap-3">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <input 
                    type="range" 
                    min="1" max="365" step="1" 
                    value={dayOfYear} 
                    onChange={(e) => onDayChange(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                  />
              </div>
           </div>
        </div>

        {/* =======================
            MOBILE DRAWER OVERLAY
           ======================= */}
        {isDrawerOpen && (
           <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="flex flex-col h-full overflow-y-auto">
                 {/* Drawer Header */}
                 <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-400" /> Configuration
                    </h2>
                    <button 
                      onClick={() => setIsDrawerOpen(false)} 
                      className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 {/* Drawer Content */}
                 <div className="p-6 space-y-8 pb-20">
                    {/* Time Section */}
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Time of Day (UTC)</label>
                       <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                          <div className="flex justify-between items-end mb-4">
                             <span className="text-2xl font-mono text-indigo-400">{formatTime(time)}</span>
                             <button onClick={handleNow} className="text-[10px] font-bold bg-indigo-600 px-2.5 py-1 rounded text-white hover:bg-indigo-500 transition-colors">SET TO NOW</button>
                          </div>
                          <input type="range" min="0" max="24" step="0.016" value={time} onChange={(e) => onTimeChange(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                       </div>
                    </div>

                    {/* Date Section */}
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date Selection</label>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-center">
                              <Calendar className="w-5 h-5 text-slate-400 ml-2 mr-3" />
                              <BufferedInput type="date" value={formatYMD(date)} onChange={handleDateInput} className="bg-transparent border-none text-white w-full focus:ring-0 font-mono" />
                          </div>
                          {CONFIG.DATES.map((d) => (
                             <button key={d.label} onClick={() => onDayChange(d.day)} className="bg-slate-800 border border-slate-700 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                                {d.short}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Location Coordinates</label>
                       <div className="flex gap-4">
                          <div className="flex-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
                             <div className="text-[10px] text-slate-500 font-bold mb-1">LATITUDE</div>
                             <BufferedInput type="number" min="-90" max="90" step="0.1" value={lat} onChange={(val) => { const v = safeFloat(val, -90, 90); if (v !== undefined) onLatChange(v); }} className="bg-transparent border-none text-xl text-white w-full focus:ring-0 font-mono p-0" />
                          </div>
                          <div className="flex-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
                             <div className="text-[10px] text-slate-500 font-bold mb-1">LONGITUDE</div>
                             <BufferedInput type="number" min="-180" max="180" step="0.1" value={lon} onChange={(val) => { const v = safeFloat(val, -180, 180); if (v !== undefined) onLonChange(v); }} className="bg-transparent border-none text-xl text-white w-full focus:ring-0 font-mono p-0" />
                          </div>
                       </div>
                       
                       <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-6">
                          <div className="flex flex-col items-center">
                             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Settings className="w-3 h-3 text-indigo-400" /> Latitude Visual</div>
                             <LatitudeSlider latitude={lat} onChange={onLatChange} />
                          </div>
                          <div className="h-px bg-slate-700 w-full" />
                          <div className="flex flex-col items-center">
                             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Compass className="w-3 h-3 text-indigo-400" /> Longitude Visual</div>
                             <PolarLongitudeSelector longitude={lon} onChange={onLonChange} />
                          </div>
                       </div>
                    </div>
                    
                    {/* Toggles */}
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Module Visibility</label>
                       {[{ key: 'daylight', label: 'Daylight & Sun', icon: Sun }, { key: 'lunarAlmanac', label: 'Lunar & Tidal Almanac', icon: Moon }, { key: 'celestialSphere', label: 'Celestial Sphere', icon: Compass }, { key: 'tides', label: 'Tides & Orbit', icon: RotateCw }, { key: 'map', label: 'Terminator Map', icon: MapPin }].map(opt => (
                        <button key={opt.key} onClick={() => toggleWidget(opt.key)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors border ${widgets[opt.key] ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          <div className="flex items-center gap-2"><opt.icon className="w-4 h-4" /> {opt.label}</div>{widgets[opt.key] && <Check className="w-4 h-4" />}
                        </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* =======================
            DESKTOP BAR (> md)
           ======================= */}
        <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* BRAND */}
            <div className="flex items-center gap-2 mr-4 shrink-0">
              <div className="bg-indigo-500 p-1.5 rounded text-white"><Globe className="w-5 h-5" /></div>
              <span className="font-bold tracking-tight text-lg hidden md:block">Cosmic Engine</span>
            </div>

            {/* CONTROLS */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
              {/* Date & Quick Nav */}
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 h-9 flex-1">
                    <Calendar className="w-4 h-4 text-slate-400 ml-1" />
                    <BufferedInput 
                        type="date" 
                        value={formatYMD(date)} 
                        onChange={handleDateInput} 
                        className="bg-transparent border-none text-sm text-white focus:ring-0 font-mono w-full" 
                    />
                  </div>
                  <button onClick={handleNow} className="h-9 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"><Target className="w-3 h-3" /> NOW</button>
                </div>
                <input type="range" min="1" max="365" step="1" value={dayOfYear} onChange={(e) => onDayChange(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                <div className="flex justify-between mt-1 px-1">
                  {CONFIG.DATES.map((d) => (
                    <button key={d.label} onClick={() => onDayChange(d.day)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${Math.abs(dayOfYear - d.day) <= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                      title={d.label}
                    >{d.short}</button>
                  ))}
                </div>
              </div>

              {/* Time Slider */}
              <div className="flex flex-col justify-center bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 h-11 md:h-full relative group">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5"><span>TIME (UTC)</span><span className="text-indigo-400 font-mono">{formatTime(time)}</span></div>
                  <input type="range" min="0" max="24" step="0.016" value={time} onChange={(e) => onTimeChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>

              {/* Coordinates Inputs */}
              <div className="flex gap-2 h-11 md:h-full">
                  <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-lg border border-slate-700 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold ml-1">LAT</span>
                      <BufferedInput 
                        type="number" 
                        min="-90" max="90" step="0.1" 
                        value={lat} 
                        onChange={(val) => { const v = safeFloat(val, -90, 90); if (v !== undefined) onLatChange(v); }} 
                        className="bg-transparent border-none text-sm text-white w-full focus:ring-0 font-mono text-right p-0" 
                      />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-lg border border-slate-700 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold ml-1">LON</span>
                      <BufferedInput 
                        type="number" 
                        min="-180" max="180" step="0.1" 
                        value={lon} 
                        onChange={(val) => { const v = safeFloat(val, -180, 180); if (v !== undefined) onLonChange(v); }} 
                        className="bg-transparent border-none text-sm text-white w-full focus:ring-0 font-mono text-right p-0" 
                      />
                  </div>
              </div>
            </div>

            {/* View Option Toggle buttons */}
            <div className="flex items-center gap-2 shrink-0">
               <button onClick={() => setShowVisualControls(!showVisualControls)} className={`p-2 rounded-lg transition-colors border border-slate-700 ${showVisualControls ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                 {showVisualControls ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
               </button>
               <div className="relative">
                <button onClick={toggleOptions} className={`p-2 rounded-lg transition-colors ${showOptions ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><Layers className="w-5 h-5" /></button>
                {showOptions && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800">
                      <div className="text-xs font-bold text-slate-400 px-2 py-2 uppercase tracking-wider">Simulation Options</div>
                      {[
                        { key: 'daylight', label: 'Daylight & Sun', icon: Sun }, 
                        { key: 'lunarAlmanac', label: 'Lunar & Tidal Almanac', icon: Moon }, 
                        { key: 'eclipse', label: 'Eclipse Mechanics', icon: Sparkles },
                        { key: 'celestialSphere', label: 'Celestial Sphere', icon: Compass }, 
                        { key: 'tides', label: 'Tides & Orbit', icon: RotateCw }, 
                        { key: 'map', label: 'Terminator Map', icon: MapPin }
                      ].map(opt => (
                        <button key={opt.key} onClick={() => toggleWidget(opt.key)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${widgets[opt.key] ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                          <div className="flex items-center gap-2"><opt.icon className="w-4 h-4" /> {opt.label}</div>{widgets[opt.key] ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-slate-300" />}
                        </button>
                      ))}
                      <div className="h-px bg-slate-100 my-2" />
                      <button onClick={toggleAnalemma} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${useAnalemma ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Analemma Logic</div>{useAnalemma ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-slate-300" />}
                      </button>
                    </div>
                )}
               </div>
            </div>
        </div>

        {/* Visual Controls (Desktop Only) */}
        {showVisualControls && (
          <div className="hidden md:grid mt-4 pt-4 border-t border-slate-700 grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
             <div className="flex flex-col items-center">
               <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-400" /> Latitude Selector</div>
               <LatitudeSlider latitude={lat} onChange={onLatChange} />
             </div>
             <div className="flex flex-col items-center">
               <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Compass className="w-4 h-4 text-indigo-400" /> Longitude Selector</div>
               <PolarLongitudeSelector longitude={lon} onChange={onLonChange} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalCommandBar;
