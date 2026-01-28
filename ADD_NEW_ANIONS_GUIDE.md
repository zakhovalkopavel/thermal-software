# Adding New Anion Families - Quick Guide

**Date:** January 28, 2026  
**Anions to Add:** Nitrate (NO3), Nitrite (NO2), Bromide (Br), Iodide (I)

## Prerequisites Completed ✅

1. ✅ **Updated processor_config.txt**
   - Added nitrate, nitrite, bromide, iodide to anion families
   - Added Br and I to allowed elements
   - Removed nitrate from excluded patterns

2. ✅ **Updated compound_names.csv**
   - Added 55+ compound names for new anions
   - Includes nitrates, nitrites, bromides, iodides

3. ✅ **Created manual_new_anions.csv**
   - Added CRC Handbook data for 60+ compounds
   - Includes Tm, Tb, Td, density, Hfus, Hvap

4. ✅ **Appended to manual_data_entry.csv**
   - Manual data merged into main manual entry file

## Run the Update

Execute the reusable script:

```bash
cd /opt/thermal-software
python3 python_scripts/update_with_new_anions.py --anions nitrate nitrite bromide iodide --reprocess
```

### What This Does:

1. **Reprocesses NBS Tables** (--reprocess flag)
   - Extracts all nitrate, nitrite, bromide, iodide compounds from NBS
   
2. **Identifies New Compounds**
   - Filters for the specified anion families
   - Shows count by anion family

3. **Fetches PubChem Data**
   - Gets experimental data for all new compounds
   - Includes color, solubility, stability, Tm, Tb, etc.

4. **Merges All Data**
   - Combines NBS + Manual + PubChem data
   - Updates final database files

5. **Saves Results**
   - Updates thermophysical_anhydrous.csv
   - Updates thermophysical_hydrates.csv
   - Updates PubChem_bulk_fetch_*.csv

## Alternative: Skip PubChem if Already Fetched

If you already have PubChem data and just want to reprocess:

```bash
python3 python_scripts/update_with_new_anions.py --anions nitrate nitrite bromide iodide --reprocess --skip-pubchem
```

## For Future Additions

The script is now fully reusable! To add more families later:

```bash
# Add arsenate anions
python3 python_scripts/update_with_new_anions.py --anions arsenate --reprocess

# Add silver and lead cations  
python3 python_scripts/update_with_new_anions.py --cations Ag Pb --reprocess

# Add both
python3 python_scripts/update_with_new_anions.py --anions arsenate --cations Ag --reprocess
```

## Expected Results

After running, you should have:

- **Nitrates:** ~20-30 compounds (NaNO3, KNO3, Ca(NO3)2, etc.)
- **Nitrites:** ~5-10 compounds (NaNO2, KNO2, etc.)
- **Bromides:** ~15-20 compounds (NaBr, KBr, CaBr2, etc.)
- **Iodides:** ~15-20 compounds (NaI, KI, CaI2, etc.)

**Total:** ~60-80 new compounds added to the database!

---

**Status:** Ready to Run ✅  
**Script:** Fully reusable for future additions

