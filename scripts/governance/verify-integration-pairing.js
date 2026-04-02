#!/usr/bin/env node
// Buddy System: Every route file must have a corresponding integration test
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const routeFiles = globSync('src/routes/**/*.js');
const unpaired = [];

for (const route of routeFiles) {
  const base = path.basename(route, '.js');
  const integrationTest = `tests/integration/${base}.integration.test.js`;
  if (!fs.existsSync(integrationTest)) {
    // Also check legacy flat layout
    const altTest = `tests/integration/${base}.test.js`;
    if (!fs.existsSync(altTest)) {
      unpaired.push({ route, expected: integrationTest });
    }
  }
}

if (unpaired.length > 0) {
  console.error(`[FAIL] Integration pairing violations (${unpaired.length}):`);
  unpaired.forEach(({ route, expected }) => {
    console.error(`  ${route} → missing ${expected}`);
  });
  process.exit(1);
}

console.log(`[PASS] Integration pairing: all ${routeFiles.length} route(s) have integration tests`);
