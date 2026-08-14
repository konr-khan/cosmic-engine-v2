import React, { useState, useMemo } from 'react';
import { Sparkles, Layers, Eye, Compass, Calendar } from 'lucide-react';
import { calculateEclipseData, findUpcomingEclipses } from '../../utils/cosmicMath';
import {
  EclipseStatusBadge,
  ShadowRayDiagram,
  NodalPlaneVisualizer,
  SkyViewSimulator,
  EclipseScanner
} from './eclipse';

export const EclipseDemonstrator = ({ 
  currentDate = new Date(), 
  onDateChange, 
  onTimeChange,
  orbitalData 
}) => {
  const [activeTab, setActiveTab] = useState('geometry'); // 'geometry' | 'nodes' | 'sky' | 'scanner'
  const [diagramMode, setDiagramMode] = useState('live'); // 'live' | 'solar' | 'lunar'
  const [lunarViewSubTab, setLunarViewSubTab] = useState('pov'); // 'pov' | 'orbit'

  const eclipse = (orbitalData && orbitalData.eclipse) 
    ? orbitalData.eclipse 
    : calculateEclipseData(currentDate ? currentDate.getTime() / 86400000 + 2440587.5 : 2451545.0);

  // Discover upcoming eclipses from current date
  const upcomingEclipses = useMemo(() => {
    return findUpcomingEclipses(currentDate || new Date(), 4);
  }, [currentDate]);

  const handleSelectPreset = (presetDate) => {
    if (!onDateChange) return;
    onDateChange(new Date(presetDate));
    if (onTimeChange) {
      onTimeChange(18); // standard eclipse peak time around mid-day/dusk UTC
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 p-4 md:p-6 h-full flex flex-col justify-between select-none">
      {/* Header & Status Indicator */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-blue-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" /> Eclipse Mechanics & Shadow Geometry
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Umbra, Penumbra & 5.14° Lunar Orbital Plane Node Alignment Solver
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Badge */}
          <EclipseStatusBadge eclipse={eclipse} />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setActiveTab('geometry')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'geometry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Shadow Rays
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'nodes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> 5.14° Nodes
            </button>
            <button
              onClick={() => setActiveTab('sky')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'sky' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Sky View
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Scanner
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full flex-1 min-h-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-3">
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

      {/* Footer Spatial Context Readout */}
      <div className="mt-3 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Syzygy Phase: <strong className="text-amber-400">{(eclipse.phaseValue * 100).toFixed(1)}%</strong></span>
        <span>Ecliptic Lat β: <strong className="text-rose-400">{eclipse.beta}°</strong></span>
        <span>Alignment: <strong className="text-emerald-400">{eclipse.alignmentPercent}%</strong></span>
      </div>
    </div>
  );
};

export default EclipseDemonstrator;
