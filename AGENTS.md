# AGENTS.md — Mandatory Rules for AI Agents

These rules are **compulsory**. They are a condensed form of [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md),
which is the source of truth. If anything here conflicts with `docs/CONVENTIONS.md` or a linked
document, the docs win — and tell the user about the discrepancy.

## 0. Workflow (do this every time)

1. **Before writing code**, read `docs/CONVENTIONS.md` and every domain doc relevant to the task
   (see the table in §9). Do not rely on memory or on patterns from other projects.
2. **Before finishing**, walk through the checklist in §10 and fix every violation. Do not report
   a task as done while any item fails.
3. If a convention cannot be followed, **stop and ask the user** — never silently deviate.
4. Prefer imitating an existing, nearby file over inventing a new structure.

## 1. Single Responsibility — one primary construct per file

**Every construct lives in its own folder, with its own suffix, one per file. Mandatory.**

| Construct | Folder | File | File exports exactly one |
|---|---|---|---|
| Type alias (data shape) | `types/` | `<name>.type.ts` | `export type` |
| Interface (behavioural contract) | `interfaces/` | `<name>.interface.ts` | `export interface` |
| DTO | `dto/` | `<name>.dto.ts` | `export class` |
| Enum | `enums/` | `<name>.enum.ts` | `export enum` |
| Constant / lookup table | `constants/` | `<name>.constants.ts` | `export const` (one `as const` object for related values) |
| Static dataset | `data/` | `<name>.data.ts` | `export const` |
| Service | `services/` | `<name>.service.ts` | `@Injectable()` class |
| Controller | `controllers/` | `<name>.controller.ts` | controller class |
| Entity | `entities/` | `<name>.entity.ts` | entity class |
| Static utility class | `utils/` | `<class-name>.ts` | `export class` (static methods) |
| Single pure formula | `utils/` | `<name>.util.ts` | one `export function` |
| Compound data | `compound/<phase>/` | `<compound>.ts` | `export const` (compound object) |

Placement rules (full text: `docs/CONVENTIONS.md` § Placement rules):

- **Never** put a construct in another construct's folder (a type in `interfaces/`, an interface in
  `types/`, a constant in a service file, anything in a module root).
- **Never mix** interfaces, types, enums, constants, functions, and classes in one file.
- A service / controller / class file contains **only that class** — no exported or file-level helper
  functions beside it (use `private` / `private static` methods).
- File-private, non-exported constants used by one construct may stay in its file; once exported or
  shared they move to `constants/`.
- `index.ts` barrels may hold re-exports only.
- **Folder names are plural** for new folders (`types/`, `enums/`, `interfaces/`, `constants/`,
  `services/`); `dto/` stays singular. Existing singular `type/` and `enum/` in `common/thermal/` are
  legacy: keep using them there, don't rename them, never create both spellings in one module.
  New enums go to `enums/*.enum.ts` (old enums inside `*.dto.ts` files stay).
- **Choose the form by what the code needs** (full table: `docs/CONVENTIONS.md` § Choosing the form):

  | Situation | Form |
  |---|---|
  | Uses/orchestrates **injected services** | `@Injectable()` class in `services/*.service.ts`; steps are `private` methods |
  | **Stateless** related helpers, no DI | One class with `static` methods in `utils/<kebab-name>.ts` (e.g. `CompoundText`, `CompoundData`, `CompoundGasBounds`, `Common`); internals `private static` |
  | **One standalone pure formula** | One exported function per file, named after the file |
  | Constants / lookup tables | One `export const` per file in `constants/` or `data/` |

- **Never** pass injected services as function arguments (`fn(gasProps, transport, …)`) — make it an
  `@Injectable` service instead.
- **Never** create families of exported free functions (2+ related functions → a class).
- **Never** create new `*.helper.ts` files. Existing ones are migrated when touched.
- Static classes have no DI; only a documented cache with `resetCache()` is allowed as state.
- Imports are **relative**. The `@/` alias is **not configured** (no `paths` in `tsconfig.json`, no
  `moduleNameMapper` in Jest) — never introduce it. Prefer the nearest `index.ts` barrel when one exists.
- Static-class file names are `kebab-case` matching the class (`compound-text.ts` → `CompoundText`),
  without a `.util.ts` suffix.
- Each equation **method** = its own file in `utils/` with one class implementing `Equation<T>`;
  its coefficient **type** = its own file in `type/`. Never merge them.
  - `type/<equation-name>-equation.ts`
  - `utils/<equation-name>-equation-method.ts`

### File length limits (enforced by a test)

| Files | Max lines | Target |
|---|---|---|
| Backend code `backend/src/**/*.ts` | **300** | ≤ 200 |
| Backend tests `backend/test/**/*.ts` | **500** | — |
| Docs `docs/**/*.md` | **500** | split by topic, link from an index |

- **Data files are exempt** (`data/` folders, `*.data.ts`, `compound/`, generated `ref-key.*`).
  Constants are not exempt — a big lookup table that is really a dataset goes in `data/*.data.ts`.
- Physical lines count (blank lines and comments too). **Never** delete comments/blank lines or join
  lines just to fit.
- Near the limit → **split by responsibility**; never keep appending to an oversized file.
- **Never** raise a limit, add a baseline entry, or exempt a path to make a change pass — ask the user.
- Files already over the limit are grandfathered in
  `backend/test/unit/conventions/file-length-baseline.json`: they **must not grow**; lower their entry
  when they shrink and delete it once they are within the limit. The baseline only ever shrinks.
- Check: `docker compose exec backend npm run test -- conventions` (inside Docker, like all tests).
- Not covered yet: `frontend/`, `python/`, `scripts/`.

## 2. Controllers and services

- Controllers are **thin routing layers**: validate input via DTOs/pipes, call **one** service
  method per handler, return the result.
- Controllers **must not** contain business logic, formulas, service-to-service orchestration, or
  private helpers that belong in a service.
- Orchestration (e.g. resolving fluid properties, chaining gas-property + transport + dimensionless
  calls) belongs in a dedicated orchestration service injected into the controller.
- DTOs at the API boundary. No hardcoded values — use named constants in config/constants files.

## 3. `type` vs `interface`

- `export type` → plain data shapes (equation coefficients, value objects).
- `export interface` → behavioural contracts only (method signatures, service contracts).
- Never swap one for the other for convenience.

## 4. Literature references (`RefKey`)

- Every coefficient set in a compound data file **must** have `ref: RefKey.Xxx` (enum, never a raw
  number) and `page` where applicable.
- New sources: add to `shared/references/references.json`, run `make references-generate`, and make
  sure `make references-check` passes **before** using the new key. Never hand-edit generated files
  (`ref-key.enum.ts`, `ref-key.dto.ts`, Python mirrors, `docs/REFERENCES.md` table).
- **Python:** every module/class/function using literature data has a `Refs:` docstring citation
  (`[N] KeyName`) and uses `from references import RefKey` — never raw integers.

## 5. Thermodynamics rules

- **Property calculations go through `CompoundPropertyResolver`.** Never call equation method
  classes directly from business logic.
- **Use closed-form integrals** whenever one exists. Numerical integration (Gauss–Legendre) only
  when no closed form exists (e.g. `dipprN102` with non-integer c2).
- **NASA-7 / NASA-9 are separate properties**: reference them by `nasa7Key` / `nasa9Key` on
  `CompoundValue`. **Never** copy NASA coefficients into compound files and **never** put
  `nasa7`/`nasa9` entries into `heatCapacity.values`. NASA-9 is preferred when available. Data lives
  in `shared/processed/NASA/nasa7.json` / `nasa9.json`.
- Thermodynamics API: flat fluid interface, `dimensions` field, Prandtl is geometry-free,
  HTC = Nusselt input, `KNOWN_FLUIDS` is the single source of truth (see
  `docs/api/THERMODYNAMICS_API_SPEC.md`).
- **Numerical methods:** use the approved wrappers (`brentq`, `nelderMead`, …). Never call numerical
  libraries directly. Format responses via `numeric-format.util.ts`
  (see `docs/NUMERICAL_METHODS_CONVENTION.md`).

## 6. Naming

Follow `docs/NAMING_CONVENTIONS.md`:
`kebab-case` files · `PascalCase` classes · `camelCase` variables/methods · `UPPER_SNAKE_CASE`
constants (chemical-formula exception documented in that file).
Python (`docs/PYTHON_CODE_STANDARDS.md`): `snake_case` files, `PascalCase` classes, `@dataclass` for
data shapes, type hints, SRP.

## 7. Tests — ALWAYS inside Docker

- **Never** run `npm test`, `jest`, `pytest`, etc. on the host. Run inside the container:
  - `docker compose exec backend npm run test`
  - `docker compose exec backend npm run test:cov` (output → `tmp/reports/tests/`)
  - `docker compose exec backend npm run test:e2e`
  - production stack: `docker compose -f compose.production.yml exec backend npm run test`
- Never configure CI to install Node on the runner and run `npm test` directly
  (CI uses `docker compose run --rm backend npm run test:cov`).
- Unit tests live in `backend/test/unit/`, ≥ 80 % coverage. See `docs/TEST_SPECIFICATION.md` and
  `docs/SERVICE_TEST_SPEC.md`.

## 8. Secrets, reports, and generated files

- Secrets only via `.env` (`docs/ENV_ONLY_POLICY.md`). **Never** commit or hardcode credentials.
- All generated reports go to `tmp/reports/`. Only `.gitkeep` / `.gitignore` under `tmp/` are tracked
  (`docs/REPORTS_MANAGEMENT.md`).

## 9. Definition of Done (implementation + tests + docs, same commit)

A service, module, or utility is **not complete** until all three hold:

| Requirement | Where |
|---|---|
| Implementation exists and compiles | `backend/src/` |
| Unit tests, ≥ 80 % coverage | `backend/test/unit/` |
| Docs for every public method | see below |

| New artifact | Required doc |
|---|---|
| Backend **service** | `docs/api/<MODULE>_SERVICES.md` or existing `docs/api/<MODULE>_API_SPEC.md` |
| **Algorithm / formula** | `docs/algorithms/` |
| **Common library** (utility / compound data) | `docs/services/COMMON_THERMAL_LIBRARY.md` |
| **DTO or interface** | `docs/INTERFACES_IMPLEMENTATION_INDEX.md` |

**`docs/migration/IMPLEMENTATION_STATUS.md` must be updated in the same commit** whenever a service,
test file, or doc entry is added or changed. If it was not updated, the work is incomplete.

Convention docs by domain (read the ones that apply):
`docs/NAMING_CONVENTIONS.md`, `docs/CODE_QUALITY_STANDARDS.md`, `docs/api/THERMODYNAMICS_API_SPEC.md`,
`docs/services/THERMODYNAMICS_SERVICES.md`, `docs/services/COMMON_THERMAL_LIBRARY.md`,
`docs/NUMERICAL_METHODS_CONVENTION.md`, `docs/REFERENCES.md`, `docs/PYTHON_CODE_STANDARDS.md`,
`docs/INTERFACES_IMPLEMENTATION_INDEX.md`, `docs/TEST_SPECIFICATION.md`, `docs/SERVICE_TEST_SPEC.md`,
`docs/REPORTS_MANAGEMENT.md`, `docs/ENV_ONLY_POLICY.md`, `docs/PYTHON_CONTAINER.md`,
`docs/NGINX_ARCHITECTURE.md`, `docs/DOCKER_REGISTRY.md`.

## 10. Pre-completion checklist (verify every item before saying "done")

- [ ] Each file exports exactly **one** primary construct (SRP); no mixing of types, interfaces, enums, constants, functions, classes
- [ ] Each construct is in its own folder with its own suffix (`types/`, `interfaces/`, `dto/`, `enums/`, `constants/`, `services/`, …)
- [ ] No helper functions beside a class/service; no new folders with singular spelling (except `dto/`)
- [ ] Form matches need: DI/orchestration → `@Injectable` service; stateless helpers → static class; single formula → one function per file
- [ ] No injected service passed as a function argument; no new `*.helper.ts`; no families of free functions
- [ ] Imports are relative (no `@/` alias — it is not configured)
- [ ] Controller handlers contain **no** business logic — one service call each
- [ ] Data shapes use `type`; behavioural contracts use `interface`
- [ ] Every equation value has `ref: RefKey.Xxx` (no raw numbers, none missing)
- [ ] New sources added to `shared/references/references.json`; `make references-generate` run; `make references-check` passes
- [ ] **Python:** `Refs:` docstrings present; `from references import RefKey` used
- [ ] NASA data referenced via `nasa7Key` / `nasa9Key` only — not copied into compounds or `heatCapacity.values`
- [ ] Closed-form integral used where one exists
- [ ] Property calculations go through `CompoundPropertyResolver`
- [ ] Numerical routines use approved wrappers, not libraries directly
- [ ] Naming follows `docs/NAMING_CONVENTIONS.md` (`kebab-case` files, `PascalCase` classes)
- [ ] File length within limits (code ≤ 300, tests ≤ 500, docs ≤ 500; data exempt); no baseline file grew; `conventions` tests pass in Docker
- [ ] No magic numbers — named constants or references
- [ ] No secrets in code; reports written to `tmp/reports/`
- [ ] Tests written and run **inside Docker**
- [ ] Docs updated per §9 and `docs/migration/IMPLEMENTATION_STATUS.md` updated in the same change
