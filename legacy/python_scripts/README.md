# Python Scripts

Data processing and enrichment scripts for thermophysical database.

---

## 📄 Scripts

### thermophysical_data_processor.py
Extract and process data from NBS Tables Library Excel file.

**Usage:** `python3 thermophysical_data_processor.py`

### add_new_families.py
Add new anion or cation families to the database.

**Usage:** `python3 add_new_families.py --anions nitrate --cations Ag`

### bulk_pubchem_fetcher.py
Fetch experimental data from PubChem API.

### complete_merge_check.py
Verify and fill data gaps from all sources.

**Usage:** `python3 complete_merge_check.py`

---

## 📖 Complete Documentation

For detailed usage, configuration, and workflows, see:

**→ [../library/docs/SCRIPTS_USAGE_GUIDE.md](../library/docs/SCRIPTS_USAGE_GUIDE.md)**

Additional resources:
- [Database Specification](../library/docs/THERMOPHYSICAL_DATA_SPEC.md)
- [Data Dictionary](../library/docs/DATA_DICTIONARY.md)
- [Quick Start Guide](../library/docs/QUICK_START.md)

---

## Dependencies

```bash
pip install pandas numpy openpyxl requests
```

---

*See SCRIPTS_USAGE_GUIDE.md for complete instructions*


