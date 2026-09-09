import React, { useState } from 'react';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { SunElevationDome } from './SunElevationDome';
import { MoonElevationDome } from './MoonElevationDome';
import { SunMeridianDome } from './SunMeridianDome';
import { MoonMeridianDome } from './MoonMeridianDome';

export interface TodayHorizonViewProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  currentTime?: number;
  latitude?: number;
  currentDate?: Date;
  hoverTime?: number | null;
  onSetTime?: (time: number) => void;
  initialDomeMode?: '2-dome' | '4-dome';
}

export const TodayHorizonView: React.FC<TodayHorizonViewProps> = ({
  solarData,
  orbitalData,
  currentTime = 12,
  latitude = 47.06,
  currentDate = new Date(),
  hoverTime,
  onSetTime,
  initialDomeMode = '2-dome',
}) => {
  const [domeMode, setDomeMode] = useState<'2-dome' | '4-dome'>(initialDomeMode);
  const [isTwilightMode, setIsTwilightMode] = useState(false);
  const [isNodalMode, setIsNodalMode] = useState(false);
  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none relative">
      {/* Top Inline Header with Segmented Mode View Toggle */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs text-slate-400 truncate">
            {domeMode === '2-dome'
              ? 'Instantaneous local sky dome elevations for Sun and Moon with astronomical metrics'
              : 'Quad-View: Diurnal elevation arcs paired with orthogonal celestial meridian profiles'}
          </p>
          {hoverTime !== null && hoverTime !== undefined && (
            <div className="bg-sky-950/90 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold shadow-md shrink-0">
              Scrubbing: {Math.floor(hoverTime).toString().padStart(2, '0')}:
              {Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
            </div>
          )}
        </div>

        {/* Segmented Mode View Toggle: 2-Dome Diurnal vs 4-Dome Quad */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={() => setDomeMode('2-dome')}
            aria-label="2-Dome Diurnal View"
            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${
              domeMode === '2-dome'
                ? 'bg-slate-800 text-amber-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2-Dome Diurnal
          </button>
          <button
            type="button"
            onClick={() => setDomeMode('4-dome')}
            aria-label="4-Dome Quad View"
            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-all ${
              domeMode === '4-dome'
                ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⊞ 4-Dome Quad
          </button>
        </div>
      </div>

      {/* Main Grid: 2-Dome Diurnal vs 4-Dome Quad Matrix */}
      {domeMode === '2-dome' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
          <SunElevationDome
            solarData={solarData}
            displayTime={displayTime}
            latitude={latitude}
            currentDate={currentDate}
            onSetTime={onSetTime}
            isTwilightMode={isTwilightMode}
            onToggleTwilight={() => setIsTwilightMode((prev) => !prev)}
            isQuadMode={false}
          />
          <MoonElevationDome
            orbitalData={orbitalData}
            solarData={solarData}
            displayTime={displayTime}
            latitude={latitude}
            currentDate={currentDate}
            onSetTime={onSetTime}
            isNodalMode={isNodalMode}
            onToggleNodal={() => setIsNodalMode((prev) => !prev)}
            isQuadMode={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch overflow-y-auto pr-1">
          {/* Left Column (Sun): Diurnal Elevation Arc + Meridian Profile */}
          <div className="flex flex-col gap-4">
            <SunElevationDome
              solarData={solarData}
              displayTime={displayTime}
              latitude={latitude}
              currentDate={currentDate}
              onSetTime={onSetTime}
              isTwilightMode={isTwilightMode}
              onToggleTwilight={() => setIsTwilightMode((prev) => !prev)}
              isQuadMode={true}
            />
            <SunMeridianDome
              solarData={solarData}
              displayTime={displayTime}
              latitude={latitude}
              currentDate={currentDate}
              onSetTime={onSetTime}
              isTwilightMode={isTwilightMode}
              onToggleTwilight={() => setIsTwilightMode((prev) => !prev)}
              hideFooter={true}
            />
          </div>

          {/* Right Column (Moon): Diurnal Elevation Arc + Meridian Profile */}
          <div className="flex flex-col gap-4">
            <MoonElevationDome
              orbitalData={orbitalData}
              solarData={solarData}
              displayTime={displayTime}
              latitude={latitude}
              currentDate={currentDate}
              onSetTime={onSetTime}
              isNodalMode={isNodalMode}
              onToggleNodal={() => setIsNodalMode((prev) => !prev)}
              isQuadMode={true}
            />
            <MoonMeridianDome
              orbitalData={orbitalData}
              solarData={solarData}
              displayTime={displayTime}
              latitude={latitude}
              currentDate={currentDate}
              onSetTime={onSetTime}
              isNodalMode={isNodalMode}
              onToggleNodal={() => setIsNodalMode((prev) => !prev)}
              hideFooter={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayHorizonView;

