# Mault Production-Readiness Kit

A 9-step framework for making Node.js Express APIs production-ready.

## Steps

| Step | Name | Status |
|------|------|--------|
| 1 | Git Repository Setup | Complete |
| 2 | Environment Variable Setup | Complete |
| 3 | Containerization | Complete |
| 4 | CI/CD Pipeline | Complete |
| 5 | TDD Framework | Complete |
| 6 | Pre-commit Framework | Complete |
| 7 | Mault Enforcement | Complete |
| 8 | Governance Testing | Pending |
| 9 | Final Verification | Pending |

## UC Detectors

See [../mault.yaml](../mault.yaml) for full detector configuration.

| UC | Name | Severity |
|----|------|----------|
| UC01 | Missing Env Var Validation | High |
| UC04 | Missing Error Handling | High |
| UC07 | Hardcoded Config Values | Medium |
| UC08 | Missing Input Validation | High |
| UC09 | Missing HTTP Status Codes | Medium |
| UC11 | Missing Test Coverage | High |
| UC16 | Dependency Health | Critical |
| UC18 | Structural Governance | Medium |

## Running Verification

```bash
./mault-verify-step7.sh
```
