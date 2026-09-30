# 01 — Shared Physics

**Services:** `CombustionEnthalpyService`, `ProductEquilibriumService`, `FlameSolverService`
**Utils:** `utils/element-balance.util.ts`, `utils/fuel-resolver.util.ts`

## 1.1 Enthalpy reference

All streams carry **absolute (formation-referenced) enthalpy**, reference 298.15 K:

| Stream | Specific enthalpy |
|---|---|
| gas species i | `h_i(T) = ΔHf_i(298) + ∫₂₉₈ᵀ cp_i dT` [J/mol] — NASA-7 (`a6` encodes ΔHf) |
| condensed fuel | `h_fuel(T) = ΔHf_fuel + c_fuel·(T − 298.15)` [J/kg] |
| ash | `h_ash(T) = c_ash·(T − 298.15)`, `c_ash = ASH_CAPACITY = 1000 J/(kg·K)` |
| char (unburnt C) | `h_C(T) = M_C·c_fuel·(T − 298.15)`, `c_fuel = FUEL_CAPACITY = 1500 J/(kg·K)` |

`GasPropertiesService.absoluteEnthalpy(species, T)`: NASA-7 inside 200–6000 K; outside, the enthalpy
is extrapolated linearly with the boundary cp (continuous and monotone up to the 20 000 K solver limit).
Species without NASA data use `enthalpyFormation298 + enthalpy()`.
`entropy()` and `gibbsEnergy()` use NASA-7 the same way (`G = H − T·S` outside the range).

> The mean-cp route `cpMixture(y, T, T0)` truncates the integral at the default cp equation's upper
> limit (≈ 1500 K for N2) while dividing by the full ΔT. The previous combustion model used it and
> overestimated flame temperatures (recuperator example: 4539 K vs 2367 K now). The combustion
> module no longer uses mean cp.

### Fuel formation enthalpy and LHV

```
ΔHf_fuel = Σ ΔHf(complete products) + LHV          (products: CO2, H2O vapour, SO2, N2)
LHV      = ΔHf_fuel − Σ ΔHf(complete products)
```

A fuel record gives `heatOfFormation_J_kg` (used as is) or `lhv_J_kg` (ΔHf derived); one of them is
required. Both are on the as-fired basis: moisture is part of the fuel (its H and O are in the
element inventory, its enthalpy is inside ΔHf_fuel) and leaves as H2O vapour.
Gaseous fuel LHV: `(Σ n_i·h_i(298) − Σ ΔHf(complete products)) / m_gas`.

## 1.2 Fuel data (`data/fuels/`)

Charcoal presets ported **verbatim** from `legacy/furnaceCombustion/classes/FuelDatabase.js`
(verified numbers, not to be changed):

| id | C | H | O | N | ash | ΔHf [J/kg] | cp [J/(kg·K)] | porosity | ρ_bulk [kg/m³] | d_p [m] | tortuosity | activity | emissivity | ref |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `charcoal-briquette` | 0.85 | 0.03 | 0.10 | 0.01 | 0.01 | −8 500 000 | 1100 | 0.45 | 450 | 0.05 | 3.0 | 1.0 | 0.85 | `Basu2006`, p. 67 |
| `charcoal-oak` | 0.82 | 0.04 | 0.12 | 0.01 | 0.01 | −8 200 000 | 1050 | 0.50 | 380 | 0.03 | 2.8 | 1.1 | 0.83 | `VanKrevelen1993`, p. 235 |

`ref` is a `RefKey` ([REFERENCES](../../REFERENCES.md)) with an optional `page`; it is absent for
`map-pro` (manufacturer SDS, no literature source) and for custom fuels.

Derived: briquette LHV ≈ 22.95 MJ/kg, stoichiometric dry air ≈ 10.3 kg/kg.

Gas preset `map-pro`: C3H6 0.995 + C3H8 0.005 (mole fractions; see [04](04_Mode3_Fluid.md)).

Custom solid/liquid fuels (`CondensedFuelDto`): elemental analysis C, H, O, N, S?, ash, moisture?
(mass fractions, sum = 1 ± 0.001) plus ΔHf or LHV; bed properties are optional except for mode 4.

## 1.3 Element inventory and air

```
condensed stream:  n_E = m·w_E / M_E        (E = C, H, O, N, S; moisture adds H2O)
gas stream:        n_E = Σ_i n_i·a_E,i      (atoms parsed from compound.chemicalFormula; Ar etc. are inerts)
O2_stoich          = C + H/4 + S − O/2       [mol O2]
air(O2)            : N2 = O2·(1 − pO2)/pO2,  H2O = wH2Om · m_dry_air / M_H2O
```

Atomic weights: `IUPAC2021` conventional values (`ATOMIC_MASS`). Species molar masses come from the
compound registry.

## 1.4 Product equilibrium (`ProductEquilibriumService.solve(elements, T, inerts)`)

N → N2 and S → SO2 always. With `O_avail = O − 2S`:

| Regime | Condition | Products |
|---|---|---|
| lean / stoichiometric | `O_avail ≥ 2C + H/2` | CO2, H2O, surplus O2 |
| char | `O_avail ≤ C` | all O as CO, remaining C as char, all H as H2 |
| rich | otherwise | CO, CO2, H2, H2O from the water-gas shift |

Rich regime: with `E = O_avail − C` (O left after C → CO) and `x = n(CO2)`:

```
CO = C − x,  CO2 = x,  H2O = E − x,  H2 = H/2 − E + x
Kp(T) · (C − x)(E − x) = x · (H/2 − E + x),     Kp = exp(−ΔG°_WGS / RT)
x ∈ [max(0, E − H/2), min(C, E)]               (brentq, tol 1e-12·(x_max − x_min))
```

`ΔG°` from `GasPropertiesService.gibbsEnergy` (NASA-7): Kp(1100 K) ≈ 1, Kp(600 K) > 20, Kp(1500 K) < 0.5.
The WGS is equimolar, so Kp does not depend on pressure. Inert species (Ar) pass through unchanged.
Insufficient O for SO2 throws.

## 1.5 Flame solver (`FlameSolverService.solveStep`)

```
H_react = Σ_streams Σ_i n_i·h_i(T_stream) + m_fuel·h_fuel(T_fuel)
g(T)    = H_prod(T, x(T)) + Q_loss − H_react,   H_prod = Σ n_j(T)·h_j(T) + m_ash·h_ash(T) + n_char·h_C(T)
T_out   = brentq(g, 50 K, 20 000 K, 1e-6 K)
```

The product distribution is re-solved at every trial T (equilibrium depends on T); H_prod increases
with T, so the root is unique. If `g(50 K) > 0` → 422 "heat release minus losses is too low";
`g(20 000 K) < 0` → 422 "would exceed 20 000 K".

Entry points:

| Method | Streams | Used by |
|---|---|---|
| `burnCondensed({ fuel, mFuel_kgs, tFuel_K, kExcessAir, tAir_K, pO2, wH2Om, heatLoss_W })` | condensed fuel + air `λ·O2_stoich` | modes 1, 2 (step 1), 3 (liquid) |
| `burnGasStream(fuelGas, air, heatLoss_W)` | two gas streams | mode 2 step 2, mode 3 (gas), mode 4 burnout |
| `solveStep({ gasStreams, condensed?, heatLoss_W })` | general | all of the above |

`excessAir` in step results = O2 supplied / O2 needed by the step's element inventory.

**Root finding.** `brentq` (`common/utils/root-finding.util.ts`, wrapper of `brent-zero-generator`)
takes an **absolute** x-tolerance, like `scipy.optimize.brentq(xtol=tol)`; the library adds
`2·ε·|x|`, so every step moves at least one ulp and the search always terminates.

## 1.6 Constants (`constants/combustion.constants.ts`, `COMBUSTION`)

| Name | Value | Use |
|---|---|---|
| `FUEL_CAPACITY_J_KGK` | 1500 | default fuel cp, char cp |
| `ASH_CAPACITY_J_KGK` | 1000 | ash cp |
| `ATMOSPHERIC_PRESSURE_PA` | 101 325 | standard atmosphere |
| `FLAME_T_MIN_K`, `FLAME_T_MAX_K`, `FLAME_ROOT_TOL` | 50, 20 000, 1e-6 | flame solver bracket and tolerance [K] |
| `DEFAULT_PO2`, `DEFAULT_W_H2OM` | 0.21, 0 | air defaults |
| `T_REF_K` | 298.15 | formation enthalpy reference, default fuel temperature |
| `WGS_ROOT_REL_TOL` | 1e-12 | WGS extent tolerance relative to its bracket |
| `ELEMENT_BALANCE_TOL` | 1e-9 | target relative element residual (reported as `elementBalanceResidual`, checked in tests) |

## 1.7 Validation (unit tests)

- H(298) = ΔHf for all NASA species (±0.5 kJ/mol; NO/NO2 ±1.5), enthalpy monotone to 10 000 K, S298
- pure C in O2 releases −ΔHf(CO2); CH4 LHV ≈ 50 MJ/kg; LHV ⇄ ΔHf round trip; briquette LHV ≈ 22.95 MJ/kg
- lean / rich / very rich regimes; WGS satisfied at the solved composition
- element residual < 1e-9; energy residual < 0.01 K-equivalent (residual / (m_gas · 1000 J/(kg·K)))
- SO2/SO3 NASA-7 coefficient sets were swapped (low/high) in the compound files and are fixed
