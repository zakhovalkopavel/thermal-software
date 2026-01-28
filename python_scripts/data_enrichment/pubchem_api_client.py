"""
PubChem API Client - Fetch CAS numbers and compound data

Usage:
    from pubchem_api_client import PubChemAPIClient

    client = PubChemAPIClient()

    # Single compound
    cas = client.get_cas_by_formula('NaCl')
    print(cas)  # {'formula': 'NaCl', 'CAS': '7647-14-5', 'molar_mass': 58.44}

    # Bulk fetch
    formulas = ['NaCl', 'KCl', 'CaCO3', 'Al2O3']
    df = client.bulk_fetch_cas(formulas)
    df.to_csv('pubchem_cas_numbers.csv', index=False)
"""

import requests
import pandas as pd
import time
from typing import Dict, List, Optional


class PubChemAPIClient:
    """Client for PubChem REST API"""

    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    def __init__(self, delay=0.5):
        """
        Initialize PubChem API client

        Args:
            delay: Delay between requests in seconds (default: 0.5s, max 5 requests/second)
        """
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Thermophysical Data Processor)'
        })

    def get_compound_by_formula(self, formula: str) -> Optional[Dict]:
        """
        Get compound data from PubChem by molecular formula

        Args:
            formula: Molecular formula (e.g., 'NaCl', 'H2O', 'CaCO3')

        Returns:
            Dictionary with CAS, molecular weight, etc. or None if not found
        """
        # Clean formula (remove hydration notation if present)
        clean_formula = formula.split('·')[0].split('.')[0].strip()

        # PubChem API endpoint
        url = f"{self.BASE_URL}/compound/formula/{clean_formula}/property/IUPACName,MolecularWeight,MolecularFormula/JSON"

        try:
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                properties = data.get('PropertyTable', {}).get('Properties', [])

                if properties:
                    # Return first match (most common compound for that formula)
                    prop = properties[0]
                    return {
                        'formula': formula,
                        'CID': prop.get('CID'),
                        'IUPACName': prop.get('IUPACName'),
                        'molar_mass_pubchem': prop.get('MolecularWeight'),
                        'formula_pubchem': prop.get('MolecularFormula'),
                    }

            elif response.status_code == 404:
                print(f"  Not found in PubChem: {formula}")
            else:
                print(f"  Error {response.status_code} for {formula}")

        except Exception as e:
            print(f"  Exception for {formula}: {e}")

        return None

    def get_cas_by_cid(self, cid: int) -> Optional[str]:
        """
        Get CAS number for a compound by PubChem CID

        Args:
            cid: PubChem Compound ID

        Returns:
            CAS Registry Number as string or None
        """
        # Note: PubChem doesn't always have CAS in the main API
        # This is a workaround to get synonyms which often include CAS
        url = f"{self.BASE_URL}/compound/cid/{cid}/synonyms/JSON"

        try:
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                synonyms = data.get('InformationList', {}).get('Information', [])

                if synonyms:
                    syn_list = synonyms[0].get('Synonym', [])

                    # Look for CAS pattern: XXXXX-XX-X
                    import re
                    cas_pattern = r'^\d{2,7}-\d{2}-\d$'

                    for syn in syn_list:
                        if re.match(cas_pattern, str(syn)):
                            return str(syn)

        except Exception as e:
            print(f"  Exception getting CAS for CID {cid}: {e}")

        return None

    def get_full_data(self, formula: str) -> Optional[Dict]:
        """
        Get complete data including CAS number

        Args:
            formula: Molecular formula

        Returns:
            Dictionary with all available data
        """
        # First get basic compound data
        compound_data = self.get_compound_by_formula(formula)

        if compound_data and 'CID' in compound_data:
            # Then try to get CAS number
            cas = self.get_cas_by_cid(compound_data['CID'])
            if cas:
                compound_data['CAS'] = cas

            time.sleep(self.delay)  # Rate limiting

        return compound_data

    def bulk_fetch(self, formulas: List[str], get_cas=True) -> pd.DataFrame:
        """
        Fetch data for multiple formulas

        Args:
            formulas: List of molecular formulas
            get_cas: Whether to fetch CAS numbers (slower, requires extra request per compound)

        Returns:
            pandas DataFrame with compound data
        """
        results = []

        print(f"Fetching data for {len(formulas)} compounds from PubChem...")
        print(f"Rate limit: {1/self.delay:.1f} requests/second")
        print()

        for i, formula in enumerate(formulas, 1):
            print(f"[{i}/{len(formulas)}] {formula:15s} ", end='')

            if get_cas:
                data = self.get_full_data(formula)
            else:
                data = self.get_compound_by_formula(formula)

            if data:
                results.append(data)
                print("✅")
            else:
                print("❌")

            if i < len(formulas):
                time.sleep(self.delay)  # Rate limiting

        print(f"\nFetched {len(results)} / {len(formulas)} compounds")

        return pd.DataFrame(results)


# Example usage
if __name__ == '__main__':
    import sys

    # Test with common compounds
    test_formulas = [
        'NaCl', 'KCl', 'CaCO3', 'MgSO4', 'Al2O3',
        'SiO2', 'Fe2O3', 'TiO2', 'Na2SO4', 'CaSO4',
    ]

    client = PubChemAPIClient(delay=0.5)

    print("=" * 80)
    print("PubChem API Client - Test Run")
    print("=" * 80)

    # Fetch data
    df = client.bulk_fetch(test_formulas, get_cas=True)

    # Display results
    print("\nResults:")
    print(df[['formula', 'CAS', 'molar_mass_pubchem']].to_string(index=False))

    # Save to CSV
    output_file = '../../resources/data_sources/PubChem_test_data.csv'
    df.to_csv(output_file, index=False)
    print(f"\nSaved to: {output_file}")

