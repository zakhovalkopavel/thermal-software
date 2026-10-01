# Step 06 — Switch API types to generated types

**Commits:** 1
**Install:** none

**Goal:** the frontend compiles against the backend's Swagger. A backend change becomes a typecheck error at the exact place that depends on it.

---

## 1. Rule

Every hand-written type that describes a backend request or response becomes a one-line alias:

```ts
import type { components } from '@/shared/api/generated/schema';

export type RecuperatorInput = components['schemas']['RecuperatorInputDto'];
```

- **Becomes an alias:** request inputs, result types and catalogue items (`*-input.type.ts`, `*-result.type.ts`, `*-info.type.ts`, `*-request.type.ts`, `*-response.type.ts` and equivalents).
- **Stays hand-written:** form drafts, UI state, props, chart point types, and any type that only exists in the frontend.
- **Enum-like unions** (`HoleForm`, `BcType`, `ThermalShapeKey`, `FluidMode`, …) become aliases of the generated property type, for example `RecuperatorInputDto['holeForm']`. The `catalogue.contract` suite already checks that the UI's option lists are a subset.
- **Nested result types** (for example a single layer of a result) use indexed access: `MultilayerWallResult['layers'][number]`.
- **Alias files are kept** (one per type), so consumers don't change their imports. Where an alias is used in only one place and adds nothing, the consumer may import the generated type directly through its alias file. No consumer imports `schema.ts` outside `types/` folders.

## 2. Handling differences

When an alias produces type errors, the hand-written type and Swagger disagree. For each difference:

| Case | Action |
|------|--------|
| The frontend type was wrong (field name, optionality, union) | Fix the frontend code |
| Swagger documents the response wrongly (the live contract test passes, but the doc says otherwise) | Correct the DTO documentation (allowed under the Step 04 approval) |
| The backend behaves wrongly (for example a field the DTO rejects but the service needs) | Report it, add it as a known backend issue, and keep the frontend workaround with a comment stating the backend constraint |

All differences are listed in the commit message body.

## 3. Acceptance

- `npm run verify` passes.
- `rg -l "export type .* = \{" src/modules --glob '*-input.type.ts' --glob '*-result.type.ts'` finds only types with no Swagger equivalent. Each is listed in the commit message.
- Commit: `refactor(frontend): step 06 API types from generated Swagger types`.
