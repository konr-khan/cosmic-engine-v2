import React from 'react';

export interface WidgetSkeletonProps {
  id?: string;
  className?: string;
  minHeight?: number | string;
}

/**
 * Reusable dark glassmorphic skeleton loader for dynamically code-split observatory widgets.
 * Matches DashboardWindow dimensions and theme styling.
 */
export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  id, 
  className = '', 
  minHeight = '240px' 
}) => {
  return (
    <div 
      data-testid={id ? `window-skeleton-${id}` : 'window-skeleton'}
      className={`w-full h-full flex-1 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/60 p-6 animate-pulse ${className}`}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
        <div className="absolute w-2 h-2 rounded-full bg-indigo-400/60" />
      </div>
      <div className="h-3 w-28 bg-slate-800/80 rounded mb-2" />
      <div className="h-2 w-40 bg-slate-800/50 rounded" />
    </div>
  );
};

export default WidgetSkeleton;
