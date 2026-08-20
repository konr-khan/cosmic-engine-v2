import React, { useState } from 'react';
import { EclipseData } from '../../../types';
import { getPhaseName, calculateLunarIllumination, calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';
import { ShadowRayHoverHud } from './ShadowRayHoverHud';
import { LiveSyzygyView } from './LiveSyzygyView';
import { SolarFocusView } from './SolarFocusView';
import { LunarSurfacePovView } from './LunarSurfacePovView';
import { SelenocentricOrbitView } from './SelenocentricOrbitView';

export interface ShadowRayDiagramProps {
  eclipse?: EclipseData | null;
  diagramMode?: 'live' | 'solar' | 'lunar';
  setDiagramMode?: (mode: 'live' | 'solar' | 'lunar') => void;
  lunarViewSubTab?: 'pov' | 'orbit';
  setLunarViewSubTab?: (tab: 'pov' | 'orbit') => void;
  currentDate?: Date;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
}

export const ShadowRayDiagram: React.FC<ShadowRayDiagramProps> = ({
  eclipse,
  diagramMode = 'live',
  setDiagramMode,
  lunarViewSubTab = 'pov',
  setLunarViewSubTab,
  currentDate = new Date(),
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12
}) => {
  const [hoveredEntity, setHoveredEntity] = useState<'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null>(null);
  if (!eclipse) return null;

  const solarPhysics = calculateEarthOrbitalPhysics(getJulianDate(currentDate, 12));
  const sunLambdaDeg = ((solarPhysics?.lambda ?? solarPhysics?.eclipticLongitude ?? 0) as number);

  const beta = eclipse.beta;
  const distKm = eclipse.distanceKm || 384000;
  const verticalOffsetKm = Math.round(distKm * Math.sin((beta * Math.PI) / 180));
  const phaseVal = eclipse.phaseValue || 0;
  const phaseDeg = Math.round(phaseVal * 360);
  const phaseName = getPhaseName(phaseVal);
  const illumPercent = calculateLunarIllumination(phaseVal);
  const penumbraRad = eclipse.penumbraRadiusKm || 9500;

  let shadowStatus = { 
    text: `Elongation: ${phaseDeg}° (${phaseName}) | Offset: ${verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : verticalOffsetKm.toLocaleString()} km`, 
    bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700' 
  };
  if (eclipse.isEclipseActive) {
    shadowStatus = { text: `✨ DIRECT ECLIPSE: ${eclipse.label}`, bg: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold' };
  } else if (Math.abs(verticalOffsetKm) > penumbraRad) {
    shadowStatus = { text: `💡 Shadow Miss: Moon passes ${verticalOffsetKm > 0 ? '+' : ''}${verticalOffsetKm.toLocaleString()} km ${verticalOffsetKm > 0 ? 'ABOVE' : 'BELOW'} Shadow Cone`, bg: 'bg-slate-900 text-slate-300 border-slate-700' };
  }

  return (
    <div className="w-full h-full flex flex-col justify-between relative">
      {/* Top Bar: Streamlined Mode Selector & Live Dynamic Offset Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-1 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-amber-400 font-sans text-xs flex items-center gap-1">
            Syzygy &amp; Shadow Rays
          </span>
          <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 gap-0.5 text-[10px]">
            <button
              onClick={() => setDiagramMode && setDiagramMode('live')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Orbit
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('solar')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'solar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solar
            </button>
            <button
              onClick={() => setDiagramMode && setDiagramMode('lunar')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                diagramMode === 'lunar' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lunar
            </button>
          </div>

          {/* Integrated inline sub-toggle when in Lunar Focus mode */}
          {diagramMode === 'lunar' && (
            <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80 gap-0.5 text-[10px]">
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('pov')}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'pov' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                POV
              </button>
              <button
                onClick={() => setLunarViewSubTab && setLunarViewSubTab('orbit')}
                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                  lunarViewSubTab === 'orbit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Orbit
              </button>
            </div>
          )}
        </div>

        {/* Live Shadow State Indicator */}
        {diagramMode !== 'lunar' && (
          <div className={`px-2 py-0.5 rounded-md border font-bold text-[9px] flex items-center gap-1 backdrop-blur-sm ${shadowStatus.bg}`}>
            <span>{shadowStatus.text}</span>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Hover HUD Overlay */}
      <ShadowRayHoverHud
        hoveredEntity={hoveredEntity}
        eclipse={eclipse}
        distKm={distKm}
        verticalOffsetKm={verticalOffsetKm}
        phaseDeg={phaseDeg}
        phaseName={phaseName}
        illumPercent={illumPercent}
        beta={beta}
      />

      {/* SVG Shadow Ray Diagram Viewport */}
      <svg viewBox="0 0 520 220" className="w-full h-full block flex-1 min-h-[220px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="umbraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="penumbraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="earthBloodRing" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#000000" stopOpacity="1" />
            <stop offset="90%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {diagramMode === 'live' && (
          <LiveSyzygyView
            eclipse={eclipse}
            latitude={latitude}
            longitude={longitude}
            timeOfDay={timeOfDay}
            sunLambdaDeg={sunLambdaDeg}
            setHoveredEntity={setHoveredEntity}
          />
        )}

        {diagramMode === 'solar' && (
          <SolarFocusView
            eclipse={eclipse}
            latitude={latitude}
            longitude={longitude}
            timeOfDay={timeOfDay}
            sunLambdaDeg={sunLambdaDeg}
            setHoveredEntity={setHoveredEntity}
          />
        )}

        {diagramMode === 'lunar' && (
          lunarViewSubTab === 'pov' ? (
            <LunarSurfacePovView eclipse={eclipse} />
          ) : (
            <SelenocentricOrbitView
              eclipse={eclipse}
              latitude={latitude}
              longitude={longitude}
              timeOfDay={timeOfDay}
              sunLambdaDeg={sunLambdaDeg}
            />
          )
        )}
      </svg>
    </div>
  );
};

export default ShadowRayDiagram;
