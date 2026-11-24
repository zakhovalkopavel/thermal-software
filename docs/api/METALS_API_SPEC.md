# Metals API Specification

**Base path:** `/api/v1/metals`  
**Controller:** `MetalsController`  
**Swagger UI:** `http://localhost/api/docs`  
**Tags:** `metals` (both endpoints), `materials` (catalogue)

**Data:**

- Poly λ/ε overrides: `backend/src/modules/metals/data/materials/metal-thermal.data.ts` (`aisi_304`, `mild_steel`)
- Synthesized alloys: `shared/processed/metal-data/` (from `make metal-data-build`; see [`docs/scripts/METAL_DATA_SPEC.md`](../scripts/METAL_DATA_SPEC.md))
- Alternative carbon-steel λ: `kCT56` Chebyshev F(C,T) — [`docs/algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md`](../algorithms/metals/KCT56_CARBON_STEEL_CONDUCTIVITY.md)

---

## Endpoints Overview

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| GET | `/list` | `MetalThermalService.listMaterials` | Poly grades + all synthesized alloys |
| GET | `/thermal-properties?material=&T_K=&lambdaModel=` | `MetalThermalService.getThermalProperties` | λ (+ Cp / CTE / ρ / ε when available); optional `lambdaModel=kCT56` |

---

## 1. `GET /list`

**Response** (`MetalSummaryDto[]`): poly overrides first, then every alloy in `index.json`.

```json
[
  {
    "materialId": "aisi_304",
    "name": "AISI 304 stainless steel",
    "description": "Austenitic 18-8 stainless steel (18% Cr, 8% Ni). λ fit valid 300–1400 K.",
    "group": "steel",
    "family": "stainless",
    "availableProperties": ["thermalConductivity", "emissivity"],
    "hasDonorFill": false,
    "emissivityRange_K": { "min": 600, "max": 1400 }
  },
  {
    "materialId": "uns-g10080",
    "name": "1008",
    "description": "steel / carbon",
    "group": "steel",
    "family": "carbon",
    "availableProperties": ["thermalConductivity", "specificHeat", "thermalExpansion"],
    "hasDonorFill": false
  }
]
```

`emissivityRange_K` is present only when an ε polynomial exists (poly grades).

---

## 2. `GET /thermal-properties`

**Query** (`MetalThermalQueryDto`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `material` | string | ✅ | Poly id (`aisi_304` \| `mild_steel`) or synthesized alloy id |
| `T_K` | number | ✅ | Temperature [K], ≥ 1 |
| `lambdaModel` | `table` \| `kCT56` | — | Default `table`. `kCT56` = Chebyshev F(C,T) using alloy `composition.C` |

**Response** (`MetalThermalResultDto`) — poly grade:
```json
{ "material": "aisi_304", "T_K": 800, "lambda_WmK": 22.761, "emissivity": 0.66, "lambdaModel": "table" }
```

**Response** — synthesized alloy (table, example):
```json
{
  "material": "sae-1008",
  "T_K": 373.15,
  "lambda_WmK": 57.8,
  "lambdaModel": "table",
  "specificHeat_JkgK": 481,
  "thermalExpansion_1e6K": 12.6,
  "donors": {},
  "notes": []
}
```

**Response** — carbon steel with `lambdaModel=kCT56`:
```json
{
  "material": "sae-1025",
  "T_K": 373.15,
  "lambda_WmK": 50.697,
  "lambdaModel": "kCT56",
  "C_wtPct": 0.25,
  "notes": ["Alternative λ from measured ASM 10xx A+B + W1 …"]
}
```

| Source | Model |
|--------|--------|
| Poly grades | λ = a + b·T + c·T² + d·T³; ε poly with T clamped to `emissivityRange_K` |
| Synthesized alloys (`table`) | Natural cubic spline over **effective** knots (`MetalSeriesPoints.effective`: own `points` + linked donor×scale); **no extrapolation** |
| Synthesized alloys (`kCT56`) | Chebyshev F(C,T) deg(C)=5, deg(T)=6; C from `composition.C`; domain C∈[0.05,1.1] wt%, T∈[0,815] °C |

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | `T_K` outside table / kCT56 domain, missing C for kCT56, kCT56 on poly grade, bad `T_K` |
| 404 | unknown `material`, or requested property missing |

---

## Implementation Status

| Endpoint | Tests |
|----------|-------|
| `GET /list` | `test/unit/metals/services/metal-thermal.service.spec.ts` |
| `GET /thermal-properties` | `metal-thermal.service.spec.ts`, `test/unit/metals/dto/metal-thermal-query.dto.spec.ts` |
| `kCT56` util | `test/unit/metals/utils/kct56-conductivity.spec.ts` |
| Spline wrapper | `test/unit/common/utils/interpolation/cubic-spline.util.spec.ts` |
