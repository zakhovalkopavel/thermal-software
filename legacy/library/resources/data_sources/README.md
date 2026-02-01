# 📥 DATA SOURCES & ENRICHMENT PLAN

**Date:** January 28, 2026  
**Purpose:** Download external sources and fill missing properties in database

---

## 🎯 MISSING DATA TO FILL

From our current database (NBS Tables only):

| Property | Current Coverage | Target | Source Needed |
|----------|------------------|--------|---------------|
| **ΔfH (298K)** | 95% | 95% | ✅ Already have (NBS) |
| **Cp (298K)** | 24% | 80% | CRC Handbook, NIST |
| **S° (298K)** | 35% | 70% | CRC Handbook, NIST |
| **Melting Point (Tm)** | 0% | 60% | CRC Handbook |
| **Boiling Point (Tb)** | 0% | 40% | CRC Handbook |
| **Density** | 0% | 60% | CRC Handbook, WebElements |
| **Thermal Conductivity** | 0% | 30% | CRC Handbook |
| **CAS Numbers** | 0% | 90% | PubChem, CAS Registry |
| **Heat of Fusion** | 0% | 40% | CRC Handbook |
| **Heat of Vaporization** | 0% | 40% | CRC Handbook |

---

## 📚 DATA SOURCES TO DOWNLOAD

### Priority 1: CRC Handbook Data (FREE/PUBLIC)

**Source:** CRC Handbook of Chemistry and Physics (97th Edition or newer)

**What to get:**
- Physical Constants of Inorganic Compounds table
- Melting, Boiling, Density data
- Heat of fusion/vaporization

**Format:** Excel/CSV if available, otherwise manual extraction

**Download locations:**
1. Check if available in `library/resources/` already
2. University library databases (if access available)
3. Archive.org (older editions)
4. Purchase latest edition online

**File name:** `CRC_Handbook_Physical_Constants.xlsx` or `.csv`

---

### Priority 2: NIST Chemistry WebBook (FREE)

**Source:** https://webbook.nist.gov/chemistry/

**What to get:**
- Thermochemical data (Cp, S°, ΔfH validation)
- Phase change data (Tm, Tb, Hfus, Hvap)
- Density, thermal properties

**Access:** Free API or manual download

**API Documentation:** https://webbook.nist.gov/chemistry/help/

**Method:**
1. Manual search for top 50 compounds
2. Or use API for bulk download (if available)

**File name:** `NIST_WebBook_Data.csv`

---

### Priority 3: PubChem CAS Numbers (FREE)

**Source:** https://pubchem.ncbi.nlm.nih.gov/

**What to get:**
- CAS Registry Numbers for all compounds
- Molecular weight validation
- Additional identifiers

**Access:** Free REST API

**API Documentation:** https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest

**Method:** Automated bulk download using compound formulas

**File name:** `PubChem_CAS_Numbers.csv`

---

### Priority 4: WebElements (FREE)

**Source:** https://www.webelements.com/

**What to get:**
- Element properties
- Common compound properties
- Density, melting/boiling points

**Access:** Web scraping or manual

**File name:** `WebElements_Data.csv`

---

## 🛠️ HELPER MODULES TO CREATE

### 1. `library/resources/data_sources/` Directory Structure

```
library/resources/data_sources/
├── README.md                           (This file)
├── CRC_Handbook_Physical_Constants.xlsx
├── NIST_WebBook_Data.csv
├── PubChem_CAS_Numbers.csv
├── WebElements_Data.csv
└── manual_data_entry.csv              (For manual additions)
```

---

### 2. `python_scripts/data_enrichment/` Module

Create helper scripts to process external data sources:

```
python_scripts/data_enrichment/
├── __init__.py
├── crc_handbook_parser.py          (Parse CRC data)
├── nist_api_client.py               (Fetch from NIST API)
├── pubchem_api_client.py            (Fetch CAS numbers)
├── data_merger.py                   (Merge all sources)
└── enrichment_validator.py          (Validate merged data)
```

---

### 3. Helper Script: `crc_handbook_parser.py`

```python
"""
Parse CRC Handbook data and extract properties
"""
import pandas as pd

class CRCHandbookParser:
    def __init__(self, crc_file_path):
        self.crc_file = crc_file_path
        
    def load_data(self):
        """Load CRC Handbook Excel/CSV file"""
        if self.crc_file.endswith('.xlsx'):
            df = pd.read_excel(self.crc_file)
        else:
            df = pd.read_csv(self.crc_file)
        return df
    
    def extract_properties(self, df):
        """Extract relevant properties for our compounds"""
        # Map CRC column names to our schema
        column_mapping = {
            'Name': 'compound_name',
            'Formula': 'formula',
            'CAS RN': 'CAS',
            'Mol. Wt.': 'molar_mass_g_per_mol',
            'mp/°C': 'Tm_C',
            'bp/°C': 'Tb_C',
            'Density/g cm⁻³': 'density_g_per_cm3',
            'ΔfusH/kJ mol⁻¹': 'Hfus_kJ_per_mol',
            'ΔvapH/kJ mol⁻¹': 'Hvap_kJ_per_mol',
        }
        
        # Rename columns
        df_mapped = df.rename(columns=column_mapping)
        
        # Select only our columns
        our_cols = [col for col in column_mapping.values() if col in df_mapped.columns]
        df_clean = df_mapped[our_cols]
        
        return df_clean
    
    def parse(self):
        """Complete parsing workflow"""
        df = self.load_data()
        df_props = self.extract_properties(df)
        return df_props
```

---

### 4. Helper Script: `nist_api_client.py`

```python
"""
Fetch thermochemical data from NIST Chemistry WebBook API
"""
import requests
import pandas as pd
import time

class NISTAPIClient:
    BASE_URL = "https://webbook.nist.gov/cgi/cbook.cgi"
    
    def __init__(self):
        self.session = requests.Session()
    
    def search_by_formula(self, formula):
        """Search NIST for a compound by formula"""
        params = {
            'Formula': formula,
            'Units': 'SI',
            'cTG': 'on',  # Thermochemical data
            'cTC': 'on',  # Cp data
        }
        
        try:
            response = self.session.get(self.BASE_URL, params=params)
            if response.status_code == 200:
                return self.parse_response(response.text)
        except Exception as e:
            print(f"Error fetching {formula}: {e}")
        
        return None
    
    def parse_response(self, html):
        """Parse HTML response to extract data"""
        # Simple parsing - in production use BeautifulSoup
        data = {}
        # Extract relevant data from HTML
        # This is a placeholder - actual implementation needs HTML parsing
        return data
    
    def bulk_fetch(self, formulas, delay=1.0):
        """Fetch data for multiple formulas"""
        results = []
        
        for formula in formulas:
            data = self.search_by_formula(formula)
            if data:
                results.append(data)
            time.sleep(delay)  # Be nice to NIST servers
        
        return pd.DataFrame(results)
```

---

### 5. Helper Script: `pubchem_api_client.py`

```python
"""
Fetch CAS numbers and compound info from PubChem API
"""
import requests
import pandas as pd
import time

class PubChemAPIClient:
    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
    
    def get_cas_by_formula(self, formula):
        """Get CAS number for a compound by formula"""
        url = f"{self.BASE_URL}/compound/formula/{formula}/property/IUPACName,MolecularWeight,CAS/JSON"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                properties = data.get('PropertyTable', {}).get('Properties', [])
                if properties:
                    return properties[0]
        except Exception as e:
            print(f"Error fetching {formula}: {e}")
        
        return None
    
    def bulk_fetch_cas(self, formulas, delay=0.5):
        """Fetch CAS numbers for multiple formulas"""
        results = []
        
        for formula in formulas:
            data = self.get_cas_by_formula(formula)
            if data:
                results.append({
                    'formula': formula,
                    'CAS': data.get('CAS'),
                    'molar_mass_pubchem': data.get('MolecularWeight'),
                })
            time.sleep(delay)  # Rate limiting
        
        return pd.DataFrame(results)
```

---

### 6. Helper Script: `data_merger.py`

```python
"""
Merge data from multiple sources into comprehensive database
"""
import pandas as pd

class DataMerger:
    def __init__(self, nbs_file, crc_file=None, nist_file=None, pubchem_file=None):
        self.nbs_df = pd.read_csv(nbs_file)
        self.crc_df = pd.read_csv(crc_file) if crc_file else None
        self.nist_df = pd.read_csv(nist_file) if nist_file else None
        self.pubchem_df = pd.read_csv(pubchem_file) if pubchem_file else None
    
    def merge_all(self):
        """Merge all data sources prioritizing by reliability"""
        df = self.nbs_df.copy()
        
        # Priority: NBS > NIST > CRC > PubChem
        
        # Merge CRC data
        if self.crc_df is not None:
            df = self.merge_crc(df)
        
        # Merge NIST data
        if self.nist_df is not None:
            df = self.merge_nist(df)
        
        # Merge PubChem data
        if self.pubchem_df is not None:
            df = self.merge_pubchem(df)
        
        return df
    
    def merge_crc(self, df):
        """Merge CRC Handbook data"""
        # Fill missing Tm, Tb, density, Hfus, Hvap from CRC
        for col in ['Tm_C', 'Tb_C', 'density_g_per_cm3', 'Hfus_kJ_per_mol', 'Hvap_kJ_per_mol', 'CAS']:
            if col in self.crc_df.columns:
                df[col] = df[col].fillna(
                    df['formula'].map(
                        self.crc_df.set_index('formula')[col]
                    )
                )
        
        return df
    
    def merge_nist(self, df):
        """Merge NIST data"""
        # Fill missing Cp, S° from NIST (higher priority than CRC)
        # But don't override NBS values
        return df
    
    def merge_pubchem(self, df):
        """Merge PubChem data (CAS numbers mainly)"""
        if 'CAS' in self.pubchem_df.columns:
            df['CAS'] = df['CAS'].fillna(
                df['formula'].map(
                    self.pubchem_df.set_index('formula')['CAS']
                )
            )
        
        return df
```

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Download Sources (1-2 hours)

1. ✅ Create `library/resources/data_sources/` directory
2. ⬜ Download CRC Handbook data (if accessible)
3. ⬜ Fetch NIST data for top 50 compounds manually
4. ✅ Use PubChem API to get CAS numbers (automated via API client)
5. ⏳ Create manual_data_entry.csv for remaining gaps (IN PROGRESS)

### Phase 2: Create Helpers (2-3 hours)

1. ✅ Create `python_scripts/data_enrichment/` module
2. ⬜ Implement `crc_handbook_parser.py` (template provided above)
3. ⬜ Implement `nist_api_client.py` (template provided above)
4. ✅ Implement `pubchem_api_client.py` (COMPLETE - production ready)
5. ⬜ Implement `data_merger.py` (template provided above)
6. ⬜ Implement `enrichment_validator.py` (optional)

### Phase 3: Enrich Database (1-2 hours)

1. ⬜ Run CRC parser (when CRC data available)
2. ⬜ Run NIST client (manual data entry recommended)
3. ✅ Run PubChem client (ready via enrich_database.py)
4. ⏳ Merge all sources with priority (enrich_database.py handles this)
5. ⬜ Validate merged data
6. ⏳ Generate enriched CSV files (automated via enrich_database.py)

### Phase 4: Validation (30 min)

1. ⬜ Check coverage improvement
2. ⬜ Spot-check values against sources
3. ⬜ Validate units and conversions
4. ⬜ Update documentation

---

## 🎯 TARGET COVERAGE AFTER ENRICHMENT

| Property | Before | Target After | Improvement |
|----------|--------|--------------|-------------|
| ΔfH (298K) | 95% | 95% | 0% (already good) |
| Cp (298K) | 24% | 80% | +56% |
| S° (298K) | 35% | 70% | +35% |
| Melting Point | 0% | 60% | +60% |
| Boiling Point | 0% | 40% | +40% |
| Density | 0% | 60% | +60% |
| CAS Numbers | 0% | 90% | +90% |
| Heat of Fusion | 0% | 40% | +40% |

---

## 💡 QUICK START OPTION

**If CRC Handbook not available, start with free sources:**

1. **PubChem for CAS numbers** (100% free, easy API)
2. **NIST for top 50 compounds** (100% free, manual)
3. **Manual entry for critical compounds** (our own research)

This alone would give us:
- ✅ 90% CAS number coverage
- ✅ 30-40% melting/boiling point coverage
- ✅ 20-30% additional Cp/S° coverage

**Estimated time:** 3-4 hours total

---

*Data Sources Plan*  
*Created: January 28, 2026*  
*Purpose: Fill missing properties in thermophysical database*  
*Priority: High - Completes specification implementation*

