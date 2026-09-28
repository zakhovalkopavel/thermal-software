# STEP 10 — Processes: combustion and multilayer wall

**Priority:** HIGH  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (`MaterialPicker`), [STEP_05_GASES.md](STEP_05_GASES.md) (gas list)  
**Frontend root:** `frontend/src/modules/processes/`

---

## Goal

Start the **Processes** module with the two main furnace tasks. Both consume the Materials module: wall layers pick metals and refractories, smoke composition uses the gas species list.

---

## Module skeleton

```
frontend/src/modules/processes/
├── index.ts
├── routes.tsx
├── ProcessesLayout.tsx          # tabs: Combustion | Multilayer wall | HTC | Recuperator | Thermal distribution
├── ProcessesHub.tsx             # /processes landing cards
├── api/
│   ├── combustion.api.ts
│   └── thermalExchange.api.ts
├── types/
└── sections/
    ├── combustion/
    └── multilayer-wall/
```

Imports from Materials only via `modules/materials/index.ts` (`MaterialPicker`, `useGasList`).

---

## 1. Combustion — flame temperature and products

**Route:** `/processes/combustion`  
**Backend:** `combustion.controller.ts`, `dto/combustion-input.dto.ts`

| Method | Path |
|--------|------|
| `POST` | `/combustion/calculate` |

| Field | Unit | Required |
|-------|------|----------|
| `fPower_W` | W | yes |
| `fuelQ_Jkg` | J/kg (LHV) | yes |
| `kExcessAir` | – (1.0 = stoichiometric) | yes |
| `tAirStart_K` | K | yes |
| `carbonQ_Jkg` | J/kg | no |
| `pO2` | vol fraction in dry air | no |
| `wH2Om` | mass fraction (humidity) | no |
| `generatorHeatLoss_W` | W | no |

Outputs: `tFlame_K`, `tSmokeStart_K`, `mFuel_kgs`, `mAir_kgs`, `mSmoke_kgs`, composition before/after, `pCO2`, `pH2O`.

UI: required fields on top, optional ones in an "Advanced" accordion; results as cards (temperatures, mass flows) + composition table.

### Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Gas composition before / after | `CategoryBarChart` (grouped) | categories = `N2, O2, CO2, CO, H2O, H2`; series = `composition.before`, `composition.after` (mole fraction) |
| Mass balance | `CategoryBarChart` (stacked) | column 1 = `mFuel_kgs` + `mAir_kgs` (stacked), column 2 = `mSmoke_kgs` — visual check of the balance |
| Excess-air sweep | `XYLineChart` | x = `kExcessAir` (1.0–2.0, step 0.05, ≤ 21 points via `useQueries`); y1 = `tFlame_K` [K]; y2 (right) = `mSmoke_kgs`; vertical plot line at the entered α. Runs on "Sweep α" button, not on every Calculate |

**Hand-off:** button "Use smoke in multilayer wall" pre-fills the wall form with `tFlame_K`, `mSmoke_kgs` and the product composition (passed via router state).

---

## 2. Multilayer wall

**Route:** `/processes/multilayer-wall`  
**Backend:** `thermal-exchange.controller.ts`, `dto/multilayer-wall-input.dto.ts`, `dto/layer.dto.ts`

| Method | Path |
|--------|------|
| `POST` | `/thermal-exchange/multilayer-wall` |

| Field | Notes |
|-------|-------|
| `geometry` | `flat` \| `cylinder` \| `sphere` |
| `a_m`, `b_m?` | Inner dimension / second dimension [m] |
| `layers[]` | Inside → outside `{ material, thicknessMm }`; `material` = any metal **or** refractory id |
| `w_ms` | Gas velocity [m/s] |
| `composition` | Smoke mole fractions `N2, O2, CO2, CO, H2O, H2` |
| `mPerSecond_kgs` | Gas mass flow [kg/s] |
| `tFlame_K`, `tAmbient_K` | K |
| `innerEmissivity` | 0–1 |
| `numberOfSteps?`, `endFactor?` | Solver options (Advanced) |

### Layer editor

Rows: **material** (`MaterialPicker kinds={['metal', 'refractory']}`, grouped "Metals" / "Refractory products") + thickness mm; add / remove / reorder (up/down). Show the layer's λ at an indicative temperature by linking to the Materials section (“View properties” opens `/materials/refractories?material=…` or `/materials/metals?material=…`, depending on the layer kind, in a new tab).

Presets from the Swagger examples: *200 mm chamotte + 100 mm lightweight* (flat), *mild steel shell + basalt fibre* (cylinder).

Results (`MultilayerWallResultDto`): `tInner_K`, `tOuter_K`, `betweenLayers[] { name, tCelsius }`, `tGasAverage_K`, `tGasEnd_K`, `fluxInner_W`, `fluxOuter_W`, `fluxInnerDensity_Wm2`, `alphaInner`, `alphaOuter_Wm2K`, `totalThickness_mm`.

### Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Temperature through the wall | `XYLineChart` | x = distance from inner surface [mm] (0 … `totalThickness_mm`); y = T [°C]; points = inner surface (`tInner_K`), each interface (`betweenLayers[i].tCelsius` at the cumulative thickness of the request layers), outer surface (`tOuter_K`); **x plot bands** = one band per layer labelled with the material name; horizontal plot lines = `tGasAverage_K` (hot side) and `tAmbient_K` (cold side) |
| Heat flux balance | `CategoryBarChart` | `fluxInner_W` vs `fluxOuter_W` (convergence check) |
| Inner HTC breakdown | `PieChart` | convective vs radiative parts from `alphaInner` |

The temperature profile connects interface points with straight segments; the caption states this (the backend returns interface temperatures only, not the internal finite-difference profile).

**Compare variants:** "Pin result" keeps the current profile as a dashed series so the next calculation (e.g. thicker insulation) is plotted against it (up to 3 pinned variants).

---

## Acceptance criteria

- [ ] Combustion example (5 kW, 35 MJ/kg, α = 1.2, 573 K) returns flame T and mass flows
- [ ] Optional combustion fields may be left empty
- [ ] "Use smoke in multilayer wall" pre-fills the wall form
- [ ] Layer picker lists both metals and refractories from the Materials catalogues (no hardcoded ids)
- [ ] Flat-wall preset converges and shows the temperature profile
- [ ] Wall T-profile chart shows layer bands and up to 3 pinned variants
- [ ] Combustion charts: composition before/after, mass balance, α sweep
- [ ] `/processes` hub and tabs work

---

## Next

→ [STEP_11_ADVANCED_PROCESSES.md](STEP_11_ADVANCED_PROCESSES.md)
