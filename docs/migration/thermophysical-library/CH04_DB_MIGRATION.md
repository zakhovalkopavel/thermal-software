# CH04 — Future DB Migration

> This step is deferred. Do not implement until CSV serving (CH03) is verified correct.

## Goal

Move compound data from CSV files into PostgreSQL. All services query DB instead of files.  
Material data objects (`data/materials/*.data.ts`) in the recuperator module also migrate to DB at this point.

## Tables

```sql
CREATE TABLE compounds (
  id           SERIAL PRIMARY KEY,
  formula      VARCHAR(64) NOT NULL,
  compound_type VARCHAR(32),
  anion_family VARCHAR(32),
  cation       VARCHAR(32),
  cas          VARCHAR(16),
  tm_c         NUMERIC,
  tm_k         NUMERIC,
  tb_c         NUMERIC,
  tb_k         NUMERIC,
  td_c         NUMERIC,
  density      NUMERIC,
  source       VARCHAR(64),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_thermal_properties (
  id           SERIAL PRIMARY KEY,
  material_key VARCHAR(64) NOT NULL,
  t_min_k      NUMERIC NOT NULL,
  t_max_k      NUMERIC NOT NULL,
  property     VARCHAR(32) NOT NULL,   -- 'lambda' | 'emissivity' | 'cp'
  equation_type VARCHAR(32) NOT NULL,  -- 'linear' | 'cubic' | 'nasa7' | etc.
  coefficients JSONB NOT NULL,
  source       VARCHAR(128),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration path

1. Write NestJS seeder: reads CSV → inserts into `compounds` table.
2. Replace `ThermophysicalFileService` with TypeORM repository.
3. Write seeder for material thermal properties from `data/materials/*.data.ts`.
4. Replace `MaterialService` map lookup with DB query.
5. Verify: all existing unit tests pass unchanged (interface contract preserved).
6. Delete CSV files from `shared/processed/` (or keep as backup).

## Python service DB write

After DB migration, the Python service can write new/enriched records directly to DB  
(via internal API or direct DB connection — TBD).  
Until then, Python service writes enriched CSV; backend re-seeds manually.

