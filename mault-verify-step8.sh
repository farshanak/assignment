#!/usr/bin/env bash
set -uo pipefail

PASS_COUNT=0
FAIL_COUNT=0
PENDING_COUNT=0
CHECK_RESULTS=()

PROOF_DIR=".mault"
PROOF_FILE="$PROOF_DIR/verify-step8.proof"

record_result() { CHECK_RESULTS+=("CHECK $1: $2 - $3"); }
print_pass()    { echo "[PASS]    CHECK $1: $2"; PASS_COUNT=$((PASS_COUNT + 1)); record_result "$1" "PASS" "$2"; }
print_fail()    { echo "[FAIL]    CHECK $1: $2"; FAIL_COUNT=$((FAIL_COUNT + 1)); record_result "$1" "FAIL" "$2"; }
print_pending() { echo "[PENDING] CHECK $1: $2"; PENDING_COUNT=$((PENDING_COUNT + 1)); record_result "$1" "PENDING" "$2"; }

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not a git repository."
  exit 1
fi

detect_default_branch() {
  local branch
  branch=$(gh repo view --json defaultBranchRef -q '.defaultBranchRef.name' 2>/dev/null) || true
  if [ -n "$branch" ]; then echo "$branch"; return; fi
  branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@refs/remotes/origin/@@') || true
  if [ -n "$branch" ]; then echo "$branch"; return; fi
  echo "main"
}

DEFAULT_BRANCH=$(detect_default_branch)

write_proof_file() {
  local sha epoch iso token
  sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  epoch=$(date +%s)
  iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S")
  token="MAULT-STEP8-${sha}-${epoch}-18/18"
  mkdir -p "$PROOF_DIR"
  {
    echo "MAULT-STEP8-PROOF"
    echo "=================="
    echo "Timestamp: $epoch"
    echo "DateTime: $iso"
    echo "GitSHA: $sha"
    echo "Checks: 18/18 PASS"
    for r in "${CHECK_RESULTS[@]}"; do echo "  $r"; done
    echo "=================="
    echo "Token: $token"
  } > "$PROOF_FILE"
  echo ""
  echo "Proof file written: $PROOF_FILE"
  echo "Token: $token"
}

check_proof_staleness() {
  if [ -f "$PROOF_FILE" ]; then
    local proof_sha current_sha
    proof_sha=$(grep '^GitSHA:' "$PROOF_FILE" | awk '{print $2}')
    current_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    if [ "$proof_sha" != "$current_sha" ]; then
      echo "WARNING: Proof file is STALE (proof: $proof_sha, HEAD: $current_sha). Deleting."
      rm -f "$PROOF_FILE"
    fi
  fi
}

echo "========================================"
echo "  MAULT Step 8 Governance Verification"
echo "  Default branch: $DEFAULT_BRANCH"
echo "========================================"
echo ""

# CHECK 1: Step 7 proof exists
check_1() {
  if [ ! -f ".mault/verify-step7.proof" ]; then
    print_fail 1 "Step 7 not complete. Run mault-verify-step7.sh first."
    return
  fi
  local token
  token=$(grep '^Token:' .mault/verify-step7.proof | awk '{print $2}') || true
  print_pass 1 "Step 7 proof exists (${token:-unknown})"
}

# CHECK 2: scripts/governance/ exists with >= 15 scripts
check_2() {
  if [ ! -d "scripts/governance" ]; then
    print_fail 2 "scripts/governance/ directory missing."
    return
  fi
  local count
  count=$(find scripts/governance -name "*.js" -o -name "*.mjs" 2>/dev/null | grep -v '/lib/' | wc -l | tr -d ' ')
  if [ "$count" -lt 15 ]; then
    print_fail 2 "scripts/governance/ has only ${count} scripts (need >= 15)"
    return
  fi
  print_pass 2 "Governance scripts: ${count} scripts in scripts/governance/"
}

# CHECK 3: .memory-layer/baselines/ has baseline files
check_3() {
  if [ ! -d ".memory-layer/baselines" ]; then
    print_fail 3 ".memory-layer/baselines/ directory missing."
    return
  fi
  local count
  count=$(find .memory-layer/baselines -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -lt 4 ]; then
    print_fail 3 ".memory-layer/baselines/ has only ${count} baseline files (need >= 4)"
    return
  fi
  print_pass 3 "Baselines: ${count} baseline files in .memory-layer/baselines/"
}

# CHECK 4: Governance hooks in .pre-commit-config.yaml
check_4() {
  if [ ! -f ".pre-commit-config.yaml" ]; then
    print_fail 4 ".pre-commit-config.yaml missing."
    return
  fi
  local count
  count=$(grep -c 'governance-' .pre-commit-config.yaml 2>/dev/null || echo 0)
  if [ "$count" -lt 5 ]; then
    print_fail 4 "Only ${count} governance hooks in .pre-commit-config.yaml (need >= 5)"
    return
  fi
  print_pass 4 "Pre-commit: ${count} governance hook(s) configured"
}

# CHECK 5: .gitleaks.toml exists
check_5() {
  if [ ! -f ".gitleaks.toml" ]; then
    print_fail 5 ".gitleaks.toml missing. Create secret detection configuration."
    return
  fi
  print_pass 5 ".gitleaks.toml exists"
}

# CHECK 6: Gitleaks job in CI
check_6() {
  local ci_file=".github/workflows/ci.yml"
  if [ ! -f "$ci_file" ]; then
    print_fail 6 "No CI workflow found."
    return
  fi
  if ! grep -q 'secret-scan\|gitleaks' "$ci_file" 2>/dev/null; then
    print_fail 6 "CI missing secret-scan/gitleaks job."
    return
  fi
  print_pass 6 "CI has secret-scan (gitleaks) job"
}

# CHECK 7: Governance job in CI
check_7() {
  local ci_file=".github/workflows/ci.yml"
  if [ ! -f "$ci_file" ]; then
    print_fail 7 "No CI workflow found."
    return
  fi
  if ! grep -q 'governance' "$ci_file" 2>/dev/null; then
    print_fail 7 "CI missing governance job."
    return
  fi
  print_pass 7 "CI has governance job"
}

# CHECK 8: Package audit in CI
check_8() {
  local ci_file=".github/workflows/ci.yml"
  if [ ! -f "$ci_file" ]; then
    print_fail 8 "No CI workflow found."
    return
  fi
  if ! grep -q 'package-audit' "$ci_file" 2>/dev/null; then
    print_fail 8 "CI missing package-audit job."
    return
  fi
  print_pass 8 "CI has package-audit job"
}

# CHECK 9: .mault/governance-manifest.json exists
check_9() {
  if [ ! -f ".mault/governance-manifest.json" ]; then
    print_fail 9 ".mault/governance-manifest.json missing."
    return
  fi
  local script_count
  script_count=$(node -e "const m=require('./.mault/governance-manifest.json'); console.log(Object.keys(m.scripts||{}).length)" 2>/dev/null || echo 0)
  if [ "$script_count" -lt 15 ]; then
    print_fail 9 "governance-manifest.json has only ${script_count} scripts (need >= 15)"
    return
  fi
  print_pass 9 "governance-manifest.json: ${script_count} scripts documented"
}

# CHECK 10: Iron Dome - silent catches script passes
check_10() {
  if ! node scripts/governance/check-silent-catches.js >/dev/null 2>&1; then
    print_fail 10 "check-silent-catches.js failed. New silent catch blocks detected."
    return
  fi
  print_pass 10 "Iron Dome: silent catches at baseline"
}

# CHECK 11: Escape Hatch - eslint-disable script passes
check_11() {
  if ! node scripts/governance/check-eslint-disable.js >/dev/null 2>&1; then
    print_fail 11 "check-eslint-disable.js failed. New ESLint suppressions detected."
    return
  fi
  print_pass 11 "Escape Hatch: ESLint suppressions at baseline"
}

# CHECK 12: Rising Tide - mock tax passes
check_12() {
  local output
  output=$(node scripts/governance/check-mock-tax.js 2>&1)
  if echo "$output" | grep -q '\[FAIL\]'; then
    print_fail 12 "Mock Tax: test LOC exceeds 2x source LOC."
    return
  fi
  local ratio
  ratio=$(echo "$output" | grep -oE 'Ratio: [0-9.]+' | awk '{print $2}')
  print_pass 12 "Rising Tide: mock tax ${ratio:-ok}x (limit: 2.0x)"
}

# CHECK 13: Buddy System - integration pairing passes
check_13() {
  if ! node scripts/governance/verify-integration-pairing.js >/dev/null 2>&1; then
    print_fail 13 "Integration pairing: route(s) missing integration tests."
    return
  fi
  print_pass 13 "Buddy System: all routes paired with integration tests"
}

# CHECK 14: Supply Chain - hallucinations check passes
check_14() {
  if ! node scripts/governance/check-hallucinations.js >/dev/null 2>&1; then
    print_fail 14 "Supply chain: hallucinated packages detected in package.json."
    return
  fi
  print_pass 14 "Supply Chain: no hallucinated packages"
}

# CHECK 15: Circular deps check passes
check_15() {
  if ! node scripts/governance/check-circular-deps.js >/dev/null 2>&1; then
    print_fail 15 "Circular dependencies detected in src/."
    return
  fi
  print_pass 15 "Dependency Health: no circular imports"
}

# CHECK 16: SRP Guardrails passes
check_16() {
  if ! node scripts/governance/guardrails-check.js >/dev/null 2>&1; then
    print_fail 16 "SRP Guardrails: new violations above baseline."
    return
  fi
  print_pass 16 "SRP Guardrails: file/function size within limits"
}

# CHECK 17: Handshake commit
check_17() {
  local sha
  sha=$(git log --oneline | grep '\[mault-step8\]' | head -1 | awk '{print $1}') || true
  if [ -z "$sha" ]; then
    print_pending 17 "No commit with [mault-step8] in message."
    return
  fi
  print_pass 17 "Handshake commit found: ${sha}"
}

# CHECK 18: Handshake issue
check_18() {
  if ! command -v gh >/dev/null 2>&1; then
    print_pending 18 "GitHub CLI not available."
    return
  fi
  local issue_url
  issue_url=$(gh issue list --search "[MAULT] Production Readiness: Step 8" --json url -q '.[0].url' 2>/dev/null) || true
  if [ -z "$issue_url" ]; then
    issue_url=$(gh issue list --state closed --search "[MAULT] Production Readiness: Step 8" --json url -q '.[0].url' 2>/dev/null) || true
  fi
  if [ -n "$issue_url" ]; then
    print_pass 18 "Handshake issue: ${issue_url}"
  else
    print_pending 18 "No handshake issue found. Create it as proof of completion."
  fi
}

check_proof_staleness
check_1; check_2; check_3; check_4; check_5; check_6; check_7; check_8; check_9
check_10; check_11; check_12; check_13; check_14; check_15; check_16; check_17; check_18

echo ""
echo "========================================"
echo "  PASS: ${PASS_COUNT}/18  FAIL: ${FAIL_COUNT}/18  PENDING: ${PENDING_COUNT}/18"
echo "========================================"

if [ "$FAIL_COUNT" -eq 0 ] && [ "$PENDING_COUNT" -eq 0 ]; then
  write_proof_file
  echo "ALL CHECKS PASSED. Step 8 Governance Testing is complete."
  exit 0
elif [ "$FAIL_COUNT" -gt 0 ]; then
  rm -f "$PROOF_FILE"
  echo "${FAIL_COUNT} check(s) FAILED. Fix and re-run: ./mault-verify-step8.sh"
  exit 1
else
  rm -f "$PROOF_FILE"
  echo "${PENDING_COUNT} check(s) PENDING. Complete work and re-run: ./mault-verify-step8.sh"
  exit 1
fi
