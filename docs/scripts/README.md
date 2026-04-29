# Scripts Documentation

This directory contains documentation for Python processing scripts.

---

## 🔬 NASA Thermodynamic Parser

### [NASA_THERMO_PARSER_SPEC.md](NASA_THERMO_PARSER_SPEC.md)
**Specification for the NASA thermodynamic database parser**
- Converts NASA-7 (SP-273/1971) and NASA-9 (RP-1311/1996, Burcat ANL-05/20) to JSON
- Package: `python/src/nasa_thermo/` — parsers, models, writers
- CLI: `python/src/scripts/parse_nasa_thermo.py`
- Make commands: `make nasa-parse`, `make nasa-test`
- Source files: `shared/sources/NASA/`
- Output: `shared/processed/nasa7.json`, `shared/processed/nasa9.json`

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

