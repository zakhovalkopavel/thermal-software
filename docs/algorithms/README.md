# Algorithms Documentation Index

**Last Updated:** May 2026
**Version:** 1.1

---

## Overview

Complete algorithmic documentation for the thermal-software calculation system.
Covers both the **Refractory module** (oxide composition calculations) and the
**Thermodynamics module** (gas-phase transport, heat transfer, radiation).

---

## 🔬 Thermodynamics Algorithms

These algorithms are implemented in `backend/src/modules/thermodynamics/` and
`backend/src/common/thermal/`. Full service method reference:
**[docs/services/THERMODYNAMICS_SERVICES.md](../services/THERMODYNAMICS_SERVICES.md)**  
Common library reference:
**[docs/services/COMMON_THERMAL_LIBRARY.md](../services/COMMON_THERMAL_LIBRARY.md)**

### Gas Thermophysical Properties

| Algorithm | Service | Formula / Model |
|-----------|---------|-----------------|
| **NASA-7 polynomial** | `GasPropertiesService` | `Cp/R = a1 + a2T + a3T² + a4T³ + a5T⁴`; two ranges at `Tswitch` |
| **NASA-9 polynomial** | `GasPropertiesService` | 9-coefficient, variable T ranges; preferred format |
| **DIPPR 107 (Aly–Lee)** | `GasPropertiesService` | `c1 + c2[c3/T/sinh(c3/T)]² + c4[c5/T/cosh(c5/T)]²` |
| **Viscosity (CoolProp / CE / Chung)** | `TransportService` | CoolProp η(T,ρ), dilute def/CE, mix Wilke/Chung — [COOLPROP_CHUNG_VISCOSITY.md](./thermodynamics/COOLPROP_CHUNG_VISCOSITY.md), [CHAPMAN_ENSKOG_VISCOSITY.md](./thermodynamics/CHAPMAN_ENSKOG_VISCOSITY.md) |
| **Eucken / mixture λ** | `TransportService` | Dilute Eucken after μ; mix HE/Chung — [MIXTURE_THERMAL_CONDUCTIVITY.md](./thermodynamics/MIXTURE_THERMAL_CONDUCTIVITY.md) |
| **Gas density** | `GasDensity` | Helmholtz → Peng–Robinson → limited ideal — [GAS_DENSITY.md](./thermodynamics/GAS_DENSITY.md), [HELMHOLTZ_DENSITY.md](./thermodynamics/HELMHOLTZ_DENSITY.md) |
| **Chapman–Enskog D** | `DiffusionService` | Poling `1.858e-3` atm form — [CHAPMAN_ENSKOG_VISCOSITY.md](./thermodynamics/CHAPMAN_ENSKOG_VISCOSITY.md) |
| **Mixture Cp** | `GasPropertiesService` | `Cp_mix = Σ xᵢ·Cpᵢ(T)` (mole fractions) |

### Dimensionless Numbers

| Number | Formula | Notes |
|--------|---------|-------|
| **Reynolds** | `Re = ρwL/μ` or `wL/ν` | `DimensionlessNumbersService` |
| **Prandtl** | `Pr = μCp/λ` | Fluid-only — no geometry |
| **Grashof** | `Gr = gβΔTL³/ν²`; `β = 2/(T_h+T_c)` | Ideal gas approximation |
| **Rayleigh** | `Ra = Gr·Pr` | Natural convection driver |

### Nusselt Correlations

| Geometry | Regime | Correlation |
|----------|--------|-------------|
| Pipe (internal) | Forced, laminar (Re < 2300) | Sieder-Tate |
| Pipe (internal) | Forced, turbulent (Re > 10 000) | Dittus-Boelter |
| Pipe (internal) | Natural | Churchill-Chu (1975) |
| Flat plate | Forced | Average flat-plate |
| Sphere | Forced | Whitaker (1972) |
| Cylinder (external) | Forced | Churchill-Bernstein (1977) |
| Annulus | Forced | Dittus-Boelter with hydraulic diameter |

### Radiation

| Algorithm | Service | Source |
|-----------|---------|--------|
| **Gas emissivity (CO₂+H₂O)** | `RadiationService` | Hottel-Mikheev; [21] Mikheev 1977 |
| **Radiation HTC** | `RadiationService` | `α = ε·σ·(T_g⁴−T_w⁴)/(T_g−T_w)` |
| **Stefan-Boltzmann** | `RadiationService` | `q = ε·σ·(T_h⁴−T_c⁴)` |
| **Linearised α_rad** | `RadiationService` | `α_lin = ε·σ·(T_h²+T_c²)·(T_h+T_c)` |

---

## Topic index

| Doc | Contents |
|-----|----------|
| [algorithms-refractory-and-thermal.md](./algorithms-refractory-and-thermal.md) | Refractory, thermal-distribution, HTC, recuperator/combustion index notes |
| [algorithms-component-effects-and-viscosity.md](./algorithms-component-effects-and-viscosity.md) | Component effects, mineral phases, refractoriness, glass viscosity |
| [algorithms-foundations-and-organization.md](./algorithms-foundations-and-organization.md) | Data structures, theory, validation, architecture, file tree, status |

