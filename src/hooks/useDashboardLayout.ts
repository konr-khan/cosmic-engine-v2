import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WindowLayoutConfig } from '../types';
import { 
  ICON_MAP, 
  PRESET_LAYOUTS, 
  STORAGE_KEY,
  PresetLayout 
} from '../constants/dashboardPresets';

export { ICON_MAP, PRESET_LAYOUTS, STORAGE_KEY };
export type { PresetLayout };

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
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(windows.map(w => ({
          id: w.id,
          title: w.title,
          colSpan: w.colSpan,
          height: w.height
        }))));
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [windows]);

  const handleSelectPreset = useCallback((key: string) => {
    const preset = PRESET_LAYOUTS[key];
    if (!preset) return;
    setActivePresetKey(key);
    setWidgets(preset.widgets);
    setWindows(preset.windows);
  }, []);

  const toggleWidget = useCallback((key: string) => {
    setWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

    setWindows(prev => {
      const sourceIdx = prev.findIndex(w => w.id === sourceId);
      const targetIdx = prev.findIndex(w => w.id === targetId);
      if (sourceIdx < 0 || targetIdx < 0) return prev;

      const newOrder = [...prev];
      const [removed] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, removed);
      return newOrder;
    });
  }, []);

  const handleResize = useCallback((id: string, _newWidth: number, newHeight: number | string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const heightVal = typeof newHeight === 'string' ? (newHeight.endsWith('px') ? newHeight : `${newHeight}px`) : `${newHeight}px`;
        return { ...w, height: heightVal };
      }
      return w;
    }));
  }, []);

  const handleToggleLock = useCallback((id: string) => {
    setLockedWindows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleToggleColSpan = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        // Toggle between 12 (panoramic 2-col) and 6 (standard 1-col)
        const nextColSpan = w.colSpan === 12 ? 6 : 12;
        return { ...w, colSpan: nextColSpan };
      }
      return w;
    }));
  }, []);

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
