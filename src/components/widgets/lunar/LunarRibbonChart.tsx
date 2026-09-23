import React, { useMemo, useCallback } from 'react';
import { formatTime, getDayOfYear, getPhaseName } from '../../../utils/cosmicMath';
import { AnnualLunarMatrixItem } from '../../../types';
import { useRibbonScrubber } from '../common/useRibbonScrubber';
import { LunarRibbonHud, LunarRibbonAxes, LunarRibbonCurves } from './ribbon';

export interface LunarRibbonChartProps {
  annualLunarData: AnnualLunarMatrixItem[];
  activeDay: number;
  totalDays: number;
  year: number;
  activeData: AnnualLunarMatrixItem;
  onDayChange?: (day: number) => void;
  hoverDate?: Date | null;
  onHoverDate?: (date: Date | null) => void;
  onHoverDayChange?: (day: number | null) => void;
  getDayLabel: (dayNum: number) => string;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  longitude?: number;
  timeMode?: 'utc' | 'local';
  onTimeModeChange?: (mode: 'utc' | 'local') => void;
  viewMode?: 'synodic' | 'annual';
  onViewModeChange?: (mode: 'synodic' | 'annual') => void;
}

export const LunarRibbonChart: React.FC<LunarRibbonChartProps> = React.memo(({
  annualLunarData,
  activeDay,
  totalDays,
  year,
  activeData,
  onDayChange,
  hoverDate,
  onHoverDate,
  onHoverDayChange,
  getDayLabel,
  hoverTime,
  onHoverTime,
  longitude = -122.81,
  timeMode = 'utc',
  onTimeModeChange,
  viewMode = 'synodic',
  onViewModeChange
}) => {
  const lonOffsetHours = longitude / 15;

  const ribbonWidth = 800;
  const ribbonHeight = 220;
  const padLeft = 55;
  const padRight = 65;
  const padTop = 20;
  const padBottom = 30;

  const isSynodic = viewMode === 'synodic';
  const span = 30;
  const halfSpan = 15;

  let startDay = 1;
  let endDay = totalDays;

  if (isSynodic) {
    startDay = Math.max(1, activeDay - halfSpan);
    endDay = Math.min(totalDays, activeDay + halfSpan);
    if (endDay - startDay < span) {
      if (startDay === 1) {
        endDay = Math.min(totalDays, 1 + span);
      } else if (endDay === totalDays) {
        startDay = Math.max(1, totalDays - span);
      }
    }
  }

  const {
    svgRef,
    isDragging,
    setIsDragging,
    hoverDay,
    setHoverDay,
    chartW,
    chartH,
    dayToX,
    xToDay,
    timeToY,
    getSvgCoordinates,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useRibbonScrubber({
    width: ribbonWidth,
    height: ribbonHeight,
    padding: { left: padLeft, right: padRight, top: padTop, bottom: padBottom },
    totalDays,
    startDay: isSynodic ? startDay : 1,
    endDay: isSynodic ? endDay : totalDays,
    onScrub: ({ day, time }, e) => {
      if (onHoverDayChange) onHoverDayChange(day);

      // In 365-Day Annual Mode, broadcast hoverDate across the year and allow horizontal drag-scrubbing.
      // In 30-Day Synodic Mode, date dragging is disabled to prevent dynamic window shifting.
      // Single clicking on a day still jumps to that day via onClick on the SVG.
      if (!isSynodic) {
        if (onHoverDate) {
          const d = new Date(Date.UTC(year, 0, day, 12, 0, 0));
          onHoverDate(d);
        }

        if ((isDragging || e.type === 'pointerdown') && onDayChange) {
          onDayChange(day);
        }
      }

      // Synchronized vertical hover time guideline operates across both Synodic and Annual modes
      if (onHoverTime) {
        const utcTime = timeMode === 'utc' 
          ? time 
          : ((time - lonOffsetHours) % 24 + 24) % 24;
        onHoverTime(parseFloat(utcTime.toFixed(3)));
      }
    },
    onScrubEnd: (endDayVal) => {
      if (!isSynodic && endDayVal !== null && onDayChange) {
        onDayChange(endDayVal);
      }
    }
  });

  const transformTime = useCallback((time: number | null | undefined): number | null => {
    if (time === null || time === undefined) return null;
    if (timeMode === 'utc') return time;
    return ((time + lonOffsetHours) % 24 + 24) % 24;
  }, [timeMode, lonOffsetHours]);

  const activeMoonrise = transformTime(activeData.moonrise);
  const activeMoonset = transformTime(activeData.moonset);
  const activeRiseY = activeMoonrise !== null ? timeToY(activeMoonrise) : null;
  const activeSetY = activeMoonset !== null ? timeToY(activeMoonset) : null;

  const visibleDays = useMemo(() => {
    if (!isSynodic) return annualLunarData;
    return annualLunarData.filter(d => d.day >= startDay && d.day <= endDay);
  }, [annualLunarData, isSynodic, startDay, endDay]);

  const targetHoverDay = hoverDay !== null
    ? hoverDay
    : (hoverDate ? getDayOfYear(hoverDate) : null);
  const hoverData = targetHoverDay && annualLunarData.length >= targetHoverDay
    ? annualLunarData[targetHoverDay - 1]
    : null;

  const displayData = hoverData ?? activeData;
  const isCircumpolarUp = displayData.polarState === 'circumpolar_up' || (displayData.moonrise === 0 && displayData.moonset === 24);
  const isCircumpolarDown = displayData.polarState === 'circumpolar_down' || (displayData.moonrise === null && displayData.moonset === null);

  const displayRiseT = transformTime(displayData.moonrise);
  const displaySetT = transformTime(displayData.moonset);
  const displayRiseStr = isCircumpolarUp
    ? '24h Up'
    : (isCircumpolarDown ? 'Down All Day' : (displayRiseT !== null ? formatTime(displayRiseT).substring(0, 5) : 'No Rise'));
  const displaySetStr = isCircumpolarUp
    ? '24h Up'
    : (isCircumpolarDown ? 'Down All Day' : (displaySetT !== null ? formatTime(displaySetT).substring(0, 5) : 'No Set'));
  const displayTransitT = transformTime(displayData.transit);
  const displayTransitStr = displayTransitT !== null ? formatTime(displayTransitT).substring(0, 5) : '--:--';
  const displayPhasePct = Math.round(displayData.phaseValue * 100);
  const displayPhaseName = getPhaseName(displayData.phaseValue);

  // Generate Braided Ribbon Curves for Moonrise and Moonset
  const moonrisePathD = useMemo(() => {
    if (!visibleDays.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < visibleDays.length; i++) {
      const d = visibleDays[i];
      const t = transformTime(d.moonrise);
      if (t !== null && t !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(t);
        if (!isDrawing) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          isDrawing = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    }
    return path;
  }, [visibleDays, dayToX, transformTime]);

  const moonsetPathD = useMemo(() => {
    if (!visibleDays.length) return '';
    let path = '';
    let isDrawing = false;
    for (let i = 0; i < visibleDays.length; i++) {
      const d = visibleDays[i];
      const t = transformTime(d.moonset);
      if (t !== null && t !== undefined) {
        const x = dayToX(d.day);
        const y = timeToY(t);
        if (!isDrawing) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          isDrawing = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    }
    return path;
  }, [visibleDays, dayToX, transformTime]);

  return (
    <div className="relative w-full bg-slate-950/60 rounded-xl border border-slate-800/60 p-3 my-1 touch-none">
      <LunarRibbonHud
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        timeMode={timeMode}
        onTimeModeChange={onTimeModeChange}
        isSynodic={isSynodic}
        hoverData={hoverData}
        displayData={displayData}
        getDayLabel={getDayLabel}
        displayPhaseName={displayPhaseName}
        displayPhasePct={displayPhasePct}
        isCircumpolarUp={isCircumpolarUp}
        isCircumpolarDown={isCircumpolarDown}
        displayRiseStr={displayRiseStr}
        displaySetStr={displaySetStr}
        displayTransitT={displayTransitT}
        displayTransitStr={displayTransitStr}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
        className="w-full h-[200px] block overflow-visible cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          const { svgX } = getSvgCoordinates(e);
          const day = xToDay(svgX);
          if (onDayChange) onDayChange(day);
        }}
        onPointerLeave={() => { 
          setIsDragging(false); 
          setHoverDay(null); 
          if (onHoverDayChange) onHoverDayChange(null);
          if (onHoverDate) onHoverDate(null); 
          if (onHoverTime) onHoverTime(null); 
        }}
      >
        <LunarRibbonAxes
          chartW={chartW}
          chartH={chartH}
          padLeft={padLeft}
          padTop={padTop}
          ribbonHeight={ribbonHeight}
          isSynodic={isSynodic}
          activeDay={activeDay}
          startDay={startDay}
          endDay={endDay}
          year={year}
          visibleDays={visibleDays}
          dayToX={dayToX}
          timeToY={timeToY}
          getDayLabel={getDayLabel}
          timeMode={timeMode}
          targetHoverDay={targetHoverDay}
        />

        <LunarRibbonCurves
          chartW={chartW}
          chartH={chartH}
          padLeft={padLeft}
          padRight={padRight}
          padTop={padTop}
          ribbonWidth={ribbonWidth}
          isSynodic={isSynodic}
          visibleDays={visibleDays}
          activeDay={activeDay}
          activeMoonrise={activeMoonrise}
          activeMoonset={activeMoonset}
          activeRiseY={activeRiseY}
          activeSetY={activeSetY}
          hoverData={hoverData}
          targetHoverDay={targetHoverDay}
          hoverTime={hoverTime}
          timeMode={timeMode}
          lonOffsetHours={lonOffsetHours}
          dayToX={dayToX}
          timeToY={timeToY}
          transformTime={transformTime}
          getDayLabel={getDayLabel}
          moonrisePathD={moonrisePathD}
          moonsetPathD={moonsetPathD}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 px-1 border-t border-slate-800/60 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-sky-400 inline-block rounded-sm" /> Moonrise Path
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-indigo-400 inline-block rounded-sm" /> Moonset Path
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded-sm" /> Supermoon (Perigee)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-white inline-block rounded-sm" /> Full Moon
          </span>
        </div>
        <span className="text-slate-400 font-medium">Selected: {getDayLabel(activeDay)}</span>
      </div>
    </div>
  );
});

LunarRibbonChart.displayName = 'LunarRibbonChart';

export default LunarRibbonChart;
