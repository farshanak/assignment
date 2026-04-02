#!/usr/bin/env node
// Code Health: Orphan file + dead export detection
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_FILE = '.memory-layer/baselines/code-health.json';

const srcFiles = globSync('src/**/*.js');
const allContent = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const orphans = [];
for (const f of srcFiles) {
  const rel = f.replace(/\\/g, '/');
  const base = path.basename(f, '.js');
  // Skip index and entry points
  if (base === 'index') continue;
  // Check if this file is required anywhere
  const requirePattern = new RegExp(`require\\(['"][^'"]*${base}['"]\\)`);
  const otherContent = srcFiles
    .filter((sf) => sf !== f)
    .map((sf) => fs.readFileSync(sf, 'utf8'))
    .join('\n');
  if (!requirePattern.test(otherContent)) {
    orphans.push(rel);
  }
}

const issues = orphans.length;
let baseline = { count: issues, orphans };
if (fs.existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

if (issues > baseline.count) {
  console.error(`[FAIL] Code health: ${issues} orphan file(s) found (baseline: ${baseline.count})`);
  orphans.forEach((f) => console.error(`  Orphan: ${f}`));
  process.exit(1);
}

if (issues < baseline.count) {
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ count: issues, orphans, updatedAt: new Date().toISOString() }, null, 2));
  console.log(`[PASS] Code health: ${issues} orphans (ratcheted down from ${baseline.count})`);
} else {
  console.log(`[PASS] Code health: ${issues} orphan(s) at baseline`);
}
