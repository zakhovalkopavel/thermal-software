# Step 04 — Backend: Swagger response documentation

**Commits:** 1 (backend)
**Install:** none
**Approval:** granted for **documentation only**: decorators and DTO classes used only by Swagger. No change to services, controllers' logic, validation or response content.

**Goal:** every backend operation documents its 2xx response, so the frontend can generate response types and the contract tests can validate responses.

---

## 1. Current state

Swagger has 68 operations. Request bodies are documented for all 49 POST operations, but only 13 operations document a response schema (the refractory catalogue endpoints, `refractory/phase-equilibrium`, `refractory/mix/composition`, `combustion/fuels` and `metals/list`).

**Operations without a response schema (55):**

| Controller | Operations |
|------------|------------|
| `thermodynamics.controller.ts`, `thermodynamics-fluid.controller.ts` (18) | `POST properties`, `GET cp-compare`, `POST dimensionless/{reynolds,prandtl,grashof,rayleigh,nusselt,htc}`, `POST dimensionless`, `POST body-geometry`, `POST fluid/{cp,viscosity,density,thermal-conductivity}`, `GET fluid/list`, `GET fluid/flow-modes`, `GET geometry/list`, `GET correlations` |
| `refractory.controller.ts` (16) | `POST mineral-phases`, `blend-optimization`, `psd/andreasen`, `psd/funk-dinger`, `packing/cpm`, `packing/furnas`, `participation`, `water-demand`, `water-demand/range`, `shrinkage`, `thermal-conductivity`, `refractoriness`, `glass-viscosity`, `glass-viscosity/profile`, `glass-viscosity/temperature-at-viscosity`, `utils/convert-composition` |
| `numeric.controller.ts` (8) | `POST brentq`, `brent`, `nelder-mead`, `regression/{linear,polynomial,exponential,power,levenberg-marquardt}` |
| `thermal-distribution.controller.ts` (4) | `POST criteria`, `temperature/at-depth`, `temperature/profile`, `temperature/average` |
| `combustion.controller.ts` (4) | `POST solid/direct`, `solid/two-step`, `fluid`, `bed` |
| `thermal-exchange.controller.ts` (1) | `POST multilayer-wall` |
| `metals.controller.ts` (1) | `GET thermal-properties` |
| `recuperator.controller.ts` (1) | `POST calculate` |
| health (2) | `GET /`, `GET /health` |

The numeric endpoints are not used by the frontend, but they are documented too for completeness.

## 2. Baseline before any change

Run the backend checks on the unchanged code first and record the result:

```bash
docker exec thermal-backend sh -c 'cd /app && npm run build && npx jest --json --outputFile=/tmp/jest-baseline.json; echo exit=$?'
```

- Record the passing and failing counts and the names of failing tests in the commit message under `Baseline:`.
- Tests that already fail are not fixed, because that is outside the documentation-only approval. They are reported to the user.
- The acceptance criterion is then "no test that passed in the baseline fails", not "all tests pass".

## 3. Method

1. For each operation, find the type the service actually returns.
2. **If a result DTO class already exists** (for example `temperature-at-depth-result.dto.ts`, `scalar-dimensionless-result.dto.ts`), reuse it.
3. **Otherwise create `<name>-result.dto.ts`** in the module's `dto/` folder:
   - every property gets `@ApiProperty({ description, example })`, with units in the description as in the request DTOs;
   - optional properties get `@ApiPropertyOptional`;
   - nested objects get their own DTO class;
   - arrays use `type: [ItemDto]`;
   - follow the backend one-class-per-file convention.
4. Add `@ApiOkResponse({ type: XResultDto })`, or `@ApiCreatedResponse` matching the actual status code. Use `type: [XDto]` for arrays.
5. Where `@ApiResponse({ status: 200, description })` exists without `type`, add `type`.
6. Do not change return types in method signatures, service code or validation.

**If the actual response disagrees with what the frontend types assume, the DTO documents the actual response.** The disagreement is reported as a finding, not fixed.

## 4. Verification

Run in the backend container:

```bash
docker exec thermal-backend sh -c 'cd /app && npm run build && npm test'
```

Then check that every operation now has a response schema. The check runs from the frontend container, which reaches the backend:

```bash
docker exec thermal-frontend sh -c 'node -e "fetch(\"http://backend:4000/api/docs-json\").then(r=>r.json()).then(d=>{const m=Object.entries(d.paths).flatMap(([p,v])=>Object.entries(v).filter(([,o])=>{const r=o.responses?.[200]||o.responses?.[201];return !r?.content}).map(([k])=>k.toUpperCase()+\" \"+p));console.log(m.length?m.join(\"\\n\"):\"all operations documented\");process.exit(m.length?1:0)})"'
```

Step 05 then validates real responses against these schemas. A DTO that documents the response wrongly shows up there and is corrected within the documentation-only scope.

## 5. Acceptance

- Backend build passes, and no Jest test that passed in the baseline fails.
- The check prints `all operations documented`.
- `git diff --stat` touches only `*.dto.ts` files and controller decorator lines.
- Commit: `docs(backend): document all API responses in Swagger`.

## 6. Results

- **Baseline:** build passes; Jest 925 passed, 0 failed, 56 suites. After the change: the same.
- **Swagger check:** `all operations documented` (all 68 operations).
- **Live check:** every operation was called with its request examples, or with hand-built inputs where the examples were invalid. Each 2xx response was validated against its schema (keys, required fields, types, enums, `nullable`). Result: 0 mismatches. Both branches of `POST refractory/glass-viscosity` were covered: VTF/Arrhenius (`GlassViscosityResultDto`) and slag (`SlagViscosityResultDto`), documented as `oneOf`.
- **Diff:**
  - new `*-result.dto.ts` and nested DTO classes;
  - `@ApiProperty` added to three existing result DTOs that had none: `RecuperatorResultDto`, `MultilayerWallResultDto`, `MetalThermalResultDto`. Their JSDoc unit comments moved into `description`;
  - nested DTOs for free-form objects in `PhaseCalculationResponseDto`, `ScalarDimensionlessResultDto.resolvedFluid` and `GasPropertiesResultDto.diffusion`;
  - one Swagger-only constant, `refractory/constants/slag-thermal-states.constants.ts`;
  - response decorators and imports in the controllers.

  No service, validation, module or method signature changed.
- **`refractory/dto` grouped into subfolders** (requested by the user): `common`, `material-catalog`, `refractory-products`, `mix-composition`, `phase-equilibrium`, `mineral-phases`, `blend-optimization`, `psd`, `packing`, `participation`, `water-demand`, `shrinkage`, `thermal-conductivity`, `refractoriness`, `glass-viscosity`. The DTO specs in `test/unit/refractory/dto` mirror the same folders. `thermodynamics/dto` is grouped the same way: `gas-properties`, `fluid`, `geometry`, `dimensionless`, `catalogue`, `numeric`; the barrel `index.ts` stays at the root. `refractory/dto/glass-viscosity` is split into `viscosity`, `curve`, `fixed-points`, `validation`, and `refractory/services` (with its specs) into `catalog`, `composition`, `particle-packing`, `thermal`. Only file locations and relative import paths changed.
- **Physical constants** (requested by the user): the static constants of `Common` moved to `common/thermal/constants/physical.constants.ts` as named exports (`GAS_CONSTANT_J_MOLK`, `STANDARD_GRAVITY_M_S2`, `STANDARD_PRESSURE_PA`, `STANDARD_TEMPERATURE_K`, `STEFAN_BOLTZMANN_W_M2K4`, `BOLTZMANN_CONSTANT_J_K`, `AVOGADRO_CONSTANT_PER_MOL`). The `101325` literals in `GasPropertiesService` and `COMBUSTION.ATMOSPHERIC_PRESSURE_PA` now use `STANDARD_PRESSURE_PA`. Values are unchanged.
- **Gas constant** (approved by the user): the rounded copies `R = 8.314` (`GAS_CONSTANT` in `refractory/constants/calculation-constants.ts`, `NAKAMOTO_2007.R`, the local constant in `glass-viscosity-iida.util.ts`) were removed; shrinkage, Iida and Nakamoto now use `GAS_CONSTANT_J_MOLK`. Results of these Arrhenius terms shift by about 0.05–0.4 %; all tests still pass.
- **Module constants** (approved by the user): numeric constants declared inside services and utils moved to constants files, values unchanged:
  - `THERMOCHEMICAL_REFERENCE_TEMPERATURE_K` (298.15) in `physical.constants.ts`, used by `GasPropertiesService` and `COMBUSTION.T_REF_K`;
  - `COMBUSTION.COMPOSITION_SUM_TOL` (fuel resolver);
  - `thermal-exchange/constants/multilayer-wall.constants.ts` (root tolerance and the low-temperature outer α correlation);
  - `thermodynamics/constants/radiation.constants.ts` (`RADIATION_DT_MIN_K`);
  - `thermal-distribution/constants/thermal-distribution.constants.ts` (series terms, Simpson intervals, eigenvalue tolerances, Gauss nodes, average mode);
  - `common/utils/quadrature.constants.ts` (oscillation detector);
  - `refractory/constants/phase-equilibrium.constants.ts` (eutectic temperature and composition);
  - `ThermalPerformanceService` now uses the existing `calculation-constants.ts` values instead of private duplicates; the unused `BASE_CP` was dropped.

### Findings (reported, not fixed)

1. `fluid: 'air'` returns 500 "No Sutherland parameters for air" on `dimensionless/{reynolds,prandtl,grashof,nusselt,htc}` and `POST dimensionless`. The backend's own Swagger examples `pipeAir`, `pipeForcedAir` and the only `grashof` example hit it.
2. `fluid/viscosity` and `fluid/density` reject `fluid: 'air'` with 400 "Unknown fluid: air", while `fluid/cp` accepts it.
3. Numeric regressions never return `r2`, because the library result has no `r2`. It is documented as optional.
4. Levenberg-Marquardt returns `parameterError` as a number, while `CurveFitResult` declares `number[]`. The DTO documents the number.
5. The `WaterDemandDto.workability` example is `"STANDARD"`, but validation accepts only `firm`, `standard`, `flowable`, so the Swagger "Try it out" request fails with 400.
6. `POST refractory/shrinkage` ignores `cementType` and `holdTime_hours`; the response always reports `cementType: "generic"`.
7. `POST refractory/glass-viscosity` returns a different shape for slag models (IIDA, NAKAMOTO_2007): no `model` object, no fixed points, `logViscosity_Pas` instead of `logViscosity`, and `secondaryModel` as the enum key. The profile and temperature-at-viscosity endpoints instead return the human-readable model name.
8. The request enum for `model` allows only `LAKATOS_1976`, `FLUEGEL_2007` and `HETHERINGTON_1964`; slag models are reachable only through auto-selection.
9. `RefractorinessDto.standard` allows `GOST4069`, while `RefractorinessStandard` in the interfaces says `GOST_4069`, and `ASTM_C71` is missing there. The service uses `GOST4069` and `ASTM_C71`.
