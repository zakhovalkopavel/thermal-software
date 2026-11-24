# STEP 06 — Materials: Refractories (known products)

**Priority:** HIGH  
**Status:** backend ready (E2, E3); frontend not started  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (E2, E3, `MaterialPicker`, temperature sweep)  
**Frontend root:** `frontend/src/modules/materials/sections/refractories/`  
**Route:** `/materials/refractories?material=`

---

## Goal

A catalogue of **known refractory and insulation products** (fire bricks, lightweight bricks, sands, SiC, fibre mats) with their temperature-dependent λ and ε, at one temperature or over a range, with up to four products compared.

This section is about *finished, known products*. Raw materials (oxides, clays, …) are in [Raw materials](STEP_07_RAW_MATERIALS.md); designing a refractory from raw fractions is in [Mineral compositions](STEP_09_MINERAL_COMPOSITIONS.md).

---

## 1. Backend

| # | Method | Path | Request | Response | State |
|---|--------|------|---------|----------|-------|
| E2 | `GET` | `/refractory/refractories` | — | `RefractoryProductSummaryDto[]` (19): `materialId`, `name`, `description`, `emissivityRange_K` | implemented ([Step 3](STEP_03_MATERIALS_MODULE.md)) |
| E3 | `GET` | `/refractory/refractories/properties?material=&T_K=` | `RefractoryProductQueryDto` | `RefractoryProductResultDto` = `{ material, T_K, lambda_WmK, emissivity }` | implemented |

Model (backend, display only): λ(T_C) = a + b·T + c·T² + d·T³; ε from a polynomial or power law, **clamped** to `emissivityRange_K`. No other backend change is needed for this section.

Products (from the `RefractoryThermalMaterial` enum) and the display groups built by `toRefractoryGroups` ([Step 3 §2.7](STEP_03_MATERIALS_MODULE.md)):

| Group | Products |
|-------|----------|
| Chamotte | `chamotte_solid`, `chamotte_1300`, `chamotte_1000`, `chamotte_900`, `chamotte_600`, `chamotte_400` |
| Mullite | `mullite_2300` |
| Quartz | `quartz_2000`, `quartz_1000`, `quartz_sand_1`, `quartz_sand_05`, `quartz_sand_02` |
| Alumina | `alumina_2500`, `alumina_1300`, `alumina_sand_1`, `alumina_sand_05`, `alumina_sand_02` |
| Carbide | `silicon_carbide` |
| Insulation | `basalt_fiber_mat` |

The grouping rule (id → group) lives in `REFRACTORY_GROUPS` (constants); a product without a match goes to "Other" so a new backend product never disappears.

---

## 2. Frontend

### 2.1 UI

```
┌─ Refractories ───────────────────────┬─ Results ───────────────────────────┐
│ Catalogue list (grouped, searchable) │ Selected: Chamotte 1000 kg/m³       │
│  ▸ Chamotte                          │ Description, ε validity range       │
│    ☑ chamotte_solid                  │                                      │
│    ☑ chamotte_1000                   │ Single T: λ, ε cards (+ ranking bar) │
│  ▸ Alumina …                         │ Range: λ(T), ε(T) charts + table     │
│ [TemperatureSweepFields]             │  T | λ(p1) | λ(p2) | ε …             │
│ [Calculate]                          │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

- Multi-select up to `REFRACTORIES_UI.maxCompared = 4` products; one column per product.
- Range: `useQueries` over products × `toTemperatureGrid(sweep)` (≤ 4 × 40 requests); cache key `(material, T_K)`.
- Clamped ε values (T outside `emissivityRange_K`) marked with an info icon and a dashed curve segment.
- `?material=` preselects a product (deep link from Processes → multilayer wall "View properties").

### 2.2 Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| λ(T) | `XYLineChart` | x = T [°C] (tooltip also K); y = λ [W/(m·K)], linear; one solid series per product |
| ε(T) | `XYLineChart` | x = T [°C]; y = ε 0–1; one series per product; clamped part dashed |
| λ at the chosen T | `CategoryBarChart` | categories = selected products; y = λ — ranking of insulating ability (Single T mode, ≥ 2 products) |

Default range when switching to Range mode: 20–1400 °C, step 50 °C. Series colours follow the group (chamotte shades, alumina shades, …) from `REFRACTORY_GROUPS`.

### 2.3 Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)). The catalogue list call (`refractoryProductsApi.list`, `useRefractoryProducts`), `toRefractoryGroups`, `REFRACTORY_GROUPS` and the `RefractoryGroup` type are module-level (Step 3), because the `MaterialPicker` uses them too.

```
sections/refractories/
├── RefractoriesSection.tsx
├── RefractoryCatalogList.tsx
├── RefractoryResults.tsx
├── charts/
│   ├── RefractoryLambdaChart.tsx
│   ├── RefractoryEmissivityChart.tsx
│   └── RefractoryRankingChart.tsx
├── hooks/
│   └── useRefractoryProperties.ts         # useQueries over products × temperatures → refractoryProductsApi.getProperties (E3)
├── types/
│   └── <component>-props.type.ts          # one per component
├── mappers/
│   ├── refractory-property-series.mapper.ts  # results → λ / ε XYSeries, clamped segments dashed
│   └── refractory-ranking.mapper.ts
└── constants/
    └── refractories-ui.constants.ts       # REFRACTORIES_UI (maxCompared, default sweep)
```

---

## Acceptance criteria

- [ ] Catalogue shows all 19 products grouped as in the table; search filters by name and id
- [ ] `chamotte_solid` at 1273 K returns λ and ε
- [ ] Range mode renders table and charts; up to 4 products compared
- [ ] Clamped ε values marked (icon + dashed segment); ranking bar in Single T mode
- [ ] `?material=chamotte_1000` preselects the product
- [ ] No λ/ε coefficients in the frontend

---

## Next

→ [STEP_07_RAW_MATERIALS.md](STEP_07_RAW_MATERIALS.md)
