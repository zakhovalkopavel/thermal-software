#!/bin/bash
# Complete workflow to add new anion families
# Date: January 28, 2026

echo "================================================================================"
echo "ADDING NEW ANION FAMILIES TO THERMOPHYSICAL DATABASE"
echo "Target: Nitrate, Nitrite, Bromide, Iodide"
echo "================================================================================"
echo ""

cd /opt/thermal-software

# Step 1: Add compounds from manual data and create initial enriched file
echo "Step 1: Adding compounds from manual data..."
python3 << 'STEP1'
import pandas as pd
import numpy as np

# Load files
manual = pd.read_csv('library/resources/data_sources/manual_data_entry.csv')
df_anh = pd.read_csv('library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv')

print(f"Loaded manual data: {len(manual)} entries")
print(f"Loaded anhydrous DB: {len(df_anh)} compounds")

# Identify new anion compounds in manual data
def get_anion_family(formula):
    if 'NO3' in formula: return 'nitrate'
    elif 'NO2' in formula: return 'nitrite'
    elif 'Br' in formula and 'NO' not in formula: return 'bromide'
    elif 'I' in formula and 'NO' not in formula and 'Si' not in formula and 'Ti' not in formula and 'Ni' not in formula and 'Li' not in formula: return 'iodide'
    return None

def get_cation(formula):
    cations = ['Na', 'K', 'Li', 'Mg', 'Ca', 'Ba', 'Sr', 'Fe', 'Zn', 'Ni', 'Cu', 'Al', 'Ag']
    for cat in cations:
        if formula.startswith(cat):
            return cat
    return 'Unknown'

# Find new compounds
new_rows = []
for _, row in manual.iterrows():
    formula = row['formula']
    anion = get_anion_family(formula)

    if anion and formula not in df_anh['formula'].values:
        # Create new entry
        cation = get_cation(formula)
        new_entry = {col: None for col in df_anh.columns}
        new_entry.update({
            'cation': cation,
            'anion_family': anion,
            'formula': formula,
            'base_formula': formula,
            'hydration': 'anhydrous',
            'phase_at_25C': 'solid',
            'CAS': row.get('CAS'),
            'Tm_C': row.get('Tm_C'),
            'Tm_K': float(row['Tm_C']) + 273.15 if pd.notna(row.get('Tm_C')) else None,
            'Tb_C': row.get('Tb_C'),
            'Tb_K': float(row['Tb_C']) + 273.15 if pd.notna(row.get('Tb_C')) else None,
            'Td_C': row.get('Td_C'),
            'density_g_per_cm3': row.get('density_g_per_cm3'),
            'Hfus_kJ_per_mol': row.get('Hfus_kJ_per_mol'),
            'Hvap_kJ_per_mol': row.get('Hvap_kJ_per_mol'),
            'source_physical_properties': row.get('source', 'CRC 97th'),
            'data_quality': 'A',
            'pressure_kPa': 101.325
        })
        new_rows.append(new_entry)

print(f"\nFound {len(new_rows)} new compounds to add")

if new_rows:
    df_new = pd.DataFrame(new_rows)
    print("\nBy anion family:")
    for anion in ['nitrate', 'nitrite', 'bromide', 'iodide']:
        count = (df_new['anion_family'] == anion).sum()
        if count > 0:
            print(f"  {anion}: {count}")

    # Combine
    df_combined = pd.concat([df_anh, df_new], ignore_index=True)
    df_combined.to_csv('library/processed_data/thermophysical_comprehensive_anhydrous_20260128_with_new_anions.csv', index=False)
    print(f"\n✅ Saved: {len(df_combined)} total compounds (+{len(new_rows)})")

    # Save formulas for PubChem fetch
    with open('new_anion_formulas.txt', 'w') as f:
        for formula in df_new['formula'].values:
            f.write(formula + '\n')
    print(f"✅ Saved formulas list for PubChem fetch")
else:
    print("⚠️  No new compounds found")
STEP1

echo ""
echo "================================================================================"
echo "Step 1 Complete - check thermophysical_comprehensive_anhydrous_20260128_with_new_anions.csv"
echo "================================================================================"

