#!/usr/bin/env node
// Initialize all governance baselines from current codebase state
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_DIR = '.memory-layer/baselines';
fs.mkdirSync(BASELINE_DIR, { recursive: true });

const srcFiles = globSync('src/**/*.js');

// --- silent-catches ---
function findSilentCatches(content) {
  let count = 0;
  const re = /catch\s*\([^)]*\)\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const body = m[1].trim();
    if (!body || /^\/\//.test(body) || /^console\./.test(body)) count++;
  }
  return count;
}
let silentCatches = 0;
const silentDetails = {};
for (const f of srcFiles) {
  const c = findSilentCatches(fs.readFileSync(f, 'utf8'));
  if (c > 0) { silentDetails[f] = c; silentCatches += c; }
}
fs.writeFileSync(
  path.join(BASELINE_DIR, 'silent-catches.json'),
  JSON.stringify({ count: silentCatches, files: silentDetails, updatedAt: new Date().toISOString() }, null, 2)
);

// --- eslint-disable ---
let eslintDisable = 0;
const eslintDetails = {};
for (const f of srcFiles) {
  const n = (fs.readFileSync(f, 'utf8').match(/eslint-disable/g) || []).length;
  if (n > 0) { eslintDetails[f] = n; eslintDisable += n; }
}
fs.writeFileSync(
  path.join(BASELINE_DIR, 'eslint-disable.json'),
  JSON.stringify({ count: eslintDisable, files: eslintDetails, updatedAt: new Date().toISOString() }, null, 2)
);

// --- duplicate-code ---
fs.writeFileSync(
  path.join(BASELINE_DIR, 'duplicate-code.json'),
  JSON.stringify({ count: 0, updatedAt: new Date().toISOString() }, null, 2)
);

// --- guardrails ---
fs.writeFileSync(
  path.join(BASELINE_DIR, 'guardrails.json'),
  JSON.stringify({ count: 0, files: {}, updatedAt: new Date().toISOString() }, null, 2)
);

// --- code-health (orphans) ---
const orphans = srcFiles.filter((f) => {
  const base = path.basename(f, '.js');
  if (base === 'index') return false;
  const requirePattern = new RegExp(`require\\(['"][^'"]*${base}['"]\\)`);
  const otherContent = srcFiles
    .filter((sf) => sf !== f)
    .map((sf) => fs.readFileSync(sf, 'utf8'))
    .join('\n');
  return !requirePattern.test(otherContent);
});
fs.writeFileSync(
  path.join(BASELINE_DIR, 'code-health.json'),
  JSON.stringify({ count: orphans.length, orphans, updatedAt: new Date().toISOString() }, null, 2)
);

console.log('Baselines initialized in', BASELINE_DIR);
console.log('  silent-catches:', silentCatches);
console.log('  eslint-disable:', eslintDisable);
console.log('  duplicate-code: 0');
console.log('  guardrails: 0');
console.log('  code-health orphans:', orphans.length);
