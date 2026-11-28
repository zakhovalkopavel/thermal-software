# Plan: Close remaining legacy gaps (Roadmap phase 3)

Status: ✅ done (recuperator λ(T)) · Part of [`PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) ·
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

## 3. Recuperator λ(T) — done

| Step | Change | Status |
|---|---|---|
| R1 | Optional `wallMaterial` **or** scalar `refractoryLambda_WmK` / `refractoryEmissivity` | ✅ |
| R2 | Balance evaluates λ and ε at local wall T via `MultilayerWallService` | ✅ |
| R3 | Result returns `wallMaterial` + `wallPropertyProfile[]` | ✅ |
| R4 | Frontend keeps the material link; plots λ(T)/ε(T) for the run range | ✅ |

Picker order for wall materials: **Insulation → refractory families → metals / other**.

## 4. Out of scope here

Database migrations, source-extractor, quench engine, heat-treatment digitisation, plan-to-3D, furnaces as a system.
