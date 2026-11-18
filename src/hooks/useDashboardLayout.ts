import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WindowLayoutConfig } from '../types';
import { 
  ICON_MAP, 
  PRESET_LAYOUTS, 
  STORAGE_KEY,
  DEFAULT_WINDOWS,
  PresetLayout 
} from '../constants/dashboardPresets';

export { ICON_MAP, PRESET_LAYOUTS, STORAGE_KEY, DEFAULT_WINDOWS };
export type { PresetLayout };

function isValidWindowConfig(item: unknown): item is WindowLayoutConfig {
  if (!item || typeof item !== 'object') return false;
  const w = item as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    w.id.length > 0 &&
    typeof w.title === 'string' &&
    typeof w.colSpan === 'number' &&
    w.colSpan > 0 &&
    (typeof w.height === 'string' || typeof w.height === 'number')
  );
}

function isValidWidgetsRecord(item: unknown): item is Record<string, boolean> {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  return Object.values(item as Record<string, unknown>).every(v => typeof v === 'boolean');
}

interface PersistedDashboardLayout {
  activePresetKey: string;
  widgets: Record<string, boolean>;
  windows: WindowLayoutConfig[];
}

function deriveWidgetsFromWindows(windows: WindowLayoutConfig[]): Record<string, boolean> {
  const activeIds = new Set(windows.map(w => w.id));
  const next: Record<string, boolean> = {};
  for (const key of Object.keys(PRESET_LAYOUTS.master.widgets)) {
    next[key] = activeIds.has(key);
  }
  return next;
}

function readSavedLayoutState(): PersistedDashboardLayout {
  const fallback: PersistedDashboardLayout = {
    activePresetKey: 'master',
    widgets: PRESET_LAYOUTS.master.widgets,
    windows: PRESET_LAYOUTS.master.windows,
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed: unknown = JSON.parse(saved);

    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidWindowConfig)) {
      return {
        activePresetKey: 'master',
        widgets: deriveWidgetsFromWindows(parsed),
        windows: parsed,
      };
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.windows) && obj.windows.length > 0 && obj.windows.every(isValidWindowConfig)) {
        const presetKey =
          typeof obj.activePresetKey === 'string' && obj.activePresetKey in PRESET_LAYOUTS
            ? obj.activePresetKey
            : 'master';
        const restoredWidgets = isValidWidgetsRecord(obj.widgets)
          ? { ...PRESET_LAYOUTS[presetKey].widgets, ...obj.widgets }
          : deriveWidgetsFromWindows(obj.windows);
        return {
          activePresetKey: presetKey,
          widgets: restoredWidgets,
          windows: obj.windows,
        };
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}

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
  handleToggleColSpan: (id: string) => void;
  handleResetLayout: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [activePresetKey, setActivePresetKey] = useState<string>(() => readSavedLayoutState().activePresetKey);
  const [widgets, setWidgets] = useState<Record<string, boolean>>(() => readSavedLayoutState().widgets);
  const [lockedWindows, setLockedWindows] = useState<Record<string, boolean>>({});
  const [isAllLocked, setIsAllLocked] = useState<boolean>(false);

  const [windows, setWindows] = useState<WindowLayoutConfig[]>(() => readSavedLayoutState().windows);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          activePresetKey,
          widgets,
          windows: windows.map(w => ({
            id: w.id,
            title: w.title,
            colSpan: w.colSpan,
            height: w.height
          }))
        }));
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [activePresetKey, widgets, windows]);

  const handleSelectPreset = useCallback((key: string) => {
    const preset = PRESET_LAYOUTS[key];
    if (!preset) return;
    setActivePresetKey(key);
    setWidgets(preset.widgets);
    setWindows(preset.windows);
  }, []);

  const toggleWidget = useCallback((key: string) => {
    const willBeActive = !widgets[key];
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
    if (willBeActive) {
      setWindows(currentWindows => {
        if (!currentWindows.some(w => w.id === key)) {
          const canonical = DEFAULT_WINDOWS.find(w => w.id === key);
          if (canonical) {
            return [...currentWindows, canonical];
          }
        }
        return currentWindows;
      });
    }
  }, [widgets]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    if (isAllLocked || lockedWindows[sourceId] || lockedWindows[targetId]) return;

    setWindows(prev => {
      const sourceIdx = prev.findIndex(w => w.id === sourceId);
      const targetIdx = prev.findIndex(w => w.id === targetId);
      if (sourceIdx < 0 || targetIdx < 0) return prev;

      const newOrder = [...prev];
      const [removed] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
  }, [isAllLocked, lockedWindows]);

  const handleResize = useCallback((id: string, _newWidth: number, newHeight: number | string) => {
    if (isAllLocked || lockedWindows[id]) return;
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const heightVal = typeof newHeight === 'string' ? (newHeight.endsWith('px') ? newHeight : `${newHeight}px`) : `${newHeight}px`;
        return { ...w, height: heightVal };
      }
      return w;
    }));
  }, [isAllLocked, lockedWindows]);

  const handleToggleLock = useCallback((id: string) => {
    setLockedWindows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleToggleColSpan = useCallback((id: string) => {
    if (isAllLocked || lockedWindows[id]) return;
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        // Toggle between 12 (panoramic 2-col) and 6 (standard 1-col)
        const nextColSpan = w.colSpan === 12 ? 6 : 12;
        return { ...w, colSpan: nextColSpan };
      }
      return w;
    }));
  }, [isAllLocked, lockedWindows]);

  const handleResetLayout = useCallback(() => {
    setActivePresetKey('master');
    setWindows(PRESET_LAYOUTS.master.windows);
    setWidgets(PRESET_LAYOUTS.master.widgets);
    setLockedWindows({});
    setIsAllLocked(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (let i = 1; i <= 10; i++) {
        localStorage.removeItem(i === 1 ? 'cosmic_window_layout' : `cosmic_window_layout_v${i}`);
      }
    } catch {}
  }, []);

  return useMemo(() => ({
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
    handleToggleColSpan,
    handleResetLayout
  }), [
    activePresetKey,
    widgets,
    windows,
    lockedWindows,
    isAllLocked,
    toggleWidget,
    handleSelectPreset,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResize,
    handleToggleLock,
    handleToggleColSpan,
    handleResetLayout
  ]);
}
