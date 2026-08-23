import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PRESET_LAYOUTS } from './useDashboardLayout';

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
    useEffect: (effect: () => any) => { effect(); }
  };
});

import { useDashboardLayout } from './useDashboardLayout';

describe('useDashboardLayout hook suite', () => {
  beforeEach(() => {
    stateStore = {};
    stateSetters = {};
    stateCounter = 0;
    try {
      localStorage.clear();
    } catch {}
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

  it('toggles column span between 1-Col and 2-Col with handleToggleColSpan', () => {
    stateCounter = 0;
    const layout = useDashboardLayout();
    const armillaryWin = layout.windows.find((w: { id: string }) => w.id === 'armillary');
    const initialColSpan = armillaryWin?.colSpan;
    expect(initialColSpan).toBe(12);

    layout.handleToggleColSpan('armillary');

    stateCounter = 0;
    const updated = useDashboardLayout();
    const toggledWin = updated.windows.find((w: { id: string }) => w.id === 'armillary');
    expect(toggledWin?.colSpan).toBe(6);

    layout.handleToggleColSpan('armillary');

    stateCounter = 0;
    const toggledBack = useDashboardLayout();
    const backWin = toggledBack.windows.find((w: { id: string }) => w.id === 'armillary');
    expect(backWin?.colSpan).toBe(12);
  });
});
