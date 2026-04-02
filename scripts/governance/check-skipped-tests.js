#!/usr/bin/env node
// Test Discipline: Max 5% skipped tests
'use strict';

const fs = require('fs');
const { globSync } = require('./lib/glob-compat');

const testFiles = [...globSync('tests/**/*.js')];

let totalTests = 0;
let skippedTests = 0;

for (const f of testFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const allIt = (content.match(/\b(?:it|test)\s*\(/g) || []).length;
  const skipped = (content.match(/\b(?:it|test)\.skip\s*\(|xtest\s*\(|xit\s*\(/g) || []).length;
  totalTests += allIt;
  skippedTests += skipped;
}

const skipRate = totalTests > 0 ? (skippedTests / totalTests) * 100 : 0;

if (skipRate > 5) {
  console.error(`[FAIL] Skipped tests: ${skippedTests}/${totalTests} (${skipRate.toFixed(1)}%) exceeds 5% limit.`);
  console.error('Remove .skip() or fix the skipped tests.');
  process.exit(1);
}

console.log(`[PASS] Skipped tests: ${skippedTests}/${totalTests} (${skipRate.toFixed(1)}%)`);
