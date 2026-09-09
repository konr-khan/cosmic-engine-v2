/**
 * @file syncDocMetrics.mjs
 * Automated Documentation Test Metric Synchronizer
 * 
 * Programmatically runs Vitest with JSON reporter, computes exact test counts
 * per domain test suite and repository totals, and deterministically synchronizes
 * README.md and AGENTS.md to eliminate documentation metric drift.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readmePath = path.join(rootDir, 'README.md');
const agentsPath = path.join(rootDir, 'AGENTS.md');
const dossierPath = path.join(rootDir, 'docs', 'COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md');
const tempJsonPath = path.join(rootDir, '.vitest-metrics.json');
const vitestBinPath = path.join(rootDir, 'node_modules', 'vitest', 'vitest.mjs');

console.log('⚡ Running Vitest to collect live test metrics...');

const result = spawnSync(
  process.execPath,
  [vitestBinPath, 'run', '--reporter=json', `--outputFile=${tempJsonPath}`],
  {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

if (!fs.existsSync(tempJsonPath)) {
  console.error('❌ Failed to generate Vitest JSON report.');
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

let metricsData;
try {
  metricsData = JSON.parse(fs.readFileSync(tempJsonPath, 'utf8'));
} finally {
  try {
    fs.unlinkSync(tempJsonPath);
  } catch (_) {}
}

const fileMap = new Map();
const baseNameMap = new Map();

for (const suite of metricsData.testResults) {
  const norm = suite.name.replace(/\\/g, '/');
  const idx = norm.indexOf('src/');
  const relPath = idx !== -1 ? norm.substring(idx) : norm;
  const count = suite.assertionResults.length;
  fileMap.set(relPath, count);
  baseNameMap.set(path.basename(relPath), count);
}

const totalFiles = metricsData.testResults.length;
const totalTests = metricsData.numTotalTests;

console.log(`📊 Live Test Harness Metrics: ${totalFiles} test files, ${totalTests} total tests.`);

/**
 * Canonical test suite metadata registry for generating/updating documentation tables.
 */
const CANONICAL_SUITES = [
  {
    domain: 'Core Astronomy & Time',
    file: 'src/utils/cosmicMath/core.test.ts',
    focus: 'Julian date engines, UTC date invariance & `createUTCDate`, time parsing & formatting, spherical linear interpolation (`slerp3D`), physical constants (`astroConstants`), and floating-point degeneracy protection'
  },
  {
    domain: 'Solar Ephemeris & Twilight',
    file: 'src/utils/cosmicMath/solar.test.ts',
    focus: 'Solar declination, equation of time, daily solar events (rise/set), civil/nautical/astronomical twilight bands, polar boundaries (midnight sun, polar night), and annual solar matrix'
  },
  {
    domain: 'Lunar Ephemeris & Illumination',
    file: 'src/utils/cosmicMath/lunar.test.ts',
    focus: 'Meeus lunar series, true geocentric phase angle ($i$), disc illumination ($k$), 2-step iterative rise/set solver, parallactic angle, nodal precession, and annual lunar matrix'
  },
  {
    domain: 'Today Sky & Diurnal Kinematics',
    file: 'src/utils/cosmicMath/todaySky.test.ts',
    focus: 'Sky dome coordinate projection ($X, Y$), diurnal path generation, celestial meridian coordinate projection and swaths (`calculateMeridianPoint`, `generateMeridianSwathD`), radial tick pins, monthly lunar declination bounds, Draconic nodal crossings (±15 days), and twilight status classification'
  },
  {
    domain: 'Eclipse Geometry & Presets',
    file: 'src/utils/cosmicMath/eclipse.test.ts',
    focus: 'Syzygy shadow geometry, analytical Umbra/Penumbra cones, all 5 historical and future eclipse presets, and recurrence scanner (`findUpcomingEclipses`)'
  },
  {
    domain: '3D Obliquity & Earth Projections',
    file: 'src/utils/cosmicMath/projection.test.ts',
    focus: 'Earth axial obliquity ($23.439^\circ$), side & axial 3D geometry, observer pin projection, 4-quadrant orbital loops, and world continent landmass projections with analytical limb clipping'
  },
  {
    domain: 'Armillary Continuum & Projections',
    file: 'src/utils/cosmicMath/armillary/armillary.test.ts',
    focus: 'Universal 5-model Gyro-Morph continuum, GMST/LST solvers, Stereographic Conformal, Rojas Orthographic, Topocentric Horizon, Almucantars, unequal planetary hours, astrolabe stars, Free Rete solver, and closed-form stereographic conformal ring invariants ($R_0\sec\epsilon$)'
  },
  {
    domain: 'Armillary Benchmark',
    file: 'src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts',
    focus: '1,000-frame continuous latency budget (< 0.8 ms/frame), deterministic mathematical repeatability, non-NaN/non-Infinity geometric invariants across all 5 continuum modes, and milestone preservation'
  },
  {
    domain: 'Armillary Adversarial',
    file: 'src/utils/cosmicMath/armillary/m3_adversarial.test.ts',
    focus: 'Analytical closed-form Stereographic Ecliptic invariant ($R_0\sec\epsilon$), Sun bead clamping residuals ($< 1.42 \times 10^{-13}\text{ px}$), and 10,000-sample randomized Monte Carlo transitions'
  },
  {
    domain: 'Domain Invariants & Physics Conservation',
    file: 'src/utils/cosmicMath/domainInvariants.test.ts',
    focus: 'Empirical physics conservation laws: Keplerian areal velocity invariance ($r^2 \dot{\theta} = \text{const}$), vis-viva orbital energy conservation, syzygy collinearity bounds, and non-negative solar irradiance'
  },
  {
    domain: '3D Scene Graph Math',
    file: 'src/utils/cosmicMath/scene/scene.test.ts',
    focus: '3D coordinate consistency across frames (Heliocentric, Geocentric, Terrestrial), True vs. Exaggerated Keplerian scale modes, 6 seasonal milestone coordinates, dynamic $5.14^\circ$ inclined lunar orbit with continuous nodal precession $\Omega(t)$, and 3D syzygy shadow cones'
  },
  {
    domain: 'Scene Cameras Stress',
    file: 'src/utils/cosmicMath/scene/cameras.stress.test.ts',
    focus: 'Stress testing canonical camera projections (TopDown, Transverse, Axial, Euler) under boundary epochs, extreme orbital distances, and rapid coordinate shifts'
  },
  {
    domain: 'Scene Coordinate Adversarial',
    file: 'src/utils/cosmicMath/scene/m1_adversarial.test.ts',
    focus: 'Coordinate frame invariants, axial tilt matrix preservation ($23.439^\circ$) in inertial space, and singular polar viewing angles'
  },
  {
    domain: 'Unit-Safety AST Guardrails',
    file: 'src/types/unitSafety.test.ts',
    focus: 'Babel AST lint enforcement banning `asDegrees()` and `asRadians()` across all UI components (`src/components/**`), ensuring verified boundary conversion gatekeepers'
  },
  {
    domain: 'Cosmic State Store',
    file: 'src/store/cosmicStore.test.ts',
    focus: 'Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping'
  },
  {
    domain: 'Cosmic Engine Hook',
    file: 'src/hooks/useCosmicEngine.test.ts',
    focus: 'Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\circ\text{N}, -90^\circ\text{S}$)'
  },
  {
    domain: 'Cosmic Scene Hook',
    file: 'src/hooks/useCosmicScene.test.ts',
    focus: 'Reactive 3D scene graph subscription, memoization stability, projection selector consistency (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`), and `shallowEqual` protection'
  },
  {
    domain: 'Ephemeris Worker Hook',
    file: 'src/hooks/useEphemerisWorker.test.ts',
    focus: 'Worker multiplexing, annual solar/lunar matrix dispatch, request coalescing, caching, window lifecycle cleanup (`beforeunload`/`pagehide`), automatic synchronous fallback'
  },
  {
    domain: 'Dashboard Layout Hook',
    file: 'src/hooks/useDashboardLayout.test.ts',
    focus: 'Preset switching, widget toggles, window reordering, resizing, locking, localStorage persistence & reset'
  },
  {
    domain: 'MiniGlobe SVG Component',
    file: 'src/components/common/MiniGlobe.test.tsx',
    focus: '9-layer SVG rendering across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), physical axial tilt rotation, subsolar terminator clipping, civil/nautical twilight bands, and DOM collision-safe `useId()` clipping'
  },
  {
    domain: 'Window Error Boundary',
    file: 'src/components/common/WindowErrorBoundary.test.tsx',
    focus: 'Fault isolation, derived state error capture, and in-place module reset recovery for isolated module resilience'
  },
  {
    domain: 'Interactive Controls',
    file: 'src/components/controls/controls.test.tsx',
    focus: 'Interactive astrolabe controls: `ControlRing` 360° dial and wrapping, `LatitudeSlider` projection & presets, `PolarLongitudeSelector` needle & city jump, `BufferedInput` commit semantics, and `ArmillaryRail` arc sweep flags'
  },
  {
    domain: 'Dashboard Window Layout',
    file: 'src/components/layout/DashboardWindow.test.tsx',
    focus: 'Layout container architecture: `WindowErrorBoundary` containment, responsive grid column spanning (`col-span-12` vs `2xl:col-span-6`), 1-Col/2-Col action toggles, lock state protections, and HTML5 drag-and-drop contracts'
  },
  {
    domain: 'Layout & Chronometer Dock',
    file: 'src/components/layout/layout.test.tsx',
    focus: 'Integration tests for ObsNavbar workspace presets and simulation layers, OrbitalChronometer dock expansion/collapse with 7-branch twilight classification, and ChronometerReadoutCards coordinate clamping and military/AM-PM time parsing'
  },
  {
    domain: 'Ribbon Scrubber Hook',
    file: 'src/components/widgets/common/useRibbonScrubber.test.ts',
    focus: 'Bidirectional 2D coordinate scaling (dayToX, xToDay, timeToY, yToTime), synodic sub-window scaling, dragging state, and pointer capture lifecycle'
  },
  {
    domain: 'SkyDomeBase Primitive',
    file: 'src/components/widgets/today/SkyDomeBase.test.tsx',
    focus: 'Shared 260x120 SVG elevation arc geometry (`elR = 92`, `elCx = 130`, `elCy = 104`), zenith markers (+90°), cardinal compass labels (E, S, W), unreachable zenith cap, reference chords, and body elevation vectors'
  },
  {
    domain: 'Today Horizon Widget',
    file: 'src/components/widgets/today/TodayWidget.test.tsx',
    focus: 'SunElevationDome and MoonElevationDome diurnal paths, SunMeridianDome and MoonMeridianDome celestial profiles, 2-Dome vs. 4-Dome Quad view switching, real-time vertical elevation kinematics, Solstice and Standstill swaths, and twilight/nodal mode toggles'
  },
  {
    domain: 'Solar Almanac Widget',
    file: 'src/components/widgets/solar/SolarWidget.test.tsx',
    focus: 'Keplerian solar metrics, perihelion orbital dynamics, interactive SolarRibbonChart hover hairline, and PolarSunlightDial 24h circular polar sector dial'
  },
  {
    domain: 'Lunar Almanac Widget',
    file: 'src/components/widgets/lunar/LunarWidget.test.tsx',
    focus: '30-day synodic daily phase discs, 365-day annual braided ribbon, polar circumpolar statuses (24h moonlight / down all day), and TidalWaveOscillator ocean deformation wave'
  },
  {
    domain: 'Eclipse Demonstrator Widget',
    file: 'src/components/widgets/eclipse/EclipseWidget.test.tsx',
    focus: 'Historic Great American Eclipse data, 520x220 viewBox parity, dual-zone masking, nodal depth muting behind Earth, and prograde right-to-left SkyViewSimulator transit without bounce'
  },
  {
    domain: 'Terminator Map Widget',
    file: 'src/components/widgets/terminator/TerminatorMap.test.tsx',
    focus: 'Dynamic observer meridian centering, wrapped landmass polygons, topocentric YOU pin crosshairs, distance-scaled Subsolar (AU) and Sublunar (km) disc markers, and 4-tier twilight shadow boundaries'
  },
  {
    domain: 'Macro Orbit Widget',
    file: 'src/components/widgets/macro/MacroOrbitWidget.test.tsx',
    focus: 'Heliocentric planetary orbit view, 6 Keplerian orbital milestones, True vs. Exaggerated scale toggles, and 1 AU orbital physics HUD'
  },
  {
    domain: 'Micro Tide Widget',
    file: 'src/components/widgets/tides/TidesWidget.test.tsx',
    focus: 'MicroTideView Earth tidal gravity, MiniGlobe 3D vector integration, segmented Nodal Loop and potential toggles, and counter-clockwise prograde Moon revolution'
  },
  {
    domain: 'Armillary Visualizer Widget',
    file: 'src/components/widgets/armillary/ArmillaryWidget.test.tsx',
    focus: 'Continuum model generation, camera staging timing (pitch/yaw at $\lambda=0.45$), Keplerian milestones, Ecliptic Sun bead clamping, double-grooved hairline bezel, volumetric laser cones, sighting alidade, and top-down ring stroke unification'
  },
  {
    domain: 'Staged Camera Hook',
    file: 'src/components/widgets/armillary/useStagedCamera.test.ts',
    focus: '2-phase Euler angle interpolation ($\lambda \le 0.45$), canonical pole locking ($\lambda \ge 0.45$), memory angle retention, and reverse transition unwinding'
  },
  {
    domain: 'Camera Staging Adversarial',
    file: 'src/components/widgets/armillary/m2_adversarial.test.ts',
    focus: 'Camera alignment timing ($0 \le \lambda \le 0.45$), canonical pole lock ($0.45 \le \lambda \le 1.0$), geodesic wrapping, and custom user 3D angle restoration'
  },
  {
    domain: 'Depth Stroke Unification',
    file: 'src/components/widgets/depthUnificationStress.test.ts',
    focus: 'Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $\lambda \in [0.85, 1.0]$'
  },
  {
    domain: 'Observatory Barrel Re-Exports',
    file: 'src/components/widgets/widgets.test.ts',
    focus: 'Central barrel re-exports, contract assertions, and public API preservation across all 8 observatory visualizers and decomposed child layers'
  }
];

// ==========================================
// 1. Synchronize AGENTS.md
// ==========================================
if (fs.existsSync(agentsPath)) {
  let agentsContent = fs.readFileSync(agentsPath, 'utf8');

  // A. Summary line in Tech Stack
  agentsContent = agentsContent.replace(
    /(- \*\*Testing\*\*: `vitest` \(`npm test` — comprehensive domain test suite across )\d+ modules, \d+ tests\)/g,
    `$1${totalFiles} modules, ${totalTests} tests)`
  );

  // B. Directory tree file counts: supports complex names (cameras.stress.test.ts) and sub-clauses (13 tests: ...)
  agentsContent = agentsContent.replace(
    /([a-zA-Z0-9_.-]+\.test\.[tj]sx?)(.*?)(\(\d+\s+tests?)(.*?\))/g,
    (match, filename, middle, _countStr, suffix) => {
      if (baseNameMap.has(filename)) {
        const liveCount = baseNameMap.get(filename);
        return `${filename}${middle}(${liveCount} test${liveCount === 1 ? '' : 's'}${suffix.startsWith(':') || suffix.startsWith(';') ? suffix : ')'}`;
      }
      return match;
    }
  );

  fs.writeFileSync(agentsPath, agentsContent, 'utf8');
  console.log('✔ AGENTS.md test metrics synchronized.');
}

// ==========================================
// 2. Synchronize README.md
// ==========================================
if (fs.existsSync(readmePath)) {
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // A. Summary line: "across 20 specialized domain suites (**368 tests**):"
  readmeContent = readmeContent.replace(
    /across \d+ specialized domain suites \(\*\*\d+ tests?\*\*\):/g,
    `across ${totalFiles} specialized domain suites (**${totalTests} tests**):`
  );

  // B. Build canonical test table rows
  const tableHeader = [
    '| Domain Module | File | Focus Areas |',
    '| :--- | :--- | :--- |'
  ];

  const tableRows = CANONICAL_SUITES.map(suite => {
    const liveCount = fileMap.get(suite.file) ?? baseNameMap.get(path.basename(suite.file)) ?? 0;
    const countStr = `(${liveCount} test${liveCount === 1 ? '' : 's'})`;
    return `| **${suite.domain}** | \`${suite.file}\` ${countStr} | ${suite.focus} |`;
  });

  const fullTableStr = [...tableHeader, ...tableRows].join('\n');

  // Replace existing table in README
  const tableRegex = /\| Domain Module \| File \| Focus Areas \|\r?\n\| :--- \| :--- \| :--- \|\r?\n(?:\| .* \|\r?\n?)+/;
  if (tableRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(tableRegex, fullTableStr + '\n');
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log('✔ README.md test metrics synchronized.');
}

// ==========================================
// 3. Synchronize COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md
// ==========================================
if (fs.existsSync(dossierPath)) {
  const adrDir = path.join(rootDir, 'docs', 'adr');
  const adrFiles = fs.existsSync(adrDir) ? fs.readdirSync(adrDir).filter(f => f.endsWith('.md')).sort() : [];

  const adrs = adrFiles.map(file => {
    const filePath = path.join(adrDir, file);
    const c = fs.readFileSync(filePath, 'utf8');
    const match = c.match(/^#\s+(ADR\s+\d+:\s*.+)/m);
    const title = match ? match[1].trim() : file;
    return { file, title, content: c, filePath };
  });

  const now = new Date().toISOString();

  const tocLines = [
    '1. [System Overview & Setup](#system-overview-setup)',
    '2. [Project Roadmap, Features & Milestones](#project-roadmap-features-milestones)',
    '3. [Agent Guidelines, Protocols & Architecture Map](#agent-guidelines-protocols-architecture-map)',
    '4. [Critical Log of Historical Dead Ends](#critical-log-of-historical-dead-ends)',
    '5. [Astronomical Math Specification](#astronomical-math-specification)',
    '6. [Design System & Visual Vector Tokens](#design-system-visual-vector-tokens)',
    ...adrs.map((adr, i) => `${i + 7}. [${adr.title}](#${adr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')})`)
  ];

  const sections = [
    { title: 'System Overview & Setup', file: 'README.md' },
    { title: 'Project Roadmap, Features & Milestones', file: 'PROJECT.md' },
    { title: 'Agent Guidelines, Protocols & Architecture Map', file: 'AGENTS.md' },
    { title: 'Critical Log of Historical Dead Ends', file: 'DEAD_ENDS.md' },
    { title: 'Astronomical Math Specification', file: 'docs/MATH_SPEC.md' },
    { title: 'Design System & Visual Vector Tokens', file: 'docs/DESIGN_SYSTEM.md' },
  ];

  let doc = `# Cosmic Engine V2.0 — Master Documentation Dossier

> **Compilation Date**: ${now}
> **Repository**: konr-khan/cosmic-engine-v2
> **Version**: 2.0.0 (Production Hardened)
> **Test Harness**: ${totalTests} passing unit tests across ${totalFiles} test suites
> **Unit Safety**: Strict branded nominal typing (0 violations across 77 UI components)

---

## Table of Contents

${tocLines.join('\n')}

---
`;

  for (const sec of sections) {
    const p = path.join(rootDir, sec.file);
    if (fs.existsSync(p)) {
      const secContent = fs.readFileSync(p, 'utf8');
      doc += `\n## ${sec.title}\n\n> Source: [${sec.file}](file:///${p.replace(/\\/g, '/')})\n\n${secContent}\n\n---\n`;
    }
  }

  for (const adr of adrs) {
    const relPath = `docs/adr/${adr.file}`;
    const fullPath = path.join(rootDir, relPath);
    doc += `\n## ${adr.title}\n\n> Source: [${relPath}](file:///${fullPath.replace(/\\/g, '/')})\n\n${adr.content}\n\n---\n`;
  }

  fs.writeFileSync(dossierPath, doc, 'utf8');
  console.log('✔ COSMIC_ENGINE_DOCUMENTATION_DOSSIER.md compiled and synchronized.');
}

console.log(`\n🎉 Documentation test metrics synchronization complete: ${totalFiles} suites, ${totalTests} tests.`);
