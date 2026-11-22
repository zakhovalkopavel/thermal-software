# Shrinkage, Refractoriness, Glass Viscosity, and Mix Endpoints

**Parent index:** [REFRACTORY_API_SPEC.md](./REFRACTORY_API_SPEC.md)

---

### `POST /shrinkage`

Calculates drying and firing shrinkage over a temperature profile.

**Request body:**
```json
{
  "temperatureProfile_C": [110, 400, 800, 1000, 1200],
  "waterCementRatio": 0.35,
  "cementContent": 0.08,
  "cementType": "CAC",
  "holdTime_hours": 2
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `temperatureProfile_C` | number[] | ✅ | Temperatures in °C (ascending) |
| `waterCementRatio` | number | ❌ | w/c ratio (0–1, default 0.35) |
| `cementContent` | number | ❌ | Cement mass fraction (0–1, default 0.08) |
| `cementType` | string | ❌ | `"PC"`, `"CAC"` (default), or `"generic"` |
| `holdTime_hours` | number | ❌ | Hold time at peak temperature in hours |

**Response:**
```json
{
  "totalShrinkage_pct": 2.14,
  "dryingShrinkage_pct": 0.82,
  "firingShrinkage_pct": 1.32,
  "shrinkageByStage": [
    { "temperature_C": 110,  "shrinkage_pct": 0.82 },
    { "temperature_C": 1200, "shrinkage_pct": 2.14 }
  ]
}
```

---

## 11. Refractoriness

### `POST /refractoriness`

Refractoriness (cone test, ASTM C24 / GOST 4069) of the fired mix, with solidus, liquidus and the temperatures at given liquid fractions, from the equilibrium of the whole fired composition (the same phase diagrams as §1, without grain size or hold time). The refractoriness is the temperature at which the equilibrium liquid reaches a critical fraction fitted to published cone values; aluminosilicates also get an empirical formula value, and ASTM C27 classes are checked. Refractoriness under load (ISO 1893) is not estimated. Every oxide and fluoride with diagram data counts; there is no oxide list in the request. Algorithm: [`REFRACTORINESS_ALGORITHM.md`](../algorithms/phase-equilibrium/REFRACTORINESS_ALGORITHM.md).

The thermal conductivity of a mix comes from `POST /mix/thermal` (§13b). The former `POST /thermal-conductivity` (8 oxides, component lookup that matched no oxide) is removed.

**Request body** (`RefractorinessInputDto`):
```json
{
  "fractions": [
    { "materialId": "alumina_tabular", "massFraction": 0.7 },
    { "materialId": "kaolinite", "massFraction": 0.3 }
  ],
  "liquidLevels_pct": [10, 25, 50]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions` | `MixComponentInputDto[]` | ✅ | As in §13 |
| `liquidLevels_pct` | number[] | ❌ | 1–5 values, each 1–99, ascending and unique. Default `[10, 25, 50]` |

**Response** (`RefractorinessResultDto`; numbers illustrative, the data files are authoritative):
```json
{
  "refractoriness": {
    "temperature_C": 1850,
    "coneEquivalent": "…",
    "uncertainty_C": 30,
    "criticalLiquid_pct": 35,
    "aluminosilicateFormula_C": null,
    "astmC27": null
  },
  "solidus_C": 1100,
  "liquidus_C": null,
  "liquidLevels": [
    { "liquid_pct": 10, "temperature_C": 1595 },
    { "liquid_pct": 25, "temperature_C": 1840 },
    { "liquid_pct": 50, "temperature_C": null }
  ],
  "system": "NAS",
  "method": "projected",
  "inert_wt": 0,
  "unmodelled_wt": 0,
  "warnings": [
    "Liquidus above 2000 °C",
    "50 % liquid not reached by 2000 °C",
    "Aluminosilicate formula not applied: Al2O3 outside its validity range"
  ]
}
```

| Field | Description |
|-------|-------------|
| `refractoriness.temperature_C` | lowest T at which the equilibrium liquid reaches `criticalLiquid_pct`; null if not reached by 2000 °C |
| `refractoriness.coneEquivalent` | ASTM C24 cone whose end point is nearest below `temperature_C` |
| `refractoriness.uncertainty_C` | RMS residual of the fit to the published cone values of the reference set |
| `refractoriness.criticalLiquid_pct` | fitted critical liquid fraction L\* (with a viscosity term if the fit needs one) |
| `refractoriness.aluminosilicateFormula_C` | `(360 + Al2O3 − ΣR) / 0.228` for compositions inside the formula's verified range; null otherwise, reason in `warnings` |
| `refractoriness.astmC27` | `{ class, minimumCone, minimumTemperature_C }` when the composition falls in an ASTM C27 fireclay / high-alumina class; null otherwise |
| `solidus_C` | lowest T with liquid; null if above 2000 °C |
| `liquidus_C` | lowest T at which everything except the inert and unmodelled parts is liquid; null if above 2000 °C |
| `liquidLevels[]` | `{ liquid_pct, temperature_C }`; liquid % of the whole fired body; `temperature_C` null if not reached by 2000 °C or above 100 − `inert_wt` − `unmodelled_wt` |
| `system`, `method` | main system and `phase-diagram` / `projected`, as in §1 |
| `inert_wt` | carbides, nitrides, carbon — % of fired mass; never melt |
| `unmodelled_wt` | oxides and fluorides without diagram data — % of fired mass |
| `warnings` | not reached, projection, unmodelled, composition outside the reference set, formula not applied, formula and phase-diagram values differ by more than 2 × `uncertainty_C`, estimate below the ASTM C27 class minimum |
| Status | When |
|--------|------|
| 200 | calculated |
| 400 | validation error; Σ `massFraction` = 0; material not a mix component; invalid `liquidLevels_pct` |
| 404 | unknown material id |

---

## 12. Glass Viscosity

### `POST /glass-viscosity`

Calculates glass viscosity at a given temperature. Automatically selects the best model:

| Glass system | Model selected | Condition |
|---|---|---|
| Pure fused silica | `HETHERINGTON_1964` | SiO₂ > 99 wt% |
| Soda-lime-silica (SiO₂ 60–77%, Na₂O 10–17%) | `LAKATOS_1976` | Tightest accuracy, σ ≈ 3–5°C |
| Broad oxide glass (borosilicate, lead, etc.) | `FLUEGEL_2007` | SiO₂ 43–89 mol%, ~50 components |
| Industrial slag (CaO > 30%, SiO₂ < 40%) | `IIDA` (NAKAMOTO_2007 for high CaF₂) | Iida primary; Nakamoto preferred/used for high CaF₂ (>8 mol%) |
| Pure fluoride glass | `NOT_SUPPORTED` | No valid published model |

**Request body:**
```json
{
  "composition": {
    "SiO2": 72.2,
    "Na2O": 13.4,
    "CaO": 11.2,
    "MgO": 1.5,
    "Al2O3": 1.3,
    "K2O": 0.4
  },
  "temperature": 1200
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `composition` | object | ✅ | Oxide composition in **wt%**. Keys are oxide formulas: `SiO2`, `Al2O3`, `Na2O`, `K2O`, `Li2O`, `CaO`, `MgO`, `BaO`, `ZnO`, `PbO`, `ZrO2`, `SrO`, `F`, `SO3`, etc. |
| `temperature` | number | ✅ | Temperature in °C |

**Response:**
```json
{
  "logViscosity": 3.41,
  "viscosity_Pas": 2570,
  "temperature_C": 1200,
  "composition": { "SiO2": 72.2, "Na2O": 13.4, "CaO": 11.2, "MgO": 1.5, "Al2O3": 1.3, "K2O": 0.4 },
  "model": {
    "systemType": "LAKATOS_1976",
    "type": "VFT",
    "parameters": { "A": -2.43, "B": 4821, "T0": 241 }
  },
  "fixedPoints": {
    "meltingPoint_C": 1480,
    "workingPoint_C": 1210,
    "softeningPoint_C": 730,
    "annealingPoint_C": 560,
    "strainPoint_C": 516,
    "spans": {
      "meltingToStrain_C": 964,
      "workingToSoftening_C": 480,
      "softeningToAnnealing_C": 170,
      "annealingToStrain_C": 44
    }
  },
  "components": {
    "networkFormers": [{ "component": "SiO2", "wt_pct": 72.2, "role": "network former" }],
    "networkModifiers": [{ "component": "Na2O", "wt_pct": 13.4, "role": "network modifier" }],
    "intermediates": [],
    "fluorides": []
  },
  "validation": {
    "confidenceLevel": "HIGH",
    "warnings": [],
    "outOfRangeComponents": []
  },
  "metadata": {
    "reference": "Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). Glass Technology 13(3):88–95.",
    "validRange": "SiO₂ 60–77 wt%, Na₂O 10–17 wt%, 11 oxides"
  }
}
```

---

## 13. Mix Composition

### `POST /mix/composition`

Chemical composition of a mix of library raw materials on the **fired basis**. Mix components are the materials returned by `GET /mix-components`. Algorithm: [`MIX_COMPOSITION_ALGORITHM.md`](../algorithms/mix/MIX_COMPOSITION_ALGORITHM.md).

**Request body** (`MixCompositionInputDto`):
```json
{
  "fractions": [
    { "materialId": "alumina_tabular", "massFraction": 0.7 },
    { "materialId": "kaolinite", "massFraction": 0.3 }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions` | `MixComponentInputDto[]` | ✅ | At least one row; repeated materials add up |
| `fractions[].materialId` | string | ✅ | Library id of a mix component |
| `fractions[].massFraction` | number | ✅ | 0–1; rescaled so that Σ = 1 |

**Response** (`MixCompositionResultDto`):
```json
{
  "basis": "fired",
  "lossOnIgnition_wt": 4.2,
  "oxides_wt": { "Al2O3": 85.07, "SiO2": 14.63, "CaO": 0.07, "Fe2O3": 0.07, "Na2O": 0.15 },
  "nonOxideComponents_wt": {},
  "droppedMetals_wt": 0,
  "trueDensity_kgm3": 3465.4,
  "warnings": []
}
```

| Field | Description |
|-------|-------------|
| `lossOnIgnition_wt` | H2O, CO2, OH, Organic — % of the raw mix |
| `oxides_wt` | every oxide (`SiO2`, `Al2O3`, `B2O3`, `ZrO2`, `Cr2O3`, `SO3`, …) — % of fired mass. The calculation endpoints (`/phase-equilibrium`, `/refractoriness`, `/mix/thermal`) take the fractions, not this composition |
| `nonOxideComponents_wt` | `carbide`, `nitride`, `fluoride` (`CaF2`, `NaF`, `KF`, `MgF2`, …), `carbon`, `other` — % of fired mass |
| `droppedMetals_wt` | elemental metal keys below 1 wt% of their material, dropped — % of fired mass |
| `trueDensity_kgm3` | `1 / Σ(w′ᵢ / ρᵢ)` on fired mass fractions, ρ = `rho_true_after_firing_kgm3` |
| `warnings` | one entry listing the composition keys that went to the `other` non-oxide bucket (e.g. `Grog` of raku clay); these are not modelled by any calculation |

Numbers are unrounded.

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | validation error; Σ `massFraction` = 0; material not a mix component (e.g. `soda_lime_glass`, `aluminum_phosphate`) or excluded (`paper_clay`) |
| 404 | unknown material id (includes refractory product ids such as `chamotte_solid`) |

---

## 13b. Mix Thermal Properties

### `POST /mix/thermal`

Thermal properties of a **fired** library raw material, or mix, versus temperature. All fired phases are kept (SiC, TiN, AlN, C, … are not converted to oxides). Algorithm: [`MIX_THERMAL_ALGORITHM.md`](../algorithms/mix/MIX_THERMAL_ALGORITHM.md).

**Request body** (`MixThermalInputDto`):
```json
{
  "fractions": [{ "materialId": "silicon_carbide", "massFraction": 1 }],
  "temperatures_C": [20, 600, 1200],
  "porosity": 0.2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions` | `MixComponentInputDto[]` | ✅ | As in §13 |
| `temperatures_C` | number[] | ✅ | 1–301 temperatures, °C, each ≥ −73.15 (`MIX_THERMAL_CONSTANTS.minTemperature_K` = 200 K) |
| `porosity` | number | ✅ | Pore volume fraction, 0–0.95 |

**Response** (`MixThermalResultDto`, abridged):
```json
{
  "porosity": 0.2,
  "lossOnIgnition_wt": 0,
  "firedPhases_wt": { "SiC": 98.5, "C": 0.5, "SiO2": 0.5, "Fe2O3": 0.3, "Al2O3": 0.2 },
  "heatCapacityCoverage_wt": 100,
  "trueDensity_kgm3": 3210,
  "bulkDensity_kgm3": 2568,
  "materials": [{
    "materialId": "silicon_carbide", "firedMassFraction": 1, "volumeFraction": 1,
    "firedPhases_wt": { "SiC": 98.5, "C": 0.5, "SiO2": 0.5, "Fe2O3": 0.3, "Al2O3": 0.2 },
    "trueDensity_kgm3": 3210, "lambdaReference_WmK": 120, "lambdaReferenceSource": "library",
    "conductionLaw": "phonon", "heatCapacityCoverage_wt": 100
  }],
  "points": [
    { "temperature_C": 20, "lambdaSolid_WmK": 122.025, "lambdaEffective_WmK": 88.755, "specificHeat_JkgK": 657.3, "thermalDiffusivity_m2s": 5.258e-5 }
  ],
  "warnings": []
}
```

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | validation error; Σ `massFraction` = 0; material not a mix component; material with no fired mass |
| 404 | unknown material id |

---
