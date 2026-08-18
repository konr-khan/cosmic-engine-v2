import React, { useState, useMemo } from 'react';
import { Layers, Eye, Compass, Calendar } from 'lucide-react';
import { calculateEclipseData, findUpcomingEclipses, getJulianDate } from '../../utils/cosmicMath';
import {
  EclipseStatusBadge,
  ShadowRayDiagram,
  NodalPlaneVisualizer,
  SkyViewSimulator,
  EclipseScanner
} from './eclipse';
import { OrbitalData, EclipseData } from '../../types';

export interface EclipseDemonstratorProps {
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onTimeChange?: (time: number) => void;
  orbitalData?: OrbitalData | null;
}

export const EclipseDemonstrator: React.FC<EclipseDemonstratorProps> = ({ 
  currentDate = new Date(), 
  onDateChange, 
  onTimeChange, 
  orbitalData 
}) => {
  const [activeTab, setActiveTab] = useState<'geometry' | 'nodes' | 'sky' | 'scanner'>('geometry');
  const [diagramMode, setDiagramMode] = useState<'live' | 'solar' | 'lunar'>('live');
  const [lunarViewSubTab, setLunarViewSubTab] = useState<'pov' | 'orbit'>('pov');

  const eclipse: EclipseData = (orbitalData && orbitalData.eclipse) 
    ? orbitalData.eclipse 
    : calculateEclipseData(currentDate ? getJulianDate(currentDate, 12) : 2451545.0);

  // Discover upcoming eclipses from current date
  const upcomingEclipses = useMemo(() => {
    return findUpcomingEclipses(currentDate || new Date(), 4);
  }, [currentDate]);

  const handleSelectPreset = (presetDate: Date) => {
    if (!onDateChange) return;
    onDateChange(new Date(presetDate));
    if (onTimeChange) {
      onTimeChange(18); // standard eclipse peak time around mid-day/dusk UTC
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Controls & Navigation Rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Umbra, Penumbra &amp; 5.14° Lunar Orbital Plane Node Alignment Solver
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Badge */}
          <EclipseStatusBadge eclipse={eclipse} />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-bold font-mono">
            <button
              onClick={() => setActiveTab('geometry')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'geometry' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Shadow Rays
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'nodes' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> 5.14° Nodes
            </button>
            <button
              onClick={() => setActiveTab('sky')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'sky' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Sky View
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full flex-1 min-h-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center p-3">
        {activeTab === 'geometry' && (
          <ShadowRayDiagram
            eclipse={eclipse}
            diagramMode={diagramMode}
            setDiagramMode={setDiagramMode}
            lunarViewSubTab={lunarViewSubTab}
            setLunarViewSubTab={setLunarViewSubTab}
          />
        )}
        {activeTab === 'nodes' && <NodalPlaneVisualizer eclipse={eclipse} />}
        {activeTab === 'sky' && <SkyViewSimulator eclipse={eclipse} />}
        {activeTab === 'scanner' && (
          <EclipseScanner
            currentDate={currentDate}
            upcomingEclipses={upcomingEclipses}
            onSelectPreset={handleSelectPreset}
          />
        )}
      </div>

      {/* Unified Glassmorphic Summary HUD Pill */}
      {(() => {
        const distKm = eclipse.distanceKm || 384000;
        const verticalMissKm = Math.round(distKm * Math.sin((eclipse.beta * Math.PI) / 180));
        const verticalMissStr = `${verticalMissKm > 0 ? '+' : ''}${verticalMissKm.toLocaleString()} km`;
        const nodeGapStr = `${(eclipse.nodeProximityDeg ?? Math.abs(eclipse.beta)).toFixed(1)}°`;

        return (
          <div className="mt-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 flex flex-wrap justify-between items-center text-xs font-mono text-slate-400 gap-2 shadow-sm">
            <span>Obscuration: <strong className={eclipse.obscuration > 0 ? "text-amber-400" : "text-slate-300"}>{eclipse.obscuration}%</strong></span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span>Node Gap: <strong className="text-rose-400">{nodeGapStr}</strong></span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span>Vertical Miss: <strong className={verticalMissKm === 0 ? "text-emerald-400" : (verticalMissKm > 0 ? "text-amber-400" : "text-indigo-400")}>{verticalMissStr}</strong></span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span>Alignment: <strong className="text-emerald-400">{eclipse.alignmentPercent}%</strong></span>
          </div>
        );
      })()}
    </div>
  );
};

export default EclipseDemonstrator;
