# STEP 04 — Materials: Metals

**Priority:** HIGH  
**Status:** backend ready (E1, M1); frontend not started  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (E1, `MaterialPicker`, temperature sweep)  
**Frontend root:** `frontend/src/modules/materials/sections/metals/`  
**Route:** `/materials/metals?material=`

---

## Goal

Select a metal grade and get its temperature-dependent thermal conductivity λ and emissivity ε, at one temperature or over a range, with up to two grades compared.

---

## 1. Backend

| # | Method | Path | Request | Response | State |
|---|--------|------|---------|----------|-------|
| E1 | `GET` | `/metals/list` | — | `MetalSummaryDto[]` (`materialId`, `name`, `description`, `emissivityRange_K`) | implemented ([Step 3](STEP_03_MATERIALS_MODULE.md)) |
| M1 | `GET` | `/metals/thermal-properties?material=&T_K=` | `MetalThermalQueryDto` (`material`: `aisi_304` \| `mild_steel`; `T_K` ≥ 1) | `MetalThermalResultDto` = `{ material, T_K, lambda_WmK, emissivity }` | implemented; query-string `T_K` fix applied ([Step 3 §1.7](STEP_03_MATERIALS_MODULE.md)) |

Model (backend, display only): λ and ε are polynomials in T; **ε is clamped** to `emissivityRange_K`, λ is not. No other backend change is needed for this section.

---

## 2. Frontend

### 2.1 UI

```
┌─ Metals ─────────────────────────────┬─ Results ───────────────────────────┐
│ Material  [MaterialPicker metal] (≤2)│ Single T: cards λ, ε per grade       │
│ Description, ε validity range        │                                      │
│ [TemperatureSweepFields]             │ Range: chart λ/ε (T) + table         │
│ [Calculate]                          │  T | λ | ε (clamped marked)          │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

- `MaterialPicker kinds={['metal']}`; a second grade can be added for comparison (`METALS_UI.maxCompared = 2`).
- `?material=` preselects a grade; an unknown id is ignored with an info message.
- Single T: one M1 call per grade. Range: `useQueries` over grades × `toTemperatureGrid(sweep)`, cache key `(material, T_K)`.
- ε points outside `emissivityRange_K` are marked "clamped" (table icon, dashed curve segment); λ is shown as returned.

### 2.2 Chart — λ(T) and ε(T)

| Property | Value |
|----------|-------|
| Component | `XYLineChart` in `ChartCard`, Range mode only |
| x-axis | T [K], tooltip also °C |
| y-axis 1 (left) | λ [W/(m·K)], solid line per grade |
| y-axis 2 (right) | ε [–], 0–1, dashed line per grade |
| Plot bands | outside `emissivityRange_K`: shaded "ε clamped" |

### 2.3 Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)).

```
sections/metals/
├── MetalsSection.tsx
├── MetalConditionsForm.tsx
├── MetalResults.tsx
├── charts/
│   └── MetalPropertiesChart.tsx
├── api/
│   └── metal-thermal.api.ts               # metalThermalApi.getProperties(query) → M1
├── hooks/
│   └── useMetalProperties.ts              # useQueries over grades × temperatures
├── types/
│   ├── metal-thermal-query.type.ts        # MetalThermalQuery = { material; T_K }
│   ├── metal-thermal-result.type.ts       # MetalThermalResult (mirrors MetalThermalResultDto)
│   ├── metal-conditions-form-props.type.ts
│   ├── metal-results-props.type.ts
│   └── metal-properties-chart-props.type.ts
├── mappers/
│   └── metal-property-series.mapper.ts    # results → λ / ε XYSeries, clamped segments dashed
└── constants/
    └── metals-ui.constants.ts             # METALS_UI (maxCompared, default sweep 300–1500 K step 50)
```

---

## Acceptance criteria

- [ ] Grades load from E1; description and ε validity range shown for the selected grade
- [ ] AISI 304 at 800 K shows λ and ε
- [ ] Range mode: table and two-axis chart; clamped ε points marked; up to 2 grades compared
- [ ] `?material=aisi_304` preselects the grade
- [ ] Nest errors shown in `JsonErrorAlert`; no coefficients in the frontend

---

## Next

→ [STEP_05_GASES.md](STEP_05_GASES.md)
