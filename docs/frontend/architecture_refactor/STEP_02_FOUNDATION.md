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
| `frontend/tsconfig.json` | `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }` |
| `frontend/vite.config.ts` | `resolve.alias: { '@': path.resolve(__dirname, 'src') }` (also used by Vitest through `mergeConfig`) |

Existing relative imports stay as they are. They are rewritten as files move in Steps 03, 11 and 12.

## 2. Lint rules (warnings)

Add the rules from [ARCHITECTURE.md §6](ARCHITECTURE.md#6-lint-enforcement-frontendeslintconfigjs) to `frontend/eslint.config.js` as `warn`, except `i18next/no-literal-string`, which comes in Step 09.

- **Problem:** `npm run lint` uses `--max-warnings 0`, so warnings would break the gate.
- **Fix:** split the scripts.
  - The new rules live in `eslint.refactor-rules.js`. `eslint.config.js` adds them only when `LINT_REFACTOR=1` is set.
  - `lint` stays unchanged and strict (`--max-warnings 0`), without the new rules.
  - `lint:refactor` (`LINT_REFACTOR=1 eslint src`) reports them as warnings without failing.
- `verify` prints the `lint:refactor` warning count as information. It is expected to fall step by step and reach zero by Step 13.
- Ignore `src/shared/api/generated/**`, `tests/fixtures/**` and `test-results/**`.

## 3. `RouteErrorBoundary`

- New component `src/components/common/RouteErrorBoundary.tsx`. It moves to `shared/ui/feedback` in Step 03.
- It uses `useRouteError()` and `isRouteErrorResponse`, and shows a title, the error message, a "Back to home" link and a "Reload" button. In development it also shows the stack in a collapsible block.
- It is set as `errorElement` on the root route in `app/router.tsx` and on the `materials` and `processes` route objects. A crash inside a section then keeps the layout and navigation visible.
- Component test:
  - a route whose element throws renders the boundary with the message;
  - the link points to `/`.

## 4. Acceptance

- `npm run verify` passes; `lint:refactor` prints the baseline warning count.
- A temporarily throwing section (local check) shows `RouteErrorBoundary` inside the layout instead of the React Router default page.
- Commit: `refactor(frontend): step 02 path alias, refactor lint rules, route error boundary`.
