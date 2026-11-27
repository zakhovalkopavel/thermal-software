# Phase Equilibrium

**Parent index:** [REFRACTORY_API_SPEC.md](./REFRACTORY_API_SPEC.md)

---

### `POST /phase-equilibrium`

Phases of a mix of library raw materials fired at `temperature` for `holdTime_hours`:
- equilibrium of the matrix (reacted shells) via the selected algorithm mode;
- unreacted original phases of coarse grains (shrinking-core + library `mineralogy`).

Default engine is the **CALPHAD estimate** (compound-data + eutectic / molten-salt anchors + glass models). Digitized diagrams stay optional legacy until validated. See [`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md); diagram detail: [`LEGACY_DIAGRAM_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/LEGACY_DIAGRAM_PHASE_EQUILIBRIUM.md).

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
  "totalMass": 1000,
  "algorithmMode": "calphad"
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
| `algorithmMode` | `'calphad' \| 'legacy' \| 'compare'` | ❌ | Default `calphad`. `compare` returns CALPHAD + legacy side by side |
| `legacyVariant` | `'eutectic' \| 'diagram'` | ❌ | When `legacy` or `compare`; default `eutectic`. `diagram` only after validated diagram data |

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
