# CH01 — Scope

## Owns

| Question | Service |
|---|---|
| Cp, H, S, G of a gas species or mixture? | `GasPropertiesService` |
| Viscosity of a pure gas or mixture? | `TransportService` (Sutherland + Wilke) |
| Thermal conductivity of a gas? | `TransportService` (Eucken) + `common/thermal` DIPPR102 |
| Binary/mixture diffusion coefficient? | `DiffusionService` (Chapman-Enskog) |
| Re, Pr, Gr, Ra for any flow geometry? | `DimensionlessNumbersService` |
| Nu for any flow geometry and regime? | `DimensionlessNumbersService` — dispatched by `FlowGeometry` enum, returns correlation name |
| h from Nu? | `DimensionlessNumbersService.hFromNusselt()` |
| Channel area, perimeter, hydraulic diameter? | `DimensionlessNumbersService` — `FlowGeometry` enum covers all duct/pipe cross-sections |
| Surface area, volume of a body shape? | `DimensionlessNumbersService` — `BodyGeometry` enum (sphere, cylinder, cone, prism, …) |
| Mean beam length for gas radiation? | `DimensionlessNumbersService.meanBeamLength()` — `BodyGeometry` |
| Packed-bed pressure drop, superficial velocity? | `AerodynamicsService` (Ergun) |

## Two geometry enums (see CH07)

| Enum | Used for |
|---|---|
| `FlowGeometry` | Re, Nu, h — pipe, duct, plate, cylinder cross-flow, packed bed, natural convection |
| `BodyGeometry` | Surface area, volume, mean beam length — furnace enclosure shapes |

## Does NOT own

| Concern | Belongs in |
|---|---|
| Furnace wall multi-layer heat flux | `recuperator` module |
| Recuperator geometry and NTU | `recuperator` module |
| Flame temperature and combustion products | `combustion` module |
| Reaction rates, kinetics | `combustion` module |
| Compound CAS/melting-point database | `thermophysical` module |

## Consumed by

- `CombustionModule` — Cp, H, S, G via `GasPropertiesService`; μ, λ, D via `TransportService` + `DiffusionService`
- `RecuperatorModule` — Cp via `GasPropertiesService`; Nu/Re/h via `DimensionlessNumbersService`; body geometry for furnace surface calculations

