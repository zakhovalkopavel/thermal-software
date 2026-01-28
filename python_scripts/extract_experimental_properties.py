#!/usr/bin/env python3
"""
Working PubChem Experimental Data Extractor
Properly extracts: Melting Point, Boiling Point, Density, Decomposition
from PUG View API
"""

import requests
import json
import re
import time

def extract_experimental_data(cid, compound_name, timeout=20, proxies=None):
    """Extract experimental properties from PUG View API

    Args:
        cid: PubChem Compound ID
        compound_name: Name/formula of compound
        timeout: Request timeout in seconds (default 20)
        proxies: Optional proxy dict {'http': 'proxy_url', 'https': 'proxy_url'}
    """

    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON/?response_type=display"

    print(f"  Fetching experimental data for {compound_name} (CID={cid})...")

    try:
        response = requests.get(url, timeout=timeout, proxies=proxies)
        if response.status_code != 200:
            print(f"    ❌ Failed: {response.status_code}")
            return {}

        data = response.json()

        properties = {}

        # Navigate to Chemical and Physical Properties section
        if 'Record' not in data:
            print(f"    ⚠️  No Record in response")
            return {}

        record = data['Record']
        sections = record.get('Section', [])

        # Find Chemical and Physical Properties
        for section in sections:
            if 'Chemical' in section.get('TOCHeading', '') and 'Physical' in section.get('TOCHeading', ''):
                # Found it! Now drill down to Experimental Properties
                properties = extract_from_chemical_physical_section(section, compound_name)
                break

        return properties

    except Exception as e:
        print(f"    ❌ Error: {e}")
        return {}

def extract_from_chemical_physical_section(section, compound_name):
    """Extract properties from Chemical and Physical Properties section"""

    properties = {}

    # Look for subsections
    if 'Section' not in section:
        return properties

    for subsection in section['Section']:
        subsec_heading = subsection.get('TOCHeading', '')

        # Check Experimental Properties subsection
        if 'Experimental' in subsec_heading:
            extract_experimental_properties(subsection, properties, compound_name)

        # Also check Computed Properties (backup)
        elif 'Computed' in subsec_heading:
            extract_computed_properties(subsection, properties)

    return properties

def extract_experimental_properties(subsection, properties, compound_name):
    """Extract from Experimental Properties subsection"""

    if 'Section' not in subsection:
        return

    for prop_section in subsection['Section']:
        prop_heading = prop_section.get('TOCHeading', '').lower()

        # Get the information blocks
        if 'Information' in prop_section:
            for info in prop_section['Information']:
                extract_property_value(info, prop_heading, properties, compound_name)

def extract_property_value(info, section_heading, properties, compound_name):
    """Extract actual property value from information block"""

    name = info.get('Name', '').lower()

    if 'Value' not in info:
        return

    # Extract string value
    value_str = None
    value_obj = info['Value']

    if 'StringWithMarkup' in value_obj:
        markup_list = value_obj['StringWithMarkup']
        if markup_list and len(markup_list) > 0:
            value_str = markup_list[0].get('String', '')
    elif 'Number' in value_obj:
        numbers = value_obj['Number']
        if numbers and len(numbers) > 0:
            value_str = str(numbers[0])

    if not value_str:
        return

    # Match property types
    if 'melting' in name or 'melting' in section_heading:
        properties['melting_point_text'] = value_str
        temp = extract_temperature(value_str)
        if temp is not None:
            properties['Tm_C_pubchem'] = temp
            print(f"    ✅ Melting point: {temp}°C")

    elif 'boiling' in name or 'boiling' in section_heading:
        properties['boiling_point_text'] = value_str
        temp = extract_temperature(value_str)
        if temp is not None:
            properties['Tb_C_pubchem'] = temp
            print(f"    ✅ Boiling point: {temp}°C")

    elif 'density' in name or 'density' in section_heading:
        if 'vapor' not in name:  # Skip vapor density
            properties['density_text'] = value_str
            dens = extract_density(value_str)
            if dens is not None:
                properties['density_g_per_cm3_pubchem'] = dens
                print(f"    ✅ Density: {dens} g/cm³")

    elif 'decomp' in name or 'decomp' in section_heading:
        properties['decomposition_text'] = value_str
        temp = extract_temperature(value_str)
        if temp is not None:
            properties['Td_C_pubchem'] = temp
            print(f"    ✅ Decomposition: {temp}°C")
        else:
            # Even if no temperature, save the description
            print(f"    ℹ️  Decomposition info: {value_str[:60]}...")

    elif 'flash' in name or 'flash' in section_heading:
        properties['flash_point_text'] = value_str
        temp = extract_temperature(value_str)
        if temp is not None:
            properties['flash_point_C_pubchem'] = temp
            print(f"    ✅ Flash point: {temp}°C")

    elif 'vapor pressure' in name or 'vapor pressure' in section_heading:
        properties['vapor_pressure_text'] = value_str
        vp = extract_vapor_pressure(value_str)
        if vp is not None:
            properties['vapor_pressure_mmHg_pubchem'] = vp
            print(f"    ✅ Vapor pressure: {vp} mmHg")
        else:
            print(f"    ℹ️  Vapor pressure info: {value_str[:60]}...")

    elif 'color' in name or 'color' in section_heading or 'colour' in name:
        # SEPARATE COLUMN for color - NOT combined with odor!
        if 'color' not in properties:
            properties['color'] = value_str
        else:
            properties['color'] += '; ' + value_str
        print(f"    ✅ Color: {value_str[:60]}")

    elif 'odor' in name or 'odour' in name:
        # SEPARATE COLUMN for odor
        if 'odor' not in properties:
            properties['odor'] = value_str
        else:
            properties['odor'] += '; ' + value_str
        print(f"    ✅ Odor: {value_str[:60]}")

    elif 'solubility' in name or 'solubility' in section_heading:
        # SEPARATE COLUMN for solubility - this is TEXT describing solubility
        if 'solubility' not in properties:
            properties['solubility'] = value_str
        else:
            properties['solubility'] += '; ' + value_str
        print(f"    ✅ Solubility: {value_str[:60]}...")

    elif 'stability' in name or 'stability' in section_heading:
        # SEPARATE COLUMN for stability - this is TEXT describing stability
        if 'stability' not in properties:
            properties['stability'] = value_str
        else:
            properties['stability'] += '; ' + value_str
        print(f"    ✅ Stability: {value_str[:60]}...")

    elif any(word in name for word in ['toxic', 'hazard', 'safety', 'dangerous']):
        # SEPARATE COLUMN for toxicity/hazard information
        if 'toxicity_hazard' not in properties:
            properties['toxicity_hazard'] = value_str
        else:
            properties['toxicity_hazard'] += '; ' + value_str
        print(f"    ⚠️  Toxicity/Hazard: {value_str[:60]}...")

def extract_computed_properties(subsection, properties):
    """Extract from Computed Properties as backup"""

    if 'Section' not in subsection:
        return

    for prop_section in subsection['Section']:
        if 'Information' in prop_section:
            for info in prop_section['Information']:
                name = info.get('Name', '').lower()

                if 'molecular weight' in name and 'molar_mass_computed' not in properties:
                    if 'Value' in info and 'Number' in info['Value']:
                        numbers = info['Value']['Number']
                        if numbers:
                            properties['molar_mass_computed'] = numbers[0]

def extract_temperature(text):
    """Extract temperature and convert to Celsius"""

    # Celsius
    match = re.search(r'(-?\d+(?:\.\d+)?)\s*(?:°C|deg\s*C|degrees?\s*C)', text, re.IGNORECASE)
    if match:
        return float(match.group(1))

    # Fahrenheit -> Celsius
    match = re.search(r'(-?\d+(?:\.\d+)?)\s*(?:°F|deg\s*F|degrees?\s*F)', text, re.IGNORECASE)
    if match:
        f_temp = float(match.group(1))
        return round((f_temp - 32) * 5 / 9, 2)

    # Kelvin -> Celsius
    match = re.search(r'(-?\d+(?:\.\d+)?)\s*K(?:\s|$|,)', text)
    if match:
        k_temp = float(match.group(1))
        return round(k_temp - 273.15, 2)

    # Just number (assume Celsius)
    match = re.search(r'(-?\d+(?:\.\d+)?)', text)
    if match:
        return float(match.group(1))

    return None

def extract_density(text):
    """Extract density value"""

    # g/cm³ or g/mL
    match = re.search(r'(\d+(?:\.\d+)?)\s*(?:g/cm³|g/cm3|g/mL|g\s*/\s*cm)', text, re.IGNORECASE)
    if match:
        return float(match.group(1))

    # kg/m³ -> g/cm³
    match = re.search(r'(\d+(?:\.\d+)?)\s*kg/m', text, re.IGNORECASE)
    if match:
        return round(float(match.group(1)) / 1000, 3)

    # Just number
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    if match:
        val = float(match.group(1))
        # Sanity check - density should be reasonable
        if 0.1 < val < 30:
            return val

    return None

def extract_vapor_pressure(text):
    """Extract vapor pressure and convert to mmHg"""

    # mmHg (most common)
    match = re.search(r'(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(?:mm\s*Hg|mmHg|torr)', text, re.IGNORECASE)
    if match:
        return float(match.group(1))

    # Pa -> mmHg (1 Pa = 0.0075006 mmHg)
    match = re.search(r'(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*Pa(?:\s|$|,)', text, re.IGNORECASE)
    if match:
        pa = float(match.group(1))
        return round(pa * 0.0075006, 6)

    # kPa -> mmHg
    match = re.search(r'(\d+(?:\.\d+)?)\s*kPa', text, re.IGNORECASE)
    if match:
        kpa = float(match.group(1))
        return round(kpa * 7.5006, 3)

    # atm -> mmHg (1 atm = 760 mmHg)
    match = re.search(r'(\d+(?:\.\d+)?)\s*atm', text, re.IGNORECASE)
    if match:
        atm = float(match.group(1))
        return round(atm * 760, 3)

    return None

# Test with NaCl
if __name__ == '__main__':
    print("=" * 80)
    print("TESTING EXPERIMENTAL DATA EXTRACTION")
    print("=" * 80)

    # Test compounds with CIDs
    test_cases = [
        (5234, 'NaCl'),
        (253881, 'NaBr'),
        (253877, 'KBr'),
        (82050, 'LiBr'),
    ]

    all_results = []

    for cid, name in test_cases:
        print(f"\n[{name}]")
        props = extract_experimental_data(cid, name)

        result = {'formula': name, 'CID': cid}
        result.update(props)
        all_results.append(result)

        if not props:
            print(f"  ⚠️  No experimental data found")

        time.sleep(0.5)  # Rate limiting

    # Save results
    import pandas as pd
    df = pd.DataFrame(all_results)

    output = '../library/resources/data_sources/PubChem_experimental_test.csv'
    df.to_csv(output, index=False)

    print(f"\n" + "=" * 80)
    print(f"✅ Saved to: {output}")
    print("=" * 80)

    print(f"\n📊 Results:")
    display_cols = ['formula', 'Tm_C_pubchem', 'Tb_C_pubchem', 'density_g_per_cm3_pubchem', 'Td_C_pubchem']
    available = [col for col in display_cols if col in df.columns]
    if available:
        print(df[available].to_string(index=False))

