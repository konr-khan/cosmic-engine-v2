import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface WindowErrorBoundaryProps {
  children?: ReactNode;
  windowTitle?: string;
  windowId?: string;
  onReset?: () => void;
}

export interface WindowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Fault-tolerant React Error Boundary for Dashboard Windows.
 * Isolates runtime calculation and SVG rendering exceptions to individual widget cards,
 * preventing a local crash in one visualizer from unmounting the entire Observatory dashboard.
 */
export class WindowErrorBoundary extends Component<WindowErrorBoundaryProps, WindowErrorBoundaryState> {
  constructor(props: WindowErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WindowErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    });
    // Log error locally in development
    const isDev = typeof window !== 'undefined' && Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      console.error(`[WindowErrorBoundary: ${this.props.windowTitle || this.props.windowId || 'Widget'}]`, error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { windowTitle = 'Visualizer Module', windowId } = this.props;
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred in this module.';

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[220px] w-full p-6 text-center bg-slate-950/90 rounded-xl border border-rose-900/40 text-slate-300 select-none animate-in fade-in duration-200">
          <div className="p-3 bg-rose-950/60 rounded-2xl border border-rose-800/60 text-rose-400 mb-3 shadow-lg shadow-rose-950/40">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-slate-200 tracking-wide mb-1">
            {windowTitle} Offline
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4 line-clamp-2 leading-relaxed">
            {errorMessage}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-semibold text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Visualizer
            </button>
          </div>

          {windowId && (
            <span className="text-[10px] text-slate-600 font-mono mt-4">
              Module ID: {windowId}
            </span>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default WindowErrorBoundary;
