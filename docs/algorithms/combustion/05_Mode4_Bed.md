# 05 — Mode 4: Packed Bed by Layers (Chemical Kinetics)

**Services:** `BedCombustionService`, `ChemicalKineticsService` · **Endpoint:** `POST /combustion/bed`
**Legacy:** `legacy/furnaceCombustion/furnace_combustion_model.js`, `modules/ChemicalKinetics.js`

The fuel burn rate is an **output**: blast air enters at the grate, the bed is divided into
`nLayers` layers of height `dz = H / n`, and the gas is marched upward on species molar flows [mol/s].
The bed outlet gas is burned with secondary air exactly as step 2 of mode 2.

## 5.1 Kinetics (constants verbatim from legacy, `BED_REACTIONS`)

Refs ([REFERENCES](../../REFERENCES.md)): `Laurendeau1978` pp. 221–270 (char surface reactions),
`Turns2012` pp. 120–145 (gas phase), `Higman2008` pp. 78–95 (Boudouard, water-gas).
Pressure drop: `Ergun1952`.

Char surface reactions, rate per bed volume [mol/(m³·s)], partial pressures in atm:

| id | Reaction | Rate | E [J/mol] | A |
|---|---|---|---|---|
| r1 | C + O2 → CO2 | η·act·a_s·k1·pO2 | 140 000 | 1e7 |
| r2 | 2C + O2 → 2CO (per O2) | η·act·a_s·k2·pO2 | 1.1·140 000 | 5e6 |
| r3 | C + CO2 → 2CO | η·act·a_s·k3·(pCO2 − pCO) | 2.2·140 000 | 1e5 |
| r31 | C + H2O → CO + H2 | η·act·a_s·k31·pH2O | 1.6·140 000 | 1e4 |
| r32 | C + 2H2O → CO2 + 2H2 | η·act·a_s·k32·pH2O² | 240 000 | 1e4 |
| r33 | C + 2H2 → CH4 | act·a_s·k33·pH2² | 80 000 | 1e3 |

Gas phase: r4 `2CO + O2 → 2CO2` (k4·pCO²·pO2), r41 `2H2 + O2 → 2H2O`, r42 `CH4 + 2O2 → CO2 + 2H2O`,
r43 `CO + H2O ⇌ CO2 + H2` with `r43 = k43·(pCO·pH2O − pCO2·pH2 / Kp)`, Kp from NASA-7 (legacy used a coarse fit).

```
k = A·exp(−E / (R·T_kin)),  T_kin = log-mean(T_gas, T_solid)
η = 3/φ²·(φ·coth φ − 1),   φ = R_p·√(k / D_eff);  η = 1 for φ < 0.01
a_s = 3·(1 − ε) / R_p      (external char surface per bed volume)
D_eff: DiffusionService.effectiveDiffusion (Wilke) at T_solid
```

Heats for the char balance (legacy): ΔH1 −393.5, ΔH2 −110.5 (×2 per O2), ΔH3 +172, ΔH31 +131,
ΔH32 +90, ΔH33 −75 kJ/mol.

## 5.2 Layer algorithm

For layer i (centre `z = (i + ½)·dz`):

1. **Particle size** shrinks toward the grate: `R_p = d_p·(g + (1 − g)·(i + 1)/n)/2` with `g = BED_KINETICS.PARTICLE_SIZE_GRATE_RATIO` = 0.6 (legacy had the
   reverse, largest at the grate).
2. **Gas state** at the layer inlet: ρ, μ (`TransportService.viscosityMix`), k, cp; superficial velocity
   `v = m_gas/(ρ·A)`; `h = Nu_Gunn(Re_p, Pr, ε)·k/d_p`; Ergun `ΔP = (dP/dz)·dz`.
3. **Char temperature** from the particle energy balance
   `F(T_s) = T_s − T_g − q_surf(T_s)/(h·a_s·V) = 0`, taking the **largest root** in
   `[0.5·T_g, 3000 K]` (downward scan in 25 K steps, then brentq). The largest root is the ignited
   steady state; legacy clamped `T_s ≥ max(800 K, T_g)` instead, which with 400 K blast air gives
   negligible rates.
4. **Extents** `ξ = r·V` [mol/s]. Negative surface rates (reverse Boudouard) are set to 0. Reactions
   consuming a species are scaled down together when their total demand exceeds its inlet flow
   (iterated); reactions needing an absent species are zero. The water-gas shift extent is the
   kinetic value, but not past the equilibrium extent of the post-reaction flows.
5. **Fuel consumed** `m_f = n_C·M_C / w_C` (n_C = gasified carbon); its H, O, N enter the gas as
   H2O (`min(O, H/2)`), then H2, O2, N2. Ash `m_f·w_ash` leaves at T_s.
6. **Wall loss** `Q_wall` from `MultilayerWallService` (cylinder, `a_m = D`, `b_m = dz`, generator wall
   layers) at the layer inlet gas temperature; omitted when no layers are given (adiabatic).
7. **Energy balance** (absolute enthalpies, brentq, tol 1e-10):
   `H_gas,out(T_out) = H_gas,in(T_in) + m_f·h_fuel(T_fuel) − m_ash·h_ash(T_s) − Q_wall`.

**Steam injection** (optional): a first pass finds the layer of maximum CO2 mole fraction; the second
pass adds `steamInjectionPercent`% of the gas molar flow there as H2O at `steamT_K` (legacy injected at
the running maximum during a single pass).

**Oxidation zone height**: the highest layer with CO < 1 % and O2 > 1 % (legacy criterion).

## 5.3 Burnout

```
secondary O2 = mAirSecondary_kgs  or  max(0, λ·O2_stoich(burned fuel) − O2_primary)
T_flame      = FlameSolver.burnGasStream(bed outlet @ T_step1, secondary air @ T_air2, Q_furnace)
```

`Q_furnace` is either `furnaceHeatLoss_W` or computed from a furnace wall (`diameter_m`, `length_m`,
`wallLayers`) with `MultilayerWallService` at T_flame, iterated with damping 0.5 until |ΔT| < 0.1 K.

## 5.4 Outputs and checks

Per layer: z, T_gas, T_solid, ΔT, mole fractions, carbon/fuel burn rate, burn rate per char surface
[g/(s·cm²)], all reaction extents, wall loss and wall temperatures, h, v, ΔP, D_O2/D_CO2/D_H2O.
Totals: fuel burn rate, fuel power (LHV), primary λ, generator loss, ΔP, T_step1, generator gas,
burnout step, T_flame. Element residual < 1e-9 and bed energy residual < 0.01 K-equivalent (tested).

Typical result (briquette preset, 10 m³/h at 400 K, D = 0.3 m, H = 0.5 m): all O2 is consumed in
the first layer (T_s ≈ 2700 K), above it a slow reduction zone (legacy Boudouard constants are
sluggish: E3 = 308 kJ/mol) — generator gas ≈ 16 % CO2, 6 % CO, burn rate ≈ 0.29 g/s (≈ 6.7 kW).
