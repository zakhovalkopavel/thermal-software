# Helmholtz EOS density (CoolProp)

**Module:** `backend/src/modules/thermodynamics/utils/density/`  
**API wiring:** `GasDensity` → fluid / compound / mixture property paths  
**Refs:** [CoolProp]

## Scope

Single-phase **gas** mass density \(\rho(T,P)\) from multi-fluid Helmholtz
equations of state vendored from CoolProp. Residual thermal conductivity
\(\lambda^r(T,\rho)\) uses this \(\rho\) via
[`NISTIR_8209_THERMAL_CONDUCTIVITY.md`](NISTIR_8209_THERMAL_CONDUCTIVITY.md).

When a species has no CoolProp fluid EOS (`coolpropKey` absent), density uses
**Peng–Robinson** if \(T_c\), \(P_c\), \(\omega\) are on the compound, else
**limited ideal gas** (see `GAS_DENSITY.md`). Missing **binary** CoolProp pair
rows do **not** leave Helmholtz: reducing uses estimated \(\beta,\gamma\) and
\(F_{ij}=0\) (see below).

## Source files

| Path | Role |
|------|------|
| `shared/sources/coolprop/fluids/<NAME>.json` | Pure-fluid EOS (reducing state, \(\alpha^r\) terms) |
| `shared/sources/coolprop/mixture_binary_pairs.json` | \(\beta_T,\gamma_T,\beta_V,\gamma_V\), departure name, \(F_{ij}\) |
| `shared/sources/coolprop/mixture_departure_functions.json` | Excess \(\alpha^E\) term sets |

Provenance: `shared/sources/coolprop/README.md`.

## Compound link

Optional `CompoundValue.coolpropKey` (CoolProp `INFO.NAME`, e.g. `"Nitrogen"`).
Compound-data `coolprop` (CAS → CoolProp `INFO.NAME`). Species without a
CoolProp fluid file omit the key.

## Pressure equation

\[
p = \rho R T \bigl[1 + \delta (\partial\alpha^r/\partial\delta)_\tau\bigr]
\]

with \(\delta=\rho/\rho_r\), \(\tau=T_r/T\), \(R\) the universal gas constant,
\(\rho\) molar. Mass density = \(\rho\cdot M\).

Root for \(\rho\) via approved `brentq` (`HELMHOLTZ_DENSITY` bracket constants).
v1 assumes a single-phase gas bracket from an ideal-gas guess; no-bracket /
two-phase cases throw.

## Pure fluid

1. Load EOS via `CoolpropHelmholtzData.loadFluid(coolpropKey)`.
2. \(T_r\), \(\rho_r\) from `EOS[0].STATES.reducing`.
3. \((\partial\alpha^r/\partial\delta)_\tau\) from `HelmholtzResidual` over
   Power / Exponential / Gaussian / NonAnalytic / GaoB term blocks.
4. Solve \(p(\rho,T)=P\).

## Mixture

1. Reducing \(T_r(x)\), \(\rho_r(x)=1/v_r(x)\) — Kunz–Wagner / CoolProp
   `GERG2008ReducingFunction` (`HelmholtzMixtureReducing`):

\[
Y_r = \sum_i x_i^2 Y_{c,i}
  + \sum_{i<j} 2\beta_{ij}\gamma_{ij} Y_{c,ij}\,
    x_i x_j\frac{x_i+x_j}{\beta_{ij}^2 x_i + x_j}
\]

JSON \(\beta\) is oriented to `(Name1,Name2)`; the reverse order uses \(1/\beta\).
Missing pair rows → `HelmholtzBinaryDefaults` (below).

2. Residual (pressure needs \(\delta\)-derivative only):

\[
\alpha^r = \sum_i x_i\,\alpha^r_i(\delta,\tau)
  + \sum_{i<j} x_i x_j F_{ij}\,\alpha^r_{ij}(\delta,\tau)
\]

Departure types: `Exponential`, `GERG-2008`, `Gaussian+Exponential`.
When \(F_{ij}=0\) (no pair / no departure function), the excess term is omitted.

## Missing binary parameters

Implemented in `HelmholtzBinaryDefaults` /
`modules/thermodynamics/constants/helmholtz-binary-defaults.constants.ts`.

### Rule 1 — Lorentz–Berthelot (default)

When no CoolProp binary row exists:

\[
\beta_{T,ij}=\gamma_{T,ij}=\beta_{v,ij}=\gamma_{v,ij}=1,\quad F_{ij}=0
\]

Reducing cross terms become the usual geometric \(T_{c}\) mean and Lorentz volume
mean. Suitable for chemically similar components of comparable size.

### Rule 2 — arithmetic \(\gamma_T\) (asymmetric)

When \(\max(T_c)/\min(T_c) \ge\) `ASYMMETRIC_TC_RATIO` (2), or either fluid is
Hydrogen / Helium / Neon:

\[
\gamma_{T,ij}=\frac{T_{c,i}+T_{c,j}}{2\sqrt{T_{c,i}T_{c,j}}},\quad
\beta_{T,ij}=\beta_{v,ij}=\gamma_{v,ij}=1,\quad F_{ij}=0
\]

Improves reducing temperature for quantum / heavy pairs without fitted BIPs.

## Classes

| Class | Role |
|-------|------|
| `CoolpropHelmholtzData` | Cached JSON loader |
| `HelmholtzResidual` | \((\partial\alpha^r/\partial\delta)_\tau\) |
| `HelmholtzBinaryDefaults` | CoolProp BIP or Rule 1 / Rule 2 estimate |
| `HelmholtzMixtureReducing` | \(T_r\), \(\rho_r\) |
| `HelmholtzDensity` | `brentq` density (pure / mix) |
| `GasDensity` | API orchestration + ideal-gas fallback |

## Fallback

See [`GAS_DENSITY.md`](./GAS_DENSITY.md) for the full CoolProp → Peng–Robinson →
limited ideal-gas ladder. This document covers only the Helmholtz branch.
