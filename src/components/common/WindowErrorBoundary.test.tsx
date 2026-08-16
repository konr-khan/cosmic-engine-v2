import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { WindowErrorBoundary } from './WindowErrorBoundary';

describe('WindowErrorBoundary Component Suite', () => {
  it('initializes with hasError: false', () => {
    const boundary = new WindowErrorBoundary({ windowTitle: 'Solar Almanac' });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(boundary.state.errorInfo).toBeNull();
  });

  it('updates state via getDerivedStateFromError when an error is caught', () => {
    const testError = new Error('WebGL context lost or 3D calculation error');
    const newState = WindowErrorBoundary.getDerivedStateFromError(testError);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(testError);
  });

  it('records errorInfo in componentDidCatch without throwing', () => {
    const boundary = new WindowErrorBoundary({ windowTitle: 'Eclipse Mechanics', windowId: 'eclipse' });
    boundary.setState = function(partial) {
      this.state = { ...this.state, ...partial };
    };
    const testError = new Error('Shadow ray projection failure');
    const errorInfo = { componentStack: '\n    in EclipseDemonstrator' };

    boundary.componentDidCatch(testError, errorInfo);
    expect(boundary.state.errorInfo).toBe(errorInfo);
  });

  it('resets error state and calls onReset callback when handleReset is triggered', () => {
    const onResetSpy = vi.fn();
    const boundary = new WindowErrorBoundary({ 
      windowTitle: 'Lunar Almanac', 
      onReset: onResetSpy 
    });

    boundary.setState = function(partial) {
      this.state = { ...this.state, ...partial };
    };

    // Simulate active error state
    boundary.state = {
      hasError: true,
      error: new Error('Tidal wave calculation error'),
      errorInfo: { componentStack: 'stack' }
    };

    boundary.handleReset();

    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(boundary.state.errorInfo).toBeNull();
    expect(onResetSpy).toHaveBeenCalledTimes(1);
  });

  it('renders children directly when hasError is false', () => {
    const children = <div id="test-child">Observatory Visualizer</div>;
    const boundary = new WindowErrorBoundary({ windowTitle: 'Sun Clock', children });

    const rendered = boundary.render();
    expect(rendered).toBe(children);
  });

  it('renders observatory fallback UI when hasError is true', () => {
    const boundary = new WindowErrorBoundary({ 
      windowTitle: 'Celestial Sphere', 
      windowId: 'celestialSphere',
      children: <div>Child Content</div> 
    });

    boundary.state = {
      hasError: true,
      error: new Error('Coordinate transform out of bounds'),
      errorInfo: null
    };

    const rendered = boundary.render() as React.ReactElement<{ className?: string }>;
    expect(rendered).not.toBeNull();
    expect(rendered.type).toBe('div');
    expect(rendered.props.className).toContain('bg-slate-950/90');
  });
});
