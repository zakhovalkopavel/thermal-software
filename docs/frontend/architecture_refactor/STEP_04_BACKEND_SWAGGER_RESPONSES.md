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
