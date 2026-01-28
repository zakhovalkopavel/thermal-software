# Tests Directory

## Test Files

### test_pubchem_fetch_10.py
Test PubChem fetcher with 10 compounds to verify:
- Only compounds found in PubChem are added to results
- Compounds not found are skipped (not added with empty data)
- Color, solubility, stability are in separate columns
- Proper error handling

**Usage:**
```bash
cd /opt/thermal-software/tests
python3 test_pubchem_fetch_10.py
```

**Output:** `test_results/PubChem_test_YYYYMMDD_HHMMSS.csv`

### Other Test Files

Move all test scripts here following the `test_*.py` naming convention.

## Test Results

Test output files are stored in `test_results/` subdirectory and are not committed to git.

