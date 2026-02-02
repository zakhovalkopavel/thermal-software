# NestJS Migration Specification - UPDATED

**Date:** February 1, 2026  
**Status:** Planning Complete - Implementation Started  
**Version:** 2.0

---

## 📚 MIGRATION DOCUMENTATION STRUCTURE

**This specification has been divided into detailed step-by-step guides:**

### Master Index
👉 **[MIGRATION_INDEX.md](MIGRATION_INDEX.md)** - Start here for complete overview

### Detailed Implementation Steps
1. **[STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)** - 11 calculators, complete mapping
2. **[STEP_02_FURNACE_MODULE.md](STEP_02_FURNACE_MODULE.md)** - Combustion model migration
3. **[STEP_03_THERMOPHYSICAL_MODULE.md](STEP_03_THERMOPHYSICAL_MODULE.md)** - Material database
4. **[STEP_04_FRONTEND_PAGES.md](STEP_04_FRONTEND_PAGES.md)** - React UI migration
5. **[STEP_05_DATABASE_MIGRATION.md](STEP_05_DATABASE_MIGRATION.md)** - PostgreSQL schema
6. **[STEP_06_TESTING.md](STEP_06_TESTING.md)** - Testing strategy

### Progress Tracking
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Current progress
- **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)** - 150+ detailed tasks

---

## 🎯 QUICK START

**BEFORE you start implementation:**
1. Read [../../NAMING_CONVENTIONS.md](../../NAMING_CONVENTIONS.md) - **MANDATORY**
2. Read [MIGRATION_INDEX.md](MIGRATION_INDEX.md)
3. Follow [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)
4. Check off tasks in [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
5. Update [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## Legacy → New Mapping Summary

### Refractory Module (11 Calculators)
```
legacy/refractory/src/calculators/
├── PhaseEquilibriumCalculator.ts       → services/phase-equilibrium.service.ts
├── BlendOptimizer.ts                   → services/blend-optimizer.service.ts
├── PSDCalculator.ts                    → services/psd-calculator.service.ts
├── PackingCalculator.ts                → services/packing.service.ts
├── ShrinkageCalculator.ts              → services/shrinkage.service.ts
├── GlassViscosityCalculator.ts         → services/glass-viscosity.service.ts
├── ViscosityCalculator.ts              → services/viscosity.service.ts
├── RefractorinessStandardsCalculator.ts → services/refractoriness.service.ts
├── MineralPhaseIdentifier.ts           → services/mineral-phase.service.ts
├── ThermalPerformanceCalculator.ts     → services/thermal-performance.service.ts
└── ParticipationCalculator.ts          → services/participation.service.ts
```

### Furnace Module
```
legacy/furnaceCombustion/
├── furnace_combustion_model.js         → services/combustion.service.ts
├── classes/Fuel.js                     → classes/fuel.class.ts
├── classes/ExhaustGas.js               → classes/exhaust-gas.class.ts
└── modules/                            → services/
```

### Thermophysical Module
```
legacy/python_scripts/
├── thermophysical_data_processor.py    → services/property-calculator.service.ts
├── bulk_pubchem_fetcher.py             → services/pubchem.service.ts
└── enrich_database.py                  → services/enrichment.service.ts
```

---

## Module Structure

### Complete Backend Structure
```
backend/src/modules/
├── refractory/
│   ├── refractory.module.ts
│   ├── dto/              # 7 DTO files
│   ├── entities/         # 3 entity files
│   ├── services/         # 11 service files
│   ├── controllers/      # 2 controller files
│   ├── repositories/     # 2 repository files
│   └── data/             # Static data files
├── furnace/
│   ├── furnace.module.ts
│   ├── dto/              # 3 DTO files
│   ├── entities/         # 1 entity file
│   ├── services/         # 4 service files
│   ├── controllers/      # 1 controller file
│   └── classes/          # 3 class files
└── thermophysical/
    ├── thermophysical.module.ts
    ├── dto/              # 3 DTO files
    ├── entities/         # 3 entity files
    ├── services/         # 4 service files
    ├── controllers/      # 1 controller file
    └── repositories/     # 2 repository files
```

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── refractory/
│   │   ├── PhaseCalculator/      # 4 components
│   │   ├── BlendOptimizer/       # 6 components
│   │   ├── MixLibrary/           # 4 components
│   │   └── MaterialLibrary/      # 3 components
│   └── furnace/
│       └── CombustionCalculator/ # 3 components
├── components/
│   ├── common/           # 4 components
│   └── charts/           # 3 chart components
├── services/
│   ├── api/              # 3 API service files
│   └── hooks/            # 3 custom hooks
└── types/                # Type definitions
```

---

## Statistics

**Total Files to Create:**
- Backend Services: 19
- Backend DTOs: 13
- Backend Entities: 7
- Backend Controllers: 4
- Backend Repositories: 4
- Frontend Pages: 5
- Frontend Components: 20+
- Tests: 50+

**Total API Endpoints:** 20+
**Total Database Tables:** 8
**Estimated Timeline:** 5-6 weeks

---

## Implementation Progress

**Current Status:** 1%
- [x] Module structure created
- [x] Documentation complete
- [ ] Phase equilibrium (partial)
- [ ] All other modules (0%)

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for details.

---


