# Chapter 14: Implementation State

**Part V: Reference**

---

## Overview

This chapter documents the current implementation state of every component described in this spec, mapping each conceptual piece to the actual source file and noting what is complete, partial, or pending.

Last updated: 2026-03-07

---

## Directory Layout

```
backend/src/modules/refractory/
├── constants/
│   └── viscosity-parameters.ts          ← Lakatos, Fluegel, Hetherington constants
├── enums/
│   └── viscosity-model.enum.ts          ← ViscosityModel, ViscosityModelType,
│                                            ConfidenceLevel, ExtrapolationRisk
├── interfaces/
│   ├── viscosity-parameters.interface.ts ← VtfPoint, VtfParameters, LakatosIsokoms,
│   │                                        FluegelIsokoms, SlagViscosityResult,
│   │                                        ModelSelectionResult
│   └── glass-viscosity.interface.ts     ← GlassViscosityResult, FixedPoints,
│                                            ValidationStatus, ModelInfo, etc.
├── utils/
│   ├── glass-composition.util.ts        ← wtPctToMolPct, molPctToWtPct,
│   │                                        normalizeComposition
│   ├── glass-viscosity-vtf.util.ts      ← predictIsokomsLakatos, predictIsokomsFluegel,
│   │                                        buildVtf, fitVtfThreePoints, evalVtf,
│   │                                        temperatureAtLogViscosity,
│   │                                        calculateFixedPointsFromVtf,
│   │                                        checkLakatosValidity
│   └── glass-viscosity-arrhenius.util.ts ← calcHetheringtonLogEta,
│                                            hetheringtonTemperatureAtLogEta,
│                                            buildHetheringtonResult
├── services/
│   └── glass-viscosity.service.ts       ← GlassViscosityService (NestJS @Injectable)
│                                            selectModel, resolveModel,
│                                            calculateViscosity,
│                                            calculateViscosityProfile,
│                                            getTemperatureAtViscosity,
│                                            convertComposition
├── controllers/
│   └── refractory.controller.ts         ← REST endpoints (see below)
├── dto/
│   └── glass-viscosity.dto.ts           ← GlassViscosityDto, GlassViscosityProfileDto,
│                                            GlassTemperatureAtViscosityDto,
│                                            GlassCompositionConvertDto
└── data/
    └── glass-viscosity-validation.data.ts ← LAKATOS_VALIDATION_GLASSES,
                                              FLUEGEL_VALIDATION_GLASSES,
                                              HETHERINGTON_VALIDATION_GLASSES
```

---

## Constants (`viscosity-parameters.ts`)

| Constant | Status | Notes |
|----------|--------|-------|
| `LAKATOS_1976_COEFFICIENTS` | ✅ Complete | Sourced from `shared/sources/lakatos_ocr/page_001_table_007.csv` |
| `FLUEGEL_2007_T1_5` | ✅ Complete | Sourced from `shared/sources/fluegel_2007/Fluegel_table4.csv` |
| `FLUEGEL_2007_T6_6` | ✅ Complete | Sourced from `shared/sources/fluegel_2007/Fluegel_table5.csv` |
| `FLUEGEL_2007_T12` | ✅ Complete | Sourced from `shared/sources/fluegel_2007/Fluegel_table6.csv` |
| `FLUEGEL_2007_BOUNDS` | ✅ Complete | Sourced from `shared/sources/fluegel_2007/Fluegel_table3.csv` (three-level bounds per viscosity) |
| `HETHERINGTON_1964` | ✅ Complete | A = −3.905, B = 31 400 K |
| `MOLAR_MASSES` | ✅ Complete | Expanded: includes ~35 oxides and elemental entries used by Fluegel (Ag2O, As2O3, etc.) |
| `IIDA_COMPONENTS` | ❌ Pending | Ch. 13 — awaiting implementation |
| `NAKAMOTO_2007_COEFFICIENTS` | ❌ Pending | Ch. 13 — awaiting implementation |
| `MILLS_LIQUIDUS_COEFFICIENTS` | ❌ Pending | Ch. 13 — awaiting implementation |

---

## Enums (`viscosity-model.enum.ts`)

| Enum value | Status | Notes |
|------------|--------|-------|
| `LAKATOS_1976` | ✅ Active | VTF model for soda-lime-silica |
| `FLUEGEL_2007` | ✅ Active | VFT model for broad silicate space |
| `HETHERINGTON_1964` | ✅ Active | Arrhenius for pure fused silica |
| `IIDA` | ✅ Active | Industrial mixed-slag model (Iida & Guthrie 1988) — used for CaO–SiO₂–Al₂O₃ slags up to CaF₂ ≈ 8 mol% |
| `NAKAMOTO_2007` | ✅ Active | Fluoride-bearing slag model (Nakamoto 2007) — preferred for high-CaF₂ slags; CaF₂ ≥ 5 mol% recommended |
| `NOT_SUPPORTED` | ✅ Active | Returned when no model matches |

---

## Utils

### `glass-composition.util.ts`

| Function | Status | Spec Chapter |
|----------|--------|--------------|
| `normalizeComposition` | ✅ Complete | Ch. 6 |
| `wtPctToMolPct` | ✅ Complete | Ch. 6 |
| `molPctToWtPct` | ✅ Complete | Ch. 6 |

### `glass-viscosity-vtf.util.ts`

| Function | Status | Spec Chapter |
|----------|--------|--------------|
| `checkLakatosValidity` | ✅ Complete | Ch. 3, 4 |
| `predictIsokomsLakatos` | ✅ Complete | Ch. 4 |
| `predictIsokomsFluegel` | ✅ Complete | Ch. 5 |
| `buildVtf` | ✅ Complete | Ch. 7 — fits VTF from isokom output |
| `fitVtfThreePoints` | ✅ Complete | Ch. 7 — analytical 3-point solve |
| `evalVtf` | ✅ Complete | Ch. 7 |
| `temperatureAtLogViscosity` | ✅ Complete | Ch. 7 |
| `calculateFixedPointsFromVtf` | ✅ Complete | Ch. 8 — all ASTM C965-96 fixed points |

### `glass-viscosity-arrhenius.util.ts`

| Function | Status | Spec Chapter |
|----------|--------|--------------|
| `calcHetheringtonLogEta` | ✅ Complete | Ch. 1 (Hetherington model) |
| `hetheringtonTemperatureAtLogEta` | ✅ Complete | Ch. 1 |
| `buildHetheringtonResult` | ✅ Complete | — internal builder |

### Pending slag utils

| File (planned) | Status | Spec Chapter |
|----------------|--------|--------------|
| `glass-viscosity-slag.util.ts` | ❌ Pending | Ch. 13 |
| — `calcLiquidusMills` | ❌ Pending | Ch. 13 — liquidus safety guard |
| — `calcIidaViscosity` | ❌ Pending | Ch. 13 — Iida model |
| — `calcNakamotoViscosity` | ❌ Pending | Ch. 13 — Nakamoto 2007 model |

---

## Service (`glass-viscosity.service.ts`)

### Model Selection (`selectModel`)

| Case | Status | Notes |
|------|--------|-------|
| SiO₂ > 99% → HETHERINGTON | ✅ Complete | |
| Slag detection → IIDA / NAKAMOTO | ⚠️ Partial | Iida implementation present (`calcIidaViscosity`); Nakamoto coefficients present in `viscosity-parameters.ts`. Full slag endpoints and integration tests are pending. |
| Lakatos validity check | ✅ Complete | |
| Lakatos → LAKATOS_1976 | ✅ Complete | |
| Fallback → FLUEGEL_2007 | ✅ Complete | |
| Pure fluoride → NOT_SUPPORTED | ✅ Complete | |

### Public Methods

| Method | Status | API Endpoint | Notes |
|--------|--------|-------------|-------|
| `calculateViscosity` | ✅ Complete | `POST /refractory/glass-viscosity` | Single temperature |
| `calculateViscosityProfile` | ✅ Complete | `POST /refractory/glass-viscosity/profile` | Array of temperatures |
| `getTemperatureAtViscosity` | ✅ Complete | `POST /refractory/glass-viscosity/temperature-at-viscosity` | Inverse VTF |
| `convertComposition` | ✅ Complete | `POST /refractory/utils/convert-composition` | wt%↔mol% |
| `selectModel` | ✅ Complete | — (internal + public for tests) | |
| Slag single point | ❌ Pending | `POST /refractory/slag-viscosity` | Ch. 13 |
| Slag profile | ❌ Pending | `POST /refractory/slag-viscosity/profile` | Ch. 13 |

---

## REST API Endpoints (Current)

Base path: `/api/v1/refractory`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/glass-viscosity` | Viscosity + fixed-point curve at one temperature |
| `POST` | `/glass-viscosity/profile` | Viscosity at multiple temperatures |
| `POST` | `/glass-viscosity/temperature-at-viscosity` | Inverse: T at target log η |
| `POST` | `/utils/convert-composition` | wt% ↔ mol% conversion |

Swagger UI: `GET /api/docs`

---

## Test Files

| File | Status | Covers |
|------|--------|--------|
| `test/unit/refractory/utils/glass-composition.util.spec.ts` | ✅ Complete | `wtPctToMolPct`, `molPctToWtPct` |
| `test/unit/refractory/utils/glass-viscosity-vtf.util.spec.ts` | ✅ Complete | `fitVtfThreePoints`, `evalVtf`, `temperatureAtLogViscosity` |
| `test/unit/refractory/utils/glass-viscosity-isokom.spec.ts` | ✅ Complete | `predictIsokomsLakatos`, `predictIsokomsFluegel`, Hetherington self-check |
| `test/unit/refractory/services/glass-viscosity-model-selection.spec.ts` | ✅ Complete | `selectModel` — all routing cases (Fluegel default, Lakatos reserve, slag/fluoride logic verified) |
| `test/unit/refractory/services/glass-viscosity.service.spec.ts` | ✅ Complete | `calculateViscosity` integration — explicit-preference flow covered |

### Validation Data (split)

For clarity and maintainability the validation dataset was split into three files:

```
backend/src/modules/refractory/data/
  ├─ lakatos-validation.data.ts
  ├─ fluegel-validation.data.ts
  └─ hetherington-validation.data.ts
```

`glass-viscosity-validation.data.ts` is now a small barrel that re-exports the three datasets.

---

## Developer convenience: syncing container node_modules to host

To ease editor-based development the repository includes a small utility script that copies `node_modules` from the running container into the host workspace (useful when Docker builds install deps inside the image while `.dockerignore` excludes `node_modules` from the build context):

- `scripts/sync-node-modules.sh` — streams `/app/node_modules` from the running container and extracts it into the host `backend/node_modules` (best-effort ownership fix applied). The script is intentionally left untracked by default in working trees; add it to your local git if you wish to keep it.

---

## Known Issues and TODOs

| ID | Priority | Description |
|----|----------|-------------|
| IMPL-01 | High | Implement and integrate Nakamoto viscosity calculation (`calcNakamotoViscosity`) and add slag endpoints; ensure liquidus safety guard is used for all slag calculations (see IMPL-02/03). |
| IMPL-02 | High | Implement `calcLiquidusMills` — required as safety guard before any slag calculation |
| IMPL-03 | High | Implement `calcIidaViscosity` and complete `calcNakamotoViscosity` in `glass-viscosity-slag.util.ts` (Iida present; Nakamoto pending) |
| IMPL-04 | High | Add `POST /refractory/slag-viscosity` and `/slag-viscosity/profile` endpoints |
| IMPL-05 | Medium | Add slag validation dataset to `glass-viscosity-validation.data.ts` |
| IMPL-06 | Medium | Add slag model tests to `glass-viscosity-isokom.spec.ts` or new `slag-viscosity.spec.ts` |
| IMPL-07 | Low | Fluegel isokom tolerance for some reference glasses is 5°C not 2°C; investigate coefficient rounding |
| IMPL-08 | Low | D6 (BaO-bearing Lakatos glass) fails 2°C tolerance; check BaO coefficient sign in source CSV |

---

**Previous:** [Chapter 13 — Slag and Fluoride Melt Viscosity](./chapter-13-slags-fluoride.md)

Return to: [Index](./INDEX.md)

