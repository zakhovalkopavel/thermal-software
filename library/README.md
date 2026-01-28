# Thermophysical Database Library

## Structure

```
library/
├── docs/                      # Documentation
│   ├── README.md              # This file
│   ├── THERMOPHYSICAL_DATA_SPEC.md
│   ├── COMPREHENSIVE_DATABASE_GUIDE.md
│   ├── QUICK_START.md
│   ├── QUICK_REFERENCE.md
│   ├── PUBCHEM_API_GUIDE.md
│   ├── BULK_FETCH_GUIDE.md
│   └── THERMOPHYSICAL_DATA_NOTES.md
│
├── processed_data/          # Final database files
│   ├── thermophysical_anhydrous.csv  # Anhydrous compounds
│   └── thermophysical_hydrates.csv   # Hydrated compounds
│
└── resources/
    └── data_sources/          # Source data files
        ├── manual_data_entry.csv
        └── PubChem_bulk_fetch_*.csv
```

## Data Files

### Final Database (processed_data/)

**Current Database:** January 28, 2026
- **thermophysical_anhydrous.csv** - 821 anhydrous compounds
- **thermophysical_hydrates.csv** - 274 hydrated compounds
- **Total: 1,095 compounds**

**Anion Families Included:**
- Oxides, Chlorides, Fluorides, Bromides, Iodides
- Sulfates, Sulfites, Carbonates
- Phosphates, Borates
- Nitrates, Nitrites
- Nitrides, Carbides, Borides

### Source Data (resources/data_sources/)

- **manual_data_entry.csv** - Manually entered data from CRC Handbook 97th Ed
- **PubChem_bulk_fetch_20260128_041155.csv** - 158 compounds with PubChem data (color, solubility, stability)

## Database Columns

### Identity
- `formula` - Chemical formula
- `compound_type` - anion_family, cation, or hydroxide
- `anion_family` - For salts (e.g., chloride, sulfate)
- `cation` - For salts (e.g., sodium, calcium)

### Numerical Properties
- `CAS` - CAS Registry Number
- `Tm_C`, `Tm_K` - Melting point (°C, K)
- `Tb_C`, `Tb_K` - Boiling point (°C, K)
- `Td_C` - Decomposition temperature (°C)
- `density_g_per_cm3` - Density at 20°C (g/cm³)
- `Hfus_kJ_per_mol` - Heat of fusion (kJ/mol)
- `Hvap_kJ_per_mol` - Heat of vaporization (kJ/mol)
- `thermal_conductivity_W_per_mK` - Thermal conductivity (W/m·K)
- `hardness_Mohs` - Mohs hardness
- `flash_point_C` - Flash point (°C)
- `vapor_pressure_mmHg` - Vapor pressure (mmHg)

### Text Properties (Separate Columns)
- `color` - Physical appearance/color
- `solubility` - Solubility in various solvents
- `stability` - Stability conditions
- `odor` - Odor/smell description
- `toxicity_hazard` - Safety and toxicity information

### Metadata
- `source_physical_properties` - Data source
- `nbs_table` - NBS table reference (if applicable)

## Usage

### Load Database
```python
import pandas as pd

# Load anhydrous compounds
df_anh = pd.read_csv('library/processed_data/thermophysical_anhydrous.csv')

# Load hydrates
df_hyd = pd.read_csv('library/processed_data/thermophysical_hydrates.csv')
```

### Query Examples
```python
# Find all chlorides
chlorides = df_anh[df_anh['anion_family'] == 'chloride']

# Find compounds with high melting points
high_mp = df_anh[df_anh['Tm_C'] > 1000]

# Find compounds with known density
with_density = df_anh[df_anh['density_g_per_cm3'].notna()]
```

## Documentation

- **THERMOPHYSICAL_DATA_SPEC.md** - Detailed data structure specification
- **COMPREHENSIVE_DATABASE_GUIDE.md** - Complete usage guide
- **QUICK_START.md** - Get started quickly
- **PUBCHEM_API_GUIDE.md** - Fetch data from PubChem
- **BULK_FETCH_GUIDE.md** - Bulk data fetching operations

## Data Sources

1. **NBS Tables of Chemical Thermodynamic Properties**
2. **Manual Literature Data** (CRC Handbook, NIST Chemistry WebBook)
3. **PubChem** (CAS, physical properties, experimental data)

## Maintenance

### Verify System Status
```bash
cd library
./verify.sh
```

This checks:
- Documentation structure
- Test files organization
- Data file structure
- PubChem fetcher configuration
- Separate column implementation

### Update Database
```bash
cd python_scripts
python3 thermophysical_data_processor.py
```

### Enrich with PubChem Data
```bash
cd python_scripts
python3 bulk_pubchem_fetcher.py
```

### Add Manual Data
Edit `library/resources/data_sources/manual_data_entry.csv` and run enrichment.

## Data Quality

- ✅ All formulas validated
- ✅ Anion families systematically classified
- ✅ Cations systematically classified
- ✅ Source tracking for all data
- ✅ Separate columns for text properties
- ✅ No mixing of color/odor/solubility/stability

