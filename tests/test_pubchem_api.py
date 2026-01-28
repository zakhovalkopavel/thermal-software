#!/usr/bin/env python3
"""
Simple PubChem API Test - Shows how to use PubChem REST API
Usage: python3 test_pubchem_api.py
"""

import requests
import json

def test_pubchem_api():
    """Test PubChem API with NaBr example"""

    print("=" * 80)
    print("PUBCHEM API USAGE DEMONSTRATION - NaBr Example")
    print("=" * 80)

    # Step 1: Search by formula to get CID
    print("\nStep 1: Search by formula")
    print("-" * 40)
    formula = "NaBr"
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/formula/{formula}/property/MolecularWeight,MolecularFormula/JSON"
    print(f"URL: {url}")

    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            props = data.get('PropertyTable', {}).get('Properties', [])
            if props:
                cid = props[0].get('CID')
                print(f"✅ Found CID: {cid}")
                print(f"   Formula: {props[0].get('MolecularFormula')}")
                print(f"   Molecular Weight: {props[0].get('MolecularWeight')}")
                return cid
        else:
            print(f"❌ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def get_cas_number(cid):
    """Get CAS number from synonyms"""
    print(f"\nStep 2: Get CAS number")
    print("-" * 40)
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/synonyms/JSON"
    print(f"URL: {url}")

    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            synonyms = data.get('InformationList', {}).get('Information', [])
            if synonyms:
                syn_list = synonyms[0].get('Synonym', [])

                # Look for CAS pattern
                import re
                cas_pattern = r'^\d{2,7}-\d{2}-\d$'
                for syn in syn_list:
                    if re.match(cas_pattern, str(syn)):
                        print(f"✅ Found CAS: {syn}")
                        return syn

                print(f"⚠️  CAS not found, first 5 synonyms:")
                for syn in syn_list[:5]:
                    print(f"   - {syn}")
                return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def get_experimental_properties(cid):
    """Get experimental properties from full record"""
    print(f"\nStep 3: Get experimental properties")
    print("-" * 40)
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/JSON"
    print(f"URL: {url}")

    try:
        response = requests.get(url, timeout=15)
        print(f"Status: {response.status_code}")
        print(f"Response size: {len(response.content):,} bytes")

        if response.status_code == 200:
            data = response.json()

            if 'Record' not in data:
                print("❌ No Record found in response")
                return

            sections = data['Record'].get('Section', [])
            print(f"✅ Found {len(sections)} sections")

            # Find Chemical and Physical Properties
            for section in sections:
                heading = section.get('TOCHeading', '').lower()
                if 'chemical' in heading and 'physical' in heading:
                    print(f"\n   Found section: {section.get('TOCHeading')}")
                    extract_properties_from_section(section, level=1)

    except Exception as e:
        print(f"❌ Error: {e}")

def extract_properties_from_section(section, level=0):
    """Recursively extract and display properties"""
    indent = "   " * level

    # Check subsections
    if 'Section' in section:
        for subsection in section['Section']:
            heading = subsection.get('TOCHeading', '')
            if heading:
                print(f"{indent}▸ {heading}")
            extract_properties_from_section(subsection, level + 1)

    # Check information items
    if 'Information' in section:
        for info in section['Information']:
            name = info.get('Name', '')

            if 'Value' not in info:
                continue

            value_data = info['Value']
            if 'StringWithMarkup' in value_data:
                texts = [item.get('String', '') for item in value_data['StringWithMarkup']]
                value_str = ' '.join(texts)[:100]  # Limit length

                # Show interesting properties
                name_lower = name.lower()
                if any(keyword in name_lower for keyword in ['melting', 'boiling', 'density', 'decomp']):
                    print(f"{indent}  • {name}: {value_str}")

if __name__ == '__main__':
    # Run the test
    cid = test_pubchem_api()

    if cid:
        cas = get_cas_number(cid)
        get_experimental_properties(cid)

        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Formula: NaBr")
        print(f"CID: {cid}")
        print(f"CAS: {cas if cas else 'Not found'}")
        print("\n✅ PubChem API works! You can fetch:")
        print("   - CAS Registry Numbers")
        print("   - Melting/Boiling points (when available in experimental data)")
        print("   - Density (when available)")
        print("   - And many other properties")
        print("\nNote: Not all compounds have experimental property data.")
        print("      CAS numbers have best coverage (~70-80%).")
    else:
        print("\n❌ Failed to fetch data from PubChem")


