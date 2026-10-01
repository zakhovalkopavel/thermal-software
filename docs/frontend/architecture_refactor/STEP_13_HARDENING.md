# Step 13 — Hardening

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D @vitest/coverage-v8'
```

**Goal:** lock the architecture in so it cannot drift back.

---

## 1. Lint

- Merge `eslint.refactor-rules.js` into `eslint.config.js` with every rule set to `error`, and delete the `LINT_REFACTOR` switch and the `lint:refactor` script.
- `react-refresh/only-export-components` becomes `error`.
- `lint` keeps `--max-warnings 0`.

## 2. Duplication threshold

- The `jscpd` stage added in Step 01 (information only) becomes a failing stage of `verify`.
- The threshold is set just above the duplication percentage measured after Step 12, and at most 3 %.
- The JSON report goes to `test-results/jscpd/`.
- On failure, `verify` lists each clone with its two locations and line ranges.

## 3. Dead code

Delete:
- `assertRequiredNumbers` and `required-numbers.mapper.ts`;
- the old `NumberFieldGrid`;
- the temporary `label` fallbacks in `NumberFieldSpec`, `ResultCardItem` and table columns;
- the `digits` props replaced by `precision`;
- the old grid mappers replaced by `linspace` and `rangeByStep`;
- `TemperatureField`'s `unit` prop;
- any leftover non-form field usage in calculator forms.

`rg` confirms no references remain.

## 4. Coverage thresholds

`vitest.config.ts` gets `coverage: { provider: 'v8', include: ['src/**/mappers/**', 'src/**/schemas/**', 'src/shared/**/*.ts'], thresholds: { lines: 90, branches: 85 } }`. `verify` runs the `test` stage with `--coverage`. A drop below the thresholds fails with the uncovered files listed.

## 5. Final checks

- Run `npm run verify` and `npm run api:check`.
- Check the "done" criteria in [CHECKLIST.md](CHECKLIST.md#done-criteria), each with its `rg` command.
- Open every page in the browser once, with the temperature setting on °C and then on K, and the pressure setting on Pa and then on bar. This is a manual pass until browser tests exist.
- Update the documentation:
  - `docs/frontend/README.md` links to [ARCHITECTURE.md](ARCHITECTURE.md) and [TESTING.md](TESTING.md);
  - `frontend/README.md` lists the commands;
  - [README.md](README.md) status becomes **Done**.

## 6. Acceptance

- `npm run verify` passes with lint at errors and the duplication and coverage thresholds active.
- Commit: `refactor(frontend): step 13 enforce architecture rules, duplication and coverage thresholds`.
