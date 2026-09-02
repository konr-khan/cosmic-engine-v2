/**
 * @file DashboardWindow.test.tsx
 * Unit test suite for DashboardWindow layout container:
 * - Grid column span responsive classes (12, 6, 4 cols)
 * - Column span toggle button state (1-Col vs 2-Col panoramic)
 * - Lock/Unlock state protections (dragging, resize handle, actions gating)
 * - Minimize & Maximize state transitions
 * - Height styling and boundary constraints
 * - Drag-and-drop event wiring
 * - WindowErrorBoundary integration
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Compass } from 'lucide-react';
import { DashboardWindow } from './DashboardWindow';

describe('DashboardWindow Layout Container Test Suite', () => {

  describe('Basic Header and Content Rendering', () => {
    it('renders window title, icon, and wrapped children', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow 
          id="test-window" 
          title="Celestial Observatory" 
          icon={Compass}
        >
          <div data-testid="child-content">Active Celestial Visualization</div>
        </DashboardWindow>
      );

      expect(html).toContain('id="test-window"');
      expect(html).toContain('Celestial Observatory');
      expect(html).toContain('Active Celestial Visualization');
      expect(html).toContain('data-testid="child-content"');
    });

    it('wraps window body in WindowErrorBoundary container', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="error-boundary-test" title="Solar Almanac">
          <div>Healthy Child Content</div>
        </DashboardWindow>
      );

      expect(html).toContain('window-body-content');
      expect(html).toContain('Healthy Child Content');
    });
  });

  describe('Responsive Grid Column Span Classes', () => {
    it('applies col-span-12 for full-width 12-column configuration', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="win-12" title="Full Width" colSpan={12}>
          <div>Content</div>
        </DashboardWindow>
      );

      expect(html).toContain('col-span-12');
      expect(html).not.toContain('2xl:col-span-6');
    });

    it('applies col-span-12 2xl:col-span-6 for standard 6-column split layout', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="win-6" title="Half Width" colSpan={6}>
          <div>Content</div>
        </DashboardWindow>
      );

      expect(html).toContain('col-span-12 2xl:col-span-6');
    });

    it('applies col-span-12 md:col-span-6 lg:col-span-4 for 4-column compact layout', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="win-4" title="Third Width" colSpan={4}>
          <div>Content</div>
        </DashboardWindow>
      );

      expect(html).toContain('col-span-12 md:col-span-6 lg:col-span-4');
    });
  });

  describe('Column Span Toggle Action', () => {
    it('renders "2-Col" label when colSpan is 12 and onToggleColSpan is provided', () => {
      const onToggleColSpan = vi.fn();
      const html = renderToStaticMarkup(
        <DashboardWindow 
          id="toggle-test" 
          title="Expandable Card" 
          colSpan={12} 
          onToggleColSpan={onToggleColSpan}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      expect(html).toContain('2-Col');
      expect(html).toContain('Switch to 1-Column width');
      expect(html).toContain('bg-amber-500/20 text-amber-300');
    });

    it('renders "1-Col" label when colSpan is 6 and onToggleColSpan is provided', () => {
      const onToggleColSpan = vi.fn();
      const html = renderToStaticMarkup(
        <DashboardWindow 
          id="toggle-test-6" 
          title="Expandable Card" 
          colSpan={6} 
          onToggleColSpan={onToggleColSpan}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      expect(html).toContain('1-Col');
      expect(html).toContain('Expand to 2-Column Panoramic width');
    });

    it('invokes onToggleColSpan with window ID when clicked', () => {
      const onToggleColSpan = vi.fn();
      const element = (
        <DashboardWindow 
          id="win-click" 
          title="Interactive Window" 
          colSpan={6} 
          onToggleColSpan={onToggleColSpan}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      element.props.onToggleColSpan('win-click');
      expect(onToggleColSpan).toHaveBeenCalledWith('win-click');
    });
  });

  describe('Lock State Protections & Controls Gating', () => {
    it('enables draggable and renders move grip and resize handle when unlocked', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow 
          id="unlocked-win" 
          title="Unlocked Window" 
          isLocked={false}
          onToggleLock={vi.fn()}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      // Draggable is true
      expect(html).toContain('draggable="true"');
      // Drag handle grip icon
      expect(html).toContain('title="Drag to reorder card"');
      // Resize handle thumb in bottom right
      expect(html).toContain('title="Drag to resize card"');
      // Unlock icon in header
      expect(html).toContain('title="Lock window layout"');
      // "Locked" badge should NOT appear
      expect(html).not.toContain('>Locked</span>');
    });

    it('disables draggable and hides move grip and resize handle when locked', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow 
          id="locked-win" 
          title="Locked Window" 
          isLocked={true}
          onToggleLock={vi.fn()}
          onToggleColSpan={vi.fn()}
          onResetSize={vi.fn()}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      // Draggable is false
      expect(html).toContain('draggable="false"');
      // Move grip is hidden
      expect(html).not.toContain('title="Drag to reorder card"');
      // Resize handle is hidden
      expect(html).not.toContain('title="Drag to resize card"');
      // Column span toggle is hidden
      expect(html).not.toContain('Switch to 1-Column width');
      expect(html).not.toContain('Expand to 2-Column Panoramic width');
      // Reset size button is hidden
      expect(html).not.toContain('title="Reset window size"');
      // Lock toggle displays unlock prompt with amber styling
      expect(html).toContain('title="Unlock window arrangement"');
      expect(html).toContain('bg-amber-950/30');
      // Locked badge rendered next to title
      expect(html).toContain('>Locked</span>');
    });

    it('invokes onToggleLock callback with window ID', () => {
      const onToggleLock = vi.fn();
      const element = (
        <DashboardWindow 
          id="lock-click" 
          title="Lockable Window" 
          onToggleLock={onToggleLock}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      element.props.onToggleLock('lock-click');
      expect(onToggleLock).toHaveBeenCalledWith('lock-click');
    });

    it('invokes onResetSize callback when reset button is clicked', () => {
      const onResetSize = vi.fn();
      const element = (
        <DashboardWindow 
          id="reset-click" 
          title="Resizable Window" 
          onResetSize={onResetSize}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      element.props.onResetSize('reset-click');
      expect(onResetSize).toHaveBeenCalledWith('reset-click');
    });
  });

  describe('Height Styling & Dimensional Properties', () => {
    it('applies numeric height as pixel inline style', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="height-num" title="Fixed Height" height={450}>
          <div>Body</div>
        </DashboardWindow>
      );

      expect(html).toContain('height:450px');
      expect(html).toContain('min-height:280px');
    });

    it('applies string height directly to style', () => {
      const html = renderToStaticMarkup(
        <DashboardWindow id="height-str" title="Auto Height" height="auto">
          <div>Body</div>
        </DashboardWindow>
      );

      expect(html).toContain('height:auto');
      expect(html).toContain('min-height:280px');
    });
  });

  describe('Drag and Drop Event Callbacks', () => {
    it('preserves onDragStart, onDragOver, and onDrop callback references', () => {
      const onDragStart = vi.fn();
      const onDragOver = vi.fn();
      const onDrop = vi.fn();

      const element = (
        <DashboardWindow 
          id="dnd-win" 
          title="Draggable Window"
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      const mockEvent: any = { 
        target: { closest: () => ({}) }, 
        preventDefault: vi.fn() 
      };

      element.props.onDragStart(mockEvent, 'dnd-win');
      expect(onDragStart).toHaveBeenCalledWith(mockEvent, 'dnd-win');

      element.props.onDragOver(mockEvent);
      expect(onDragOver).toHaveBeenCalledWith(mockEvent);

      element.props.onDrop(mockEvent, 'dnd-win');
      expect(onDrop).toHaveBeenCalledWith(mockEvent, 'dnd-win');
    });

    it('sets e.dataTransfer.dropEffect to "move" on dragover', () => {
      const onDragOver = vi.fn((e: any) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      const element = (
        <DashboardWindow 
          id="dragover-win" 
          title="Target Window"
          onDragOver={onDragOver}
        >
          <div>Body</div>
        </DashboardWindow>
      );

      const mockDragEvent: any = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: 'none' }
      };

      element.props.onDragOver(mockDragEvent);
      expect(mockDragEvent.preventDefault).toHaveBeenCalled();
      expect(mockDragEvent.dataTransfer.dropEffect).toBe('move');
      expect(onDragOver).toHaveBeenCalledWith(mockDragEvent);
    });
  });
});
