# 04 — Mode 3: Liquid and Gaseous Fuels

**Service:** `FluidCombustionService.calculate()` · **Endpoint:** `POST /combustion/fluid`

One-step combustion, identical to step 2 of mode 2 (fuel stream + air stream → equilibrium products).

## Gaseous fuel (`phase: "gas"`)

```
y        = normalised fuelGas mole fractions (registry species: CH4, H2, CO, CO2, N2, H2O, Ar, …)
M_fuel   = Σ y_i·M_i
LHV      = (Σ y_i·h_i(298) − Σ ΔHf(complete products)) / M_fuel
m_fuel   = mFuel_kgs or fPower_W / LHV
n_fuel,i = y_i · m_fuel / M_fuel
air      = λ · O2_per_mol(y) · m_fuel / M_fuel
T_flame  = FlameSolver.burnGasStream(fuel gas @ T_fuel, air @ T_air, heatLoss_W)
```

Ar and other inerts pass through. CH4 with λ = 1, cold air: T_flame in 2250–2400 K (no dissociation);
stoichiometric air ≈ 17.1 kg/kg.

## Liquid fuel (`phase: "liquid"`)

Elemental analysis (C, H, O, N, S, ash, moisture) with ΔHf or LHV, burned like mode 1
(`FlameSolver.burnCondensed`). Sulphur forms SO2.

## Hydrocarbon gases and MAP gas

Registry species usable in `fuelGas` besides CH4/H2/CO:

| Key | Compound | LHV [MJ/kg] |
|---|---|---|
| `C2H6` | ethane | 47.5 |
| `C3H8` | propane | 46.35 |
| `C4H10` | n-butane | 45.75 |
| `iC4H10` | isobutane | 45.6 |
| `C2H2` | acetylene | 48.2 |
| `C3H4` | propyne (methylacetylene) | — |
| `aC3H4` | propadiene (allene) | — |
| `C3H6` | propylene | 45.8 |

Compound data (`common/thermal/compound/gas/`): NASA-7 and NASA-9 read from `backend/data/nasa/nasa7.json`
/ `nasa9.json` by `nasa7Key` / `nasa9Key` (e.g. `"C3H4,propyne"`; Cp defaults to NASA-9; H, S, G(T)
come from the NASA datasets). Only sourced numbers are stored: Mr as the sum of IUPAC 2021 atomic
weights, `enthalpyFormation298` / `gibbsEnergy298` from Perry 9th ed. Table 2-95 (DIPPR 801, `Perry9`;
within 0.5 kJ/mol of the NASA-9 ΔHf), Lennard-Jones σ, ε/k from Poling 5th ed. App. B (none for allene — not listed),
viscosity and thermal conductivity as DIPPR Eq. 102 from Perry 8th ed. Tables 2-312 / 2-314 (`Perry8`),
Sutherland parameters only for C2H6, C3H8, C4H10 (Eakin & Ellington 1963, Table 1, `Eakin1963`);
the other five have no published Sutherland constant, so `TransportService` does not cover them.
Isomer keys follow mechanism names; elements come from `chemicalFormula`.

Preset `fuelId: "map-pro"` (instead of `fuelGas`): C3H6 0.995 + C3H8 0.005 (MAP-Pro type,
propylene-based; composition to be confirmed against the supplier SDS). Classic MAPP blends are given
explicitly, e.g. `{ "C3H4": 0.45, "aC3H4": 0.25, "C3H8": 0.2, "C4H10": 0.1 }`. Exactly one of
`fuelId`/`fuelGas` is required; solid presets are rejected.

Propane, λ = 1, cold air: stoichiometric air ≈ 15.6 kg/kg, T_flame 2250–2450 K; acetylene > 150 K hotter.
