import React, { useState, useEffect } from 'react';
import { Sun, Moon, RotateCw, Sliders, MapPin, Globe, Compass, Lock, Unlock, RefreshCcw, LayoutTemplate, Sparkles, Check, Layers } from 'lucide-react';
import { useCosmicEngine } from './hooks/useCosmicEngine';
import { useChronometerStore, cosmicActions } from './store/cosmicStore';
import { TerminatorMap } from './components/widgets/TerminatorMap';
import { SunClock } from './components/widgets/SunClock';
import { SolarAlmanac } from './components/widgets/SolarAlmanac';
import { MacroOrbitView } from './components/widgets/MacroOrbitView';
import { MicroTideView } from './components/widgets/MicroTideView';
import { OrbitalChronometer } from './components/layout/OrbitalChronometer';
import { LunarAlmanacCard } from './components/widgets/LunarAlmanacCard';
import { CelestialSphereView } from './components/widgets/CelestialSphereView';
import { EclipseDemonstrator } from './components/widgets/EclipseDemonstrator';
import { DashboardWindow } from './components/layout/DashboardWindow';
import { getDayOfYear } from './utils/cosmicMath';

const ICON_MAP = {
  almanac: Sun,
  lunarAlmanac: Moon,
  eclipse: Sparkles,
  celestialSphere: Compass,
  sunclock: Sun,
  map: MapPin,
  macroOrbit: Globe,
  microTides: RotateCw
};

const PRESET_LAYOUTS = {
  master: {
    id: 'master',
    name: 'Master Observatory',
    desc: 'Complete 8-module astronomical dashboard',
    icon: LayoutTemplate,
    widgets: { almanac: true, lunarAlmanac: true, eclipse: true, celestialSphere: true, sunclock: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'almanac', title: 'Solar Almanac & Twilight Bands', colSpan: 12, height: '480px' },
      { id: 'lunarAlmanac', title: 'Lunar & Tidal Almanac (365-Day Matrix & Wave)', colSpan: 12, height: '520px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '460px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic Orbital View', colSpan: 6, height: '420px' },
      { id: 'sunclock', title: 'Daily Sun Elevation & Twilights', colSpan: 6, height: '420px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 6, height: '360px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '360px' }
    ]
  },
  solar: {
    id: 'solar',
    name: 'Solar Observation Suite',
    desc: 'Solar Almanac paired with Sun Elevation & Terminator Map',
    icon: Sun,
    widgets: { almanac: true, sunclock: true, map: true, celestialSphere: true, lunarAlmanac: false, eclipse: false, macroOrbit: false, microTides: false },
    windows: [
      { id: 'almanac', title: 'Solar Almanac & Twilight Bands', colSpan: 6, height: '450px' },
      { id: 'sunclock', title: 'Daily Sun Elevation & Twilights', colSpan: 6, height: '450px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 12, height: '420px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic Orbital View', colSpan: 12, height: '420px' }
    ]
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar & Tidal Suite',
    desc: 'Lunar Almanac paired with Micro Tides & Macro Orbit',
    icon: Moon,
    widgets: { lunarAlmanac: true, microTides: true, macroOrbit: true, almanac: false, sunclock: false, map: false, celestialSphere: false, eclipse: false },
    windows: [
      { id: 'lunarAlmanac', title: 'Lunar & Tidal Almanac (365-Day Matrix & Wave)', colSpan: 12, height: '520px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System & Lunar Orbit', colSpan: 6, height: '420px' }
    ]
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse Mechanics Suite',
    desc: 'Eclipse Optics paired with Celestial Nodes & Lunar Corridor',
    icon: Sparkles,
    widgets: { eclipse: true, celestialSphere: true, lunarAlmanac: true, almanac: false, sunclock: false, map: false, macroOrbit: false, microTides: false },
    windows: [
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '480px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Node Corridor Alignment', colSpan: 6, height: '440px' },
      { id: 'lunarAlmanac', title: 'Lunar Phase & Node Corridor', colSpan: 6, height: '440px' }
    ]
  },
  ultrawide: {
    id: 'ultrawide',
    name: 'Ultrawide 21:9 Observatory',
    desc: 'Panoramic multi-column layout optimized for 21:9 & 32:9 monitors',
    icon: Globe,
    widgets: { almanac: true, lunarAlmanac: true, eclipse: true, celestialSphere: true, sunclock: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'almanac', title: 'Solar Almanac & Twilight Bands', colSpan: 6, height: '480px' },
      { id: 'lunarAlmanac', title: 'Lunar & Tidal Almanac (365-Day Matrix)', colSpan: 6, height: '480px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 6, height: '460px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '460px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic View', colSpan: 3, height: '400px' },
      { id: 'sunclock', title: 'Daily Sun Elevation & Twilights', colSpan: 3, height: '400px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 3, height: '400px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 3, height: '400px' }
    ]
  }
};

const MemoizedWidgetContent = React.memo(function MemoizedWidgetContent({
  id,
  hoverTime,
  setHoverTime,
  hoverDate,
  setHoverDate
}) {
  const { date, timeOfDay, latitude, longitude, useAnalemma } = useChronometerStore((state) => ({
    date: state.date,
    timeOfDay: state.timeOfDay,
    latitude: state.latitude,
    longitude: state.longitude,
    useAnalemma: state.useAnalemma
  }));

  const { solarData, orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    useAnalemma,
    { [id]: true }
  );

  const dayOfYear = getDayOfYear(date);

  const handleDateSlider = (val) => {
    cosmicActions.setDate(new Date(date.getFullYear(), 0, val));
  };

  switch (id) {
    case 'almanac':
      return (
        <SolarAlmanac 
          latitude={latitude} 
          longitude={longitude} 
          currentDay={dayOfYear} 
          onDayChange={handleDateSlider} 
          year={date.getFullYear()} 
          hoverTime={hoverTime}
          onHoverTime={setHoverTime}
        />
      );
    case 'lunarAlmanac':
      return (
        <LunarAlmanacCard 
          orbitalData={orbitalData} 
          onSetTime={cosmicActions.setTimeOfDay} 
          latitude={latitude}
          longitude={longitude}
          currentDay={dayOfYear}
          onDayChange={handleDateSlider}
          currentDate={date}
          hoverDate={hoverDate}
          onHoverDate={setHoverDate}
        />
      );
    case 'eclipse':
      return (
        <EclipseDemonstrator 
          currentDate={date} 
          onDateChange={cosmicActions.setDate} 
          onTimeChange={cosmicActions.setTimeOfDay} 
          orbitalData={orbitalData} 
        />
      );
    case 'celestialSphere':
      return (
        <CelestialSphereView 
          latitude={latitude} 
          longitude={longitude} 
          solarData={solarData} 
          orbitalData={orbitalData} 
          timeOfDay={timeOfDay} 
        />
      );
    case 'sunclock':
      return (
        <SunClock 
          solarData={solarData} 
          currentTime={timeOfDay} 
          latitude={latitude} 
          hoverTime={hoverTime}
          onHoverTime={setHoverTime}
        />
      );
    case 'map':
      return (
        <TerminatorMap 
          solarData={solarData} 
          latitude={latitude} 
          longitude={longitude} 
          timeOfDay={timeOfDay} 
          hoverTime={hoverTime}
        />
      );
    case 'macroOrbit':
      return (
        <MacroOrbitView 
          positions={orbitalData?.positions} 
          eclipse={orbitalData?.eclipse} 
          solarData={solarData}
          orbitalData={orbitalData}
          currentDate={date}
          hoverDate={hoverDate}
        />
      );
    case 'microTides':
      return (
        <MicroTideView 
          tides={orbitalData?.tides} 
          angles={orbitalData?.angles} 
          userRotation={orbitalData?.userRotation}
          localTideStatus={orbitalData?.localTideStatus}
          hoverDate={hoverDate}
        />
      );
    default:
      return null;
  }
});

const MemoizedChronometerDock = React.memo(function MemoizedChronometerDock({
  isDockCollapsed,
  onToggleCollapse
}) {
  const { date, timeOfDay, latitude, longitude, useAnalemma } = useChronometerStore((state) => ({
    date: state.date,
    timeOfDay: state.timeOfDay,
    latitude: state.latitude,
    longitude: state.longitude,
    useAnalemma: state.useAnalemma
  }));

  const { solarData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    useAnalemma,
    { sunclock: true }
  );

  return (
    <OrbitalChronometer 
      date={date}
      onDateChange={cosmicActions.setDate}
      timeOfDay={timeOfDay}
      onTimeChange={cosmicActions.setTimeOfDay}
      longitude={longitude}
      onLonChange={cosmicActions.setLongitude}
      latitude={latitude}
      onLatChange={cosmicActions.setLatitude}
      solarData={solarData}
      isCollapsed={isDockCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
});

export default function App() {
  const useAnalemma = useChronometerStore((state) => state.useAnalemma);

  const [activePresetKey, setActivePresetKey] = useState('master');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [widgets, setWidgets] = useState(PRESET_LAYOUTS.master.widgets);
  const [showOptions, setShowOptions] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Shared Cross-Card Interactive Hover Sync
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  const [windows, setWindows] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmic_window_layout_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return PRESET_LAYOUTS.master.windows;
    } catch (e) {
      return PRESET_LAYOUTS.master.windows;
    }
  });

  const handleSelectPreset = (key) => {
    const preset = PRESET_LAYOUTS[key];
    if (!preset) return;
    setActivePresetKey(key);
    setWidgets(preset.widgets);
    setWindows(preset.windows);
    setShowPresetsMenu(false);
  };

  const [lockedWindows, setLockedWindows] = useState({});
  const [isAllLocked, setIsAllLocked] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('cosmic_window_layout_v5', JSON.stringify(windows.map(w => ({
        id: w.id,
        title: w.title,
        colSpan: w.colSpan,
        height: w.height
      }))));
    } catch (e) {}
  }, [windows]);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    setWindows(prev => {
      const sourceIdx = prev.findIndex(w => w.id === sourceId);
      const targetIdx = prev.findIndex(w => w.id === targetId);
      if (sourceIdx < 0 || targetIdx < 0) return prev;

      const newOrder = [...prev];
      const [removed] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
  };

  const handleResize = (id, newWidth, newHeight) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const heightVal = typeof newHeight === 'string' ? (newHeight.endsWith('px') ? newHeight : `${newHeight}px`) : `${newHeight}px`;
        return { ...w, height: heightVal };
      }
      return w;
    }));
  };

  const handleToggleLock = (id) => {
    setLockedWindows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetLayout = () => {
    setActivePresetKey('master');
    setWindows(PRESET_LAYOUTS.master.windows);
    setWidgets(PRESET_LAYOUTS.master.widgets);
    setLockedWindows({});
    try { 
      localStorage.removeItem('cosmic_window_layout'); 
      localStorage.removeItem('cosmic_window_layout_v2'); 
      localStorage.removeItem('cosmic_window_layout_v3'); 
      localStorage.removeItem('cosmic_window_layout_v4'); 
      localStorage.removeItem('cosmic_window_layout_v5'); 
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sleek Modern Top Brand Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-widest text-white uppercase flex items-center gap-1.5">
                COSMIC <span className="text-indigo-400 font-light">ENGINE</span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
                Astrolabe Celestial Mechanics & Orbital Simulator
              </p>
            </div>
          </div>

          {/* Right Action Controls: Presets, Layers Menu, Lock Layout, Reset Layout */}
          <div className="flex items-center gap-2">
            
            {/* WORKSPACE PRESETS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPresetsMenu(!showPresetsMenu);
                  if (showOptions) setShowOptions(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  showPresetsMenu
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-amber-400 border-slate-700 hover:border-amber-500 hover:text-amber-300'
                }`}
              >
                <LayoutTemplate className="w-4 h-4 text-amber-400" />
                <span>Presets</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 text-amber-300 uppercase hidden md:inline">
                  {PRESET_LAYOUTS[activePresetKey]?.name || 'Presets'}
                </span>
              </button>

              {showPresetsMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 z-50 text-slate-200 animate-in fade-in duration-150">
                  <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1.5 uppercase tracking-wider font-mono border-b border-slate-800/80 mb-1">
                    Curated Workspace Suites
                  </div>
                  {Object.values(PRESET_LAYOUTS).map(preset => {
                    const PresetIcon = preset.icon;
                    const isActive = activePresetKey === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                          isActive 
                            ? 'bg-amber-500/15 border border-amber-500/40 text-white' 
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          <PresetIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-mono tracking-tight">{preset.name}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{preset.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulation Layers Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowOptions(!showOptions);
                  if (showPresetsMenu) setShowPresetsMenu(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  showOptions
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Simulation Layers</span>
              </button>

              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-2 z-50 text-slate-200 animate-in fade-in duration-150">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1.5 uppercase tracking-wider font-mono">
                    Active Dashboard Windows
                  </div>
                  {[
                    { key: 'almanac', label: 'Solar Almanac & Twilight Bands', icon: Sun },
                    { key: 'sunclock', label: 'Daily Sun Elevation & Twilights', icon: Sun },
                    { key: 'lunarAlmanac', label: 'Lunar & Tidal Almanac', icon: Moon },
                    { key: 'eclipse', label: 'Eclipse Mechanics & Shadow Geometry', icon: Sparkles },
                    { key: 'celestialSphere', label: 'Celestial Sphere & Ecliptic View', icon: Compass },
                    { key: 'map', label: 'Centered Daylight Terminator Map', icon: MapPin },
                    { key: 'macroOrbit', label: 'Solar System Macro Orbit', icon: Globe },
                    { key: 'microTides', label: 'Earth & Tidal Gravity Micro View', icon: RotateCw }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setWidgets(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        widgets[opt.key] !== false ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800' : 'hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> <span className="truncate">{opt.label}</span>
                      </div>
                      {widgets[opt.key] !== false ? <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded border border-slate-700 shrink-0" />}
                    </button>
                  ))}

                  <div className="h-px bg-slate-800 my-1.5" />

                  <button
                    onClick={() => cosmicActions.setUseAnalemma(!useAnalemma)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      useAnalemma ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" /> Analemma Equation of Time
                    </div>
                    {useAnalemma ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <div className="w-3.5 h-3.5 rounded border border-slate-700" />}
                  </button>
                </div>
              )}
            </div>

            {/* Lock Layout Button */}
            <button
              onClick={() => setIsAllLocked(!isAllLocked)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isAllLocked ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isAllLocked ? "Unlock All Windows" : "Lock All Window Positions"}
            >
              {isAllLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAllLocked ? "Locked" : "Lock Layout"}</span>
            </button>

            {/* Reset Layout Button */}
            <button
              onClick={handleResetLayout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5"
              title="Reset Window Layout to Defaults"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[2800px] mx-auto p-4 md:p-6 2xl:px-10 space-y-6">

        <div className={`w-full max-w-[2800px] mx-auto ${isDockCollapsed ? 'pb-24' : 'pb-64'} transition-all duration-300`}>
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Render Windows Across Full 12-Column Panoramic Grid */}
            {windows.map((win) => {
              // 1-to-1 Widget Toggle Filtering
              if (widgets[win.id] === false) return null;

              const defaultHeight = PRESET_LAYOUTS.master.windows.find(d => d.id === win.id)?.height || '420px';

              return (
                <DashboardWindow
                  key={win.id}
                  id={win.id}
                  title={win.title}
                  icon={ICON_MAP[win.id]}
                  colSpan={win.colSpan}
                  height={win.height}
                  isLocked={isAllLocked || !!lockedWindows[win.id]}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onResize={handleResize}
                  onToggleLock={handleToggleLock}
                  onResetSize={() => handleResize(win.id, 0, defaultHeight)}
                >
                  <MemoizedWidgetContent 
                    id={win.id}
                    hoverTime={hoverTime}
                    setHoverTime={setHoverTime}
                    hoverDate={hoverDate}
                    setHoverDate={setHoverDate}
                  />
                </DashboardWindow>
              );
            })}
          </div>
        </div>

        {/* Bottom-Pinned Astrolabe Control Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <MemoizedChronometerDock 
            isDockCollapsed={isDockCollapsed}
            onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)}
          />
        </div>

      </div>
    </div>
  );
}

