import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  useSunElevationMath, 
  useMoonElevationMath, 
  SkyDomeFooter, 
  DraconicTimelineRail, 
  LunarPhaseDisc,
  OBLIQUITY,
  LUNAR_MAX_DEC,
  SunElevationMathResult,
  MoonElevationMathResult
} from './index';
import { calculateSkyDomeLunarNodes, getJulianDate } from '../../../utils/cosmicMath';

describe('Sky Dome Refactored Hooks & Primitives', () => {
  describe('useSunElevationMath', () => {
    it('computes solar elevation, culmination, and diurnal paths for temperate latitude', () => {
      let mathResult!: SunElevationMathResult;
      const TestSunHarness: React.FC = () => {
        mathResult = useSunElevationMath({
          solarData: {
            noonElevation: 45,
            solarNoon: 12,
            equationOfTime: 2.5,
            sunrise: 6,
            sunset: 18,
            declination: 10,
            distanceAU: 1.01,
            distanceKm: 151000000,
            dayLength: 12,
            civil: 0.5,
            nautical: 1,
            astronomical: 1.5,
            daysSinceEpoch: 100,
            lambda: 45,
            eclipticLongitude: 45,
            isMidnightSun: false,
            isPolarNight: false,
          },
          displayTime: 12,
          latitude: 47.06,
          isTwilightModeActive: false,
        });
        return null;
      };

      renderToStaticMarkup(<TestSunHarness />);

      expect(mathResult.sunDistanceAU).toBe(1.01);
      expect(mathResult.currentSunElevation).toBeGreaterThan(0);
      expect(mathResult.culmination).toBeDefined();
      expect(mathResult.culmination.shortTag).toBe('S');
      expect(mathResult.diurnalPaths.length).toBeGreaterThan(0);
      expect(mathResult.summerSolsticeNoon).toBeCloseTo(90 - 47.06 + OBLIQUITY, 1);
    });
  });

  describe('useMoonElevationMath', () => {
    it('computes lunar elevation, standstills, and nodal paths', () => {
      let mathResult!: MoonElevationMathResult;
      const TestMoonHarness: React.FC = () => {
        mathResult = useMoonElevationMath({
          orbitalData: {
            phase: { value: 0.25, name: 'First Quarter' },
            lunarEvents: {
              moonrise: 8,
              transit: 14,
              moonset: 20,
              distanceKm: 384400,
              distanceEarthRadii: 60.3,
              isPerigee: false,
              isApogee: false,
              declination: 15,
              parallacticAngle: 30,
            },
          } as any,
          solarData: {
            solarNoon: 12,
            declination: 5,
            lambda: 60,
          } as any,
          displayTime: 14,
          latitude: 47.06,
          isNodalModeActive: true,
        });
        return null;
      };

      renderToStaticMarkup(<TestMoonHarness />);

      expect(mathResult.phase.name).toBe('First Quarter');
      expect(mathResult.illPercent).toBe(50);
      expect(mathResult.currentMoonElevation).toBeGreaterThan(0);
      expect(mathResult.maxAnnualMoonNoon).toBeCloseTo(90 - 47.06 + LUNAR_MAX_DEC, 1);
      expect(mathResult.diurnalPaths.some((p: { id: string }) => p.id === 'ecliptic-reference-path')).toBe(true);
      expect(mathResult.nodalData).toBeDefined();
    });
  });

  describe('SkyDomeFooter', () => {
    it('renders 4-column summary grid with custom themes and toggle buttons', () => {
      const onSnap = vi.fn();
      const onToggle = vi.fn();

      const html = renderToStaticMarkup(
        <SkyDomeFooter
          riseSetTitle="Sunrise / Set"
          riseSetPrimaryText="06:00 / 18:00"
          riseSetOctantText="East · West"
          transitLabel="Solar Noon"
          transitTimeFormatted="12:00"
          onSnapTransit={onSnap}
          transitTheme="amber"
          declinationLabel="Declination (δ)"
          declinationFormatted="+10.0°"
          declinationColorClass="text-amber-400"
          primaryModeText="Std"
          secondaryModeText="Twilight"
          isSecondaryActive={false}
          onToggleMode={onToggle}
          secondaryTheme="amber"
        />
      );

      expect(html).toContain('Sunrise / Set');
      expect(html).toContain('06:00 / 18:00');
      expect(html).toContain('East · West');
      expect(html).toContain('Solar Noon');
      expect(html).toContain('12:00');
      expect(html).toContain('Declination (δ)');
      expect(html).toContain('+10.0°');
      expect(html).toContain('Std');
      expect(html).toContain('Twilight');
    });
  });

  describe('DraconicTimelineRail', () => {
    it('renders SVG draconic timeline with pinned nodes and center target', () => {
      const jd = getJulianDate(new Date('2026-06-21T12:00:00Z'), 12);
      const nodalData = calculateSkyDomeLunarNodes(47.06, jd, 12, 12, 90, { phaseValue: 0.5 });

      const html = renderToStaticMarkup(<DraconicTimelineRail nodalData={nodalData} />);

      expect(html).toContain('<svg viewBox="0 0 240 16"');
      expect(html).toContain('Today');
      expect(html).toContain('−15d');
      expect(html).toContain('+15d');
    });
  });

  describe('LunarPhaseDisc', () => {
    it('renders illuminated terminator path and specular rim', () => {
      // Full Moon (phase = 0.5)
      const fullHtml = renderToStaticMarkup(
        <svg>
          <LunarPhaseDisc phaseValue={0.5} parallacticAngle={0} radius={5.5} rimStroke="#38bdf8" />
        </svg>
      );
      expect(fullHtml).toContain('<circle cx="0" cy="0" r="5.5" fill="#f8fafc"');
      expect(fullHtml).toContain('stroke="#38bdf8"');

      // Quarter Moon (phase = 0.25)
      const quarterHtml = renderToStaticMarkup(
        <svg>
          <LunarPhaseDisc phaseValue={0.25} parallacticAngle={45} radius={5.5} />
        </svg>
      );
      expect(quarterHtml).toContain('transform="rotate(45)"');
      expect(quarterHtml).toContain('<path d="M 0,-5.5');
    });
  });
});
