# Thermal Software v2.0

Enterprise-grade thermal engineering software — NestJS backend, React frontend, Python tools.

---

## 🏗️ Architecture

```
thermal-software/
├── backend/        ← NestJS API  (refractory + thermodynamics modules)
├── frontend/       ← React SPA   (skeleton — in progress)
├── python/         ← Python tools (NASA thermo parser + OCR pipeline)
├── shared/         ← Shared types / constants
├── docs/           ← All documentation
└── legacy/         ← 📦 Archival reference ONLY — NOT a running service
```

### Docker Services (`compose.yml`) — 6 containers

| Service    | Role                       | Access                              |
|------------|----------------------------|-------------------------------------|
| `nginx`    | Reverse proxy              | `http://localhost`                  |
| `backend`  | NestJS REST API            | `http://localhost/api/v1`           |
| `frontend` | React SPA ⚠️ WIP           | `http://localhost`                  |
| `python`   | NASA thermo + OCR tools    | `docker compose exec python bash`   |
| `postgres` | Database                   | internal (`localhost:${DB_PORT}`)   |
| `redis`    | Cache                      | internal (`localhost:${REDIS_PORT}`)|

> ⚠️ `legacy/` is an **archival read-only reference**. It has **no Docker service** and is not part of the running system.

---

## 🚀 Quick Start

### First time

```bash
# 1. Create your .env
make setup

# 2. Generate secure secrets (JWT + DB password)
make setup-secrets

# 3. Start all 6 services
make up

# 4. Verify
docker compose ps
```

### Every other time

```bash
make up
```

### Access points

| URL                              | What                          |
|----------------------------------|-------------------------------|
| `http://localhost`               | Frontend ⚠️ skeleton WIP      |
| `http://localhost/api/v1`        | Backend REST API              |
| `http://localhost/api/docs`      | Swagger / OpenAPI UI          |
| `http://localhost/api/v1/health` | Health check                  |

---

## 📊 Current Status — May 2026

| Component                    | Status                  | Detail                                              |
|------------------------------|-------------------------|-----------------------------------------------------|
| **Backend — Refractory**     | 🚧 In Progress          | 11 services scaffolded (blend-optimizer, glass-viscosity, mineral-phase, packing, participation, phase-equilibrium, psd-calculator, refractoriness, shrinkage, thermal-performance, water-demand) |
| **Backend — Thermodynamics** | 🚧 In Progress          | 8 services scaffolded (aerodynamics, diffusion, dimensionless-calculation, dimensionless-numbers, fluid-property, gas-properties, radiation, transport) |
| **Frontend**                 | 🚧 Skeleton only        | React 19 + Vite 7 + MUI 7 — no pages yet           |
| **Python tools**             | ✅ Active               | NASA-7/9 coefficient parser + OCR extraction pipeline |
| **Database (postgres/redis)**| ✅ Ready                | Health-checked, persistent volumes                  |
| **Docker / nginx infra**     | ✅ Complete             | Hot reload, volume mounts, reverse proxy            |
| **Legacy system**            | 📦 Archival only        | On disk — no Docker service, not running            |

**→ Full implementation roadmap:** [`docs/migration/ROADMAP.md`](docs/migration/ROADMAP.md)  
**→ Detailed progress:** [`docs/migration/IMPLEMENTATION_STATUS.md`](docs/migration/IMPLEMENTATION_STATUS.md)

---

## 📚 Documentation & Standards

### Getting Started
- 🚀 **[QUICKSTART.md](QUICKSTART.md)** — Day-to-day dev cheatsheet (commands, logs, tests, shell)
- ⚙️ **[SETUP.md](SETUP.md)** — First-time environment setup

### Code Standards (read before writing any code)
- ⭐ **[docs/NAMING_CONVENTIONS.md](docs/NAMING_CONVENTIONS.md)** — File, class, variable, constant naming
- ⭐ **[docs/CONVENTIONS.md](docs/CONVENTIONS.md)** — Mandatory context linking all standards
- 📐 **[docs/CODE_QUALITY_STANDARDS.md](docs/CODE_QUALITY_STANDARDS.md)** — SRP, DTOs, no hardcoded values
- 🔢 **[docs/NUMERICAL_METHODS_CONVENTION.md](docs/NUMERICAL_METHODS_CONVENTION.md)** — Approved numerical wrappers

### Architecture & Interfaces
- 🏗️ **[docs/INTERFACES_IMPLEMENTATION_INDEX.md](docs/INTERFACES_IMPLEMENTATION_INDEX.md)** — All 97+ TypeScript interfaces
- 🔌 **[backend/src/modules/refractory/interfaces/README.md](backend/src/modules/refractory/interfaces/README.md)** — Refractory interface quick reference

### Algorithms & Calculations
- 📐 **[docs/algorithms/README.md](docs/algorithms/README.md)** — Index of all 15 documented algorithms
  - Blend Optimizer, PSD Calculation, Packing Models, Shrinkage Prediction
  - Phase Equilibrium, Thermal Performance, Refractoriness
  - Viscosity, Glass Viscosity, Mineral Phase Identification, Component Effects

### Configuration & Security
- 🔐 **[docs/ENV_ONLY_POLICY.md](docs/ENV_ONLY_POLICY.md)** — All config via environment variables only
- 🔒 **[docs/PRODUCTION_SECRETS.md](docs/PRODUCTION_SECRETS.md)** — Secret management rules
- 📊 **[docs/REPORTS_MANAGEMENT.md](docs/REPORTS_MANAGEMENT.md)** — Reports must go to `tmp/reports/`
- 🐳 **[docs/NGINX_ARCHITECTURE.md](docs/NGINX_ARCHITECTURE.md)** — Nginx reverse proxy setup

### Implementation & Migration
- 🗺️ **[docs/migration/ROADMAP.md](docs/migration/ROADMAP.md)** ⭐ — Current implementation roadmap
- 📋 **[docs/migration/IMPLEMENTATION_STATUS.md](docs/migration/IMPLEMENTATION_STATUS.md)** — Progress tracker
- 📦 **[docs/migration/NESTJS_MIGRATION_SPEC.md](docs/migration/NESTJS_MIGRATION_SPEC.md)** — Full migration spec
- 🏗️ **[docs/migration/MODULE_ARCHITECTURE.md](docs/migration/MODULE_ARCHITECTURE.md)** — Module boundaries
- 📖 **[docs/migration/](docs/migration/)** — All step specs and checklists

---

## 📋 Project Rules

### 1. Docker-Only — No Node.js on the host

```bash
# ❌ NEVER run directly on host
npm install
npx @nestjs/cli new backend
npm run start:dev

# ✅ ALWAYS run inside containers
docker compose exec backend npm install package-name
docker compose exec backend npm run test
docker compose exec frontend npm install package-name
docker compose exec python bash
```

### 2. Reports location

All reports, logs, and generated output → **`tmp/reports/`** (gitignored)

```bash
# ✅ Correct
echo "Results" > tmp/reports/calculations/calc-$(date +%Y%m%d).log

# ❌ Wrong
echo "Results" > report.log  # never in root or source directories
```

### 3. Secrets protection

- ❌ Never commit: `.env`, `*.key`, `*.pem`, `*.crt`, any certificates
- ✅ Commit only: `.env.example`, `.env.production` (templates without real secrets)
- ✅ Use `make setup-secrets` to generate secrets via Docker (no local OpenSSL needed)

### 4. Naming conventions (mandatory)

Every file, class, variable, and constant must follow **[docs/NAMING_CONVENTIONS.md](docs/NAMING_CONVENTIONS.md)**:

| Target      | Convention          | Example                    |
|-------------|---------------------|----------------------------|
| Files       | `kebab-case`        | `psd-calculator.service.ts`|
| Classes     | `PascalCase`        | `PsdCalculatorService`     |
| Variables   | `camelCase`         | `volumeFractions`          |
| Constants   | `UPPER_SNAKE_CASE`  | `CPM_BETA0`                |

---

## 🔧 Common Commands

```bash
# ── Setup ────────────────────────────────────────────────
make setup              # Create .env from .env.example
make setup-secrets      # Generate JWT secrets + DB password

# ── Services ─────────────────────────────────────────────
make up                 # Start all 6 services
make down               # Stop all services
make restart            # Stop then start

# ── Logs ─────────────────────────────────────────────────
make logs               # All services (follow)
make logs-backend       # Backend only
make logs-frontend      # Frontend only
make logs-python        # Python only

# ── Shell access ─────────────────────────────────────────
make backend-shell      # sh into backend container
make frontend-shell     # sh into frontend container
make python-shell       # bash into python container
make postgres-shell     # psql into postgres
make redis-shell        # redis-cli into redis

# ── Tests ────────────────────────────────────────────────
make test-backend       # Run backend Jest tests
make test-frontend      # Run frontend tests

# ── Direct docker compose ────────────────────────────────
docker compose ps                       # Check container statuses
docker compose logs -f backend          # Stream backend logs
docker compose exec backend npm test    # Run backend tests directly
docker compose restart backend          # Restart one service
docker compose build                    # Rebuild images
docker compose down -v                  # Stop + remove volumes (fresh start)
```

---

## 🔩 Backend Modules

### Module 1 — Refractory (`/api/v1/refractory`)

Provides oxide-composition calculations for refractory materials.  
Full spec: [`docs/api/REFRACTORY_API_SPEC.md`](docs/api/REFRACTORY_API_SPEC.md)

| Endpoint | Service | Description |
|----------|---------|-------------|
| `POST /phase-equilibrium` | `PhaseEquilibriumService` | Liquid/solid phase distribution at temperature |
| `POST /mineral-phases` | `MineralPhaseService` | Identify mineral phases from oxide composition |
| `POST /blend-optimization` | `BlendOptimizerService` | Optimize particle blend for target PSD |
| `POST /psd/andreasen` | `PSDCalculatorService` | Andreasen discrete PSD calculation |
| `POST /psd/funk-dinger` | `PSDCalculatorService` | Funk-Dinger discrete PSD calculation |
| `POST /packing/cpm` | `PackingService` | Compressible Packing Model density |
| `POST /packing/furnas` | `PackingService` | Furnas packing model density |
| `POST /participation` | `ParticipationService` | Particle reaction participation factors |
| `POST /water-demand` | `WaterDemandService` | Water demand from packing fraction |
| `POST /water-demand/range` | `WaterDemandService` | Water demand min/typical/max range |
| `POST /shrinkage` | `ShrinkageService` | Drying + firing shrinkage over temperature profile |
| `POST /thermal-conductivity` | `ThermalPerformanceService` | Effective thermal conductivity with porosity |
| `POST /refractoriness` | `RefractorinessService` | PCE / RUL temperature from composition |
| `POST /glass-viscosity` | `GlassViscosityService` | Glass viscosity + VFT curve + fixed points |

All endpoints: `POST` → `200 OK` on success, `400 Bad Request` on invalid input.

---

### Module 2 — Thermodynamics (`/api/v1/thermodynamics`, `/api/v1/numeric`)

Provides thermophysical property calculations and numerical mathematics utilities.  
Full spec: [`docs/api/THERMODYNAMICS_API_SPEC.md`](docs/api/THERMODYNAMICS_API_SPEC.md)

#### Fluid / Gas Properties (`thermodynamics-fluid.controller.ts`)

| Endpoint | Service | Description |
|----------|---------|-------------|
| `POST /thermodynamics/properties` | `FluidPropertyService` | Viscosity, conductivity, Cp, density at T, P |
| `POST /thermodynamics/gas-properties` | `GasPropertiesService` | Gas mixture properties (NASA-7 coefficients) |
| `GET /thermodynamics/geometry/list` | `FluidPropertyService` | Available geometry keys + required dimension fields |
| `GET /thermodynamics/correlations` | `FluidPropertyService` | Available correlations with validity ranges |

All fluid endpoints share a **unified flat fluid interface**:

| Field | Type | Notes |
|-------|------|-------|
| `fluid` | `KnownFluid` | Named species — see `types/known-fluid.type.ts` |
| `composition` | `Record<Species, mole_fraction>` | Required when `fluid = "gas_mix"` |
| `T_fluid_K` | `number` | Bulk temperature [K] — always explicit |
| `P_Pa` | `number` | Absolute pressure [Pa] — default `101 325` |

#### Dimensionless Numbers + HTC (`thermodynamics.controller.ts`)

| Endpoint | Service | Description |
|----------|---------|-------------|
| `POST /thermodynamics/dimensionless/nusselt` | `DimensionlessCalculationService` | Nusselt number (forced + natural convection) |
| `POST /thermodynamics/dimensionless/htc` | `DimensionlessCalculationService` | Heat transfer coefficient (Nu computed internally) |
| `POST /thermodynamics/dimensionless/reynolds` | `DimensionlessNumbersService` | Reynolds number |
| `POST /thermodynamics/dimensionless/prandtl` | `DimensionlessNumbersService` | Prandtl number (fluid-only, no geometry) |
| `POST /thermodynamics/dimensionless/grashof` | `DimensionlessNumbersService` | Grashof number |
| `POST /thermodynamics/dimensionless/rayleigh` | `DimensionlessNumbersService` | Rayleigh number |
| `POST /thermodynamics/radiation` | `RadiationService` | Radiation heat flux, view factors |
| `POST /thermodynamics/aerodynamics` | `AerodynamicsService` | Drag coefficients, terminal velocity |
| `POST /thermodynamics/diffusion` | `DiffusionService` | Mass diffusion coefficients |
| `POST /thermodynamics/transport` | `TransportService` | Combined transport properties |

#### Numeric Methods (`numeric.controller.ts` → `/api/v1/numeric`)

| Endpoint | Description |
|----------|-------------|
| `POST /numeric/brentq` | Brent root-finding method |
| `POST /numeric/nelder-mead` | Nelder-Mead optimiser (named-variable API) |
| `POST /numeric/regression/linear` | Linear regression |
| `POST /numeric/regression/polynomial` | Polynomial regression (ascending coefficients) |
| `POST /numeric/regression/exponential` | Exponential regression |
| `POST /numeric/regression/power` | Power-law regression |
| `POST /numeric/regression/levenberg-marquardt` | Non-linear least-squares fitting |

All numeric endpoints are stateless pure-math wrappers. Response shapes defined in [`docs/api/THERMODYNAMICS_API_SPEC.md §8`](docs/api/THERMODYNAMICS_API_SPEC.md).

---

## 🧪 Testing

### Requirements

| Code type | Minimum coverage | Target coverage |
|-----------|-----------------|-----------------|
| Services | 80% | 90% |
| Utilities | 80% | 90% |
| Controllers | 70% | 80% |
| DTOs (validation) | 100% | 100% |
| **Overall** | **75%** | **85%** |

### Test layout

```
backend/test/
├── unit/
│   └── modules/
│       ├── refractory/services/      ← one *.spec.ts per service
│       └── thermodynamics/services/  ← one *.spec.ts per service
└── e2e/
    └── *.e2e-spec.ts
```

Tests live in `backend/test/` (not next to source files) — CI is configured to use this root.

### Running tests

```bash
# Recommended — always inside Docker
make test-backend               # Run all backend tests
make test-frontend              # Run all frontend tests

# Direct
docker compose exec backend npm test
docker compose exec backend npm run test:watch
docker compose exec backend npm run test:cov   # + coverage report

# Specific file
docker compose exec backend npm run test -- psd-calculator.service.spec

# E2E
docker compose exec backend npm run test:e2e

# Save coverage report
docker compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt
```

### TDD workflow (mandatory)

```
1. Write test spec (what you will test) before writing code
2. Write failing tests
3. Implement code until tests pass
4. Verify coverage meets minimums
5. Code review → merge
```

### Test documentation

| Document | Purpose |
|----------|---------|
| [`docs/TEST_SPECIFICATION.md`](docs/TEST_SPECIFICATION.md) | Full coverage requirements, test types, templates |
| [`docs/SERVICE_TEST_SPEC.md`](docs/SERVICE_TEST_SPEC.md) | Per-service checklist — every public method |
| [`docs/SERVICE_TEST_CHECKLIST.md`](docs/SERVICE_TEST_CHECKLIST.md) | Status tracker for refractory module tests |

---

## 🐍 Python Tools

The `python/` service provides two standalone tools:

| Tool | Package | Purpose |
|------|---------|---------|
| NASA Thermo Parser | `python/src/nasa_thermo/` | Parse NASA-7 and NASA-9 thermodynamic coefficient files |
| OCR Pipeline | `python/src/ocr/` | Extract data from PDF/image technical documents (GUI included) |

```bash
# Access the python container
make python-shell

# Run NASA thermo parser
python src/nasa_thermo/...

# Run OCR tool
python src/ocr/...
```

Reports and outputs → `tmp/reports/python/`

---

**Maintainer:** Thermal Software Team  
**Last Updated:** May 2026
