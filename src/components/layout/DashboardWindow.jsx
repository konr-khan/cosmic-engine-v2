import React, { useState, useRef } from 'react';
import { Move, Maximize2, Minimize2, Lock, Unlock, RefreshCw } from 'lucide-react';

export const DashboardWindow = ({ 
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
  const windowRef = useRef(null);

  // Resize Pointer Event Handler
  const handleResizePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked || !windowRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = windowRef.current.offsetWidth;
    const initialHeight = windowRef.current.offsetHeight;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.max(300, initialWidth + deltaX);
      const newHeight = Math.max(220, initialHeight + deltaY);

      if (onResize) {
        onResize(id, newWidth, newHeight);
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
    : `bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col transition-all ${
        colSpan === 12 
          ? 'col-span-12 2xl:col-span-6 3xl:col-span-6' 
          : (colSpan === 6 
              ? 'col-span-12 lg:col-span-6 2xl:col-span-4 3xl:col-span-3' 
              : 'col-span-12 lg:col-span-4 2xl:col-span-3 3xl:col-span-3')
      }`;

  return (
    <div 
      ref={windowRef}
      className={containerClasses}
      style={{ height: isMaximized ? 'calc(100vh - 2rem)' : (isMinimized ? 'auto' : height) }}
      draggable={!isLocked && !isMaximized}
      onDragStart={(e) => onDragStart && onDragStart(e, id)}
      onDragOver={(e) => onDragOver && onDragOver(e, id)}
      onDrop={(e) => onDrop && onDrop(e, id)}
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-slate-200 rounded-t-2xl select-none group">
        <div className="flex items-center gap-2">
          {!isLocked && !isMaximized && (
            <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-400 transition-colors p-0.5">
              <Move className="w-4 h-4" />
            </div>
          )}
          {(typeof Icon === 'function' || (typeof Icon === 'object' && Icon && Icon.$$typeof)) && <Icon className="w-4 h-4 text-indigo-400" />}
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center gap-1">
          {onToggleLock && (
            <button 
              onClick={() => onToggleLock(id)} 
              className={`p-1.5 rounded-lg transition-colors ${isLocked ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              title={isLocked ? "Unlock Window Position" : "Lock Window Position"}
              aria-label={isLocked ? "Unlock Window Position" : "Lock Window Position"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          {onResetSize && (
            <button 
              onClick={() => onResetSize(id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset Size"
              aria-label="Reset Size"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isMinimized ? "Expand Content" : "Minimize Content"}
            aria-label={isMinimized ? "Expand Content" : "Minimize Content"}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
            aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && (
        <div className="p-4 flex-1 overflow-auto relative flex flex-col">
          {children}

          {/* Bottom-Right Corner Resize Grip Handle */}
          {!isLocked && !isMaximized && (
            <div 
              onPointerDown={handleResizePointerDown}
              className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-indigo-400 transition-colors"
              title="Drag to resize window"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardWindow;
