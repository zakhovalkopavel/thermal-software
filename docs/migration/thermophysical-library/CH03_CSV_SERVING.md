# CH03 — CSV Serving (File-Based, Current)

## Backend file service

Until DB migration, the backend reads CSV files directly from `shared/processed/`.

### NestJS service to create: `ThermophysicalFileService`

Location: `backend/src/modules/thermophysical/services/thermophysical-file.service.ts`

```typescript
@Injectable()
export class ThermophysicalFileService {
  private anhydrous: CompoundRecord[];
  private hydrates: CompoundRecord[];

  async onModuleInit(): Promise<void> {
    // Load both CSVs at startup — parse with csv-parse or papaparse
    this.anhydrous = await this.loadCsv('shared/processed/thermophysical_anhydrous.csv');
    this.hydrates  = await this.loadCsv('shared/processed/thermophysical_hydrates.csv');
  }

  findByFormula(formula: string): CompoundRecord | undefined
  findByCas(cas: string): CompoundRecord | undefined
  findByAnionFamily(family: string): CompoundRecord[]
  search(query: CompoundSearchDto): CompoundRecord[]
}
```

### `CompoundRecord` interface

Maps CSV columns directly:

```typescript
export interface CompoundRecord {
  formula: string;
  compound_type: string;
  anion_family: string;
  cation: string;
  CAS: string;
  Tm_C: number | null;
  Tm_K: number | null;
  Tb_C: number | null;
  Tb_K: number | null;
  Td_C: number | null;
  density_g_per_cm3: number | null;
}
```

### Volume mount

`shared/processed/` is already mounted into the backend container via `compose.yml`.  
No change needed to Docker config for this step.

### Package

```bash
cd backend && npm install csv-parse
```

## Controller

```
GET  /thermophysical/compounds?anion=chloride&cation=sodium
GET  /thermophysical/compounds/:formula
```

