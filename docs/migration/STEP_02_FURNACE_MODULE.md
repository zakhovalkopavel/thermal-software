# STEP 02: Furnace Combustion Module Migration

**Priority:** MEDIUM  
**Complexity:** HIGH  
**Estimated Time:** 1 week  
**Dependencies:** None

---

## Overview

Migrate furnace combustion model from JavaScript to TypeScript NestJS module.

**Legacy Location:** `legacy/furnaceCombustion/`  
**Target Location:** `backend/src/modules/furnace/`  
**Frontend Target:** `frontend/src/pages/furnace/`

---

## Module Structure

```
backend/src/modules/furnace/
├── furnace.module.ts
├── dto/
│   ├── combustion-input.dto.ts
│   ├── efficiency-calculation.dto.ts
│   └── heat-transfer.dto.ts
├── entities/
│   ├── fuel.entity.ts
│   └── furnace-config.entity.ts
├── services/
│   ├── combustion.service.ts              # FROM: furnace_combustion_model.js
│   ├── heat-transfer.service.ts           # FROM: modules/heat_transfer.js
│   ├── efficiency.service.ts              # FROM: modules/efficiency.js
│   └── stoichiometry.service.ts           # FROM: modules/stoichiometry.js
├── controllers/
│   └── furnace.controller.ts
└── classes/
    ├── fuel.class.ts                       # FROM: classes/Fuel.js
    ├── exhaust-gas.class.ts                # FROM: classes/ExhaustGas.js
    └── combustion-product.class.ts         # FROM: classes/CombustionProduct.js
```

---

## Legacy File Mapping

### 1. furnace_combustion_model.js → combustion.service.ts

**Legacy:** `legacy/furnaceCombustion/furnace_combustion_model.js`  
**Language:** JavaScript → TypeScript  
**Complexity:** HIGH (needs full TypeScript conversion)

**Key Methods to Port:**
- Combustion calculations
- Fuel analysis
- Air/fuel ratio calculations
- Exhaust gas composition

**API Endpoint:**
```typescript
POST /api/v1/furnace/combustion
Body: {
  fuel: { C: 85, H: 12, O: 2, ... },
  excessAir: 1.2,
  temperature: 1200
}
Response: {
  products: { CO2, H2O, N2, O2 },
  heatRelease: 50000,
  efficiency: 75.5
}
```

---

### 2. classes/ → classes/

**Files to Convert:**
- `Fuel.js` → `fuel.class.ts`
- `ExhaustGas.js` → `exhaust-gas.class.ts`
- `CombustionProduct.js` → `combustion-product.class.ts`

---

### 3. modules/ → services/

**Files to Convert:**
- `stoichiometry.js` → `stoichiometry.service.ts`
- `heat_transfer.js` → `heat-transfer.service.ts`
- `efficiency.js` → `efficiency.service.ts`

---

## Entities

```typescript
@Entity('fuels')
export class Fuel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'solid', 'liquid', 'gas'

  @Column('jsonb')
  ultimateAnalysis: {
    C: number;   // Carbon %
    H: number;   // Hydrogen %
    O: number;   // Oxygen %
    N: number;   // Nitrogen %
    S: number;   // Sulfur %
    Ash: number; // Ash %
    H2O: number; // Moisture %
  };

  @Column('float')
  lowerHeatingValue_MJkg: number;

  @Column('float', { nullable: true })
  higherHeatingValue_MJkg: number;
}
```

---

## Implementation Steps

### Step 1: JavaScript → TypeScript Conversion (8 hours)
- [ ] Convert furnace_combustion_model.js to TypeScript
- [ ] Convert all classes to TypeScript
- [ ] Add proper type definitions
- [ ] Fix any type errors

### Step 2: NestJS Service Creation (6 hours)
- [ ] Create combustion.service.ts
- [ ] Port combustion logic
- [ ] Create heat-transfer.service.ts
- [ ] Create efficiency.service.ts
- [ ] Create stoichiometry.service.ts

### Step 3: DTOs & Validation (3 hours)
- [ ] Create combustion-input.dto.ts
- [ ] Add validation rules
- [ ] Create response DTOs

### Step 4: API Controller (3 hours)
- [ ] Create furnace.controller.ts
- [ ] Implement endpoints
- [ ] Add Swagger documentation

### Step 5: Testing (4 hours)
- [ ] Unit tests for services
- [ ] Integration tests
- [ ] Validate against legacy results

**Total:** 24 hours (1 week)

---

**Next:** [STEP_03_THERMOPHYSICAL_MODULE.md](STEP_03_THERMOPHYSICAL_MODULE.md)

