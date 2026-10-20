# Scripts Documentation

This directory contains documentation for Python processing scripts.

---

## 🔬 NASA Thermodynamic Parser

### [NASA_THERMO_PARSER_SPEC.md](NASA_THERMO_PARSER_SPEC.md)
**Specification for the NASA thermodynamic database parser**
- Converts NASA-7 (SP-273/1971) and NASA-9 (RP-1311/1996, Burcat ANL-05/20) to JSON
- Each species carries its element counts (`elements`) from the formula slots; NASA-9 `Hf298` from line 2
- Package: `python/src/nasa_thermo/` — parsers, models, writers
- CLI: `python/src/scripts/parse_nasa_thermo.py`
- Make commands: `make nasa-parse`, `make nasa-test`
- Source files: `shared/sources/NASA/`
- Output: `shared/processed/nasa7.json`, `shared/processed/nasa9.json`

---

## 🔬 JANAF Parser

### [JANAF_PARSER_SPEC.md](JANAF_PARSER_SPEC.md)
**Specification for the NIST-JANAF table parser**
- Converts the NIST-JANAF tables (py-janaf copy) to JSON, one file per compound, in the compound-data layout (class and organic family from the compound-data record, inorganic by main element)
- Package: `python/src/janaf/` — parsers, models, file layout, writers (shares `dataset_layout/` with compound data)
- CLI: `python/src/scripts/parse_janaf.py`
- Make commands: `make janaf-parse` (after `make compound-data-build`; clears the output folder first), `make janaf-test`
- Source files: `shared/sources/compound-data/nist-janaf/`
- Output: `shared/processed/JANAF/inorganic/<Element>/<IUPAC formula>-<name>.json`, `organic/<family>/<Hill>-<name>.json` + `index.json` + `units.json` + `sources.json` (refs `[RefKey, line, tableId]` resolve through `sources.json`)

---

## 🔬 Compound Data (CalebBell/chemicals)

### [COMPOUND_DATA_SPEC.md](COMPOUND_DATA_SPEC.md)
**Specification for the merged compound dataset**
- Merges the CRC, Perry, Poling, Yaws, TRC, Zabransky, WebBook Shomate and VDI PPDS tables from CalebBell/chemicals by CAS
- Coefficients are stored as ready-to-use backend `EquationValue` entries (all types are implemented in `EquationTypeDto`)
- Inorganic compounds are grouped by main element (metal, else least electronegative; Al₂O₃ → Al, TiO₂ → Ti, NH₃ → N), one file per formula, named with the IUPAC formula (TiF4, ZnB4O9; `hill` stays the lookup key); organic compounds by RDKit family, one file per compound
- A carbon compound is organic when it has a C–H or C–halogen bond (RDKit; without a metal also C–C, C–NH or a carbon ring), with a few CAS overrides (HCN inorganic) and a formula fallback; organic compounds without a SMILES get the family their formula fixes (halocarbons, alkanes)
- Values cite their source row as `ref: [RefKey, line, fileKey]`; units are in `units.json`, the JSON format in the backend interfaces (`backend/src/common/thermal/utils/compound-data/`)
- NIST-JANAF table ids are attached per record (by CAS from the chemicals JANAF index, else by Hill formula)
- NASA-7 / NASA-9 species keys are attached per record (Hill formula, name suffix, ΔfH°(298.15) check); Lennard-Jones σ and ε/k from the Poling and Magalhães tables
- Packages: `python/src/chemical_formula/`, `chemicals_tables/` (table parsers), `pubchem/` (PubChem client and per-class files), `dataset_layout/` (file names, output clearing), `compound_data/` (merge and output)
- CLI: `python/src/scripts/build_compound_data.py`, `python/src/scripts/fetch_pubchem_identifiers.py`
- Make commands: `make compound-data-build` (step 1, offline, also writes `missing-cas.txt`), `make compound-data-pubchem` (step 2: PubChem identifiers of the missing CAS numbers and CAS of the records without one, slow and resumable), `make compound-data-test`
- Source files: `shared/sources/compound-data/chemicals/` (https://github.com/CalebBell/chemicals, pinned commit), `shared/sources/compound-data/nist-janaf/`, `shared/sources/NASA/` (NASA-7 / NASA-9 keys, checked by ΔfH°), the PubChem files `shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl` and `shared/sources/transport-parameters.json` (White, NASA TN D-481, Mamedov 2014, Svehla 1995)
- Output: `shared/processed/compound-data/inorganic/<Element>/<IUPAC formula>-<name>.json`, `organic/<family>/<Hill>-<name>.json`, `unresolved.json`, `index.json`, `units.json`, `sources.json` + `interactions.json` (cleared before writing)
- Report: `tmp/reports/python/compound-data/report.json`

### [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md)
**Specification for the PubChem fetch (compound data step 2) and on-demand PubChem searches**
- Looks up in PubChem the CAS numbers the chemicals identifier files miss and searches the compound-data records without a CAS by formula: the PUG REST `PUBCHEM_PROPERTIES` fields, the PUG View "Experimental Properties" of every CID (melting / boiling point, density, solubility …) and, for a formula search, the CAS of the found compound
- On demand: `make pubchem-search Q="CaAl2O4"` (formula, name or CAS; `PubchemSearcher` from Python), `make pd-new … PUBCHEM=1` for the components of a new phase diagram, `make pubchem-search QUERY_FILE=shared/sources/pubchem-queries.txt` for the 551 formulas without a compound-data record
- Polite and resumable: spacing by the `X-Throttling-Control` status, pauses when PubChem is busy or overloaded, stops when it blocks the client; every query is appended as soon as it is done
- Package: `python/src/pubchem/`; CLI: `python/src/scripts/fetch_pubchem_identifiers.py` (`--class`, `--all-cas`, `--no-formulas`, `--retry`, `--no-experimental`, pacing options), `python/src/scripts/pubchem_search.py`
- Make commands: `make compound-data-pubchem PUBCHEM_ARGS="…"`, `make pubchem-search Q="…"`
- Output: `shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl`, one JSON line per query (CAS, `formula:<Hill>`, `name:<name>`) with the full answers

---

## 📈 Phase-Diagram Extraction

### [phase-diagrams/](phase-diagrams/README.md)
**Specification for extracting phase-diagram data from the Slag Atlas and NSRDS-NBS 61**
- Split by topic: [overview](phase-diagrams/README.md), [layout](phase-diagrams/LAYOUT.md), [workflow](phase-diagrams/WORKFLOW.md), [config](phase-diagrams/CONFIG.md), [algorithms](phase-diagrams/ALGORITHMS.md), [fully automatic extraction](phase-diagrams/AUTOMATIC.md), [NSRDS-NBS 61](phase-diagrams/NBS.md), [output and validation](phase-diagrams/OUTPUT.md), [CLI, make and tests](phase-diagrams/CLI.md)
- Per-diagram config is the source of truth; binary system files regenerated, ternary curves filled in place
- Package: `python/src/phase_diagrams/` — calibration, tracing, NBS matching, validation
- CLI: `python/src/scripts/extract_phase_diagram.py`
- Make commands: `make pd-extract SYSTEM=...`, `make pd-validate`, `make pd-test`
- Source files: `shared/sources/` (atlas and NBS PDFs)
- Output: `shared/processed/phase-diagrams/`; working files in `tmp/reports/python/phase-diagrams/`

---

## 📚 OCR Extraction

### [OCR_SCRIPTS_GUIDE.md](OCR_SCRIPTS_GUIDE.md)
**Complete guide to OCR extraction scripts**
- Interactive vs Auto modes
- Usage examples
- Output format
- Troubleshooting

**Start here for:** How to use the scripts

---

### [OCR_COMMANDS_CLEAN.md](OCR_COMMANDS_CLEAN.md)
**Clean command reference**
- Main commands (only 2!)
- Comparison table
- Quick start guide

**Start here for:** Quick command reference

---

### [OCR_QUICK_REFERENCE.md](OCR_QUICK_REFERENCE.md)
**Quick reference card**
- Keyboard shortcuts
- Mouse controls  
- Button functions
- Common workflows

**Start here for:** Interactive mode controls

---

## 🔬 Technical Documentation

### [OCR_SCIENTIFIC_NOTATION_SUPPORT.md](OCR_SCIENTIFIC_NOTATION_SUPPORT.md)
**Scientific notation processing**
- Chemical formulas (Na₂O, Al₂O₃)
- Greek letters (η, σ, Δ)
- Special characters (°C, ±)
- How it works

**Start here for:** Understanding scientific text processing

---

### [OCR_TEST_GUIDE.md](OCR_TEST_GUIDE.md)
**Testing and validation**
- Available tests
- How to run tests
- What to check
- Troubleshooting

**Start here for:** Running tests

---

### [OCR_AI_MODELS_FOR_LAYOUT.md](OCR_AI_MODELS_FOR_LAYOUT.md)
**Future: AI-based layout detection**
- Possible AI models
- Pros/cons
- Implementation ideas

**Start here for:** Future improvements

---

## 🗂️ File Organization

```
docs/scripts/
├── OCR_SCRIPTS_GUIDE.md              # Main guide (start here!)
├── OCR_COMMANDS_CLEAN.md             # Command reference
├── OCR_QUICK_REFERENCE.md            # Controls cheat sheet
├── OCR_SCIENTIFIC_NOTATION_SUPPORT.md # Technical: notation processing
├── OCR_TEST_GUIDE.md                 # Technical: testing
├── OCR_AI_MODELS_FOR_LAYOUT.md       # Future: AI models
└── README.md                         # This file
```

**Historical documentation:** `tmp/reports/python/historical_docs/`
- Implementation details
- Fix summaries
- Old specs

---

## 🚀 Quick Start

**1. Interactive extraction (recommended):**
```bash
make ocr-extract-interactive
```

**2. Automatic extraction:**
```bash
make ocr-extract-auto FILE="document.pdf"
```

**3. See guides for details:**
- [OCR_SCRIPTS_GUIDE.md](OCR_SCRIPTS_GUIDE.md) - Complete usage guide
- [OCR_QUICK_REFERENCE.md](OCR_QUICK_REFERENCE.md) - Controls reference

---

## 📊 Document Status

**Active (Keep Updated):**
- ✅ OCR_SCRIPTS_GUIDE.md
- ✅ OCR_COMMANDS_CLEAN.md
- ✅ OCR_QUICK_REFERENCE.md
- ✅ OCR_SCIENTIFIC_NOTATION_SUPPORT.md
- ✅ OCR_TEST_GUIDE.md
- ✅ OCR_AI_MODELS_FOR_LAYOUT.md

**Historical (Reference Only):**
- 📁 tmp/reports/python/historical_docs/
  - Implementation specs (now implemented)
  - Fix summaries (now complete)
  - Detailed change logs

---

## 🔗 Related Documentation

**Python OCR Modules:**
- `python/src/ocr/README.md` - Core module documentation

**Algorithm Details:**
- `docs/algorithms/` - Detailed algorithm specifications

**Project Documentation:**
- `README.md` - Main project README
- `QUICKSTART.md` - Quick start guide

