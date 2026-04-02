#!/usr/bin/env node
// Dependency Health: No circular import cycles in src/
'use strict';

const fs = require('fs');
const path = require('path');
const { globSync } = require('./lib/glob-compat');

function buildGraph(files) {
  const graph = {};
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const deps = [];
    const requireRe = /require\(['"](\.[^'"]+)['"]\)/g;
    let m;
    while ((m = requireRe.exec(content)) !== null) {
      const resolved = path.resolve(path.dirname(f), m[1]);
      // Normalize: try .js extension
      const withExt = resolved.endsWith('.js') ? resolved : resolved + '.js';
      if (fs.existsSync(withExt)) {
        deps.push(path.relative(process.cwd(), withExt));
      }
    }
    graph[f] = deps;
  }
  return graph;
}

function detectCycles(graph) {
  const visited = new Set();
  const stack = new Set();
  const cycles = [];

  function dfs(node, path) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const dep of graph[node] || []) {
      dfs(dep, [...path, node]);
    }
    stack.delete(node);
  }

  for (const node of Object.keys(graph)) dfs(node, []);
  return cycles;
}

const files = globSync('src/**/*.js');
const graph = buildGraph(files);
const cycles = detectCycles(graph);

if (cycles.length > 0) {
  console.error(`[FAIL] Circular dependencies detected (${cycles.length}):`);
  cycles.forEach((c) => console.error(`  ${c.join(' → ')}`));
  process.exit(1);
}

console.log(`[PASS] Circular dependencies: none found in ${files.length} source files`);
