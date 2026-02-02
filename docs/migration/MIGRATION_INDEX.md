# Legacy Code Migration - Master Index

**Date:** February 1, 2026  
**Status:** Planning Phase  
**Approach:** Incremental, module-by-module migration

---

## Migration Files Structure

This master index links all migration specification files:

### 1. Core Specifications
- **[STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)** - Refractory calculators migration
- **[STEP_02_FURNACE_MODULE.md](STEP_02_FURNACE_MODULE.md)** - Furnace combustion migration
- **[STEP_03_THERMOPHYSICAL_MODULE.md](STEP_03_THERMOPHYSICAL_MODULE.md)** - Material database migration
- **[STEP_04_FRONTEND_PAGES.md](STEP_04_FRONTEND_PAGES.md)** - React UI migration
- **[STEP_05_DATABASE_MIGRATION.md](STEP_05_DATABASE_MIGRATION.md)** - PostgreSQL schema & data
- **[STEP_06_TESTING.md](STEP_06_TESTING.md)** - Test implementation

### 2. Implementation Progress
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Current progress tracking
- **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)** - Task checklist

---

## Legacy → New Mapping

### Refractory Module
```
legacy/refractory/src/
├── calculators/              → backend/src/modules/refractory/services/
├── types/                    → backend/src/modules/refractory/dto/
├── models/                   → backend/src/modules/refractory/entities/
├── data/                     → backend/src/modules/refractory/data/
└── public/                   → frontend/src/pages/refractory/
```

### Furnace Module
```
legacy/furnaceCombustion/
├── furnace_combustion_model.js → backend/src/modules/furnace/services/
├── classes/                    → backend/src/modules/furnace/entities/
├── modules/                    → backend/src/modules/furnace/services/
└── [UI will be new]            → frontend/src/pages/furnace/
```

### Thermophysical Module
```
legacy/python_scripts/         → backend/src/modules/thermophysical/
legacy/library/                → PostgreSQL database
```

---

## Implementation Order

### Phase 1: Backend Core (Week 1-2)
1. **Refractory Module** - 11 calculators
2. **Furnace Module** - Combustion models
3. **Thermophysical Module** - Material database

### Phase 2: Frontend (Week 3-4)
1. **Refractory Pages** - 3 main calculators
2. **Furnace Pages** - Combustion calculator
3. **Material Library** - Browser/manager

### Phase 3: Integration (Week 5)
1. **Database migration** - Material data
2. **API integration** - Connect frontend to backend
3. **Testing** - Unit + Integration + E2E

---

## Quick Reference

**Total Calculators to Migrate:** 14  
**Total Frontend Pages:** 5+  
**Total API Endpoints:** 20+  
**Database Tables:** 8+  

**Estimated Timeline:** 5-6 weeks  
**Team Size:** 1-2 developers  

---

## Next Steps

1. Read **STEP_01_REFRACTORY_MODULE.md** for detailed refractory migration
2. Follow step-by-step implementation
3. Update **IMPLEMENTATION_STATUS.md** as you progress
4. Use **MIGRATION_CHECKLIST.md** to track tasks

---

**Start Here:** [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md)

