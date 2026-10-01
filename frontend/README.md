# Thermal Software - React Frontend

Modern React SPA for thermal engineering calculations.

## Setup

See `/docs/migration/NESTJS_QUICK_START.md`

## Quick Start

```bash
npm install
npm run dev
```

Access: http://localhost:3000

## Tests

Run inside the container, for example `docker exec thermal-frontend sh -c 'cd /app && npm run verify'`. From the repository root, `make test-frontend` runs the same gate (`make test-frontend OFFLINE=1` skips the contract tests).

| Command | What it does |
|---------|--------------|
| `npm run verify` | Full gate: typecheck, lint, tests, build, duplication report, contract tests. A commit needs exit code 0 |
| `npm run verify:offline` | The same without the backend contract tests |
| `npm test` | Unit, component and route smoke tests |
| `npm run test:unit` / `test:component` / `test:smoke` / `test:contract` | One layer |
| `npm run test:watch` | Watch mode while developing |
| `npm run fixtures:record` | Records missing backend responses for the smoke tests (backend must run) |
| `npm run duplication` | Copy-paste report into `test-results/jscpd/` |

To update inline snapshots after an intended change, run `npx vitest run --project unit -u` and review the diff.

Details: [docs/frontend/architecture_refactor/TESTING.md](../docs/frontend/architecture_refactor/TESTING.md).
