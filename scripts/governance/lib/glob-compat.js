// Compatibility shim for globSync across Node versions
'use strict';

const fs = require('fs');
const path = require('path');

function globSync(pattern, { cwd = process.cwd(), ignore = [] } = {}) {
  // Simple glob implementation for common patterns like src/**/*.js
  const results = [];
  const [base, ...rest] = pattern.split('/**/');
  const ext = rest.length ? rest[rest.length - 1].replace('*', '') : '';

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(cwd, full);
      if (ignore.some((ig) => rel.startsWith(ig))) continue;
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        if (ext === '' || entry.name.endsWith(ext)) {
          results.push(rel);
        }
      }
    }
  }

  const baseDir = path.resolve(cwd, base);
  if (rest.length === 0) {
    // No **, just return matching files in base dir
    if (fs.existsSync(baseDir) && fs.statSync(baseDir).isFile()) return [base];
    return [];
  }
  walk(baseDir);
  return results;
}

module.exports = { globSync };
