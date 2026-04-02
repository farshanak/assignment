#!/usr/bin/env node
// Iron Dome Ratchet: Silent/trivial catch blocks can only go down
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_FILE = '.memory-layer/baselines/silent-catches.json';

function findSilentCatches(content) {
  const matches = [];
  // Match catch blocks that are empty or only have a comment or console.log
  const catchRegex = /catch\s*\([^)]*\)\s*\{([^}]*)\}/g;
  let m;
  while ((m = catchRegex.exec(content)) !== null) {
    const body = m[1].trim();
    if (body === '' || /^\/\/.*$/.test(body) || /^console\.(log|warn|error)/.test(body)) {
      matches.push(m[0]);
    }
  }
  return matches.length;
}

const files = globSync('src/**/*.js');
let total = 0;
const details = {};

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const count = findSilentCatches(content);
  if (count > 0) {
    details[f] = count;
    total += count;
  }
}

// Load or create baseline
let baseline = { count: total, files: details };
if (fs.existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

if (total > baseline.count) {
  console.error(`[FAIL] Silent catches: ${total} found, baseline is ${baseline.count}. New silent catches are not allowed.`);
  if (Object.keys(details).length) {
    for (const [f, c] of Object.entries(details)) console.error(`  ${f}: ${c}`);
  }
  process.exit(1);
}

if (total < baseline.count) {
  // Ratchet down — update baseline
  const updated = { count: total, files: details, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(updated, null, 2));
  console.log(`[PASS] Silent catches: ${total} (ratcheted down from ${baseline.count})`);
} else {
  console.log(`[PASS] Silent catches: ${total} (at baseline ${baseline.count})`);
}
