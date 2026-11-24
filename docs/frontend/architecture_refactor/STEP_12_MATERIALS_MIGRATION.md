# Step 12 — Materials module migration

**Commits:** 8 (7 if commits 12.6 and 12.7 are combined)
**Install:** none

**Goal:** same as Step 11, for the materials module. Every commit follows the section migration checklist in [STEP_11 §1](STEP_11_PROCESSES_MIGRATION.md#1-section-migration-checklist-applies-to-every-section-commit-in-steps-11-and-12), including units, precision and duplication. Text goes to `locales/en/materials.json` under `materials:<section>.*`.

---

## Commits

### Commit 12.1 — Metals

- `MetalConditionsForm` moves to `components/forms/`. Its schema covers the metal selection and the temperature sweep, using the shared sweep schema from Step 07.
- `TemperatureSweepFields` (module-level `components/`) becomes a subform with a prefix, reused by refractories, raw materials and glasses.
  - Its °C/K toggle and `TemperatureSweep.unit` are removed. The sweep is stored in K and shown in the global unit (Step 10).
  - `temperature-grid` and `celsius-grid` are replaced by the shared `rangeByStep`.
- `MetalResults` moves to `components/results/`.
- `MetalPropertiesChart` becomes a `PropertyVsTemperatureChart` configuration (Step 07).

### Commit 12.2 — Refractories

- `RefractoryCatalogList` and `RefractoryResults` move to `components/`. List filtering state goes into `hooks/useRefractoriesSection.ts`.
- The sweep subform comes from 12.1.
- `RefractoryLambdaChart` and `RefractoryEmissivityChart` become `PropertyVsTemperatureChart` configurations; `RefractoryRankingChart` stays.
- ε uses the `fraction` precision and λ the default precision.

### Commit 12.3 — Gases

- `PureGasCalculator`/`PureGasForm` and `GasMixtureCalculator`/`GasMixtureForm`:
  - each gets a view-model hook and a schema;
  - temperature and pressure fields are `temperature` and `pressure` quantities;
  - the mixture composition uses `FormGasComposition`, with its sum validated in the schema;
  - mixture presets fill the form with `form.reset`.
- `CpComparisonPanel`, `PureGasResults` and `GasMixtureResults` move to `components/`.
- Charts: `CpComparisonChart`, `GasMixturePieChart`, `GasPropertyChart`; property charts with a temperature axis use `PropertyVsTemperatureChart`.
- The gas-list hook becomes a `useCatalogueQuery` call.

### Commit 12.4 — Raw materials

- `RawMaterialsSection` state (selected category and material, compare list) moves to `hooks/useRawMaterialsSection.ts`.
- `CalculatedThermalCard` gets `hooks/useCalculatedThermal.ts` and a small form (temperature, porosity) with a schema.
- `MaterialCategoryList`, `MaterialHeader`, `MaterialCompositionCard`, `ReferencePropertiesCard` and `RawMaterialCompare` move to `components/`. The reference property `digits` become `precision`.
- Charts: `EffectiveConductivityChart` and `SpecificHeatChart` become `PropertyVsTemperatureChart` configurations; `MaterialCompositionPieChart` and `ReferenceComparisonChart` stay.

### Commit 12.5 — Glasses

- `GlassesSection`'s 13 `useState` calls and its initialisation during render move to `hooks/useGlassesSection.ts`. That hook holds the form, the selected task, the compare selection and the presets.
- `glass-form.schema.ts` moves to `schemas/` and is rebuilt on `buildNumberFieldsSchema`. The current yup-only validation is replaced by `useCalculatorForm`. The oxide composition uses `FormOxideComposition`. The wt%/mol% toggle stays on the page.
- `glass-grid` is replaced by `rangeByStep`. Fixed-point temperatures are `temperature` quantities. `LOG_DIGITS` becomes the `logViscosity` precision, with a page override in `glasses-precision.constants.ts` if needed.
- The inline `sameComposition` helper moves to `mappers/same-composition.mapper.ts`.
- `GlassTaskTabs` uses `useSearchParamTab`.
- `GlassCompositionForm`, `GlassCompareSelect` and `GlassResults` move to `components/`.
- Charts: `ViscosityCurveChart`, `FixedPointsChart`, `CompositionCompareChart`.

### Commit 12.6 — Mineral compositions: mix

- The `mix/` folder is split:
  - `MixContext.tsx`, `BulkCompositionCard.tsx`, `FractionTable.tsx` and `SizeFractionSelect.tsx` go to `components/mix/`;
  - `mix-context.ts` goes to `context/`;
  - `mix.reducer.ts` goes to `reducers/`.
- The reducer and context stay, because the mix is state shared across tabs. The wt%/mol% toggle in `BulkCompositionCard` stays.
- Composition values use the `compositionPct` precision.
- `MixWorkspace` moves to `components/`.
- The 56 files in `types/` are split into `types/api/`, `types/props/`, `types/form/` and `types/mix/`.
- Charts used by the mix: `BulkCompositionPieChart`, `MixStructureChart`, `FractionMassesChart`.

### Commit 12.7 — Mineral compositions: analyses

- `analyses/` becomes `components/analyses/`: `AnalysisCard`, `ChemicalTab`, `GranulometryTab`, `PackingTab`, `WaterShrinkageTab`, `BlendOptimizerTab`, `BlendOptionsForm`, `ChipToggleGroup`.
- Each tab gets a view-model hook (`useChemicalTab`, …) and, where it has inputs, a schema and `useCalculatorForm`. The mix comes from context, and only the tab's own options are form fields.
- Temperatures in `ChemicalTab` (refractoriness, liquid fraction) and `WaterShrinkageTab` become `temperature` quantities.
- `BlendOptimizerTab`'s logic goes to `hooks/useBlendOptimizerTab.ts`.
- Tabs use `useSearchParamTab`.
- Charts: `BlendResultMapChart`, `ConductivitySweepChart`, `CumulativePsdChart`, `LiquidFractionChart`, `LiquidSolidPieChart`, `MineralPhasesChart`, `PackingModelsChart`, `ParticipationChart`, `PhaseCompositionChart`, `SelectedFormulationChart`, `ShrinkageChart`, `WaterRangeChart`.

If 12.6 and 12.7 are small enough together, they may be a single commit.

### Commit 12.8 — Module-level materials folders

- `components/MaterialPicker.tsx`: its options logic stays in `useMaterialPickerOptions`, and its text goes to keys.
- `hooks/`:
  - only material-specific hooks remain, because the generic ones moved in Step 03;
  - the catalogue hooks (`useMaterialGroups`, `useMaterialCategories`, `useParticleSizes`, `useMixComponents`, `useMetalList`, `useRefractoryProducts`, …) are `useCatalogueQuery` calls (Step 07).
- `mappers/temperature-grid.mapper.ts` and `celsius-grid.mapper.ts` are deleted once unused.
- `types/` is split if it is over the limit.
- `index.ts` exports only what processes uses: `useMaterialThermalProperties`, `MaterialPicker`, `useGasList` and their types.

## Acceptance

- Each commit passes `npm run verify` on its own.
- After the last commit:
  - `lint:refactor` shows zero warnings under `src/modules/materials`;
  - `rg "unit: '(K|°C|Pa)'|TemperatureSweep\['unit'\]|LOG_DIGITS" src/modules/materials` finds nothing.
- Commit messages: `refactor(frontend): step 12.<n> materials <section> migration`.
