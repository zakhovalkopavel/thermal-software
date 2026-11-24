# Gas density model selection

**Orchestrator:** `GasDensity` (`modules/thermodynamics/utils/density/gas-density.ts`)  
**Refs:** [CoolProp], [Poling5]

Pressure enters via the EOS root (Helmholtz / Peng–Robinson) or the ideal-gas
envelope gate. Companion transport selection:
[`CHAPMAN_ENSKOG_VISCOSITY.md`](./CHAPMAN_ENSKOG_VISCOSITY.md) (\(\mu\), dilute \(\lambda\)).

## Priority

| Priority | Condition | Model |
|----------|-----------|--------|
| 1 | Every species has CoolProp `coolpropKey` | Helmholtz EOS (`HelmholtzDensity`) |
| 2 | Every species has \(T_c\), \(P_c\), \(\omega\) | Peng–Robinson 1976 (`PengRobinson`) |
| 3 | Else, only inside ideal-gas envelope | Ideal gas \(\rho = PM/(RT)\) |
| — | Else | **Throw** (ideal gas would be badly wrong) |

```
Request ρ(T,P)
  → coolpropKey?     yes → Helmholtz
  → Tc, Pc, ω?       yes → Peng–Robinson
  → P in ideal limits? yes → PM/RT ; else throw
```

Missing CoolProp **binary pairs** still use Helmholtz with default BIPs
(`HELMHOLTZ_DENSITY.md`). Missing CoolProp **fluids** never invent \(\alpha^r\).

## Peng–Robinson

Pure and mixture (\(k_{ij}=0\)) gas-phase root of the compressibility cubic.
Needs compound-data scalars exposed on `CompoundValue`
(`criticalTemperature`, `criticalPressure`, `acentricFactor`).

Constants: `modules/thermodynamics/constants/peng-robinson.constants.ts`.

## Ideal-gas envelope

`IDEAL_GAS_DENSITY_LIMITS` (`modules/thermodynamics/constants/ideal-gas-density-limits.constants.ts`):

| Check | Limit |
|-------|--------|
| \(P/P_c\) when \(P_c\) known | \(\le 0.1\) |
| Absolute \(P\) when \(P_c\) unknown | \(\le 1.5\times 10^5\,\mathrm{Pa}\) |

Outside this envelope, callers must use Helmholtz or Peng–Robinson.
`PengRobinson.assertIdealGasAllowed` enforces the gate.
