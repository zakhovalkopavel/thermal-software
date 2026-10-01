# Frontend architecture refactor

**Status:** Planned
**Code root:** `frontend/src/`
**Branch:** `refactor/frontend-architecture`
**Prerequisite:** the calculation UI from [../README.md](../README.md) (Steps 01–11) is complete.

---

## Goal

Restructure the frontend so it is easy to navigate, change and verify. The work is a sequence of independent commits. Each commit leaves the frontend working, and an automated test gate proves it before the commit is made.

Calculations and request bodies don't change. The only intended differences the user sees are:
- errors shown on each field;
- one settings menu for the temperature unit, pressure unit and language;
- result precision that follows a rule per physical quantity.

## Documents

| File | Contents |
|------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Target structure, folder and naming rules, patterns, lint enforcement |
| [TESTING.md](TESTING.md) | Test specification: layers, commands, backend contract tests, failure reporting |
| [CHECKLIST.md](CHECKLIST.md) | Progress tracking, ticked only when the item works in code |
| `STEP_01` … `STEP_13` | One file per step: scope, files, install command, acceptance criteria |

## What the analysis found

- **689 files in `src`.** About 250 are one-line type files. The biggest folders are `mineral-compositions/types` (56), `processes/types` (36) and `combustion/types` (33).
- **`.ts` and `.tsx` in the same folder:** `components/calc` (12 + 10), `components/charts`, `app`, `pages`, `sections/glasses`, `mineral-compositions/mix`. Every section root mixes components with folders.
- **Logic mixed with view.** Examples:
  - `GlassesSection` has 13 `useState` calls and initialises state during render.
  - `HtcCalculator`, `RecuperatorSection`, `MultilayerWallSection`, `BlendOptimizerTab`, `RawMaterialsSection` and `CalculatedThermalCard` mix logic and view the same way.
- **Copy-pasted boilerplate:**
  - the draft-to-request `try/catch` that sets `formError` (13 files);
  - the form wrapper with `preventDefault` (15);
  - URL-synced tabs, each with its own type guard (4);
  - identical query settings (24 hooks).
- **Duplicated helpers:**
  - six mappers each build an evenly spaced value list with their own rounding and validation (`temperature-grid`, `excess-air-grid`, `velocity-grid`, `tau-sweep-grid`, `relative-depth-grid`, plus `celsius-grid` and `glass-grid`);
  - five charts differ only in configuration (`RefractoryLambdaChart`, `RefractoryEmissivityChart`, `MetalPropertiesChart`, `EffectiveConductivityChart`, `SpecificHeatChart`);
  - about a dozen catalogue hooks repeat the same `useQuery` body.

  Nothing measures duplication.
- **Units and precision are inconsistent:**
  - thermal distribution works in °C, recuperator in K, and the sweeps have their own °C/K toggles (about 60 temperature unit literals);
  - every result shows 4 significant digits regardless of model accuracy (293.15 K shows as `293.2`, Re 12345.6 as `12346`).
- **Bundle:** a single chunk of about 1.5 MB.
- **Hardcoded values:**
  - 118 constants at the top of `.tsx` files;
  - 24 inline pixel sizes;
  - the grid size `{ xs: 6, md: 3 }` repeated 47 times;
  - all UI text written directly in JSX.
- **Inconsistent layers:**
  - API files live in three kinds of place;
  - generic hooks (`useDebouncedValue`, `useSearchParamsPatch`, `useSearchParamState`) and generic mappers (`celsius-to-kelvin`, `without-nulls`) sit inside modules.
- **API types are written by hand.** Drift from the backend shows up only as a runtime 400 or 500.
- **No tests.** Vitest, Testing Library and jsdom are installed but unused.
- **No path aliases** (214 imports climb four or five folders). **Lint enforces none of the conventions.**

## Decisions

- **The strict one-export-per-file rule is kept.** Clutter is solved with structure.
- **Forms:** `react-hook-form` plus `yup` schemas. Field-level errors; mappers no longer throw.
- **Text:** `react-i18next`.
  - Registered languages: **English (source), French, Russian, Ukrainian**.
  - This refactor writes **only English** locale files. Translation into French, Russian and Ukrainian is the next project.
  - The language switcher lists only languages that have locale files.
  - Not translated: units, chemical formulas, backend keys, backend error messages.
- **API types:** generated from the backend Swagger with `openapi-typescript`, as types only. The axios API files and query hooks stay hand-written.
- **App settings (one place, no page toggles):**
  - the user chooses the temperature unit (°C or K), the pressure unit (Pa, kPa, bar or atm) and the language once, in a settings menu;
  - forms and requests keep canonical units (K, Pa), and conversion happens only for display and input;
  - the wt%/mol% composition toggles stay on their pages.
- **Precision:**
  - a global preset per physical quantity (temperature whole numbers, composition 1 decimal, fractions 2 decimals, otherwise 3 significant digits);
  - a page can override it, and a single value can override that;
  - this is display only, and full precision is kept in inputs, requests, chart data and exports.
- **Duplication:** anything needed in two places lives in `shared/`. `jscpd` measures it from Step 01, and Step 13 enforces a threshold.
- **Backend:**
  - Step 04 is the only backend change. It adds Swagger response documentation and was approved as documentation only, with no logic change.
  - Backend bugs found by contract tests are reported and recorded as known issues, never fixed without separate approval.
- **Commits:** one commit per unit of work, made only after the full gate passes.
- **Dependencies:** never installed by the agent. Each step lists the install command for the user.
- **Browser (end-to-end) tests:** deferred; see [TESTING.md §8](TESTING.md#8-deferred-browser-tests).

## Commit sequence

```mermaid
flowchart LR
  s01[01 tests] --> s02[02 foundation] --> s03[03 shared] --> s04[04 backend swagger] --> s05[05 contract] --> s06[06 generated types]
  s06 --> s07[07 blocks] --> s08[08 forms] --> s09[09 i18n] --> s10[10 settings and units] --> s11[11 processes] --> s12[12 materials] --> s13[13 hardening]
```

| Step | Commits | Scope | Install (user) |
|------|---------|-------|----------------|
| [01](STEP_01_TEST_INFRASTRUCTURE.md) | 1 | Vitest projects, verify script, characterization tests for every mapper, route smoke tests, duplication baseline | `@testing-library/user-event jscpd` |
| [02](STEP_02_FOUNDATION.md) | 1 | `@/` alias, lint rules as warnings, `RouteErrorBoundary` | `eslint-plugin-check-file` |
| [03](STEP_03_SHARED_LAYER.md) | 1 | `shared/` layer, `app/` and `pages/` restructure, lazy section routes, chunk splitting | none |
| [04](STEP_04_BACKEND_SWAGGER_RESPONSES.md) | 1 (backend) | Jest baseline, then Swagger response documentation for 55 operations | none |
| [05](STEP_05_CONTRACT_TESTS.md) | 1 | Generated types, snapshot, contract test suites | `openapi-typescript ajv ajv-formats` |
| [06](STEP_06_GENERATED_TYPES.md) | 1 | Hand-written API types become aliases of generated ones | none |
| [07](STEP_07_SHARED_BUILDING_BLOCKS.md) | 1 | Shared hooks (`useSearchParamTab`, `useCalculationQuery`, `useCatalogueQuery`), `linspace` and `rangeByStep`, `PropertyVsTemperatureChart`, `ResultCardGrid`, layout tokens, table columns | none |
| [08](STEP_08_FORMS_INFRASTRUCTURE.md) | 1 | RHF wrappers, `useCalculatorForm`, `CalculatorForm`; pilot Body geometry | `@hookform/resolvers` |
| [09](STEP_09_I18N_INFRASTRUCTURE.md) | 1 | i18next, four registered languages, English resources, typed keys | `i18next react-i18next eslint-plugin-i18next` |
| [10](STEP_10_APP_SETTINGS_UNITS_PRECISION.md) | 1 | Settings menu (temperature, pressure, language), canonical units, quantity-based precision | none |
| [11](STEP_11_PROCESSES_MIGRATION.md) | 5 | One commit per processes section | none |
| [12](STEP_12_MATERIALS_MIGRATION.md) | 7–8 | One commit per materials section | none |
| [13](STEP_13_HARDENING.md) | 1 | Lint rules to error, duplication and coverage thresholds, dead code removal | `@vitest/coverage-v8` |

Install commands are always run in the container:

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D <packages>'
```

## Gate before every commit

```bash
docker exec thermal-frontend sh -c 'cd /app && npm run verify'
```

`verify` runs typecheck, lint, tests, build, the duplication report and the backend contract tests, and stops at the first failure. The commit is made only when every stage passes. Until Step 01 lands, the gate is `npm run -s typecheck && npm run -s lint && npx vite build --outDir /tmp/build-check`.

If a stage fails because of the backend, work stops and the failure is reported. The commit goes ahead only once the case is recorded as a known backend issue ([TESTING.md §6](TESTING.md#6-failure-reporting)).

## Commit message format

```
refactor(frontend): <step> <short summary>

<what moved or changed, one line per area>
Gate: typecheck, lint, test (<n> passed), build, duplication (<p>%), contract (<n> passed, <k> known backend issues)
```

The backend commit in Step 04 uses `docs(backend): ...`.

## After this refactor

1. French, Russian and Ukrainian translations: add `locales/fr`, `locales/ru` and `locales/uk`. The parity test in [TESTING.md](TESTING.md) checks them automatically.
2. Decide on browser end-to-end tests.
3. Approve or reject each known backend issue recorded during the refactor.
