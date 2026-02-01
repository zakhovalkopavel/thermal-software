# 🚀 QUICK START GUIDE - Thermophysical Data Processor

**Updated:** January 28, 2026

---

## ✅ READY TO RUN

All scripts validated and configured with:
- ✅ 21 cations (including Cu)
- ✅ 16 anion families (including sulfites, sulfides, pyrosulfates, metaphosphates, etc.)
- ✅ 230+ compound names (including H2O and copper compounds)
- ✅ No hardcoded data (all in resource files)

---

## 🎯 HOW TO RUN

### 1. Generate Database

```bash
# From project root directory
cd legacy/python_scripts
python3 thermophysical_data_processor.py
```

**Note:** This is legacy documentation. The path shown assumes project root as working directory. Adjust paths based on your installation location.

### 2. Expected Output

**Files created in `library/processed_data/`:**
```
thermophysical_comprehensive_anhydrous_YYYYMMDD.csv
thermophysical_comprehensive_hydrates_YYYYMMDD.csv
```

**Each file contains:**
- 45 columns (all properties)
- Anhydrous: ~500-600 compounds
- Hydrates: ~200-300 compounds
- Total: ~700-900 compounds

---

## 📊 WHAT IT DOES

1. **Loads NBS Tables** - Extracts thermodynamic data
2. **Filters elements** - Removes organic, nitrates, ammonium
3. **Identifies cations** - Matches 21 target cations
4. **Classifies anions** - Matches 16 anion families
5. **Detects hydration** - From chemical formulas (ZnSO4·H2O)
6. **Generates names** - Auto-names 230+ compounds
7. **Calculates Cp_mass** - From molar Cp and molar mass
8. **Separates files** - Anhydrous vs hydrates
9. **Adds placeholders** - For CRC Handbook data

---

## 📋 OUTPUT STRUCTURE

### Columns (45 total)

**Core Identification (9):**
- cation, anion_family, compound_name, formula, base_formula
- hydration, hydration_formula, phase_at_25C, state_description

**NBS Thermodynamic (8):**
- molar_mass_g_per_mol, DfH0_kJ_per_mol, DfH_298K_kJ_per_mol
- DfG_298K_kJ_per_mol, H_H0_298K_kJ_per_mol, S_298K_J_per_molK
- Cp_298K_J_per_molK, Cp_mass_J_per_kgK_298K

**Transition Temps (5):** - Empty, ready for CRC
- Tm_C, Tm_K, Tb_C, Tb_K, Td_C

**Heat of Transition (3):** - Empty, ready for CRC
- Hfus_kJ_per_mol, Hvap_kJ_per_mol, Hsub_kJ_per_mol

**Physical Properties (4):** - Empty, ready for CRC
- density_g_per_cm3, thermal_conductivity_W_per_mK
- viscosity_mPa_s, hardness_Mohs

**Stability (3):** - Empty
- stability_range_C_min, stability_range_C_max, decomposition_products

**Cp(T) Equations (6):** - Empty
- Cp_equation_type, Cp_coeff_a/b/c, Cp_temp_range_K_min/max

**Provenance (7):**
- pressure_kPa, source_thermodynamic, source_physical_properties
- source_transition_temps, data_quality, CAS, notes

---

## 🔍 COMPOUND FAMILIES INCLUDED

**16 Anion Families:**

1. **Oxides** (O) - SiO2, Al2O3, TiO2, CuO, etc.
2. **Chlorides** (Cl) - NaCl, KCl, CuCl2, etc.
3. **Fluorides** (F) - NaF, CaF2, etc.
4. **Carbonates** (CO3) - CaCO3, Na2CO3, etc.
5. **Sulfates** (SO4) - Na2SO4, CuSO4, etc.
6. **Sulfites** (SO3) - Na2SO3, CaSO3, etc. ← NEW
7. **Sulfides** (S) - FeS, ZnS, CuS, etc. ← NEW
8. **Pyrosulfates** (S2O7) - Na2S2O7, etc. ← NEW
9. **Phosphates** (PO4) - Ca3(PO4)2, etc.
10. **Metaphosphates** (PO3) - NaPO3, etc. ← NEW
11. **Pyrophosphates** (P2O7) - Na4P2O7, etc. ← NEW
12. **Polyphosphates** ← NEW
13. **Borates** (B-O) - Na2B4O7, Na3BO3, etc.
14. **Carbides** (C) - SiC, B4C, TiC, etc.
15. **Nitrides** (N) - Si3N4, AlN, BN, etc.
16. **Borides** (B) - TiB2, MgB2, ZrB2, etc.

**21 Cations:**
Na, K, Li, Mg, Ca, Ba, Sr, Fe, Zn, Ni, Cu, Al, Ti, Si, B, Cr, Mn, Zr, Ce, Y, La

---

## 📝 USAGE EXAMPLES

### Load Data

```python
import pandas as pd

# Load files
df_anh = pd.read_csv('library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv')
df_hyd = pd.read_csv('library/processed_data/thermophysical_comprehensive_hydrates_20260128.csv')

# Combine if needed
df_all = pd.concat([df_anh, df_hyd])

print(f"Total compounds: {len(df_all)}")
```

### Find Compounds

```python
# Find all copper compounds
cu_compounds = df_all[df_all['cation'] == 'Cu']
print(cu_compounds[['formula', 'compound_name', 'anion_family']])

# Find sulfites
sulfites = df_all[df_all['anion_family'] == 'sulfite']
print(sulfites[['formula', 'compound_name']])

# Find metaphosphates
metaphos = df_all[df_all['anion_family'] == 'metaphosphate']
print(metaphos[['formula', 'compound_name']])
```

### Filter by Data Availability

```python
# Compounds with heat capacity
with_cp = df_all[df_all['Cp_298K_J_per_molK'].notna()]
print(f"Compounds with Cp: {len(with_cp)}")

# Compounds with formation enthalpy
with_dfh = df_all[df_all['DfH_298K_kJ_per_mol'].notna()]
print(f"Compounds with ΔfH: {len(with_dfh)}")
```

---

## 🔧 MAINTENANCE

### Add New Cation

Edit `library/resources/processor_config.txt`:

```
[cations]
...existing cations...
Co,Cobalt,transition_metal

[allowed_elements]
# Cations
Na,K,Li,Mg,Ca,Ba,Sr,Fe,Zn,Ni,Cu,Al,Ti,Si,B,Cr,Mn,Zr,Ce,Y,La,Co
```

### Add Compound Names

Edit `library/resources/compound_names.csv`:

```
CoO,Cobalt(II) oxide,oxide
Co2O3,Cobalt(III) oxide,oxide
CoCl2,Cobalt(II) chloride,chloride
```

### Add Anion Family

Edit `library/resources/processor_config.txt`:

```
[anion_families]
...existing families...
arsenate<TAB>AsO4|arsenate<TAB>As O
```

---

## ⚠️ TROUBLESHOOTING

### Issue: No output files created

**Solution:** Check that NBS_Tables Library.xlsx exists:
```bash
# From project root directory
ls -lh legacy/library/resources/NBS_Tables\ Library.xlsx
```

### Issue: Import error

**Solution:** Run from correct directory:
```bash
# From project root directory
cd legacy/python_scripts
python3 thermophysical_data_processor.py
```

### Issue: Configuration not loading

**Solution:** Verify resource files exist:
```bash
# From project root directory
ls -lh legacy/library/resources/processor_config.txt
ls -lh legacy/library/resources/compound_names.csv
```

---

## 📚 DOCUMENTATION

**Complete guides:**
- `library/docs/THERMOPHYSICAL_DATA_SPEC.md` - Full specification
- `library/docs/COMPREHENSIVE_DATABASE_GUIDE.md` - Database guide
- `library/docs/SCRIPTS_REFACTORED_NO_HARDCODED_DATA.md` - Resource file docs
- `library/docs/ANION_FAMILIES_COMPLETE.md` - Anion families reference
- `library/docs/SCRIPTS_VALIDATION_REPORT.md` - Validation report

---

## ✅ CHECKLIST

Before running:
- [ ] NBS Tables Library.xlsx is in library/resources/
- [ ] processor_config.txt is configured (21 cations, 16 families)
- [ ] compound_names.csv is populated (230+ compounds)
- [ ] Python packages installed (pandas, openpyxl)

After running:
- [ ] Two CSV files created in library/processed_data/
- [ ] Anhydrous file has ~500-600 compounds
- [ ] Hydrates file has ~200-300 compounds
- [ ] All 45 columns present in both files
- [ ] No errors in output

---

*Quick Start Guide - January 28, 2026*  
*All systems ready for production!*

