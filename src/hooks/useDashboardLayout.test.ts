import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PRESET_LAYOUTS, DEFAULT_WINDOWS, STORAGE_KEY } from './useDashboardLayout';

// Mock React hooks to test the layout hook state transitions deterministically
let stateStore: Record<string, any> = {};
let stateSetters: Record<string, (val: any) => void> = {};
let stateCounter = 0;

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useState: (initial: any) => {
      const id = String(stateCounter++);
      if (!(id in stateStore)) {
        stateStore[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setter = (val: any) => {
        stateStore[id] = typeof val === 'function' ? val(stateStore[id]) : val;
      };
      stateSetters[id] = setter;
      return [stateStore[id], setter];
    },
    useEffect: (effect: () => any) => { effect(); },
    useCallback: (fn: any) => fn,
    useMemo: (factory: () => any) => factory()
  };
});

let mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = String(value); },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { mockStorage = {}; }
};
(globalThis as any).localStorage = mockLocalStorage;

import { useDashboardLayout } from './useDashboardLayout';

describe('useDashboardLayout hook suite', () => {
  beforeEach(() => {
    stateStore = {};
    stateSetters = {};
    stateCounter = 0;
    mockStorage = {};
  });

  it('initializes with master preset layout defaults', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    expect(layout.activePresetKey).toBe('master');
    expect(layout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);
    expect(layout.isAllLocked).toBe(false);
    expect(layout.widgets.today).toBe(true);
    expect(layout.widgets.almanac).toBe(true);
  });

  it('switches between preset suites accurately', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    layout.handleSelectPreset('solar');

    stateCounter = 0;
    const updated = useDashboardLayout();
    expect(updated.activePresetKey).toBe('solar');
    expect(updated.widgets.today).toBe(true);
    expect(updated.widgets.almanac).toBe(true);
    expect(updated.widgets.lunarAlmanac).toBe(false);
    expect(updated.windows.length).toBe(PRESET_LAYOUTS.solar.windows.length);
  });

  it('toggles individual widgets with toggleWidget', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    expect(layout.widgets.map).toBe(true);
    
    layout.toggleWidget('map');
    
    stateCounter = 0;
    const updated = useDashboardLayout();
    expect(updated.widgets.map).toBe(false);
  });

  it('toggles individual and all window lock states', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    
    layout.handleToggleLock('almanac');
    
    stateCounter = 0;
    const updated = useDashboardLayout();
    expect(updated.lockedWindows.almanac).toBe(true);

    updated.setIsAllLocked(true);
    stateCounter = 0;
    const lockedAll = useDashboardLayout();
    expect(lockedAll.isAllLocked).toBe(true);
  });

  it('resizes window heights properly', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    
    layout.handleResize('almanac', 0, '600px');
    
    stateCounter = 0;
    const updated = useDashboardLayout();
    const almanacWin = updated.windows.find((w: { id: string }) => w.id === 'almanac');
    expect(almanacWin?.height).toBe('600px');
  });

  it('handles window reordering with handleDrop', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    const firstId = layout.windows[0].id;
    const secondId = layout.windows[1].id;

    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(firstId)
      }
    } as unknown as React.DragEvent<HTMLElement>;

    layout.handleDrop(mockEvent, secondId);

    stateCounter = 0;
    const updated = useDashboardLayout();
    expect(updated.windows[1].id).toBe(firstId);
  });

  it('resets layout to master preset defaults and clears storage', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    layout.handleSelectPreset('lunar');
    layout.setIsAllLocked(true);

    layout.handleResetLayout();

    stateCounter = 0;
    const resetLayout = useDashboardLayout();
    expect(resetLayout.activePresetKey).toBe('master');
    expect(resetLayout.isAllLocked).toBe(false);
    expect(resetLayout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);
  });

  it('appends canonical config from DEFAULT_WINDOWS when toggling on a widget not in windows', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    // Switch to 'solar' preset which only contains 4 windows (today, almanac, map, macroOrbit)
    layout.handleSelectPreset('solar');

    stateCounter = 0;
    const solarLayout = useDashboardLayout();
    expect(solarLayout.windows.some((w: { id: string }) => w.id === 'eclipse')).toBe(false);
    expect(solarLayout.widgets.eclipse).toBe(false);

    // Toggle 'eclipse' on
    solarLayout.toggleWidget('eclipse');

    stateCounter = 0;
    const updated = useDashboardLayout();
    expect(updated.widgets.eclipse).toBe(true);
    const eclipseWin = updated.windows.find((w: { id: string }) => w.id === 'eclipse');
    expect(eclipseWin).toBeDefined();
    expect(eclipseWin?.colSpan).toBe(12);
    expect(eclipseWin?.height).toBe('460px');
  });

  it('validates schema when reading localStorage and falls back if corrupt or invalid', () => {
    // 1. Corrupt JSON
    localStorage.setItem(STORAGE_KEY, '{ invalid json');
    stateStore = {};
    stateCounter = 0;
    let layout = useDashboardLayout();
    expect(layout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);

    // 2. Non-array JSON
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notAnArray: true }));
    stateStore = {};
    stateCounter = 0;
    layout = useDashboardLayout();
    expect(layout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);

    // 3. Empty array
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    stateStore = {};
    stateCounter = 0;
    layout = useDashboardLayout();
    expect(layout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);

    // 4. Array with invalid item schema (missing id, invalid colSpan)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: '', title: 'Broken', colSpan: 'wide', height: 100 }
    ]));
    stateStore = {};
    stateCounter = 0;
    layout = useDashboardLayout();
    expect(layout.windows.length).toBe(PRESET_LAYOUTS.master.windows.length);

    // 5. Valid schema
    const validWindows = [
      { id: 'today', title: "Today's Sky", colSpan: 12, height: '400px' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validWindows));
    stateStore = {};
    stateCounter = 0;
    layout = useDashboardLayout();
    expect(layout.windows.length).toBe(1);
    expect(layout.windows[0].id).toBe('today');
  });

  it('enforces isAllLocked and lockedWindows guards for handleDrop, handleResize, and handleToggleColSpan', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    const firstId = layout.windows[0].id;
    const secondId = layout.windows[1].id;
    const initialHeight = layout.windows[0].height;
    const initialColSpan = layout.windows[0].colSpan;

    // A. When isAllLocked is active
    layout.setIsAllLocked(true);
    stateCounter = 0;
    const lockedAll = useDashboardLayout();

    const mockDropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(firstId)
      }
    } as unknown as React.DragEvent<HTMLElement>;

    // Attempt drop
    lockedAll.handleDrop(mockDropEvent, secondId);
    stateCounter = 0;
    let check = useDashboardLayout();
    expect(check.windows[0].id).toBe(firstId); // Order unchanged!

    // Attempt resize
    lockedAll.handleResize(firstId, 0, '999px');
    stateCounter = 0;
    check = useDashboardLayout();
    expect(check.windows[0].height).toBe(initialHeight); // Height unchanged!

    // Attempt colSpan toggle
    lockedAll.handleToggleColSpan(firstId);
    stateCounter = 0;
    check = useDashboardLayout();
    expect(check.windows[0].colSpan).toBe(initialColSpan); // ColSpan unchanged!

    // B. Unlock all, lock specifically firstId
    lockedAll.setIsAllLocked(false);
    lockedAll.handleToggleLock(firstId);
    stateCounter = 0;
    const singleLocked = useDashboardLayout();
    expect(singleLocked.lockedWindows[firstId]).toBe(true);

    // Attempt drop on locked window
    singleLocked.handleDrop(mockDropEvent, secondId);
    stateCounter = 0;
    check = useDashboardLayout();
    expect(check.windows[0].id).toBe(firstId); // Order unchanged!

    // Attempt resize on locked window
    singleLocked.handleResize(firstId, 0, '999px');
    stateCounter = 0;
    check = useDashboardLayout();
    expect(check.windows[0].height).toBe(initialHeight); // Height unchanged!

    // Attempt colSpan toggle on locked window
    singleLocked.handleToggleColSpan(firstId);
    stateCounter = 0;
    check = useDashboardLayout();
    expect(check.windows[0].colSpan).toBe(initialColSpan); // ColSpan unchanged!
  });
});
