import React, { useState } from 'react';
import { useCosmicEngine } from './hooks/useCosmicEngine';
import { useChronometerStore, cosmicActions } from './store/cosmicStore';
import { useDashboardLayout, ICON_MAP, PRESET_LAYOUTS } from './hooks/useDashboardLayout';
import { ObsNavbar } from './components/layout/ObsNavbar';
import { OrbitalChronometer } from './components/layout/OrbitalChronometer';
import { DashboardWindow } from './components/layout/DashboardWindow';
import { 
  TodayHorizonView, 
  TerminatorMap, 
  SolarAlmanac, 
  MacroOrbitView, 
  MicroTideView, 
  LunarAlmanacCard, 
  EclipseDemonstrator 
} from './components/widgets';
import { getDayOfYear } from './utils/cosmicMath';

const selectObserverParams = (state: { date: Date; timeOfDay: number; latitude: number; longitude: number; useAnalemma: boolean }) => ({
  date: state.date,
  timeOfDay: state.timeOfDay,
  latitude: state.latitude,
  longitude: state.longitude,
  useAnalemma: state.useAnalemma
});

export interface MemoizedWidgetContentProps {
  id: string;
  hoverTime: number | null;
  setHoverTime: (time: number | null) => void;
  hoverDate: Date | null;
  setHoverDate: (date: Date | null) => void;
}

const MemoizedWidgetContent = React.memo<MemoizedWidgetContentProps>(function MemoizedWidgetContent({
  id,
  hoverTime,
  setHoverTime,
  hoverDate,
  setHoverDate
}) {
  const { date, timeOfDay, latitude, longitude, useAnalemma } = useChronometerStore(selectObserverParams);

  const { solarData, orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    useAnalemma,
    { [id]: true }
  );

  const dayOfYear = getDayOfYear(date);

  const handleDateSlider = (val: number) => {
    cosmicActions.setDate(new Date(date.getFullYear(), 0, val));
  };

  switch (id) {
    case 'today':
      return (
        <TodayHorizonView
          solarData={solarData}
          orbitalData={orbitalData}
          currentTime={timeOfDay}
          latitude={latitude}
          longitude={longitude}
          currentDate={date}
          hoverTime={hoverTime}
          onHoverTime={setHoverTime}
          onSetTime={cosmicActions.setTimeOfDay}
        />
      );
    case 'almanac':
      return (
        <SolarAlmanac 
          latitude={latitude} 
          longitude={longitude} 
          currentDay={dayOfYear} 
          onDayChange={handleDateSlider} 
          year={date.getFullYear()} 
          solarData={solarData}
          currentTime={timeOfDay}
          hoverTime={hoverTime}
          onHoverTime={setHoverTime}
        />
      );
    case 'lunarAlmanac':
      return (
        <LunarAlmanacCard 
          orbitalData={orbitalData} 
          onSetTime={cosmicActions.setTimeOfDay} 
          latitude={latitude}
          longitude={longitude}
          currentDay={dayOfYear}
          onDayChange={handleDateSlider}
          currentDate={date}
          hoverDate={hoverDate}
          onHoverDate={setHoverDate}
          hoverTime={hoverTime}
          onHoverTime={setHoverTime}
        />
      );
    case 'eclipse':
      return (
        <EclipseDemonstrator 
          currentDate={date} 
          onDateChange={cosmicActions.setDate} 
          onTimeChange={cosmicActions.setTimeOfDay} 
          orbitalData={orbitalData} 
          latitude={latitude}
          longitude={longitude}
          timeOfDay={timeOfDay}
        />
      );
    case 'map':
      return (
        <TerminatorMap 
          solarData={solarData} 
          orbitalData={orbitalData}
          latitude={latitude} 
          longitude={longitude} 
          timeOfDay={timeOfDay} 
          hoverTime={hoverTime}
          currentDate={date}
        />
      );
    case 'macroOrbit':
      return (
        <MacroOrbitView 
          positions={orbitalData?.positions} 
          eclipse={orbitalData?.eclipse} 
          solarData={solarData}
          currentDate={date}
        />
      );
    case 'microTides':
      return (
        <MicroTideView 
          tides={orbitalData?.tides} 
          angles={orbitalData?.angles} 
          userRotation={orbitalData?.userRotation}
          localTideStatus={orbitalData?.localTideStatus}
          hoverDate={hoverDate}
          phaseValue={orbitalData?.phase?.value}
        />
      );
    default:
      return null;
  }
});

export interface MemoizedChronometerDockProps {
  isDockCollapsed: boolean;
  onToggleCollapse: () => void;
}

const MemoizedChronometerDock = React.memo<MemoizedChronometerDockProps>(function MemoizedChronometerDock({
  isDockCollapsed,
  onToggleCollapse
}) {
  const { date, timeOfDay, latitude, longitude, useAnalemma } = useChronometerStore(selectObserverParams);

  const { solarData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    useAnalemma,
    { almanac: true }
  );

  return (
    <OrbitalChronometer 
      date={date}
      onDateChange={cosmicActions.setDate}
      timeOfDay={timeOfDay}
      onTimeChange={cosmicActions.setTimeOfDay}
      longitude={longitude}
      onLonChange={cosmicActions.setLongitude}
      latitude={latitude}
      onLatChange={cosmicActions.setLatitude}
      solarData={solarData}
      isCollapsed={isDockCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
});

export default function App() {
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Shared Cross-Card Interactive Hover Sync
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const {
    activePresetKey,
    widgets,
    windows,
    lockedWindows,
    isAllLocked,
    setIsAllLocked,
    toggleWidget,
    handleSelectPreset,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResize,
    handleToggleLock,
    handleResetLayout
  } = useDashboardLayout();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Observatory Brand & Control Navbar */}
      <ObsNavbar
        activePresetKey={activePresetKey}
        onSelectPreset={handleSelectPreset}
        widgets={widgets}
        onToggleWidget={toggleWidget}
        isAllLocked={isAllLocked}
        onToggleAllLocked={() => setIsAllLocked(!isAllLocked)}
        onResetLayout={handleResetLayout}
      />

      <div className="w-full max-w-[2800px] mx-auto p-4 md:p-6 2xl:px-10 space-y-6">
        <div className={`w-full max-w-[2800px] mx-auto ${isDockCollapsed ? 'pb-24' : 'pb-64'} transition-all duration-300`}>
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Render Windows Across Full 12-Column Panoramic Grid */}
            {windows.map((win) => {
              if (widgets[win.id] === false) return null;

              const defaultHeight = PRESET_LAYOUTS.master.windows.find(d => d.id === win.id)?.height || '420px';

              return (
                <DashboardWindow
                  key={win.id}
                  id={win.id}
                  title={win.title}
                  icon={ICON_MAP[win.id]}
                  colSpan={win.colSpan}
                  height={win.height}
                  isLocked={isAllLocked || !!lockedWindows[win.id]}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onResize={handleResize}
                  onToggleLock={handleToggleLock}
                  onResetSize={() => handleResize(win.id, 0, defaultHeight)}
                >
                  <MemoizedWidgetContent 
                    id={win.id}
                    hoverTime={hoverTime}
                    setHoverTime={setHoverTime}
                    hoverDate={hoverDate}
                    setHoverDate={setHoverDate}
                  />
                </DashboardWindow>
              );
            })}
          </div>
        </div>

        {/* Bottom-Pinned Astrolabe Control Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <MemoizedChronometerDock 
            isDockCollapsed={isDockCollapsed}
            onToggleCollapse={() => setIsDockCollapsed(!isDockCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}
