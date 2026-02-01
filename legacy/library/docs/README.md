# Thermophysical Database - Documentation

**Version:** 2.0  
**Last Updated:** January 28, 2026

---

## Documentation Files

### 📋 Essential Documentation

1. **THERMOPHYSICAL_DATA_SPEC.md** - Complete database specification
   - Data model and structure
   - Column definitions
   - Data sources and quality

2. **DATA_DICTIONARY.md** - Column-by-column reference
   - All 55 columns documented
   - Data types and units
   - Usage examples

3. **SCRIPTS_USAGE_GUIDE.md** - How to use processing scripts
   - thermophysical_data_processor.py
   - add_new_families.py
   - complete_merge_check.py
   - Configuration and workflow

4. **QUICK_START.md** - Getting started guide
   - Loading data
   - Basic queries
   - Common operations

5. **README.md** - This file

---

## Quick Links

### For Users
- **Start here:** QUICK_START.md
- **Find column info:** DATA_DICTIONARY.md
- **Understand the data:** THERMOPHYSICAL_DATA_SPEC.md

### For Developers
- **Process data:** SCRIPTS_USAGE_GUIDE.md
- **Add new families:** SCRIPTS_USAGE_GUIDE.md
- **Technical spec:** THERMOPHYSICAL_DATA_SPEC.md

---

## Database Overview

**Current Database (v2.0):**
- Total Compounds: 1,095
- Anhydrous: 821
- Hydrates: 274
- Anion Families: 14
- Data Columns: 55

**Anion Families:**
- Oxides, Chlorides, Fluorides, Bromides, Iodides
- Sulfates, Sulfites, Carbonates
- Phosphates, Borates
- Nitrates, Nitrites
- Nitrides, Carbides, Borides

**Data Sources:**
- NBS Tables (thermodynamic properties)
- CRC Handbook 97th Ed (physical properties)
- PubChem API (experimental data, color, solubility, stability)

---

## File Locations

### Database Files
```
library/processed_data/
├── thermophysical_anhydrous.csv    # 821 compounds (PRODUCTION)
└── thermophysical_hydrates.csv     # 274 compounds (PRODUCTION)
```

### Source Data
```
library/resources/data_sources/
├── manual_data_entry.csv           # Manual CRC Handbook data
└── PubChem_bulk_fetch_*.csv        # PubChem experimental data
```

### Configuration
```
library/resources/
├── processor_config.txt            # Processor configuration
├── compound_names.csv              # Compound name mapping
├── anion_families.txt              # Anion pattern definitions
└── cations.txt                     # Cation list
```

---

## Getting Started

### 1. Load the Database
```python
import pandas as pd

df_anh = pd.read_csv('library/processed_data/thermophysical_anhydrous.csv')
df_hyd = pd.read_csv('library/processed_data/thermophysical_hydrates.csv')
```

### 2. Explore the Data
See **QUICK_START.md** for examples

### 3. Understand the Columns
See **DATA_DICTIONARY.md** for complete reference

### 4. Process or Extend Data
See **SCRIPTS_USAGE_GUIDE.md** for workflow

---

## Support

- Questions about data: See DATA_DICTIONARY.md
- Questions about scripts: See SCRIPTS_USAGE_GUIDE.md
- Technical details: See THERMOPHYSICAL_DATA_SPEC.md

---

**Maintained By:** Thermal Software Project  
**License:** Research and educational use

