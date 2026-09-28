# Metals API Specification

**Base path:** `/api/v1/metals`  
**Controller:** `MetalsController`  
**Swagger UI:** `http://localhost/api/docs`  
**Tags:** `metals` (both endpoints), `materials` (catalogue)

Data: `backend/src/modules/metals/data/materials/metal-thermal.data.ts` (`METAL_THERMAL_MATERIALS`, 2 grades).

---

## Endpoints Overview

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| GET | `/list` | `MetalThermalService.listMaterials` | Catalogue of metal grades |
| GET | `/thermal-properties?material=&T_K=` | `MetalThermalService.getThermalProperties` | λ and ε at one temperature |

---

## 1. `GET /list`

**Response** (`MetalSummaryDto[]`):
```json
[
  {
    "materialId": "aisi_304",
    "name": "AISI 304 stainless steel",
    "description": "Austenitic 18-8 stainless steel (18% Cr, 8% Ni). λ fit valid 300–1400 K.",
    "emissivityRange_K": { "min": 600, "max": 1400 }
  }
]
```

`emissivityRange_K` (`TemperatureRangeDto`) is the validity range of the ε fit; ε is clamped outside it.

---

## 2. `GET /thermal-properties`

**Query** (`MetalThermalQueryDto`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `material` | `MetalMaterial` | ✅ | `aisi_304` \| `mild_steel` |
| `T_K` | number | ✅ | Temperature [K], ≥ 1. Converted from the query string with `@Type(() => Number)` |

**Response** (`MetalThermalResultDto`):
```json
{ "material": "aisi_304", "T_K": 800, "lambda_WmK": 22.761, "emissivity": 0.66 }
```

Model: λ = a + b·T + c·T² + d·T³ (T in K for AISI 304, °C for mild steel); ε = a + 1e-5·b·T + 1e-8·c·T² + 1e-10·d·T³ with T clamped to `emissivityRange_K`.

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | unknown `material`, missing / non-numeric `T_K`, `T_K` < 1, unknown query parameter |

---

## Implementation Status

| Endpoint | Tests |
|----------|-------|
| `GET /list` | `test/unit/metals/services/metal-thermal.service.spec.ts` |
| `GET /thermal-properties` | `metal-thermal.service.spec.ts`, `test/unit/metals/dto/metal-thermal-query.dto.spec.ts` |
