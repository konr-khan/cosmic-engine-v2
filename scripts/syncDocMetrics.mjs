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

  // C. Ensure m3_adversarial.test.ts and unitSafety.test.ts are in AGENTS.md tree
  if (!agentsContent.includes('m3_adversarial.test.ts') && baseNameMap.has('m3_adversarial.test.ts')) {
    const m3Count = baseNameMap.get('m3_adversarial.test.ts');
    agentsContent = agentsContent.replace(
      /(│   │   │   ├── generator\.ts      # generateArmillaryModel with staged morph & clamped Sun bead\n)/,
      `$1│   │   │   ├── m3_adversarial.test.ts # Vitest tests for closed-form invariants (${m3Count} tests)\n`
    );
  }

  if (!agentsContent.includes('unitSafety.test.ts') && baseNameMap.has('unitSafety.test.ts')) {
    const unitCount = baseNameMap.get('unitSafety.test.ts');
    agentsContent = agentsContent.replace(
      /(│   │   ├── store\.ts             # Store contracts & window layout types\n)/,
      `$1│   │   ├── unitSafety.test.ts   # Vitest tests for AST unit-safety guardrails (${unitCount} tests)\n`
    );
  }

  fs.writeFileSync(agentsPath, agentsContent, 'utf8');
  console.log('✔ AGENTS.md test metrics synchronized.');
}

// ==========================================
// 2. Synchronize README.md
// ==========================================
if (fs.existsSync(readmePath)) {
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // A. Summary line: "across 15 specialized domain suites (**326 tests**):"
  readmeContent = readmeContent.replace(
    /across \d+ specialized domain suites \(\*\*\d+ tests?\*\*\):/g,
    `across ${totalFiles} specialized domain suites (**${totalTests} tests**):`
  );

  // B. Update existing rows `src/...test.ts` (X tests)
  readmeContent = readmeContent.replace(
    /(`src\/[^`]+?\.test\.[tj]sx?`)\s*\(\d+\s+tests?\)/g,
    (match, codePath) => {
      const cleanPath = codePath.replace(/`/g, '');
      if (fileMap.has(cleanPath)) {
        const liveCount = fileMap.get(cleanPath);
        return `${codePath} (${liveCount} test${liveCount === 1 ? '' : 's'})`;
      }
      return match;
    }
  );

  // C. Line-based insertion for any missing suites in table
  const lines = readmeContent.split(/\r?\n/);
  let linesModified = false;

  const m2Idx = lines.findIndex(l => l.includes('m2_adversarial.test.ts'));
  if (m2Idx !== -1 && !readmeContent.includes('m3_adversarial.test.ts') && fileMap.has('src/utils/cosmicMath/armillary/m3_adversarial.test.ts')) {
    const m3Count = fileMap.get('src/utils/cosmicMath/armillary/m3_adversarial.test.ts');
    lines.splice(
      m2Idx + 1,
      0,
      `| **Armillary Adversarial** | \`src/utils/cosmicMath/armillary/m3_adversarial.test.ts\` (${m3Count} tests) | Analytical closed-form Stereographic Ecliptic invariant ($R_0\\sec\\epsilon$), Sun bead clamping residuals ($< 1.42 \\times 10^{-13}\\text{ px}$), and 10,000-sample randomized Monte Carlo transitions |`
    );
    linesModified = true;
  }

  const storeIdx = lines.findIndex(l => l.includes('cosmicStore.test.ts'));
  if (storeIdx !== -1 && !readmeContent.includes('unitSafety.test.ts') && fileMap.has('src/types/unitSafety.test.ts')) {
    const unitCount = fileMap.get('src/types/unitSafety.test.ts');
    lines.splice(
      storeIdx + 1,
      0,
      `| **Unit-Safety AST Guardrails** | \`src/types/unitSafety.test.ts\` (${unitCount} tests) | Babel AST lint enforcement banning \`asDegrees()\` and \`asRadians()\` across all UI components (\`src/components/**\`), ensuring verified boundary conversion gatekeepers |`
    );
    linesModified = true;
  }

  if (linesModified) {
    readmeContent = lines.join('\n');
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log('✔ README.md test metrics synchronized.');
}

console.log(`\n🎉 Documentation test metrics synchronization complete: ${totalFiles} suites, ${totalTests} tests.`);
