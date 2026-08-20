import React from 'react';
import { Sparkles } from 'lucide-react';
import { OrbitHeaderControlsProps } from './types';

export const OrbitHeaderControls: React.FC<OrbitHeaderControlsProps> = ({
  exaggerateEccentricity,
  onToggleEccentricity,
  isEclipse
}) => {
  return (
    <div className="flex justify-between items-center gap-2 mb-2">
      <p className="text-xs text-slate-400">
        Keplerian 1 AU orbital radius &amp; seasonal distance physics
      </p>

      <div className="flex items-center gap-2">
        {/* Mode Toggle Switch: True Scale vs Exaggerated e=0.25 */}
        <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-slate-800/90 text-xs font-mono">
          <button
            onClick={() => onToggleEccentricity(false)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              !exaggerateEccentricity 
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="True Physical Scale (e = 0.0167, circular heliocentric appearance)"
          >
            True (e=0.017)
          </button>
          <button
            onClick={() => onToggleEccentricity(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              exaggerateEccentricity 
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/60 font-semibold' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="Exaggerated Elliptical Scale (e = 0.25, demonstrating dual focal points and orbital asymmetry)"
          >
            Exaggerated (e=0.25)
          </button>
        </div>

        {isEclipse && (
          <div className="flex items-center gap-1 bg-amber-950/90 text-amber-300 border border-amber-500/70 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Syzygy Active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrbitHeaderControls;
