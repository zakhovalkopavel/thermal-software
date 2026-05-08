# OCR Table Extraction — User Guide

**Last Updated:** May 2026

---

Extract tabular data from PDF and image files using the Python OCR container.

---

## Quick Start

```bash
# Interactive file selection
make ocr-extract

# Generate test images first
make ocr-test

# Enter container
make python-shell
python /app/src/scripts/extract_tables.py --help
```

---

## How It Works

1. **PDF**: Direct extraction via Tabula (no OCR needed for digital PDFs)
2. **Scanned PDF / image**: Tesseract OCR with coordinate-based column detection
3. **Output**: CSV files saved to `shared/processed/`

```bash
# Force OCR method
python /app/src/scripts/extract_tables.py --file scanned.pdf --method ocr

# Custom DPI / language
python /app/src/scripts/extract_tables.py --file doc.pdf --dpi 600 --lang deu
```

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [OCR_SCRIPTS_GUIDE.md](OCR_SCRIPTS_GUIDE.md) | Script parameters, examples, output formats |
| [OCR_QUICK_REFERENCE.md](OCR_QUICK_REFERENCE.md) | Copy-paste commands cheatsheet |
| [OCR_COMMANDS_CLEAN.md](OCR_COMMANDS_CLEAN.md) | Clean command reference |
| [OCR_TEST_GUIDE.md](OCR_TEST_GUIDE.md) | Running and writing OCR tests |
| [OCR_LANGUAGE_SELECTION.md](OCR_LANGUAGE_SELECTION.md) | Tesseract language configuration |
| [OCR_SCIENTIFIC_NOTATION_SUPPORT.md](OCR_SCIENTIFIC_NOTATION_SUPPORT.md) | Handling scientific notation in tables |
| [OCR_AI_MODELS_FOR_LAYOUT.md](OCR_AI_MODELS_FOR_LAYOUT.md) | AI-assisted layout detection |

---

## Source Code

- **Package**: `python/src/ocr/` — modular extraction library
- **Script**: `python/src/scripts/extract_tables.py` — CLI entry point
- **Tests**: `python/tests/ocr/`

See [python/src/ocr/README.md](../../python/src/ocr/README.md) for package architecture.

