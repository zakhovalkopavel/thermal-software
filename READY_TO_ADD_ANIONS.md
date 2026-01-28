# ✅ READY TO ADD NEW ANION FAMILIES

**Date:** January 28, 2026  
**Target Anions:** Nitrate (NO3), Nitrite (NO2), Bromide (Br), Iodide (I)

---

## All Prerequisites Complete ✅

### 1. Configuration Updated ✅
- **File:** `library/resources/processor_config.txt`
- Added 4 new anion families
- Added Br and I to allowed elements
- Removed nitrate exclusion

### 2. Compound Names Added ✅
- **File:** `library/resources/compound_names.csv`
- Added ~55 compound names
- Covers all major nitrates, nitrites, bromides, iodides

### 3. Manual Data Merged ✅
- **File:** `library/resources/data_sources/manual_data_entry.csv`
- Merged ~47 new compounds from CRC Handbook 97th Ed
- Removed duplicate file (manual_new_anions.csv)
- Data includes: Tm, Tb, Td, density, Hfus, Hvap

### 4. Reusable Script Ready ✅
- **File:** `python_scripts/update_with_new_anions.py`
- Fully dynamic - works for any anion/cation families
- Can be reused for future additions

---

## Execute the Update

Run this single command to complete the entire workflow:

```bash
cd /opt/thermal-software
python3 python_scripts/update_with_new_anions.py --anions nitrate nitrite bromide iodide --reprocess
```

### What This Will Do:

**Step 1:** Reprocess NBS Tables  
→ Extract all compounds with NO3, NO2, Br, I anions from NBS Tables

**Step 2:** Identify New Compounds  
→ Filter for the 4 target anion families  
→ Expected: ~60-80 compounds

**Step 3:** Fetch PubChem Data  
→ Get CAS, melting points, color, solubility, stability  
→ Rate-limited (2 req/sec) to avoid ban  
→ Estimated time: ~5-10 minutes

**Step 4:** Merge PubChem Data  
→ Update existing PubChem_bulk_fetch_*.csv file  
→ Remove duplicates, keep latest data

**Step 5:** Merge All Data Sources  
→ Combine NBS + Manual (CRC) + PubChem data  
→ Fill gaps intelligently (NBS takes priority)

**Step 6:** Save Final Database  
→ Update thermophysical_anhydrous.csv  
→ Update thermophysical_hydrates.csv

---

## Expected Results

### New Compounds by Anion Family:

| Anion Family | Expected Count | Examples |
|--------------|----------------|----------|
| **Nitrate** | ~20-30 | NaNO3, KNO3, Ca(NO3)2, AgNO3 |
| **Nitrite** | ~5-10 | NaNO2, KNO2, Ba(NO2)2 |
| **Bromide** | ~15-20 | NaBr, KBr, CaBr2, AgBr |
| **Iodide** | ~15-20 | NaI, KI, CaI2, AgI |
| **TOTAL** | **~60-80** | New compounds in database |

### Data Coverage:

- **NBS Thermodynamic Data:** ΔfH, ΔfG, S, Cp (if available)
- **CRC Physical Data:** Tm, Tb, density, Hfus, Hvap (~47 compounds)
- **PubChem Data:** CAS, color, solubility, stability, additional temps

---

## Files That Will Be Updated

1. ✅ `library/processed_data/thermophysical_anhydrous.csv`
2. ✅ `library/processed_data/thermophysical_hydrates.csv`
3. ✅ `library/resources/data_sources/PubChem_bulk_fetch_*.csv`

---

## After Completion

The database will include:
- **Previous:** ~600 anhydrous compounds (oxides, chlorides, sulfates, etc.)
- **New:** ~60-80 compounds (nitrates, nitrites, bromides, iodides)
- **Total:** ~660-680 anhydrous compounds

All with comprehensive thermophysical properties!

---

## Ready to Run? ✅

Just execute:
```bash
cd /opt/thermal-software
python3 python_scripts/update_with_new_anions.py --anions nitrate nitrite bromide iodide --reprocess
```

Press Enter when the script prompts you to confirm the prerequisites are complete.

The whole process will take approximately **10-15 minutes** depending on PubChem response times.

---

**Status:** ALL PREREQUISITES COMPLETE - READY TO EXECUTE ✅

