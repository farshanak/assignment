#!/usr/bin/env node
// SRP Guardrails: File LOC (600/300/75), function LOC (50), Cyclomatic Complexity (15)
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

const BASELINE_FILE = '.memory-layer/baselines/guardrails.json';

const LIMITS = {
  file: { src: 300, test: 600, script: 150 },
  function: 50,
  complexity: 15,
};

function countFunctionComplexity(body) {
  // Approximate cyclomatic complexity: 1 + branch keywords
  const branches = (body.match(/\b(if|else|while|for|case|catch|\?\s*:|\?\?|&&|\|\|)\b/g) || []).length;
  return 1 + branches;
}

function analyzeFile(f) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const nonBlank = lines.filter((l) => l.trim() && !l.trim().startsWith('//')).length;
  const violations = [];

  // File size
  const isTest = f.startsWith('tests/');
  const isScript = f.startsWith('scripts/');
  const limit = isTest ? LIMITS.file.test : isScript ? LIMITS.file.script : LIMITS.file.src;
  if (nonBlank > limit) {
    violations.push(`File LOC ${nonBlank} exceeds limit ${limit}`);
  }

  // Function size (simple heuristic)
  const funcRe = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*\{)/g;
  let m;
  while ((m = funcRe.exec(content)) !== null) {
    const start = content.slice(0, m.index).split('\n').length;
    // Find matching closing brace (simple depth counter)
    let depth = 0, i = m.index;
    let funcBody = '';
    while (i < content.length) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') { depth--; if (depth === 0) { funcBody = content.slice(m.index, i + 1); break; } }
      i++;
    }
    if (!funcBody) continue;
    const funcLines = funcBody.split('\n').filter((l) => l.trim()).length;
    if (funcLines > LIMITS.function) {
      violations.push(`Function at line ${start}: ${funcLines} LOC exceeds limit ${LIMITS.function}`);
    }
    const cc = countFunctionComplexity(funcBody);
    if (cc > LIMITS.complexity) {
      violations.push(`Function at line ${start}: CC ${cc} exceeds limit ${LIMITS.complexity}`);
    }
  }

  return violations;
}

const srcFiles = [...globSync('src/**/*.js'), ...globSync('tests/**/*.js')];
const allViolations = {};
let total = 0;

for (const f of srcFiles) {
  const v = analyzeFile(f);
  if (v.length) { allViolations[f] = v; total += v.length; }
}

let baseline = { count: total, files: allViolations };
if (fs.existsSync(BASELINE_FILE)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

if (total > baseline.count) {
  console.error(`[FAIL] Guardrails: ${total} violations, baseline is ${baseline.count}`);
  for (const [f, vs] of Object.entries(allViolations)) {
    vs.forEach((v) => console.error(`  ${f}: ${v}`));
  }
  process.exit(1);
}

if (total < baseline.count) {
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ count: total, files: allViolations, updatedAt: new Date().toISOString() }, null, 2));
  console.log(`[PASS] Guardrails: ${total} violations (ratcheted down from ${baseline.count})`);
} else {
  console.log(`[PASS] Guardrails: ${total} violations at baseline`);
}
