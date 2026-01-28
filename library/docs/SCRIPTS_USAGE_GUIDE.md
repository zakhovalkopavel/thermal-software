# Scripts Usage Guide

**Database Processing and Enrichment Scripts**

---

## Overview

This guide explains how to use the Python scripts for processing and enriching the thermophysical database.

---

## Main Scripts

### 1. thermophysical_data_processor.py
**Purpose:** Extract and process data from NBS Tables Library Excel file

**Location:** `python_scripts/thermophysical_data_processor.py`

**What it does:**
- Extracts thermodynamic properties from NBS Tables
- Identifies cations and anion families
- Separates anhydrous and hydrated compounds
- Preserves all compound variants (polymorphs)
- Marks default modifications

**Usage:**
```bash
cd python_scripts
python3 thermophysical_data_processor.py
```

**Output:**
- `library/processed_data/thermophysical_comprehensive_anhydrous_YYYYMMDD.csv`
- `library/processed_data/thermophysical_comprehensive_hydrates_YYYYMMDD.csv`

---

### 2. add_new_families.py
**Purpose:** Add new anion or cation families to the database

**Location:** `python_scripts/add_new_families.py`

**What it does:**
- Identifies compounds from manual_data_entry.csv
- Fetches PubChem data for new compounds
- Merges all data sources
- Updates final database files

**Configuration files:**
- `library/resources/anion_families.txt` - Anion patterns
- `library/resources/cations.txt` - Cation list

**Usage:**
```bash
# Add new anion families
python3 python_scripts/add_new_families.py --anions nitrate nitrite bromide iodide

# Add new cations
python3 python_scripts/add_new_families.py --cations Ag Pb Hg

# Add both
python3 python_scripts/add_new_families.py --anions arsenate --cations Mo

# Skip PubChem fetch (testing)
python3 python_scripts/add_new_families.py --anions nitrate --skip-pubchem
```

**Output:**
- Updates `library/processed_data/thermophysical_anhydrous.csv`
- Updates `library/processed_data/thermophysical_hydrates.csv`
- Updates `library/resources/data_sources/PubChem_bulk_fetch_*.csv`

---

### 3. bulk_pubchem_fetcher.py
**Purpose:** Fetch data from PubChem API for multiple compounds

**Location:** `python_scripts/bulk_pubchem_fetcher.py`

**What it does:**
- Searches PubChem by formula
- Extracts experimental properties
- Gets CAS numbers, color, solubility, stability
- Handles rate limiting (2 req/sec)

**Usage:**
```python
from bulk_pubchem_fetcher import BulkPubChemFetcher

fetcher = BulkPubChemFetcher(delay=0.5, timeout=20)
results = fetcher.bulk_fetch(
    formulas=['NaCl', 'KCl', 'CaCO3'],
    output_file='output.csv'
)
```

**Note:** Usually called automatically by `add_new_families.py`

---

### 4. complete_merge_check.py
**Purpose:** Verify and fix data merge completeness

**Location:** `python_scripts/complete_merge_check.py`

**What it does:**
- Checks thermophysical database against all sources
- Identifies gaps in data coverage
- Fills missing values from manual_data_entry.csv
- Fills missing values from PubChem data

**Usage:**
```bash
python3 python_scripts/complete_merge_check.py
```

**Output:**
- Updates database files with filled gaps
- Prints coverage statistics

---

### 5. enrich_database.py
**Purpose:** Enrich database with manual data from CRC Handbook

**Location:** `python_scripts/enrich_database.py`

**What it does:**
- Merges manual_data_entry.csv data into thermophysical database
- Fills missing CAS numbers, temperatures, densities
- Updates source tracking

**Usage:**
```bash
python3 python_scripts/enrich_database.py --source manual \
    --anhydrous library/processed_data/thermophysical_comprehensive_anhydrous_YYYYMMDD.csv \
    --hydrates library/processed_data/thermophysical_comprehensive_hydrates_YYYYMMDD.csv
```

**Output:**
- `*_enriched_manual.csv` files with merged data

---

### 6. manual_enrichment.py
**Purpose:** Interactive manual data entry and enrichment

**Location:** `python_scripts/manual_enrichment.py`

**What it does:**
- Provides interface for adding manual data
- Validates data before adding
- Updates manual_data_entry.csv

**Usage:**
```bash
python3 python_scripts/manual_enrichment.py
```

---

### 7. run_processor.py
**Purpose:** Wrapper script to run thermophysical_data_processor.py

**Location:** `python_scripts/run_processor.py`

**What it does:**
- Executes the NBS Tables processor
- Logs output

**Usage:**
```bash
python3 python_scripts/run_processor.py
```

---

### 8. clean_pubchem_data.py
**Purpose:** Clean and validate PubChem bulk fetch data

**Location:** `python_scripts/clean_pubchem_data.py`

**What it does:**
- Removes empty rows from PubChem data
- Validates data integrity
- Removes duplicates

**Usage:**
```bash
python3 python_scripts/clean_pubchem_data.py
```

**Output:**
- Cleaned PubChem_bulk_fetch_*.csv file

---

### 9. merge_pubchem_data.py
**Purpose:** Merge PubChem data into thermophysical database

**Location:** `python_scripts/merge_pubchem_data.py`

**What it does:**
- Merges PubChem experimental data
- Adds color, solubility, stability columns
- Updates CAS numbers and temperatures

**Usage:**
```bash
python3 python_scripts/merge_pubchem_data.py
```

---

## Data Flow

```
NBS Tables (Excel)
    ↓
thermophysical_data_processor.py
    ↓
thermophysical_comprehensive_anhydrous/hydrates_YYYYMMDD.csv
    ↓
manual_data_entry.csv (CRC Handbook) → add_new_families.py ← PubChem API
    ↓
thermophysical_anhydrous.csv (FINAL)
thermophysical_hydrates.csv (FINAL)
```

---

## Adding New Compound Families

**Step 1:** Update configuration files
```bash
# Edit anion patterns
nano library/resources/anion_families.txt

# Edit cation list
nano library/resources/cations.txt
```

**Step 2:** Add manual data (if available)
```bash
# Add data from CRC Handbook to:
nano library/resources/data_sources/manual_data_entry.csv
```

**Step 3:** Run the script
```bash
python3 python_scripts/add_new_families.py --anions [your_anion] --cations [your_cation]
```

**Step 4:** Verify results
```bash
# Check compound count
wc -l library/processed_data/thermophysical_anhydrous.csv

# Verify data merge
python3 python_scripts/complete_merge_check.py
```

---

## Configuration Files

### library/resources/anion_families.txt
Format: `pattern TAB anion_name TAB priority`

Example:
```
NO3	nitrate	1
Br	bromide	80
```

### library/resources/cations.txt
Format: `symbol TAB name TAB category`

Example:
```
Na	Sodium	alkali_metal
Ag	Silver	transition_metal
```

### library/resources/data_sources/manual_data_entry.csv
Format: Standard CSV with columns matching database structure

Required columns: `formula, CAS, Tm_C, Tb_C, Td_C, density_g_per_cm3, Hfus_kJ_per_mol, Hvap_kJ_per_mol, source, notes`

---

## Output Files

### Final Database Files
- `library/processed_data/thermophysical_anhydrous.csv` (PRODUCTION)
- `library/processed_data/thermophysical_hydrates.csv` (PRODUCTION)

### Source Data Files
- `library/resources/data_sources/manual_data_entry.csv`
- `library/resources/data_sources/PubChem_bulk_fetch_*.csv`

### Configuration Files
- `library/resources/processor_config.txt`
- `library/resources/compound_names.csv`
- `library/resources/anion_families.txt`
- `library/resources/cations.txt`

---

## Common Tasks

### Update Database with New Data
```bash
# 1. Add manual data to manual_data_entry.csv
# 2. Run merge check
python3 python_scripts/complete_merge_check.py
```

### Add New Compound Families
```bash
# 1. Update config files (anion_families.txt, cations.txt)
# 2. Add manual data (if available)
# 3. Run script
python3 python_scripts/add_new_families.py --anions [families]
```

### Reprocess from NBS Tables
```bash
cd python_scripts
python3 thermophysical_data_processor.py
```

---

## Dependencies

**Required:**
- pandas
- numpy
- openpyxl
- requests (for PubChem)

**Install:**
```bash
pip install pandas numpy openpyxl requests
```

---

## Troubleshooting

### PubChem Rate Limiting
If you get banned: increase delay in script
```python
fetcher = BulkPubChemFetcher(delay=1.0)  # Slower but safer
```

### Missing Data
Run merge check to identify and fill gaps:
```bash
python3 python_scripts/complete_merge_check.py
```

### Configuration Issues
Verify config files are properly formatted:
- Tab-separated values in anion_families.txt
- Tab-separated values in cations.txt
- Valid CSV format in manual_data_entry.csv

---

## Helper Scripts

### fetch_pubchem_data.py
Single compound PubChem fetcher (for testing)

### simple_pubchem_fetcher.py
Simplified PubChem fetcher (legacy)

### enhanced_pubchem_fetcher.py
Enhanced PubChem fetcher with additional features (legacy)

### debug_enrichment.py
Debug tool for data enrichment issues

### extract_experimental_properties.py
Extract experimental properties from PubChem (legacy)

### create_manual_csv.py
Helper to create manual_data_entry.csv template

---


**Last Updated:** January 28, 2026

