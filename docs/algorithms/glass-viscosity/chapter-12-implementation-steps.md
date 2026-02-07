# Chapter 12: Implementation Steps

**Part III: Implementation**

---

## Implementation Overview

This chapter provides step-by-step instructions for implementing composition-dependent viscosity models in `glass-viscosity.service.ts`.

### Implementation Priority

**Phase 1-3:** Core functionality (Priority 1 - required)
**Phase 4-6:** System-specific models (Priority 2 - high value)
**Phase 7-8:** Advanced features (Priority 3 - nice to have)

**Estimated effort:**
- Phase 1-3: 3-5 days
- Phase 4-6: 5-7 days
- Phase 7-8: 3-4 days
- **Total: 11-16 days**

---

## Phase 1: Composition Range Detection

**Goal:** Implement automatic detection of glass system type

**Estimated time:** 1 day

### Step 1.1: Create ViscosityModel Enum

**File:** `backend/src/modules/refractory/enums/viscosity-model.enum.ts` (create new)

```typescript
/**
 * Glass system types for composition-dependent viscosity models
 */
export enum ViscosityModel {
  SODA_LIME_SILICA = 'SODA_LIME_SILICA',
  BOROSILICATE = 'BOROSILICATE',
  ALUMINOSILICATE = 'ALUMINOSILICATE',
  LEAD_GLASS = 'LEAD_GLASS',
  PURE_SILICA = 'PURE_SILICA',
  SODIUM_SILICATE = 'SODIUM_SILICATE',
  SLAG_CAO_AL2O3 = 'SLAG_CAO_AL2O3',
  FLUORIDE_GLASS = 'FLUORIDE_GLASS',
  MULTI_COMPONENT_MIXING = 'MULTI_COMPONENT_MIXING',
}

export const ViscosityModelNames: Record<ViscosityModel, string> = {
  [ViscosityModel.SODA_LIME_SILICA]: 'Soda-Lime-Silica Glass (Lakatos 1972)',
  [ViscosityModel.BOROSILICATE]: 'Borosilicate Glass (Dingwell 1992)',
  [ViscosityModel.ALUMINOSILICATE]: 'Aluminosilicate Glass (Giordano 2008)',
  [ViscosityModel.LEAD_GLASS]: 'Lead Glass (Mazurin 1983)',
  [ViscosityModel.PURE_SILICA]: 'Pure Fused Silica (Urbain 1982)',
  [ViscosityModel.SODIUM_SILICATE]: 'Sodium Silicate (Bockris 1955)',
  [ViscosityModel.SLAG_CAO_AL2O3]: 'Calcium-Aluminate Slag (Mills 1993)',
  [ViscosityModel.FLUORIDE_GLASS]: 'Fluoride Glass (Poulain 1977)',
  [ViscosityModel.MULTI_COMPONENT_MIXING]: 'Multi-Component Mixing Model',
};
```

### Step 1.2: Implement Composition Normalization

**File:** `backend/src/modules/refractory/services/glass-viscosity.service.ts`

```typescript
/**
 * Normalize composition to sum to 100%
 */
private normalizeComposition(composition: Record<string, number>): Record<string, number> {
  const total = Object.values(composition).reduce((sum, val) => sum + (val || 0), 0);
  
  if (total === 0) {
    throw new BadRequestException('Composition cannot be empty or all zeros');
  }
  
  // If already close to 100%, don't normalize
  if (Math.abs(total - 100) < 0.01) {
    return composition;
  }
  
  // Normalize to 100%
  const normalized: Record<string, number> = {};
  for (const [component, value] of Object.entries(composition)) {
    if (value && value > 0) {
      normalized[component] = (value / total) * 100;
    }
  }
  
  return normalized;
}
```

### Step 1.3: Implement System Detection Logic

```typescript
/**
 * Detect glass system type based on composition
 * 
 * Detection order (most specific first):
 * 1. Pure/binary systems
 * 2. Specialty systems (lead, fluoride)
 * 3. Commercial systems (borosilicate, aluminosilicate)
 * 4. Slags
 * 5. Default (soda-lime-silica or multi-component)
 */
private detectViscosityModel(comp: Record<string, number>): ViscosityModel {
  // Extract major components
  const SiO2 = comp.SiO2 || 0;
  const Al2O3 = comp.Al2O3 || 0;
  const B2O3 = comp.B2O3 || 0;
  const Na2O = comp.Na2O || 0;
  const K2O = comp.K2O || 0;
  const CaO = comp.CaO || 0;
  const MgO = comp.MgO || 0;
  const PbO = comp.PbO || 0;
  const FeO = (comp.FeO || 0) + (comp.Fe2O3 || 0);
  
  // Calculate totals
  const alkali = Na2O + K2O + (comp.Li2O || 0);
  const alkalineEarth = CaO + MgO + (comp.BaO || 0) + (comp.SrO || 0);
  const fluorides = (comp.CaF2 || 0) + (comp.NaF || 0) + (comp.KF || 0) + 
                    (comp.MgF2 || 0) + (comp.AlF3 || 0) + (comp.LiF || 0);
  
  // 1. Pure silica (>99% SiO2)
  if (SiO2 > 99) {
    return ViscosityModel.PURE_SILICA;
  }
  
  // 2. Lead glass (PbO > 15%)
  if (PbO > 15) {
    return ViscosityModel.LEAD_GLASS;
  }
  
  // 3. Fluoride glass (fluorides > 20%)
  if (fluorides > 20) {
    return ViscosityModel.FLUORIDE_GLASS;
  }
  
  // 4. Borosilicate (B2O3 > 7%, SiO2 > 70%, low alkali)
  if (B2O3 > 7 && SiO2 > 70 && alkali < 10) {
    return ViscosityModel.BOROSILICATE;
  }
  
  // 5. High-alumina (Al2O3 > 12%, SiO2 50-70%)
  if (Al2O3 > 12 && SiO2 >= 50 && SiO2 <= 70) {
    return ViscosityModel.ALUMINOSILICATE;
  }
  
  // 6. Calcium-aluminate slag (CaO > 30%, SiO2 < 50%)
  if (CaO > 30 && SiO2 < 50) {
    return ViscosityModel.SLAG_CAO_AL2O3;
  }
  
  // 7. Sodium silicate binary (SiO2 > 60%, Na2O > 18%, minimal other components)
  if (SiO2 > 60 && Na2O > 18 && (Al2O3 + CaO + MgO + K2O + B2O3) < 5) {
    return ViscosityModel.SODIUM_SILICATE;
  }
  
  // 8. Soda-lime-silica (65-80% SiO2, 8-20% alkali, 3-20% alkaline earth)
  if (SiO2 >= 65 && SiO2 <= 80 && alkali >= 8 && alkali <= 20 && alkalineEarth >= 3) {
    return ViscosityModel.SODA_LIME_SILICA;
  }
  
  // 9. Multi-component (fallback for complex compositions)
  return ViscosityModel.MULTI_COMPONENT_MIXING;
}
```

### Step 1.4: Add Validation and Warnings

```typescript
interface CompositionValidation {
  modelType: ViscosityModel;
  modelName: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  warnings: string[];
  extrapolationRisk: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE';
}

private validateComposition(
  comp: Record<string, number>,
  modelType: ViscosityModel
): CompositionValidation {
  const warnings: string[] = [];
  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let extrapolationRisk: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE' = 'NONE';
  
  // Check ranges based on model type
  switch (modelType) {
    case ViscosityModel.SODA_LIME_SILICA:
      if ((comp.SiO2 || 0) < 65 || (comp.SiO2 || 0) > 80) {
        warnings.push(`SiO2 content (${comp.SiO2?.toFixed(1)}%) outside validated range (65-80%)`);
        confidenceLevel = 'MEDIUM';
        extrapolationRisk = 'MINOR';
      }
      const alkali = (comp.Na2O || 0) + (comp.K2O || 0);
      if (alkali < 10 || alkali > 18) {
        warnings.push(`Alkali content (${alkali.toFixed(1)}%) outside validated range (10-18%)`);
        confidenceLevel = 'MEDIUM';
      }
      break;
      
    case ViscosityModel.BOROSILICATE:
      if ((comp.B2O3 || 0) < 8 || (comp.B2O3 || 0) > 15) {
        warnings.push(`B2O3 content (${comp.B2O3?.toFixed(1)}%) outside validated range (8-15%)`);
        confidenceLevel = 'MEDIUM';
      }
      // Check for boron anomaly
      const alkaliB = (comp.Na2O || 0) + (comp.K2O || 0);
      const B2O3 = comp.B2O3 || 0;
      if (B2O3 > 0) {
        const R_molar = (alkaliB / 62) / (B2O3 / 69.6); // Approximate molar ratio
        if (R_molar > 0.3 && R_molar < 1.2) {
          warnings.push(`Composition in boron anomaly region (R = ${R_molar.toFixed(2)}). Model accuracy reduced.`);
          confidenceLevel = 'MEDIUM';
          extrapolationRisk = 'MODERATE';
        }
      }
      break;
      
    case ViscosityModel.ALUMINOSILICATE:
      if ((comp.Al2O3 || 0) < 15 || (comp.Al2O3 || 0) > 30) {
        warnings.push(`Al2O3 content (${comp.Al2O3?.toFixed(1)}%) outside validated range (15-30%)`);
        confidenceLevel = 'MEDIUM';
      }
      break;
      
    case ViscosityModel.MULTI_COMPONENT_MIXING:
      warnings.push('Composition does not match any validated system. Using mixing model with low confidence.');
      confidenceLevel = 'LOW';
      extrapolationRisk = 'SEVERE';
      break;
  }
  
  return {
    modelType,
    modelName: ViscosityModelNames[modelType],
    confidenceLevel,
    warnings,
    extrapolationRisk,
  };
}
```

### Step 1.5: Test Phase 1

**Create test file:** `backend/test/unit/refractory/services/glass-viscosity-detection.spec.ts`

```typescript
import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';
import { ViscosityModel } from '../../../../src/modules/refractory/enums/viscosity-model.enum';

describe('GlassViscosityService - System Detection', () => {
  let service: GlassViscosityService;
  
  beforeEach(() => {
    service = new GlassViscosityService();
  });
  
  it('should detect soda-lime-silica glass', () => {
    const composition = {
      SiO2: 72.2,
      Al2O3: 1.3,
      Na2O: 13.4,
      K2O: 0.4,
      CaO: 11.2,
      MgO: 1.5,
    };
    
    const detected = service['detectViscosityModel'](composition);
    expect(detected).toBe(ViscosityModel.SODA_LIME_SILICA);
  });
  
  it('should detect borosilicate glass', () => {
    const composition = {
      SiO2: 80.6,
      B2O3: 12.9,
      Al2O3: 2.3,
      Na2O: 3.9,
      K2O: 0.3,
    };
    
    const detected = service['detectViscosityModel'](composition);
    expect(detected).toBe(ViscosityModel.BOROSILICATE);
  });
  
  it('should detect pure silica', () => {
    const composition = {
      SiO2: 99.9,
      Al2O3: 0.1,
    };
    
    const detected = service['detectViscosityModel'](composition);
    expect(detected).toBe(ViscosityModel.PURE_SILICA);
  });
  
  it('should detect lead glass', () => {
    const composition = {
      SiO2: 59.0,
      PbO: 24.0,
      K2O: 12.0,
      Na2O: 4.0,
      Al2O3: 1.0,
    };
    
    const detected = service['detectViscosityModel'](composition);
    expect(detected).toBe(ViscosityModel.LEAD_GLASS);
  });
  
  it('should warn when composition is outside validated range', () => {
    const composition = {
      SiO2: 85.0, // Above 80%
      Na2O: 12.0,
      CaO: 3.0,
    };
    
    const validation = service['validateComposition'](composition, ViscosityModel.SODA_LIME_SILICA);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.confidenceLevel).toBe('MEDIUM');
  });
});
```

**Run tests:**
```bash
cd /opt/thermal-software/backend
npm test -- glass-viscosity-detection.spec.ts
```

---

## Phase 2: System-Specific Parameter Sets

**Goal:** Create parameter objects for each glass system

**Estimated time:** 1-2 days

### Step 2.1: Create Parameter Interface

**File:** `backend/src/modules/refractory/interfaces/viscosity-parameters.interface.ts` (create new)

```typescript
export enum ViscosityModelType {
  ARRHENIUS = 'ARRHENIUS',
  VFT = 'VFT',
}

export interface ComponentEffectRange {
  component: string;
  effectMin: number; // K per wt%
  effectMax: number; // K per wt%
  validMin: number;  // wt%
  validMax: number;  // wt%
}

export interface ViscosityParameters {
  modelType: ViscosityModelType;
  A: number;           // Pre-exponential factor
  B: number;           // Activation energy / R (K)
  T0?: number;         // VFT temperature (K), optional
  componentEffects: ComponentEffectRange[];
  temperatureRange: {
    min: number;       // °C
    max: number;       // °C
  };
  validCompositionRanges: Record<string, { min: number; max: number }>;
  reference: string;
  notes?: string;
}
```

### Step 2.2: Create Parameter Constants

**File:** `backend/src/modules/refractory/constants/viscosity-parameters.ts` (create new)

```typescript
import { ViscosityParameters, ViscosityModelType } from '../interfaces/viscosity-parameters.interface';
import { ViscosityModel } from '../enums/viscosity-model.enum';

export const VISCOSITY_PARAMETERS: Record<ViscosityModel, ViscosityParameters> = {
  [ViscosityModel.SODA_LIME_SILICA]: {
    modelType: ViscosityModelType.VFT,
    A: -3.2,
    B: 13250,
    T0: 320, // K (47°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 40, effectMax: 50, validMin: 65, validMax: 80 },
      { component: 'Al2O3', effectMin: 100, effectMax: 120, validMin: 0, validMax: 5 },
      { component: 'Na2O', effectMin: -75, effectMax: -85, validMin: 10, validMax: 18 },
      { component: 'K2O', effectMin: -65, effectMax: -75, validMin: 0, validMax: 5 },
      { component: 'CaO', effectMin: -50, effectMax: -60, validMin: 5, validMax: 15 },
      { component: 'MgO', effectMin: 30, effectMax: 40, validMin: 0, validMax: 6 },
      { component: 'Fe2O3', effectMin: -35, effectMax: -45, validMin: 0, validMax: 2 },
    ],
    temperatureRange: { min: 500, max: 1400 },
    validCompositionRanges: {
      SiO2: { min: 65, max: 80 },
      'Na2O+K2O': { min: 10, max: 18 },
      'CaO+MgO': { min: 5, max: 15 },
    },
    reference: 'Lakatos et al. (1972), Glass Technology 13(3):88-95',
    notes: 'MgO acts as network former in soda-lime glasses. Most validated model for commercial glass.',
  },
  
  [ViscosityModel.BOROSILICATE]: {
    modelType: ViscosityModelType.VFT,
    A: -3.8,
    B: 16200,
    T0: 245, // K (-28°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 45, effectMax: 55, validMin: 70, validMax: 85 },
      { component: 'B2O3', effectMin: -30, effectMax: -20, validMin: 8, validMax: 15 },
      { component: 'Al2O3', effectMin: 90, effectMax: 110, validMin: 0, validMax: 5 },
      { component: 'Na2O', effectMin: -80, effectMax: -90, validMin: 2, validMax: 8 },
      { component: 'K2O', effectMin: -70, effectMax: -80, validMin: 0, validMax: 3 },
    ],
    temperatureRange: { min: 400, max: 1400 },
    validCompositionRanges: {
      SiO2: { min: 70, max: 85 },
      B2O3: { min: 8, max: 15 },
      'Na2O+K2O': { min: 2, max: 10 },
    },
    reference: 'Dingwell et al. (1992), Chemical Geology 95(3-4):229-237',
    notes: 'Boron anomaly occurs at 15-20 mol% B2O3. Model less accurate in anomaly region.',
  },
  
  [ViscosityModel.ALUMINOSILICATE]: {
    modelType: ViscosityModelType.VFT,
    A: -4.5,
    B: 19000,
    T0: 350, // K (77°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 50, effectMax: 65, validMin: 50, validMax: 70 },
      { component: 'Al2O3', effectMin: 65, effectMax: 85, validMin: 15, validMax: 30 },
      { component: 'CaO', effectMin: -55, effectMax: -70, validMin: 5, validMax: 15 },
      { component: 'MgO', effectMin: -45, effectMax: -60, validMin: 0, validMax: 10 },
      { component: 'Na2O', effectMin: -85, effectMax: -100, validMin: 0, validMax: 5 },
      { component: 'K2O', effectMin: -75, effectMax: -90, validMin: 0, validMax: 3 },
      { component: 'FeO', effectMin: -50, effectMax: -65, validMin: 0, validMax: 15 },
      { component: 'Fe2O3', effectMin: -45, effectMax: -60, validMin: 0, validMax: 10 },
    ],
    temperatureRange: { min: 900, max: 1600 },
    validCompositionRanges: {
      SiO2: { min: 50, max: 70 },
      Al2O3: { min: 15, max: 30 },
    },
    reference: 'Giordano et al. (2008), EPSL 271:123-134',
    notes: 'Al coordination depends on alkali/Al2O3 ratio. MgO acts as modifier (unlike in SLS).',
  },
  
  [ViscosityModel.LEAD_GLASS]: {
    modelType: ViscosityModelType.ARRHENIUS,
    A: -7.2,
    B: 11800,
    T0: undefined,
    componentEffects: [
      { component: 'SiO2', effectMin: 42, effectMax: 52, validMin: 50, validMax: 70 },
      { component: 'PbO', effectMin: -75, effectMax: -95, validMin: 20, validMax: 40 },
      { component: 'K2O', effectMin: -80, effectMax: -95, validMin: 5, validMax: 15 },
      { component: 'Na2O', effectMin: -85, effectMax: -100, validMin: 0, validMax: 10 },
      { component: 'Al2O3', effectMin: 95, effectMax: 115, validMin: 0, validMax: 5 },
    ],
    temperatureRange: { min: 400, max: 1100 },
    validCompositionRanges: {
      SiO2: { min: 50, max: 70 },
      PbO: { min: 20, max: 40 },
    },
    reference: 'Mazurin & Gankin (1983), Handbook of Glass Data',
    notes: 'PbO very strong flux. Arrhenius fits better than VFT for lead glasses.',
  },
  
  [ViscosityModel.PURE_SILICA]: {
    modelType: ViscosityModelType.VFT,
    A: -2.8,
    B: 13500,
    T0: 475, // K (202°C)
    componentEffects: [
      { component: 'SiO2', effectMin: 55, effectMax: 65, validMin: 99, validMax: 100 },
    ],
    temperatureRange: { min: 1100, max: 2300 },
    validCompositionRanges: {
      SiO2: { min: 99, max: 100 },
    },
    reference: 'Urbain et al. (1982), Hetherington et al. (1964)',
    notes: 'Very high T0. Reference standard for pure network former behavior.',
  },
  
  // Multi-component fallback uses simple mixing
  [ViscosityModel.MULTI_COMPONENT_MIXING]: {
    modelType: ViscosityModelType.VFT,
    A: -3.5,
    B: 14000,
    T0: 300,
    componentEffects: [], // Uses generic effects from component-properties.ts
    temperatureRange: { min: 300, max: 1600 },
    validCompositionRanges: {},
    reference: 'Generic mixing model',
    notes: 'Low accuracy. Experimental validation recommended.',
  },
  
  // Add others as needed...
};
```

### Step 2.3: Test Phase 2

```typescript
describe('GlassViscosityService - Parameters', () => {
  it('should have parameters for all model types', () => {
    for (const modelType of Object.values(ViscosityModel)) {
      const params = VISCOSITY_PARAMETERS[modelType];
      expect(params).toBeDefined();
      expect(params.A).toBeDefined();
      expect(params.B).toBeGreaterThan(0);
    }
  });
  
  it('should have valid component effect ranges for SLS', () => {
    const params = VISCOSITY_PARAMETERS[ViscosityModel.SODA_LIME_SILICA];
    expect(params.componentEffects.length).toBeGreaterThan(0);
    
    const sio2Effect = params.componentEffects.find(e => e.component === 'SiO2');
    expect(sio2Effect).toBeDefined();
    expect(sio2Effect.validMin).toBe(65);
    expect(sio2Effect.validMax).toBe(80);
  });
});
```

---

## Phase 3: Enhanced Viscosity Calculation

**Goal:** Modify `calculateViscosity()` to use detected model and parameters

**Estimated time:** 1-2 days

### Step 3.1: Update calculateViscosity Method

```typescript
calculateViscosity(composition: Record<string, number>, temperature: number) {
  // Step 1: Normalize composition
  const normalizedComp = this.normalizeComposition(composition);
  
  // Step 2: Detect system type
  const modelType = this.detectViscosityModel(normalizedComp);
  
  // Step 3: Get model parameters
  const params = VISCOSITY_PARAMETERS[modelType];
  
  // Step 4: Validate composition against model ranges
  const validation = this.validateComposition(normalizedComp, modelType);
  
  // Step 5: Calculate B parameter using composition-specific effects
  const B = this.calculateBParameter(normalizedComp, params);
  
  // Step 6: Calculate viscosity
  const T_K = temperature + 273.15;
  let viscosity: number;
  
  if (params.modelType === ViscosityModelType.VFT) {
    // VFT model: log10(η) = A + B/(T - T0)
    const logViscosity = params.A + params.B / (T_K - params.T0!);
    viscosity = Math.pow(10, logViscosity);
  } else {
    // Arrhenius model: ln(η) = A + B/T
    const lnViscosity = params.A + B / T_K;
    viscosity = Math.exp(lnViscosity);
  }
  
  // Step 7: Clamp to physical range
  viscosity = Math.max(0.001, Math.min(1e15, viscosity));
  
  // Step 8: Calculate fixed points
  const fixedPoints = this.calculateFixedPoints(normalizedComp, params);
  
  // Step 9: Return comprehensive result
  return {
    viscosity_Pas: Number(viscosity.toFixed(3)),
    temperature_C: temperature,
    logViscosity: Number(Math.log10(viscosity).toFixed(2)),
    model: {
      type: params.modelType,
      systemType: modelType,
      A: params.A,
      B: B,
      T0: params.T0,
    },
    fixedPoints,
    validation: {
      systemDetected: validation.modelName,
      confidenceLevel: validation.confidenceLevel,
      warnings: validation.warnings,
      extrapolationRisk: validation.extrapolationRisk,
    },
    components: this.buildComponentBreakdown(normalizedComp, params),
  };
}
```

### Step 3.2: Implement B Parameter Calculation

```typescript
private calculateBParameter(
  comp: Record<string, number>,
  params: ViscosityParameters
): number {
  let B = params.B;
  
  if (params.componentEffects.length === 0) {
    // Fallback to generic effects from component-properties.ts
    const genericEffect = calculateViscosityEffect(comp);
    B += genericEffect;
  } else {
    // Use composition-specific effects
    for (const effectRange of params.componentEffects) {
      const content = comp[effectRange.component] || 0;
      
      if (content > 0) {
        // Linear interpolation between min and max effect based on concentration
        const relativeConc = (content - effectRange.validMin) / 
                            (effectRange.validMax - effectRange.validMin);
        const clampedConc = Math.max(0, Math.min(1, relativeConc));
        
        const effect = effectRange.effectMin + 
                      (effectRange.effectMax - effectRange.effectMin) * clampedConc;
        
        B += effect * content / 100;
      }
    }
  }
  
  return B;
}
```

---

**Continue with Phases 4-8 in similar detail...**

**Next:** [Chapter 13 - Output Structures](./chapter-13-output-structures.md)

