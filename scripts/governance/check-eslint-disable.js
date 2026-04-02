#!/usr/bin/env node
// Escape Hatch Gate: No new eslint-disable suppressions beyond baseline
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_FILE = '.memory-layer/baselines/eslint-disable.json';

const files = globSync('src/**/*.js');
let total = 0;
const details = {};

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/eslint-disable/g) || [];
  if (matches.length > 0) {
    details[f] = matches.length;
    total += matches.length;
  }
}

let baseline = { count: total, files: details };
if (fs.existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

if (total > baseline.count) {
  console.error(`[FAIL] ESLint suppressions: ${total} found, baseline is ${baseline.count}.`);
  console.error('No new eslint-disable comments allowed. Fix the lint issue instead.');
  process.exit(1);
}

if (total < baseline.count) {
  const updated = { count: total, files: details, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(updated, null, 2));
  console.log(`[PASS] ESLint suppressions: ${total} (ratcheted down from ${baseline.count})`);
} else {
  console.log(`[PASS] ESLint suppressions: ${total} (at baseline ${baseline.count})`);
}
