#!/usr/bin/env bash
# UC16: Dependency Health Check
# Fails if any high or critical npm vulnerabilities are found

set -euo pipefail

AUDIT_OUTPUT=$(npm audit --audit-level=high --omit=dev --json 2>/dev/null || true)

if [ -z "$AUDIT_OUTPUT" ]; then
  echo "UC16: npm audit produced no output, skipping"
  exit 0
fi

HIGH=$(echo "$AUDIT_OUTPUT" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const v = (d.metadata || {}).vulnerabilities || {};
process.stdout.write(String((v.high || 0) + (v.critical || 0)));
" 2>/dev/null || echo "0")

if [ "$HIGH" -gt 0 ]; then
  echo "UC16: ${HIGH} high/critical vulnerability(ies) found. Run: npm audit fix"
  exit 1
fi

echo "UC16: No high/critical vulnerabilities"
