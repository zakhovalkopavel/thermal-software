# Step 02 — Foundation

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D eslint-plugin-check-file'
```

**Goal:** add the tools later steps rely on, without moving any code.

---

## 1. Path alias `@/`

| File | Change |
|------|--------|
| `frontend/tsconfig.json` | `"paths": { "@/*": ["./src/*"] }` (no `baseUrl`, which newer TypeScript versions deprecate) |
| `frontend/vite.config.ts` | `resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }` (also used by Vitest through `mergeConfig`) |

Existing relative imports stay as they are. They are rewritten as files move in Steps 03, 11 and 12. The new route files below already import `RouteErrorBoundary` through `@/`, so the alias is exercised by the build, the typecheck and the tests.

`tsconfig.json` now excludes `src/**/*.test.{ts,tsx}`; `tsconfig.test.json` sets `"exclude": []` and checks them with the test setup types (jest-dom matchers, Node).

## 2. Lint rules (warnings)

Add the rules from [ARCHITECTURE.md §6](ARCHITECTURE.md#6-lint-enforcement-frontendeslintconfigjs) to `frontend/eslint.config.js` as `warn`, except `i18next/no-literal-string`, which comes in Step 09.

- **Problem:** `npm run lint` uses `--max-warnings 0`, so warnings would break the gate.
- **Fix:** split the scripts.
  - The new rules live in `eslint.refactor-rules.js`. `eslint.config.js` adds them only when `LINT_REFACTOR=1` is set.
  - `lint` stays unchanged and strict (`--max-warnings 0`), without the new rules.
  - `lint:refactor` (`LINT_REFACTOR=1 eslint src`) reports them as warnings without failing.
- `verify` runs `lint:refactor` right after `lint` as an `INFO` stage and prints `N architecture warnings`. The count is expected to fall step by step and reach zero by Step 13. Without the plugin installed, the stage prints `eslint-plugin-check-file not installed`.
- Ignore `src/shared/api/generated/**`, `tests/fixtures/**` and `test-results/**` (global ignores in `eslint.config.js`).
- **What each rule covers in `eslint.refactor-rules.js`:**
  - `no-restricted-imports`: relative imports three or more levels up; `useForm` outside `src/shared/form`; deep imports into the other module (anything past its `index.ts`); `app` or `modules` imports from `src/shared`.
  - `check-file/filename-naming-convention` (middle extensions ignored): PascalCase `.tsx` except the entry and route files (`main`, `router`, `app-routes`, `providers`, `routes`); `use<Name>.ts` in `hooks/`; kebab-case for every other `.ts` inside a folder.
  - `check-file/folder-match-with-fex`: `*.api.ts` in `api/`, `*.mapper.ts` in `mappers/`, `*.constants.ts` in `constants/`, `*.type.ts` under `types/`, `*.schema.ts` in `schemas/`, `use*.ts` in `hooks/`, `*Chart.tsx` in `charts/`.
  - `max-lines` 200 for `.tsx` (tests excluded).
  - `no-restricted-syntax` in `src/modules`: `'°C'`, `'K'`, `'Pa'` literals and JSX text, `°C` in template strings, `digits` JSX props.

## 3. `RouteErrorBoundary`

- New component `src/components/common/RouteErrorBoundary.tsx`. It moves to `shared/ui/feedback` in Step 03.
- It uses `useRouteError()` and `isRouteErrorResponse`, and shows a title, the error message, a "Back to home" link and a "Reload" button. In development it also shows the stack in a collapsible block.
- **Placement:** every layout route wraps its children in a pathless route whose `errorElement` is `RouteErrorBoundary`. The error then renders in that layout's `<Outlet />`, so the layout stays:
  - `app/app-routes.tsx`: the root route has its own `errorElement` (for a crash in `Layout` itself) plus the pathless wrapper around home, modules and not-found, so the AppBar stays;
  - `materials` and `processes` routes: a pathless wrapper around the hub and sections, so the module navigation stays too.
- Component test (`RouteErrorBoundary.test.tsx`):
  - a route whose element throws renders the boundary with the message, inside the parent layout;
  - the link points to `/`;
  - an unmatched path shows `404 Not Found`.
- The route smoke test also fails when the boundary heading ("Something went wrong") appears, because the boundary replaces React Router's default error page.

## 4. Acceptance

- `npm run verify` passes; `lint:refactor` prints the baseline warning count. Recorded baseline: **670** (526 `no-restricted-imports`, 131 `no-restricted-syntax`, 10 `folder-match-with-fex`, 2 `max-lines`, 1 `filename-naming-convention`).
- A temporarily throwing section (local check) shows `RouteErrorBoundary` inside the layout instead of the React Router default page. Done for `HtcSection`: the `/processes/htc` smoke test failed with the boundary heading and the thrown message, then the change was reverted.
- Commit: `refactor(frontend): step 02 path alias, refactor lint rules, route error boundary`.
