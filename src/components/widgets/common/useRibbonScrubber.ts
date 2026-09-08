/**
 * @file useRibbonScrubber.ts
 * Reusable React hook for managing 2D SVG canvas coordinate scaling, bidirectional day/time
 * projections, and pointer scrubbing across Observatory ribbon charts (Solar & Lunar).
 */

import { useRef, useState, useCallback, useMemo } from 'react';

export interface RibbonPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UseRibbonScrubberOptions {
  /** Total SVG canvas width in user units (e.g., 800) */
  width: number;
  /** Total SVG canvas height in user units (e.g., 440 or 220) */
  height: number;
  /** Margin padding configuration */
  padding: RibbonPadding;
  /** Total number of days in the current calendar year (365 or 366) */
  totalDays: number;
  /** Optional custom start day for sub-window ranges (e.g. 30-day synodic view). Default: 1 */
  startDay?: number;
  /** Optional custom end day for sub-window ranges. Default: totalDays */
  endDay?: number;
  /** Active day number to highlight/scrub */
  activeDay?: number;
  /** Callback fired during pointerdown / pointermove scrubbing */
  onScrub?: (
    coords: { day: number; time: number; svgX: number; svgY: number },
    e: React.PointerEvent<SVGSVGElement>
  ) => void;
  /** Callback fired on pointerup when dragging finishes */
  onScrubEnd?: (day: number | null) => void;
}

export interface UseRibbonScrubberReturn {
  svgRef: React.RefObject<SVGSVGElement | null>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  hoverDay: number | null;
  setHoverDay: React.Dispatch<React.SetStateAction<number | null>>;
  chartW: number;
  chartH: number;
  effectiveStartDay: number;
  effectiveEndDay: number;
  dayToX: (day: number) => number;
  xToDay: (x: number) => number;
  timeToY: (timeHours: number) => number;
  yToTime: (y: number) => number;
  getSvgCoordinates: (
    e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>
  ) => { svgX: number; svgY: number };
  handlePointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
}

export function useRibbonScrubber({
  width,
  height,
  padding,
  totalDays,
  startDay = 1,
  endDay,
  onScrub,
  onScrubEnd
}: UseRibbonScrubberOptions): UseRibbonScrubberReturn {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const chartW = useMemo(() => {
    return Math.max(1, width - padding.left - padding.right);
  }, [width, padding.left, padding.right]);

  const chartH = useMemo(() => {
    return Math.max(1, height - padding.top - padding.bottom);
  }, [height, padding.top, padding.bottom]);

  const effectiveStartDay = startDay;
  const effectiveEndDay = endDay !== undefined ? endDay : totalDays;
  const daySpan = Math.max(1, effectiveEndDay - effectiveStartDay);

  // 1. DAY <-> X Coordinate Scaling
  const dayToX = useCallback(
    (day: number): number => {
      const fraction = (day - effectiveStartDay) / daySpan;
      return padding.left + fraction * chartW;
    },
    [effectiveStartDay, daySpan, padding.left, chartW]
  );

  const xToDay = useCallback(
    (x: number): number => {
      const fraction = (x - padding.left) / chartW;
      const rawDay = effectiveStartDay + fraction * daySpan;
      return Math.max(effectiveStartDay, Math.min(effectiveEndDay, Math.round(rawDay)));
    },
    [padding.left, chartW, effectiveStartDay, effectiveEndDay, daySpan]
  );

  // 2. TIME <-> Y Coordinate Scaling (0h = Bottom, 24h = Top)
  const timeToY = useCallback(
    (timeHours: number): number => {
      const clamped = Math.max(0, Math.min(24, timeHours));
      return padding.top + chartH - (clamped / 24) * chartH;
    },
    [padding.top, chartH]
  );

  const yToTime = useCallback(
    (y: number): number => {
      const relY = y - padding.top;
      const clampedRelY = Math.max(0, Math.min(chartH, relY));
      return ((chartH - clampedRelY) / chartH) * 24;
    },
    [padding.top, chartH]
  );

  // 3. Screen client coordinates to SVG user coordinates transform
  const getSvgCoordinates = useCallback(
    (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>): { svgX: number; svgY: number } => {
      if (!svgRef.current) return { svgX: 0, svgY: 0 };
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return { svgX: transformed.x, svgY: transformed.y };
      }
      const rect = svgRef.current.getBoundingClientRect();
      return {
        svgX: ((e.clientX - rect.left) / rect.width) * width,
        svgY: ((e.clientY - rect.top) / rect.height) * height
      };
    },
    [width, height]
  );

  // 4. Unified Pointer Event Handlers
  const handlePointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const { svgX, svgY } = getSvgCoordinates(e);
      const day = xToDay(svgX);
      const time = yToTime(svgY);

      setHoverDay(day);

      if (onScrub) {
        onScrub({ day, time, svgX, svgY }, e);
      }
    },
    [getSvgCoordinates, xToDay, yToTime, onScrub]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      setIsDragging(true);
      handlePointer(e);
      if (svgRef.current) {
        try {
          svgRef.current.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if pointer capture is not supported
        }
      }
    },
    [handlePointer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      handlePointer(e);
    },
    [handlePointer]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      setIsDragging(false);
      if (onScrubEnd) {
        onScrubEnd(hoverDay);
      }
      if (svgRef.current) {
        try {
          svgRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore if pointer capture was already released
        }
      }
    },
    [hoverDay, onScrubEnd]
  );

  return {
    svgRef,
    isDragging,
    setIsDragging,
    hoverDay,
    setHoverDay,
    chartW,
    chartH,
    effectiveStartDay,
    effectiveEndDay,
    dayToX,
    xToDay,
    timeToY,
    yToTime,
    getSvgCoordinates,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}
