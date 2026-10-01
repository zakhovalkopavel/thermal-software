# Step 11 — Processes module migration

**Commits:** 5, one per section
**Install:** none

**Goal:** bring each processes section to the target layout in a single pass, touching every file once.

---

## 1. Section migration checklist (applies to every section commit in Steps 11 and 12)

1. **Layout:**
   - only `<Name>Section.tsx` stays at the section root;
   - other components go to `components/` (subfolders `forms/`, `panels/`, `results/` where useful) and charts to `charts/`.
2. **View-model hook:** `hooks/use<Name>Section.ts` (and one per calculator, for example `useHtcCalculator.ts`) owns form setup, queries, derived data and handlers. Components only render.
3. **Form:**
   - `schemas/<name>-form.schema.ts` is built with `buildNumberFieldsSchema(specs)` plus `.when()` rules;
   - sweeps use the shared sweep schemas from Step 07;
   - the form uses `useCalculatorForm`, `CalculatorForm` and the `Form*` wrappers;
   - removed: local draft `useState`, `try/catch`, `formError`, `assertRequiredNumbers`, throwing checks in mappers.
4. **Units and precision (Step 10):**
   - every temperature and pressure field spec declares its `quantity`; temperature offsets are `temperatureDelta`;
   - form values are canonical (K, Pa), and request mappers no longer convert °C to K;
   - result cards, table columns and chart axes declare their `quantity` and drop their `°C`, `K` and `Pa` literals;
   - `digits` and `*_DIGITS` overrides become `precision`; section-wide needs go into `constants/<section>-precision.constants.ts` with `PrecisionScope`.
5. **Text:**
   - every literal becomes a key in `locales/en/<module>.json` under `<module>:<section>.*`;
   - constants (`*_FIELDS`, modes, tabs, shapes, chart titles) store `labelKey` and `titleKey`;
   - the temporary `label` fallback is no longer used.
6. **Duplication:**
   - before writing a helper, hook, chart or schema, look in `shared/` and the already migrated sections;
   - anything that two places need moves to `shared/` in this commit;
   - the `jscpd` report for the section's folder shows no new clone.
7. **Constants:** no top-level constants or helpers remain in `.tsx` files.
8. **Types:** if `types/` has more than about 12 files, split it into `types/api/` (generated aliases), `types/props/` and `types/form/`.
9. **Imports:** use `@/…` across folders, `./` within a folder, and other modules only via their `index.ts`.
10. **Tests:**
    - update the characterization tests where the mapper contract changes (no throw, no unit conversion);
    - add schema unit tests;
    - add the component tests from [TESTING.md §4.3](TESTING.md#43-component-tests-srctesttsx), including one that switches the temperature unit;
    - the contract cases must pass unchanged, which proves the request bodies are identical.
11. **Gate:** `npm run verify` passes, and `lint:refactor` shows zero warnings for this section's folder.

## 2. Commits

### Commit 11.1 — Multilayer wall

- `MultilayerWallSection` logic goes to `hooks/useMultilayerWallSection.ts`.
- `WallLayersEditor` (module-level `components/`) becomes a `useFieldArray` editor (`FormWallLayers`). Layer material choice uses `useWallMaterialNames`.
- Wall presets fill the form with `form.reset(preset)`.
- `MaterialPropertyLookup` writes λ and ε into the selected layer through `setValue`. Its temperature input becomes a `temperature` quantity instead of a fixed °C field.
- `wall-request.mapper` and `wall-layers-request.mapper` only convert values.
- Charts: `HeatFluxChart`, `WallTemperatureChart`, `InnerHtcPieChart`. Their axis and series configuration moves to constants. The `WallTemperatureChart` axis is a `temperature` quantity.

### Commit 11.2 — Thermal distribution

- `ThermalInputsForm` moves to `components/forms/`. Schema rules:
  - shape-dependent dimension fields;
  - `alpha` required only for BC III;
  - initial profile options.
- `Tc` and `T0`, today fixed in °C, become `temperature` quantities stored in K. The °C-to-K conversion in `thermal-request.mapper` is removed.
- `panels/` (`CriteriaPanel`, `AtDepthPanel`, `ProfilePanel`, `AveragePanel`) moves to `components/panels/`. Each panel's data hook stays in `hooks/`.
- `TemperatureProfileChart` and `AverageTemperatureChart` axes become `temperature` quantities. `tau-sweep-grid` and `relative-depth-grid` use the shared `linspace`.
- Tabs use `useSearchParamTab` (from Step 07).
- The excluded shapes (`plate`, `auto`, `V_over_A`) stay excluded and are documented in the catalogue contract exclusions.

### Commit 11.3 — HTC

- `HtcCalculator`:
  - `hooks/useHtcCalculator.ts` is the view-model hook;
  - `schemas/htc-form.schema.ts` has the fluid-mode rules (named fluid vs gas mix), velocity limits and geometry dimensions;
  - the velocity sweep form is part of the same form, and `velocity-grid` uses `linspace`;
  - fluid temperature is a `temperature` quantity, and `P_Pa` is a `pressure` quantity.
- `BodyGeometryCalculator` is already migrated (Steps 08 and 10). Only the move to `components/` and its text remain.
- `HtcResults` correlation table uses declarative columns.
- Charts: `HtcVelocityChart`, `NusseltReynoldsChart`.

### Commit 11.4 — Combustion

- Form model: `{ mode, solidDirect, solidTwoStep, fluid, bed }`. Only the active mode's subtree is validated (`yup.lazy` on `mode`).
- `forms/` moves to `components/forms/`, and every mode form becomes a subform with a name prefix:
  - `BedForm`, `FluidForm`, `SupplyModeForm`, `SupplyFields`, `CondensedFuelFields`, `CombustionModeForm`;
  - each uses `useFormContext()` and a `prefix` prop.
- `AdvancedFields` (module-level) becomes a subform component.
- `BedLayersTable` becomes a `useFieldArray` editor.
- Temperatures (air, fuel, flame, bed layers) are `temperature` quantities. The bed pressure drop is a `pressure` quantity. `excess-air-grid` uses `rangeByStep`.
- The hand-off to Recuperator keeps the router state shape (`CombustionHandOff`) and is built from the form values.
- Results: `CombustionResults` and `CombustionProductsTable` use declarative columns.
- Charts: `BedProfileChart`, `ExcessAirSweepChart`, `MassBalanceChart`, `ProductCompositionChart`.
- Module-level `hooks/useFuels.ts` becomes a `useCatalogueQuery` call. `combustion` types are split into `types/api|props|form`.

### Commit 11.5 — Recuperator

- Form model: `{ combustion, recuperator }`. The combustion part reuses the subforms from 11.4 with the prefix `combustion`.
- Schema rules: `h0_m` and `nPasses` only for `circle_in_ring`; materials λ and ε limits.
- `tAirStart_K` is a `temperature` quantity, and `airPreheat_K` is a `temperatureDelta`.
- `CombustionHandOff` router state becomes `defaultValues.combustion`. The "Edit here" behaviour stays.
- `MaterialPropertyLookup` writes λ and ε through `setValue`.
- Charts: `CounterFlowChart`, `EnergyBalanceChart`, `FlameTemperatureChart`, `VelocitiesChart`. Their temperature axes become `temperature` quantities instead of K literals.

### Module-level processes folders

Handled inside the commits above as their consumers migrate:
- `components/NumberFieldGrid.tsx` is deleted once the last consumer uses `FormNumberFieldGrid`, in commit 11.5;
- `mappers/required-numbers.mapper.ts` is deleted in commit 11.5 if it has no remaining consumers, and otherwise in Step 12 or 13;
- `ProcessesHub` and `ProcessesLayout` text was already handled in Step 09.

## 3. Acceptance

- Each of the five commits passes `npm run verify` on its own.
- After commit 11.5:
  - `rg "formError|assertRequiredNumbers|try \{" src/modules/processes` finds nothing;
  - `rg "unit: '(K|°C|Pa)'" src/modules/processes` finds nothing;
  - `lint:refactor` shows zero warnings under `src/modules/processes`.
- Commit messages: `refactor(frontend): step 11.<n> processes <section> migration`.
