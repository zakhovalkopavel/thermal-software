# Chapter 1: Current Implementation Issues

**Part I: Problem Definition and Background**

---

## Current State Analysis

### File Location
`backend/src/modules/refractory/services/glass-viscosity.service.ts`

### What Currently Works

1. **Basic Arrhenius model:** `η = A × exp(B/T)`
2. **Component effect calculation:** Uses `calculateViscosityEffect(composition)` from component-properties.ts
3. **Base parameters:** A_BASE = 0.001, B_BASE = 10000 K
4. **All 33 components:** Automatically included via component-properties system

### Critical Problems

#### Problem 1: Fixed Points Ignore Composition
**Current implementation:**
```typescript
private estimateWorkingPoint(comp: Record<string, number>): number {
  return this.estimateSofteningPoint(comp) + 100;  // Fixed offset!
}

private estimateAnnealingPoint(comp: Record<string, number>): number {
  return this.estimateSofteningPoint(comp) - 150;  // Fixed offset!
}

private estimateStrainPoint(comp: Record<string, number>): number {
  return this.estimateAnnealingPoint(comp) - 50;   // Fixed offset!
}
```

**Why this is wrong:**
- Temperature offsets (±50-150°C) are composition-independent
- Ignores that different compositions have different activation energies (B parameter)
- Can produce non-physical results (e.g., annealing point > softening point for high-flux glasses)

**Example showing the problem:**
```typescript
// Pure silica: B = 10000 + (0.999 × 3000) = 13000 K
// Softening point: ~1730°C
// Working point: 1730 + 100 = 1830°C  ← WRONG (should be ~2100°C)

// High-Na2O glass: B = 10000 + (0.75 × 3000) + (0.25 × -5500) = 11375 K
// Softening point: ~480°C
// Working point: 480 + 100 = 580°C  ← WRONG (should be ~720°C)
```

#### Problem 2: Inconsistent with Viscosity Model

The `effectFromComponents` is calculated and used for viscosity BUT NOT for fixed points:

```typescript
calculateViscosity(composition, temperature) {
  const effectFromComponents = calculateViscosityEffect(composition);
  B += effectFromComponents;  // ✅ Used here
  
  viscosity = A * Math.exp(B / T_K);  // ✅ Composition-aware
  
  // But fixed points use:
  softeningPoint = estimateSofteningPoint(comp);  // ❌ Only uses 9 components
  workingPoint = softeningPoint + 100;             // ❌ No B parameter!
}
```

#### Problem 3: Hardcoded Empirical Formulas

`estimateSofteningPoint()` only considers ~9 components with arbitrary coefficients:

```typescript
private estimateSofteningPoint(comp: Record<string, number>): number {
  const SiO2 = comp.SiO2 || 0;
  const Al2O3 = comp.Al2O3 || 0;
  const CaO = comp.CaO || 0;
  const Na2O = comp.Na2O || 0;
  const K2O = comp.K2O || 0;
  const networkFormers = SiO2 + Al2O3;
  const networkModifiers = CaO + Na2O + K2O;

  let softeningPoint = 600 + networkFormers * 8 - networkModifiers * 3;
  
  // Additional effects for only 4 more components
  const B2O3 = comp.B2O3 || 0;
  const MgO = comp.MgO || 0;
  const Fe2O3 = comp.Fe2O3 || 0;
  const Cr2O3 = comp.Cr2O3 || 0;

  softeningPoint -= B2O3 * 5;
  softeningPoint += MgO * 4;
  softeningPoint += Fe2O3 * 2;
  softeningPoint += Cr2O3 * 3;

  return Math.max(400, Math.min(1000, softeningPoint));
}
```

**Missing components:** 24 out of 33 components are ignored!
- No BaO, SrO, PbO, Li2O
- No fluorides (6 components)
- No chlorides (6 components)
- No TiO2, ZrO2, GeO2, MnO, CoO, NiO, CuO

#### Problem 4: Composition-Independent Effects

**THE BIGGEST PROBLEM:**

Current implementation assumes component effects are CONSTANTS:
```typescript
// component-properties.ts
export const NA2O: ComponentProperty = {
  viscosityEffect: -5500,  // ← CONSTANT for ALL compositions!
}
```

**Reality:** Component effects depend on:
1. **Component concentration** (e.g., Al2O3 at 1% vs 20%)
2. **Matrix composition** (e.g., Al2O3 in silicate vs borate glass)
3. **Structural role** (e.g., Al as network former or modifier)
4. **Component interactions** (e.g., mixed alkali effect, boron anomaly)

**Example - Al2O3 behavior:**
- At low concentration (<5%) in silicate glass: Network former, viscosityEffect ≈ +120 K/wt%
- At medium concentration (10-20%) with sufficient alkali: Intermediate, viscosityEffect ≈ +85 K/wt%
- At high concentration (>30%): Aluminosilicate network, viscosityEffect ≈ +65 K/wt%
- In CaO-Al2O3 system: Forms calcium aluminate, completely different behavior

**Example - B2O3 behavior (Boron Anomaly):**
- At low B2O3 (<10 wt%): viscosityEffect ≈ -20 K/wt% (slight decrease)
- At medium B2O3 (10-15 wt%): viscosityEffect ≈ -30 K/wt% (viscosity minimum)
- At high B2O3 (>20 wt%): viscosityEffect ≈ +25 K/wt% (reverses sign!)

#### Problem 5: No Temperature Ordering Guarantee

With fixed offsets, can get non-physical results:

```typescript
// High-flux glass example
softeningPoint = 550°C
workingPoint = 550 + 100 = 650°C
annealingPoint = 550 - 150 = 400°C
strainPoint = 400 - 50 = 350°C

// Physical requirement: Strain < Annealing < Softening < Working
// This works ✓

// But for pure silica:
softeningPoint = 1730°C
workingPoint = 1730 + 100 = 1830°C  ← Too low!
annealingPoint = 1730 - 150 = 1580°C
strainPoint = 1580 - 50 = 1530°C

// At workingPoint (η = 10³ Pa·s), pure silica should be ~2100°C
// Error: ~270°C (13% error)
```

---

## Root Cause

The root cause is **treating glass viscosity as a single-model problem** when it's actually a **multi-regime, composition-dependent problem**.

Different glass systems have:
- Different structural networks (silicate, borate, aluminate, phosphate)
- Different modifier interactions (alkali, alkaline earth, heavy metal)
- Different temperature dependencies (Arrhenius vs VFT)
- Different valid composition ranges

**Solution required:** Composition-range-specific models with validated component effects.

---

## Impact

### On Accuracy
- **Fixed point predictions:** ±100-300°C error for non-typical compositions
- **Viscosity predictions:** Factor of 2-10 error outside soda-lime range
- **Relative comparisons:** May incorrectly rank compositions

### On Use Cases
**Currently suitable for:**
- Qualitative comparisons of similar soda-lime glasses
- Educational purposes

**NOT suitable for:**
- Process temperature determination
- Formulation optimization
- Quality control
- Any quantitative predictions

---

## Requirements for Fix

1. **Composition-range detection:** Automatically identify glass system type
2. **System-specific models:** Different parameters for different composition ranges
3. **Validated component effects:** Effects that depend on concentration and matrix
4. **Analytical inversion:** Calculate fixed points from same equation as viscosity
5. **Range validation:** Warn when composition is outside validated ranges
6. **Confidence indicators:** Tell user how reliable the prediction is

---

**Next:** [Chapter 2 - ASTM Standards and Fixed Points](./chapter-02-astm-standards.md)

