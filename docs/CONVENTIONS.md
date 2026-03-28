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
| **Numerical Methods** | [`docs/NUMERICAL_METHODS_CONVENTION.md`](./NUMERICAL_METHODS_CONVENTION.md) | Use approved wrappers (brentq, nelderMead, etc.) — never call numerical libs directly |
| **Environment / Secrets** | [`docs/ENV_ONLY_POLICY.md`](./ENV_ONLY_POLICY.md) | All secrets via `.env`; never commit credentials |
| **Production Secrets** | [`docs/PRODUCTION_SECRETS.md`](./PRODUCTION_SECRETS.md) | Secret generation and rotation procedure |
| **Literature References** | [`docs/REFERENCES.md`](./REFERENCES.md) | Every `ref:` field uses a `RefKey` enum value from `dto/ref-key.dto.ts` pointing to an entry in this list |
| **Interfaces & Index** | [`docs/INTERFACES_IMPLEMENTATION_INDEX.md`](./INTERFACES_IMPLEMENTATION_INDEX.md) | Master index of all interfaces and their implementations |
| **Test Specification** | [`docs/TEST_SPECIFICATION.md`](./TEST_SPECIFICATION.md) | Unit / integration / e2e test requirements |
| **Service Test Spec** | [`docs/SERVICE_TEST_SPEC.md`](./SERVICE_TEST_SPEC.md) | Per-service test checklist and coverage targets |
| **Reports Management** | [`docs/REPORTS_MANAGEMENT.md`](./REPORTS_MANAGEMENT.md) | All generated reports go to `tmp/reports/` |
| **Docker / Nginx** | [`docs/NGINX_ARCHITECTURE.md`](./NGINX_ARCHITECTURE.md) | Reverse-proxy layout, SSL termination, upstream routing |
| **Python Container** | [`docs/PYTHON_CONTAINER.md`](./PYTHON_CONTAINER.md) | Python service conventions, package management |
| **Docker Registry** | [`docs/DOCKER_REGISTRY.md`](./DOCKER_REGISTRY.md) | Image naming, tagging, push/pull workflow |

---

## Core Principles (summary)

### 1. Single Responsibility Principle (SRP)
Each file exports **exactly one primary construct**:

| File suffix | Exports |
|-------------|---------|
| `*.type.ts` / type files in `type/` | One `export type` |
| `*.interface.ts` | One `export interface` |
| `*.class.ts` / method files in `utils/` | One `export class` |
| `*.dto.ts` | One `export class` (DTO) or one `export enum` |
| compound data files (`gas/*.ts`, etc.) | One `export const` (compound object) |

> **Do not mix** interfaces, types, and classes in a single file.  
> A type file must not contain a class. A class file must not contain a type alias.

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
export type AlyLeeEquation = { c1: number; c2: number; /* ... */ };

// ✅ CORRECT — interface for behaviour
export interface Equation<T> {
  calculate(x: number, vars: T, min: number, max: number, k?: number): number;
  integral(x: number, vars: T, min: number, max: number, k?: number): number;
}

// ❌ WRONG — interface used as data shape
export interface AlyLeeVars { c1: number; c2: number; }

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
{ type: EquationTypeDto.alyLee, ref: RefKey.Perry7, page: 223, k: 1e-3, vars: { ... }, min: 100, max: 2273 }

// ❌ WRONG — raw number
{ type: EquationTypeDto.alyLee, ref: 4, page: 223, vars: { ... }, min: 100, max: 2273 }

// ❌ WRONG — no reference at all
{ type: EquationTypeDto.alyLee, vars: { ... }, min: 100, max: 2273 }
```

`RefKey` is defined in `backend/src/common/thermal/dto/ref-key.dto.ts`.
Machine-readable metadata (name, year, url) is in `REFERENCES_META` in the same file.

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
| `linearHyperbolic` | ✅ | algebra |
| `linearHyperbolicLogarithmic` | ✅ | ref WolframAlpha |
| `alyLee` (DIPPR-107) | ✅ | ref WolframAlpha — `c1T + c2c3·coth(c3/T) − c4c5·tanh(c5/T)` |
| `dipprN102` | ❌ | no closed form for arbitrary c2 — use Gauss–Legendre |
| `nasa7` | ✅ (polynomial) | algebra — but lives in `CompoundValue.nasa7`, not in property buckets |

### 5. Equation Method Classes
Each equation **method** lives in its own file in `utils/` and contains exactly one class
implementing `Equation<T>`.  
The corresponding coefficient **type** lives in its own file in `type/`.  
They are always separate files — never merged.

```
type/aly-lee-equation.ts        ← export type AlyLeeEquation
utils/aly-lee-equation-method.ts ← export class AlyLeeEquationMethod implements Equation<AlyLeeEquation>
```

### 6. NASA-7 is a Separate Property
`nasa7` coefficients simultaneously cover Cp, H, S and G — they do not belong to any single
property bucket. They are stored as a **top-level `nasa7?` field** on `CompoundValue`,
separate from `heatCapacity`.

```typescript
// ✅ CORRECT — nasa7 at top level, named coefficients
export const N2: CompoundValue = {
  nasa7: {
    Tswitch: 1000,
    low:  { a1: 3.531, a2: -1.237e-4, ..., a6: -1047, a7: 2.967 },
    high: { a1: 2.953, a2:  1.397e-3, ..., a6:  -924, a7: 5.872 },
  },
  heatCapacity: { def: 0, values: [ /* polynomial approximations only */ ] },
  ...
};

// ❌ WRONG — nasa7 inside heatCapacity
heatCapacity: { def: 0, values: [ { type: EquationTypeDto.nasa7, vars: { low: [...], high: [...] } } ] }

// ❌ WRONG — tuple arrays instead of named coefficients
low: [3.531, -1.237e-4, ...]   // use { a1: 3.531, a2: -1.237e-4, ... }
```

### 7. Property Resolution via CompoundPropertyResolver
All thermophysical property calculations must go through `CompoundPropertyResolver`.
Never call equation methods directly from business logic.

```typescript
import { CompoundPropertyResolver } from '@/common/thermal/utils';
import { RefKey } from '@/common/thermal/dto';

const resolver = new CompoundPropertyResolver(N2);

// Default (uses nasa7 if present, else def index):
const cp = resolver.heatCapacity(1000);

// Select specific approximation by RefKey:
const cp = resolver.heatCapacity(1000, RefKey.Perry7);

// Select by index:
const cp = resolver.heatCapacity(1000, 0);

// Enthalpy/entropy/Gibbs — always from nasa7:
const h = resolver.enthalpy(1000);
const s = resolver.entropy(1000);
const g = resolver.gibbsEnergy(1000);
```

### 6. File Naming
Follow [`docs/NAMING_CONVENTIONS.md`](./NAMING_CONVENTIONS.md).  
Equation-related files use the pattern:

```
type/<equation-name>-equation.ts
utils/<equation-name>-equation-method.ts
interfaces/<domain>-<noun>.interface.ts
```

---

## Quick Checklist

Before committing any file, verify:

- [ ] File exports exactly **one** primary construct (SRP)
- [ ] Controller handler contains **no** business logic — delegates to a service
- [ ] Coefficient shape uses `type`, behavioural contract uses `interface`
- [ ] Every `EquationValue` has `ref: RefKey.Xxx` (not a raw number) pointing to `docs/REFERENCES.md`
- [ ] New reference sources added to `docs/REFERENCES.md` **and** `dto/ref-key.dto.ts` before use
- [ ] `nasa7` data is at top-level `CompoundValue.nasa7`, **not** inside `heatCapacity.values`
- [ ] `nasa7` coefficients use named fields `{a1, a2, …, a7}`, **not** tuple arrays
- [ ] Closed-form integral used where it exists — no unnecessary numerical integration
- [ ] Property calculations go through `CompoundPropertyResolver`, not direct equation method calls
- [ ] File name is `kebab-case`, class name is `PascalCase`
- [ ] No hardcoded magic numbers without a named constant or reference
- [ ] Tests are run **inside Docker**, not on the host machine (see § Tests section below)

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

