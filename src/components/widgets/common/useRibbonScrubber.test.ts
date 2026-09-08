/**
 * @file useRibbonScrubber.test.ts
 * Unit tests for useRibbonScrubber hook covering coordinate scaling,
 * bidirectional projection, boundary clamping, and pointer scrubbing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Lightweight React hooks mock for Node testing environment
let stateStore: Record<string, any> = {};
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
      return [stateStore[id], setter];
    },
    useRef: (initial: any) => {
      const id = 'ref_' + String(stateCounter++);
      if (!(id in stateStore)) {
        stateStore[id] = { current: initial };
      }
      return stateStore[id];
    },
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
    useEffect: (effect: () => any) => { effect(); }
  };
});

import { useRibbonScrubber } from './useRibbonScrubber';

describe('useRibbonScrubber Hook', () => {
  beforeEach(() => {
    stateStore = {};
    stateCounter = 0;
  });

  const defaultOptions = {
    width: 800,
    height: 400,
    padding: { left: 50, right: 50, top: 20, bottom: 30 },
    totalDays: 365
  };

  it('computes correct inner chart dimensions by subtracting padding', () => {
    const hook = useRibbonScrubber(defaultOptions);

    // chartW = 800 - 50 - 50 = 700
    expect(hook.chartW).toBe(700);
    // chartH = 400 - 20 - 30 = 350
    expect(hook.chartH).toBe(350);
  });

  describe('Day <-> X Bidirectional Projection', () => {
    it('projects startDay to left padding and endDay to right margin', () => {
      const hook = useRibbonScrubber(defaultOptions);

      // Day 1 -> left margin (50px)
      expect(hook.dayToX(1)).toBe(50);
      // Day 365 -> right margin (50 + 700 = 750px)
      expect(hook.dayToX(365)).toBe(750);
      // Mid-year day 183 -> approx 400px
      expect(hook.dayToX(183)).toBeCloseTo(400, 0);
    });

    it('projects X coordinate back to day with exact integer rounding and bounds clamping', () => {
      const hook = useRibbonScrubber(defaultOptions);

      expect(hook.xToDay(50)).toBe(1);
      expect(hook.xToDay(750)).toBe(365);
      expect(hook.xToDay(400)).toBeCloseTo(183, 0);

      // Bounds clamping for out-of-range coordinates
      expect(hook.xToDay(0)).toBe(1);
      expect(hook.xToDay(-100)).toBe(1);
      expect(hook.xToDay(850)).toBe(365);
      expect(hook.xToDay(1000)).toBe(365);
    });

    it('supports custom sub-window ranges (e.g. 30-day synodic lunar span)', () => {
      const hook = useRibbonScrubber({
        ...defaultOptions,
        startDay: 15,
        endDay: 45
      });

      expect(hook.effectiveStartDay).toBe(15);
      expect(hook.effectiveEndDay).toBe(45);

      // Day 15 -> 50px
      expect(hook.dayToX(15)).toBe(50);
      // Day 45 -> 750px
      expect(hook.dayToX(45)).toBe(750);
      // Midpoint Day 30 -> 400px
      expect(hook.dayToX(30)).toBe(400);

      // Inverse X -> Day in synodic range
      expect(hook.xToDay(50)).toBe(15);
      expect(hook.xToDay(750)).toBe(45);
      expect(hook.xToDay(400)).toBe(30);

      // Clamps to [15, 45]
      expect(hook.xToDay(10)).toBe(15);
      expect(hook.xToDay(900)).toBe(45);
    });
  });

  describe('Time <-> Y Bidirectional Projection', () => {
    it('projects 0h to bottom, 24h to top, and 12h to vertical center', () => {
      const hook = useRibbonScrubber(defaultOptions);

      // chartH = 350, paddingTop = 20
      // 0h (midnight bottom) -> 20 + 350 = 370px
      expect(hook.timeToY(0)).toBe(370);
      // 24h (midnight top) -> 20px
      expect(hook.timeToY(24)).toBe(20);
      // 12h (solar noon center) -> 20 + 175 = 195px
      expect(hook.timeToY(12)).toBe(195);
    });

    it('clamps timeToY for out-of-range hours', () => {
      const hook = useRibbonScrubber(defaultOptions);

      expect(hook.timeToY(-5)).toBe(370);
      expect(hook.timeToY(30)).toBe(20);
    });

    it('computes exact round-trip inverse via yToTime', () => {
      const hook = useRibbonScrubber(defaultOptions);

      // 370px -> 0h
      expect(hook.yToTime(370)).toBeCloseTo(0, 5);
      // 20px -> 24h
      expect(hook.yToTime(20)).toBeCloseTo(24, 5);
      // 195px -> 12h
      expect(hook.yToTime(195)).toBeCloseTo(12, 5);

      // Clamps for out-of-bounds Y
      expect(hook.yToTime(0)).toBe(24);
      expect(hook.yToTime(500)).toBe(0);
    });
  });

  describe('Pointer Scrubbing State', () => {
    it('initializes in non-dragging state with null hoverDay', () => {
      const hook = useRibbonScrubber(defaultOptions);

      expect(hook.isDragging).toBe(false);
      expect(hook.hoverDay).toBeNull();
      expect(hook.svgRef).toBeDefined();
    });

    it('dispatches onScrub and onScrubEnd callbacks', () => {
      const onScrub = vi.fn();
      const onScrubEnd = vi.fn();

      const hook = useRibbonScrubber({
        ...defaultOptions,
        onScrub,
        onScrubEnd
      });

      // Attach mock SVG element to svgRef
      const mockSvg = {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 400,
          right: 800,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => {}
        }),
        getScreenCTM: () => null,
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn()
      } as any;

      hook.svgRef.current = mockSvg;

      const mockDownEvent = {
        clientX: 400,
        clientY: 195,
        pointerId: 1,
        type: 'pointerdown'
      } as any;

      hook.handlePointerDown(mockDownEvent);

      expect(onScrub).toHaveBeenCalledTimes(1);
      const scrubArgs = onScrub.mock.calls[0][0];
      expect(scrubArgs.day).toBeCloseTo(183, 0);
      expect(scrubArgs.time).toBeCloseTo(12, 0);
      expect(scrubArgs.svgX).toBe(400);
      expect(scrubArgs.svgY).toBe(195);
      expect(mockSvg.setPointerCapture).toHaveBeenCalledWith(1);

      // Pointer move
      const mockMoveEvent = {
        clientX: 450,
        clientY: 100,
        pointerId: 1,
        type: 'pointermove'
      } as any;

      hook.handlePointerMove(mockMoveEvent);
      expect(onScrub).toHaveBeenCalledTimes(2);

      // Release pointer
      const mockUpEvent = {
        clientX: 450,
        clientY: 100,
        pointerId: 1,
        type: 'pointerup'
      } as any;

      hook.handlePointerUp(mockUpEvent);
      expect(onScrubEnd).toHaveBeenCalledTimes(1);
      expect(mockSvg.releasePointerCapture).toHaveBeenCalledWith(1);
    });
  });
});
