#!/usr/bin/env node
// Schema Validation: System boundaries (routes) should validate input schemas
// For JS projects without Zod, checks for manual validation on req.body
'use strict';

const fs = require('fs');
const { globSync } = require('./lib/glob-compat');

const routeFiles = globSync('src/routes/**/*.js');
const violations = [];

for (const f of routeFiles) {
  const content = fs.readFileSync(f, 'utf8');
  // Routes that access req.body without any validation check
  const bodyAccess = (content.match(/req\.body/g) || []).length;
  // Accept: if (!prop), if (prop === undefined), typeof checks, or zod .parse()
  const hasValidation = /if\s*\(!\w+\)|if\s*\(!.*req\.body|\w+\s*===\s*undefined|typeof\s+\w+|\.parse\(|\.safeParse\(/.test(content);

  if (bodyAccess > 0 && !hasValidation) {
    violations.push(`${f}: accesses req.body (${bodyAccess}x) without schema validation`);
  }
}

if (violations.length > 0) {
  console.error(`[FAIL] Schema boundaries (${violations.length} violations):`);
  violations.forEach((v) => console.error(`  ${v}`));
  console.error('Add input validation at route boundaries (or install zod)');
  process.exit(1);
}

console.log(`[PASS] Schema boundaries: ${routeFiles.length} route file(s) have input validation`);
