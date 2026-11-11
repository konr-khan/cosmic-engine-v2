import React, { ComponentType } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EclipseData } from '../../../types';

export interface EclipseStatusBadgeProps {
  eclipse?: EclipseData | null;
}

export const EclipseStatusBadge: React.FC<EclipseStatusBadgeProps> = ({ eclipse }) => {
  if (!eclipse) return null;

  const getStatusBadge = (): { bg: string; icon: ComponentType<{ className?: string }>; text: string } => {
    if (eclipse.type === 'TOTAL_SOLAR') {
      return { bg: 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-sm', icon: Sparkles, text: 'TOTAL SOLAR ECLIPSE' };
    }
    if (eclipse.type === 'ANNULAR_SOLAR') {
      return { bg: 'bg-orange-950/80 text-orange-300 border-orange-500/80 shadow-sm', icon: Sparkles, text: 'ANNULAR SOLAR ECLIPSE (Ring of Fire)' };
    }
    if (eclipse.type === 'PARTIAL_SOLAR') {
      return { bg: 'bg-amber-950/60 text-amber-200 border-amber-600/70 shadow-sm', icon: AlertTriangle, text: `PARTIAL SOLAR ECLIPSE (${eclipse.obscuration}%)` };
    }
    if (eclipse.type === 'TOTAL_LUNAR') {
      return { bg: 'bg-rose-950/80 text-rose-300 border-rose-500/80 shadow-sm', icon: Sparkles, text: 'TOTAL LUNAR ECLIPSE (Blood Moon)' };
    }
    if (eclipse.type === 'PARTIAL_LUNAR' || eclipse.type === 'PENUMBRAL_LUNAR') {
      return { bg: 'bg-rose-950/60 text-rose-200 border-rose-600/70 shadow-sm', icon: AlertTriangle, text: `${eclipse.label} (${eclipse.obscuration}%)` };
    }
    return { bg: 'bg-slate-900/80 text-slate-400 border-slate-800/80', icon: CheckCircle2, text: `NO ECLIPSE (Node Gap: ${eclipse.nodeProximityDeg}°)` };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 backdrop-blur-sm ${status.bg}`}>
      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
      <span>{status.text}</span>
    </div>
  );
};

export default EclipseStatusBadge;
