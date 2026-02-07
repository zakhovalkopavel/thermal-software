# Chapter 9: Specialty Systems

**Part II: Composition-Dependent Models**

---

## Overview

This chapter covers specialty glass systems with unique compositions or applications:
1. Pure Silica (>99% SiO2)
2. Sodium Silicate Binaries
3. Fluoride Glasses
4. Oxyhalide Glasses

---

## System 1: Pure Silica Glass

### Composition

**Fused silica (synthetic):**
```
SiO2:   99.95%
OH:      0.03%  (hydroxyl groups)
Al2O3:   0.02%
```

**Fused quartz (natural):**
```
SiO2:   99.99%
Impurities: <0.01%
```

---

### Viscosity Model

**VFT Equation:**
```
log₁₀(η) = A + B/(T - T₀)

A = -2.8
B = 13,500 K
T₀ = 475 K (202°C)
```

**Note:** Very high T₀ compared to commercial glasses

---

### Measured Data

**Source:** Hetherington et al. (1964), Urbain (1982)

| Temp (°C) | Log₁₀ η (Pa·s) | Viscosity (Pa·s) | Application |
|-----------|----------------|------------------|-------------|
| 2000 | 5.80 | 630,957 | Near melting |
| 1900 | 6.50 | 3,162,278 | -- |
| 1730 | 7.60 | 39,810,717 | **Softening point** |
| 1600 | 8.75 | 562,341,325 | -- |
| 1500 | 9.80 | 6.31×10⁹ | -- |
| 1200 | 13.0 | 10¹³ | **Annealing point** |
| 1075 | 14.5 | 3.16×10¹⁴ | **Strain point** |

**ASTM Fixed Points:**
```
Melting Point:    ~2420°C (extrapolated)
Working Point:    ~2100°C
Softening Point:   1730°C (HIGHEST of common glasses)
Annealing Point:   1200°C
Strain Point:      1075°C
```

---

### Applications

- **Optical fibers:** Ultra-low loss telecommunications
- **Semiconductor:** Wafer processing, high purity
- **UV optics:** No solarization below 200 nm
- **Reference material:** Standard for pure network former

---

### Limitations

- **Very high processing temperatures** (>2000°C)
- **OH content critical:** Affects IR absorption
- **Ppm impurities significant:** Network very pure
- **Devitrification risk:** Cristobalite formation

---

## System 2: Sodium Silicate Binaries

### Composition Range

**Binary system:** Na₂O-SiO₂ only

**Typical compositions:**
```
Sodium Disilicate:    75% SiO2, 25% Na2O  (Na₂O·2SiO₂)
Sodium Metasilicate:  67% SiO2, 33% Na2O  (Na₂O·SiO₂)
```

---

### Viscosity Model

**VFT with composition-dependent parameters:**

**Sodium Disilicate (75/25):**
```
A = -3.5
B = 7,500 K
T₀ = 250 K
```

**Sodium Metasilicate (67/33):**
```
A = -3.8
B = 6,200 K
T₀ = 200 K
```

**Pattern:** Increasing Na₂O → Decreasing B, decreasing T₀

---

### Measured Data (Sodium Disilicate)

**Source:** Bockris et al. (1955)

**Composition:** 75% SiO2, 25% Na2O

| Temp (°C) | Log₁₀ η (Pa·s) | Notes |
|-----------|----------------|-------|
| 1200 | 1.80 | Melting |
| 1100 | 2.50 | Working |
| 1000 | 3.30 | -- |
| 900 | 4.30 | -- |
| 800 | 5.50 | -- |
| 700 | 7.00 | -- |
| 480 | 13.0 | Approximate Tg |

**Fixed Points:**
```
Softening Point:  ~480°C (VERY LOW)
Annealing Point:  ~420°C
```

---

### Applications

- **Water glass:** Adhesives, binders, sealants
- **Detergents:** Alkaline cleaning agents
- **Cement:** Rapid hardening additives
- **NOT structural glass:** Too high alkali

---

### Limitations

- **Phase separation:** At certain compositions
- **High hygroscopicity:** Absorbs water readily
- **Poor durability:** Leaches in water
- **Limited data:** Few precise measurements

---

## System 3: Fluoride Glasses

### Composition Types

**Heavy Metal Fluorides (ZBLAN):**
```
ZrF4:   53%
BaF2:   20%
LaF3:   4%
AlF3:   3%
NaF:    20%
```

**Fluoroaluminates:**
```
AlF3:   30%
CaF2:   25%
MgF2:   20%
SiO2:   15%
NaF:    10%
```

---

### Viscosity Model

**Arrhenius (simplified):**
```
ln(η) = A + B/T

A = -8.0 to -6.0
B = 8,000 to 12,000 K
```

**Very different from oxide glasses:**
- Lower temperatures (300-600°C)
- Weaker network structure
- More fragile

---

### Measured Data (Fluoroaluminate)

**Source:** Poulain et al. (1977)

| Temp (°C) | Log₁₀ η (Pa·s) | Notes |
|-----------|----------------|-------|
| 600 | 2.0 | Forming |
| 500 | 3.5 | Working |
| 400 | 5.5 | -- |
| 380 | 7.6 | **Softening** |
| 300 | 12.0 | Near Tg |

**Fixed Points:**
```
Softening Point:  380°C (LOWEST oxide glass)
Tg:              ~280°C
```

---

### Applications

- **IR optics:** Transmission 0.3-7 μm
- **Optical fibers:** Ultra-low loss potential
- **Laser hosts:** Rare earth doping
- **Research:** Novel glass systems

---

### Limitations

- **Moisture sensitive:** HF formation
- **Crystallization prone:** Narrow glass-forming range
- **Expensive:** Rare earth components
- **Limited data:** Specialized applications only

---

## System 4: Oxyhalide Glasses

### Composition

**Example:**
```
SiO2:   70%
NaF:    12%
Na2O:   10%
NaCl:    5%
CaO:     3%
```

**Mixed anion system:** O²⁻, F⁻, Cl⁻

---

### Viscosity Model

**Modified VFT with halide correction:**

```
Base VFT from oxide composition
Apply fluoride correction: -80 K per wt% F
Apply chloride correction: -60 K per wt% Cl
```

---

### Measured Data

**Limited data available**

| Temp (°C) | Est. Log₁₀ η | Notes |
|-----------|--------------|-------|
| 1000 | 3.0 | Estimated |
| 800 | 5.0 | -- |
| 520 | 7.6 | **Softening** (est.) |

---

### Applications

- **Experimental:** Research only
- **Potential:** Halide benefits + oxide stability
- **Limited commercial use**

---

### Limitations

- **Very limited data:** Few measurements
- **Phase separation:** Common
- **Volatility:** Halides evaporate
- **Not recommended:** Use oxide models instead

---

## Implementation Strategy

### For Pure Silica

```typescript
function calculatePureSilicaViscosity(T_C: number): number {
  const A = -2.8;
  const B = 13500;
  const T0 = 475;
  const T_K = T_C + 273.15;
  
  const logEta = A + B / (T_K - T0);
  return Math.pow(10, logEta);
}
```

---

### For Sodium Silicate

```typescript
function calculateSodiumSilicateParameters(
  SiO2_pct: number,
  Na2O_pct: number
): { A: number; B: number; T0: number } {
  // Linear interpolation between known compositions
  const x = Na2O_pct / (SiO2_pct + Na2O_pct); // Mole fraction approximation
  
  // At x=0.25 (disilicate): B=7500, T0=250
  // At x=0.33 (metasilicate): B=6200, T0=200
  
  const B = 7500 - (x - 0.25) / (0.33 - 0.25) * (7500 - 6200);
  const T0 = 250 - (x - 0.25) / (0.33 - 0.25) * (250 - 200);
  const A = -3.5;
  
  return { A, B, T0 };
}
```

---

### For Fluoride Glasses

```typescript
function calculateFluorideGlassViscosity(
  comp: Record<string, number>,
  T_C: number
): number {
  // Simplified Arrhenius
  const A = -7.0;
  const B = 10000;
  const T_K = T_C + 273.15;
  
  const lnEta = A + B / T_K;
  return Math.exp(lnEta);
}
```

---

## Summary Table

| System | Temp Range | Model | Data Quality | Application |
|--------|------------|-------|--------------|-------------|
| Pure Silica | 1100-2300°C | VFT | Good | Optical fibers |
| Sodium Silicate | 500-1200°C | VFT | Medium | Water glass |
| Fluoride Glasses | 300-600°C | Arrhenius | Poor | IR optics |
| Oxyhalides | 500-1000°C | Modified VFT | Very Poor | Research |

---

## References

1. **Hetherington, G., Jack, K.H., Kennedy, J.C. (1964)**
   - Physics and Chemistry of Glasses 5(5):130-136

2. **Bockris, J.O'M., Tomlinson, J.W., White, J.L. (1955)**
   - J. Phys. Chem. 59(6):496-501

3. **Poulain, M., Poulain, M., Lucas, J. (1977)**
   - Mat. Res. Bull. 12(2):151-156

---

**END OF PART II: Composition-Dependent Models**

