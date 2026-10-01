# Step 01 — Test infrastructure

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D @testing-library/user-event jscpd'
```

**Goal:** a safety net *before* anything moves. The tests record the current behaviour, so every later step proves it changed nothing.

---

## 1. Configuration

| File | Content |
|------|---------|
| `frontend/vitest.config.ts` | `mergeConfig(viteConfig, { test: { projects: [unit, component, smoke, contract] } })` as in [TESTING.md §3](TESTING.md#3-vitest-projects); reporters `default`, `junit` and `json` into `test-results/` |
| `frontend/tests/setup/vitest.setup.ts` | `@testing-library/jest-dom`, `console.error` makes the test fail, `cleanup` after each test |
| `frontend/tests/setup/highcharts.mock.ts` | Stub for `highcharts-react-official`: renders `<div data-testid="chart">` and stores the last `options` for assertions |
| `frontend/tests/setup/render-app.tsx` | Renders the app providers with `createMemoryRouter(routes, { initialEntries: [path] })`, a fresh `QueryClient` (no retries) per test |
| `frontend/tests/setup/fixture-adapter.ts` | axios adapter that answers from `tests/fixtures/responses`; fails with an explicit message when a fixture is missing |
| `frontend/tsconfig.json` | Include `tests` and `vitest.config.ts`; add `vitest/globals` types |
| `frontend/.gitignore` | `test-results/` |

`vite.config.ts` stays unchanged. The `test` options live only in `vitest.config.ts`.

## 2. Scripts (`package.json`)

```json
"test": "vitest run --project unit --project component --project smoke",
"test:unit": "vitest run --project unit",
"test:component": "vitest run --project component",
"test:smoke": "vitest run --project smoke",
"test:contract": "vitest run --project contract",
"test:watch": "vitest --project unit --project component",
"fixtures:record": "node scripts/record-fixtures.mjs",
"duplication": "jscpd src --config .jscpd.json",
"verify": "node scripts/verify.mjs",
"verify:offline": "node scripts/verify.mjs --offline"
```

- **`scripts/verify.mjs`:** implements the stages and the summary output from [TESTING.md §2](TESTING.md#2-verify-output).
  - The `build` stage runs `vite build --outDir /tmp/build-check`.
  - Until Step 05, the `contract` project has no files, so the stage reports `PASS (no contract tests yet)`.
  - The `duplication` stage runs `jscpd` and reports the duplicated-lines percentage and the clone count as **information** (`INFO`, never `FAIL`) until Step 13.
- **`.jscpd.json`:**
  - `minTokens: 50` and `minLines: 5`;
  - formats `typescript` and `tsx`;
  - ignores `**/*.test.*`, `src/shared/api/generated/**` and `src/locales/**`;
  - reporters `console` and `json` into `test-results/jscpd/`.

  The baseline percentage goes into the commit message and [CHECKLIST.md](CHECKLIST.md).
- **`scripts/record-fixtures.mjs`:** calls every catalogue GET used by the UI against `CONTRACT_API_URL` and writes one JSON file per request into `tests/fixtures/responses/`. It covers fuels, gas list, metals list, material groups, categories, particle sizes, mix components, refractories, flow geometries, correlations and flow modes.

## 3. Characterization tests (unit)

These record **current** outputs. Expected values come from running the mapper on the defaults today and are checked by hand once. When a later step changes an output, the test fails and the change has to be explained in the commit.

**Request mappers**, one test file each:

| Area | Mappers |
|------|---------|
| combustion | `combustion-request`, `combustion-mode-input`, `solid-direct-request`, `solid-two-step-request`, `fluid-request`, `bed-request`, `supply-request`, `sweep-request`, `fuel-selection-request`, `condensed-fuel-request`, `excess-air-of-request` |
| htc | `dimensionless-request`, `body-geometry-request` |
| multilayer wall | `wall-request`, module-level `wall-layers-request` |
| recuperator | `recuperator-request` (each hole form) |
| thermal distribution | `thermal-request` (each shape, each BC type) |
| mineral compositions | `blend-request`, `mix-composition-request`, `packing-request`, `psd-fractions-request` |
| raw materials | `single-material-composition-request`, `thermal-conductivity-request` |

**Shared and module-level mappers:**
- `celsius-to-kelvin`, `kelvin-to-celsius`, `without-nulls`, `required-numbers`;
- `temperature-grid`, `celsius-grid`, `glass-grid`, `excess-air-grid`, `clamped-bands`, `clamped-zones`;
- `velocity-grid`, `tau-list`, `tau-sweep-grid`, `relative-depth-grid`;
- `chart.format`, `format`, `format-power-of-ten`, `build-axis-options` (logarithmic and linear; asserts no `undefined` keys).

**Chart and table mappers (response to series, rows or summary cards),** one test file each for every remaining file in a `mappers/` folder. That is about 70 files, for example:
- `counter-flow-series`, `velocity-sweep-series`, `nu-re-series`, `re-limit-plot-lines`, `re-validity-band`, `correlation-rows`;
- `profile-series`, `boundary-plot-lines`, `wall-profile`, `combustion-summary`, `raw-material-thermal-series`.

Each test feeds a **recorded backend response** (from `tests/fixtures/responses`, or captured once with `fixtures:record` for POST endpoints) and asserts:
- series names, point counts, first and last points;
- axis bounds, plot lines and zones;
- row keys and summary card values;
- no explicit `undefined` keys in Highcharts options.

These tests protect Step 07 (result grids, table columns, shared charts) and the precision changes in Step 10, both of which come before the per-section component tests.

A coverage check in the test run lists every `mappers/*.ts` file without a sibling `*.test.ts`. It fails the run when the list is not empty.

**Cases per request mapper:**
- defaults produce the recorded body;
- an empty optional field is omitted;
- mode-specific fields appear only in their mode;
- the current error is thrown for a missing required value. This changes in Step 08 and is updated in the section commit.

## 4. Route smoke tests

`tests/smoke/routes.smoke.test.tsx` renders every path from `materialsRoutes`, `processesRoutes`, `/` and an unknown path. Each must show its heading, render no error page and log no `console.error`. Calculation submits are added in Step 05.

## 5. Documentation

- Link [TESTING.md](TESTING.md) from `docs/frontend/README.md`.
- Add a "Tests" section to `frontend/README.md` with the commands.

## 6. Acceptance

- `npm run verify` passes, with the contract stage reported as `no contract tests yet` and the duplication baseline shown as `INFO`.
- Every file in a `mappers/` folder has a test file.
- Deliberately breaking one mapper (local check, not committed) makes `npm test` fail, naming the mapper and the field.
- Commit: `test(frontend): step 01 test infrastructure and characterization tests`.
