#!/usr/bin/env python3
"""
Master Data Enrichment Script

This script enriches the thermophysical database by:
1. Fetching CAS numbers from PubChem
2. Downloading data from NIST (if available)
3. Merging with CRC Handbook data (if available)
4. Updating the comprehensive database files

Usage:
    python3 enrich_database.py --source pubchem
    python3 enrich_database.py --source all
    python3 enrich_database.py --list-sources
"""

import pandas as pd
import os
import sys
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from data_enrichment.pubchem_api_client import PubChemAPIClient


def load_current_database(anhydrous_file=None, hydrates_file=None):
    """Load current database files"""

    # Find latest files if not specified
    if not anhydrous_file:
        data_dir = '../library/processed_data'
        import glob
        files = glob.glob(f'{data_dir}/thermophysical_comprehensive_anhydrous_*.csv')
        if files:
            anhydrous_file = sorted(files)[-1]  # Get latest

    if not hydrates_file:
        data_dir = '../library/processed_data'
        import glob
        files = glob.glob(f'{data_dir}/thermophysical_comprehensive_hydrates_*.csv')
        if files:
            hydrates_file = sorted(files)[-1]  # Get latest

    df_anh = pd.read_csv(anhydrous_file) if anhydrous_file and os.path.exists(anhydrous_file) else None
    df_hyd = pd.read_csv(hydrates_file) if hydrates_file and os.path.exists(hydrates_file) else None

    return df_anh, df_hyd


def enrich_with_manual_data(df):
    """Enrich database with manually entered data from CSV"""

    print("=" * 80)
    print("ENRICHING WITH MANUAL DATA ENTRY")
    print("=" * 80)

    manual_file = '../library/resources/data_sources/manual_data_entry.csv'

    if not os.path.exists(manual_file):
        print(f"\n⚠️  Manual data file not found: {manual_file}")
        print("   Skipping manual enrichment")
        return df

    # Load manual data
    try:
        manual_df = pd.read_csv(manual_file, comment='#')
        print(f"\n✅ Loaded manual data: {len(manual_df)} compounds")
    except Exception as e:
        print(f"\n❌ Error loading manual data: {e}")
        return df

    # Properties to merge
    properties_to_merge = [
        'CAS', 'Tm_C', 'Tb_C', 'density_g_per_cm3',
        'Hfus_kJ_per_mol', 'Hvap_kJ_per_mol',
        'thermal_conductivity_W_per_mK', 'hardness_Mohs'
    ]

    merged_count = 0

    for _, manual_row in manual_df.iterrows():
        formula = manual_row['formula']
        source = manual_row.get('source', 'Manual entry')

        # Find matching rows in main database
        mask = df['formula'] == formula

        if mask.sum() == 0:
            print(f"  ⚠️  {formula:15s} - Not found in database")
            continue

        # Merge properties
        properties_added = []

        for prop in properties_to_merge:
            if prop in manual_df.columns and prop in df.columns:
                manual_value = manual_row.get(prop)

                # Only fill if manual value exists and current value is missing
                if pd.notna(manual_value):
                    current_values = df.loc[mask, prop]

                    if current_values.isna().any():
                        df.loc[mask, prop] = manual_value
                        properties_added.append(prop)

                        # Update source
                        if 'source_physical_properties' in df.columns:
                            df.loc[mask, 'source_physical_properties'] = source

        if properties_added:
            merged_count += 1
            print(f"  ✅ {formula:15s} - Added: {', '.join(properties_added)}")
        else:
            print(f"  ➖ {formula:15s} - No new data (already complete)")

    print(f"\n✅ Enriched {merged_count} compounds with manual data")

    return df


def enrich_with_pubchem(df, delay=0.5):
    """Enrich database with PubChem data (CAS numbers mainly)"""

    print("=" * 80)
    print("ENRICHING WITH PUBCHEM DATA")
    print("=" * 80)

    # Get unique formulas that don't have CAS numbers
    formulas_needing_cas = df[df['CAS'].isna()]['formula'].unique().tolist()

    print(f"\nCompounds missing CAS numbers: {len(formulas_needing_cas)}")

    if len(formulas_needing_cas) == 0:
        print("✅ No compounds need CAS numbers!")
        return df

    print(f"Will fetch from PubChem (estimated time: {len(formulas_needing_cas) * delay / 60:.1f} minutes)\n")

    # Fetch from PubChem
    client = PubChemAPIClient(delay=delay)
    pubchem_data = client.bulk_fetch(formulas_needing_cas[:50], get_cas=True)  # Limit to 50 for now

    # Merge CAS numbers back
    if not pubchem_data.empty and 'CAS' in pubchem_data.columns:
        cas_map = pubchem_data.set_index('formula')['CAS'].to_dict()

        for formula, cas in cas_map.items():
            if cas:
                mask = (df['formula'] == formula) & df['CAS'].isna()
                df.loc[mask, 'CAS'] = cas
                df.loc[mask, 'source_physical_properties'] = 'PubChem API'

    cas_added = len([v for v in cas_map.values() if v])
    print(f"\n✅ Added {cas_added} CAS numbers from PubChem")

    return df


def save_enriched_database(df_anh, df_hyd, suffix='enriched'):
    """Save enriched database with timestamp"""

    timestamp = datetime.now().strftime('%Y%m%d')
    output_dir = '../library/processed_data'

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Save files
    anh_file = f'{output_dir}/thermophysical_comprehensive_anhydrous_{timestamp}_{suffix}.csv'
    hyd_file = f'{output_dir}/thermophysical_comprehensive_hydrates_{timestamp}_{suffix}.csv'

    df_anh.to_csv(anh_file, index=False)
    df_hyd.to_csv(hyd_file, index=False)

    print(f"\n✅ Saved enriched files:")
    print(f"   {anh_file}")
    print(f"   {hyd_file}")

    return anh_file, hyd_file


def print_coverage_report(df_before, df_after, properties):
    """Print coverage improvement report"""

    print("\n" + "=" * 80)
    print("COVERAGE IMPROVEMENT REPORT")
    print("=" * 80)

    print(f"\n{'Property':<30s} {'Before':<10s} {'After':<10s} {'Improvement':<15s}")
    print("-" * 70)

    for prop in properties:
        if prop in df_before.columns and prop in df_after.columns:
            before = df_before[prop].notna().sum()
            after = df_after[prop].notna().sum()
            total = len(df_before)

            before_pct = before / total * 100
            after_pct = after / total * 100
            improvement = after - before

            print(f"{prop:<30s} {before_pct:>5.1f}% ({before:>3d})  {after_pct:>5.1f}% ({after:>3d})  +{improvement:>3d} ({after_pct-before_pct:+.1f}%)")


def main():
    parser = argparse.ArgumentParser(description='Enrich thermophysical database with external sources')
    parser.add_argument('--source', choices=['pubchem', 'manual', 'nist', 'crc', 'all'], default='all',
                        help='Data source to use for enrichment')
    parser.add_argument('--anhydrous', help='Path to anhydrous CSV file')
    parser.add_argument('--hydrates', help='Path to hydrates CSV file')
    parser.add_argument('--limit', type=int, default=50, help='Limit number of compounds to fetch (for testing)')
    parser.add_argument('--list-sources', action='store_true', help='List available data sources')

    args = parser.parse_args()

    if args.list_sources:
        print("Available data sources:")
        print("  manual  - Manual data from CSV file (FREE, instant)")
        print("  pubchem - CAS numbers from PubChem (FREE, fast)")
        print("  nist    - Thermochemical data from NIST (FREE, slow) [NOT IMPLEMENTED YET]")
        print("  crc     - Physical constants from CRC Handbook (requires file) [NOT IMPLEMENTED YET]")
        print("  all     - All available sources (manual + pubchem)")
        return

    print("=" * 80)
    print("THERMOPHYSICAL DATABASE ENRICHMENT")
    print("=" * 80)

    # Load current database
    print("\nLoading current database...")
    df_anh, df_hyd = load_current_database(args.anhydrous, args.hydrates)

    if df_anh is None or df_hyd is None:
        print("❌ Error: Could not load database files")
        print("   Make sure to run thermophysical_data_processor.py first")
        return 1

    print(f"✅ Loaded:")
    print(f"   Anhydrous: {len(df_anh)} compounds")
    print(f"   Hydrates: {len(df_hyd)} compounds")

    # Make copies for comparison
    df_anh_before = df_anh.copy()
    df_hyd_before = df_hyd.copy()

    # Enrich based on source
    if args.source in ['manual', 'all']:
        df_anh = enrich_with_manual_data(df_anh)
        df_hyd = enrich_with_manual_data(df_hyd)

    if args.source in ['pubchem', 'all']:
        df_anh = enrich_with_pubchem(df_anh, delay=0.5)
        df_hyd = enrich_with_pubchem(df_hyd, delay=0.5)

    if args.source in ['nist']:
        print("\n⚠️  NIST enrichment not implemented yet")
        print("   Use manual data entry from NIST Chemistry WebBook instead")

    if args.source in ['crc']:
        print("\n⚠️  CRC Handbook enrichment not implemented yet")
        print("   Use manual data entry from CRC Handbook instead")

    # Calculate Tm_K and Tb_K from Celsius values
    for col_c, col_k in [('Tm_C', 'Tm_K'), ('Tb_C', 'Tb_K')]:
        if col_c in df_anh.columns and col_k in df_anh.columns:
            mask = df_anh[col_c].notna() & df_anh[col_k].isna()
            if mask.sum() > 0:
                df_anh.loc[mask, col_k] = df_anh.loc[mask, col_c] + 273.15

        if col_c in df_hyd.columns and col_k in df_hyd.columns:
            mask = df_hyd[col_c].notna() & df_hyd[col_k].isna()
            if mask.sum() > 0:
                df_hyd.loc[mask, col_k] = df_hyd.loc[mask, col_c] + 273.15

    # Save enriched database
    print("\n" + "=" * 80)
    print("SAVING ENRICHED DATABASE")
    print("=" * 80)

    save_enriched_database(df_anh, df_hyd, suffix=f'enriched_{args.source}')

    # Print coverage report
    properties_to_check = ['CAS', 'Tm_C', 'Tb_C', 'density_g_per_cm3', 'Hfus_kJ_per_mol', 'Hvap_kJ_per_mol', 'thermal_conductivity_W_per_mK']
    print_coverage_report(df_anh_before, df_anh, properties_to_check)

    print("\n✅ Enrichment complete!")
    return 0


if __name__ == '__main__':
    sys.exit(main())

