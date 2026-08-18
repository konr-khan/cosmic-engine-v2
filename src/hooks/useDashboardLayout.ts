import React, { useState, useEffect, ComponentType } from 'react';
import { 
  Sun, 
  Moon, 
  RotateCw, 
  MapPin, 
  Globe, 
  Compass, 
  LayoutTemplate, 
  Sparkles,
  Eye
} from 'lucide-react';
import { WindowLayoutConfig } from '../types';

export const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  today: Eye,
  almanac: Sun,
  lunarAlmanac: Moon,
  eclipse: Sparkles,
  celestialSphere: Compass,
  map: MapPin,
  macroOrbit: Globe,
  microTides: RotateCw
};

export interface PresetLayout {
  id: string;
  name: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  widgets: Record<string, boolean>;
  windows: WindowLayoutConfig[];
}

export const PRESET_LAYOUTS: Record<string, PresetLayout> = {
  master: {
    id: 'master',
    name: 'Master Observatory',
    desc: 'Complete 8-module astronomical dashboard with instantaneous local horizon',
    icon: LayoutTemplate,
    widgets: { today: true, almanac: true, lunarAlmanac: true, eclipse: true, celestialSphere: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 12, height: '480px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Ribbon & Ephemeris)', colSpan: 12, height: '400px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '460px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic Orbital View', colSpan: 6, height: '420px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 6, height: '360px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '360px' }
    ]
  },
  solar: {
    id: 'solar',
    name: 'Solar Observation Suite',
    desc: 'Solar Almanac paired with Instantaneous Horizon & Terminator Map',
    icon: Sun,
    widgets: { today: true, almanac: true, map: true, celestialSphere: true, lunarAlmanac: false, eclipse: false, macroOrbit: false, microTides: false },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 12, height: '480px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic Orbital View', colSpan: 6, height: '420px' }
    ]
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar & Tidal Suite',
    desc: 'Lunar Almanac paired with Instantaneous Horizon, Micro Tides & Macro Orbit',
    icon: Moon,
    widgets: { today: true, lunarAlmanac: true, microTides: true, macroOrbit: true, almanac: false, map: false, celestialSphere: false, eclipse: false },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Ribbon & Ephemeris)', colSpan: 12, height: '400px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System & Lunar Orbit', colSpan: 6, height: '420px' }
    ]
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse Mechanics Suite',
    desc: 'Eclipse Optics paired with Celestial Nodes, Horizon & Lunar Corridor',
    icon: Sparkles,
    widgets: { eclipse: true, today: true, celestialSphere: true, lunarAlmanac: true, almanac: false, map: false, macroOrbit: false, microTides: false },
    windows: [
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '480px' },
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Node Corridor Alignment', colSpan: 6, height: '440px' },
      { id: 'lunarAlmanac', title: 'Lunar Phase & Node Corridor', colSpan: 6, height: '400px' }
    ]
  },
  ultrawide: {
    id: 'ultrawide',
    name: 'Ultrawide 21:9 Observatory',
    desc: 'Panoramic multi-column layout optimized for 21:9 & 32:9 monitors',
    icon: Globe,
    widgets: { today: true, almanac: true, lunarAlmanac: true, eclipse: true, celestialSphere: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 6, height: '440px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 6, height: '480px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Matrix)', colSpan: 6, height: '400px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 6, height: '460px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '460px' },
      { id: 'celestialSphere', title: 'Celestial Sphere & Ecliptic View', colSpan: 6, height: '400px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 3, height: '400px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 3, height: '400px' }
    ]
  }
};

const STORAGE_KEY = 'cosmic_window_layout_v7';

export interface UseDashboardLayoutReturn {
  activePresetKey: string;
  widgets: Record<string, boolean>;
  windows: WindowLayoutConfig[];
  lockedWindows: Record<string, boolean>;
  isAllLocked: boolean;
  setIsAllLocked: React.Dispatch<React.SetStateAction<boolean>>;
  setWidgets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleWidget: (key: string) => void;
  handleSelectPreset: (key: string) => void;
  handleDragStart: (e: React.DragEvent<HTMLElement>, id: string) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>, targetId: string) => void;
  handleResize: (id: string, _newWidth: number, newHeight: number | string) => void;
  handleToggleLock: (id: string) => void;
  handleResetLayout: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [activePresetKey, setActivePresetKey] = useState<string>('master');
  const [widgets, setWidgets] = useState<Record<string, boolean>>(PRESET_LAYOUTS.master.widgets);
  const [lockedWindows, setLockedWindows] = useState<Record<string, boolean>>({});
  const [isAllLocked, setIsAllLocked] = useState<boolean>(false);

  const [windows, setWindows] = useState<WindowLayoutConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return PRESET_LAYOUTS.master.windows;
    } catch {
      return PRESET_LAYOUTS.master.windows;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(windows.map(w => ({
        id: w.id,
        title: w.title,
        colSpan: w.colSpan,
        height: w.height
      }))));
    } catch {}
  }, [windows]);

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_LAYOUTS[key];
    if (!preset) return;
    setActivePresetKey(key);
    setWidgets(preset.widgets);
    setWindows(preset.windows);
  };

  const toggleWidget = (key: string) => {
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: string) => {
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

  const handleResize = (id: string, _newWidth: number, newHeight: number | string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const heightVal = typeof newHeight === 'string' ? (newHeight.endsWith('px') ? newHeight : `${newHeight}px`) : `${newHeight}px`;
        return { ...w, height: heightVal };
      }
      return w;
    }));
  };

  const handleToggleLock = (id: string) => {
    setLockedWindows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetLayout = () => {
    setActivePresetKey('master');
    setWindows(PRESET_LAYOUTS.master.windows);
    setWidgets(PRESET_LAYOUTS.master.widgets);
    setLockedWindows({});
    setIsAllLocked(false);
    try { 
      localStorage.removeItem('cosmic_window_layout'); 
      localStorage.removeItem('cosmic_window_layout_v2'); 
      localStorage.removeItem('cosmic_window_layout_v3'); 
      localStorage.removeItem('cosmic_window_layout_v4'); 
      localStorage.removeItem('cosmic_window_layout_v5'); 
      localStorage.removeItem('cosmic_window_layout_v6'); 
      localStorage.removeItem('cosmic_window_layout_v7'); 
    } catch {}
  };

  return {
    activePresetKey,
    widgets,
    windows,
    lockedWindows,
    isAllLocked,
    setIsAllLocked,
    setWidgets,
    toggleWidget,
    handleSelectPreset,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResize,
    handleToggleLock,
    handleResetLayout
  };
}
