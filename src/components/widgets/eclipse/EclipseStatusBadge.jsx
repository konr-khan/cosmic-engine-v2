import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const EclipseStatusBadge = ({ eclipse }) => {
  if (!eclipse) return null;

  const getStatusBadge = () => {
    if (eclipse.type === 'TOTAL_SOLAR') {
      return { bg: 'bg-amber-950/90 text-amber-300 border-amber-500', icon: Sparkles, text: 'TOTAL SOLAR ECLIPSE' };
    }
    if (eclipse.type === 'ANNULAR_SOLAR') {
      return { bg: 'bg-orange-950/90 text-orange-300 border-orange-500', icon: Sparkles, text: 'ANNULAR SOLAR ECLIPSE (Ring of Fire)' };
    }
    if (eclipse.type === 'PARTIAL_SOLAR') {
      return { bg: 'bg-amber-900/50 text-amber-200 border-amber-600', icon: AlertTriangle, text: `PARTIAL SOLAR ECLIPSE (${eclipse.obscuration}%)` };
    }
    if (eclipse.type === 'TOTAL_LUNAR') {
      return { bg: 'bg-rose-950/90 text-rose-300 border-rose-500', icon: Sparkles, text: 'TOTAL LUNAR ECLIPSE (Blood Moon)' };
    }
    if (eclipse.type === 'PARTIAL_LUNAR' || eclipse.type === 'PENUMBRAL_LUNAR') {
      return { bg: 'bg-rose-900/50 text-rose-200 border-rose-600', icon: AlertTriangle, text: `${eclipse.label} (${eclipse.obscuration}%)` };
    }
    return { bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: CheckCircle2, text: `NO ECLIPSE (Node Gap: ${eclipse.nodeProximityDeg}°)` };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm ${status.bg}`}>
      <StatusIcon className="w-4 h-4" />
      <span>{status.text}</span>
    </div>
  );
};

export default EclipseStatusBadge;
