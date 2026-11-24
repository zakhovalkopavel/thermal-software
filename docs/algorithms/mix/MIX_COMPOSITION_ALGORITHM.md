# Mix Composition Algorithm

**Service:** `backend/src/modules/refractory/services/composition/mix-composition.service.ts` (`MixCompositionService`)  
**Endpoint:** `POST /api/v1/refractory/mix/composition` ([API spec §13](../../api/REFRACTORY_API_SPEC.md))  
**Constants:** `constants/mix-composition.constants.ts` (`MIX_COMPOSITION_CONSTANTS`)  
**Tests:** `backend/test/unit/refractory/services/composition/mix-composition.service.spec.ts`

---

## Purpose

A refractory mix is a mechanical mix of library raw materials (binders, oxides, silicates, clays, carbides, nitrides, borates, fluorides). The calculation endpoints take the mix fractions and use this service internally for the fired composition and loss on ignition of each material: `/phase-equilibrium` ([FULL_PHASE_EQUILIBRIUM.md](../phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md)) and `/refractoriness` ([REFRACTORINESS_ALGORITHM.md](../phase-equilibrium/REFRACTORINESS_ALGORITHM.md)). No endpoint takes a fixed list of oxides any more. This algorithm converts a mix into:

- the composition of the **fired** mix (volatile components removed): every oxide, fluorides and other non-oxides;
- the true density of the fired mix.

## Inputs

- `fractions[]`: `{ materialId, massFraction }`. Each material must be a mix component (`MixComponentCatalogService.getMixComponent`: primary group in `MIX_COMPONENT_GROUPS`, not in `MIX_EXCLUDED_MATERIAL_IDS`).
- From the library, per material `i`: `composition` (wt%, key → value) and `rho_true_after_firing_kgm3` (ρᵢ).

Mass fractions are rescaled: `wᵢ = massFractionᵢ / Σ massFraction` (400 if the sum is 0). Repeated materials simply add up.

## Step 1 — classify composition keys

For each key `k` of each material, the first matching class wins:

| # | Class | Keys | Destination |
|---|-------|------|-------------|
| 1 | Loss on ignition | `H2O`, `CO2`, `OH`, `Organic` | `lossOnIgnition_wt` |
| 2 | Oxide | regex `^(?:[A-Z][a-z]?\d*)+O\d*$` (`SiO2`, `Al2O3`, `CaO`, `B2O3`, `FeO`, `SO3`, `Cr2O3`, `Pr6O11`, …) | `oxides_wt[k]` |
| 3 | Fluoride | `CaF2`, `NaF`, `KF`, `MgF2`, `AlF3`, `LiF` | `nonOxideComponents_wt.fluoride` |
| 4 | Metal impurity | `Fe`, `Ti`, `Si`, `Al`, `Ca`, `Mg`, `Na`, `K`, `Mn`, `Zr`, `La`, `Cr` with value **< 1 wt% of its own material** | dropped (`droppedMetals_wt`) |
| 5 | Carbon | `C` | `nonOxideComponents_wt.carbon` |
| 6 | Non-oxide | anything else (`SiC`, `TiC`, `AlN`, `BN`, `N`, `O`, metal keys ≥ 1 wt%, `Grog`, …) | `.carbide` / `.nitride` if the material's primary group is carbide / nitride, otherwise `.other` |

Examples: silicon nitride `{ Si3N4: 100 }` → 100 % nitride; titanium carbide `{ TiC: 98.5, TiO2: 0.8, C: 0.4, Fe: 0.3 }` → carbide 98.5, TiO2 0.8, carbon 0.4, Fe 0.3 dropped; raku clay `Grog: 15` → other; borax `{ Na2O: 16.3, B2O3: 36.5, H2O: 47.2 }` → LOI 47.2, oxides Na2O and B2O3; fluorite `{ CaF2: 100 }` → fluoride 100.

Library fluorides are stored as compounds (`{ CaF2: 100 }`, `{ NaF: 100 }`, `{ KF: 100 }`, `{ MgF2: 100 }`), not as elements, so that their cations are not taken for metal impurities.

## Step 2 — mix and convert to the fired basis

| Quantity | Formula |
|----------|---------|
| Raw mix | `c_raw,k = Σᵢ wᵢ · cᵢ,k` |
| Loss on ignition | `LOI = Σ_{k ∈ class 1} c_raw,k` (wt% of the raw mix) |
| Fired mass base | `F = Σ_{k ∈ classes 2, 3, 5, 6} c_raw,k` (dropped impurities excluded; 400 if F = 0) |
| Fired share | `c_fired,k = 100 · c_raw,k / F` → `oxides_wt`, `nonOxideComponents_wt` |
| Dropped metals | `100 · Σ_{k ∈ class 4} c_raw,k / F` |

## Step 3 — true density of the fired mix

Fired mass fraction of each material, with `LOIᵢ` the class-1 total of material `i`:

`w′ᵢ = wᵢ · (100 − LOIᵢ) / Σⱼ wⱼ · (100 − LOIⱼ)`

`ρ_mix = 1 / Σᵢ (w′ᵢ / ρᵢ)`

## Step 4 — warning

If `nonOxideComponents_wt.other` > 0, one warning lists its keys (for example `Grog` of raku clay): no calculation models them.

## Worked example

70 % `alumina_tabular` (`Al2O3 99.5, SiO2 0.1, CaO 0.1, Fe2O3 0.1, Na2O 0.2`, ρ 3950) + 30 % `kaolinite` (`Al2O3 39.5, SiO2 46.5, H2O 14`, ρ 2600):

- LOI = 0.3 · 14 = 4.2
- F = 0.7 · 100 + 0.3 · 86 = 95.8
- Al2O3 = 100 · (0.7 · 99.5 + 0.3 · 39.5) / 95.8 = 85.07 %
- ρ_mix = 1 / (70/95.8/3950 + 25.8/95.8/2600) ≈ 3465 kg/m³

## Limits and extensions

- The composition is reported as it is; what each calculation can model (phase-diagram data, inert phases, `unmodelled`) is decided by that calculation.
- Fluoride volatilisation on firing (NaF, KF vapour; SiF4 with silica) is not modelled: fluorides stay in the fired mass.
- Enabling further mix groups (glass frits, sulfates, nitrates, chlorides, phosphates) requires reviewing the classes: new non-oxide buckets (chloride) and loss-on-ignition keys for salts that decompose on firing. Class 2 already covers `SO3`, `N2O5` and `P2O5`.
- Former fields: `acceptedOxides_wt`, `acceptedOxides_normalized` and `otherOxides_wt` (the eight-field `OxideCompositionDto` split) are replaced by `oxides_wt`, and the "> 5 % outside the accepted oxides" warning is removed.
