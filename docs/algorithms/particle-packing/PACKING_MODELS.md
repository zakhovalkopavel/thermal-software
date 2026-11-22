# Packing Models - CPM and Furnas

**Module:** PackingCalculator  
**Purpose:** Calculate packing density and void fraction for particulate systems

---

## Overview

Packing models predict how efficiently particles fill space, which directly affects:
- Bulk density
- Porosity
- Water requirement
- Strength
- Permeability

Two models are implemented:
1. **CPM (Compressible Packing Model)** - de Larrard's advanced model
2. **Furnas** - Sequential filling approach

---

## Topic index

| Doc | Contents |
|-----|----------|
| [packing-cpm.md](./packing-cpm.md) | CPM theory, dominance factors, implementation, compaction index |
| [packing-furnas.md](./packing-furnas.md) | Furnas sequential filling theory and algorithm |
| [packing-comparison-validation.md](./packing-comparison-validation.md) | CPM vs Furnas, experimental validation, basic calibration |
| [packing-applications.md](./packing-applications.md) | Practical examples, blend-optimizer workflow, shape/wall effects |
| [packing-calibration.md](./packing-calibration.md) | β₀ / φ_max / denomFloor research-backed defaults |
| [packing-adaptive-limits.md](./packing-adaptive-limits.md) | Composition-aware adaptive φ_max selection |
| [packing-troubleshooting.md](./packing-troubleshooting.md) | Common issues and literature references |

---

## Conclusion

Packing models are essential for:
- Predicting bulk density
- Minimizing porosity
- Optimizing water demand
- Achieving target flowability
- Reducing material cost

Combined with PSD optimization, they enable systematic formulation design with predictable performance.

---

**Implementation:** `backend/src/modules/refractory/services/particle-packing/packing.service.ts`  
**Related:** [PSD_ALGORITHMS.md](./PSD_ALGORITHMS.md), [SHRINKAGE_CALCULATOR_ALGORITHM.md](./SHRINKAGE_CALCULATOR_ALGORITHM.md)
