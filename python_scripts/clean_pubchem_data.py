#!/usr/bin/env python3
"""
Clean PubChem fetch file by removing rows with no actual data
(rows where only formula exists and all other fields are empty)
"""

import pandas as pd
import sys

def clean_pubchem_file(input_file, output_file):
    """Remove rows where no PubChem data was found"""

    print(f"Loading {input_file}...")
    df = pd.read_csv(input_file)

    initial_rows = len(df)
    print(f"Initial rows: {initial_rows}")

    # A row has actual data if at least one of these critical fields is not null:
    # CID, CAS, or any property column
    critical_columns = [
        'CID', 'CAS', 'color', 'Tb_C_pubchem', 'Tm_C_pubchem',
        'solubility', 'density_g_per_cm3_pubchem', 'stability',
        'vapor_pressure_mmHg_pubchem', 'Td_C_pubchem', 'flash_point_C_pubchem'
    ]

    # Keep rows where at least one critical column has data
    mask = df[critical_columns].notna().any(axis=1)
    df_clean = df[mask].copy()

    final_rows = len(df_clean)
    removed_rows = initial_rows - final_rows

    print(f"Final rows: {final_rows}")
    print(f"Removed rows (no data): {removed_rows}")

    # Save cleaned file
    df_clean.to_csv(output_file, index=False)
    print(f"\n✅ Saved cleaned file: {output_file}")

    # Show some statistics
    if final_rows > 0:
        print(f"\nData coverage in cleaned file:")
        print(f"  CID: {df_clean['CID'].notna().sum()} / {final_rows} ({df_clean['CID'].notna().sum()/final_rows*100:.1f}%)")
        print(f"  CAS: {df_clean['CAS'].notna().sum()} / {final_rows} ({df_clean['CAS'].notna().sum()/final_rows*100:.1f}%)")
        print(f"  Tm_C: {df_clean['Tm_C_pubchem'].notna().sum()} / {final_rows} ({df_clean['Tm_C_pubchem'].notna().sum()/final_rows*100:.1f}%)")
        print(f"  Color: {df_clean['color'].notna().sum()} / {final_rows} ({df_clean['color'].notna().sum()/final_rows*100:.1f}%)")
        print(f"  Solubility: {df_clean['solubility'].notna().sum()} / {final_rows} ({df_clean['solubility'].notna().sum()/final_rows*100:.1f}%)")
        print(f"  Stability: {df_clean['stability'].notna().sum()} / {final_rows} ({df_clean['stability'].notna().sum()/final_rows*100:.1f}%)")

    return df_clean

if __name__ == '__main__':
    input_file = '../library/resources/data_sources/PubChem_bulk_fetch_20260128_041155.csv'
    output_file = '../library/resources/data_sources/PubChem_bulk_fetch_20260128_041155_cleaned.csv'

    clean_pubchem_file(input_file, output_file)

    print("\n✅ Cleaning complete!")
    print(f"\nOriginal file preserved: {input_file}")
    print(f"Cleaned file created: {output_file}")

