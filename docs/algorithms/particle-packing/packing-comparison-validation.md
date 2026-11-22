# Model Comparison

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

### CPM vs Furnas

| Aspect | CPM | Furnas |
|--------|-----|--------|
| **Complexity** | High | Low |
| **Accuracy** | Very good | Good |
| **Compaction** | Explicitly modeled | Not included |
| **Size interactions** | Full matrix | Sequential only |
| **Computation** | Moderate | Fast |
| **Calibration** | Well-established | Empirical |
| **Best for** | Research, optimization | Quick estimates |

### When to Use Which

**Use CPM when:**
- High accuracy needed
- Compaction is important
- Multiple similar-sized fractions
- Research or optimization work
- Sufficient calibration data

**Use Furnas when:**
- Quick estimate needed
- Well-separated size classes
- Simple binary/ternary mixes
- Educational purposes
- Initial screening

---

## 4. Validation and Calibration

### Experimental Validation

**Method 1: Tap Density Test**

```
1. Fill container with blend (loose)
2. Measure mass M and volume V_loose
3. Tap until no further densification
4. Measure final volume V_tap
5. Calculate: φ = M / (ρ_true × V_tap)
```

**Typical agreement:**
- CPM: ± 0.02 absolute (e.g., 0.72 ± 0.02)
- Furnas: ± 0.04 absolute

**Method 2: Green Density Measurement**

```
1. Prepare castable with optimized blend
2. Cast into mold with known compaction
3. Measure green density
4. Compare with prediction
```

### Calibration Parameters

**CPM Calibration:**
- `β_0`: Adjust for particle shape (0.60-0.68)
- `K`: Adjust for material friction (7-11)
- Shape factors: Measure from particle images

**Furnas Calibration:**
- Base efficiency: Fit to experimental data (0.70-0.80)
- Size ratio exponent: Adjust (0.3-0.7)

---
