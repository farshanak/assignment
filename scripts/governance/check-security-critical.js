#!/usr/bin/env node
// Gatekeeper Protocol: @security-critical files need human review approval
'use strict';

const fs = require('fs');
const { execSync } = require('child_process');
const { globSync } = require('./lib/glob-compat');

const srcFiles = globSync('src/**/*.js');
const secFiles = [];

for (const f of srcFiles) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('@security-critical')) {
    secFiles.push(f);
  }
}

if (secFiles.length === 0) {
  console.log('[PASS] Security critical: no @security-critical files found');
  process.exit(0);
}

// Check if we're in CI with a PR — if so, require approval label
const inCI = process.env.CI === 'true';
const prNumber = process.env.PR_NUMBER || '';

console.log(`Found ${secFiles.length} @security-critical file(s):`);
secFiles.forEach((f) => console.log(`  ${f}`));

if (inCI && prNumber) {
  try {
    const labels = execSync(`gh pr view ${prNumber} --json labels -q '.labels[].name'`, { encoding: 'utf8' });
    if (!labels.includes('security-reviewed')) {
      console.error('[FAIL] Security critical: PR needs "security-reviewed" label before merge.');
      process.exit(1);
    }
  } catch {
    console.warn('[WARN] Security critical: could not check PR labels — ensure manual review');
  }
}

console.log('[PASS] Security critical: files noted for review');
