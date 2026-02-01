# Thermophysical Data Dictionary

**Database:** Ionic Compounds Thermophysical Properties  
**Version:** 1.0 Final  
**Date:** January 28, 2026  
**Total Compounds:** ~900 (~600 anhydrous + ~300 hydrates)  
**Total Columns:** 55

---

## Quick Reference

**Database Files:**
- `thermophysical_anhydrous.csv` - Anhydrous compounds
- `thermophysical_hydrates.csv` - Hydrated compounds

**Column Groups:**
1. Identification (9 columns)
2. NBS Thermodynamic Data (8 columns)
3. Temperature Data (5 columns)
4. Heat of Transition (3 columns)
5. Physical Properties (4 columns)
6. Stability (3 columns)
7. Cp(T) Equations (6 columns)
8. Provenance (7 columns)
9. PubChem Data (12 columns - NEW)

---

## Column Descriptions

### 1. Identification Columns (9 columns)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `cation` | string | Primary cation element symbol | Na, K, Ca, Al, Cu |
| `anion_family` | string | Anion family classification | oxide, chloride, sulfate, phosphate |
| `compound_name` | string | IUPAC or common name | Silicon dioxide, Sodium chloride, Quartz |
| `formula` | string | Chemical formula | SiO2, NaCl, CaCO3, Al2O3 |
| `base_formula` | string | Formula without hydration | CuSO4 (for CuSO4·5H2O) |
| `hydration` | string | Hydration state | anhydrous, hydrated |
| `hydration_formula` | string | Water portion only | 5H2O, H2O |
| `phase_at_25C` | string | Physical state at 25°C | solid, liquid, amorphous |
| `state_description` | string | Additional state info | crystalline, α quartz, rutile |

### 2. NBS Thermodynamic Data (8 columns)

All thermodynamic data at standard conditions: **298.15 K (25°C), 101.325 kPa (1 atm)**

| Column | Type | Units | Description | Coverage |
|--------|------|-------|-------------|----------|
| `molar_mass_g_per_mol` | float | g/mol | Molecular weight | 100% |
| `DfH0_kJ_per_mol` | float | kJ/mol | Formation enthalpy at 0 K | ~40% |
| `DfH_298K_kJ_per_mol` | float | kJ/mol | Formation enthalpy at 298 K | ~95% |
| `DfG_298K_kJ_per_mol` | float | kJ/mol | Formation Gibbs energy at 298 K | ~35% |
| `H_H0_298K_kJ_per_mol` | float | kJ/mol | Enthalpy increment (H₂₉₈ - H₀) | ~15% |
| `S_298K_J_per_molK` | float | J/(mol·K) | Standard entropy at 298 K | ~35% |
| `Cp_298K_J_per_molK` | float | J/(mol·K) | Heat capacity (molar basis) | ~25% |
| `Cp_mass_J_per_kgK_298K` | float | J/(kg·K) | Heat capacity (mass basis) | ~25% |

**Note:** Cp_mass calculated as: Cp_molar / (molar_mass / 1000)

### 3. Temperature Data (5 columns)

| Column | Type | Units | Description | Source |
|--------|------|-------|-------------|--------|
| `Tm_C` | float | °C | Melting point (Celsius) | NBS, CRC, PubChem |
| `Tm_K` | float | K | Melting point (Kelvin) | Calculated from Tm_C |
| `Tb_C` | float | °C | Boiling point (Celsius) | NBS, CRC, PubChem |
| `Tb_K` | float | K | Boiling point (Kelvin) | Calculated from Tb_C |
| `Td_C` | float | °C | Decomposition temperature | Manual, PubChem |

**Conversion:** Tm_K = Tm_C + 273.15

### 4. Heat of Transition (3 columns)

| Column | Type | Units | Description | Source |
|--------|------|-------|-------------|--------|
| `Hfus_kJ_per_mol` | float | kJ/mol | Heat of fusion (melting) | Manual entry |
| `Hvap_kJ_per_mol` | float | kJ/mol | Heat of vaporization (boiling) | Manual entry |
| `Hsub_kJ_per_mol` | float | kJ/mol | Heat of sublimation | Manual entry |

### 5. Physical Properties (4 columns)

| Column | Type | Units | Description | Source |
|--------|------|-------|-------------|--------|
| `density_g_per_cm3` | float | g/cm³ | Density at 20-25°C | Manual, PubChem |
| `thermal_conductivity_W_per_mK` | float | W/(m·K) | Thermal conductivity | Manual entry |
| `viscosity_mPa_s` | float | mPa·s | Dynamic viscosity | Manual entry |
| `hardness_Mohs` | float | - | Mohs hardness scale | Manual entry |

### 6. Stability Data (3 columns)

| Column | Type | Units | Description |
|--------|------|-------|-------------|
| `stability_range_C_min` | float | °C | Minimum stable temperature |
| `stability_range_C_max` | float | °C | Maximum stable temperature |
| `decomposition_products` | string | - | Products of thermal decomposition |

### 7. Cp(T) Temperature Equations (6 columns)

Heat capacity as function of temperature: Cp(T) = a + bT + cT²

| Column | Type | Units | Description |
|--------|------|-------|-------------|
| `Cp_equation_type` | string | - | Equation form (e.g., "polynomial") |
| `Cp_coeff_a` | float | - | Coefficient a |
| `Cp_coeff_b` | float | - | Coefficient b |
| `Cp_coeff_c` | float | - | Coefficient c |
| `Cp_temp_range_K_min` | float | K | Min temperature for equation validity |
| `Cp_temp_range_K_max` | float | K | Max temperature for equation validity |

### 8. Provenance & Metadata (7 columns)

| Column | Type | Description |
|--------|------|-------------|
| `pressure_kPa` | float | Measurement pressure (typically 101.325 kPa) |
| `source_thermodynamic` | string | Source for thermodynamic data (e.g., "NBS Tables") |
| `source_physical_properties` | string | Source for physical properties |
| `source_transition_temps` | string | Source for temperature data |
| `data_quality` | string | Quality grade: A (primary), B (secondary), C (tertiary) |
| `CAS` | string | CAS Registry Number (format: XXXXX-XX-X) |
| `notes` | string | Additional notes, warnings, or clarifications |

### 9. PubChem Data (12 columns) - NEW ✨

**Numerical Properties:**

| Column | Type | Units | Description |
|--------|------|-------|-------------|
| `CID_pubchem` | integer | - | PubChem Compound ID |
| `Tm_C_pubchem` | float | °C | Melting point from PubChem |
| `Tb_C_pubchem` | float | °C | Boiling point from PubChem |
| `Td_C_pubchem` | float | °C | Decomposition temperature from PubChem |
| `density_pubchem` | float | g/cm³ | Density from PubChem |
| `flash_point_C` | float | °C | Flash point |
| `vapor_pressure_mmHg` | float | mmHg | Vapor pressure at specified temp |

**Text Properties (Separate Columns):**

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `color` | string | Physical appearance/color | "White crystalline solid", "Colorless liquid" |
| `odor` | string | Odor/smell description | "Odorless", "Pungent" |
| `solubility` | string | Solubility information | "Soluble in water", "Insoluble in ethanol" |
| `stability` | string | Stability conditions | "Stable under normal conditions", "Decomposes on heating" |
| `toxicity_hazard` | string | Safety/toxicity info | "Corrosive", "Irritant to eyes and skin" |

**Important:** Color, solubility, and stability are in **SEPARATE columns** - they are NOT combined.

---

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text data | "NaCl", "oxide", "white powder" |
| `float` | Numerical (decimal) | 801.0, 2.165, -411.15 |
| `integer` | Whole number | 24816 (for CID) |
| `boolean` | True/False | Currently not used |

**Missing Values:** Represented as empty cells or NaN in CSV files

---

## Data Sources & Quality

### Primary Sources (Grade A)

1. **NBS Tables of Chemical Thermodynamic Properties (1982)**
   - Thermodynamic properties (ΔfH, ΔfG, S°, Cp)
   - Highest quality, peer-reviewed data
   - Coverage: ~95% for formation enthalpy

2. **CRC Handbook of Chemistry and Physics, 97th Edition (2016)**
   - Physical properties, transition temperatures
   - Authoritative reference work
   - Coverage: Selected compounds

3. **PubChem (National Library of Medicine)**
   - CAS numbers, experimental properties
   - Text descriptions (color, solubility, stability)
   - Coverage: ~143 compounds with data

### Data Quality Grades

- **Grade A**: Primary authoritative sources (NBS, CRC)
- **Grade B**: Secondary peer-reviewed sources
- **Grade C**: Tertiary sources or estimates

---

## Usage Examples

### Load Data
```python
import pandas as pd

# Load anhydrous compounds
df_anh = pd.read_csv('thermophysical_anhydrous.csv')

# Load hydrates
df_hyd = pd.read_csv('thermophysical_hydrates.csv')
```

### Access Specific Properties
```python
# Get all properties for NaCl
nacl = df_anh[df_anh['formula'] == 'NaCl'].iloc[0]

print(f"Formula: {nacl['formula']}")
print(f"Melting point: {nacl['Tm_C']}°C")
print(f"Formation enthalpy: {nacl['DfH_298K_kJ_per_mol']} kJ/mol")
print(f"Color: {nacl['color']}")
print(f"Solubility: {nacl['solubility']}")
```

### Filter by Properties
```python
# Find all oxides with high melting points
high_mp_oxides = df_anh[
    (df_anh['anion_family'] == 'oxide') & 
    (df_anh['Tm_C'] > 2000)
]

# Find compounds with color data
colored = df_anh[df_anh['color'].notna()]

# Find all copper compounds
copper = df_anh[df_anh['cation'] == 'Cu']
```

### Statistical Analysis
```python
# Average melting point by anion family
avg_mp = df_anh.groupby('anion_family')['Tm_C'].mean()

# Count compounds by cation
compound_count = df_anh['cation'].value_counts()

# Coverage statistics
coverage = {
    'CAS': df_anh['CAS'].notna().sum(),
    'Melting Point': df_anh['Tm_C'].notna().sum(),
    'Color': df_anh['color'].notna().sum(),
    'Solubility': df_anh['solubility'].notna().sum()
}
```

---

## Important Notes

1. **Standard Conditions**: All thermodynamic data at 298.15 K (25°C), 101.325 kPa
2. **Missing Data**: NULL/NaN indicates no data available from any source
3. **Polymorphs**: Multiple rows for same formula may represent different crystal structures
4. **Temperature Conversions**: Kelvin temperatures calculated as: T_K = T_C + 273.15
5. **Text Properties**: Descriptive text from PubChem - not suitable for numerical calculations
6. **Data Merging**: Temperature and density data merged from multiple sources (NBS takes priority)

---

## Column Count Summary

| Group | Columns | Description |
|-------|---------|-------------|
| Identification | 9 | Formula, cation, anion, name, state |
| NBS Thermodynamic | 8 | Formation enthalpy, Gibbs, entropy, Cp |
| Temperature | 5 | Melting, boiling, decomposition points |
| Heat of Transition | 3 | Fusion, vaporization, sublimation |
| Physical Properties | 4 | Density, conductivity, viscosity, hardness |
| Stability | 3 | Temperature range, decomposition |
| Cp(T) Equations | 6 | Temperature-dependent heat capacity |
| Provenance | 7 | Sources, quality, CAS, notes |
| PubChem | 12 | CID, temps, text properties |
| **TOTAL** | **55** | Complete property set |

---

## Support

- **Questions**: See README.md in this directory
- **Updates**: Contact database maintainers
- **Issues**: Check data_quality column for known limitations
- **Citations**: See README.md for proper citation format

---

**Last Updated:** January 28, 2026  
**Maintained By:** Thermal Software Project

