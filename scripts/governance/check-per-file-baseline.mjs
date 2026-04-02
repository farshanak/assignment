#!/usr/bin/env node
// Coverage Fortress: Per-file coverage ratchet (±0.2%), 80% floor, 70% global minimum
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const BASELINE_FILE = '.memory-layer/baselines/coverage.json';
const FLOOR = 80;       // New files must hit 80%
const GLOBAL_MIN = 70;  // Global minimum
const TOLERANCE = 0.2;  // ±0.2% tolerance for existing files

function runCoverage() {
  try {
    execSync('npm test -- --coverage --coverageReporters=json --silent', { stdio: 'pipe' });
  } catch {
    // Tests may still produce coverage even on failure
  }

  if (!existsSync('coverage/coverage-summary.json')) {
    console.error('[FAIL] Coverage: coverage-summary.json not found. Run npm test --coverage first.');
    process.exit(1);
  }

  return JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
}

const summary = runCoverage();
const total = summary.total;
const globalLines = total.lines.pct;

if (globalLines < GLOBAL_MIN) {
  console.error(`[FAIL] Coverage Fortress: global line coverage ${globalLines}% < ${GLOBAL_MIN}% minimum`);
  process.exit(1);
}

// Per-file check
let baseline = {};
if (existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
}

const regressions = [];
const newBaseline = { ...baseline };

for (const [file, data] of Object.entries(summary)) {
  if (file === 'total') continue;
  const pct = data.lines.pct;
  const rel = file.replace(process.cwd() + '/', '');

  if (baseline[rel] !== undefined) {
    // Existing file: cannot drop more than TOLERANCE
    const delta = pct - baseline[rel];
    if (delta < -TOLERANCE) {
      regressions.push(`${rel}: ${pct}% (was ${baseline[rel]}%, dropped ${Math.abs(delta).toFixed(1)}%)`);
    }
    newBaseline[rel] = Math.max(pct, baseline[rel]); // ratchet up only
  } else {
    // New file: must meet floor
    if (pct < FLOOR) {
      regressions.push(`${rel}: ${pct}% (new file must meet ${FLOOR}% floor)`);
    }
    newBaseline[rel] = pct;
  }
}

if (regressions.length > 0) {
  console.error(`[FAIL] Coverage Fortress: ${regressions.length} regression(s):`);
  regressions.forEach((r) => console.error(`  ${r}`));
  process.exit(1);
}

mkdirSync('.memory-layer/baselines', { recursive: true });
writeFileSync(BASELINE_FILE, JSON.stringify(newBaseline, null, 2));
console.log(`[PASS] Coverage Fortress: global ${globalLines}%, all per-file baselines met`);
