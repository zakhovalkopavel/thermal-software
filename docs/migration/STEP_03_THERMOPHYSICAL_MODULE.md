# STEP 03: Thermophysical Module Migration

**Priority:** MEDIUM  
**Complexity:** HIGH (Python → TypeScript)  
**Estimated Time:** 1 week  
**Dependencies:** PostgreSQL, Material database

---

## Overview

Migrate Python scripts for thermophysical data processing and material library management.

**Legacy Location:** `legacy/python_scripts/` + `legacy/library/`  
**Target Location:** `backend/src/modules/thermophysical/`

---

## Module Structure

```
backend/src/modules/thermophysical/
├── thermophysical.module.ts
├── dto/
│   ├── material-search.dto.ts
│   ├── property-calculation.dto.ts
│   └── pubchem-fetch.dto.ts
├── entities/
│   ├── material.entity.ts
│   ├── thermophysical-property.entity.ts
│   └── pubchem-data.entity.ts
├── services/
│   ├── material-database.service.ts        # FROM: library/
│   ├── property-calculator.service.ts      # FROM: thermophysical_data_processor.py
│   ├── pubchem.service.ts                  # FROM: bulk_pubchem_fetcher.py
│   └── enrichment.service.ts               # FROM: enrich_database.py
├── controllers/
│   └── thermophysical.controller.ts
└── repositories/
    ├── material.repository.ts
    └── property.repository.ts
```

---

## Legacy Python Scripts

### 1. thermophysical_data_processor.py → property-calculator.service.ts

**Purpose:** Process and calculate thermophysical properties

**Key Functions:**
- Property calculations
- Data validation
- Unit conversions

---

### 2. bulk_pubchem_fetcher.py → pubchem.service.ts

**Purpose:** Fetch chemical data from PubChem API

**Functions:**
- API integration
- Data caching
- Rate limiting

---

### 3. enrich_database.py → enrichment.service.ts

**Purpose:** Enrich material database with additional properties

---

### 4. library/ → PostgreSQL Database

**Legacy:** CSV files in `legacy/library/`  
**Target:** PostgreSQL tables

**Migration Strategy:**
- Parse CSV files
- Create migration scripts
- Bulk insert into PostgreSQL

---

## Database Schema

```typescript
@Entity('thermophysical_materials')
export class ThermophysicalMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  cas_number: string;

  @Column()
  formula: string;

  @Column('jsonb')
  properties: {
    molarMass_gmol?: number;
    density_kgm3?: number;
    meltingPoint_C?: number;
    boilingPoint_C?: number;
    thermalConductivity_WmK?: number;
    specificHeat_JkgK?: number;
    // ...
  };

  @Column('jsonb', { nullable: true })
  pubchemData?: any;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## Implementation Steps

### Step 1: Database Schema (4 hours)
- [ ] Create entities
- [ ] Create migrations
- [ ] Create repositories

### Step 2: Material Library Migration (8 hours)
- [ ] Parse legacy CSV files
- [ ] Create migration scripts
- [ ] Bulk insert data
- [ ] Validate data integrity

### Step 3: Service Implementation (8 hours)
- [ ] Convert Python logic to TypeScript
- [ ] Implement property calculations
- [ ] Create PubChem integration
- [ ] Implement enrichment logic

### Step 4: API Endpoints (4 hours)
- [ ] Material search/CRUD
- [ ] Property calculations
- [ ] Data enrichment

**Total:** 24 hours (1 week)

---

**Next:** [STEP_04_FRONTEND_PAGES.md](STEP_04_FRONTEND_PAGES.md)

