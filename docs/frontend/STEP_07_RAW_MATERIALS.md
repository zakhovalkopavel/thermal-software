# STEP 07 — Materials: Raw materials (categorised library)

**Priority:** MEDIUM  
**Status:** specification only  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (E5, E9, E10, temperature sweep), [STEP_09 §2](STEP_09_MINERAL_COMPOSITIONS.md) (`POST /refractory/mix/composition`, approved, not implemented)  
**Frontend root:** `frontend/src/modules/materials/sections/raw-materials/`  
**Route:** `/materials/raw-materials?category=&material=`

---

## Goal

Browse the material library (102 materials) **by category** — Oxides, Silicates, Clays, Binders, Carbides, Nitrides, Glasses, Phosphates, Fluorides, Borates, … — and see for one material:

1. identity and composition;
2. the **reference properties** stored in the library (λ, Cp, α, true density, melting point, mechanical data);
3. **calculated** effective λ, Cp, ρ and thermal diffusivity versus temperature and porosity — only for materials that can be mix components.

Each category has a different set of available properties; the page shows what the material has and hides empty blocks.

---

## 1. Backend

No new backend change for this section. It uses:

| # | Method | Path | Use | State |
|---|--------|------|-----|-------|
| E10 | `GET` | `/refractory/material-categories` | categories (primary group) with their materials | specified in [Step 3](STEP_03_MATERIALS_MODULE.md), not implemented |
| E5 | `GET` | `/refractory/materials/:materialId` | full entry of the selected material | specified in Step 3, not implemented |
| E9 | `GET` | `/refractory/mix-components` | which materials allow the calculated block | specified in Step 3, not implemented |
| C1 | `POST` | `/refractory/mix/composition` | single material `{ fractions: [{ materialId, massFraction: 1 }] }` → fired-basis `acceptedOxides_normalized`, coverage, warnings | approved, specified in [Step 9 §2](STEP_09_MINERAL_COMPOSITIONS.md), not implemented |
| C2 | `POST` | `/refractory/thermal-conductivity` | `{ composition: acceptedOxides_normalized, temperature (°C), porosity }` → `thermalConductivity_WmK`, `specificHeat_JkgK`, `density_kgm3`, `thermalDiffusivity_m2s` | exists |

### 1.1 Why the calculated block goes through C1

C2 accepts only the 8 oxides of `OxideCompositionDto` and does **not** rescale a partial composition: it sums `wt% / 100 · property`, so a material with 14 % loss on ignition (`kaolinite`) or with non-oxide keys would get a λ that is too low. C1 already converts the material to the fired basis and returns the 8 accepted oxides rescaled to 100 % plus a warning when more than 5 % of the fired mass is outside them. The frontend therefore applies **no composition rule** of its own.

### 1.2 Limits of the C2 model (shown in the UI)

| Limit | Consequence in the UI |
|-------|------------------------|
| Only 8 oxides (`SiO2, Al2O3, CaO, MgO, Fe2O3, K2O, Na2O, TiO2`) | show coverage = Σ `acceptedOxides_wt` from C1 (share of the fired mass represented); C1 warnings shown above the chart |
| Density fixed at 2500 · (1 − P) kg/m³ (ignores the material's true density) | the calculated ρ and diffusivity are labelled "model value"; the library `rho_true_after_firing_kgm3` is shown next to it for comparison |
| Linear temperature coefficient for λ | note under the chart: "Maxwell–Eucken with linear temperature correction" |
| No accepted oxide (e.g. `silicon_nitride`, stored as `Si` / `N`) | `acceptedOxides_normalized` is empty → calculated block disabled with the reason; reference properties still shown |

Using the true density in C2 would be a backend calculation change and would need separate approval; it is **not** part of this step.

---

## 2. Frontend

### 2.1 UI

```
┌─ Raw materials ──────────────────────┬─ Material ──────────────────────────────┐
│ Search [          ]                  │ Tabular alumina  (alumina_tabular)       │
│ ▸ Oxides (21)                        │ Category: Oxides · also: —               │
│    alumina_tabular  ◂ selected       │ Supplier / grade / source link           │
│    magnesia_fused                    │                                          │
│ ▸ Silicates (14)                     │ ┌ Composition ─────────┐┌ Reference ───┐ │
│ ▸ Clays (10)                         │ │ pie + table (wt%)    ││ λ  Cp  α     │ │
│ ▸ Binders (4)                        │ └──────────────────────┘│ ρ_true  T_m  │ │
│ ▸ Carbides / Nitrides / Glasses / …  │                         │ mechanical   │ │
│                                      │                         └──────────────┘ │
│ Compare (≤3): [chips]                │ ┌ Calculated vs T (mix components) ────┐ │
│                                      │ │ [TemperatureSweepFields] P [0–1]     │ │
│                                      │ │ coverage 99.6 %, warnings            │ │
│                                      │ │ λ_eff(T), Cp(T) charts + table       │ │
│                                      │ └──────────────────────────────────────┘ │
└──────────────────────────────────────┴──────────────────────────────────────────┘
```

- Left: categories and their materials exactly as returned by E10 (order, labels, counts); search filters within categories by name and id. A material appears once, under its primary group; secondary groups are shown as chips in the header ("also: silicate").
- `?category=` expands a category, `?material=` selects a material; unknown values are ignored with an info message.
- **Reference block:** values from E5 as stored; each property shows its unit; missing values are hidden; the block title says "Library reference values (room temperature unless stated)".

| Field | Label, unit |
|-------|-------------|
| `thermalProperties.thermalConductivity_WmK` | λ, W/(m·K) |
| `thermalProperties.specificHeat_JkgK` | Cp, J/(kg·K) |
| `thermalProperties.thermalExpansion_perK` | α, 1/K |
| `rho_true_after_firing_kgm3` | true density after firing, kg/m³ |
| `meltingPoint_C` | melting point, °C |
| `chemicalShrinkage_volFrac` | chemical shrinkage, vol. fraction |
| `activationEnergy_Jmol` | activation energy, J/mol |
| `mechanicalProperties.*` | crushing strength MPa, modulus of rupture MPa, Young's modulus GPa, hardness HV |
| `availableParticleSizes`, `particleSize` | particle sizes |

- **Calculated block:** shown when the material is in E9. Flow: C1 once per material → `acceptedOxides_normalized`; then C2 for each T of `toTemperatureGrid(sweep)` (converted to °C) with the chosen porosity (default `RAW_MATERIALS_UI.defaultPorosity = 0.2`). Disabled with a reason when the material is not a mix component ("not a mix raw material": glasses, phosphates, fluorides, …) or C1 returns no accepted oxide. Until C1 is implemented, the block shows "Calculation not available yet".
- **Compare:** up to `RAW_MATERIALS_UI.maxCompared = 3` materials; reference values side by side; calculated series for the ones that allow it.

### 2.2 Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Composition | `PieChart` | stored composition wt% (LOI keys such as `H2O`, `CO2` shown as their own slices) |
| λ_eff(T) | `XYLineChart` | x = T [°C] (tooltip K); y = λ_eff [W/(m·K)]; one series per compared material; optional second series at P = 0 for the selected material |
| Cp(T) | `XYLineChart` | x = T [°C]; y = Cp [J/(kg·K)]; one series per compared material |
| Reference comparison | `CategoryBarChart` | categories = compared materials; property selector over the reference fields with values; y = selected property |

### 2.3 Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)). Catalogue hooks (`useMaterialCategories`, `useMaterial`, `useMixComponents`) and the API objects `mixCompositionApi`, `thermalConductivityApi` are module-level (Step 3).

```
sections/raw-materials/
├── RawMaterialsSection.tsx
├── MaterialCategoryList.tsx
├── MaterialHeader.tsx
├── MaterialCompositionCard.tsx
├── ReferencePropertiesCard.tsx
├── CalculatedThermalCard.tsx
├── RawMaterialCompare.tsx
├── charts/
│   ├── MaterialCompositionPieChart.tsx
│   ├── EffectiveConductivityChart.tsx
│   ├── SpecificHeatChart.tsx
│   └── ReferenceComparisonChart.tsx
├── hooks/
│   ├── useSingleMaterialComposition.ts    # C1 for one material (useQuery, keyed by materialId)
│   └── useRawMaterialThermal.ts           # C2 over temperatures (useQueries, keyed by materialId, T_C, porosity)
├── types/
│   ├── reference-property-key.type.ts
│   ├── reference-property-row.type.ts
│   ├── raw-material-thermal-point.type.ts
│   └── <component>-props.type.ts          # one per component
├── mappers/
│   ├── single-material-composition-request.mapper.ts   # materialId → MixCompositionInput with massFraction 1
│   ├── thermal-conductivity-request.mapper.ts          # (acceptedOxides_normalized, T_C, porosity) → ThermalConductivityInput
│   ├── reference-property-rows.mapper.ts               # MaterialEntry → rows present in REFERENCE_PROPERTY_FIELDS
│   ├── composition-coverage.mapper.ts                  # Σ acceptedOxides_wt → coverage %
│   └── raw-material-thermal-series.mapper.ts
└── constants/
    ├── raw-materials-ui.constants.ts      # RAW_MATERIALS_UI (maxCompared, defaultPorosity, default sweep 20–1400 °C step 50)
    └── reference-property-fields.constants.ts  # REFERENCE_PROPERTY_FIELDS (path, label, unit, digits)
```

---

## Acceptance criteria

- [ ] Categories and counts come from E10; each material listed once; secondary groups shown as chips
- [ ] Selecting a material shows composition (pie + table) and only the reference properties it has
- [ ] `kaolinite`: calculated block uses C1 `acceptedOxides_normalized` (fired basis), shows coverage and the λ_eff(T) and Cp(T) charts
- [ ] `soda_lime_glass`: reference block shown, calculated block disabled with the reason
- [ ] `silicon_nitride`: calculated block disabled (no accepted oxide)
- [ ] Calculated ρ and diffusivity labelled "model value", library true density shown beside them
- [ ] Up to 3 materials compared; `?category=clay&material=kaolinite` deep link works
- [ ] No composition rule, rescaling or eligibility rule in the frontend

---

## Next

→ [STEP_08_GLASSES.md](STEP_08_GLASSES.md)
