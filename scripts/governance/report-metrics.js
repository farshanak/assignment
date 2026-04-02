#!/usr/bin/env node
// Metrics: Generate markdown governance report from collected metrics
'use strict';

const fs = require('fs');
const path = require('path');

const METRICS_FILE = '.memory-layer/logs/metrics.json';
const REPORT_FILE = '.memory-layer/logs/governance-report.md';

if (!fs.existsSync(METRICS_FILE)) {
  console.error('[FAIL] No metrics found. Run collect-metrics.js first.');
  process.exit(1);
}

const history = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
const latest = history[history.length - 1];
const prev = history.length > 1 ? history[history.length - 2] : null;

function delta(current, previous, key) {
  if (!previous) return '';
  const d = current[key] - previous[key];
  return d === 0 ? '' : d > 0 ? ` (+${d})` : ` (${d})`;
}

const report = `# Governance Report

Generated: ${latest.timestamp}
Commit: \`${latest.sha}\`

## Source Metrics

| Metric | Value | Change |
|--------|-------|--------|
| Source files | ${latest.source.files} | ${prev ? delta({ v: latest.source.files }, { v: prev.source.files }, 'v') : '—'} |
| Source LOC | ${latest.source.loc} | ${prev ? delta({ v: latest.source.loc }, { v: prev.source.loc }, 'v') : '—'} |
| Test files | ${latest.tests.files} | ${prev ? delta({ v: latest.tests.files }, { v: prev.tests.files }, 'v') : '—'} |
| Test LOC | ${latest.tests.loc} | ${prev ? delta({ v: latest.tests.loc }, { v: prev.tests.loc }, 'v') : '—'} |
| Test/Source ratio | ${latest.tests.ratio}x | — |

## Governance Tax

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| ESLint suppressions | ${latest.eslintDisable} | 0 new | ${latest.eslintDisable === 0 ? '✓' : '⚠'} |
| Skipped tests | ${latest.skippedTests} | 0 new | ${latest.skippedTests === 0 ? '✓' : '⚠'} |
| Governance scripts | ${latest.governanceScripts} | ≥ 15 | ${latest.governanceScripts >= 15 ? '✓' : '⚠'} |

## History (last ${Math.min(history.length, 10)} entries)

${history.slice(-10).map((h) => `- \`${h.sha}\` ${h.timestamp}: ${h.source.loc} LOC, ratio ${h.tests.ratio}x`).join('\n')}
`;

fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
fs.writeFileSync(REPORT_FILE, report);
console.log(`[PASS] Governance report written to ${REPORT_FILE}`);
console.log(report);
