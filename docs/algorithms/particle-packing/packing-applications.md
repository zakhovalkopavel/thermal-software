# Practical Applications

**Parent index:** [PACKING_MODELS.md](./PACKING_MODELS.md)

---

### Example 1: High-Alumina Self-Compacting

**Input:**
```
Fraction 1: 3-6 mm Tabular Alumina (28%, ρ=3.95 g/cm³)
Fraction 2: 1-3 mm Tabular Alumina (38%, ρ=3.95 g/cm³)
Fraction 3: 0.1-1 mm Chamotte (22%, ρ=2.65 g/cm³)
Fraction 4: <0.1 mm CAC (12%, ρ=3.20 g/cm³)
```

**CPM Result:**
```
Packing fraction: φ = 0.74
Bulk density (green): 2.33 g/cm³
Porosity: 26%
```

**Interpretation:**
- High packing efficiency (self-compacting achieved)
- Low water demand expected
- Good green strength

### Example 2: Standard Vibratable

**Input:**
```
Same materials, q = 0.30:
35%, 40%, 18%, 7%
```

**CPM Result:**
```
Packing fraction: φ = 0.70
Bulk density (green): 2.20 g/cm³
Porosity: 30%
```

**Interpretation:**
- Moderate packing (needs vibration)
- Standard water demand
- Typical working properties

---

## 6. Integration with Other Calculators

### Workflow in Blend Optimizer

```
PSD → Packing → Density → Shrinkage → Final Properties
```

**Complete calculation chain:**

```typescript
// 1. PSD calculation
const psd = PSDCalculator.andreasenDiscrete(fractions, 0.25);

// 2. Packing calculation
const packing = PackingCalculator.calculateCPM({
  massFractions: psd.massFractions,
  densities_kgm3: materials.map(m => m.rho_true),
  diameters_mm: fractions.map(f => (f.dMin + f.dMax) / 2),
  compactionPressure_MPa: 0.05
});

// 3. Bulk density
const rho_skeletal = calculateWeightedDensity(materials, psd.massFractions);
const rho_bulk_green = rho_skeletal * packing.packingFraction_phi;

// 4. Porosity
const porosity = (1 - packing.packingFraction_phi) * 100;

// 5. Feed to shrinkage calculator...
```

---

## 7. Advanced Topics

### Shape Factor Corrections

**Non-spherical particles:**

```
β_0_corrected = β_0_sphere / (shape_factor^0.333)
```

Shape factors:
- Spheres: 1.0
- Rounded gravel: 1.1
- Angular crushed: 1.2-1.3
- Flaky particles: 1.4-1.6
- Fibers: 2.0+

### Wall Effects

For containers with diameter D_container:

```
φ_effective = φ_bulk × (1 - k × d_max / D_container)
```

Typically significant when `d_max / D_container > 0.1`.

### Multi-Modal Distributions

For bimodal or trimodal mixes:

```
CPM: Handles automatically via dominance matrix
Furnas: Group modes and apply sequentially
```

