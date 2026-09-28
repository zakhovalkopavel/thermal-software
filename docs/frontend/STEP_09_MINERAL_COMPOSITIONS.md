# STEP 09 — Materials: Mineral compositions (mixes of fractions)

**Priority:** HIGH  
**Depends on:** [STEP_02_SHARED_CALC_COMPONENTS.md](STEP_02_SHARED_CALC_COMPONENTS.md), [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md)  
**Frontend root:** `frontend/src/modules/materials/sections/mineral-compositions/`  
**Backend:** `refractory.controller.ts` (+ `POST /refractory/mix/composition` — approved, specified in §2, not implemented)

---

## Goal

A **mineral composition** is a mechanical mix of **raw materials** taken in several **size fractions**. Mix components are library materials whose primary group is one of: **binders, oxides, silicates, clays, carbides, nitrides** (served by `GET /refractory/mix-components`, [Step 3](STEP_03_MATERIALS_MODULE.md) E9). More groups will be added later — glass frits, fluoride salts, sulfates, nitrates, chlorides, borates, phosphates — by extending the backend constant `MIX_COMPONENT_GROUPS`; the frontend needs no change for that.

Refractory products (fired bricks, sands, fibre mats), metals and gases are not mix components.

The user builds the mix once, and then runs analyses on it:

- **Chemical** — bulk oxide composition of the mix → phase equilibrium, mineral phases, refractoriness, effective thermal conductivity.
- **Granulometric** — how close the fractions are to an ideal particle-size distribution; reaction participation.
- **Packing** — packing fraction φ and green porosity.
- **Water and shrinkage** — water demand for a workability level; drying + firing shrinkage.
- **Optimisation** — blend optimiser proposes better mass fractions.

```mermaid
flowchart LR
  Mix[Mix table] --> Bulk["Bulk composition (mix/composition)"]
  Bulk --> Chem[Chemical analyses]
  Mix --> Psd[Granulometry]
  Mix --> Pack[Packing]
  Pack -->|"phi"| Water[Water demand]
  Mix --> Opt[Blend optimiser]
  Opt -->|"apply fractions"| Mix
```

The mix lives in one section-level state (React context + `useReducer`) so every analysis tab works on the same mix without re-entering it.

---

## 1. Mix builder

### Row model

```ts
// types/mix-fraction.type.ts
export type MixFraction = {
  id: string;                 // client uuid
  materialId: string;         // mix component from GET /refractory/mix-components
  sizeCode?: string;          // key from GET /refractory/particle-sizes (e.g. FINE_03_01)
  dMin_mm: number;
  dMax_mm: number;
  d50_mm: number;             // from size class; editable for custom sizes
  massPercent: number;        // 0–100
  density_kgm3: number;       // default = rho_true_after_firing_kgm3, editable
  isFixed?: boolean;          // keep this fraction constant in the optimiser
};
```

### UI — `FractionTable`

```
┌ Material ──────────┬ Size fraction ──────┬ dMin–dMax / d50 ┬ Mass % ┬ ρ kg/m³ ┬ Fixed ┐
│ Tabular alumina ▾  │ Coarse 1–3 mm ▾     │ 1.0–3.0 / 2.0   │ 35     │ 3950    │ ☐     │
│ Tabular alumina ▾  │ Fine 0.1–0.3 mm ▾   │ 0.1–0.3 / 0.2   │ 25     │ 3950    │ ☐     │
│ Calcined alumina ▾ │ Powder 0.01–0.05 ▾  │ …               │ 25     │ 3900    │ ☐     │
│ CAC cement ▾       │ Cement ▾            │ …               │ 15     │ 3000    │ ☑     │
└────────────────────┴─────────────────────┴─────────────────┴────────┴─────────┴───────┘
 [+ Add fraction]   Σ = 100 %   [Normalize]
```

- Material: `MaterialPicker kinds={['mix-component']}` — sections Binders, Oxides, Silicates, Clays, Carbides, Nitrides in the order returned by `GET /refractory/mix-components` (60 materials today).
- The backend decides eligibility (primary group in `MIX_COMPONENT_GROUPS`, `paper_clay` excluded for its paper fibre); the frontend holds no list of allowed or excluded materials.
- Every row therefore has a library composition and density: all rows take part in every analysis, including chemistry.
- Size fraction: select from the material's `availableParticleSizes` first, then all standard classes, mesh, FEPA F/P, or **Custom** (enter dMin, dMax, d50).
- Same material may appear in several rows (different sizes).
- Mass % must sum to 100 (Normalize button); converted to fractions 0–1 for the API.

### Backend constraints to enforce in the form

| Constraint | Source | Frontend handling |
|------------|--------|-------------------|
| `density_kgm3` 1000–4000 | `FractionInputDto` (blend optimiser) | Warn and exclude the optimiser tab when a row is outside (e.g. zirconia ≈ 5700) |
| `massFraction` 0–1 | `FractionInputDto` | Send `massPercent / 100` |
| Only 8 oxides accepted by chemical endpoints | `OxideCompositionDto` + `forbidNonWhitelisted` | Send `acceptedOxides_normalized` from §2; show other oxides and non-oxide components with their % |
| Mix components only (binders, oxides, silicates, clays, carbides, nitrides; no fibre materials) | E9 + `POST /refractory/mix/composition` (400 otherwise) | Picker offers only E9 materials |

---

## 2. Mix composition (entry point for chemistry)

> **Approved, specified, not implemented.** New backend calculation, approved by the owner. No existing endpoint does this: the legacy `MixLibraryService.calculateOxideComposition` is a stub that returns `{}`. The chemical tab stays disabled until the endpoint exists. Depends on `MixComponentCatalogService` from [Step 3 §1.4](STEP_03_MATERIALS_MODULE.md).

### 2.1 Endpoint

`POST /refractory/mix/composition` — `@HttpCode(200)`, tag `Refractory Calculations`, handler in the existing `RefractoryController`.

```json
// request — mix components only (GET /refractory/mix-components)
{ "fractions": [ { "materialId": "alumina_tabular", "massFraction": 0.35 }, … ] }

// response
{
  "basis": "fired",
  "lossOnIgnition_wt": 1.4,
  "acceptedOxides_wt": { "Al2O3": 93.6, "CaO": 4.3, "SiO2": 0.2, … },
  "acceptedOxides_normalized": { "Al2O3": 95.1, "CaO": 4.4, … },
  "otherOxides_wt": { "B2O3": 0.3 },
  "nonOxideComponents_wt": { "carbide": 1.2 },
  "droppedMetals_wt": 0.01,
  "trueDensity_kgm3": 3840,
  "warnings": []
}
```

| Status | When |
|--------|------|
| 200 | calculated |
| 400 | validation error; Σ `massFraction` = 0; material is not a mix component (primary group not in `MIX_COMPONENT_GROUPS`, e.g. `soda_lime_glass`, `calcium_fluoride`) or is excluded (`paper_clay`) |
| 404 | `materialId` not in the library (includes refractory product ids such as `chamotte_solid`) |

### 2.2 Calculation rules

Composition keys of each material are classified in this order (first match wins):

| # | Class | Keys | Goes to |
|---|-------|------|---------|
| 1 | Loss on ignition | `H2O`, `CO2`, `OH`, `Organic` | `lossOnIgnition_wt` |
| 2 | Accepted oxide | `SiO2`, `Al2O3`, `CaO`, `MgO`, `Fe2O3`, `K2O`, `Na2O`, `TiO2` (the fields of `OxideCompositionDto`) | `acceptedOxides_wt` |
| 3 | Other oxide | formula of one or more elements followed by `O` and an optional count (`B2O3`, `P2O5`, `ZrO2`, `Cr2O3`, `FeO`, `MnO2`, `SO3`, `Pr6O11`, …) | `otherOxides_wt`, one entry per key |
| 4 | Metal impurity | elemental metal key (`Fe`, `Ti`, `Si`, `Al`, `Ca`, `Mg`, `Na`, `K`, `Mn`, `Zr`, `La`, `Cr`) **below 1 wt%** of its material | dropped, total in `droppedMetals_wt` |
| 5 | Carbon | `C` | `nonOxideComponents_wt.carbon` |
| 6 | Non-oxide | everything else (`SiC`, `TiC`, `B4C`, `AlN`, `BN`, `TiN`, `N`, `O`, metal keys ≥ 1 wt%, …) | `nonOxideComponents_wt.carbide` or `.nitride` when the material's primary group is `carbide` / `nitride`, otherwise `.other` |

Examples: silicon nitride `{ Si: 60, N: 40 }` → 100 % `nitride`; titanium carbide `{ TiC: 98.5, TiO2: 0.8, C: 0.4, Fe: 0.3 }` → 98.5 `carbide`, 0.8 `TiO2`, 0.4 `carbon`, 0.3 dropped; raku clay `Grog: 15.0` → `other` (and triggers the warning below).

Extension note: when later groups are enabled, class 6 gains their buckets (`fluoride`, `chloride`), class 3 already covers sulfates (`SO3`) and nitrates (`N2O5`) as other oxides, and the loss-on-ignition keys must be reviewed for salts that decompose on firing. Each such rule change is part of enabling that group.

Formulas, with `wᵢ` = request mass fractions rescaled to Σ = 1 and `cᵢ,k` = wt% of key `k` in material `i`:

| Quantity | Formula |
|----------|---------|
| Raw mix | `c_raw,k = Σᵢ wᵢ · cᵢ,k` |
| `lossOnIgnition_wt` | `LOI = Σ_{k ∈ class 1} c_raw,k` |
| Fired mass base | `F = Σ_{k ∈ classes 2,3,5,6} c_raw,k` (dropped impurities excluded) |
| Fired share of key `k` | `c_fired,k = 100 · c_raw,k / F` → `acceptedOxides_wt`, `otherOxides_wt`, `nonOxideComponents_wt` |
| `droppedMetals_wt` | `100 · Σ_{k ∈ class 4} c_raw,k / F` |
| `acceptedOxides_normalized` | `100 · c_fired,k / Σ_{k ∈ class 2} c_fired,k` (empty object if no accepted oxide is present) |
| `trueDensity_kgm3` | `1 / Σᵢ (w′ᵢ / ρᵢ)` with fired mass fractions `w′ᵢ = wᵢ · (100 − LOIᵢ) / Σⱼ wⱼ · (100 − LOIⱼ)` and `ρᵢ = rho_true_after_firing_kgm3` |
| `warnings` | one entry when `Σ otherOxides_wt + Σ nonOxideComponents_wt > 5` % of fired mass: chemical analyses use only the accepted oxides and are less reliable |

Numbers are returned unrounded; the frontend formats them.

### 2.3 Backend files

One construct per file. Paths relative to `backend/src/modules/refractory/`.

| File | Export | Content |
|------|--------|---------|
| `enums/composition-basis.enum.ts` | `enum CompositionBasis` | `FIRED = 'fired'` |
| `enums/non-oxide-component-group.enum.ts` | `enum NonOxideComponentGroup` | `CARBIDE`, `NITRIDE`, `CARBON`, `OTHER` (lower-case values) |
| `constants/mix-composition.constants.ts` | `MIX_COMPOSITION_CONSTANTS` | `lossOnIgnitionKeys`, `acceptedOxideKeys`, `oxideKeyPattern`, `metalElementKeys`, `metalImpurityThreshold_wt: 1`, `carbonKey: 'C'`, `nonOxidePrimaryGroups: { carbide, nitride }`, `reliabilityWarningThreshold_wt: 5` |

Mix eligibility (`MIX_COMPONENT_GROUPS`, `MIX_EXCLUDED_MATERIAL_IDS`) is defined once in Step 3 and applied through `MixComponentCatalogService.getMixComponent()`.
| `dto/mix-component-input.dto.ts` | `MixComponentInputDto` | `materialId` — `@IsString() @IsNotEmpty()`; `massFraction` — `@IsNumber() @Min(0) @Max(1)` |
| `dto/mix-composition-input.dto.ts` | `MixCompositionInputDto` | `fractions` — `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => MixComponentInputDto)` |
| `dto/non-oxide-components.dto.ts` | `NonOxideComponentsDto` | optional `carbide`, `nitride`, `carbon`, `other` (wt% of fired mass) |
| `dto/mix-composition-result.dto.ts` | `MixCompositionResultDto` | `basis: CompositionBasis`, `lossOnIgnition_wt`, `acceptedOxides_wt: OxideCompositionDto`, `acceptedOxides_normalized: OxideCompositionDto`, `otherOxides_wt: Record<string, number>`, `nonOxideComponents_wt: NonOxideComponentsDto`, `droppedMetals_wt`, `trueDensity_kgm3`, `warnings: string[]` |
| `services/mix-composition.service.ts` | `MixCompositionService` | `calculate(dto: MixCompositionInputDto): MixCompositionResultDto`; injects `MixComponentCatalogService` (`getMixComponent`: 404 unknown, 400 not a mix component / excluded); private helpers for key classification, mixing and density |
| `controllers/refractory.controller.ts` | existing `RefractoryController` | add `@Post('mix/composition') @HttpCode(HttpStatus.OK) calculateMixComposition(@Body() dto: MixCompositionInputDto): MixCompositionResultDto` → `mixCompositionService.calculate(dto)` |
| `refractory.module.ts` | existing | add `MixCompositionService` to `providers` and `exports` |

`OxideCompositionDto` is reused from the existing `dto/common.dto.ts` (not moved in this change).

### 2.4 Backend tests

Inside Docker: `docker compose exec backend npm run test -- mix-composition`.

| File | Covers |
|------|--------|
| `test/unit/refractory/services/mix-composition.service.spec.ts` | single oxide material (tabular alumina) → accepted oxides = its composition rescaled; kaolin: `LOI = 14`, `Al2O3`/`SiO2` rescaled to 100; repeated material rows add up; fractions not summing to 1 are rescaled; Σ = 0 → 400; `paper_clay`, `soda_lime_glass`, `calcium_fluoride` → 400; unknown id and `chamotte_solid` → 404; binder + oxide + silicate + clay + carbide + nitride in one mix; titanium carbide classification (carbide, TiO2, carbon, dropped Fe); silicon nitride → 100 % nitride; raku clay `Grog` → `other` + warning; warning threshold boundary (5 % exactly → no warning); `trueDensity_kgm3` for a two-material mix vs hand calculation; `acceptedOxides_normalized` sums to 100 |
| `test/unit/refractory/dto/mix-composition-input.dto.spec.ts` | empty `fractions` rejected; `massFraction` < 0 or > 1 rejected; missing `materialId` rejected; nested unknown property rejected |

### 2.5 Backend documentation (Definition of Done)

| Document | Entry |
|----------|-------|
| `docs/api/REFRACTORY_API_SPEC.md` | `POST /mix/composition` request, response, errors |
| `docs/algorithms/MIX_COMPOSITION_ALGORITHM.md` (new) + `docs/algorithms/ALGORITHMS_INDEX.md` | classification table and formulas of §2.2 |
| `docs/INTERFACES_IMPLEMENTATION_INDEX.md` | new DTOs and enums |
| `docs/migration/IMPLEMENTATION_STATUS.md` | new service and tests |

### 2.6 Frontend

Shown read-only in `BulkCompositionCard`: the 8 accepted oxides via `OxideCompositionInput readOnly` (wt% / mol% toggle through `utils/convert-composition`), then loss on ignition, other oxides, non-oxide components, true density and warnings as separate rows. It refreshes automatically (debounced) when the mix changes.

The types `MixComponentInput`, `MixCompositionInput`, `NonOxideComponents`, `MixCompositionResult` and the API object `mixCompositionApi` are **module-level** ([Step 3 §2.2](STEP_03_MATERIALS_MODULE.md)), because Raw materials ([Step 7](STEP_07_RAW_MATERIALS.md)) calls the same endpoint for a single material. Section files:

| File (under `sections/mineral-compositions/`) | Export | Role |
|-----------------------------------------------|--------|------|
| `mappers/mix-composition-request.mapper.ts` | `toMixCompositionInput(fractions: MixFraction[])` | all rows; `massPercent / 100`; returns `null` for an empty mix |
| `hooks/useMixComposition.ts` | `useMixComposition(fractions)` | `useQuery` keyed by the mapped input, debounced by `MIX_COMPOSITION_UI.debounce_ms`; disabled when the mapper returns `null` |
| `constants/mix-composition-ui.constants.ts` | `MIX_COMPOSITION_UI` | `debounce_ms` |

---

## 3. Analysis tabs

### 3.1 Chemical

All use `composition` = `acceptedOxides_normalized` from §2.

| Analysis | Endpoint | Extra inputs | Key outputs |
|----------|----------|--------------|-------------|
| Phase equilibrium | `POST /refractory/phase-equilibrium` | `temperature` °C, `totalMass?` | liquid / solid %, masses, compositions, mineral phases, eutectic T, liquidus, warnings |
| Mineral phases | `POST /refractory/mineral-phases` | `temperature?` °C (default 1400) | identified minerals and amounts |
| Refractoriness | `POST /refractory/refractoriness` | `standard` ∈ `ISO1893`, `ASTM_C24`, `ASTM_C71`, `GOST4069`; `testTemperature?` | PCE / RUL per standard |
| Effective λ | `POST /refractory/thermal-conductivity` | `temperature`, `porosity?` (prefill from packing `porosity_initial`) | λ_eff (Maxwell–Eucken) |

Legacy UX reference: `legacy/refractory/public/phase-calculator.html`.

### 3.2 Granulometry

| Analysis | Endpoint | Body built from mix |
|----------|----------|---------------------|
| Andreasen | `POST /refractory/psd/andreasen` | `fractions: [{ dMin_mm, dMax_mm, massFraction, isFixed }]`, `q` (default 0.37), `Dmin_mm?`, `Dmax_mm?` |
| Funk–Dinger | `POST /refractory/psd/funk-dinger` | same + `Dmin_mm` |
| Participation | `POST /refractory/participation` | `fractions: [{ dMin_mm, dMax_mm, massFraction }]` |

Show actual vs ideal mass % per fraction side by side (table + charts in section 4).

### 3.3 Packing

| Model | Endpoint | Body built from mix |
|-------|----------|---------------------|
| CPM | `POST /refractory/packing/cpm` | `massFractions[]`, `densities_kgm3[]`, `diameters_mm[]` (= d50), `compactionPressure_MPa?` |
| Furnas | `POST /refractory/packing/furnas` | same + `efficiencyFactor?` |

Outputs: `packingFraction_phi`, `porosity_initial`, CPM calibration metadata. Store φ and porosity in the mix context for the Water and Chemical tabs.

### 3.4 Water and shrinkage

| Analysis | Endpoint | Inputs |
|----------|----------|--------|
| Water demand | `POST /refractory/water-demand` | `packingFraction` (φ from packing tab), `workability` ∈ `firm` \| `standard` \| `flowable` (lower-case enum values) |
| Water range | `POST /refractory/water-demand/range` | `packingFraction` |
| Shrinkage | `POST /refractory/shrinkage` | `temperatureProfile_C[]`, `waterCementRatio?`, `cementContent?`, `cementType?` (`PC`\|`CAC`\|`generic`), `holdTime_hours?` |

Water tab is disabled until φ is available (run packing first, or type φ manually).

### 3.5 Blend optimisation

`POST /refractory/blend-optimization`

```json
{
  "fractions": [ { "materialId": "…", "dMin_mm": 1, "dMax_mm": 3, "massFraction": 0.35, "isFixed": false, "density_kgm3": 3950 } ],
  "options": { "qValues": [0.25, 0.3, 0.37], "methods": ["andreasen", "funk_dinger"], "packingModels": ["CPM"], "waterCementRatio": 0.5 }
}
```

Results: ranked list (`rank`, `method`, `q`, `packingModel`, `massFractionsRoundedPercent`, `packingEfficiency`, `porosity_percent_green`, `rhoBulk_gml_green`, `waterDemand_percent`, shrinkage), best-by highlights, viable ranges (`summary`, `componentRanges[].formatted`).

**Apply to mix** button on a result row writes its mass fractions back into the mix table (fixed rows untouched).

Legacy UX reference: `legacy/refractory/public/blend-optimizer.html`.

---

## 4. Charts

Series are built by pure functions in `mappers/`, one per chart (cumulative sums, sorting by size, unit scaling).

### Mix builder

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Mix structure | `CategoryBarChart` (stacked columns) | categories = size fractions sorted coarse → fine (label `dMin–dMax mm`); stacks = materials; y = mass % |
| Mix composition | `PieChart` | fired basis: the 8 accepted oxides (wt%, or mol% with the toggle), then one slice each for other oxides and each non-oxide group, hatched; loss on ignition in the subtitle |

### Chemical tab

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Liquid / solid at T | `PieChart` | `liquid.percent`, `solid.percent` |
| Phase compositions | `CategoryBarChart` (grouped) | categories = oxides; series = liquid composition, solid composition |
| Liquid fraction vs T | `XYLineChart` | x = T [°C]; y = liquid % ; built by an optional sweep (from / to / step, ≤ 25 points) over `phase-equilibrium`; plot lines at `metadata.eutecticTemperature` and `metadata.estimatedLiquidus` |
| Mineral phases | `CategoryBarChart` (horizontal) | minerals and amounts from `mineral-phases` |
| λ_eff vs T | `XYLineChart` | x = T [°C]; y = λ_eff [W/(m·K)]; sweep over `thermal-conductivity` (≤ 25 points); second series with porosity = 0 for comparison |

### Granulometry tab

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Cumulative PSD (CPFT) | `XYLineChart` | x = particle size d [mm], **logarithmic**; y = cumulative % finer, 0–100 linear; series: *actual mix* (step markers at each fraction's `dMax_mm`), *Andreasen ideal (q)*, *Funk–Dinger ideal (q, Dmin)* — ideal curves from the endpoint responses at the same fraction boundaries |
| Fraction masses | `CategoryBarChart` (grouped) | categories = fractions; series = actual %, ideal % (`massFractionsRoundedPercent`) |
| Participation | `CategoryBarChart` | participation share per fraction |

A q slider (0.2–0.5) re-requests the ideal curves (debounced 300 ms) so the user sees the curve move.

### Packing, water and shrinkage tabs

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Packing models | `CategoryBarChart` | CPM vs Furnas: φ and porosity (two series) |
| Water demand range | `CategoryBarChart` | min / typical / max water % from `water-demand/range`; marker for the selected workability |
| Shrinkage vs T | `XYLineChart` | x = firing temperature [°C] (`firing[]` entries); y = linear shrinkage %; first point = drying shrinkage; horizontal line = `total` |

### Blend optimiser tab

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Result map | `ScatterChart` (bubble) | x = `waterDemand_percent`; y = `packingEfficiency`; bubble size = `porosity_percent_green` (inverted: smaller = better); colour by `method`; best-by results highlighted; **click a point → selects the row** and enables "Apply to mix" |
| Selected formulation | `CategoryBarChart` (stacked, 100 %) | current mix vs selected result, per fraction |
| Viable ranges | `CategoryBarChart` (columnrange-like: min–max with avg marker) | per component from `componentRanges` |

---

## Files

One export per file (conventions in [Step 3 §2.1](STEP_03_MATERIALS_MODULE.md)).

```
sections/mineral-compositions/
├── MineralCompositionsSection.tsx
├── mix/
│   ├── MixContext.tsx                     # context provider only
│   ├── mix.reducer.ts                     # mixReducer: fractions, phi, porosity
│   ├── FractionTable.tsx
│   ├── SizeFractionSelect.tsx
│   └── BulkCompositionCard.tsx
├── analyses/
│   ├── ChemicalTab.tsx                    # phase eq, minerals, refractoriness, λ_eff
│   ├── GranulometryTab.tsx
│   ├── PackingTab.tsx
│   ├── WaterShrinkageTab.tsx
│   └── BlendOptimizerTab.tsx
├── charts/                                # one component per chart in section 4
├── api/                                   # one object per endpoint group (mix-composition.api.ts, psd.api.ts, packing.api.ts, …)
├── hooks/                                 # useMixComposition.ts, …
├── mappers/                               # one function per file: mix-composition-request.mapper.ts,
│                                          #   andreasen-request.mapper.ts, cpm-request.mapper.ts, …, cumulative-psd-series.mapper.ts, …
├── constants/                             # mix-composition-ui.constants.ts, …
└── types/                                 # one type per file: mix-fraction.type.ts, mix-composition-result.type.ts, …
```

All request-body shaping and chart-series building live in `mappers/` as pure functions (unit-testable), one per file.

---

## Acceptance criteria

- [ ] A 4-fraction mix can be built from library materials and standard size classes; Σ = 100 % enforced
- [ ] Picker offers only `GET /refractory/mix-components` materials, grouped Binders / Oxides / Silicates / Clays / Carbides / Nitrides
- [ ] Mix composition updates when the mix changes: fired basis, loss on ignition, accepted oxides (wt% / mol%), other oxides, non-oxide groups, true density, warnings
- [ ] Chemical tab runs all four analyses on `acceptedOxides_normalized`; never causes a 400
- [ ] Andreasen / Funk–Dinger show actual vs ideal per fraction
- [ ] Packing φ flows into water demand and λ_eff porosity
- [ ] Blend optimiser results can be applied back to the mix (also by clicking a point in the result map)
- [ ] Cumulative PSD chart on a logarithmic size axis shows actual vs Andreasen / Funk–Dinger; q slider updates it
- [ ] Mix structure, bulk composition, phase, shrinkage and optimiser charts render from API data
- [ ] Rows violating backend limits (density) are flagged before sending

---

## Next

→ [STEP_10_PROCESS_CALCS.md](STEP_10_PROCESS_CALCS.md)
