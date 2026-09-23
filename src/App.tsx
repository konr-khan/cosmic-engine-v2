import React, { useState, useEffect } from 'react';
import { useCosmicEngine } from './hooks/useCosmicEngine';
import { useChronometerStore, cosmicActions } from './store/cosmicStore';
import { useDashboardLayout, ICON_MAP, PRESET_LAYOUTS } from './hooks/useDashboardLayout';
import { ephemerisWorkerManager } from './workers/ephemerisWorkerManager';
import { ObsNavbar } from './components/layout/ObsNavbar';
import { OrbitalChronometer } from './components/layout/OrbitalChronometer';
import { DashboardWindow } from './components/layout/DashboardWindow';
// Dynamically code-split the 8 primary observatory widgets
const TodayHorizonView = React.lazy(() => import('./components/widgets/today/TodayHorizonView'));
const SolarAlmanac = React.lazy(() => import('./components/widgets/solar/SolarAlmanacCard'));
const LunarAlmanacCard = React.lazy(() => import('./components/widgets/lunar/LunarAlmanacCard'));
const EclipseDemonstrator = React.lazy(() => import('./components/widgets/eclipse/EclipseDemonstrator'));
const TerminatorMap = React.lazy(() => import('./components/widgets/terminator/TerminatorMap'));
const MacroOrbitView = React.lazy(() => import('./components/widgets/macro/MacroOrbitView'));
const GyroArmillaryView = React.lazy(() => import('./components/widgets/armillary/GyroArmillaryView'));
const MicroTideView = React.lazy(() => import('./components/widgets/tides/MicroTideView'));
import { getDayOfYear } from './utils/cosmicMath';
import { HoursDecimal } from './types/units';
import { CosmicStoreState } from './types/store';

const selectCalendarParams = (state: CosmicStoreState) => ({
  date: state.date,
  latitude: state.latitude,
  longitude: state.longitude
});

const selectRealtimeParams = (state: CosmicStoreState) => ({
  date: state.date,
  timeOfDay: state.timeOfDay,
  latitude: state.latitude,
  longitude: state.longitude
});

export interface MemoizedWidgetContentProps {
  id: string;
}

const MacroOrbitWidgetContent = React.memo(function MacroOrbitWidgetContent() {
  const { date, timeOfDay } = useChronometerStore(selectRealtimeParams);
  return <MacroOrbitView currentDate={date} currentTime={timeOfDay} />;
});

const LunarAlmanacWidgetContent = React.memo(function LunarAlmanacWidgetContent() {
  const { date, latitude, longitude } = useChronometerStore(selectCalendarParams);
  const { orbitalData } = useCosmicEngine(
    date,
    12 as HoursDecimal,
    latitude,
    longitude,
    { lunarAlmanac: true }
  );

  const dayOfYear = getDayOfYear(date);
  const handleDateSlider = (val: number) => {
    cosmicActions.setDate(new Date(Date.UTC(date.getUTCFullYear(), 0, val)));
  };

  return (
    <LunarAlmanacCard 
      orbitalData={orbitalData} 
      onSetTime={cosmicActions.setTimeOfDay} 
      latitude={latitude}
      longitude={longitude}
      currentDay={dayOfYear}
      onDayChange={handleDateSlider}
      currentDate={date}
    />
  );
});

const SolarAlmanacWidgetContent = React.memo(function SolarAlmanacWidgetContent() {
  const { date, latitude, longitude } = useChronometerStore(selectCalendarParams);
  const { solarData } = useCosmicEngine(
    date,
    12 as HoursDecimal,
    latitude,
    longitude,
    { almanac: true }
  );

  const dayOfYear = getDayOfYear(date);
  const handleDateSlider = (val: number) => {
    cosmicActions.setDate(new Date(Date.UTC(date.getUTCFullYear(), 0, val)));
  };

  return (
    <SolarAlmanac 
      latitude={latitude} 
      longitude={longitude} 
      currentDay={dayOfYear} 
      onDayChange={handleDateSlider} 
      year={date.getFullYear()} 
      solarData={solarData}
    />
  );
});

const TodayWidgetContent = React.memo(function TodayWidgetContent() {
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);
  const { solarData, orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    { today: true }
  );

  return (
    <TodayHorizonView
      solarData={solarData}
      orbitalData={orbitalData}
      currentTime={timeOfDay}
      latitude={latitude}
      longitude={longitude}
      currentDate={date}
      onSetTime={cosmicActions.setTimeOfDay}
    />
  );
});

const TerminatorWidgetContent = React.memo(function TerminatorWidgetContent() {
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);
  const { solarData, orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    { map: true }
  );

  return (
    <TerminatorMap 
      solarData={solarData} 
      orbitalData={orbitalData}
      latitude={latitude} 
      longitude={longitude} 
      timeOfDay={timeOfDay} 
      currentDate={date}
    />
  );
});

const ArmillaryWidgetContent = React.memo(function ArmillaryWidgetContent() {
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);
  const { solarData, orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    { armillary: true }
  );

  return (
    <GyroArmillaryView
      solarData={solarData}
      orbitalData={orbitalData}
      latitude={latitude}
      longitude={longitude}
      timeOfDay={timeOfDay}
      currentDate={date}
      onSetTime={cosmicActions.setTimeOfDay}
      onSetDate={cosmicActions.setDate}
    />
  );
});

const MicroTidesWidgetContent = React.memo(function MicroTidesWidgetContent() {
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);
  const { solarData, orbitalData, julianDate } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    { microTides: true }
  );

  return (
    <MicroTideView 
      tides={orbitalData?.tides} 
      angles={orbitalData?.angles} 
      localTideStatus={orbitalData?.localTideStatus}
      phaseValue={orbitalData?.phase?.value}
      latitude={latitude}
      longitude={longitude}
      timeOfDay={timeOfDay}
      sunLambdaDeg={solarData?.lambda}
      nodeLongitude={orbitalData?.angles?.nodeLongitude ?? orbitalData?.nodeLongitude}
      moonBetaDeg={orbitalData?.lunarPos?.beta}
      currentDate={date}
      julianDate={julianDate}
    />
  );
});

const EclipseWidgetContent = React.memo(function EclipseWidgetContent() {
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);
  const { orbitalData } = useCosmicEngine(
    date,
    timeOfDay,
    latitude,
    longitude,
    { eclipse: true }
  );

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
});

const MemoizedWidgetContent = React.memo<MemoizedWidgetContentProps>(function MemoizedWidgetContent({
  id
}) {
  switch (id) {
    case 'macroOrbit':
      return <MacroOrbitWidgetContent />;
    case 'lunarAlmanac':
      return <LunarAlmanacWidgetContent />;
    case 'almanac':
      return <SolarAlmanacWidgetContent />;
    case 'today':
      return <TodayWidgetContent />;
    case 'map':
      return <TerminatorWidgetContent />;
    case 'armillary':
      return <ArmillaryWidgetContent />;
    case 'microTides':
      return <MicroTidesWidgetContent />;
    case 'eclipse':
      return <EclipseWidgetContent />;
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
  const { date, timeOfDay, latitude, longitude } = useChronometerStore(selectRealtimeParams);

  const { solarData } = useCosmicEngine(
    date,
    12 as HoursDecimal,
    latitude,
    longitude,
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

  // Terminate singleton Web Worker instance on root component unmount / page teardown
  useEffect(() => {
    return () => {
      ephemerisWorkerManager.terminate();
    };
  }, []);

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
    handleToggleColSpan,
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
                  onToggleColSpan={handleToggleColSpan}
                  onResetSize={() => handleResize(win.id, 0, defaultHeight)}
                >
                  <MemoizedWidgetContent id={win.id} />
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
