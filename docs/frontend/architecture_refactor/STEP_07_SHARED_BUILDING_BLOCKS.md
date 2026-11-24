# Step 07 — Shared building blocks and duplication removal

**Commits:** 1
**Install:** none

**Goal:** replace copy-pasted boilerplate and duplicated helpers with shared building blocks. Each block is adopted everywhere in this commit, so no old copy remains.

---

## 1. Boilerplate blocks

| Block | Location | Replaces |
|-------|----------|----------|
| `useSearchParamTab(param, options, fallback)` | `shared/hooks/useSearchParamTab.ts` | The 4 URL-synced tab implementations with their own type guards (HTC, thermal distribution, glasses, mineral compositions) |
| `CALCULATION_QUERY_OPTIONS`, `CATALOGUE_QUERY_OPTIONS` | `shared/api/query-defaults.constants.ts` | The `staleTime`, `retry` and `placeholderData` settings repeated in the 24 calculation hooks and the catalogue hooks |
| `useCalculationQuery(queryKey, request, queryFn)` | `shared/hooks/useCalculationQuery.ts` | The body of each calculation hook: `enabled: request !== null`, the options above. Each hook becomes three lines |
| `useCatalogueQuery(queryKey, queryFn)` | `shared/hooks/useCatalogueQuery.ts` | The repeated catalogue hook body (`useQuery` with catalogue options) in about a dozen hooks: `useMaterialGroups`, `useMaterialCategories`, `useParticleSizes`, `useMixComponents`, `useMetalList`, `useGasList`, `useRefractoryProducts`, `useFuels`, `useFlowGeometries`, `useCorrelations`, `useFlowModes`, … Each hook becomes one call |
| `<ResultCardGrid items size />` | `shared/ui/calc/components/ResultCardGrid.tsx` | The repeated `Grid container` plus `ResultCard` blocks |
| `ResultCardItem` type | `shared/ui/calc/types/result-card-item.type.ts` | `{ id, label, value, unit?, digits? }`. `label` becomes `labelKey` in Step 09; `unit` and `digits` become `quantity` and `precision` in Step 10 |
| Declarative table columns | `shared/ui/calc/types/result-table-column.type.ts` gets `variant` and `digits`; `ResultTable` renders by variant | Inline `render` functions in column arrays; columns move to `constants/*-columns.constants.ts` |
| `LAYOUT` tokens | `shared/constants/layout.constants.ts` | The 47 repeated `{ xs: 6, md: 3 }` grid sizes and the 24 inline pixel sizes (`LAYOUT.grid.card`, `half`, `third`, `full`; `LAYOUT.field.narrow`, `medium`; `LAYOUT.chart.height`) |
| Chart colours | `shared/ui/charts/config/chart.theme.ts` and the MUI theme | Inline colour literals in charts and components |
| Chart constants | `<section>/constants/<chart>-chart.constants.ts` | Axis titles, units and series styles declared inline in chart components |

## 2. Duplicated helpers

### 2.1 Value grids

Six mappers each build an evenly spaced list with their own `Array.from({ length })`, rounding and epsilon: `temperature-grid`, `excess-air-grid`, `velocity-grid`, `tau-sweep-grid`, `relative-depth-grid`, plus the wrappers `celsius-grid` and `glass-grid`. They also each validate their input with `throw new Error(...)`.

| New helper | Location | Contract |
|------------|----------|----------|
| `rangeByStep(from, to, step)` | `shared/utils/range-by-step.ts` | Both ends included; the last step is shortened to hit `to`; rounding to `GRID_DECIMALS` against floating-point drift; assumes valid input |
| `linspace(from, to, points)` | `shared/utils/linspace.ts` | `points` evenly spaced values including both ends; assumes valid input |
| `GRID_DECIMALS`, `GRID_EPSILON` | `shared/constants/grid.constants.ts` | Shared numeric tolerances |
| `sweepRangeSchema({ min, maxPoints })` | `shared/form/schemas/sweep-range-schema.ts` (created here; used by forms from Step 08) | yup object `{ from, to, step }`: required, `step > 0`, `to >= from`, point count not above `maxPoints` |
| `pointsSweepSchema({ minPoints, maxPoints, positive })` | `shared/form/schemas/points-sweep-schema.ts` | yup object `{ from, to, points }`: `from < to`, optional `from > 0` (log axes), points in range |

- The six mappers become thin calls of `rangeByStep` or `linspace`. Their validation stays in place until each section's form migration (Steps 11 and 12) moves it into the shared schemas; the mappers are then deleted or reduced to one line.
- Their characterization tests from Step 01 must pass unchanged.

### 2.2 Property-against-temperature charts

`RefractoryLambdaChart`, `RefractoryEmissivityChart`, `MetalPropertiesChart`, `EffectiveConductivityChart` and `SpecificHeatChart` differ only in title, axis, property key and subtitle.

- **New:** `shared/ui/charts/components/PropertyVsTemperatureChart.tsx`, which takes a `PropertyChartConfig` (`titleKey`, `subtitleKey?`, `yAxis`, `series`). Its type lives in `shared/ui/charts/types/property-chart-config.type.ts`.
- **Each former chart becomes a configuration constant** in its section (`constants/<name>-chart.constants.ts`), rendered by the shared component. The chart files are deleted.
- Charts with genuinely different behaviour (rankings, pies, log–log, counter-flow) stay as their own components.

### 2.3 Rule from now on

Anything needed in two places lives in `shared/`. The section checklist in [STEP_11 §1](STEP_11_PROCESSES_MIGRATION.md#1-section-migration-checklist-applies-to-every-section-commit-in-steps-11-and-12) checks this for every migrated section, and `jscpd` measures it.

## 3. Inline constants

Top-level constants declared in `.tsx` files that are **not** UI text move to the section's `constants/` folder. Text constants wait for Step 09, which turns them into keys. After this step, `rg "^const [A-Z_]+ =" src --glob '*.tsx'` lists only text constants, and each is noted for Step 09.

## 4. Tests

- **Unit tests:**
  - `useSearchParamTab`: unknown value falls back; setting a tab updates the URL and keeps other params;
  - `useCalculationQuery`: disabled while the request is `null`;
  - `useCatalogueQuery`: uses the catalogue options;
  - `rangeByStep`: exact end, shortened last step, floating-point drift (0.1 steps);
  - `linspace`: 2 points, many points, negative ranges;
  - both sweep schemas: each rule gives its message key.
- **Component tests:** `ResultCardGrid`, every `ResultTable` variant, `PropertyVsTemperatureChart` (series and axis passed to the chart stub).
- The characterization tests for the grid and chart mappers, the section tests and the smoke tests must pass unchanged.

## 5. Acceptance

- `npm run verify` passes, and the `jscpd` percentage is lower than the Step 01 baseline.
- Removed patterns, checked with `rg`:
  - no tab type guards outside `useSearchParamTab`;
  - no `staleTime: Infinity` outside `query-defaults.constants.ts`;
  - no `{ xs: 6, md: 3 }` literal;
  - no `Array.from({ length` in `mappers/` outside `shared/utils`;
  - none of the five property chart files remain.
- Commit: `refactor(frontend): step 07 shared hooks, grids, property chart, result grid, table columns, layout tokens`.
