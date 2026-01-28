#!/usr/bin/env python3
"""
Bulk PubChem Data Fetcher for All Database Compounds
- Uses proxy support
- Proper timeouts
- Rate limiting
- Extracts comprehensive experimental properties
- Saves progress incrementally
"""

import requests
import pandas as pd
import time
import sys
import os
from datetime import datetime
from extract_experimental_properties import extract_experimental_data

class BulkPubChemFetcher:
    """Fetch comprehensive data for all compounds with proxy support"""

    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    def __init__(self, delay=0.5, timeout=20, proxy=None):
        self.delay = delay
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Set proxy if provided
        if proxy:
            self.session.proxies = {
                'http': proxy,
                'https': proxy
            }
            print(f"Using proxy: {proxy}")

    def get_cid_by_name(self, formula):
        """Get CID by searching formula/name"""
        url = f"{self.BASE_URL}/compound/name/{formula}/property/MolecularFormula/JSON"

        try:
            response = self.session.get(url, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                props = data.get('PropertyTable', {}).get('Properties', [])
                if props:
                    return props[0].get('CID')
        except Exception as e:
            print(f"      Error getting CID: {e}")

        return None

    def get_cas_number(self, cid):
        """Get CAS number from synonyms"""
        url = f"{self.BASE_URL}/compound/cid/{cid}/synonyms/JSON"

        try:
            response = self.session.get(url, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                synonyms = data.get('InformationList', {}).get('Information', [])
                if synonyms:
                    syn_list = synonyms[0].get('Synonym', [])

                    # Find CAS pattern
                    import re
                    cas_pattern = r'^\d{2,7}-\d{2}-\d$'
                    for syn in syn_list:
                        if re.match(cas_pattern, str(syn)):
                            return str(syn)
        except Exception as e:
            print(f"      Error getting CAS: {e}")

        return None

    def fetch_compound_complete(self, formula):
        """Fetch complete data for one compound"""
        print(f"  {formula:20s} ", end='', flush=True)

        # Step 1: Get CID
        cid = self.get_cid_by_name(formula)
        if not cid:
            print("❌ Not found in PubChem - skipping")
            return None  # Return None for not found compounds

        result = {'formula': formula, 'CID': cid}
        print(f"CID={cid:6d} ", end='', flush=True)

        time.sleep(self.delay)

        # Step 2: Get CAS number
        cas = self.get_cas_number(cid)
        if cas:
            result['CAS'] = cas
            print(f"CAS={cas:15s} ", end='', flush=True)
        else:
            print("CAS=N/A          ", end='', flush=True)

        time.sleep(self.delay)

        # Step 3: Get experimental properties using enhanced extractor
        print("")  # New line for property extraction output

        # Prepare proxies dict for extract_experimental_data
        proxies = None
        if self.session.proxies:
            proxies = self.session.proxies

        exp_props = extract_experimental_data(cid, formula, timeout=self.timeout, proxies=proxies)
        result.update(exp_props)

        return result

    def bulk_fetch(self, formulas, output_file, start_index=0, batch_size=50):
        """
        Fetch data for multiple compounds with incremental saves

        Args:
            formulas: List of chemical formulas
            output_file: Path to save results
            start_index: Index to start from (for resuming)
            batch_size: Save after this many compounds
        """
        total = len(formulas)
        results = []

        print("=" * 80)
        print("BULK PUBCHEM DATA FETCHER")
        print("=" * 80)
        print(f"\nTotal compounds: {total}")
        print(f"Starting from: {start_index}")
        print(f"Batch size: {batch_size}")
        print(f"Rate: ~{1/self.delay:.1f} req/sec")
        print(f"Timeout: {self.timeout}s per request")
        print(f"Est. time: {(total - start_index) * self.delay * 3 / 60:.1f} minutes\n")

        # Load existing results if resuming
        if start_index > 0 and os.path.exists(output_file):
            try:
                existing_df = pd.read_csv(output_file)
                results = existing_df.to_dict('records')
                print(f"✅ Loaded {len(results)} existing results\n")
            except:
                print("⚠️  Could not load existing results, starting fresh\n")

        for i in range(start_index, total):
            formula = formulas[i]

            print(f"[{i+1:3d}/{total}]", end=' ')

            try:
                data = self.fetch_compound_complete(formula)
                if data is not None:  # Only add if found in PubChem
                    results.append(data)

            except Exception as e:
                print(f"  ❌ ERROR: {e}")
                # Don't add error entries

            # Save incrementally
            if (i + 1) % batch_size == 0 or (i + 1) == total:
                if results:  # Only save if we have results
                    df = pd.DataFrame(results)
                    df.to_csv(output_file, index=False)
                    print(f"\n💾 Saved {len(results)} results to {output_file}\n")

            # Rate limiting
            if i < total - 1:
                time.sleep(self.delay)

        return pd.DataFrame(results)

def main():
    """Main function to fetch data for all database compounds"""

    # Load database
    print("Loading database...")
    db_file = '../library/processed_data/thermophysical_comprehensive_anhydrous_20260128_enriched_manual.csv'

    try:
        df = pd.read_csv(db_file)
        print(f"✅ Loaded {len(df)} compounds from database\n")
    except Exception as e:
        print(f"❌ Error loading database: {e}")
        return 1

    # Get compounds missing data
    # Priority: compounds without CAS, Tm, Tb, or density
    missing_data = df[
        df['CAS'].isna() |
        df['Tm_C'].isna() |
        df['Tb_C'].isna() |
        df['density_g_per_cm3'].isna()
    ]

    formulas = missing_data['formula'].tolist()

    print(f"Compounds needing data: {len(formulas)}")
    print(f"Total in database: {len(df)}")
    print(f"Coverage before fetch:")
    print(f"  CAS: {df['CAS'].notna().sum()}/{len(df)} ({df['CAS'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  Tm:  {df['Tm_C'].notna().sum()}/{len(df)} ({df['Tm_C'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  Tb:  {df['Tb_C'].notna().sum()}/{len(df)} ({df['Tb_C'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  Density: {df['density_g_per_cm3'].notna().sum()}/{len(df)} ({df['density_g_per_cm3'].notna().sum()/len(df)*100:.1f}%)\n")

    # Setup output file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'../library/resources/data_sources/PubChem_bulk_fetch_{timestamp}.csv'

    # Optional: Set proxy (uncomment and configure if needed)
    # proxy = "http://proxy.example.com:8080"
    proxy = None

    # Create fetcher
    fetcher = BulkPubChemFetcher(
        delay=0.5,  # 2 requests per second (respectful)
        timeout=20,  # 20 second timeout
        proxy=proxy
    )

    # Fetch data
    # You can resume by setting start_index to where you left off
    start_index = 0
    batch_size = 50  # Save every 50 compounds

    print(f"\nStarting fetch...")
    print(f"Output: {output_file}\n")

    results_df = fetcher.bulk_fetch(
        formulas=formulas,
        output_file=output_file,
        start_index=start_index,
        batch_size=batch_size
    )

    # Final summary
    print("\n" + "=" * 80)
    print("FETCH COMPLETE")
    print("=" * 80)

    print(f"\n📊 Results Summary:")
    print(f"   Total fetched: {len(results_df)}")

    if 'CAS' in results_df.columns:
        cas_found = results_df['CAS'].notna().sum()
        print(f"   CAS found: {cas_found}/{len(results_df)} ({cas_found/len(results_df)*100:.1f}%)")

    if 'Tm_C_pubchem' in results_df.columns:
        tm_found = results_df['Tm_C_pubchem'].notna().sum()
        print(f"   Melting points: {tm_found}/{len(results_df)} ({tm_found/len(results_df)*100:.1f}%)")

    if 'Tb_C_pubchem' in results_df.columns:
        tb_found = results_df['Tb_C_pubchem'].notna().sum()
        print(f"   Boiling points: {tb_found}/{len(results_df)} ({tb_found/len(results_df)*100:.1f}%)")

    if 'density_g_per_cm3_pubchem' in results_df.columns:
        dens_found = results_df['density_g_per_cm3_pubchem'].notna().sum()
        print(f"   Density: {dens_found}/{len(results_df)} ({dens_found/len(results_df)*100:.1f}%)")

    if 'Td_C_pubchem' in results_df.columns:
        td_found = results_df['Td_C_pubchem'].notna().sum()
        print(f"   Decomposition: {td_found}/{len(results_df)} ({td_found/len(results_df)*100:.1f}%)")

    if 'vapor_pressure_mmHg_pubchem' in results_df.columns:
        vp_found = results_df['vapor_pressure_mmHg_pubchem'].notna().sum()
        print(f"   Vapor pressure: {vp_found}/{len(results_df)} ({vp_found/len(results_df)*100:.1f}%)")

    # Text properties
    text_props = ['color', 'solubility', 'stability', 'toxicity_hazard']
    print(f"\n📝 Text Properties:")
    for prop in text_props:
        if prop in results_df.columns:
            found = results_df[prop].notna().sum()
            print(f"   {prop:20s}: {found}/{len(results_df)} ({found/len(results_df)*100:.1f}%)")

    print(f"\n✅ Data saved to: {output_file}")
    print(f"\nNext steps:")
    print(f"  1. Review the results CSV")
    print(f"  2. Merge with main database using merge_pubchem_data.py")
    print(f"  3. Run enrichment again to update database")

    return 0

if __name__ == '__main__':
    sys.exit(main())

