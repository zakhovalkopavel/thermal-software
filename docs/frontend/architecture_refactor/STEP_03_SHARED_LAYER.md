# Step 03 — Shared layer, app and pages

**Commits:** 1
**Install:** none

**Goal:** create `src/shared/`, give `app/` and `pages/` the target layout, and split the bundle. **Moves, import updates and route loading only; no behaviour change.**

---

## 1. Moves

| From | To |
|------|----|
| `services/api/client.ts`, `health.api.ts`, `composition.api.ts` | `shared/api/` |
| `services/api/*.type.ts` | `shared/api/types/` |
| `components/calc/*.tsx` | `shared/ui/calc/components/` |
| `components/calc/*.constants.ts` | `shared/ui/calc/constants/` |
| `components/calc/format.ts`, `format-power-of-ten.ts`, `round-composition.ts`, `pick-oxides.ts`, `api-error-messages.ts` | `shared/ui/calc/formatters/` (format, round) and `shared/ui/calc/mappers/` (pick-oxides, api-error-messages) |
| `components/calc/*.type.ts` | `shared/ui/calc/types/` |
| `components/charts/*.tsx` | `shared/ui/charts/components/` |
| `components/charts/highcharts.ts`, `chart.theme.ts` | `shared/ui/charts/config/` |
| `components/charts/chart.format.ts`, `build-axis-options.ts` | `shared/ui/charts/mappers/` |
| `components/charts/types/` | `shared/ui/charts/types/` |
| `components/common/ComingSoon.tsx`, `HealthWidget.tsx`, `RouteErrorBoundary.tsx` | `shared/ui/feedback/` (`HealthWidget` goes to `pages/home/components/`, as only Home uses it) |
| `modules/materials/hooks/useDebouncedValue.ts`, `useSearchParamsPatch.ts`, `useSearchParamState.ts` | `shared/hooks/` |
| `modules/processes/mappers/celsius-to-kelvin.mapper.ts`, `kelvin-to-celsius.mapper.ts`, `without-nulls.mapper.ts` | `shared/utils/celsius-to-kelvin.ts`, `kelvin-to-celsius.ts`, `without-nulls.ts` |
| `app/Layout.tsx` | `app/components/Layout.tsx` |
| `app/router.tsx`, `app-routes.tsx`, `providers.tsx`, `query-client.ts`, `theme.ts` | `app/config/` |
| `app/app-nav.constants.ts` | `app/constants/` |
| `pages/Home.tsx` | `pages/home/Home.tsx` |
| `pages/home-modules.constants.ts` | `pages/home/constants/` |
| `pages/NotFound.tsx` | `pages/not-found/NotFound.tsx` |
| `modules/<m>/<M>Hub.tsx`, `<M>Layout.tsx` | `modules/<m>/components/` |

- `components/calc/index.ts` and `components/charts/index.ts` become `shared/ui/calc/index.ts` and `shared/ui/charts/index.ts`. All consumers import from `@/shared/ui/calc` and `@/shared/ui/charts`.
- `src/components/` and `src/services/` are deleted once empty.
- Modules re-export nothing from `shared`. They import shared code directly.

## 2. Imports

- Every import touched by a move becomes an `@/…` import.
- Imports inside the same folder stay relative (`./`).
- Materials and processes import the moved hooks and utils from `@/shared/...`. Their `index.ts` files stop exporting them.

## 3. Bundle splitting

The production build currently emits one chunk of about 1.5 MB.
- **Section routes load on demand:**
  - `SECTION_ELEMENTS` in both `routes.tsx` files use the route `lazy` property (React Router 7), loading each `<Name>Section` on first visit;
  - module hubs stay eager;
  - a `RouteFallback` (`shared/ui/feedback/RouteFallback.tsx`, a centred `CircularProgress` labelled "Loading page") shows while a section loads. It is the `hydrateFallbackElement` of the pathless route that wraps each module's children, so the AppBar and the module tabs stay visible. On later client-side navigation React Router keeps the current page until the section chunk arrives.
- **Highcharts gets its own chunks:** `build.rollupOptions.output.manualChunks` in `vite.config.ts` puts `highcharts` core and `highcharts-react-official` into `charts`, the Highcharts add-on modules (`highcharts/modules/*`, `highcharts-more`) into `charts-modules`, and MUI with Emotion into `mui`. One `charts` chunk would be 581 kB, over the limit.
- The build stage of `verify` prints chunk sizes. The Vite chunk-size warning must be gone, so the largest chunk stays under 500 kB.

This is a loading change only. Section components are unchanged, and the smoke tests wait for each lazy route.

## 4. Tests

- Colocated tests move with their files.
- Smoke tests, unit tests and component tests must pass unchanged. Only their import paths change.
- **Test changes that the moves required:**
  - `api-error-messages.ts` now lives in a `mappers/` folder, so the mapper coverage check requires a test. The new characterization test records one quirk: an `Error` also has a `message`, so it gets the title `Request failed` like a body without status (the `instanceof Error` branch is never reached).
  - `collectRoutePaths` counts `lazy` and `Component` routes (lazy sections have no `element`) and lists each path once. Since the Step 02 pathless wrappers, `/` and `/materials` had been listed twice.
  - A guard test pins the route count (15 including the unknown path).
  - The smoke test waits until the router is idle and `RouteFallback` is gone before it checks the page.
  - Test count: 237 in Step 02, 240 now (+5 `api-error-messages`, +1 route guard, duplicate smoke routes removed).

## 5. Acceptance

- `npm run verify` passes. The test count changes only as listed in §4.
- Result: largest chunk `mui` 398 kB, `index` 357 kB, `charts-modules` 292 kB, `charts` 284 kB; sections 7–51 kB each; build `PASS`. `lint:refactor` fell from 670 to 427 warnings.
- The build shows separate `charts` and `mui` chunks and one chunk per section, with no chunk-size warning.
- `src/components`, `src/services` and the generic hooks inside `modules/materials/hooks` no longer exist.
- `rg "\.\./\.\./\.\./" src` finds no matches in moved files.
- Commit: `refactor(frontend): step 03 shared layer, app and pages structure`.
