Service Test Specification
==========================

Goal
----
Provide a clear, actionable specification and templates for writing tests for every service in the backend `refractory` module (and the rest of the codebase). Every public method must have at least one unit test covering the happy path and at least one edge / error case where relevant.

High-level plan
---------------
1. Use Jest + ts-jest (already present in backend devDependencies).
2. Prefer unit tests for services using Nest's TestingModule; mock all external dependencies.
3. For pure computational functions (no Nest dependencies) write direct unit tests.
4. Provide a consistent layout and naming convention: `*.spec.ts` next to source or in `test/`.
5. For each service, create a test file that covers every public method with at least:
   - a basic happy-path test,
   - 1-2 edge-case tests (invalid inputs / boundary values),
   - an error/test of thrown exceptions when expected.
6. Add a couple of integration-style tests (optional) using real modules where it makes sense.

Prerequisites
-------------
- Node.js and repo dependencies installed in `/opt/thermal-software/backend`:
  - `cd backend && npm ci`
- Jest configured (backend `package.json` already has `jest` and `ts-jest`).

Basic commands
--------------
- Run all backend tests (from repo root):

```bash
cd backend
npm test
```

- Run a single test file:

```bash
npx jest path/to/file.spec.ts
# or
npm test -- path/to/file.spec.ts
```

Test folder & naming convention
-------------------------------
Tests must live under the centralized `backend/test/` tree (this follows the project Test Specification and CI expectations). Use a mirrored directory structure to make tests easy to find and to avoid accidental execution of source-located specs.

Recommended layout:

```
backend/test/unit/            # Unit tests (fast, isolated)
  modules/refractory/services/
    refractoriness.service.spec.ts   # Tests for ../../src/modules/refractory/services/refractoriness.service.ts

backend/test/e2e/             # E2E tests (integration/workflows)
  calculation-workflow.e2e-spec.ts
```

Filename convention:
- `<original-file>.spec.ts` — for example `refractoriness.service.spec.ts` for `refractoriness.service.ts`.

Why centralized tests?
- CI and coverage reporting are configured to use `backend/test/` as the canonical test root.
- Keeps the source tree free of test artifacts and simplifies test runner configuration inside containers.
- Mirrors the `TEST_SPECIFICATION.md` requirement to run tests inside containers.

Testing patterns
----------------
1. Unit tests for Nest services
   - Use Nest's `Test.createTestingModule({ providers: [MyService, { provide: Dep, useValue: mock }]})` to create an isolated module.
   - Replace dependencies (repositories, other services) with Jest mocks/spies.
   - Use `module.get<MyService>(MyService)` to obtain instance.

2. Pure function tests
   - Import function directly and test with inputs/outputs.

3. Async tests
   - Use `async/await` and `expect(...).resolves` / `expect(...).rejects` patterns.

4. Spies & mocks
   - For dependencies that should be called, use `jest.fn()` and `expect(mock).toHaveBeenCalledWith(...)`.

5. Error conditions
   - Test invalid inputs by asserting thrown exceptions or specific return values.

Test templates
--------------
Below are minimal templates to copy into each service spec. Replace `RefractorinessService` with the target service and adapt methods accordingly.

1) Nest service test template (synchronous + async examples)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { RefractorinessService } from './refractoriness.service';

describe('RefractorinessService', () => {
  let service: RefractorinessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefractorinessService,
        // Provide mocked dependencies here, e.g.:
        // { provide: SomeOtherService, useValue: { ...mocked methods... } }
      ],
    }).compile();

    service = module.get<RefractorinessService>(RefractorinessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRefractoriness', () => {
    it('returns a properly shaped result for typical composition', () => {
      const composition = { SiO2: 50, Al2O3: 40, CaO: 5 }; // minimal example
      const res = service.calculateRefractoriness(composition, 'ISO1893');
      expect(res).toHaveProperty('estimatedRefractoriness_C');
      expect(res).toHaveProperty('RUL');
      expect(typeof res.estimatedRefractoriness_C).toBe('number');
    });

    it('clamps to min temperature when composition reduces temp below allowed min', () => {
      const composition = { Na2O: 100 }; // extreme flux
      const res = service.calculateRefractoriness(composition, 'ISO1893');
      expect(res.estimatedRefractoriness_C).toBeGreaterThanOrEqual( MIN_TEMPERATURE_C );
    });

    it('handles unknown standard by returning genericRefractoriness_C', () => {
      const composition = { SiO2: 40 };
      const res = service.calculateRefractoriness(composition, 'UNKNOWN_STANDARD');
      expect(res).toHaveProperty('genericRefractoriness_C');
    });
  });
});
```

Notes:
- Replace `MIN_TEMPERATURE_C` with an imported constant if used in test. Alternatively assert the value range.
- Use descriptive composition fixtures for different edge cases.

2) Pure function test template (if you extract helper pure functions)

```ts
import { somePureFunction } from '../lib/some-helper';

describe('somePureFunction', () => {
  it('calculates expected result', () => {
    expect(somePureFunction(1,2)).toEqual(3);
  });
});
```

Mocking strategies and examples
------------------------------
- Replace heavy dependencies with simple Jest mocks:

```ts
const mockOtherService = {
  compute: jest.fn().mockReturnValue(42),
};

Test.createTestingModule({ providers: [MyService, { provide: OtherService, useValue: mockOtherService }] })
```

- For modules that make HTTP calls or DB calls, mock out the client entirely.
- When you want to assert that a dependency was invoked with certain arguments, use:

```ts
expect(mockOtherService.compute).toHaveBeenCalledTimes(1);
expect(mockOtherService.compute).toHaveBeenCalledWith(expectedArg);
```

Edge cases to always include
---------------------------
- Null/undefined inputs
- Empty arrays / zero values
- Out-of-range numeric inputs
- Missing keys in composition objects
- Very large inputs (stress test)
- Cases that should throw BadRequestException or other Nest exceptions

Per-service checklist (create one spec file per service)
--------------------------------------------------------
Create a `*.spec.ts` file for each service in `backend/src/modules/refractory/services/`.

Services list (from repository) — for each service, add tests for every public method:
- `blend-optimizer.service.ts`
- `glass-viscosity.service.ts`
- `mineral-phase.service.ts`
- `packing.service.ts`
- `participation.service.ts`
- `phase-equilibrium.service.ts`
- `psd-calculator.service.ts`
- `refractoriness.service.ts`
- `shrinkage.service.ts`
- `thermal-performance.service.ts`
- `viscosity.service.ts`

For each service, perform the following steps:
1. Inspect the file and list all exported/public methods.
2. For each method, add test cases:
   - Happy path with representative input
   - Edge cases (invalid/missing inputs)
   - At least one negative test (e.g., throws BadRequestException)
3. Mock any internal dependencies (other services, constants, external modules)
4. Verify output shape and types (use `toHaveProperty` and type checks)
5. Add tests for boundary conditions and performance-critical operations (if applicable)

Example checklist for `refractoriness.service.ts`
- Public methods: `calculateRefractoriness()`
  - Tests to add:
    - Typical composition (happy path, ISO1893)
    - Extreme flux composition (Na2O heavy) -> should clamp to min temperature
    - Unknown standard -> returns genericRefractoriness_C
    - Classification boundaries: values near low/intermediate/high thresholds produce expected classification strings
    - If there are helper exports used by other modules, add unit tests for them (if exported)

Example checklist for `shrinkage.service.ts`
- Public methods: `calculateCompleteShrinkage()`
  - Tests to add:
    - Typical inputs produce a full legacy-style result (chemical + sintering maps)
    - Invalid input arrays (materials.length !== massFractions.length) -> throws BadRequestException
    - Mass fractions not summing to ~1 -> throws BadRequestException
    - Temperature profile empty -> returns reasonable empty/fallback structure

Per-service test checklist (complete)
====================================

Instructions: For each service below create a `*.spec.ts` file colocated with the service implementation (e.g., `refractoriness.service.spec.ts`). For every public method implement at minimum:
- 1 happy-path unit test (representative typical input)
- 1 edge-case test (boundary or unusual input)
- 1 failure test if the method can throw (invalid input -> expect exception)

Use the Jest + Nest TestingModule pattern for services that depend on Nest providers. For pure helpers (private methods cannot be tested directly), either test via the public methods or extract helpers to separate files and test them directly.

1) `blend-optimizer.service.ts`
- Public methods:
  - `optimize(request: BlendOptimizationRequest): BlendOptimizationResult[]`
- Tests to implement:
  - Happy path: small set of 2-3 fractions, default options -> expect results array length > 0, check keys on first result (method, q, packingModel, shrinkage present)
  - Edge case: fractions with isFixed values summing to 0.9 -> ensure variable mass fractions normalized and results valid
  - Error case: provide invalid q in options (e.g., 0 or >1) passed through psdCalculator mocks -> spy on psdCalculator to throw BadRequestException and assert that optimize propagates or handles the error appropriately
  - Integration-ish: with real `psdCalculator` and `packingService` but mocked `shrinkageService` to ensure shrinkage is attached as `shrinkage` field and shapes match

2) `psd-calculator.service.ts`
- Public methods:
  - `andreasenDiscrete(fractions, q, Dmin_mm?, Dmax_mm?)`
  - `funkDingerDiscrete(fractions, q, Dmin_mm?, Dmax_mm?)`
- Tests to implement (for each method):
  - Happy path: 3-4 fractions (one fixed, others variable) with q=0.25 -> result has massFractions summing to ~1, method string correct, Dmin/Dmax set
  - Edge case: all fractions fixed -> expect BadRequestException
  - Edge case: Dmin >= Dmax -> expect BadRequestException
  - Edge case: q <=0 or q>1 -> expect BadRequestException (via validateInputs)
  - Test rounding function: mass fractions that produce rounding remainder -> ensure `massFractionsRoundedPercent` sums to 100

3) `packing.service.ts`
- Public methods:
  - `calculateCPM(inputs, calibration?)`
  - `calculateFurnas(inputs, efficiencyFactor?)`
- Tests to implement (for each method):
  - Happy path: realistic mass fractions/densities/diameters -> expect packingFraction_phi between 0 and 1 and porosity_initial = 1-phi
  - Edge case: zero total mass fractions -> verify function returns phi = 0 or handles divide-by-zero gracefully
  - Edge case: compactionPressure extreme (very high) for CPM -> compactionIndex clamped -> phi not NaN
  - Test massToVolumeFractions helper behavior through public methods to validate expected volume fraction conversion

4) `shrinkage.service.ts`
- Public methods:
  - `calculateCompleteShrinkage(data)`
- Tests to implement:
  - Happy path: two materials with mass fractions summing to 1 and a small temperatureProfile -> result contains keys matching legacy shape OR new ShrinkageResult depending on current implementation (verify expected shape in tests)
  - Error case: materials.length !== massFractions.length -> expect BadRequestException
  - Error case: massFractions sum not ~1 -> expect BadRequestException
  - Edge case: empty temperatureProfile -> result should return drying stage and empty firing array (or documented behavior)
  - Case: check metadata fields existence and that percent conversions (×100) were applied consistently

5) `refractoriness.service.ts`
- Public methods:
  - `calculateRefractoriness(composition, standard?, testTemperature?)`
- Tests to implement:
  - Happy path: typical composition -> expect `estimatedRefractoriness_C` numeric and `classification` one of known categories
  - Edge case: composition with only flux components (Na2O heavy) -> ensure `estimatedRefractoriness_C` is clamped to `MIN_TEMPERATURE_C` and classification is correct
  - Edge case: unknown standard -> returns `genericRefractoriness_C` and does not throw
  - Boundary tests: values near classification thresholds to check `classifyRefractoriness` mapping
  - Test extract*Components helpers indirectly via expected `components` keys in results

6) `thermal-performance.service.ts`
- Public methods:
  - `calculateThermalConductivity(composition, temperature, porosity?)`
- Tests to implement:
  - Happy path: typical composition -> expect `thermalConductivity_WmK`, `specificHeat_JkgK`, `density_kgm3`, `thermalDiffusivity_m2s` numeric and within physical ranges
  - Edge case: porosity = 0 -> effective conductivity should equal k_solid calculation (within rounding)
  - Edge case: porosity close to 1 -> effective conductivity small but finite, no division by zero
  - Test that components grouping `oxideFormers` etc. returns only keys present in input composition

7) `viscosity.service.ts`
- Public methods:
  - `calculateViscosity(liquidComposition, temperature)`
- Tests to implement:
  - Happy path: typical composition -> result has `viscosity_Pas`, `logViscosity`, `arrhenius_A`, `arrhenius_B`
  - Edge case: very low temperature (near 0°C) -> viscosity clamped between allowed range
  - Edge case: extreme composition effect producing very large B -> viscosity clamped to 1e10
  - Test that extracted components keys are properly filtered (non-zero components only)

8) `mineral-phase.service.ts`
- Public methods:
  - `identifyPhases(solidComposition, temperature?): Array<{ phase, formula, percent, meltingPoint, description }>`
- Tests to implement:
  - Happy path: typical clay/ceramic composition -> expect returned array contains known phases (e.g., Mullite or Corundum depending on Al2O3/SiO2)
  - Edge case: low Al2O3 and SiO2 -> should return the fallback `Mixed solid solution` entry
  - Boundary case: composition near mullite ratio (Al2O3/SiO2 ≈ 1.5) -> ensure Mullite is included when ratio falls inside allowed range
  - Temperature-dependent phases: run at low and high temperatures to exercise `estimateCristobalite` and `estimateTridymite` thresholds
  - Negative/invalid input: empty composition object -> should return fallback `Mixed solid solution` (not throw)

9) `glass-viscosity.service.ts`
- Public methods:
  - `calculateViscosity(composition, temperature)`
- Tests to implement:
  - Happy path: typical borosilicate composition -> expect `viscosity_Pas`, `logViscosity`, `arrhenius_A`, `arrhenius_B`, fixed point fields (softening_Point_C, workingPoint_C, etc.)
  - Edge case: composition that would yield extremely high viscosity -> ensure clamping to max (1e15) and log/fields consistent
  - Edge case: composition with zero network formers -> check softeningPoint bounded by 400-1000 as implemented
  - Component extraction tests: pass composition containing known keys and assert `components.networkFormers` and `networkModifiers` only contain present keys and corresponding effect numbers
  - Invalid input: null composition or non-number entries -> expect function to handle gracefully (e.g., treat missing as zero) rather than throwing

10) `phase-equilibrium.service.ts`
- Public methods:
  - `calculatePhaseEquilibrium({ composition, temperature, totalMass? })`
- Tests to implement:
  - Happy path: composition summing to ~100 and temperature between MIN and MAX -> expect returned object contains `liquid`, `solid`, `metadata`, and `warnings` array
  - Error case: composition sums outside 95-105% -> expect BadRequestException
  - Error case: temperature outside allowed range -> expect BadRequestException
  - Edge case: temperature at eutectic (1265°C) -> expect `liquid.percent` === 0
  - Edge case: temperature >= estimatedLiquidus -> expect `liquid.percent` === 100 and `solid` composition empty
  - Verify rounding and normalization: check `roundComposition` and `normalizeComposition` effects on returned `liquid.composition` and `solid.composition`
  - Warnings generation: craft composition and temperature that trigger a warning (liquidPercent > 25 and temp < liquidus - 100) and assert warnings array includes expected message

11) `participation.service.ts`
- Public methods:
  - `calculateParticipation(fractions)`
- Tests to implement:
  - Happy path: input 3 fractions with varying sizes -> expect `participationFactors` array length equals input length, `totalParticipation` numeric and `normalizedParticipation` sums to 1 (or ~1 due to rounding)
  - Edge case: fractions with dMean very small (close to 0) -> ensure no division-by-zero (the code uses sqrt(dMean) so test for small values and numeric stability)
  - Edge case: mass fractions sum to zero -> ensure normalizedParticipation handled (avoid NaN)
  - Negative/invalid input: empty array -> expect returned structure with empty arrays and totalParticipation 0 (or documented behavior)

12) `particle-size-classifier.util.ts` (utility)
- Public methods / accessors:
  - `classifications` (getter)
  - `meshToMm` (getter)
  - `getFraction(classification)`
  - `getFractionFromMesh(lowerMesh, upperMesh)`
  - `getFractionFromFEPA_F(designation)`
  - `getFractionFromFEPA_P(designation)`
  - `getParticleSizeByKey(key)`
  - `listClassifications()`
  - `listMeshSizes()` / `listMeshSizes_Keys()`
  - `listFEPA_F()` / `listFEPA_P()`
  - `listStandardSizes()`
  - `meshToMillimeters(mesh)`
  - `millimetersToMesh(sizeInMm)`
- Tests to implement:
  - Getter tests: ensure `classifications` and `meshToMm` return non-empty objects with expected numeric mappings.
  - Listing methods: `listClassifications`, `listMeshSizes`, `listFEPA_F`, `listFEPA_P`, `listStandardSizes` return arrays and do not throw.
  - Mesh conversions: `meshToMillimeters(mesh)` returns the expected mm value for known mesh and `millimetersToMesh(mm)` returns a closest mesh number; ensure round-trip consistency for a sample value.
  - Fraction lookups: `getFraction` returns lower/upper for known classification and throws for unknown classifications; `getFractionFromMesh` returns correct range or throws for invalid mesh inputs.
  - FEPA lookups: `getFractionFromFEPA_F` and `getFractionFromFEPA_P` return ParticleSizeRange for known designations and throw for unknown designations.
  - getParticleSizeByKey: returns defined ParticleSizeRange for known keys (standard, cement, mesh, FEPA) and undefined for unknown keys.
  - Edge cases: very small or very large mesh numbers passed to conversion functions should result in thrown errors or undefined per current behavior; assert accordingly.

## Running tests via Makefile targets (inside Docker Compose)

The repository includes Makefile shortcuts that run tests inside the project's Docker Compose services. These targets are recommended so tests run in the same environment as CI.

- `make test-backend` — runs the backend test suite inside the `backend` service container. It will `exec` into a running container when available or run a one-off container otherwise.
- `make test-frontend` — same for the `frontend` service.
- `make test-service SERVICE=<service>` — generic runner for any named service in `compose.yml`.

Examples:

```bash
# From repository root
make test-backend
make test-frontend
make test-service SERVICE=backend
```

Notes:
- Targets use `docker-compose -f compose.yml` and run `cd /app && npm test --silent` inside the container; update the Makefile if your service uses a different working directory or test command.
- To get coverage use: `make test-backend` then run coverage inside the container (or modify the Makefile to call `npm test -- --coverage`).
- These Makefile targets are documented in `Makefile` (top-level). If you prefer `docker compose` (no hyphen), we can add variants.

Additions to the per-service checklist
------------------------------------
I also added `particle-size-classifier.util.ts` to the checklist (utility tests) — ensure tests for its public methods live under `backend/test/unit/refractory/utils/` and include both happy-path and edge-case tests.

Summary & next steps
--------------------
- The document now contains a complete per-service checklist covering every public method in `backend/src/modules/refractory/services`.
- Recommended immediate actions for the team:
  1. Create `*.spec.ts` skeleton files next to each service using the templates earlier in this document.
  2. Implement happy-path tests first for all services to establish baseline coverage.
  3. Add edge / error cases and verify mocks for dependent services (use Jest `jest.fn()` to create predictable behavior).
  4. Run `npm test` in `backend` and iterate until green.

If you want, I can now:
- Create the skeleton spec files for all services with basic happy-path tests (I can generate and commit them), or
- Generate full test implementations for a prioritized subset (e.g., `shrinkage.service.ts`, `refractoriness.service.ts`, and `phase-equilibrium.service.ts`) to serve as examples for the rest.

Which of these would you like me to do next? (create skeletons / implement priority tests / stop here)
