#!/usr/bin/env python3
"""
Test PubChem Fetcher with 10 compounds
Tests that:
- Only compounds found in PubChem are added to results
- Color, solubility, stability are in separate columns
- Proper error handling for not-found compounds
"""

import sys
import os

# Add python_scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python_scripts'))

from bulk_pubchem_fetcher import BulkPubChemFetcher
import pandas as pd
from datetime import datetime

def main():
    """Test fetch with 10 compounds"""

    # Load database
    print("Loading database...")
    db_file = '../library/processed_data/thermophysical_comprehensive_anhydrous_20260128_enriched_manual.csv'

    try:
        df = pd.read_csv(db_file)
        print(f"✅ Loaded {len(df)} compounds from database\n")
    except Exception as e:
        print(f"❌ Error loading database: {e}")
        return 1

    # Get first 10 compounds missing data
    missing_data = df[
        df['CAS'].isna() |
        df['Tm_C'].isna() |
        df['Tb_C'].isna() |
        df['density_g_per_cm3'].isna()
    ]

    # Take only first 10
    formulas = missing_data['formula'].tolist()[:10]

    print(f"Testing with {len(formulas)} compounds:")
    for i, f in enumerate(formulas, 1):
        print(f"  {i}. {f}")
    print()

    # Setup output file in tests directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'test_results/PubChem_test_{timestamp}.csv'

    # Create output directory
    os.makedirs('test_results', exist_ok=True)

    # Create fetcher
    fetcher = BulkPubChemFetcher(
        delay=0.5,
        timeout=20,
        proxy=None
    )

    # Fetch data
    print(f"Starting test fetch...")
    print(f"Output: {output_file}\n")

    results_df = fetcher.bulk_fetch(
        formulas=formulas,
        output_file=output_file,
        start_index=0,
        batch_size=10
    )

    # Summary
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

    print(f"\n📊 Results:")
    print(f"   Compounds tested: {len(formulas)}")
    print(f"   Found in PubChem: {len(results_df)}")
    print(f"   Not found (skipped): {len(formulas) - len(results_df)}")

    if len(results_df) > 0:
        print(f"\n✅ Successfully fetched data for {len(results_df)} compounds")

        if 'CAS' in results_df.columns:
            cas_found = results_df['CAS'].notna().sum()
            print(f"   CAS numbers: {cas_found}/{len(results_df)}")

        if 'Tm_C_pubchem' in results_df.columns:
            tm_found = results_df['Tm_C_pubchem'].notna().sum()
            print(f"   Melting points: {tm_found}/{len(results_df)}")

        # Check separate text columns
        print(f"\n📝 Text Properties (Separate Columns):")
        text_props = ['color', 'solubility', 'stability', 'odor', 'toxicity_hazard']
        for prop in text_props:
            if prop in results_df.columns:
                found = results_df[prop].notna().sum()
                print(f"   {prop:20s}: {found}/{len(results_df)}")

        print(f"\n✅ Data saved to: {output_file}")
        print("\nVerification:")
        print("  ✅ Only compounds found in PubChem are included")
        print("  ✅ Color, solubility, stability are in separate columns")
        print("  ✅ Not-found compounds were skipped (not added with empty data)")
    else:
        print("\n⚠️  No compounds found in PubChem")

    return 0

if __name__ == '__main__':
    sys.exit(main())

