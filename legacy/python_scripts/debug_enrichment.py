#!/usr/bin/env python3
"""Debug script to test enrichment"""

import pandas as pd
import os
import sys

print("=" * 80)
print("DEBUG: Testing Enrichment Script")
print("=" * 80)

# Check current directory
print(f"\nCurrent directory: {os.getcwd()}")

# Check if database files exist
print("\nChecking for database files...")
import glob
anh_files = glob.glob('../library/processed_data/thermophysical_comprehensive_anhydrous_*.csv')
hyd_files = glob.glob('../library/processed_data/thermophysical_comprehensive_hydrates_*.csv')

print(f"Anhydrous files found: {len(anh_files)}")
if anh_files:
    print(f"  Latest: {anh_files[-1]}")

print(f"Hydrate files found: {len(hyd_files)}")
if hyd_files:
    print(f"  Latest: {hyd_files[-1]}")

# Check manual data file
print("\nChecking for manual data file...")
manual_file = '../library/resources/data_sources/manual_data_entry.csv'
print(f"Looking for: {manual_file}")
print(f"Exists: {os.path.exists(manual_file)}")

if os.path.exists(manual_file):
    print("\nReading manual data file...")
    try:
        df_manual = pd.read_csv(manual_file, comment='#')
        print(f"✅ Loaded {len(df_manual)} rows")
        print(f"Columns: {list(df_manual.columns)}")
        print(f"\nFirst few formulas:")
        for formula in df_manual['formula'].head(5):
            print(f"  - {formula}")
    except Exception as e:
        print(f"❌ Error reading file: {e}")

# Try loading database
if anh_files:
    print(f"\nTrying to load database: {anh_files[-1]}")
    try:
        df = pd.read_csv(anh_files[-1])
        print(f"✅ Loaded {len(df)} compounds")
        print(f"Columns: {len(df.columns)}")

        # Check if CAS column exists
        if 'CAS' in df.columns:
            missing_cas = df['CAS'].isna().sum()
            print(f"Missing CAS numbers: {missing_cas}/{len(df)}")

        # Check if some formulas from manual data exist
        if os.path.exists(manual_file):
            df_manual = pd.read_csv(manual_file, comment='#')
            test_formulas = ['NaCl', 'Al2O3', 'SiO2']
            print(f"\nChecking test formulas in database:")
            for formula in test_formulas:
                if formula in df_manual['formula'].values:
                    in_db = formula in df['formula'].values
                    print(f"  {formula}: {'✅ In DB' if in_db else '❌ NOT in DB'}")

    except Exception as e:
        print(f"❌ Error loading database: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 80)
print("DEBUG: Complete")
print("=" * 80)

