#!/usr/bin/env node
// Mock Quality: No forbidden mock patterns (over-specified mocks, jest.mock of internal modules)
'use strict';

const fs = require('fs');
const { globSync } = require('./lib/glob-compat');

const FORBIDDEN = [
  { pattern: /jest\.mock\(['"]\.\.\//, desc: 'jest.mock of relative internal module' },
  { pattern: /mockReturnValue\(undefined\)/, desc: 'mockReturnValue(undefined) — use mockReturnValue() or remove' },
  { pattern: /\.mockImplementation\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/, desc: 'empty mockImplementation — use jest.fn()' },
];

const files = globSync('tests/**/*.js');
const violations = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    for (const { pattern, desc } of FORBIDDEN) {
      if (pattern.test(line)) {
        violations.push(`${f}:${i + 1} — ${desc}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`[FAIL] Adversarial mocks detected (${violations.length}):`);
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}

console.log(`[PASS] Mock quality: no forbidden patterns in ${files.length} test files`);
