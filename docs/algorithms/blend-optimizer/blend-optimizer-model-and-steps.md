# Blend Optimizer Physical Model and Algorithm Steps

**Parent index:** [BLEND_OPTIMIZER_ALGORITHM.md](./BLEND_OPTIMIZER_ALGORITHM.md)

---

When designing refractory castables, engineers need to:

1. **Minimize Porosity** - Reduce void space for better performance
2. **Maximize Density** - Achieve highest possible bulk density
3. **Optimize Flowability** - Balance between self-leveling and hand-pressing
4. **Predict Performance** - Estimate shrinkage and final properties

**Challenge:** Multiple variables (fractions, methods, scenarios) create large solution space

**Solution:** Exhaustive evaluation of all meaningful combinations to find optimal blends

---

## Physical Model

### Stage 1: Particle Size Distribution (PSD)

**Goal:** Determine ideal particle size distribution curve

**Models:**
- **Andreasen (Fuller-Andreasen):** P(D) = (D^q - Dmin^q) / (Dmax^q - Dmin^q)
- **Funk-Dinger:** Modified model with better packing predictions

**Parameters:**
- `q` = Distribution modulus (0.25 = fine, 0.35 = coarse)
- `D` = Particle diameter (mm)
- `Dmin`, `Dmax` = Minimum and maximum diameters

**Output:** Mass fractions for each size class

### Stage 2: Packing Density

**Goal:** Calculate how efficiently particles pack together

**Models:**
- **CPM (de Larrard):** Accounts for wall effects and compaction
  - β_i = β₀ / (1 - K × compaction_index)
  - φ = Σ(V_i × β_i) / Σ(V_i)
  
- **Furnas:** Sequential filling of voids
  - Each smaller fraction fills voids from larger particles
  - Efficiency decreases with size ratio

**Parameters:**
- Compaction pressure (MPa)
- Compaction index (K value)
- Particle densities
- Mass fractions from PSD

**Output:** Packing fraction (0-1), porosity percentage

### Stage 3: Shrinkage Prediction

**Goal:** Estimate volumetric shrinkage during drying and firing

**Stages:**
- **Drying:** Chemical shrinkage (water removal)
- **Firing:** Sintering shrinkage (densification)

**Parameters:**
- Water-cement ratio
- Cement content
- Temperature profile
- Material properties

**Output:** Shrinkage at each temperature, total shrinkage

---

## Algorithm: Step-by-Step

### Input
```
fractions: [
  { dMin_mm, dMax_mm, density_kgm3, isFixed?, massFraction? },
  ...
]
options: {
  qValues?: number[],
  methods?: string[],
  packingModels?: string[],
  scenarios?: string[],
  temperatureProfile_C?: number[],
  waterCementRatio?: number
}
```

### Workflow

```
1. Initialize defaults
   qValues = [0.25, 0.27, 0.30, 0.33]
   methods = ['Andreasen', 'FunkDinger']
   packingModels = ['CPM', 'Furnas']
   scenarios = ['Self-compacting', 'Flowable', 'Vibratable', 'Hand-pressable']

2. FOR each PSD method (2 options)
     FOR each q value (4 options)
       FOR each scenario (4 options)
         FOR each packing model (2 options)
           
           // Step A: Calculate PSD
           massFractions = calculatePSD(method, q)
           
           // Step B: Get scenario parameters
           compactionPressure = getCompactionPressure(scenario)
           compactionIndex = getCompactionIndex(scenario)
           
           // Step C: Calculate packing
           IF packingModel == 'CPM'
             packingResult = calculateCPM(massFractions, compactionPressure, compactionIndex)
           ELSE
             packingResult = calculateFurnas(massFractions)
           END IF
           
           // Step D: Calculate skeletal density
           rhoSkeletal = Σ(density_i × massFraction_i)
           rhoBulk = rhoSkeletal × packingResult.phi
           
           // Step E: Predict shrinkage
           shrinkageResult = predictShrinkage(temperatureProfile, massFractions)
           
           // Step F: Store result
           results.push({
             method, q, scenario, packingModel,
             massFractions, rhoSkeletal, rhoBulk,
             packingEfficiency, porosity, shrinkage
           })
           
         END FOR
       END FOR
     END FOR
   END FOR

3. RETURN results array (all combinations evaluated)
```

### Output

```typescript
BlendOptimizationResult[] = [
  {
    method: 'Andreasen',
    q: 0.25,
    scenario: 'Self-compacting',
    packingModel: 'CPM',
    massFractions: [0.15, 0.25, 0.35, 0.25],
    rhoSkeletal_gml: 2.65,
    rhoBulk_gml_green: 1.89,
    packingEfficiency: 0.71,
    porosity_percent_green: 29.0,
    shrinkage: {
      temperatures_C: [600, 800, 1000, 1200],
      shrinkage_percent: [0.5, 1.2, 2.1, 3.8],
      maxShrinkage_percent: 3.8,
      tempAtMaxShrinkage_C: 1200
    }
  },
  // ... more results
]
```

---

## Compaction Scenarios

### 1. Self-Compacting (Q ≤ 0.26)
- **Compaction Pressure:** 0.01 MPa (gravity only)
- **Compaction Index (K):** 4.1
- **Characteristics:** Self-leveling, minimal compaction
- **Use Case:** High-mobility, self-flowing applications
- **Example:** Castable linings for fast installation

### 2. Flowable (Q ≤ 0.29)
- **Compaction Pressure:** 0.05 MPa (light tapping)
- **Compaction Index (K):** 4.5
- **Characteristics:** Good flow, light tapping helps settlement
- **Use Case:** Pumpable, moderate flow
- **Example:** Pump-castable refractory

### 3. Vibratable (Q ≤ 0.32)
- **Compaction Pressure:** 0.2 MPa (light vibration)
- **Compaction Index (K):** 5.0
- **Characteristics:** Requires vibration for packing
- **Use Case:** Industrial furnace linings
- **Example:** Dense castable with vibration

### 4. Hand-Pressable (Q > 0.32)
- **Compaction Pressure:** 1.0 MPa (hand pressure)
- **Compaction Index (K):** 6.0
- **Characteristics:** Requires significant compaction
- **Use Case:** High-density applications
- **Example:** Gunning refractory, hand-rammed

---
