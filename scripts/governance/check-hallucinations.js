#!/usr/bin/env node
// Supply Chain: Block AI-hallucinated or suspicious packages
'use strict';

const fs = require('fs');

// Known hallucinated / typosquatted package names that AI models sometimes generate
const BLOCKLIST = [
  'lodash.get.set',
  'express-validator-middleware',
  'express-async-errors-handler',
  'jest-supertest',
  'supertest-express',
  'node-fetch-retry',
  'axios-retry-interceptor',
  'dotenv-safe-extended',
  'jsonwebtoken-express',
  'mongoose-auto-increment',
  'sequelize-paginate',
  'pg-promise-helper',
];

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies,
};

const hits = Object.keys(allDeps).filter((d) => BLOCKLIST.includes(d));

if (hits.length > 0) {
  console.error(`[FAIL] Supply chain: hallucinated/blocked packages found: ${hits.join(', ')}`);
  process.exit(1);
}

console.log(`[PASS] Supply chain: no hallucinated packages (checked ${Object.keys(allDeps).length} deps)`);
