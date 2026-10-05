# Refractory API Specification

**Base path:** `/api/v1/refractory`  
**Controller:** `RefractoryController`  
**Swagger UI:** `http://localhost/api/docs`  
**Tag:** `Refractory Calculations`

All endpoints accept and return JSON. All `POST` endpoints return `200 OK` on success, `400 Bad Request` on invalid input.

---

## Endpoints Overview

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| POST | `/phase-equilibrium` | `PhaseEquilibriumService.calculatePhaseEquilibrium` | Phases of a fired mix at T and after cooling, with unreacted original phases (phase diagrams + grain size) |
| POST | `/blend-optimization` | `BlendOptimizerService.optimize` | Optimize particle blend for target PSD |
| POST | `/psd/andreasen` | `PSDCalculatorService.andreasenDiscrete` | Andreasen discrete PSD calculation |
| POST | `/psd/funk-dinger` | `PSDCalculatorService.funkDingerDiscrete` | Funk-Dinger discrete PSD calculation |
| POST | `/packing/cpm` | `PackingService.calculateCPM` | Compressible Packing Model density |
| POST | `/packing/furnas` | `PackingService.calculateFurnas` | Furnas packing model density |
| POST | `/participation` | `ParticipationService.calculateParticipation` | Reacted fraction of each size fraction (shrinking-core model) |
| POST | `/water-demand` | `WaterDemandService.calculateWaterDemand` | Water demand from packing fraction |
| POST | `/water-demand/range` | `WaterDemandService.calculateWaterDemandRange` | Water demand min/typical/max range |
| POST | `/shrinkage` | `ShrinkageService.calculateCompleteShrinkage` | Drying + firing shrinkage over temperature profile |
| POST | `/refractoriness` | `RefractorinessService.calculate` | Solidus, liquidus and temperatures at given liquid fractions of a fired mix, from the phase diagrams (§11) |
| POST | `/glass-viscosity` | `GlassViscosityService.calculateViscosity` | Glass viscosity + VFT curve + fixed points |
| POST | `/mix/composition` | `MixCompositionService.calculate` | Fired-basis composition of a mix of library raw materials (§13) |
| POST | `/mix/thermal` | `MixThermalService.calculate` | λ, Cp, ρ, diffusivity vs T of a fired library raw material or mix (§13b) |

Read-only catalogue (`MaterialCatalogController`, tag `materials`, §14):

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| GET | `/refractories` | `RefractoryThermalService.listProducts` | 19 known refractory / insulation products |
| GET | `/refractories/properties?material=&T_K=` | `RefractoryThermalService.getProperties` | λ, ε of a product at T_K |
| GET | `/materials?type=&search=` | `MaterialCatalogService.listMaterials` | Raw-material library (102 unique active entries) |
| GET | `/materials/:materialId` | `MaterialCatalogService.getMaterial` | One library material |
| GET | `/material-groups` | `MaterialCatalogService.listGroups` | Groups with route and count |
| GET | `/particle-sizes` | `ParticleSizeCatalogService.getParticleSizes` | Standard particle-size tables |
| GET | `/mix-components` | `MixComponentCatalogService.listGroups` | Raw materials allowed in mixes, by primary group |
| GET | `/material-categories` | `MaterialCatalogService.listCategories` | All materials, each once, by primary group |
| GET | `/:groupRoute` | `MaterialCatalogService.listByGroupRoute` | Materials of one group (`oxides`, `silicates`, `glasses`, …) |

---

## 1. Phase Equilibrium

### `POST /phase-equilibrium`

Phases of a mix of library raw materials fired at `temperature` for `holdTime_hours`:
- the phase-diagram equilibrium of the matrix, which is the reacted shells of all fractions;
- the unreacted original phases of coarse grains, from the shrinking-core grain reaction and the library `mineralogy`.

The fired mineralogy (crystals and glass after cooling, unreacted original phases) is part of this response. There is no separate mineral-phases endpoint.

Algorithm: [`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/FULL_PHASE_EQUILIBRIUM.md).

**Request body** (`PhaseEquilibriumInputDto`):
```json
{
  "fractions": [
    { "materialId": "alumina_tabular", "d50_mm": 4.0, "massFraction": 0.35 },
    { "materialId": "alumina_tabular", "d50_mm": 0.05, "massFraction": 0.15 },
    { "materialId": "chamotte_standard", "d50_mm": 1.5, "massFraction": 0.35 },
    { "materialId": "cac_ca70", "d50_mm": 0.01, "massFraction": 0.15 }
  ],
  "temperature": 1450,
  "holdTime_hours": 2,
  "totalMass": 1000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions` | `PhaseEquilibriumFractionInputDto[]` | ✅ | At least one row; the same material may appear in several size fractions |
| `fractions[].materialId` | string | ✅ | Library id of a mix component (`GET /mix-components`) |
| `fractions[].d50_mm` | number | ✅ | Representative grain diameter, mm, > 0 |
| `fractions[].massFraction` | number | ✅ | 0–1, raw (as-delivered) basis; rescaled so that Σ = 1 |
| `temperature` | number | ✅ | Firing temperature, °C, 500–2000 (`PHASE_EQUILIBRIUM_CONSTANTS`) |
| `holdTime_hours` | number | ❌ | Hold at `temperature`, h, 0.1–100 (default 2) |
| `totalMass` | number | ❌ | Fired mass of the body for the reported masses (default 1) |

**Response** (`PhaseEquilibriumResultDto`, abridged). All `percent` values are % of the fired body; `mass = percent / 100 · totalMass`.
```json
{
  "atTemperature": {
    "liquid": { "percent": 6.1, "mass": 61, "composition": { "SiO2": 38.2, "Al2O3": 37.5, "CaO": 23.1, "Na2O": 0.6, "K2O": 0.6 },
      "parts": [
        { "source": "matrix", "name": "Liquid (matrix)", "percent": 6.1, "mass": 61, "composition": { "…": "…" },
          "viscosity": { "model": "IIDA", "confidence": "LOW", "logViscosity": 1.42, "viscosity_Pas": 26.3 } }
      ] },
    "glass": { "percent": 1.9, "mass": 19, "composition": { "SiO2": 72.8, "Al2O3": 19.6, "K2O": 4.1, "Fe2O3": 1.6 },
      "parts": [
        { "source": "unreacted", "materialId": "chamotte_standard", "phaseId": "glass", "name": "Glass (Chamotte Standard)", "percent": 1.9, "mass": 19, "composition": { "…": "…" },
          "state": "softened", "viscosity": { "model": "FLUEGEL_2007", "confidence": "LOW", "logViscosity": 7.9, "viscosity_Pas": 7.9e7 } }
      ] },
    "crystals": [
      { "phaseId": "corundum", "phase": "Corundum", "formula": "Al2O3", "percent": 58.4, "mass": 584, "meltingPoint_C": 2054,
        "origin": { "matrix": 9.6, "unreactedUnchanged": 48.8, "unreactedTransformed": 0 } },
      { "phaseId": "anorthite", "phase": "Anorthite", "formula": "CaO·Al2O3·2SiO2", "percent": 3.2, "mass": 32, "meltingPoint_C": 1553,
        "origin": { "matrix": 3.2, "unreactedUnchanged": 0, "unreactedTransformed": 0 } }
    ]
  },
  "afterCooling": {
    "glass": { "percent": 8.0, "mass": 80, "composition": { "SiO2": 52.4, "Al2O3": 30.1, "CaO": 14.2 },
      "parts": [
        { "source": "matrix", "name": "Glass (matrix liquid)", "percent": 6.1, "mass": 61, "composition": { "…": "…" },
          "glassPoints": null },
        { "source": "unreacted", "materialId": "chamotte_standard", "phaseId": "glass", "name": "Glass (Chamotte Standard)", "percent": 1.9, "mass": 19, "composition": { "…": "…" },
          "glassPoints": { "model": "FLUEGEL_2007", "confidence": "LOW", "strainPoint_C": 1010, "glassTransition_C": 1060, "softeningPoint_C": 1330, "workingPoint_C": 1650 } }
      ] },
    "crystals": [ "… same entries as atTemperature.crystals …" ]
  },
  "unreactedOriginalPhases": [
    { "phaseId": "corundum", "phase": "Corundum", "formula": "Al2O3",
      "originalPercent": 60.3, "originalMass": 603, "unreactedPercent": 48.8, "unreactedMass": 488, "unreactedShare": 80.9,
      "state": "unchanged" },
    { "phaseId": "quartz", "phase": "Quartz", "formula": "SiO2",
      "originalPercent": 1.1, "originalMass": 11, "unreactedPercent": 0.8, "unreactedMass": 8, "unreactedShare": 72.7,
      "state": "transformed",
      "transformedTo": { "liquid": null, "crystals": [ { "phaseId": "cristobalite", "phase": "Cristobalite", "formula": "SiO2", "percent": 0.8, "mass": 8 } ] } }
  ],
  "materials": [
    { "materialId": "alumina_tabular", "firedPercent": 49.6, "reactedPercent": 32.1,
      "unreactedPhases": [ "… same entry shape as unreactedOriginalPhases, for this material …" ] }
  ],
  "fractions": [
    { "materialId": "alumina_tabular", "d50_mm": 4.0, "massFraction": 0.35, "penetrationDepth_mm": 0.1, "reactedPercent": 14.1 }
  ],
  "matrix": {
    "percent": 34.9,
    "composition": { "Al2O3": 63.1, "SiO2": 22.0, "CaO": 13.4, "Fe2O3": 0.7, "Na2O": 0.4, "K2O": 0.4 },
    "system": "CAS", "method": "projected", "solidus_C": 1345, "liquidus_C": 1720,
    "atTemperature": { "liquid": { "…": "…" }, "crystals": [ "…" ] },
    "afterCooling": { "glass": { "…": "…" }, "crystals": [ "…" ] }
  },
  "unmodelled": { "percent": 0, "mass": 0, "components": {} },
  "metadata": { "temperature": 1450, "holdTime_hours": 2, "totalMass": 1000, "reactedPercent": 34.9, "oxygenExchange_wt": 0, "calculatedAt": "2026-10-05T12:00:00.000Z" },
  "warnings": [
    "Matrix projected onto CaO–Al2O3–SiO2: Na2O, K2O converted to CaO by molar equivalence",
    "Liquid (matrix): Iida slag model, T within 50 K of its liquidus estimate — accuracy reduced; no glass points (slag model)",
    "Glass (Chamotte Standard): Al2O3 outside Fluegel 2007 bounds — viscosity extrapolated"
  ]
}
```

| Field | Description |
|-------|-------------|
| `atTemperature` | totals at T: `liquid` (`LiquidPhaseResultDto`), `glass` (`GlassAtTemperatureResultDto`) and `crystals[]` (`CrystalPhaseResultDto`) |
| `…liquid` | equilibrium liquid: `percent`, `mass`, bulk `composition` (wt%), `parts[]` (`LiquidPartResultDto`: matrix liquid and the liquid of each transformed original phase) |
| `…glass` (at T) | glass that does not crystallize at T: the glass of the matrix below the matrix solidus, and `unchanged` / `softened` glass of raw materials. `parts[]` (`GlassPartAtTemperatureResultDto`) with `state` `rigid` (log η ≥ 12) or `softened` |
| `…parts[]` | `source` (`matrix` or `unreacted` with `materialId`, `phaseId`), `name`, `percent`, `mass`, `composition` |
| `…viscosity` | `MeltViscosityResultDto` from `GlassViscosityService` (§12): `model`, `confidence`, `logViscosity`, `viscosity_Pas` at T. `null` when the glass code has no model for the composition |
| `afterCooling` | `glass` (`GlassAfterCoolingResultDto`) = all liquid parts quenched + all glass parts; `crystals[]` as at T |
| `…glassPoints` | `GlassPointsResultDto` per glass part from `GlassViscosityService`: `model`, `confidence`, `strainPoint_C` (10¹³·⁵ Pa·s), `glassTransition_C` (annealing point, 10¹² Pa·s), `softeningPoint_C` (10⁶·⁶ Pa·s), `workingPoint_C` (10³ Pa·s). `null` when the glass code has no model or uses a slag model (Iida, Nakamoto), which describes the melt above the liquidus only |
| `crystals[].origin` | % of the body from the matrix, unreacted unchanged original phases, and unreacted transformed original phases |
| `unreactedOriginalPhases[]` | `UnreactedPhaseResultDto`, one per original phase of the mix (crystals of the `mineralogy` and *Glass (material)* remainders) |
| `…originalPercent` / `unreactedPercent` | original / unreacted amount, % of the fired body |
| `…unreactedShare` | % of the phase's original amount that did not react |
| `…state` | `unchanged` (stable on its own at T; for glass: rigid), `softened` (glass of a raw material above its glass transition but below its own solidus: supercooled melt, not crystallized) or `transformed` (`transformedTo`: `liquid` or `null`, and `crystals[]` it became, without reacting with the matrix) |
| `materials[]` | `MaterialReactionResultDto`: per material, fired share of the body, reacted %, unreacted phases |
| `fractions[]` | `FractionReactionResultDto`: δ(T, t) of the material and reacted % of the fraction |
| `matrix` | `MatrixResultDto`: composition (all oxides of the reacted part, wt%), main `system` (`AS`, `KAS`, `NAS`, `CAS`, `MAS`, `CMS`), `method` (`phase-diagram` or `projected`), solidus / liquidus, phases at T and after cooling (% of the body) |
| `unmodelled` | oxides without proven equilibrium data (e.g. Nd2O3, Pr6O11 traces; SO3 until a source is recorded). They are not estimated |
| `metadata` | `PhaseEquilibriumMetadataDto`: `temperature`, `holdTime_hours`, `totalMass`, `reactedPercent`, `oxygenExchange_wt` (O2 gained (+) or lost (−) by Fe and Mn oxides in air), `calculatedAt` |
| `warnings` | projection of base oxides, extra oxides > 2 wt% (effect on the liquid only through tabulated subsystems), `unmodelled` oxides, inert phases present, mineralogy remainder, glass code (no model, composition or temperature outside the model's range), mix-composition warnings |

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | validation error; Σ `massFraction` = 0; material not a mix component or excluded; material without `mineralogy` |
| 404 | unknown material id |

---

## 2. Blend Optimization

### `POST /blend-optimization`

Optimizes mass fractions of particle size fractions to best match a target PSD curve (Andreasen or Funk-Dinger).

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0, "dMax_mm": 10.0, "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 1.0, "dMax_mm": 5.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "isFixed": false, "density_kgm3": 2700 }
  ],
  "options": {
    "targetQ": 0.26,
    "method": "Andreasen"
  }
}
```

**Fields — `fractions[]`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dMin_mm` | number | ✅ | Lower sieve size in mm |
| `dMax_mm` | number | ✅ | Upper sieve size in mm |
| `isFixed` | boolean | ❌ | If true, mass fraction is fixed (not optimized) |
| `massFraction` | number | ❌ | Fixed mass fraction (required if `isFixed: true`) |
| `density_kgm3` | number | ❌ | Particle density in kg/m³ |

**Fields — `options`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetQ` | number | ✅ | Distribution modulus q (0.2–0.4) |
| `method` | string | ❌ | `"Andreasen"` (default) or `"FunkDinger"` |

---

## 3. PSD — Andreasen

### `POST /psd/andreasen`

Calculates ideal mass fractions per Andreasen continuous distribution: `P(D) = (D/Dmax)^q`

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0, "isFixed": false },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0,  "isFixed": false },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0,  "isFixed": false },
    { "dMin_mm": 0.01, "dMax_mm": 0.1,  "isFixed": false }
  ],
  "q": 0.26
}
```

**Response:**
```json
{
  "method": "Andreasen",
  "q": 0.26,
  "Dmin_mm": 0.01,
  "Dmax_mm": 10.0,
  "massFractions": [0.312, 0.285, 0.248, 0.155],
  "massFractionsRoundedPercent": [31, 29, 25, 15]
}
```

---

## 4. PSD — Funk-Dinger

### `POST /psd/funk-dinger`

Modified Andreasen with non-zero Dmin: `P(D) = (D^q − Dmin^q) / (Dmax^q − Dmin^q)`  
Recommended `Dmin_mm = 0.001` for realistic fine particle packing.

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0 },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0  },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0  },
    { "dMin_mm": 0.01, "dMax_mm": 0.1  }
  ],
  "q": 0.26,
  "Dmin_mm": 0.001
}
```

**Response:** Same shape as Andreasen, `"method": "FunkDinger"`.

---

## 5. Packing — CPM

### `POST /packing/cpm`

Compressible Packing Model (de Larrard 1999). Accounts for wall effects and compaction.

**Request body:**
```json
{
  "massFractions": [0.31, 0.28, 0.25, 0.16],
  "densities_kgm3": [2700, 2700, 2700, 2700],
  "diameters_mm": [7.5, 3.0, 0.55, 0.055],
  "compactionPressure_MPa": 10
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `massFractions` | number[] | ✅ | Mass fraction of each fraction (must sum to 1) |
| `densities_kgm3` | number[] | ✅ | Density of each fraction in kg/m³ |
| `diameters_mm` | number[] | ✅ | Representative diameter of each fraction in mm |
| `compactionPressure_MPa` | number | ❌ | Applied compaction pressure (default: 0) |

**Response:**
```json
{
  "packingFraction": 0.748,
  "porosity": 0.252,
  "bulkDensity_kgm3": 2017,
  "method": "CPM"
}
```

---

## 6. Packing — Furnas

### `POST /packing/furnas`

Furnas model for multi-component packing (Furnas 1931). Simpler than CPM, no compaction.

**Request body:** Same schema as CPM, `compactionPressure_MPa` ignored.

---

## 7. Participation

### `POST /participation`

Reacted mass fraction of each size fraction during a firing. It uses the same shrinking-core grain reaction as §1 ([`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/FULL_PHASE_EQUILIBRIUM.md) Step 2):
- `δ(T, t) = δ_ref · √(t / t_ref) · exp(−E / (2R) · (1/T − 1/T_ref))`
- `X = 1 − (1 − 2δ/d)³`, and `X = 1` when 2δ ≥ d.

**Request body** (`ParticipationDto`):
```json
{
  "fractions": [
    { "materialId": "alumina_tabular", "dMin_mm": 5.0, "dMax_mm": 10.0, "massFraction": 0.31 },
    { "materialId": "alumina_tabular", "dMin_mm": 1.0, "dMax_mm": 5.0,  "massFraction": 0.28 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "massFraction": 0.25 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "d50_mm": 0.05, "massFraction": 0.16 }
  ],
  "temperature": 1450,
  "holdTime_hours": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions[]` | `ParticipationFractionDto[]` | ✅ | Size fractions |
| `fractions[].dMin_mm`, `dMax_mm` | number | ✅ | Sieve limits, mm |
| `fractions[].d50_mm` | number | ❌ | Representative diameter, mm; default `(dMin_mm + dMax_mm) / 2` |
| `fractions[].massFraction` | number | ✅ | 0–1 |
| `fractions[].materialId` | string | ❌ | Library id; E = its `activationEnergy_Jmol`, otherwise `GRAIN_REACTION_CONSTANTS.defaultActivationEnergy_Jmol` |
| `temperature` | number | ❌ | °C, 500–2000; default the reference 1450 °C |
| `holdTime_hours` | number | ❌ | h, 0.1–100; default 2 |

At the reference temperature, E has no effect and δ = δ_ref = 0.1 mm.

**Response** (`ParticipationResultDto`):
```json
{
  "totalParticipation": 0.4221,
  "participationFactors": [
    { "fractionIndex": 0, "dMin_mm": 5.0, "dMax_mm": 10.0, "dMean_mm": 7.5, "massFraction": 0.31,
      "penetrationDepth_mm": 0.1, "participationFactor": 0.0779, "effectiveParticipation": 0.0241 }
  ],
  "normalizedParticipation": [
    { "fractionIndex": 0, "normalizedParticipation": 0.0572 }
  ]
}
```

| Field | Description |
|-------|-------------|
| `dMean_mm` | diameter used: `d50_mm`, or `(dMin_mm + dMax_mm) / 2` |
| `penetrationDepth_mm` | δ(T, t) of the fraction's material |
| `participationFactor` | X, reacted mass fraction of the fraction (0–1) |
| `effectiveParticipation` | X · `massFraction` |
| `totalParticipation` | Σ effective: reacted mass fraction of the whole mix |
| `normalizedParticipation` | share of the reacted mass coming from each fraction |

---

## 8. Water Demand

### `POST /water-demand`

Calculates water demand as % by mass: `waterDemand = workabilityFactor × (1 − φ) × 100`

| Workability | Factor | Typical use |
|-------------|--------|-------------|
| `FIRM` | 0.38 | Vibration-intensive placement |
| `STANDARD` | 0.42 | Balanced flow and strength (default) |
| `FLOWABLE` | 0.50 | Self-flowing castables |

**Request body:**
```json
{
  "packingFraction": 0.74,
  "workability": "STANDARD"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `packingFraction` | number | ✅ | Packing fraction φ (0–1) |
| `workability` | string | ❌ | `FIRM`, `STANDARD` (default), or `FLOWABLE` |

**Response:**
```json
{ "waterDemand_pct": 10.9 }
```

---

## 9. Water Demand Range

### `POST /water-demand/range`

Returns min (FIRM), typical (STANDARD), max (FLOWABLE) water demand for a packing fraction.

**Request body:**
```json
{ "packingFraction": 0.74 }
```

**Response:**
```json
{
  "min": 9.88,
  "typical": 10.92,
  "max": 13.0
}
```

---

## 10. Shrinkage

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

Refractoriness (cone test, ASTM C24 / GOST 4069) of the fired mix, with solidus, liquidus and the temperatures at given liquid fractions, from the equilibrium of the whole fired composition (the same phase diagrams as §1, without grain size or hold time). The refractoriness is the temperature at which the equilibrium liquid reaches a critical fraction fitted to published cone values; aluminosilicates also get an empirical formula value, and ASTM C27 classes are checked. Refractoriness under load (ISO 1893) is not estimated. Every oxide and fluoride with diagram data counts; there is no oxide list in the request. Algorithm: [`REFRACTORINESS_ALGORITHM.md`](../algorithms/REFRACTORINESS_ALGORITHM.md).

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

Chemical composition of a mix of library raw materials on the **fired basis**. Mix components are the materials returned by `GET /mix-components`. Algorithm: [`MIX_COMPOSITION_ALGORITHM.md`](../algorithms/MIX_COMPOSITION_ALGORITHM.md).

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

Thermal properties of a **fired** library raw material, or mix, versus temperature. All fired phases are kept (SiC, TiN, AlN, C, … are not converted to oxides). Algorithm: [`MIX_THERMAL_ALGORITHM.md`](../algorithms/MIX_THERMAL_ALGORITHM.md).

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

## 14. Material catalogue (read-only)

Controller `MaterialCatalogController`, tag `materials`. All `GET`, `200 OK`, data from the existing library files (nothing is copied).

| Path | Query / param | Response | Errors |
|------|---------------|----------|--------|
| `/refractories` | — | `RefractoryProductSummaryDto[]`: `materialId`, `name`, `description`, `emissivityRange_K { min, max }` | — |
| `/refractories/properties` | `material` (`RefractoryThermalMaterial`), `T_K` ≥ 1 | `RefractoryProductResultDto`: `material`, `T_K`, `lambda_WmK`, `emissivity` (ε clamped to `emissivityRange_K`, λ not clamped) | 400 |
| `/materials` | `type?` (`aggregate`, `binder`, `additive`, `clay`, `glass`), `search?` (≤ 64 chars, substring of id or name) | `MaterialEntryDto[]` | 400 invalid / unknown parameter |
| `/materials/:materialId` | — | `MaterialEntryDto` | 404 |
| `/material-groups` | — | `MaterialGroupSummaryDto[]`: `group`, `route`, `label`, `count` (non-empty groups only) | — |
| `/particle-sizes` | — | `ParticleSizesDto`: `standard`, `classifications`, `cement`, `mesh`, `fepaF`, `fepaP` — each `Record<code, ParticleSizeRangeDto>` | — |
| `/mix-components` | — | `MaterialCategoryDto[]` (`group`, `label`, `materials`) | — |
| `/material-categories` | — | `MaterialCategoryDto[]` | — |
| `/:groupRoute` | `oxides`, `silicates`, `clays`, `binders`, `carbides`, `nitrides`, `borides`, `glasses`, `fluxes`, `fluorides`, `borates`, `phosphates`, `rare-earths`, `glass-formers`, `hydroxides`, `gels`, `carbonates` | `MaterialEntryDto[]` | 400 unknown route |

Rules:

- **Library list:** active entries of `ALL_MATERIALS`, unique by `materialId` (10 ids are defined twice with identical data; first occurrence wins), sorted by `orderNumber`, then `name`.
- **Groups (`/:groupRoute`, `/material-groups`):** a material with several groups appears in each. Order and labels come from `MATERIAL_GROUP_ROUTES`.
- **Categories (`/material-categories`):** each material once, under its primary group `materialGroup[0]`.
- **Mix components (`/mix-components`):** primary group in `MIX_COMPONENT_GROUPS` (binder, oxide, silicate, clay, carbide, nitride, borate, fluoride) and id not in `MIX_EXCLUDED_MATERIAL_IDS` (`paper_clay`). 67 materials today. Glasses carry silicate / oxide as secondary groups and are therefore not mix components.
- **Route order:** `/:groupRoute` is the last handler of `MaterialCatalogController`, and the controller is registered after `RefractoryController`. New static `GET /refractory/<name>` routes must be declared above it.

`MaterialEntryDto`: `materialId`, `name`, `type`, `materialGroup[]` (first = primary), `orderNumber`, `description`, `composition` (wt% as stored), `rho_true_after_firing_kgm3`, `availableParticleSizes?`, `particleSize?`, `thermalProperties?` (`thermalConductivity_WmK?`, `specificHeat_JkgK?`, `thermalExpansion_perK?`), `mechanicalProperties?`, `chemicalShrinkage_volFrac`, `activationEnergy_Jmol`, `meltingPoint_C`, `mineralogy?`, `sourceUrl?`, `supplier?`, `grade?`.

`mineralogy?` (`MaterialMineralogyDto`) is present on every mix component:
- `phases[]` (`MineralogyPhaseDto`: `phaseId`, `phase`, `formula`, `wt`): crystalline phases, wt% of the raw material as delivered;
- `amorphous_wt`: calculated remainder = composition minus the phase oxides;
- `source`.

See [`MINERAL_PHASE_IDENTIFICATION.md`](../algorithms/MINERAL_PHASE_IDENTIFICATION.md).

---

## Common Types

The former eight-field `OxideCompositionDto` (`SiO2`, `Al2O3`, `CaO`, `MgO`, `Fe2O3`, `K2O`, `Na2O`, `TiO2`) is removed: the mix endpoints take library fractions, and glass viscosity takes its own composition record (§12).

### `FractionInputDto`

```typescript
{
  materialId?: string,      // optional material reference
  dMin_mm:     number,      // lower sieve size
  dMax_mm:     number,      // upper sieve size
  isFixed?:    boolean,     // lock this fraction's mass
  massFraction?: number,    // 0–1, required if isFixed=true
  density_kgm3?: number,    // 1000–4000 kg/m³
}
```

---

## Error Responses

All endpoints return standard NestJS error format on failure:

```json
{
  "statusCode": 400,
  "message": ["fractions must be an array", "temperature must be a number"],
  "error": "Bad Request"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error or out-of-range input |
| 404 | Resource not found |
| 500 | Internal calculation error |

---

## Controller prefix note

The global prefix in `main.ts` is `api/v1`. The controller is decorated with `@Controller('refractory')` (no extra prefix). Full path: `/api/v1/refractory/<endpoint>`.

> **Current bug:** The controller is currently decorated with `@Controller('api/v1/refractory')` causing double prefix `/api/v1/api/v1/refractory`. This must be fixed — see implementation note below.

---

## Implementation Status

| Endpoint | DTO exists | Controller method | Implemented |
|----------|-----------|-------------------|-------------|
| `/phase-equilibrium` | 🔄 fractions-based DTOs | ✅ | 🔄 phase diagrams + grain reaction ([`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/FULL_PHASE_EQUILIBRIUM.md)) |
| `/blend-optimization` | ✅ | ✅ | ✅ |
| `/psd/andreasen` | ❌ needs DTO | ❌ | ✅ service |
| `/psd/funk-dinger` | ❌ needs DTO | ❌ | ✅ service |
| `/packing/cpm` | ✅ | ❌ stub | ✅ service |
| `/packing/furnas` | ✅ | ❌ stub | ✅ service |
| `/participation` | 🔄 split `ParticipationFractionDto`; `materialId?`, `d50_mm?`, `temperature?`, `holdTime_hours?` | ✅ | 🔄 shrinking-core reacted fraction |
| `/water-demand` | ❌ needs DTO | ❌ | ✅ service |
| `/water-demand/range` | ❌ needs DTO | ❌ | ✅ service |
| `/shrinkage` | ✅ | ❌ | ✅ service |
| `/refractoriness` | 🔄 fractions-based DTOs | ✅ | 🔄 phase-diagram melting ([`REFRACTORINESS_ALGORITHM.md`](../algorithms/REFRACTORINESS_ALGORITHM.md)) |
| `/glass-viscosity` | ✅ | ❌ | ✅ service |
| `/mix/composition` | ✅ | ✅ | ✅ (tests: `mix-composition.service.spec.ts`, `mix-composition-input.dto.spec.ts`) |
| `/mix/thermal` | ✅ | ✅ | ✅ (tests: `mix-thermal.service.spec.ts`, `mix-thermal-utils.spec.ts`) |
| Catalogue `GET` routes (§14) | ✅ | ✅ `MaterialCatalogController` | ✅ (tests: catalogue service specs, DTO specs, `material-catalog.controller.spec.ts`) |

