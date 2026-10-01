# STEP 03 — Materials module shell and catalogue endpoints

**Priority:** HIGH  
**Depends on:** [STEP_02_SHARED_CALC_COMPONENTS.md](STEP_02_SHARED_CALC_COMPONENTS.md)  
**Frontend root:** `frontend/src/modules/materials/`  
**Backend touched:** `metals`, `refractory` modules — read-only catalogue endpoints only  
**Status:** backend (§1) implemented and tested; frontend (§2) not started

---

## Goal

Create the single **Materials** module that hosts six sections — **Metals**, **Gases**, **Refractories**, **Raw materials**, **Glasses**, **Mineral compositions** — each self-contained (its own selection, conditions, calculation and charts), with a shared layout, shared catalogue API and a reusable `MaterialPicker`.

Material data already exists in the backend but most of it has **no list endpoint**. This step specifies read-only endpoints that expose the existing library data (allowed by the backend change policy in [README.md](README.md)), so the frontend never duplicates material tables.

Both parts follow [`docs/CONVENTIONS.md`](../CONVENTIONS.md), [`docs/NAMING_CONVENTIONS.md`](../NAMING_CONVENTIONS.md) and [`docs/CODE_QUALITY_STANDARDS.md`](../CODE_QUALITY_STANDARDS.md): **one exported construct per file** (one DTO, one enum, one type, one constant object, one service, one controller), thin controllers, no magic values, tests inside Docker. Existing refractory DTO files that hold several classes (`common.dto.ts`, `glass-viscosity.dto.ts`, …) are legacy and are **not** a template.

---

## 1. Backend specification

### 1.1 Current state

| Data | Location | Exposed today? |
|------|----------|----------------|
| Metals (2 grades, λ/ε coefficients) | `metals/data/materials/metal-thermal.data.ts` (`METAL_THERMAL_MATERIALS`) | Only `GET /metals/thermal-properties` (needs the id already) |
| Gases (species + aliases) | `thermodynamics` `FluidPropertyService.getFluidList()` | Yes — `GET /thermodynamics/fluid/list` → `[{ key, name, formula, Mr_kg_mol }]` |
| Refractory products (19, λ(T)/ε(T)) | `refractory/data/materials/refractory-thermal.data.ts` (`REFRACTORY_THERMAL_MATERIALS`) + `RefractoryThermalService` | **No** — used internally by multilayer wall |
| Raw materials library (112 entries, 102 unique ids; composition, density, sizes) | `refractory/data/materials-index.ts` (`ALL_MATERIALS`) | **No** |
| Standard particle-size fractions | `refractory/data/particle-sizes.data.ts` | **No** |

### 1.2 Endpoints

All new routes carry `@ApiTags('materials')` so they are grouped in `/api/docs`. All are `GET`, return `200`, and never modify data.

| # | Path | Input DTO | Response DTO | Errors |
|---|------|-----------|--------------|--------|
| E1 | `/metals/list` | — | `MetalSummaryDto[]` | — |
| E2 | `/refractory/refractories` | — | `RefractoryProductSummaryDto[]` (19) | — |
| E3 | `/refractory/refractories/properties?material=&T_K=` | `RefractoryProductQueryDto` (query) | `RefractoryProductResultDto` | 400 invalid query |
| E4 | `/refractory/materials?type=&search=` | `MaterialListQueryDto` (query) | `MaterialEntryDto[]` | 400 invalid / unknown query parameter |
| E5 | `/refractory/materials/:materialId` | `MaterialIdParamDto` (param) | `MaterialEntryDto` | 404 unknown id |
| E6 | `/refractory/material-groups` | — | `MaterialGroupSummaryDto[]` | — |
| E7 | `/refractory/:groupRoute` | `MaterialGroupRouteParamDto` (param) | `MaterialEntryDto[]` | 400 unknown group route |
| E8 | `/refractory/particle-sizes` | — | `ParticleSizesDto` | — |
| E9 | `/refractory/mix-components` | — | `MaterialCategoryDto[]` — raw materials allowed in mixes, grouped by primary group (§1.3) | — |
| E10 | `/refractory/material-categories` | — | `MaterialCategoryDto[]` — all library materials, each once, grouped by primary group (§1.3) | — |

Per-group routes for E7 — one per `materialGroup` value present in the library. A material with several groups (e.g. `['silicate', 'flux']`) appears in each.

| Route | Group | Route | Group |
|-------|-------|-------|-------|
| `/refractory/oxides` | `oxide` | `/refractory/fluorides` | `fluoride` |
| `/refractory/silicates` | `silicate` | `/refractory/borides` | `boride` |
| `/refractory/glasses` | `glass` | `/refractory/borates` | `borate` |
| `/refractory/clays` | `clay` | `/refractory/phosphates` | `phosphate` |
| `/refractory/fluxes` | `flux` | `/refractory/rare-earths` | `rare_earth` |
| `/refractory/binders` | `binder` | `/refractory/glass-formers` | `glass_former` |
| `/refractory/carbides` | `carbide` | `/refractory/hydroxides` | `hydroxide` |
| `/refractory/nitrides` | `nitride` | `/refractory/gels` | `gel` |
| | | `/refractory/carbonates` | `carbonate` |

The library has no metal group; metals live only in `/metals`.

### 1.3 Behaviour rules

| Rule | Detail |
|------|--------|
| Library list | Active entries of `ALL_MATERIALS` only, unique by `materialId` (first occurrence wins), sorted by `orderNumber` then `name`. Built once in the service constructor. |
| Duplicates | 10 ids are defined twice with identical data (`ball_clay`, `beta_alumina`, `boric_oxide`, `earthenware_clay`, `ilmenite`, `porcelain_clay_mix`, `rutile`, `silicon_nitride`, `sodium_aluminate`, `stoneware_clay`). Handled by de-duplication; data files are not edited. |
| E4 filters | `type` ∈ `MaterialType`; `search` = case-insensitive substring of `materialId` or `name`; filters combine with AND. Group filtering is done by E7, not by a query parameter. |
| E6 order and counts | Order of `MATERIAL_GROUP_ROUTES`; `count` = number of unique active materials in the group; groups with `count = 0` are omitted. |
| E10 categories | Category = **primary group** (`materialGroup[0]`), so every material appears exactly once (E7 lists a material under each of its groups — e.g. `soda_lime_glass` under both glasses and silicates). Categories in `MATERIAL_GROUP_ROUTES` order, empty categories omitted, materials inside a category as in E4. Used by the Raw materials section ([Step 7](STEP_07_RAW_MATERIALS.md)) and the `library` picker kind. |
| E9 mix components | A material is a mix component when its **primary group** (`materialGroup[0]`) is in `MIX_COMPONENT_GROUPS` — today `binder`, `oxide`, `silicate`, `clay`, `carbide`, `nitride` (in this order) — and its id is not in `MIX_EXCLUDED_MATERIAL_IDS` (`paper_clay`, contains paper fibre). Result: 60 materials (binder 4, oxide 21, silicate 14, clay 10, carbide 5, nitride 6). The primary group is used because glasses carry `silicate` / `oxide` as secondary groups and must not enter mixes. Not mix components today: glasses (21), phosphates (7), borides (4), fluorides (4), borates (3), carbonate (dolomite), hydroxide (aluminium hydroxide). Groups are ordered as in the constant; materials inside a group as in E4. |
| Mix groups extension | Adding a group to mixes = add it to `MIX_COMPONENT_GROUPS` (and to `MaterialGroup` if new). Planned later: glass frits, fluoride salts, sulfates, nitrates, chlorides, borates, phosphates. Fluorides, borates and phosphates already exist in the library; glass frits, sulfates, nitrates and chlorides need new library data (data file changes → separate approval). |
| E3 temperature | `T_K` is converted from the query string with `@Type(() => Number)`; ε is clamped to the validity range returned in E2 (`emissivityRange_K`), λ is not clamped. |
| Route order | E7 is a parameter route directly under `/refractory`. It is declared **last** in `MaterialCatalogController` (after E9 and E10), and the controller is registered **after** `RefractoryController` in `refractory.module.ts`. Any future `GET /refractory/<static>` route must be declared above E7 in this controller. |
| Errors | Nest standard error body; 404 via `NotFoundException` from the service; 400 from the global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`). |

### 1.4 Files

One construct per file. Paths are relative to `backend/src/`.

**Enums**

| File | Export |
|------|--------|
| `modules/refractory/enums/material-group.enum.ts` | `enum MaterialGroup` — 17 values: `oxide`, `silicate`, `glass`, `clay`, `flux`, `binder`, `carbide`, `nitride`, `boride`, `fluoride`, `borate`, `phosphate`, `rare_earth`, `glass_former`, `hydroxide`, `gel`, `carbonate` |
| `modules/refractory/enums/material-group-route.enum.ts` | `enum MaterialGroupRoute` — `oxides`, `silicates`, `glasses`, `clays`, `fluxes`, `binders`, `carbides`, `nitrides`, `borides`, `fluorides`, `borates`, `phosphates`, `rare-earths`, `glass-formers`, `hydroxides`, `gels`, `carbonates` |
| `modules/refractory/enums/material-type.enum.ts` | `enum MaterialType` — `aggregate`, `binder`, `additive`, `clay`, `glass` |

The existing `MaterialGroupType` union in `data/interfaces/material.interface.ts` lacks `carbonate` (used by dolomite). It is left unchanged; the new enum is the source of truth for the API.

**Constants**

| File | Export |
|------|--------|
| `modules/refractory/constants/material-group-routes.constants.ts` | `MATERIAL_GROUP_ROUTES: ReadonlyArray<{ route: MaterialGroupRoute; group: MaterialGroup; label: string }>` — single source of truth for E6 order/labels and E7 mapping |
| `modules/refractory/constants/mix-component-groups.constants.ts` | `MIX_COMPONENT_GROUPS: ReadonlyArray<MaterialGroup>` — `[BINDER, OXIDE, SILICATE, CLAY, CARBIDE, NITRIDE]`; single source of truth for E9 and for the mix-composition validation ([Step 9 §2](STEP_09_MINERAL_COMPOSITIONS.md)) |
| `modules/refractory/constants/mix-excluded-material-ids.constants.ts` | `MIX_EXCLUDED_MATERIAL_IDS: ReadonlyArray<string>` — `['paper_clay']` |

**DTOs** — `@ApiProperty` on every field; validators only on input DTOs.

| File | Export | Fields |
|------|--------|--------|
| `common/thermal/dto/temperature-range.dto.ts` | `TemperatureRangeDto` | `min: number`, `max: number` (K). Re-exported from `common/thermal/dto/index.ts`. |
| `modules/metals/dto/metal-summary.dto.ts` | `MetalSummaryDto` | `materialId: MetalMaterial`, `name`, `description`, `emissivityRange_K: TemperatureRangeDto` |
| `modules/refractory/dto/refractory-products/refractory-product-summary.dto.ts` | `RefractoryProductSummaryDto` | `materialId: RefractoryThermalMaterial`, `name`, `description`, `emissivityRange_K: TemperatureRangeDto` |
| `modules/refractory/dto/refractory-products/refractory-product-query.dto.ts` | `RefractoryProductQueryDto` | `material` — `@IsEnum(RefractoryThermalMaterial)`; `T_K` — `@Type(() => Number) @IsNumber() @Min(1)` |
| `modules/refractory/dto/refractory-products/refractory-product-result.dto.ts` | `RefractoryProductResultDto` | `material`, `T_K`, `lambda_WmK`, `emissivity` |
| `modules/refractory/dto/material-catalog/material-list-query.dto.ts` | `MaterialListQueryDto` | `type?` — `@IsOptional() @IsEnum(MaterialType)`; `search?` — `@IsOptional() @IsString() @MaxLength(MATERIAL_SEARCH_MAX_LENGTH)` |
| `modules/refractory/dto/material-catalog/material-id-param.dto.ts` | `MaterialIdParamDto` | `materialId` — `@IsString() @IsNotEmpty()` |
| `modules/refractory/dto/material-catalog/material-group-route-param.dto.ts` | `MaterialGroupRouteParamDto` | `groupRoute` — `@IsEnum(MaterialGroupRoute)` |
| `modules/refractory/dto/material-catalog/material-group-summary.dto.ts` | `MaterialGroupSummaryDto` | `group: MaterialGroup`, `route: MaterialGroupRoute`, `label`, `count` |
| `modules/refractory/dto/material-catalog/material-category.dto.ts` | `MaterialCategoryDto` | `group: MaterialGroup`, `label` (from `MATERIAL_GROUP_ROUTES`), `materials: MaterialEntryDto[]` — response of E9 and E10 |
| `modules/refractory/dto/material-catalog/material-entry.dto.ts` | `MaterialEntryDto` | `materialId`, `name`, `type: MaterialType`, `materialGroup: MaterialGroup[]`, `orderNumber`, `description`, `composition: Record<string, number>` (wt%, as stored), `rho_true_after_firing_kgm3`, `availableParticleSizes?: string[]`, `particleSize?: MaterialParticleSizeDto`, `thermalProperties?: MaterialThermalPropertiesDto`, `mechanicalProperties?: MaterialMechanicalPropertiesDto`, `chemicalShrinkage_volFrac`, `activationEnergy_Jmol`, `meltingPoint_C`, `sourceUrl?`, `supplier?`, `grade?` |
| `modules/refractory/dto/material-catalog/material-particle-size.dto.ts` | `MaterialParticleSizeDto` | `dMin_mm`, `dMax_mm`, `d50_mm` |
| `modules/refractory/dto/material-catalog/material-thermal-properties.dto.ts` | `MaterialThermalPropertiesDto` | `thermalConductivity_WmK?`, `specificHeat_JkgK?`, `thermalExpansion_perK?` |
| `modules/refractory/dto/material-catalog/material-mechanical-properties.dto.ts` | `MaterialMechanicalPropertiesDto` | `crushingStrength_MPa?`, `modulusOfRupture_MPa?`, `youngModulus_GPa?`, `hardness_HV?` |
| `modules/refractory/dto/material-catalog/particle-size-range.dto.ts` | `ParticleSizeRangeDto` | `dMin_mm`, `dMax_mm`, `d50_mm`, `grade`, `description?`, `mesh?`, `name?` |
| `modules/refractory/dto/material-catalog/particle-sizes.dto.ts` | `ParticleSizesDto` | `standard`, `classifications`, `cement`, `mesh`, `fepaF`, `fepaP` — each `Record<string, ParticleSizeRangeDto>` keyed by size code |

The `search` length limit is `MATERIAL_CATALOG_CONSTANTS.SEARCH_MAX_LENGTH` (64) in `modules/refractory/constants/material-catalog.constants.ts`.

**Services**

| File | Class / change | Methods |
|------|----------------|---------|
| `modules/metals/services/metal-thermal.service.ts` | existing `MetalThermalService` — add one method | `listMaterials(): MetalSummaryDto[]` — maps `METAL_THERMAL_MATERIALS` (`emissivityRange_K` = `{ min: T_min_K, max: T_max_K }`) |
| `modules/refractory/services/catalog/refractory-thermal.service.ts` | existing `RefractoryThermalService` — add two methods | `listProducts(): RefractoryProductSummaryDto[]`; `getProperties(dto: RefractoryProductQueryDto): RefractoryProductResultDto` (reuses existing `lambda()` / `emissivity()`) |
| `modules/refractory/services/catalog/material-catalog.service.ts` | new `MaterialCatalogService` | `listMaterials(query: MaterialListQueryDto): MaterialEntryDto[]`; `getMaterial(materialId: string): MaterialEntryDto` (404 if unknown); `listGroups(): MaterialGroupSummaryDto[]`; `listByGroupRoute(route: MaterialGroupRoute): MaterialEntryDto[]`; `listCategories(): MaterialCategoryDto[]` (E10) |
| `modules/refractory/services/catalog/particle-size-catalog.service.ts` | new `ParticleSizeCatalogService` | `getParticleSizes(): ParticleSizesDto` — from the six exported tables in `particle-sizes.data.ts` |
| `modules/refractory/services/catalog/mix-component-catalog.service.ts` | new `MixComponentCatalogService` (injects `MaterialCatalogService`) | `listGroups(): MaterialCategoryDto[]` (E9); `getMixComponent(materialId: string): MaterialEntryDto` — 404 if unknown, 400 if not a mix component or excluded |

`MixComponentCatalogService` is exported from `RefractoryModule` because the mix-composition calculation ([Step 9 §2](STEP_09_MINERAL_COMPOSITIONS.md)) resolves and validates materials through it.

**Controllers** — thin: one service call per handler, return type = response DTO, `@ApiOperation` + `@ApiOkResponse` (+ `@ApiNotFoundResponse` / `@ApiBadRequestResponse` where applicable).

| File | Class / change | Handlers (in declaration order) |
|------|----------------|---------------------------------|
| `modules/metals/controllers/metals.controller.ts` | existing `MetalsController` | add `@Get('list') @ApiTags('materials') listMaterials()` → E1 |
| `modules/refractory/controllers/material-catalog.controller.ts` | new `MaterialCatalogController` — `@ApiTags('materials') @Controller('refractory')` | E2 `listRefractoryProducts`, E3 `getRefractoryProductProperties`, E4 `listMaterials`, E5 `getMaterial`, E6 `listMaterialGroups`, E8 `getParticleSizes`, E9 `listMixComponents`, E10 `listMaterialCategories`, **E7 `listByGroupRoute` last** |

**Module**

`modules/refractory/refractory.module.ts`: `controllers: [RefractoryController, MaterialCatalogController]` (order matters, see §1.3); add `MaterialCatalogService`, `ParticleSizeCatalogService` and `MixComponentCatalogService` to `providers`; add `MaterialCatalogService` and `MixComponentCatalogService` to `exports`.

### 1.5 Tests

Run inside Docker only: `docker compose exec backend npm run test -- <pattern>`. Paths follow the repository layout (`backend/test/unit/<module>/…`). Coverage targets per [`docs/TEST_SPECIFICATION.md`](../TEST_SPECIFICATION.md): services ≥ 80 %, DTOs 100 %.

| File | Covers |
|------|--------|
| `test/unit/metals/services/metal-thermal.service.spec.ts` (extend) | `listMaterials`: 2 grades, ids match `MetalMaterial`, range = data `T_min_K` / `T_max_K` |
| `test/unit/refractory/services/catalog/refractory-thermal.service.spec.ts` (extend) | `listProducts`: 19 items, ids = enum values; `getProperties`: λ/ε equal `lambda()` / `emissivity()`; ε clamped outside range |
| `test/unit/refractory/services/catalog/material-catalog.service.spec.ts` (new) | 102 unique active materials; sort order; each duplicated id returned once; `type` and `search` filters and their AND; `getMaterial` found / 404; `listGroups` order = `MATERIAL_GROUP_ROUTES`, counts match `listByGroupRoute` lengths, no zero-count groups; every material of `listByGroupRoute(route)` contains the mapped group; `listCategories`: 102 materials in total, each exactly once, `materialGroup[0]` = category, `soda_lime_glass` only under glass |
| `test/unit/refractory/services/catalog/mix-component-catalog.service.spec.ts` (new) | `listGroups`: order = `MIX_COMPONENT_GROUPS`; 60 materials with the per-group counts of §1.3; every material's `materialGroup[0]` equals its group; no glass, phosphate, boride, fluoride, borate, carbonate or hydroxide primary group; `paper_clay` absent; `getMixComponent`: `alumina_tabular` ok, `soda_lime_glass` → 400, `calcium_fluoride` → 400, `paper_clay` → 400, unknown → 404 |
| `test/unit/refractory/services/catalog/particle-size-catalog.service.spec.ts` (new) | six tables present; each entry has `dMin_mm < dMax_mm` and `d50_mm` inside |
| `test/unit/refractory/dto/refractory-products/refractory-product-query.dto.spec.ts` (new) | query-string `T_K` converted to number; missing / non-numeric / `< 1` rejected; unknown `material` rejected |
| `test/unit/refractory/dto/material-catalog/material-list-query.dto.spec.ts` (new) | valid `type`; invalid `type` rejected; `search` length limit; unknown parameter rejected (`forbidNonWhitelisted`) |
| `test/unit/refractory/dto/material-catalog/material-group-route-param.dto.spec.ts` (new) | every `MaterialGroupRoute` accepted; unknown value rejected |
| `test/unit/refractory/dto/material-catalog/material-id-param.dto.spec.ts` (new) | empty string rejected |
| `test/unit/refractory/controllers/material-catalog.controller.spec.ts` (new) | boots `RefractoryModule` with `@nestjs/testing` and the production `ValidationPipe` options, listens on port 0, calls routes with `fetch` (supertest is not installed): E4 / E6 / E8 / E9 / E10 are **not** captured by E7; `/refractory/unknown` → 400; `/refractory/materials/unknown` → 404 |

DTO specs validate with `plainToInstance` + `validate` using the same options as the global `ValidationPipe` in `main.ts`.

### 1.6 Documentation (Definition of Done)

Updated in the same change as the code:

| Document | Entry |
|----------|-------|
| `docs/api/REFRACTORY_API_SPEC.md` | E2–E10: request, response, errors; route-order note; primary-group and mix-component rules |
| `docs/api/METALS_API_SPEC.md` (new) | `GET /metals/thermal-properties`, E1 |
| `docs/INTERFACES_IMPLEMENTATION_INDEX.md` | new DTOs and enums |
| `docs/migration/IMPLEMENTATION_STATUS.md` | new services / methods / tests |

### 1.7 Approved change — metals `T_K` query conversion

Not part of the catalogue work (it changes an existing endpoint), so it was approved separately under the backend change policy.

| Item | Detail |
|------|--------|
| Problem | `GET /metals/thermal-properties?material=aisi_304&T_K=800` returns 400 "T_K must be a number": query values arrive as strings and `MetalThermalQueryDto.T_K` has no `@Type(() => Number)` (the global pipe has no implicit conversion). The endpoint cannot be used from a browser. |
| Proposed change | `modules/metals/dto/metal-thermal-query.dto.ts`: add `@Type(() => Number)` on `T_K`; DTO spec `test/unit/metals/dto/metal-thermal-query.dto.spec.ts`. |
| Status | **Approved and applied.** `GET /metals/thermal-properties?material=aisi_304&T_K=800` returns 200. |

---

## 2. Frontend specification

### 2.1 Conventions

| Rule | Detail |
|------|--------|
| One export per file | one component, one hook, one type, one API object or one constant object per file |
| File names | React components `PascalCase.tsx` (e.g. `MaterialPicker.tsx`); hooks `useXxx.ts`; everything else `kebab-case` with a role suffix: `*.api.ts`, `*.type.ts`, `*.constants.ts`, `*.mapper.ts` |
| Types | `export type` for API data shapes (one per file in `types/`), mirroring the backend DTO of the same name without the `Dto` suffix |
| Props | component props type in its own file, `types/<component-name>-props.type.ts` |
| Constants | no magic values: query keys, cache times and labels in `constants/` |
| Module boundary | other modules import only from `modules/materials/index.ts` |

### 2.2 Structure

```
frontend/src/modules/materials/
├── index.ts                               # public API: MaterialPicker, catalogue hooks, public types
├── routes.tsx                             # materialsRoutes (RouteObject[])
├── MaterialsLayout.tsx                    # section tabs + <Outlet />
├── MaterialsHub.tsx                       # /materials landing: 6 section cards
├── api/
│   ├── metals-catalog.api.ts              # metalsCatalogApi.list()
│   ├── gases-catalog.api.ts               # gasesCatalogApi.list()
│   ├── refractory-products.api.ts         # refractoryProductsApi.list(), .getProperties(query)
│   ├── material-library.api.ts            # materialLibraryApi.list(query), .get(id), .listGroups(), .listByGroup(route), .listMixComponents(), .listCategories()
│   ├── particle-sizes.api.ts              # particleSizesApi.get()
│   ├── mix-composition.api.ts             # mixCompositionApi.calculate(input) — used by Steps 7 and 9
│   └── thermal-conductivity.api.ts        # thermalConductivityApi.calculate(input) — used by Steps 7 and 9
├── hooks/
│   ├── useMetalList.ts
│   ├── useGasList.ts
│   ├── useRefractoryProducts.ts
│   ├── useMaterialGroups.ts
│   ├── useMaterialsByGroup.ts
│   ├── useMixComponents.ts
│   ├── useMaterialCategories.ts
│   ├── useMaterialLibrary.ts
│   ├── useMaterial.ts
│   └── useParticleSizes.ts
├── types/
│   ├── temperature-range.type.ts
│   ├── metal-summary.type.ts
│   ├── gas-list-entry.type.ts
│   ├── refractory-product-summary.type.ts
│   ├── refractory-product-query.type.ts
│   ├── refractory-product-result.type.ts
│   ├── material-type.type.ts
│   ├── material-group.type.ts
│   ├── material-group-route.type.ts
│   ├── material-group-summary.type.ts
│   ├── material-entry.type.ts
│   ├── material-category.type.ts
│   ├── material-list-query.type.ts
│   ├── particle-size-range.type.ts
│   ├── particle-sizes.type.ts
│   ├── material-picker-kind.type.ts
│   ├── material-picker-option.type.ts
│   ├── material-picker-selection.type.ts
│   ├── material-picker-props.type.ts
│   ├── refractory-group.type.ts
│   ├── mix-component-input.type.ts
│   ├── mix-composition-input.type.ts
│   ├── non-oxide-components.type.ts
│   ├── mix-composition-result.type.ts
│   ├── oxide-composition.type.ts
│   ├── thermal-conductivity-input.type.ts
│   ├── thermal-conductivity-result.type.ts
│   ├── temperature-sweep.type.ts
│   └── temperature-sweep-fields-props.type.ts
├── constants/
│   ├── materials-query-keys.constants.ts  # MATERIALS_QUERY_KEYS
│   ├── materials-sections.constants.ts    # MATERIALS_SECTIONS (route, label, description)
│   ├── catalog-cache.constants.ts         # CATALOG_CACHE (staleTime, gcTime)
│   ├── refractory-groups.constants.ts     # REFRACTORY_GROUPS (key, label, id prefixes, colour)
│   └── temperature-sweep.constants.ts     # TEMPERATURE_SWEEP (KELVIN_OFFSET, maxPoints)
├── mappers/
│   ├── material-picker-options.mapper.ts  # toMaterialPickerOptions(kind, data)
│   ├── refractory-groups.mapper.ts        # toRefractoryGroups(products) — shared by picker and Refractories section
│   └── temperature-grid.mapper.ts         # toTemperatureGrid(sweep) → number[] (K)
├── components/
│   ├── MaterialPicker.tsx
│   └── TemperatureSweepFields.tsx         # Single T / Range fields
└── sections/
    ├── metals/                            # Step 4
    ├── gases/                             # Step 5
    ├── refractories/                      # Step 6
    ├── raw-materials/                     # Step 7
    ├── glasses/                           # Step 8
    └── mineral-compositions/              # Step 9
```

### 2.3 Types

Each mirrors one backend response DTO (§1.4); field names and unit suffixes are identical.

| File | Type | Source |
|------|------|--------|
| `temperature-range.type.ts` | `TemperatureRange` | `TemperatureRangeDto` |
| `metal-summary.type.ts` | `MetalSummary` | `MetalSummaryDto` |
| `gas-list-entry.type.ts` | `GasListEntry` = `{ key; name; formula: string \| null; Mr_kg_mol: number \| null }` | `GET /thermodynamics/fluid/list` |
| `refractory-product-summary.type.ts` | `RefractoryProductSummary` | `RefractoryProductSummaryDto` |
| `refractory-product-query.type.ts` | `RefractoryProductQuery` = `{ material; T_K }` | `RefractoryProductQueryDto` |
| `refractory-product-result.type.ts` | `RefractoryProductResult` | `RefractoryProductResultDto` |
| `material-type.type.ts` | `MaterialType` (string union) | `MaterialType` enum |
| `material-group.type.ts` | `MaterialGroup` (string union) | `MaterialGroup` enum |
| `material-group-route.type.ts` | `MaterialGroupRoute` (string union) | `MaterialGroupRoute` enum |
| `material-group-summary.type.ts` | `MaterialGroupSummary` | `MaterialGroupSummaryDto` |
| `material-entry.type.ts` | `MaterialEntry` | `MaterialEntryDto` (nested property objects inline) |
| `material-category.type.ts` | `MaterialCategory` = `{ group; label; materials: MaterialEntry[] }` | `MaterialCategoryDto` (E9, E10) |
| `material-list-query.type.ts` | `MaterialListQuery` = `{ type?; search? }` | `MaterialListQueryDto` |
| `particle-size-range.type.ts` | `ParticleSizeRange` | `ParticleSizeRangeDto` |
| `particle-sizes.type.ts` | `ParticleSizes` | `ParticleSizesDto` |
| `material-picker-kind.type.ts` | `MaterialPickerKind` = `'metal' \| 'refractory' \| 'gas' \| 'library' \| 'mix-component'` | — |
| `material-picker-option.type.ts` | `MaterialPickerOption` = `{ kind; id; label; groupLabel; description? }` | — |
| `material-picker-selection.type.ts` | `MaterialPickerSelection` = `{ kind; materialId }` | — |
| `material-picker-props.type.ts` | `MaterialPickerProps` (§2.7) | — |
| `refractory-group.type.ts` | `RefractoryGroup` = `{ key; label; products: RefractoryProductSummary[] }` | — |
| `mix-component-input.type.ts` | `MixComponentInput` | `MixComponentInputDto` ([Step 9 §2.3](STEP_09_MINERAL_COMPOSITIONS.md)) |
| `mix-composition-input.type.ts` | `MixCompositionInput` | `MixCompositionInputDto` |
| `non-oxide-components.type.ts` | `NonOxideComponents` | `NonOxideComponentsDto` |
| `mix-composition-result.type.ts` | `MixCompositionResult` | `MixCompositionResultDto` |
| `oxide-composition.type.ts` | `OxideComposition` = optional `SiO2, Al2O3, CaO, MgO, Fe2O3, K2O, Na2O, TiO2` (wt%) | `OxideCompositionDto` |
| `thermal-conductivity-input.type.ts` | `ThermalConductivityInput` = `{ composition: OxideComposition; temperature (°C); porosity? (0–1) }` | `ThermalConductivityDto` |
| `thermal-conductivity-result.type.ts` | `ThermalConductivityResult` = `{ thermalConductivity_WmK; specificHeat_JkgK; density_kgm3; thermalDiffusivity_m2s; temperature_C; porosity; components }` | response of `POST /refractory/thermal-conductivity` (no DTO class) |
| `temperature-sweep.type.ts` | `TemperatureSweep` = `{ mode: 'single' \| 'range'; unit: 'C' \| 'K'; value; from; to; step }` | — (§2.8) |
| `temperature-sweep-fields-props.type.ts` | `TemperatureSweepFieldsProps` = `{ value: TemperatureSweep; onChange; maxPoints?: number }` | — |

### 2.4 API wrappers

One object per file, built on the shared axios client from Step 1 (`services/api/client.ts`, base `/api/v1`). Each method returns the typed `data`.

| File | Object | Methods → endpoint |
|------|--------|--------------------|
| `metals-catalog.api.ts` | `metalsCatalogApi` | `list()` → E1 |
| `gases-catalog.api.ts` | `gasesCatalogApi` | `list()` → `GET /thermodynamics/fluid/list` |
| `refractory-products.api.ts` | `refractoryProductsApi` | `list()` → E2; `getProperties(query)` → E3 |
| `material-library.api.ts` | `materialLibraryApi` | `list(query)` → E4; `get(materialId)` → E5; `listGroups()` → E6; `listByGroup(route)` → E7; `listMixComponents()` → E9; `listCategories()` → E10 |
| `particle-sizes.api.ts` | `particleSizesApi` | `get()` → E8 |
| `mix-composition.api.ts` | `mixCompositionApi` | `calculate(input)` → `POST /refractory/mix/composition` (approved, [Step 9 §2](STEP_09_MINERAL_COMPOSITIONS.md)) |
| `thermal-conductivity.api.ts` | `thermalConductivityApi` | `calculate(input)` → `POST /refractory/thermal-conductivity` (exists) |

### 2.5 Hooks and caching

Catalogue data is static: every list hook uses `useQuery` with `CATALOG_CACHE.staleTime = Infinity`, so each list is fetched once per session.

| Hook | Query key (`MATERIALS_QUERY_KEYS`) | Calls |
|------|------------------------------------|-------|
| `useMetalList()` | `['materials', 'metals']` | `metalsCatalogApi.list` |
| `useGasList()` | `['materials', 'gases']` | `gasesCatalogApi.list` |
| `useRefractoryProducts()` | `['materials', 'refractories']` | `refractoryProductsApi.list` |
| `useMaterialGroups()` | `['materials', 'groups']` | `materialLibraryApi.listGroups` |
| `useMaterialsByGroup(route)` | `['materials', 'group', route]` | `materialLibraryApi.listByGroup` |
| `useMixComponents()` | `['materials', 'mix-components']` | `materialLibraryApi.listMixComponents` |
| `useMaterialCategories()` | `['materials', 'categories']` | `materialLibraryApi.listCategories` |
| `useMaterialLibrary(query)` | `['materials', 'library', query]` | `materialLibraryApi.list` |
| `useMaterial(materialId)` | `['materials', 'material', materialId]` (enabled when id is set) | `materialLibraryApi.get` |
| `useParticleSizes()` | `['materials', 'particle-sizes']` | `particleSizesApi.get` |

Property look-ups and calculations (metal λ/ε, gas properties, E3, raw-material thermal calculation) are **not** catalogue hooks; each lives in its own section (Steps 4–7).

### 2.6 Layout and routes

`MaterialsLayout` renders a tab bar (desktop: left side nav) from `MATERIALS_SECTIONS`; the active section renders in the outlet. `/materials` shows `MaterialsHub`: one card per section with the one-line meaning from the table in [README.md](README.md).

| Tab | Route | Content | Step |
|-----|-------|---------|------|
| Metals | `/materials/metals?material=` | metal grades → λ, ε vs T | [4](STEP_04_METALS.md) |
| Gases | `/materials/gases?gas=` | pure gases and mixtures → Cp, μ, ν, ρ, λ, Pr vs T | [5](STEP_05_GASES.md) |
| Refractories | `/materials/refractories?material=` | 19 known products → λ, ε vs T | [6](STEP_06_REFRACTORIES.md) |
| Raw materials | `/materials/raw-materials?category=&material=` | categorised library → reference properties, λ_eff / Cp vs T | [7](STEP_07_RAW_MATERIALS.md) |
| Glasses | `/materials/glasses` | composition → viscosity | [8](STEP_08_GLASSES.md) |
| Mineral compositions | `/materials/mineral-compositions` | mix builder + analyses | [9](STEP_09_MINERAL_COMPOSITIONS.md) |

The optional query parameters preselect a material, so other modules can deep-link (e.g. Processes → "View properties" opens `/materials/refractories?material=chamotte_1000`). An unknown id in the query is ignored with an info message.

### 2.7 MaterialPicker

```ts
// types/material-picker-props.type.ts
export type MaterialPickerProps = {
  kinds: MaterialPickerKind[];          // sources shown together, e.g. ['metal', 'refractory'] for wall layers
  categories?: MaterialGroup[];         // 'library': limit to these categories (default: all from E10)
  excludeIds?: string[];                // hide specific ids (e.g. already used elsewhere)
  value: MaterialPickerSelection | null;
  onChange: (selection: MaterialPickerSelection | null) => void;
  label?: string;
};

// types/material-picker-selection.type.ts
export type MaterialPickerSelection = { kind: MaterialPickerKind; materialId: string };
```

- MUI `Autocomplete`; options built by `toMaterialPickerOptions(kind, data)` in `mappers/material-picker-options.mapper.ts`, concatenated in the order of `kinds`.
- Data source per kind: `metal` → `useMetalList` (group "Metals"); `refractory` → `useRefractoryProducts` (group "Refractory products"); `gas` → `useGasList` (group "Gases"); `library` → `useMaterialCategories` (E10); `mix-component` → `useMixComponents` (E9). Categories and their order come from the backend; the frontend holds no grouping or eligibility rule.
- `library` options are grouped by category label (Oxides, Silicates, Clays, Binders, Carbides, Nitrides, Glasses, Phosphates, Fluorides, …); each material appears once, under its primary group.
- The selection carries the kind as well as the id, because ids are unique only within a kind. Callers that need the full library entry use `useMaterial(materialId)`.
- Exported from `modules/materials/index.ts` so Processes (wall layers) can reuse it.
- `refractory` options are grouped by `toRefractoryGroups` (Chamotte, Mullite, Quartz, Alumina, Carbide, Insulation — table in [Step 6](STEP_06_REFRACTORIES.md)), the same mapper the Refractories section uses.

### 2.8 Temperature sweep (shared by Steps 4–7)

`TemperatureSweepFields` renders the **Single T / Range** toggle, the unit (°C / K) and either one value or from / to / step. `toTemperatureGrid(sweep)` returns the list of temperatures in **K**, including both ends, and throws a validation message when the list would exceed `maxPoints` (default `TEMPERATURE_SWEEP.maxPoints = 40`). Conversion uses `TEMPERATURE_SWEEP.KELVIN_OFFSET = 273.15`; each section converts back to °C only where an endpoint expects °C. This is unit handling only; no physics in the frontend.

---

## Acceptance criteria

**Backend**

- [ ] E1–E10 return data from the existing data files (no copies) and appear under the `materials` tag in Swagger
- [ ] Every new file exports exactly one construct; controllers make one service call per handler
- [ ] `GET /refractory/refractories/properties?material=chamotte_solid&T_K=1000` returns λ and ε
- [ ] `GET /refractory/material-groups` lists every non-empty library group with its route; each per-group route returns only that group
- [ ] `GET /refractory/mix-components` returns 60 materials in six groups (binder, oxide, silicate, clay, carbide, nitride) by primary group; no glasses, no `paper_clay`
- [ ] `GET /refractory/material-categories` returns all 102 materials, each once, grouped by primary group
- [ ] `/refractory/materials`, `/refractory/material-groups`, `/refractory/particle-sizes`, `/refractory/mix-components`, `/refractory/material-categories` are not captured by `/refractory/:groupRoute`
- [ ] Tests in §1.5 pass inside Docker; docs in §1.6 updated

**Frontend**

- [ ] `/materials` shows six section cards; tabs switch sections without full reload
- [ ] `MaterialPicker` works for `metal`, `refractory`, `gas`, `library` (categories from E10), `mix-component` (E9) and for combined kinds (`['metal', 'refractory']`)
- [ ] Catalogue requests are cached (one network call per list per session)
- [ ] `toTemperatureGrid` returns K values including both ends and rejects sweeps above `maxPoints`
- [ ] One export per file; types mirror backend DTO field names

---

## Next

→ [STEP_04_METALS.md](STEP_04_METALS.md)
