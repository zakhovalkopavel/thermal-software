#!/usr/bin/env python3
"""
Enhanced PubChem Data Fetcher
Fetches comprehensive thermophysical properties from PubChem:
- CAS Number
- Melting Point
- Boiling Point
- Density
- Flash Point
- Solubility
- Vapor Pressure
- And more experimental properties
"""

import requests
import pandas as pd
import time
import re
from typing import Dict, Optional, List

class EnhancedPubChemFetcher:
    """Enhanced PubChem API client with comprehensive property extraction"""

    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    def __init__(self, delay=0.5):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Thermophysical Data Processor)'
        })

    def get_compound_by_formula(self, formula: str) -> Optional[Dict]:
        """Get basic compound info by formula"""
        clean_formula = formula.split('·')[0].split('.')[0].strip()
        url = f"{self.BASE_URL}/compound/formula/{clean_formula}/property/MolecularWeight,MolecularFormula/JSON"

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                props = data.get('PropertyTable', {}).get('Properties', [])
                if props:
                    return props[0]
        except:
            pass
        return None

    def get_cas_from_synonyms(self, cid: int) -> Optional[str]:
        """Extract CAS number from synonyms"""
        url = f"{self.BASE_URL}/compound/cid/{cid}/synonyms/JSON"

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                synonyms = data.get('InformationList', {}).get('Information', [])
                if synonyms:
                    syn_list = synonyms[0].get('Synonym', [])
                    cas_pattern = r'^\d{2,7}-\d{2}-\d$'
                    for syn in syn_list:
                        if re.match(cas_pattern, str(syn)):
                            return str(syn)
        except:
            pass
        return None

    def extract_number(self, text: str, units: List[str] = None) -> Optional[float]:
        """Extract numerical value from text"""
        if not text:
            return None

        # Try to find number with optional units
        patterns = [
            r'(-?\d+\.?\d*)\s*(?:°C|deg\s*C)',  # Temperature in C
            r'(-?\d+\.?\d*)\s*(?:°F|deg\s*F)',  # Temperature in F
            r'(-?\d+\.?\d*)\s*g/cm',  # Density g/cm3
            r'(-?\d+\.?\d*)\s*g/mL',  # Density g/mL
            r'(-?\d+\.?\d*)',  # Just number
        ]

        for pattern in patterns:
            match = re.search(pattern, str(text))
            if match:
                try:
                    value = float(match.group(1))
                    # Convert F to C if needed
                    if '°F' in str(text) or 'deg F' in str(text):
                        value = (value - 32) * 5/9
                    return value
                except:
                    continue
        return None

    def get_experimental_properties(self, cid: int) -> Dict:
        """Fetch experimental properties from PubChem record"""
        url = f"{self.BASE_URL}/compound/cid/{cid}/JSON"
        properties = {}

        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return properties

            record = response.json()
            if 'Record' not in record:
                return properties

            # Navigate through sections to find experimental data
            sections = record['Record'].get('Section', [])

            for section in sections:
                heading = section.get('TOCHeading', '').lower()

                # Look for Chemical and Physical Properties section
                if 'chemical' in heading and 'physical' in heading:
                    self._extract_from_section(section, properties)

        except Exception as e:
            print(f"    Warning: Could not fetch experimental data for CID {cid}")

        return properties

    def _extract_from_section(self, section: Dict, properties: Dict):
        """Recursively extract properties from section"""

        # Check for subsections
        if 'Section' in section:
            for subsection in section['Section']:
                self._extract_from_section(subsection, properties)

        # Check for information items
        if 'Information' in section:
            for info in section['Information']:
                name = info.get('Name', '').lower()

                if 'Value' not in info:
                    continue

                value_data = info['Value']
                if 'StringWithMarkup' not in value_data:
                    continue

                # Extract text values
                texts = [item.get('String', '') for item in value_data['StringWithMarkup']]
                text = ' '.join(texts)

                # Extract melting point
                if 'melting' in name and 'point' in name:
                    properties['melting_point_text'] = text
                    value = self.extract_number(text)
                    if value is not None:
                        properties['Tm_C_pubchem'] = value

                # Extract boiling point
                elif 'boiling' in name and 'point' in name:
                    properties['boiling_point_text'] = text
                    value = self.extract_number(text)
                    if value is not None:
                        properties['Tb_C_pubchem'] = value

                # Extract density
                elif 'density' in name:
                    properties['density_text'] = text
                    value = self.extract_number(text)
                    if value is not None:
                        properties['density_g_per_cm3_pubchem'] = value

                # Extract flash point
                elif 'flash' in name:
                    properties['flash_point_text'] = text
                    value = self.extract_number(text)
                    if value is not None:
                        properties['flash_point_C_pubchem'] = value

                # Extract vapor pressure
                elif 'vapor pressure' in name:
                    properties['vapor_pressure_text'] = text

                # Extract solubility
                elif 'solubility' in name:
                    if 'solubility_text' not in properties:
                        properties['solubility_text'] = text
                    else:
                        properties['solubility_text'] += '; ' + text

                # Extract decomposition
                elif 'decomp' in name:
                    properties['decomposition_text'] = text
                    value = self.extract_number(text)
                    if value is not None:
                        properties['Td_C_pubchem'] = value

    def fetch_comprehensive_data(self, formula: str) -> Optional[Dict]:
        """Fetch all available data for a compound"""
        print(f"  Fetching {formula:15s} ", end='', flush=True)

        # Get basic compound info
        basic = self.get_compound_by_formula(formula)
        if not basic:
            print("❌ Not found")
            return None

        cid = basic.get('CID')
        if not cid:
            print("❌ No CID")
            return None

        result = {
            'formula': formula,
            'CID': cid,
            'molar_mass': basic.get('MolecularWeight'),
        }

        # Get CAS number
        cas = self.get_cas_from_synonyms(cid)
        if cas:
            result['CAS'] = cas
            print(f"CAS:{cas:15s}", end=' ', flush=True)

        time.sleep(self.delay)

        # Get experimental properties
        exp_props = self.get_experimental_properties(cid)
        result.update(exp_props)

        # Show what was found
        found = []
        if 'Tm_C_pubchem' in result:
            found.append(f"Tm={result['Tm_C_pubchem']:.0f}°C")
        if 'Tb_C_pubchem' in result:
            found.append(f"Tb={result['Tb_C_pubchem']:.0f}°C")
        if 'density_g_per_cm3_pubchem' in result:
            found.append(f"ρ={result['density_g_per_cm3_pubchem']:.2f}")

        if found:
            print(f"✅ {', '.join(found)}")
        else:
            print("✅ CAS only")

        return result

    def bulk_fetch(self, formulas: List[str]) -> pd.DataFrame:
        """Fetch data for multiple formulas"""
        results = []

        print(f"\n🌐 Fetching comprehensive data from PubChem")
        print(f"   Formulas: {len(formulas)}")
        print(f"   Rate: ~{1/self.delay:.0f} req/sec")
        print(f"   Est. time: {len(formulas) * self.delay / 60:.1f} min\n")

        for i, formula in enumerate(formulas, 1):
            print(f"[{i:3d}/{len(formulas)}] ", end='')

            data = self.fetch_comprehensive_data(formula)
            if data:
                results.append(data)

            if i < len(formulas):
                time.sleep(self.delay)

        print(f"\n✅ Fetched {len(results)}/{len(formulas)} compounds")

        return pd.DataFrame(results)


if __name__ == '__main__':
    import sys
    from datetime import datetime

    # Test with a few compounds
    test_formulas = ['NaBr', 'KBr', 'LiBr', 'MgBr2', 'CaBr2',
                     'NaI', 'KI', 'LiI',
                     'Li2CO3', 'ZnCO3']

    fetcher = EnhancedPubChemFetcher(delay=0.5)
    df = fetcher.bulk_fetch(test_formulas)

    # Save results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output = f'../library/resources/data_sources/PubChem_enhanced_{timestamp}.csv'
    df.to_csv(output, index=False)

    print(f"\n💾 Saved: {output}")
    print(f"\n📊 Summary:")
    print(f"   Total: {len(df)}")
    print(f"   With CAS: {df['CAS'].notna().sum()}")
    if 'Tm_C_pubchem' in df.columns:
        print(f"   With Tm: {df['Tm_C_pubchem'].notna().sum()}")
    if 'Tb_C_pubchem' in df.columns:
        print(f"   With Tb: {df['Tb_C_pubchem'].notna().sum()}")
    if 'density_g_per_cm3_pubchem' in df.columns:
        print(f"   With density: {df['density_g_per_cm3_pubchem'].notna().sum()}")

    print(f"\n📋 Sample data:")
    print(df[['formula', 'CAS', 'Tm_C_pubchem', 'Tb_C_pubchem', 'density_g_per_cm3_pubchem']].head(10))

