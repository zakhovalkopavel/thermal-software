# Quick Reference - Interfaces Organization

**Date:** February 2, 2026  
**Version:** 1.0

---

## 📂 Folder Structure

```
refractory/
├── interfaces/          ✅ TypeScript Interfaces (NEW)
│   ├── index.ts        ← Central export point
│   ├── thermal-performance.interface.ts
│   └── glass-viscosity.interface.ts
│
├── types/               ✅ PSD + packing + shrinkage + blend shapes (Phase 6.3)
├── utils/psd-type-guards.ts              ✅ PsdTypeGuards
├── utils/packing-type-guards.ts          ✅ PackingTypeGuards
├── utils/shrinkage-type-guards.ts        ✅ ShrinkageTypeGuards
├── utils/blend-optimizer-type-guards.ts      ✅ BlendOptimizerTypeGuards
├── utils/phase-equilibrium-type-guards.ts    ✅ PhaseEquilibriumTypeGuards
├── utils/mineral-phase-type-guards.ts        ✅ MineralPhaseTypeGuards
├── utils/refractoriness-type-guards.ts       ✅ RefractorinessTypeGuards
│
└── dto/                ✅ NestJS DTOs (Validation)
    ├── blend-optimization.dto.ts
    ├── common.dto.ts
    ├── glass-viscosity.dto.ts
    ├── packing-calculation.dto.ts
    ├── phase-equilibrium.dto.ts
    ├── refractoriness.dto.ts
    └── shrinkage-prediction.dto.ts
```

---

## 📖 How to Import

### Option 1: Central Index (Recommended)
```typescript
import {
  BlendOptimizationRequest,
  RefractorinessInput,
  ThermalPerformanceResult,
} from '../interfaces';
```

### Option 2: Specific File
```typescript
import type { BlendOptimizationRequest } from '../types/blend-optimization-request.type';
```

### Option 3: Type Guards
```typescript
import { PsdTypeGuards } from '../utils/psd-type-guards';
import { RefractorinessTypeGuards } from '../utils/refractoriness-type-guards';

if (!PsdTypeGuards.isPSDCalculationRequest(data)) { /* … */ }
if (!RefractorinessTypeGuards.isRefractorinessInput(data)) { /* … */ }
```

---

## 📋 All Available Interfaces

### Blend Optimizer
```typescript
Fraction
BlendOptimizationOptions
BlendOptimizationRequest
BlendOptimizationResult
BlendOptimizationResults
ShrinkagePrediction
```

### PSD Calculator
```typescript
PSDFraction
PSDCalculationOptions
PSDCalculationRequest
PSDResult
```

### Packing Calculator
```typescript
PackingInput
CPMInput
FurnasInput
CPMCalibration
PackingResult
PackingResultDetailed
```

### Shrinkage Calculator
```typescript
ShrinkageMaterial
ShrinkageInput
ShrinkageStage
DryingShrinkage
FiringShrinkage
ShrinkageResult
ShrinkageMetadata
```

### Phase Equilibrium
```typescript
PhaseEquilibriumInput
PhaseComponent
MineralPhase
PhaseData
SolidPhaseData
PhaseEquilibriumResult
PhaseEquilibriumMetadata
```

### Thermal Performance
```typescript
ThermalInput
ThermalConductivityInput
SpecificHeatInput
ThermalExpansionInput
ComponentThermalProperties
WeightedThermalProperty
ThermalConductivityResult
SpecificHeatResult
ThermalExpansionResult
ThermalPerformanceResult
ThermalPerformanceMetadata
```

### Refractoriness
```typescript
RefractorinessInput
RefractorinessStandard
ISO1893Result
ASTMC24Result
GOST4069Result
DutyClassification
RefractorinessResult
ComponentRefractorinesEffect
RefractorinessMetadata
RefractorinessComparison
```

### Viscosity
```typescript
ViscosityInput
ViscosityResult
ViscosityMetadata
```

### Glass Viscosity
```typescript
GlassViscosityInput
ASTMFixedPoint
GlassViscosityResult
GlassViscosityMetadata
GlassProcessingWindow
```

### Mineral Phase
```typescript
MineralPhaseData
MineralPhaseInput
MineralPhaseResult
MineralPhaseMetadata
PhaseDistribution
PhaseStability
PhaseTemperatureComparison
```

---

## 🔍 Type Guards

All interfaces have corresponding type guards:

```typescript
PsdTypeGuards.isPSDFraction()
PsdTypeGuards.isPSDCalculationRequest()
PsdTypeGuards.isPSDResult()
PackingTypeGuards.isPackingInput()
PackingTypeGuards.isCPMInput()
PackingTypeGuards.isFurnasInput()
PackingTypeGuards.isPackingResult()
ShrinkageTypeGuards.isShrinkageMaterial()
ShrinkageTypeGuards.isShrinkageInput()
ShrinkageTypeGuards.isShrinkageStage()
ShrinkageTypeGuards.isShrinkageResult()
BlendOptimizerTypeGuards.isFraction()
BlendOptimizerTypeGuards.isBlendOptimizationOptions()
BlendOptimizerTypeGuards.isBlendOptimizationRequest()
PhaseEquilibriumTypeGuards.isPhaseEquilibriumInput()
PhaseEquilibriumTypeGuards.isPhaseData()
PhaseEquilibriumTypeGuards.isMineralPhase()
PhaseEquilibriumTypeGuards.isPhaseEquilibriumResult()
isThermalInput()
isThermalConductivityInput()
RefractorinessTypeGuards.isRefractorinessInput()
RefractorinessTypeGuards.isRefractorinessResult()
isGlassViscosityInput()
MineralPhaseTypeGuards.isMineralPhaseInput()
MineralPhaseTypeGuards.isMineralPhaseData()
MineralPhaseTypeGuards.isMineralPhaseResult()
// ... remaining free is* guards migrate to static classes in Phase 6.3
```

---

## 🚀 Usage Examples

### Complete Import
```typescript
import {
  BlendOptimizationRequest,
  BlendOptimizationResult,
  isBlendOptimizationRequest,
} from '../interfaces';

export class BlendOptimizerService {
  optimize(request: BlendOptimizationRequest): BlendOptimizationResult[] {
    // Implementation
  }
}
```

### With Type Guard
```typescript
import { isRefractorinessInput } from '../interfaces';

function validateInput(data: unknown) {
  if (!isRefractorinessInput(data)) {
    throw new Error('Invalid input');
  }
  // data is now typed as RefractorinessInput
}
```

### Multiple Imports
```typescript
import {
  ThermalInput,
  ThermalConductivityInput,
  ThermalConductivityResult,
  ThermalPerformanceResult,
  isThermalConductivityInput,
} from '../interfaces';
```

---

## 📊 Statistics at a Glance

| Metric | Count |
|--------|-------|
| Interface Files | 10 |
| Index Exports | 1 |
| Total Interfaces | 97+ |
| Type Guards | 39 |
| DTO Files | 7 |
| Total Lines | 3000+ |

---

## ✅ Status

- ✅ All interfaces organized
- ✅ Central index created
- ✅ Type guards available
- ✅ Documentation complete
- ✅ Ready for use

---

## 📝 Notes

- Always import from `../interfaces` or `../interfaces/index.ts`
- DTOs remain in `../dto` for NestJS validation
- Type guards available for runtime validation
- All interfaces fully documented with JSDoc
- Structure follows TypeScript/NestJS best practices

---

**For detailed documentation, see:** `tmp/reports/INTERFACES_FOLDER_ORGANIZATION_COMPLETE.md`

