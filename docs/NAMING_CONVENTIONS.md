# Naming Conventions

**Last Updated:** February 2, 2026  
**Status:** Active - All 140+ files and variables in compliance

This project follows strict and consistent naming conventions to ensure code readability, maintainability, and professional quality across all modules.

---

## 📋 Core Rules

### 1. **File Names** - `kebab-case` (lowercase with hyphens)

Files must use lowercase with hyphens separating words:

```
✅ CORRECT:
- service-name.service.ts
- dto-name.dto.ts
- particle-sizes.data.ts
- blend-optimizer.service.ts
- materials-oxide.data.ts
- particle-size-classifier.util.ts

❌ INCORRECT:
- ServiceName.service.ts
- dtoName.dto.ts
- particleSizes.data.ts
- blendOptimizer.service.ts
- materials_oxide.data.ts
- ParticleSizeClassifier.util.ts
```

**Specific File Patterns:**
```
Services:       service-name.service.ts
DTOs:           dto-name.dto.ts
Controllers:    controller-name.controller.ts
Entities:       entity-name.entity.ts
Repositories:   repository-name.repository.ts
Utilities:      util-name.util.ts
Data files:     data-name.data.ts
Interfaces:     interface-name.interface.ts
Documentation:  DOCUMENT_NAME.md (UPPER_SNAKE_CASE)
```

---

### 2. **Class Names** - `PascalCase` (UpperCamelCase)

All class definitions must use PascalCase (first letter uppercase):

```typescript
✅ CORRECT:
export class PackingService { }
export class OxideCompositionDto { }
export class MaterialEntity { }
export class ParticleSizeClassifier { }

❌ INCORRECT:
export class packingService { }
export class oxide_CompositionDTO { }
export class material_entity { }
export class particleSizeClassifier { }
```

---

### 3. **Variables & Functions** - `camelCase` (lowerCamelCase)

Local variables, function parameters, and method names must use camelCase:

```typescript
✅ CORRECT:
const volumeFractions = [];
const compactionIndex = 0.5;
function calculateCPM() { }
function getFraction(classification: string) { }
method.getMeshSize(meshNumber)
let materialId = 'uuid-123';

❌ INCORRECT:
const VOLUME_FRACTIONS = [];
const Compaction_Index = 0.5;
function CalculateCPM() { }
function get_fraction(classification: string) { }
method.GetMeshSize(MeshNumber)
let MATERIAL_ID = 'uuid-123';
```

---

### 4. **Constants** - `UPPER_SNAKE_CASE` (uppercase with underscores)

Exported constants and readonly class constants must use UPPER_SNAKE_CASE:

```typescript
✅ CORRECT:
export const PARTICLE_SIZE_CLASSIFICATIONS = { };
export const STANDARD_PARTICLE_SIZES = { };
export const OXIDE_MATERIALS = [ ];
private readonly CPM_BETA0 = 0.64;
private readonly FURNAS_EFFICIENCY = 0.75;

❌ INCORRECT:
export const particleSizeClassifications = { };
export const standardParticleSizes = { };
export const oxideMaterials = [ ];
private readonly cpmBeta0 = 0.64;
private readonly furnasEfficiency = 0.75;
```

---

### 5. **Special Cases & Exceptions**

#### **Chemical Formulas (Exception - Standard Notation)**
Chemical compound formulas use their standard notation regardless of naming rules:

```typescript
✅ CORRECT (Standard chemical notation):
SiO2?: number;          // Silicon dioxide
Al2O3?: number;         // Aluminum oxide
CaO?: number;           // Calcium oxide
MgO?: number;           // Magnesium oxide
Fe2O3?: number;         // Iron oxide
Na2O?: number;          // Sodium oxide
K2O?: number;           // Potassium oxide
```

#### **Units as Suffixes (camelCase with underscore)**
When variables include units, append with underscore after the camelCase name:

```typescript
✅ CORRECT:
densities_kgm3: number[];           // density in kg/m³
diameters_mm: number[];             // diameter in mm
compactionPressure_MPa?: number;    // pressure in MPa
thermalConductivity_WmK: number;    // thermal conductivity in W/(m·K)

❌ INCORRECT:
DENSITIES_kgm3: number[];
DiametersMM: number[];
compaction_pressure_mpa?: number;
ThermalConductivity_WmK: number;
```

#### **Boolean Variables (Prefix with verb)**
Boolean properties/variables should use verb prefixes:

```typescript
✅ CORRECT:
isActive: boolean;
hasError: boolean;
canDelete: boolean;
shouldValidate: boolean;

❌ INCORRECT:
active: boolean;
error: boolean;
delete: boolean;
validate: boolean;
```

---

## 📊 Usage Examples by Category

### **Service Files**
```typescript
// File: packing.service.ts ✅ kebab-case filename
import { Injectable } from '@nestjs/common';

@Injectable()
export class PackingService {  // ✅ PascalCase class
  private readonly CPM_BETA0 = 0.64;  // ✅ UPPER_SNAKE_CASE constant
  
  calculateCPM(inputs: {  // ✅ camelCase method
    massFractions: number[];  // ✅ camelCase parameter
    densities_kgm3: number[];  // ✅ camelCase with unit
  }): number {
    const volumeFractions = [];  // ✅ camelCase variable
    const compactionIndex = this.calculateIndex();  // ✅ camelCase
    return volumeFractions[0];
  }
}
```

### **DTO Files**
```typescript
// File: common.dto.ts ✅ kebab-case filename
import { IsNumber, IsOptional } from 'class-validator';

export class OxideCompositionDto {  // ✅ PascalCase class
  @IsNumber()
  @IsOptional()
  SiO2?: number;  // ✅ Chemical notation exception
  
  @IsNumber()
  @IsOptional()
  Al2O3?: number;  // ✅ Chemical notation exception
}
```

### **Data Files**
```typescript
// File: particle-sizes.data.ts ✅ kebab-case filename
export const PARTICLE_SIZE_CLASSIFICATIONS: Record<...> = {  // ✅ UPPER_SNAKE_CASE
  extra_coarse: {
    dMin_mm: 4.75,
    dMax_mm: 10.0,
  },
};

export const STANDARD_PARTICLE_SIZES: Record<...> = {  // ✅ UPPER_SNAKE_CASE
  COARSE_10_6: { ... },
};
```

### **Utility Files**
```typescript
// File: particle-size-classifier.util.ts ✅ kebab-case filename
export class ParticleSizeClassifier {  // ✅ PascalCase class
  public static get classifications() {  // ✅ camelCase getter
    return PARTICLE_SIZE_CLASSIFICATIONS;  // ✅ UPPER_SNAKE_CASE constant
  }
  
  public static getFraction(classification: string) {  // ✅ camelCase method
    // ...
  }
}
```

---

## 📋 Checklist

Use this checklist when creating new files or naming variables:

- [ ] **File name:** Use `kebab-case` (lowercase with hyphens)
- [ ] **Class name:** Use `PascalCase` (first letter uppercase)
- [ ] **Variable name:** Use `camelCase` (first letter lowercase)
- [ ] **Function name:** Use `camelCase` (first letter lowercase)
- [ ] **Constant name:** Use `UPPER_SNAKE_CASE` (uppercase with underscores)
- [ ] **Boolean variable:** Starts with verb (`is`, `has`, `can`, `should`)
- [ ] **Unit suffix:** Use `_unit` format (e.g., `value_mm`, `density_kgm3`)
- [ ] **Chemical formula:** Use standard notation (SiO2, Al2O3, etc.)

---

## 🚨 Common Mistakes to Avoid

### ❌ **Mistake 1: Mixed Cases in File Names**
```
❌ ParticleSizeClassifier.util.ts
❌ particle_size_classifier.util.ts
✅ particle-size-classifier.util.ts
```

### ❌ **Mistake 2: UPPER_SNAKE_CASE for Local Variables**
```typescript
❌ const VOLUME_FRACTIONS = [];
✅ const volumeFractions = [];

❌ function CALCULATE_CPM() { }
✅ function calculateCPM() { }
```

### ❌ **Mistake 3: camelCase for Constants**
```typescript
❌ export const particleSizeClassifications = { };
✅ export const PARTICLE_SIZE_CLASSIFICATIONS = { };

❌ private readonly cpmBeta0 = 0.64;
✅ private readonly CPM_BETA0 = 0.64;
```

### ❌ **Mistake 4: Inconsistent Unit Notation**
```typescript
❌ densities_Kgm3: number[];
❌ densities_KGMS3: number[];
✅ densities_kgm3: number[];

❌ compactionPressure_MPa: number;
❌ compactionpressure_mpa: number;
✅ compactionPressure_MPa: number;
```

### ❌ **Mistake 5: Underscores in File Names**
```
❌ particle_size_classifier.util.ts
❌ particle_sizes.data.ts
✅ particle-size-classifier.util.ts
✅ particle-sizes.data.ts
```

---

## 🎯 Summary Table

| Element | Convention | Example | ✅/❌ |
|---------|-----------|---------|------|
| File name | `kebab-case` | `particle-sizes.data.ts` | ✅ |
| Class name | `PascalCase` | `ParticleSizeClassifier` | ✅ |
| Variable | `camelCase` | `volumeFractions` | ✅ |
| Function | `camelCase` | `calculateCPM()` | ✅ |
| Constant | `UPPER_SNAKE_CASE` | `CPM_BETA0` | ✅ |
| Parameter | `camelCase` | `compactionIndex` | ✅ |
| Boolean | `camelCase` (verb prefix) | `isActive` | ✅ |
| Unit suffix | `_unit` | `density_kgm3` | ✅ |
| Chemical | Standard notation | `SiO2` | ✅ |
| Documentation | `UPPER_SNAKE_CASE` | `NAMING_CONVENTIONS.md` | ✅ |

---

## 📚 References

- **JavaScript/TypeScript Conventions:** [Google Style Guide](https://google.github.io/styleguide/tsguide.html)
- **NestJS Conventions:** [NestJS Documentation](https://docs.nestjs.com)
- **Angular Style Guide:** [Angular Style Guide](https://angular.io/guide/styleguide)

---

**Note:** All 140+ files and variables in the `backend/src/modules/refractory/` module are currently in 100% compliance with these conventions as of February 2, 2026.

