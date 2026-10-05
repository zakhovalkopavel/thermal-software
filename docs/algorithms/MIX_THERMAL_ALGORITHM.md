# Mix Thermal Algorithm (fired raw materials)

**Service:** `backend/src/modules/refractory/services/thermal/mix-thermal.service.ts` (`MixThermalService`)  
**Endpoint:** `POST /api/v1/refractory/mix/thermal` ([API spec §15b](../api/REFRACTORY_API_SPEC.md))  
**Constants:** `constants/mix-thermal.constants.ts` (`MIX_THERMAL_CONSTANTS`)  
**Utils:** `utils/fired-phases.util.ts`, `utils/phase-specific-heat.util.ts`, `utils/maxwell-eucken-conductivity.util.ts`; air λ from the `Air` compound (`common/thermal/compound/gas/air.ts`) via `CompoundPropertyResolver`  
**Tests:** `backend/test/unit/refractory/services/thermal/mix-thermal.service.spec.ts`, `backend/test/unit/refractory/utils/mix-thermal-utils.spec.ts`

---

## Purpose

Thermal conductivity, specific heat, density and diffusivity versus temperature of a **fired** library raw material, or of a mix of them, at a given porosity.

It replaces the use of `POST /thermal-conductivity` for library materials. That endpoint sees only the eight accepted oxides rescaled to 100 %, so non-oxide materials were calculated from their oxide impurities (fired SiC became 50 % SiO2 / 30 % Fe2O3 / 20 % Al2O3). It also used a fixed density of 2500 kg/m³.

## Inputs

- `fractions[]`: `{ materialId, massFraction }`, mix components only (as in [MIX_COMPOSITION_ALGORITHM.md](MIX_COMPOSITION_ALGORITHM.md)); one row with `massFraction: 1` for a single material.
- `temperatures_C[]`: 1–301 temperatures, each ≥ 200 K (−73.15 °C), the start of the NASA-9 solid data of SiO2, Al2O3, CaO and MgO. Below it Cp would be clamped and the phonon law (∝ 1/T) diverges.
- `porosity` P: pore volume fraction, 0–0.95.
- Per material, from the library: `composition`, `rho_true_after_firing_kgm3`, `thermalProperties.thermalConductivity_WmK` (λ_ref), `thermalProperties.specificHeat_JkgK` (c_ref).

## Step 1 — fired phases

For each material the composition keys are kept as **phases**:

- loss-on-ignition keys (`H2O`, `CO2`, `OH`, `Organic`) are removed and reported as `lossOnIgnition_wt`;
- elemental metal keys below 1 wt% of their material are dropped (same rule as the mix composition);
- every other key stays as it is (SiC stays SiC, TiN stays TiN, C stays graphite) and the phases are rescaled to Σ = 100.

Fired mass fraction of each material: `w′ᵢ = wᵢ (100 − LOIᵢ) / Σⱼ wⱼ (100 − LOIⱼ)`.
True density: `ρ_true = 1 / Σᵢ (w′ᵢ / ρᵢ)`; volume fraction `vᵢ = (w′ᵢ / ρᵢ) · ρ_true`.

## Step 2 — specific heat (Neumann–Kopp)

`c_p,i(T) = Σ_k x_k · c_p,k(T) + x_unc · c_ref,i` and `c_p(T) = Σᵢ w′ᵢ · c_p,i(T)`

- `x_k`: mass fraction of phase k in material i. `c_p,k(T) = C_p°(T) / M` from the condensed NASA-9 species of `MIX_THERMAL_CONSTANTS.phaseNasa9Species` (polymorphs in temperature order, e.g. SiO2 α-quartz → β-quartz → β-cristobalite; T clamped to the tabulated solid range).
- Phases without NASA-9 data (Y2O3, La2O3, CeO2, Mn oxides, Cr3C2, SO3, `Grog`, elemental keys ≥ 1 wt%) take the library room-temperature Cp of their material for their share `x_unc`. If the material has no library Cp, the covered phases are rescaled.
- `heatCapacityCoverage_wt` is the share of fired mass with NASA-9 data. A warning is returned when the rest exceeds 5 %.

## Step 3 — dense solid conductivity

λ_ref is the library value of the material, taken as the dense value at T_ref = 298.15 K. If the material has none, the median λ_ref of the mix components of the same primary group is used, and a warning is returned.

The temperature law comes from the dominant fired phase (the largest share):

| Law | Phases | λ_s,i(T) |
|-----|--------|----------|
| Phonon | everything else | `λ_am + (λ_ref − λ_am) · T_ref / T`, λ_am = 1.3 W/(m·K) |
| Electronic | `TiN`, `TiC`, `Cr3C2` | `λ_ref` |

λ_am is the amorphous-limit conductivity (vitreous silica at room temperature). High-λ crystals follow the umklapp 1/T decay; glassy and silicate materials (λ_ref ≈ λ_am) stay nearly constant.

Mix: Lichtenecker volume-weighted geometric mean `λ_s = exp(Σᵢ vᵢ ln λ_s,i)`. For a single material, λ_s = λ_s,1.

## Step 4 — porosity

Maxwell–Eucken, solid continuous, isolated pores filled with air:

`λ_eff = λ_s (2λ_s + λ_g − 2P(λ_s − λ_g)) / (2λ_s + λ_g + P(λ_s − λ_g))`

`λ_g(T)` is air at 1 atm from the `Air` compound: DIPPR-102 (Perry's 9th ed.), `c1·T^c2 / (1 + c3/T + c4/T²)`, 70–2000 K, clamped outside. Radiation across the pores is not modelled.

## Step 5 — density and diffusivity

`ρ_bulk = ρ_true (1 − P)`, `a = λ_eff / (ρ_bulk · c_p)`.

## Example (P = 0.2)

| Material | T, °C | λ_s, W/(m·K) | λ_eff, W/(m·K) | c_p, J/(kg·K) |
|----------|------:|-------------:|---------------:|--------------:|
| silicon_carbide | 20 / 600 / 1200 | 122 / 41.8 / 25.3 | 88.8 / 30.4 / 18.5 | 657 / 1157 / 1277 |
| alumina_tabular | 20 / 600 / 1200 | 30.5 / 11.1 / 7.1 | 22.2 / 8.1 / 5.2 | 764 / 1198 / 1294 |
| chamotte_standard | 20 / 600 / 1200 | 1.50 / 1.37 / 1.34 | 1.10 / 1.02 / 1.01 | 746 / 1150 / 1230 |
| titanium_nitride | 20 / 600 / 1200 | 19 / 19 / 19 | 13.8 / 13.8 / 13.9 | 603 / 827 / 905 |

## Limits

- λ_ref is a single room-temperature library value. The temperature law is generic, not a measured λ(T) of each material.
- Phases are the keys of the library composition. Materials stored as elements (`silicon_oxynitride`: `Si`, `N`, `O`) have no NASA-9 phase, so their Cp is the constant library value.
- No sintering, reaction or oxidation during firing (SiC is not oxidised; clay minerals are not converted to mullite). The phases of the fired clays are their oxides, which is adequate for Cp but not used for λ.
