import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Fault-tolerant React Error Boundary for Dashboard Windows.
 * Isolates runtime calculation and SVG rendering exceptions to individual widget cards,
 * preventing a local crash in one visualizer from unmounting the entire Observatory dashboard.
 */
export class WindowErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo
    });
    // Log error locally in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[WindowErrorBoundary: ${this.props.windowTitle || this.props.windowId || 'Widget'}]`, error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
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

          <p className="text-xs text-slate-400 max-w-sm mb-3">
            An isolated calculation or rendering error occurred. The rest of the Observatory dashboard remains fully operational.
          </p>

          <div className="text-[11px] font-mono text-rose-400/90 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 max-w-md truncate mb-4">
            {errorMessage}
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Module</span>
          </button>

          {this.state.error?.stack && (
            <details className="mt-4 text-left w-full max-w-md">
              <summary className="text-[10px] font-mono text-slate-500 hover:text-slate-400 cursor-pointer text-center">
                Show Stack Trace
              </summary>
              <pre className="mt-2 p-2 bg-slate-900 text-[9px] font-mono text-slate-400 rounded border border-slate-800 overflow-x-auto max-h-32">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default WindowErrorBoundary;
