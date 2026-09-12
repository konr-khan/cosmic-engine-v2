import { ComponentType } from 'react';
import { 
  Sun, 
  Moon, 
  RotateCw, 
  MapPin, 
  Globe, 
  LayoutTemplate, 
  Sparkles, 
  Eye, 
  Compass 
} from 'lucide-react';
import { WindowLayoutConfig } from '../types';

export const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  today: Eye,
  almanac: Sun,
  lunarAlmanac: Moon,
  armillary: Compass,
  eclipse: Sparkles,
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
    desc: 'Complete 8-module astronomical dashboard with 3D armillary & instantaneous horizon',
    icon: LayoutTemplate,
    widgets: { today: true, almanac: true, lunarAlmanac: true, armillary: true, eclipse: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'armillary', title: 'Gyro-Morph Armillary & Astrolabe Projections', colSpan: 12, height: '520px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 6, height: '480px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Ribbon & Ephemeris)', colSpan: 6, height: '400px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '460px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 6, height: '420px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 12, height: '360px' }
    ]
  },
  horology: {
    id: 'horology',
    name: 'Renaissance Horology Suite',
    desc: '3D Gyro-Morph Armillary paired with 24h Solar Almanac & Today Horizon',
    icon: Compass,
    widgets: { armillary: true, today: true, almanac: true, lunarAlmanac: true, eclipse: false, map: false, macroOrbit: false, microTides: false },
    windows: [
      { id: 'armillary', title: 'Gyro-Morph Armillary & Astrolabe Projections', colSpan: 12, height: '520px' },
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 6, height: '460px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Ribbon & Ephemeris)', colSpan: 6, height: '460px' }
    ]
  },
  solar: {
    id: 'solar',
    name: 'Solar Observation Suite',
    desc: 'Solar Almanac paired with Instantaneous Horizon, Terminator Map & Macro Orbit',
    icon: Sun,
    widgets: { today: true, almanac: true, map: true, macroOrbit: true, armillary: false, lunarAlmanac: false, eclipse: false, microTides: false },
    windows: [
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 12, height: '480px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 6, height: '420px' }
    ]
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar & Tidal Suite',
    desc: 'Lunar Almanac paired with Instantaneous Horizon, Micro Tides & Macro Orbit',
    icon: Moon,
    widgets: { today: true, lunarAlmanac: true, microTides: true, macroOrbit: true, armillary: false, almanac: false, map: false, eclipse: false },
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
    desc: 'Eclipse Optics paired with Lunar Nodal Corridor, Horizon & Tidal Gravity',
    icon: Sparkles,
    widgets: { eclipse: true, today: true, lunarAlmanac: true, microTides: true, armillary: false, almanac: false, map: false, macroOrbit: false },
    windows: [
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 12, height: '480px' },
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 12, height: '440px' },
      { id: 'lunarAlmanac', title: 'Lunar Phase & Node Corridor', colSpan: 6, height: '420px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '420px' }
    ]
  },
  ultrawide: {
    id: 'ultrawide',
    name: 'Ultrawide 21:9 Observatory',
    desc: 'Panoramic multi-column layout optimized for 21:9 & 32:9 monitors',
    icon: Globe,
    widgets: { today: true, armillary: true, almanac: true, lunarAlmanac: true, eclipse: true, map: true, macroOrbit: true, microTides: true },
    windows: [
      { id: 'armillary', title: 'Gyro-Morph Armillary & Astrolabe Projections', colSpan: 6, height: '500px' },
      { id: 'today', title: "Today's Sky Horizon (Sun & Moon Dome)", colSpan: 6, height: '500px' },
      { id: 'almanac', title: 'Solar Almanac & 24h Polar Clock', colSpan: 6, height: '460px' },
      { id: 'lunarAlmanac', title: 'Lunar Almanac (365-Day Matrix)', colSpan: 6, height: '460px' },
      { id: 'eclipse', title: 'Eclipse Mechanics & Shadow Geometry', colSpan: 6, height: '460px' },
      { id: 'map', title: 'Centered Daylight Terminator Map', colSpan: 6, height: '420px' },
      { id: 'macroOrbit', title: 'Solar System Macro Orbit', colSpan: 6, height: '420px' },
      { id: 'microTides', title: 'Earth & Tidal Gravity Micro View', colSpan: 6, height: '420px' }
    ]
  }
};

export const STORAGE_KEY = 'cosmic_window_layout_v10';
