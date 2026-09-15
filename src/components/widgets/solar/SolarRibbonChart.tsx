import React, { useMemo } from 'react';
import { getDayOfYear } from '../../../utils/cosmicMath';
import { AnnualSolarMatrixItem } from '../../../types';
import { useRibbonScrubber } from '../common/useRibbonScrubber';
import { SolarRibbonAxes, SolarRibbonBands, SolarRibbonOverlay } from './ribbon';

export interface SolarRibbonChartProps {
  almanacData: AnnualSolarMatrixItem[];
  totalDays: number;
  activeDay: number;
  activeData: AnnualSolarMatrixItem;
  mirrorDayData: AnnualSolarMatrixItem | null;
  keyStats: {
    earliestSunrise: AnnualSolarMatrixItem;
    latestSunset: AnnualSolarMatrixItem;
  };
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  hoverDate?: Date | null;
  onHoverDate?: (date: Date | null) => void;
  onDayChange?: (day: number) => void;
  lonOffsetHours: number;
  eotOffsetHours: number;
  getDayLabel: (dayNum: number) => string;
  year?: number;
}

export const SolarRibbonChart: React.FC<SolarRibbonChartProps> = React.memo(({
  almanacData,
  totalDays,
  activeDay,
  activeData,
  mirrorDayData,
  keyStats,
  hoverTime,
  onHoverTime,
  hoverDate,
  onHoverDate,
  onDayChange,
  lonOffsetHours,
  eotOffsetHours,
  getDayLabel,
  year = 2026,
}) => {
  const width = 800;
  const height = 440;
  const paddingLeft = 55;
  const paddingRight = 65;
  const paddingTop = 30;
  const paddingBottom = 35;

  const {
    svgRef,
    isDragging,
    setIsDragging,
    hoverDay,
    setHoverDay,
    chartW,
    chartH,
    dayToX,
    timeToY,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useRibbonScrubber({
    width,
    height,
    padding: { left: paddingLeft, right: paddingRight, top: paddingTop, bottom: paddingBottom },
    totalDays,
    onScrub: ({ day, time }, e) => {
      if (onHoverDate) {
        const d = new Date(Date.UTC(year, 0, day, 12, 0, 0));
        onHoverDate(d);
      }

      // Calculate time from vertical Y position in Local Solar Time, then bridge to UTC
      if (onHoverTime) {
        const utcHoverTime = ((time - lonOffsetHours - eotOffsetHours) % 24 + 24) % 24;
        onHoverTime(parseFloat(utcHoverTime.toFixed(3)));
      }

      if ((isDragging || e.type === 'pointerdown') && onDayChange) {
        onDayChange(day);
      }
    },
    onScrubEnd: (endDay) => {
      if (endDay !== null && onDayChange) {
        onDayChange(endDay);
      }
    }
  });

  const buildBandPath = (topKey: keyof AnnualSolarMatrixItem, bottomKey: keyof AnnualSolarMatrixItem): string => {
    if (!almanacData.length) return '';
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][topKey] as number)}`;
    for (let i = 0; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][topKey] as number)}`;
    }
    for (let i = almanacData.length - 1; i >= 0; i--) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][bottomKey] as number)}`;
    }
    path += ` Z`;
    return path;
  };

  const buildLinePath = (key: keyof AnnualSolarMatrixItem): string => {
    if (!almanacData.length) return '';
    let path = `M ${dayToX(1)},${timeToY(almanacData[0][key] as number)}`;
    for (let i = 1; i < almanacData.length; i++) {
      path += ` L ${dayToX(almanacData[i].day)},${timeToY(almanacData[i][key] as number)}`;
    }
    return path;
  };

  const targetHoverDay = hoverDay !== null 
    ? hoverDay 
    : (hoverDate ? getDayOfYear(hoverDate) : null);

  const effectiveFocusDay = targetHoverDay ?? activeDay;
  const effectiveFocusData = (targetHoverDay && almanacData.length >= targetHoverDay)
    ? almanacData[targetHoverDay - 1]
    : activeData;

  const currentMirrorDayData = useMemo<AnnualSolarMatrixItem | null>(() => {
    if (!almanacData.length) return null;
    const targetLength = effectiveFocusData.dayLength;
    
    let bestDay: AnnualSolarMatrixItem | null = null;
    let minDiff = 999;
    
    for (let i = 0; i < almanacData.length; i++) {
      const d = almanacData[i];
      if (Math.abs(d.day - effectiveFocusDay) > 5 && Math.abs(d.day - effectiveFocusDay) < (totalDays - 5)) {
        const diff = Math.abs(d.dayLength - targetLength);
        if (diff < minDiff) {
          minDiff = diff;
          bestDay = d;
        }
      }
    }
    
    return bestDay ?? mirrorDayData;
  }, [almanacData, effectiveFocusDay, effectiveFocusData.dayLength, totalDays, mirrorDayData]);

  return (
    <div className="xl:col-span-8 2xl:col-span-8 relative w-full h-full min-h-[300px] touch-none flex items-center">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full block overflow-visible"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { 
          setIsDragging(false); 
          setHoverDay(null); 
          if (onHoverTime) onHoverTime(null); 
          if (onHoverDate) onHoverDate(null);
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        <SolarRibbonBands
          almanacData={almanacData}
          keyStats={keyStats}
          dayToX={dayToX}
          timeToY={timeToY}
          getDayLabel={getDayLabel}
          buildBandPath={buildBandPath}
          buildLinePath={buildLinePath}
          paddingLeft={paddingLeft}
          paddingTop={paddingTop}
          chartW={chartW}
          chartH={chartH}
        />
        <SolarRibbonAxes
          width={width}
          height={height}
          paddingLeft={paddingLeft}
          paddingTop={paddingTop}
          chartW={chartW}
          chartH={chartH}
          dayToX={dayToX}
          timeToY={timeToY}
        />
        <SolarRibbonOverlay
          width={width}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          chartW={chartW}
          chartH={chartH}
          activeDay={activeDay}
          activeData={activeData}
          hoverDay={hoverDay}
          hoverDate={hoverDate}
          hoverTime={hoverTime}
          almanacData={almanacData}
          currentMirrorDayData={currentMirrorDayData}
          lonOffsetHours={lonOffsetHours}
          eotOffsetHours={eotOffsetHours}
          dayToX={dayToX}
          timeToY={timeToY}
          getDayLabel={getDayLabel}
        />
      </svg>
    </div>
  );
});

SolarRibbonChart.displayName = 'SolarRibbonChart';

export default SolarRibbonChart;
