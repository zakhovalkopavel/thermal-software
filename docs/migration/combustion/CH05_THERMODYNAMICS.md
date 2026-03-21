# CH05 — Thermodynamics (NASA-7)

> **MOVED** — NASA-7 polynomials, Sutherland transport, and Chapman-Enskog diffusion  
> are now specified in **`docs/migration/thermodynamics/`**.
>
> This combustion module **consumes** `ThermodynamicsModule` services; it does not own them.

## Services used from `ThermodynamicsModule`

| Service | Used for |
|---|---|
| `GasPropertiesService.cp/cpMixture` | Mixture Cp in `CombustionService` energy balance |
| `GasPropertiesService.h/hMixture` | Flame temperature via enthalpy balance |
| `GasPropertiesService.g` | Gibbs energy in `EquilibriumService` |
| `TransportService.viscosityMix` | Gas mixture viscosity in `FurnaceCombustionService` |
| `DiffusionService.effectiveDiffusion` | Thiele modulus `η` in `ChemicalKineticsService` |

See [thermodynamics/CH03_SERVICE_DECOMPOSITION.md](../thermodynamics/CH03_SERVICE_DECOMPOSITION.md) and  
[thermodynamics/CH04_CP_RESOLUTION.md](../thermodynamics/CH04_CP_RESOLUTION.md).
