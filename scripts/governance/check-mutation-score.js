#!/usr/bin/env node
// Test Quality: 70% mutation score on changed files (uses stryker if available)
'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');

const THRESHOLD = 70;

// Check if stryker is installed
function strykerInstalled() {
  try {
    execSync('npx stryker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Check if stryker config exists
function strykerConfigExists() {
  return fs.existsSync('stryker.config.mjs') || fs.existsSync('stryker.config.js') || fs.existsSync('.stryker.conf.mjs');
}

if (!strykerInstalled() || !strykerConfigExists()) {
  console.log('[SKIP] Mutation score: Stryker not installed or not configured — install @stryker-mutator/core');
  console.log(`       Target threshold: ${THRESHOLD}%`);
  process.exit(0);
}

console.log(`Running Stryker mutation testing (threshold: ${THRESHOLD}%)...`);

const result = spawnSync('npx', ['stryker', 'run', '--reporters', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (!fs.existsSync('reports/mutation/mutation.json')) {
  console.warn('[WARN] Mutation score: Stryker ran but no report found.');
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json', 'utf8'));
const killed = report.files
  ? Object.values(report.files).reduce((s, f) => s + (f.mutants || []).filter((m) => m.status === 'Killed').length, 0)
  : 0;
const total = report.files
  ? Object.values(report.files).reduce((s, f) => s + (f.mutants || []).length, 0)
  : 0;
const score = total > 0 ? (killed / total) * 100 : 100;

if (score < THRESHOLD) {
  console.error(`[FAIL] Mutation score: ${score.toFixed(1)}% < ${THRESHOLD}% threshold`);
  process.exit(1);
}

console.log(`[PASS] Mutation score: ${score.toFixed(1)}% (${killed}/${total} mutants killed)`);
