import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ArmillaryModePills,
  ArmillaryMorphRail,
  ArmillaryLayerToggles,
  ArmillaryHoverHud,
  ArmillaryTelemetryHud
} from './index';
import { getJulianDate, generateArmillaryModel } from '../../../utils/cosmicMath';

describe('ArmillaryControls & HUD Subsystem', () => {
  describe('Phase 3 Header Controls Decomposition', () => {
    describe('ArmillaryModePills', () => {
      it('renders 6 mode buttons in heliocentric mode and invokes callbacks with canonical targets', () => {
        const onSnapToPreset = vi.fn();
        const onToggleNodal = vi.fn();
        const html = renderToStaticMarkup(
          React.createElement(ArmillaryModePills, {
            projectionMode: 'heliocentric',
            morphLambda: 0.0,
            onSnapToPreset,
            onToggleNodal
          })
        );
        expect(html).toContain('☉ Orbit');
        expect(html).toContain('☊ Nodal');
        expect(html).toContain('⊕ Apparent');
        expect(html).toContain('🧭 Rete');
        expect(html).toContain('📐 Rojas');
        expect(html).toContain('🔭 Horizon');
        expect(html).toContain('bg-amber-500 text-slate-950 font-bold');

        // Check click handlers
        const element = ArmillaryModePills({
          projectionMode: 'heliocentric',
          morphLambda: 0.0,
          onSnapToPreset,
          onToggleNodal
        }) as React.ReactElement<any>;
        const buttons = element.props.children.filter(Boolean);
        expect(buttons.length).toBe(6);

        // Click Nodal
        buttons[1].props.onClick();
        expect(onToggleNodal).toHaveBeenCalledTimes(1);

        // Click Geocentric Apparent
        buttons[2].props.onClick();
        expect(onSnapToPreset).toHaveBeenCalledWith('geocentric', 0.0);

        // Click Rete
        buttons[3].props.onClick();
        expect(onSnapToPreset).toHaveBeenCalledWith('stereographic', 1.0);

        // Click Rojas
        buttons[4].props.onClick();
        expect(onSnapToPreset).toHaveBeenCalledWith('rojas', 1.0);

        // Click Horizon
        buttons[5].props.onClick();
        expect(onSnapToPreset).toHaveBeenCalledWith('horizon', 1.0);

        // Click Heliocentric Orbit
        buttons[0].props.onClick();
        expect(onSnapToPreset).toHaveBeenCalledWith('heliocentric', 0.0);
      });

      it('toggles nodal alignment and highlights pill with sky-blue styling when isNodalActive is true', () => {
        const onToggleNodal = vi.fn();
        const htmlActive = renderToStaticMarkup(
          React.createElement(ArmillaryModePills, {
            projectionMode: 'heliocentric',
            morphLambda: 0.0,
            onSnapToPreset: vi.fn(),
            isNodalActive: true,
            onToggleNodal
          })
        );
        expect(htmlActive).toContain('bg-sky-500 text-slate-950 font-bold');
        expect(htmlActive).toContain('ring-sky-300');

        const element = ArmillaryModePills({
          projectionMode: 'heliocentric',
          morphLambda: 0.0,
          onSnapToPreset: vi.fn(),
          isNodalActive: true,
          onToggleNodal
        }) as React.ReactElement<any>;
        const buttons = element.props.children.filter(Boolean);

        // Clicking Orbit while nodal is active should toggle off nodal
        buttons[0].props.onClick();
        expect(onToggleNodal).toHaveBeenCalledTimes(1);
      });

      it('properly highlights active plate modes when 2D flattened (morphLambda > 0.05)', () => {
        const htmlStereo = renderToStaticMarkup(
          React.createElement(ArmillaryModePills, {
            projectionMode: 'stereographic',
            morphLambda: 1.0,
            onSnapToPreset: vi.fn()
          })
        );
        // Rete should have active highlight
        expect(htmlStereo).toContain('bg-amber-500 text-slate-950 font-bold');
      });
    });

    describe('ArmillaryMorphRail', () => {
      it('renders eccentricity toggle only in heliocentric mode and handles clicks', () => {
        const onToggleEccentricity = vi.fn();
        const onMorphChange = vi.fn();

        // In heliocentric mode
        const htmlHelio = renderToStaticMarkup(
          React.createElement(ArmillaryMorphRail, {
            projectionMode: 'heliocentric',
            morphLambda: 0.0,
            onMorphChange,
            exaggerateEccentricity: false,
            onToggleEccentricity
          })
        );
        expect(htmlHelio).toContain('1× True');
        expect(htmlHelio).toContain('Exaggerated');

        // In geocentric mode -> no eccentricity toggle
        const htmlGeo = renderToStaticMarkup(
          React.createElement(ArmillaryMorphRail, {
            projectionMode: 'geocentric',
            morphLambda: 0.0,
            onMorphChange,
            exaggerateEccentricity: false,
            onToggleEccentricity
          })
        );
        expect(htmlGeo).not.toContain('1× True');
        expect(htmlGeo).not.toContain('Exaggerated');
      });

      it('renders continuous morph slider with percentage and handles input', () => {
        const onMorphChange = vi.fn();
        const html = renderToStaticMarkup(
          React.createElement(ArmillaryMorphRail, {
            projectionMode: 'geocentric',
            morphLambda: 0.42,
            onMorphChange
          })
        );
        expect(html).toContain('Morph λ:');
        expect(html).toContain('42%');
        expect(html).toContain('value="0.42"');
      });

      it('handles free rete solver toggle, snap to now, and apparent solar hours badge', () => {
        const onToggleFreeRete = vi.fn();
        const onSnapToNow = vi.fn();

        // Free solver active with apparent solar time 14.75 hours (14:45)
        const element = ArmillaryMorphRail({
          projectionMode: 'stereographic',
          morphLambda: 1.0,
          onMorphChange: vi.fn(),
          isFreeReteMode: true,
          onToggleFreeRete,
          onSnapToNow,
          apparentSolarHours: 14.75
        });
        const html = renderToStaticMarkup(element as React.ReactElement);
        expect(html).toContain('Clock Sync');
        expect(html).toContain('Free Solver');
        expect(html).toContain('Snap Now');
        expect(html).toContain('☉ 14:45');
      });
    });

    describe('ArmillaryLayerToggles', () => {
      it('renders all toggles and dispatches toggle callbacks', () => {
        const onToggleRays = vi.fn();
        const onToggleObserverCone = vi.fn();
        const onToggleStars = vi.fn();
        const onToggleTympan = vi.fn();
        const onToggleRule = vi.fn();
        const onToggleLunarNodes = vi.fn();
        const onResetCamera = vi.fn();

        const element = ArmillaryLayerToggles({
          showRays: true,
          onToggleRays,
          showObserverCone: true,
          onToggleObserverCone,
          showStars: true,
          onToggleStars,
          showTympan: true,
          onToggleTympan,
          showLunarNodes: true,
          onToggleLunarNodes,
          showRule: true,
          onToggleRule,
          onResetCamera,
          isOrbital: false
        }) as React.ReactElement<any>;
        const buttons = element.props.children.filter(Boolean);
        expect(buttons.length).toBe(6);

        // Zap button
        buttons[0].props.onClick();
        expect(onToggleObserverCone).toHaveBeenCalledWith(false);
        expect(onToggleRays).toHaveBeenCalledTimes(1);

        // Stars button
        buttons[1].props.onClick();
        expect(onToggleStars).toHaveBeenCalledTimes(1);

        // Tympan button
        buttons[2].props.onClick();
        expect(onToggleTympan).toHaveBeenCalledTimes(1);

        // Rule button
        buttons[3].props.onClick();
        expect(onToggleRule).toHaveBeenCalledTimes(1);

        // Lunar nodes button
        buttons[4].props.onClick();
        expect(onToggleLunarNodes).toHaveBeenCalledTimes(1);

        // Reset camera button
        buttons[5].props.onClick();
        expect(onResetCamera).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ArmillaryHoverHud & ArmillaryTelemetryHud', () => {
    it('formats negative observer coordinates with °S and °W hemisphere signs in ArmillaryHoverHud', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      const model = generateArmillaryModel({
        julianDate: jd,
        latitude: -33.8688,
        longitude: -151.2093,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 90,
        moonDecDeg: 20,
        moonLambdaDeg: 90,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 0,
        cameraYaw: 0,
        r0: 100
      });

      const southWestHtml = renderToStaticMarkup(
        React.createElement(ArmillaryHoverHud, {
          hoveredStar: null,
          hoveredBead: 'observer',
          hoveredMilestone: null,
          hoveredNode: null,
          lunarNodes: model.lunarNodes,
          showRule: false,
          sightingInfo: null,
          sun: model.sun,
          moon: model.moon,
          earth: model.earth,
          physics: model.physics,
          observerCone: model.observerCone,
          latitude: -33.8688,
          longitude: -151.2093
        })
      );

      expect(southWestHtml).toContain('33.87°S, 151.21°W');
      expect(southWestHtml).not.toContain('-33.87°N');
      expect(southWestHtml).not.toContain('-151.21°E');

      // Positive coordinates
      const northEastHtml = renderToStaticMarkup(
        React.createElement(ArmillaryHoverHud, {
          hoveredStar: null,
          hoveredBead: 'observer',
          hoveredMilestone: null,
          hoveredNode: null,
          lunarNodes: model.lunarNodes,
          showRule: false,
          sightingInfo: null,
          sun: model.sun,
          moon: model.moon,
          earth: model.earth,
          physics: model.physics,
          observerCone: model.observerCone,
          latitude: 47.06,
          longitude: 15.44
        })
      );

      expect(northEastHtml).toContain('47.06°N, 15.44°E');
    });

    it('switches Telemetry HUD to Astrolabe Horology when morphLambda > 0.45 in geocentric mode', () => {
      const jd = getJulianDate(new Date(2026, 2, 20), 12);
      const model = generateArmillaryModel({
        julianDate: jd,
        latitude: 47.06,
        longitude: -122.81,
        timeOfDay: 12,
        sunRaDeg: 0,
        sunDecDeg: 0,
        sunLambdaDeg: 0,
        moonRaDeg: 90,
        moonDecDeg: 20,
        moonLambdaDeg: 90,
        moonPhase: 0.5,
        morphLambda: 0.0,
        projectionMode: 'geocentric',
        cameraPitch: 25,
        cameraYaw: 35,
        r0: 100
      });

      // 1. At morphLambda <= 0.45 (e.g. 0.0): Renders Keplerian / Orbital physics
      const html3D = renderToStaticMarkup(
        React.createElement(ArmillaryTelemetryHud, {
          model,
          projectionMode: 'geocentric',
          morphLambda: 0.0,
          latitude: 47.06,
          longitude: -122.81,
          cameraPitch: 25,
          cameraYaw: 35
        })
      );
      expect(html3D).toContain('Orbital Framework');
      expect(html3D).toContain('⊕ Geocentric (Apparent)');
      expect(html3D).toContain('Earth-Sun Distance');
      expect(html3D).toContain('Keplerian Dynamics');
      expect(html3D).not.toContain('Sidereal Horology');

      // 2. At morphLambda > 0.45 (e.g. 0.6): Switches to Astrolabe Horology & Chaldean hours
      const htmlAstrolabe = renderToStaticMarkup(
        React.createElement(ArmillaryTelemetryHud, {
          model,
          projectionMode: 'geocentric',
          morphLambda: 0.6,
          latitude: 47.06,
          longitude: -122.81,
          cameraPitch: 25,
          cameraYaw: 35
        })
      );
      expect(htmlAstrolabe).not.toContain('Keplerian Dynamics');
      expect(htmlAstrolabe).not.toContain('Earth-Sun Distance');
      expect(htmlAstrolabe).toContain('Projection &amp; Frame');
      expect(htmlAstrolabe).toContain('Sidereal Horology');
      expect(htmlAstrolabe).toContain('Historical Unequal Horology');
      expect(htmlAstrolabe).toContain('Chaldean Ruler');
    });
  });
});
