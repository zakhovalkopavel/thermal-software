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
**Backend:** `combustion.controller.ts`, DTOs in `combustion/dto/` — full shapes in [`docs/algorithms/combustion/06_API.md`](../algorithms/combustion/06_API.md)

| Method | Path | Mode |
|--------|------|------|
| `GET` | `/combustion/fuels` | fuel presets (for the fuel picker) |
| `POST` | `/combustion/solid/direct` | 1 — solid fuel, one step |
| `POST` | `/combustion/solid/two-step` | 2 — generator gas + secondary-air burnout |
| `POST` | `/combustion/fluid` | 3 — gaseous or liquid fuel |
| `POST` | `/combustion/bed` | 4 — packed bed by layers |

UI: a mode selector (4 tabs) on top; each tab shows the fields of its input DTO. Fuel: preset from
`GET /fuels` (filtered by phase) or a custom fuel (elemental analysis + ΔHf or LHV; gas mole fractions for mode 3).
Required fields on top, optional ones (`pO2`, `wH2Om`, heat losses, bed/furnace walls) in an "Advanced" accordion.

Common outputs: `fuel` (LHV, stoichiometric air), `mFuel_kgs`, `fPower_W`, `tFlame_K` and the step result(s)
(`combustion`, or `generator` + `burnout`) with product mole/mass flows and fractions. Modes 2 and 4 add `tStep1_K`,
primary/secondary air; mode 4 adds the per-layer table. Results as cards (temperatures, mass flows) + composition table.

### Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Product composition | `CategoryBarChart` (grouped) | categories = `N2, O2, CO2, CO, H2O, H2, SO2`; series = mole fractions of each step result (modes 2, 4: `generator` and `burnout`) |
| Mass balance | `CategoryBarChart` (stacked) | column 1 = `mFuel_kgs` + air (+ steam, mode 4) stacked, column 2 = `mGas_kgs` + char + ash of the last step — visual check of the balance |
| Excess-air sweep | `XYLineChart` | x = `kExcessAir` (1.0–2.0, step 0.05, ≤ 21 points via `useQueries`); y1 = `tFlame_K` [K]; y2 (right) = `mGas_kgs` of the last step; vertical plot line at the entered α. Runs on "Sweep α" button, not on every Calculate; modes 1–3 only |
| Bed profile (mode 4) | `XYLineChart` | x = `layers[].z_m`; y1 = `tGas_K`, `tSolid_K`; y2 (right) = mole fractions O2, CO2, CO |

**Hand-off:** button "Use smoke in multilayer wall" pre-fills the wall form with `tFlame_K`, `mGas_kgs` and the composition of the last step reduced to N2, O2, CO2, CO, H2O, H2 (passed via router state). Button "Use in recuperator" passes the current mode and its input as `combustion` of the recuperator form.

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
| `numberOfSteps?` | Finite-difference steps through the wall (Advanced) |

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

- [ ] All four combustion modes run with their Swagger examples and return flame T and mass flows
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
