# Material catalogue (read-only)

**Parent index:** [REFRACTORY_API_SPEC.md](./REFRACTORY_API_SPEC.md)

---

Controller `MaterialCatalogController`, tag `materials`. All `GET`, `200 OK`, data from the existing library files (nothing is copied).

| Path | Query / param | Response | Errors |
|------|---------------|----------|--------|
| `/refractories` | — | `RefractoryProductSummaryDto[]`: `materialId`, `name`, `description`, `emissivityRange_K { min, max }` | — |
| `/refractories/properties` | `material` (`RefractoryThermalMaterial`), `T_K` ≥ 1 | `RefractoryProductResultDto`: `material`, `T_K`, `lambda_WmK`, `emissivity` (ε clamped to `emissivityRange_K`, λ not clamped) | 400 |
| `/materials` | `type?` (`aggregate`, `binder`, `additive`, `clay`, `glass`), `search?` (≤ 64 chars, substring of id or name) | `MaterialEntryDto[]` | 400 invalid / unknown parameter |
| `/materials/:materialId` | — | `MaterialEntryDto` | 404 |
| `/material-groups` | — | `MaterialGroupSummaryDto[]`: `group`, `route`, `label`, `count` (non-empty groups only) | — |
| `/particle-sizes` | — | `ParticleSizesDto`: `standard`, `classifications`, `cement`, `mesh`, `fepaF`, `fepaP` — each `Record<code, ParticleSizeRangeDto>` | — |
| `/mix-components` | — | `MaterialCategoryDto[]` (`group`, `label`, `materials`) | — |
| `/material-categories` | — | `MaterialCategoryDto[]` | — |
| `/:groupRoute` | `oxides`, `silicates`, `clays`, `binders`, `carbides`, `nitrides`, `borides`, `glasses`, `fluxes`, `fluorides`, `borates`, `phosphates`, `rare-earths`, `glass-formers`, `hydroxides`, `gels`, `carbonates` | `MaterialEntryDto[]` | 400 unknown route |

Rules:

- **Library list:** active entries of `ALL_MATERIALS`, unique by `materialId` (10 ids are defined twice with identical data; first occurrence wins), sorted by `orderNumber`, then `name`.
- **Groups (`/:groupRoute`, `/material-groups`):** a material with several groups appears in each. Order and labels come from `MATERIAL_GROUP_ROUTES`.
- **Categories (`/material-categories`):** each material once, under its primary group `materialGroup[0]`.
- **Mix components (`/mix-components`):** primary group in `MIX_COMPONENT_GROUPS` (binder, oxide, silicate, clay, carbide, nitride, borate, fluoride) and id not in `MIX_EXCLUDED_MATERIAL_IDS` (`paper_clay`). 67 materials today. Glasses carry silicate / oxide as secondary groups and are therefore not mix components.
- **Route order:** `/:groupRoute` is the last handler of `MaterialCatalogController`, and the controller is registered after the calculation controllers. New static `GET /refractory/<name>` routes must be declared above it.

`MaterialEntryDto`: `materialId`, `name`, `type`, `materialGroup[]` (first = primary), `orderNumber`, `description`, `composition` (wt% as stored), `rho_true_after_firing_kgm3`, `availableParticleSizes?`, `particleSize?`, `thermalProperties?` (`thermalConductivity_WmK?`, `specificHeat_JkgK?`, `thermalExpansion_perK?`), `mechanicalProperties?`, `chemicalShrinkage_volFrac`, `activationEnergy_Jmol`, `meltingPoint_C`, `mineralogy?`, `sourceUrl?`, `supplier?`, `grade?`.

`mineralogy?` (`MaterialMineralogyDto`) is present on every mix component:
- `phases[]` (`MineralogyPhaseDto`: `phaseId`, `phase`, `formula`, `wt`): crystalline phases, wt% of the raw material as delivered;
- `amorphous_wt`: calculated remainder = composition minus the phase oxides;
- `source`.

See [`MINERAL_PHASE_IDENTIFICATION.md`](../algorithms/phase-equilibrium/MINERAL_PHASE_IDENTIFICATION.md).

---

## Common Types

The former eight-field `OxideCompositionDto` (`SiO2`, `Al2O3`, `CaO`, `MgO`, `Fe2O3`, `K2O`, `Na2O`, `TiO2`) is removed: the mix endpoints take library fractions, and glass viscosity takes its own composition record (§12).

### `FractionInputDto`

```typescript
{
  materialId?: string,      // optional material reference
  dMin_mm:     number,      // lower sieve size
  dMax_mm:     number,      // upper sieve size
  isFixed?:    boolean,     // lock this fraction's mass
  massFraction?: number,    // 0–1, required if isFixed=true
  density_kgm3?: number,    // 1000–4000 kg/m³
}
```

---

## Error Responses

All endpoints return standard NestJS error format on failure:

```json
{
  "statusCode": 400,
  "message": ["fractions must be an array", "temperature must be a number"],
  "error": "Bad Request"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation error or out-of-range input |
| 404 | Resource not found |
| 500 | Internal calculation error |

---

## Controller prefix note

The global prefix in `main.ts` is `api/v1`. The controller is decorated with `@Controller('refractory')` (no extra prefix). Full path: `/api/v1/refractory/<endpoint>`.

> **Current bug:** The controller is currently decorated with `@Controller('api/v1/refractory')` causing double prefix `/api/v1/api/v1/refractory`. This must be fixed — see implementation note below.

---

## Implementation Status

| Endpoint | DTO exists | Controller method | Implemented |
|----------|-----------|-------------------|-------------|
| `/phase-equilibrium` | 🔄 fractions-based DTOs | ✅ | 🔄 phase diagrams + grain reaction ([`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md)) |
| `/blend-optimization` | ✅ | ✅ | ✅ |
| `/psd/andreasen` | ❌ needs DTO | ❌ | ✅ service |
| `/psd/funk-dinger` | ❌ needs DTO | ❌ | ✅ service |
| `/packing/cpm` | ✅ | ❌ stub | ✅ service |
| `/packing/furnas` | ✅ | ❌ stub | ✅ service |
| `/participation` | 🔄 split `ParticipationFractionDto`; `materialId?`, `d50_mm?`, `temperature?`, `holdTime_hours?` | ✅ | 🔄 shrinking-core reacted fraction |
| `/water-demand` | ❌ needs DTO | ❌ | ✅ service |
| `/water-demand/range` | ❌ needs DTO | ❌ | ✅ service |
| `/shrinkage` | ✅ | ❌ | ✅ service |
| `/refractoriness` | 🔄 fractions-based DTOs | ✅ | 🔄 phase-diagram melting ([`REFRACTORINESS_ALGORITHM.md`](../algorithms/phase-equilibrium/REFRACTORINESS_ALGORITHM.md)) |
| `/glass-viscosity` | ✅ | ❌ | ✅ service |
| `/mix/composition` | ✅ | ✅ | ✅ (tests: `mix-composition.service.spec.ts`, `mix-composition-input.dto.spec.ts`) |
| `/mix/thermal` | ✅ | ✅ | ✅ (tests: `mix-thermal.service.spec.ts`, `mix-thermal-utils.spec.ts`) |
| Catalogue `GET` routes (§14) | ✅ | ✅ `MaterialCatalogController` | ✅ (tests: catalogue service specs, DTO specs, `material-catalog.controller.spec.ts`) |

