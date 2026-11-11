import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { WindowErrorBoundary } from './WindowErrorBoundary';
import { WidgetSkeleton } from './WidgetSkeleton';
import { renderToStaticMarkup } from 'react-dom/server';

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
      windowTitle: 'Eclipse Mechanics', 
      windowId: 'eclipse',
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

  it('renders Reload Page button and dev server restart message on dynamic import errors', () => {
    const boundary = new WindowErrorBoundary({ 
      windowTitle: 'Eclipse Mechanics', 
      windowId: 'eclipse' 
    });

    boundary.state = {
      hasError: true,
      error: new Error('Failed to fetch dynamically imported module: http://localhost:5173/src/components/widgets/eclipse/EclipseDemonstrator.tsx'),
      errorInfo: null
    };

    const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
    expect(html).toContain('Reload Page');
    expect(html).toContain('Module bundle was interrupted or updated (dev server restart)');
    expect(html).toContain('Module ID: eclipse');
  });

  describe('WidgetSkeleton Suspense Fallback Primitive', () => {
    it('renders glassmorphic pulsing skeleton with default testid and animation', () => {
      const html = renderToStaticMarkup(<WidgetSkeleton id="armillary" />);
      expect(html).toContain('data-testid="window-skeleton-armillary"');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('animate-spin');
      expect(html).toContain('min-height:240px');
    });

    it('supports custom className and minHeight overrides', () => {
      const html = renderToStaticMarkup(
        <WidgetSkeleton className="custom-test-class" minHeight={320} />
      );
      expect(html).toContain('data-testid="window-skeleton"');
      expect(html).toContain('custom-test-class');
      expect(html).toContain('min-height:320px');
    });
  });
});
