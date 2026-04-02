#!/usr/bin/env node
// Perception Check: Files tagged @perception-critical must have behavioral tests
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const srcFiles = globSync('src/**/*.js');
const perceptionFiles = [];

for (const f of srcFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('@perception-critical')) {
    perceptionFiles.push(f);
  }
}

if (perceptionFiles.length === 0) {
  console.log('[PASS] Behavioral pairing: no @perception-critical files found');
  process.exit(0);
}

const unpaired = [];
for (const f of perceptionFiles) {
  const base = path.basename(f, '.js');
  const behavioralTest = `tests/unit/${base}.behavioral.test.js`;
  if (!fs.existsSync(behavioralTest)) {
    unpaired.push({ file: f, expected: behavioralTest });
  }
}

if (unpaired.length > 0) {
  console.error(`[FAIL] Behavioral pairing violations (${unpaired.length}):`);
  unpaired.forEach(({ file, expected }) => {
    console.error(`  ${file} → missing ${expected}`);
  });
  process.exit(1);
}

console.log(`[PASS] Behavioral pairing: all ${perceptionFiles.length} @perception-critical file(s) paired`);
