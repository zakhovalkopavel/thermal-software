# Running Tests, CI/CD, Examples, and Troubleshooting

**Parent index:** [TEST_SPECIFICATION.md](./TEST_SPECIFICATION.md)

---

### All Tests
```bash
# Inside Docker (always)
docker-compose exec backend npm run test

# Watch mode (during development)
docker-compose exec backend npm run test:watch

# Specific file
docker-compose exec backend npm run test -- calculation.service.spec
```

### Coverage
```bash
# Generate coverage report
docker-compose exec backend npm run test:cov

# View coverage HTML
docker-compose exec backend npm run test:cov -- --coverage
# Then open: backend/coverage/lcov-report/index.html
```

### E2E Tests
```bash
# Run E2E tests
docker-compose exec backend npm run test:e2e

# Specific E2E test
docker-compose exec backend npm run test:e2e -- calculation-workflow
```

### Save Results
```bash
# Save all test results
docker-compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt

# Save specific module
docker-compose exec backend npm run test -- calculations > tmp/reports/tests/calculations-test-$(date +%Y%m%d).txt
```

---

## Running Tests Inside Docker Containers

For reproducible results we prefer running tests inside the project's Docker Compose services. The top-level `Makefile` includes convenient targets that either `exec` into a running service container or run a one-off container when the service is not running.

Make targets added:

- `make test-backend` — run the backend test suite inside the `backend` service container.
- `make test-frontend` — run the full frontend quality gate (`npm run verify`: typecheck, lint, tests, build, duplication, contract) inside the `frontend` service container. `OFFLINE=1` skips the contract stage.
- `make test-service SERVICE=<service>` — generic runner for any named compose service.

Examples
--------
Run backend tests (recommended):

```bash
# from repo root
make test-backend
```

Run frontend tests:

```bash
make test-frontend
```

Run tests for a specific service (generic):

```bash
make test-service SERVICE=backend
# or
make test-service SERVICE=frontend
```

Notes
-----
- These targets use the compose file `compose.yml` by default (adjust if you use a different file). They will use `docker-compose exec` if the container is already running, or `docker-compose run --rm` to start a one-off container if it's not.
- The command executed inside containers is `cd /app && npm test --silent`. If your service uses a different working directory or test command, adjust the Makefile accordingly.
- You can pass Jest arguments by setting the `JEST_ARGS` environment variable and updating the Makefile to include it — I can add this if you want.

Troubleshooting
---------------
- If you see permission issues when `exec`-ing into containers, check your Docker permissions or run `sudo` where appropriate.
- To run tests with coverage, modify the inner command to `npm test -- --coverage` or run:

```bash
# Example (one-off):
docker-compose -f compose.yml run --rm backend sh -lc 'cd /app && npm test -- --coverage'
```

---

## CI/CD Integration

### Pre-Merge Checks

```yaml
# .github/workflows/test.yml (example)
steps:
  - name: Run tests
    run: docker-compose exec -T backend npm run test:cov
    
  - name: Check coverage
    run: |
      COVERAGE=$(docker-compose exec -T backend npm run test:cov -- --silent | grep "Statements" | awk '{print $3}')
      if [ ${COVERAGE%\%} -lt 75 ]; then
        echo "❌ Coverage ${COVERAGE} < 75%"
        exit 1
      fi
```

---

## Examples by Module

### Calculations Module

**Test Spec:** `tmp/reports/tests/CALCULATIONS_TEST_SPEC.md`

**Unit Tests:**
- `calculation.service.spec.ts`
  - calculateThermalExpansion()
  - calculateShrinkage()
  - validateMaterialsSum()

**Integration Tests:**
- `calculation.controller.spec.ts`
  - POST /calculations
  - GET /calculations/:id
  - PATCH /calculations/:id
  - DELETE /calculations/:id

**E2E Tests:**
- `calculation-workflow.e2e-spec.ts`
  - Create → Read → Update → Delete

**Coverage Target:** 85%

---

### Authentication Module

**Test Spec:** `tmp/reports/tests/AUTH_TEST_SPEC.md`

**Unit Tests:**
- `auth.service.spec.ts`
  - validateUser()
  - generateToken()
  - verifyToken()
  - hashPassword()

**Integration Tests:**
- `auth.controller.spec.ts`
  - POST /auth/login
  - POST /auth/register
  - POST /auth/refresh
  - POST /auth/logout

**E2E Tests:**
- `auth-flow.e2e-spec.ts`
  - Register → Login → Access Protected → Refresh → Logout

**Coverage Target:** 90% (security critical)

---

## Troubleshooting

### Tests Fail Locally

```bash
# Clean and rebuild
docker-compose down
docker-compose up --build backend

# Clear jest cache
docker-compose exec backend npm run test -- --clearCache

# Run specific test
docker-compose exec backend npm run test -- --verbose [filename]
```

### Coverage Not Updating

```bash
# Remove coverage directory
docker-compose exec backend rm -rf coverage

# Run tests again
docker-compose exec backend npm run test:cov
```

### E2E Tests Timeout

```bash
# Increase timeout in test file
jest.setTimeout(30000); // 30 seconds

# Or in jest.config.js
module.exports = {
  testTimeout: 30000,
};
```

---

## Summary

### Mandatory Requirements

| Requirement | Status | Verification |
|-------------|--------|--------------|
| **Test spec BEFORE coding** | ✅ Enforced | Review process |
| **Services ≥80% coverage** | ✅ Enforced | CI/CD check |
| **Utilities ≥80% coverage** | ✅ Enforced | CI/CD check |
| **DTOs 100% validated** | ✅ Enforced | Code review |
| **All tests pass** | ✅ Enforced | CI/CD check |
| **Tests in Docker** | ✅ Enforced | NO local npm |

### Implementation Flow

```
1. Create Test Spec (tmp/reports/tests/FEATURE_TEST_SPEC.md)
   ↓
2. Write Failing Tests
   ↓
3. Implement Code to Pass Tests
   ↓
4. Verify Coverage ≥ Minimum
   ↓
5. Code Review
   ↓
6. Merge (if all checks pass)
```

---

**ALL code must be tested. NO exceptions.**

Tests ensure code quality, prevent regressions, and document expected behavior.
