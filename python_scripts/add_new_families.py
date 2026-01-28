#!/usr/bin/env python3
"""
Complete workflow to add new anion or cation families to thermophysical database

This configurable script handles the complete workflow:
1. Extract compounds from manual data that match target anion/cation families
2. Add them to thermophysical database
3. Fetch PubChem data for new compounds
4. Merge PubChem data into the database
5. Create final updated database files

Configuration files:
    library/resources/anion_families.txt - Anion family patterns
    library/resources/cations.txt - Cation symbols and names

Usage:
    python3 add_new_families.py --anions nitrate nitrite bromide iodide
    python3 add_new_families.py --cations Ag Pb
    python3 add_new_families.py --anions arsenate --cations Hg
"""

import pandas as pd
import numpy as np
import sys
import os
import argparse
import glob
from datetime import datetime

# Add python_scripts to path
sys.path.insert(0, 'python_scripts')
from bulk_pubchem_fetcher import BulkPubChemFetcher

# Global cache for loaded configurations
_ANION_PATTERNS = None
_CATION_LIST = None

def safe_float(value):
    """Safely convert value to float, handling text like '444 (decomp)'"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        # Remove common text patterns
        value = value.strip()
        value = value.replace('(decomp)', '').replace('decomp', '').replace('(decomposes)', '')
        value = value.replace('°C', '').replace('°', '').replace('C', '').strip()
        try:
            return float(value)
        except (ValueError, AttributeError):
            return None
    return None

def load_anion_patterns(config_file='library/resources/anion_families.txt'):
    """Load anion family patterns from configuration file"""
    global _ANION_PATTERNS

    if _ANION_PATTERNS is not None:
        return _ANION_PATTERNS

    patterns = []
    with open(config_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            parts = line.split('\t')
            if len(parts) >= 3:
                pattern_str, anion_name, priority = parts[0], parts[1], int(parts[2])
                pattern_list = pattern_str.split('|')
                patterns.append((pattern_list, anion_name, priority))

    # Sort by priority (lower number = higher priority)
    patterns.sort(key=lambda x: x[2])
    _ANION_PATTERNS = patterns
    return patterns

def load_cations(config_file='library/resources/cations.txt'):
    """Load cation list from configuration file"""
    global _CATION_LIST

    if _CATION_LIST is not None:
        return _CATION_LIST

    cations = []
    with open(config_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            parts = line.split('\t')
            if len(parts) >= 2:
                symbol, name = parts[0], parts[1]
                cations.append(symbol)

    # Sort by length (descending) to match longer symbols first
    cations.sort(key=len, reverse=True)
    _CATION_LIST = cations
    return cations

def get_anion_family(formula):
    """Determine anion family from formula using configuration file"""
    patterns = load_anion_patterns()

    for pattern_list, anion_name, _ in patterns:
        for pattern in pattern_list:
            matched = False

            # Special handling for different patterns
            if pattern == 'O':
                # Oxide - only if ends with O or has O followed by number
                if formula.endswith('O') or formula.endswith('O2') or formula.endswith('O3') or formula.endswith('O4'):
                    # Make sure it's not part of another anion
                    if not any(x in formula for x in ['NO', 'SO', 'PO', 'CO', 'Cl', 'Br', 'I', 'Mo', 'W', 'Cr', 'Mn', 'As', 'V']):
                        matched = True
            elif pattern == 'S':
                # Sulfide - S without O
                if 'S' in formula and 'O' not in formula and 'Si' not in formula:
                    matched = True
            elif pattern == 'Br':
                # Bromide - Br without O or N
                if 'Br' in formula and 'O' not in formula:
                    matched = True
            elif pattern == 'I':
                # Iodide - I without O, N, Si, Ti, Ni, Li
                if 'I' in formula:
                    # Make sure it's not part of another element or anion
                    if not any(x in formula for x in ['O', 'N', 'Si', 'Ti', 'Ni', 'Li', 'Bi']):
                        matched = True
            elif pattern == 'Cl':
                # Chloride - Cl without O
                if 'Cl' in formula and 'O' not in formula:
                    matched = True
            elif pattern == 'F':
                # Fluoride - F without O
                if 'F' in formula and 'O' not in formula and 'Fe' not in formula:
                    matched = True
            elif pattern == 'C':
                # Carbide - C without O, N
                if 'C' in formula:
                    if not any(x in formula for x in ['O', 'N', 'Cr', 'Ca', 'Cu', 'Co', 'Cd', 'Ce', 'Cs']):
                        matched = True
            elif pattern == 'N':
                # Nitride - N without O, H, C, Br, I
                if 'N' in formula:
                    if not any(x in formula for x in ['O', 'H', 'C', 'Br', 'I', 'Mn', 'Sn', 'Zn', 'In']):
                        matched = True
            elif pattern == 'B':
                # Boride - B without O, Br
                if 'B' in formula and 'O' not in formula and 'Br' not in formula:
                    matched = True
            elif pattern == 'P':
                # Phosphide - P without O
                if 'P' in formula and 'O' not in formula and 'Pb' not in formula:
                    matched = True
            elif pattern == 'H':
                # Hydride - H in short formulas
                if 'H' in formula and len(formula) <= 3 and 'NH' not in formula:
                    matched = True
            else:
                # Standard pattern matching
                if pattern in formula:
                    matched = True

            if matched:
                return anion_name

    return None

def get_cation(formula):
    """Extract cation from formula using configuration file"""
    cations = load_cations()

    for cat in cations:
        if formula.startswith(cat):
            # Additional check for single-character cations
            if len(cat) == 1:
                if len(formula) > 1 and formula[1].islower():
                    continue
            return cat

    return 'Unknown'

def create_entry_from_manual(row, anion_family, cation, template_columns):
    """Create database entry from manual data row"""
    new_entry = {col: None for col in template_columns}

    # Safely extract temperature values
    Tm_C = safe_float(row.get('Tm_C'))
    Tb_C = safe_float(row.get('Tb_C'))
    Td_C = safe_float(row.get('Td_C'))

    new_entry.update({
        'cation': cation,
        'anion_family': anion_family,
        'formula': row['formula'],
        'base_formula': row['formula'],
        'hydration': 'anhydrous',
        'phase_at_25C': 'solid',
        'state_description': 'crystalline',
        'CAS': row.get('CAS'),
        'Tm_C': Tm_C,
        'Tm_K': Tm_C + 273.15 if Tm_C is not None else None,
        'Tb_C': Tb_C,
        'Tb_K': Tb_C + 273.15 if Tb_C is not None else None,
        'Td_C': Td_C,
        'density_g_per_cm3': safe_float(row.get('density_g_per_cm3')),
        'Hfus_kJ_per_mol': safe_float(row.get('Hfus_kJ_per_mol')),
        'Hvap_kJ_per_mol': safe_float(row.get('Hvap_kJ_per_mol')),
        'hardness_Mohs': safe_float(row.get('hardness_Mohs')),
        'thermal_conductivity_W_per_mK': safe_float(row.get('thermal_conductivity_W_per_mK')),
        'source_physical_properties': row.get('source', 'Manual entry'),
        'source_transition_temps': row.get('source', 'Manual entry'),
        'data_quality': 'A',
        'pressure_kPa': 101.325,
        'notes': row.get('notes', '')
    })
    return new_entry

def main():
    parser = argparse.ArgumentParser(
        description='Add new anion or cation families to thermophysical database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Add nitrate, nitrite, bromide, iodide families
  python3 add_new_families.py --anions nitrate nitrite bromide iodide

  # Add silver and lead cations
  python3 add_new_families.py --cations Ag Pb

  # Skip PubChem fetch
  python3 add_new_families.py --anions nitrate --skip-pubchem
        """
    )

    parser.add_argument('--anions', nargs='+',
                       help='Anion families to add (e.g., nitrate nitrite bromide iodide)')
    parser.add_argument('--cations', nargs='+',
                       help='Cations to add (e.g., Ag Pb Hg)')
    parser.add_argument('--skip-pubchem', action='store_true',
                       help='Skip PubChem data fetching')
    parser.add_argument('--input-db', default='library/processed_data/thermophysical_comprehensive_anhydrous_20260128.csv',
                       help='Input thermophysical database file')
    parser.add_argument('--output-db', default='library/processed_data/thermophysical_anhydrous.csv',
                       help='Output thermophysical database file')
    parser.add_argument('--manual-data', default='library/resources/data_sources/manual_data_entry.csv',
                       help='Manual data entry file')

    args = parser.parse_args()

    # Validate input
    if not args.anions and not args.cations:
        print("ERROR: Must specify at least --anions or --cations")
        parser.print_help()
        return 1

    target_anions = args.anions if args.anions else []
    target_cations = args.cations if args.cations else []

    print("=" * 80)
    print("ADD NEW FAMILIES TO THERMOPHYSICAL DATABASE")
    print("=" * 80)

    if target_anions:
        print(f"\n🎯 Target Anion Families: {', '.join(target_anions)}")
    if target_cations:
        print(f"🎯 Target Cations: {', '.join(target_cations)}")

    # Step 1: Load data
    print("\n" + "=" * 80)
    print("STEP 1: Loading Data")
    print("=" * 80)

    manual = pd.read_csv(args.manual_data)
    df_anh = pd.read_csv(args.input_db)

    # Also load hydrates file
    hydrates_input = args.input_db.replace('anhydrous', 'hydrates')
    df_hyd = pd.read_csv(hydrates_input)

    print(f"✅ Manual data: {len(manual)} entries")
    print(f"✅ Anhydrous DB: {len(df_anh)} compounds")
    print(f"✅ Hydrates DB: {len(df_hyd)} compounds")

    # Step 2: Find new compounds in manual data
    print("\n" + "=" * 80)
    print("STEP 2: Identifying New Compounds from Manual Data")
    print("=" * 80)

    new_rows = []
    for _, row in manual.iterrows():
        formula = row['formula']
        anion = get_anion_family(formula)
        cation = get_cation(formula)

        # Check if matches target criteria
        matches_anion = target_anions and anion in target_anions
        matches_cation = target_cations and cation in target_cations

        if (matches_anion or matches_cation) and formula not in df_anh['formula'].values:
            entry = create_entry_from_manual(row, anion, cation, df_anh.columns)
            new_rows.append(entry)

    print(f"✅ Found {len(new_rows)} new compounds to add")

    if new_rows:
        df_new = pd.DataFrame(new_rows)

        if target_anions:
            print("\n📊 By anion family:")
            for anion in target_anions:
                count = (df_new['anion_family'] == anion).sum()
                if count > 0:
                    print(f"   {anion:15s}: {count:3d} compounds")

        if target_cations:
            print("\n📊 By cation:")
            for cation in target_cations:
                count = (df_new['cation'] == cation).sum()
                if count > 0:
                    print(f"   {cation:15s}: {count:3d} compounds")
    else:
        print("\n⚠️  No new compounds found matching criteria")
        return 0

    # Step 3: Fetch PubChem data
    if not args.skip_pubchem:
        print("\n" + "=" * 80)
        print("STEP 3: Fetching PubChem Data")
        print("=" * 80)

        formulas = df_new['formula'].tolist()
        print(f"Fetching data for {len(formulas)} compounds...")
        print("(This may take several minutes...)")

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_output = f'library/resources/data_sources/PubChem_new_temp_{timestamp}.csv'

        fetcher = BulkPubChemFetcher(delay=0.5, timeout=20, proxy=None)
        results_df = fetcher.bulk_fetch(
            formulas=formulas,
            output_file=temp_output,
            start_index=0,
            batch_size=20
        )

        print(f"\n✅ Fetched PubChem data for {len(results_df)} compounds")

        # Step 4: Merge with existing PubChem file
        print("\n" + "=" * 80)
        print("STEP 4: Updating PubChem Bulk Fetch File")
        print("=" * 80)

        pubchem_files = sorted(glob.glob('library/resources/data_sources/PubChem_bulk_fetch_*.csv'))

        if pubchem_files:
            pubchem_file = pubchem_files[-1]
            existing_pubchem = pd.read_csv(pubchem_file)
            print(f"   Existing file: {os.path.basename(pubchem_file)} ({len(existing_pubchem)} compounds)")

            # Combine and remove duplicates
            combined_pubchem = pd.concat([existing_pubchem, results_df], ignore_index=True)
            combined_pubchem = combined_pubchem.drop_duplicates(subset=['formula'], keep='last')

            # Save back
            combined_pubchem.to_csv(pubchem_file, index=False)
            print(f"✅ Updated: {len(combined_pubchem)} total compounds (+{len(results_df)})")
        else:
            # Create new file
            timestamp_file = datetime.now().strftime('%Y%m%d')
            pubchem_file = f'library/resources/data_sources/PubChem_bulk_fetch_{timestamp_file}.csv'
            results_df.to_csv(pubchem_file, index=False)
            combined_pubchem = results_df
            print(f"✅ Created: {os.path.basename(pubchem_file)} ({len(combined_pubchem)} compounds)")

        # Remove temp file
        if os.path.exists(temp_output):
            os.remove(temp_output)

        # Step 5: Merge PubChem data into new compounds
        print("\n" + "=" * 80)
        print("STEP 5: Enriching New Compounds with PubChem Data")
        print("=" * 80)

        # Add PubChem columns to df_new
        pubchem_cols = ['CID_pubchem', 'color', 'odor', 'solubility', 'stability', 'toxicity_hazard',
                        'Tm_C_pubchem', 'Tb_C_pubchem', 'Td_C_pubchem', 'density_pubchem',
                        'flash_point_C', 'vapor_pressure_mmHg']

        for col in pubchem_cols:
            if col not in df_new.columns:
                df_new[col] = None

        # Merge PubChem data
        merged_count = 0
        for _, row in combined_pubchem.iterrows():
            formula = row['formula']
            mask = df_new['formula'] == formula

            if mask.sum() > 0:
                if pd.notna(row.get('CID')):
                    df_new.loc[mask, 'CID_pubchem'] = row['CID']
                if pd.notna(row.get('CAS')) and df_new.loc[mask, 'CAS'].isna().all():
                    df_new.loc[mask, 'CAS'] = row['CAS']
                if pd.notna(row.get('color')):
                    df_new.loc[mask, 'color'] = row['color']
                if pd.notna(row.get('solubility')):
                    df_new.loc[mask, 'solubility'] = row['solubility']
                if pd.notna(row.get('stability')):
                    df_new.loc[mask, 'stability'] = row['stability']
                if pd.notna(row.get('Tm_C_pubchem')):
                    df_new.loc[mask, 'Tm_C_pubchem'] = row['Tm_C_pubchem']
                    if df_new.loc[mask, 'Tm_C'].isna().all():
                        df_new.loc[mask, 'Tm_C'] = row['Tm_C_pubchem']
                        df_new.loc[mask, 'Tm_K'] = row['Tm_C_pubchem'] + 273.15
                merged_count += 1

        print(f"✅ Enriched {merged_count} compounds with PubChem data")
    else:
        print("\n⚠️  Skipped PubChem fetch")
        # Still need to add PubChem columns
        pubchem_cols = ['CID_pubchem', 'color', 'odor', 'solubility', 'stability', 'toxicity_hazard',
                        'Tm_C_pubchem', 'Tb_C_pubchem', 'Td_C_pubchem', 'density_pubchem',
                        'flash_point_C', 'vapor_pressure_mmHg']
        for col in pubchem_cols:
            if col not in df_new.columns:
                df_new[col] = None

    # Step 6: Merge into existing database
    print("\n" + "=" * 80)
    print("STEP 6: Merging into Thermophysical Database")
    print("=" * 80)

    # Ensure all PubChem columns exist in main database
    for col in pubchem_cols:
        if col not in df_anh.columns:
            df_anh[col] = None
        if col not in df_hyd.columns:
            df_hyd[col] = None

    # Align columns
    df_new = df_new[df_anh.columns]

    # Combine
    df_anh_updated = pd.concat([df_anh, df_new], ignore_index=True)

    # Step 7: Save final database
    print("\n" + "=" * 80)
    print("STEP 7: Saving Final Database")
    print("=" * 80)

    df_anh_updated.to_csv(args.output_db, index=False)

    # Also save hydrates (unchanged but with PubChem columns)
    hydrates_output = args.output_db.replace('anhydrous', 'hydrates')
    df_hyd.to_csv(hydrates_output, index=False)

    print(f"✅ Anhydrous: {args.output_db}")
    print(f"   {len(df_anh_updated)} compounds (+{len(df_new)} new)")
    print(f"✅ Hydrates: {hydrates_output}")
    print(f"   {len(df_hyd)} compounds")

    # Final summary
    print("\n" + "=" * 80)
    print("✅ UPDATE COMPLETE!")
    print("=" * 80)

    if target_anions:
        print(f"\n📊 Anion Families Added:")
        for anion in target_anions:
            count = (df_new['anion_family'] == anion).sum()
            if count > 0:
                print(f"   {anion:15s}: {count:3d} compounds")

    if target_cations:
        print(f"\n📊 Cations Added:")
        for cation in target_cations:
            count = (df_new['cation'] == cation).sum()
            if count > 0:
                print(f"   {cation:15s}: {count:3d} compounds")

    print(f"\n📁 Files Updated:")
    print(f"   ✅ {args.output_db}")
    print(f"   ✅ {hydrates_output}")
    if not args.skip_pubchem and 'pubchem_file' in locals():
        print(f"   ✅ {pubchem_file}")

    return 0

if __name__ == '__main__':
    sys.exit(main())

