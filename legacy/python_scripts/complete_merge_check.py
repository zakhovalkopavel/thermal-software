#!/usr/bin/env python3
"""
Complete merge check and fix script
Ensures all data from manual_data_entry and PubChem is properly merged
"""

import pandas as pd
import numpy as np
import sys

def safe_float(value):
    """Safely convert value to float"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        value = value.strip()
        value = value.replace('(decomp)', '').replace('decomp', '').replace('(decomposes)', '')
        value = value.replace('°C', '').replace('°', '').replace('C', '').strip()
        try:
            return float(value)
        except (ValueError, AttributeError):
            return None
    return None

print("=" * 80)
print("COMPLETE DATA MERGE CHECK AND FIX")
print("=" * 80)

# Load all data sources
df_thermo_anh = pd.read_csv('library/processed_data/thermophysical_anhydrous.csv')
df_thermo_hyd = pd.read_csv('library/processed_data/thermophysical_hydrates.csv')
df_manual = pd.read_csv('library/resources/data_sources/manual_data_entry.csv')
df_pubchem = pd.read_csv('library/resources/data_sources/PubChem_bulk_fetch_20260128_041155.csv')

print(f"\nLoaded data:")
print(f"  Thermophysical anhydrous: {len(df_thermo_anh)} compounds")
print(f"  Thermophysical hydrates: {len(df_thermo_hyd)} compounds")
print(f"  Manual data: {len(df_manual)} entries")
print(f"  PubChem data: {len(df_pubchem)} compounds")

# Step 1: Merge manual data into thermophysical (fill gaps)
print("\n" + "=" * 80)
print("STEP 1: Merging Manual Data Gaps")
print("=" * 80)

manual_filled = 0
for _, manual_row in df_manual.iterrows():
    formula = manual_row['formula']

    # Check anhydrous
    mask_anh = df_thermo_anh['formula'] == formula
    if mask_anh.sum() > 0:
        # CAS
        if pd.notna(manual_row.get('CAS')):
            if df_thermo_anh.loc[mask_anh, 'CAS'].isna().all():
                df_thermo_anh.loc[mask_anh, 'CAS'] = manual_row['CAS']
                manual_filled += 1

        # Tm_C
        Tm_C = safe_float(manual_row.get('Tm_C'))
        if Tm_C is not None:
            if df_thermo_anh.loc[mask_anh, 'Tm_C'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Tm_C'] = Tm_C
                df_thermo_anh.loc[mask_anh, 'Tm_K'] = Tm_C + 273.15
                manual_filled += 1

        # Tb_C
        Tb_C = safe_float(manual_row.get('Tb_C'))
        if Tb_C is not None:
            if df_thermo_anh.loc[mask_anh, 'Tb_C'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Tb_C'] = Tb_C
                df_thermo_anh.loc[mask_anh, 'Tb_K'] = Tb_C + 273.15
                manual_filled += 1

        # Td_C
        Td_C = safe_float(manual_row.get('Td_C'))
        if Td_C is not None:
            if df_thermo_anh.loc[mask_anh, 'Td_C'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Td_C'] = Td_C
                manual_filled += 1

        # Density
        density = safe_float(manual_row.get('density_g_per_cm3'))
        if density is not None:
            if df_thermo_anh.loc[mask_anh, 'density_g_per_cm3'].isna().all():
                df_thermo_anh.loc[mask_anh, 'density_g_per_cm3'] = density
                manual_filled += 1

        # Hfus
        Hfus = safe_float(manual_row.get('Hfus_kJ_per_mol'))
        if Hfus is not None:
            if df_thermo_anh.loc[mask_anh, 'Hfus_kJ_per_mol'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Hfus_kJ_per_mol'] = Hfus
                manual_filled += 1

        # Hvap
        Hvap = safe_float(manual_row.get('Hvap_kJ_per_mol'))
        if Hvap is not None:
            if df_thermo_anh.loc[mask_anh, 'Hvap_kJ_per_mol'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Hvap_kJ_per_mol'] = Hvap
                manual_filled += 1

print(f"✅ Filled {manual_filled} gaps from manual data")

# Step 2: Merge PubChem data into thermophysical (fill gaps)
print("\n" + "=" * 80)
print("STEP 2: Merging PubChem Data Gaps")
print("=" * 80)

pubchem_filled = 0
for _, pc_row in df_pubchem.iterrows():
    formula = pc_row['formula']

    # Check anhydrous
    mask_anh = df_thermo_anh['formula'] == formula
    if mask_anh.sum() > 0:
        # CID
        if pd.notna(pc_row.get('CID')):
            if 'CID_pubchem' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'CID_pubchem'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'CID_pubchem'] = pc_row['CID']
                    pubchem_filled += 1

        # CAS (if not already filled)
        if pd.notna(pc_row.get('CAS')):
            if df_thermo_anh.loc[mask_anh, 'CAS'].isna().all():
                df_thermo_anh.loc[mask_anh, 'CAS'] = pc_row['CAS']
                pubchem_filled += 1

        # Color
        if pd.notna(pc_row.get('color')):
            if 'color' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'color'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'color'] = pc_row['color']
                    pubchem_filled += 1

        # Solubility
        if pd.notna(pc_row.get('solubility')):
            if 'solubility' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'solubility'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'solubility'] = pc_row['solubility']
                    pubchem_filled += 1

        # Stability
        if pd.notna(pc_row.get('stability')):
            if 'stability' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'stability'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'stability'] = pc_row['stability']
                    pubchem_filled += 1

        # Temperatures from PubChem (if main temps are missing)
        Tm_pubchem = safe_float(pc_row.get('Tm_C_pubchem'))
        if Tm_pubchem is not None:
            if 'Tm_C_pubchem' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'Tm_C_pubchem'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'Tm_C_pubchem'] = Tm_pubchem
            # Fill main Tm if empty
            if df_thermo_anh.loc[mask_anh, 'Tm_C'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Tm_C'] = Tm_pubchem
                df_thermo_anh.loc[mask_anh, 'Tm_K'] = Tm_pubchem + 273.15
                pubchem_filled += 1

        Tb_pubchem = safe_float(pc_row.get('Tb_C_pubchem'))
        if Tb_pubchem is not None:
            if 'Tb_C_pubchem' in df_thermo_anh.columns:
                if df_thermo_anh.loc[mask_anh, 'Tb_C_pubchem'].isna().all():
                    df_thermo_anh.loc[mask_anh, 'Tb_C_pubchem'] = Tb_pubchem
            # Fill main Tb if empty
            if df_thermo_anh.loc[mask_anh, 'Tb_C'].isna().all():
                df_thermo_anh.loc[mask_anh, 'Tb_C'] = Tb_pubchem
                df_thermo_anh.loc[mask_anh, 'Tb_K'] = Tb_pubchem + 273.15
                pubchem_filled += 1

print(f"✅ Filled {pubchem_filled} gaps from PubChem data")

# Step 3: Save updated database
print("\n" + "=" * 80)
print("STEP 3: Saving Updated Database")
print("=" * 80)

df_thermo_anh.to_csv('library/processed_data/thermophysical_anhydrous.csv', index=False)
df_thermo_hyd.to_csv('library/processed_data/thermophysical_hydrates.csv', index=False)

print(f"✅ Saved updated thermophysical_anhydrous.csv ({len(df_thermo_anh)} compounds)")
print(f"✅ Saved updated thermophysical_hydrates.csv ({len(df_thermo_hyd)} compounds)")

# Step 4: Final statistics
print("\n" + "=" * 80)
print("FINAL STATISTICS")
print("=" * 80)

new_anions = df_thermo_anh[df_thermo_anh['anion_family'].isin(['nitrate', 'nitrite', 'bromide', 'iodide'])]
print(f"\n📊 New anion families: {len(new_anions)} compounds")
print(f"   Nitrates: {(new_anions['anion_family'] == 'nitrate').sum()}")
print(f"   Nitrites: {(new_anions['anion_family'] == 'nitrite').sum()}")
print(f"   Bromides: {(new_anions['anion_family'] == 'bromide').sum()}")
print(f"   Iodides: {(new_anions['anion_family'] == 'iodide').sum()}")

print(f"\n📊 Coverage for new anions:")
print(f"   CAS: {new_anions['CAS'].notna().sum()} / {len(new_anions)} ({new_anions['CAS'].notna().sum()/len(new_anions)*100:.1f}%)")
print(f"   Tm_C: {new_anions['Tm_C'].notna().sum()} / {len(new_anions)} ({new_anions['Tm_C'].notna().sum()/len(new_anions)*100:.1f}%)")
print(f"   Density: {new_anions['density_g_per_cm3'].notna().sum()} / {len(new_anions)} ({new_anions['density_g_per_cm3'].notna().sum()/len(new_anions)*100:.1f}%)")
print(f"   Color: {new_anions['color'].notna().sum()} / {len(new_anions)} ({new_anions['color'].notna().sum()/len(new_anions)*100:.1f}%)")
print(f"   Solubility: {new_anions['solubility'].notna().sum()} / {len(new_anions)} ({new_anions['solubility'].notna().sum()/len(new_anions)*100:.1f}%)")

print("\n" + "=" * 80)
print("✅ MERGE COMPLETE!")
print("=" * 80)
print(f"\nTotal gaps filled:")
print(f"  From manual data: {manual_filled}")
print(f"  From PubChem: {pubchem_filled}")
print(f"  Total: {manual_filled + pubchem_filled}")

sys.exit(0)

