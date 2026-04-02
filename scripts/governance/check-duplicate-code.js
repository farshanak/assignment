#!/usr/bin/env node
// DRY Enforcement: Copy-paste detection within amnesty baseline
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_FILE = '.memory-layer/baselines/duplicate-code.json';
const WINDOW = 6; // lines for clone detection

function getChunks(content, window) {
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
  const chunks = [];
  for (let i = 0; i <= lines.length - window; i++) {
    chunks.push(lines.slice(i, i + window).join('\n'));
  }
  return chunks;
}

const files = globSync('src/**/*.js');
const allChunks = new Map();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const chunks = getChunks(content, WINDOW);
  for (const chunk of chunks) {
    if (!allChunks.has(chunk)) allChunks.set(chunk, []);
    allChunks.get(chunk).push(f);
  }
}

const clones = [...allChunks.values()].filter((locs) => new Set(locs).size > 1);
const cloneCount = clones.length;

let baseline = { count: cloneCount, updatedAt: new Date().toISOString() };
if (fs.existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

if (cloneCount > baseline.count) {
  console.error(`[FAIL] Duplicate code: ${cloneCount} clone groups, baseline is ${baseline.count}.`);
  console.error('New copy-paste blocks detected. Extract to shared utility instead.');
  process.exit(1);
}

if (cloneCount < baseline.count) {
  const updated = { count: cloneCount, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(updated, null, 2));
  console.log(`[PASS] Duplicate code: ${cloneCount} (ratcheted down from ${baseline.count})`);
} else {
  console.log(`[PASS] Duplicate code: ${cloneCount} clone groups (at baseline)`);
}
