#!/usr/bin/env node
// Metrics: Collect governance tax metrics and write to .memory-layer/logs/
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { globSync } = require('./lib/glob-compat');

const LOG_DIR = '.memory-layer/logs';
const METRICS_FILE = path.join(LOG_DIR, 'metrics.json');

function countLines(files) {
  return files.reduce((s, f) => {
    try { return s + fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).length; } catch { return s; }
  }, 0);
}

function getGitSha() {
  try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
}

const srcFiles = globSync('src/**/*.js');
const testFiles = globSync('tests/**/*.js');

const metrics = {
  timestamp: new Date().toISOString(),
  sha: getGitSha(),
  source: {
    files: srcFiles.length,
    loc: countLines(srcFiles),
  },
  tests: {
    files: testFiles.length,
    loc: countLines(testFiles),
    ratio: srcFiles.length > 0 ? (countLines(testFiles) / countLines(srcFiles)).toFixed(2) : 0,
  },
  eslintDisable: (
    srcFiles.reduce((s, f) => s + (fs.readFileSync(f, 'utf8').match(/eslint-disable/g) || []).length, 0)
  ),
  skippedTests: (
    testFiles.reduce((s, f) => s + (fs.readFileSync(f, 'utf8').match(/\.skip\s*\(/g) || []).length, 0)
  ),
  governanceScripts: globSync('scripts/governance/**/*.js').length + globSync('scripts/governance/**/*.mjs').length,
};

fs.mkdirSync(LOG_DIR, { recursive: true });

// Append to history
let history = [];
if (fs.existsSync(METRICS_FILE)) {
  try { history = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8')); } catch { history = []; }
}
history.push(metrics);
// Keep last 100 entries
if (history.length > 100) history = history.slice(-100);
fs.writeFileSync(METRICS_FILE, JSON.stringify(history, null, 2));

console.log('[PASS] Metrics collected:');
console.log(`  Source: ${metrics.source.files} files, ${metrics.source.loc} LOC`);
console.log(`  Tests:  ${metrics.tests.files} files, ${metrics.tests.loc} LOC (${metrics.tests.ratio}x ratio)`);
console.log(`  ESLint suppressions: ${metrics.eslintDisable}`);
console.log(`  Skipped tests: ${metrics.skippedTests}`);
