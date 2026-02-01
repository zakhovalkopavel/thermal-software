#!/usr/bin/env python3
"""
Merge PubChem fetched data into thermophysical database
Creates final enriched database files with all available data
"""

import pandas as pd
import sys
from datetime import datetime

def merge_pubchem_data(db_file, pubchem_file, output_file):
    """Merge PubChem data into database"""

    print(f"\n{'='*80}")
    print(f"MERGING PUBCHEM DATA: {db_file.split('/')[-1]}")
    print(f"{'='*80}\n")

    # Load database
    print("Loading database...")
    df_db = pd.read_csv(db_file)
    print(f"✅ Database: {len(df_db)} compounds")

    # Load PubChem data
    print("Loading PubChem data...")
    df_pubchem = pd.read_csv(pubchem_file)
    print(f"✅ PubChem: {len(df_pubchem)} compounds with data\n")

    # Columns to merge from PubChem
    # Map: PubChem column -> Database column
    pubchem_to_db_mapping = {
        'CID': 'CID_pubchem',
        'CAS': 'CAS',
        'color': 'color',
        'odor': 'odor',
        'solubility': 'solubility',
        'stability': 'stability',
        'toxicity_hazard': 'toxicity_hazard',
        'Tm_C_pubchem': 'Tm_C_pubchem',
        'Tb_C_pubchem': 'Tb_C_pubchem',
        'Td_C_pubchem': 'Td_C_pubchem',
        'density_g_per_cm3_pubchem': 'density_pubchem',
        'flash_point_C_pubchem': 'flash_point_C',
        'vapor_pressure_mmHg_pubchem': 'vapor_pressure_mmHg'
    }

    # Prepare PubChem data for merging
    df_pubchem_clean = df_pubchem[['formula'] + list(pubchem_to_db_mapping.keys())].copy()

    initial_coverage = {}
    final_coverage = {}

    # Track coverage before merge
    for pc_col, db_col in pubchem_to_db_mapping.items():
        if db_col in df_db.columns:
            initial_coverage[db_col] = df_db[db_col].notna().sum()

    # Merge on formula
    print("Merging data...")
    for idx, row in df_pubchem_clean.iterrows():
        formula = row['formula']

        # Find matching rows in database
        mask = df_db['formula'] == formula

        if mask.sum() == 0:
            continue

        # Merge each column
        for pc_col, db_col in pubchem_to_db_mapping.items():
            if pd.notna(row[pc_col]):
                # For CAS, only fill if empty
                if db_col == 'CAS':
                    df_db.loc[mask & df_db['CAS'].isna(), 'CAS'] = row[pc_col]
                # For other columns, add if column doesn't exist or fill if empty
                else:
                    if db_col not in df_db.columns:
                        df_db[db_col] = None
                    df_db.loc[mask & df_db[db_col].isna(), db_col] = row[pc_col]

    # Track coverage after merge
    for pc_col, db_col in pubchem_to_db_mapping.items():
        if db_col in df_db.columns:
            final_coverage[db_col] = df_db[db_col].notna().sum()

    #Calculate Tm_K and Tb_K from PubChem Celsius values if available
    if 'Tm_C_pubchem' in df_db.columns:
        mask = df_db['Tm_C_pubchem'].notna() & df_db['Tm_C'].isna()
        if mask.sum() > 0:
            df_db.loc[mask, 'Tm_C'] = df_db.loc[mask, 'Tm_C_pubchem']
            df_db.loc[mask, 'Tm_K'] = df_db.loc[mask, 'Tm_C_pubchem'] + 273.15

    if 'Tb_C_pubchem' in df_db.columns:
        mask = df_db['Tb_C_pubchem'].notna() & df_db['Tb_C'].isna()
        if mask.sum() > 0:
            df_db.loc[mask, 'Tb_C'] = df_db.loc[mask, 'Tb_C_pubchem']
            df_db.loc[mask, 'Tb_K'] = df_db.loc[mask, 'Tb_C_pubchem'] + 273.15

    if 'Td_C_pubchem' in df_db.columns:
        mask = df_db['Td_C_pubchem'].notna() & df_db['Td_C'].isna()
        if mask.sum() > 0:
            df_db.loc[mask, 'Td_C'] = df_db.loc[mask, 'Td_C_pubchem']

    if 'density_pubchem' in df_db.columns:
        mask = df_db['density_pubchem'].notna() & df_db['density_g_per_cm3'].isna()
        if mask.sum() > 0:
            df_db.loc[mask, 'density_g_per_cm3'] = df_db.loc[mask, 'density_pubchem']

    # Print improvement report
    print(f"\n{'='*80}")
    print("COVERAGE IMPROVEMENT REPORT")
    print(f"{'='*80}\n")

    print(f"{'Property':<30s} {'Before':<12s} {'After':<12s} {'Added':<10s}")
    print("-" * 70)

    for db_col in sorted(pubchem_to_db_mapping.values()):
        if db_col in initial_coverage:
            before = initial_coverage[db_col]
            after = final_coverage[db_col]
            added = after - before
            print(f"{db_col:<30s} {before:>5d} ({before/len(df_db)*100:>5.1f}%)  {after:>5d} ({after/len(df_db)*100:>5.1f}%)  +{added:>4d}")
        elif db_col in df_db.columns:
            after = df_db[db_col].notna().sum()
            print(f"{db_col:<30s} {'NEW':<12s} {after:>5d} ({after/len(df_db)*100:>5.1f}%)  +{after:>4d}")

    # Save merged database
    print(f"\n{'='*80}")
    print("SAVING ENRICHED DATABASE")
    print(f"{'='*80}\n")

    df_db.to_csv(output_file, index=False)
    print(f"✅ Saved: {output_file}")
    print(f"   Total compounds: {len(df_db)}")
    print(f"   Total columns: {len(df_db.columns)}")

    return df_db

def main():
    """Main execution"""

    print("\n" + "=" * 80)
    print("THERMOPHYSICAL DATABASE - PUBCHEM DATA INTEGRATION")
    print("=" * 80)

    timestamp = datetime.now().strftime('%Y%m%d')

    # Files
    pubchem_file = '../library/resources/data_sources/PubChem_bulk_fetch_20260128_041155.csv'

    anhydrous_input = '../library/processed_data/thermophysical_comprehensive_anhydrous_20260128_enriched_manual.csv'
    anhydrous_output = f'../library/processed_data/thermophysical_comprehensive_anhydrous_{timestamp}_final.csv'

    hydrates_input = '../library/processed_data/thermophysical_comprehensive_hydrates_20260128_enriched_manual.csv'
    hydrates_output = f'../library/processed_data/thermophysical_comprehensive_hydrates_{timestamp}_final.csv'

    # Check if PubChem file exists
    import os
    if not os.path.exists(pubchem_file):
        print(f"\n❌ PubChem data file not found: {pubchem_file}")
        print("   Please run bulk_pubchem_fetcher.py first")
        return 1

    # Merge anhydrous compounds
    df_anh = merge_pubchem_data(anhydrous_input, pubchem_file, anhydrous_output)

    # Merge hydrates
    df_hyd = merge_pubchem_data(hydrates_input, pubchem_file, hydrates_output)

    # Final summary
    print("\n" + "=" * 80)
    print("INTEGRATION COMPLETE!")
    print("=" * 80)

    print(f"\n📊 Final Database:")
    print(f"   Anhydrous: {len(df_anh)} compounds")
    print(f"   Hydrates: {len(df_hyd)} compounds")
    print(f"   Total: {len(df_anh) + len(df_hyd)} compounds")

    print(f"\n📁 Output Files:")
    print(f"   {anhydrous_output}")
    print(f"   {hydrates_output}")

    print(f"\n✅ Database ready for use!")
    print("\nNext steps:")
    print("  1. Review the enriched database files")
    print("  2. Verify data quality")
    print("  3. Use these files as your primary thermophysical database")

    return 0

if __name__ == '__main__':
    sys.exit(main())

