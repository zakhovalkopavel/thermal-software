# Calibration Models (Research-Backed Defaults)

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

### Overview

The implementation provides research-backed models for key parameters:
- **β₀ (particle shape):** SPHERICAL, SUB_ANGULAR, ANGULAR, FLAKY
- **φ_max (maximum packing):** THEORETICAL_FCC, TYPICAL_CONCRETE, DENSE_CASTABLE, HIGH_PERFORMANCE, LEGACY_CONSERVATIVE
- **denomFloor (stability):** Prevents numerical singularities

### β₀ Models (Particle Shape)

Based on Johansen & Andersen (1991) and de Larrard (1999) Table 2.1:

| Model | β₀ Value | Description | Applications |
|-------|----------|-------------|--------------|
| **SPHERICAL** | 0.64 | Random close packing limit | Glass beads, rounded aggregates |
| **SUB_ANGULAR** | 0.60 | Natural sand | Crushed rounded materials |
| **ANGULAR** | 0.56 | Crushed rock (**DEFAULT**) | Typical refractory aggregates |
| **FLAKY** | 0.50 | Elongated particles | Mica, fibrous materials |

**Default:** ANGULAR (β₀ = 0.56) — typical for refractory applications

### φ_max Models (Maximum Packing Fraction)

Based on Studart et al. (2006), Wong & Kwan (2008), Pileggi et al. (2001):

| Model | φ_max Value | Description | Applications |
|-------|-------------|-------------|--------------|
| **THEORETICAL_FCC** | 0.7405 | FCC/HCP densest sphere packing | Strict theoretical limit |
| **TYPICAL_CONCRETE** | 0.72 | Well-graded, no compaction | Standard vibrated concrete |
| **DENSE_CASTABLE** | 0.76 | Vibrated, optimized PSD (**DEFAULT**) | Self-flowing castables |
| **HIGH_PERFORMANCE** | 0.80 | Micro-fillers, high compaction | Ultra-high performance systems |
| **LEGACY_CONSERVATIVE** | 0.85 | Historical cap (above realistic) | Backward compatibility only |

**Default:** DENSE_CASTABLE (φ_max = 0.76) — research-backed for vibrated refractory castables

**Notes:**
- φ_max = 0.85 (legacy) is **above** all measured/theoretical values
- Used historically for conservative safety margin
- New implementations should use DENSE_CASTABLE or HIGH_PERFORMANCE

### Denominator Floor (Stability Constant)

Prevents singularities in CPM formula: β₀/(1 - K×c_i)

**Critical pressure:** P_crit ≈ P_ref × (1/K) / (1 - 1/K)
- With K=9, P_ref=10 MPa → P_crit ≈ 12.5 MPa

| denomFloor | Allowed P/P_crit | Use Case |
|------------|------------------|----------|
| **0.01** | ~99% | Research, high-accuracy calibration |
| **0.05** | ~95% (**DEFAULT**) | Practical engineering (good balance) |
| **0.10** | ~90% | Production safety (early saturation) |

**Default:** 0.05 — allows up to 95% of critical pressure

**Research range:** 0.01–0.10 (Fennis 2011, concrete software practice)

### Usage Examples

```typescript
import { PackingService, Beta0Model, MaxPhiModel } from './packing.service';

// Default (angular particles, dense castable cap)
const result1 = service.calculateCPM({
  massFractions: [0.3, 0.4, 0.3],
  densities_kgm3: [3000, 3500, 2500],
  diameters_mm: [0.1, 0.5, 1.0],
});
// → Uses β₀=0.56 (ANGULAR), φ_max=0.76 (DENSE_CASTABLE)

// Spherical particles, high-performance cap
const result2 = service.calculateCPM(inputs, {
  beta0Model: Beta0Model.SPHERICAL,
  maxPhiModel: MaxPhiModel.HIGH_PERFORMANCE,
});
// → Uses β₀=0.64, φ_max=0.80

// Legacy behavior (for backward compatibility)
const result3 = service.calculateCPM(inputs, {
  beta0Model: Beta0Model.SPHERICAL,
  maxPhiModel: MaxPhiModel.LEGACY_CONSERVATIVE,
});
// → Uses β₀=0.64, φ_max=0.85 (old default)

// Full custom calibration
const result4 = service.calculateCPM(inputs, {
  beta0: 0.58,            // Custom β₀
  K: 10.5,                // Custom compaction coefficient
  maxPhi: 0.78,           // Custom cap
  denomFloor: 0.02,       // Custom stability floor
});

// Result includes calibration metadata
console.log(result1.calibration);
// → { beta0: 0.56, K: 9.0, maxPhi: 0.76, denomFloor: 0.05, compactionIndex: 0.1667 }
```

### Migration from Legacy Values

**Old hardcoded values:**
- β₀ = 0.64 (spherical)
- φ_max = 0.85 (conservative cap)
- denomFloor = 0.05 (implicit)

**New research-backed defaults:**
- β₀ = 0.56 (ANGULAR — more realistic for crushed refractories)
- φ_max = 0.76 (DENSE_CASTABLE — matches literature for vibrated systems)
- denomFloor = 0.05 (explicit, configurable)

**To preserve old behavior:**
```typescript
service.calculateCPM(inputs, {
  beta0Model: Beta0Model.SPHERICAL,
  maxPhiModel: MaxPhiModel.LEGACY_CONSERVATIVE,
});
```
