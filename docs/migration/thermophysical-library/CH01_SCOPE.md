# CH01 — Scope

## What the library contains

- **thermophysical_anhydrous.csv** — 821 anhydrous inorganic compounds
- **thermophysical_hydrates.csv** — 274 hydrated compounds
- **Total: 1,095 compounds**

Properties per compound: formula, CAS, Tm_C/K, Tb_C/K, Td_C, density, colour, solubility, stability, anion family, cation.

## Current state

Files are copied to `shared/processed/` and available to all services via Docker volume mount.  
No API endpoint exists yet. No database table exists yet.

## How it is used in the project

| Consumer | Use case |
|---|---|
| `backend` | Material property lookup for refractory and thermophysical module (future) |
| `python` service | Data enrichment, new compound generation |
| Future frontend | Compound search / browse UI |

## Evolution path

```
STEP 1 (now)      CSV files in shared/processed/ — read directly by backend file service
STEP 2 (medium)   Python service exposes REST API to query/enrich compounds
STEP 3 (later)    Backend seeder imports CSV → PostgreSQL; all services query DB
STEP 4 (future)   Python service can regenerate/expand CSV via PubChem API; re-seed DB
```

## Verification

`legacy/library/verify.sh` — existing script to validate CSV structure.  
Must be ported and run as part of CI when CSV files change.

