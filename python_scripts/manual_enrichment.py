#!/usr/bin/env python3
"""
Simplified Manual Data Enrichment Script

This script enriches the thermophysical database with manually entered data.
It's a simplified version that focuses only on manual data merging.

Usage:
    python3 manual_enrichment.py
"""

import pandas as pd
import os
from datetime import datetime

def main():
    print("=" * 80)
    print("MANUAL DATA ENRICHMENT")
    print("=" * 80)

    # Load database files
    print("\n📂 Loading database files...")
    try:
        df_anh = pd.read_csv('../library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv')
        df_hyd = pd.read_csv('../library/processed_data/thermophysical_comprehensive_hydrates_20260128.csv')
        print(f"✅ Loaded:")
        print(f"   Anhydrous: {len(df_anh)} compounds")
        print(f"   Hydrates: {len(df_hyd)} compounds")
    except Exception as e:
        print(f"❌ Error loading database: {e}")
        return 1

    # Load manual data
    print("\n📂 Loading manual data...")
    manual_file = '../library/resources/data_sources/manual_data_entry.csv'

    if not os.path.exists(manual_file):
        print(f"❌ Manual data file not found: {manual_file}")
        return 1

    try:
        manual_df = pd.read_csv(manual_file, comment='#')
        print(f"✅ Loaded manual data: {len(manual_df)} compounds")
    except Exception as e:
        print(f"❌ Error loading manual data: {e}")
        return 1

    # Properties to merge - includes Vickers hardness and kJ/kg values
    properties = [
        'CAS', 'Tm_C', 'Tb_C', 'Td_C', 'density_g_per_cm3',
        'Hfus_kJ_per_mol', 'Hfus_kJ_per_kg',
        'Hvap_kJ_per_mol', 'Hvap_kJ_per_kg',
        'thermal_conductivity_W_per_mK',
        'hardness_Mohs', 'hardness_Vickers_MPa'
    ]

    # Merge function
    def merge_manual_data(df, manual_df, label=""):
        print(f"\n🔄 Enriching {label}...")
        properties_added = 0
        compounds_enriched = 0

        for _, row in manual_df.iterrows():
            formula = row['formula']
            mask = df['formula'] == formula

            if mask.sum() == 0:
                continue  # Formula not in database

            compound_props = []

            for prop in properties:
                if prop in manual_df.columns and prop in df.columns:
                    val = row.get(prop)
                    if pd.notna(val):
                        # Only fill if current value is missing
                        if df.loc[mask, prop].isna().any():
                            df.loc[mask, prop] = val
                            compound_props.append(prop)
                            properties_added += 1

            # Calculate Kelvin from Celsius
            if pd.notna(row.get('Tm_C')) and 'Tm_K' in df.columns:
                if df.loc[mask, 'Tm_K'].isna().any():
                    df.loc[mask, 'Tm_K'] = row['Tm_C'] + 273.15

            if pd.notna(row.get('Tb_C')) and 'Tb_K' in df.columns:
                if df.loc[mask, 'Tb_K'].isna().any():
                    df.loc[mask, 'Tb_K'] = row['Tb_C'] + 273.15

            if compound_props:
                compounds_enriched += 1
                print(f"  ✅ {formula:15s} - Added: {', '.join(compound_props)}")

        print(f"\n📊 {label} Summary:")
        print(f"   Compounds enriched: {compounds_enriched}")
        print(f"   Properties added: {properties_added}")

        return df, compounds_enriched, properties_added

    # Enrich both dataframes
    df_anh, comp_anh, prop_anh = merge_manual_data(df_anh, manual_df, "Anhydrous")
    df_hyd, comp_hyd, prop_hyd = merge_manual_data(df_hyd, manual_df, "Hydrates")

    # Save enriched files
    print("\n💾 Saving enriched files...")
    timestamp = datetime.now().strftime('%Y%m%d')
    anh_file = f'../library/processed_data/thermophysical_comprehensive_anhydrous_{timestamp}_enriched_manual.csv'
    hyd_file = f'../library/processed_data/thermophysical_comprehensive_hydrates_{timestamp}_enriched_manual.csv'

    df_anh.to_csv(anh_file, index=False)
    df_hyd.to_csv(hyd_file, index=False)

    print(f"✅ Saved enriched files:")
    print(f"   {anh_file}")
    print(f"   {hyd_file}")

    # Coverage report
    print("\n" + "=" * 80)
    print("COVERAGE IMPROVEMENT REPORT (Anhydrous)")
    print("=" * 80)

    print(f"\n{'Property':<30s} {'Count':<10s} {'Percentage':<15s}")
    print("-" * 60)

    for prop in ['CAS', 'Tm_C', 'Tb_C', 'Td_C', 'density_g_per_cm3',
                 'Hfus_kJ_per_mol', 'Hfus_kJ_per_kg',
                 'Hvap_kJ_per_mol', 'Hvap_kJ_per_kg',
                 'thermal_conductivity_W_per_mK',
                 'hardness_Mohs', 'hardness_Vickers_MPa']:
        if prop in df_anh.columns:
            count = df_anh[prop].notna().sum()
            pct = count / len(df_anh) * 100
            print(f"{prop:<30s} {count:>3d}/{len(df_anh):<5d} {pct:>5.1f}%")

    print("\n" + "=" * 80)
    print("✅ ENRICHMENT COMPLETE!")
    print("=" * 80)

    print(f"\n📊 Total Summary:")
    print(f"   Compounds enriched: {comp_anh + comp_hyd}")
    print(f"   Properties added: {prop_anh + prop_hyd}")

    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())

