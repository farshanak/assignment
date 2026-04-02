#!/usr/bin/env node
// Rising Tide: Test LOC must not exceed 2x source LOC
'use strict';

const fs = require('fs');
const { globSync } = require('./lib/glob-compat');

function countLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((l) => l.trim()).length;
}

const srcFiles = globSync('src/**/*.js');
const testFiles = [
  ...globSync('tests/**/*.js'),
];

const srcLoc = srcFiles.reduce((s, f) => s + countLines(f), 0);
const testLoc = testFiles.reduce((s, f) => s + countLines(f), 0);
const ratio = srcLoc > 0 ? testLoc / srcLoc : 0;

console.log(`Source LOC: ${srcLoc}, Test LOC: ${testLoc}, Ratio: ${ratio.toFixed(2)}x`);

if (ratio > 2.0) {
  console.error(`[FAIL] Mock Tax: test LOC (${testLoc}) exceeds 2x source LOC (${srcLoc * 2}).`);
  console.error('Delete bloated unit tests and replace with integration tests.');
  process.exit(1);
}

console.log(`[PASS] Mock Tax: ${ratio.toFixed(2)}x (limit: 2.0x)`);
