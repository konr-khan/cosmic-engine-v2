/**
 * @file SkyDomeBase.test.tsx
 * Unit test suite for SkyDomeBase shared elevation arc primitive:
 * - Geometric constants (EL_R = 92, EL_CX = 130, EL_CY = 104)
 * - Header rendering (title, icon, peak elevation badge)
 * - SVG canvas rendering (horizon line, 0° marks, cardinal compass labels E, S, W)
 * - Zenith (+90°) tick and observer center circle
 * - Unreachable zenith cap rendering
 * - Reference chord lines rendering (solstices, standstills)
 * - Body elevation vector & custom body graphic slots
 * - Elevation readout badge state (+XX.X° Above Horizon vs -XX.X° Below Horizon)
 * - Children and hover popover slots
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sun, Moon } from 'lucide-react';
import { SkyDomeBase, EL_R, EL_CX, EL_CY } from './SkyDomeBase';

describe('SkyDomeBase Primitive Component Test Suite', () => {
  it('exports canonical elevation arc geometry constants', () => {
    expect(EL_R).toBe(92);
    expect(EL_CX).toBe(130);
    expect(EL_CY).toBe(104);
  });

  it('renders header with title, icon, and peak elevation readout', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        iconColorClass="text-amber-400"
        peakLabel="Noon Peak"
        peakElevation={66.4}
        currentElevation={45.0}
      />
    );

    expect(html).toContain('Sun Elevation Arc');
    expect(html).toContain('Noon Peak:');
    expect(html).toContain('66.4°');
    expect(html).toContain('text-amber-400');
  });

  it('renders horizon line, 0° labels, and E, S, W cardinal compass markers', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Moon Elevation Arc"
        icon={Moon}
        peakLabel="Transit Peak"
        peakElevation={42.1}
        currentElevation={20.0}
      />
    );

    // Horizon line at Y = EL_CY (104)
    expect(html).toContain('y1="104" x2="242" y2="104"');
    // 0° labels
    expect(html).toContain('0°');
    // Cardinal compass cues
    expect(html).toContain('>E</text>');
    expect(html).toContain('>S</text>');
    expect(html).toContain('>W</text>');
    // Zenith +90° marker
    expect(html).toContain('+90°');
  });

  it('switches meridian cardinal indicator from "S" to "N" when observer moves south of the equator', () => {
    // Northern hemisphere (e.g. London 51.5°N)
    const northHtml = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={61.5}
        currentElevation={40.0}
        latitude={51.5}
      />
    );
    expect(northHtml).toContain('>S</text>');
    expect(northHtml).not.toContain('>N</text>');

    // Southern hemisphere (e.g. Sydney -33.86°S)
    const southHtml = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={79.5}
        currentElevation={50.0}
        latitude={-33.86}
      />
    );
    expect(southHtml).toContain('>N</text>');
    expect(southHtml).not.toContain('>S</text>');
  });

  it('renders semicircular elevation arc path matching EL_R, EL_CX, EL_CY', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={50.0}
        currentElevation={30.0}
      />
    );

    // EL_CX - EL_R = 130 - 92 = 38, EL_CX + EL_R = 130 + 92 = 222
    expect(html).toContain('M 38 104 A 92 92 0 0 1 222 104');
  });

  it('renders unreachable Zenith Cap when capPathD is supplied', () => {
    const sampleCap = 'M 60 40 A 92 92 0 0 1 200 40 Z';
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={50.0}
        currentElevation={30.0}
        capPathD={sampleCap}
      />
    );

    expect(html).toContain(sampleCap);
  });

  it('renders reference chord lines with labels and titles', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={66.4}
        currentElevation={45.0}
        referenceLines={[
          {
            y: 50,
            xLeft: 50,
            xRight: 210,
            stroke: '#fbbf24',
            label: '66°',
            labelColor: 'fill-amber-400',
            title: 'Summer Solstice Noon Peak: 66.4°'
          }
        ]}
      />
    );

    expect(html).toContain('Summer Solstice Noon Peak: 66.4°');
    expect(html).toContain('66°');
    expect(html).toContain('stroke="#fbbf24"');
  });

  it('renders diurnal transit paths with glowing effect, labels, and title tooltips', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={66.4}
        currentElevation={45.0}
        diurnalPaths={[
          {
            id: 'summer-solstice',
            d: 'M 38 104 L 130 20 L 222 104',
            stroke: '#fbbf24',
            strokeWidth: 0.75,
            strokeDasharray: '3 2',
            strokeOpacity: 0.7,
            label: '66°',
            labelColor: 'fill-amber-400',
            labelX: 180,
            labelY: 25,
            title: 'Summer Solstice Noon Peak: 66.4°'
          },
          {
            id: 'today-sun-path',
            d: 'M 45 104 L 130 50 L 215 104',
            stroke: '#f59e0b',
            strokeWidth: 1.5,
            isGlowing: true,
            title: "Today's Solar Transit Peak: 45.0°"
          }
        ]}
      />
    );

    expect(html).toContain('M 38 104 L 130 20 L 222 104');
    expect(html).toContain('Summer Solstice Noon Peak: 66.4°');
    expect(html).toContain('Solar Transit Peak: 45.0°');
    expect(html).toContain('66°');
    expect(html).toContain('blur-[1px]');
  });

  it('renders body vector and graphic when elevation > -18°', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={60.0}
        currentElevation={35.0}
        bodyX={150}
        bodyY={60}
        bodyVectorStroke="#fbbf24"
        renderBodyGraphic={() => <circle data-testid="sun-bead" cx="150" cy="60" r="5" />}
      />
    );

    expect(html).toContain('data-testid="sun-bead"');
    expect(html).toContain('stroke="#fbbf24"');
    expect(html).toContain('+35.0°');
    expect(html).toContain('(Above Horizon)');
  });

  it('suppresses body vector and graphic when elevation <= -18°', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={60.0}
        currentElevation={-25.0}
        bodyX={150}
        bodyY={120}
        renderBodyGraphic={() => <circle data-testid="hidden-sun-bead" cx="150" cy="120" r="5" />}
      />
    );

    expect(html).not.toContain('data-testid="hidden-sun-bead"');
    expect(html).toContain('-25.0°');
    expect(html).toContain('(Below Horizon)');
  });

  it('renders hover popover and children slots', () => {
    const html = renderToStaticMarkup(
      <SkyDomeBase
        title="Sun Elevation Arc"
        icon={Sun}
        peakLabel="Noon Peak"
        peakElevation={60.0}
        currentElevation={35.0}
        popover={<div data-testid="test-popover">Hover Popover Content</div>}
      >
        <div data-testid="test-child-metrics">Child Metrics Row</div>
      </SkyDomeBase>
    );

    expect(html).toContain('data-testid="test-popover"');
    expect(html).toContain('Hover Popover Content');
    expect(html).toContain('data-testid="test-child-metrics"');
    expect(html).toContain('Child Metrics Row');
  });
});
