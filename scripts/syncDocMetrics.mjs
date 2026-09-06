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
    domain: 'Cosmic Math',
    file: 'src/utils/cosmicMath.test.ts',
    focus: 'Polar daylight singularities ($\\pm 90^\\circ$, continuous twilight), UTC date invariance & `createUTCDate`, Julian dates, Meeus lunar series, disc illumination ($k$), nodal precession ($\\Omega$), 365/366-day solar & lunar matrices, eclipse presets, 3D projection obliquity & observer pin geometry, closed-form stereographic conformal ring invariants ($R_0 \\sec\\epsilon$), and 5-model Gyro-Morph continuum'
  },
  {
    domain: 'Domain Invariants & Physics Conservation',
    file: 'src/utils/cosmicMath/domainInvariants.test.ts',
    focus: 'Empirical physics conservation laws: Keplerian areal velocity invariance ($r^2 \\dot{\\theta} = \\text{const}$), vis-viva orbital energy conservation, syzygy collinearity bounds, and non-negative solar irradiance'
  },
  {
    domain: '3D Scene Graph Math',
    file: 'src/utils/cosmicMath/scene/scene.test.ts',
    focus: '3D coordinate consistency across frames (Heliocentric, Geocentric, Terrestrial), True vs. Exaggerated Keplerian scale modes, 6 seasonal milestone coordinates, dynamic $5.14^\\circ$ inclined lunar orbit with continuous nodal precession $\\Omega(t)$, and 3D syzygy shadow cones'
  },
  {
    domain: 'Scene Cameras Stress',
    file: 'src/utils/cosmicMath/scene/cameras.stress.test.ts',
    focus: 'Stress testing canonical camera projections (TopDown, Transverse, Axial, Euler) under boundary epochs, extreme orbital distances, and rapid coordinate shifts'
  },
  {
    domain: 'Scene Coordinate Adversarial',
    file: 'src/utils/cosmicMath/scene/m1_adversarial.test.ts',
    focus: 'Coordinate frame invariants, axial tilt matrix preservation ($23.439^\\circ$) in inertial space, and singular polar viewing angles'
  },
  {
    domain: 'MiniGlobe SVG Component',
    file: 'src/components/common/MiniGlobe.test.tsx',
    focus: '9-layer SVG rendering across 5 canonical view modes (`topdown`, `transverse`, `axial`, `euler3d`, `flat`), physical axial tilt rotation, subsolar terminator clipping, civil/nautical twilight bands, and DOM collision-safe `useId()` clipping'
  },
  {
    domain: 'Cosmic Scene Hook',
    file: 'src/hooks/useCosmicScene.test.ts',
    focus: 'Reactive 3D scene graph subscription, memoization stability, projection selector consistency (`useHeliocentricScene`, `useEclipseScene`, `useArmillaryScene`), and `shallowEqual` protection'
  },
  {
    domain: 'Observatory Widgets',
    file: 'src/components/widgets/widgets.test.ts',
    focus: 'Modular barrel exports, contract assertions, and integrated domain ephemeris across all 8 observatory window subsystems, including camera pole timing and depth stroke unification'
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
    domain: 'Staged Camera Hook',
    file: 'src/components/widgets/armillary/useStagedCamera.test.ts',
    focus: '2-phase Euler angle interpolation ($\\lambda \\le 0.45$), canonical pole locking ($\\lambda \\ge 0.45$), memory angle retention, and reverse transition unwinding'
  },
  {
    domain: 'Camera Staging Adversarial',
    file: 'src/components/widgets/armillary/m2_adversarial.test.ts',
    focus: 'Camera alignment timing ($0 \\le \\lambda \\le 0.45$), canonical pole lock ($0.45 \\le \\lambda \\le 1.0$), geodesic wrapping, and custom user 3D angle restoration'
  },
  {
    domain: 'Armillary Adversarial',
    file: 'src/utils/cosmicMath/armillary/m3_adversarial.test.ts',
    focus: 'Analytical closed-form Stereographic Ecliptic invariant ($R_0\\sec\\epsilon$), Sun bead clamping residuals ($< 1.42 \\times 10^{-13}\\text{ px}$), and 10,000-sample randomized Monte Carlo transitions'
  },
  {
    domain: 'Armillary Benchmark',
    file: 'src/utils/cosmicMath/armillary/armillaryBenchmark.test.ts',
    focus: '1,000-frame continuous latency budget (< 0.8 ms/frame), deterministic mathematical repeatability, non-NaN/non-Infinity geometric invariants across all 5 continuum modes, and milestone preservation'
  },
  {
    domain: 'Depth Stroke Unification',
    file: 'src/components/widgets/depthUnificationStress.test.ts',
    focus: 'Continuous stroke width scaling, dash gap closure, opacity interpolation, and duplicate path prevention over $\\lambda \\in [0.85, 1.0]$'
  },
  {
    domain: 'Cosmic Engine Hook',
    file: 'src/hooks/useCosmicEngine.test.ts',
    focus: 'Selective widget calculation flags, state overrides, degenerate pole longitudes ($90^\\circ\\text{N}, -90^\\circ\\text{S}$)'
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
    domain: 'Window Error Boundary',
    file: 'src/components/common/WindowErrorBoundary.test.tsx',
    focus: 'Fault isolation, derived state error capture, and in-place module reset recovery for isolated module resilience'
  },
  {
    domain: 'Cosmic State Store',
    file: 'src/store/cosmicStore.test.ts',
    focus: 'Shallow equality memoization, subscriber notifications, time roll-over, background tab delta clamping, UTC multi-day wrapping'
  },
  {
    domain: 'Unit-Safety AST Guardrails',
    file: 'src/types/unitSafety.test.ts',
    focus: 'Babel AST lint enforcement banning `asDegrees()` and `asRadians()` across all UI components (`src/components/**`), ensuring verified boundary conversion gatekeepers'
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

console.log(`\n🎉 Documentation test metrics synchronization complete: ${totalFiles} suites, ${totalTests} tests.`);
