# Project Conventions — Master Index

**Status:** Mandatory for all development.  
**Usage:** Include this file in context whenever writing or reviewing any code, documentation,
or configuration in this project. All linked documents must be consulted for their respective domains.

---

## Convention Documents

| Domain | File | Key Rules |
|--------|------|-----------|
| **Naming** | [`docs/NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md) | `kebab-case` files, `PascalCase` classes, `camelCase` vars/methods, `UPPER_SNAKE_CASE` constants, chemical formula exception |
| **Code Quality** | [`docs/CODE_QUALITY_STANDARDS.md`](./CODE_QUALITY_STANDARDS.md) | No hardcoded values, DTOs at API boundary, SRP, constants in config files |
| **Thermodynamics API** | [`docs/api/THERMODYNAMICS_API_SPEC.md`](./api/THERMODYNAMICS_API_SPEC.md) | Flat fluid interface, `dimensions` field, Prandtl geometry-free, HTC = Nusselt input, `KNOWN_FLUIDS` as single source of truth |
| **Thermodynamics Services** | [`docs/services/THERMODYNAMICS_SERVICES.md`](./services/THERMODYNAMICS_SERVICES.md) | Implemented service methods, formulas, correlations |
| **Common Thermal Library** | [`docs/services/COMMON_THERMAL_LIBRARY.md`](./services/COMMON_THERMAL_LIBRARY.md) | Gas compounds, NASA-7/9, Sutherland, numeric utils |
| **Numerical Methods** | [`docs/NUMERICAL_METHODS_CONVENTION.md`](./NUMERICAL_METHODS_CONVENTION.md) | Use approved wrappers (brentq, nelderMead, etc.) — never call numerical libs directly; response formatting via `numeric-format.util.ts` |
| **Environment / Secrets** | [`docs/ENV_ONLY_POLICY.md`](./ENV_ONLY_POLICY.md) | All secrets via `.env`; never commit credentials |
| **Production Secrets** | [`docs/PRODUCTION_SECRETS.md`](./PRODUCTION_SECRETS.md) | Secret generation and rotation procedure |
| **Literature References** | [`docs/REFERENCES.md`](./REFERENCES.md) | TypeScript: `ref: RefKey.Xxx` in compound data files; Python: `Refs:` docstring + `from references import RefKey` |
| **Python Code Standards** | [`docs/PYTHON_CODE_STANDARDS.md`](./PYTHON_CODE_STANDARDS.md) | `snake_case` files, `PascalCase` classes, `@dataclass` for data shapes, `Refs:` docstring citations, SRP, type hints |
| **Interfaces & Index** | [`docs/INTERFACES_IMPLEMENTATION_INDEX.md`](./INTERFACES_IMPLEMENTATION_INDEX.md) | Master index of all interfaces and their implementations |
| **Test Specification** | [`docs/TEST_SPECIFICATION.md`](./TEST_SPECIFICATION.md) | Unit / integration / e2e test requirements |
| **Service Test Spec** | [`docs/SERVICE_TEST_SPEC.md`](./SERVICE_TEST_SPEC.md) | Per-service test checklist and coverage targets |
| **Reports Management** | [`docs/REPORTS_MANAGEMENT.md`](./REPORTS_MANAGEMENT.md) | All generated reports go to `tmp/reports/`; only `.gitkeep`/`.gitignore` under `tmp/` are tracked |
| **Docker / Nginx** | [`docs/NGINX_ARCHITECTURE.md`](./NGINX_ARCHITECTURE.md) | Reverse-proxy layout, SSL termination, upstream routing |
| **Python Container** | [`docs/PYTHON_CONTAINER.md`](./PYTHON_CONTAINER.md) | Python service conventions, package management |
| **Docker Registry** | [`docs/DOCKER_REGISTRY.md`](./DOCKER_REGISTRY.md) | Image naming, tagging, push/pull workflow |

---

## Core Principles (summary)

### 1. Single Responsibility Principle (SRP)
Each file exports **exactly one primary construct**, and **every construct lives in its own
folder with its own file suffix**. This is mandatory — not an example layout.

#### Construct → folder → file → export

Folders sit inside a module (`backend/src/modules/<feature>/<folder>/`) or a shared area
(`backend/src/common/<area>/<folder>/`).

| Construct | Folder | File name | The file exports exactly one |
|-----------|--------|-----------|------------------------------|
| Type alias (data shape) | `types/` | `<name>.type.ts` | `export type` |
| Interface (behavioural contract) | `interfaces/` | `<name>.interface.ts` | `export interface` |
| DTO | `dto/` | `<name>.dto.ts` | `export class` |
| Enum | `enums/` | `<name>.enum.ts` | `export enum` |
| Constant / lookup table | `constants/` | `<name>.constants.ts` | `export const` (group related values in one `as const` object, e.g. `STANDARD_CONDITIONS`) |
| Static dataset | `data/` | `<name>.data.ts` | `export const` |
| Service (injectable) | `services/` | `<name>.service.ts` | `@Injectable()` class |
| Controller | `controllers/` | `<name>.controller.ts` | controller class |
| Entity | `entities/` | `<name>.entity.ts` | entity class |
| Static utility class | `utils/` | `<class-name>.ts` (no suffix) | `export class` with `static` methods |
| Single pure formula | `utils/` | `<name>.util.ts` | one `export function` |
| Compound data | `compound/<phase>/` | `<compound>.ts` | `export const` (compound object) |

#### Placement rules

1. **A construct goes in its own folder.** A type never lives in `interfaces/`, an interface never in
   `types/`, a constant never in a service file, and so on. No "misc" or module-root dumping.
2. **A folder holds only its own construct.** `interfaces/` contains only `*.interface.ts` files,
   `services/` only `*.service.ts` files, and so on.
3. **A file never mixes constructs from different rows** of the table above — not an interface plus a
   type, not a service plus an interface, not a class plus a constant, not a function plus a type.
4. **A service / controller / class file contains only that class.** No exported or file-level helper
   functions next to it: helpers are `private` methods (or `private static` for static classes).
5. **Non-exported, file-private constants** used only by that one construct may stay in its file.
   As soon as a constant is exported or shared, it moves to `constants/`.
6. **Barrel files** (`index.ts`) may re-export several constructs; they must contain re-exports only.
7. **Folder spelling:** new folders use the plural names in the table above (`types/`, `enums/`,
   `interfaces/`, `constants/`, `services/`, …); `dto/` stays singular. The existing singular `type/`
   and `enum/` folders in `common/thermal/` are legacy: keep using them there, never rename them as a
   side effect, and never create both spellings in the same module.
8. **Legacy:** existing `*.dto.ts` files that export an `enum` stay as they are; **new** enums go in
   `enums/<name>.enum.ts`.

> **Do not mix** interfaces, types, enums, constants, functions, and classes in a single file.  
> A type file must not contain a class. A class file must not contain a type alias.

#### Choosing the form: service, static class, or single function

Pick the form by what the code **needs**, not by preference:

| # | Situation | Form | Location |
|---|-----------|------|----------|
| 1 | Uses or orchestrates **injected services** (gas properties, transport, resolvers…), or chains several services | `@Injectable()` class — instance methods, `private` methods for steps | `services/*.service.ts` |
| 2 | **Stateless**, cohesive helpers for one concern, **no DI** | One class with `static` methods; `private static` for internals | `utils/<kebab-name>.ts` (no suffix) |
| 3 | **One standalone pure formula** / thin adapter | One exported function per file, named after the file | `utils/` (`*.util.ts` allowed) |
| 4 | Constants and lookup tables | One `export const` per file | `constants/`, `data/` |

**Hard rules**
- **Never pass injected services as function arguments** (`fn(gasProps, transport, …)`). That code
  belongs in tier 1: inject the services in the constructor and use `private` methods.
- **Static classes have no DI.** The only permitted state is a documented cache with a
  `resetCache()` for tests (see `CompoundData`).
- **No free-function families.** Two or more related functions go on a class (tier 2) — never a file
  (or folder) of exported functions.
- A file never exports a function **and** an interface/type/class (SRP rule above).
- **Do not create new `*.helper.ts` files.** Use `*.service.ts` (tier 1) or a kebab-case static class
  (tier 2). Existing helpers are migrated when they are touched.
- A service-like helper must be mockable via the Nest testing module; static classes are only for
  deterministic code that needs no mocking.

**Tier 2 — static utility class** (`backend/src/common/thermal/` and similar domain utils): related
pure helpers live on **one utility class with `static` methods**, not a scatter of free functions
across `*.util.ts` files.

```typescript
// ✅ CORRECT — related helpers on one class (see Common, CompoundText, CompoundData, CompoundValueBuilder)
export class CompoundText {
  static normalizeCas(raw: string): string { /* … */ }
  static normalizeFormula(raw: string): string { /* … */ }
  static hillFormula(formula: string): string { /* … */ }
}

CompoundText.normalizeCas('124389');
CompoundData.loadIndex();
CompoundData.toEquationValue(row);

// ❌ WRONG — one tiny free function per file for the same concern
export function normalizeCasText(raw: string): string { /* … */ }
export function normalizeFormulaText(raw: string): string { /* … */ }
```

**Rules:**
- Group by concern (`CompoundText`, `CompoundData`, `CompoundSearch`, `CompoundGasBounds`, `Common`).
- File name is `kebab-case` matching the class (`compound-text.ts` → `CompoundText`). Prefer **no**
  `.util.ts` suffix for these classes (reserve `*.util.ts` for thin single-purpose adapters elsewhere,
  e.g. numeric wrappers under `common/utils/`).
- Data shapes (`type`) stay in `types/` and behavioural contracts (`interface`) in `interfaces/`, as
  separate one-export files; the class imports them.
- Private helpers used only by that class are `private static` on the same class.

#### SRP for Controllers and Services

Controllers are **thin routing layers only**. They:
- Validate and deserialise HTTP input (via DTOs and NestJS pipes).
- Call **one** service method per handler.
- Return the result directly.

Controllers **must not** contain:
- Business logic, formulas, or algorithm decisions.
- Service-to-service orchestration (resolving fluid props, computing Re/Pr, etc.).
- Private helper methods that belong in a service.

Orchestration logic (e.g. resolving Mode B fluid properties, chaining gas-property + transport + dimensionless calls) lives in a dedicated **orchestration service** (e.g. `DimensionlessCalculationService`) that is injected into the controller.

```typescript
// ✅ CORRECT — thin controller, one call per handler
@Post('dimensionless/reynolds')
calcReynolds(@Body() dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
  return this.calc.reynolds(dto);
}

// ❌ WRONG — business logic inside controller
@Post('dimensionless/reynolds')
calcReynolds(@Body() dto: ReynoldsInputDto): ScalarDimensionlessResultDto {
  const mu = this.transport.viscosity(dto.fluid.species, dto.fluid.T_K);
  const rho = ...;                  // ← orchestration belongs in a service
  const L = ...;
  return { value: rho * dto.w * L / mu, ... };
}
```

### 2. Types vs Interfaces
- Use **`export type`** for plain data shapes (equation coefficients, value objects).
- Use **`export interface`** only for behavioural contracts (method signatures, service contracts).
- Never substitute one for the other based on convenience.

```typescript
// ✅ CORRECT — type for data shape
export type DipprN107Equation = { c1: number; c2: number; /* ... */ };

// ✅ CORRECT — interface for behaviour
export interface Equation<T> {
  calculate(x: number, vars: T, min: number, max: number, k?: number): number;
  integral(x: number, vars: T, min: number, max: number, k?: number): number;
}

// ❌ WRONG — interface used as data shape
export interface DipprN107Vars { c1: number; c2: number; }

// ❌ WRONG — type and class in the same file
export type Foo = { a: number };
export class FooMethod { calculate(...) {} }
```

### 3. Literature References via RefKey
Every coefficient set in a compound data file **must** have a `ref` field set to a `RefKey`
enum value pointing to an entry in [`docs/REFERENCES.md`](./REFERENCES.md), plus a `page`
field where applicable. **Never use raw numbers** — the enum keeps references stable and
self-documenting.

```typescript
import { RefKey } from '../../dto/ref-key.dto';

// ✅ CORRECT — RefKey enum value
{ type: EquationTypeDto.dipprN107, ref: RefKey.Perry7, page: 223, k: 1e-3, vars: { ... }, min: 100, max: 2273 }

// ❌ WRONG — raw number
{ type: EquationTypeDto.dipprN107, ref: 4, page: 223, vars: { ... }, min: 100, max: 2273 }

// ❌ WRONG — no reference at all
{ type: EquationTypeDto.dipprN107, vars: { ... }, min: 100, max: 2273 }
```

`RefKey` is defined in `backend/src/common/thermal/enum/ref-key.enum.ts` and its machine-readable metadata
(name, year, url) in `REFERENCES_META` (`backend/src/common/thermal/dto/ref-key.dto.ts`). Both, their Python mirrors and the
`docs/REFERENCES.md` table are generated from `shared/references/references.json` (`make references-generate`).

### 4. Exact Integrals Over Numerical Integration
When a closed-form antiderivative exists, **always use it**.  
Numerical integration (e.g. Gauss–Legendre) is only acceptable when no closed form exists
(e.g. DIPPR-102 with non-integer exponent c2).

Verified antiderivatives for all equation types used in `heatCapacity`, `viscosity`, `thermalConductivity`:

| Type | Closed form? | Verified via |
|------|-------------|--------------|
| `linear` | ✅ | algebra |
| `quadratic` | ✅ | algebra |
| `cubic` | ✅ | algebra |
| `quartic` | ✅ | algebra |
| `maierKelley` | ✅ | algebra |
| `dipprN107` | ✅ | ref WolframAlpha — `c1T + c2c3·coth(c3/T) − c4c5·tanh(c5/T)` |
| `dipprN102` | ❌ | no closed form for arbitrary c2 — use Gauss–Legendre |
| `nasa7` | ✅ (polynomial) | algebra — but lives in `CompoundValue.nasa7`, not in property buckets |
| `nasa9` | ✅ (polynomial + 1/T + ln T) | algebra — but lives in `CompoundValue.nasa9`, not in property buckets |

### 5. Equation Method Classes
Each equation **method** lives in its own file in `utils/` and contains exactly one class
implementing `Equation<T>`.  
The corresponding coefficient **type** lives in its own file in `type/`.  
They are always separate files — never merged.

```
type/dippr-n107-equation.ts        ← export type DipprN107Equation
utils/dippr-equation-107-method.ts ← export class DipprEquation107Method implements Equation<DipprN107Equation>
```

### 6. NASA-7 and NASA-9 are Separate Properties
`nasa7` and `nasa9` coefficients simultaneously cover Cp, H, S and G — they do not belong to any single
property bucket. They are referenced by **top-level keys** (`nasa7Key`, `nasa9Key`) on `CompoundValue`, separate from `heatCapacity`.
**NASA-9 is the modern format and is preferred when available.**

The coefficients live in the NASA databases `shared/processed/NASA/nasa7.json` / `nasa9.json`
(read by `utils/nasa-database.ts`); a compound stores only the exact species keys.

```typescript
// ✅ CORRECT — exact keys into the NASA databases
export const N2: CompoundValue = {
  nasa7Key: 'N2',
  nasa9Key: 'N2',
  heatCapacity: { def: 0, values: [ /* polynomial approximations only */ ] },  // optional — omit when there are none
  ...
};
// NASA-9 / NASA-7 Cp entries are added by heatCapacityEntries(compound); never repeat them in heatCapacity.

// ❌ WRONG — NASA coefficients copied into the compound file
nasa7: { Tswitch: 1000, low: { a1: 3.531, ... }, high: { ... } }

// ❌ WRONG — nasa7/nasa9 inside heatCapacity
heatCapacity: { def: 0, values: [ { type: EquationTypeDto.nasa7, vars: { low: [...], high: [...] } } ] }
```

### 7. Property Resolution via CompoundPropertyResolver
All thermophysical property calculations must go through `CompoundPropertyResolver`.
Never call equation methods directly from business logic.

```typescript
import { CompoundPropertyResolver } from '@/common/thermal/utils';
import { RefKey } from '@/common/thermal/dto';

const resolver = new CompoundPropertyResolver(N2);

// Default (uses nasa9 if present, else nasa7 if present, else def index):
const cp = resolver.heatCapacity(1000);

// Select specific approximation by RefKey:
const cp = resolver.heatCapacity(1000, RefKey.Perry7);

// Select by index:
const cp = resolver.heatCapacity(1000, 0);

// Enthalpy/entropy/Gibbs — NASA-9 (nasa9Key), else NASA-7 (nasa7Key):
const h = resolver.enthalpy(1000);
const s = resolver.entropy(1000);
const g = resolver.gibbsEnergy(1000);
```

### 8. File Naming
Follow [`docs/NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md).  
Equation-related files use the pattern:

```
type/<equation-name>-equation.ts
utils/<equation-name>-equation-method.ts
interfaces/<domain>-<noun>.interface.ts
```

---

## File Length Limits

Long files hide mixed responsibilities. Every file has a maximum length, enforced by an automated test.

| Files | Limit (lines) | Target |
|-------|---------------|--------|
| Backend code — `backend/src/**/*.ts` | **300** | aim for ≤ 200 |
| Backend tests — `backend/test/**/*.ts` | **500** | — |
| Documentation — `docs/**/*.md` | **500** | split by topic, link from an index |

**Exempt — data may be arbitrarily long:** files in `data/` folders, `*.data.ts`, compound data files
(`compound/`), and generated files (`ref-key.enum.ts`, `ref-key.dto.ts`). Constants are **not**
exempt: a large lookup table that is really a dataset belongs in `data/<name>.data.ts`.

Not covered yet: frontend (`frontend/`), Python (`python/`, `scripts/`).

**Rules**
1. Count is physical lines (`wc -l`), including blank lines and comments. Never delete comments or
   blank lines, or join lines, only to fit the limit.
2. When a file nears its limit, **split it by responsibility** (SRP, folder-per-construct rules above) —
   do not add content to an oversized file.
3. **Never raise a limit, add a file to the baseline, or exempt a path to make a change pass.** If you
   believe a limit is wrong, stop and ask the user.
4. **Baseline (grandfathered files).** Files that already exceeded a limit when the rule was introduced
   are listed in `backend/test/unit/conventions/file-length-baseline.json` with their size at that time.
   They **must not grow**. When one shrinks (still over the limit), lower its baseline value; when it
   gets within the limit, remove it from the baseline — the test fails until you do.
5. The baseline must only ever **shrink**. New entries are not allowed.

**Enforcement:** `backend/test/unit/conventions/file-length.spec.ts` (rules in
`constants/file-length-rules.constants.ts`, logic in `utils/file-length-checker.ts`). It runs with the
normal backend tests, inside Docker:

```bash
docker compose exec backend npm run test -- conventions
```

`docs/` is mounted read-only into the dev backend container (`./docs:/docs:ro` in `compose.yml`). In a
container without that mount (e.g. `compose.production.yml`) the docs rule is skipped with a warning.

---

## Definition of Done

A service, module, or utility is **not considered complete** until all three are true:

| Requirement | Where |
|---|---|
| ✅ Implementation exists and compiles | `backend/src/` |
| ✅ Unit tests exist with ≥ 80 % coverage | `backend/test/unit/` — see [`docs/TEST_SPECIFICATION.md`](./TEST_SPECIFICATION.md) |
| ✅ Documentation exists for every public method | `docs/api/` for services; `docs/algorithms/` for algorithms |

### Documentation requirements by artifact

| Artifact | Required doc | Location |
|---|---|---|
| New backend **service** | Entry in the module's API spec doc | `docs/api/<MODULE>_SERVICES.md` or existing `docs/api/<MODULE>_API_SPEC.md` |
| New **algorithm** or formula | Algorithm doc or entry in algorithm index | `docs/algorithms/` |
| New **common library** (utility / compound data) | Reference doc | `docs/services/COMMON_THERMAL_LIBRARY.md` |
| New **DTO or interface** | Entry in interfaces index | `docs/INTERFACES_IMPLEMENTATION_INDEX.md` |

### IMPLEMENTATION_STATUS.md must be updated in the same commit

Whenever a service, test file, or documentation entry is added or changed, update
`docs/migration/IMPLEMENTATION_STATUS.md` in the **same commit**. It must never lag behind
the codebase by more than one commit.

> **Rule:** If `IMPLEMENTATION_STATUS.md` was not updated, the PR is incomplete.

---

## Quick Checklist

Before committing any file, verify:

- [ ] File exports exactly **one** primary construct (SRP)
- [ ] Each construct is in its **own folder with its own suffix** (`types/*.type.ts`, `interfaces/*.interface.ts`, `dto/*.dto.ts`, `enums/*.enum.ts`, `constants/*.constants.ts`, `services/*.service.ts`, …) — see § Construct → folder → file → export
- [ ] No constructs from different folders mixed in one file; no helper functions beside a class/service
- [ ] Form matches need: DI/orchestration → `@Injectable` service; stateless related helpers → static class; single pure formula → one function per file (see § Choosing the form)
- [ ] No injected service passed as a function argument; no new `*.helper.ts`; no families of exported free functions
- [ ] Controller handler contains **no** business logic — delegates to a service
- [ ] Coefficient shape uses `type`, behavioural contract uses `interface`
- [ ] Every `EquationValue` has `ref: RefKey.Xxx` (not a raw number) pointing to `docs/REFERENCES.md`
- [ ] **Python:** every module/class/function using literature data has a `Refs:` docstring citation using `[N] KeyName` format
- [ ] **Python:** `from references import RefKey` used for any runtime reference lookup — never raw integers
- [ ] New reference sources added to `shared/references/references.json` and `make references-generate` run before use (`make references-check` passes)
- [ ] NASA data is referenced by `CompoundValue.nasa7Key`/`nasa9Key` (exact keys in `shared/processed/NASA/*.json`) — coefficients are **not** copied into the compound or into `heatCapacity.values`
- [ ] Closed-form integral used where it exists — no unnecessary numerical integration
- [ ] Property calculations go through `CompoundPropertyResolver`, not direct equation method calls
- [ ] File name is `kebab-case`, class name is `PascalCase`
- [ ] File length within limits: code ≤ 300 lines, tests ≤ 500, docs ≤ 500 (data files exempt); baseline files did not grow — see § File Length Limits
- [ ] No hardcoded magic numbers without a named constant or reference
- [ ] Imports are relative — the `@/` alias is **not configured** (examples in this doc that show `@/…` are illustrative only)
- [ ] Tests are run **inside Docker**, not on the host machine (see § Tests section below)
- [ ] **Definition of Done:** implementation + tests + docs all updated in the same PR
- [ ] **`docs/migration/IMPLEMENTATION_STATUS.md`** updated in this commit if any service, test, or doc changed

---

## Tests Must Run Inside Docker

All automated tests (unit, integration, e2e) **must be executed inside the Docker container**,
never directly on the host OS.

**Rationale:** The Node.js runtime, Python interpreter, native extensions, and environment
variables inside the container may differ from the host. Running tests on the host may produce
false positives or mask container-specific failures.

### Running tests

```bash
# Run all backend unit tests inside the backend container:
docker compose exec backend npm run test

# Watch mode:
docker compose exec backend npm run test:watch

# Coverage report (output saved to tmp/reports/tests/):
docker compose exec backend npm run test:cov

# e2e tests:
docker compose exec backend npm run test:e2e
```

For the production stack use `compose.production.yml`:

```bash
docker compose -f compose.production.yml exec backend npm run test
```

### CI/CD

The CI pipeline runs `docker compose run --rm backend npm run test:cov`.
**Never configure CI to install Node on the runner and run `npm test` directly.**

