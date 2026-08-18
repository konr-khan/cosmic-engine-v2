import React, { useState } from 'react';
import { 
  Globe, 
  LayoutTemplate, 
  Layers, 
  Lock, 
  Unlock, 
  RefreshCcw, 
  Check, 
  Sliders,
  Sun, 
  Moon, 
  Sparkles, 
  Compass, 
  MapPin, 
  RotateCw 
} from 'lucide-react';
import { PRESET_LAYOUTS, PresetLayout } from '../../hooks/useDashboardLayout';
import { cosmicActions, useChronometerStore } from '../../store/cosmicStore';

export interface ObsNavbarProps {
  activePresetKey: string;
  onSelectPreset: (key: string) => void;
  widgets: Record<string, boolean>;
  onToggleWidget: (key: string) => void;
  isAllLocked: boolean;
  onToggleAllLocked: () => void;
  onResetLayout: () => void;
}

const SIMULATION_LAYERS = [
  { key: 'almanac', label: 'Solar Almanac & Twilight Bands', icon: Sun },
  { key: 'sunclock', label: 'Daily Sun Elevation & Twilights', icon: Sun },
  { key: 'lunarAlmanac', label: 'Lunar & Tidal Almanac', icon: Moon },
  { key: 'eclipse', label: 'Eclipse Mechanics & Shadow Geometry', icon: Sparkles },
  { key: 'celestialSphere', label: 'Celestial Sphere & Ecliptic View', icon: Compass },
  { key: 'map', label: 'Centered Daylight Terminator Map', icon: MapPin },
  { key: 'macroOrbit', label: 'Solar System Macro Orbit', icon: Globe },
  { key: 'microTides', label: 'Earth & Tidal Gravity Micro View', icon: RotateCw }
];

export const ObsNavbar: React.FC<ObsNavbarProps> = ({
  activePresetKey,
  onSelectPreset,
  widgets,
  onToggleWidget,
  isAllLocked,
  onToggleAllLocked,
  onResetLayout
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const useAnalemma = useChronometerStore((state) => state.useAnalemma);

  const handleSelectPresetClick = (presetId: string) => {
    onSelectPreset(presetId);
    setShowPresetsMenu(false);
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40">
            <Globe className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-widest text-white uppercase flex items-center gap-1.5 font-mono">
              COSMIC <span className="text-indigo-400 font-light">ENGINE</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Astrolabe Celestial Mechanics &amp; Orbital Simulator
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                showPresetsMenu
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                  : 'bg-slate-900/80 text-amber-400 border-slate-800 hover:border-amber-500/60 hover:text-amber-300'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-300 uppercase hidden md:inline border border-amber-500/20">
                {PRESET_LAYOUTS[activePresetKey]?.name || 'Presets'}
              </span>
            </button>

            {showPresetsMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-800 p-2 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1.5 uppercase tracking-wider font-mono border-b border-slate-800/80 mb-1">
                  Curated Workspace Suites
                </div>
                {Object.values(PRESET_LAYOUTS).map((preset: PresetLayout) => {
                  const PresetIcon = preset.icon;
                  const isActive = activePresetKey === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPresetClick(preset.id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-inner' 
                          : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                        <PresetIcon className="w-3.5 h-3.5" />
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                showOptions
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400/40'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulation Layers</span>
            </button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-2 w-68 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-800 p-2 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1.5 uppercase tracking-wider font-mono border-b border-slate-800/80 mb-1">
                  Active Dashboard Windows
                </div>
                {SIMULATION_LAYERS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => onToggleWidget(opt.key)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer my-0.5 ${
                      widgets[opt.key] !== false ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80' : 'hover:bg-slate-900 text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> <span className="truncate">{opt.label}</span>
                    </div>
                    {widgets[opt.key] !== false ? <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded border border-slate-800 shrink-0" />}
                  </button>
                ))}

                <div className="h-px bg-slate-800 my-1.5" />

                <button
                  onClick={() => cosmicActions.setUseAnalemma(!useAnalemma)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    useAnalemma ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80' : 'hover:bg-slate-900 text-slate-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Analemma Equation of Time
                  </div>
                  {useAnalemma ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <div className="w-3.5 h-3.5 rounded border border-slate-800" />}
                </button>
              </div>
            )}
          </div>

          {/* Lock Layout Button */}
          <button
            onClick={onToggleAllLocked}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              isAllLocked ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title={isAllLocked ? "Unlock All Windows" : "Lock All Window Positions"}
          >
            {isAllLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAllLocked ? "Locked" : "Lock Layout"}</span>
          </button>

          {/* Reset Layout Button */}
          <button
            onClick={onResetLayout}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset Window Layout to Defaults"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ObsNavbar;
