# Refractory API Specification

**Base path:** `/api/v1/refractory`  
**Controllers:** `RefractoryCompositionController`, `RefractoryPackingController`, `RefractoryThermalController` (shared `@Controller('refractory')`; routes unchanged)  
**Swagger UI:** `http://localhost/api/docs`  
**Tag:** `Refractory Calculations`

All endpoints accept and return JSON. All `POST` endpoints return `200 OK` on success, `400 Bad Request` on invalid input.

---

## Endpoints Overview

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| POST | `/phase-equilibrium` | `PhaseEquilibriumService.calculatePhaseEquilibrium` | Phases of a fired mix at T and after cooling (CALPHAD estimate default; optional legacy / compare; grain size) |
| POST | `/blend-optimization` | `BlendOptimizerService.optimize` | Optimize particle blend for target PSD |
| POST | `/psd/andreasen` | `PSDCalculatorService.andreasenDiscrete` | Andreasen discrete PSD calculation |
| POST | `/psd/funk-dinger` | `PSDCalculatorService.funkDingerDiscrete` | Funk-Dinger discrete PSD calculation |
| POST | `/packing/cpm` | `PackingService.calculateCPM` | Compressible Packing Model density |
| POST | `/packing/furnas` | `PackingService.calculateFurnas` | Furnas packing model density |
| POST | `/participation` | `ParticipationService.calculateParticipation` | Reacted fraction of each size fraction (shrinking-core model) |
| POST | `/water-demand` | `WaterDemandService.calculateWaterDemand` | Water demand from packing fraction |
| POST | `/water-demand/range` | `WaterDemandService.calculateWaterDemandRange` | Water demand min/typical/max range |
| POST | `/shrinkage` | `ShrinkageService.calculateCompleteShrinkage` | Drying + firing shrinkage over temperature profile |
| POST | `/refractoriness` | `RefractorinessService.calculate` | Solidus, liquidus and temperatures at given liquid fractions of a fired mix, from the phase diagrams (§11) |
| POST | `/glass-viscosity` | `GlassViscosityService.calculateViscosity` | Glass viscosity + VFT curve + fixed points |
| POST | `/mix/composition` | `MixCompositionService.calculate` | Fired-basis composition of a mix of library raw materials (§13) |
| POST | `/mix/thermal` | `MixThermalService.calculate` | λ, Cp, ρ, diffusivity vs T of a fired library raw material or mix (§13b) |

Read-only catalogue (`MaterialCatalogController`, tag `materials`, §14):

| Method | Path | Service method | Description |
|--------|------|----------------|-------------|
| GET | `/refractories` | `RefractoryThermalService.listProducts` | 19 known refractory / insulation products |
| GET | `/refractories/properties?material=&T_K=` | `RefractoryThermalService.getProperties` | λ, ε of a product at T_K |
| GET | `/materials?type=&search=` | `MaterialCatalogService.listMaterials` | Raw-material library (102 unique active entries) |
| GET | `/materials/:materialId` | `MaterialCatalogService.getMaterial` | One library material |
| GET | `/material-groups` | `MaterialCatalogService.listGroups` | Groups with route and count |
| GET | `/particle-sizes` | `ParticleSizeCatalogService.getParticleSizes` | Standard particle-size tables |
| GET | `/mix-components` | `MixComponentCatalogService.listGroups` | Raw materials allowed in mixes, by primary group |
| GET | `/material-categories` | `MaterialCatalogService.listCategories` | All materials, each once, by primary group |
| GET | `/:groupRoute` | `MaterialCatalogService.listByGroupRoute` | Materials of one group (`oxides`, `silicates`, `glasses`, …) |

---

## Topic index

| Doc | Endpoints |
|-----|-----------|
| [refractory-api-phase-equilibrium.md](./refractory-api-phase-equilibrium.md) | `POST /phase-equilibrium` |
| [refractory-api-packing.md](./refractory-api-packing.md) | blend, PSD, packing, participation, water demand |
| [refractory-api-thermal.md](./refractory-api-thermal.md) | shrinkage, refractoriness, glass viscosity, mix composition/thermal |
| [refractory-api-catalog.md](./refractory-api-catalog.md) | material catalogue GETs, common types, errors, status |

