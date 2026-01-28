#!/usr/bin/env python3
"""
Improved PubChem Fetcher - Uses /name/ endpoint
Much simpler and gets all data in one call!

Example URL: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/NaBr/JSON
"""

import requests
import pandas as pd
import time
import re
from typing import Dict, Optional, List

class SimplePubChemFetcher:
    """Simplified PubChem fetcher using the /name/ endpoint"""

    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    def __init__(self, delay=0.5):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Thermophysical Data Processor)'
        })

    def fetch_by_name(self, name: str) -> Optional[Dict]:
        """
        Fetch compound data by name or formula
        Uses: /compound/name/{name}/JSON

        This is the BEST method - gets everything in one call!
        """
        url = f"{self.BASE_URL}/compound/name/{name}/JSON"

        try:
            response = self.session.get(url, timeout=15)

            if response.status_code != 200:
                return None

            data = response.json()

            if 'PC_Compounds' not in data or not data['PC_Compounds']:
                return None

            compound = data['PC_Compounds'][0]
            return self._extract_data(compound, name)

        except Exception as e:
            print(f"      Error: {e}")
            return None

    def _extract_data(self, compound: Dict, original_name: str) -> Dict:
        """Extract useful data from PubChem compound record"""

        result = {'formula': original_name}

        # Get CID
        if 'id' in compound and 'id' in compound['id']:
            result['CID'] = compound['id']['id'].get('cid')

        # Extract properties
        if 'props' in compound:
            for prop in compound['props']:
                urn = prop.get('urn', {})
                label = urn.get('label', '').lower()

                # Get value
                value = None
                if 'value' in prop:
                    val_obj = prop['value']
                    if 'sval' in val_obj:
                        value = val_obj['sval']
                    elif 'fval' in val_obj:
                        value = val_obj['fval']
                    elif 'ival' in val_obj:
                        value = val_obj['ival']

                if value is None:
                    continue

                # Map to our fields
                if label == 'iupac name':
                    result['IUPAC_name'] = value
                elif label == 'molecular formula':
                    result['molecular_formula'] = value
                elif label == 'molecular weight':
                    result['molar_mass'] = float(value)
                elif label == 'inchi':
                    result['InChI'] = value
                elif label == 'inchikey':
                    result['InChIKey'] = value
                elif label == 'canonical smiles':
                    result['SMILES'] = value

        # Get CAS from synonyms (if available in the compound data)
        # Note: Full /JSON endpoint doesn't always include all synonyms
        # We might need a separate call for CAS

        return result

    def get_cas_number(self, cid: int) -> Optional[str]:
        """Get CAS number from synonyms"""
        url = f"{self.BASE_URL}/compound/cid/{cid}/synonyms/JSON"

        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            data = response.json()
            synonyms = data.get('InformationList', {}).get('Information', [])

            if not synonyms:
                return None

            syn_list = synonyms[0].get('Synonym', [])

            # Find CAS pattern
            cas_pattern = r'^\d{2,7}-\d{2}-\d$'
            for syn in syn_list:
                if re.match(cas_pattern, str(syn)):
                    return str(syn)

            return None
        except:
            return None

    def get_experimental_properties(self, cid: int) -> Dict:
        """
        Fetch experimental properties using PUG View API
        URL: https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON/?response_type=display

        This endpoint has MUCH richer data including:
        - Melting Point
        - Boiling Point
        - Density
        - Flash Point
        - Solubility
        - And more!
        """
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON/?response_type=display"

        properties = {}

        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return properties

            data = response.json()

            if 'Record' not in data:
                return properties

            # Navigate through sections
            sections = data['Record'].get('Section', [])

            for section in sections:
                self._parse_section(section, properties)

            return properties

        except Exception as e:
            return properties

    def _parse_section(self, section: Dict, properties: Dict):
        """Recursively parse PUG View sections for experimental data"""

        heading = section.get('TOCHeading', '').lower()

        # Check subsections recursively
        if 'Section' in section:
            for subsection in section['Section']:
                self._parse_section(subsection, properties)

        # Extract information from this section
        if 'Information' in section:
            for info in section['Information']:
                self._extract_property(info, properties)

    def _extract_property(self, info: Dict, properties: Dict):
        """Extract specific property from information block"""

        name = info.get('Name', '').lower()

        if 'Value' not in info:
            return

        value_obj = info['Value']

        # Get string value
        value_str = None
        if 'StringWithMarkup' in value_obj:
            strings = value_obj['StringWithMarkup']
            if strings and isinstance(strings, list):
                value_str = strings[0].get('String', '')
        elif 'Number' in value_obj:
            numbers = value_obj['Number']
            if numbers and isinstance(numbers, list):
                value_str = str(numbers[0])

        if not value_str:
            return

        # Extract melting point
        if 'melting' in name and 'point' in name:
            properties['melting_point_text'] = value_str
            temp = self._extract_temperature(value_str)
            if temp is not None:
                properties['Tm_C_pubchem'] = temp

        # Extract boiling point
        elif 'boiling' in name and 'point' in name:
            properties['boiling_point_text'] = value_str
            temp = self._extract_temperature(value_str)
            if temp is not None:
                properties['Tb_C_pubchem'] = temp

        # Extract density
        elif 'density' in name and 'point' not in name:
            properties['density_text'] = value_str
            density = self._extract_density(value_str)
            if density is not None:
                properties['density_g_per_cm3_pubchem'] = density

        # Extract flash point
        elif 'flash' in name and 'point' in name:
            properties['flash_point_text'] = value_str
            temp = self._extract_temperature(value_str)
            if temp is not None:
                properties['flash_point_C_pubchem'] = temp

        # Extract decomposition
        elif 'decomp' in name:
            properties['decomposition_text'] = value_str
            temp = self._extract_temperature(value_str)
            if temp is not None:
                properties['Td_C_pubchem'] = temp

        # Extract solubility
        elif 'solubility' in name:
            if 'solubility_text' not in properties:
                properties['solubility_text'] = value_str
            else:
                properties['solubility_text'] += '; ' + value_str

    def _extract_temperature(self, text: str) -> Optional[float]:
        """Extract temperature value from text and convert to Celsius"""

        # Try Celsius first
        match = re.search(r'(-?\d+(?:\.\d+)?)\s*(?:°C|deg\s*C|degrees?\s*C)', text, re.IGNORECASE)
        if match:
            return float(match.group(1))

        # Try Fahrenheit (convert to Celsius)
        match = re.search(r'(-?\d+(?:\.\d+)?)\s*(?:°F|deg\s*F|degrees?\s*F)', text, re.IGNORECASE)
        if match:
            f_temp = float(match.group(1))
            return (f_temp - 32) * 5 / 9

        # Try Kelvin (convert to Celsius)
        match = re.search(r'(-?\d+(?:\.\d+)?)\s*K', text)
        if match:
            k_temp = float(match.group(1))
            return k_temp - 273.15

        # Just a number (assume Celsius)
        match = re.search(r'(-?\d+(?:\.\d+)?)', text)
        if match:
            return float(match.group(1))

        return None

    def _extract_density(self, text: str) -> Optional[float]:
        """Extract density value from text"""

        # Try g/cm3 or g/mL
        match = re.search(r'(\d+(?:\.\d+)?)\s*(?:g/cm3|g/mL|g\s*/\s*cm)', text, re.IGNORECASE)
        if match:
            return float(match.group(1))

        # Try kg/m3 (convert to g/cm3)
        match = re.search(r'(\d+(?:\.\d+)?)\s*kg/m', text, re.IGNORECASE)
        if match:
            return float(match.group(1)) / 1000

        # Just a number
        match = re.search(r'(\d+(?:\.\d+)?)', text)
        if match:
            return float(match.group(1))

        return None

    def fetch_complete(self, name: str) -> Optional[Dict]:
        """Fetch compound with CAS number AND experimental properties"""
        print(f"  {name:15s} ", end='', flush=True)

        # Get basic data
        data = self.fetch_by_name(name)

        if not data:
            print("❌ Not found")
            return None

        cid = data.get('CID')
        if not cid:
            print("❌ No CID")
            return None

        print(f"CID={cid:6d} ", end='', flush=True)

        # Get CAS number
        time.sleep(self.delay)
        cas = self.get_cas_number(cid)

        if cas:
            data['CAS'] = cas
            print(f"CAS={cas:15s} ", end='', flush=True)
        else:
            print("CAS=Not found   ", end='', flush=True)

        # Get experimental properties using PUG View API
        time.sleep(self.delay)
        exp_props = self.get_experimental_properties(cid)

        if exp_props:
            data.update(exp_props)

            # Show what we found
            found = []
            if 'Tm_C_pubchem' in exp_props:
                found.append(f"Tm={exp_props['Tm_C_pubchem']:.1f}°C")
            if 'Tb_C_pubchem' in exp_props:
                found.append(f"Tb={exp_props['Tb_C_pubchem']:.1f}°C")
            if 'density_g_per_cm3_pubchem' in exp_props:
                found.append(f"ρ={exp_props['density_g_per_cm3_pubchem']:.2f}")

            if found:
                print(f"✅ {', '.join(found)}")
            else:
                print("✅")
        else:
            print("✅")

        return data

    def bulk_fetch(self, names: List[str]) -> pd.DataFrame:
        """Fetch data for multiple compounds with experimental properties"""
        results = []

        print(f"\n🌐 Fetching from PubChem (3 API calls per compound)")
        print(f"   1. /compound/name/{'{name}'}/JSON - Basic properties")
        print(f"   2. /compound/cid/{'{cid}'}/synonyms/JSON - CAS number")
        print(f"   3. /pug_view/data/compound/{'{cid}'}/JSON - Experimental data")
        print(f"\n   Compounds: {len(names)}")
        print(f"   Rate: ~{1/self.delay:.0f} req/sec")
        print(f"   Est. time: {len(names) * self.delay * 3 / 60:.1f} min\n")

        for i, name in enumerate(names, 1):
            print(f"[{i:3d}/{len(names)}] ", end='')

            data = self.fetch_complete(name)
            if data:
                results.append(data)

            if i < len(names):
                time.sleep(self.delay)

        print(f"\n✅ Fetched {len(results)}/{len(names)} compounds")

        # Show summary of properties found
        if results:
            df_temp = pd.DataFrame(results)
            print(f"\n📊 Properties found:")
            if 'CAS' in df_temp.columns:
                print(f"   CAS numbers: {df_temp['CAS'].notna().sum()}/{len(results)}")
            if 'Tm_C_pubchem' in df_temp.columns:
                print(f"   Melting points: {df_temp['Tm_C_pubchem'].notna().sum()}/{len(results)}")
            if 'Tb_C_pubchem' in df_temp.columns:
                print(f"   Boiling points: {df_temp['Tb_C_pubchem'].notna().sum()}/{len(results)}")
            if 'density_g_per_cm3_pubchem' in df_temp.columns:
                print(f"   Density: {df_temp['density_g_per_cm3_pubchem'].notna().sum()}/{len(results)}")

        return pd.DataFrame(results)


if __name__ == '__main__':
    from datetime import datetime

    # Test with bromides and iodides (likely to have good data)
    test_compounds = [
        'NaBr', 'KBr', 'LiBr', 'MgBr2', 'CaBr2',
        'NaI', 'KI', 'LiI',
        'BaCl2', 'SrCl2',
    ]

    print("=" * 80)
    print("PUBCHEM FETCHER WITH EXPERIMENTAL PROPERTIES")
    print("Using PUG View API for melting point, boiling point, density, etc.")
    print("=" * 80)

    fetcher = SimplePubChemFetcher(delay=0.5)
    df = fetcher.bulk_fetch(test_compounds)

    # Save results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output = f'../library/resources/data_sources/PubChem_enhanced_{timestamp}.csv'
    df.to_csv(output, index=False)

    print(f"\n💾 Saved: {output}")

    print(f"\n📋 Detailed Results:")

    # Show key properties
    display_cols = ['formula', 'CAS', 'Tm_C_pubchem', 'Tb_C_pubchem', 'density_g_per_cm3_pubchem']
    available_cols = [col for col in display_cols if col in df.columns]

    if available_cols:
        print(df[available_cols].to_string(index=False))

    # Show text fields for first few compounds
    if len(df) > 0 and 'melting_point_text' in df.columns:
        print(f"\n📝 Sample experimental data text (first 3 compounds):")
        for i, row in df.head(3).iterrows():
            print(f"\n{row['formula']}:")
            if pd.notna(row.get('melting_point_text')):
                print(f"  Melting point: {row['melting_point_text'][:100]}")
            if pd.notna(row.get('boiling_point_text')):
                print(f"  Boiling point: {row['boiling_point_text'][:100]}")
            if pd.notna(row.get('density_text')):
                print(f"  Density: {row['density_text'][:100]}")

    print("\n✅ Test complete!")

