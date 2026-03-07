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
| `FLUEGEL_2007_BOUNDS` | ✅ Complete | Sourced from `shared/sources/fluegel_2007/Fluegel_table3.csv` |
| `HETHERINGTON_1964` | ✅ Complete | A = −3.905, B = 31 400 K |
| `MOLAR_MASSES` | ✅ Complete | ~27 oxides |
| `IIDA_COMPONENTS` | ❌ Pending | Ch. 13 — awaiting implementation |
| `NAKAMOTO_2007_COEFFICIENTS` | ❌ Pending | Ch. 13 — awaiting implementation |
| `MILLS_LIQUIDUS_COEFFICIENTS` | ❌ Pending | Ch. 13 — awaiting implementation |

---

## Enums (`viscosity-model.enum.ts`)

| Enum value | Status | Notes |
|------------|--------|-------|
| `LAKATOS_1976` | ✅ Active | VTF model for soda-lime-silica |
| `FLUEGEL_2007` | ✅ Active | VTF model for broad silicate space |
| `HETHERINGTON_1964` | ✅ Active | Arrhenius for pure fused silica |
| `URBAIN_1981` | ⚠️ Declared only | Enum entry exists; no implementation. Coefficients unverified — original paper not available. Replaced by Iida/Nakamoto per this spec. |
| `RIBOUD_1981` | ⚠️ Declared only | Same as above. |
| `NOT_SUPPORTED` | ✅ Active | Returned when no model matches |

> **TODO:** Remove `URBAIN_1981` and `RIBOUD_1981` from the enum once `IIDA` and `NAKAMOTO_2007` are added. Do not remove them before the replacements are in place — they are currently referenced in `selectModel` routing logic.

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
| Slag detection → IIDA / NAKAMOTO | ⚠️ Partial | Currently routes to `RIBOUD_1981` placeholder; will be `IIDA` / `NAKAMOTO_2007` once implemented |
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
| `test/unit/refractory/services/glass-viscosity-model-selection.spec.ts` | ✅ Complete | `selectModel` — all routing cases |
| `test/unit/refractory/services/glass-viscosity.service.spec.ts` | ✅ Complete | `calculateViscosity` integration — Lakatos, Fluegel, Hetherington, edge cases |

### Validation Data

All reference glass compositions and expected isokom temperatures are stored in:
```
backend/src/modules/refractory/data/glass-viscosity-validation.data.ts
```

This file contains `LAKATOS_VALIDATION_GLASSES`, `FLUEGEL_VALIDATION_GLASSES`,
and `HETHERINGTON_VALIDATION_GLASSES` — each entry includes both `composition_wt_pct`
and `composition_mol_pct` so tests can verify both representations.

---

## Known Issues and TODOs

| ID | Priority | Description |
|----|----------|-------------|
| IMPL-01 | High | Remove `URBAIN_1981` and `RIBOUD_1981` from enum after Iida/Nakamoto are implemented |
| IMPL-02 | High | Implement `calcLiquidusMills` — required as safety guard before any slag calculation |
| IMPL-03 | High | Implement `calcIidaViscosity` and `calcNakamotoViscosity` in `glass-viscosity-slag.util.ts` |
| IMPL-04 | High | Add `POST /refractory/slag-viscosity` and `/slag-viscosity/profile` endpoints |
| IMPL-05 | Medium | Add slag validation dataset to `glass-viscosity-validation.data.ts` |
| IMPL-06 | Medium | Add slag model tests to `glass-viscosity-isokom.spec.ts` or new `slag-viscosity.spec.ts` |
| IMPL-07 | Low | Fluegel isokom tolerance for some reference glasses is 5°C not 2°C; investigate coefficient rounding |
| IMPL-08 | Low | D6 (BaO-bearing Lakatos glass) fails 2°C tolerance; check BaO coefficient sign in source CSV |

---

**Previous:** [Chapter 13 — Slag and Fluoride Melt Viscosity](./chapter-13-slags-fluoride.md)

Return to: [Index](./INDEX.md)

