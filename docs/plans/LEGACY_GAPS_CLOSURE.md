# Plan: Close remaining legacy gaps (Roadmap phase 3)

Status: 🔵 planned · Part of [`PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) ·
Background analysis (not tracked): `tmp/reports/migrations/legacy-gaps-20261124.md`

## 1. Goal

Keep only what still blocks product quality for heat treatment and recuperators. Everything else from the
legacy gap register is **skipped for now** (already covered by compound data / Materials UI, or not needed).

## 2. Decisions (skip list)

| Former gap | Decision | Why |
|---|---|---|
| Salt / oxide thermophysical CSV product | **Skip** | Covered by compound data; no separate thermophysical library |
| Mix library persistence + material write CRUD | **Skip for now** | Materials already has a session mix workspace (composition, packing, thermal). The unused `MixPreset` entity and the legacy save/load library are not needed until someone asks for durable presets |
| Refractory façade, strain RUL, participation oxides, PSD helpers, glass RUL | **Skip for now** | Not on the heat-treatment path |
| Coupled recuperator ↔ furnace ↔ generator page | **Skip for now** | Later with furnaces (roadmap phase 8), if still wanted |
| Liquid water / solid carbon registries; unused equation method | **Skip for now** | Not blocking |
| Quenchant tables / hardening calculator as a legacy port | **Not in this plan** | Quench product is [`QUENCH_ENGINE.md`](QUENCH_ENGINE.md); data is [`HEAT_TREATMENT_DATA.md`](HEAT_TREATMENT_DATA.md) (local quench source pool + digitisation) |

## 3. Remaining work: recuperator λ(T)

### 3.1 What we already have

- **Data.** Metals: `thermalConductivity` vs temperature (table / spline / optional carbon-steel model). Refractories and insulation: polynomial `λ(T)` and `ε(T)` in `refractory-thermal.data` (same family as the old recuperator helpers).
- **Lookup UI.** Recuperator (and other processes) can pick a metal or refractory and read `λ` and `ε` at one temperature via `MaterialPropertyLookup`.
- **Calculation.** Recuperator input is a **scalar** `refractoryLambda_WmK`. The balance uses that constant for the whole apparatus.

### 3.2 What is missing (logic, not data)

1. The chosen material’s `λ(T)` is sampled once and pasted as a number; the run no longer knows which material or which `λ(T)` curve was used.
2. Along the smoke/air temperature field the wall conductivity does not follow `λ(T)`.
3. Result plots show counter-flow temperatures and energy balance, but **not** the `λ(T)` (or `ε(T)`) of the wall material that entered the run.

### 3.3 Proposed revision

| Step | Change | Acceptance |
|---|---|---|
| R1 | Allow the recuperator request to carry a material id (metal or refractory) **or** the current scalar fallback | DTO and API docs updated; old clients with only `refractoryLambda_WmK` still work |
| R2 | Inside the balance, evaluate `λ` (and `ε` if used) at the local wall temperature from the material curve; keep the scalar path when no material is given | unit test: result changes when `λ(T)` slope is non-zero vs a fixed mid-range scalar |
| R3 | Return the `λ(T)` (and optionally `ε(T)`) series used for the run | response field present and documented |
| R4 | Frontend: after a material is chosen, keep the link (not only the pasted number); plot `λ(T)` for the temperature range of the run | plot visible next to the existing recuperator charts |

Conventions: one construct per file, thin controller, `RefKey` on coefficients, tests in Docker, update
`docs/migration/IMPLEMENTATION_STATUS.md` and the recuperator API/docs in the same change.

## 4. Out of scope here

Database migrations, source-extractor, quench engine, heat-treatment digitisation, plan-to-3D, furnaces as a system.
