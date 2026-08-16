import React, { useState, useRef, ReactNode, ComponentType } from 'react';
import { Move, Maximize2, Minimize2, Lock, Unlock, RefreshCw } from 'lucide-react';
import { WindowErrorBoundary } from '../common/WindowErrorBoundary';

export interface DashboardWindowProps {
  id: string;
  title: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  colSpan?: number;
  height?: number | string;
  isLocked?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onResize?: (id: string, width: number, height: number | string) => void;
  onToggleLock?: (id: string) => void;
  onResetSize?: (id: string) => void;
}

export const DashboardWindow: React.FC<DashboardWindowProps> = ({ 
  id, 
  title, 
  icon: Icon, 
  children, 
  colSpan = 12, 
  height = 'auto', 
  isLocked = false,
  onDragStart, 
  onDragOver, 
  onDrop,
  onResize,
  onToggleLock,
  onResetSize
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  // Resize Pointer Event Handler
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked || !windowRef.current) return;

    const startY = e.clientY;
    const initialHeight = windowRef.current.offsetHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(220, initialHeight + deltaY);

      if (onResize) {
        onResize(id, 0, newHeight);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const containerClasses = isMaximized 
    ? "fixed inset-4 z-50 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col p-4 overflow-auto animate-in zoom-in-95 duration-200"
    : `bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col transition-all relative ${
        colSpan === 12 
          ? 'col-span-12 2xl:col-span-6 3xl:col-span-6' 
          : colSpan === 6 
          ? 'col-span-12 lg:col-span-6 3xl:col-span-3' 
          : colSpan === 4
          ? 'col-span-12 md:col-span-6 lg:col-span-4 3xl:col-span-2'
          : 'col-span-12'
      }`;

  return (
    <div 
      ref={windowRef}
      id={id}
      className={containerClasses}
      style={{ 
        height: isMinimized ? 'auto' : (typeof height === 'number' ? `${height}px` : height),
        minHeight: isMinimized ? 'auto' : '280px'
      }}
      draggable={!isLocked && !isMaximized}
      onDragStart={(e) => onDragStart && onDragStart(e, id)}
      onDragOver={(e) => onDragOver && onDragOver(e)}
      onDrop={(e) => onDrop && onDrop(e, id)}
    >
      {/* WINDOW HEADER BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 rounded-t-2xl select-none">
        <div className="flex items-center space-x-2.5">
          {!isLocked && (
            <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 -ml-1 rounded transition-colors" title="Drag to reorder card">
              <Move className="w-3.5 h-3.5" />
            </div>
          )}
          {Icon && <Icon className="w-4 h-4 text-indigo-400 shrink-0" />}
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-2">
            {title}
            {isLocked && <span className="text-[10px] font-normal text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">Locked</span>}
          </h3>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center space-x-1">
          {/* Reset Dimensions */}
          {onResetSize && !isLocked && (
            <button 
              onClick={() => onResetSize(id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset window size"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Lock */}
          {onToggleLock && (
            <button 
              onClick={() => onToggleLock(id)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isLocked ? 'text-amber-400 hover:text-amber-300 bg-amber-950/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isLocked ? "Unlock window arrangement" : "Lock window layout"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Minimize / Expand Body */}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMinimized ? "Expand window" : "Collapse window"}
          >
            <span className="text-xs font-bold leading-none select-none px-0.5">{isMinimized ? '+' : '−'}</span>
          </button>

          {/* Fullscreen Maximize */}
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMaximized ? "Restore view" : "Maximize view"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* WINDOW BODY */}
      {!isMinimized && (
        <div className="flex-1 p-3 overflow-hidden relative flex flex-col">
          <WindowErrorBoundary windowTitle={title} windowId={id}>
            {children}
          </WindowErrorBoundary>
        </div>
      )}

      {/* RESIZE HANDLE THUMB (BOTTOM-RIGHT) */}
      {!isLocked && !isMinimized && !isMaximized && (
        <div 
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 group touch-none z-20"
          title="Drag to resize card"
        >
          <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-500 group-hover:border-indigo-400 transition-colors rounded-br-sm" />
        </div>
      )}
    </div>
  );
};

export default DashboardWindow;
