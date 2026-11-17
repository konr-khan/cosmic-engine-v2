/**
 * @file meridianConfigHelpers.test.ts
 * Unit test suite for Meridian view-model transformation helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
  getSolarTwilightTier,
  createMeridianRadialTickConfig,
  createMeridianSwathConfig,
  createMeridianGateAnchorConfig,
  createMeridianPeakTargetConfig,
  buildSunMeridianSwaths,
  buildSunMeridianRadialTicks,
  buildMoonMeridianSwaths,
  buildMoonMeridianRadialTicks,
} from './meridianConfigHelpers';
import { CulminationInfo, RadialTickLine } from '../../../../utils/cosmicMath';

describe('meridianConfigHelpers', () => {
  describe('createMeridianRadialTickConfig', () => {
    const mockTick: RadialTickLine = {
      x1: 10,
      y1: 20,
      x2: 15,
      y2: 25,
    };

    it('creates a radial tick config with required properties only', () => {
      const config = createMeridianRadialTickConfig(
        'tick-1',
        mockTick,
        '#fbbf24',
        'Summer Solstice Peak'
      );

      expect(config).toEqual({
        id: 'tick-1',
        tick: mockTick,
        stroke: '#fbbf24',
        title: 'Summer Solstice Peak',
      });
      expect(config.strokeWidth).toBeUndefined();
      expect(config.strokeDasharray).toBeUndefined();
    });

    it('creates a radial tick config with strokeWidth and strokeDasharray', () => {
      const config = createMeridianRadialTickConfig(
        'tick-2',
        mockTick,
        '#818cf8',
        'Standstill Max',
        1.4,
        '2 1'
      );

      expect(config).toEqual({
        id: 'tick-2',
        tick: mockTick,
        stroke: '#818cf8',
        title: 'Standstill Max',
        strokeWidth: 1.4,
        strokeDasharray: '2 1',
      });
    });

    it('omits strokeDasharray if undefined is passed explicitly', () => {
      const config = createMeridianRadialTickConfig(
        'tick-3',
        mockTick,
        '#d97706',
        'Winter Solstice',
        1.4,
        undefined
      );

      expect(config).toEqual({
        id: 'tick-3',
        tick: mockTick,
        stroke: '#d97706',
        title: 'Winter Solstice',
        strokeWidth: 1.4,
      });
      expect('strokeDasharray' in config).toBe(false);
    });
  });

  describe('createMeridianSwathConfig', () => {
    const dPath = 'M 10 20 A 92 92 0 0 1 30 40';

    it('creates a swath config with required fields and title', () => {
      const config = createMeridianSwathConfig(
        'swath-basic',
        dPath,
        '#fbbf24',
        'June Solstice Arc'
      );

      expect(config).toEqual({
        id: 'swath-basic',
        d: dPath,
        stroke: '#fbbf24',
        title: 'June Solstice Arc',
      });
    });

    it('creates a swath config without title when omitted', () => {
      const config = createMeridianSwathConfig(
        'swath-no-title',
        dPath,
        '#94a3b8'
      );

      expect(config).toEqual({
        id: 'swath-no-title',
        d: dPath,
        stroke: '#94a3b8',
      });
      expect(config.title).toBeUndefined();
    });

    it('applies extended options such as glow, dasharray, and opacities', () => {
      const config = createMeridianSwathConfig(
        'swath-glow',
        dPath,
        '#818cf8',
        'Major Standstill Arc',
        {
          strokeWidth: 1.4,
          strokeDasharray: '3 2',
          strokeOpacity: 0.9,
          glow: true,
          glowWidth: 4,
          glowOpacity: 0.25,
        }
      );

      expect(config).toEqual({
        id: 'swath-glow',
        d: dPath,
        stroke: '#818cf8',
        title: 'Major Standstill Arc',
        strokeWidth: 1.4,
        strokeDasharray: '3 2',
        strokeOpacity: 0.9,
        glow: true,
        glowWidth: 4,
        glowOpacity: 0.25,
      });
    });
  });

  describe('createMeridianGateAnchorConfig', () => {
    it('creates a gate anchor config with default radius of 3.5', () => {
      const anchorPoint = { x: 50.5, y: 75.2 };
      const config = createMeridianGateAnchorConfig(
        'gate-1',
        anchorPoint,
        '#64748b',
        'Twilight Gate (-18°)'
      );

      expect(config).toEqual({
        id: 'gate-1',
        x: 50.5,
        y: 75.2,
        r: 3.5,
        stroke: '#64748b',
        title: 'Twilight Gate (-18°)',
      });
    });

    it('creates a gate anchor config with a custom radius', () => {
      const anchorPoint = { x: 100, y: 150 };
      const config = createMeridianGateAnchorConfig(
        'gate-custom-r',
        anchorPoint,
        '#38bdf8',
        'Custom Gate',
        4.0
      );

      expect(config.r).toBe(4.0);
      expect(config.x).toBe(100);
      expect(config.y).toBe(150);
    });
  });

  describe('createMeridianPeakTargetConfig', () => {
    it('creates a peak target config with peakPoint, stroke, and title', () => {
      const peakPoint = { x: 120.3, y: 88.7 };
      const config = createMeridianPeakTargetConfig(
        'peak-target-1',
        peakPoint,
        '#f59e0b',
        "Today's Noon Peak: 66.4° S"
      );

      expect(config).toEqual({
        id: 'peak-target-1',
        peakPoint: { x: 120.3, y: 88.7 },
        stroke: '#f59e0b',
        title: "Today's Noon Peak: 66.4° S",
      });
    });
  });
});

describe('meridianConfigHelpers pure solar & lunar builders', () => {
  const mkCulmination = (altitude: number, shortTag: 'S' | 'N' | 'Z' = 'S'): CulminationInfo => ({
    altitude,
    direction: shortTag === 'N' ? 'North' : shortTag === 'Z' ? 'Zenith' : 'South',
    shortTag,
    meridianLabel: shortTag,
    sightingSummary: `Looking ${shortTag}`,
  });

  const sampleTick: RadialTickLine = { x1: 100, y1: 50, x2: 108, y2: 44 };

  it('classifies solar twilight tiers accurately', () => {
    expect(getSolarTwilightTier(15)).toBe('Daylight');
    expect(getSolarTwilightTier(0)).toBe('Daylight');
    expect(getSolarTwilightTier(-3)).toBe('Civil Twilight');
    expect(getSolarTwilightTier(-9)).toBe('Nautical Twilight');
    expect(getSolarTwilightTier(-15)).toBe('Astro Twilight');
    expect(getSolarTwilightTier(-22)).toBe('Polar Night');
  });

  it('builds solar meridian swaths and radial ticks for temperate and polar observers', () => {
    const swaths = buildSunMeridianSwaths({
      juneSwathD: 'M 10 10 A 92 92 0 0 1 20 20',
      decemberSwathD: 'M 20 20 A 92 92 0 0 1 30 30',
      todayCulmination: mkCulmination(50, 'S'),
      juneSolstice: mkCulmination(66.4, 'S'),
      decemberSolstice: mkCulmination(19.5, 'S'),
      isApproachingJune: true,
      isApproachingSummer: true,
      isPolar: false,
      isNorth: true,
      showJuneTick: true,
      showDecemberTick: true,
      polarSummerCounterpartSwathD: '',
      polarWinterCounterpartSwathD: '',
      summerSolsticeColor: '#fbbf24',
      winterSolsticeColor: '#d97706',
      summerNoon: 66.4,
      winterNoon: 19.5,
    });

    expect(swaths.map((s) => s.id)).toEqual(['solstice-swath-june', 'solstice-swath-december']);
    expect(swaths[0].strokeOpacity).toBe(0.85);
    expect(swaths[1].strokeOpacity).toBe(0.4);

    const ticks = buildSunMeridianRadialTicks({
      showJuneTick: true,
      showDecemberTick: true,
      juneTick: sampleTick,
      decemberTick: sampleTick,
      equinoxTick: sampleTick,
      juneSolstice: mkCulmination(66.4, 'S'),
      decemberSolstice: mkCulmination(19.5, 'S'),
      equinoxCulmination: mkCulmination(43.0, 'S'),
      isPolar: false,
      isNorth: true,
      polarSummerCounterpart: null,
      polarWinterCounterpart: null,
      summerSolsticeColor: '#fbbf24',
      winterSolsticeColor: '#d97706',
      summerNoon: 66.4,
      winterNoon: 19.5,
    });

    expect(ticks.map((t) => t.id)).toEqual([
      'summer-solstice-tick',
      'winter-solstice-tick',
      'equinox-tick',
    ]);
  });

  it('builds lunar meridian swaths and radial ticks in standstill and nodal modes', () => {
    const swaths = buildMoonMeridianSwaths({
      isStandstillActive: true,
      monthlySwathD: 'M 0 0 L 10 10',
      standstillSwathD: 'M 0 0 L 20 20',
      maxSwathD: 'M 5 5 L 15 15',
      minSwathD: 'M 5 5 L 2 2',
      monthMax: mkCulmination(65, 'S'),
      monthMin: mkCulmination(20, 'S'),
      standstillMax: mkCulmination(71.5, 'S'),
      standstillMin: mkCulmination(14.4, 'S'),
      isNodalModeActive: true,
      nodalThemeColor: '#38bdf8',
      isAscendingBranch: true,
      isApproachingMax: true,
      targetTierLabel: '18.6y Major Standstill',
      peakAlt: 50,
      todayShortTag: 'S',
      targetMaxAlt: 71.5,
      targetMinAlt: 14.4,
      targetMaxTag: 'S',
      targetMinTag: 'S',
      isPolar: false,
      polarLunarMaxCounterpartSwathD: '',
    });

    expect(swaths.map((s) => s.id)).toEqual([
      'monthly-lunar-swath-guide',
      'lunar-migration-swath-max',
      'lunar-migration-swath-min',
    ]);
    expect(swaths[1].stroke).toBe('#38bdf8');
    expect(swaths[2].stroke).toBe('#f43f5e');

    const ticks = buildMoonMeridianRadialTicks({
      standstillMaxTick: sampleTick,
      standstillMinTick: sampleTick,
      monthMaxTick: sampleTick,
      monthMinTick: sampleTick,
      standstillMax: mkCulmination(71.5, 'S'),
      standstillMin: mkCulmination(14.4, 'S'),
      monthMax: mkCulmination(65, 'S'),
      monthMin: mkCulmination(20, 'S'),
      isStandstillActive: true,
      isPolar: false,
      polarMaxCounterpart: null,
      targetMaxAlt: 71.5,
      targetTierLabel: '18.6y Major Standstill',
    });

    expect(ticks.map((t) => t.id)).toEqual([
      'standstill-max-tick',
      'standstill-min-tick',
      'monthly-max-tick',
      'monthly-min-tick',
    ]);
  });
});

