#!/usr/bin/env python3
"""
Fetch data from PubChem and save to resources
This creates a local cache of PubChem data for our compounds
"""

import pandas as pd
import sys
import os
from datetime import datetime

sys.path.insert(0, '.')
from data_enrichment.pubchem_api_client import PubChemAPIClient

def main():
    print("=" * 80)
    print("PUBCHEM DATA FETCHING")
    print("=" * 80)

    # Load current database
    print("\n📂 Loading database...")
    df_anh = pd.read_csv('../library/processed_data/thermophysical_comprehensive_anhydrous_20260128_enriched_manual.csv')
    df_hyd = pd.read_csv('../library/processed_data/thermophysical_comprehensive_hydrates_20260128_enriched_manual.csv')

    all_compounds = pd.concat([df_anh, df_hyd], ignore_index=True)

    # Get compounds missing CAS
    missing_cas = all_compounds[all_compounds['CAS'].isna()]['formula'].unique().tolist()

    print(f"✅ Total compounds: {len(all_compounds)}")
    print(f"   With CAS: {all_compounds['CAS'].notna().sum()}")
    print(f"   Missing CAS: {len(missing_cas)}")

    # Limit to first 100 for now (can run multiple times)
    fetch_limit = min(100, len(missing_cas))
    formulas_to_fetch = missing_cas[:fetch_limit]

    print(f"\n🌐 Fetching from PubChem: {fetch_limit} compounds")
    print(f"   Rate: ~2 requests/second (respectful to PubChem)")
    print(f"   Estimated time: {fetch_limit * 0.5 / 60:.1f} minutes\n")

    # Fetch from PubChem
    client = PubChemAPIClient(delay=0.5)
    pubchem_data = client.bulk_fetch(formulas_to_fetch, get_cas=True)

    # Save to resources
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'../library/resources/data_sources/PubChem_data_{timestamp}.csv'

    pubchem_data.to_csv(output_file, index=False)

    print(f"\n💾 Saved PubChem data:")
    print(f"   {output_file}")
    print(f"   {len(pubchem_data)} compounds fetched")

    # Show summary
    if not pubchem_data.empty:
        has_cas = pubchem_data['CAS'].notna().sum() if 'CAS' in pubchem_data.columns else 0
        print(f"\n📊 Summary:")
        print(f"   Compounds with CAS: {has_cas}/{len(pubchem_data)}")

    print("\n✅ PubChem fetch complete!")
    print("\nTo fetch more compounds, run this script again.")
    print("To merge with database, run: python3 manual_enrichment.py")

    return 0

if __name__ == '__main__':
    sys.exit(main())

