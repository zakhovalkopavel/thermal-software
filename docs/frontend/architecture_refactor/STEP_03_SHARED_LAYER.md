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
| `app/router.tsx`, `providers.tsx`, `query-client.ts`, `theme.ts` | `app/config/` |
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
  - a `RouteFallback` (`shared/ui/feedback/RouteFallback.tsx`, a centred `CircularProgress`) shows while a section loads.
- **Highcharts gets its own chunk:** `build.rollupOptions.output.manualChunks` in `vite.config.ts` puts `highcharts` and `highcharts-react-official` into a `charts` chunk, and MUI into a `mui` chunk.
- The build stage of `verify` prints chunk sizes. The Vite chunk-size warning must be gone, so the largest chunk stays under 500 kB.

This is a loading change only. Section components are unchanged, and the smoke tests wait for each lazy route.

## 4. Tests

- Colocated tests move with their files.
- Smoke tests, unit tests and component tests must pass unchanged. Only their import paths change.

## 5. Acceptance

- `npm run verify` passes. Test count is unchanged since Step 02.
- The build shows separate `charts` and `mui` chunks and one chunk per section, with no chunk-size warning.
- `src/components`, `src/services` and the generic hooks inside `modules/materials/hooks` no longer exist.
- `rg "\.\./\.\./\.\./" src` finds no matches in moved files.
- Commit: `refactor(frontend): step 03 shared layer, app and pages structure`.
