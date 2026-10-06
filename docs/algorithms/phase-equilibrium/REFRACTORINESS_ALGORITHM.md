# Refractoriness Algorithm (cone refractoriness and equilibrium melting of the fired mix)

**Service:** `backend/src/modules/refractory/services/composition/refractoriness.service.ts` (`RefractorinessService`, rewritten)  
**Endpoint:** `POST /api/v1/refractory/refractoriness` ([API spec §11](../../api/REFRACTORY_API_SPEC.md))  
**Constants:** `constants/refractoriness.constants.ts` (`REFRACTORINESS_CONSTANTS`)  
**Data:** `data/refractoriness/` (published cone values of reference materials, ASTM C24 cone temperatures, ASTM C27 classes, aluminosilicate formula with its validity range; every entry with a `DataSource`)  
**Uses:** `MixCompositionService` (fired composition), the equilibrium of one composition of [FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md) (Step 5, main system + subsystems), `data/phase-diagrams/`  
**Tests:** `backend/test/unit/refractory/services/composition/refractoriness.service.spec.ts`, `backend/test/unit/refractory/services/composition/refractoriness-calibration.spec.ts`, `backend/test/unit/refractory/dto/refractoriness-input.dto.spec.ts`, `backend/test/unit/refractory/utils/phase-diagram/find-temperature-at-liquid.util.spec.ts`, `backend/test/unit/refractory/utils/refractoriness/`, `backend/test/unit/refractory/data/refractoriness-sources.spec.ts`

---

## Purpose

The **refractoriness** of the fired mix: the temperature at which a cone of the ground material bends under its own weight in the cone test (ASTM C24 pyrometric cone equivalent, GOST 4069 refractoriness). The cone bends once enough liquid has formed, so the estimate comes from how the mix melts, on the same sourced phase diagrams as `/phase-equilibrium`:
- **refractoriness:** the temperature at which the equilibrium liquid reaches the critical fraction L\* fitted to published cone values (Step 4), with its cone equivalent and uncertainty; for aluminosilicates also the empirical formula (Step 5), and the ASTM C27 check (Step 6);
- **solidus:** the first liquid;
- **liquidus:** the body is fully molten, except the inert phases;
- **temperatures at given liquid fractions** (for example 10, 25 and 50 % liquid).

Refractoriness under load (ISO 1893, T0.5 / T1 / T2) is not estimated: it depends on grain size, bond and porosity, not only on the composition.

Every oxide and fluoride with diagram data counts; the rest is reported as `unmodelled`. There is no oxide list in the request: the input is the mix itself.

It replaces the earlier model:
- `T = 1400 °C + Σ wt% · effect`, with one "effect" per component (Al2O3 +800 K, Na2O −900 K, …) and no source;
- the lookup keys of `COMPONENT_PROPERTIES` (`AL2O3`, `SIO2`, …) never matched the request keys (`Al2O3`, `SiO2`, …) except `K2O`, so every composition gave 1400 °C minus the K2O term;
- RUL T0.5 = 0.95·T and T1 = 0.97·T, and cone numbers from a fixed table;
- the request took the eight fields of `OxideCompositionDto` only.

## Inputs

- `fractions[]`: `{ materialId, massFraction }` (`MixComponentInputDto`, as in `/mix/composition`). Mix components only; repeated materials add up; fractions are rescaled to Σ = 1.
- `liquidLevels_pct?`: 1–5 liquid fractions, each 1–99 %, ascending and unique. Default `REFRACTORINESS_CONSTANTS.defaultLiquidLevels_pct` = `[10, 25, 50]`. They are reporting points, not test criteria.

No particle size and no hold time: the whole body is treated as one fully reacted composition, as in a test on ground material. The grain-size-dependent phases of a real body come from `/phase-equilibrium`.

## Step 1 — fired composition

`MixCompositionService` gives the fired composition: oxides, fluorides and non-oxides on the fired basis ([MIX_COMPOSITION_ALGORITHM.md](../mix/MIX_COMPOSITION_ALGORITHM.md)).

- Carbides, nitrides and carbon are inert: they never melt and are reported as `inert_wt`.
- Oxides and fluorides without diagram data go to `unmodelled_wt`, as in phase equilibrium.

All liquid percentages are of the whole fired body, including inert and unmodelled parts.

## Step 2 — liquid fraction at T

`L(T)` = liquid % of the body from the equilibrium of one composition (main system, then extra-oxide subsystems; [FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md) Step 5), at T within `PHASE_EQUILIBRIUM_CONSTANTS.minTemperature_C`–`maxTemperature_C` (500–2000 °C).

At a fixed bulk composition the equilibrium liquid fraction does not decrease with T, so every temperature below is found by bisection (`find-temperature-at-liquid.util.ts`) to `REFRACTORINESS_CONSTANTS.temperatureTolerance_C` (1 °C).

## Step 3 — results

| Result | Definition | When not reached by 2000 °C |
|--------|------------|-----------------------------|
| `solidus_C` | lowest T with L > 0 | null + warning |
| `liquidus_C` | lowest T with L = 100 − `inert_wt` − `unmodelled_wt` | null + warning (for example alumina, Al2O3 melts at ≈ 2054 °C) |
| `liquidLevels[]` | `{ liquid_pct, temperature_C }`: lowest T with L ≥ `liquid_pct` | `temperature_C` = null + warning; also null when the level exceeds 100 − `inert_wt` − `unmodelled_wt` |

`system` and `method` (`phase-diagram` / `projected`) come from the main-system selection, with its warnings.

## Step 4 — refractoriness from the phase diagram (all mixes)

`refractoriness.temperature_C` = lowest T with `L(T) ≥ L*`, by the same bisection.

- **L\*** (`REFRACTORINESS_CONSTANTS.criticalLiquid_pct`) is not a literature constant. It is fitted in the data stage of the rework (with the phase-diagram data) on `data/refractoriness/cone-reference.data.ts`: published cone values of reference materials with their composition (kaolins, fireclays, chamotte, high-alumina, silica, mullite, magnesia where available), each with its `DataSource`. The fit minimises the RMS difference between the calculated temperature and the published cone temperature.
- **Viscosity:** if one L\* does not reproduce the reference set within the scatter of the cone test itself, the criterion gets a viscosity term from the glass code (liquid fraction needed rises with log η of the liquid). The data stage decides this from the fit and records it.
- **Uncertainty:** `uncertainty_C` = RMS residual of the fit, reported with every value.
- **Cone equivalent:** `coneEquivalent` = the ASTM C24 cone whose end point (from `data/refractoriness/cone-temperature.data.ts`, the standard's table at its heating rate) is nearest below `temperature_C`.
- **Validity:** a warning when the composition lies outside the composition range of the reference set (for example a zirconia or carbide-rich mix), and `temperature_C` = null when L\* is not reached by 2000 °C or exceeds 100 − `inert_wt` − `unmodelled_wt`.

`refractoriness-calibration.spec.ts` recomputes the fit from the reference data and checks L\* and `uncertainty_C` against the constants, so the constants cannot drift from the data.

## Step 5 — aluminosilicate formula (only inside its range)

Russian refractory textbooks give, for aluminosilicate (fireclay) compositions:

`t_refr = (360 + Al2O3 − ΣR) / 0.228` °C,

with Al2O3 and ΣR (sum of RO and R2O fluxes) in wt%, after rescaling SiO2 + Al2O3 + ΣR to 100.

- The data stage verifies the original citation and its validity range (Al2O3 range, maximum ΣR, which oxides count in ΣR) and records them in `data/refractoriness/aluminosilicate-formula.data.ts`. Without a verified citation the formula is not used.
- `refractoriness.aluminosilicateFormula_C` is reported only when the composition is inside the recorded range and SiO2 + Al2O3 + ΣR is at least the recorded share of the fired body; otherwise null with the reason.
- Check: calcined kaolin (Al2O3 45.9, ΣR 0) gives (360 + 45.9) / 0.228 ≈ 1780 °C.
- When both values exist and differ by more than 2 × `uncertainty_C`, a warning says so.

## Step 6 — ASTM C27 check

ASTM C27 classifies fireclay and high-alumina refractories by Al2O3 content and a minimum cone value. When the fired composition falls in one of its classes (`data/refractoriness/astm-c27-classes.data.ts`), `refractoriness.astmC27` = `{ class, minimumCone, minimumTemperature_C }`, and a warning is added if `temperature_C` is below that minimum. It is a check, not a third estimate.

## Outputs

See [API spec §11](../../api/REFRACTORY_API_SPEC.md): `refractoriness` (`temperature_C`, `coneEquivalent`, `uncertainty_C`, `criticalLiquid_pct`, `aluminosilicateFormula_C`, `astmC27`), `solidus_C`, `liquidus_C`, `liquidLevels[]`, `system`, `method`, `inert_wt`, `unmodelled_wt`, `warnings`.

## Code layout

| Folder | Files |
|--------|-------|
| `dto/refractoriness/` | `refractoriness-input.dto.ts` (`fractions`, `liquidLevels_pct?`), `refractoriness-result.dto.ts`, `refractoriness-estimate-result.dto.ts`, `astm-c27-check-result.dto.ts`, `liquid-level-result.dto.ts`. Removed: `refractoriness.dto.ts`, `refractoriness-components.dto.ts`, `pce-result.dto.ts`, `pce-modified-result.dto.ts`, `rul-result.dto.ts`, `gost-refractoriness-result.dto.ts` |
| `constants/` | `refractoriness.constants.ts` (`defaultLiquidLevels_pct`, `maxLiquidLevels`, `temperatureTolerance_C`, `criticalLiquid_pct`, `uncertainty_C`, viscosity term if the data stage adds one) |
| `interfaces/refractoriness/` | `cone-reference.interface.ts`, `cone-temperature.interface.ts`, `astm-c27-class.interface.ts`, `aluminosilicate-formula.interface.ts` (each with `source: DataSource`) |
| `data/refractoriness/` | `cone-reference.data.ts`, `cone-temperature.data.ts`, `astm-c27-classes.data.ts`, `aluminosilicate-formula.data.ts` |
| `utils/phase-diagram/` | `find-temperature-at-liquid.util.ts` (bisection on L(T)) |
| `utils/refractoriness/` | `cone-equivalent.util.ts`, `aluminosilicate-formula.util.ts` (range check + formula), `astm-c27-check.util.ts`, `fit-critical-liquid.util.ts` (RMS fit used by the calibration test) |
| `services/composition/` | `RefractorinessService` injects `MixCompositionService` and uses `equilibrate-composition.util.ts` |

Removed:
- `interfaces/refractoriness.interface.ts` and its exports in `interfaces/index.ts`;
- `calculateRefractorinessEffect` in `data/component-properties.ts`;
- `BASE_REFRACTORINESS_C`, `RUL_TEST_LOAD_PA`, `LOW_DUTY_LIMIT_C`, `INTERMEDIATE_DUTY_LIMIT_C`, `HIGH_DUTY_LIMIT_C`, `MAX_TEMPERATURE_C` in `constants/calculation-constants.ts` (their only other user is the old `PhaseEquilibriumService`, which is rewritten); `MIN_TEMPERATURE_C` stays for `MixThermalInputDto`;
- frontend: `constants/refractoriness-standards.constants.ts` and the standard selector;
- the load-test results (`RUL` T0.5 / T1 / T2) and the GOST / ASTM C71 variants: the cone value covers ASTM C24 and GOST 4069, which measure the same cone bending.

## Tests

- **Service:**
  - kaolinite → solidus at the Al2O3–SiO2 eutectic of the data file;
  - potash feldspar → solidus at the K2O–Al2O3–SiO2 invariant of the data file;
  - tabular alumina → `liquidus_C` = null with a warning;
  - adding borax or fluorite to a chamotte mix lowers the solidus (only with recorded subsystems);
  - a mix with silicon carbide → `inert_wt` > 0; the 50 % level is null when `inert_wt` > 50;
  - levels are non-decreasing in T; the same input gives the same result;
  - `refractoriness.temperature_C` lies between solidus and liquidus; every reference material is within its stated tolerance;
  - kaolin → `aluminosilicateFormula_C` ≈ 1780 °C; magnesia, zirconia, SiC mix → formula null with a reason;
  - a high-alumina composition in an ASTM C27 class → `astmC27` filled; an estimate below the class minimum → warning;
  - `coneEquivalent` at a cone end point and just below it.
- **Calibration:** `fit-critical-liquid` on the reference data reproduces `criticalLiquid_pct` and `uncertainty_C`.
- **Sources:** every entry of `data/refractoriness/` has a `DataSource`.
- **DTO:** at least one fraction; `liquidLevels_pct` limits (1–5 values, 1–99, ascending, unique); unknown keys → 400.
- **Util:** bisection on a step and a ramp function, tolerance, not reached → null.

## Limits

- **Equilibrium:** infinite time and fine grains give the most liquid. The temperatures are therefore lower bounds for a coarse body after a short firing.
- **Cone value:** an empirical link (L\*, possibly with viscosity) fitted to published cone values; its accuracy is `uncertainty_C` inside the composition range of the reference set and unknown outside it (warning).
- **Load:** refractoriness under load is not estimated; grain skeleton, bond and porosity are not in the model.
- **Data:** as accurate as the diagrams; projected compositions and extra oxides follow the phase-equilibrium limits. Atmosphere is air, and volatiles (fluorides, borates) stay in the body.
