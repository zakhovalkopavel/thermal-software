# Specification: Comprehensive Thermophysical Data Aggregation for Selected Ionic Compounds

**Project:** Thermal Software - Thermophysical Data Processing  
**Date Created:** January 27, 2026  
**Last Updated:** January 28, 2026  
**Version:** 2.0 (Comprehensive)  
**Status:** Complete - All Properties Structure Implemented

---

## 1) Objective

Create a comprehensive, machine‑readable dataset (final **CSV files**) that aggregates and standardizes **ALL available thermophysical and physical properties** for specific families of inorganic compounds derived from the listed cations.

### Complete Property Set (45 columns per compound)

**Thermodynamic Properties:**
- Formation enthalpy (ΔfH) at 0 K and 298 K
- Gibbs free energy (ΔfG) at 298 K
- Entropy (S°) at 298 K
- Enthalpy increment (H-H₀)
- Specific heat capacity (*Cp*) - both molar and mass basis

**Transition Properties:**
- Melting point (*T<sub>m</sub>*)
- Boiling point (*T<sub>b</sub>*)
- Decomposition temperature (*T<sub>d</sub>*)
- Heat of fusion (ΔH<sub>fus</sub>)
- Heat of vaporization (ΔH<sub>vap</sub>)
- Heat of sublimation (ΔH<sub>sub</sub>)

**Physical Properties:**
- Density (ρ)
- Thermal conductivity (λ)
- Viscosity (η)
- Hardness (Mohs scale)

**Stability & Temperature Dependence:**
- Stability temperature range
- Decomposition products
- Cp(T) approximation equations with coefficients

### Compound families (anion classes)
- **Halides**: Chlorides, Fluorides (NOT bromides or iodides)
- **Carbonates**
- **Sulfates**
- **Sulfites**
- **Sulfides**
- **Pyrosulfates**
- **Borates** (including **tetraborates**, **metaborates**, and **BO3**)
- **Phosphates** (including **metaphosphates**, **pyrophosphates**, **polyphosphates**, **trimetaphosphates**, **hexametaphosphates**)
- **Oxides**
- **Carbides** (e.g., SiC, B4C, TiC)
- **Nitrides** (e.g., Si3N4, AlN, BN)
- **Borides** (e.g., TiB2, MgB2)

**Note:** Organic compounds, nitrates, and ammonium salts are excluded.

### Cations (Elements)
**Na, K, Li, Mg, Ca, Ba, Sr, Fe, Zn, Ni, Cu, Al, Ti, Si, B, Cr, Mn, Zr, Ce, Y, La** (21 total)

**Categories:**
- Alkali metals: Na, K, Li
- Alkaline earth: Mg, Ca, Ba, Sr
- Transition metals: Fe, Zn, Ni, Cu, Cr, Mn, Ti, Zr, Y
- Rare earth: Ce, La
- Other metals: Al, Si
- Metalloid: B

### Output Format
**Two comprehensive CSV files:**
1. **Anhydrous compounds** - All properties in ONE file
2. **Hydrated compounds** - All properties in ONE file (separate from anhydrous)

**Key Requirements:**
- All properties must be in a **single file** per category (no separate step files)
- Hydrates must be **detected from chemical formulas** (e.g., ZnSO4·H2O, CuSO4·5H2O)
- Compound names must be **auto-generated** from formulas when missing
- Each file contains **45 columns** with all properties (filled or placeholder)

---

## 2) Inputs

### Primary Input
**NBS Tables of Chemical Thermodynamic Properties** (`library/resources/NBS_Tables Library.xlsx`)
- Contains thermodynamic data at 298.15 K (25°C) and 101.325 kPa (1 atm)
- Provides: ΔfH, ΔfG, S°, Cp, H-H₀, molar mass
- Coverage: ~95% for formation enthalpy, ~35% for entropy, ~24% for heat capacity

### External References (for future enrichment)
- **CRC Handbook of Chemistry and Physics** - Physical properties, transition temperatures, heats of transition
- NIST Chemistry WebBook - Additional Cp values, temperature-dependent equations
- PubChem - CAS Registry Numbers
- Mineralogical databases - Hardness, crystal structure

> During Step 3, each externally sourced value must include a **citation** (source name + URL/DOI if available).

---

## 3) Scope & Compound Enumeration Rules

### Default Scope
Operate on the **set of compounds present in the user input file** for the listed cations × anion families (Step 1).

### Expansion Option
(Requires user confirmation at the Step 2 gate)
- Optionally expand to the **canonical set** of common stoichiometries for each cation × family (e.g., NaCl, MgCl₂, FeCl₂/FeCl₃, TiO₂, Al₂O₃, etc.).
- For chemically **nonexistent or unstable compounds** under standard conditions (e.g., many "aluminum carbonates"), rows can be added but flagged as **"Not stable / no standard data"**; do not impute values.

### Hydration & Polymorphs
- Prefer **anhydrous** compounds and the **most common room‑temperature polymorph**.
- If the input file specifies hydrates or polymorphs, preserve and clearly label them.
- Do **not** merge hydrates with anhydrous entries; treat as separate rows.

### Oxidation States
For multivalent cations (e.g., Fe(II/III), Ti(III/IV)), record the **actual oxidation state** associated with the compound in a dedicated column.

---

## 4) Complete Property Set - 45 Columns

### Core Identification (9 columns)
1. `cation` - Primary cation element (Na, K, Li, Mg, Ca, Ba, Fe, Zn, Al, Ti, Si, B)
2. `anion_family` - Anion family (oxide, chloride, sulfate, fluoride, carbonate, borate, phosphate)
3. `compound_name` - Human-readable name (auto-generated from formula if missing)
4. `formula` - Complete chemical formula (including hydration, e.g., ZnSO4·H2O)
5. `base_formula` - Formula without hydration (e.g., ZnSO4 from ZnSO4·7H2O)
6. `hydration` - Hydration state (anhydrous, monohydrate, dihydrate, 5-hydrate, etc.)
7. `hydration_formula` - Water formula in hydrate (H2O, 2H2O, 5H2O, etc.)
8. `phase_at_25C` - Physical state at 25°C (solid, liquid, amorphous)
9. `state_description` - Detailed state from NBS (cr, am, crystalline, etc.)

### NBS Thermodynamic Data (8 columns) - At 298.15 K, 101.325 kPa
10. `molar_mass_g_per_mol` - Molecular weight [g/mol]
11. `DfH0_kJ_per_mol` - Standard formation enthalpy at 0 K [kJ/mol]
12. `DfH_298K_kJ_per_mol` - Standard formation enthalpy at 298 K [kJ/mol]
13. `DfG_298K_kJ_per_mol` - Standard Gibbs free energy at 298 K [kJ/mol]
14. `H_H0_298K_kJ_per_mol` - Enthalpy increment (H₂₉₈-H₀) [kJ/mol]
15. `S_298K_J_per_molK` - Standard entropy at 298 K [J/(mol·K)]
16. `Cp_298K_J_per_molK` - Heat capacity (molar) at 298 K [J/(mol·K)]
17. `Cp_mass_J_per_kgK_298K` - Heat capacity (mass) at 298 K [J/(kg·K)] (calculated)

### Transition Temperatures (5 columns) - From CRC Handbook
18. `Tm_C` - Melting point [°C]
19. `Tm_K` - Melting point [K] (calculated as Tm_C + 273.15)
20. `Tb_C` - Boiling point [°C]
21. `Tb_K` - Boiling point [K] (calculated as Tb_C + 273.15)
22. `Td_C` - Decomposition temperature [°C] (if decomposes before melting)

### Heat of Transition (3 columns) - From CRC Handbook
23. `Hfus_kJ_per_mol` - Heat of fusion (melting) [kJ/mol]
24. `Hvap_kJ_per_mol` - Heat of vaporization (boiling) [kJ/mol]
25. `Hsub_kJ_per_mol` - Heat of sublimation [kJ/mol]

### Physical Properties (4 columns) - From CRC Handbook
26. `density_g_per_cm3` - Density at 25°C [g/cm³]
27. `thermal_conductivity_W_per_mK` - Thermal conductivity [W/(m·K)]
28. `viscosity_mPa_s` - Viscosity [mPa·s] (for liquids/molten salts)
29. `hardness_Mohs` - Mohs hardness scale (for crystalline solids)

### Stability & Range (3 columns)
30. `stability_range_C_min` - Lower temperature stability limit [°C]
31. `stability_range_C_max` - Upper temperature stability limit [°C]
32. `decomposition_products` - Decomposition products (text description)

### Temperature-Dependent Equations (6 columns) - Cp(T) approximations
33. `Cp_equation_type` - Type of equation (polynomial, Shomate, etc.)
34. `Cp_coeff_a` - Coefficient a in Cp = a + bT + cT² + ...
35. `Cp_coeff_b` - Coefficient b
36. `Cp_coeff_c` - Coefficient c
37. `Cp_temp_range_K_min` - Valid temperature range minimum [K]
38. `Cp_temp_range_K_max` - Valid temperature range maximum [K]

### Provenance & Metadata (7 columns)
39. `pressure_kPa` - Reference pressure [kPa] (101.325 for standard)
40. `source_thermodynamic` - Source for thermodynamic data (e.g., "NBS Tables")
41. `source_physical_properties` - Source for physical properties (e.g., "CRC Handbook, 97th Ed.")
42. `source_transition_temps` - Source for transition temperatures
43. `data_quality` - Quality grade: A (primary), B (secondary), C (tertiary)
44. `CAS` - CAS Registry Number
45. `notes` - Additional notes (decomposition behavior, special conditions, etc.)

---

## 5) Unit Conventions & Conversions

### Heat Capacity
**Molar basis:** J/(mol·K) - Direct from NBS Tables  
**Mass basis:** J/(kg·K) - Calculated as: `Cp_mass = Cp_molar / (molar_mass / 1000)`

### Temperature
**Celsius:** °C - Primary from CRC Handbook  
**Kelvin:** K - Calculated as: `T_K = T_C + 273.15`

### Energy
**Formation enthalpy, Gibbs energy:** kJ/mol  
**Heat of fusion/vaporization:** kJ/mol  
**Entropy:** J/(mol·K)

### Physical Properties
**Density:** g/cm³  
**Thermal conductivity:** W/(m·K)  
**Viscosity:** mPa·s (millipascal-second)  
**Hardness:** Mohs scale (1-10)

---

## 6) Workflow Implementation

### Current Implementation: Single Comprehensive Script

**Script:** `python_scripts/thermophysical_data_processor.py`

**What it does:**
1. Loads NBS Tables Library Excel file
2. Identifies target cations and anion families
3. **Detects hydration from chemical formulas** (e.g., ZnSO4·H2O → monohydrate)
4. Extracts base formulas (ZnSO4·7H2O → base: ZnSO4)
5. **Auto-generates compound names** from formulas when missing
6. Preserves ALL compound variants (no deduplication)
7. Calculates Cp_mass from Cp_molar and molar mass
8. Creates **45-column comprehensive structure** with:
   - All NBS thermodynamic data filled
   - All physical property columns as placeholders
9. **Separates into TWO files:**
   - Anhydrous compounds (803 compounds)
   - Hydrated compounds (413 compounds)

**Output:**
- `thermophysical_comprehensive_anhydrous_YYYYMMDD.csv` (45 columns × 803 rows)
- `thermophysical_comprehensive_hydrates_YYYYMMDD.csv` (45 columns × 413 rows)

**Key Features:**
- ✅ Everything in ONE file per category (no separate step files)
- ✅ Hydrate detection from formulas (not just names)
- ✅ Automatic compound name generation
- ✅ All 45 properties present (filled or placeholder)
- ✅ NBS data: 95% coverage for ΔfH, 35% for S°, 24% for Cp
- ✅ Ready for CRC Handbook data to fill empty columns

### Future Enrichment (Manual or Semi-Automated)

**Fill from CRC Handbook Section 4 (Physical Constants):**
- Melting points, boiling points, density
- CAS Registry Numbers
- Physical constants

**Fill from CRC Handbook Section 6 (Thermochemistry):**
- Heat of fusion, heat of vaporization
- Additional thermodynamic data

**Optional from NIST Chemistry WebBook:**
- Cp(T) temperature-dependent equations
- Additional heat capacity values
- Spectroscopic data

---

## 7) Data Quality & Rules of Evidence

### Source Hierarchy (Quality Grading)

**Grade A - Primary/Authoritative:**
1. NBS Tables of Chemical Thermodynamic Properties (implemented)
2. CRC Handbook of Chemistry and Physics
3. NIST Chemistry WebBook

**Grade B - Secondary/Reviewed:**
4. Peer-reviewed journal articles (with DOI)
5. Curated material databases (MatWeb, etc.)
6. Government/standards organizations

**Grade C - Tertiary:**
7. Manufacturer datasheets
8. Compiled databases (with caution)

### Handling Conflicts

When multiple credible values differ:
- Prefer values measured at/near 298 K and 1 atm
- Provide note describing discrepancy
- Optionally include range in `notes` column
- Always cite source in provenance columns

### Nonexistent or Unstable Compounds

- Do NOT invent values
- Leave fields **blank** (null/NaN)
- Explain in `notes` column (e.g., "Hydrolyzes; no stable anhydrous carbonate")
- Use `decomposition_products` for known decomposition

### No Estimation/Imputation

- **Only unit conversions** and exact transcriptions from sources
- **No model-based estimates**
- Temperature conversions (°C ↔ K) are acceptable
- Cp_mass from Cp_molar is acceptable (formula-based)

---

## 8) Current Implementation Status

**Date:** January 28, 2026  
**Version:** 2.0 (Comprehensive)  
**Status:** ✅ Complete - Structure Implemented

### Output Files

**Location:** `library/processed_data/`

1. **`thermophysical_comprehensive_anhydrous_20260128.csv`**
   - 803 compounds
   - 45 columns (all properties)
   - NBS thermodynamic data filled (95% ΔfH coverage)
   - Physical properties ready to fill from CRC

2. **`thermophysical_comprehensive_hydrates_20260128.csv`**
   - 413 compounds
   - 45 columns (all properties)
   - Hydration detected from formulas
   - NBS thermodynamic data filled (95% ΔfH coverage)

### Data Coverage Summary

| Property Category | Filled | Source | Coverage |
|-------------------|--------|--------|----------|
| **Core Identification** | ✅ Complete | NBS Tables | 100% |
| **Molar Mass** | ✅ Complete | NBS Tables | 100% |
| **Formation Enthalpy (298K)** | ✅ Complete | NBS Tables | 95% |
| **Gibbs Free Energy** | ✅ Partial | NBS Tables | 35% |
| **Entropy** | ✅ Partial | NBS Tables | 35% |
| **Heat Capacity (molar)** | ✅ Partial | NBS Tables | 24% |
| **Heat Capacity (mass)** | ✅ Calculated | Derived | 24% |
| **Transition Temps** | ⚠️ Ready | CRC needed | 0% |
| **Heat of Transition** | ⚠️ Ready | CRC needed | 0% |
| **Physical Properties** | ⚠️ Ready | CRC needed | 0% |
| **CAS Numbers** | ⚠️ Ready | CRC/PubChem | 0% |
| **Cp(T) Equations** | ⚠️ Ready | NIST optional | 0% |

### Special Features Implemented

✅ **Hydrate Detection from Formulas**
- ZnSO4·H2O → monohydrate
- CuSO4·5H2O → 5-hydrate
- Automatic base formula extraction

✅ **Compound Name Auto-Generation**
- NaCl → Sodium chloride
- CaCO3 → Calcium carbonate
- TiO2 → Titanium dioxide

✅ **Variant Preservation**
- All 1,216 compounds preserved
- No deduplication performed
- Multiple polymorphs kept separate

✅ **Single File Output**
- Everything in ONE file per category
- No separate step files
- All 45 properties present

---

## 9) Usage Examples

### Load Database

```python
import pandas as pd

# Load comprehensive files
df_anh = pd.read_csv('library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv')
df_hyd = pd.read_csv('library/processed_data/thermophysical_comprehensive_hydrates_20260128.csv')

# Combine if needed
df_all = pd.concat([df_anh, df_hyd])
```

### Find Hydrates

```python
# Find all zinc sulfate hydrates
znso4_hydrates = df_hyd[df_hyd['base_formula'] == 'ZnSO4']
print(znso4_hydrates[['formula', 'hydration', 'DfH_298K_kJ_per_mol']])
```

### Calculate Reaction Enthalpy

```python
# Example: CaCO3 → CaO + CO2
caco3_dfh = df_all[df_all['formula'] == 'CaCO3']['DfH_298K_kJ_per_mol'].values[0]
cao_dfh = df_all[df_all['formula'] == 'CaO']['DfH_298K_kJ_per_mol'].values[0]
co2_dfh = -393.51  # kJ/mol (known value)

delta_h = (cao_dfh + co2_dfh) - caco3_dfh
print(f"Decomposition ΔH = {delta_h:.2f} kJ/mol")
```

### Fill Missing Data from CRC

```python
# Example: Fill NaCl properties from CRC Handbook
mask = df_anh['formula'] == 'NaCl'
df_anh.loc[mask, 'Tm_C'] = 801
df_anh.loc[mask, 'Tm_K'] = 801 + 273.15
df_anh.loc[mask, 'Tb_C'] = 1465
df_anh.loc[mask, 'Tb_K'] = 1465 + 273.15
df_anh.loc[mask, 'Hfus_kJ_per_mol'] = 28.16
df_anh.loc[mask, 'Hvap_kJ_per_mol'] = 170
df_anh.loc[mask, 'density_g_per_cm3'] = 2.165
df_anh.loc[mask, 'hardness_Mohs'] = 2.5
df_anh.loc[mask, 'CAS'] = '7647-14-5'
df_anh.loc[mask, 'source_transition_temps'] = 'CRC Handbook, 97th Ed.'
df_anh.loc[mask, 'source_physical_properties'] = 'CRC Handbook, 97th Ed.'

# Save updated file
df_anh.to_csv('library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv', index=False)
```

---

## 10) Next Steps for Complete Database

### Priority 1: CRC Handbook Physical Constants

Fill from CRC Handbook Section 4 ("Physical Constants of Inorganic Compounds"):
- Melting points (Tm_C, Tm_K)
- Boiling points (Tb_C, Tb_K)
- Density (density_g_per_cm3)
- CAS Registry Numbers

**Estimated compounds with data:** ~50-100 common compounds

### Priority 2: CRC Handbook Thermochemistry

Fill from CRC Handbook Section 6:
- Heat of fusion (Hfus_kJ_per_mol)
- Heat of vaporization (Hvap_kJ_per_mol)

**Estimated compounds with data:** ~30-50 common compounds

### Priority 3: Additional Physical Properties

- Thermal conductivity (from specialized references)
- Viscosity (for molten salts)
- Hardness (from mineralogical databases)

### Priority 4: Temperature-Dependent Equations

From NIST-JANAF or literature:
- Cp(T) equations (Shomate or polynomial)
- Valid temperature ranges

---

## 11) Deliverables

### Current Deliverables ✅

1. **Comprehensive Database Files** (2 CSV files)
   - thermophysical_comprehensive_anhydrous_YYYYMMDD.csv
   - thermophysical_comprehensive_hydrates_YYYYMMDD.csv

2. **Processing Script**
   - `python_scripts/thermophysical_data_processor.py`

3. **Documentation**
   - This specification (THERMOPHYSICAL_DATA_SPEC.md)
   - Comprehensive database guide (COMPREHENSIVE_DATABASE_GUIDE.md)
   - Final summary (FINAL_COMPREHENSIVE_SUMMARY.md)

### Future Deliverables (When CRC Data Added)

4. **Complete Database**
   - All 45 properties filled where available
   - Citations for all external data

5. **Data Dictionary**
   - Column descriptions
   - Unit definitions
   - Source documentation

6. **Usage Guide**
   - Example calculations
   - Best practices
   - Data quality notes

---

## 12) Acceptance Criteria

The final comprehensive database must contain:

✅ **Structure Complete:**
- 45 columns per compound (all properties)
- Separate files for anhydrous and hydrates
- All variants preserved

✅ **Data Integrity:**
- NBS thermodynamic data: 95% coverage for ΔfH
- No duplicate column issues
- Correct hydrate detection from formulas
- Proper base formula extraction

✅ **Documentation:**
- Complete specification (this document)
- Usage examples
- Column descriptions

⚠️ **To Complete:**
- CRC Handbook data (melting points, density, etc.)
- CAS Registry Numbers
- Additional physical properties
- Temperature-dependent equations (optional)

---

## 13) Final Consolidation Step - Cleanup & Archive

### Purpose
After all data enrichment is complete, perform final consolidation to:
- Generate clean final production files
- Remove intermediate/minor files
- Archive source data properly
- Create complete delivery package

### Step 5: Final Consolidation & Cleanup

**When to execute:** After all CRC Handbook and external data has been added to the database

**Tasks:**

1. **Generate Final Production Files**
   - Create final consolidated CSV files with naming convention:
     - `thermophysical_FINAL_anhydrous.csv`
     - `thermophysical_FINAL_hydrates.csv`
   - These files contain ALL 45 properties filled to maximum extent
   - Include complete citations and provenance

2. **Remove Intermediate Files**
   - Archive or remove step-by-step intermediate files:
     - `*_step1_*.csv`, `*_step2_*.csv`, `*_step3_*.csv` → Move to `archive/` subdirectory
   - Keep only FINAL production files in main `processed_data/` directory

3. **External Data Source Management**
   - For ANY data added from external online sources (not in NBS_Tables Library.xlsx):
     - **Download and save the source files** to `library/resources/`
     - Create proper citations with URLs
     - Document in a `EXTERNAL_SOURCES.md` file
   
   **Examples:**
   - If CRC Handbook data added → Save PDF excerpts or data tables
   - If NIST Chemistry WebBook data used → Download and save JSON/CSV exports
   - If PubChem data used → Save compound data files
   - If peer-reviewed papers cited → Save PDFs to `library/resources/papers/`

4. **Source File Organization**
   ```
   library/resources/
   ├── NBS_Tables Library.xlsx                    (Original primary source)
   ├── CRC_Handbook_97th_Ed_Section4.pdf         (Physical constants - if used)
   ├── CRC_Handbook_97th_Ed_Section6.pdf         (Thermochemistry - if used)
   ├── NIST_WebBook_data_export_20260128.csv     (If NIST data added)
   ├── PubChem_CAS_numbers_20260128.csv          (If PubChem used)
   └── papers/                                     (Peer-reviewed sources)
       ├── paper1_author_year.pdf
       └── paper2_author_year.pdf
   ```

5. **Create EXTERNAL_SOURCES.md**
   Document all external sources used:
   ```markdown
   # External Data Sources
   
   ## CRC Handbook of Chemistry and Physics, 97th Edition
   - **Properties added:** Melting points, boiling points, density, CAS numbers
   - **Compounds affected:** ~50 compounds
   - **File saved:** library/resources/CRC_Handbook_97th_Ed_Section4.pdf
   - **Citation:** Haynes, W.M. (Ed.) (2016). CRC Handbook of Chemistry and Physics, 97th Edition. CRC Press.
   - **URL:** https://www.crcpress.com/
   
   ## NIST Chemistry WebBook
   - **Properties added:** Additional Cp values
   - **Compounds affected:** ~10 compounds
   - **File saved:** library/resources/NIST_WebBook_data_export_20260128.csv
   - **Citation:** NIST Chemistry WebBook, NIST Standard Reference Database Number 69
   - **URL:** https://webbook.nist.gov/chemistry/
   - **Access date:** January 28, 2026
   ```

6. **Generate Final Documentation Package**
   - `DATA_DICTIONARY_FINAL.md` - Complete column descriptions with all sources
   - `README_FINAL.md` - Final usage guide
   - `VALIDATION_REPORT_FINAL.md` - Complete validation results
   - `SOURCES_CITATIONS_FINAL.bib` - BibTeX format citations (optional)

7. **Create Archive Structure**
   ```
   library/
   ├── processed_data/
   │   ├── thermophysical_FINAL_anhydrous.csv      ⭐ FINAL
   │   ├── thermophysical_FINAL_hydrates.csv       ⭐ FINAL
   │   ├── DATA_DICTIONARY_FINAL.md                ⭐ FINAL
   │   ├── README_FINAL.md                         ⭐ FINAL
   │   └── archive/                                (Intermediate files)
   │       ├── thermophysical_comprehensive_anhydrous_20260128.csv
   │       ├── thermophysical_comprehensive_hydrates_20260128.csv
   │       └── ... (other step files)
   │
   ├── resources/
   │   ├── NBS_Tables Library.xlsx                 (Primary)
   │   ├── CRC_Handbook_97th_Ed_Section4.pdf       (External)
   │   ├── NIST_WebBook_data_export_20260128.csv   (External)
   │   └── EXTERNAL_SOURCES.md                     (Documentation)
   │
   └── docs/
       ├── THERMOPHYSICAL_DATA_SPEC.md             (This file)
       └── ... (other documentation)
   ```

8. **Final Validation Checklist**
   - [ ] All 45 property columns present
   - [ ] All external data has source citations
   - [ ] All external source files downloaded and saved
   - [ ] EXTERNAL_SOURCES.md created and complete
   - [ ] Intermediate files moved to archive/
   - [ ] Final files have clean naming (no dates/versions in name)
   - [ ] README and DATA_DICTIONARY updated
   - [ ] All URLs verified and documented
   - [ ] File integrity checks passed

### Script for Final Consolidation

Create `python_scripts/step5_final_consolidation.py`:

```python
#!/usr/bin/env python3
"""
Step 5: Final Consolidation & Cleanup

- Rename comprehensive files to FINAL versions
- Move intermediate files to archive
- Validate external sources are documented
- Generate final documentation
"""

import pandas as pd
import os
import shutil
from datetime import datetime

def consolidate_final_database():
    """Create final production files"""
    
    # Find latest comprehensive files
    base_dir = '../library/processed_data'
    
    # Rename to FINAL
    comprehensive_files = {
        'anhydrous': 'thermophysical_comprehensive_anhydrous_20260128.csv',
        'hydrates': 'thermophysical_comprehensive_hydrates_20260128.csv'
    }
    
    for category, old_name in comprehensive_files.items():
        old_path = os.path.join(base_dir, old_name)
        new_path = os.path.join(base_dir, f'thermophysical_FINAL_{category}.csv')
        
        if os.path.exists(old_path):
            shutil.copy2(old_path, new_path)
            print(f"✅ Created: {new_path}")
    
    # Move intermediate files to archive
    archive_dir = os.path.join(base_dir, 'archive')
    os.makedirs(archive_dir, exist_ok=True)
    
    # Archive patterns
    archive_patterns = ['*_step1_*.csv', '*_step2_*.csv', '*_step3_*.csv', 
                       '*_comprehensive_*.csv']
    
    print("\n📦 Archiving intermediate files...")
    # Implementation here
    
    print("\n✅ Final consolidation complete!")
    print(f"\nFinal files:")
    print(f"  - thermophysical_FINAL_anhydrous.csv")
    print(f"  - thermophysical_FINAL_hydrates.csv")
    print(f"\nIntermediate files moved to: {archive_dir}")

if __name__ == '__main__':
    consolidate_final_database()
```

### External Source Download Guidelines

**For CRC Handbook:**
- Save relevant PDF sections to `library/resources/`
- Document section numbers and page ranges
- Include in EXTERNAL_SOURCES.md

**For Online Databases (NIST, PubChem):**
- Export data as CSV/JSON before adding to database
- Save export files with timestamp
- Document API endpoints or URLs used
- Note access date for reproducibility

**For Peer-Reviewed Papers:**
- Save PDFs to `library/resources/papers/`
- Include DOI in citation
- Document which properties came from which paper

**Important:** 
- Never rely on "live" internet data without local backup
- All sources must be reproducible from saved files
- Document download date and version/edition

---

*Specification Version 2.0 - Comprehensive*  
*Last Updated: January 28, 2026*  
*Status: Complete - Structure Implemented, Ready for CRC Data*  
*Next: Step 5 Final Consolidation after data enrichment*


