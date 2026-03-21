# CH02 — Python Migration

**Source:** `legacy/python_scripts/`  
**Target:** `python/src/thermophysical/`

## Scripts inventory

| Script | Purpose | Migrate? |
|---|---|---|
| `thermophysical_data_processor.py` | Main processor — combines sources, validates, outputs CSV | ✅ Core |
| `bulk_pubchem_fetcher.py` | Bulk fetch from PubChem REST API | ✅ Core |
| `enhanced_pubchem_fetcher.py` | Extended fetch with additional properties | ✅ Core |
| `clean_pubchem_data.py` | Normalise and deduplicate raw PubChem output | ✅ Core |
| `merge_pubchem_data.py` | Merge multiple fetch runs | ✅ Core |
| `enrich_database.py` | Add missing properties to existing records | ✅ Core |
| `manual_enrichment.py` | Apply manual corrections from CSV | ✅ Core |
| `create_manual_csv.py` | Generate manual data entry template | ✅ Helper |
| `add_new_families.py` | Add new anion family groups | ✅ Core |
| `extract_experimental_properties.py` | Parse CRC Handbook formatted text | ✅ Core |
| `run_processor.py` | Entry point orchestrator | ✅ Core |
| `fetch_pubchem_data.py` | Simple single-compound fetcher | ⚠️ Superseded by bulk |
| `simple_pubchem_fetcher.py` | Earlier prototype | ⚠️ Superseded |
| `complete_merge_check.py` | One-off validation | ⚠️ Review — may be test |
| `debug_enrichment.py` | Debug utility | ⚠️ Dev tool only |

## Target structure in Python service

```
python/src/thermophysical/
├── __init__.py
├── processor.py              (from thermophysical_data_processor.py)
├── pubchem_fetcher.py        (merged bulk + enhanced fetchers)
├── cleaner.py                (from clean_pubchem_data.py)
├── merger.py                 (from merge_pubchem_data.py)
├── enricher.py               (from enrich_database.py + manual_enrichment.py)
├── family_manager.py         (from add_new_families.py)
├── experimental_extractor.py (from extract_experimental_properties.py)
└── run.py                    (from run_processor.py — CLI entry point)
```

## API endpoints (FastAPI in Python service)

```
POST /thermophysical/fetch        — trigger PubChem fetch for a list of formulas
POST /thermophysical/enrich       — enrich existing records
GET  /thermophysical/compounds    — query compounds (filter by anion, cation, formula)
GET  /thermophysical/compound/:formula  — single compound lookup
POST /thermophysical/export       — regenerate and export CSV
```

## Data directory mapping

| Legacy path | New path |
|---|---|
| `legacy/python_scripts/data_enrichment/` | `python/src/thermophysical/data/` |
| `legacy/library/processed_data/*.csv` | `shared/processed/*.csv` (already copied) |
| `legacy/library/resources/data_sources/` | `shared/sources/` (already in `shared/`) |

## Dependencies (add to `python/pyproject.toml`)

```toml
requests = ">=2.31"
pandas = ">=2.0"
numpy = ">=1.26"
fastapi = ">=0.110"
uvicorn = ">=0.29"
```

