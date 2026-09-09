import React, { useMemo } from 'react';
import { Moon, Compass } from 'lucide-react';
import { PhaseVisual } from '../../common/PhaseVisual';
import {
  formatTime,
  calculateCulminationBearing,
  calculateLunarExtremaCulminations,
  calculateMonthlyLunarDeclinationBounds,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
} from '../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { SkyDomeBase } from './SkyDomeBase';

export interface MoonMeridianDomeProps {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
}

export const MoonMeridianDome: React.FC<MoonMeridianDomeProps> = ({
  orbitalData,
  solarData: _solarData,
  displayTime: _displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime,
}) => {
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    transit: 12,
    declination: 0,
    parallacticAngle: 0,
  };
  const {
    transit = 12,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;

  // --- Culminations & Bearings ---
  const todayCulmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );

  // Major lunar standstill: 23.439° + 5.145° = 28.584°
  const LUNAR_MAX_DEC = 28.584;
  const absLat = Math.abs(latitude);
  const isLunarTropical = absLat <= LUNAR_MAX_DEC;

  const standstillMax = useMemo(
    () => calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [latitude]
  );
  const standstillMin = useMemo(
    () => calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [latitude]
  );

  // Monthly Declination Bounds over a rolling 30-day window (±15 days)
  const monthlyBounds = useMemo(
    () => calculateMonthlyLunarDeclinationBounds(currentDate),
    [currentDate]
  );

  const extremaCulminations = useMemo(
    () => calculateLunarExtremaCulminations(latitude, monthlyBounds.maxDec, monthlyBounds.minDec),
    [latitude, monthlyBounds.maxDec, monthlyBounds.minDec]
  );

  const monthMax = extremaCulminations.maxBound;
  const monthMin = extremaCulminations.minBound;

  // --- Meridian Coordinate Points ---
  const todayPoint = useMemo(
    () => calculateMeridianPoint(todayCulmination.altitude, todayCulmination.direction),
    [todayCulmination]
  );

  const standstillMaxPoint = useMemo(
    () => calculateMeridianPoint(standstillMax.altitude, standstillMax.direction),
    [standstillMax]
  );

  const standstillMinPoint = useMemo(
    () => calculateMeridianPoint(standstillMin.altitude, standstillMin.direction),
    [standstillMin]
  );

  const monthMaxPoint = useMemo(
    () => calculateMeridianPoint(monthMax.altitude, monthMax.direction),
    [monthMax]
  );

  const monthMinPoint = useMemo(
    () => calculateMeridianPoint(monthMin.altitude, monthMin.direction),
    [monthMin]
  );

  // --- Swath Arcs (along R=92 dome) ---
  const monthlySwathD = useMemo(
    () => generateMeridianSwathD(monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg),
    [monthMinPoint.thetaDeg, monthMaxPoint.thetaDeg]
  );

  const standstillSwathD = useMemo(
    () => generateMeridianSwathD(standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg),
    [standstillMinPoint.thetaDeg, standstillMaxPoint.thetaDeg]
  );

  // --- Perpendicular Radial Tick Pins ---
  const standstillMaxTick = useMemo(
    () => calculateMeridianRadialTick(standstillMaxPoint.thetaDeg, 85, 99),
    [standstillMaxPoint.thetaDeg]
  );

  const standstillMinTick = useMemo(
    () => calculateMeridianRadialTick(standstillMinPoint.thetaDeg, 85, 99),
    [standstillMinPoint.thetaDeg]
  );

  const monthMaxTick = useMemo(
    () => calculateMeridianRadialTick(monthMaxPoint.thetaDeg, 87, 97),
    [monthMaxPoint.thetaDeg]
  );

  const monthMinTick = useMemo(
    () => calculateMeridianRadialTick(monthMinPoint.thetaDeg, 87, 97),
    [monthMinPoint.thetaDeg]
  );

  // Standstill total range in declination: 2 * 28.584° = 57.17°
  const standstillSpanDeg = 2 * LUNAR_MAX_DEC;

  return (
    <SkyDomeBase
      title="Moon Meridian Profile"
      icon={Moon}
      iconColorClass="text-slate-300"
      peakLabel="Transit Peak"
      peakElevation={todayCulmination.altitude}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={todayCulmination.altitude}
      elevationColorClass="text-slate-200"
      elevationStatusSubtitle="Meridian Transit Culmination"
      leftHorizonLabel="S"
      centerHorizonLabel="Z"
      rightHorizonLabel="N"
      showZenithAxis={true}
      latitude={latitude}
      bodyX={todayPoint.x}
      bodyY={todayPoint.y}
      bodyVectorStroke="#818cf8"
      renderBodyGraphic={() => (
        <g
          id="active-lunar-transit-bead"
          transform={`translate(${todayPoint.x}, ${todayPoint.y})`}
          className="drop-shadow-md"
        >
          {/* Active Ping Glow */}
          <circle r="7" fill="#818cf8" fillOpacity="0.25" className="animate-ping" />

          {/* Dark Body Base Disc */}
          <circle cx="0" cy="0" r="5.5" fill="#020617" stroke="#334155" strokeWidth="0.75" />

          {/* Phase Illuminated Geometry */}
          <g transform={`rotate(${parallacticAngle || 0})`}>
            {(() => {
              const pVal = phase.value ?? 0;
              if (pVal > 0.48 && pVal < 0.52) {
                return <circle cx="0" cy="0" r="5.5" fill="#f8fafc" />;
              }
              if (pVal > 0.02 && pVal < 0.98) {
                const isWaxing = pVal < 0.5;
                const startY = isWaxing ? -5.5 : 5.5;
                const endY = isWaxing ? 5.5 : -5.5;
                const rxAbs = Math.abs(5.5 * Math.cos(pVal * 2 * Math.PI));
                let termSweep: number;
                if (isWaxing) {
                  termSweep = pVal < 0.25 ? 0 : 1;
                } else {
                  termSweep = pVal < 0.75 ? 1 : 0;
                }
                const d = `M 0,${startY} A 5.5,5.5 0 0,1 0,${endY} A ${rxAbs.toFixed(2)},5.5 0 0,${termSweep} 0,${startY}`;
                return <path d={d} fill="#f8fafc" />;
              }
              return null;
            })()}
          </g>

          {/* Outer Specular Rim */}
          <circle cx="0" cy="0" r="5.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.85" />
          <title>{`Today's Lunar Transit Culmination: ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag}`}</title>
        </g>
      )}
      extraSvgContent={
        <g className="meridian-lunar-geometry" id="meridian-lunar-geometry">
          {/* 18.6-Year Major Standstill Bounds Swath (Ghosted Indigo Arc) */}
          {standstillSwathD && (
            <path
              id="standstill-swath-guide"
              d={standstillSwathD}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              strokeOpacity="0.35"
            >
              <title>{`18.6-Year Major Standstill Range: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'} to ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`}</title>
            </path>
          )}

          {/* Monthly Declination Migration Highway Swath (Translucent Silver Arc) */}
          {monthlySwathD && (
            <>
              <path
                d={monthlySwathD}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="5"
                strokeOpacity="0.15"
                className="blur-[1px] pointer-events-none"
              />
              <path
                id="monthly-lunar-swath-core"
                d={monthlySwathD}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeOpacity="0.45"
              >
                <title>{`Monthly Lunar Transit Range: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'} to ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`}</title>
              </path>
            </>
          )}

          {/* Major Standstill Max Tick Pin */}
          <g id="standstill-max-tick">
            <line
              x1={standstillMaxTick.x1}
              y1={standstillMaxTick.y1}
              x2={standstillMaxTick.x2}
              y2={standstillMaxTick.y2}
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              strokeLinecap="round"
            />
            <title>{`Major Standstill Max: ${standstillMax.altitude.toFixed(1)}° ${standstillMax.shortTag}`}</title>
          </g>

          {/* Major Standstill Min Tick Pin */}
          <g id="standstill-min-tick">
            <line
              x1={standstillMinTick.x1}
              y1={standstillMinTick.y1}
              x2={standstillMinTick.x2}
              y2={standstillMinTick.y2}
              stroke="#6366f1"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              strokeLinecap="round"
            />
            <title>{`Major Standstill Min: ${standstillMin.altitude > 0 ? standstillMin.altitude.toFixed(1) + '° ' + standstillMin.shortTag : 'Below 0°'}`}</title>
          </g>

          {/* Monthly Max Culmination Tick Pin */}
          <g id="monthly-max-tick">
            <line
              x1={monthMaxTick.x1}
              y1={monthMaxTick.y1}
              x2={monthMaxTick.x2}
              y2={monthMaxTick.y2}
              stroke="#e2e8f0"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Monthly Max Transit Peak: ${monthMax.altitude.toFixed(1)}° ${monthMax.shortTag}`}</title>
          </g>

          {/* Monthly Min Culmination Tick Pin */}
          <g id="monthly-min-tick">
            <line
              x1={monthMinTick.x1}
              y1={monthMinTick.y1}
              x2={monthMinTick.x2}
              y2={monthMinTick.y2}
              stroke="#94a3b8"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Monthly Min Transit Peak: ${monthMin.altitude > 0 ? monthMin.altitude.toFixed(1) + '° ' + monthMin.shortTag : 'Below 0°'}`}</title>
          </g>
        </g>
      }
    >
      {/* Symmetrical Moon State Bar */}
      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center">
            <PhaseVisual phase={phase.value} size={52} parallacticAngle={parallacticAngle} />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">{phase.name}</div>
            <div className="text-[10px] text-slate-400 font-medium">Meridian Axis</div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Peak Altitude: <strong className="text-indigo-300 font-semibold">{todayCulmination.altitude.toFixed(1)}° {todayCulmination.shortTag}</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              isLunarTropical
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {isLunarTropical ? 'Tropical (Zenith Reach)' : 'Sub-Tropical Arc'}
            </span>
          </div>
        </div>
      </div>

      {/* Standstill Limits & Monthly Range Stats Strip */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-slate-400">Max Standstill:</span>
          <strong className="text-indigo-300 font-semibold">{standstillMax.altitude.toFixed(1)}° {standstillMax.shortTag}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          <span className="text-slate-400">Min Standstill:</span>
          <strong className="text-indigo-500 font-semibold">
            {standstillMin.altitude > 0 ? `${standstillMin.altitude.toFixed(1)}° ${standstillMin.shortTag}` : 'Below 0°'}
          </strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Monthly:</span>
          <strong className="text-slate-300 font-semibold">
            {monthMin.altitude.toFixed(1)}° ↔ {monthMax.altitude.toFixed(1)}°
          </strong>
        </div>
      </div>

      {/* Mirrored Footer Summary Badges: Standstill Span, Lunar Transit Snap Button, Declination, Profile Tag */}
      <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
        <div 
          className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
          title={`18.6-Year Standstill Range: Δδ = ${standstillSpanDeg.toFixed(1)}° between ±${LUNAR_MAX_DEC.toFixed(1)}°`}
        >
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Standstill Span</span>
          <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
            Δδ {standstillSpanDeg.toFixed(1)}°
          </span>
          <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
            18.6y Cycle
          </span>
        </div>
        <div 
          onClick={() => transit && onSetTime && onSetTime(transit)}
          className="text-center bg-indigo-950/60 hover:bg-indigo-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 shadow-sm flex flex-col justify-center min-w-0"
          title="Click to jump clock to Lunar Transit"
        >
          <span className="text-[7.5px] sm:text-[8px] text-indigo-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate">
            <Compass className="w-2.5 h-2.5 shrink-0" /> Lunar Transit
          </span>
          <span className="text-indigo-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">{formatTime(transit).substring(0, 5)} <span className="text-indigo-400/80 text-[9px] font-normal font-sans">UTC</span></span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Declination (δ)</span>
          <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${moonDeclination >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {moonDeclination >= 0 ? `+${(moonDeclination as number).toFixed(1)}°` : `${(moonDeclination as number).toFixed(1)}°`}
          </span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Profile Axis</span>
          <span className="text-indigo-400 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
            S ↔ Z ↔ N
          </span>
          <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
            Meridian
          </span>
        </div>
      </div>
    </SkyDomeBase>
  );
};

export default MoonMeridianDome;
