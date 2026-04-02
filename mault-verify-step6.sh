#!/usr/bin/env bash
set -uo pipefail

PASS_COUNT=0
FAIL_COUNT=0
PENDING_COUNT=0
CHECK_RESULTS=()
TOTAL_CHECKS=12

PROOF_DIR=".mault"
PROOF_FILE="$PROOF_DIR/verify-step6.proof"

record_result() { CHECK_RESULTS+=("CHECK $1: $2 - $3"); }
print_pass()    { echo "[PASS]    CHECK $1: $2"; PASS_COUNT=$((PASS_COUNT + 1)); record_result "$1" "PASS" "$2"; }
print_fail()    { echo "[FAIL]    CHECK $1: $2"; FAIL_COUNT=$((FAIL_COUNT + 1)); record_result "$1" "FAIL" "$2"; }
print_pending() { echo "[PENDING] CHECK $1: $2"; PENDING_COUNT=$((PENDING_COUNT + 1)); record_result "$1" "PENDING" "$2"; }

if [ -f "$PROOF_FILE" ]; then
  PROOF_SHA=$(grep '^GitSHA:' "$PROOF_FILE" | awk '{print $2}')
  CURRENT_SHA=$(git rev-parse --short HEAD 2>/dev/null)
  if [ "$PROOF_SHA" != "$CURRENT_SHA" ]; then
    echo "Stale proof detected (SHA mismatch: $PROOF_SHA vs $CURRENT_SHA). Deleting."
    rm -f "$PROOF_FILE"
  fi
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
  token="MAULT-STEP6-${sha}-${epoch}-${TOTAL_CHECKS}/${TOTAL_CHECKS}"
  mkdir -p "$PROOF_DIR"
  if [ ! -f "$PROOF_DIR/.gitignore" ]; then printf '*\n!.gitignore\n' > "$PROOF_DIR/.gitignore"; fi
  {
    echo "MAULT-STEP6-PROOF"
    echo "=================="
    echo "Timestamp: $epoch"
    echo "DateTime: $iso"
    echo "GitSHA: $sha"
    echo "Checks: ${TOTAL_CHECKS}/${TOTAL_CHECKS} PASS"
    for r in "${CHECK_RESULTS[@]}"; do echo "  $r"; done
    echo "=================="
    echo "Token: $token"
  } > "$PROOF_FILE"
  echo ""
  echo "Proof file written: $PROOF_FILE"
  echo "Token: $token"
}

echo "========================================"
echo "  MAULT Step 6 Pre-commit Verification"
echo "  Default branch: $DEFAULT_BRANCH"
echo "========================================"
echo ""

# CHECK 1: Step 5 prerequisite
check_1() {
  if [ ! -f ".mault/verify-step5.proof" ]; then
    print_fail 1 "Step 5 not complete. Run mault-verify-step5.sh first."
    return
  fi
  local token
  token=$(grep '^Token:' .mault/verify-step5.proof | awk '{print $2}') || true
  print_pass 1 "Step 5 proof exists (${token:-unknown})"
}

# CHECK 2: pre-commit CLI installed
check_2() {
  if command -v pre-commit >/dev/null 2>&1; then
    local ver
    ver=$(pre-commit --version 2>/dev/null | head -1)
    print_pass 2 "pre-commit CLI installed: ${ver}"
  else
    print_fail 2 "pre-commit not installed. Run: pip install pre-commit"
  fi
}

# CHECK 3: .pre-commit-config.yaml exists and has hooks
check_3() {
  if [ ! -f ".pre-commit-config.yaml" ]; then
    print_fail 3 "No .pre-commit-config.yaml found."
    return
  fi
  local hook_count
  hook_count=$(grep -c '^\s*- id:' .pre-commit-config.yaml 2>/dev/null || echo 0)
  if [ "$hook_count" -lt 2 ]; then
    print_fail 3 ".pre-commit-config.yaml exists but has fewer than 2 hooks (found: ${hook_count})"
    return
  fi
  print_pass 3 ".pre-commit-config.yaml exists with ${hook_count} hooks"
}

# CHECK 4: Git hook installed and executable
check_4() {
  if [ ! -f ".git/hooks/pre-commit" ]; then
    print_fail 4 ".git/hooks/pre-commit not installed. Run: pre-commit install"
    return
  fi
  if [ ! -x ".git/hooks/pre-commit" ]; then
    print_fail 4 ".git/hooks/pre-commit exists but is not executable."
    return
  fi
  print_pass 4 ".git/hooks/pre-commit installed and executable"
}

# CHECK 5: All pre-commit hooks pass on all files
check_5() {
  if ! command -v pre-commit >/dev/null 2>&1; then
    print_pending 5 "pre-commit not installed. Complete CHECK 2 first."
    return
  fi
  if [ ! -f ".pre-commit-config.yaml" ]; then
    print_pending 5 "No config. Complete CHECK 3 first."
    return
  fi
  local output exit_code
  output=$(pre-commit run --all-files 2>&1)
  exit_code=$?
  if [ "$exit_code" -eq 0 ]; then
    print_pass 5 "All pre-commit hooks pass on all files"
  else
    print_fail 5 "pre-commit run --all-files failed. Fix hook failures first."
  fi
}

# CHECK 6: validate-pr-title job in CI
check_6() {
  local ci_file
  ci_file=$(ls .github/workflows/ci.yml .github/workflows/ci.yaml 2>/dev/null | head -1) || true
  if [ -z "$ci_file" ]; then print_fail 6 "No CI workflow found."; return; fi
  if grep -q 'validate-pr-title' "$ci_file" 2>/dev/null; then
    print_pass 6 "validate-pr-title job exists in CI workflow"
  else
    print_fail 6 "No validate-pr-title job in CI workflow. Add it in Phase 5."
  fi
}

# CHECK 7: validate-branch-name job in CI
check_7() {
  local ci_file
  ci_file=$(ls .github/workflows/ci.yml .github/workflows/ci.yaml 2>/dev/null | head -1) || true
  if [ -z "$ci_file" ]; then print_fail 7 "No CI workflow found."; return; fi
  if grep -q 'validate-branch-name' "$ci_file" 2>/dev/null; then
    print_pass 7 "validate-branch-name job exists in CI workflow"
  else
    print_fail 7 "No validate-branch-name job in CI workflow. Add it in Phase 6."
  fi
}

# CHECK 8: Branch protection has all required checks
check_8() {
  local owner repo
  owner=$(gh repo view --json owner -q '.owner.login' 2>/dev/null) || true
  repo=$(gh repo view --json name -q '.name' 2>/dev/null) || true
  if [ -z "$owner" ] || [ -z "$repo" ]; then print_fail 8 "Cannot determine repo"; return; fi
  local protection enforce_admins
  protection=$(gh api "repos/${owner}/${repo}/branches/${DEFAULT_BRANCH}/protection/required_status_checks" -q '.contexts[]' 2>/dev/null) || true
  enforce_admins=$(gh api "repos/${owner}/${repo}/branches/${DEFAULT_BRANCH}/protection/enforce_admins" -q '.enabled' 2>/dev/null) || true
  if [ -z "$protection" ]; then
    print_fail 8 "No branch protection or required status checks found."
    return
  fi
  if [ "$enforce_admins" != "true" ]; then
    print_fail 8 "enforce_admins is OFF. Branch protection incomplete."
    return
  fi
  local check_count
  check_count=$(echo "$protection" | wc -l | tr -d ' ')
  print_pass 8 "Branch protection active with ${check_count} required checks, enforce_admins=ON"
}

# CHECK 9: Handshake commit exists (contains [mault-step6])
check_9() {
  local commit_sha
  commit_sha=$(git log --oneline --all 2>/dev/null | grep '\[mault-step6\]' | head -1 | awk '{print $1}') || true
  if [ -n "$commit_sha" ]; then
    print_pass 9 "Handshake commit found: ${commit_sha}"
  else
    print_pending 9 "No commit with [mault-step6] in message. Create handshake commit (Phase 8)."
  fi
}

# CHECK 10: package.json has prepare script for auto-install
check_10() {
  if [ -f "package.json" ] && grep -q '"prepare"' package.json 2>/dev/null; then
    print_pass 10 "package.json has prepare script (auto-installs pre-commit on clone)"
  else
    print_fail 10 "No prepare script in package.json. Add: \"prepare\": \"pre-commit install || true\""
  fi
}

# CHECK 11: Merged PR from this step exists
check_11() {
  local merged_url
  merged_url=$(gh pr list --state merged --limit 5 --json url,title -q '.[] | select(.title | contains("mault-step6") or contains("pre-commit")) | .url' 2>/dev/null | head -1) || true
  if [ -n "$merged_url" ]; then
    print_pass 11 "Merged PR found: ${merged_url}"
    return
  fi
  local open_url
  open_url=$(gh pr list --state open --limit 3 --json url,title -q '.[] | select(.title | contains("mault-step6") or contains("pre-commit")) | .url' 2>/dev/null | head -1) || true
  if [ -n "$open_url" ]; then
    print_pending 11 "Open PR found (not merged): ${open_url}"
  else
    print_pending 11 "No PR found for this step. Create and merge one."
  fi
}

# CHECK 12: Handshake issue exists
check_12() {
  if ! command -v gh >/dev/null 2>&1; then print_pending 12 "gh CLI not available."; return; fi
  local issue_url
  issue_url=$(gh issue list --search "[MAULT] Production Readiness: Step 6" --json url -q '.[0].url' 2>/dev/null) || true
  if [ -z "$issue_url" ]; then
    issue_url=$(gh issue list --state closed --search "[MAULT] Production Readiness: Step 6" --json url -q '.[0].url' 2>/dev/null) || true
  fi
  if [ -n "$issue_url" ]; then print_pass 12 "Handshake issue: ${issue_url}"
  else print_pending 12 "No handshake issue found. Create it as proof of completion."; fi
}

check_1; check_2; check_3; check_4; check_5; check_6; check_7
check_8; check_9; check_10; check_11; check_12

echo ""
echo "========================================"
echo "  PASS: ${PASS_COUNT}/${TOTAL_CHECKS}  FAIL: ${FAIL_COUNT}/${TOTAL_CHECKS}  PENDING: ${PENDING_COUNT}/${TOTAL_CHECKS}"
echo "========================================"

if [ "$FAIL_COUNT" -eq 0 ] && [ "$PENDING_COUNT" -eq 0 ]; then
  write_proof_file
  echo "ALL CHECKS PASSED. Step 6 Pre-commit is complete."
  exit 0
elif [ "$FAIL_COUNT" -gt 0 ]; then
  rm -f "$PROOF_FILE"
  echo "${FAIL_COUNT} check(s) FAILED. Fix and re-run: ./mault-verify-step6.sh"
  exit 1
else
  rm -f "$PROOF_FILE"
  echo "${PENDING_COUNT} check(s) PENDING. Complete work and re-run: ./mault-verify-step6.sh"
  exit 1
fi
