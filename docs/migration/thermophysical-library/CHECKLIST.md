# Thermophysical Library — Implementation Checklist

Track each item with `[x]` when done.

---

## PHASE 1 — Python service: migrate scripts

- [ ] Create `python/src/thermophysical/` package structure
- [ ] Migrate `thermophysical_data_processor.py` → `processor.py`
- [ ] Migrate `bulk_pubchem_fetcher.py` + `enhanced_pubchem_fetcher.py` → `pubchem_fetcher.py`
- [ ] Migrate `clean_pubchem_data.py` → `cleaner.py`
- [ ] Migrate `merge_pubchem_data.py` → `merger.py`
- [ ] Migrate `enrich_database.py` + `manual_enrichment.py` → `enricher.py`
- [ ] Migrate `add_new_families.py` → `family_manager.py`
- [ ] Migrate `extract_experimental_properties.py` → `experimental_extractor.py`
- [ ] Migrate `run_processor.py` → `run.py` (CLI entry point)
- [ ] Update `python/pyproject.toml` with dependencies (`requests`, `pandas`, `numpy`, `fastapi`, `uvicorn`)
- [ ] Port `legacy/library/verify.sh` logic into `python/tests/test_csv_integrity.py`
- [ ] Run migrated scripts against existing CSVs — output must match `shared/processed/`

---

## PHASE 2 — Python service: FastAPI endpoints

- [ ] Add FastAPI app init to Python service (`python/src/main.py`)
- [ ] `GET /thermophysical/compounds` — filter by anion, cation, formula
- [ ] `GET /thermophysical/compounds/:formula` — single lookup
- [ ] `POST /thermophysical/fetch` — trigger PubChem fetch
- [ ] `POST /thermophysical/enrich` — enrich existing records
- [ ] `POST /thermophysical/export` — regenerate CSV
- [ ] Integration test: fetch a known CAS number; verify response fields

---

## PHASE 3 — Backend: CSV file service

- [ ] Install `csv-parse` in backend
- [ ] Create `backend/src/modules/thermophysical/` module scaffold
- [ ] Implement `ThermophysicalFileService` (load on init, search methods)
- [ ] Define `CompoundRecord` interface
- [ ] Implement `ThermophysicalController` — `GET /thermophysical/compounds`
- [ ] Register `ThermophysicalModule` in `AppModule`
- [ ] Unit tests: search by formula, by CAS, by anion family
- [ ] Verify both CSV files load without error

---

## PHASE 4 — DB migration (deferred — do not start until Phase 3 verified)

- [ ] Design `compounds` table migration (TypeORM)
- [ ] Design `material_thermal_properties` table migration
- [ ] Write CSV → DB seeder for `compounds`
- [ ] Write data-object → DB seeder for material thermal properties
- [ ] Replace `ThermophysicalFileService` with TypeORM repository
- [ ] Replace `MaterialService` map with DB query
- [ ] Verify all existing unit tests pass
- [ ] Remove CSV dependency from backend container

---

## PHASE 5 — Cleanup

- [ ] Remove `legacy/python_scripts/` once all scripts verified in Python service
- [ ] Update `docs/migration/IMPLEMENTATION_STATUS.md`
- [ ] Add CI step: run `test_csv_integrity.py` on CSV changes

