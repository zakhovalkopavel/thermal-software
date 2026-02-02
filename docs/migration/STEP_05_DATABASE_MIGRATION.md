# STEP 05: Database Migration

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Estimated Time:** 3-4 days  
**Dependencies:** Entities defined

---

## Database Schema

### Tables to Create

```
materials                  - Material library
mix_presets               - Saved mix configurations
thermophysical_materials  - Thermophysical property database
fuels                     - Fuel database
phase_diagrams            - Phase diagram data
users                     - User accounts (future)
calculation_history       - Calculation history (future)
```

---

## Migration Scripts

### 1. Create Tables

```typescript
// migrations/001_create_materials_table.ts
export class CreateMaterialsTable1707000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'materials',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'type', type: 'varchar' },
          { name: 'composition', type: 'jsonb' },
          { name: 'rho_true_after_firing_kgm3', type: 'float' },
          { name: 'particle_size', type: 'jsonb', isNullable: true },
          { name: 'thermal_properties', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('materials');
  }
}
```

---

### 2. Seed Data from Legacy

```typescript
// seeds/001_seed_materials.ts
export class SeedMaterials1707000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Parse legacy CSV files
    const materials = await this.parseLegacyMaterials();
    
    // Bulk insert
    await queryRunner.manager.save(Material, materials);
  }

  private async parseLegacyMaterials(): Promise<Material[]> {
    // Read from legacy/library/processed_data/
    // Parse CSV files
    // Convert to Material entities
  }
}
```

---

## Data Migration Steps

### Step 1: Legacy Data Analysis (4 hours)
- [ ] Analyze legacy CSV structure
- [ ] Map fields to new schema
- [ ] Identify data quality issues
- [ ] Plan data transformations

### Step 2: Migration Scripts (8 hours)
- [ ] Create all migration files
- [ ] Create seed files
- [ ] Test migrations locally
- [ ] Validate data integrity

### Step 3: Data Import (4 hours)
- [ ] Parse legacy CSV files
- [ ] Transform data
- [ ] Bulk insert
- [ ] Verify data

### Step 4: Validation (4 hours)
- [ ] Check row counts
- [ ] Validate relationships
- [ ] Test queries
- [ ] Performance testing

**Total:** 20 hours (3-4 days)

---

**Next:** [STEP_06_TESTING.md](STEP_06_TESTING.md)

