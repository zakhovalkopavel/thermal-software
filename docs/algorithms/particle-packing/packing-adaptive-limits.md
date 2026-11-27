# Adaptive Packing Limits Based on Composition

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

### Overview

The packing service includes **composition-aware adaptive φ_max selection** that automatically adjusts the maximum packing limit based on:

- **Micro-filler content** (particles < 0.1 mm)
- **PSD type** (binary, ternary, quaternary, continuous)
- **Size distribution quality** (poor, fair, good, excellent)
- **Overall packing capability** of the mix

### Key Principle

**The maximum achievable packing fraction depends on composition characteristics, not just a fixed value.**

- **With micro-fillers** (>5%): Higher limits possible (0.78–0.82)
- **Without micro-fillers, good PSD**: Standard limit (0.76)
- **Poor PSD**: Conservative limit (0.68)

### Micro-Filler Detection

**Definition:** Particles < 0.1 mm (threshold configurable in `COMPOSITION_ANALYSIS_CONSTANTS`)

| Micro-Filler % | Category | Recommended φ_max | Rationale |
|-----------------|----------|------------------|-----------|
| > 20% | HIGH | 0.82 | Micro-fillers fill all voids (Studart 2006) |
| 10–20% | SIGNIFICANT | 0.80 | Substantial void reduction |
| 5–10% | SOME | 0.78 | Noticeable benefit from fillers |
| < 5% | NONE | Depends on PSD | Minimal filler contribution |

### PSD Quality Assessment

Quality determined by **size ratio spread** and **mass distribution uniformity**:

| Quality | Size Ratio | Distribution | φ_max (no fillers) | Rationale |
|---------|-----------|--------------|------------------|-----------|
| **EXCELLENT** | > 50:1 | Uniform | 0.78 | Wide size range, well-distributed |
| **GOOD** | 5–50:1 | Fair | 0.76 | Adequate size variation |
| **FAIR** | 2–5:1 | Uneven | 0.72 | Limited size variation |
| **POOR** | < 2:1 | Very uneven | 0.68 | Similar sizes or imbalanced |

### Combined Decision Matrix

φ_max selected based on **filler category × PSD quality**:

| PSD Quality | No Fillers | Some Fillers | Significant Fillers | High Fillers |
|------------|-----------|--------------|-------------------|--------------|
| **EXCELLENT** | 0.78 | 0.80 | 0.82 | 0.82 |
| **GOOD** | 0.76 | 0.78 | 0.80 | 0.82 |
| **FAIR** | 0.72 | 0.76 | 0.78 | 0.80 |
| **POOR** | 0.68 | 0.72 | 0.76 | 0.78 |

### Three Priority Levels for φ_max Selection

**Micro-filler β₀ bonus** (always applied unless `beta0` is set explicitly):
particles &lt; 0.1 mm raise virtual packing so dense / high-performance mixes can
reach φ ≈ 0.76–0.82 instead of stalling near 0.72–0.74 with angular β₀ alone.

1. **Custom Override** (explicit `maxPhi` value) — Highest priority
   - Use your validated/lab-proven limit
   
2. **Auto-Detection** (`autoDetectMaxPhi: true`) — Recommended for production
   - Analyzes composition characteristics
   - Selects appropriate φ_max automatically
   - Provides explanation and confidence score
   
3. **Model Selection** (`maxPhiModel`) — Standard approach
   - DENSE_CASTABLE (0.76) — default
   - HIGH_PERFORMANCE (0.80) — optimized systems
   - TYPICAL_CONCRETE (0.72) — standard concrete
   - THEORETICAL_FCC (0.7405) — theory only
   - LEGACY_CONSERVATIVE (0.85) — backward compatibility
   
4. **Default** (no options specified)
   - Uses composition-recommended φ_max (same as auto-detect)

### Usage Examples

**Auto-Detection (Recommended):**
```typescript
const result = service.calculateCPM(
  {
    massFractions: [0.15, 0.35, 0.35, 0.15],  // Ternary
    densities_kgm3: [3000, 3100, 2500, 2800],
    diameters_mm: [3.0, 0.5, 0.1, 0.02],       // < 0.1 mm = micro-filler
    compactionPressure_MPa: 5.0
  },
  {
    autoDetectMaxPhi: true  // ← Analyze and select automatically
  }
);

// Returns composition analysis with recommended φ_max
```

**Manual Model Selection:**
```typescript
const result = service.calculateCPM(inputs, {
  maxPhiModel: MaxPhiModel.HIGH_PERFORMANCE  // Use 0.80
});
```

**Custom Override:**
```typescript
const result = service.calculateCPM(inputs, {
  maxPhi: 0.75  // Your lab-validated limit
});
```

### Enhanced Result Object

```typescript
{
  model: 'CPM',
  packingFraction_phi: 0.758,
  porosity_initial: 0.242,
  
  calibration: {
    beta0: 0.56,
    K: 9.0,
    maxPhi: 0.80,           // ← Adaptive limit used
    denomFloor: 0.05,
    compactionIndex: 0.3333,
    autoDetected: true      // ← Shows if auto-detected
  },
  
  composition: {              // ← Composition analysis metadata
    hasMicroFillers: true,
    microFillerPercent: 15.0,
    psdType: 'quaternary_plus',
    packingQuality: 'excellent',
    recommendedMaxPhi: 0.80,
    explanation: "Significant micro-fillers (15%): use 0.80..."
  }
}
```

### Constants and Configuration

All composition analysis thresholds defined in `COMPOSITION_ANALYSIS_CONSTANTS` in `packing-constants.ts`:

- `MICRO_FILLER_THRESHOLD_MM`: 0.1 (particles < 0.1 mm detected as micro-fillers)
- `MICRO_FILLER_SIGNIFICANT_PERCENT`: 5.0 (minimum % to affect limit selection)
- `MICRO_FILLER_THRESHOLDS`: 3-level mapping (HIGH, SIGNIFICANT, SOME) with φ_max values
- `PSD_QUALITY_THRESHOLDS`: 4-level quality assessment (POOR, FAIR, GOOD, EXCELLENT)
- `COMBINATION_ADJUSTMENTS`: 3×4 decision matrix (filler category × PSD quality)

### When to Use Each Approach

**Use Auto-Detection when:**
- Production environment
- Testing different blend formulas
- Want composition-aware safety
- Need diagnostic information

**Use Model Selection when:**
- Standard known system type
- Want consistent predictable limits
- Prefer not to analyze composition

**Use Custom Override when:**
- Lab-validated specific limits
- Research/calibration work
- Theory-only mode desired

### Research Backing

Auto-detection thresholds validated against literature:

- **Micro-fillers enable higher packing:** Studart et al. (2006)
- **PSD quality affects packing:** de Larrard (1999)
- **Size ratio critical:** Furnas (1931)
- **Confidence assessment:** Wong & Kwan (2008)

