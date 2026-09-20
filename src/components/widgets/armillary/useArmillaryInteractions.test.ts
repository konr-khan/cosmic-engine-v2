/**
 * @file useArmillaryInteractions.test.ts
 * Unit tests for useArmillaryInteractions custom hook covering:
 * - Zoom initialization, clamping (0.75 - 3.5), step increments, and reset
 * - Dynamic viewBoxStr computation based on zoom factor
 * - Automatic zoom reset on projectionMode switch or morphLambda > 0.05
 * - Controlled and local rule angle updates, target click snapping
 * - Hover state setters (star, bead, milestone, node)
 * - 3D camera dragging and pitch/yaw calculations
 * - Free Rete interactive rotation handling
 * - Wheel event listener attachment and cleanup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArmillaryCameraState } from './types';

// Lightweight React hooks mock for Node testing environment
let stateStore: Record<string, any> = {};
let stateCounter = 0;
let refStore: Record<string, any> = {};
let refCounter = 0;
let effectDepsStore: Record<string, any[] | undefined> = {};
let effectCounter = 0;
let cleanupsStore: Record<string, (() => void) | undefined> = {};
let stateModifiedInEffect = false;

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
        stateModifiedInEffect = true;
        stateStore[id] = typeof val === 'function' ? val(stateStore[id]) : val;
      };
      return [stateStore[id], setter];
    },
    useRef: (initial: any) => {
      const id = 'ref_' + String(refCounter++);
      if (!(id in refStore)) {
        refStore[id] = { current: initial };
      }
      return refStore[id];
    },
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
    useEffect: (effect: () => any, deps?: any[]) => {
      const id = String(effectCounter++);
      const prevDeps = effectDepsStore[id];
      const hasChanged = !prevDeps || !deps || deps.some((d, i) => d !== prevDeps[i]);
      if (hasChanged) {
        if (cleanupsStore[id]) {
          cleanupsStore[id]?.();
        }
        effectDepsStore[id] = deps;
        const cleanup = effect();
        if (typeof cleanup === 'function') {
          cleanupsStore[id] = cleanup;
        }
      }
    }
  };
});

import { useArmillaryInteractions, UseArmillaryInteractionsOptions } from './useArmillaryInteractions';

describe('useArmillaryInteractions Hook', () => {
  const defaultCamera: ArmillaryCameraState = { pitch: 25, yaw: 35, roll: 0 };

  const defaultOptions: UseArmillaryInteractionsOptions = {
    camera: defaultCamera,
    onCameraChange: vi.fn(),
    projectionMode: 'geocentric',
    morphLambda: 0.0,
    isFreeReteMode: false
  };

  beforeEach(() => {
    stateStore = {};
    stateCounter = 0;
    refStore = {};
    refCounter = 0;
    effectDepsStore = {};
    effectCounter = 0;
    cleanupsStore = {};
    stateModifiedInEffect = false;
    vi.clearAllMocks();
  });

  const renderHook = (opts: Partial<UseArmillaryInteractionsOptions> = {}) => {
    stateCounter = 0;
    refCounter = 0;
    effectCounter = 0;
    stateModifiedInEffect = false;
    let hook = useArmillaryInteractions({ ...defaultOptions, ...opts });
    // Re-run if state was modified during effect execution (simulating React re-render cycle)
    if (stateModifiedInEffect) {
      stateCounter = 0;
      refCounter = 0;
      effectCounter = 0;
      stateModifiedInEffect = false;
      hook = useArmillaryInteractions({ ...defaultOptions, ...opts });
    }
    return hook;
  };

  describe('Initialization and Projection Flags', () => {
    it('initializes with default zoom 1.0 and canonical viewBox "-150 -150 300 300"', () => {
      const hook = renderHook();
      expect(hook.zoom).toBe(1.0);
      expect(hook.viewBoxStr).toBe('-150 -150 300 300');
      expect(hook.hoveredStar).toBeNull();
      expect(hook.hoveredBead).toBeNull();
      expect(hook.hoveredMilestone).toBeNull();
      expect(hook.hoveredNode).toBeNull();
      expect(hook.isDraggingCamera).toBe(false);
      expect(hook.isDraggingRule).toBe(false);
      expect(hook.isDraggingRete).toBe(false);
      expect(hook.isDragging).toBe(false);
    });

    it('computes isOrbital, is3D, and isZoomable flags correctly for heliocentric 3D', () => {
      const hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.isOrbital).toBe(true);
      expect(hook.is3D).toBe(true);
      expect(hook.isZoomable).toBe(true);
    });

    it('computes isOrbital, is3D, and isZoomable flags correctly for geocentric 3D', () => {
      const hook = renderHook({ projectionMode: 'geocentric', morphLambda: 0.0 });
      expect(hook.isOrbital).toBe(false);
      expect(hook.is3D).toBe(true);
      expect(hook.isZoomable).toBe(true);
    });

    it('disables is3D and isZoomable in 2D stereographic astrolabe plate view', () => {
      const hook = renderHook({ projectionMode: 'stereographic', morphLambda: 1.0 });
      expect(hook.isOrbital).toBe(false);
      expect(hook.is3D).toBe(false);
      expect(hook.isZoomable).toBe(false);
    });
  });

  describe('Zoom Controls and viewBoxStr Formatting', () => {
    it('zooms in by 0.25 and computes scaled viewBox string', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      hook.zoomIn();

      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.25);
      // 150 / 1.25 = 120 -> "-120 -120 240 240"
      expect(hook.viewBoxStr).toBe('-120 -120 240 240');
    });

    it('clamps maximum zoom at 3.5', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      for (let i = 0; i < 15; i++) {
        hook.zoomIn();
      }
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(3.5);
    });

    it('zooms out by 0.25 and clamps minimum zoom at 0.75', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      hook.zoomOut();

      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(0.75);
      // 150 / 0.75 = 200 -> "-200 -200 400 400"
      expect(hook.viewBoxStr).toBe('-200 -200 400 400');

      // Attempt zooming out further
      hook.zoomOut();
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(0.75);
    });

    it('resets zoom to 1.0 with resetZoom()', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      hook.zoomIn();
      hook.zoomIn();
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.5);

      hook.resetZoom();
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.0);
      expect(hook.viewBoxStr).toBe('-150 -150 300 300');
    });

    it('automatically resets zoom to 1.0 when morphLambda exceeds 0.05', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      hook.zoomIn();
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.25);

      // Morph to 2D plates (lambda = 0.5)
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.5 });
      expect(hook.zoom).toBe(1.0);
      expect(hook.viewBoxStr).toBe('-150 -150 300 300');
    });

    it('automatically resets zoom to 1.0 when switching projectionMode away from heliocentric', () => {
      let hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      hook.zoomIn();
      hook = renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.25);

      // Switch to stereographic mode
      hook = renderHook({ projectionMode: 'stereographic', morphLambda: 0.0 });
      expect(hook.zoom).toBe(1.0);
    });
  });

  describe('Rule Angle Updates and Snapping', () => {
    it('uses controlledRuleAngle when provided', () => {
      const hook = renderHook({ controlledRuleAngle: 72 });
      expect(hook.ruleAngleDeg).toBe(72);
    });

    it('updates localRuleAngle and invokes onRuleAngleChange callback', () => {
      const onRuleAngleChange = vi.fn();
      let hook = renderHook({ onRuleAngleChange });
      expect(hook.ruleAngleDeg).toBe(0);

      hook.updateRuleAngle(135);
      hook = renderHook({ onRuleAngleChange });
      expect(hook.ruleAngleDeg).toBe(135);
      expect(onRuleAngleChange).toHaveBeenCalledWith(135);
    });

    it('computes sighting angle and invokes onSnapToTarget on handleTargetClick', () => {
      const onSnapToTarget = vi.fn();
      const onRuleAngleChange = vi.fn();
      let hook = renderHook({ onSnapToTarget, onRuleAngleChange });

      // Point at (x: 100, y: 0) -> angle = (atan2(0, 100) * 180 / PI + 90 + 360) % 360 = 90°
      hook.handleTargetClick('Spica', { x: 100, y: 0 });
      expect(onSnapToTarget).toHaveBeenCalledWith('Spica', 90);
      expect(onRuleAngleChange).toHaveBeenCalledWith(90);

      hook = renderHook({ onSnapToTarget, onRuleAngleChange });
      expect(hook.ruleAngleDeg).toBe(90);
    });
  });

  describe('Hover State Setters', () => {
    it('sets and retrieves hovered star telemetry', () => {
      let hook = renderHook();
      const star = {
        id: 'vega',
        name: 'Vega',
        bayer: 'α Lyr',
        constellation: 'Lyra',
        raDeg: 279.23,
        decDeg: 38.78,
        magnitude: 0.03,
        altDeg: 45,
        azDeg: 90,
        screenX: 42,
        screenY: -24
      };
      hook.setHoveredStar(star);

      hook = renderHook();
      expect(hook.hoveredStar).toEqual(star);
    });

    it('sets and retrieves hovered bead', () => {
      let hook = renderHook();
      hook.setHoveredBead('sun');

      hook = renderHook();
      expect(hook.hoveredBead).toBe('sun');
    });

    it('sets and retrieves hovered milestone', () => {
      let hook = renderHook();
      const milestone = {
        id: 'perihelion',
        label: 'Perihelion',
        date: 'Jan 3',
        color: '#f59e0b',
        textColor: '#ffffff',
        fillColor: '#b45309',
        p3d: { x: 0, y: 0, z: 0 },
        pCam: { x: 0, y: 0, z: 0 },
        screenPos: { x: 50, y: 50 },
        distanceAU: 0.983,
        distanceKm: 147098074,
        speedKms: 30.29,
        description: 'Closest approach to the Sun',
        isFront: true
      };
      hook.setHoveredMilestone(milestone);

      hook = renderHook();
      expect(hook.hoveredMilestone).toEqual(milestone);
    });

    it('sets and retrieves hovered lunar node', () => {
      let hook = renderHook();
      hook.setHoveredNode('asc');

      hook = renderHook();
      expect(hook.hoveredNode).toBe('asc');
    });
  });

  describe('Pointer Event Handlers', () => {
    it('handles rule pointer down and enables dragging rule', () => {
      let hook = renderHook();
      const mockPointerEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        pointerId: 1,
        currentTarget: {
          setPointerCapture: vi.fn()
        }
      } as unknown as React.PointerEvent<SVGElement>;

      hook.handlePointerDownRule(mockPointerEvent);
      expect(mockPointerEvent.preventDefault).toHaveBeenCalled();
      expect(mockPointerEvent.stopPropagation).toHaveBeenCalled();
      expect(mockPointerEvent.currentTarget.setPointerCapture).toHaveBeenCalledWith(1);

      hook = renderHook();
      expect(hook.isDraggingRule).toBe(true);
      expect(hook.isDragging).toBe(true);
    });

    it('handles 3D camera pointer down and clears hover states', () => {
      let hook = renderHook({ projectionMode: 'geocentric', morphLambda: 0.0 });
      hook.setHoveredStar({
        id: 'sirius',
        name: 'Sirius',
        bayer: 'α CMa',
        constellation: 'Canis Major',
        raDeg: 101.28,
        decDeg: -16.71,
        magnitude: -1.46,
        altDeg: 20,
        azDeg: 140,
        screenX: 0,
        screenY: 0
      });
      hook = renderHook({ projectionMode: 'geocentric', morphLambda: 0.0 });
      expect(hook.hoveredStar).not.toBeNull();

      const mockPointerEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        pointerId: 2,
        clientX: 100,
        clientY: 100,
        currentTarget: {
          setPointerCapture: vi.fn()
        }
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerDown(mockPointerEvent);
      hook = renderHook({ projectionMode: 'geocentric', morphLambda: 0.0 });

      expect(hook.isDraggingCamera).toBe(true);
      expect(hook.hoveredStar).toBeNull();
      expect(hook.hoveredBead).toBeNull();
    });

    it('handles 3D camera drag during handlePointerMove and updates camera pitch and yaw', () => {
      const onCameraChange = vi.fn();
      let hook = renderHook({
        camera: { pitch: 20, yaw: 40, roll: 0 },
        onCameraChange,
        projectionMode: 'geocentric',
        morphLambda: 0.0
      });

      const downEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        pointerId: 3,
        clientX: 200,
        clientY: 200,
        currentTarget: {
          setPointerCapture: vi.fn()
        }
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerDown(downEvent);

      hook = renderHook({
        camera: { pitch: 20, yaw: 40, roll: 0 },
        onCameraChange,
        projectionMode: 'geocentric',
        morphLambda: 0.0
      });

      const moveEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 250, // dx = +50 -> deltaYaw = 50 * 0.6 = +30 -> yaw = 70
        clientY: 150  // dy = -50 -> deltaPitch = -50 * 0.6 = -30 -> pitch = -10
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerMove(moveEvent);

      expect(onCameraChange).toHaveBeenCalledWith({
        pitch: -10,
        yaw: 70,
        roll: 0
      });
    });

    it('releases pointer capture and resets dragging states on handlePointerUp', () => {
      let hook = renderHook();
      hook.setIsDraggingRule(true);
      hook = renderHook();
      expect(hook.isDraggingRule).toBe(true);

      const upEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        pointerId: 4,
        currentTarget: {
          releasePointerCapture: vi.fn()
        }
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerUp(upEvent);
      expect(upEvent.currentTarget.releasePointerCapture).toHaveBeenCalledWith(4);

      hook = renderHook();
      expect(hook.isDraggingRule).toBe(false);
      expect(hook.isDraggingCamera).toBe(false);
      expect(hook.isDraggingRete).toBe(false);
      expect(hook.isDragging).toBe(false);
    });

    it('resets drag and hover states on handlePointerLeave', () => {
      let hook = renderHook();
      hook.setHoveredStar({
        id: 'deneb',
        name: 'Deneb',
        bayer: 'α Cyg',
        constellation: 'Cygnus',
        raDeg: 310,
        decDeg: 45,
        magnitude: 1.25,
        altDeg: 60,
        azDeg: 30,
        screenX: 0,
        screenY: 0
      });
      hook.setHoveredBead('sun');
      hook = renderHook();
      expect(hook.hoveredStar).not.toBeNull();
      expect(hook.hoveredBead).not.toBeNull();

      hook.handlePointerLeave();
      hook = renderHook();
      expect(hook.hoveredStar).toBeNull();
      expect(hook.hoveredBead).toBeNull();
      expect(hook.isDraggingCamera).toBe(false);
      expect(hook.isDraggingRule).toBe(false);
    });

    it('handles Free Rete mode drag and triggers onFreeReteRotate callback', () => {
      const onFreeReteRotate = vi.fn();

      // Mock svgRef bounding rect
      const mockSvgEl = {
        getBoundingClientRect: () => ({
          left: 100,
          top: 100,
          width: 200,
          height: 200
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      } as unknown as SVGSVGElement;

      // ref_1 corresponds to svgRef
      refStore['ref_1'] = { current: mockSvgEl };

      let hook = renderHook({
        isFreeReteMode: true,
        onFreeReteRotate
      });

      // Pointer down at center + 50px along +X (angle = 0°)
      const downEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        pointerId: 5,
        clientX: 250, // cx = 200, dx = 50, dist = 50 > 15
        clientY: 200, // cy = 200, dy = 0
        currentTarget: {
          setPointerCapture: vi.fn()
        }
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerDown(downEvent);
      hook = renderHook({ isFreeReteMode: true, onFreeReteRotate });
      expect(hook.isDraggingRete).toBe(true);

      // Pointer move to +Y (angle = 90°) -> delta = +90°
      const moveEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 200, // dx = 0
        clientY: 250  // dy = 50
      } as unknown as React.PointerEvent<SVGSVGElement>;

      hook.handlePointerMove(moveEvent);
      expect(onFreeReteRotate).toHaveBeenCalledWith(90);
    });
  });

  describe('Wheel Event Listener Lifecycle', () => {
    it('attaches native non-passive wheel listener on mount and cleans up on unmount', () => {
      const mockSvg = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      } as unknown as SVGSVGElement;

      // ref_1 is svgRef (ref_0 is dragStartRef)
      refStore['ref_1'] = { current: mockSvg };

      renderHook({ projectionMode: 'heliocentric', morphLambda: 0.0 });

      expect(mockSvg.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });

      // Clean up previous effects
      Object.values(cleanupsStore).forEach((c) => c?.());
      expect(mockSvg.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    });
  });
});
