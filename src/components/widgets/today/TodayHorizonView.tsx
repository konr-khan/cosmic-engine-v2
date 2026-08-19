import React from 'react';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { SunElevationDome } from './SunElevationDome';
import { MoonElevationDome } from './MoonElevationDome';

export interface TodayHorizonViewProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  currentTime?: number;
  latitude?: number;
  longitude?: number;
  currentDate?: Date;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
  onSetTime?: (time: number) => void;
}

export const TodayHorizonView: React.FC<TodayHorizonViewProps> = ({
  solarData,
  orbitalData,
  currentTime = 12,
  latitude = 47.06,
  longitude = -122.81,
  currentDate = new Date(),
  hoverTime,
  onHoverTime,
  onSetTime,
}) => {
  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none relative">
      {/* Top Inline Header */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Instantaneous local sky dome elevations for Sun and Moon with astronomical metrics
        </p>
        {hoverTime !== null && hoverTime !== undefined && (
          <div className="bg-sky-950/90 text-sky-300 border border-sky-500/80 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold shadow-md">
            Scrubbing: {Math.floor(hoverTime).toString().padStart(2, '0')}:
            {Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}Z
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Sun Elevation Dome (Left) & Moon Elevation Dome (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
        <SunElevationDome
          solarData={solarData}
          displayTime={displayTime}
          latitude={latitude}
          currentDate={currentDate}
          onSetTime={onSetTime}
        />
        <MoonElevationDome
          orbitalData={orbitalData}
          displayTime={displayTime}
          latitude={latitude}
          onSetTime={onSetTime}
        />
      </div>
    </div>
  );
};

export default TodayHorizonView;
