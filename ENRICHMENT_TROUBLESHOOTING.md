# 🔧 ENRICHMENT SCRIPT - TROUBLESHOOTING & FIX

**Issue:** `python3 enrich_database.py --source manual` fails  
**Date:** January 28, 2026  
**Status:** INVESTIGATING & FIXING

---

## 🔍 LIKELY ISSUES

### Issue 1: Missing Import
The script imports `PubChemAPIClient` but may fail if used without PubChem source.

### Issue 2: Terminal Output Suppression
Terminal output is being suppressed, making debugging difficult.

### Issue 3: File Path Issues
Relative paths may not resolve correctly.

---

## ✅ SOLUTION: Create Simplified Enrichment Script

I'll create a simplified, working version that handles manual data enrichment reliably.

---

## 📝 MANUAL ENRICHMENT STEPS (ALTERNATIVE)

If the script continues to fail, you can enrich manually with this Python code:

```python
import pandas as pd
import os

print("=" * 80)
print("MANUAL DATA ENRICHMENT")
print("=" * 80)

# Load database
df_anh = pd.read_csv('../library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv')
df_hyd = pd.read_csv('../library/processed_data/thermophysical_comprehensive_hydrates_20260128.csv')

print(f"Loaded {len(df_anh)} anhydrous, {len(df_hyd)} hydrates")

# Load manual data
manual_df = pd.read_csv('../library/resources/data_sources/manual_data_entry.csv', comment='#')
print(f"Manual data: {len(manual_df)} compounds")

# Merge function
def merge_manual_data(df, manual_df):
    properties = ['CAS', 'Tm_C', 'Tb_C', 'density_g_per_cm3', 
                  'Hfus_kJ_per_mol', 'Hvap_kJ_per_mol',
                  'thermal_conductivity_W_per_mK', 'hardness_Mohs']
    
    count = 0
    for _, row in manual_df.iterrows():
        formula = row['formula']
        mask = df['formula'] == formula
        
        if mask.sum() > 0:
            for prop in properties:
                if prop in manual_df.columns and prop in df.columns:
                    val = row.get(prop)
                    if pd.notna(val) and df.loc[mask, prop].isna().any():
                        df.loc[mask, prop] = val
                        count += 1
            
            # Calculate Kelvin from Celsius
            if pd.notna(row.get('Tm_C')) and 'Tm_K' in df.columns:
                df.loc[mask, 'Tm_K'] = row['Tm_C'] + 273.15
            if pd.notna(row.get('Tb_C')) and 'Tb_K' in df.columns:
                df.loc[mask, 'Tb_K'] = row['Tb_C'] + 273.15
    
    return df, count

# Enrich both dataframes
df_anh, count_anh = merge_manual_data(df_anh, manual_df)
df_hyd, count_hyd = merge_manual_data(df_hyd, manual_df)

print(f"Added {count_anh} properties to anhydrous")
print(f"Added {count_hyd} properties to hydrates")

# Save
from datetime import datetime
timestamp = datetime.now().strftime('%Y%m%d')
anh_file = f'../library/processed_data/thermophysical_comprehensive_anhydrous_{timestamp}_enriched_manual.csv'
hyd_file = f'../library/processed_data/thermophysical_comprehensive_hydrates_{timestamp}_enriched_manual.csv'

df_anh.to_csv(anh_file, index=False)
df_hyd.to_csv(hyd_file, index=False)

print(f"\n✅ Saved:")
print(f"  {anh_file}")
print(f"  {hyd_file}")

# Show coverage improvement
print(f"\n📊 Coverage:")
for prop in ['CAS', 'Tm_C', 'density_g_per_cm3']:
    if prop in df_anh.columns:
        count = df_anh[prop].notna().sum()
        pct = count / len(df_anh) * 100
        print(f"  {prop:25s}: {count:3d}/{len(df_anh)} ({pct:.1f}%)")
```

Save this as `manual_enrichment.py` and run:
```bash
cd /opt/thermal-software/python_scripts
python3 manual_enrichment.py
```

---

## 🎯 EXPECTED RESULT

After manual enrichment, you should have:
- ✅ CAS numbers for 40+ compounds
- ✅ Melting points for 35+ compounds
- ✅ Boiling points for 30+ compounds
- ✅ Density for 35+ compounds
- ✅ Heat of fusion for 20+ compounds

---

*Troubleshooting Guide*  
*Created: January 28, 2026*  
*Alternative approach provided*

