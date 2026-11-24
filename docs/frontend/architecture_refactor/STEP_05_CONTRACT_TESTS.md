# Step 05 — Generated API types and backend contract tests

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i -D openapi-typescript ajv ajv-formats'
```

**Prerequisite:** Step 04 committed and the backend container restarted, so Swagger documents every response.

**Goal:** an automatic answer to "do the frontend and the backend still agree?" See [TESTING.md §5](TESTING.md#5-backend-contract-tests-testscontract) for the full specification.

---

## 1. Generation

| File | Content |
|------|---------|
| `scripts/generate-api.mjs` | Fetches `CONTRACT_SPEC_URL`, writes `src/shared/api/generated/openapi.json` (keys sorted, 2-space indent, so diffs are readable), runs `openapi-typescript` into `src/shared/api/generated/schema.ts` |
| `scripts/check-api.mjs` | Fetches the live spec, normalises it the same way, compares with the snapshot, prints changed paths and schemas, exits 1 on difference |
| `package.json` | `"api:generate": "node scripts/generate-api.mjs"`, `"api:check": "node scripts/check-api.mjs"` |

- The generated files are committed. They are excluded from lint and from the naming rules.
- No frontend code uses `schema.ts` yet. Step 06 switches the types.

## 2. Contract test files

```
tests/contract/
  helpers/
    contract-case.type.ts         ContractCase type
    known-backend-issue.type.ts
    load-spec.ts                  reads the snapshot, resolves operation schemas
    build-validator.ts            ajv + ajv-formats; additionalProperties:false forced on request schemas
    format-ajv-errors.ts          JSON pointer + rule + actual value
    call-backend.ts               axios against CONTRACT_API_URL; returns status, body, backend message
    save-fixture.ts               writes tests/fixtures/responses/<METHOD>_<path>.json
    collect-frontend-operations.ts  reads every *.api.ts and extracts method + path (from api.get/post calls)
  cases/
    combustion.cases.ts  htc.cases.ts  multilayer-wall.cases.ts  recuperator.cases.ts
    thermal-distribution.cases.ts  gases.cases.ts  metals.cases.ts  refractories.cases.ts
    raw-materials.cases.ts  glasses.cases.ts  mineral-compositions.cases.ts  catalogue.cases.ts
    all-cases.ts
  known-backend-issues.ts
  spec-drift.contract.test.ts
  spec-completeness.contract.test.ts
  coverage.contract.test.ts
  request.contract.test.ts
  live.contract.test.ts
  catalogue.contract.test.ts
```

Each case file builds bodies with the section's real request mapper from its real defaults or presets. The required cases are listed in [TESTING.md §5.1](TESTING.md#51-contract-cases). As a minimum:

| Area | Cases |
|------|-------|
| combustion | each mode (solid direct, solid two-step, fluid, bed) with defaults; excess-air sweep |
| htc | each flow geometry with defaults; named fluid and gas mix; velocity sweep endpoints; each body shape |
| multilayer wall | each wall preset |
| recuperator | each hole form, including `circle_in_ring` with `h0_m` and `nPasses` |
| thermal distribution | each supported shape × each BC type for criteria, at-depth, profile, average |
| gases | pure gas, each mixture preset, Prandtl, cp comparison |
| metals | each metal at the default temperature sweep |
| refractories | properties of the first product of each group |
| raw materials | composition and thermal-conductivity requests for one material per category |
| glasses | each glass preset for viscosity, profile, temperature at viscosity |
| mineral compositions | chemistry, granulometry (Andreasen, Funk–Dinger), packing (CPM, Furnas), water demand, shrinkage, blend optimisation with the default mix |
| catalogue | every catalogue GET used by the UI |

## 3. Known backend issues (initial list)

The following were found during the UI implementation. If they still reproduce, they are entered as known issues:

- `POST /thermodynamics/dimensionless` with `fluid: "air"` returns 500.
- `POST /refractory/phase-equilibrium` returns 500 for some inputs, and 60 % Al₂O₃ gives 100 % liquid.
- Thermal distribution: `plate`, `auto` and `V_over_A` need fields the DTO rejects. This is declared as a catalogue exclusion, not a case.
- Other findings already reported:
  - glass endpoints drop `preferredModelRejected`;
  - the blend optimiser returns no summary;
  - Andreasen with Dmin > 0 equals Funk–Dinger;
  - the two-step step-1 temperature is 182 K;
  - a bed layer reaches 3000 K.

  These become known issues only where a contract assertion actually detects them, for example a missing response field. Physics plausibility is out of scope for contract tests.

Each new entry is reported to the user in the session where it is added.

## 4. Smoke tests: calculations

`live.contract.test.ts` records POST fixtures. `tests/smoke/routes.smoke.test.tsx` then also submits each calculator's defaults on its route and asserts that result cards appear. This runs offline from the recorded fixtures.

## 5. `verify`

The `contract` stage now runs `test:contract`. Its summary line shows passed, failed and open known backend issues.

## 6. Acceptance

- `npm run verify` passes; open known issues are listed in the summary.
- `npm run api:check` reports no difference.
- Local checks, not committed:
  - adding an unknown field to one mapper makes `request.contract` fail, naming the endpoint, case and field;
  - removing a case makes `coverage.contract` fail.
- Commit: `test(frontend): step 05 generated API types and backend contract tests`.
