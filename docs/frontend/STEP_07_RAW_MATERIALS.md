# STEP 07 — Materials: Raw materials (categorised library)

**Priority:** MEDIUM  
**Status:** backend ready (E5, E9, E10, C3); frontend not started  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (E5, E9, E10, temperature sweep), [STEP_09 §2](STEP_09_MINERAL_COMPOSITIONS.md) (`POST /refractory/mix/composition`, implemented)  
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

| # | Method | Path | Use | State |
|---|--------|------|-----|-------|
| E10 | `GET` | `/refractory/material-categories` | categories (primary group) with their materials | implemented ([Step 3](STEP_03_MATERIALS_MODULE.md)) |
| E5 | `GET` | `/refractory/materials/:materialId` | full entry of the selected material | implemented |
| E9 | `GET` | `/refractory/mix-components` | which materials allow the calculated block | implemented |
| C3 | `POST` | `/refractory/mix/thermal` | `{ fractions: [{ materialId, massFraction: 1 }], temperatures_C, porosity }` → fired phases, Cp coverage, λ reference, `points[]` (λ_s, λ_eff, Cp, a), true and bulk density, warnings | implemented ([algorithm](../algorithms/MIX_THERMAL_ALGORITHM.md)) |

### 1.1 Why the calculated block uses C3

The first version sent the 8 accepted oxides of `POST /refractory/mix/composition` to `POST /refractory/thermal-conductivity`. That gave wrong results for every material:

- the non-oxide phases were lost (fired SiC was calculated from its 0.5 % SiO2 / 0.3 % Fe2O3 / 0.2 % Al2O3 impurities rescaled to 100 %);
- the component property lookup of `/thermal-conductivity` never matched an oxide, so λ and Cp fell back to constants (1.0 W/(m·K), 800 J/(kg·K));
- its porosity formula made λ_eff ≈ 8 λ_air at P = 0.2 whatever the solid, and the density was fixed at 2500 kg/m³.

C3 keeps every fired phase. Cp comes from NASA-9 condensed-phase data, the dense λ from the material's library reference with a temperature law, ρ from the library true density, and λ_eff from Maxwell–Eucken. The frontend applies **no composition rule** of its own.

### 1.2 What the UI shows from C3

| Item | Source |
|------|--------|
| Fired phases and loss on ignition | `firedPhases_wt`, `lossOnIgnition_wt` |
| Share of the fired mass with NASA-9 Cp | `heatCapacityCoverage_wt`; warning when > 5 % uses the library Cp |
| Dense λ_ref, its source (library / group median) and temperature law | `materials[0]` |
| True density; bulk ρ = ρ_true (1 − P) | `trueDensity_kgm3`, `bulkDensity_kgm3` |

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

- **Calculated block:** shown when the material is in E9. Flow: one C3 call per material with all temperatures of `toTemperatureGrid(sweep)` (converted to °C) and the chosen porosity (default `RAW_MATERIALS_UI.defaultPorosity = 0.2`, max 0.95), plus a P = 0 call for the selected material when "dense" is ticked. Disabled with a reason when the material is not a mix component ("not a mix raw material": glasses, phosphates, fluorides, …).
- **Compare:** up to `RAW_MATERIALS_UI.maxCompared = 3` materials; reference values side by side; calculated series for the ones that allow it.

### 2.2 Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Composition | `PieChart` | stored composition wt% (LOI keys such as `H2O`, `CO2` shown as their own slices) |
| λ_eff(T) | `XYLineChart` | x = T [°C] (tooltip K); y = λ_eff [W/(m·K)]; one series per compared material; optional second series at P = 0 for the selected material |
| Cp(T) | `XYLineChart` | x = T [°C]; y = Cp [J/(kg·K)]; one series per compared material |
| Reference comparison | `CategoryBarChart` | categories = compared materials; property selector over the reference fields with values; y = selected property |

### 2.3 Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)). Catalogue hooks (`useMaterialCategories`, `useMaterial`, `useMixComponents`) and the API object `mixThermalApi` are module-level (Step 3).

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
│   └── useRawMaterialThermal.ts           # C3 per material and porosity (useQueries)
├── types/
│   ├── reference-property-key.type.ts
│   ├── reference-property-row.type.ts
│   ├── raw-material-thermal-point.type.ts
│   └── <component>-props.type.ts          # one per component
├── mappers/
│   ├── mix-thermal-request.mapper.ts                   # (materialId, temperatures_C, porosity) → MixThermalInput with massFraction 1
│   ├── raw-material-thermal-points.mapper.ts           # MixThermalResult → RawMaterialThermalPoint[]
│   ├── fired-phase-rows.mapper.ts                      # firedPhases_wt → rows sorted by share
│   ├── reference-property-rows.mapper.ts               # MaterialEntry → rows present in REFERENCE_PROPERTY_FIELDS
│   └── raw-material-thermal-series.mapper.ts
└── constants/
    ├── raw-materials-ui.constants.ts      # RAW_MATERIALS_UI (maxCompared, defaultPorosity, default sweep 20–1400 °C step 50)
    └── reference-property-fields.constants.ts  # REFERENCE_PROPERTY_FIELDS (path, label, unit, digits)
```

---

## Acceptance criteria

- [ ] Categories and counts come from E10; each material listed once; secondary groups shown as chips
- [ ] Selecting a material shows composition (pie + table) and only the reference properties it has
- [ ] `kaolinite`: calculated block shows LOI 14 %, fired phases, group-median λ_ref warning and the λ_eff(T) and Cp(T) charts
- [ ] `silicon_carbide`, `titanium_nitride`, `silicon_nitride`: calculated from SiC / TiN / Si3N4, not from their oxide impurities
- [ ] `soda_lime_glass`: reference block shown, calculated block disabled with the reason
- [ ] Bulk ρ = library true density · (1 − P)
- [ ] Up to 3 materials compared; `?category=clay&material=kaolinite` deep link works
- [ ] No composition rule, rescaling or eligibility rule in the frontend

---

## Next

→ [STEP_08_GLASSES.md](STEP_08_GLASSES.md)
