# Mix Composition Algorithm

**Service:** `backend/src/modules/refractory/services/composition/mix-composition.service.ts` (`MixCompositionService`)  
**Endpoint:** `POST /api/v1/refractory/mix/composition` ([API spec §15](../api/REFRACTORY_API_SPEC.md))  
**Constants:** `constants/mix-composition.constants.ts` (`MIX_COMPOSITION_CONSTANTS`)  
**Tests:** `backend/test/unit/refractory/services/composition/mix-composition.service.spec.ts`

---

## Purpose

A refractory mix is a mechanical mix of library raw materials (binders, oxides, silicates, clays, carbides, nitrides). The chemical endpoints (`/phase-equilibrium`, `/mineral-phases`, `/refractoriness`, `/thermal-conductivity`) accept only eight oxides in wt% and do not rescale partial compositions. This algorithm converts a mix into:

- the composition of the **fired** mix (volatile components removed);
- the eight accepted oxides rescaled to 100 %, ready for the chemical endpoints;
- the share of the fired mix the chemical endpoints cannot see (other oxides, non-oxides), with a warning when it is significant;
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
| 2 | Accepted oxide | `SiO2`, `Al2O3`, `CaO`, `MgO`, `Fe2O3`, `K2O`, `Na2O`, `TiO2` | `acceptedOxides_wt` |
| 3 | Other oxide | regex `^(?:[A-Z][a-z]?\d*)+O\d*$` (`B2O3`, `FeO`, `SO3`, `Cr2O3`, `Pr6O11`, …) | `otherOxides_wt[k]` |
| 4 | Metal impurity | `Fe`, `Ti`, `Si`, `Al`, `Ca`, `Mg`, `Na`, `K`, `Mn`, `Zr`, `La`, `Cr` with value **< 1 wt% of its own material** | dropped (`droppedMetals_wt`) |
| 5 | Carbon | `C` | `nonOxideComponents_wt.carbon` |
| 6 | Non-oxide | anything else (`SiC`, `TiC`, `AlN`, `BN`, `N`, `O`, metal keys ≥ 1 wt%, `Grog`, …) | `.carbide` / `.nitride` if the material's primary group is carbide / nitride, otherwise `.other` |

Examples: silicon nitride `{ Si3N4: 100 }` → 100 % nitride; titanium carbide `{ TiC: 98.5, TiO2: 0.8, C: 0.4, Fe: 0.3 }` → carbide 98.5, TiO2 0.8, carbon 0.4, Fe 0.3 dropped; raku clay `Grog: 15` → other.

## Step 2 — mix and convert to the fired basis

| Quantity | Formula |
|----------|---------|
| Raw mix | `c_raw,k = Σᵢ wᵢ · cᵢ,k` |
| Loss on ignition | `LOI = Σ_{k ∈ class 1} c_raw,k` (wt% of the raw mix) |
| Fired mass base | `F = Σ_{k ∈ classes 2, 3, 5, 6} c_raw,k` (dropped impurities excluded; 400 if F = 0) |
| Fired share | `c_fired,k = 100 · c_raw,k / F` → `acceptedOxides_wt`, `otherOxides_wt`, `nonOxideComponents_wt` |
| Dropped metals | `100 · Σ_{k ∈ class 4} c_raw,k / F` |
| Normalised accepted oxides | `100 · c_fired,k / Σ_{k ∈ class 2} c_fired,k` (empty if no accepted oxide) |

## Step 3 — true density of the fired mix

Fired mass fraction of each material, with `LOIᵢ` the class-1 total of material `i`:

`w′ᵢ = wᵢ · (100 − LOIᵢ) / Σⱼ wⱼ · (100 − LOIⱼ)`

`ρ_mix = 1 / Σᵢ (w′ᵢ / ρᵢ)`

## Step 4 — reliability warning

If `Σ otherOxides_wt + Σ nonOxideComponents_wt > 5` (% of fired mass), one warning is returned: the chemical analyses use only the accepted oxides and are less reliable. Exactly 5 % gives no warning.

## Worked example

70 % `alumina_tabular` (`Al2O3 99.5, SiO2 0.1, CaO 0.1, Fe2O3 0.1, Na2O 0.2`, ρ 3950) + 30 % `kaolinite` (`Al2O3 39.5, SiO2 46.5, H2O 14`, ρ 2600):

- LOI = 0.3 · 14 = 4.2
- F = 0.7 · 100 + 0.3 · 86 = 95.8
- Al2O3 = 100 · (0.7 · 99.5 + 0.3 · 39.5) / 95.8 = 85.07 %
- ρ_mix = 1 / (70/95.8/3950 + 25.8/95.8/2600) ≈ 3465 kg/m³

## Limits and extensions

- Only the eight accepted oxides reach the chemical endpoints; the rest is reported and flagged, not modelled.
- Enabling new mix groups (glass frits, fluoride salts, sulfates, nitrates, chlorides, borates, phosphates) requires reviewing the classes: new non-oxide buckets (fluoride, chloride) and loss-on-ignition keys for salts that decompose on firing. Class 3 already covers `SO3` and `N2O5`.
