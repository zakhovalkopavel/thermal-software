# Step 01 — Test infrastructure

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D @testing-library/user-event jscpd @types/node@24'
```

**Goal:** a safety net *before* anything moves. The tests record the current behaviour, so every later step proves it changed nothing.

---

## 1. Configuration

| File | Content |
|------|---------|
| `frontend/vitest.config.ts` | `mergeConfig(viteConfig, { test: { projects: [unit, component, smoke, contract] } })` as in [TESTING.md §3](TESTING.md#3-vitest-projects); reporters `default`, `junit` and `json` into `test-results/` |
| `frontend/tests/setup/vitest.setup.ts` | `@testing-library/jest-dom`, browser polyfills, the Highcharts stub; `console.error` makes the test fail; `cleanup` after each test |
| `frontend/tests/setup/browser-polyfills.ts` | `matchMedia`, `CSS.supports` and `ResizeObserver` for jsdom (Highcharts and MUI need them) |
| `frontend/tests/setup/highcharts-react.mock.tsx`, `chart-stub-store.ts` | Stub for `highcharts-react-official`: renders `<div data-testid="chart">` and stores every `options` object for assertions |
| `frontend/src/app/app-routes.tsx` | The route tree, extracted from `router.tsx` so tests can build a memory router |
| `frontend/tests/setup/render-app.tsx` | Renders the app providers with `createMemoryRouter(appRoutes, { initialEntries: [path] })` and a fresh `QueryClient` (no retries) per test |
| `frontend/tests/setup/fixture-adapter.ts` | axios adapter that answers from `tests/fixtures/responses`. It fails with an explicit message when a fixture is missing, and records missing fixtures from the backend when `RECORD_FIXTURES=1` |
| `frontend/tests/setup/recorded-response.ts` | `recordedResponse<T>('GET /path')` gives mapper tests the data of a recorded response |
| `frontend/tests/fixtures/inputs/` | Typed inputs shared by several mapper tests: a castable mix, blend, shrinkage, combustion-step and dimensionless results, and a glass curve |
| `frontend/tsconfig.json` | `types: ["vite/client"]`, so Node types do not leak into `src` |
| `frontend/tsconfig.test.json` | Extends `tsconfig.json`, adds `node` types and includes `tests` |
| `frontend/.gitignore` | `test-results/` |

`vite.config.ts` stays unchanged. The `test` options live only in `vitest.config.ts`.

The `unit` project runs in jsdom with the setup file, because mappers import the charts barrel and that loads Highcharts.

## 2. Scripts (`package.json`)

```json
"lint": "eslint src tests --report-unused-disable-directives --max-warnings 0",
"typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.test.json",
"test": "vitest run --project unit --project component --project smoke",
"test:unit": "vitest run --project unit",
"test:component": "vitest run --project component",
"test:smoke": "vitest run --project smoke",
"test:contract": "vitest run --project contract --passWithNoTests",
"test:watch": "vitest --project unit --project component",
"fixtures:record": "RECORD_FIXTURES=1 vitest run --project smoke",
"duplication": "jscpd src --config .jscpd.json",
"verify": "node scripts/verify.mjs",
"verify:offline": "node scripts/verify.mjs --offline"
```

- **`scripts/verify.mjs`:** implements the stages and the summary output from [TESTING.md §2](TESTING.md#2-verify-output).
  - The `build` stage runs `vite build --outDir /tmp/build-check`.
  - Until Step 05, the `contract` project has no files, so the stage reports `PASS (no contract tests yet)`. `--passWithNoTests` must be on the command line: Vitest ignores it inside a project block.
  - The `test` and `contract` stages call the npm scripts, so `verify` and the single-stage commands cannot drift apart.
- **`make test-frontend`** (repository root, `scripts/make.d/04-tests.mk`) runs `npm run verify` in the frontend container. `make test-frontend OFFLINE=1` runs `verify:offline`.
  - The `duplication` stage runs `jscpd` and reports the duplicated-lines percentage and the clone count as **information** (`INFO`, never `FAIL`) until Step 13.
- **`.jscpd.json`:**
  - `minTokens: 50` and `minLines: 5`;
  - formats `typescript` and `tsx`;
  - ignores `**/*.test.*`, `src/shared/api/generated/**` and `src/locales/**`;
  - reporters `console` and `json` into `test-results/jscpd/`.

  The baseline percentage goes into the commit message and [CHECKLIST.md](CHECKLIST.md). Exact-match mode is the metric; jscpd's renamed-clone mode reports about 25 %, mostly similar field lists, which is noise.
- **`fixtures:record`:** runs the smoke tests with `RECORD_FIXTURES=1`. Every request a route makes that has no fixture is fetched from `CONTRACT_API_URL` (default `http://backend:4000/api/v1`) and written to `tests/fixtures/responses/`. The recorded set is therefore exactly what the routes request: fuels, gas list, metals list, material categories, particle sizes, mix components, glasses, refractories, flow geometries, correlations, flow modes and health. Files get the owner of the folder, because the container runs as root.

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

Catalogue inputs come from the **recorded backend responses** via `recordedResponse`. Calculation results use typed inline inputs or the builders in `tests/fixtures/inputs/`, because POST fixtures arrive in Step 05. Larger outputs use `toMatchInlineSnapshot()`, filled with `npx vitest run --project unit -u` and reviewed by hand. Each test asserts:
- series names, point counts, first and last points;
- axis bounds, plot lines and zones;
- row keys and summary card values;
- the current Highcharts options as they are. Explicit `undefined` keys are recorded rather than rejected (`cp-comparison-bars` colour, `raw-material-thermal-series` and `viscosity-series` dash style, `build-axis-options` `opposite`), and Step 07 removes them.

Behaviour recorded for Step 10:
- `formatValue` never rounds integers to 4 significant digits (`999999`), and it shows `-273.15` as `-273.1`;
- size labels mix notations (`5.000·10⁻⁴–0.005 mm`).

These tests protect Step 07 (result grids, table columns, shared charts) and the precision changes in Step 10, both of which come before the per-section component tests.

A coverage check (`tests/unit/mapper-coverage.test.ts`) lists every `mappers/*.ts` file without a sibling `*.test.ts`. It fails the run when the list is not empty.

**Cases per request mapper:**
- defaults produce the recorded body;
- an empty optional field is omitted;
- mode-specific fields appear only in their mode;
- the current error is thrown for a missing required value. This changes in Step 08 and is updated in the section commit.

## 4. Route smoke tests

`tests/smoke/routes.smoke.test.tsx` renders every path collected from `appRoutes` plus an unknown path. Each route must:
- show a heading;
- finish all queries;
- render no error page;
- request no endpoint without a fixture;
- log no `console.error`.

Calculation submits are added in Step 05.

## 5. Documentation

- Link [TESTING.md](TESTING.md) from `docs/frontend/README.md`.
- Add a "Tests" section to `frontend/README.md` with the commands.

## 6. Acceptance

- `npm run verify` passes, with the contract stage reported as `no contract tests yet` and the duplication baseline shown as `INFO`.
- Every file in a `mappers/` folder has a test file.
- Deliberately breaking one mapper (local check, not committed) makes `npm test` fail, naming the mapper and the field.
- Commit: `test(frontend): step 01 test infrastructure and characterization tests`.
