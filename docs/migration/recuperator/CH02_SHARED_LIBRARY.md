# CH02 — Shared Library Status

Source: `legacy/scripts/src/`  
Target: `backend/src/common/thermal/`

## 2.1 Complete — copy and adapt imports

| Legacy path | Notes |
|---|---|
| `interface/compoundValue.ts` | rename → `compound-value.interface.ts` |
| `interface/composition.ts` | 12 gas species |
| `interface/equationValue.ts` | |
| `interface/equation.ts` | |
| `interface/fluid.ts` | Generic `Fluid<T>` |
| `interface/materialValue.ts` | Full interface |
| `interface/chemicalComposition.ts` | |
| `dto/equationType.dto.ts` | Enum |
| `dto/chemicalCompounds.dto.ts` | |
| `dto/thermalConductivityEquationType.dto.ts` | |
| `utils/common.ts` | `logarithmicAverage`, `equation()`, R, kB, Na |
| `utils/*EquationMethod.ts` (9 files) | Linear, cubic, quartic, AlyLee, DIPPR102, etc. |
| `type/*Equation.ts` (9 files) | |
| `compound/gas/n2.ts` through `nh3.ts` (8 files) | All complete |
| `compound/gas/air.ts` | ⚠️ `viscosity.values` is empty |
| `thermalExchange/fluidConditionCompound.ts` | All methods implemented |
| `thermalExchange/fluidDynamics.ts` | Reynolds, Grashof, etc. |

## 2.2 Incomplete — fix as part of this migration

### `gasComposition.ts`
- `this.molPartial` never initialized → add `this.molPartial = {} as Composition` in constructor.
- `heatCapacity` references undefined `capacityFunctionAverage` and `vars[gas]`.
- **Fix:** remove inline coefficient table; delegate to compound objects via `FluidConditionCompound`.
- Remove hardcoded `gasValues`, `tValidCMin`, `tValidCMax` — clamping is done by each equation's `min`/`max`.

### `fluidConditionComposition.ts`
- Method bodies are empty stubs.
- Minimum viable: delegate `heatCapacity` to `GasComposition`; use Wilke mixing rules for viscosity/conductivity (deferred — use air correlations for initial pass).

### `compound/gas/air.ts` — viscosity gap
- `viscosity.values` is `[]`.
- `AirPropertiesService` must use empirical fallback until populated:
  `μ = 1.717 × (t/273)^0.693 × 10⁻⁵  Pa·s`
- Add `// TODO: populate Air.viscosity.values` comment.

### `convection.ts`
- Stub only. Not needed — superseded by `AirPropertiesService`. Leave or delete.

## 2.3 Gas compound data summary

| Gas | Mr | heatCapacity `def` | viscosity | thermalConductivity |
|---|---|---|---|---|
| `air` | 0.028951 | cubic ref.5 | ⚠️ empty | DIPPR102 ref.15 |
| `n2` | 0.028 | quartic ref.6 | quadratic | DIPPR102 |
| `o2` | 0.031999 | quartic ref.6 | quadratic | DIPPR102 |
| `co2` | 0.04401 | quartic ref.6 | quadratic | DIPPR102 |
| `co` | 0.02801 | AlyLee ref.4 | quadratic | DIPPR102 |
| `h2o` | 0.018015 | quartic ref.6 | quadratic | DIPPR102 |
| `h2` | 0.002016 | quartic ref.6 | quadratic | DIPPR102 |
| `ch4` | 0.016043 | quartic ref.6 | quadratic | DIPPR102 |
| `nh3` | 0.017031 | quartic ref.6 | quadratic | DIPPR102 |

> NH3 heat capacity coefficient `a` differs +12% between `recuperator.js` and `legacy/scripts/src`. Use `legacy/scripts/src` (ref.5 p.911).

