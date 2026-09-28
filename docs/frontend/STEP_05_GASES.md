# STEP 05 — Materials: Gases

**Priority:** HIGH  
**Status:** specification only  
**Depends on:** [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md) (gas list, `MaterialPicker`, temperature sweep), [STEP_02](STEP_02_SHARED_CALC_COMPONENTS.md) (`GasCompositionInput`)  
**Frontend root:** `frontend/src/modules/materials/sections/gases/`  
**Route:** `/materials/gases?gas=`

---

## Goal

Thermophysical properties of pure gases and gas mixtures versus temperature: Cp, Cv, γ, M, μ, ν, ρ, λ, Pr, and diffusion coefficients for mixtures. Up to three pure gases can be compared.

---

## 1. Backend

All endpoints exist; **no backend change** for this section.

| # | Method | Path | Request | Response fields used |
|---|--------|------|---------|----------------------|
| G0 | `GET` | `/thermodynamics/fluid/list` | — | `{ key, name, formula, Mr_kg_mol }[]` (species plus the aliases `air`, `water`, `gas_mix`) |
| G1 | `POST` | `/thermodynamics/fluid/cp` | `FluidBaseInputDto` | `Cp_J_kgK`, `Cv_J_kgK`, `gamma`, `molecularWeight_kg_mol` |
| G2 | `POST` | `/thermodynamics/fluid/viscosity` | `FluidBaseInputDto` | `mu_Pa_s`, `nu_m2s` |
| G3 | `POST` | `/thermodynamics/fluid/density` | `FluidBaseInputDto` | `rho_kg_m3` (ideal gas) |
| G4 | `POST` | `/thermodynamics/fluid/thermal-conductivity` | `FluidBaseInputDto` | `lambda` [W/(m·K)] |
| G5 | `POST` | `/thermodynamics/dimensionless/prandtl` | `PrandtlInputDto` | `value` (Pr) |
| G6 | `POST` | `/thermodynamics/properties` | `GasMixtureInputDto` | `Cp_J_kgK`, `H_J_mol`, `mu_Pa_s`, `lambda`, `rho_kg_m3`, `Pr`, `molecularWeight_kg_mol`, `diffusion` |
| G7 | `GET` | `/thermodynamics/cp-compare?species=&T_K=` | query | `CpComparisonEntryDto[]` = `{ index, type, ref, value [J/(mol·K)], rangeValid }` |

Request shapes:

```json
{ "fluid": "air", "T_fluid_K": 800, "P_Pa": 101325 }
```

```json
{ "composition": { "N2": 0.72, "CO2": 0.12, "H2O": 0.10, "O2": 0.06 }, "T_K": 1200, "P_atm": 1, "fractionType": "mole" }
```

G7 accepts species only (not the `air` / `water` aliases); the Cp comparison is disabled for aliases.

---

## 2. Frontend

### 2.1 UI

Two sub-tabs.

**Pure gas**

```
┌─ Pure gas ───────────────────────────┬─ Results ───────────────────────────┐
│ Gas  [MaterialPicker gas] (≤3)       │ Single T: property table per gas     │
│ [TemperatureSweepFields]  P [Pa]     │  Cp Cv γ M μ ν ρ λ Pr                │
│ [Calculate]                          │ Range: property-vs-T chart + table   │
│ ▸ Advanced: Cp methods comparison    │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

- `MaterialPicker kinds={['gas']}` without `gas_mix` (`excludeIds={['gas_mix']}`; mixtures use the second tab); up to `GASES_UI.maxCompared = 3`.
- Per gas and temperature: G1–G5 in parallel (`useQueries`), combined into one `PureGasPropertyRow` by `pure-gas-row.mapper.ts`. Cache key `(gas, T_K, P_Pa)`.
- Advanced accordion: G7 for one species at one T; bar chart of the approximations, entries with `rangeValid = false` greyed.

**Gas mixture**

- `GasCompositionInput` (species from G0 without aliases; mole or mass fractions), presets from `GAS_MIXTURE_PRESETS`: *Dry air* (N2 0.79 / O2 0.21), *Typical flue gas* (N2 0.72 / CO2 0.12 / H2O 0.10 / O2 0.06).
- `TemperatureSweepFields`, P [atm]. Per temperature: G6. Results table includes Pr and the diffusion coefficients.
- Sum of fractions ≠ 1 shows a warning and disables Calculate (the backend requires Σ = 1).

`?gas=` preselects a pure gas; an unknown key is ignored with an info message.

### 2.2 Charts

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Property vs T | `XYLineChart` | x = T [K] (tooltip also °C); property selector (Cp, μ, ν, ρ, λ, Pr) sets the y-axis title and unit; one series per gas (pure) or the mixture; **ρ and ν on a logarithmic y-axis**, the others linear |
| Mixture composition | `PieChart` | fractions of the mixture, shown with the mixture result |
| Cp methods comparison | `CategoryBarChart` | categories = `type` + `ref`; y = Cp [J/(mol·K)]; tooltip shows the deviation from the mean in % |

The y-axis scale per property comes from `GAS_PROPERTY_AXES` (constants), not from code branches.

### 2.3 Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)).

```
sections/gases/
├── GasesSection.tsx                       # sub-tabs
├── PureGasForm.tsx
├── PureGasResults.tsx
├── GasMixtureForm.tsx
├── GasMixtureResults.tsx
├── CpComparisonPanel.tsx
├── charts/
│   ├── GasPropertyChart.tsx
│   ├── GasMixturePieChart.tsx
│   └── CpComparisonChart.tsx
├── api/
│   ├── fluid-properties.api.ts            # fluidPropertiesApi.cp / viscosity / density / thermalConductivity (G1–G4)
│   ├── prandtl.api.ts                     # prandtlApi.calculate (G5)
│   ├── gas-mixture.api.ts                 # gasMixtureApi.getProperties (G6)
│   └── cp-comparison.api.ts               # cpComparisonApi.compare (G7)
├── hooks/
│   ├── usePureGasProperties.ts
│   ├── useGasMixtureProperties.ts
│   └── useCpComparison.ts
├── types/                                 # one per file; *-result types mirror the backend DTOs
│   ├── fluid-base-input.type.ts
│   ├── fluid-cp-result.type.ts
│   ├── fluid-viscosity-result.type.ts
│   ├── fluid-density-result.type.ts
│   ├── fluid-thermal-conductivity-result.type.ts
│   ├── prandtl-input.type.ts
│   ├── scalar-dimensionless-result.type.ts
│   ├── gas-mixture-input.type.ts
│   ├── gas-properties-result.type.ts
│   ├── cp-comparison-entry.type.ts
│   ├── pure-gas-property-row.type.ts
│   ├── gas-property-key.type.ts
│   └── <component>-props.type.ts          # one per component
├── mappers/
│   ├── pure-gas-row.mapper.ts             # G1–G5 results → PureGasPropertyRow
│   ├── gas-property-series.mapper.ts      # rows → XYSeries for the selected property
│   └── cp-comparison-bars.mapper.ts
└── constants/
    ├── gases-ui.constants.ts              # GASES_UI (maxCompared, default sweep 300–1500 K step 50, default P)
    ├── gas-property-axes.constants.ts     # GAS_PROPERTY_AXES (label, unit, linear | logarithmic)
    └── gas-mixture-presets.constants.ts   # GAS_MIXTURE_PRESETS
```

---

## Acceptance criteria

- [ ] Gas list loads from G0; pure-gas mode shows Cp, Cv, γ, M, μ, ν, ρ, λ, Pr in one result
- [ ] Up to 3 gases compared on the property-vs-T chart; ρ and ν on a log axis
- [ ] Mixture mode returns the full set incl. Pr and diffusion for the flue-gas preset; pie chart shown
- [ ] Composition sum ≠ 1 shows a warning and blocks Calculate
- [ ] Cp methods chart in J/(mol·K); out-of-range methods greyed; disabled for aliases
- [ ] `?gas=CO2` preselects the gas; Nest errors shown in `JsonErrorAlert`

---

## Next

→ [STEP_06_REFRACTORIES.md](STEP_06_REFRACTORIES.md)
