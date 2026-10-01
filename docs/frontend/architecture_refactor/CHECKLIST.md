# Frontend architecture refactor — checklist

Track progress against [README.md](README.md). Tick an item only when it works in code and `npm run verify` passes.

---

## STEP 01 — Test infrastructure

- [ ] User installed `@testing-library/user-event jscpd`
- [ ] `vitest.config.ts` with projects unit, component, smoke, contract; JUnit and JSON reporters into `test-results/`
- [ ] `tests/setup`: vitest setup, Highcharts stub, `render-app`, fixture adapter
- [ ] Scripts: `test`, `test:*`, `fixtures:record`, `duplication`, `verify`, `verify:offline`
- [ ] `scripts/verify.mjs` prints the stage summary and the rerun command; build goes to `/tmp/build-check`
- [ ] `.jscpd.json`; duplication baseline recorded: ____ %
- [ ] Catalogue fixtures recorded
- [ ] Characterization tests for every request mapper and the shared mappers
- [ ] Characterization tests for every chart and table mapper, using recorded responses
- [ ] Mapper coverage check (every `mappers/*.ts` has a test)
- [ ] Route smoke tests for every route
- [ ] Commit made

## STEP 02 — Foundation

- [ ] User installed `eslint-plugin-check-file`
- [ ] `@/` alias in `tsconfig.json` and `vite.config.ts`
- [ ] `eslint.refactor-rules.js` plus `lint:refactor`; baseline warning count recorded in the commit message
- [ ] `RouteErrorBoundary` on root, materials and processes routes, with a component test
- [ ] Commit made

## STEP 03 — Shared layer

- [ ] `shared/api`, `shared/ui/{calc,charts,feedback}`, `shared/hooks`, `shared/utils` created by moves
- [ ] `app/{components,config,constants}`, `pages/{home,not-found}`, module hubs and layouts in `components/`
- [ ] `src/components` and `src/services` removed
- [ ] Moved imports use `@/`
- [ ] Section routes lazy-loaded with `RouteFallback`
- [ ] `charts` and `mui` chunks; no chunk-size warning
- [ ] Commit made

## STEP 04 — Backend Swagger responses

- [ ] Backend Jest baseline recorded (passing, failing, names of failing tests)
- [ ] Result DTO classes created or reused for all 55 operations
- [ ] `@ApiOkResponse` or `@ApiCreatedResponse` with `type` on every operation
- [ ] Backend build passes; no test that passed in the baseline fails
- [ ] Swagger check prints `all operations documented`
- [ ] Diff limited to DTOs and decorators
- [ ] Commit made (`docs(backend): ...`)

## STEP 05 — Contract tests

- [ ] User installed `openapi-typescript ajv ajv-formats`
- [ ] `api:generate` and `api:check`; snapshot and `schema.ts` committed
- [ ] Contract helpers and cases for every area in STEP_05 §2
- [ ] Suites: spec drift, spec completeness, endpoint coverage, request conformance, live calls, catalogue consistency
- [ ] `known-backend-issues.ts` filled, and every entry reported to the user
- [ ] POST fixtures recorded; smoke tests submit each calculator's defaults
- [ ] `verify` contract stage active
- [ ] Commit made

## STEP 06 — Generated types

- [ ] Request, result and catalogue types are aliases of generated types
- [ ] Enum unions are aliases of generated property types
- [ ] Every difference resolved or recorded, and listed in the commit message
- [ ] Commit made

## STEP 07 — Shared building blocks and duplication removal

- [ ] `useSearchParamTab` adopted in all 4 tabbed sections
- [ ] `useCalculationQuery` and the query option constants adopted in every calculation hook
- [ ] `useCatalogueQuery` adopted in every catalogue hook
- [ ] `linspace`, `rangeByStep`, grid constants; the six grid mappers call them
- [ ] `sweepRangeSchema` and `pointsSweepSchema` created
- [ ] `PropertyVsTemperatureChart`; the five property charts replaced by configurations
- [ ] `ResultCardGrid`, declarative table columns
- [ ] `LAYOUT` tokens replace grid sizes and pixel literals; colours in the theme
- [ ] Non-text top-level constants moved out of `.tsx`
- [ ] Duplication below the Step 01 baseline: ____ %
- [ ] Commit made

## STEP 08 — Forms infrastructure

- [ ] User installed `@hookform/resolvers`
- [ ] `shared/form`: types, `buildNumberFieldsSchema`, `yup-locale`, `useCalculatorForm`, wrappers, `CalculatorForm`
- [ ] Body geometry pilot migrated with component tests
- [ ] Commit made

## STEP 09 — i18n infrastructure

- [ ] User installed `i18next react-i18next eslint-plugin-i18next`
- [ ] `LANGUAGES` en, fr, ru, uk; glob-loaded resources; English only
- [ ] Typed keys (`i18next.d.ts`)
- [ ] `LanguageSwitcher` shown only with more than one language; choice persisted
- [ ] `Intl` number formatting; Highcharts `lang`
- [ ] `app`, `pages`, `shared`, module hubs and layouts translated into `locales/en`
- [ ] Locale parity test in place
- [ ] Commit made

## STEP 10 — App settings, units and precision

- [ ] `shared/settings`: provider, hook, defaults, stored-settings mapper (migrates `thermal.language`)
- [ ] `SettingsMenu` in the AppBar: temperature (°C/K), pressure (Pa/kPa/bar/atm), language
- [ ] `shared/units`: quantities, temperature, temperature-difference and pressure units, `useQuantityUnit`
- [ ] `QUANTITY_PRECISION`, `PrecisionScope`, `useFormatQuantity`; `formatValue` rewritten around `PrecisionRule`
- [ ] `FormQuantityField`; `NumberFieldSpec.quantity`; `ChartAxis.quantity`
- [ ] Shared UI (cards, tables, charts, tooltips) converts and formats by quantity
- [ ] Body geometry adopts quantities
- [ ] Unit, precision and settings tests
- [ ] Commit made

## STEP 11 — Processes migration

- [ ] 11.1 Multilayer wall
- [ ] 11.2 Thermal distribution (°C-only inputs become temperature quantities)
- [ ] 11.3 HTC (pressure quantity)
- [ ] 11.4 Combustion (mode subforms, bed layers field array)
- [ ] 11.5 Recuperator (reuses combustion subforms; `airPreheat_K` as a temperature difference)
- [ ] `lint:refactor` shows zero warnings under `src/modules/processes`; no unit literals remain

## STEP 12 — Materials migration

- [ ] 12.1 Metals (sweep toggle removed; shared sweep subform)
- [ ] 12.2 Refractories
- [ ] 12.3 Gases
- [ ] 12.4 Raw materials
- [ ] 12.5 Glasses
- [ ] 12.6 Mineral compositions: mix
- [ ] 12.7 Mineral compositions: analyses
- [ ] 12.8 Module-level materials folders
- [ ] `lint:refactor` shows zero warnings under `src/modules/materials`; no unit literals or `*_DIGITS` remain

## STEP 13 — Hardening

- [ ] User installed `@vitest/coverage-v8`
- [ ] All architecture lint rules at `error`; `lint:refactor` removed
- [ ] Duplication threshold active: ____ % (at most 3 %)
- [ ] Dead helpers, temporary `label` fallbacks, `digits` props and old grid mappers deleted
- [ ] Coverage thresholds active
- [ ] Manual pass of every page with °C and K, Pa and bar
- [ ] Documentation links updated; status Done
- [ ] Commit made

---

## Done criteria

- [ ] `npm run verify` passed before every commit of the sequence
- [ ] No folder mixes `.tsx` and `.ts` (except `index.ts`, section entry files, colocated tests)
- [ ] No `.tsx` file has top-level constants or helpers; no component has more than 3 `useState` calls or more than 200 lines
- [ ] Every calculator form uses `useCalculatorForm`; errors are shown on the fields; no request mapper throws
- [ ] No literal UI string in JSX; every key exists in `locales/en`; unknown keys are TypeScript errors
- [ ] All API input and result types come from the generated Swagger types; `api:check` is clean
- [ ] Every endpoint used by the frontend has a contract case; every open backend issue is in `known-backend-issues.ts`
- [ ] Temperature and pressure units are chosen only in the settings menu; forms and requests are canonical (K, Pa); no unit literals in modules
- [ ] Result precision comes only from `QUANTITY_PRECISION`, page overrides or value overrides; no `digits` props
- [ ] Duplication below the threshold; one grid generator pair; one property-chart component; one catalogue hook helper
- [ ] No deep cross-module imports; no relative import more than two levels up
- [ ] Boilerplate counts are zero: `formError` `try/catch`, `preventDefault` form wrappers, tab type guards, repeated query settings
- [ ] Largest production chunk under 500 kB

## Next project (out of scope)

- [ ] French, Russian, Ukrainian translations (`locales/fr`, `locales/ru`, `locales/uk`)
- [ ] Browser end-to-end tests decision
- [ ] Decisions on each known backend issue
