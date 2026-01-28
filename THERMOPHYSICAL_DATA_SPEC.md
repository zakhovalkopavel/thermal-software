# Specification: Thermophysical Data Aggregation & Normalization for Selected Ionic Compounds

**Project:** Thermal Software - Thermophysical Data Processing  
**Date Created:** January 27, 2026  
**Version:** 1.0  
**Status:** In Progress - Step 1 Complete

---

## 1) Objective

Create a comprehensive, machine‑readable dataset (final **CSV**) that aggregates and standardizes the following properties for specific families of inorganic compounds derived from the listed cations:

### Properties
- Specific heat capacity (*Cp*)
- Melting point (*T<sub>m</sub>*)
- Decomposition temperature (*T<sub>d</sub>*)
- Boiling point (*T<sub>b</sub>*)

### Compound Families (Anion Classes)
- **Halides**: Chlorides, Fluorides
- **Carbonates**
- **Sulfates**
- **Borates** (including **tetraborates**)
- **Phosphates** (including **metaphosphates**, etc.)
- **Oxides**

### Cations (Elements)
**Na, K, Li, Mg, Ca, Ba, Fe, Zn, Al, Ti, Si, B**

The workflow must proceed in controlled steps, with **user confirmation at each step** (Step 1 → 2 → 3 → 4).

> **Note**: Step 1 must use only data present in the provided input table. Step 3 augments missing values from authoritative references (e.g., NIST).

---

## 2) Inputs

### Primary Input
A user‑provided table (file) containing thermophysical data for some subset of the required compounds and properties.
- The initial extraction (Step 1) **must** use only values already present in this file—no external data yet.
- **Current Input:** `library/NBS_Tables Library.xlsx`

### External References for Step 3 (examples)
- NIST Chemistry WebBook
- CRC Handbook of Chemistry and Physics
- PubChem
- MatWeb (materials data)
- Thermophysical property handbooks
- Peer‑reviewed literature

> During Step 3, each externally sourced value must include a **citation** (source name + URL/DOI if available).

---

## 3) Scope & Compound Enumeration Rules

### Default Scope
Operate on the **set of compounds present in the user input file** for the listed cations × anion families (Step 1).

### Expansion Option
(Requires user confirmation at the Step 2 gate)
- Optionally expand to the **canonical set** of common stoichiometries for each cation × family (e.g., NaCl, MgCl₂, FeCl₂/FeCl₃, TiO₂, Al₂O₃, etc.).
- For chemically **nonexistent or unstable compounds** under standard conditions (e.g., many "aluminum carbonates"), rows can be added but flagged as **"Not stable / no standard data"**; do not impute values.

### Hydration & Polymorphs
- Prefer **anhydrous** compounds and the **most common room‑temperature polymorph**.
- If the input file specifies hydrates or polymorphs, preserve and clearly label them.
- Do **not** merge hydrates with anhydrous entries; treat as separate rows.

### Oxidation States
For multivalent cations (e.g., Fe(II/III), Ti(III/IV)), record the **actual oxidation state** associated with the compound in a dedicated column.

---

## 4) Properties & Units

### 4.1 Specific Heat Capacity (Cp)

**Preferred reported unit:** **J/(kg·K)** at or near **25 °C (298.15 K)**.

**Unit conversions:**
- **If the source provides Cp in J/(mol·K)**, convert to J/(kg·K) using molar mass:
  ```
  Cp,mass [J/(kg·K)] = Cp,molar [J/(mol·K)] / M [kg/mol]
  ```
- **If the source provides Cp in J/(g·K)**, convert by multiplying by 1000.

**Temperature specifications:**
- Record the **reference temperature** and **temperature range** if provided (e.g., 300–600 K)
- Otherwise, assume ~298 K and note any approximation
- If multiple temperature‑dependent Cp values exist, prefer ~298 K and note the temperature

### 4.2 Phase‑Transition Temperatures

**Melting point (T<sub>m</sub>):** Report in **°C** and include a derived **K** column.

**Boiling point (T<sub>b</sub>):** Report in **°C** and include a derived **K** column.

**Decomposition temperature (T<sub>d</sub>):**
- If a compound **decomposes before melting**: populate **T<sub>d</sub>** and set **T<sub>m</sub>** to **blank**; add a note "decomposes before melting."
- If **boiling is not observed** (e.g., decomposition occurs first): leave **T<sub>b</sub>** blank and explain in notes.

**Pressure:** Assume **1 atm** (101.325 kPa) unless the source specifies otherwise; if different, record pressure.

### 4.3 Additional Helper Fields (for transparency)

- **Molar mass (g/mol)**: Derived from the reported formula to enable unit conversions.
- **CAS Number**: If available from sources.
- **Sample form**: anhydrous / hydration level / polymorph.
- **Data quality flag**: A (authoritative primary), B (secondary/reviewed), C (catalog/tertiary).

---

## 5) Data Model (CSV Columns)

### Core Identification
- `cation` (e.g., Na, Mg, Fe)
- `anion_family` (chloride, fluoride, carbonate, sulfate, borate, tetraborate, phosphate, metaphosphate, oxide)
- `compound_name` (human‑readable; e.g., "Sodium chloride")
- `formula` (e.g., NaCl, MgCl2, FeCl3, TiO2, SiO2, B2O3)
- `oxidation_state` (if applicable; e.g., Fe(II), Fe(III))
- `hydration` (e.g., anhydrous, monohydrate)
- `hydration_formula` (e.g., H2O, 2H2O)
- `phase_at_25C` (solid/liquid/gas/amorphous)

### Thermal Properties & Units
- `Cp_mass_J_per_kgK_298K` (preferred primary)
- `Cp_ref_temperature_K` (e.g., 298.15)
- `Cp_molar_J_per_molK_298K` (if sourced; optional)
- `Tm_C` / `Tm_K`
- `Tb_C` / `Tb_K`
- `Td_C` (decomposition onset/peak; note basis in `notes`)

### Provenance & Qualifiers
- `pressure_kPa` (default 101.325 if unspecified)
- `source_Cp` (name + year/version)
- `source_Cp_link` (URL/DOI if available)
- `source_T_transition` (name + year/version)
- `source_T_transition_link` (URL/DOI if available)
- `data_quality` (A/B/C)
- `CAS` (if available)
- `molar_mass_g_per_mol` (derived)
- `notes` (e.g., "decomposes before melting," "value at 300 K," "hydrate form")

### Internal Processing Helpers
(Not mandatory in final CSV, but recommended during curation)
- `conversion_basis` (e.g., "from J/mol·K via molar mass," "as reported in J/g·K × 1000")
- `value_status` (original / converted / estimated) — **no statistical estimation or imputation**, only conversions.

---

## 6) Workflow & Confirmation Gates

> The process has four steps. **At the end of each step, pause and ask the user for confirmation** before proceeding.

### **Step 1 — Ingest & Extract (Input‑Only)** ✅ **COMPLETE**

**Tasks:**
- Import the user's file.
- Filter/reshape to the target schema **without adding any external data**.
- Normalize the identifiers: `cation`, `anion_family`, `formula`, `hydration`, `oxidation_state`.
- Preserve all **existing** values for Cp, Tm, Tb, Td present in the input.

**Output:** Preview CSV conforming to the column schema but populated **only** with input‑provided values.

**Status:** ✅ Completed  
**Output File:** `thermophysical_data_20260127_step1_input_only.csv`  
**Results:** 1153 rows extracted from NBS Tables Library  
**Issues Identified:** Significant number of duplicate entries (polymorphs, different crystalline forms)

**Action Required:** Remove duplicates before proceeding to Step 2

---

### **Step 2 — Add kg‑based Columns** 🔲 **PENDING**

**Tasks:**
- Ensure **Cp in J/(kg·K)** is present for each row:
  - If Cp is already mass‑based in the input, standardize unit labels.
  - If Cp is molar‑based (J/mol·K), compute mass‑based using derived molar mass.
  - Record conversion method in `conversion_basis`.
- Ensure temperature fields have both °C and K representations.

**Output:** Updated CSV with kg‑based Cp and unified temperature units.

**User Confirmation Required:** Before proceeding to Step 3

---

### **Step 3 — Fill Missing Values from Authoritative References** 🔲 **PENDING**

**Tasks:**
- For rows existing in the dataset, attempt to fill missing Cp, Tm, Tb, Td from authoritative sources (e.g., **NIST**), recording **source and link**.
- For compounds known to be **unstable/nonexistent** at standard conditions, leave values **blank** and add explanatory `notes`.
- If the user approved **scope expansion** at the end of Step 2, add standard compounds (canonical stoichiometries) for the specified cations × families; otherwise, do **not** add new rows.

**Output:** Enriched CSV with citations.

**User Confirmation Required:** Before proceeding to Step 4

---

### **Step 4 — Finalize & Deliver** 🔲 **PENDING**

**Tasks:**
- Validate:
  - Unit consistency and correctness of conversions.
  - All sourced values have provenance.
  - Known decomposition precedence is respected (Td vs Tm/Tb).
- Deliverables:
  - **Final CSV** (UTF‑8, comma‑separated, decimal point) named: `thermophysical_data_{YYYYMMDD}.csv`
  - (Optional) A **data dictionary** (Markdown) describing columns and units.

**User Confirmation Required:** Final approval

---

## 7) Data Quality & Rules of Evidence

### Source Hierarchy
(Prefer highest quality first)
1. Primary databases (e.g., NIST Chemistry WebBook), CRC Handbook
2. Peer‑reviewed articles (DOI)
3. Curated material databases (MatWeb), governmental/standard bodies
4. Manufacturer datasheets and catalogs (with caution)

### Conflicts
If multiple credible values differ, prefer values measured at/or near 298 K and 1 atm and provide a brief note describing the discrepancy. Optionally include the range in `notes`.

### Nonexistent or Unstable Compounds
Do not invent values. Leave fields blank and explain in `notes` (e.g., "Hydrolyzes; no stable anhydrous carbonate").

### No Estimation/Imputation
Only unit conversions and exact transcriptions from sources. No model‑based estimates.

---

## 8) Tooling, Reproducibility & File Handling

### Implementation
- Use Python (pandas) to ingest, clean, convert, and export CSV.
- All conversions and derivations are scripted and reproducible.
- Temperature conversions: `K = °C + 273.15`.

### File Format
- CSV, **UTF‑8**, comma as separator, header row included.
- Text fields quoted if needed.

### Versioning
Maintain intermediate versions per step:
- `thermophysical_data_{date}_step1_input_only.csv` ✅
- `thermophysical_data_{date}_step2_with_kg.csv` 🔲
- `thermophysical_data_{date}_step3_enriched.csv` 🔲
- `thermophysical_data_{date}_final.csv` 🔲

---

## 9) Acceptance Criteria

The final CSV contains, for each included compound row:
- **Cp in J/(kg·K)** at or near 298 K (if available in sources).
- **Tm**, **Td**, and **Tb** (as applicable), with correct precedence rules.
- Temperature values in both **°C** and **K** (where applicable).
- **Provenance** for any value not originally in the input file.
- **No imputed values**; only sourced or converted.
- Proper handling of hydrates/polymorphs and oxidation states.
- All unit conversions correct and auditable.

---

## 10) Current Status & Next Actions

### Completed
✅ Step 1: Input data extracted from NBS Tables Library  
✅ Specification document created  

### Current Issues
⚠️ **Duplicates detected:** 1153 rows contain many duplicate compound entries due to:
- Different polymorphs (e.g., SiO2: quartz variants, anatase/rutile/brookite for TiO2)
- Different crystalline forms (macrocrystal vs microcrystal)
- Missing compound names for some entries
- Multiple measurements of the same compound

### Immediate Next Actions
1. **Remove duplicates** from Step 1 CSV using intelligent deduplication:
   - Preserve entries with complete data (non-null Cp values)
   - For polymorphs, keep all distinct forms with compound_name specified
   - Merge truly duplicate entries (same formula, hydration, phase, and name)
   
2. **Create deduplication strategy:**
   - Priority 1: Keep entries with compound_name (polymorphs)
   - Priority 2: Keep entries with Cp data
   - Priority 3: For exact duplicates, keep first occurrence

3. **Save cleaned Step 1 output**

4. **Request user confirmation** to proceed to Step 2

---

## 11) Decision Points for User Confirmation

### Scope Decisions
1. **Scope expansion**: Proceed only with compounds present in NBS input, or expand to canonical compounds per cation × family?
   - **Current:** Using NBS input only
   - **Decision needed before Step 3**

2. **Cp reference temperature**: Prefer precisely 298.15 K where available; otherwise accept nearest reported T?
   - **Current:** Using 298.15 K from NBS Tables
   - **Confirmed**

3. **Temperature units in final CSV**: Include both °C and K columns?
   - **Current:** Planning to include both
   - **Confirmed**

4. **Hydrates**: Include them only if present in input / encountered in sources, keeping them separate from anhydrous?
   - **Current:** Keeping separate as per spec
   - **Confirmed**

5. **Conflicting values**: If sources disagree, include the most authoritative value and capture the alternative in `notes`?
   - **Current:** Following this approach
   - **Confirmed**

6. **Polymorph handling**: Keep all distinct polymorphs or select most common?
   - **Needs decision**
   - **Recommendation:** Keep all labeled polymorphs, remove unlabeled duplicates

---

## File References

- **Specification:** `THERMOPHYSICAL_DATA_SPEC.md` (this file)
- **Processing Script:** `scripts/thermophysical_data_processor.py`
- **Input Data:** `library/NBS_Tables Library.xlsx`
- **Step 1 Output:** `thermophysical_data_20260127_step1_input_only.csv`
- **Progress Notes:** To be maintained in `THERMOPHYSICAL_DATA_NOTES.md`

---

*End of Specification Document*

