# Conventions Refactoring Plan

**Status:** In progress — Phase 2 complete (awaiting commit); next: Phase 3 (`common/`)  
**Branch:** `refactoring`  
**Goal:** bring the backend in line with [`CONVENTIONS.md`](../CONVENTIONS.md) (one construct per file,
folder-per-construct, service / static-class / function rules, file-length limits) **without changing behaviour**.  
**Rule of the plan:** every step is a behaviour-preserving move / split / rename. No formula, API, DTO
name or response shape changes. If a step needs one, stop and raise it separately.
**Commit workflow:** agent does not commit; after each phase the agent hands a commit command for
human verify + commit, then continues.

---

## 1. Baseline measurements (backend/src, 2026-11-17)

Heuristic counts from a script (regex over `export` statements; data files, specs and `index.ts`
excluded). Re-measure in Phase 0 — these are the numbers the plan must drive down.

| # | Violation | Count | Where (largest first) |
|---|-----------|-------|------------------------|
| V1 | Files with more than one exported construct | **55** of 593 | refractory 33, thermal-distribution 8, thermodynamics 8, common/thermal 4, thermal-exchange 2 |
| V2 | Files mixing construct kinds (type + function, interface + class, …) | **25** | 10 refractory `interfaces/*.interface.ts` contain **functions**; DTO files with enums; services with an inline interface |
| V3 | Files exporting ≥ 2 free functions (function families) | **25** | `series-bc3.util.ts` 24, `series-bc1.util.ts` 12, `glass-viscosity-vtf.util.ts` 9, `equation-validity.util.ts` 6, … |
| V4 | `interface` used as a plain data shape (no methods) | **~207 of 215** | refractory 126, common/thermal 45, combustion 16, thermodynamics 7 |
| V5 | Wrong folder for the suffix | **26** `.interface.ts`, **13** `.type.ts`, **3** `.constants.ts` outside their folder; **5** files in `constants/` without `.constants.ts`; 1 `.type.ts` inside `interfaces/` | `common/utils/*`, `common/chemistry`, `common/thermal/utils/*`, `refractory/constants` |
| V6 | `*.helper.ts` files | **6** (3 function-based, 3 already static classes) + 7 `nu-formulas/*.nu.ts` objects | `modules/thermodynamics/helpers/` |
| V7 | Service passed as a function argument | **1** | `compound-fluid-props.helper.ts` |
| V8 | Module-level functions beside a service/controller | **3** | `thermal-distribution.controller.ts`, `mix-thermal.service.ts`, `recuperator.service.ts` |
| V9 | Code files over 300 lines (non-data) | **20** | `glass-viscosity-vtf.util.ts` 633, `viscosity-parameters.ts` 587, `bed-combustion.service.ts` 491, `glass-viscosity.service.ts` 497 |
| V10 | Docs over 500 lines | **15** | `PACKING_MODELS.md` 851, `REFRACTORY_API_SPEC.md` 838, `TEST_SPECIFICATION.md` 756 |
| V11 | Singular legacy folders (`type/`, `enum/`) | 3 | `common/thermal/type`, `common/thermal/enum`, `thermal-distribution/type` — **stay** (documented legacy) |

V9/V10 are already guarded by the file-length baseline
(`backend/test/unit/conventions/file-length-baseline.json`: 20 code + 15 docs).

### Not violations (do not "fix")

- **32 files in `common/thermal/type/`** named `<name>-equation.ts` (no `.type.ts` suffix): documented
  in `CONVENTIONS.md` §5/§8. **Decision D2** below adds this to the folder table as an exception.
- Data files (`data/`, `*.data.ts`, `compound/`) — exempt from length and from V2/V3.
- `app.controller.ts`, `app.service.ts`, `health-status.dto.ts` at `src/` root (bootstrap files).

---

## 2. Decisions to confirm before Phase 1

| ID | Question | Recommendation |
|----|----------|----------------|
| D1 | Convert the ~207 data-shape `interface`s to `type`? (large churn, mostly mechanical) | **Yes, during the split of each file** — the file is rewritten anyway, so each declaration is touched once. `interface X extends Y` becomes `type X = Y & {…}`. |
| D2 | Equation types: keep `type/<name>-equation.ts` without `.type.ts`? | **Keep**; add as an explicit exception row in the `CONVENTIONS.md` folder table. |
| D3 | Big lookup tables in `constants/` (`viscosity-parameters.ts` 587, `calculation-constants.ts` 308) | If it is a dataset → move to `data/*.data.ts` (exempt). If it is logic-adjacent constants → split into several `*.constants.ts`. Decide per file. |
| D4 | Function families that are numerical series (`series-bc1/bc3`, `eigenvalues-*`) | Static class **per concern** (e.g. `SeriesBc3`) — only after golden-value regression tests exist (Phase 5). |
| D5 | `nu-formulas/*.nu.ts` (objects of functions) | Low priority: convert to static classes at the end of Phase 2, or leave as-is and mark as accepted. |
| D6 | Enforce structure automatically? | **Yes** — Phase 0.3 extends the conventions test with ratcheting baselines (same mechanism as file length). |
| D7 | Branching / PR granularity | One branch per phase, **one PR per module** (Phase 6 per sub-step). Never mix modules in one PR. |

---

## 3. Definition of "step done" (applies to every step)

Run **inside Docker** (never on the host). A step is not done until all of these pass:

| # | Check | Command |
|---|-------|---------|
| C1 | Type check — **exit code must be 0** | `docker compose exec backend npx tsc --noEmit` (do **not** rely on `make check-types`: it pipes through `grep | head`, which hides the exit code) |
| C2 | Full backend test suite, same pass count as Phase 0.1 | `docker compose exec backend npm run test` |
| C3 | Conventions tests (file length + structure) | `docker compose exec backend npm run test -- conventions` |
| C4 | Lint without auto-fix | `docker compose exec backend npx eslint "{src,test}/**/*.ts"` (the `npm run lint` script uses `--fix` and would rewrite files) |
| C5 | Build | `docker compose exec backend npm run build` |
| C6 | Move-only review: renames detected, no logic diff | `git diff -M --stat` and `git diff --color-moved=dimmed-zebra` |
| C7 | Baselines only shrank | `git diff` on `backend/test/unit/conventions/*baseline*.json` shows only removals / lower numbers |
| C8 | Public API unchanged for touched modules | Swagger/OpenAPI JSON before vs after (if enabled) and frontend contract/type generation produce **no diff** |
| C9 | Docs + status updated in the same commit | `docs/migration/IMPLEMENTATION_STATUS.md`, plus `docs/INTERFACES_IMPLEMENTATION_INDEX.md` when DTOs/interfaces move, `docs/services/COMMON_THERMAL_LIBRARY.md` for common changes |

**Commit rule:** one commit per step, message `refactor(<module>): <step id> <what>`.  
**Rollback rule:** if C2 fails and the cause is not obvious within one fix attempt, revert the step's
commit and split it into smaller steps — do not push forward with a red suite.

### New code must comply now (no deferred rewrite)

Grandfathering applies **only** to pre-existing `src/` violations listed in the structure / file-length
baselines. **Every file created or substantially rewritten by this plan** — including tests,
convention checkers, seed scripts, and docs — must already satisfy [`CONVENTIONS.md`](../CONVENTIONS.md)
before the step is handed off. Do **not** leave “fix in a later phase” debt in new files.

| # | Requirement |
|---|-------------|
| N1 | **One exported construct per file** (V1). Related constants → one `export const` object, or separate `*.constants.ts` files — never several top-level `export const`s in one file. |
| N2 | **No mixed exported kinds** (V2): no `export const` + `export function`, no class + exported type, etc. in the same file. |
| N3 | **No free-function families** (V3); use a static class or a service. |
| N4 | **Correct folder + suffix** (V5): `types/` + `.type.ts`, `constants/` + `.constants.ts`, `utils/` + kebab class file or `*.util.ts`, … |
| N5 | **No new `*.helper.ts`** (V6). |
| N6 | **Length:** new production code ≤ 300 lines; new tests ≤ 500. Prefer splitting early (aim ≤ 200 for new utils/services). “It’s under `test/` so 500 is fine” is not a reason to ship a 300+ line utility that should be several classes. |
| N7 | **File-private `const`s** next to a class are allowed only when trivial and used solely by that class (CONVENTIONS § placement rule 5). Shared or non-trivial config (path sets, rule tables, baseline paths) goes in `constants/*.constants.ts` **in the same step** — do not park them beside the class “for now”. |
| N8 | **One-shot scripts** live under `backend/scripts/` (or the repo’s existing scripts area), not beside unit specs. |
| N9 | Before handoff, **manually audit every new/changed file** for N1–N8 (the structure ratchet only scans `src/`, so `test/` and `scripts/` will not catch violations automatically). |

**Lesson (Phase 0):** shipping a multi-export `structure-rules.constants.ts` and a 300+ line
`structure-checker.ts` with inline config, then “splitting later,” violated this rule and forced a
rewrite before commit. Do not repeat.

| # | Check | Command / action |
|---|-------|------------------|
| C10 | New/rewritten files obey N1–N9 | Review the step’s diff file-by-file; fix before asking for commit |

### Techniques (reuse, do not reinvent)

- `backend/codemod-split.mjs` — splits multi-export TS files into one construct per file and rewrites
  importers (usage: `node codemod-split.mjs split.json`). `backend/codemod-tidy.mjs` — switches imports to
  folder barrels and merges duplicates. **Read both and dry-run on one small file before relying on them**;
  they are described as temporary tools and have not been verified for this plan.
- Keep each folder's `index.ts` barrel exporting the same public names so imports outside the module do
  not change.
- Rename with `git mv` so history follows (C6 relies on it).

---

## 4. Phases

Order is **risk-ascending** and **dependency-aware**: guardrails first, a small pilot module to prove
the procedure, shared foundations next, numerically sensitive code only with regression nets, the
largest module last.

### Phase 0 — Safety net and guardrails (no production code changes)

| Step | Action | Checkpoint |
|------|--------|-----------|
| 0.1 | Run the whole suite in Docker; record suites / tests / coverage (`npm run test:cov` → `tmp/reports/tests/`). | **CP0.1:** ✅ 71 suites / 1137 passed / 1 skipped (2026-11-17). |
| 0.2 | Run the new `conventions` tests (written but **never executed** when added). Fix any defect in them; confirm `docs/` is mounted (`./docs:/docs:ro`). | **CP0.2:** ✅ file-length + docs rule pass after backend recreate with `/docs` mount. |
| 0.3 | Add a **structure spec** next to the file-length spec, each rule with a ratcheting baseline JSON (same semantics: may not grow, only shrink): (a) one exported construct per file; (b) no mixed construct kinds; (c) no ≥ 2 exported free functions per file; (d) suffix ↔ folder match; (e) no new `*.helper.ts`. Seed baselines with today's violations (V1–V3, V5, V6). | **CP0.3:** ✅ AST baselines: V1=55, V2=25, V3=25, V5=47, V6=6 (match §1 ±1 on V5). |
| 0.4 | Snapshot public contracts: Swagger JSON (if enabled) and frontend-generated types. | **CP0.4:** ✅ Swagger → `tmp/reports/contracts/swagger-phase0.json` (71 paths). Frontend OpenAPI gen not implemented — C8 is Swagger-only for now. |
| 0.5 | Create the working branch (decide whether from `mineral-phase` or `main`); no mixing with feature work. | **CP0.5:** ✅ using existing branch `refactoring`. |

### Phase 1 — Pilot: `metals` module (smallest; validates the procedure)

| Step | Action | Checkpoint |
|------|--------|-----------|
| 1.1 | Split `metals/data/interfaces/metal-thermal.interface.ts` (3 exports) into 3 files; `MetalLambdaCoefficients` and `MetalEmissivityCoefficients` become `type` in `types/`; `MetalThermalEntry` stays an `interface` only if it has methods, otherwise `type` (D1). | ✅ Manual split → `metals/types/*.type.ts` (all three are data shapes → `type`). Structure baseline unchanged: file lived under `data/` and is excluded by `STRUCTURE_EXCLUDE_PATTERNS`. |
| 1.2 | Dry-run `codemod-split.mjs` / `codemod-tidy.mjs` here; record what they get right/wrong in a short note appended to this doc. | ✅ See **Phase 1 codemod notes** below. **Review gate:** proceed to Phase 2 only after user approval. |

### Phase 2 — `thermodynamics` (helpers → service/classes)

| Step | Action | Checkpoint |
|------|--------|-----------|
| 2.1 | `known-fluid.type.ts` (type + const + function) → split; named fluids use **`FLUID_REGISTRY`** (no parallel `KNOWN_FLUIDS` allowlist). | ✅ `KnownFluids` derives allow-list/docs from registry (+ `gas_mix`); legacy `water`→`H2O` only. |
| 2.2 | `compound-fluid-props.helper.ts` → **`CompoundFluidPropsService`** … characterization tests first. | ✅ Tests green before/after; `EUCKEN_FACTOR`; V7 = 0. |
| 2.3 | `correlation-validity` + `nu-coefficients` → static classes in `utils/`; constants split out. | ✅ `CorrelationValidity`, `NuCoefficients`. |
| 2.4 | Move remaining helpers to `utils/`; remove `helpers/`. | ✅ `helpers/` gone; `nu-formulas/` under `utils/` (D5 objects left as-is). V6 = 0. |
| 2.5 | Move inline types out of `dimensionless-calculation.service.ts`; split controller if > 300. | ✅ `ResolvedFluidProps` / `FlatFluidInput` types; controller split into gas / body-geometry / dimensionless (routes unchanged). |
| 2.6 | (Optional, D5) `nu-formulas/*.nu.ts` → static classes. | Skipped (D5). |

### Phase 3 — `common/` (shared foundation: thermal library, utils, chemistry)

Highest fan-out: every module imports this. Keep barrels stable; no export renames.

| Step | Action | Checkpoint |
|------|--------|-----------|
| 3.1 | Move 26 `.interface.ts` / 13 `.type.ts` / 3 `.constants.ts` into their construct folders (e.g. `common/utils/quadrature/*.interface.ts` → `common/utils/quadrature/interfaces/`); `gas-compound-query.type.ts` out of `interfaces/` into `types/`. Pure moves + import rewrites. | C1–C9; V5 → 0 for `common/`. |
| 3.2 | `equation-validity.interface.ts` (interface + type) and `evaluate-nasa-thermo.util.ts` (function + type) → one construct per file. | V2 −2. |
| 3.3 | `equation-validity.util.ts` (6 free functions) → static class `EquationValidity` (keep thin function re-exports **only** if needed for a deprecation window; remove at the end of the phase). Update callers (`CompoundGasBounds`, `compound-fluid-props`, etc.). | **CP3.3:** common thermal tests (188-line spec today) extended to cover the 6 functions *before* the move; V3 −1. |
| 3.4 | `common/thermal` data-shape interfaces (45) → `type` (D1) as part of 3.1–3.2 where files are touched. Compound/equation `type/` and `enum/` folders stay. | **CP3:** V4 for `common/` reduced to interfaces with real behaviour (`Equation<T>` etc.). |
| 3.5 | `docs/services/COMMON_THERMAL_LIBRARY.md` + `docs/INTERFACES_IMPLEMENTATION_INDEX.md` updated. | C9. |

### Phase 4 — Small modules: `combustion`, `thermal-exchange`, `recuperator`

| Step | Action | Checkpoint |
|------|--------|-----------|
| 4.1 | `combustion`: 16 data-shape interfaces → `type` + one file each; `bed-combustion.service.ts` (491 lines) → split by responsibility (e.g. bed model vs flue-gas assembly) into services, not helpers; extend tests first if coverage < 80 %. | C1–C9; baseline −1 (V9). |
| 4.2 | `thermal-exchange`: `layer.dto.ts` (class + type) → separate files. | V2 −1. |
| 4.3 | `recuperator.service.ts` (322 lines, module-level function) → move function into a private method or static class; trim under 300. | V8 −1, V9 −1. |

### Phase 5 — `thermal-distribution` (numerically sensitive)

**Precondition (CP5.0):** golden-value regression tests exist for the series / eigenvalue code
(`IMPLEMENTATION_STATUS` reports 602 tests — verify that they pin numeric outputs for BC1/BC3 and hollow
variants, not just shapes). If not, add them first.

| Step | Action | Checkpoint |
|------|--------|-----------|
| 5.1 | `eigenvalues-bc1/bc3`, `eigenvalues-hollow-bc3`, `characteristic-length` (function + type): split the type out; group functions into static classes per concern (D4). | Golden values **bit-identical** (compare with tolerance 0 where the old tests used exact equality). |
| 5.2 | `series-bc1.util.ts` (12 functions) / `series-bc3.util.ts` (24 functions, 426 lines) / hollow variants → static classes, e.g. `SeriesBc3` split into ≤ 300-line classes by concern. | C2 identical pass count; no tolerance loosened anywhere (reviewer checks the diff of `test/`). |
| 5.3 | `thermal-distribution.controller.ts` module-level function → service; `thermal-distribution.service.ts` (465 lines) → split; `type/` legacy folder stays. | V8 −1, V9 −2. |

### Phase 6 — `refractory` (largest: 33 of the 55 V1 files, 126 data interfaces)

Do it as several PRs, in this order (each PR is one sub-step, each passes C1–C9):

| Step | Scope | Notes / checkpoint |
|------|-------|--------------------|
| 6.1 | `constants/`: rename the 5 files to `*.constants.ts`; split `calculation-constants.ts` (25 exports) and `blend-optimizer.constants.ts` (const + function: move function out) | D3 per file; `viscosity-parameters.ts` → `data/` if dataset. |
| 6.2 | `enums/viscosity-model.enum.ts` (const + enum), DTO files with enums (`glass-viscosity.dto.ts`, `water-demand.dto.ts`) → enums into `enums/*.enum.ts` (old enums in `*.dto.ts` are tolerated legacy, so this is optional but cheap) | **C8 critical:** enum values and Swagger identical. |
| 6.3 | `interfaces/` — 10 files with functions inside (22, 19, 18, 16, 15, 15, 14, 14, 10 exports …): move functions to static classes in `utils/`, split every declaration into its own file, convert data shapes to `type` (D1), move to `types/`. Do **one file per commit**. | Largest churn of the plan; commit-per-file keeps review and bisect feasible. Interfaces with real behaviour remain `interface`. |
| 6.4 | `utils/`: `glass-viscosity-vtf.util.ts` (633 lines, 9 functions), `viable-range-formatter`, `glass-composition` (class + function), `composition-analyzer` (class + interface), `glass-viscosity-arrhenius/iida` → static classes ≤ 300 lines; numerical-regression guard as in Phase 5. | Golden values unchanged. |
| 6.5 | Services > 300 lines: `glass-viscosity.service.ts` 497, `blend-optimizer.service.ts` 446, `packing.service.ts` 352 (+ inline interface), `shrinkage.service.ts` 341, `mix-thermal.service.ts` (module-level function); controller `refractory.controller.ts` 438 → thin, split by resource, routes identical. | Extend thin tests first (IMPLEMENTATION_STATUS lists several 20–40-line spec files). |

### Phase 7 — Documentation limits (docs/ only, no code)

| Step | Action | Checkpoint |
|------|--------|-----------|
| 7.1 | Split the 15 docs over 500 lines by topic, each with an index/link from its parent (`algorithms/README.md`, `PACKING_MODELS.md`, `REFRACTORY_API_SPEC.md`, `TEST_SPECIFICATION.md`, …). Order by size, largest first. | `make doc-check` (links) passes after each split; baseline docs entries removed. |
| 7.2 | Check `docs/` references to moved files / folders (`CONVENTIONS.md`, `COMMON_THERMAL_LIBRARY.md`, `INTERFACES_IMPLEMENTATION_INDEX.md`). | `make doc-check` green. |

### Phase 8 — Close-out

| Step | Action | Checkpoint |
|------|--------|-----------|
| 8.1 | All structure and length baselines empty (or each remaining entry has a written, agreed exception). | **CP8.1:** baseline JSON files are `{}` or only agreed exceptions. |
| 8.2 | Coverage ≥ 80 % for touched services (Definition of Done). | `npm run test:cov` report. |
| 8.3 | Remove temporary tooling (`codemod-*.mjs`) if no longer needed; update `CONVENTIONS.md` with lessons / amendments (D2 exception, any new rule). | Docs updated. |
| 8.4 | Decide on lint enforcement (ESLint `no-restricted-syntax` / `max-classes-per-file`) to complement the tests. | Decision recorded. |

---

## 5. Risk register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Import rewrite breaks a module that is not covered by tests | Runtime error in rarely used path | C1 (`tsc --noEmit`) + C5 (build) on every step; barrels keep public paths stable |
| `interface` → `type` changes semantics (declaration merging, `extends`, `implements` of unions, class `implements` a type alias) | Compile errors or subtle typing changes | Convert only plain object shapes; `tsc` gate; unions that a class implements stay `interface` |
| Numerical code reorganised and results shift (floating-point order of operations) | Wrong engineering results | Phase 5/6.4 regression nets; move code verbatim, no simplification; exact-equality golden values |
| DTO moves alter Swagger / generated frontend types | Frontend contract break | C8 on every DTO-touching step; no renames of classes or properties |
| Big PRs unreviewable | Mistakes slip through | One module per PR; one file per commit in 6.3; `git diff -M --color-moved` (C6) |
| Static class with state or DI sneaks in | Violates convention, hard to test | Review rule: static classes have no DI; services own all injected dependencies |
| Refactor races with feature work (branch `mineral-phase`) | Conflicts | Decide branch strategy in 0.5; rebase per phase; keep phases short |
| Heuristic counts are off | Wrong effort estimate | Phase 0.3 replaces the regex survey with an AST-accurate check before any refactoring |
| Test suite itself is red or flaky at the start | No safety net | CP0.1 gate — fix or quarantine first |

---

## 6. Order summary and rough size

| Phase | Module / scope | Size | Depends on |
|-------|----------------|------|-----------|
| 0 | Guardrails | S | — |
| 1 | `metals` pilot | S | 0 |
| 2 | `thermodynamics` | M | 1 approved |
| 3 | `common/` | M–L (high fan-out) | 1 |
| 4 | `combustion`, `thermal-exchange`, `recuperator` | M | 3 (shared types moved) |
| 5 | `thermal-distribution` | M (high care) | 3, golden tests |
| 6 | `refractory` | **XL** | 3, 5 technique proven |
| 7 | Docs > 500 lines | M (parallelisable at any time) | — |
| 8 | Close-out | S | all |

Phase 7 is independent of code phases and can run in parallel.

---

## Phase 1 codemod notes (CP1 procedure)

Pilot file: `metals/data/interfaces/metal-thermal.interface.ts` → three `metals/types/*.type.ts` files
(`interface` → `type` for all three; no methods). Sole importer:
`data/materials/metal-thermal.data.ts`.

### What was run

| Tool | Result |
|------|--------|
| **Manual split** | Used for the pilot. One construct per file, D1 conversion, import rewrite, delete empty `data/interfaces/`. Prefer this for small files and whenever `interface` → `type` is required. |
| `codemod-split.mjs` | **No dry-run mode** — writes, rewrites importers, can delete the source. Requires a `split.json` that maps every export. Does **not** convert `interface` → `type` or move into a different construct folder with a new suffix; it copies declaration text as-is into target paths. For this pilot it would have left three `.interface.ts` bodies unless targets were pre-named `*.type.ts` **and** the keyword rewritten by hand afterward. |
| `codemod-tidy.mjs` | Only useful when a folder has an `index.ts` barrel with named re-exports. Metals `types/` has no barrel yet — tidy would be a no-op. Also writes in place with no dry-run. |

### Procedure for later phases

1. For **≤ ~5 exports** or any `interface` → `type` / suffix-folder change: **split by hand** (or `git mv` + edit), follow N1–N9.
2. For **large multi-export files** that stay the same construct kind: optional `node codemod-split.mjs split.json` with every export mapped; then immediately `tsc`, tests, and a manual pass for D1 / folder / suffix.
3. After adding a folder `index.ts` barrel: optional `node codemod-tidy.mjs <module-path>` to point external imports at the barrel — review the diff; it skips default imports and `index.ts` itself.
4. Never rely on the codemods alone for C6/C10; always review with `git diff -M --color-moved=dimmed-zebra`.

### Baseline note

Files under `data/` are excluded from the structure ratchet (`STRUCTURE_EXCLUDE_PATTERNS`). The pilot
file was therefore **not** in `structure-baseline.json`; fixing it does not shrink V1 in the baseline.
Types that belong in `types/` must not stay under `data/` — placement is still mandatory even when
the ratchet does not see them.

---

*Update this file and [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) as steps complete.*
