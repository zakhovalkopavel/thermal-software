# Thermophysical Library Migration — Document Index

**Sources:**
- `legacy/library/processed_data/` — 1,095 compound CSV records
- `legacy/python_scripts/` — PubChem fetcher, data enrichment, processor scripts

**Target:**
- CSV files → `shared/processed/` (already copied, used directly for now)
- Python scripts → `python/src/thermophysical/` (Python Docker service)
- Future: DB migration via NestJS seeder

**Status:** Planning — March 2026

---

## Chapters

| File | Contents |
|---|---|
| [CH01_SCOPE.md](CH01_SCOPE.md) | What the library contains, how it is used, evolution path |
| [CH02_PYTHON_MIGRATION.md](CH02_PYTHON_MIGRATION.md) | Migrating `legacy/python_scripts/` into Python Docker service |
| [CH03_CSV_SERVING.md](CH03_CSV_SERVING.md) | How the backend serves CSV data now (file-based) |
| [CH04_DB_MIGRATION.md](CH04_DB_MIGRATION.md) | Future path: CSV → database seeder |
| [CHECKLIST.md](CHECKLIST.md) | Task-by-task checklist |

